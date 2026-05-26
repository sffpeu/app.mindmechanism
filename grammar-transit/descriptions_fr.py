"""French journey note descriptions for the Grammar Transit Map.

French uses standard Universal Dependencies from fr_core_news_lg.
Enhanced UD subtypes (nsubj:pass, expl:subj) are normalised in mapper.py
before reaching this function.
"""

from __future__ import annotations

_NOTES_FR: dict[str, str] = {
    # Déterminants (S3 = La Porte)
    "DET|det|S3":       "Article défini ou indéfini. Ancre le nom dans le genre et le nombre.",
    "DET|det|*":        "Déterminant. Dirige le trafic vers la plateforme nominale précise.",
    # Noms — sujet à la Fondation (S4)
    "NOUN|nsubj|S4":        "Nom commun, sujet. Pilier porteur de la proposition.",
    "NOUN|nsubj|S4,S9":     "Nom-sujet accompagné d'un adjectif — couleur avant l'arrivée.",
    "NOUN|nsubjpass|S4":    "Sujet d'une construction passive — il reçoit l'action.",
    "NOUN|nsubjpass|S4,S9": "Sujet passif avec attribut adjectival.",
    "NOUN|obj|S3":          "Objet direct. Le verbe dépose sa charge ici.",
    "NOUN|obj|S3,S9":       "Objet direct accompagné d'un adjectif.",
    "NOUN|iobj|S3":         "Objet indirect. L'action parvient au destinataire.",
    "NOUN|obl|S3":          "Complément oblique — rôle syntaxique précisé par la préposition.",
    "NOUN|nmod|S3":         "Modificateur nominal — précise ou restreint le nom voisin.",
    "NOUN|appos|S3":        "Apposition — une deuxième étiquette sur le même référent.",
    "NOUN|conj|S3":         "Nom coordonné — partage une branche avec un GN parallèle.",
    "NOUN|*|S3":            "Nom guidé par La Porte (rôle non-sujet).",
    "NOUN|*|S4":            "Nom ancré comme sujet à la Fondation.",
    "NOUN|*|S4,S9":         "Nom-sujet avec modificateur adjectival à la Station Couleur.",
    "NOUN|*|S3,S9":         "Nom non-sujet teinté par un adjectif à la Station Couleur.",
    "NOUN|*|*":             "Élément nominal sur la carte.",
    # Noms propres
    "PROPN|nsubj|S4":       "Nom propre, sujet — entité nommée à la Fondation.",
    "PROPN|nsubj|S4,S9":    "Nom propre-sujet avec adjectif d'accompagnement.",
    "PROPN|obj|S3":         "Nom propre objet — destination nommée sur la Ligne N.",
    "PROPN|*|S3":           "Nom propre passant par La Porte.",
    "PROPN|*|S4":           "Nom propre comme sujet à la Fondation.",
    "PROPN|*|*":            "Nom propre sur la carte.",
    # Verbes
    "VERB|ROOT|S1":         "Verbe fini principal — la Salle des Machines fixe l'horaire et la puissance.",
    "VERB|ROOT|S1,S5":      "Verbe principal avec adverbe — le Moteur Détail ajoute la manière.",
    "VERB|ROOT|S1,S7":      "Forme non-finie principale — L'Aiguillage gère l'infinitif et le gérondif.",
    "VERB|ROOT|S1,S5,S7":   "Verbe non-fini avec adverbes — Moteur, Aiguillage et Détail en service.",
    "VERB|ccomp|S1":        "Verbe complétive — locomotive de la proposition enchâssée.",
    "VERB|xcomp|S1":        "Complément de verbe ouvert — tire une proposition à l'infinitif.",
    "VERB|advcl|S1":        "Verbe de proposition circonstancielle — horaire secondaire.",
    "VERB|relcl|S1":        "Verbe de relative — voie de service pour l'antécédent.",
    "VERB|conj|S1":         "Verbe coordonné — puissance parallèle depuis le même sujet.",
    "VERB|*|S1":            "Verbe à la Salle des Machines — porte le temps et le noyau événementiel.",
    "VERB|*|S1,S5":         "Verbe avec enfants adverbiaux — manière via le Moteur Détail.",
    "VERB|*|S1,S7":         "Verbe avec forme inf./gér. — aussi marqué à L'Aiguillage.",
    "VERB|*|*":             "Verbe — noyau événementiel de la proposition.",
    # Auxiliaires
    "AUX|aux|S2":           "Auxiliaire — partenaire de temps ou d'aspect au Carrefour d'Autorité.",
    "AUX|auxpass|S2":       "Auxiliaire passif — construit la voix passive au Carrefour.",
    "AUX|cop|S2":           "Copule — lie sujet et attribut au Carrefour d'Autorité.",
    "AUX|ROOT|S2":          "Auxiliaire ou copule à la racine — le Carrefour tient le fini.",
    "AUX|*|S2":             "Auxiliaire ou modal — finitude et mode au Carrefour d'Autorité.",
    "AUX|*|*":              "Élément auxiliaire structurant le complexe verbal.",
    # Adjectifs
    "ADJ|amod|S9":          "Adjectif épithète — colore le nom avant l'arrivée.",
    "ADJ|amod|S8L":         "Adjectif comparatif — détour par La Balance.",
    "ADJ|amod|S8R":         "Adjectif superlatif — monte vers Le Sommet.",
    "ADJ|*|S9":             "Adjectif simple — couleur et qualité à la Station Couleur.",
    "ADJ|*|S8L":            "Forme comparative — guidée vers La Balance.",
    "ADJ|*|S8R":            "Forme superlative — guidée vers Le Sommet.",
    "ADJ|*|*":              "Adjectif — qualité et restriction.",
    # Adverbes
    "ADV|advmod|S5":        "Adverbe de manière — module le verbe au Moteur Détail.",
    "ADV|advmod|S6":        "Adverbe à portée large — temporel ou phrastique à L'Horloge.",
    "ADV|*|S5":             "Adverbe lié au détail verbal.",
    "ADV|*|S6":             "Adverbe — nuance temporelle ou phrastique à L'Horloge.",
    "ADV|*|*":              "Adverbe — portée dépendante de la tête.",
    # Prépositions
    "ADP|case|S6":          "Préposition — construit la coque du SP à L'Horloge (T×P).",
    "ADP|obl:agent|S6":     "Syntagme agentif (par/de) — la contrepartie passive à L'Horloge.",
    "ADP|*|S6":             "Préposition — cas et chemin à L'Horloge.",
    "ADP|*|*":              "Préposition sur la carte.",
    # Numeraux
    "NUM|nummod|S3":        "Numéral quantificateur — embranchement D à La Porte.",
    "NUM|*|S3":             "Numéral comme déterminant — La Porte le gère.",
    "NUM|*|S8L":            "Numéral autonome — La Balance. Chiffre comme degré ou référence.",
    "NUM|*|*":              "Numéral — quantité ou mesure sur la carte.",
    # Repli
    "*|*|*":                "Token sur la carte grammaticale — rôle lu depuis POS et dépendance.",
}


def get_note_fr(pos: str, dep: str, stations: tuple[str, ...]) -> str:
    joined = ",".join(stations) if stations else "*"
    candidates = [
        f"{pos}|{dep}|{joined}",
        f"{pos}|{dep}|*",
        f"{pos}|*|*",
        f"*|*|{joined}",
        "*|*|*",
    ]
    for key in candidates:
        if key in _NOTES_FR:
            return _NOTES_FR[key]
    return _NOTES_FR["*|*|*"]
