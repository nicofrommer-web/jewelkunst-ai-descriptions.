---
description: "Vollständige Produktseiten-Vorlage für Jewelkunst — alle Bausteine einer conversionstarken, seriösen Produktseite"
icon: gem
---

# Produktseiten-Vorlage

Diese Seite ergänzt die [Produktbeschreibung-Vorlage](product-description-template.md) (die sich nur auf den eigentlichen Beschreibungstext bezieht) um alle weiteren Bausteine einer vollständigen Produktseite.

{% hint style="warning" %}
Alle Beispiele unten nutzen echte Katalogdaten (Produkt „Damen Halskette Delicate Silber", 29,90 €, Vendor „Jewelkunst") zur Veranschaulichung. Materialangaben, Pflegehinweise, Versand- und Rückgabetexte sind trotzdem als Platzhalter markiert, wo sie nicht bereits im Produktdatensatz verifiziert vorliegen.
{% endhint %}

## Bausteine einer Produktseite

{% stepper %}
{% step %}
### Produkttitel
Klar, faktisch, ohne Superlative. Beispiel: „Damen Halskette Delicate Silber" statt „Die schönste Halskette der Welt".
{% endstep %}
{% step %}
### Kurze emotionale Beschreibung (Unterzeile, 1 Satz)
Direkt unter dem Titel, vor der langen Beschreibung. Beispiel: „Schlicht. Klar. Für immer."
{% endstep %}
{% step %}
### Lange Produktbeschreibung
Folgt exakt der [Produktbeschreibung-Vorlage](product-description-template.md) — 80–150 Wörter, HTML, Eröffnungssatz → Material & Handwerk → unaufdringlicher Abschluss.
{% endstep %}
{% step %}
### Materialhinweise
Eigener, klar abgegrenzter Abschnitt (kein Teil der Fließtext-Beschreibung). Beispiel-Format:

```
Material: [z. B. 925er Sterling Silber]
Verarbeitung: [z. B. rhodiniert / diamantiert]
Maße: [Platzhalter, sofern verfügbar]
```

Nur Angaben verwenden, die im Produktdatensatz tatsächlich hinterlegt sind — sonst Platzhalter setzen, nicht schätzen.
{% endstep %}
{% step %}
### Pflegehinweise
Kurzer, material-abhängiger Absatz. Beispiel-Baustein (bei Sterling Silber):

> Vor Kontakt mit Wasser, Parfum und Kosmetik schützen. Trocken und lichtgeschützt aufbewahren, am besten im mitgelieferten Beutel. [Platzhalter: produktspezifische Ergänzung, falls vorhanden]
{% endstep %}
{% step %}
### Geschenkhinweis
Kurzer, unaufdringlicher Baustein, kein Verkaufsdruck:

> Ein Stück, das sich auch wunderbar verschenken lässt. [Platzhalter: Hinweis auf Geschenkverpackung/-karte, falls angeboten]
{% endstep %}
{% step %}
### Versandhinweis
Kurzform mit Link zur vollständigen Seite:

> [Platzhalter: Versandzeit, z. B. „Versand innerhalb von X Werktagen"] · Details siehe [Versand & Zahlung](legal-placeholders.md)
{% endstep %}
{% step %}
### Rückgabehinweis
> [Platzhalter: Rückgabefrist gemäß gesetzlichem Widerrufsrecht] · Details siehe [Rechtliche Platzhalter](legal-placeholders.md)
{% endstep %}
{% step %}
### FAQ (produktspezifisch, 2–3 Fragen)
Kurzform der allgemeinen [FAQ](faq.md), nur die für dieses Produkt relevantesten Fragen (z. B. Größentabelle bei Ringen, Kettenlänge bei Halsketten).
{% endstep %}
{% step %}
### Trust-Badges
Kleine Icon-Zeile unterhalb des Preises/Warenkorb-Buttons, z. B.:

`Sicherer Checkout` · `[Platzhalter: Rückgabefrist] Rückgaberecht` · `Persönlicher Kontakt bei Fragen`

Keine erfundenen Badges ("Nr. 1 Bestseller", "Als gesehen in ...") ohne Beleg.
{% endstep %}
{% step %}
### Warenkorb-Button
Klarer, ruhiger Call-to-Action-Text: „In den Warenkorb". Kein „Jetzt zuschlagen" oder künstliche Verknappung, außer sie ist faktisch korrekt (z. B. echter Lagerbestand bei Sonderauflagen).
{% endstep %}
{% step %}
### Mobile Sticky Add-to-Cart
Empfehlung: Auf mobilen Geräten einen fixierten Bereich am unteren Bildschirmrand mit Produktbild (klein), Preis und „In den Warenkorb"-Button einblenden, sobald der Nutzer über den ursprünglichen Button hinausscrollt. Reduziert Abbrüche auf langen Produktseiten, ohne aufdringlich zu wirken (kein Blinken/Pulsieren).
{% endstep %}
{% endstepper %}

## SEO-Bausteine je Produkt

* **SEO Title:** Formel `{Produkttitel} – {Material} | Jewelkunst`, max. 60 Zeichen. Beispiel: „Delicate Halskette Silber – 925er Sterling Silber | Jewelkunst"
* **Meta Description:** 150–160 Zeichen, im Markenton, ohne erfundene Verkaufsversprechen. Beispiel: „Zarte Delicate-Halskette aus 925er Sterling Silber. Zeitloses Design für den Alltag — bei Jewelkunst entdecken."

Weitere Details siehe [SEO-Plan](seo-plan.md).

## Reihenfolge auf der Seite (Vorschlag)

1. Produktbilder
2. Titel + kurze emotionale Beschreibung
3. Preis + Warenkorb-Button + Trust-Badges
4. Lange Produktbeschreibung
5. Materialhinweise
6. Pflege-, Geschenk-, Versand-, Rückgabehinweis (kompakt, z. B. als Akkordeon)
7. Produktspezifische FAQ
8. Ergänzende/verwandte Produkte

## Qualitätskontrolle je Produktseite

* [ ] Alle Materialangaben verifiziert, keine erfundenen Details
* [ ] Pflege-/Versand-/Rückgabehinweise verlinken auf die finalen, geprüften Seiten
* [ ] Keine unbelegten Superlative oder Bestseller-Label ohne Datenbasis
* [ ] Mobile Sticky Add-to-Cart getestet
* [ ] SEO Title und Meta Description innerhalb der Zeichenlimits
