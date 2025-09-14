"use strict";
import {
    DocumentType,
    getInstructions,
    getDescription,
    getFocus,
    listTypes,
    listExamples,
    listTypeExample
} from './llm_instructions.js';
import { getTemplate } from './llm_templates.js';

const SYSTEM = "system";
const USER = "user";
const ASSISTANT = "assistant";

/**
 * Costruisce l'intestazione di un messaggio di sistema.
 * @param {string} objective - L'obiettivo del prompt.
 * @param {string|null} context - Il contesto del compito (opzionale).
 * @param {string|null} focus - Il principio guida (opzionale).
 * @returns {string} L'intestazione formattata.
 */
function buildSystemMessageHeader(objective, context = null, focus = null) {
    let header = `## Obiettivo\n${objective}\n`;
    if (context) header += `## Contesto del compito\n${context}\n`;
    if (focus) header += `## Principio guida\n${focus}\n`;
    return header;
}

/**
 * Un oggetto per assemblare messaggi per il prompt.
 * @type {Object}
 */
const assembler = {
    messages: [],
    labelPattern: /^(\S+):\s*/g,

    /**
     * Imposta il messaggio di sistema.
     * @param {string} content - Il contenuto del messaggio di sistema.
     * @returns {Object} L'istanza dell'assembler per il chaining.
     */
    setSystemMessage(content) {
        this.messages = this.messages.filter((msg) => msg.role !== SYSTEM);
        const systemMessage = { role: SYSTEM, content: content };
        this.messages.unshift(systemMessage);
        return this;
    },

    /**
     * Aggiunge un messaggio utente.
     * @param {string} content - Il contenuto del messaggio utente.
     * @returns {Object} L'istanza dell'assembler per il chaining.
     */
    addUserMessage(content) {
        const userMessage = { role: USER, content: content };
        this.messages.push(userMessage);
        return this;
    },

    /**
     * Aggiunge un messaggio assistente.
     * @param {string} content - Il contenuto del messaggio assistente.
     * @returns {Object} L'istanza dell'assembler per il chaining.
     */
    addAssistantMessage(content) {
        const assistantMessage = { role: ASSISTANT, content: content };
        this.messages.push(assistantMessage);
        return this;
    },

    /**
     * Ottiene i messaggi assemblati, opzionalmente puliti.
     * @param {RegExp} [pattern] - Il pattern regolare per pulire i messaggi.
     * @returns {Array} Un array di messaggi.
     */
    getMessages(pattern = this.labelPattern) {
        const msgs = [...this.messages];
        for (let i = 0; i < msgs.length; i++) {
            msgs[i].content = msgs[i].content.replace(pattern, '');
        }
        return msgs;
    },

    /**
     * Cancella tutti i messaggi.
     * @returns {Object} L'istanza dell'assembler per il chaining.
     */
    clear() {
        this.messages = [];
        return this;
    }
};

/**
 * Oggetto per la costruzione di prompt per il LLM.
 */
export const promptBuilder = {
    /**
     * Costruisce un prompt per estrarre informazioni strutturate da un documento.
     * @param {string} docContent - Il contenuto del documento da analizzare.
     * @param {string} docType - Il tipo di documento.
     * @returns {Array} Un array di messaggi nel formato {role: string, content: string}.
     * @throws {Error} Se docContent o docType non sono validi.
     */
    extractionPrompt: (docContent, docType) => {
        if (typeof docContent !== 'string' || !docContent.trim()) {
            throw new Error("docContent deve essere una stringa non vuota");
        }
        if (!docType || typeof docType !== 'string') {
            throw new Error("docType deve essere una stringa valida");
        }

        const instructions = getInstructions(docType) || "Nessuna istruzione specifica fornita.";
        const description = getDescription(docType) || "un documento";
        const focus = getFocus(docType) || "estrarre le informazioni in modo accurato";
        const template = getTemplate(docType) || "Nessun formato specifico richiesto.";

        const systemMessage = buildSystemMessageHeader(
            "Estrai informazioni strutturate dal documento fornito.",
            `Stai analizzando ${description}`,
            `Durante l'estrazione, la tua priorità assoluta è: "${focus}".`
        ) + `
## Istruzioni
${instructions}
## Formato risposta
${template}
## Note
Salta i campi non presenti nel documento.
`;

        const userMessage = `
## Documento da analizzare
\`\`\`text
${docContent}
\`\`\`
---
Estrai le informazioni dal documento seguendo le istruzioni e produci la risposta in base al formato risposta.
`;

        assembler.clear();
        assembler.setSystemMessage(systemMessage);
        assembler.addUserMessage(userMessage);
        return assembler.getMessages();
    },

    /**
     * Costruisce un prompt per unificare documenti strutturati in una knowledge base.
     * @param {string} contents - I contenuti dei documenti da unificare.
     * @param {string} docType - Il tipo di documento.
     * @returns {Array} Un array di messaggi nel formato {role: string, content: string}.
     * @throws {Error} Se contents o docType non sono validi.
     */
    unificationPrompt: (contents, docType) => {
        if (typeof contents !== 'string' || !contents.trim()) {
            throw new Error("contents deve essere una stringa non vuota");
        }
        if (!docType || typeof docType !== 'string') {
            throw new Error("docType deve essere una stringa valida");
        }

        const template = getTemplate(docType) || "Nessun formato specifico richiesto.";

        const systemMessage = buildSystemMessageHeader(
            "Unifica i documenti strutturati in un'unica knowledge base."
        ) + `
## Istruzioni
1. Analizza i documenti strutturati forniti
2. Identifica argomenti comuni e correlazioni tra le informazioni
3. Consolida le informazioni eliminando duplicati
4. Unifica le relazioni causali e sequenziali
## Formato risposta
${template}
`;

        const userMessage = `
## Informazioni da unificare
\`\`\`text
${contents}
\`\`\`
Produci una knowledge base consolidata seguendo il formato risposta.
`;

        assembler.clear();
        assembler.setSystemMessage(systemMessage);
        assembler.addUserMessage(userMessage);
        return assembler.getMessages();
    },

    /**
     * Costruisce un prompt per estrarre informazioni da una knowledge base basate su una domanda.
     * @param {string} kbContent - Il contenuto della knowledge base.
     * @param {string} question - La domanda a cui rispondere.
     * @param {string} docType - Il tipo di documento.
     * @returns {Array} Un array di messaggi nel formato {role: string, content: string}.
     * @throws {Error} Se kbContent, question o docType non sono validi.
     */
    extractorPrompt: (kbContent, question, docType) => {
        if (typeof kbContent !== 'string' || !kbContent.trim()) {
            throw new Error("kbContent deve essere una stringa non vuota");
        }
        if (typeof question !== 'string' || !question.trim()) {
            throw new Error("question deve essere una stringa non vuota");
        }
        if (!docType || typeof docType !== 'string') {
            throw new Error("docType deve essere una stringa valida");
        }

        const template = getTemplate(docType) || "Nessun formato specifico richiesto.";

        const systemMessage = buildSystemMessageHeader(
            "Seleziona dalla knowledge base le informazioni che aiutano a rispondere alla domanda."
        ) + `
## Criteri di selezione
- Includi informazioni collegate alla domanda
- Includi contesto necessario per capire le informazioni selezionate
## Formato risposta
${template}
`;

        const userMessage = `
## Knowledge base completa
\`\`\`text
${kbContent}
\`\`\`
## Domanda
${question}
---
Estrai le sezioni rilevanti per questa domanda e rispetta il formato risposta.
`;

        assembler.clear();
        assembler.setSystemMessage(systemMessage);
        assembler.addUserMessage(userMessage);
        return assembler.getMessages();
    },

    /**
     * Costruisce un prompt per rispondere a una domanda basandosi su un contesto e una cronologia di conversazione.
     * @param {string} context - Il contesto strutturato.
     * @param {Array} history - La cronologia della conversazione.
     * @returns {Array} Un array di messaggi nel formato {role: string, content: string}.
     * @throws {Error} Se context o history non sono validi.
     */
    answerPrompt: (context, history) => {
        if (typeof context !== 'string' || !context.trim()) {
            throw new Error("context deve essere una stringa non vuota");
        }
        if (!Array.isArray(history) || history.length === 0) {
            throw new Error("history deve essere un array non vuoto");
        }

        const systemMessage = `
Sei un assistente esperto che risponde in modo chiaro e naturale.
## Regole
- La tua fonte di verità principale è il CONTESTO strutturato fornito
- Usa la cronologia della conversazione per comprendere il filo logico
- Se usi conoscenza generale, segnala chiaramente: "Nel contesto non ho trovato questa informazione, ma posso dirti che..."
- Mantieni un tono conversazionale e naturale
- Rispondi in modo completo ma conciso
## Formato risposta
- Rispondi ESCLUSIVAMENTE in testo piano senza alcun artificio grafico
- Scrivi in paragrafi fluidi e naturali come in una conversazione
- Se devi elencare elementi, scrivili in forma discorsiva nel testo
## Contesto
\`\`\`text
${context}
\`\`\`
## Istruzioni
- Cerca prima la risposta nel CONTESTO
- Utilizza le informazioni delle sezioni strutturate disponibili
- Se la risposta non è presente nel contesto, usa la conoscenza generale segnalando chiaramente
- Considera la cronologia delle domande per fornire risposte coerenti
- Formula una risposta chiara, concisa e naturale
`;

        const userMessage = `
## Domanda
${history[0]}
`;

        assembler.clear();
        assembler.setSystemMessage(systemMessage);
        assembler.addUserMessage(userMessage);
        for (let i = 1; i < history.length; i++) {
            if ((i - 1) % 2 === 0) {
                assembler.addAssistantMessage(history[i]);
            } else {
                assembler.addUserMessage(history[i]);
            }
        }
        return assembler.getMessages();
    },
};

export {
    DocumentType,
    listTypes,
    listExamples,
    listTypeExample
};
