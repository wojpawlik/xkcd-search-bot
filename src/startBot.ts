import * as Telegraf from 'telegraf'
import * as util from 'util'
import { XkcdSearchHandler } from './bot/xkcdSearchHandler'

export async function startBot () {
  const token = process.env.BOT_TOKEN
  const bot = new Telegraf(token)
  bot.use(logMiddleware)
  bot.catch(err => console.error(err))

  await XkcdSearchHandler.createWith(bot)

  const domain = process.env.PROJECT_DOMAIN
  const host = `${domain}.glitch.me`
  const port = 8443
  const pathToFetchFrom = `/bot/${token}`
  await bot.telegram.setWebhook(`https://${host}${pathToFetchFrom}`)
  bot.startWebhook(`/`, null, port, 'localhost')
  console.log(`Your bot is listening on port ${port}.`)

  return {
    pathToFetchFrom: pathToFetchFrom,
    urlToRedirectTo: `localhost:${port}`
  }
}

async function logMiddleware (ctx, next) {
  console.log('===================================================')
  console.log('Incoming:\n', util.inspect(ctx.update, {depth: 5}))
  console.log('- - - - - - - - - - - - - - - - - - - - - - - - - -')
  console.log('Outgoing:\n', await next())
  console.log('===================================================')
}
