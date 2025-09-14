"use strict";
import { DocumentType, STRING_TO_DOC_TYPE } from './llm_instructions.js';

export const OUTPUT_TEMPLATES = {
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

export function getTemplate(docType) {
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
}
