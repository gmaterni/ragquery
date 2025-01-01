/** @format */

"use strict";

function promptDoc(testo, domanda, docName) {
  return `
SYSTEM: Sei un assistente AI specializzato nell'analisi documentale e nell'estrazione mirata di informazioni. Rispondi esclusivamente in italiano.

TASK: Analizza il testo estratto dal documento "${docName}" e identifica gli elementi rilevanti per rispondere alla domanda: "${domanda}".

INSTRUCTIONS:
1. Analizza attentamente il testo fornito compreso fra i marker <<<INIZIO_TESTO>>> e <<<FINE_TESTO>>> .
2. Identifica gli elementi utili per rispondere alla domanda:"${domanda}".
3. Per ogni elemento individuato, fornisci un titolo ed una descrizione sintetica ma completa.
4. Riporta dettagli specifici (dati, citazioni, eventi, personaggi, luoghi, ..) se corelati alla domanda.
5. Se non ci sono informazioni rilevanti, rispondi con "NESSUNA INFORMAZIONE RILEVANTE".
6. Assicurati di generare la risposta esattamente secondo il formato di output specificato.

DOMANDA: ${domanda}

TESTO DA ANALIZZARE:
<<<INIZIO_TESTO>>>
${testo}
<<<FINE_TESTO>>>

OUTPUT_FORMAT: Genera una risposta strutturata come un elenco nel quale ogni elemento è costituito da un breve titolo e da una descrizione concisa ma completa.

RESPONSE:
`;
}


function promptBuildContext(informazioni, domanda = "") {
  return `
SYSTEM: Sei un assistente AI esperto nella sintesi e nell'organizzazione mirata di informazioni. Rispondi sempre ed esclusivamente in italiano.

TASK: Organizza e sintetizza le informazioni estratte da frammenti di testo di un documento, creando un contesto utile per rispondere alla domanda: "${domanda}".

INSTRUCTIONS:
1. Analizza tutte le informazioni fornite.
2. Seleziona e raggruppa le informazioni simili.
3. Per ogni informazioni, genera una descrizione concisa.
4. Elenca i punti chiave essenziali per comprendere il contesto.
5. Riporta elementi specifici (dati, citazioni, eventi, luoghi, personaggi, ..) se utili.
6. Elabora inferenze logiche basate sulle informazioni, se rilevanti per il contesto.
7. Genera una sintesi finale.
8. Assicurati di strutturare la tua risposta esattamente secondo il formato di output specificato.

INFORMAZIONI:
<<<INIZIO_INFORMAZIONI>>>
${informazioni}
<<<FINE_INFORMAZIONI>>>

OUTPUT_FORMAT: Genera una risposta strutturata come un elenco nel quale ogni elemento è costituito da un breve titolo e da una descrizione concisa ma completa, alla fine dell'elenco aggiungi una sintesi globale ed eventuali inferenze logiche e collegamenti fra le varie informazioni.

RESPONSE:
`;
}

function promptWithContext(contesto, domanda) {
  return `
SYSTEM: Sei un sistema AI specializzato nell'analisi di informazioni estratte da documenti.

TASK: Elabora la risposta alla domanda "${domanda}" sulla base del contesto fornito.

INSTRUCTIONS:
1. Analizza attentamente il contesto fornito, identificando le informazioni pertinenti alla domanda: "${domanda}".
2. Estrai i concetti chiave e formula inferenze ragionevoli basate sulle informazioni disponibili.
3. Inizia la risposta con una breve introduzione che presenta l'argomento e il contesto.
4. Procedi con un'analisi dettagliata delle informazioni rilevanti trovate nel contesto.
5. Concludi con una sintesi che riassume i punti chiave e fornisce una conclusione generale.
6. Se richiesto, cita le fonti facendo riferimento al "documento fornito" per il contesto dato, distinguendolo chiaramente da eventuali altre fonti citate all'interno del contesto stesso.
7. Mantieni uno stile di scrittura fluido durante tutta la risposta.
8. Assicurati che la risposta sia completa e risponda direttamente alla domanda posta.

CONTESTO:
<<<INIZIO_CONTESTO>>>
${contesto}
<<<FINE_CONTESTO>>>

DOMANDA: ${domanda}

OUTPUT_FORMAT: Fornisci la risposta in testo semplice e lineare suddiviso in paragrafi.

RESPONSE:
`;
}

function promptThread(contesto, conversazione, richiesta) {
  return `
SYSTEM: Sei un assistente AI versatile progettato per gestire conversazioni dinamiche e adattarti a varie richieste. Rispondi sempre in italiano.

TASK: Elabora la risposta alla richiesta "${richiesta}" sulla base del contesto fornito e della conversazione.

INSTRUCTIONS:
1. Analizza attentamente il contesto, la conversazione precedente e la richiesta: "${richiesta}".
2. Interpreta l'intento dell'utente senza limitarti a categorie predefinite.
3. Adatta la tua risposta in base all'intento percepito, sia esso una domanda, una richiesta di azione, un'istruzione specifica o altro.
4. Mantieni una stretta coerenza con il contesto della conversazione.
5. Basa la tua risposta sulle informazioni fornite nel contesto e nella conversazione.
6. Evita divagazioni o argomentazioni non direttamente pertinenti alla richiesta o al contesto.
7. Fai riferimento a informazioni precedenti quando sono pertinenti, citando specificamente la fonte.
8. Se l'intento non è chiaro, chiedi gentilmente chiarimenti invece di fare supposizioni.
9. Sii flessibile: se la richiesta implica un'azione specifica, adattati di conseguenza.
10. Se è necessario integrare con conoscenze generali, specifica chiaramente quando lo stai facendo.

CONTESTO:
<<<BEGIN_CONTESTO>>>
${contesto}
<<<END_CONTESTO>>>

<<<INIZIO_CONVERSAZIONE>>>
${conversazione}
<<<FINE_CONVERSAZIONE>>>

RICHIESTA: ${richiesta}

OUTPUT_FORMAT: Fornisci la risposta in testo semplice e lineare suddiviso in paragrafi.

RESPONSE:
`;
}


function getPayloadDoc(prompt) {
  return  {
      model: "",
      messages: [
          { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 512,
      stream: false,
      safe_prompt: false,
      random_seed: 42
  };
}
function getPayloadBuildContext(prompt) {
  return {
      model: "",
      messages: [
          { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 512,
      stream: false,
      safe_prompt: false,
      random_seed: 42
  };
}

function getPayloadWithContext(prompt) {
  return  {
      model: "",
      messages: [
          { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 512,
      stream: false,
      safe_prompt: false,
      random_seed: 42
  };
}

function getPayloadThread(prompt) {
  return  {
      model: "",
      messages: [
          { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 512,
      stream: false,
      safe_prompt: false,
      random_seed: 42
  };
}