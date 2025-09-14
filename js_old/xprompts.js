/** @format */
"use strict";

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
    return [...this.messages];
  },

  clear() {
    this.messages = [];
    return this;
  }
};

// ===== DOCUMENT TYPES & INSTRUCTIONS =====
const DocumentType = {
  NORMATIVI: "normativi",
  PROCEDURALI: "procedurali",
  DOCUMENTALI: "documentali",
  INFORMATIVI: "informativi",
  NARRATIVI: "narrativi",
  ARGOMENTATIVI: "argomentativi",
  ANALITICI: "analitici",
  PROGETTUALI: "progettuali",
};

const STRING_TO_DOC_TYPE = {};
Object.values(DocumentType).forEach((type) => {
  STRING_TO_DOC_TYPE[type] = type;
});

const EXTRACTION_CRITERIA = {
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

// ===== TEMPLATE OUTPUT =====
const OUTPUT_TEMPLATES = {
  [DocumentType.NORMATIVI]: `SOGGETTI:
nome: ruolo_funzione | ambito_applicazione | poteri_specifici | status_attivo

REGOLE:
regola_id: descrizione_completa | condizioni_applicazione | conseguenze_obbligatorie | eccezioni_se_presenti

DEFINIZIONI:
termine: significato_nel_contesto | campo_validità | priorità_gerarchica | riferimenti_normativi

PARAMETRI_QUANTITATIVI:
nome_parametro: valore_dichiarato | unità_misura | tolleranze_se_specificate | criticità_operativa

SANZIONI_VIOLAZIONI:
tipo_violazione: descrizione_comportamento | conseguenza_prevista | gravità_relativa | procedure_ricorso

GERARCHIA_NORMATIVA:
norma_citata: relazione_con_presente_documento | tipo_precedenza | condizioni_prevalenza`,

  [DocumentType.PROCEDURALI]: `OBIETTIVO_PROCEDURA:
nome: risultato_atteso | prerequisiti_necessari | output_finale | criticità_operativa

SEQUENZA_AZIONI:
passo_N: descrizione_azione | parametri_operativi | controlli_qualità | punti_attenzione

PUNTI_DECISIONE:
situazione: opzione_A→conseguenze | opzione_B→conseguenze | criteri_scelta | raccomandazioni

RISORSE_NECESSARIE:
elemento: tipo_risorsa | specifiche_tecniche | obbligatorietà | alternative_possibili

RISCHI_OPERATIVI:
scenario_critico: cause_scatenanti | conseguenze_potenziali | azioni_prevenzione | gravità_stimata

CONTROLLI_QUALITÀ:
checkpoint: cosa_verificare | standard_accettazione | azioni_se_non_conforme`,

  [DocumentType.DOCUMENTALI]: `CRONOLOGIA_EVENTI:
momento: descrizione_evento | partecipanti_coinvolti | risultati_ottenuti | documentazione_associata

ENTITÀ_TRACCIATE:
nome_entità: categoria_appartenenza | stato_iniziale | stato_finale | cause_trasformazione

MISURAZIONI_RILEVATE:
parametro: valore_registrato | unità_misura | metodo_rilevazione | affidabilità_dato | anomalie_riscontrate

DECISIONI_PRESE:
decisione: responsabili_decisione | momento_temporale | motivazioni_dichiarate | impatti_previsti

RELAZIONI_IDENTIFICATE:
entità_A__entità_B: natura_relazione | intensità_collegamento | durata_temporale | evidenze_supporto`,

  [DocumentType.INFORMATIVI]: `FATTI_PRINCIPALI:
fatto: descrizione_oggettiva | fonte_informazione | livello_certezza | contesto_rilevante

ATTORI_COINVOLTI:
nome_attore: ruolo_nella_situazione | azioni_compiute | caratteristiche_rilevanti | impatto_generato

CONTESTO_SITUAZIONE:
dimensione_spaziale: luogo_specifico | dimensione_temporale | condizioni_ambientali | background_necessario

RELAZIONI_CAUSALI:
causa_identificata: meccanismo_collegamento | effetto_osservato | evidenze_disponibili | alternative_possibili

IMPATTI_CONSEGUENZE:
categoria_interessata: tipo_effetto | durata_stimata | intensità_impatto | misurabilità

FONTI_INFORMAZIONE:
origine: tipologia_fonte | affidabilità_stimata | possibili_bias | data_pubblicazione`,

  [DocumentType.NARRATIVI]: `STRUTTURA_NARRATIVA:
setup_iniziale: situazione_partenza | personaggi_introdotti | tema_centrale | ambientazione
sviluppo: elementi_complicanti | escalation_tensione | conflitti_emergenti
climax: momento_culminante | decisione_cruciale | punto_svolta
risoluzione: modalità_conclusione | nuovo_equilibrio | significato_emergente

PERSONAGGI:
nome_personaggio: funzione_narrativa | motivazione_principale | evoluzione_carattere | simbolismo_eventuale

EVENTI_SIGNIFICATIVI:
evento: funzione_nella_trama | personaggi_coinvolti | significato_letterale | significato_simbolico

TEMI_RICORRENTI:
tema_simbolo: prima_apparizione | sviluppo_progressivo | risoluzione_finale | significato_complessivo`,

  [DocumentType.ARGOMENTATIVI]: `TESI_CENTRALE:
affermazione_principale: posizione_autore | novità_contributo | campo_disciplinare | portata_affermazione

CATENA_ARGOMENTATIVA:
argomento_N: premesse_dichiarate | inferenza_logica | conclusione_raggiunta | tipo_ragionamento | solidità_stimata

EVIDENZE_SUPPORTO:
evidenza: contenuto_specifico | fonte_origine | peso_argomentativo | tipo_evidenza | limiti_riconosciuti

OBIEZIONI_CONFUTAZIONI:
obiezione: contenuto_critica | fonte_obiezione | risposta_autore | efficacia_confutazione

STRUTTURA_LOGICA:
tipo_argomentazione: coerenza_interna | completezza_trattazione | validità_formale | punti_deboli`,

  [DocumentType.ANALITICI]: `OGGETTO_STUDIO:
target_analisi: definizione_ambito | periodo_considerato | limitazioni_scope | granularità_analisi

METODOLOGIA_APPLICATA:
approccio_usato: tecniche_specifiche | strumenti_utilizzati | dati_base | assunzioni_metodologiche

PATTERN_IDENTIFICATI:
pattern: descrizione_regolarità | frequenza_osservata | robustezza_pattern | possibili_spiegazioni

CORRELAZIONI_RILEVATE:
variabile_A__variabile_B: tipo_relazione | intensità_apparente | direzione_causale_ipotizzata | significatività_apparente

CONCLUSIONI_RAGGIUNTE:
conclusione: inferenza_principale | livello_confidenza | limiti_generalizzazione | raccomandazioni_pratiche

LIMITAZIONI_RICONOSCIUTE:
limite: tipo_limitazione | impatto_su_risultati | tentativi_mitigazione | importanza_relativa`,

  [DocumentType.PROGETTUALI]: `OBIETTIVI_PROGETTO:
obiettivo: descrizione_traguardo | metriche_successo | timeline_prevista | priorità_relativa | responsabile_assegnato

STRATEGIE_IMPLEMENTAZIONE:
strategia: approccio_metodologico | obiettivi_serviti | risorse_richieste | indicatori_progresso

ROADMAP_TEMPORALE:
milestone: deliverable_atteso | data_target | prerequisiti_necessari | criteri_accettazione

RISORSE_RICHIESTE:
risorsa: tipologia | quantità_stimata | costo_previsto | disponibilità_temporale | criticità_progetto

RISCHI_IDENTIFICATI:
rischio: descrizione_minaccia | probabilità_stimata | impatto_potenziale | misure_mitigazione | responsabile_gestione

ASSUNZIONI_CRITICHE:
assunzione: ipotesi_sottostante | probabilità_validità | impatto_se_falsa | modalità_verifica | piano_contingenza`,
};

// ===== INTERNAL UTILITY FUNCTIONS =====
const getInstructions = (docType) => {
  const info = getDocumentInfo(docType);
  return info.instructions.join("\n");
};

const getDescription = (docType) => {
  const info = getDocumentInfo(docType);
  return info.description;
};

const getFocus = (docType) => {
  const info = getDocumentInfo(docType);
  return info.focus;
};

const getDocumentInfo = (docType) => {
  if (typeof docType === "string") {
    if (!(docType in STRING_TO_DOC_TYPE)) {
      throw new Error(`Tipo documento non supportato: ${docType}`);
    }
    docType = STRING_TO_DOC_TYPE[docType];
  }
  return EXTRACTION_CRITERIA[docType];
};

const getTemplate = (docType) => {
  if (typeof docType === "string") {
    if (!(docType in STRING_TO_DOC_TYPE)) {
      throw new Error(`Tipo documento non supportato: ${docType}`);
    }
    docType = STRING_TO_DOC_TYPE[docType];
  }
  if (!(docType in OUTPUT_TEMPLATES)) {
    throw new Error(`Tipo documento non supportato: ${docType}`);
  }
  return OUTPUT_TEMPLATES[docType];
};

const listTypes = () => Object.keys(STRING_TO_DOC_TYPE);

const listExamples = () => {
  const examples = [];
  for (const [docType, criteria] of Object.entries(EXTRACTION_CRITERIA)) {
    const exampleList = criteria.examples || [];
    for (const example of exampleList) {
      examples.push(`${example.padEnd(30)} :  ${docType}`);
    }
  }
  return examples.sort().join("\n");
};

// function listTypeExample() {
//   const arr = [];
//   for (const [docType, criteria] of Object.entries(EXTRACTION_CRITERIA)) {
//     const categoria = Object.keys(STRING_TO_DOC_TYPE)
//       .find(k => STRING_TO_DOC_TYPE[k] === docType) || docType;
//     const esempi = criteria.examples || [];
//     arr.push(categoria, esempi);
//   }
//   return arr;
// }
function listTypeExample() {
  const arr = [];
  for (const [docType, criteria] of Object.entries(EXTRACTION_CRITERIA)) {
    const esempi = criteria.examples || [];
    arr.push(docType, esempi);
  }
  return arr;
}

// ===== PROMPT BUILDER OBJECT =====

const promptBuilder = {
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

// ===== EXPORTS =====

export {
  promptBuilder,
  DocumentType,
  listTypes,
  listExamples,
  listTypeExample,
};

// ===== ESEMPIO DI UTILIZZO =====
/*
const docContent = "Questo è un documento di esempio...";
const docType = "normativi"; // Nota: usando stringa come richiesto
// Costruire un prompt per l'estrazione
const extractionMessages = promptBuilder.extractionPrompt(docContent, docType);
console.log(extractionMessages);
// Altri esempi
const unificationMessages = promptBuilder.unificationPrompt("contenuti da unificare", docType);
const extractorMessages = promptBuilder.extractorPrompt("knowledge base", "domanda", docType);
const answerMessages = promptBuilder.answerPrompt("contesto", ["Chi può modificare gli utenti?"]);
*/