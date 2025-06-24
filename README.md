docker-compose up --build
# Contentful Migration Tool

Инструмент для создания бэкапов и миграции контента между окружениями Contentful.

## Возможности

- Авторизация в Contentful через браузер
- Выбор пространства и окружений
- Создание бэкапов контента
- Миграция контента между окружениями
- Просмотр истории бэкапов

## Установка и запуск

### Запуск с использованием Docker (рекомендуется)

#### Вариант 1: Использование скриптов запуска (самый простой)

На Linux/Mac:
```bash
# Сделайте скрипт исполняемым
chmod +x start.sh

# Запустите скрипт
./start.sh
```

На Windows:
```bash
start.bat
```

#### Вариант 2: Использование Docker Compose напрямую

1. Убедитесь, что у вас установлены [Docker](https://docs.docker.com/get-docker/) и [Docker Compose](https://docs.docker.com/compose/install/)

2. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/your-username/contentful-migration-tool.git
   cd contentful-migration-tool
   ```

3. Создайте файл `.env` (опционально):
   ```bash
   # Contentful Management Token (опционально)
   CONTENTFUL_MANAGEMENT_TOKEN=your_token_here
   ```

4. Запустите приложение:
   ```bash
   docker-compose up -d
   ```

5. Откройте http://localhost:3000 в браузере

#### Вариант 3: Использование npm-скриптов

```bash
# Сборка Docker-образа
npm run docker:build

# Запуск контейнеров
npm run docker:start

# Остановка контейнеров
npm run docker:stop
```

### Локальная установка (альтернативный вариант)

1. Убедитесь, что у вас установлены:
   - Node.js 16+
   - npm 7+
   - Contentful CLI (`npm install -g contentful-cli`)

2. Клонируйте репозиторий и установите зависимости:
   ```bash
   git clone https://github.com/your-username/contentful-migration-tool.git
   cd contentful-migration-tool
   npm install
   ```

3. Создайте директорию для бэкапов:
   ```bash
   mkdir -p backups
   ```

4. Запустите приложение:
   ```bash
   npm run dev
   ```

5. Откройте http://localhost:3000 в браузере

## Управление приложением

### Остановка приложения

```bash
# Через npm-скрипт
npm run docker:stop

# Или напрямую
docker-compose down
```

### Просмотр логов

```bash
docker-compose logs -f
```

## Настройка

Для использования токена Contentful Management API, добавьте его в файл `.env`:

```
CONTENTFUL_MANAGEMENT_TOKEN=your_token_here
```

## Требования

- Docker и Docker Compose (для запуска через Docker)
- Или Node.js 16+ и npm 7+ (для локальной установки)

## Использование

1. Авторизуйтесь в Contentful, нажав на кнопку "Login to Contentful"
2. Выберите пространство из выпадающего списка
3. Выберите исходное и целевое окружения
4. Для создания бэкапа нажмите "Backup Source"
5. Для миграции контента нажмите "Migrate Content"

## Бэкапы

Бэкапы сохраняются в директории `backups/{space_id}/` в формате JSON.

## Лицензия

MIT

## 🚀 Installation & Setup

### 1. Clone the Repository
```sh
 git clone https://github.com/AlexandrFedorenko/contentful-migration-tool
 cd contentful-migration-tool
```

### 2. Install Dependencies
```sh
 npm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file in the root directory and add the following Contentful API keys:

```ini
NEXT_PUBLIC_CONTENTFUL_MANAGEMENT_TOKEN=your_management_token
NEXT_PUBLIC_CONTENTFUL_CDA_TOKEN=your_cda_token
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Where to Get API Keys?
- **Management Token**: Get it from [Contentful API Keys](https://app.contentful.com/) → "Content Management API"
- **CDA Token**: Get it from "Content Delivery API" in Contentful settings

### 4. Start the Application
```sh
npm run dev
```
The application will be available at `http://localhost:3000`

---

## 📌 Features
### ✅ Full Content Backup
Backup all Contentful data including:
- Entries
- Content Types
- Assets
- Locales
- Webhooks

### ✅ Migration Between Environments
Migrate content from one environment (e.g., `master`) to another (e.g., `dev`).
- **Standard Migration**: Copies all content
- **Advanced Migration**: Creates a DIFF file to copy only new and modified entries

### ✅ Restore Content from Backup
Restore Contentful content from a previous backup.

### ✅ Delete Backups
Remove old backups directly from the UI.

---



## ⚠️ Important: Backup Before Production Migration
Before migrating content to production, always create a full backup using this guide:
[Contentful CLI Backup Guide](https://rohitgupta.netlify.app/import-and-export-data-with-contentful-cli)

---

## 🛠 Troubleshooting & Common Issues
| Error | Cause | Solution |
|----------------------|--------------------------------------------------|--------------------------------------------------|
| The content type could not be found | Content Type is missing in the target environment | Manually transfer Content Types first |
| Cannot delete locale | Locales cannot be removed via API | Manually disable or leave them |
| Asset already exists | Duplicate asset during import | Delete the existing asset and retry |
| Some entries failed to import | Content Type structure changed | Ensure the Content Type exists and is unchanged |

---

## 📜 License
This project is licensed under the MIT License.

## 📧 Contact
For issues or feature requests, open an issue in the repository or contact the maintainer.

## Для разработчиков

### Запуск в режиме разработки с Docker

```bash
# Запуск с автоматической перезагрузкой при изменениях
npm run docker:dev

# Или с пересборкой образа
npm run docker:dev:build
```

### Локальная разработка без Docker

```bash
npm install
npm run dev
```

### Структура проекта

- `src/pages/api/` - API маршруты Next.js
- `src/utils/` - Утилиты для работы с Contentful
- `src/components/` - React-компоненты
- `src/hooks/` - React-хуки
- `src/context/` - Контекст приложения
- `backups/` - Директория для хранения бэкапов