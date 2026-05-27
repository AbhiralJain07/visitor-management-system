const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Message bhejo
const sendMessage = async (telegramId, message) => {
    try {
        await bot.sendMessage(telegramId, message);
        console.log('Telegram message sent! ✅');
    } catch (error) {
        console.log('Telegram error:', error.message);
    }
};

module.exports = { sendMessage };