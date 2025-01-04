/** @format */
// function removeTag(txt) {
//   txt = txt.replace(/<<</g, " ").replace(/>>>/g, " ");
//   txt = txt.replace(/<</g, "").replace(/>>/g, "");
//   return txt;
// }


// function cleanDoc(s) {
//   try {
//       // Rimuove i tag HTML
//       // s = removeTag(s);

//       // Unisce le parole divise dal trattino a fine riga
//       s = s.replace(/(\w+)-\s*\n(\w+)/g, '$1$2');

//       // Rimuove caratteri non stampabili specifici
//       const charsRm = /[\u00AD\u200B\u200C\u200D\u2060\uFEFF\u0008]/g;
//       s = s.replace(charsRm, '');

//       // Sostituisce spazi non standard e altri caratteri con uno spazio
//       const charsSrp = /[\u00A0\u2000-\u200A\u202F\u205F\u3000\t\r\f\v]/g;
//       s = s.replace(charsSrp, ' ');

//       // Uniforma i caratteri di quotazione
//       s = s.replace(/[“”]/g, '"');

//       // Rimuove spazi prima della punteggiatura
//       s = s.replace(/ +([.,;:!?])/g, '$1');

//       // Rimuove spazi multipli
//       s = s.replace(/ +/g, ' ');

//       // Divide il testo in frasi
//       const sentences = s.split(/(?<=[.?!])\s+/);
//       const minLen = 5; // Ridotto a 5 per includere frasi più brevi ma valide
//       s = sentences.filter(sentence => sentence.trim().length >= minLen).map(sentence => sentence.trim()).join('\n');

//       // Rimuove spazi iniziali e finali
//       return s.trim();
//   } catch (e) {
//       console.error(e);
//       return "Errore di codifica del documento";
//   }
// }

function removeTag(txt) {
  txt = txt.replace(/<<</g, '').replace(/>>>/g, '');
  txt = txt.replace(/<</g, '').replace(/>>/g, '');
  return txt;
}

function cleanDoc(s) {
  try {
      s = s.replace(/`/g, '');
      s = removeTag(s);

      // Unisce le parole divise dal trattino a fine riga
      s = s.replace(/(\w+)-\s*\n(\w+)/g, '$1$2');

      // Rimuove caratteri non stampabili specifici
      const charsRm = /[\u00AD\u200B\u200C\u200D\u2060\uFEFF\u0008]/g;
      s = s.replace(charsRm, '');

      // Sostituisce spazi non standard e altri caratteri con uno spazio
      const charsSrp = /[\u00A0\u2000-\u200A\u202F\u205F\u3000\t\r\f\v]/g;
      s = s.replace(charsSrp, ' ');

      // Mantieni le sequenze di escape comuni
      s = s.replace(/\\([nrtfb])/g, '$1');

      // Mantieni le sequenze Unicode
      s = s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2})/g, '$1');

      // Mantieni i backslash nei path di file
      s = s.replace(/\\([a-zA-Z]:\\|\\\\[a-zA-Z0-9_]+\\)/g, '\\$1');

      // Rimuovi tutti gli altri backslash
      s = s.replace(/\\/g, '');

      // Elimina le righe costituite dalla ripetizione di più di tre caratteri uguali
      s = s.replace(/(.)\1{3,}/g, '');

      // Uniforma i caratteri di quotazione
      s = s.replace(/“/g, '"').replace(/”/g, '"');

      // Rimpiazza newline
      s = s.replace(/\n/g, ' ');

      // Rimuove spazi prima della punteggiatura
      s = s.replace(/ +([.,;:!?])/g, '$1');

      // Rimuove spazi multipli
      s = s.replace(/ +/g, ' ');

      return s.trim();
  } catch (e) {
      console.error(e);
      return "Errore di codifica del documento";
  }
}

function cleanResponse(s) {
  try {
    // s=removeTag(s);
    // Rimuove caratteri non stampabili specifici
    const charsRm = /[\u00AD\u200B\u200C\u200D\u2060\uFEFF]/g;
    s = s.replace(charsRm, "");
    // Sostituisce spazi non standard e altri caratteri con uno spazio
    const charsSrp = /[\u00A0\u2000-\u200A\u202F\u205F\u3000\t\r\f\v]/g;
    s = s.replace(charsSrp, " ");
    // Mantieni le sequenze di escape comuni
    s = s.replace(/\\([nrtfb])/g, "$1");
    // Mantieni le sequenze Unicode
    s = s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2})/g, "$1");
    // Mantieni i backslash nei path di file
    s = s.replace(/\\([a-zA-Z]:\\|\\\\[a-zA-Z0-9_]+\\)/g, "\\\\$1");
    // Rimuovi tutti gli altri backslash
    s = s.replace(/\\/g, "");
    // Sostituisce le sequenze di più di due newline con due newline
    s = s.replace(/\n{3,}/g, "\n\n");
    // unifica spazi multipli
    s = s.replace(/ +/g, " ");
    return s.trim();
  } catch (e) {
    console.error(e);
    return `Errore di codifica nella risposta\n${e}`;
  }
}

function cleanOut(txt) {
  // Formatta gli elenchi puntati per una migliore leggibilità
  // txt = txt.replace(/^(\s*[-*•])(\s*)/gm, "\n$1 ");
  // Formatta gli elenchi numerati per una migliore leggibilità
  // txt = txt.replace(/^(\s*\d+\.)(\s*)/gm, "\n$1 ");
  // Aggiunge una riga vuota prima e dopo i blocchi di codice
  // txt = txt.replace(/(```[\s\S]*?```)/g, "\n\n$1\n\n");
  // Aggiunge un'andata a capo dopo ogni punto, eccetto quando seguito da newline o fine stringa
  // txt = txt.replace(/\.(?!\n|$)/g, ".\n");
  // Sostituisce le sequenze di più di due newline con due newline
  txt = txt.replace(/\n{3,}/g, "\n\n");
  // Rimuove gli spazi bianchi extra alla fine di ogni riga
  // txt = txt.replace(/ +/g, " ");
  // txt = txt.replace(/\s+$/gm, "");
  return txt;
}

// <<<doc_name>>> => Documento: doc_name
// function subResponseDOcTag(txt) {
//   const regex = /<<<(.*?)>>>/;
//   const result = txt.replace(regex, (match, p1) => `Documento: ${p1}`);
//   return result;
// }
