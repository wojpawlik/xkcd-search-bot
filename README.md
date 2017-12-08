[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

Telegram [bot] for searching for [revelant xkcd] comics, inline.

```bash
git clone https://github.com/GingerPlusPlus/xkcd-search-bot.git
cd xkcd-search-bot
# set some env variables, see below
npm install
npm start
```

Configuration is done via environmental variables:

- `BOT_TOKEN` (required) &ndash; token, obtain it from [@BotFather].
- `CONTACT_URL` (optional) &ndash; url to which the "Contact author" button points to.

Webhook is not supported yet. Feel free to open a pull request, or just tell me anyhow if you really need it.

[bot]: https://t.me/xkcdsearch_bot
[@BotFather]: https://t.me/BotFather
[revelant xkcd]: https://relevantxkcd.appspot.com/
