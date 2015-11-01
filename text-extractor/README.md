Text-Extraktion
===============

## Einheitliche Eigenschaften

* Rechter Flattersatz
* 4 Einrückungsstufen (von links nach rechts)
    1. (Manchmal) Spalte mit Nummern (vtlm. Einstellungen)
    2. Regieanweisungen und Ortsbeschreibungen
    3. Dialog
    4. Anmerkungen zum Dialog (Angesprochener, Tonfall)
    5. Sprecher
* Ortsangaben in Versalien (selten mit Nummer):
  EXT(.) -> Außenszene,
  INT(.) -> Innenszene,
  INT./EXT.

## Uneinheitliche Eigenschaften

* Einige Skripte erlauben die Benutzung zu "Ausbildungszwecken"
* Beginn des Skriptes: Seite 1,2,3...
* Manchmal Titelzeile auf jeder Seite
* Spezielle Skripte (zB The World's End interaktives Fanskript)
* Text:
    1. digital erstellt, Text kopierbar
    2. digital erstellt, Text nicht kopierbar (Bilder oder verschlüsselt)
    2. gescannt mit ORC
    3. gescannt ohne ORC (oft schief)
* Einrückung von Beschriftungen wie Schildern, Formeln, etc.
* Voice-over: (V.O), (VO), (V.O.)
* Szenenwechsel
    1. Rechtsbündiges CUT TO:
    2. Nur neue Ortsangabe
* Dialog beim Seitenwechsel (Einrückung uneinheitlich)
    1. Mit (MORE) und (CONT'D)
    2. Mit (CONTINUED) und CONTINUED:
    2. Nur mit (CONT'D)
    3. Ohne Hinweise

## Strategie

1. Filter aller Skripte mit pdftotext
2. Extraktion des Textes mit pdftohtml -i -xml
3. *text-extractor*
    1. Kombination der Absätze
    2. Finden der Einrückungsstufen
    3. Extraktion der Szenen

## Dateiformat

Quelle: https://durian.blender.org/wp-content/uploads/2009/11/1stminute_script_11-61.pdf

```xml
<?xml version="1.0" encoding="UTF-8"?>

<script name="Sintel">
    <author>Esther Wouda</author>
    <cast>
        <character id="1">Sintel</character>
        <character id="2">Shaman</character>
    </cast>
    <scene type="external" location="Snowy Landscape">
        <direction>Swirls of snow obscure the rocky formations of a mountain ridge. (...)</direction>
        <direction>Five ragged men attack a young girl, <character id="1">SINTEL</character>, who brandishes a spiked spear.</direction>
        <!-- (...) -->
        <dialog character="2">You’re lucky to be alive. (...)</dialog>
        <direction>Finally she collapses into the snow, her eyes shut tight.</direction>
        </direction>BLACK</direction>
        <dialog character="2">Here, take a sip.</dialog>
    </scene>
    <scene type="internal" location="Dark Shaman's Hut">
        <!-- (...) -->
    </scene>
    <!-- (...) -->
</script>
```
