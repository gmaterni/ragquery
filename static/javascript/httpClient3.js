/** @format */
const VERSION = "0.5.0";
const RETRY_STATUS_CODES = [429, 500, 502, 503, 504];
const ENDPOINT = "https://api.mistral.ai";
const API_KEY = "YhGMPy8ntz9wjJzacynYqOZc29RRGBFO";

const configuredFetch = Promise.resolve(globalThis.fetch ?? import("node-fetch").then((m) => m.default));

class MistralAPIError extends Error {
  constructor(message) {
    super(message);
    this.name = "MistralAPIError";
  }
}

function combineSignals(signals) {
  const controller = new AbortController();
  signals.forEach((signal) => {
    if (!signal) return;
    signal.addEventListener(
      "abort",
      () => {
        controller.abort(signal.reason);
      },
      { once: true }
    );
    if (signal.aborted) {
      controller.abort(signal.reason);
    }
  });
  return controller.signal;
}

const mistralClient = {
  endpoint: ENDPOINT,
  apiKey: API_KEY,
  maxRetries: 5,
  timeout: 120,
  modelDefault: "mistral",

  async _fetch(...args) {
    const fetchFunc = await configuredFetch;
    return fetchFunc(...args);
  },

  async _request(method, path, request, signal, formData = null) {
    const url = `${this.endpoint}/${path}`;
    const options = {
      method: method,
      headers: {
        "User-Agent": `mistral-client-js/${VERSION}`,
        Accept: request?.stream ? "text/event-stream" : "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      signal: combineSignals([AbortSignal.timeout(this.timeout * 1000), signal]),
      body: method !== "get" ? formData ?? JSON.stringify(request) : null,
      timeout: this.timeout * 1000,
    };

    if (formData) {
      delete options.headers["Content-Type"];
    }

    for (let attempts = 0; attempts < this.maxRetries; attempts++) {
      try {
        const response = await this._fetch(url, options);

        if (response.ok) {
          if (request?.stream) {
            if (typeof response.body.getReader === "undefined") {
              return response.body;
            } else {
              const reader = response.body.getReader();
              const asyncIterator = async function* () {
                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) return;
                    yield value;
                  }
                } finally {
                  reader.releaseLock();
                }
              };
              return asyncIterator();
            }
          }
          return await response.json();
        } else if (RETRY_STATUS_CODES.includes(response.status)) {
          console.debug(`Retrying request on response status: ${response.status}`, `Response: ${await response.text()}`, `Attempt: ${attempts + 1}`);
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts + 1) * 500));
        } else {
          throw new MistralAPIError(`HTTP error! status: ${response.status} ` + `Response: \n${await response.text()}`);
        }
      } catch (error) {
        console.error(`Request failed: ${error.message}`);
        if (error.name === "MistralAPIError") {
          throw error;
        }
        if (attempts === this.maxRetries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts + 1) * 500));
      }
    }
    throw new Error("Max retries reached");
  },

  _makeChatCompletionRequest(model, messages, tools, temperature, maxTokens, topP, randomSeed, stream, safeMode, safePrompt, toolChoice, responseFormat) {
    if (!model && !this.modelDefault) {
      throw new MistralAPIError("You must provide a model name");
    }
    return {
      model: model ?? this.modelDefault,
      messages: messages,
      tools: tools ?? undefined,
      temperature: temperature ?? undefined,
      max_tokens: maxTokens ?? undefined,
      top_p: topP ?? undefined,
      random_seed: randomSeed ?? undefined,
      stream: stream ?? undefined,
      safe_prompt: (safeMode || safePrompt) ?? undefined,
      tool_choice: toolChoice ?? undefined,
      response_format: responseFormat ?? undefined,
    };
  },

  async chat({ model, messages, tools, temperature, maxTokens, topP, randomSeed, safeMode, safePrompt, toolChoice, responseFormat }, { signal } = {}) {
    const request = this._makeChatCompletionRequest(model, messages, tools, temperature, maxTokens, topP, randomSeed, false, safeMode, safePrompt, toolChoice, responseFormat);
    const response = await this._request("post", "v1/chat/completions", request, signal);
    return response;
  },

  cancelRequest(signal) {
    if (signal) {
      signal.abort();
    }
  }
};








const infoError = {
  set(error) {
    this.error = error;
  },
  get_message() {
    return this.error.message;
  },
  get_type() {
    return this.error.type;
  },
  get_code() {
    return this.error.code;
  },
  get_details_message() {
    return this.error.details.message;
  },
  get_details_type() {
    return this.error.details.type;
  },
  get_details_param() {
    return this.error.details.param;
  },
  get_details_code() {
    return this.error.details.code;
  },
};

const infoResponse = {
  set(response) {
    this.response = response;
  },
  get_id() {
    return this.response.id;
  },
  get_created() {
    return this.response.created;
  },
  get_model() {
    return this.response.model;
  },
  get_index() {
    return this.response.choices[0].index;
  },
  get_role() {
    return this.response.choices[0].message.role;
  },
  get_tool_calls() {
    return this.response.choices[0].message.tool_calls;
  },
  get_content() {
    return this.response.choices[0].message.content;
  },
  get_finish_reason() {
    return this.response.choices[0].finish_reason;
  },
  get_prompt_tokens() {
    return this.response.usage.prompt_tokens;
  },
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

const errorDumps = (err) => {
  const s = JSON.stringify(err, null, 2);
  return s;
};

const errorMsg = (err) => {
  const s = err.details.message;
  return s;
};
