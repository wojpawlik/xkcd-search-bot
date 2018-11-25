module RelevantXkcdBot exposing (Model, Msg, handle, init, update)

import Elmegram
import Http
import Json.Decode as Decode
import RelevantXkcd
import String.Extra as String
import Task exposing (Task)
import Telegram
import Url


type alias Response =
    Elmegram.Response Model Msg


type alias Model =
    { self : Telegram.User }


init : Telegram.User -> Model
init user =
    { self = user }


handle : Telegram.Update -> Model -> Response
handle newUpdate model =
    case newUpdate.content of
        Telegram.MessageUpdate message ->
            if Elmegram.matchesCommand "start" message || Elmegram.matchesCommand "help" message then
                simply [ helpMessage model.self message.chat ] model

            else if Elmegram.containsCommand message then
                simply [ commandNotFoundMessage model.self message ] model

            else
                let
                    getXkcd =
                        fetchRelevantXkcd
                            message.text
                            |> Task.attempt
                                (\result ->
                                    case result of
                                        Ok xkcd ->
                                            SendXkcdMessage message.chat xkcd

                                        Err err ->
                                            SendMessage message.chat err
                                )
                in
                do [] model getXkcd

        Telegram.InlineQueryUpdate inlineQuery ->
            let
                offset =
                    String.toInt inlineQuery.offset |> Maybe.withDefault 0

                getXkcd =
                    fetchRelevantXkcdsForQuery
                        inlineQuery.query
                        { amount = 10, offset = offset }
                        |> Task.attempt
                            (\result ->
                                case result of
                                    Ok xkcds ->
                                        let
                                            newOffset =
                                                List.length xkcds |> String.fromInt
                                        in
                                        AnswerQuery inlineQuery newOffset xkcds

                                    Err _ ->
                                        AnswerQuery inlineQuery "" []
                            )
            in
            do [] model getXkcd

        Telegram.CallbackQueryUpdate callbackQuery ->
            case String.toInt callbackQuery.data of
                Just id ->
                    do []
                        model
                        (RelevantXkcd.fetchXkcd
                            id
                            |> Task.attempt
                                (\result ->
                                    case result of
                                        Ok xkcd ->
                                            AnswerCallback callbackQuery xkcd

                                        Err _ ->
                                            AnswerCallbackFail callbackQuery
                                )
                        )

                Nothing ->
                    simply [ answerCallbackFail callbackQuery ] model


type Msg
    = NoOp
    | SendMessage Telegram.Chat String
    | AnswerQuery Telegram.InlineQuery String (List RelevantXkcd.Xkcd)
    | AnswerCallback Telegram.CallbackQuery RelevantXkcd.Xkcd
    | AnswerCallbackFail Telegram.CallbackQuery
    | FetchXkcd (Result String RelevantXkcd.Xkcd -> Msg) RelevantXkcd.XkcdId
    | FetchXkcds (Result String (List RelevantXkcd.Xkcd) -> Msg) (List RelevantXkcd.XkcdId)
    | SendXkcdMessage Telegram.Chat RelevantXkcd.Xkcd


update : Msg -> Model -> Response
update msg model =
    case msg of
        NoOp ->
            keep model

        SendMessage to text ->
            simply [ Elmegram.answer to text ] model

        AnswerQuery to newOffset xkcds ->
            let
                results =
                    List.map
                        (\xkcd ->
                            let
                                article =
                                    Elmegram.makeMinimalInlineQueryResultArticle
                                        { id = String.fromInt <| RelevantXkcd.getId xkcd
                                        , title = xkcdHeading xkcd
                                        , message = Elmegram.makeInputMessageFormatted <| xkcdText xkcd
                                        }
                            in
                            { article
                                | description = RelevantXkcd.getTranscript xkcd
                                , url = Just <| Telegram.Hide (RelevantXkcd.getComicUrl xkcd)
                                , thumb_url = Just (RelevantXkcd.getPreviewUrl xkcd)
                                , reply_markup = Just (xkcdKeyboard xkcd)
                            }
                                |> Elmegram.inlineQueryResultFromArticle
                        )
                        xkcds

                incompleteInlineQueryAnswer =
                    Elmegram.makeAnswerInlineQuery to results

                rawInlineQueryAnswer =
                    { incompleteInlineQueryAnswer
                        | next_offset = Just newOffset
                    }

                debugInlineQuery =
                    { rawInlineQueryAnswer
                        | cache_time = Just 0
                    }
            in
            simply [ debugInlineQuery |> Elmegram.methodFromInlineQuery ] model

        AnswerCallback to xkcd ->
            let
                incompleteAnswer =
                    Elmegram.makeAnswerCallbackQuery to

                answer =
                    { incompleteAnswer
                        | text = Just <| (RelevantXkcd.getMouseOver xkcd |> String.ellipsis 200)
                        , show_alert = True
                    }
            in
            simply [ answer |> Elmegram.methodFromAnswerCallbackQuery ] model

        AnswerCallbackFail to ->
            simply [ answerCallbackFail to ] model

        FetchXkcd tag id ->
            let
                fetchXkcd =
                    RelevantXkcd.fetchXkcd id
                        |> Task.attempt tag
            in
            do [] model fetchXkcd

        FetchXkcds tag ids ->
            let
                fetchXkcds =
                    RelevantXkcd.fetchXkcds ids
                        |> Task.attempt tag
            in
            do [] model fetchXkcds

        SendXkcdMessage to xkcd ->
            let
                incompleteAnswer =
                    Elmegram.makeAnswerFormatted to (xkcdText xkcd)

                answer =
                    { incompleteAnswer
                        | reply_markup = Just <| Telegram.InlineKeyboardMarkup (xkcdKeyboard xkcd)
                    }
            in
            simply [ answer |> Elmegram.methodFromMessage ] model


xkcdHeading : RelevantXkcd.Xkcd -> String
xkcdHeading xkcd =
    ("#" ++ (String.fromInt <| RelevantXkcd.getId xkcd) ++ ": ")
        ++ RelevantXkcd.getTitle xkcd


xkcdText : RelevantXkcd.Xkcd -> Elmegram.FormattedText
xkcdText xkcd =
    Elmegram.format Telegram.Html
        (("<b>" ++ xkcdHeading xkcd ++ "</b>\n")
            ++ (Url.toString <| RelevantXkcd.getComicUrl xkcd)
        )


xkcdKeyboard : RelevantXkcd.Xkcd -> Telegram.InlineKeyboard
xkcdKeyboard xkcd =
    [ [ Telegram.CallbackButton (RelevantXkcd.getId xkcd |> String.fromInt) "Show mouse-over" ]
    , [ Telegram.UrlButton (RelevantXkcd.getExplainUrl xkcd) "Explain xkcd" ]
    ]


answerCallbackFail : Telegram.CallbackQuery -> Elmegram.Method
answerCallbackFail to =
    Elmegram.makeAnswerCallbackQuery to
        |> Elmegram.methodFromAnswerCallbackQuery


helpMessage : Telegram.User -> Telegram.Chat -> Elmegram.Method
helpMessage self chat =
    Elmegram.answerFormatted
        chat
        (Elmegram.format
            Telegram.Markdown
            (helpText self)
        )


helpText : Telegram.User -> String
helpText self =
    "Type `@"
        ++ Elmegram.getDisplayName self
        ++ " <query>` in any chat to search for [relevant xkcd](https://relevantxkcd.appspot.com/) comics."
        ++ "To get the latest comics, just enter nothing as the query.\n"
        ++ "\n"
        ++ "You can also just send me messages here. I will answer with the xkcd most relevant to what you sent me."


commandNotFoundMessage : Telegram.User -> Telegram.TextMessage -> Elmegram.Method
commandNotFoundMessage self message =
    Elmegram.replyFormatted
        message
        (Elmegram.format
            Telegram.Markdown
            ("I did not understand that command.\n\n" ++ helpText self)
        )



-- LOGIC


fetchRelevantXkcd : String -> Task String RelevantXkcd.Xkcd
fetchRelevantXkcd query =
    let
        fetchCurrent =
            RelevantXkcd.fetchCurrentXkcd
    in
    if String.isEmpty query then
        fetchCurrent

    else
        case String.toInt query of
            Just id ->
                RelevantXkcd.fetchXkcd id

            Nothing ->
                RelevantXkcd.fetchRelevantIds query
                    |> Task.andThen
                        (\ids ->
                            case ids of
                                bestMatch :: _ ->
                                    RelevantXkcd.fetchXkcd bestMatch

                                _ ->
                                    Task.fail ("No relevant xkcd for query '" ++ query ++ "'.")
                        )


fetchRelevantXkcdsForQuery : String -> { amount : Int, offset : Int } -> Task String (List RelevantXkcd.Xkcd)
fetchRelevantXkcdsForQuery query { amount, offset } =
    let
        fetchLatest =
            RelevantXkcd.fetchLatestXkcds { amount = max 0 amount, offset = offset }
    in
    if String.isEmpty query then
        fetchLatest

    else
        case String.toInt query of
            Just id ->
                RelevantXkcd.fetchXkcd id
                    |> Task.andThen
                        (\exactMatch ->
                            RelevantXkcd.fetchLatestXkcds { amount = max 0 (amount - 1), offset = offset }
                                |> Task.map
                                    (\xkcds ->
                                        let
                                            cleanedXkcds =
                                                List.filter (\xkcd -> xkcd /= exactMatch) xkcds
                                        in
                                        exactMatch :: cleanedXkcds
                                    )
                        )
                    |> Task.onError
                        (\_ -> fetchLatest)

            Nothing ->
                RelevantXkcd.fetchRelevantIds query
                    |> Task.andThen RelevantXkcd.fetchXkcds
                    |> Task.map (List.take amount)



-- HELPERS


do : List Elmegram.Method -> Model -> Cmd Msg -> Response
do methods model cmd =
    { methods = methods
    , model = model
    , command = cmd
    }


simply : List Elmegram.Method -> Model -> Response
simply methods model =
    { methods = methods
    , model = model
    , command = Cmd.none
    }


keep : Model -> Response
keep model =
    { methods = []
    , model = model
    , command = Cmd.none
    }
