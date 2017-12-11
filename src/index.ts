import * as Express from 'express'
import * as Proxy from 'express-http-proxy'
import * as path from 'path'
import { startBot } from './startBot'

startServer(Express())

async function startServer (app: Express) {
  // Static website
  app.use(Express.static(path.join(__dirname, '/public/')))

  // Bot webhooks redirect
  const {pathToFetchFrom, urlToRedirectTo} = await startBot()
  app.use(pathToFetchFrom, Proxy(urlToRedirectTo))

  const listener = app.listen(process.env.PORT, function () {
    console.log('Your app is listening on port ' + listener.address().port)
  })
}
