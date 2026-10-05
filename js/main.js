/* =========================================================
   Tischlerei Kogler – main.js
   1. Handy-Menü
   2. Öffnungszeiten + Live-Status (österreichische Zeit)
   3. Filter für die Arbeiten
   4. Tischrechner (Preis, Lieferzeit, Draufsicht)
   5. Kontaktformular (Prüfung im Browser)
   ========================================================= */

/* ---------- Daten zum Anpassen ---------- */

// Öffnungszeiten der Werkstatt. 0 = Sonntag ... 6 = Samstag. Zeiten in Minuten ab Mitternacht.
const HOURS = {
  1: [7 * 60, 16 * 60],
  2: [7 * 60, 16 * 60],
  3: [7 * 60, 16 * 60],
  4: [7 * 60, 16 * 60],
  5: [7 * 60, 12 * 60],
  6: null,
  0: null,
};
const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

// Preise für den Tischrechner (Richtwerte inkl. MwSt.)
const PRICES = {
  basis: 650,                          // Planung, Zuschnitt, Lieferung
  holzProM2: { eiche: 1050, nuss: 1450, esche: 900, laerche: 760 },
  gestell:   { wangen: 520, vierfuss: 440, kufen: 590 },
  oberflaeche: { oel: 0, seife: 70, lack: 220 },
  auszug: 690,
};
const LABELS = {
  holz: { eiche: "Eiche", nuss: "Nuss", esche: "Esche", laerche: "Lärche" },
  gestell: { wangen: "Wangen aus Holz", vierfuss: "vier Beine mit Zarge", kufen: "Kufen aus Stahl" },
  oberflaeche: { oel: "geölt", seife: "naturseifenbehandelt", lack: "matt lackiert" },
};

/* ---------- Hilfsfunktionen ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Aktuelle Zeit in Wien – egal, in welcher Zeitzone der Besucher ist
function viennaNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Vienna", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) % 24 * 60 + Number(get("minute")) };
}

const fmtTime = (min) => `${Math.floor(min / 60)}${min % 60 ? ":" + String(min % 60).padStart(2, "0") : ""}`;
// Tausenderpunkt wie in Österreich üblich: 3.250
const fmtNum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const fmtEuro = (n) => "€ " + fmtNum(n);
const roundTo = (n, step) => Math.round(n / step) * step;

/* ---------- 1. Handy-Menü ---------- */
function initNav() {
  const toggle = $(".nav-toggle");
  const nav = $("#nav");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
}

/* ---------- 2. Öffnungszeiten ---------- */
function initHours() {
  const { day, minutes } = viennaNow();

  // Tabelle: Montag zuerst
  const tbody = $("[data-hours]");
  if (tbody) {
    tbody.innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => {
      const h = HOURS[d];
      const time = h ? `${fmtTime(h[0])}–${fmtTime(h[1])} Uhr` : "geschlossen";
      return `<tr class="${d === day ? "is-today" : ""}"><td>${DAY_NAMES[d]}</td><td>${time}</td></tr>`;
    }).join("");
  }

  // Status-Zeile im Hero
  const box = $("[data-status]");
  const text = $("[data-status-text]");
  if (!box || !text) return;

  const today = HOURS[day];
  if (today && minutes >= today[0] && minutes < today[1]) {
    box.classList.add("is-open");
    text.textContent = `Werkstatt gerade offen – heute bis ${fmtTime(today[1])} Uhr`;
    return;
  }

  // Nächste Öffnung suchen (heute später oder an einem der nächsten Tage)
  box.classList.add("is-closed");
  if (today && minutes < today[0]) {
    text.textContent = `Werkstatt öffnet heute um ${fmtTime(today[0])} Uhr`;
    return;
  }
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    if (HOURS[d]) {
      const when = i === 1 ? "morgen" : DAY_NAMES[d];
      text.textContent = `Werkstatt geschlossen – wieder offen ${when} ab ${fmtTime(HOURS[d][0])} Uhr`;
      return;
    }
  }
}

/* ---------- 3. Filter ---------- */
function initFilter() {
  const buttons = $$("[data-filter]");
  const items = $$("[data-projects] .project");
  const empty = $("[data-filter-empty]");
  if (!buttons.length) return;

  buttons.forEach((btn) => btn.addEventListener("click", () => {
    const cat = btn.dataset.filter;
    buttons.forEach((b) => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    let visible = 0;
    items.forEach((item) => {
      const show = cat === "alle" || item.dataset.cat === cat;
      item.hidden = !show;
      if (show) {
        visible++;
        // kleine Einblend-Animation
        item.classList.add("is-entering");
        requestAnimationFrame(() => requestAnimationFrame(() => item.classList.remove("is-entering")));
      }
    });
    if (empty) empty.hidden = visible > 0;
  }));
}

/* ---------- 4. Tischrechner ---------- */
function initCalc() {
  const form = $("[data-calc]");
  if (!form) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const top = $("[data-calc-top]", form);
  const ext = $("[data-calc-ext]", form);
  const chairs = $("[data-calc-chairs]", form);
  const woodImg = $("[data-calc-wood]", form);

  const SCALE = 0.85;          // Pixel pro Zentimeter in der Zeichnung
  const CX = 200, CY = 120;    // Mitte der Zeichnung
  const CHAIR_W = 34, CHAIR_D = 28, GAP = 6; // in Pixel

  function read() {
    const data = new FormData(form);
    return {
      holz: data.get("holz"),
      laenge: Number(data.get("laenge")),
      breite: Number(data.get("breite")),
      gestell: data.get("gestell"),
      oberflaeche: data.get("oberflaeche"),
      auszug: data.get("auszug") === "on",
    };
  }

  function seatsFor(length, width) {
    const perSide = Math.floor(length / 60);
    const ends = width >= 90 ? 2 : 0;
    return perSide * 2 + ends;
  }

  function price(c) {
    const area = (c.laenge * c.breite) / 10000 + (c.auszug ? (50 * c.breite) / 10000 : 0);
    const total = PRICES.basis
      + area * PRICES.holzProM2[c.holz]
      + PRICES.gestell[c.gestell]
      + PRICES.oberflaeche[c.oberflaeche]
      + (c.auszug ? PRICES.auszug : 0);
    return [roundTo(total * 0.95, 50), roundTo(total * 1.08, 50)];
  }

  function weeks(c) {
    let w = 3;
    if (c.holz === "nuss") w += 1;           // Nuss trocknet länger nach
    if (c.auszug) w += 1;
    if (c.oberflaeche === "lack") w += 1;
    if (c.laenge > 240) w += 1;               // große Platten müssen verleimt werden
    return [w, w + 1];
  }

  function chair(x, y, rotate) {
    // Stuhl als Rechteck mit Lehne; rotate = Richtung der Lehne
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", `translate(${x} ${y}) rotate(${rotate})`);
    g.innerHTML = `<rect class="chair" x="${-CHAIR_W / 2}" y="${-CHAIR_D / 2}" width="${CHAIR_W}" height="${CHAIR_D}" rx="4"/>
                   <rect class="chair" x="${-CHAIR_W / 2}" y="${-CHAIR_D / 2 - 6}" width="${CHAIR_W}" height="6" rx="2"/>`;
    // Bei rotate=0 liegt die Lehne oben. Unten 180°, links -90°, rechts 90°.
    return g;
  }

  function draw(c) {
    const totalLen = c.laenge + (c.auszug ? 50 : 0);
    const w = c.laenge * SCALE;
    const h = c.breite * SCALE;
    const x0 = CX - (totalLen * SCALE) / 2;
    const y0 = CY - h / 2;

    top.setAttribute("x", x0);
    top.setAttribute("y", y0);
    top.setAttribute("width", w);
    top.setAttribute("height", h);

    if (c.auszug) {
      ext.setAttribute("x", x0 + w);
      ext.setAttribute("y", y0);
      ext.setAttribute("width", 50 * SCALE);
      ext.setAttribute("height", h);
    } else {
      ext.setAttribute("width", 0);
      ext.setAttribute("height", 0);
    }

    woodImg.setAttribute("href", `images/holz-${c.holz}.jpg`);

    chairs.replaceChildren();
    const perSide = Math.floor(c.laenge / 60);
    const spacing = w / perSide;
    for (let i = 0; i < perSide; i++) {
      const x = x0 + spacing * (i + 0.5);
      chairs.append(chair(x, y0 - GAP - CHAIR_D / 2, 0));        // oben, Lehne nach außen
      chairs.append(chair(x, y0 + h + GAP + CHAIR_D / 2, 180));  // unten
    }
    if (c.breite >= 90) {
      chairs.append(chair(x0 - GAP - CHAIR_D / 2, CY, -90));
      chairs.append(chair(x0 + w + (c.auszug ? 50 * SCALE : 0) + GAP + CHAIR_D / 2, CY, 90));
    }
  }

  function update() {
    const c = read();

    $('[data-out="laenge"]', form).textContent = `${c.laenge} cm`;
    $('[data-out="breite"]', form).textContent = `${c.breite} cm`;

    const [lo, hi] = price(c);
    $("[data-calc-price]", form).textContent = `${fmtEuro(lo)} – ${fmtNum(hi)}`;

    const [w1, w2] = weeks(c);
    $("[data-calc-meta]", form).textContent = `Lieferzeit ca. ${w1}–${w2} Wochen ab Auftrag`;

    const seats = seatsFor(c.laenge, c.breite);
    const seatsExt = seatsFor(c.laenge + 50, c.breite);
    $("[data-calc-seats]", form).textContent = c.auszug && seatsExt > seats
      ? `Platz für ${seats} Personen, ausgezogen für ${seatsExt}`
      : `Platz für ${seats} Personen`;

    draw(c);
  }

  form.addEventListener("input", update);
  form.addEventListener("submit", (e) => e.preventDefault());

  // "Diesen Tisch anfragen" füllt das Kontaktformular vor
  $("[data-calc-cta]", form).addEventListener("click", () => {
    const c = read();
    const text = `Esstisch aus ${LABELS.holz[c.holz]}, ${c.laenge} × ${c.breite} cm, ${LABELS.gestell[c.gestell]}, `
      + `${LABELS.oberflaeche[c.oberflaeche]}${c.auszug ? ", mit Auszug" : ""}.`;
    const msg = $("#nachricht");
    const topic = $("#thema");
    if (msg) msg.value = text;
    if (topic) topic.value = "Tisch / Möbelstück";
  });

  update();
}

/* ---------- 5. Kontaktformular ---------- */
function initContact() {
  const form = $("[data-contact]");
  if (!form) return;
  const success = $("[data-success]", form);

  const setError = (key, message, fields = []) => {
    const el = $(`[data-error-for="${key}"]`, form);
    if (el) el.textContent = message;
    fields.forEach((f) => {
      f.classList.toggle("is-invalid", Boolean(message));
      f.setAttribute("aria-invalid", message ? "true" : "false");
    });
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name;
    const tel = form.elements.tel;
    const email = form.elements.email;
    const msg = form.elements.nachricht;
    let firstInvalid = null;
    const fail = (el) => { if (!firstInvalid) firstInvalid = el; };

    if (name.value.trim().length < 2) { setError("name", "Bitte geben Sie Ihren Namen an.", [name]); fail(name); }
    else setError("name", "", [name]);

    const hasTel = tel.value.replace(/\D/g, "").length >= 6;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    if (!hasTel && !email.value.trim()) {
      setError("kontakt", "Wie erreichen wir Sie? Bitte Telefon oder E-Mail angeben.", [tel, email]); fail(tel);
    } else if (email.value.trim() && !emailOk) {
      setError("kontakt", "Die E-Mail-Adresse sieht nicht vollständig aus.", [email]); setError("", "", [tel]); fail(email);
    } else {
      setError("kontakt", "", [tel, email]);
    }

    if (msg.value.trim().length < 10) { setError("nachricht", "Ein, zwei Sätze zu Ihrem Vorhaben helfen uns.", [msg]); fail(msg); }
    else setError("nachricht", "", [msg]);

    if (firstInvalid) { firstInvalid.focus(); success.hidden = true; return; }

    success.textContent = `Danke, ${name.value.trim().split(" ")[0]}! Das ist eine Demo-Seite – Ihre Nachricht wurde deshalb nicht verschickt.`;
    success.hidden = false;
    form.reset();
  });
}

/* ---------- Start ---------- */
initNav();
initHours();
initFilter();
initCalc();
initContact();
