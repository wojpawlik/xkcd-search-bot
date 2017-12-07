import * as XKCD from 'relevant-xkcd'
import * as Telegraf from 'telegraf'
import { ContextMessageUpdate } from 'telegraf/typings'
import { Message } from 'telegraf/typings/telegram-types'
import { MessageProvider } from './messageProvider'
import { InlineQueryResult } from './telegram'

export class XkcdSearchHandler {
    private botName: string
    private messageProvider: MessageProvider

    private constructor() {
        this.messageProvider = new MessageProvider()
    }

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
        const message = this.messageProvider.getHelpMessage(this.botName)
        return message.asReply(context)
    }

    async inlineQuery(context: ContextMessageUpdate) {
        const query = context.inlineQuery.query
        const relevantComics = await this.getSuitableComics(query)

        const offset = parseInt(context.inlineQuery.offset) || 0
        const splicedRelevantComics = relevantComics.splice(offset)
        const results: Array<InlineQueryResult> = await Promise.all(splicedRelevantComics.map(async (comic: XKCD.Comic) => {
            return this.messageProvider.makeInlineQueryResultFromComic(comic)
        }))

        return context.answerInlineQuery(
            results as any,
            {next_offset: offset + results.length, cache_time: 0} as any,
        )
    }

    private async getSuitableComics(query: string): Promise<Array<XKCD.Comic>> {
        let suitableComics
        if (query) {
            suitableComics = await XKCD.fetchAllRelevant(query)

            const comicId = parseInt(query)
            if (comicId) {
                try {
                    suitableComics.unshift(await XKCD.fetchComic(comicId))
                } catch (e) {
                    // TODO: Detect if error is 404
                    console.error(e)
                }
            }
        } else {
            suitableComics = await XKCD.fetchNLatest(10)
        }

        return suitableComics
    }

    async mouseOver(context: ContextMessageUpdate) {
        const xkcdId = parseInt(context.callbackQuery.data)
        const comic = await XKCD.fetchComic(xkcdId)
        const answer = this.messageProvider.getCallbackQueryAnswerForComic(comic)
        return answer.asAnswer(context, 0)
    }
}
