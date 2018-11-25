const Elmegram = require('elmegram.js');
const Bot = require('./bot.js');

const tokenName = 'TELEGRAM_TOKEN';
const token = process.env[tokenName];
Elmegram.startServer(token, Bot).catch(console.error);
