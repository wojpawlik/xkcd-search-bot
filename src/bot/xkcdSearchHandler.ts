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
        const offset = parseInt(context.inlineQuery.offset) || 0
        const suitableComics = await this.getSuitableComics(query, offset)

        const results: Array<InlineQueryResult> = await Promise.all(suitableComics.map(async (comic: XKCD.Comic) => {
            return this.messageProvider.makeInlineQueryResultFromComic(comic)
        }))

        const cacheTime = process.env.ENVIRONMENT === 'DEBUG' ? 0 : 60*60*1000
        return context.answerInlineQuery(
            results as any,
            {next_offset: offset + results.length, cache_time: cacheTime} as any,
        )
    }

    private async getSuitableComics(query: string, offset: number): Promise<Array<XKCD.Comic>> {
        let suitableComics
        if (query) {
            suitableComics = await this.getRelevantComics(query)
            suitableComics = suitableComics.splice(offset)
        } else {
            suitableComics = await XKCD.fetchNLatest(10, offset)
        }

        return suitableComics
    }


    private async getRelevantComics(query: string) {
        const relevantComics = await XKCD.fetchAllRelevant(query)

        const comicId = parseInt(query)
        if (comicId) {
            try {
                relevantComics.filter(comic => comic.id !== comicId)
                relevantComics.unshift(await XKCD.fetchComic(comicId))
            } catch (e) {
                if (e.status && e.status === 404) console.error(e)
                else throw e
            }
        }
        return relevantComics
    }

    async mouseOver(context: ContextMessageUpdate) {
        const xkcdId = parseInt(context.callbackQuery.data)
        const comic = await XKCD.fetchComic(xkcdId)
        const answer = this.messageProvider.getCallbackQueryAnswerForComic(comic)
        const cacheTime = process.env.ENVIRONMENT === 'DEBUG' ? 0 : 60*60*1000
        return answer.asAnswer(context, cacheTime)
    }
}

