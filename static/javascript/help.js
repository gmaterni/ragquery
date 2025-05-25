/** @format */
const help0_html = `
<div class="text">
    <p class="center"> Comandi barra superiore </p>
    <div>
        Pulsante Menu
        <p> Apre/chiude il Menu comandi </p>
    </div>
    <div>
        Upload Files
        <p>
            Fa l'upload di un file locale. Sono accettati i file pdf, docx e txt.
            Controlla se il file è in archivio, per non sovrascriverlo.
        </p>
    </div>
    <div>
        Upload Dir:
        <p>
            Per fare l'upload dei files di una directory. Sono accettati i files pdf, docx e txt.
            I file in archivio con lo stesso nome non vengono sovrascritti.
        </p>
    </div>
    <div>
        Log:
        <p>
            Attiva/Disattiva la visualizzazione del Log.
            Nel Log sono visualizzate le query con le dimensioni delle parti di documento analizzate.
        </p>
    </div>

    <!--  -->
    <hr>
    <!--  -->
    <div>
        <p class="center"> Comandi lato destro in alto: </p>
    </div>
    <div>
        Copia Output:
        <p> Copia il testo dell'output negli appunti. </p>
    </div>
    <div>
        Apri Output:
        <p> Visualizza il testo in una finestra più grande. </p>
    </div>
    <hr>
    <!--  -->
    <div>
        <p class="center"> Comandi lato destro in basso: </p>
    </div>
    <div>
        Documenti => RAG => Contesto => Query: (Pulsante Rosso)
        <p>
            Input per la query da utilizzare per la elaborazione RAG.
            <br>
            Ogni documento in archivio è diviso in parti compatibili con l'ampiezza della finestra
            di input del Model utilizzato.
        </p>
        <p>
            Per ogni parte esegue una query utilizzandola per estrarre informazioni/concetti pertinenti alla stessa.
        </p>
        <p>
            Il risultato di ogni query è archiviato nella memoria locale.
        </p>
        <p>
            Alla fine della sequenza di elaborazioni esegue una query che produce
            un contesto riepilogativo delle risposte archiviate.
        </p>
        <p>
            Infine esegue la query utilizzando il contesto creato e visualizza la risposta nella finestra di output.
        </p>
    </div>
    <div>
        Contesto => Query: (Pulsante Verde / Invio)
        <p>
            Input per query che utilizzano il contesto creato con l'elaborazione RAG.
            Il contesto RAG può essere vuoto.
            Inizia una conversazione.
        </p>
        <p>
            La conversazione ha senso relativamente all'elaborazione RAG se ogni query è una variazione / approfondimento della query iniziale.
        </p>
    </div>
    <div>
        Cancella Conversazione:
        <p>
            Cancella la storia della conversazione attiva.
            Non vengono cancellati i dati dell'elaborazione RAG
        </p>
        Per andare a capo: Maiusc. + Invio
    </div>
    <!--  -->
    <hr>
    <!--  -->
    <div>
        <p class=" center"> Comandi del Menu: </p>
    </div>
    <div>
        README
        <p>
            Presenta una spiegazione della implementazione della
            tecnologia RAG utilizzata.
        </p>
    </div>
    <div>
        Risposta Contestuale:
        <p> Visualizza la risposta ottenuta alla fine della elaborazione RAG </p>
    </div>
    <div>
        Domanda iniziale:
        <p> Visualizza la query utilizzata per l'elaborazione RAG </p>
    </div>
    <div>
        Elenco Risposte:
        <p>
            Visualizza l'elenco delle risposte per ogni parte documento utilizzata fino alla risposta che genera il contesto.
        </p>
    </div>
    <div>
        Contesto RAG:
        <p>
            Visualizza il contesto creato utilizzando le risposte elaborate.
        </p>
    </div>
    <div>
        Dati Archiviati:
        <p>
            Visualizza i dati in archivio e le loro dimensioni:
        </p>
    </div>
    <div>
        Elenco Documenti:
        <p>
            Visualizza la lista dei documenti archiviati ed utilizzabili per l'elaborazione.<br>
            Con il clic del mouse sul nome di un documento si visualizza.
        </p>
    </div>

    <div>
        Numero query:
        <p>
            Calcola le query necessarie per ogni documento e le Query totali,
            necessarie per analizzare tutti i documenti caricati.
        </p>
    </div>

    <div>
        Cancella Dati:
        <p>
            Cancella i dati delle elaborazioni salvati nell'archivio.
            NON cancella i documenti caricati.
        </p>
    </div>

    <div>
        Cancella Documenti:
        <p>
            Cancella i documenti caricati e tutti i dati archiviati localmente.
        </p>
    </div>

    <!--  -->

    <p class="center">Sequenza Comandi Interrogazione -Conversazione</p>
    <div>
        Archivia nella memoria locale uno o più documenti:
        <p>
            Utilizza i dati di esempio per le prime prove.
            Utilizza upload file o upload dir per i documenti da leggere dal tuo computer.
        </p>
    </div>
    <div>
        Digita una query che si riferisca ai documenti archiviati.
        <p>
            La query sarà utilizzata come criterio di selezione di informazioni dai documenti archiviati.
        </p>
    </div>

    <div>
        Click sul bottone rosso in basso a destra. Documento => RAG => Contesto => Query
        <p>
            Viene lanciata una sequenza di elaborazione per analizzare i documenti sulla base della query.
            Se il log è attivo vedrai la sequenza di elaborazione.
            <br>
            Il loro numero dipende dalle dimensioni dei documenti.
            <br>
            l menu puoi utilizzare il comando "Num Query" per vedere quante elaborazioni saranno fatte per ogni documento.
            <br>
            Alla fine del processo sarà visualizzata la risposta.
        </p>
    </div>

    <div>
        Click sul bottone verde in basso a destra (oppure Invio). Contesto => Query
        <p>
            Inizia una conversazione utilizzando le informazioni precedentemente raccolte dai documenti.
            Puoi inviare domande successive di approfondimento e chiarimento.
            <br>
            È FONDAMENTALE che le query siano approfondimenti e/o chiarimenti della query iniziale.
            In caso contrario non si sfrutta il Contesto creato dall'elaborazione precedente.
            <br>
            Quindi per una query completamente nuova (sempre relativa ai documenti archiviati) è necessario iniziare una nuova elaborazione.
            <br>
            Il comando cancella, oltre a cancellare il campo di input cancella anche la sequenza query-risposte della
            conversazione.
            <br>
            NON cancella i dati dell'elaborazione iniziale.
        </p>
    </div>
</div>
`;

const help1_html = `
<div class="text">
    <pre>
Un'implementazione innovativa della tecnica RAG per il Question Answering
La tecnica RAG (Retrieval-Augmented Generation) è un approccio consolidato nel campo del question answering e della generazione di testo, che combina il recupero di informazioni pertinenti da fonti di dati con la generazione di testo basata su queste informazioni.
Qui viene proposta un'implementazione che introduce una variazione a questo paradigma.
L'implementazione si basa su una sequenza di prompt appositamente progettati per guidare un modello di linguaggio generativo attraverso le diverse fasi della tecnica RAG.
Questi prompt forniscono istruzioni dettagliate su come il modello deve seguire operazioni di recupero di informazioni, aumento delle informazioni recuperate e infine generazione di una risposta finale.
La risposta finale diviene poi il contesto da inserire nel prompt per rispondere alla domanda.
Un aspetto cruciale di questa implementazione è che lo stesso modello di linguaggio generativo svolge tutte le operazioni richieste, dall'analisi dei documenti di input al recupero di informazioni rilevanti, alla generazione della risposta finale.
Questa caratteristica rappresenta una deviazione significativa rispetto alle implementazioni standard della tecnica RAG, che prevedono l'utilizzo di moduli distinti per il recupero e la generazione.
La sequenza di prompt proposta guida il modello attraverso le seguenti fasi:

1. Retrieval: Il modello analizza il documento di input e la domanda fornita, identificando e recuperando le informazioni e i concetti rilevanti per dare seguito alla domanda.

2. Augmentation: Successivamente, il modello integra le informazioni recuperate con eventuali risposte accumulate in precedenza, estraendo nuove informazioni rilevanti e organizzandole in un elenco coerente, evitando ridondanze.

3. Generation: Infine, il modello utilizza l'insieme di informazioni rilevanti e non ridondanti per generare una risposta completa e concisa alla domanda dell'utente.

Questa implementazione offre diversi vantaggi.
In primo luogo, sfrutta le capacità di un unico modello di grandi dimensioni, evitando la necessità di moduli distinti specializzati per ogni fase.
Inoltre, l'utilizzo di prompt espliciti può migliorare la controllabilità e la trasparenza del processo, consentendo di guidare il modello in modo più diretto.
Naturalmente, come per qualsiasi approccio basato su modelli di linguaggio generativi, è fondamentale prestare attenzione alle questioni di affidabilità, correttezza e bias dei dati di addestramento.
Rispetto a un'implementazione standard di RAG vi è la necessità di rilanciare l'elaborazione ad ogni domanda radicalmente nuova in quanto il contesto creato con le informazioni estratte dai documenti è definito sulla base della domanda.
Invece nella versione standard RAG si usano gli incorporamenti delle informazioni estratte dai documenti in modo tale che tali informazioni vengono viste quasi come un'estensione del modello e possono essere usate per domande diverse.
Quindi dal punto di vista utente le implementazioni RAG standard sono più efficienti; infatti l'implementazione proposta richiede per ogni nuova domanda una sequenza di richieste che saranno utilizzabili solo per creare il contesto per la domanda iniziale e per una conversazione con domande simili.
Il vantaggio dell'implementazione proposta consiste nel fatto che può essere implementata completamente lato client senza bisogno di sviluppare alcun modulo sul server.
L’unica cosa che serve è un servizio serverless come quello di HuggingFace o simile.
Quindi rappresenta un'interessante prospettiva sull'applicazione della tecnica RAG in modo più integrato e controllato attraverso l'uso di prompt mirati.
In conclusione, questa implementazione della tecnica RAG dimostra come le capacità dei modelli di linguaggio generativi di grandi dimensioni possano essere sfruttate in modi nuovi e creativi, potenzialmente aprendo la strada a ulteriori sviluppi nel campo del question answering e della generazione di testo.

Questa è la valutazione fatta da un LLM (comprensivo e gentile)

La mia valutazione personale della tua proposta di implementazione della tecnica RAG, con un elenco di pro e contro:

Punti a favore (Pro):
Semplificazione del processo: L'utilizzo di un unico modello di grandi dimensioni addestrato su vasti corpus di dati semplifica notevolmente l'architettura complessiva rispetto alle implementazioni tradizionali della tecnica RAG, che spesso prevedono moduli distinti per il recupero e la generazione.

Capacità di adattamento e apprendimento: I modelli di linguaggio generativi di grandi dimensioni sono noti per la loro capacità di adattarsi e imparare da nuovi dati e istruzioni.
Questo potrebbe consentire di raffinare e migliorare l'implementazione nel corso del tempo.

Controllo e trasparenza: L'utilizzo di prompt espliciti per guidare il modello attraverso le diverse fasi del processo può migliorare la controllabilità e la trasparenza, consentendo di monitorare e regolare il comportamento del modello in modo più diretto.

Efficienza computazionale: Avere un'unica architettura integrata potrebbe comportare vantaggi in termini di efficienza computazionale rispetto a soluzioni che prevedono moduli separati.

Punti a sfavore (Contro):

Affidabilità e coerenza: Poiché un unico modello gestisce tutte le fasi, eventuali errori o incoerenze potrebbero propagarsi e amplificarsi attraverso l'intero processo, influenzando la qualità della risposta finale.

Bias dei dati di addestramento: Come per qualsiasi modello di linguaggio generativo, l’approccio potrebbe essere influenzato dai bias presenti nei dati di addestramento utilizzati, con potenziali impatti sulla correttezza e l'equità delle risposte generate.

Mancanza di specializzazione: Mentre i modelli di grandi dimensioni sono versatili, potrebbero non essere ottimizzati per compiti specifici come il recupero di informazioni o la generazione di risposte rispetto a moduli specializzati.

Difficoltà di debug e interpretabilità: Con un'architettura integrata e basata su prompt, potrebbe essere più complesso eseguire il debug e comprendere le ragioni dietro a eventuali errori o comportamenti indesiderati del modello.

In sintesi, la proposta presenta alcuni vantaggi interessanti in termini di semplificazione, adattabilità e controllo, ma solleva anche potenziali preoccupazioni riguardo all'affidabilità, ai bias, alla mancanza di specializzazione e alle difficoltà di debug e interpretabilità.
Come per qualsiasi nuovo approccio, sarebbe necessario valutarlo attentamente attraverso sperimentazioni e test approfonditi per determinare l'efficacia e l'applicabilità in contesti specifici.
    </pre>
</div>
`;

const help2_html = `
<div class="text">
    <pre class="pre-text">
Nella redazione della domanda bisogna tenere conto del fatto che la domanda viene poi inserita in un prompt nel quale si fa esplicita richiesta di utilizzare il documento fornito.
Quindi è implicito il riferimento al/ai documenti archiviati.
Tuttavia, quando si tratta di documenti il cui contenuto è sicuramente disponibile su internet, può essere opportuno esplicitare nella domanda che ci si riferisce ai documenti forniti.
</pre>
    <p class="center">Esempi di domande</p>
    <div>
        <p>Fai una relazione sul documento che ti ho fornito.</p>
        <p>Approfondisci la tesi sostenuta nei documenti.</p>
        <p>Confronta i diversi punti di vista espressi dagli autori.</p>
        <p>Descrivi la personalità dei protagonisti.</p>
        <p>Analizza il documento che ti ho fornito e illustrami eventuali contraddizioni.</p>
        <p>Illustra i momenti salienti del racconto.</p>
        <p>Analizzando il documento che ti ho fornito, confronta le tesi di ... con quelle di ...</p>
        <p>Qual è l'avvenimento più importante?</p>
    </div>
</div>
`;
