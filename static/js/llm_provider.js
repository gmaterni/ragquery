/** @format */
"use strict";

import { MistralAdapter } from "./adapter/adapter_mistral.js";
import { GeminiAdapter } from "./adapter/adapter_gemini.js";
import { GroqAdapter } from "./adapter/adapter_groq.js";
import { UaDb } from "./services/uadb.js";
import { wnds } from "./app_ui.js";
import { DocType } from "./services/doc_types.js";
import { UaWindowAdm } from "./services/uawindow.js";
import { DATA_KEYS } from "./services/data_keys.js";

export const ADAPTERS = {
  MistralAdapter,
  GeminiAdapter,
  GroqAdapter,
};

export const PROVIDER_CONFIG = {
  mistral: {
    adapter: "MistralAdapter",
    models: {
      "mistral-large-latest": { windowSize: 128 },
      "mistral-medium-latest": { windowSize: 128 },
      "mistral-small-latest": { windowSize: 128 },
      "open-mixtral-8x7b": { windowSize: 32 },
    },
  },
  gemini: {
    adapter: "GeminiAdapter",
    models: {
      "gemini-2.0-flash": { windowSize: 200 },
      "gemini-2.5-flash": { windowSize: 200 }
    },
  },

  groq: {
    adapter: "GroqAdapter",
    models: {
      "llama-3.1-8b-instant": { windowSize: 8 },          // Meta, 131,072 tokens  
      "llama-3.3-70b-versatile": { windowSize: 8 },       // Meta, 131,072 tokens
      "meta-llama/llama-guard-4-12b": { windowSize: 8 },  // Meta, 131,072 tokens
      // MODELLI PREVIEW (Solo per valutazione, non per produzione)
      "qwen/qwen3-32b": { windowSize: 8 },                    // Alibaba Cloud, 131,072 tokens
    },
  }
};

const DEFAULT_PROVIDER_CONFIG = {
  provider: "gemini",
  model: "gemini-2.0-flash",
  windowSize: 200,
  adapter: "GeminiAdapter",
};

export const LlmProvider = {
  isTreeVisible: false,
  config: {
    provider: "",
    model: "",
    windowSize: 0,
    adapter: "",
  },
  container_id: "provvider_id",
  init() {
    const savedConfig = UaDb.readJson(DATA_KEYS.KEY_PROVIDER);
    if (this._isValidConfig(savedConfig)) {
      this.config = savedConfig;
    } else {
      if (!!savedConfig.provider)
        alert("Errore nella configurazione provider/model");
      this.config = { ...DEFAULT_PROVIDER_CONFIG };
      UaDb.saveJson(DATA_KEYS.KEY_PROVIDER, this.config);
    }
    this._updateActiveModelDisplay();
  },

  // Valida se una configurazione è corretta
  _isValidConfig(config) {
    if (!config || typeof config !== "object") return false;
    const { provider, model, adapter } = config;
    // Controlla se il provider exists
    if (!provider || !PROVIDER_CONFIG[provider]) return false;
    // Controlla se il model exists per quel provider
    if (!model || !PROVIDER_CONFIG[provider].models[model]) return false;
    // Controlla se l'adapter name è una stringa valida
    if (typeof adapter !== "string" || !ADAPTERS[adapter]) return false;
    return true;
  },

  getAdapter(adapterName) {
    if (adapterName) {
      return ADAPTERS[adapterName] || null;
    }
    // Se non viene fornito alcun nome, restituisce l'adapter della configurazione corrente
    const currentAdapterName = this.config.adapter;
    return ADAPTERS[currentAdapterName] || null;
  },
  // Visualizzazione tree
  toggleTreeView() {
    const wnd = UaWindowAdm.create(this.container_id);
    const container = wnd.getElement();
    if (!container) return;
    wnd.addClassStyle("provider-tree-container");
    this.isTreeVisible = !this.isTreeVisible;
    container.style.display = this.isTreeVisible ? "block" : "none";
    if (this.isTreeVisible) {
      this._buildTreeView();
    }
  },
  getConfig() {
    return this.config;
  },
  _buildTreeView() {
    const wnd = UaWindowAdm.get(this.container_id);
    const container = wnd.getElement()
    if (!container) return;
    let treeHtml = `
      <div class="provider-tree-header">
        <span>Seleziona Modello</span>
        <button class="provider-tree-close-btn">&times;</button>
      </div>
      <ul class="provider-tree">
    `;
    for (const providerName in PROVIDER_CONFIG) {
      const provider = PROVIDER_CONFIG[providerName];
      const isActiveProvider = providerName === this.config.provider;
      treeHtml += `
        <li class="provider-node">
          <span class="${isActiveProvider ? "active" : ""}" data-provider="${providerName}">
            ${isActiveProvider ? "&#9660;" : "&#9658;"} ${providerName}
          </span>
          <ul class="model-list" style="display: ${isActiveProvider ? "block" : "none"};">
      `;
      Object.keys(provider.models).forEach((modelName) => {
        const modelData = provider.models[modelName];
        const isActiveModel = isActiveProvider && modelName === this.config.model;
        treeHtml += `
          <li class="model-node ${isActiveModel ? "active" : ""}" 
              data-provider="${providerName}" 
              data-model="${modelName}">
            ${modelName} (${modelData.windowSize}k)
          </li>`;
      });
      treeHtml += `</ul></li>`;
    }
    treeHtml += `</ul>`;
    wnd.setHtml(treeHtml);
    this._addTreeEventListeners();
  },

  _addTreeEventListeners() {
    const container = UaWindowAdm.get(this.container_id).getElement();
    if (!container) return;
    const closeBtn = container.querySelector(".provider-tree-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.toggleTreeView());
    }
    // Click sui provider (per aprire/chiudere)
    container.querySelectorAll(".provider-node > span").forEach((span) => {
      span.addEventListener("click", (e) => {
        const modelList = e.target.nextElementSibling;
        const isOpening = modelList.style.display === "none";
        // Chiudi tutti i menu
        container.querySelectorAll(".model-list").forEach((ml) => (ml.style.display = "none"));
        container.querySelectorAll(".provider-node > span").forEach((s) => {
          s.innerHTML = `&#9658; ${s.dataset.provider}`;
        });
        // Se stavo aprendo, mostra il menu
        if (isOpening) {
          modelList.style.display = "block";
          e.target.innerHTML = `&#9660; ${e.target.dataset.provider}`;
        }
      });
    });
    // Click sui modelli (per selezionare)
    container.querySelectorAll(".model-node").forEach((node) => {
      node.addEventListener("click", (e) => {
        const providerName = e.target.dataset.provider;
        const modelName = e.target.dataset.model;
        this._setProviderAndModel(providerName, modelName);
      });
    });
  },

  _setProviderAndModel(provider, model) {
    // Crea la nuova configurazione
    this.config = {
      provider: provider,
      model: model,
      windowSize: PROVIDER_CONFIG[provider].models[model].windowSize,
      adapter: PROVIDER_CONFIG[provider].adapter,
    };

    // Salva nel database
    UaDb.saveJson(DATA_KEYS.KEY_PROVIDER, this.config);

    // Aggiorna il display
    this._updateActiveModelDisplay();

    // Ricostruisci il tree per aggiornare gli stati attivi
    if (this.isTreeVisible) {
      this._buildTreeView();
    }

    // Chiudi il tree
    this.toggleTreeView();
  },

  _updateActiveModelDisplay() {
    const displayElement = document.getElementById("active-model-display");
    if (displayElement) {
      displayElement.textContent = `${this.config.provider} / ${this.config.model} (${this.config.windowSize}k)`;
    }
  },

  showConfig() {
    const llmConfig = LlmProvider.getConfig();
    const docTypeConfig = DocType.getConfig();

    const html = `
      <div class="config-confirm">
          <table class="table-data">
                <tr><td>Provider</td><td>${llmConfig.provider}</td></tr>
                <tr><td>Modello</td><td>${llmConfig.model}</td></tr>
                <tr><td>Prompt Size</td><td>${llmConfig.windowSize}k</td></tr>
                <tr><td>Adapter</td><td>${llmConfig.adapter}</td></tr>
                <tr><td>Tipo Documento</td><td>${docTypeConfig.docType}</td></tr>
          </table>
      </div>
    `;
    wnds.winfo.show(html);
  },
};
