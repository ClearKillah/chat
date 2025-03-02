const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config();

// Токен бота и URL веб-приложения
const BOT_TOKEN = process.env.BOT_TOKEN || 'ВСТАВЬТЕ_ВАШ_ТОКЕН_СЮДА';
const WEBAPP_URL = process.env.WEBAPP_URL || 'ВСТАВЬТЕ_ССЫЛКУ_НА_ДОМЕН_СЮДА';

// Создание экземпляра бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'пользователь';
  
  await bot.sendMessage(chatId, 
    `Привет, ${firstName}! 👋\n\nЯ бот для анонимного общения. С моей помощью ты можешь найти собеседника и пообщаться анонимно.\n\nНажми на кнопку "Начать чат" чтобы продолжить.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Начать чат', web_app: { url: WEBAPP_URL } }]
        ]
      }
    }
  );
});

// Обработка команды /help
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, 
    'Инструкция по использованию бота:\n\n' +
    '1. Нажмите на кнопку "Начать чат"\n' +
    '2. Заполните свой профиль (имя, возраст, пол)\n' +
    '3. Выберите интересы (необязательно)\n' +
    '4. Нажмите кнопку "Найти собеседника"\n' +
    '5. Начните общение после того, как найдется пара\n\n' +
    'Команды:\n' +
    '/start - Запустить бота\n' +
    '/help - Показать эту инструкцию'
  );
});

// Обработка обычных сообщений
bot.on('message', async (msg) => {
  // Если это не команда и не взаимодействие с веб-приложением
  if (!msg.text || !(msg.text.startsWith('/') || msg.web_app_data)) {
    const chatId = msg.chat.id;
    
    await bot.sendMessage(chatId, 
      'Чтобы начать общение, нажми на кнопку "Начать чат"',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Начать чат', web_app: { url: WEBAPP_URL } }]
          ]
        }
      }
    );
  }
});

// Настройка меню бота
bot.setMyCommands([
  { command: 'start', description: 'Запустить бота' },
  { command: 'help', description: 'Показать инструкцию' }
]);

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Ошибка бота:', error);
});

console.log('Telegram бот запущен!');

module.exports = bot; 