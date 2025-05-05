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
  txt = txt.replace(/<<</g, "").replace(/>>>/g, "");
  txt = txt.replace(/<</g, "").replace(/>>/g, "");
  return txt;
}

function cleanDoc(s) {
  try {
    s = s.replace(/`/g, "");
    s = removeTag(s);

    // Unisce le parole divise dal trattino a fine riga
    s = s.replace(/(\w+)-\s*\n(\w+)/g, "$1$2");

    // Rimuove caratteri non stampabili specifici
    const charsRm = /[\u00AD\u200B\u200C\u200D\u2060\uFEFF\u0008]/g;
    s = s.replace(charsRm, "");

    // Sostituisce spazi non standard e altri caratteri con uno spazio
    const charsSrp = /[\u00A0\u2000-\u200A\u202F\u205F\u3000\t\r\f\v]/g;
    s = s.replace(charsSrp, " ");

    // Mantieni le sequenze di escape comuni
    s = s.replace(/\\([nrtfb])/g, "$1");

    // Mantieni le sequenze Unicode
    s = s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2})/g, "$1");

    // Mantieni i backslash nei path di file
    s = s.replace(/\\([a-zA-Z]:\\|\\\\[a-zA-Z0-9_]+\\)/g, "\\$1");

    // Rimuovi tutti gli altri backslash
    s = s.replace(/\\/g, "");

    // Elimina le righe costituite dalla ripetizione di più di tre caratteri uguali
    s = s.replace(/(.)\1{3,}/g, "");

    // Uniforma i caratteri di quotazione
    s = s.replace(/“/g, '"').replace(/”/g, '"');

    // Rimpiazza newline
    s = s.replace(/\n/g, " ");

    // Rimuove spazi prima della punteggiatura
    s = s.replace(/ +([.,;:!?])/g, "$1");

    // Rimuove spazi multipli
    s = s.replace(/ +/g, " ");

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

function cleanOut(inputText) {
  const lines = inputText.split("\n");
  let currentSpeaker = null;
  let resultHtml = "";
  lines.forEach((line) => {
    // Trim the line to remove any leading/trailing whitespace
    line = line.trim();
    // Check if the line starts with '# User:' or '# Assistant:'
    if (line.startsWith("# User:")) {
      // If there was a previous speaker, close their div
      if (currentSpeaker) {
        resultHtml += `</div>`;
      }
      // Set the current speaker to 'user' and open a new div
      currentSpeaker = "user";
      resultHtml += `<div class="${currentSpeaker}"><b>User:</b>`;
    } else if (line.startsWith("# Assistant:")) {
      // If there was a previous speaker, close their div
      if (currentSpeaker) {
        resultHtml += `</div>`;
      }
      // Set the current speaker to 'assistant' and open a new div
      currentSpeaker = "assistant";
      resultHtml += `<div class="${currentSpeaker}"><b>Assistant:</b>`;
    } else if (line.length > 0) {
      // If the line is not a speaker line and not empty, add it to the current div
      if (currentSpeaker) {
        resultHtml += `<br>${line}`;
      }
    }
  });

  // Close the last div if there was any speaker
  if (currentSpeaker) {
    resultHtml += `</div>`;
  }
  // console.log("html:\n", resultHtml);
  return resultHtml;
}

function textFormatter(txt) {
  let plainText = txt.replace(/<[^>]*>/g, "");
  let sentences = plainText.split(/([.!?:])(?=\s|$)/);
  let text = "";
  for (let i = 0; i < sentences.length; i += 2) {
    let sentence = sentences[i];
    let delimiter = sentences[i + 1] || "";
    if (sentence.trim().length > 0) {
      text += "  " + sentence.trim() + delimiter;
    }
    if (i < sentences.length - 2) {
      text += "\n";
    }
  }
  text = text.replace(/User:/g, "\n\nUSER:\n");
  text = text.replace(/Assistant:/g, "\n\nASSISTANT:\n");
  return text.trim();
}
