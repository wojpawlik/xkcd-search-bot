#!/usr/bin/env node

'use strict';

const { bot } = require('./bot');
const help = require('./help');
const xkcd = require('./xkcd');

bot.on('/xkcd', xkcd.handler);
bot.on('/random', xkcd.randomHandler);
bot.on('inlineQuery', xkcd.inlineHandler);
bot.on(['/start', '/help'], help.handler);

bot.start();

process.once('SIGINT', () => bot.stop("SIGINT"));
process.once('SIGTERM', () => bot.stop("SIGTERM"));
process.once('SIGBREAK', () => bot.stop("Ctrl + Break"));
