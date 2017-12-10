import * as Extra from 'telegraf/extra'
import * as Markup from 'telegraf/markup'
import { ContextMessageUpdate } from 'telegraf/typings'
import * as Telegram from 'telegraf/typings/telegram-types'
import { InlineKeyboardMarkup } from 'telegraf/typings/telegram-types'

export abstract class InlineQueryResult {
    constructor(
        public type: string,
    ) {}
}

export class InlineQueryResultArticle extends InlineQueryResult {
    constructor(
        public id: string,
        public title: string,
        public input_message_content: InputMessageContent,
        public reply_markup: Markup = undefined,
        public url: string = undefined,
        public description: string = undefined,
        public thumb_url: string = undefined,
    ) {
        super('article')
    }
}

export class InputMessageContent {
    constructor(
        public message_text: string,
        public parse_mode: string = undefined,
        public disable_web_page_preview: boolean = undefined,
    ) {}
}

export class InlineQueryResultPhoto extends InlineQueryResult {
    constructor(
        public id: string,
        public photo_url: string,
        public thumb_url: string,
        public photo_width: number = undefined,
        public photo_height: number = undefined,
        public title: string = undefined,
        public description: string = undefined,
        public caption: string = undefined,
        public reply_markup: Markup = undefined,
        public input_message_content: InputMessageContent = undefined,
    ) {
        super('photo')
    }
}

export class MessageText {
    static readonly Markdown = 'Markdown'
    static readonly HTML = 'HTML'

    constructor(
        public text: string,
        public parse_mode: string = undefined,
    ) {}
}

export class Message {
    constructor(
        public message_text: MessageText,
        public inline_keyboard: InlineKeyboardMarkup = undefined,
    ) {}

    asReply(context: ContextMessageUpdate): Promise<Telegram.Message> {
        const extra = this.message_text.parse_mode === MessageText.Markdown ? Extra.markdown() : Extra.HTML()
        return context.reply(this.message_text.text, extra.markup(this.inline_keyboard))
    }
}

export class CallbackQueryAnswer {
    constructor(
        public text?: string,
        public show_alert?: boolean,
        public url?: string,
    ) {}

    asAnswer(context: ContextMessageUpdate, cache_time?: number): Promise<boolean> {
        return context.answerCallbackQuery(this.text, this.url, this.show_alert, cache_time)
    }
}
