async function caricaTuttiIModuli() {
    try {
        console.log('Inizio caricamento moduli...');

        // Import principali
        const appMgrModule = await import('./js/app_mgr.js');
        const appUiModule = await import('./js/app_ui.js');
        const historyUtilsModule = await import('./js/history_utils.js');
        const llmInstructionsModule = await import('./js/llm_instructions.js');
        const llmProviderModule = await import('./js/llm_provider.js');
        const llmTemplatesModule = await import('./js/llm_templates.js');
        const promptsModule = await import('./js/prompts.js');
        const ragEngineModule = await import('./js/rag_engine.js');
        const textCleanerModule = await import('./js/text_cleaner.js');
        const textSplitterModule = await import('./js/text_splitter.js');
        const uploaderModule = await import('./js/uploader.js');

        // Adapters
        const geminiAdapterModule = await import('./js/adapter/adapter_gemini.js');
        const groqAdapterModule = await import('./js/adapter/adapter_groq.js');
        const httpClientModule = await import('./js/adapter/adapter_http_client.js');
        const huggingFaceAdapterModule = await import('./js/adapter/adapter_huggingface.js');
        const mistralAdapterModule = await import('./js/adapter/adapter_mistral.js');

        // Services
        const buildStateMgrModule = await import('./js/services/build_state_mgr.js');
        const dataKeysModule = await import('./js/services/data_keys.js');
        const docTypesModule = await import('./js/services/doc_types.js');
        const docsMgrModule = await import('./js/services/docs_mgr.js');
        const helpModule = await import('./js/services/help.js');
        const httpRequestModule = await import('./js/services/http_request.js');
        const idbMgrModule = await import('./js/services/idb_mgr.js');
        const keyRetrieverModule = await import('./js/services/key_retriever.js');
        const uaDbModule = await import('./js/services/uadb.js');
        const dialogManagerModule = await import('./js/services/uadialog.js');
        const uaDragModule = await import('./js/services/uadrag.js');
        const uaJtfhModule = await import('./js/services/uajtfh.js');
        const uaLogModule = await import('./js/services/ualog3.js');
        const uaWindowAdmModule = await import('./js/services/uawindow.js');
        const idbKeyvalModule = await import('./js/services/vendor/idb-keyval.js');

        // Rendi tutto disponibile globalmente per debug facile

        // Oggetti principali
        window.AppMgr = appMgrModule.AppMgr;

        // App UI
        window.bindEventListener = appUiModule.bindEventListener;
        window.showHtmlThread = appUiModule.showHtmlThread;
        window.wnds = appUiModule.wnds;
        window.Commands = appUiModule.Commands;
        window.TextInput = appUiModule.TextInput;
        window.TextOutput = appUiModule.TextOutput;
        window.getTheme = appUiModule.getTheme;

        // History Utils
        window.PROMPT_ANSWER = historyUtilsModule.PROMPT_ANSWER;
        window.PROMPT_CONTEXT = historyUtilsModule.PROMPT_CONTEXT;
        window.PROMPT_INITIAL_QUESTION = historyUtilsModule.PROMPT_INITIAL_QUESTION;
        window.QUESTION_PREFIX = historyUtilsModule.QUESTION_PREFIX;
        window.ANSWER_PREFIX = historyUtilsModule.ANSWER_PREFIX;
        window.ROLE_USER = historyUtilsModule.ROLE_USER;
        window.ROLE_ASSISTANT = historyUtilsModule.ROLE_ASSISTANT;
        window.ROLE_SYSTEM = historyUtilsModule.ROLE_SYSTEM;
        window.messages2html = historyUtilsModule.messages2html;
        window.messages2text = historyUtilsModule.messages2text;
        window.textFormatter = historyUtilsModule.textFormatter;

        // LLM Instructions
        window.DocumentType = llmInstructionsModule.DocumentType;
        window.STRING_TO_DOC_TYPE = llmInstructionsModule.STRING_TO_DOC_TYPE;
        window.EXTRACTION_CRITERIA = llmInstructionsModule.EXTRACTION_CRITERIA;
        window.getInstructions = llmInstructionsModule.getInstructions;
        window.getDescription = llmInstructionsModule.getDescription;
        window.getFocus = llmInstructionsModule.getFocus;
        window.getDocumentInfo = llmInstructionsModule.getDocumentInfo;
        window.listTypes = llmInstructionsModule.listTypes;
        window.listExamples = llmInstructionsModule.listExamples;
        window.listTypeExample = llmInstructionsModule.listTypeExample;

        // LLM Provider
        window.ADAPTERS = llmProviderModule.ADAPTERS;
        window.PROVIDER_CONFIG = llmProviderModule.PROVIDER_CONFIG;
        window.LlmProvider = llmProviderModule.LlmProvider;

        // Templates
        window.OUTPUT_TEMPLATES = llmTemplatesModule.OUTPUT_TEMPLATES;
        window.getTemplate = llmTemplatesModule.getTemplate;

        // Altri moduli
        window.promptBuilder = promptsModule.promptBuilder;
        window.ragEngine = ragEngineModule.ragEngine;
        window.cleanDoc = textCleanerModule.cleanDoc;
        window.splitText = textSplitterModule.splitText;
        window.docuentUploader = uploaderModule.docuentUploader;
        window.FileReaderUtil = uploaderModule.FileReaderUtil;

        // Adapters
        window.GeminiAdapter = geminiAdapterModule.GeminiAdapter;
        window.GroqAdapter = groqAdapterModule.GroqAdapter;
        window.HttpLlmClient = httpClientModule.HttpLlmClient;
        window.HuggingFaceAdapter = huggingFaceAdapterModule.HuggingFaceAdapter;
        window.MistralAdapter = mistralAdapterModule.MistralAdapter;

        // Services
        window.BuildStateMgr = buildStateMgrModule.BuildStateMgr;
        window.DATA_KEYS = dataKeysModule.DATA_KEYS;
        window.DocType = docTypesModule.DocType;
        window.DocsMgr = docsMgrModule.DocsMgr;
        window.help0_html = helpModule.help0_html;
        window.help1_html = helpModule.help1_html;
        window.help2_html = helpModule.help2_html;
        window.requestGet = httpRequestModule.requestGet;
        window.idbMgr = idbMgrModule.idbMgr;
        window.getApiKey = keyRetrieverModule.getApiKey;
        window.UaDb = uaDbModule.UaDb;
        window.DialogManager = dialogManagerModule.DialogManager;
        window.UaDrag = uaDragModule.UaDrag;
        window.UaJtfh = uaJtfhModule.UaJtfh;
        window.UaLog = uaLogModule.UaLog;
        window.UaWindowAdm = uaWindowAdmModule.UaWindowAdm;

        // IDB Keyval functions
        window.get = idbKeyvalModule.get;
        window.set = idbKeyvalModule.set;
        window.del = idbKeyvalModule.del;
        window.clear = idbKeyvalModule.clear;
        window.keys = idbKeyvalModule.keys;

        console.log('✅ Tutti i moduli caricati con successo!');
        console.log('Tutti gli oggetti sono ora disponibili globalmente (window.NomeOggetto)');

        // Lista di tutti gli oggetti caricati
        const oggettiCaricati = [
            'AppMgr', 'bindEventListener', 'showHtmlThread', 'wnds', 'Commands', 'TextInput', 'TextOutput', 'getTheme',
            'PROMPT_ANSWER', 'PROMPT_CONTEXT', 'PROMPT_INITIAL_QUESTION', 'QUESTION_PREFIX', 'ANSWER_PREFIX',
            'ROLE_USER', 'ROLE_ASSISTANT', 'ROLE_SYSTEM', 'messages2html', 'messages2text', 'textFormatter',
            'DocumentType', 'STRING_TO_DOC_TYPE', 'EXTRACTION_CRITERIA', 'getInstructions', 'getDescription',
            'getFocus', 'getDocumentInfo', 'listTypes', 'listExamples', 'listTypeExample',
            'ADAPTERS', 'PROVIDER_CONFIG', 'LlmProvider', 'OUTPUT_TEMPLATES', 'getTemplate',
            'promptBuilder', 'ragEngine', 'cleanDoc', 'splitText', 'docuentUploader', 'FileReaderUtil',
            'GeminiAdapter', 'GroqAdapter', 'HttpLlmClient', 'HuggingFaceAdapter', 'MistralAdapter',
            'BuildStateMgr', 'DATA_KEYS', 'DocType', 'DocsMgr', 'help0_html', 'help1_html', 'help2_html',
            'requestGet', 'idbMgr', 'getApiKey', 'UaDb', 'DialogManager', 'UaDrag', 'UaJtfh', 'UaLog',
            'UaWindowAdm', 'get', 'set', 'del', 'clear', 'keys'
        ];

        console.log('Oggetti disponibili:', oggettiCaricati);
        return oggettiCaricati;

    } catch (error) {
        console.error('❌ Errore durante il caricamento dei moduli:', error);
        console.log('Verifica che tutti i file esistano e siano accessibili');
    }
}

// Esegui il caricamento
caricaTuttiIModuli();