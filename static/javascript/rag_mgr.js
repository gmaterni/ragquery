/** @format */
const ID_RAG = "id_rag";
const ID_THREAD = "id_thread";
const ID_RESPONSES = "id_responses";
const ID_DOC_NAMES = "id_doc_names";
const ID_DOCS = "id_docs";

const PROMPT_DECR = 1024 * 10;

const maxLenRequest = (nk = 32) => {
  //  1024   * 32 = 32758
  //  32768  * 6 = 196698
  //  196608 x 0,15 = 29591
  //  196608 + 29591 = 226199
  const nc = 1024 * nk * 3;
  const sp = nc * 0.1;
  const mlr = Math.trunc(nc + sp);
  return mlr;
};
const MAX_PROMPT_LENGTH = maxLenRequest(100);
// MISTRAL
// const MODEL = "mistral-large-2411"
// const MODEL = "open-mistral-nemo-2407";
// const MODEL = "mistral-medium-2505";
// const MODEL = "open-mistral-7b";
// const MODEL = "open-mixtral-8x7b";
const MODEL = "mistral-small-2503";
// const MODEL = "mistral-medium-2505";
//
// const APIKEY = "QsTPmjThpVYNi2mPtujTDYYjXffjtN5N"; //GIU // ERRORE: Variabile dichiarata ma commentata e mai usata
const API = "FAUsMsVFSw5gW5OEkvUZEZ1jcIWFlPj4"; //IPT // ATTENZIONE: API key hardcoded nel codice - dovrebbe essere in variabile d'ambiente
console.log("MODEL:\n", MODEL);

// const SYSTEM = "##SYSTEM##";
// const ASSISTANT = "##Assistant##";
// const USER = "##User##";

const client = ClientLLM(API);

const getResponse = async (payload, timeout = 60) => {
  // console.log("*** PAYLOAD:\n", payload["messages"]);

  payload["model"] = MODEL;
  const url = "https://api.mistral.ai/v1/chat/completions";

  const rr = await client.sendRequest(url, payload, timeout);
  if (rr.error) {
    if (rr.error.code === 499) {
      alert("Request Interrotta");
      return null;
    } else {
      return rr;
    }
  }
  if (!rr.response.choices || !rr.response.choices[0] || !rr.response.choices[0].message || rr.response.choices[0].message.content === undefined) {
    const err = client.createError("Risposta non valida", "ParseError", 500, { message: "La risposta non contiene il contenuto atteso" });
    return RequestResult(false, null, null, err);
  }
  rr.data = rr.response.choices[0].message.content;
  return rr;
};

const responseDetails = {
  set(response) {
    this.response = response;
  },
  // get_id() {
  //   return this.response.id;
  // },
  // get_created() {
  //   return this.response.created;
  // },
  // get_model() {
  //   return this.response.model;
  // },
  // get_index() {
  //   return this.response.choices[0].index;
  // },
  // get_role() {
  //   return this.response.choices[0].message.role;
  // },
  // get_tool_calls() {
  //   return this.response.choices[0].message.tool_calls;
  // },
  // get_content() {
  //   return this.response.choices[0].message.content;
  // },
  // get_finish_reason() {
  //   return this.response.choices[0].finish_reason;
  // },
  // get_prompt_tokens() {
  //   return this.response.usage.prompt_tokens;
  // },
  get_total_tokens() {
    return this.response.usage.total_tokens;
  },
  get_completion_tokens() {
    return this.response.usage.completion_tokens;
  },
};

const calcTokens = {
  sum_input_tokens: 0,
  sum_generate_tokens: 0,
  init() {
    this.sum_input_tokens = 0;
    this.sum_generate_tokens = 0;
  },
  add(response) {
    if (!response) return;
    this.sum_input_tokens += response.usage.total_tokens;
    this.sum_generate_tokens += response.usage.completion_tokens;
  },
  get_sum_input_tokens() {
    return this.sum_input_tokens;
  },
  get_sum_generate_tokens() {
    return this.sum_generate_tokens;
  },
};

const showTokens = (rsp) => {
  let itks = calcTokens.get_sum_input_tokens();
  let gtks = calcTokens.get_sum_generate_tokens();
  console.log(`Sum Tokens: ${itks} ${gtks}`);
  responseDetails.set(rsp);
  itks = responseDetails.get_total_tokens();
  gtks = responseDetails.get_completion_tokens();
  console.log(`Response Tokens: ${itks} ${gtks}`);
};

function cancelClientRequest() {
  client.cancelRequest();
}

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
  // risposta finale alla prompt contetso
  ragAnswer: "",
  answers: [],
  docContextLst: [],
  // prompts: [],
  init() {
    ThreadMgr.initThread();
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
        xlog(`${docName} (${doc_entire_len}) `);
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
          const payload = getPayloadDoc(messages);
          const rr = await getResponse(payload, 90);
          if (!rr) return "";
          const err = rr.error;
          if (!rr.ok) {
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
          answer = rr.data;
          if (!answer) return "";
          const rsp = rr.response;
          showTokens(rsp);
          calcTokens.add(rsp);
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
          const payload = getPayloadBuildContext(messages);
          const rr = await getResponse(payload, 90);
          if (!rr) return "";
          const err = rr.error;
          if (!rr.ok) {
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
          docContext = rr.data;
          if (!docContext) return "";
          const rsp = rr.response;
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
          const payload = getPayloadWithContext(messages);
          const rr = await getResponse(payload, 90);
          if (!rr) return "";
          const err = rr.error;
          if (!rr.ok) {
            console.error(`ERR4\n`, err);
            const code = err.code;
            if (code == 400) {
              if (isTooLarge(err)) {
                UaLog.log(`Error tokens with Context ${messages.length}`);
                context = truncateInput(context, PROMPT_DECR);
                continue;
              } else throw err;
            } else if (code == 408) {
              UaLog.log(`Error timeout Context`);
              continue;
            } else throw err;
          }
          answer = rr.data;
          if (!answer) return "";
          const rsp = rr.response;
          calcTokens.add(rsp);
          break;
        }
        answer = cleanResponse(answer);
        this.ragAnswer = answer;
        this.saveRespToDb();
        this.saveToDb();
        UaLog.log(`Risposta: (${this.ragAnswer.length})`);
        //log del totale tokens
        const itks = calcTokens.get_sum_input_tokens();
        const gtks = calcTokens.get_sum_generate_tokens();
        UaLog.log(`Tokens: ${itks} ${gtks}`);
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
      const payload = getPayloadThread(messages);
      while (true) {
        const rr = await getResponse(payload, 90);
        if (!rr) return "";
        const err = rr.error;
        if (!rr.ok) {
          console.error(`ERR6\n`, err);
          const code = err.code;
          if (code == 400) {
            if (isTooLarge(err)) {
              alert("Conversazione troppo lunga");
            }
            throw err;
          } else if (code == 408) continue;
          else throw err;
        }
        answer = rr.data;
        if (!answer) return "";
        const rsp = rr.response;
        showTokens(rsp);
        calcTokens.add(rsp);
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
