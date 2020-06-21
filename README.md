Telegram [bot] for searching for [relevant xkcd] comics, inline.

## Setup

```bash
git clone https://github.com/wojpawlik/xkcd-search-bot.git
cd xkcd-search-bot
# set some env variables, see below
npm install
npm start
```

## Setup with Docker

```bash
docker build -t xkcd-search-bot https://github.com/wojpawlik/xkcd-search-bot.git
# set TELEGRAM_BOT_TOKEN env variable
# run interactively...
docker run -it --env TELEGRAM_BOT_TOKEN xkcd-search-bot
# ...or daemonize for production
docker run --detach --restart=always --memory="64M" --memory-swap="64M" --env TELEGRAM_BOT_TOKEN xkcd-search-bot
```

Configuration is done via environmental variables:

- `TELEGRAM_BOT_TOKEN` (required) &ndash; token, obtain it from [@BotFather].
- `URL` (optional) &ndash; URL to set webhook to.
- `XKCD_CACHE_TIME` (optional) &ndash; determines how long Telegram should cache answers to inline queries, time in seconds. Defaults to 0 seconds if `process.env.NODE_ENV === 'development'`, 1 hour otherwise.
- `CONTACT_URL` (optional) &ndash; url to which the "Contact author" button points to.

[bot]: https://t.me/xkcdsearch_bot
[@BotFather]: https://t.me/BotFather
[relevant xkcd]: https://relevantxkcd.appspot.com/
