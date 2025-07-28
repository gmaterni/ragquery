/**
 * @format
 * @description
 * Questo file definisce un client HTTP generico per interagire con vari servizi LLM.
 * La classe `HttpLlmClient` non contiene logica specifica del provider, ma si affida
 * a un "adattatore" (preso da `llm_adapters.js`) per gestire le specificità di ogni API.
 */

class HttpLlmClient {
  /**
   * Inizializza il client con un adattatore e una chiave API specifici.
   * @param {object} adapter - L'oggetto adattatore per il provider specifico.
   * @param {string} apiKey - La chiave API per il servizio.
   */
  constructor(adapter, apiKey) {
    this.adapter = adapter;
    this.apiKey = apiKey;
    this.abortController = null;
    this.isCancelled = false;

    if (!this.adapter) {
      throw new Error("Un'istanza di HttpLlmClient richiede un adattatore valido.");
    }
    if (!this.apiKey) {
      throw new Error("Un'istanza di HttpLlmClient richiede una API key valida.");
    }
  }

  /**
   * Invia una richiesta al provider LLM configurato.
   * @param {object} genericPayload - Il payload di richiesta in formato generico (stile OpenAI).
   * @param {number} [timeout=60] - Il timeout in secondi per la richiesta.
   * @returns {Promise<object>} Un oggetto risultato con { ok, data, response, error }.
   */
  async sendRequest(genericPayload, timeout = 60) {
    const model = genericPayload.model;
    if (!model) {
      return this._createResult(false, null, null, this._createError("Il campo 'model' è obbligatorio nel payload.", "ValidationError"));
    }

    // Usa l'adattatore e la chiave API memorizzati nell'istanza
    const url = this.adapter.buildUrl(model, this.apiKey);
    const headers = this.adapter.buildHeaders(this.apiKey);
    const adaptedPayload = this.adapter.adaptPayload(genericPayload);

    // Esegue la chiamata di rete
    const result = await this._fetch(url, adaptedPayload, headers, timeout);

    if (result.ok) {
      try {
        // Usa l'adattatore per estrarre i dati dalla risposta
        const responseData = this.adapter.parseResponse(result.response);
        if (responseData === null) {
          throw new Error("Impossibile estrarre i dati dalla risposta.");
        }
        return this._createResult(true, result.response, responseData);
      } catch (error) {
        return this._createResult(false, result.response, null, this._createError("Struttura della risposta non valida.", "ParsingError", null, error));
      }
    } else {
      // Prova a usare un parser di errori specifico del provider, se esiste
      if (this.adapter.parseError) {
        result.error = this.adapter.parseError(result.error);
      }
      return result; // Restituisce il risultato con l'errore già formattato
    }
  }

  /**
   * Annulla la richiesta in corso.
   * @returns {boolean} True se una richiesta è stata annullata, altrimenti false.
   */
  cancelRequest() {
    this.isCancelled = true;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      return true;
    }
    return false;
  }

  // --- Metodi privati di gestione interna ---

  _createResult(ok, response = null, data = null, error = null) {
    return { ok, response, data, error };
  }

  _createError(message, type, code, details) {
    return {
      message: message || null,
      type: type || null,
      code: code || null,
      details: details || null,
    };
  }

  async _handleHttpError(response) {
    const errorMessages = {
      400: "Richiesta non valida (Bad Request)",
      401: "Non autorizzato (Unauthorized) - Controlla la API key",
      403: "Accesso negato (Forbidden)",
      404: "Endpoint non trovato (Not Found)",
      429: "Troppe richieste (Too Many Requests) - Rate limit superato",
      500: "Errore interno del server (Internal Server Error)",
      503: "Servizio non disponibile (Service Unavailable)",
    };
    const message = errorMessages[response.status] || `Errore HTTP ${response.status}`;
    let detailsContent;
    try {
      detailsContent = await response.json();
    } catch (e) {
      detailsContent = await response.text();
    }
    return this._createError(message, "HTTPError", response.status, detailsContent);
  }

  _handleNetworkError(error) {
    if (error.name === "AbortError") {
      const message = this.isCancelled ? "Richiesta annullata dall'utente" : "Richiesta interrotta per timeout";
      const type = this.isCancelled ? "CancellationError" : "TimeoutError";
      const code = this.isCancelled ? 499 : 408;
      return this._createError(message, type, code);
    }
    if (error instanceof TypeError) {
      return this._createError("Errore di rete. Controlla la connessione o l'URL dell'endpoint.", "NetworkError");
    }
    return this._createError("Errore di rete imprevisto.", "UnknownNetworkError", null, error);
  }

  async _fetch(url, payload, headers, timeout) {
    this.isCancelled = false;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    const timeoutId = setTimeout(() => this.abortController.abort(), timeout * 1000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal,
      });

      clearTimeout(timeoutId);

      if (this.isCancelled) {
        return this._createResult(false, null, null, this._handleNetworkError(new DOMException("Request aborted", "AbortError")));
      }

      if (!response.ok) {
        const error = await this._handleHttpError(response);
        return this._createResult(false, null, null, error);
      }

      const responseJson = await response.json();
      return this._createResult(true, responseJson);
    } catch (error) {
      clearTimeout(timeoutId);
      const networkError = this._handleNetworkError(error);
      return this._createResult(false, null, null, networkError);
    } finally {
      this.abortController = null;
    }
  }
}

// Rendi la classe disponibile globalmente
window.HttpLlmClient = HttpLlmClient;

/*
const PROVVIDER = "gemini";
const MODEL = "gemini-2.0-flash";
const apiKey = getApiKey(PROVVIDER);
const client = new HttpLlmClient(adapter, apiKey);
*/