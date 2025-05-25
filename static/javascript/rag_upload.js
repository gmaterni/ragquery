/** @format */

"use strict";

const RagUpload = {
  open() {
    const htmlContent = `
      <div class="window-text">
        <div class="btn-wrapper">
          <button class="btn-close" title="chiudi" onclick="UaWindowAdm.closeThis(this)">X</button>
        </div>
        <div class="upload">
          <h4>Upload file Text / PDF / DOCX</h4>
          <form id="uploadForm">
              <input class="file" type="file" id="id_fileupload" >
              <button type="button" onclick="RagUpload.upload();">Upload and Convert</button>
          </form>
          <div id="result" class="result"></div>
        </div>
      </div>
    `;
    const uploadWindow = UaWindowAdm.create("id_upload");
    uploadWindow.drag();
    uploadWindow.setZ(12);
    uploadWindow.vw_vh().setXY(16.5, 10, -1);
    uploadWindow.setHtml(htmlContent);
    uploadWindow.show();
  },
  async upload() {
    const fileInput = document.getElementById("id_fileupload");
    const file = fileInput.files[0];
    if (!file) {
      alert("Nessun file selezionato.");
      return;
    }
    const fileName = file.name;
    const exist = DataMgr.doc_names.includes(fileName);
    if (exist) {
      alert("Il file è già in archivio");
      return;
    }

    const result = document.getElementById("result");
    const fileExtension = file.name.split(".").pop().toLowerCase();
    showSpinner();
    try {
      let text;
      if (fileExtension === "pdf") {
        const pdfHandler = new PdfHandler();
        await pdfHandler.loadPdfJs();
        text = await pdfHandler.extractTextFromPDF(file);
        pdfHandler.cleanup();
      } else if (fileExtension === "txt") {
        text = await readTextFile(file);
      } else if (fileExtension === "docx") {
        const docxHandler = new DocxHandler();
        await docxHandler.loadMammoth();
        text = await docxHandler.extractTextFromDocx(file);
        docxHandler.cleanup();
      } else {
        alert("Formato file non supportato.");
        return;
      }
      DataMgr.addDoc(fileName, text);
      const msg = `<br><br> ${fileName}<br><br>caricato e salvato nella memoria locale`;
      result.innerHTML = msg;
    } catch (error) {
      console.error("Error:", error);
      alert("Errore durante l'estrazione del testo dal file.");
    } finally {
      hideSpinner();
    }
  },
  openDir() {
    const htmlContent = `
      <div class="window-text">
        <div class="btn-wrapper">
          <button class="btn-close" title="chiudi" onclick="UaWindowAdm.closeThis(this)">X</button>
        </div>
        <div class="upload">
          <h4>Upload files Text / PDF / DOCX</h4>
          <form id="uploadForm">
              <input id="id_fileupload" class="file" type="file"  webkitdirectory mozdirectory msdirectory odirectory directory multiple />
              <button type="button" onclick="RagUpload.uploadDir();">Upload and Convert</button>
          </form>
          <div class="result" id="result"></div>
        </div>
      </div>
    `;
    const uploadWindow = UaWindowAdm.create("id_upload");
    uploadWindow.drag();
    uploadWindow.setZ(12);
    uploadWindow.vw_vh().setXY(16.5, 10, -1);
    uploadWindow.setHtml(htmlContent);
    uploadWindow.show();
  },

  async uploadDir() {
    const fileInput = document.getElementById("id_fileupload");
    const files = fileInput.files;

    if (!files || files.length == 0) {
      alert("Nessun file selezionato.");
      return;
    }
    const msgs = [];

    showSpinner();

    try {
      for (const file of files) {
        const fileName = file.name;
        UaLog.log_show(fileName);
        const exist = DataMgr.doc_names.includes(fileName);
        if (exist) {
          UaLog.log_show(fileName + " : è già in archivio");
          continue;
        }
        const fileExtension = file.name.split(".").pop().toLowerCase();
        let text;
        if (fileExtension === "pdf") {
          const pdfHandler = new PdfHandler();
          await pdfHandler.loadPdfJs();
          text = await pdfHandler.extractTextFromPDF(file);
          pdfHandler.cleanup();
        } else if (fileExtension === "txt") {
          text = await readTextFile(file);
        } else if (fileExtension === "docx") {
          const docxHandler = new DocxHandler();
          await docxHandler.loadMammoth();
          text = await docxHandler.extractTextFromDocx(file);
          docxHandler.cleanup();
        } else {
          alert("Formato file non supportato.");
          return;
        }
        DataMgr.addDoc(fileName, text);
        const msg = `${fileName}`;
        msgs.push(msg);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Errore durante l'estrazione del testo dal file.");
    } finally {
      hideSpinner();
    }

    const result = document.getElementById("result");
    const msg = msgs.join("<br>");
    result.innerHTML = msg;
  },
};

class PdfHandler {
  constructor() {
    this.pdfjsLib = null;
    this.scriptElement = null;
    this.workerScriptElement = null;
  }

  async loadPdfJs() {
    if (window["pdfjsLib"]) {
      this.pdfjsLib = window["pdfjs-dist/build/pdf"];
      this.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js";
      return;
    }
    // Carica pdf.js dinamicamente
    this.scriptElement = document.createElement("script");
    this.scriptElement.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js";
    document.body.appendChild(this.scriptElement);

    // Aspetta che il worker sia caricato
    await new Promise((resolve) => {
      this.scriptElement.onload = () => {
        this.workerScriptElement = document.createElement("script");
        this.workerScriptElement.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js";
        document.body.appendChild(this.workerScriptElement);
        this.workerScriptElement.onload = resolve;
      };
    });

    this.pdfjsLib = window["pdfjs-dist/build/pdf"];
    this.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js";
  }

  async extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await this.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      text += pageText + "\n";
    }
    return text;
  }

  cleanup() {
    if (this.scriptElement) {
      document.body.removeChild(this.scriptElement);
      this.scriptElement = null;
    }
    if (this.workerScriptElement) {
      document.body.removeChild(this.workerScriptElement);
      this.workerScriptElement = null;
    }
    this.pdfjsLib = null;
    if (window.gc) {
      window.gc();
    }
  }
}

class DocxHandler {
  constructor() {
    this.mammoth = null;
    this.scriptElement = null;
  }

  async loadMammoth() {
    if (window["mammoth"]) {
      this.mammoth = window["mammoth"];
      return;
    }
    // Carica mammoth dinamicamente
    this.scriptElement = document.createElement("script");
    this.scriptElement.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.11/mammoth.browser.min.js";
    document.body.appendChild(this.scriptElement);

    // Aspetta che mammoth sia caricato
    await new Promise((resolve) => {
      this.scriptElement.onload = () => {
        this.mammoth = window["mammoth"];
        resolve();
      };
    });
  }

  async extractTextFromDocx(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await this.mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  cleanup() {
    if (this.scriptElement) {
      document.body.removeChild(this.scriptElement);
      this.scriptElement = null;
    }
    this.mammoth = null;
    if (window.gc) {
      window.gc();
    }
  }
}

async function readTextFile(file) {
  if (!file || file.type !== "text/plain") {
    throw new Error("Invalid file type. Please select a text file.");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(new Error("Error reading file: " + error.message));
    reader.readAsText(file);
  });
}
