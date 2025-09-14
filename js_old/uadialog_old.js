/** @format */

export const DialogManager = {
  createDialog(type, message, defaultValue = "") {
    const dialog = document.createElement("div");
    const overlay = document.createElement("div");
    dialog.className = `${type}-dialog`;
    dialog.classList.add("inv");
    overlay.className = "overlay";

    // Aggiunge un campo di input per il dialogo di tipo "prompt"
    const inputHtml = type === "prompt" ? `<input type="text" class="prompt-input" value="${defaultValue}">` : "";

    dialog.innerHTML = `
          <h4>${message}</h4>
          ${inputHtml}
          <div class="buttons">
            <button class="ok">OK</button>
            ${type === "confirm" || type === "prompt" ? '<button class="cancel">Annulla</button>' : ""}
          </div>`;

    [dialog, overlay].forEach((el) => {
      el.classList.add("show");
      document.body.appendChild(el);
    });
    return { dialog, overlay };
  },

  closeDialog(dialog, overlay) {
    [dialog, overlay].forEach((el) => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    });
  },

  showDialog(type, message, defaultValue) {
    return new Promise((resolve) => {
      const { dialog, overlay } = this.createDialog(type, message, defaultValue);
      const okBtn = dialog.querySelector(".ok");
      const cancelBtn = dialog.querySelector(".cancel");

      if (type === "prompt") {
        const input = dialog.querySelector(".prompt-input");
        input.focus();
        input.select();
        okBtn.onclick = () => {
          this.closeDialog(dialog, overlay);
          resolve(input.value);
        };
        cancelBtn.onclick = () => {
          this.closeDialog(dialog, overlay);
          resolve(null); // Comportamento standard per l'annullamento del prompt
        };
        // Permette di inviare con il tasto Invio
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            okBtn.click();
          }
        });
      } else if (type === "confirm") {
        okBtn.onclick = () => {
          this.closeDialog(dialog, overlay);
          resolve(true);
        };
        cancelBtn.onclick = () => {
          this.closeDialog(dialog, overlay);
          resolve(false);
        };
      } else {
        // 'alert'
        okBtn.onclick = () => {
          this.closeDialog(dialog, overlay);
          resolve(undefined); // alert non restituisce valore
        };
      }
    });
  },
};

// Salviamo i riferimenti alle funzioni native
const nativeAlert = window.alert;
const nativeConfirm = window.confirm;
const nativePrompt = window.prompt;

// Sovrascriviamo alert
window.alert = function (message) {
  if (message instanceof Error) {
    message = message.message;
  }
  return DialogManager.showDialog("alert", message);
};

// Sovrascriviamo confirm
window.confirm = function (message) {
  return DialogManager.showDialog("confirm", message);
};

// Sovrascriviamo prompt
window.prompt = function (message, defaultValue = "") {
  return DialogManager.showDialog("prompt", message, defaultValue);
};

// window.DialogManager = DialogManager;
