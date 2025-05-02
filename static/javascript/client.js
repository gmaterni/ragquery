/** @format */
const MistralApiClient = (apiKey, options = {}) => {
  const timeout = options.timeout || 60;
  const baseUrl = options.baseUrl || "https://api.mistral.ai/v1";
  let abortController = null;
  let requestExplicitlyCancelled = false;

  const _buildUrl = (endpoint) => {
    return `${baseUrl}${endpoint}`;
  };

  const _getHeaders = () => {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  };

  const _handleHttpError = async (response) => {
    const errorMessages = {
      400: "Richiesta non valida",
      401: "Non autorizzato - Controlla la API key",
      403: "Accesso negato",
      404: "Endpoint non trovato",
      429: "Troppe richieste - Rate limit superato",
      500: "Errore interno del server",
      503: "Servizio non disponibile",
    };
    let details;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    return _createError({
      message: errorMessages[response.status] || response.statusText,
      type: "HTTPError",
      code: response.status,
      details,
    });
  };

  const _handleNetworkError = (error, timeout) => {
    if (error.name === "AbortError" && requestExplicitlyCancelled) {
      return null;
    }
    if (error.name === "AbortError" && !requestExplicitlyCancelled) {
      return _createError({
        message: "Richiesta interrotta per timeout",
        type: "TimeoutError",
        code: 408,
        details: `La richiesta ha superato il limite di ${timeout} secondi`,
      });
    }
    return _createError({
      message: "Errore di rete",
      type: "NetworkError",
      code: 0,
      details: "Impossibile raggiungere il server. Controlla la connessione.",
    });
  };
  const _createError = ({ message, type, code, details }) => {
    return { message, type, code, details };
  };
  const chat = async (model, payload, requestTimeout = timeout) => {
    payload["model"] = model;
    requestExplicitlyCancelled = false;
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), requestTimeout * 1000);
    try {
      const response = await fetch(_buildUrl("/chat/completions"), {
        method: "POST",
        headers: _getHeaders(),
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });
      if (!response.ok) {
        return [null, await _handleHttpError(response)];
      }
      const data = await response.json();
      if (!data?.choices?.[0]?.message?.content) {
        return [
          null,
          _createError({
            message: "Risposta non valida",
            type: "ParseError",
            code: 500,
            details: "La risposta non contiene il contenuto atteso",
          }),
        ];
      }
      return [data, null];
    } catch (error) {
      if (requestExplicitlyCancelled) {
        return null;
      }
      const networkError = _handleNetworkError(error, requestTimeout);
      if (networkError === null) {
        return null;
      }
      return [null, networkError];
    } finally {
      clearTimeout(timeoutId);
      abortController = null;
      requestExplicitlyCancelled = false;
    }
  };

  const cancelRequest = () => {
    if (abortController) {
      requestExplicitlyCancelled = true;
      abortController.abort();
      abortController = null;
    }
    return null;
  };

  return {
    chat,
    cancelRequest,
  };
};

//////////////

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
  if (s == "{}") return `${err}`;
  return s;
};

// const errorMsg = (err) => {
//   const s = err.details.message;
//   return s;
// };
