'use strict';

const { bot } = require('./bot');
const _ = require('lodash');
const request = require('request-promise-native');

const { XKCD_CACHE_TIME, NODE_ENV } = process.env;

const cacheTime = Number(XKCD_CACHE_TIME || (NODE_ENV === 'development'? 0: 3600));

const maxInlineResults = 50;


function revelantXkcd(query) {
    return request({
        url: 'https://relevantxkcd.appspot.com/process',
        qs: { action: 'xkcd', query },
    }).then(text => text.split(/[\r\n]+/g).slice(2, -1));
}

// It could be cached...
function latestXkcd() {
    return request({
        url: 'https://xkcd.com/info.0.json',
        json: true,
    });
}


function results() {
    return JSON.stringify(this.list);
}


function replyMarkupForXkcd(num) {
    return bot.inlineKeyboard([[
        {
            text: 'Explanation...',
            url: `https://www.explainxkcd.com/wiki/index.php/${num}`,
        }
    ]]);
}


function inlineImage({num, img}) {
    return {
        type: 'photo',
        id: String(num),
        photo_url: img,
        thumb_url: img,
        caption: `https://xkcd.com/${num}`,
        reply_markup: replyMarkupForXkcd(num),
    }
}


function replyXkcd(msg, num) {
    const replyMarkup = replyMarkupForXkcd(num);
    return msg.reply.text(`https://xkcd.com/${num}`, { replyMarkup } );
}


exports.handler = async (msg) => {
    if (msg.entities[0].type !== 'bot_command') {
        return;
    }
    msg.args = msg.text.slice(msg.entities[0].length + 1);
    if (!msg.args) {
        const latest = await latestXkcd();
        return replyXkcd(msg, latest.num);
    } else if (/^\d+$/.test(msg.args)) {
        return replyXkcd(msg, msg.args);
    } else {
        const [ revelant ] = await revelantXkcd(msg.args);
        const [ id ] = revelant.split(' ');
        return replyXkcd(msg, id);
    }
};

exports.inlineHandler = async (inlineQuery) => {
    const { query, id } = inlineQuery;
    const list = query
        ? (await revelantXkcd(query))
            .slice(0, maxInlineResults)
            .map(line => line.split(' '))
            .map(([num, url]) => inlineImage({
                num,
                img:`https://www.explainxkcd.com${url}`
            }))
        : [inlineImage(await latestXkcd())]
    return bot.answerInlineQuery({ id, list, cacheTime, results });
}
