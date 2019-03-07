'use strict';

const Bot = require('telebot');

const port = process.env.PORT;
const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.URL || process.env.NOW_URL;

const webhook = url && { port, url };

const usePlugins = ['shortReply', 'floodProtection'];

const options = { token, usePlugins, webhook };

exports.bot = new Bot(options);

exports.promiseMe = exports.bot.getMe();
