/**
 * Gestore per recuperare le API key offuscate direttamente nel codice.
 * Questo script utilizza una funzione di de-offuscamento per restituire la chiave API
 * basandosi su un array di stringhe codificate.
 */

// Array di stringhe codificate per ogni provider
const keys = {
    gemini: ["Rk5/Zlh+RlI=", "Z29ROnlnW1A=", "VXlTXHxWSnc=", "PXR/VntSZG8=", "e1hwU0hPaA=="],
    mistral: ["S0ZaeFJ4W0s=", "WHw6bFw6VEo=", "cHtaX0pfNm8=", "aE5cS3FVbzk="],
    groq: ["bHhwZHp5WlU=", "VX9JS0p8TFM=", "eVl6XX9dPno=", "XExpfmc4S14=", "aVVOdX1vb3g=", "VHVsNjxZbW8=", "XWt3SGh+R2w="],
    huggingface: ["bWtkVndLdnw=", "aV59e3hGfEo=", "aHNJd2lIW2g=", "TEteWk9bVVU=", "SktKSmY="]
};

/**
 * Funzione di de-offuscamento. Prende un array di stringhe, le decodifica
 * da base64, applica uno shift di -5 ad ogni carattere e le unisce.
 * @param {string[]} arr - L'array di stringhe codificate.
 * @returns {string} La chiave API decodificata.
 */
function umgm(arr) {
    if (!arr) return null;
    return arr
        .map((part) => {
            const ch = atob(part); // Decodifica da Base64
            return ch
                .split("")
                .map((char) => String.fromCharCode((char.charCodeAt(0) - 5 + 256) % 256)) // Applica lo shift
                .join("");
        })
        .join("");
}

/**
 * Restituisce la chiave API per un provider specifico dopo averla de-offuscata.
 * @param {string} provider - Il nome del provider (es. "gemini", "mistral").
 * @returns {string|null} La chiave API decodificata o null se il provider non è valido.
 */
function getApiKey(provider) {
    const lowerCaseProvider = provider.toLowerCase();
    const encodedKeyArray = keys[lowerCaseProvider];
    if (!encodedKeyArray) {
        console.error(`Nessun array di chiavi trovato per il provider: ${provider}`);
        return null;
    }
    return umgm(encodedKeyArray);
}

// Rende la funzione disponibile globalmente per essere usata dagli script non-module
window.getApiKey = getApiKey;
