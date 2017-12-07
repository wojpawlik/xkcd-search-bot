import * as loadJsonFile from 'load-json-file'
import * as XKCD from 'relevant-xkcd'
import * as Telegraf from 'telegraf'
import * as Extra from 'telegraf/extra'
import * as Markup from 'telegraf/markup'
import { ContextMessageUpdate } from 'telegraf/typings'
import { Message } from 'telegraf/typings/telegram-types'
import { InlineQueryResultArticle, InputMessageContent } from './telegram'

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
Type \`@${this.botName} <query>\` in any chat to search for [relevant xkcd](https://relevantxkcd.appspot.com/).

You can also use \`/xkcd <query>\` in pm or any group I'm in.

When query is empty, latest xkcd is sent.`

        const npmPackage = await loadJsonFile('package.json')
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
        const relevantComics: Array<XKCD.Comic> = await XKCD.fetchAllRelevant(query)
        const offset = parseInt(context.inlineQuery.offset) || 0
        const splicedRelevantComics = relevantComics.splice(offset)
        const results = await Promise.all(splicedRelevantComics.map(async (comic: XKCD.Comic) => {
            return new InlineQueryResultArticle(
                comic.id.toString(),
                comic.title,
                new InputMessageContent(
                    comic.xkcdURL,
                ),
                Markup.inlineKeyboard([
                                          [
                                              Markup.callbackButton('Show mouse-over', comic.id),
                                          ],
                                          [
                                              Markup.urlButton(
                                                  'Explain',
                                                  comic.explainURL,
                                              ),
                                          ],
                                      ],
                ),
                comic.xkcdURL,
                comic.transcript,
                comic.imageURL,
            )
        }))
        context.answerInlineQuery(
            results as any,
            {next_offset: offset + results.length, cache_time: 0} as any,
        )
    }

    async mouseOver(context: ContextMessageUpdate) {
        const xkcdId = parseInt(context.callbackQuery.data)
        const comic = await XKCD.fetchComic(xkcdId)
        context.answerCallbackQuery(comic.altText, undefined, true)
    }
}

