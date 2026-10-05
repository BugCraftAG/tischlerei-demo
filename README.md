# Tischlerei Kogler – Demo-Website

Website für eine **fiktive** Tischlerei in Bad Radkersburg. Mein zweites Portfolio-Projekt nach dem [Wirtshaus Rebenhof](https://bugcraftag.github.io/REST-DEMO-WEB/).

**Live ansehen:** https://bugcraftag.github.io/tischlerei-demo/

## Was die Seite kann

- **Tischrechner:** Holzart, Maße, Gestell und Oberfläche wählen – Preis-Richtwert, Lieferzeit und eine Draufsicht mit Stühlen ändern sich sofort
- **Arbeiten mit Filter:** Projekte nach Küche, Einbaumöbel, Möbel und Treppen filtern
- **Live-Status der Werkstatt** nach österreichischer Zeit, heutiger Tag in den Öffnungszeiten hervorgehoben
- **Kontaktformular mit Prüfung** im Browser; der Rechner kann es mit dem gewählten Tisch vorausfüllen
- Funktioniert auf Handy, Tablet und Desktop, mit Tastatur bedienbar

## Was ich gegenüber dem ersten Projekt anders gemacht habe

- **Keine fremden Server:** Schriften vom System, keine Google Fonts, keine eingebettete Karte, keine Stockfotos von Unsplash. Damit setzt die Seite keine Cookies und überträgt keine IP-Adressen an Dritte (DSGVO).
- **Eigene Grafiken:** Die Werkzeichnungen sind SVG, die Holzmuster habe ich mit einem Python-Skript erzeugt.
- **Design mit Idee:** Die Seite sieht aus wie ein Zeichenblatt – mit Raster, Bemaßung in Rot und einem Schriftfeld wie auf einer technischen Zeichnung.
- **Barrierefreiheit:** echte Formular-Labels, `aria-pressed` bei den Filtern, `prefers-reduced-motion` für die Animation.
- Impressum- und Datenschutz-Seite (mit Platzhaltern).

## Aufbau

```
tischlerei-demo/
├── index.html        Startseite
├── impressum.html    Impressum & Datenschutz
├── css/style.css     Design (Farben und Schriften oben in :root)
├── js/main.js        Öffnungszeiten, Filter, Tischrechner, Formular
└── images/           Werkzeichnungen (SVG) und Holzmuster (JPG)
```

Öffnungszeiten und Preise stehen ganz oben in `js/main.js` und lassen sich dort ändern.
