/** @format */
const ID_RAG = "id_rag";

const ID_THREAD = "id_thread";
const ID_RESPONSES = "id_responses";
const ID_DOC_NAMES = "id_doc_names";
const ID_DOCS = "id_docs;";

const MAX_PROMPT_LENGTH = 1024 * 400;
const PROMPT_DECR = 1024 * 2;

// const MODEL = "mistral-large-latest"
// const MODEL="mistral-tiny-2312"
// const MODEL="open-mistral-7b"
// const MODEL = "mistral-tiny-latest"
const MODEL = "open-mistral-nemo-2407";
// const MODEL="mistral-small-2409"
// const MODEL="open-mixtral-8x7b"
// const MODEL="open-mixtral-8x22b-2404"

const APIKEY = "YhGMPy8ntz9wjJzacynYqOZc29RRGBFO";

const client = MistralApiClient(APIKEY, {
  timeout: 60,
});

function cancelClientRequest() {
  client.cancelRequest();
}

function wait(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

const isTooLarge = (err) => {
  const msg = err.details.message;
  const tks = msg.includes("too large");
  return tks;
};
const truncateInput = (txt, decr) => {
  const tl = txt.length;
  const lim = tl - decr;
  const s = txt.substring(0, lim);
  return s;
};

//setta il prompt al limite massimo
const setMaxLen = (s) => {
  const lim = MAX_PROMPT_LENGTH - 1000;
  return s.substring(0, lim);
};

const getPartSize = (document, prompt, decrement) => {
  // Funzione interna per trovare un punto nel documento a partire da una certa posizione
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
  let s = `${msg} mx:${maxl} lft:${lftL} rgt:${rgtL} arr:${rspsL}`;
  xlog(s);
  const row = formatRow([msg, lftL, rgtL, rspsL], [8, -7, -7, -7]);
  UaLog.log(row);
};

const Rag = {
  // costituito dalla risposte accumulate sistemate
  ragContext: "",
  //query usata per creare la lista delle rispste
  ragQuery: "",
  // risposta finale alla qury contetso
  ragAnswer: "",
  answers: [],
  docContextLst: [],
  prompts: [],
  doc: "",
  doc_part: "",
  init() {
    this.readRespsFromDb();
    this.readFromDb();
    calcTokens.init();
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

  // UA
  // addPrompt(p) {
  //   this.prompts.push(p);
  // },

  // documenti => risposte RAG => context
  async requestDocsRAG(query) {
    DataMgr.deleteJsonDati();
    DataMgr.readDbDocNames();
    DataMgr.readDbDocs();
    this.ragQuery = query;
    this.saveToDb();
    let ndoc = 0;
    try {
      let j = 1;

      for (let i = 0; i < DataMgr.docs.length; i++) {
        let doc = DataMgr.docs[i];
        if (doc.trim() == "") continue;
        const docName = DataMgr.doc_names[i];
        const doc_entire_len = doc.length;
        xlog(`${docName} (${doc_entire_len}) `);
        UaLog.log(`${docName} (${doc_entire_len}) `);
        ++ndoc;
        let npart = 1;
        let decr = 0;
        let prompt = "";
        let lft = "";
        let rgt = "";
        let answer = "";
        let docAnswersLst = [];

        while (true) {
          let partSize = getPartSize(doc, promptDoc("", query, ""), decr);
          if (partSize < 10) {
            break;
          }
          [lft, rgt] = getPartDoc(doc, partSize);
          ragLog(`${j}) ${ndoc},${npart}`, lft.length, rgt.length, this.answers);
          prompt = promptDoc(lft, query, docName);
          const payload = getPayloadDoc(prompt);
          const der = await client.chat(MODEL, payload, 90);
          answer = der[0];
          const err = der[1];
          if (err) {
            console.error(`ERR1\n`, err);
            const code = err.code;
            if (code == 400) {
              if (isTooLarge(err)) {
                UaLog.log(`Error tokens Doc ${prompt.length}`);
                decr += PROMPT_DECR;
                continue;
              } else {
                UaLog.log(`Error ${err}`);
                throw err;
              }
            } else if (code == 408) {
              UaLog.log(`Error timeout Doc`);
              continue;
            } else {
              UaLog.log(`Error ${err}`);
              throw err;
            }
          } // end err
          if (!answer) return "";
          //ha ritornato 3 elemnti, il terz è response
          const rsp=der[2];
          calcTokens.add(rsp);
          npart++;
          j++;
          doc = rgt;
          answer = cleanResponse(answer);
          docAnswersLst.push(answer);
          const s = `DOCUMENTO : ${docName}_${npart}\n${answer}`;
          this.answers.push(s);
        } // end while

        // doc answer list => cContext
        const docAnswersLen = docAnswersLst.length;
        let docAnswresTxt = docAnswersLst.join("\n\n");
        let docContext = "";

        while (true) {
          prompt = promptBuildContext(docAnswresTxt, this.ragQuery);
          const payload = getPayloadBuildContext(prompt);
          const der = await client.chat(MODEL, payload, 90);
          docContext = der[0];
          const err = der[1];
          if (err) {
            console.error(`ERR2\n`, err);
            const code = err.code;
            if (code == 400) {
              if (isTooLarge(err)) {
                UaLog.log(`Error tokens build Context ${prompt.length}`);
                docAnswresTxt = truncateInput(docAnswresTxt, PROMPT_DECR);
                // docAnswresTxt = setMaxLen(docAnswresTxt);
                continue;
              } else {
                UaLog.log(`Error ${err}`);
                throw err;
              }
            } else if (code == 408) {
              UaLog.log(`Error timeout build Context`);
              continue;
            } else {
              UaLog.log(`Error ${err}`);
              throw err;
            }
          } // end err
          if (!docContext) return "";
          //ritornata respèonse
          const rsp=der[2];
          calcTokens.add(rsp);
          break;
        } //end while

        UaLog.log(`context  ${docAnswersLen} => ${docContext.length}`);
        docContext = `\n### DOCUMENTO: ${docName}\n ${docContext}`;
        this.docContextLst.push(docContext);
      } // end for document
    } catch (err) {
      console.error("end for douments\nr", err);
      throw err;
    }    
    this.ragContext = this.docContextLst.join("\n\n");
    this.saveToDb();
    // queryWithContext finale che utilizza context e genera la prima risposta
    {
      let answer = "";
      let context = this.ragContext;
      try {
        while (true) {
          let prompt = promptWithContext(context, query);
          const payload = getPayloadWithContext(prompt);
          const der = await client.chat(MODEL, payload, 90);
          answer = der[0];
          const err = der[1];
          if (err) {
            console.error(`ERR3\n`, err);
            const code = err.code;
            if (code == 400) {
              if (isTooLarge(err)) {
                UaLog.log(`Error tokens with Context ${prompt.length}`);
                context = truncateInput(context, PROMPT_DECR);
                // context = setMaxLen(context);
                continue;
              } else {
                UaLog.log(`Error ${err}`);
                throw err;
              }
            } else if (code == 408) {
              UaLog.log(`Error timeout Context`);
              continue;
            } else {
              UaLog.log(`Error ${err}`);
              throw err;
            }
          } //end err
          if (!answer) return "";
          //retrun di tre elementi
          const rsp=der[2];
          calcTokens.add(rsp);
          break;
        }
        answer = cleanResponse(answer);
        this.ragAnswer = answer;
        this.saveRespToDb();
        ThreadMgr.init();
        this.saveToDb();
        UaLog.log(`Risposta: (${this.ragAnswer.length})`);
        // log del totale tokens
        const itks=calcTokens.get_sum_input_tokens()
        const gtks=calcTokens.get_sum_generate_tokens()
        UaLog.log(`Tokens: ${itks} ${gtks}`)

      } catch (err) {
        console.error(err);
        answer = `${err}`;
        throw err;
      } finally {
        return answer;
      }
    } // end query
  },
  //richiesta iniziale della conversazione
  async requestContext(query) {
    let text = "";
    if (!this.ragContext) {
      // const ok = await confirm("Contesto vuoto. Vuoi continuare?");
      // if (!ok) return "";
      // HACK gestisce il pulsante verde che ha accettao il contetso vuoto
      this.ragContext = "Sei un assitente AI dispoibile a soddisfare tutte le mi richieste";
    }
    if (ThreadMgr.isFirst()) {
      ThreadMgr.init();
      try {
        let context = this.ragContext;
        let thread = ThreadMgr.getThread();

        while (true) {
          prompt = promptThread(context, thread, query);
          const payload = getPayloadThread(prompt);
          const der = await client.chat(MODEL, payload, 90);
          text = der[0];
          const err = der[1];
          if (err) {
            console.error(`ERR4\n`, err);
            const code = err.code;
            if (code == 400) {
              if (isTooLarge(err)) {
                UaLog.log(`Error tokens with Context ${prompt.length}`);
                context = truncateInput(context, PROMPT_DECR);
                // context = setMaxLen(context);
                continue;
              } else {
                UaLog.log(`Error ${err}`);
                throw err;
              }
            } else if (code == 408) {
              UaLog.log(`Error timeout Context`);
              continue;
            } else {
              UaLog.log(`Error ${err}`);
              throw err;
            }
          }
          if (!text) return "";
          //return di 3 elemti
          const rsp=der[2];
          calcTokens.add(rsp);
          break;
        }
        text = cleanResponse(text);
        ThreadMgr.add(query, text);
        text = ThreadMgr.getThread();
        UaLog.log(`Inizio Conversazione (${prompt.length})`);
      } catch (err) {
        console.error(err);
        text = `${err}`;
        throw err;
      } finally {
        return text;
      }
    } else {
      try {
        let context = this.ragContext;
        let thread = ThreadMgr.getThread();
        let prompt = "";
        while (true) {
          prompt = promptThread(context, thread, query);
          const payload = getPayloadThread(prompt);
          const der = await client.chat(MODEL, payload, 90);
          text = der[0];
          const err = der[1];
          if (err) {
            console.error(`ERR5\n`, err);
            const code = err.code;
            if (code == 400) {
              if (isTooLarge(err)) {
                UaLog.log(`Error tokens with Context ${prompt.length}`);
                context = truncateInput(context, PROMPT_DECR);
                continue;
              } else {
                UaLog.log(`Error ${err}`);
                throw err;
              }
            } else if (code == 408) {
              UaLog.log(`Error timeout Context`);
              continue;
            } else {
              UaLog.log(`Error ${err}`);
              throw err;
            }
          }
          if (!text) return "";
          //return 3 elementi
          const rsp=der[2];
          calcTokens.add(rsp);
          break;
        }
        text = cleanResponse(text);
        ThreadMgr.add(query, text);
        text = ThreadMgr.getThread();
        UaLog.log(`Conversazione  (${prompt.length})`);
      } catch (err) {
        console.error(err);
        text = `${err}`;
        throw err;
      } finally {
        return text;
      }
    }
  },
};

const LLM = "## Assistant:";
const USER = "## User:";

const ThreadMgr = {
  rows: [],
  init() {
    this.rows = [];
    if (!!Rag.ragAnswer) {
      this.add(Rag.ragQuery, Rag.ragAnswer);
    } else {
      this.add("", "");
    }
  },
  add(query, resp) {
    const row = [query, resp];
    this.rows.push(row);
    UaDb.saveArray(ID_THREAD, ThreadMgr.rows);
  },
  getThread() {
    const rows = [];
    for (const ua of this.rows) {
      const u = ua[0];
      const a = ua[1];
      if(!u)continue;
      rows.push(`${USER}\n${u}\n${LLM}\n${a}\n`);
    }
    return rows.join("\n\n");
  },
  isFirst() {
    return this.rows.length < 2;
  },
};
