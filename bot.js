'use strict';

const Bot = require('telebot');

const token = process.env.TELEGRAM_BOT_TOKEN;

const usePlugins = ['shortReply', 'floodProtection'];

const options = { token, usePlugins };

exports.bot = new Bot(options);

exports.promiseMe = exports.bot.getMe();
