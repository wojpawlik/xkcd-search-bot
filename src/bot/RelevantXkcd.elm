module RelevantXkcd exposing
    ( Xkcd
    , XkcdId
    , fetchCurrentXkcd
    , fetchLatestXkcds
    , fetchRelevantIds
    , fetchXkcd
    , fetchXkcds
    , getComicUrl
    , getExplainUrl
    , getId
    , getMouseOver
    , getPreviewUrl
    , getTitle
    , getTranscript
    )

import Http
import Json.Decode as Decode
import Task exposing (Task)
import Url exposing (Url)
import Url.Builder



-- XKCD


type Xkcd
    = Xkcd XkcdContent


type alias XkcdContent =
    { id : XkcdId
    , previewUrl : Url
    , title : String
    , mouseOver : String
    , transcript : Maybe String
    }


getId : Xkcd -> Int
getId (Xkcd xkcd) =
    xkcd.id


getPreviewUrl : Xkcd -> Url
getPreviewUrl (Xkcd xkcd) =
    xkcd.previewUrl


getTitle : Xkcd -> String
getTitle (Xkcd xkcd) =
    xkcd.title


getMouseOver : Xkcd -> String
getMouseOver (Xkcd xkcd) =
    xkcd.mouseOver


getTranscript : Xkcd -> Maybe String
getTranscript (Xkcd xkcd) =
    xkcd.transcript


getComicUrl : Xkcd -> Url
getComicUrl (Xkcd xkcd) =
    { protocol = Url.Https
    , host = "xkcd.com"
    , port_ = Nothing
    , path = "/" ++ String.fromInt xkcd.id
    , query = Nothing
    , fragment = Nothing
    }


getExplainUrl : Xkcd -> Url
getExplainUrl (Xkcd xkcd) =
    { protocol = Url.Https
    , host = "www.explainxkcd.com"
    , port_ = Nothing
    , path = "/wiki/index.php/" ++ String.fromInt xkcd.id
    , query = Nothing
    , fragment = Nothing
    }



-- METHODS


fetchRelevantIds : String -> Task String (List XkcdId)
fetchRelevantIds query =
    Http.task
        { method = "GET"
        , headers = []
        , url = Url.toString (queryUrl query)
        , body = Http.emptyBody
        , resolver =
            Http.stringResolver
                (\response ->
                    case response of
                        Http.GoodStatus_ _ body ->
                            parseResponse body

                        _ ->
                            Err "Error fetching xkcd."
                )
        , timeout = Nothing
        }


parseResponse : String -> Result String (List XkcdId)
parseResponse body =
    let
        dropFromEnd amount list =
            List.take (List.length list - amount) list
    in
    String.lines body
        -- The first two entries are statistics.
        |> List.drop 2
        |> dropFromEnd 1
        |> List.map parseXkcdId
        |> List.foldl
            (\result list ->
                Result.map2 (\xkcd existing -> existing ++ [ xkcd ]) result list
            )
            (Ok [])


type alias XkcdId =
    Int


parseXkcdId : String -> Result String XkcdId
parseXkcdId line =
    case String.words line of
        idString :: urlString :: [] ->
            case String.toInt idString of
                Just id ->
                    Ok id

                _ ->
                    Err "Malformed line. Could not convert id."

        malformed ->
            Err <| "Malformed line. Expected 2 fields, got " ++ (List.length malformed |> String.fromInt) ++ "."


queryUrl : String -> Url
queryUrl query =
    { protocol = Url.Https
    , host = "relevantxkcd.appspot.com"
    , port_ = Nothing
    , path = "/process"
    , query = Just ("action=xkcd&query=" ++ query)
    , fragment = Nothing
    }


fetchXkcds : List XkcdId -> Task String (List Xkcd)
fetchXkcds ids =
    Task.sequence (List.map fetchXkcd ids)


fetchXkcd : XkcdId -> Task String Xkcd
fetchXkcd id =
    Http.task
        { method = "GET"
        , headers = []
        , url = Url.toString (xkcdInfoUrl id)
        , body = Http.emptyBody
        , resolver =
            Http.stringResolver
                (\response ->
                    let
                        genericError =
                            Err ("Error fetching xkcd with id " ++ String.fromInt id ++ ".")
                    in
                    case response of
                        Http.GoodStatus_ _ res ->
                            parseXkcd res

                        Http.BadStatus_ { statusCode } _ ->
                            if statusCode == 404 then
                                Err ("#" ++ String.fromInt id ++ " is not yet released.")

                            else
                                genericError

                        _ ->
                            genericError
                )
        , timeout = Nothing
        }


xkcdInfoUrl : XkcdId -> Url
xkcdInfoUrl id =
    { protocol = Url.Https
    , host = "xkcd.com"
    , port_ = Nothing
    , path = "/" ++ String.fromInt id ++ "/info.0.json"
    , query = Nothing
    , fragment = Nothing
    }


fetchCurrentXkcd : Task String Xkcd
fetchCurrentXkcd =
    Http.task
        { method = "GET"
        , headers = []
        , url = Url.toString currentXkcdInfoUrl
        , body = Http.emptyBody
        , resolver =
            Http.stringResolver
                (\response ->
                    case response of
                        Http.GoodStatus_ _ res ->
                            parseXkcd res

                        _ ->
                            Err "Error fetching current xkcd."
                )
        , timeout = Nothing
        }


fetchLatestXkcds : { amount : Int, offset : Int } -> Task String (List Xkcd)
fetchLatestXkcds { amount, offset } =
    fetchCurrentXkcd
        |> Task.andThen
            (\currentXkcd ->
                let
                    latestId =
                        getId currentXkcd

                    maxId =
                        latestId - offset

                    minId =
                        max 0 (maxId - amount)
                in
                List.range minId maxId
                    |> List.reverse
                    |> List.map fetchXkcd
                    |> Task.sequence
                    |> Task.map
                        (\xkcds ->
                            xkcds
                        )
            )


parseXkcd : String -> Result String Xkcd
parseXkcd raw =
    let
        decodeUrl =
            Decode.string
                |> Decode.andThen
                    (\urlString ->
                        case Url.fromString urlString of
                            Just url ->
                                Decode.succeed url

                            Nothing ->
                                Decode.fail ("Invalid url '" ++ urlString ++ "'.")
                    )

        decodeTranscript =
            Decode.string
                |> Decode.map
                    (\transcript ->
                        if String.isEmpty transcript then
                            Nothing

                        else
                            Just transcript
                    )
    in
    Decode.decodeString
        (Decode.map5
            XkcdContent
            (Decode.field "num" Decode.int)
            (Decode.field "img" decodeUrl)
            (Decode.field "title" Decode.string)
            (Decode.field "alt" Decode.string)
            (Decode.field "transcript" decodeTranscript)
        )
        raw
        |> Result.map Xkcd
        |> Result.mapError Decode.errorToString


currentXkcdInfoUrl : Url
currentXkcdInfoUrl =
    { protocol = Url.Https
    , host = "xkcd.com"
    , port_ = Nothing
    , path = "/info.0.json"
    , query = Nothing
    , fragment = Nothing
    }
