import "./main.css";
import { Elm } from "./Main.elm";
import * as serviceWorker from "./serviceWorker";
import Konva from "konva";

const EYE_IMAGE_PATHS = ["/eye_1.png", "/eye_2.png"];

const app = Elm.Main.init({
  node: document.getElementById("root"),
});

const { ports } = app;

ports.setupCanvas.subscribe(setupCanvas);

ports.rotateImage.subscribe(() => {
  window.editor.rotateImage();
});

ports.resetEyes.subscribe(() => {
  window.editor.resetEyes();
});

ports.generateImage.subscribe(() => {
  const dataUrl = window.editor.generateDataUrl();
  ports.generatedImage.send(dataUrl);
});

const editorPadding = 8 / 10;

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;
const getEditorWidth = () => windowWidth * editorPadding;
const getEditorHeight = () => windowHeight * editorPadding;

class Editor {
  constructor({ imagePath, container }, doneCallback) {
    this.imagePath = imagePath;
    this.container = container;
    this.setupStage();
    this.setupLayer();
    this.addMainImage()
      .then(this.addEyeImages.bind(this))
      .then(this.setupTransformer.bind(this))
      .then(this.render.bind(this))
      .then(doneCallback);
  }

  addEyeImages() {
    return this.addImage(EYE_IMAGE_PATHS[0], {
      draggable: true,
      x: 50,
      y: 50,
      scale: { x: 0.4, y: 0.4 },
    })
      .then(
        this.addImage.bind(this, EYE_IMAGE_PATHS[1], {
          draggable: true,
          x: 200,
          y: 50,
          scale: { x: 0.4, y: 0.4 },
        })
      )
      .then(
        () =>
          new Promise((res) => {
            this.getEyeImages().forEach((eyeImage) => {
              const tr = new Konva.Transformer({ padding: 5 });
              this.layer.add(tr);
              tr.attachTo(eyeImage);
            });
            res();
          })
      );
  }

  getEyeImages() {
    return this.layer
      .getChildren()
      .toArray()
      .filter((eyeImage) => eyeImage !== this.mainImage);
  }

  setupTransformer() {
    return new Promise((res) => {
      this.stage.on("click tap dragstart", (e) => {
        if (e.target === this.stage) {
          this.destroyTransformers();
          this.layer.draw();
          return;
        }

        this.destroyTransformers();

        if (e.target.draggable()) {
          const tr = new Konva.Transformer({ padding: 5 });
          this.layer.add(tr);
          tr.attachTo(e.target);
        }

        this.layer.draw();
      });

      res();
    });
  }

  destroyTransformers() {
    this.forEachTransformer((transformer) => {
      transformer.destroy();
    });
  }

  forEachTransformer(func) {
    this.stage
      .find("Transformer")
      .toArray()
      .forEach((transformer) => {
        func(transformer);
      });
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

  resetEyes() {
    this.getEyeImages().forEach((eyeImage) => {
      eyeImage.destroy();
    });
    this.addEyeImages().then(this.render.bind(this));
  }

  generateDataUrl() {
    this.destroyTransformers();
    this.render();
    const pixelRatio =
      1 / Math.min(this.mainImage.scaleX(), this.mainImage.scaleY());
    const dataUrl = this.stage.toDataURL({
      pixelRatio,
    });

    return dataUrl;
  }

  configureMainImage() {
    this.destroyTransformers();
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
      getEditorWidth() / this.mainImage[canvasWidthDim](),
      getEditorHeight() / this.mainImage[canvasHeightDim]()
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
    return this.addImage(this.imagePath, { preventDefault: false }).then(
      (image) => {
        this.mainImage = image;
        this.configureMainImage();
      }
    );
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

      imageObj.src = path;
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
