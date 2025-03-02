/**
 * Этот файл можно использовать для запуска только Telegram бота
 * без запуска основного сервера Express и Socket.io.
 * 
 * Запуск: node botRunner.js
 */

const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config();

if (!process.env.BOT_TOKEN) {
  console.error('Ошибка: BOT_TOKEN не найден в переменных окружения (.env)');
  console.error('Пожалуйста, укажите действительный токен бота в файле .env');
  process.exit(1);
}

try {
  const bot = require('./bot');
  console.log('Telegram бот запущен успешно!');
  console.log('Для остановки бота нажмите Ctrl+C');
} catch (error) {
  console.error('Ошибка при запуске бота:', error);
  process.exit(1);
} 