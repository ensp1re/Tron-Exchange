# Используем официальный образ Node.js
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json package-lock.json ./
RUN npm install --force

# Копируем код приложения
COPY . .

# Указываем порт и команду запуска
EXPOSE 3000
CMD ["npm", "run", "start"]




