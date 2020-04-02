port module Main exposing (..)

import Browser
import Dict exposing (Dict)
import File exposing (File)
import File.Select as Select
import Html exposing (Html, a, button, div, h1, img, p, span, text)
import Html.Attributes exposing (class, href, id, src, target, type_)
import Html.Events exposing (onClick)
import Json.Decode as JsonDecode
import Json.Encode as JsonEncode
import Task



---- MODEL ----


type alias Model =
    { imagePath : Maybe String, generatedImage : Maybe String }


init : ( Model, Cmd Msg )
init =
    ( { imagePath = Nothing, generatedImage = Nothing }, Cmd.none )



---- UPDATE ----


type alias CanvasParams =
    { imagePath : String
    , canvasContainerId : String
    }


type Msg
    = NoOp
    | PickImage
    | GotFile File (List File)
    | GotImagePath String
    | ClearImage
    | RotateImage
    | ZoomIn
    | ZoomOut
    | GenerateImage
    | GeneratedImage String
    | ClearGeneratedImage


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
            ( { model | imagePath = Just imagePath }, setupCanvas (CanvasParams imagePath canvasContainerId) )

        ClearImage ->
            ( { model | imagePath = Nothing }, Cmd.none )

        ClearGeneratedImage ->
            ( { model | generatedImage = Nothing }, Cmd.none )

        RotateImage ->
            ( model, rotateImage () )

        ZoomIn ->
            ( model, zoomIn () )

        ZoomOut ->
            ( model, zoomOut () )

        GenerateImage ->
            ( model, generateImage () )

        GeneratedImage dataUrl ->
            ( { model | generatedImage = Just dataUrl }, Cmd.none )

        NoOp ->
            ( model, Cmd.none )


port setupCanvas : CanvasParams -> Cmd msg


port rotateImage : () -> Cmd msg


port zoomIn : () -> Cmd msg


port zoomOut : () -> Cmd msg


port generateImage : () -> Cmd msg


port generatedImage : (String -> msg) -> Sub msg


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
                    viewEditorPage model imagePath

                Nothing ->
                    viewImageSelectionPage model
    in
    div [ id "app-container" ]
        [ h1 [] [ text "Cry Baby \u{1F97A}" ]
        , div [ id "page-container" ] [ page ]
        ]


canvasContainerId : String
canvasContainerId =
    "canvas-container"


viewEditorPage : Model -> String -> Html Msg
viewEditorPage model imagePath =
    div [ id "editor-page" ]
        [ div
            [ id "editor-controls-container" ]
            [ button [ class "editor-control", onClick ClearImage ] [ text "clear" ]
            , button [ class "editor-control", onClick RotateImage ] [ text "rotate" ]
            , button [ class "editor-control no-mobile", onClick ZoomIn ] [ text "zoom +" ]
            , button [ class "editor-control no-mobile", onClick ZoomOut ] [ text "zoom -" ]
            , button [ class "editor-control", onClick GenerateImage ] [ text "generate" ]
            ]
        , div [ id canvasContainerId ]
            []
        , div
            [ id "editor-controls-container" ]
            [ a [ href "https://github.com/MainShayne233/cry_baby", target "_blank" ] [ button [ class "editor-control" ] [ text "view code" ] ]
            ]
        , maybeRenderResultModal model
        ]


maybeRenderResultModal : Model -> Html Msg
maybeRenderResultModal model =
    case model.generatedImage of
        Just generatedImagePath ->
            div [ id "resultModal", class "modal" ]
                [ div [ class "modal-content" ]
                    [ span [ class "close", onClick ClearGeneratedImage ] [ text "x" ]
                    , img [ src generatedImagePath, id "result" ] []
                    ]
                ]

        Nothing ->
            div [] []


viewImageSelectionPage : Model -> Html Msg
viewImageSelectionPage model =
    div [ id "image-selection-page" ]
        [ div [ id "image-selection-controls" ]
            [ div []
                [ button [ onClick PickImage ] [ text "Upload Image" ]
                ]
            , div [] [ text "Or" ]
            , div []
                [ button [ onClick (GotImagePath exampleImagePath) ] [ text "Use Example" ]
                ]
            ]
        ]



---- DECODERS ----
---- PROGRAM ----


subscriptions : Model -> Sub Msg
subscriptions _ =
    generatedImage GeneratedImage


main : Program () Model Msg
main =
    Browser.element
        { view = view
        , init = \_ -> init
        , update = update
        , subscriptions = subscriptions
        }
