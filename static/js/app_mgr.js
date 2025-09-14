/** @format */
"use strict";

import { getApiKey } from "./services/key_retriever.js";
import { HttpLlmClient } from "./adapter/adapter_http_client.js";
import { LlmProvider } from "./llm_provider.js";
import { DocType } from "./services/doc_types.js";
import { ragEngine } from "./rag_engine.js";

const tokensToBytes = (nk = 32) => {
  const nc = 1024 * nk * 3;
  const sp = nc * 0.1;
  const mlr = Math.trunc(nc + sp);
  return mlr;
};

export const AppMgr = {
  configTD: null,
  configLLM: null,
  clientLLM: null,
  promptSize: 0,

  initApp() {
    DocType.init();
    this.configTD = DocType.getConfig();
    // ///
    LlmProvider.init();
    this.configLLM = LlmProvider.getConfig();
    this.promptSize = tokensToBytes(this.configLLM.windowSize);
    const adapter = LlmProvider.getAdapter();
    const apiKey = getApiKey(this.configLLM.provider);
    this.clientLLM = new HttpLlmClient(adapter, apiKey);
    /////
    console.log(`*** PROVIDER    : ${this.configLLM.provider}`);
    console.log(`*** MODEL       : ${this.configLLM.model}`);
    console.log(`*** WINDOW_SIZE : ${this.configLLM.windowSize}`);
    console.log(`*** PROMPT_SIZE : ${this.promptSize}`);
    console.log(`*** DOC_TYPE    : ${this.configTD.docType}`);
    console.log(`*** ADAPTERE    : ${adapter}`);
    console.log(` ${apiKey}`);
    ///////
    const client = this.clientLLM;
    const model = this.configLLM.model;
    const promptSize = this.promptSize;
    const docType = this.configTD.docType;
    ragEngine.init(client, model, promptSize, docType);
  },
};

// export function cancelClientRequest() {
//   const client = AppMgr.clientLLM;
//   if (client) {
//     client.cancelRequest();
//   }
// }