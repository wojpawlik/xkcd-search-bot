'use strict';

const { bot, promiseMe } = require('./bot');
const pkg = require('./package.json');

const contactUrl = process.env.CONTACT_URL || 't.me/GingerPlusPlus';

const promiseHelpText = promiseMe.then(me => `\
Type \`@${me.username} <query>\` in any chat to search for [revelant xkcd](https://relevantxkcd.appspot.com/).

You can also use \`/xkcd <query>\` in pm or any group I'm in.

When query is empty, latest xkcd is sent.
`)

const replyMarkup = bot.inlineKeyboard([[
	{ text: 'Contact author', url: contactUrl },
	{ text: 'Repository', url: pkg.repository.url},
]])

const options = { replyMarkup, parseMode: 'markdown' };

exports.handler = async (msg) => msg.reply.text(await promiseHelpText, options);
