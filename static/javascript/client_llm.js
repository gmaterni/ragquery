/** @format */

const ClientLLM = (apiKey) => {
  let abortController = null;
  let isCancelled = false;

  const createResult = (ok, response = null, data = null, error = null) => {
    return {
      ok,
      response,
      data,
      error,
    };
  };

  const createError = (message, type, code, details) => ({
    message: message || null,
    type: type || null,
    code: code || null,
    details: {
      message: details?.message || null,
      type: details?.type || null,
      param: details?.param || null,
      code: details?.code || null,
    },
  });

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
      if (isCancelled) {
        return createError("Richiesta annullata dall'utente", "CancellationError", 499, { message: "La richiesta è stata interrotta volontariamente dall'utente" });
      } else {
        return createError("Richiesta interrotta per timeout", "TimeoutError", 408, { message: "La richiesta è stata interrotta a causa di un timeout", isTimeout: true });
      }
    }
    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      return createError("Errore di rete", "NetworkError", 0, { message: "Impossibile raggiungere il server. Controlla la connessione." });
    }
    return createError("Errore imprevisto", error.name || "UnknownError", 500, { message: error.message || "Si è verificato un errore sconosciuto" });
  };

  const sendRequest = async (url, payload, requestTimeout = 60) => {
    isCancelled = false;
    abortController = new AbortController();
    const actualTimeoutMs = requestTimeout * 1000;

    const timeoutId = setTimeout(() => {
      if (abortController) {
        abortController.abort();
      }
    }, actualTimeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (isCancelled) {
        const cancelledError = createError("Richiesta annullata", "CancellationError", 499, { message: "La richiesta è stata interrotta volontariamente dall'utente" });
        return createResult(false, null, null, cancelledError);
      }
      if (!response.ok) {
        const err = await handleHttpError(response);
        return createResult(false, null, null, err);
      }
      const respJson = await response.json();
      return createResult(true, respJson);
    } catch (error) {
      const err = handleNetworkError(error);
      return createResult(false, null, null, err);
    } finally {
      clearTimeout(timeoutId);
      abortController = null;
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

  return {
    sendRequest,
    createError,
    cancelRequest,
  };
};
