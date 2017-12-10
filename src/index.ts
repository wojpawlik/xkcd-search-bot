import { Express } from 'express'
import { startBot } from './startBot'

const express = require('express')
const proxy = require('express-http-proxy')

startServer(express())

async function startServer(app: Express) {
    // Static website
    app.use(express.static('./public'))

    // Bot webhooks redirect
    const {pathToFetchFrom, urlToRedirectTo} = await startBot()
    app.use(pathToFetchFrom, proxy(urlToRedirectTo))

    const listener = app.listen(process.env.PORT, function () {
        console.log('Your app is listening on port ' + listener.address().port)
    })
}
