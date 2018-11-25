port module Main exposing (main)

import Elmegram
import Elmegram.Runner
import Json.Decode as Decode
import Json.Encode as Encode
import Platform
import RelevantXkcdBot as Bot
import Telegram


main =
    Elmegram.Runner.bot
        { init = Bot.init
        , handle = Bot.handle
        , update = Bot.update
        , incomingUpdatePort = incomingUpdatePort
        , methodPort = methodPort
        , errorPort = errorPort
        }



-- PORTS


port errorPort : String -> Cmd msg


port methodPort : Encode.Value -> Cmd msg


port incomingUpdatePort : (Encode.Value -> msg) -> Sub msg
