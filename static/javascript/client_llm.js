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

const RequestResult = (response = null, data = null, error = null) => {
  return {
    response,
    data,
    error,
  };
};

const ClientLLM = (apiKey, options = {}) => {
  const timeoutMs = options.timeout ? options.timeout * 1000 : 60000;
  const baseUrl = options.baseUrl || "https://api.mistral.ai/v1";
  let abortController = null;
  let isCancelled = false;

  const buildUrl = (endpoint) => {
    return `${baseUrl}${endpoint}`;
  };

  const getHeaders = () => {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  };

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
        if (response.status === 400 && detailsContent) {
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

  const handleNetworkError = (error) => {
    if (error.name === "AbortError") {
      return createError("Richiesta annullata", "CancellationError", 499, { message: "La richiesta è stata interrotta volontariamente dall'utente" });
    }
    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      return createError("Errore di rete", "NetworkError", 0, { message: "Impossibile raggiungere il server. Controlla la connessione." });
    }
    return createError("Errore imprevisto", error.name || "UnknownError", 500, { message: error.message || "Si è verificato un errore sconosciuto" });
  };

  const createError = (message, type, code, details) => {
    return {
      message,
      type,
      code,
      details: details || {},
    };
  };

  const sendRequest = async (payload, requestTimeout = null) => {
    isCancelled = false;
    abortController = new AbortController();
    const actualTimeoutMs = requestTimeout !== null ? requestTimeout * 1000 : timeoutMs;
    const timeoutId = setTimeout(() => {
      if (abortController) {
        isCancelled = true;
        abortController.abort();
      }
    }, actualTimeoutMs);

    try {
      const url = buildUrl("/chat/completions");
      const response = await fetch(url, {
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
      // AAA specifica di mistral
      if (!respJson.choices || !respJson.choices[0] || !respJson.choices[0].message || respJson.choices[0].message.content === undefined) {
        const err = createError("Risposta non valida", "ParseError", 500, { message: "La risposta non contiene il contenuto atteso" });
        return RequestResult(null, null, err);
      }
      const data = respJson.choices[0].message.content;

      return RequestResult(respJson, data);
    } catch (error) {
      clearTimeout(timeoutId);
      const err = handleNetworkError(error);
      return RequestResult(null, null, err);
    }
  };

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
