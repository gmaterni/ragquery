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

const createRequestResult = (response = null, data = null, error = null) => {
  return {
    response,
    data,
    error,
  };
};

// Factory function per il client LLM
const ClientLLM = (apiKey, options = {}) => {
  // Variabili private all'interno della closure
  const timeout = options.timeout || 60;
  const baseUrl = options.baseUrl || "https://api.mistral.ai/v1";
  let abortController = null;
  let isCancelled = false;

  // Funzioni di supporto private
  const buildUrl = (endpoint) => {
    return `${baseUrl}${endpoint}`;
  };

  const getHeaders = () => {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  };

  const validateInput = (model, payload) => {
    if (!model || typeof model !== "string") {
      return createError("Modello non valido", "ValidationError", 400, "Il parametro model deve essere una stringa non vuota");
    }
    if (!payload || typeof payload !== "object") {
      return createError("Payload non valido", "ValidationError", 400, "Il payload deve essere un oggetto valido");
    }
    return null;
  };

  const handleHttpError = (response) => {
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
    return createError(errorMessages[response.status] || response.status.toString(), "HTTPError", response.status, details);
  };

  const handleNetworkError = (error, timeout) => {
    if (error.name === "AbortError") {
      return createError("Richiesta annullata", "CancellationError", 499, "La richiesta è stata interrotta volontariamente dall'utente");
    }
    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      return createError("Errore di rete", "NetworkError", 0, "Impossibile raggiungere il server. Controlla la connessione.");
    }
    return createError("Errore imprevisto", error.name || "UnknownError", 500, error.message);
  };

  const createError = (message, type, code, details) => {
    return {
      message,
      type,
      code,
      details,
    };
  };

  // Funzione principale per inviare la richiesta
  const sendRequest = async (model, payload, requestTimeout = null) => {
    if (requestTimeout === null) {
      requestTimeout = timeout;
    }

    isCancelled = false;

    const validationError = validateInput(model, payload);
    if (validationError) {
      return createRequestResult(null, null, validationError);
    }

    payload.model = model;
    abortController = new AbortController();

    try {
      if (isCancelled) {
        const cancelledError = createError("Richiesta annullata", "CancellationError", 499, "La richiesta è stata interrotta volontariamente dall'utente");
        return createRequestResult(null, null, cancelledError);
      }

      const response = await fetch(buildUrl("/chat/completions"), {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (isCancelled) {
        const cancelledError = createError("Richiesta annullata", "CancellationError", 499, "La richiesta è stata interrotta volontariamente dall'utente");
        return createRequestResult(null, null, cancelledError);
      }

      if (!response.ok) {
        const err = handleHttpError(response);
        return createRequestResult(null, null, err);
      }

      const respJson = await response.json();
      if (!respJson.choices || !respJson.choices[0].message || !respJson.choices[0].message.content) {
        const err = createError("Risposta non valida", "ParseError", 500, "La risposta non contiene il contenuto atteso");
        return createRequestResult(null, null, err);
      }

      const data = respJson.choices[0].message.content;
      return createRequestResult(respJson, data);
    } catch (error) {
      if (isCancelled) {
        const cancelledError = createError("Richiesta annullata", "CancellationError", 499, "La richiesta è stata interrotta volontariamente dall'utente");
        return createRequestResult(null, null, cancelledError);
      } else {
        const err = handleNetworkError(error, requestTimeout);
        return createRequestResult(null, null, err);
      }
    }
  };

  // Funzione per annullare la richiesta in corso
  const cancelRequest = () => {
    isCancelled = true;
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    return true;
  };

  // Interfaccia pubblica
  return {
    sendRequest,
    cancelRequest,
  };
};
