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

const setupCanvas = (container, imagePath) => {
  const stage = new Konva.Stage({
    container: container,
    width: getEditorWidth(),
    height: getEditorHeight()
  });

  const layer = new Konva.Layer();

  stage.add(layer);

  fetch(imagePath).then(res => {
    if (res.ok) {
      const imageObj = new Image();
      imageObj.onload = () => {
        const { width, height } = (() => {
          if (imageObj.width > imageObj.height) {
            const ratio = imageObj.height / imageObj.width;
            return {
              width: getEditorWidth(),
              height: getEditorWidth() * ratio
            };
          } else {
            const ratio = imageObj.width / imageObj.height;
            return {
              width: getEditorHeight() * ratio,
              height: getEditorHeight()
            };
          }
        })();
        const image = new Konva.Image({
          image: imageObj,
          width,
          height
        });

        console.log({ width, height });
        stage.width(width);
        stage.height(height);

        window.image = image;

        image.label = "subject";
        // add the shape to the layer
        layer.add(image);
        layer.batchDraw();
      };
      imageObj.src = imagePath;

      layer.draw();
    } else {
      console.error("HANDLE ME");
    }
  });

  stage.on("click tap", function(e) {
    if (e.target === stage) {
      stage.find("Transformer").destroy();
      layer.draw();
      return;
    } else if (e.target.label === "eye") {
      stage.find("Transformer").destroy();
      const tr = new Konva.Transformer();
      layer.add(tr);
      tr.attachTo(e.target);
      layer.draw();
    }
  });

  return stage;
};

const App = () => {
  const [imagePath, setImagePath] = useState(Option.none);
  const [urlInput, setUrlInput] = useState("");
  const canvasContainer = useRef(null);
  const instances = useInstance({});
  useEffect(() => {
    if (canvasContainer.current) {
      instances.stage = Option.fold(
        () => null,
        imagePath => setupCanvas(canvasContainer.current, imagePath)
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
        </div>
        <div style={styles.editor}>
          <div id="canvas-container" ref={canvasContainer}></div>
        </div>
      </div>
    )
  )(imagePath);
};

export default App;
