# Развёртывание на сервере

Инструкция для одного Linux-сервера (VPS или выделенный). Весь стек поднимается одной командой Docker Compose, HTTPS-сертификат выпускается автоматически.

```
Интернет ──443──▶ Caddy (TLS) ──▶ web (Next.js) ──▶ PostgreSQL
                                     │   ▲            Redis (очередь, лимиты, события)
                                     ▼   │
                                   worker (фоновые задачи) ──▶ Contentful API
                        общий том /data: бэкапы, архивы ассетов, загрузки
```

| Сервис | Назначение |
|---|---|
| `caddy` | HTTPS (Let's Encrypt), HTTP/3, сжатие, проксирование SSE без буферизации |
| `web` | UI и API. Ничего не хранит локально, кроме общего тома `/data` |
| `worker` | Выполняет бэкапы, восстановления и миграции. При деплое дожидается завершения текущих задач (до 10 минут) |
| `migrate` | Применяет миграции БД перед стартом `web` и `worker`, затем завершается |
| `postgres` | Пользователи, сессии, метаданные бэкапов, история задач, логи |
| `redis` | Очередь задач (BullMQ), поток событий задач, rate limiting, блокировки окружений |
| `db-backup` | Ежедневный `pg_dump` в `deploy/backups/`, хранится 14 дней |

## 1. Требования

- Linux x86_64, минимум 2 vCPU и 4 GB RAM (рекомендуется 4 vCPU и 8 GB при нескольких параллельных миграциях).
- Docker Engine 24+ с плагином Compose.
- Домен с A/AAAA-записью на IP сервера, открытые порты 80 и 443.

## 2. Приложение OAuth в Contentful

Нужно для кнопки «Continue with Contentful».

1. Contentful → **Organization settings → OAuth applications → Create application**.
2. **Redirect URI**: `https://<ваш-домен>/auth/callback`.
3. **Scopes**: включите **Manage** (`content_management_manage`).
4. Сохраните **Client ID**, он понадобится в `.env.production`.

Без OAuth-приложения можно входить по personal access token (`ALLOW_TOKEN_LOGIN=true`).

## 3. Конфигурация

```bash
git clone <repo> contentful-migration-tool && cd contentful-migration-tool
cp .env.example .env.production
```

Заполните в `.env.production`:

| Переменная | Значение |
|---|---|
| `APP_URL` | `https://<ваш-домен>` |
| `DOMAIN`, `ACME_EMAIL` | домен и email для Let's Encrypt |
| `POSTGRES_PASSWORD`, `REDIS_PASSWORD` | `openssl rand -hex 24` |
| `ENCRYPTION_KEY` | `openssl rand -base64 32`. Храните в менеджере паролей: без него сохранённые токены не расшифровать |
| `CONTENTFUL_OAUTH_CLIENT_ID` | из шага 2 |
| `BOOTSTRAP_ADMIN_EMAILS` | email администратора(ов) Contentful-аккаунта |

`DATABASE_URL`, `REDIS_URL`, `DATA_DIR` и `TRUST_PROXY_HOPS` для продакшена задаёт `docker-compose.prod.yml`, в `.env.production` их указывать не нужно.

```bash
chmod 600 .env.production
```

## 4. Запуск

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production ps
```

Откройте `https://<ваш-домен>`, войдите через Contentful. Email из `BOOTSTRAP_ADMIN_EMAILS` получит роль администратора.

Проверка здоровья: `curl https://<ваш-домен>/api/health` → `{"ok":true}`.

## 5. Обновление

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Порядок старта гарантирован: `migrate` применяет миграции, затем стартуют `web` и `worker`. Worker при остановке дожидается текущих задач (`stop_grace_period: 10m`). Задача, прерванная аварийно, помечается как `FAILED` и не перезапускается автоматически: перед каждой изменяющей операцией создаётся страховочный бэкап целевого окружения, из которого можно восстановиться.

## 6. Резервные копии и восстановление

- **База данных**: `deploy/backups/db-*.dump` (ежедневно, 14 дней). Копируйте каталог во внешнее хранилище (S3, rsync).
- **Файлы** (бэкапы Contentful, архивы ассетов): том `app-data`.

```bash
# восстановление БД из дампа
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  pg_restore --clean --if-exists -U "$POSTGRES_USER" -d "$POSTGRES_DB" < deploy/backups/db-XXXX.dump

# архив тома с файлами
docker run --rm -v contentful-migration-tool_app-data:/data -v "$PWD":/out alpine tar czf /out/app-data.tgz -C /data .
```

## 7. Масштабирование

- **Больше параллельных задач**: увеличьте `WORKER_CONCURRENCY` или запустите несколько воркеров: `docker compose ... up -d --scale worker=3`. Очередь и блокировки общие (Redis), одна задача никогда не выполняется дважды.
- **Лимит Contentful API** считается в Redis на пространство и общий для всех воркеров (`CMA_RATE_LIMIT_RPS`, по умолчанию 6 rps при лимите Contentful около 7). Для enterprise-планов с повышенными лимитами значение можно увеличить.
- **Web** не хранит состояние: при нескольких серверах вынесите Postgres и Redis в управляемые сервисы, а `/data` на общее хранилище (NFS/EFS).

## 8. Ротация ключа шифрования

1. Сгенерируйте новый ключ. Старый укажите в `ENCRYPTION_KEY_PREVIOUS`, новый в `ENCRYPTION_KEY`, перезапустите стек.
2. Перешифруйте токены:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production run --rm worker node /app/dist/rotate-secrets.js
   ```
3. Удалите `ENCRYPTION_KEY_PREVIOUS` и перезапустите.

## 9. Переход с версии на Clerk

1. В `.env.production` укажите `LEGACY_ENCRYPTION_SECRET=<старый CLERK_SECRET_KEY>`.
2. Запустите стек: миграция БД перенесёт токены и роли.
3. Перешифруйте токены командой из раздела 8, затем удалите `LEGACY_ENCRYPTION_SECRET`.
4. Пользователи входят через Contentful. Существующий аккаунт связывается по email автоматически.
5. Старые бэкапы, хранившиеся в БД, продолжают открываться, новые пишутся в `/data`.

## 10. Безопасность: чеклист

- [ ] `.env.production` с правами `600`, не в git.
- [ ] Открыты только порты 22, 80 и 443 (`ufw allow 22,80,443/tcp`). Postgres и Redis наружу не публикуются.
- [ ] Доступ по SSH только по ключам.
- [ ] Каталог `deploy/backups` копируется за пределы сервера.
- [ ] Включены автоматические обновления безопасности ОС (`unattended-upgrades`).
- [ ] `docker compose pull` и пересборка образа раз в месяц, чтобы получать обновлённые базовые образы.

## Локальная разработка

```bash
cp .env.example .env            # ENCRYPTION_KEY: openssl rand -base64 32
docker compose up -d            # Postgres и Redis на 127.0.0.1
npm ci && npx prisma migrate deploy
npm run dev                     # http://localhost:3000
npm run worker:dev              # фоновые задачи
```

Без `REDIS_URL` задачи выполняются прямо в процессе `next dev`. Это удобно для отладки, но в продакшене Redis обязателен.
