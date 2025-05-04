/** @format */

const errorDettails = {
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

const responseDettails = {
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

class RequestResult {
  constructor(response = null, data = null, error = null) {
    this.response = response;
    this.data = data;
    this.error = error;
  }
}

class ClientLLM {
  constructor(apiKey, options = {}) {
    this.timeout = options.timeout || 60;
    this.baseUrl = options.baseUrl || "https://api.mistral.ai/v1";
    this.apiKey = apiKey;
    this.abortController = null;
    this.isCancelled = false;
    this.requestResult = new RequestResult();
  }

  _buildUrl(endpoint) {
    return `${this.baseUrl}${endpoint}`;
  }

  _getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  _validateInput(model, payload) {
    if (!model || typeof model !== "string") {
      return this._createError("Modello non valido", "ValidationError", 400, "Il parametro model deve essere una stringa non vuota");
    }
    if (!payload || typeof payload !== "object") {
      return this._createError("Payload non valido", "ValidationError", 400, "Il payload deve essere un oggetto valido");
    }
    return null;
  }

  _handleHttpError(response) {
    const errorMessages = {
      400: "Richiesta non valida",
      401: "Non autorizzato - Controlla la API key",
      403: "Accesso negato",
      404: "Endpoint non trovato",
      429: "Troppe richieste - Rate limit superato",
      500: "Errore interno del server",
      503: "Servizio non disponibile",
    };
    const details = response.headers.get("Content-Type") === "application/json" ? response.json() : response.text();
    return this._createError(errorMessages[response.status] || response.status.toString(), "HTTPError", response.status, details);
  }

  _handleNetworkError(error, timeout) {
    if (error.name === "AbortError") {
      return this._createError("Richiesta annullata", "CancellationError", 499, "La richiesta è stata interrotta volontariamente dall'utente");
    }
    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      return this._createError("Errore di rete", "NetworkError", 0, "Impossibile raggiungere il server. Controlla la connessione.");
    }
    return this._createError("Errore imprevisto", error.name || "UnknownError", 500, error.message);
  }

  _createError(message, type, code, details) {
    return {
      message,
      type,
      code,
      details,
    };
  }

  async sendRequest(model, payload, requestTimeout = null) {
    if (requestTimeout === null) {
      requestTimeout = this.timeout;
    }

    this.isCancelled = false;

    const validationError = this._validateInput(model, payload);
    if (validationError) {
      return new RequestResult(null, null, validationError);
    }

    payload.model = model;
    this.abortController = new AbortController();

    try {
      if (this.isCancelled) {
        const cancelledError = this._createError("Richiesta annullata", "CancellationError", 499, "La richiesta è stata interrotta volontariamente dall'utente");
        return new RequestResult(null, null, cancelledError);
      }

      const response = await fetch(this._buildUrl("/chat/completions"), {
        method: "POST",
        headers: this._getHeaders(),
        body: JSON.stringify(payload),
        signal: this.abortController.signal,
      });

      if (this.isCancelled) {
        const cancelledError = this._createError("Richiesta annullata", "CancellationError", 499, "La richiesta è stata interrotta volontariamente dall'utente");
        return new RequestResult(null, null, cancelledError);
      }

      if (!response.ok) {
        const err = this._handleHttpError(response);
        return new RequestResult(null, null, err);
      }

      const respJson = await response.json();
      if (!respJson.choices || !respJson.choices[0].message || !respJson.choices[0].message.content) {
        const err = this._createError("Risposta non valida", "ParseError", 500, "La risposta non contiene il contenuto atteso");
        return new RequestResult(null, null, err);
      }

      const data = respJson.choices[0].message.content;
      return new RequestResult(respJson, data);
    } catch (error) {
      if (this.isCancelled) {
        const cancelledError = this._createError("Richiesta annullata", "CancellationError", 499, "La richiesta è stata interrotta volontariamente dall'utente");
        return new RequestResult(null, null, cancelledError);
      } else {
        const err = this._handleNetworkError(error, requestTimeout);
        return new RequestResult(null, null, err);
      }
    }
  }

  cancelRequest() {
    this.isCancelled = true;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    return true;
  }
}

// Esempio di utilizzo che include il caso di interruzione della richiesta
/*
(async () => {
  const options = {
    timeout: 90, // Imposta il timeout a 90 secondi
    baseUrl: "https://api.mistral.ai/v1", // URL base dell'API
  };
  const client = new ClientLLM("YOUR_API_KEY", options);
  const model = "example-model";
  const payload = {
    messages: [{ role: "user", content: "Hello!" }],
  };

  const result = await client.sendRequest(model, payload);
  if (result.error) {
    console.error(`Errore: ${result.error.message}`);
    console.error(`Dettagli: ${result.error.details}`);
    console.error(`Codice: ${result.error.code}`);
  } else {
    console.log(`Risposta: ${result.data}`);
  }
})();
*/

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

// const errorDumps = (err) => {
//   const s = JSON.stringify(err, null, 2);
//   if (s == "{}") return `${err}`;
//   return s;
// };
