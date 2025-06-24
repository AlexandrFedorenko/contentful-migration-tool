# Contentful Migration Tool - Docker инструкции

## Быстрый запуск

### Режим разработки с watch:
```bash
npm run docker:dev:watch
```

### Обычная разработка:
```bash
npm run docker:dev
```

### Production:
```bash
npm run docker:start
```

### Остановка:
```bash
npm run docker:stop
```

## Все доступные команды:

```bash
# Разработка с watch режимом (рекомендуется)
npm run docker:dev:watch

# Обычная разработка
npm run docker:dev

# Сборка и запуск в режиме разработки
npm run docker:dev:build

# Production запуск
npm run docker:start

# Остановка контейнеров
npm run docker:stop

# Просмотр логов
npm run docker:logs

# Очистка контейнеров и volumes
npm run docker:clean

# Перезапуск контейнеров
npm run docker:restart

# Сборка production образа
npm run docker:build
```

## Что было исправлено:

1. **Удалена ссылка на несуществующий pythonserver** в `next.config.mjs`
2. **Создан отдельный Dockerfile.dev** для режима разработки
3. **Настроен watch режим** с поддержкой `WATCHPACK_POLLING` и `CHOKIDAR_USEPOLLING`
4. **Добавлены volume монтирования** для hot reload
5. **Убраны все shell скрипты** - теперь используются только npm команды
6. **Добавлены дополнительные команды** для управления Docker

## Структура файлов:

- `Dockerfile` - для production сборки
- `Dockerfile.dev` - для разработки с watch режимом
- `docker-compose.yml` - production конфигурация
- `docker-compose.dev.yml` - development конфигурация с watch
- `package.json` - все команды для управления Docker

## Приложение будет доступно по адресу:
http://localhost:3000

## Особенности watch режима:

- Автоматическая перезагрузка при изменении файлов
- Поддержка TypeScript
- Hot reload для React компонентов
- Монтирование всех необходимых директорий
- Оптимизированная сборка для разработки

## Рекомендуемый рабочий процесс:

1. Запустите: `npm run docker:dev:watch`
2. Откройте http://localhost:3000
3. Редактируйте файлы в `src/` - изменения будут автоматически отображаться
4. Для остановки нажмите `Ctrl+C` в терминале 