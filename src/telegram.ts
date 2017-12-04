import * as Markup from 'telegraf/markup'

export class InlineQueryResultArticle {
    type: string = 'article'

    constructor(
        public id: string,
        public title: string,
        public input_message_content: InputMessageContent,
        public reply_markup: Markup = undefined,
        public url: string = undefined,
        public description: string = undefined,
        public thumb_url: string = undefined,
    ) {}
}

export class InputMessageContent {
    constructor(
        public message_text: string,
        public parse_mode: string = undefined,
        public disable_web_page_preview: boolean = undefined,
    ) {}
}
