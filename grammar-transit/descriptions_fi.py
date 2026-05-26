"""Finnish journey note descriptions for the Grammar Transit Map.

Finnish-specific architecture:
  - No articles (D spur eliminated; replaced by PX Possession spur)
  - S3 (Gateway) replaced by S10 (Sijapäätteiden Solmukohta — 15-case terminal)
  - S11 = Harmoniaportaali (vowel harmony gate)
  - S12 = Liitesilo (morpheme stack — agglutinative suffix chains)
  - S6 becomes Kello and handles temporal/locative case-marked nouns
"""

from __future__ import annotations

_NOTES_FI: dict[str, str] = {
    # Nouns — subject at Foundation (S4)
    "NOUN|nsubj|S4":        "Nominatiivi-subjekti. Lauseen kantava palkki.",
    "NOUN|nsubj|S4,S9":     "Subjektinomini adjektiiviseuralaisen kanssa ennen saapumista.",
    "NOUN|obj|S10":         "Akkusatiivi- tai partitiiviolbjekti — sijamuoto osoittaa täydellisyyden.",
    "NOUN|obj|S10,S9":      "Objektinomini adjektiivin kanssa, sijamuoto määräytyy.",
    "NOUN|obl|S10":         "Oblique-nomini — sijamuoto ilmaisee ajan, paikan tai tavan.",
    "NOUN|obl|S6":          "Temporaalinen nomini sijapäätteellä — Kello pitää rytmiä.",
    "NOUN|nmod|S10":        "Genetiivimäärite — liittyy toiseen nominiin sijapäätteellä.",
    "NOUN|*|S10":           "Nomini sijapäätesolmukohdassa — sijamuoto määräytyy tässä.",
    "NOUN|*|S4":            "Nomini ankkuroituna subjektina Perustuksessa.",
    "NOUN|*|S4,S9":         "Subjektinomini adjektiivimuokkaimen kanssa Väriastemalla.",
    "NOUN|*|S10,S9":        "Ei-subjekti-nomini adjektiivilla Väriastemalla.",
    "NOUN|*|*":             "Nominaalielementti kartalla.",
    # Proper nouns
    "PROPN|nsubj|S4":       "Erisnimi, subjekti — nimetty olento Perustuksessa.",
    "PROPN|obj|S10":        "Erisnimi objektina — nimetty kohde sijapäätteen kanssa.",
    "PROPN|*|S4":           "Erisnimi subjektina Perustuksessa.",
    "PROPN|*|S10":          "Erisnimi sijapäätesolmukohdassa.",
    "PROPN|*|*":            "Erisnimi kartalla.",
    # Verbs — Finnish has multiple infinitive forms
    "VERB|ROOT|S1":         "Päätempusverbi — Konehalli asettaa aikataulun ja voiman.",
    "VERB|ROOT|S1,S5":      "Päätempusverbi adverbituella — Yksityiskoneisto lisää tapaa.",
    "VERB|ROOT|S1,S7":      "Infinitiivi — Haarautumisasema ohjaa infinitiivi-/partisiippiliikennettä.",
    "VERB|ROOT|S1,S5,S7":   "Infinitiivi adverbien kanssa — Koneisto, Haarautuminen ja Yksityiskohta kaikki käytössä.",
    "VERB|ccomp|S1":        "Lausetäydennysverbi — sisäkkäinen lauselokomotivi.",
    "VERB|xcomp|S1":        "Avoin lausetäydennys — vetää paljasinfinitiivin.",
    "VERB|advcl|S1":        "Adverbiaalilause — sivuaikataulu.",
    "VERB|relcl|S1":        "Relatiivilause — sivulinja edeltäjälle.",
    "VERB|conj|S1":         "Koordinoitu verbi — rinnakkainen voima samasta subjektista.",
    "VERB|*|S1":            "Verbi Konehallin — kantaa tempuksen ja tapahtumaydinosa.",
    "VERB|*|S1,S5":         "Verbi adverbilapsien kanssa — tapa Yksityiskoneiston kautta.",
    "VERB|*|S1,S7":         "Verbi infinitiivi/partisiippi-muodossa — myös merkitty Haarautumisasemalla.",
    "VERB|*|*":             "Verbi — lauseen tapahtumaydin.",
    # Auxiliaries / modals — Finnish has fewer auxiliaries
    "AUX|aux|S2":           "Apuverbi — tempus- tai aspektikumppani Auktoriteettisolmukohdassa.",
    "AUX|aux:pass|S2":      "Passiivin apuverbi — rakentaa passiivin solmukohdassa.",
    "AUX|ROOT|S2":          "Kopula tai apuverbi juurena — Solmukohta pitää finiittisyyden.",
    "AUX|*|S2":             "Apuverbi tai modaali — finiittisyys ja tapa solmukohdassa.",
    "AUX|*|*":              "Apuelementti muotoilee verbikompleksia.",
    # Adjectives — Finnish adjectives decline with the noun (case agreement)
    "ADJ|amod|S9":          "Attribuuttiadjektiivi — maalaa nominin ennen saapumista; declension sopii sijaan.",
    "ADJ|amod|S8L":         "Komparatiiviadjektiivi — kiertotie Vaa'an kautta.",
    "ADJ|amod|S8R":         "Superlatiiviadjektiivi — kiipeää Huipulle.",
    "ADJ|*|S9":             "Yksinkertainen adjektiivi — väri ja laatu Väriastemalla.",
    "ADJ|*|S8L":            "Komparatiivimuoto — ohjattu Vaa'alle.",
    "ADJ|*|S8R":            "Superlatiivimuoto — ohjattu Huipulle.",
    "ADJ|*|*":              "Adjektiivi — laatu ja rajoitus.",
    # Adverbs
    "ADV|advmod|S5":        "Tapa-adverbi — moduloi verbiä Yksityiskoneistolla.",
    "ADV|advmod|S6":        "Adverbi laajemmalla alueella — ajallinen tai lausetason Kellossa.",
    "ADV|*|S5":             "Adverbi verbiin sidottuna.",
    "ADV|*|S6":             "Adverbi — ajallinen tai lausetason Kellossa.",
    "ADV|*|*":              "Adverbi — alue riippuu pääsanasta.",
    # Adpositions — Finnish uses mostly postpositions + case endings
    "ADP|case|S6":          "Adpositio — rakentaa PP-kuoren Kelloon sijapäätteen kanssa.",
    "ADP|*|S6":             "Adpositio — sijaan ja polkuun Kellossa.",
    "ADP|*|*":              "Adpositio kartalla.",
    # Case Terminal (S10 — Finnish-specific, replaces S3)
    "*|*|S10":              "Sijapäätesolmukohta — sijamuoto määräytyy tässä (15 sijaa).",
    # Harmony Gate (S11 — vowel harmony)
    "*|*|S11":              "Harmoniaportaali — etuvokaali/takavokaali-harmonia ohjaa liitteiden valintaa.",
    # Morpheme Stack (S12 — agglutinative chains)
    "*|*|S12":              "Liitesilo — suffiksiketju pinoutuu tässä; jokainen kerros lisää merkitystä.",
    # Possessive suffixes (PX line — replaces D spur for Finnish)
    "*|poss|*":             "Omistusliite — suomen omistusrakenne suffiksilla eikä artikkelilla.",
    # Numerals
    "NUM|nummod|S10":       "Lukusana — sijamuodon kanssa sijapäätesolmukohdassa.",
    "NUM|*|S10":            "Luku determinatiivin funktiossa — Solmukohta ohjaa.",
    "NUM|*|S8L":            "Itsenäinen lukusana — Vaaka. Aste tai vertailuviite.",
    "NUM|*|*":              "Lukusana — määrä tai mitta kartalla.",
    # Fallback
    "*|*|*":                "Token kielioppikartalla — rooli POS:sta ja riippuvuudesta.",
}


def get_note_fi(pos: str, dep: str, stations: tuple[str, ...]) -> str:
    joined = ",".join(stations) if stations else "*"
    candidates = [
        f"{pos}|{dep}|{joined}",
        f"{pos}|{dep}|*",
        f"{pos}|*|*",
        f"*|*|{joined}",
        "*|*|*",
    ]
    for key in candidates:
        if key in _NOTES_FI:
            return _NOTES_FI[key]
    return _NOTES_FI["*|*|*"]
