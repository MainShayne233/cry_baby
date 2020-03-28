import Konva from "konva";

// TYPES

interface ElementLookup {
  [key: string]: HTMLElement;
}

enum PageID {
  ImageSelection = "image-selection-page",
  Editor = "editor-page",
}

type EventNode = {
  elementId: string;
  event: string;
  listener: EventListener;
};

// UTILS

const htmlCollectionToArray = (collection: HTMLCollection) =>
  Array.prototype.slice.call(collection);

const getEditorWidth = () => window.innerWidth * 0.8;

const getEditorHeight = () => (window.innerHeight * 6) / 8;

// CLASSES

abstract class Page {
  private id_: string;
  private eventNodes_: Array<EventNode>;

  constructor(id: string, eventNodes: Array<EventNode>) {
    this.id_ = id;
    this.eventNodes_ = eventNodes;
    document.title = this.id();
    this.render();
    this.setupEvents();
  }

  id() {
    return this.id_;
  }

  setupEvents() {
    this.eventNodes_.forEach(({ elementId, event, listener }) => {
      this.elements()[elementId].addEventListener(event, listener);
    });
  }

  removeEvents() {
    this.eventNodes_.forEach(({ elementId, event, listener }) => {
      this.elements()[elementId].removeEventListener(event, listener);
    });
  }

  cleanUp() {
    this.removeEvents();
  }

  render() {
    this.allPageContainers().forEach((container: HTMLElement) => {
      container.style.display = container.id === this.id() ? "flex" : "none";
    });
  }

  allPageContainers() {
    return htmlCollectionToArray(document.getElementsByClassName("page"));
  }

  elements() {
    return Array.prototype.slice
      .call(document.getElementsByClassName("interactable"))
      .reduce(
        (acc: ElementLookup, elem: HTMLElement) => ({
          ...acc,
          [elem.id]: elem,
        }),
        {}
      );
  }
}

class ImageSelectionPage extends Page {
  private nextCallback: (imagePath: string) => void;

  constructor(nextCallback: (imagePath: string) => void) {
    super(PageID.ImageSelection, [
      {
        elementId: "fromURLButton",
        event: "click",
        listener: () => {
          const path = this.elements().urlInput.value;
          this.validateAndSetImage(path);
        },
      },
      {
        elementId: "fromExampleButton",
        event: "click",
        listener: () => {
          this.validateAndSetImage(this.getExampleImagePath());
        },
      },
    ]);
    this.nextCallback = nextCallback;
  }

  getExampleImagePath() {
    return "/img/leo.jpg";
  }

  validateAndSetImage(path: string) {
    fetch(path)
      .then((response) => {
        if (response.ok === false) {
          throw new Error("Bad HTTP response");
        }
      })
      .then(() => {
        this.nextCallback(path);
      })
      .catch((error) => {
        console.error("unhandled image validation error", error);
      });
  }
}

class EditorPage extends Page {
  private imagePath: string;

  constructor(imagePath: string, backCallback: () => void) {
    super(PageID.Editor, [
      {
        elementId: "clearButton",
        event: "click",
        listener: backCallback,
      },
    ]);
    this.imagePath = imagePath;
    this.setupCanvas();
  }

  setupCanvas() {
    const stage = new Konva.Stage({
      container: this.elements().canvasContainer,
      width: getEditorWidth(),
      height: getEditorHeight(),
    });

    const layer = new Konva.Layer();

    stage.add(layer);
  }
}

class App {
  private page: Page;

  constructor() {
    this.setImageSelectionPage();
  }

  setImageSelectionPage() {
    this.setPage(new ImageSelectionPage(this.setEditorPage.bind(this)));
  }

  setEditorPage(imagePath: string) {
    this.setPage(
      new EditorPage(imagePath, this.setImageSelectionPage.bind(this))
    );
  }

  setPage(page: Page) {
    if (this.page) {
      this.page.cleanUp();
      delete this.page;
    }
    this.page = page;
  }
}

function main() {
  new App();
}

main();
