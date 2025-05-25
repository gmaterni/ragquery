/** @format */
// function show() {
//   const log = document.getElementById("id_log");
//   if (log.classList.contains("active")) return;
//   log.classList.add("active");
// }

// function hide() {
//   const log = document.getElementById("id_log");
//   if (!log.classList.contains("active")) return;
//   log.classList.remove("active");
// }
// jshint esversion: 8
// release 09-'6-24
// utilizzare l'ultima versione di UaWindowAdm
// setXY con vw ,vh

function formatRow(vs, sps) {
  return vs
    .map((v, i) => {
      const space = sps[i];
      const frtm = space < 0 ? v.toString().padStart(Math.abs(space), " ") : v.toString().padEnd(space, " ");
      return frtm;
    })
    .join(" ");
}

var UaLog = {
  callHide: function () {},
  callShow: function () {},
  active: false,
  wind: null,
  x: null,
  y: null,
  z: null,
  max_length: 2000,
  msg_id: "ualogmsg_",
  new: function () {
    if (this.wind == null) {
      this.wind = UaWindowAdm.create("ualog_id");
      //aggiunge la class inv
      // const e = this.wind.getElement();
      // e.classList.add("inv");
      // this.wind.drag();
    }
    const h = `
           <button type="button" class="clear " onclick="javascript:UaLog.cls();">Clear</button>
           <button type="button" class="close " onclick="javascript:UaLog.close();">Close</button>
           <pre id="ualogmsg_" ></pre>`;
    this.wind.setHtml(h);
    // this.wind.addClassStyle("ualog");
    this.wind.addClassStyle("inv");
    if (!!this.x) this.wind.vw_vh().setXY(this.x, this.y, -1);
    else this.wind.setCenter(-1);
    if (!!this.z) this.wind.setZ(this.z);
    return this;
  },
  setXY(x, y) {
    this.x = x;
    this.y = y;
    return this;
  },
  setZ(z) {
    this.z = z;
    return this;
  },
  prn_(...args) {
    let s = args.join("\n");
    let e = document.getElementById(this.msg_id);
    let h = e.textContent + s + "\n";
    e.textContent = h;
  },
  print(...args) {
    if (this.wind == null) return;
    if (!this.active) return;
    this.prn_(...args);
  },
  log(...args) {
    if (this.wind == null) return;
    this.prn_(...args);
  },
  log_show(...args) {
    if (this.wind == null) return;
    if (!this.active) this.toggle();
    this.prn_(...args);
  },
  cls() {
    if (this.wind == null) return;
    document.getElementById(this.msg_id).innerHTML = "";
    return this;
  },
  close() {
    if (this.wind == null) return;
    this.wind.hide();
    this.active = false;
    this.callHide();
  },
  toggle() {
    if (this.wind == null) return;
    if (!this.active) {
      this.active = true;
      this.wind.show();
      this.callShow();
    } else {
      this.active = false;
      this.wind.hide();
      this.callHide();
    }
  },
};
