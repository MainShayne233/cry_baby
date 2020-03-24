import { FunctionalComponent } from "preact";
import { saveAs } from "file-saver";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((module as any).hot) {
    // tslint:disable-next-line:no-var-requires
    require("preact/debug");
}

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
    editor: {
        height: "600px",
        border: "solid",
        borderColor: "blue",
        width: "80%",
        height: (window.innerHeight * 6) / 8
    }
};

const getCanvasElement = () => document.getElementById("editor-canvas");

const getCanvasBlob = () =>
    new Promise(res => {
        getCanvasElement().toBlob(res);
    });

const downloadCanvas: () => void = () => {
    getCanvasBlob().then(blob => {
        saveAs(blob, "blob.png");
    });
};

const App: FunctionalComponent = () => (
    <div style={styles.app}>
        <div style={styles.controls}>
            <button onClick={downloadCanvas}>Download</button>
        </div>
        <div style={styles.editor}>
            <canvas id="editor-canvas" />
        </div>
    </div>
);

export default App;
