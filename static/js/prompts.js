"use strict";
import {
    DocumentType,
    getInstructions,
    getDescription,
    getFocus,
    getDocumentInfo,
    listTypes,
    listExamples,
    listTypeExample
} from './llm_instructions.js';
import { getTemplate } from './llm_templates.js';

const SYSTEM = "system";
const USER = "user";
const ASSISTANT = "assistant";

const assembler = {
    messages: [],
    setSystemMessage(content) {
        this.messages = this.messages.filter((msg) => msg.role !== SYSTEM);
        const systemMessage = { role: SYSTEM, content: content };
        this.messages.unshift(systemMessage);
        return this;
    },
    addUserMessage(content) {
        const userMessage = { role: USER, content: content };
        this.messages.push(userMessage);
        return this;
    },
    addAssistantMessage(content) {
        const assistantMessage = { role: ASSISTANT, content: content };
        this.messages.push(assistantMessage);
        return this;
    },
    getMessages() {
        const msgs = [...this.messages];
        // elimina etichette del tipo nome:
        for (let i = 0; i < msgs.length; i++)
            msgs[i].content = msgs[i].content.replace(/^(\S+):\s*/g, '');
        return msgs;
    },
    clear() {
        this.messages = [];
        return this;
    }
};

export const promptBuilder = {
    extractionPrompt: (docContent, docType) => {
        const instructions = getInstructions(docType);
        const description = getDescription(docType);
        const focus = getFocus(docType);
        const template = getTemplate(docType);
        const systemMessage = `
## Obiettivo
Estrai informazioni strutturate dal documento fornito.
## Contesto del compito
Stai analizzando ${description}
## Principio guida
Durante l'estrazione, la tua priorità assoluta è: "${focus}".
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
        assembler.messages = [];
        assembler.setSystemMessage(systemMessage);
        assembler.addUserMessage(userMessage);
        return assembler.getMessages();
    },
    unificationPrompt: (contents, docType) => {
        const template = getTemplate(docType);
        const systemMessage = `
## Obiettivo
Unifica i documenti strutturati in un'unica knowledge base.
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
        assembler.messages = [];
        assembler.setSystemMessage(systemMessage);
        assembler.addUserMessage(userMessage);
        return assembler.getMessages();
    },
    extractorPrompt: (kbContent, question, docType) => {
        const template = getTemplate(docType);
        const systemMessage = `
## Obiettivo
Seleziona dalla knowledge base le informazioni che aiutano a rispondere alla domanda.
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
        assembler.messages = [];
        assembler.setSystemMessage(systemMessage);
        assembler.addUserMessage(userMessage);
        return assembler.getMessages();
    },
    answerPrompt: (context, history) => {
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
        assembler.messages = [];
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
