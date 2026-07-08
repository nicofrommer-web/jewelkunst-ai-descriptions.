---
description: "Google-Sheets-Struktur, Pipeline-Stages, täglicher Workflow"
icon: table
---

# CRM

## CRM System (Google Sheets)

**Tab 1 — Lead-Datenbank**

| Spalte | Beispiel |
|---|---|
| Firma | Solartech Karlsruhe GmbH |
| Branche | Photovoltaik |
| Stadt | Karlsruhe |
| Ansprechpartner | Max Mustermann |
| Telefon | 0721-xxxxxxx |
| E-Mail | info@solartech-ka.de |
| Instagram/LinkedIn | @solartech_ka |
| Google Bewertung | 4.5 (32 Reviews) |
| Quelle | Google Maps |
| Datum erfasst | 03.07.2026 |
| Pipeline Stage | (siehe unten) |
| Letzter Kontakt | Datum |
| Nächster Follow-up | Datum |
| Notizen | z. B. "hat schon Agentur, in 3 Mon. nachfassen" |

Importierbare Vorlage: [`crm-lead-datenbank-vorlage.csv`](../../docs/crm-lead-datenbank-vorlage.csv)

**Pipeline Stages (Dropdown-Spalte)**
1. **Neu erfasst** — Lead recherchiert, noch nicht kontaktiert
2. **Kontaktiert** — Erstnachricht raus
3. **Follow-up läuft** — In der 5-Schritte-Sequenz
4. **Geantwortet / interessiert** — Reply erhalten, Termin wird vereinbart
5. **Call gebucht** — Termin steht
6. **Angebot gemacht** — Preis genannt, Entscheidung ausstehend
7. **Gewonnen** — Kunde
8. **Verloren/Kalt** — Kein Interesse, mit Grund + Re-Contact-Datum

**Tab 2 — Tages-Tracker** (Zeilen = Tage, Spalten = Anzahl neue Leads / DMs gesendet / E-Mails gesendet / Follow-ups / Calls gebucht / Calls geführt / Deals gewonnen)

Importierbare Vorlage: [`crm-tages-tracker-vorlage.csv`](../../docs/crm-tages-tracker-vorlage.csv)

**Täglicher Workflow (fix, jeden Tag gleiche Reihenfolge):**
1. Morgens (15 Min): Alle fälligen Follow-ups aus Tab 1 abarbeiten (Filter: "Nächster Follow-up" = heute)
2. Neue Leads recherchieren + eintragen (Zielzahl siehe [7-Tage Execution Plan](execution-plan.md))
3. Erstkontakt-Nachrichten an neue Leads senden
4. Nachmittags: Gebuchte Calls führen
5. Abends (5 Min): Tages-Tracker aktualisieren, Pipeline Stages updaten
