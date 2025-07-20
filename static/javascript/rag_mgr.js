/** @format */
//////////////////////
// GESTIONE LLM_CLIEN
//////////////////////

// const PROVVIDER = "mistral";
// const MODEL = "codestral-2501";
// const MODEL = "magistral-medium-2506";
// const MODEL = "magistral-small-2506";
// const MODEL = "devstral-medium-2507";
// const MODEL = "devstral-small-2507";
// const MODEL = "mistral-large-2411";
// const MODEL = "mistral-medium-2505";
// const MODEL = "mistral-small-2506";
// const MODEL = "open-mixtral-8x7b";
// const adapter = window.MistralAdapter;

const PROVVIDER = "gemini";
// const MODEL = "gemini-2.5-flash";
const MODEL = "gemini-2.0-flash";
const adapter = window.GeminiAdapter;

// const PROVVIDER = "groq";
// const MODEL = "llama-3.3-70b-versatile";
// const MODEL = "deepseek-r1-distill-llama-70b";
// const MODEL = "gemma2-9b-it";
// const MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct";
// const MODEL = "llama-3.1-8b-instant";
// const adapter = window.GroqAdapter;

// const PROVVIDER = "huggingface";
// const MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1";
// const MODEL= "mistralai/Mistral-7B-Instruct-v0.2" ;

console.log("*** PROVI;ER: ", PROVVIDER);
console.log("*** MODEL: ", MODEL);
const apiKey = getApiKey(PROVVIDER);
const client = new HttpLlmClient(adapter, apiKey);
//////////////////////////////////////////////////

const ID_RAG = "id_rag";
const ID_THREAD = "id_thread";
const ID_RESPONSES = "id_responses";
const ID_DOC_NAMES = "id_doc_names";
const ID_DOCS = "id_docs";

const PROMPT_DECR = 1024 * 10;

const maxLenRequest = (nk = 32) => {
  const nc = 1024 * nk * 3;
  const sp = nc * 0.1;
  const mlr = Math.trunc(nc + sp);
  return mlr;
};
const MAX_PROMPT_LENGTH = maxLenRequest(100);

function cancelClientRequest() {
  client.cancelRequest();
}

const isTooLarge = (err) => {
  if (!err) return false;
  const msgs = ["too large", "too long", "length exceeded", "exceeds maximum length", "exceeded", "context length"];
  const code = err.code ?? err.status;
  if (code === 413) return true;
  const containsMessages = (obj, messages) => {
    const lowerMsgs = messages.map((msg) => msg.toLowerCase());
    const search = (val) => {
      if (typeof val === "string") {
        const lowerVal = val.toLowerCase();
        return lowerMsgs.some((msg) => lowerVal.includes(msg));
      }
      if (Array.isArray(val)) return val.some(search);
      if (val && typeof val === "object") return Object.values(val).some(search);
      return false;
    };
    return search(obj);
  };
  const possibleSources = [err.body, err.message, err.error, err];
  if (code === 400 || !code) {
    return possibleSources.some((source) => containsMessages(source, msgs));
  }
  return false;
};

const truncateInput = (txt, decr) => {
  const tl = txt.length;
  const lim = tl - decr;
  const s = txt.substring(0, lim);
  return s;
};

const getPartSize = (document, prompt, decrement) => {
  const findLimitWithPoint = (text, freeLength) => {
    const pointIndex = text.indexOf(".", freeLength);
    let limit = (pointIndex !== -1 ? pointIndex : freeLength) + 1;
    if (limit > freeLength + 100) {
      limit = freeLength;
    }
    return limit;
  };

  // Calcola la lunghezza totale del documento e del prompt
  const totalLength = document.length + prompt.length;
  // Calcola la lunghezza massima disponibile dopo il decremento
  const availableLength = MAX_PROMPT_LENGTH - decrement;
  let partSize = 0;
  // Se la lunghezza totale è minore della lunghezza disponibile, usa la lunghezza del documento
  if (totalLength < availableLength) {
    partSize = document.length;
  } else {
    // Altrimenti, trova un punto nel documento per limitare la lunghezza
    partSize = findLimitWithPoint(document, availableLength);
  }
  return partSize;
};

const getPartDoc = (pRgt, partSize) => {
  const pLft = pRgt.substring(0, partSize);
  pRgt = pRgt.substring(partSize).trim();
  return [pLft, pRgt];
};

const ragLog = (msg, lftL, rgtL, answers) => {
  const maxl = MAX_PROMPT_LENGTH;
  const rspsL = answers.reduce((acc, cur) => {
    return acc + cur.length;
  }, 0);
  const row = formatRow([msg, lftL, rgtL, rspsL], [8, -7, -7, -7]);
  UaLog.log(row);
};

const Rag = {
  // costituito dalla risposte accumulate sistemate
  ragContext: "",
  //query usata per creare la lista delle rispste
  ragQuery: "",
  // risposta finale alla prompt contetso
  ragAnswer: "",
  answers: [],
  docContextLst: [],
  // prompts: [],
  init() {
    ThreadMgr.initThread();
    this.readRespsFromDb();
    this.readFromDb();
  },
  returnOk() {
    const ok = this.ragContext.length > 10;
    return ok;
  },
  saveToDb() {
    const js = {
      context: this.ragContext,
      ragquery: this.ragQuery,
      raganswer: this.ragAnswer,
    };
    UaDb.saveJson(ID_RAG, js);
    UaDb.saveArray(ID_THREAD, ThreadMgr.rows);
  },
  readFromDb() {
    const js = UaDb.readJson(ID_RAG);
    this.ragContext = js.context || "";
    this.ragQuery = js.ragquery || "";
    this.ragAnswer = js.raganswer || "";
    ThreadMgr.rows = UaDb.readArray(ID_THREAD);
  },
  saveRespToDb() {
    UaDb.saveArray(ID_RESPONSES, this.answers);
  },
  readRespsFromDb() {
    this.answers = UaDb.readArray(ID_RESPONSES);
  },

  //  visualizzazione prompts
  addPrompt(p) {
    // this.prompts.push(p);
  },

  // documenti => risposte RAG => context
  async requestDocsRAG(query) {
    DataMgr.deleteJsonDati();
    DataMgr.readDbDocNames();
    DataMgr.readDbDocs();
    this.docContextLst = [];
    this.ragQuery = query;
    ThreadMgr.initThread();
    this.saveToDb();
    let ndoc = 0;
    try {
      let j = 1;
      for (let i = 0; i < DataMgr.docs.length; i++) {
        let doc = DataMgr.docs[i];
        if (doc.trim() == "") continue;
        const docName = DataMgr.doc_names[i];
        const doc_entire_len = doc.length;
        UaLog.log(`${docName} (${doc_entire_len}) `);
        ++ndoc;
        let npart = 1;
        let decr = 0;
        let lft = "";
        let rgt = "";
        let answer = "";
        let docAnswersLst = [];
        while (true) {
          const partSize = getPartSize(doc, promptDoc("", query, ""), decr);
          if (partSize < 10) break;
          [lft, rgt] = getPartDoc(doc, partSize);
          ragLog(`${j}) ${ndoc},${npart}`, lft.length, rgt.length, this.answers);
          const messages = promptDoc(lft, this.ragquery);
          const payload = getPayloadDoc(MODEL, messages);
          const rr = await client.sendRequest(payload, 90);
          if (!rr) return "";
          const err = rr.error;
          if (!rr.ok) {
            console.error(`ERR1\n`, err);
            if (isTooLarge(err)) {
              UaLog.log(`Error tokens `);
              decr += PROMPT_DECR;
              continue;
            }
            const code = err.code;
            if (code == 408) {
              UaLog.log(`Error timeout Context`);
              continue;
            } else throw err;
          }
          answer = rr.data;
          if (!answer) return "";
          npart++;
          j++;
          doc = rgt;
          answer = cleanResponse(answer);
          docAnswersLst.push(answer);
          const s = `DOCUMENTO : ${docName}_${npart}\n${answer}`;
          this.answers.push(s);
        } // end while
        const docAnswersLen = docAnswersLst.length;
        let docAnswresTxt = docAnswersLst.join("\n\n");
        let docContext = "";
        while (true) {
          const messages = promptBuildContext(docAnswresTxt, this.ragQuery);
          const payload = getPayloadBuildContext(MODEL, messages);
          const rr = await client.sendRequest(payload, 90);
          if (!rr) return "";
          const err = rr.error;
          if (!rr.ok) {
            console.error(`ERR2\n`, err);
            if (isTooLarge(err)) {
              UaLog.log(`Error tokens `);
              decr += PROMPT_DECR;
              continue;
            }
            const code = err.code;
            if (code == 408) {
              UaLog.log(`Error timeout Context`);
              continue;
            } else throw err;
          }
          docContext = rr.data;
          if (!docContext) return "";
          break;
        } //end while
        UaLog.log(`context  ${docAnswersLen} => ${docContext.length}`);
        docContext = `\n### DOCUMENTO: ${docName}\n ${docContext}`;
        this.docContextLst.push(docContext);
      } // end for document
    } catch (err) {
      console.error("ERR3\n", err);
      throw err;
    }
    this.ragContext = this.docContextLst.join("\n\n");
    // console.log("ragContext:\n", this.ragContext);
    this.saveToDb();
    //
    // queryWithContext finale che utilizza context e genera la prima risposta
    {
      let answer = "";
      let context = this.ragContext;
      try {
        while (true) {
          const messages = promptWithContext(context, this.ragQuery);
          const payload = getPayloadWithContext(MODEL, messages);
          const rr = await client.sendRequest(payload, 90);
          if (!rr) return "";
          const err = rr.error;
          if (!rr.ok) {
            console.error(`ERR4\n`, err);
            if (isTooLarge(err)) {
              UaLog.log(`Error tokens}`);
              decr += PROMPT_DECR;
              continue;
            }
            const code = err.code;
            if (code == 408) {
              UaLog.log(`Error timeout Context`);
              continue;
            } else throw err;
          }
          answer = rr.data;
          if (!answer) return "";
          break;
        }
        answer = cleanResponse(answer);
        this.ragAnswer = answer;
        this.saveRespToDb();
        this.saveToDb();
        UaLog.log(`Risposta: (${this.ragAnswer.length})`);
        // costruzione html  per query e risposta
        const messages = [];
        messages.push({ role: "user", content: this.ragQuery });
        messages.push({ role: "assistant", content: answer });
        const html = messages2html(messages);
        return html;
      } catch (err) {
        console.error("ERR5\n", err);
        throw err;
      }
    } // end query
  },

  //richiesta iniziale della conversazione
  async requestContext(queryThread) {
    let answer = "";
    if (ThreadMgr.isFirst()) {
      console.log("******** FIRST");
      if (!!this.ragContext) {
        const messages = promptThreadRag(this.ragContext, this.ragQuery, this.ragAnswer, queryThread);
        ThreadMgr.addMessages(messages);
      } else {
        const messages = promptThread(queryThread);
        ThreadMgr.addMessages(messages);
      }
    } else {
      console.log("******** NEXT");
      ThreadMgr.addQuery(queryThread);
    }
    try {
      const messages = ThreadMgr.getMessages();
      const payload = getPayloadThread(MODEL, messages);
      while (true) {
        const rr = await client.sendRequest(payload, 90);
        if (!rr) return "";
        const err = rr.error;
        if (!rr.ok) {
          console.error(`ERR6\n`, err);
          const code = err.code;
          if (code == 408) {
            continue;
          }
          if (isTooLarge(err)) {
            alert("Conversazione troppo lunga");
          }
          throw err;
        }
        answer = rr.data;
        if (!answer) return "";
        break;
      }
      answer = cleanResponse(answer);
      ThreadMgr.addAnswer(answer);
      const msgs = ThreadMgr.getUserMessages();
      const html = messages2html(msgs);
      UaLog.log(`Inizio Conversazione (${prompt.length})`);
      return html;
    } catch (err) {
      console.error("ERR7\n", err);
      throw err;
    }
  },
};

const ThreadMgr = {
  rows: [],
  initThread() {
    this.rows = [];
  },
  delete() {
    alert("DELETE");
    this.rows = [];
  },
  addMessages(rows) {
    for (const row of rows) {
      this.rows.push(row);
    }
    UaDb.saveArray(ID_THREAD, ThreadMgr.rows);
  },
  getMessages() {
    return this.rows;
  },
  getUserMessages() {
    const lst = this.rows.filter((e, i) => e["role"] !== "system");
    return lst;
  },
  addQuery(row) {
    const messages = [{ role: "user", content: row }];
    this.addMessages(messages);
  },
  addAnswer(row) {
    const messages = [{ role: "assistant", content: row }];
    this.addMessages(messages);
  },
  isFirst() {
    const first = this.rows.length < 1;
    return first;
  },
};
