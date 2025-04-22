/** @format */
const ID_RAG = "id_rag";

const ID_THREAD = "id_thread";
const ID_RESPONSES = "id_responses";
const ID_DOC_NAMES = "id_doc_names";
const ID_DOCS = "id_docs";

const PROMPT_DECR = 1024 * 10;
const MAX_PROMPT_LENGTH = 30 * 1024 * 3;

//131000
// const MODEL = "mistral-large-2411"
// const MODEL = "open-mistral-nemo-2407";
// const MODEL = "ministral-8b-2410";
// const MODEL = "ministral-3b-2410";

//32000
// const MODEL = "open-mistral-7b";
// const MODEL = "open-mixtral-8x7b";
const MODEL = "mistral-small-2503";

//64000
// const MODEL="open-mixtral-8x22b-2404"

const APIKEY = "YhGMPy8ntz9wjJzacynYqOZc29RRGBFO";

const client = MistralApiClient(APIKEY, {
  timeout: 90,
});

function cancelClientRequest() {
  client.cancelRequest();
}

// function wait(seconds) {
//   return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
// }

const getPromptTokens = (err) => {
  const msg = err.details.message;
  const match = msg.match(/Prompt contains (\d+) tokens/);
  return match ? parseInt(match[1], 10) : null;
};

const getModelToken = (err) => {
  const msg = err.details.message;
  const match = msg.match(/model with (\d+) maximum context length/);
  return match ? parseInt(match[1], 10) : null;
};

const isTooLarge = (err) => {
  const msg = err.details.message;
  const tks = msg.includes("too large");
  return tks;
};

// utilizzato per httpClientMst
// const getResponse = async (model, payload) => {
//   try {
//     payload["model"] = model;
//     const response = await client.chat(payload);
//     console.log("Response:\n", response);
//     const content = response.choices[0].message.content;
//     return [content, null, response];
//   } catch (error) {
//     console.error(`Error in getResponse: ${error}`);
//     return [null, error];
//   }
// };

const getResponse = async (model, payload) => {
  try {
    const rs = await client.chat(model, payload);
    const error = rs[1];
    if (error) {
      throw error;
    }
    const response = rs[0];
    const content = response.choices[0].message.content;
    return [content, null, response];
  } catch (error) {
    console.error(`Error in getResponse: ${error}`);
    return [null, error, null];
  }
};

const truncateInput = (txt, decr) => {
  const tl = txt.length;
  const lim = tl - decr;
  const s = txt.substring(0, lim);
  return s;
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

  // AAA visualizzazione prompts
  addPrompt(p) {
    // this.prompts.push(p);
  },

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
          const partSize = getPartSize(doc, promptDoc("", query, ""), decr);
          if (partSize < 10) break;
          [lft, rgt] = getPartDoc(doc, partSize);
          ragLog(`${j}) ${ndoc},${npart}`, lft.length, rgt.length, this.answers);
          prompt = promptDoc(lft, query, docName);
          this.addPrompt(prompt);
          const payload = getPayloadDoc(prompt);
          // const der = await client.chat(MODEL, payload, 90);
          const cont_err_resp = await getResponse(MODEL, payload, 90);
          const err = cont_err_resp[1];
          if (err) {
            console.error(`ERR1\n`, err);
            const code = err.code;
            if (code == 400) {
              if (isTooLarge(err)) {
                UaLog.log(`Error tokens Doc ${prompt.length}`);
                decr += PROMPT_DECR;
                continue;
              } else throw err;
            } else if (code == 408) {
              UaLog.log(`Error timeout Context`);
              continue;
            } else throw err;
          }
          answer = cont_err_resp[0];
          const rsp = cont_err_resp[2];
          if (!answer) return "";
          //AAA log rokens
          let itks = calcTokens.get_sum_input_tokens();
          let gtks = calcTokens.get_sum_generate_tokens();
          console.log(`Sum Tokens: ${itks} ${gtks}`);
          infoResponse.set(rsp);
          itks = infoResponse.get_total_tokens();
          gtks = infoResponse.get_completion_tokens();
          console.log(`Response Tokens: ${itks} ${gtks}`);
          //
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
          const der = await getResponse(MODEL, payload, 90);
          const err = der[1];
          if (err) {
            console.error(`ERR2\n`, err);
            const code = err.code;
            if (code == 400) {
              if (isTooLarge(err)) {
                UaLog.log(`Error tokens build Context ${prompt.length}`);
                docAnswresTxt = truncateInput(docAnswresTxt, PROMPT_DECR);
                continue;
              } else throw err;
            } else if (code == 408) {
              UaLog.log(`Error timeout Context`);
              continue;
            } else throw err;
          }
          docContext = der[0];
          const rsp = der[2];
          if (!docContext) return "";
          calcTokens.add(rsp);
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
    this.saveToDb();
    // queryWithContext finale che utilizza context e genera la prima risposta
    {
      let answer = "";
      let context = this.ragContext;
      try {
        while (true) {
          let prompt = promptWithContext(context, query);
          const payload = getPayloadWithContext(prompt);
          const der = await getResponse(MODEL, payload, 90);
          const err = der[1];
          if (err) {
            console.error(`ERR4\n`, err);
            const code = err.code;
            if (code == 400) {
              if (isTooLarge(err)) {
                UaLog.log(`Error tokens with Context ${prompt.length}`);
                context = truncateInput(context, PROMPT_DECR);
                continue;
              } else throw err;
            } else if (code == 408) {
              UaLog.log(`Error timeout Context`);
              continue;
            } else throw err;
          }
          answer = der[0];
          const rsp = der[2];
          if (!answer) return "";
          calcTokens.add(rsp);
          break;
        }
        answer = cleanResponse(answer);
        this.ragAnswer = answer;
        this.saveRespToDb();
        ThreadMgr.init();
        this.saveToDb();
        UaLog.log(`Risposta: (${this.ragAnswer.length})`);

        //log del totale tokens
        const itks = calcTokens.get_sum_input_tokens();
        const gtks = calcTokens.get_sum_generate_tokens();
        UaLog.log(`Tokens: ${itks} ${gtks}`);

        return answer;
      } catch (err) {
        console.error("ERR5\n", err);
        throw err;
      }
    } // end query
  },
  //richiesta iniziale della conversazione
  async requestContext(query) {
    let answer = "";
    if (!this.ragContext) {
      // gestisce il pulsante verde che ha accettao il contetso vuoto
      this.ragContext = "Sei un assistente AI dispoibile a soddisfare tutte le mi richieste";
    }
    if (ThreadMgr.isFirst()) {
      ThreadMgr.init();
      try {
        let context = this.ragContext;
        let thread = ThreadMgr.getThread();

        while (true) {
          prompt = promptThread(context, thread, query);
          const payload = getPayloadThread(prompt);
          // const der = await client.chat(MODEL, payload, 90);
          const cont_err_resp = await getResponse(MODEL, payload, 90);
          const err = cont_err_resp[1];
          if (err) {
            console.error(`ERR6\n`, err);
            const code = err.code;
            if (code == 400) {
              if (isTooLarge(err)) {
                UaLog.log(`Error tokens with Context ${prompt.length}`);
                context = truncateInput(context, PROMPT_DECR);
                continue;
              } else throw err;
            } else if (code == 408) continue;
            else throw err;
          }
          answer = cont_err_resp[0];
          const rsp = cont_err_resp[2];
          if (!answer) return "";
          let itks = calcTokens.get_sum_input_tokens();
          let gtks = calcTokens.get_sum_generate_tokens();
          console.log(`Sum Tokens: ${itks} ${gtks}`);
          infoResponse.set(rsp);
          itks = infoResponse.get_total_tokens();
          gtks = infoResponse.get_completion_tokens();
          console.log(`Response Tokens: ${itks} ${gtks}`);
          calcTokens.add(rsp);
          break;
        }
        answer = cleanResponse(answer);
        ThreadMgr.add(query, answer);
        answer = ThreadMgr.getThread();
        UaLog.log(`Inizio Conversazione (${prompt.length})`);
        return answer;
      } catch (err) {
        console.error("ERR7\n", err);
        throw err;
      }
    } else {
      try {
        let context = this.ragContext;
        let thread = ThreadMgr.getThread();
        let prompt = "";
        while (true) {
          prompt = promptThread(context, thread, query);
          const payload = getPayloadThread(prompt);
          // const der = await client.chat(MODEL, payload, 90);
          // const err = der[1];
          const cont_err_resp = await getResponse(MODEL, payload, 90);
          const err = cont_err_resp[1];
          if (err) {
            console.error(`ERR8\n`, err);
            const code = err.code;
            if (code == 400) {
              if (isTooLarge(err)) {
                UaLog.log(`Error tokens with Context ${prompt.length}`);
                context = truncateInput(context, PROMPT_DECR);
                continue;
              } else throw err;
            } else if (code == 408) {
              UaLog.log(`Error timeout Context`);
              continue;
            } else throw err;
          }
          answer = cont_err_resp[0];
          const rsp = cont_err_resp[2];
          if (!answer) return "";
          //AAA log rokens
          let itks = calcTokens.get_sum_input_tokens();
          let gtks = calcTokens.get_sum_generate_tokens();
          console.log(`Sum Tokens: ${itks} ${gtks}`);
          infoResponse.set(rsp);
          itks = infoResponse.get_total_tokens();
          gtks = infoResponse.get_completion_tokens();
          console.log(`Response Tokens: ${itks} ${gtks}`);
          calcTokens.add(rsp);
          break;
        }
        answer = cleanResponse(answer);
        ThreadMgr.add(query, answer);
        answer = ThreadMgr.getThread();
        UaLog.log(`Conversazione  (${prompt.length})`);
        return answer;
      } catch (err) {
        console.error("ERR9\n", err);
        throw err;
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
      if (!u) continue;
      rows.push(`${USER}\n${u}\n${LLM}\n${a}\n`);
    }
    return rows.join("\n\n");
  },
  isFirst() {
    return this.rows.length < 2;
  },
};
