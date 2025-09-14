"use strict";

export const DocumentType = {
    NORMATIVI: "normativi",
    PROCEDURALI: "procedurali",
    DOCUMENTALI: "documentali",
    INFORMATIVI: "informativi",
    NARRATIVI: "narrativi",
    ARGOMENTATIVI: "argomentativi",
    ANALITICI: "analitici",
    PROGETTUALI: "progettuali",
};

export const STRING_TO_DOC_TYPE = {};
Object.values(DocumentType).forEach((type) => {
    STRING_TO_DOC_TYPE[type] = type;
});

export const EXTRACTION_CRITERIA = {
    [DocumentType.NORMATIVI]: {
        description: "Documenti con valore vincolante che prescrivono comportamenti obbligatori",
        focus: "Massima precisione terminologica - ogni parola può avere valore legale",
        examples: ["regolamento aziendale", "contratto commerciale", "polizza assicurativa", "normativa tecnica", "specifiche API"],
        instructions: [
            "Identifica chi ha poteri specifici e cosa può o deve fare secondo il documento",
            "Estrai ogni obbligo specificando chi deve fare cosa in quali condizioni precise",
            "Registra parametri numerici critici mantenendo valori e unità di misura esatti",
            "Collega ogni violazione alla sua conseguenza specifica dichiarata nel testo",
        ],
    },
    [DocumentType.PROCEDURALI]: {
        description: "Documenti che guidano all'esecuzione corretta di attività specifiche",
        focus: "Sequenza operativa precisa - alterazioni compromettono il risultato",
        examples: ["manuale operativo", "istruzioni assemblaggio", "protocollo medico", "recipe", "guida installazione"],
        instructions: ["Estrai la sequenza di azioni nell'ordine corretto con tutti i parametri operativi", "Identifica dove e come verificare che il processo stia funzionando correttamente", "Registra cosa fare quando qualcosa va storto o non funziona come previsto"],
    },
    [DocumentType.DOCUMENTALI]: {
        description: "Documenti che registrano fatti accaduti per consultazione e tracciabilità",
        focus: "Accuratezza fattuale - distinguere chiaramente fatti da interpretazioni",
        examples: ["verbale riunione", "report incidente", "cartella clinica", "audit report", "log eventi"],
        instructions: ["Ordina gli eventi cronologicamente con date, orari e partecipanti identificati", "Registra misurazioni e dati quantitativi esatti specificando fonte e contesto di rilevazione", "Documenta chi ha preso quali decisioni, quando e per quali motivi dichiarati"],
    },
    [DocumentType.INFORMATIVI]: {
        description: "Documenti che trasmettono informazioni su situazioni ed eventi",
        focus: "Distinzione netta tra fatti riportati e interpretazioni dell'autore",
        examples: ["articolo giornalistico", "report di mercato", "documento informativo", "comunicato stampa"],
        instructions: ["Estrai fatti verificabili (chi-cosa-dove-quando) indicando il livello di certezza", "Registra collegamenti causa-effetto solo quando presentati come relazioni certe", "Identifica le fonti delle informazioni e segnala eventuali limitazioni o bias"],
    },
    [DocumentType.NARRATIVI]: {
        description: "Documenti che raccontano storie ed esperienze attraverso strutture narrative",
        focus: "Struttura narrativa e sviluppo dei personaggi nel loro arco evolutivo",
        examples: ["racconto", "biografia", "caso studio narrativo", "cronaca storica", "testimonianza"],
        instructions: ["Identifica la situazione iniziale, lo sviluppo dei conflitti e come si risolve", "Estrai i personaggi principali e come cambiano durante la storia", "Registra gli eventi che fanno progredire o cambiare direzione alla narrazione"],
    },
    [DocumentType.ARGOMENTATIVI]: {
        description: "Documenti che sostengono tesi attraverso ragionamenti strutturati",
        focus: "Catena logica dell'argomentazione e qualità delle evidenze",
        examples: ["saggio accademico", "documento posizione", "proposta progetto", "analisi critica"],
        instructions: ["Identifica la tesi principale che l'autore vuole dimostrare o sostenere", "Estrai le prove concrete utilizzate: dati, esempi, citazioni, ragionamenti", "Registra le obiezioni che l'autore considera e come tenta di confutarle"],
    },
    [DocumentType.ANALITICI]: {
        description: "Documenti che interpretano dati per identificare pattern e trarre conclusioni",
        focus: "Metodologia utilizzata e solidità delle inferenze dai dati",
        examples: ["studio di mercato", "analisi performance", "valutazione tecnica", "ricerca empirica"],
        instructions: ["Definisci cosa viene analizzato, con quali dati e in quale periodo temporale", "Estrai i pattern principali e le correlazioni significative identificate", "Registra le conclusioni dell'autore specificando il livello di confidenza espresso"],
    },
    [DocumentType.PROGETTUALI]: {
        description: "Documenti che definiscono obiettivi futuri e modalità per raggiungerli",
        focus: "Obiettivi concreti, risorse necessarie e gestione dei rischi",
        examples: ["piano progetto", "proposta tecnica", "business plan", "strategia implementazione"],
        instructions: ["Estrai gli obiettivi specifici con scadenze e criteri misurabili di successo", "Identifica chi deve fare cosa, con quali risorse e competenze necessarie", "Registra i rischi principali e le contromisure previste per mitigarli"],
    },
};

export function getInstructions(docType) {
    const info = getDocumentInfo(docType);
    return info.instructions.join("\n");
}

export function getDescription(docType) {
    const info = getDocumentInfo(docType);
    return info.description;
}

export function getFocus(docType) {
    const info = getDocumentInfo(docType);
    return info.focus;
}

export function getDocumentInfo(docType) {
    if (typeof docType === "string") {
        if (!(docType in STRING_TO_DOC_TYPE)) {
            throw new Error(`Tipo documento non supportato: ${docType}`);
        }
        docType = STRING_TO_DOC_TYPE[docType];
    }
    return EXTRACTION_CRITERIA[docType];
}

export function listTypes() {
    return Object.keys(STRING_TO_DOC_TYPE);
}

export function listExamples() {
    const examples = [];
    for (const [docType, criteria] of Object.entries(EXTRACTION_CRITERIA)) {
        const exampleList = criteria.examples || [];
        for (const example of exampleList) {
            examples.push(`${example.padEnd(30)} :  ${docType}`);
        }
    }
    return examples.sort().join("\n");
}

export function listTypeExample() {
    const arr = [];
    for (const [docType, criteria] of Object.entries(EXTRACTION_CRITERIA)) {
        const esempi = criteria.examples || [];
        arr.push(docType, esempi);
    }
    return arr;
}
