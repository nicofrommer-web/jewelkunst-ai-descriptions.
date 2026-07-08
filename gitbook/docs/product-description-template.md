---
description: "Struktur und Regeln für AI-generierte Jewelkunst-Produkttexte"
icon: pen-nib
---

# Produktbeschreibung-Vorlage

Diese Vorlage spiegelt exakt die Regeln aus `prompts/system.txt` wider, dem Systemprompt, der für die AI-generierten Produktbeschreibungen verwendet wird.

## Format-Regeln

| Regel | Vorgabe |
|---|---|
| Sprache | Deutsch |
| Länge | 80–150 Wörter |
| Ausgabeformat | reines HTML, gesamter Text in `<p>`-Tags, `<strong>` nur für Materialnamen |
| Wiederholung | Produkttitel nicht wörtlich im Text wiederholen |

## Struktur

{% stepper %}
{% step %}
### Eröffnungssatz
Ein einzelner, ausdrucksstarker Satz, der das Wesen des Stücks einfängt – kein Klischee, keine Floskel.
{% endstep %}
{% step %}
### Material & Handwerk
1–2 Sätze zu Material (insbesondere Edelsteinen), handwerklichem Können und dem besonderen Detail, das das Stück einzigartig macht.
{% endstep %}
{% step %}
### Abschluss
Eine natürliche, unaufdringliche Einladung, das Stück zu tragen oder zu verschenken – kein harter Verkaufsschluss.
{% endstep %}
{% endstepper %}

## Vorlage (Platzhalter-Version)

```html
<p><strong>[Ausdrucksstarker Eröffnungssatz zum Stück]</strong>. [Satz zu Material/Edelstein und Handwerk, z. B. handgefertigt aus <strong>[Material]</strong> mit <strong>[Edelstein]</strong>]. [Unaufdringlicher Abschlusssatz mit Einladung, das Stück zu tragen oder zu verschenken].</p>
```

{% hint style="danger" %}
Zu vermeiden: „zeitlos elegant", „perfekt für jeden Anlass", „ein Must-have", sowie jede Form von künstlicher Dringlichkeit oder unbelegten Superlativen ("meistverkauft", "einzigartig auf der Welt") ohne Beleg.
{% endhint %}

## Modellwahl

Gemäß Projektkonvention (`CLAUDE.md`):

* `claude-haiku-4-5-20251001` – für Bulk-Generierung (kosteneffizient)
* `claude-sonnet-4-6` – für Hero-Produkte / besonders hochwertige Einzelstücke

## Qualitätskontrolle

* [ ] Wortanzahl im Bereich 80–150
* [ ] Kein wörtliches Wiederholen des Produkttitels
* [ ] Materialangaben korrekt und nicht erfunden
* [ ] Keine verbotenen Floskeln (siehe oben)
* [ ] HTML valide und nur `<p>`/`<strong>`
