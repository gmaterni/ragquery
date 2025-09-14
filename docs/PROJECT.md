# Progetto RaPce: Analisi Tecnica e Architetturale

## 1. Introduzione e Obiettivi

**RaPce (Retrieval-Augmented Prompt-based Client-side Engine)** è un'applicazione web di Question Answering (QA) che implementa un'architettura RAG (Retrieval-Augmented Generation) innovativa. L'obiettivo primario del progetto è fornire uno strumento di QA potente che funzioni interamente **lato client**, garantendo la massima privacy dei dati e azzerando la necessità di un'infrastruttura backend complessa.

Il sistema trasforma una collezione di documenti non strutturati (PDF, DOCX, TXT) in una base di conoscenza interrogabile, utilizzando un LLM non solo come generatore di risposte, ma anche come motore di indicizzazione e recupero.

## 2. Concetto di Base: RAG senza Embeddings

L'innovazione fondamentale di RaPce è l'abbandono del tradizionale approccio RAG basato su embeddings e database vettoriali. Invece di convertire il testo in vettori numerici per la ricerca di similarità, RaPce sfrutta le capacità di comprensione e ragionamento dell'LLM stesso per eseguire le operazioni di recupero.

Il flusso logico è orchestrato da una catena di prompt e si articola in due processi principali:

1.  **Costruzione della Knowledge Base (Processo Offline/Batch)**: Un'analisi approfondita dei documenti sorgente per creare una base di conoscenza strutturata e distillata.
2.  **Interrogazione della Knowledge Base (Processo Live)**: Un'interazione in tempo reale con l'utente per estrarre un contesto mirato dalla KB e generare una risposta.

### Motivazioni della Scelta Architetturale

La scelta di evitare un'architettura basata su embeddings è guidata da due principi:

*   **Semplicità di Deployment**: Eliminare la necessità di un backend per la generazione di embeddings e per ospitare un database vettoriale rende l'applicazione distribuibile come un semplice sito web statico.
*   **Privacy by Design**: Tutti i dati dell'utente (documenti, knowledge base, conversazioni) risiedono esclusivamente nel suo browser (`localStorage` e `IndexedDB`). L'unico dato che lascia il client è quello inviato tramite le chiamate API all'LLM selezionato.

## 3. Flusso di Lavoro Dettagliato

L'architettura è implementata attraverso una sequenza di fasi precise, orchestrate dal `rag_engine.js`.

### Fase 1: Costruzione della Knowledge Base (`buildKnBase`)

Questo processo è progettato per essere robusto e **resumibile** grazie al `BuildStateMgr.js`.

1.  **Suddivisione (Chunking)**: I documenti forniti dall'utente vengono puliti (`text_cleaner.js`) e suddivisi in frammenti di testo (chunk) di dimensione ottimale per l'elaborazione da parte dell'LLM (`text_splitter.js`).
2.  **Estrazione Strutturata**: Per ogni singolo chunk, viene inviata una richiesta all'LLM. Il prompt (`extractionPrompt`) istruisce il modello a estrarre le informazioni salienti secondo uno schema (`template`) predefinito in base al tipo di documento (`docType`). L'output è una rappresentazione strutturata del contenuto del chunk.
3.  **Unificazione per Documento**: Le informazioni strutturate estratte da tutti i chunk di un singolo documento vengono aggregate e sintetizzate tramite un'ulteriore chiamata all'LLM (`unificationPrompt`). Questo crea una Knowledge Base pulita e de-duplicata per quel documento.
4.  **Unificazione Finale**: Le Knowledge Base di tutti i documenti vengono a loro volta consolidate in un'unica, grande `Knowledge Base` finale, che viene salvata in `IndexedDB`.

### Fase 2: Interrogazione e Generazione della Risposta

Questo processo si attiva quando l'utente pone una domanda.

1.  **Estrazione del Contesto (`buildContext`)**: Invece di una ricerca per similarità, RaPce invia all'LLM la domanda dell'utente e l'intera `Knowledge Base`. Il prompt (`extractorPrompt`) chiede al modello di agire come un "retriever intelligente", selezionando e restituendo solo le porzioni della `Knowledge Base` strettamente pertinenti alla domanda. L'output di questa fase è il **Contesto**.
2.  **Generazione della Risposta (`runConversation`)**: Il Contesto appena creato, la domanda originale e la cronologia della conversazione vengono passati all'LLM tramite un `answerPrompt`. Questo prompt finale istruisce il modello a comportarsi come un assistente conversazionale, formulando una risposta basata primariamente sulle informazioni fornite nel Contesto.

## 4. Analisi Architetturale e Compromessi (Trade-offs)

### Vantaggi

*   **Zero Infrastruttura Backend**: Il vantaggio più significativo. L'applicazione è self-contained e non richiede manutenzione lato server.
*   **Recupero "Ragionato"**: In teoria, usare un LLM per il recupero permette di identificare connessioni logiche e semantiche più complesse rispetto a una semplice ricerca di similarità coseno.
*   **Flessibilità e Controllo**: Il comportamento del sistema può essere modificato radicalmente agendo sui prompt, senza dover riaddestrare modelli o re-indicizzare i dati.

### Svantaggi

*   **Efficienza e Costi**: L'approccio è estremamente intensivo in termini di chiamate API e token utilizzati, risultando più lento e potenzialmente più costoso rispetto a un sistema RAG tradizionale.
*   **Scalabilità**: La dimensione della `Knowledge Base` che può essere efficacemente analizzata dall'LLM nella fase di estrazione del contesto è limitata dalla finestra di contesto del modello stesso. Questo rende l'approccio poco scalabile per un numero elevato di documenti.
*   **Affidabilità del Recupero**: La qualità del recupero dipende interamente dalla capacità dell'LLM di seguire le istruzioni e di non "allucinare" o tralasciare informazioni importanti. Una ricerca vettoriale, pur essendo meno "intelligente", è più deterministica.
*   **Specificità del Contesto**: Il contesto generato è ottimizzato per la domanda iniziale. Domande su argomenti diversi richiedono di rieseguire la costosa fase di estrazione del contesto, a differenza di un indice vettoriale che è agnostico rispetto alla domanda.

## 5. Conclusione

L'architettura di RaPce rappresenta un'esplorazione creativa e pragmatica dello spazio delle soluzioni RAG. Sacrifica l'efficienza e la scalabilità dei sistemi tradizionali in favore di una semplicità architetturale, una completa operatività lato client e un elevato livello di privacy. È una soluzione ideale per casi d'uso su piccola scala, dove un utente desidera analizzare un corpus di documenti personali in modo approfondito e conversazionale, senza dipendere da complesse infrastrutture esterne.
