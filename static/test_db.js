/** @format */
"use strict";

import { DATA_KEYS } from "./js/services/data_keys.js";
import { UaDb } from "./js/services/uadb.js";
import { idbMgr } from "./js/services/idb_mgr.js";
import { DocsMgr } from "./js/services/docs_mgr.js";

// --- UI Elements ---
let outputDisplay;

// --- Utility Functions ---
const displayOutput = (title, content) => {
  if (!outputDisplay) outputDisplay = document.getElementById("output-display");
  let formattedContent;
  if (typeof content === 'object' && content !== null) {
    formattedContent = JSON.stringify(content, null, 2);
  } else if (content !== undefined && content !== null && content !== '') {
    formattedContent = String(content);
  } else {
    formattedContent = "(vuoto o non trovato)";
  }
  outputDisplay.innerHTML = `<h2>${title}</h2><pre>${formattedContent}</pre>`;
};

const clearOutput = () => {
  if (!outputDisplay) outputDisplay = document.getElementById("output-display");
  outputDisplay.innerHTML = `<pre>(Pronto per eseguire i test)</pre>`;
}

const testShowAllLocalStorage = () => {
  const allIds = UaDb.getAllIds();
  let content = "Contenuto completo del LocalStorage:\n\n";
  allIds.forEach(id => {
    const value = UaDb.read(id);
    content += "------------------------------\n";
    content += `CHIAVE: ${id}\n`;
    content += "------------------------------\n";
    content += `${value}\n\n`;
  });
  displayOutput("LocalStorage Dump", content);
};

// --- Test Functions ---

const testAddDoc = () => {
  const docName = `doc_${Date.now()}.txt`;
  const docContent = `Questo è il contenuto del documento di test generato alle ${new Date().toLocaleTimeString()}.`;
  DocsMgr.add(docName, docContent);
  displayOutput("Aggiungi Documento", `Documento "${docName}" aggiunto.\n\nChiama "Leggi Tutti i Documenti" per verificare.`);
};

const testReadDocs = () => {
  const names = DocsMgr.names();
  const result = {
    nomi_documenti: names,
    contenuti: names.map(name => (DocsMgr.read(name) || "").substring(0, 100) + '...') // Tronca per leggibilità
  };
  displayOutput("Elenco Documenti", result);
};

const testDeleteDoc = () => {
  const names = DocsMgr.names();
  if (names.length === 0) {
    displayOutput("Cancella Documento", "Nessun documento da cancellare.");
    return;
  }
  const docNameToDelete = names[0];
  DocsMgr.delete(docNameToDelete);
  displayOutput("Cancella Documento", `Documento "${docNameToDelete}" cancellato.\n\nChiama \"Leggi Tutti i Documenti\" per verificare.`);
};

const testDeleteAllDocs = () => {
  if (confirm("Sei sicuro di voler cancellare TUTTI i documenti?")) {
    DocsMgr.deleteAll();
    displayOutput("Cancella Tutti i Documenti", "Tutti i documenti sono stati cancellati.");
  }
};

const readKey = async (e) => {
  const { key, storage } = e.target.dataset;
  displayOutput(`Lettura: ${key}`, `Leggendo da ${storage}...`);
  try {
    let value;
    if (storage === "ls") {
      value = UaDb.read(key);
      try { value = JSON.parse(value); } catch (err) { /* not JSON */ }
    } else {
      value = await idbMgr.read(key);
    }
    displayOutput(`Valore di: ${key}`, value);
  } catch (error) {
    displayOutput(`Errore leggendo: ${key}`, error.message);
  }
};

const clearStorage = async (storageType) => {
  const targetName = storageType === 'ls' ? "LocalStorage (solo chiavi gestite)" : "IndexedDB";
  if (!confirm(`Sei sicuro di voler cancellare i dati da ${targetName}?`)) return;
  try {
    if (storageType === 'ls') {
      Object.values(DATA_KEYS).forEach(key => UaDb.delete(key));
      displayOutput("LocalStorage Pulito", "Tutte le chiavi gestite sono state rimosse.");
    } else {
      await idbMgr.clearAll();
      displayOutput("IndexedDB Pulito", "Il database è stato svuotato.");
    }
  } catch (error) {
    displayOutput(`Errore pulizia ${storageType}`, error.message);
  }
};

// --- UI Generation and Event Binding ---

const createButton = (text, handler, key = null, storage = null) => {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.addEventListener('click', handler);
  if (key) btn.dataset.key = key;
  if (storage) btn.dataset.storage = storage;
  return btn;
};

const renderUI = () => {
  const container = document.getElementById('controls-container');
  container.innerHTML = '';

  // Helper to add a section with a title and a div for buttons
  const addSection = (title) => {
    const section = document.createElement('section');
    const h2 = document.createElement('h2');
    h2.textContent = title;
    section.appendChild(h2);
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'controls-section';
    section.appendChild(controlsDiv);
    container.appendChild(section);
    return controlsDiv; // Return the div where buttons will be added
  };

  // --- General Controls ---
  const generalControls = addSection("Controlli Generali");
  generalControls.appendChild(createButton("Pulisci Output", clearOutput));
  generalControls.appendChild(createButton("Mostra Tutto il localStorage", testShowAllLocalStorage));

  // --- Document Management ---
  const docControls = addSection("Gestione Documenti (DocsMgr)");
  docControls.appendChild(createButton("Aggiungi Documento di Test", testAddDoc));
  docControls.appendChild(createButton("Leggi Tutti i Documenti", testReadDocs));
  docControls.appendChild(createButton("Cancella Primo Documento", testDeleteDoc));
  docControls.appendChild(createButton("Cancella Tutti i Documenti", testDeleteAllDocs));

  // --- Data Keys Testing ---
  const idbKeys = [DATA_KEYS.KEY_KNBASE, DATA_KEYS.KEY_CONTEXT, DATA_KEYS.KEY_THREAD, DATA_KEYS.KEY_KNBASE_PRE, DATA_KEYS.KEY_CONTEXT_PRE, DATA_KEYS.KEY_THREAD_PRE];
  const lsKeys = Object.values(DATA_KEYS).filter(key => !idbKeys.includes(key));

  const idbControls = addSection("Test Chiavi IndexedDB");
  idbKeys.forEach(key => {
    idbControls.appendChild(createButton(`Leggi ${key}`, readKey, key, 'idb'));
  });
  idbControls.appendChild(createButton("Svuota Intero IndexedDB", () => clearStorage('idb')));

  const lsControls = addSection("Test Chiavi LocalStorage");
  lsKeys.forEach(key => {
    lsControls.appendChild(createButton(`Leggi ${key}`, readKey, key, 'ls'));
  });
  lsControls.appendChild(createButton("Svuota LocalStorage", () => clearStorage('ls')));
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  outputDisplay = document.getElementById("output-display");
  renderUI();
});