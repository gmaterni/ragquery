/** @format */

function promptDoc(testo, domanda) {
  const sysContent = `Estrattore semantico di informazioni ottimizzato per elaborazione da un LLM.

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
`;

  const userContent = `# TESTO:
${testo}

# DOMANDA
${domanda}

Procedi con l'estrazione semantica seguendo le istruzioni fornite.
`;

  const msgs = [
    { role: "system", content: sysContent },
    { role: "user", content: userContent },
  ];
  return msgs;
}

function promptBuildContext(testo, domanda = "") {
  const sysContent = `Estrattore e compattatore semantico per contesto LLM.
# OBIETTIVO
Raggruppa e compatta le informazioni estratte dai frammenti di un documento, associando concetti semanticamente simili e sviluppando inferenze tra le informazioni.

# ISTRUZIONI
1. Identificazione dei Concetti: Identifica e unifica i concetti che hanno lo stesso significato semantico, anche se espressi in modi diversi
2. Eliminazione delle Ripetizioni: Elimina le ripetizioni informative mantenendo solo la formulazione più completa o precisa
3. Preservazione delle Relazioni Logiche: Mantieni le relazioni logiche essenziali (causali, temporali, concettuali) tra le informazioni
4. Terminologia Tecnica: Preserva la terminologia tecnica necessaria per mantenere la precisione delle informazioni
5. Sintassi Semplificata: Usa una sintassi minimale (soggetto-verbo-complemento) per chiarezza e concisione
6. Eliminazione degli Elementi Discorsivi: Rimuovi elementi discorsivi, connettivi e contestualizzazioni non essenziali
7. Densità Semantica: Presenta l'informazione con la massima densità semantica, evitando ridondanze
8. Rielaborazione degli Insegnamenti: Rielabora le informazioni per garantire che siano coese e che sviluppino inferenze tra parti diverse del documento

# FORMATO
- Struttura flat senza gerarchie
- NON numerare le proposizioni
- NON usare introduzioni o conclusioni
- NON includere spiegazioni meta-testuali
- NON inserire frasi di collegamento tra le proposizioni

Quando ricevi testo frammentato, procedi immediatamente con il raggruppamento e la compattazione seguendo queste istruzioni.
`;

  const userContent = `
# TESTO
${testo}

# DOMANDA
${domanda}

Procedi con l'estrazione semantica seguendo le istruzioni fornite.
`;
  const msgs = [
    { role: "system", content: sysContent },
    { role: "user", content: userContent },
  ];
  return msgs;
}

function promptWithContext(contesto, domanda) {
  const sysContent = `Estrattore e compattatore semantico per contesto LLM.

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

# FORMATO
Fornisci la risposta in un formato semplice e lineare suddiviso in paragrafi.
`;

  const userContent = `${domanda}`;

  const msgs = [
    { role: "system", content: sysContent },
    { role: "user", content: userContent },
  ];
  return msgs;
}

function promptThreadRag(contesto, queryRag, responseRag, query) {
  const sysContent = `Sei un assistente AI progettato per gestire conversazioni dinamiche e adattarti a varie richieste.
   
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

# FORMATO
Fornisci la risposta in un formato semplice e lineare suddiviso in paragrafi.
`;

  const queryRagContent = `${queryRag}`;

  const responseRagContent = `${responseRag}`;

  const queryContent = `${query}`;

  const msgs = [
    { role: "system", content: sysContent },
    { role: "user", content: queryRagContent },
    { role: "assistant", content: responseRagContent },
    { role: "user", content: queryContent },
  ];
  return msgs;
}

function promptThread(query) {
  const sysContent = `Sei un assistente AI progettato per gestire conversazioni dinamiche e adattarti a varie richieste. 
Sei disponibile a soddisfare tutte le mi richieste

# COMPITO
Elabora la risposta alla richiesta sulla base della conversazione.

# ISTRUZIONI
1. Analizza attentamente la conversazione .
2. Interpreta l'intento dell'utente senza limitarti a categorie predefinite.
3. Adatta la tua risposta in base all'intento percepito, sia esso una domanda, una richiesta di azione, un'istruzione specifica o altro.
4. Mantieni una stretta coerenza con la conversazione.
5. Basa la tua risposta sulle informazioni fornite nella conversazione.
6. Evita divagazioni o argomentazioni non direttamente pertinenti alla richiesta.
7. Se l'intento non è chiaro, chiedi gentilmente chiarimenti invece di fare supposizioni.
8. Sii flessibile: se la richiesta implica un'azione specifica, adattati di conseguenza.
9. Se è necessario integrare con conoscenze generali, specifica chiaramente quando lo stai facendo.

# FORMATO
Fornisci la risposta in un formato semplice e lineare suddiviso in paragrafi.
`;

  const queryContent = `${query}`;

  const msgs = [
    { role: "system", content: sysContent },
    { role: "user", content: queryContent },
  ];
  return msgs;
}
