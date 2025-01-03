/** @format */

// Oggetto letterale per gestire i dialoghi
const DialogManager = {
  createDialog(type, message) {
    const dialog = document.createElement("div");
    const overlay = document.createElement("div");

    dialog.className = `${type}-dialog`;
    overlay.className = "overlay";

    dialog.innerHTML = `
          <h4>${message}</h4>
          <div class="buttons">
            <button class="ok">OK</button>
            ${type === "confirm" ? '<button class="cancel">Annulla</button>' : ""}
          </div>
        `;

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

  showDialog(type, message) {
    return new Promise((resolve) => {
      const { dialog, overlay } = this.createDialog(type, message);

      dialog.querySelector(".ok").onclick = () => {
        this.closeDialog(dialog, overlay);
        resolve(type === "confirm");
      };

      if (type === "confirm") {
        dialog.querySelector(".cancel").onclick = () => {
          this.closeDialog(dialog, overlay);
          resolve(false);
        };
      }
    });
  },
};

// Salviamo i riferimenti alle funzioni native
const nativeAlert = window.alert;
const nativeConfirm = window.confirm;

// Sovrascriviamo alert
window.alert = function (message) {
  return DialogManager.showDialog("alert", message);
};

// Sovrascriviamo confirm
window.confirm = function (message) {
  return DialogManager.showDialog("confirm", message);
};

// Funzione di test che usa la sintassi nativa
// async function testConfirm() {
//   const result = await confirm("Vuoi continuare?");
//   await alert(result);
// }
