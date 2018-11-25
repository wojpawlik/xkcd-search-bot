module TestElmegram exposing (suite)

import Elmegram
import Expect exposing (Expectation)
import Fuzz exposing (..)
import Telegram.Test as TeleTest
import Test exposing (..)


suite : Test
suite =
    describe "Elmegram"
        [ describe "containsCommand"
            [ test "detects command" <|
                \_ ->
                    let
                        message =
                            TeleTest.makeMessage "detect this /command"
                    in
                    Elmegram.containsCommand message
                        |> Expect.true
                            ("Exptected to find command 'command' in '" ++ message.text ++ "'.")
            , test "signals no command" <|
                \_ ->
                    let
                        message =
                            TeleTest.makeMessage "i contain no commands"
                    in
                    Elmegram.containsCommand message
                        |> Expect.false
                            ("Expected to not find commands in '" ++ message.text ++ "'.")
            ]
        , describe "matchesCommand"
            [ test "detects exising command" <|
                \_ ->
                    let
                        message =
                            TeleTest.makeMessage "detect /me"
                    in
                    Elmegram.matchesCommand "me" message
                        |> Expect.true
                            ("Expected to find command 'me' in '" ++ message.text ++ "'.")
            , test "signals no command" <|
                \_ ->
                    let
                        message =
                            TeleTest.makeMessage "no commands"
                    in
                    Elmegram.matchesCommand "unfound" message
                        |> Expect.false
                            ("There was no command, but it found 'unfound' in " ++ message.text ++ "'.")
            , test "signals wrong command" <|
                \_ ->
                    let
                        message =
                            TeleTest.makeMessage "i have a /different command"
                    in
                    Elmegram.matchesCommand "unfound" message
                        |> Expect.false
                            ("Expected to not confuse command 'unfound' with 'different' in '" ++ message.text ++ "'.")
            ]
        , describe "getDisplayName"
            [ test "gives username, if all are specified" <|
                \_ ->
                    let
                        user =
                            TeleTest.makeUser
                    in
                    { user
                        | first_name = "Say my"
                        , last_name = Just "Username"
                        , username = Just "Heisenberg"
                    }
                        |> Elmegram.getDisplayName
                        |> Expect.equal "Heisenberg"
            , test "gives first and lastname, if no username" <|
                \_ ->
                    let
                        user =
                            TeleTest.makeUser
                    in
                    { user
                        | first_name = "Display"
                        , last_name = Just "Me"
                        , username = Nothing
                    }
                        |> Elmegram.getDisplayName
                        |> Expect.equal "Display Me"
            , test "gives first name, if no other name" <|
                \_ ->
                    let
                        user =
                            TeleTest.makeUser
                    in
                    { user
                        | first_name = "Shorty"
                        , last_name = Nothing
                        , username = Nothing
                    }
                        |> Elmegram.getDisplayName
                        |> Expect.equal "Shorty"
            ]
        ]
