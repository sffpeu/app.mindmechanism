"""German journey note descriptions for the Grammar Transit Map.

Keys follow the same ``POS|DEP|STATIONS`` pattern as descriptions.py.
German-specific stations (S10 = Das Kreuzungsfeld, S11 = Bahnhof Trennung)
are included. S3 becomes Das Tor and carries case annotation.
"""

from __future__ import annotations

_NOTES_DE: dict[str, str] = {
    # Determiners (Artikel) — S3 = Das Tor, case-annotated
    "DET|det|S3":  "Bestimmter Artikel. Signalisiert ein spezifisches Nomen — mit Kasus-Markierung.",
    "DET|det|*":   "Artikel. Leitet den Verkehr auf einen bestimmten Nominalbahnsteig.",
    # Nouns — subject at Foundation (S4)
    "NOUN|sb|S4":         "Gemeines Nomen, Subjekt. Das tragende Element des Satzes.",
    "NOUN|sb|S4,S9":      "Subjektnomen mit Adjektivbegleitung — Farbe vor Ankunft.",
    "NOUN|oa|S3":         "Akkusativobjekt. Das Verb übergibt hier seine Fracht.",
    "NOUN|oa|S3,S9":      "Akkusativobjekt mit adjektivischer Begleitung.",
    "NOUN|da|S3":         "Dativobjekt. Die Handlung kommt beim Empfänger an.",
    "NOUN|pg|S3":         "Genitivattribut — reitet auf dem Nomen vor ihm.",
    "NOUN|mo|S6":         "Temporales oder adverbielles Nomen — Die Uhr hält den Rhythmus.",
    "NOUN|app|S3":        "Apposition — zweites Namensschild auf demselben Bestand.",
    "NOUN|*|S3":          "Nomen durch Das Tor geleitet (Nicht-Subjekt-Rolle).",
    "NOUN|*|S4":          "Nomen als Subjekt im Fundament verankert.",
    "NOUN|*|S4,S9":       "Subjektnomen mit Adjektivmodifikator an der Farbstation.",
    "NOUN|*|S3,S9":       "Nicht-Subjekt-Nomen mit Adjektiv an der Farbstation.",
    "NOUN|*|S10":         "Nomen am Kreuzungsfeld — Kasus wird hier dekliniert.",
    "NOUN|*|*":           "Nominalelement auf der Karte.",
    # Proper nouns (Eigennamen)
    "PROPN|sb|S4":        "Eigenname, Subjekt — ein benanntes Wesen im Fundament.",
    "PROPN|oa|S3":        "Eigenname als Akkusativobjekt — benanntes Ziel auf der N-Linie.",
    "PROPN|*|S3":         "Eigenname durch Das Tor.",
    "PROPN|*|S4":         "Eigenname als Subjekt im Fundament.",
    "PROPN|*|*":          "Eigenname auf der Karte.",
    # Verbs
    "VERB|ROOT|S1":       "Hauptfinites Verb — Der Maschinenraum setzt Fahrplan und Kraft.",
    "VERB|ROOT|S1,S5":    "Hauptverb mit Adverb-Unterstützung — Detailmaschine gibt Tempo.",
    "VERB|ROOT|S1,S7":    "Nicht-finites Hauptverb — Die Weiche leitet Infinitiv/Partizip.",
    "VERB|ROOT|S1,S11":   "Trennbares Verb — Präfix abgestellt am Bahnhof Trennung.",
    "VERB|ROOT|S1,S5,S7": "Nicht-finites Verb mit Adverb — Maschine, Weiche und Detail im Einsatz.",
    "VERB|oc|S1":         "Satzkomplement-Verb — verschachtelte Klausel-Lokomotive.",
    "VERB|mo|S1":         "Adverbiale Klausel-Verb — Nebenfahrplan.",
    "VERB|rc|S1":         "Relativsatz-Verb — Nebenstrecke für das Bezugswort.",
    "VERB|cj|S1":         "Koordiniertes Verb — parallele Kraft vom selben Subjekt.",
    "VERB|*|S1":          "Verb im Maschinenraum — trägt Tempus und Ereigniskern.",
    "VERB|*|S1,S5":       "Verb mit Adverbkindern — Weise über die Detailmaschine.",
    "VERB|*|S1,S7":       "Verb mit Inf./Part.-Form — auch an der Weiche markiert.",
    "VERB|*|S1,S11":      "Trennbares Verb — Präfix parkt am Bahnhof Trennung.",
    "VERB|*|*":           "Verb — Ereigniskern der Klausel.",
    # Auxiliaries / modals
    "AUX|aux|S2":         "Hilfsverb — Tempus- oder Aspektpartner an der Autoritätsknotenpunkt.",
    "AUX|auxpass|S2":     "Passivhilfsverb — baut Passivkonstruktion am Knotenpunkt.",
    "AUX|ROOT|S2":        "Kopula oder Hilfsverb als Wurzel — Knotenpunkt hält das Finite.",
    "AUX|*|S2":           "Hilfsverb oder Modal — Finitude und Modus am Knotenpunkt.",
    "AUX|*|*":            "Hilfselement formt den Verbalkomplex.",
    # Adjectives
    "ADJ|amod|S9":        "Attributives Adjektiv — bemalt das Nomen vor der Ankunft.",
    "ADJ|amod|S8L":       "Komparativisches Adjektiv — Umweg über Die Waage.",
    "ADJ|amod|S8R":       "Superlativisches Adjektiv — klettert zum Gipfel.",
    "ADJ|*|S9":           "Einfaches Adjektiv — Farbe und Qualität an der Farbstation.",
    "ADJ|*|S8L":          "Komparativ-Form — zur Waage geleitet.",
    "ADJ|*|S8R":          "Superlativ-Form — zum Gipfel geleitet.",
    "ADJ|*|*":            "Adjektiv — Qualität und Einschränkung.",
    # Adverbs
    "ADV|mo|S5":          "Modaladverb — moduliert das Verb an der Detailmaschine.",
    "ADV|mo|S6":          "Adverb mit weiterem Skopus — temporal oder satzwertig an der Uhr.",
    "ADV|*|S5":           "Adverb, verbal gebunden.",
    "ADV|*|S6":           "Adverb — temporal oder satzebene an der Uhr.",
    "ADV|*|*":            "Adverb — Skopus vom Kopf abhängig.",
    # Prepositions — German governs specific cases
    "ADP|mo|S6":          "Präposition — baut die PP-Schale an der Uhr (T×P×Kasus).",
    "ADP|ag|S6":          "Agentive von-Phrase — Passiv-Gegenstück an der Uhr.",
    "ADP|*|S6":           "Präposition — Kasus und Pfad an der Uhr.",
    "ADP|*|*":            "Präposition auf der Karte.",
    # Case Crossing (new German station)
    "*|*|S10":            "Kreuzungsfeld — Kasusmarkierung wird hier zugewiesen (Nom/Gen/Dat/Akk).",
    # Separation Depot (new German station — separable verb prefix)
    "*|svp|S11":          "Bahnhof Trennung — abgetrenntes Verbpräfix parkt hier.",
    "*|*|S11":            "Bahnhof Trennung — trennbares Element im Nebenzug.",
    # Numerals
    "NUM|nk|S3":          "Zahlenwort — D-Abzweig-Verkehr durch Das Tor.",
    "NUM|*|S3":           "Zahl als Determinativ — Das Tor leitet sie.",
    "NUM|*|S8L":          "Eigenständige Zahl — Die Waage. Grad oder Vergleichsreferenz.",
    "NUM|*|*":            "Zahlenwort — Menge oder Maß auf der Karte.",
    # Fallback
    "*|*|*":              "Token auf der Grammatikkarte — Rolle aus POS und Abhängigkeit.",
}


def get_note_de(pos: str, dep: str, stations: tuple[str, ...]) -> str:
    joined = ",".join(stations) if stations else "*"
    candidates = [
        f"{pos}|{dep}|{joined}",
        f"{pos}|{dep}|*",
        f"{pos}|*|*",
        f"*|*|{joined}",
        "*|*|*",
    ]
    for key in candidates:
        if key in _NOTES_DE:
            return _NOTES_DE[key]
    return _NOTES_DE["*|*|*"]
