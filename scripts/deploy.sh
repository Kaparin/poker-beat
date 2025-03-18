#!/bin/bash

# Скрипт для деплоя приложения в продакшен

# Проверка наличия переменных окружения
if [ ! -f .env ]; then
  echo "Ошибка: Файл .env не найден"
  exit 1
fi

# Загрузка переменных окружения
source .env

# Проверка обязательных переменных окружения
REQUIRED_VARS=(
  "SUPABASE_URL"
  "SUPABASE_SERVICE_KEY"
  "JWT_SECRET"
  "JWT_AUDIENCE"
  "JWT_ISSUER"
  "TELEGRAM_BOT_TOKEN"
  "REDIS_URL"
)

for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "Ошибка: Переменная окружения $VAR не установлена"
    exit 1
  fi
done

echo "Все необходимые переменные окружения установлены"

# Установка зависимостей
echo "Установка зависимостей..."
npm ci

# Сборка приложения
echo "Сборка приложения..."
npm run build

# Проверка успешности сборки
if [ $? -ne 0 ]; then
  echo "Ошибка: Сборка приложения не удалась"
  exit 1
fi

echo "Сборка успешно завершена"

# Запуск миграций базы данных (если необходимо)
echo "Запуск миграций базы данных..."
node scripts/migrate.js

# Запуск приложения с PM2
echo "Запуск приложения с PM2..."
pm2 delete poker-app 2>/dev/null || true
pm2 start npm --name "poker-app" -- start

echo "Приложение успешно запущено"

# Проверка статуса приложения
echo "Проверка статуса приложения..."
sleep 5
pm2 status

echo "Деплой завершен успешно"

