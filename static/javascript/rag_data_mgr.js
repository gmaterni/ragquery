/** @format */

"use strict";

const UaDb = {
  create(id, data) {
    if (localStorage.getItem(id)) {
      console.error(`ID ${id} already exists.`);
      return;
    }
    localStorage.setItem(id, data);
  },
  read(id) {
    const data = localStorage.getItem(id);
    if (data === null) {
      xlog(`UaDb.read  ${id} not found.`);
      return "";
    }
    return data;
  },
  update(id, data) {
    if (!localStorage.getItem(id)) {
      xlog(`UaDb.update ${id} not found.`);
      return;
    }
    localStorage.setItem(id, data);
  },
  delete(id) {
    if (!localStorage.getItem(id)) {
      console.error(`ID ${id} not found.`);
      return;
    }
    localStorage.removeItem(id);
  },
  save(id, data) {
    localStorage.setItem(id, data);
  },
  getAllIds() {
    const ids = [];
    for (let i = 0; i < localStorage.length; i++) {
      ids.push(localStorage.key(i));
    }
    return ids;
  },
  saveArray(id, arr) {
    const str = JSON.stringify(arr);
    UaDb.save(id, str);
  },
  readArray(id) {
    const str = UaDb.read(id);
    if (str.trim().length == 0) return [];
    const arr = JSON.parse(str);
    return arr;
  },
  saveJson(id, js) {
    const str = JSON.stringify(js);
    UaDb.save(id, str);
  },
  readJson(id) {
    const str = UaDb.read(id);
    if (!str) return {};
    const js = JSON.parse(str);
    return js;
  },
};

const DataMgr = {
  docs: [],
  doc_names: [],
  linkToName(link) {
    const parts = link.split("/");
    return parts[parts.length - 1];
  },
  async loadDoc(link) {
    this.readDbDocNames();
    try {
      const text = await requestGet(link);
      const doc = cleanDoc(text);
      const name = this.linkToName(link);
      if (this.doc_names.includes(name)) {
        alert(`Il documento ${name} è già caricato`);
        return;
      }
      this.doc_names.push(name);
      this.docs.push(doc);
      this.saveDbDocs();
      return doc;
    } catch (err) {
      alert("loadDoc()\n" + err + "\n" + link);
    }
  },
  addDoc(name, text) {
    const doc = cleanDoc(text);
    this.docs.push(doc);
    this.doc_names.push(name);
    this.saveDbDocs();
  },
  saveDbDocs() {
    UaDb.saveArray(ID_DOC_NAMES, this.doc_names);
    UaDb.saveArray(ID_DOCS, this.docs);
  },
  readDbDocs() {
    this.docs = UaDb.readArray(ID_DOCS);
  },
  readDbDocNames() {
    this.doc_names = UaDb.readArray(ID_DOC_NAMES);
    return this.doc_names;
  },
  deleteJsonDati() {
    const ids = UaDb.getAllIds();
    for (const id of ids) {
      if ([ID_DOCS, ID_DOC_NAMES].includes(id)) continue;
      UaDb.delete(id);
    }
    Rag.ragQuery = "";
    Rag.ragContext = "";
    Rag.ragAnswer = "";
    Rag.answers = [];
    Rag.prompts = [];
    ThreadMgr.rows = [];
  },
};
