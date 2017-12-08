import * as Telegraf from 'telegraf'
import * as util from 'util'
import { XkcdSearchHandler } from './xkcdSearchHandler'

const token = process.env.BOT_TOKEN
startBot(new Telegraf(token))

async function startBot(bot: Telegraf) {
    bot.use(log_middleware)
    bot.catch(err => console.error(err))

    await XkcdSearchHandler.createWith(bot)

    bot.startPolling();
    console.log('Your bot is polling.')
}

async function log_middleware(ctx, next) {
    console.log('===================================================')
    console.log('Incoming:\n', util.inspect(ctx.update, {depth: 5}))
    console.log('- - - - - - - - - - - - - - - - - - - - - - - - - -')
    console.log('Outgoing:\n', await next())
    console.log('===================================================')
}
