import * as XKCD from 'relevant-xkcd'
import * as Markup from 'telegraf/markup'
import {
  CallbackQueryAnswer,
  InlineQueryResult,
  InlineQueryResultArticle,
  InputMessageContent,
  Message,
  MessageText
} from './telegram'

export class MessageProvider {
  getHelpMessage (botName: string) {
    const messageText = new MessageText(
      `\
Type \`@${botName} <query>\` in any chat to search for [relevant xkcd](https://relevantxkcd.appspot.com/) comics.
When the query is empty, the latest XKCD comics are sent.`,
      MessageText.Markdown
    )
    return new Message(messageText)
  }

  makeInlineQueryResultFromComic (comic: XKCD.Comic): InlineQueryResult {
    return new InlineQueryResultArticle(
      comic.id.toString(),
      `#${comic.id}: ${comic.title}`,
      new InputMessageContent(
        comic.xkcdURL
      ),
      Markup.inlineKeyboard(
        [
          [
            Markup.callbackButton('Show mouse-over', comic.id)
          ],
          [
            Markup.urlButton(
              'Explain',
              comic.explainURL
            )
          ]
        ]
      ),
      comic.xkcdURL,
      comic.transcript,
      comic.imageURL
    )
  }

  getCallbackQueryAnswerForComic (comic: XKCD.Comic): CallbackQueryAnswer {
    return new CallbackQueryAnswer(comic.altText, true)
  }
}
