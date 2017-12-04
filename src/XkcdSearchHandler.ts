import * as Telegraf from 'telegraf'
import * as Extra from 'telegraf/extra'
import * as Markup from 'telegraf/markup'
import { ContextMessageUpdate } from 'telegraf/typings'
import { Message } from 'telegraf/typings/telegram-types'

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

}
