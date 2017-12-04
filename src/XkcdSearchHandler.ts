import * as Telegraf from 'telegraf'

export class XkcdSearchHandler {
    static async createWith(bot: Telegraf) {
        const handler = new XkcdSearchHandler()
        await handler.registerToBot(bot)
        return handler
    }

    async registerToBot(bot: Telegraf) {
    }
}