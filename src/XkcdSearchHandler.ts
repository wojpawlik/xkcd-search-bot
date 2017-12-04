import * as fetch from 'node-fetch'
import * as Telegraf from 'telegraf'
import * as Extra from 'telegraf/extra'
import * as Markup from 'telegraf/markup'
import { ContextMessageUpdate } from 'telegraf/typings'
import { Message } from 'telegraf/typings/telegram-types'
import { InlineQueryResultArticle, InputMessageContent } from './telegram'

const npmPackage = require('../package.json')

export class XkcdSearchHandler {
    private botName: string

    static async createWith(bot: Telegraf) {
        const handler = new XkcdSearchHandler()
        await handler.registerToBot(bot)
        return handler
    }

    async registerToBot(bot: Telegraf) {
        bot.command(['start', 'help'], (context) => this.help(context))
        bot.on('inline_query', (context) => this.inlineQuery(context))
        bot.action(/\d+/, (context) => this.mouseOver(context))

        const me = await bot.telegram.getMe()
        this.botName = me.username
    }

    async help(context: ContextMessageUpdate): Promise<Message> {
        const replyText = `\
Type \`@${this.botName} <query>\` in any chat to search for [revelant xkcd](https://relevantxkcd.appspot.com/).

You can also use \`/xkcd <query>\` in pm or any group I'm in.

When query is empty, latest xkcd is sent.`

        const contactUrl = process.env.CONTACT_URL || 't.me/GingerPlusPlus'
        const inlineKeyboard = Markup.inlineKeyboard(
            [
                [
                    Markup.urlButton('Contact author', contactUrl),
                ],
                [
                    Markup.urlButton('Repository', npmPackage.repository.url),
                ],
                [
                    Markup.urlButton('Rate', 'https://telegram.me/storebot?start=xkcdsearch_bot'),
                ],
            ],
        )

        return context.reply(replyText, Extra.markdown().markup(inlineKeyboard))
    }

    async inlineQuery(context: ContextMessageUpdate) {
        const query = context.inlineQuery.query
        const relevantXkcdIds = await this.fetchRelevantXkcds(query)
        const offset = parseInt(context.inlineQuery.offset) || 0
        const splicedRelevantXkcdIds = relevantXkcdIds.splice(offset)
        const results = await Promise.all(splicedRelevantXkcdIds.map(async (id: number) => {
            const url = `https://xkcd.com/${id}`
            const comicInfo = await fetch(url + '/info.0.json').then(response => response.json())
            return new InlineQueryResultArticle(
                id.toString(),
                comicInfo['title'],
                new InputMessageContent(
                    url,
                ),
                Markup.inlineKeyboard([
                                          [
                                              Markup.callbackButton('Show mouse-over', id),
                                          ],
                                          [
                                              Markup.urlButton(
                                                  'Explain',
                                                  `https://www.explainxkcd.com/wiki/index.php/${id}`,
                                              ),
                                          ],
                                      ],
                ),
                url,
                comicInfo['transcript'],
                comicInfo['img'],
            )
        }))
        context.answerInlineQuery(
            results as any,
            {next_offset: offset + results.length, cache_time: 0} as any,
        )
    }

    private async fetchRelevantXkcds(query: string): Promise<Array<number>> {
        const rawRows = await fetch(`https://relevantxkcd.appspot.com/process?action=xkcd&query=${query}`)
            .then(response => response.text())
        const relevantXkcdIds = rawRows.split(/\n/g)
            .slice(2, -1)
            .map((row: string) => row.split(' ')[0])
            .map((id: string) => parseInt(id))
        return relevantXkcdIds
    }

    async mouseOver(context: ContextMessageUpdate) {
        const xkcdId = parseInt(context.callbackQuery.data)
        const url = `https://xkcd.com/${xkcdId}`
        const comicInfo = await fetch(url + '/info.0.json').then(response => response.json())
        context.answerCallbackQuery(comicInfo['alt'], undefined, true)
    }
}

