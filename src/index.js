import "./main.css";
import { Elm } from "./Main.elm";
import * as serviceWorker from "./serviceWorker";
import Konva from "konva";

const { ports } = Elm.Main.init({
  node: document.getElementById("root"),
});

ports.setupCanvas.subscribe(setupCanvas);

ports.rotateImage.subscribe(() => {
  window.editor.rotateImage();
});

ports.zoomIn.subscribe(() => {
  window.editor.zoomIn();
});

ports.zoomOut.subscribe(() => {
  window.editor.zoomOut();
});

const editorPadding = 8 / 10;

const getEditorWidth = () => window.innerWidth * editorPadding;

const getEditorHeight = () => window.innerHeight * editorPadding;

const zoomScales = [0.1, 0.25, 0.5, 1, 1.5, 2, 3];

const getNextUnlessLast = (values, value) => {
  const index = values.indexOf(value) + 1;
  return index === values.length ? value : values[index];
};

const getPreviousUnlessFirst = (values, value) => {
  const index = values.indexOf(value) - 1;
  return index === -1 ? value : values[index];
};

class Editor {
  constructor({ imagePath, container }, doneCallback) {
    this.imagePath = imagePath;
    this.container = container;
    this.zoom = 1;
    this.setupStage();
    this.setupLayer();
    this.addMainImage().then(this.render.bind(this)).then(doneCallback);
  }

  setupStage() {
    this.stage = new Konva.Stage({
      container: this.container,
      width: 500,
      height: 500,
    });
  }

  setupLayer() {
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
  }

  rotateImage() {
    this.mainImage.rotation((this.mainImage.rotation() + 90) % 360);
    this.configureMainImage();
    this.render();
  }

  zoomIn() {
    this.zoom = getNextUnlessLast(zoomScales, this.zoom);
    this.configureMainImage();
    this.render();
  }

  zoomOut() {
    this.zoom = getPreviousUnlessFirst(zoomScales, this.zoom);
    this.configureMainImage();
    this.render();
  }

  configureMainImage() {
    const [
      [canvasWidthDim, canvasWidthScale],
      [canvasHeightDim, canvasHeightScale],
    ] =
      this.mainImage.rotation() % 180 === 0
        ? [
            ["width", "scaleX"],
            ["height", "scaleY"],
          ]
        : [
            ["height", "scaleY"],
            ["width", "scaleX"],
          ];

    const canvasScale = Math.min(
      (getEditorWidth() / this.mainImage[canvasWidthDim]()) * this.zoom,
      (getEditorHeight() / this.mainImage[canvasHeightDim]()) * this.zoom
    );

    const renderDimensions = {
      width: this.mainImage[canvasWidthDim](),
      height: this.mainImage[canvasHeightDim](),
    };

    const canvasDimensions = {
      width: renderDimensions.width * canvasScale,
      height: renderDimensions.height * canvasScale,
    };

    const offset = {
      x: renderDimensions.width / 2,
      y: renderDimensions.height / 2,
    };

    const scaledDimensions = {
      width: renderDimensions.width * offset.x,
      height: renderDimensions.height * offset.y,
    };

    this.mainImage.scale({ x: canvasScale, y: canvasScale });

    this.mainImage.offsetX(this.mainImage.width() / 2);
    this.mainImage.offsetY(this.mainImage.height() / 2);
    this.mainImage.x(
      (this.mainImage[canvasWidthDim]() * this.mainImage[canvasWidthScale]()) /
        2
    );
    this.mainImage.y(
      (this.mainImage[canvasHeightDim]() * this.mainImage[canvasWidthScale]()) /
        2
    );
    this.stage.width(
      this.mainImage[canvasWidthDim]() * this.mainImage[canvasWidthScale]()
    );
    this.stage.height(
      this.mainImage[canvasHeightDim]() * this.mainImage[canvasHeightScale]()
    );
  }

  addMainImage() {
    return new Promise((res) => {
      this.addImage(this.imagePath, { preventDefault: false }).then((image) => {
        this.mainImage = image;
        this.configureMainImage();
        res();
      });
    });
  }

  addImage(path, options = {}) {
    return new Promise((res) => {
      const imageObj = new Image();
      imageObj.onload = () => {
        const image = new Konva.Image({
          image: imageObj,
          ...options,
        });

        this.layer.add(image);
        res(image);
      };

      imageObj.src = this.imagePath;
    });
  }

  render() {
    this.layer.batchDraw();
  }
}

function setupCanvas(params) {
  document.getElementById("page-container").style.display = "none";
  const { imagePath, canvasContainerId } = params;
  const container = document.getElementById(canvasContainerId);
  if (!container) {
    setTimeout(setupCanvas.bind(null, params), 50);
  } else {
    window.editor = new Editor({ imagePath, container }, () => {
      document.getElementById("page-container").style.display = "block";
    });
  }
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note const comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
