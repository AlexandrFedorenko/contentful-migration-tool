# Dockerfile (Next.js) - Production
FROM node:18-alpine

WORKDIR /app

# Установка необходимых зависимостей для сборки
RUN apk add --no-cache python3 make g++

# Установка зависимостей
COPY package*.json ./
RUN npm install

# Глобальная установка Contentful CLI
RUN npm install -g contentful-cli

# Копирование исходного кода
COPY . .

# Создание директории для бэкапов с правильными правами
RUN mkdir -p /app/backups && \
    chmod -R 777 /app/backups

# Сборка приложения
RUN npm run build

# Экспорт портов
EXPOSE 3000

# Запуск приложения
CMD ["npm", "start"] 