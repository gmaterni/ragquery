/** @format */
"use strict";

// Imports necessari per gli adapter e le funzioni di supporto
import { getApiKey } from "./js/services/key_retriever.js";
import { HttpLlmClient } from "./js/adapter/adapter_http_client.js";
import { PROVIDER_CONFIG, ADAPTERS } from "./js/llm_provider.js";



const startTestBtn = document.getElementById("start-test-btn");
const resultsTableBody = document.querySelector("#results-table tbody");
const logContainer = document.getElementById("log-container");

function log(message) {
    console.log(message);
    logContainer.innerHTML += `<div>${message}</div>`;
}

async function testModel(providerName, modelName) {
    const providerConfig = PROVIDER_CONFIG[providerName];
    const adapterName = providerConfig.adapter;
    const Adapter = ADAPTERS[adapterName];

    if (!Adapter) {
        return { status: "failed", reason: `Adapter ${adapterName} non trovato.` };
    }

    const apiKey = getApiKey(providerName);
    if (!apiKey) {
        return { status: "failed", reason: "Chiave API non trovata." };
    }

    const client = new HttpLlmClient(Adapter, apiKey);

    const payload = {
        // messages: [{ role: "user", content: "What is a large language model?" }],
        messages: [{ role: "user", content: "Possiamo dialogare in italiano?" }],
        model: modelName,
        temperature: 0.4,
        max_tokens: 1000,
    };

    try {
        log(`Testing ${providerName} - ${modelName}...`);
        const response = await client.sendRequest(payload, 15); // 15 secondi di timeout
        if (response && response.ok) {
            log(`SUCCESS: ${providerName} - ${modelName}`);
            return { status: "available" };
        } else {
            const errorInfo = response ? JSON.stringify(response.error) : "Risposta non valida";
            log(`FAILED: ${providerName} - ${modelName}. Errore: ${errorInfo}`);
            return { status: "failed", reason: errorInfo };
        }
    } catch (error) {
        const errorMessage = error.message || error.toString();
        log(`EXCEPTION: ${providerName} - ${modelName}. Eccezione: ${errorMessage}`);
        return { status: "failed", reason: errorMessage };
    }
}

async function runTests() {
    startTestBtn.disabled = true;
    resultsTableBody.innerHTML = ""; // Pulisce la tabella
    logContainer.innerHTML = ""; // Pulisce i log

    for (const providerName in PROVIDER_CONFIG) {
        const provider = PROVIDER_CONFIG[providerName];
        for (const modelName in provider.models) {
            const row = resultsTableBody.insertRow();
            const providerCell = row.insertCell(0);
            const modelCell = row.insertCell(1);
            const statusCell = row.insertCell(2);

            providerCell.textContent = providerName;
            modelCell.textContent = modelName;
            statusCell.textContent = "In corso...";

            const result = await testModel(providerName, modelName);

            if (result.status === "available") {
                statusCell.textContent = "Disponibile";
                statusCell.style.color = "lime"; // Verde più brillante per tema scuro
            } else {
                statusCell.textContent = `Non riuscito`;
                statusCell.style.color = "tomato"; // Rosso più brillante
                log(`Dettagli errore per ${providerName} - ${modelName}: ${result.reason}`);
            }
        }
    }

    startTestBtn.disabled = false;
}

startTestBtn.addEventListener("click", runTests);

// Non è più necessario inizializzare LlmProvider
document.addEventListener('DOMContentLoaded', () => {
    // Script pronto
});