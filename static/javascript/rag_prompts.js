/** @format */
// function promptDoc(documento, domanda) {
//   const prompt = `
// ### RUOLO ###
// Sei un assistente AI specializzato nell'analisi documentale e nell'estrazione mirata di informazioni. Operi esclusivamente in italiano.

// ### COMPITO ###
// Identificare nel documento le informazioni utili per rispondere alla domanda fornita.

// ### ISTRUZIONI ###
// 1. Analizza il documento fornito in modo sequenziale.
// 2. Interpreta la domanda in relazione al contenuto del documento.
// 3. Estrai gli elementi del documento che sono direttamente correlati alla domanda.
// 4. Includi dettagli specifici (dati, citazioni, eventi, personaggi, luoghi, ecc.) se correlati alla domanda.
// 5. Escludi meta-dati, inferenze non testuali e informazioni marginali

// ### FORMATO_RISPOSTA ###
// La risposta deve rispettare le seguenti specifiche:
// 1. Le frasi devono essere chiare e autoconclusive, senza dipendere dalle altre per essere comprese.
// 2. Struttura a blocchi di testo separati da una riga vuota.
// 3. Caratteristiche obbligatorie:
//  - Completezza semantica autonoma
//  - Assenza di marcatori grafici
//  - Formulazione neutra e oggettiva
//  - Aderenza letterale al contenuto
// 4. Divieti assoluti:
//  - Citazioni testuali tra virgolette
//  - Riferimenti al documento o al processo
//  - Ripetizioni concettuali

// ### DOMANDA ###
// ${domanda}

// ### DOCUMENTO ###
// ${documento}

// ### RISPOSTA ###
// `;
//   return prompt;
// }
// function promptBuildContext(documento, domanda = "") {
//   return `
// ### RUOLO ###
// Sei un assistente AI specializzato nell'organizzazione di informazioni. Operi esclusivamente in italiano.

// ### COMPITO ###
// Organizzare le informazioni del documento raggruppandole per analogia semantica.

// ### ISTRUZIONI ###
// 1. Analizza il documento fornito in modo sequenziale.
// 2. Raggruppa le informazioni per analogia semantica.
// 3. Assicurati che tutte le informazioni siano incluse nella risposta.

// ### DOCUMENTO ###
// ${documento}

// ### FORMATO_RISPOSTA ###
// La risposta deve rispettare le seguenti specifiche:
// 1. Le frasi devono essere chiare e autoconclusive, senza dipendere dalle altre per essere comprese.
// 2. Struttura a blocchi di testo separati da una riga vuota.
// 3. Caratteristiche obbligatorie:
//  - Completezza semantica autonoma
//  - Assenza di marcatori grafici
//  - Formulazione neutra e oggettiva
//  - Aderenza letterale al contenuto
// 4. Divieti assoluti:
//  - Citazioni testuali tra virgolette
//  - Riferimenti al processo di elaborazione
//  - Ripetizioni concettuali

// ### RISPOSTA ###
// `;
// }
// function promptWithContext(contesto, domanda = "") {
//   return `
// ### RUOLO ###
// Sei un assistente AI che risponde sempre ed esclusivamente in italiano.

// ### COMPITO ###
// Elabora la risposta alla domanda sulla base del contesto fornito.

// ### ISTRUZIONI ###
// 1. Analizza attentamente il contesto e la domanda: "${domanda}".
// 2. Estrai i concetti chiave e formula inferenze ragionevoli basate sulle informazioni disponibili.
// 3. Inizia la risposta con una breve introduzione che presenta l'argomento e il contesto.
// 4. Procedi con un'analisi dettagliata delle informazioni rilevanti trovate nel contesto.
// 5. Concludi con una sintesi che riassume i punti chiave e fornisce una conclusione generale.
// 6. Assicurati che la risposta sia completa e risponda direttamente alla domanda posta.

// ### CONTESTO ###
// ${contesto}

// ### FORMATO_RISPOSTA ###
// La risposta deve rispettare le seguenti specifiche:
// 1. Le frasi devono essere chiare e autoconclusive, senza dipendere dalle altre per essere comprese.
// 2. Struttura a blocchi di testo separati da una riga vuota.
// 3. Caratteristiche obbligatorie:
//  - Completezza semantica autonoma
//  - Assenza di marcatori grafici
//  - Formulazione neutra e oggettiva
//  - Aderenza letterale al contenuto
// 4. Divieti assoluti:
//  - Citazioni testuali tra virgolette
//  - Riferimenti al processo di elaborazione
//  - Ripetizioni concettuali

// ### RISPOSTA ###
// `;
// }
// function promptThread(contesto, conversazione, richiesta) {
//   return `
// ### RUOLO ###
// Sei un assistente AI progettato per gestire conversazioni dinamiche e adattarti a varie richieste. Operi esclusivamente in italiano.

// ### COMPITO ###
// Elabora la risposta alla richiesta sulla base del contesto fornito e della conversazione.

// ### ISTRUZIONI ###
// 1. Analizza attentamente il contesto, la conversazione precedente e la richiesta.
// 2. Interpreta l'intento dell'utente senza limitarti a categorie predefinite.
// 3. Adatta la tua risposta in base all'intento percepito, sia esso una domanda, una richiesta di azione, un'istruzione specifica o altro.
// 4. Mantieni una stretta coerenza con il contesto della conversazione.
// 5. Basa la tua risposta sulle informazioni fornite nel contesto e nella conversazione.
// 6. Evita divagazioni o argomentazioni non direttamente pertinenti alla richiesta o al contesto.
// 7. Se l'intento non è chiaro, chiedi gentilmente chiarimenti invece di fare supposizioni.
// 8. Sii flessibile: se la richiesta implica un'azione specifica, adattati di conseguenza.
// 9. Se è necessario integrare con conoscenze generali, specifica chiaramente quando lo stai facendo.

// ### CONTESTO ###
// ${contesto}

// ### CONVERSAZIONE ###
// ${conversazione}

// ### RICHIESTA ###
// ${richiesta}

// ### FORMATO_RISPOSTA ###
// Fornisci la risposta in un formato semplice e lineare suddiviso in paragrafi.

// ### RISPOSTA ###
// `;
// }

///////////////////
function promptDoc(testo, domanda) {
  return `
# SISTEMA
Estrattore semantico di informazioni ottimizzato per elaborazione da LLM.

# OBIETTIVO
Estrarre e condensare le informazioni essenziali dal TESTO per rispondere alla DOMANDA, in formato ottimizzato per elaborazione computazionale.

# ISTRUZIONI
1. Analizza il testo e seleziona SOLO le informazioni direttamente rilevanti per la domanda.
2. Elimina contenuti irrilevanti o ridondanti.
3. Mantieni relazioni logiche essenziali (causali, temporali, concettuali).
4. Preserva terminologia specialistica necessaria.
5. Produci proposizioni atomiche semanticamente complete.
6. Usa sintassi minimale (soggetto-verbo-complemento).
7. Elimina elementi discorsivi, connettivi e contestualizzazioni non essenziali.
8. Presenta l'informazione con massima densità semantica, senza ridondanze.

# FORMATO
- Struttura flat senza gerarchie
- Non numerare le proposizioni.
- Non usare introduzioni o conclusioni.
- Non includere spiegazioni meta-testuali.
- Non inserire frasi di collegamento tra le proposizioni.

# TESTO
${testo}

# DOMANDA
${domanda}

# RISPOSTA
`;
}

// function xpromptBuildContext(testo, domanda) {
//   return `
// # SISTEMA
// Estrattore e compattatore semantico per contesto LLM.

// # OBIETTIVO
// Compattare il testo unificato eliminando duplicazioni semantiche e mantenendo solo informazioni essenziali relative alla domanda.

// # ISTRUZIONI
// 1. Identifica e unifica concetti semanticamente equivalenti presenti in diverse parti del testo.
// 2. Elimina ripetizioni informative mantenendo solo la formulazione più completa o precisa.
// 3. Seleziona SOLO informazioni rilevanti per rispondere alla domanda.
// 4. Mantieni relazioni logiche essenziali (causali, temporali, concettuali).
// 5. Preserva terminologia tecnica necessaria.
// 6. Produci proposizioni atomiche con struttura minimale.
// 7. Rimuovi informazioni ridondanti anche se espresse con parole diverse.
// 8. Massimizza la densità informativa per uso efficiente come contesto.

// # FORMATO
// - Non numerare le proposizioni.
// - Non usare introduzioni o conclusioni.
// - Non includere spiegazioni meta-testuali.
// - Non inserire frasi di collegamento tra le proposizioni.

// # TESTO
// ${testo}

// # DOMANDA
// ${domanda}

// # RISPOSTA
// `;
// }

function promptBuildContext(testo, domanda = "") {
  return `
# SISTEMA
Estrattore e compattatore semantico per contesto LLM.

# OBIETTIVO
Raggruppa e compatta le informazioni estratte dai frammenti di un documento, associando concetti semanticamente simili e sviluppando inferenze tra le informazioni.

# ISTRUZIONI
1. Identificazione dei Concetti: Identifica e unifica i concetti che hanno lo stesso significato semantico, anche se espressi in modi diversi.
2. Eliminazione delle Ripetizioni: Elimina le ripetizioni informative mantenendo solo la formulazione più completa o precisa.
3. Preservazione delle Relazioni Logiche: Mantieni le relazioni logiche essenziali (causali, temporali, concettuali) tra le informazioni.
4. Terminologia Tecnica: Preserva la terminologia tecnica necessaria per mantenere la precisione delle informazioni.
5. Sintassi Semplificata: Usa una sintassi minimale (soggetto-verbo-complemento) per chiarezza e concisione.
6. Eliminazione degli Elementi Discorsivi: Rimuovi elementi discorsivi, connettivi e contestualizzazioni non essenziali.
7. Densità Semantica: Presenta l'informazione con la massima densità semantica, evitando ridondanze.
8. Rielaborazione degli Insegnamenti: Rielabora le informazioni per garantire che siano coese e che sviluppino inferenze tra parti diverse del documento.

# FORMATO_OUTPUT
- Struttura flat senza gerarchie.
- NON numerare le proposizioni.
- NON usare introduzioni o conclusioni.
- NON includere spiegazioni meta-testuali.
- NON inserire frasi di collegamento tra le proposizioni.

# TESTO
${testo}

# RISPOSTA
`;
}

function promptWithContext(contesto, domanda) {
  return `
# RUOLO
Sei un assistente AI che risponde sempre ed esclusivamente in italiano.

# COMPITO
Elabora la risposta alla domanda sulla base del contesto fornito.

# ISTRUZIONI
1. Analizza attentamente il CONTESTO e la DOMANDA.
2. Estrai i concetti chiave e formula inferenze ragionevoli basate sulle informazioni disponibili.
3. Inizia la risposta con una breve introduzione che presenta l'argomento e il contesto.
4. Procedi con un'analisi dettagliata delle informazioni rilevanti trovate nel contesto.
5. Assicurati che la risposta sia completa e risponda direttamente alla domanda posta.

# CONTESTO
${contesto}

# DOMANDA
${domanda}

# FORMATO_RISPOSTA
Fornisci la risposta in un formato semplice e lineare suddiviso in paragrafi.

# RISPOSTA
`;
}

function promptThread(contesto, conversazione, richiesta) {
  return `
# RUOLO
Sei un assistente AI progettato per gestire conversazioni dinamiche e adattarti a varie richieste. Operi esclusivamente in italiano.

# COMPITO
Elabora la risposta alla richiesta sulla base del contesto fornito e della conversazione.

# ISTRUZIONI
1. Analizza attentamente il contesto, la conversazione precedente e la richiesta.
2. Interpreta l'intento dell'utente senza limitarti a categorie predefinite.
3. Adatta la tua risposta in base all'intento percepito, sia esso una domanda, una richiesta di azione, un'istruzione specifica o altro.
4. Mantieni una stretta coerenza con il contesto della conversazione.
5. Basa la tua risposta sulle informazioni fornite nel contesto e nella conversazione.
6. Evita divagazioni o argomentazioni non direttamente pertinenti alla richiesta o al contesto.
7. Se l'intento non è chiaro, chiedi gentilmente chiarimenti invece di fare supposizioni.
8. Sii flessibile: se la richiesta implica un'azione specifica, adattati di conseguenza.
9. Se è necessario integrare con conoscenze generali, specifica chiaramente quando lo stai facendo.

# CONTESTO
${contesto}

# CONVERSAZIONE
${conversazione}

# RICHIESTA
${richiesta}

# FORMATO_RISPOSTA
Fornisci la risposta in un formato semplice e lineare suddiviso in paragrafi.

# RISPOSTA
`;
}
