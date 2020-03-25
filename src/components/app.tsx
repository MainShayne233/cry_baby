import { FunctionalComponent, useEffect, useRef, useState } from "preact/hooks";
import Konva from "konva";
import useInstance from "@use-it/instance";
import * as Option from "fp-ts/lib/Option";

const LEO_PATH = "/assets/leo.jpg";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (module.hot) {
  // tslint:disable-next-line:no-var-requires
  require("preact/debug");
}

const downloadBlob = (blob, name) => {
  const link = document.createElement("a");
  link.download = name;
  link.href = blob;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getEditorWidth = () => window.innerWidth * 0.8;

const getEditorHeight = () => (window.innerHeight * 6) / 8;

const styles = {
  app: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  controls: {
    border: "solid",
    borderColor: "red",
    height: (window.innerHeight * 1) / 8,
    width: "80%"
  },
  editor: {}
};

const getCanvasElement = () => document.getElementById("editor-canvas");

const getCanvasBlob = () =>
  new Promise(res => {
    getCanvasElement().toBlob(res);
  });

const downloadCanvas = () => {
  getCanvasBlob().then(blob => {
    saveAs(blob, "blob.png");
  });
};

const addImage = (
  stage,
  layer,
  imagePath,
  options = { rotation: 0, draggable: false }
) =>
  new Promise((res, rej) => {
    fetch(imagePath).then(response => {
      if (response.ok) {
        const imageObj = new Image();
        imageObj.onload = () => {
          const {
            imageWidth,
            imageHeight,
            canvasWidth,
            canvasHeight
          } = (() => {
            const { imageWidth, imageHeight } = (() => {
              if (imageObj.width > imageObj.height) {
                const base =
                  options.rotation % 180 === 0
                    ? options.scale.width
                    : options.scale.height;
                const ratio = imageObj.height / imageObj.width;
                return { imageWidth: base, imageHeight: base * ratio };
              } else {
                const base =
                  options.rotation % 180 === 0
                    ? options.scale.height
                    : options.scale.width;
                const ratio = imageObj.width / imageObj.height;
                return { imageWidth: base * ratio, imageHeight: base };
              }
            })();

            if (options.rotation % 180 === 0) {
              return {
                imageWidth,
                imageHeight,
                canvasWidth: imageWidth,
                canvasHeight: imageHeight
              };
            } else {
              return {
                imageWidth,
                imageHeight,
                canvasWidth: imageHeight,
                canvasHeight: imageWidth
              };
            }
          })();

          const image = new Konva.Image({
            image: imageObj,
            width: imageWidth,
            height: imageHeight,
            offsetX: imageWidth / 2,
            offsetY: imageHeight / 2,
            x: canvasWidth / 2 + options.position.x,
            y: canvasHeight / 2 + options.position.y,
            draggable: options.draggable
          });

          image.rotate(options.rotation);

          layer.add(image);
          layer.batchDraw();
          res(image);
        };
        imageObj.src = imagePath;

        layer.draw();
      } else {
        console.error("HANDLE ME");
      }
    });
  });

const setupCanvas = (container, imagePath, rotation) => {
  const stage = new Konva.Stage({
    container: container,
    width: getEditorWidth(),
    height: getEditorHeight()
  });

  const layer = new Konva.Layer();

  stage.add(layer);

  addImage(stage, layer, imagePath, {
    rotation,
    position: { x: 0, y: 0 },
    scale: { width: getEditorWidth(), height: getEditorHeight() }
  }).then(image => {
    stage.width(image.attrs.x * 2);
    stage.height(image.attrs.y * 2);
    addImage(stage, layer, "/assets/eye_1.png", {
      draggable: true,
      rotation: 0,
      position: { x: image.attrs.x - 100, y: image.attrs.y },
      scale: { width: 100, height: 100 }
    });
    addImage(stage, layer, "/assets/eye_2.png", {
      draggable: true,
      rotation: 0,
      position: { x: image.attrs.x + 100, y: image.attrs.y },
      scale: { width: 100, height: 100 }
    });
  });

  stage.on("click tap", function(e) {
    if (e.target === stage) {
      stage.find("Transformer").destroy();
      layer.draw();
      return;
    }

    stage.find("Transformer").destroy();

    if (e.target.draggable()) {
      const tr = new Konva.Transformer();
      layer.add(tr);
      tr.attachTo(e.target);
    }

    layer.draw();
  });

  return stage;
};

const App = () => {
  const [imagePath, setImagePath] = useState(Option.none);
  const [urlInput, setUrlInput] = useState("");
  const [rotation, setRotation] = useState(0);
  const canvasContainer = useRef(null);
  const instances = useInstance({});
  useEffect(() => {
    if (canvasContainer.current) {
      instances.stage = Option.fold(
        () => null,
        imagePath => setupCanvas(canvasContainer.current, imagePath, rotation)
      )(imagePath);
    }
  });

  return Option.fold(
    () => (
      <div>
        <input
          value={urlInput}
          onChange={event => {
            setUrlInput(event.target.value);
          }}
        />
        <button
          onClick={() => {
            if (urlInput.length) {
              setImagePath(Option.some(urlInput));
              setUrlInput("");
            }
          }}
        >
          From URL
        </button>
        <input
          type="file"
          onChange={event => {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = ({ target }) => {
              const data = target.result;
              setImagePath(Option.some(data));
            };
            reader.readAsDataURL(file);
          }}
        />
        <button
          onClick={() => {
            setImagePath(Option.some(LEO_PATH));
          }}
        >
          Use Example
        </button>
      </div>
    ),
    imagePath => (
      <div style={styles.app}>
        <div style={styles.controls}>
          <button
            onClick={() => {
              const blob = instances.stage.toDataURL();
              downloadBlob(blob, "blob.png");
            }}
          >
            Download
          </button>
          <button
            onClick={() => {
              setRotation((rotation + 90) % 360);
            }}
          >
            Rotate
          </button>
          <button
            onClick={() => {
              setImagePath(Option.none);
            }}
          >
            Clear
          </button>
        </div>
        <div style={styles.editor}>
          <div id="canvas-container" ref={canvasContainer}></div>
        </div>
      </div>
    )
  )(imagePath);
};

export default App;
