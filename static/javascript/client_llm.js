/** @format */

const errorDetails = {
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

const responseDetails = {
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

/**
 * Crea un oggetto di risultato standardizzato
 * @param {Object} response - La risposta completa dall'API
 * @param {String|Object} data - I dati estratti dalla risposta
 * @param {Object} error - Dettagli dell'errore, se presente
 * @returns {Object} - Oggetto di risultato standardizzato
 */
const RequestResult = (response = null, data = null, error = null) => {
  return {
    response,
    data,
    error,
  };
};

/**
 * Factory function per creare un client LLM
 * @param {String} apiKey - La chiave API per l'autenticazione
 * @param {Object} options - Opzioni di configurazione
 * @returns {Object} - Interfaccia pubblica del client
 */
const ClientLLM = (apiKey, options = {}) => {
  // Converti secondi in millisecondi
  const timeoutMs = options.timeout ? options.timeout * 1000 : 60000;
  const baseUrl = options.baseUrl || "https://api.mistral.ai/v1";
  let abortController = null;
  let isCancelled = false;

  /**
   * Costruisce l'URL completo per l'endpoint specificato
   * @param {String} endpoint - L'endpoint API
   * @returns {String} - URL completo
   */
  const buildUrl = (endpoint) => {
    return `${baseUrl}${endpoint}`;
  };

  /**
   * Genera gli header HTTP per le richieste
   * @returns {Object} - Headers HTTP
   */
  const getHeaders = () => {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  };

  /**
   * Valida i parametri di input
   * @param {String} model - Il modello LLM da utilizzare
   * @param {Object} payload - Il payload della richiesta
   * @returns {Object|null} - Oggetto errore o null se valido
   */
  const validateInput = (model, payload) => {
    if (!model || typeof model !== "string") {
      return createError("Modello non valido", "ValidationError", 400, { message: "Il parametro model deve essere una stringa non vuota" });
    }
    if (!payload || typeof payload !== "object") {
      return createError("Payload non valido", "ValidationError", 400, { message: "Il payload deve essere un oggetto valido" });
    }

    // Verifica che il payload contenga i campi necessari
    if (!payload.messages || !Array.isArray(payload.messages) || payload.messages.length === 0) {
      return createError("Payload incompleto", "ValidationError", 400, { message: "Il payload deve contenere un array 'messages' non vuoto" });
    }

    return null;
  };

  /**
   * Gestisce gli errori HTTP
   * @param {Response} response - L'oggetto risposta HTTP
   * @returns {Promise<Object>} - Promise che risolve con un oggetto errore
   */
  const handleHttpError = async (response) => {
    const errorMessages = {
      400: "Richiesta non valida",
      401: "Non autorizzato - Controlla la API key",
      403: "Accesso negato",
      404: "Endpoint non trovato",
      429: "Troppe richieste - Rate limit superato",
      500: "Errore interno del server",
      503: "Servizio non disponibile",
    };

    let detailsContent;
    let errorType = "HTTPError";
    let message = errorMessages[response.status] || `Errore HTTP ${response.status}`;

    try {
      if (response.headers.get("Content-Type")?.includes("application/json")) {
        detailsContent = await response.json();

        // Verifica errori specifici per input troppo lungo
        if (response.status === 400 && detailsContent) {
          // Verifica se c'è un messaggio di errore relativo alla lunghezza dell'input
          const errorMsg = typeof detailsContent.error === "string" ? detailsContent.error : detailsContent.message || detailsContent.error?.message;

          if (
            errorMsg &&
            (errorMsg.includes("token limit") || errorMsg.includes("token exceeded") || errorMsg.includes("input too long") || errorMsg.includes("context length") || errorMsg.includes("max tokens"))
          ) {
            message = "Input troppo lungo - Superato il limite di token";
            errorType = "TokenLimitError";
          }
        }
      } else {
        detailsContent = await response.text();
        // Verifica anche nel testo semplice
        if (response.status === 400 && (detailsContent.includes("token limit") || detailsContent.includes("input too long") || detailsContent.includes("context length"))) {
          message = "Input troppo lungo - Superato il limite di token";
          errorType = "TokenLimitError";
        }
      }
    } catch (e) {
      detailsContent = { message: "Impossibile estrarre i dettagli dell'errore" };
    }

    return createError(message, errorType, response.status, typeof detailsContent === "string" ? { message: detailsContent } : detailsContent);
  };

  /**
   * Gestisce gli errori di rete
   * @param {Error} error - L'errore catturato
   * @returns {Object} - Oggetto errore standardizzato
   */
  const handleNetworkError = (error) => {
    if (error.name === "AbortError") {
      return createError("Richiesta annullata", "CancellationError", 499, { message: "La richiesta è stata interrotta volontariamente dall'utente" });
    }
    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      return createError("Errore di rete", "NetworkError", 0, { message: "Impossibile raggiungere il server. Controlla la connessione." });
    }
    return createError("Errore imprevisto", error.name || "UnknownError", 500, { message: error.message || "Si è verificato un errore sconosciuto" });
  };

  /**
   * Crea un oggetto errore standardizzato
   * @param {String} message - Messaggio principale dell'errore
   * @param {String} type - Tipo di errore
   * @param {Number} code - Codice di errore
   * @param {Object} details - Dettagli aggiuntivi dell'errore
   * @returns {Object} - Oggetto errore standardizzato
   */
  const createError = (message, type, code, details) => {
    return {
      message,
      type,
      code,
      details: details || {},
    };
  };

  /**
   * Invia una richiesta al modello LLM
   * @param {String} model - Il modello LLM da utilizzare
   * @param {Object} payload - Il payload della richiesta
   * @param {Number} requestTimeout - Timeout in secondi (sovrascrive il default)
   * @returns {Promise<Object>} - Promise che risolve con un RequestResult
   */
  const sendRequest = async (model, payload, requestTimeout = null) => {
    // Resetta lo stato della richiesta
    isCancelled = false;

    // Valida input
    const validationError = validateInput(model, payload);
    if (validationError) {
      return RequestResult(null, null, validationError);
    }

    // Prepara la richiesta
    // AAA payload = { ...payload, model };
    payload["model"] = model;

    abortController = new AbortController();

    // Imposta il timeout
    const actualTimeoutMs = requestTimeout !== null ? requestTimeout * 1000 : timeoutMs;
    const timeoutId = setTimeout(() => {
      if (abortController) {
        isCancelled = true;
        abortController.abort();
      }
    }, actualTimeoutMs);

    try {
      const response = await fetch(buildUrl("/chat/completions"), {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      // Puliamo il timeout poiché la richiesta è completata
      clearTimeout(timeoutId);

      // Se la richiesta è stata annullata dopo che la risposta è arrivata
      if (isCancelled) {
        const cancelledError = createError("Richiesta annullata", "CancellationError", 499, { message: "La richiesta è stata interrotta volontariamente dall'utente" });
        return RequestResult(null, null, cancelledError);
      }

      // Gestisci errori HTTP
      if (!response.ok) {
        const err = await handleHttpError(response);
        return RequestResult(null, null, err);
      }

      // Elabora la risposta
      const respJson = await response.json();

      // Verifica che la risposta contenga i dati attesi
      if (!respJson.choices || !respJson.choices[0] || !respJson.choices[0].message || respJson.choices[0].message.content === undefined) {
        const err = createError("Risposta non valida", "ParseError", 500, { message: "La risposta non contiene il contenuto atteso" });
        return RequestResult(null, null, err);
      }

      const data = respJson.choices[0].message.content;
      return RequestResult(respJson, data);
    } catch (error) {
      // Puliamo il timeout in caso di errore
      clearTimeout(timeoutId);

      // Gestisci errori di rete
      const err = handleNetworkError(error);
      return RequestResult(null, null, err);
    }
  };

  /**
   * Annulla una richiesta in corso
   * @returns {Boolean} - True se l'annullamento è stato avviato
   */
  const cancelRequest = () => {
    isCancelled = true;
    if (abortController) {
      abortController.abort();
      abortController = null;
      return true;
    }
    return false;
  };

  // Interfaccia pubblica
  return {
    sendRequest,
    cancelRequest,
  };
};
