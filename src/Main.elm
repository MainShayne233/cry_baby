module Main exposing (..)

import Browser
import File exposing (File)
import File.Select as Select
import Html exposing (Html, button, div, h1, img, p, text)
import Html.Attributes exposing (id, src, type_)
import Html.Events exposing (onClick)
import Json.Decode as JsonDecode
import Task



---- MODEL ----


type alias Model =
    { imagePath : Maybe String }


init : ( Model, Cmd Msg )
init =
    ( { imagePath = Nothing }, Cmd.none )



---- UPDATE ----


type Msg
    = NoOp
    | PickImage
    | GotFile File (List File)
    | GotImagePath String
    | UseExampleImage
    | ClearImage


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        PickImage ->
            ( model
            , Select.files [ "image/*" ] GotFile
            )

        GotFile file _ ->
            ( model
            , getFileUrl file
            )

        GotImagePath imagePath ->
            ( { model | imagePath = Just imagePath }, Cmd.none )

        UseExampleImage ->
            ( { model | imagePath = Just exampleImagePath }, Cmd.none )

        ClearImage ->
            ( { model | imagePath = Nothing }, Cmd.none )

        NoOp ->
            ( model, Cmd.none )


getFileUrl : File -> Cmd Msg
getFileUrl file =
    Task.perform GotImagePath (File.toUrl file)


exampleImagePath : String
exampleImagePath =
    "/example_1.jpg"



---- VIEW ----


view : Model -> Html Msg
view model =
    let
        page =
            case model.imagePath of
                Just imagePath ->
                    viewEditorPage imagePath

                Nothing ->
                    viewImageSelectionPage model
    in
    div [ id "app-container" ] [ page ]


viewEditorPage : String -> Html Msg
viewEditorPage imagePath =
    div []
        [ img [ src imagePath ] []
        , button [ onClick ClearImage ] [ text "Clear" ]
        ]


viewImageSelectionPage : Model -> Html Msg
viewImageSelectionPage model =
    div [ id "image-selection-page" ]
        [ h1 [] [ text "Cry Baby" ]
        , div [ id "image-selection-controls" ]
            [ div []
                [ button [ onClick PickImage ] [ text "Upload Image" ]
                ]
            , div [] [ text "Or" ]
            , div []
                [ button [ onClick UseExampleImage ] [ text "Use Example" ]
                ]
            ]
        ]



---- DECODERS ----
---- PROGRAM ----


main : Program () Model Msg
main =
    Browser.element
        { view = view
        , init = \_ -> init
        , update = update
        , subscriptions = always Sub.none
        }
