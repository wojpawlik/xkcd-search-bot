Telegram [bot] for searching for [revelant xkcd] comics, inline.

```bash
git clone https://github.com/wojpawlik/xkcd-search-bot.git
cd xkcd-search-bot
# set some env variables, see below
npm install
npm start
```

Configuration is done via environmental variables:

- `TELEGRAM_BOT_TOKEN` (required) &ndash; token, obtain it from [@BotFather].
- `URL` (optional) &ndash; URL to set webhook to.
- `XKCD_CACHE_TIME` (optional) &ndash; determines how long Telegram should cache answers to inline queries, time in seconds. Defaults to 0 seconds if `process.env.NODE_ENV === 'development'`, 1 hour otherwise.
- `CONTACT_URL` (optional) &ndash; url to which the "Contact author" button points to.

[bot]: https://t.me/xkcdsearch_bot
[@BotFather]: https://t.me/BotFather
[revelant xkcd]: https://relevantxkcd.appspot.com/
