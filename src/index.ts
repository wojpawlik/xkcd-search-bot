import * as Telegraf from 'telegraf'
import * as util from 'util'
import { XkcdSearchHandler } from './XkcdSearchHandler'

const token = process.env.BOT_TOKEN
startBot(new Telegraf(token))

async function startBot(bot: Telegraf) {
    bot.use(log_middleware)
    bot.use(catch_error)

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

async function catch_error(ctx, next) {
    let result = null
    try {
        result = await next()
    } catch (e) {
        console.error(e)
    }
    return result
}
