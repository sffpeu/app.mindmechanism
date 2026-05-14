"""Deterministic (pos, dep, stations) → short narrative for journey notes.

Keys use the pattern ``POS|DEP|STATIONS`` where ``STATIONS`` is a comma-joined
station id list, or ``*`` wildcards for broader rows."""

from __future__ import annotations

_NOTES: dict[str, str] = {
    # Determiners
    "DET|det|S3": "Definite article. Signals a specific noun is boarding.",
    "DET|det|*": "Determiner. Points traffic toward a particular noun platform.",
    # Nouns — subject at Foundation
    "NOUN|nsubj|S4": "Common noun, subject. This is the load-bearing wall of the sentence.",
    "NOUN|nsubj|S4,S9": "Subject noun carrying an adjective escort before arrival.",
    "NOUN|nsubjpass|S4": "Subject of a passive clause — the receiver of the action.",
    "NOUN|nsubjpass|S4,S9": "Passive subject with descriptive trim from an adjective.",
    "NOUN|npadvmod|S6": "Temporal or sentence-adverbial noun — keeps time at The Clock.",
    "NOUN|obj|S3": "Direct object. The verb is handing off the payload here.",
    "NOUN|obj|S3,S9": "Object noun described by an adjective before it departs.",
    "NOUN|pobj|S3": "Object of a preposition — riding inside a PP consist.",
    "NOUN|attr|S3": "Predicate nominal linked by a copula.",
    "NOUN|appos|S3": "Appositive — a second nameplate on the same consist.",
    "NOUN|compound|S3": "Compound piece — stacks with a neighboring noun.",
    "NOUN|conj|S3": "Conjoined noun — shares a branch with a parallel NP.",
    "NOUN|*|S3": "Noun routed through the gateway (non-subject NP role).",
    "NOUN|*|S4": "Noun anchored as the subject at Foundation.",
    "NOUN|*|S4,S9": "Subject noun with an adjective modifier at Colour Station.",
    "NOUN|*|S3,S9": "Non-subject noun tinted by an adjective at Colour Station.",
    "NOUN|*|*": "Noun phrase element on the map.",
    # Proper nouns
    "PROPN|nsubj|S4": "Proper noun subject — a named entity at Foundation.",
    "PROPN|nsubj|S4,S9": "Named subject with adjective decoration.",
    "PROPN|obj|S3": "Proper noun object — a named destination on the N line.",
    "PROPN|*|S3": "Proper noun passing through the gateway.",
    "PROPN|*|S4": "Proper noun as subject at Foundation.",
    "PROPN|*|*": "Proper noun on the map.",
    # Verbs
    "VERB|ROOT|S1": "Main finite verb — the Engine Room sets timetable and torque.",
    "VERB|ROOT|S1,S5": "Main verb with adverb support — Detail Engine adds manner.",
    "VERB|ROOT|S1,S7": "Non-finite main verb form — The Fork handles Inf/Ger traffic.",
    "VERB|ROOT|S1,S5,S7": "Non-finite verb with adverbs — Engine, Fork, and Detail all engaged.",
    "VERB|ccomp|S1": "Clausal complement verb — nested clause locomotive.",
    "VERB|xcomp|S1": "Open clausal complement — pulls a bare infinitive consist.",
    "VERB|advcl|S1": "Adverbial clause verb — sets a side schedule.",
    "VERB|relcl|S1": "Relative clause verb — side line serving the antecedent.",
    "VERB|conj|S1": "Conjoined verb — parallel power from the same subject.",
    "VERB|*|S1": "Verb at Engine Room — carries tense and event core.",
    "VERB|*|S1,S5": "Verb with adverb children — manner routed through Detail Engine.",
    "VERB|*|S1,S7": "Verb with Inf/Ger form — also flagged at The Fork.",
    "VERB|*|S1,S5,S7": "Verb combining Fork, Engine Room, and Detail Engine signals.",
    "VERB|*|*": "Verb — event core of the clause.",
    # Auxiliaries / modals
    "AUX|aux|S2": "Auxiliary — tense or aspect partner at Authority Junction.",
    "AUX|auxpass|S2": "Passive auxiliary — assembles passive voice at Authority Junction.",
    "AUX|ROOT|S2": "Copula or auxiliary as root — Authority holds the finite glue.",
    "AUX|*|S2": "Auxiliary or modal — finiteness and mood at Authority Junction.",
    "AUX|*|*": "Auxiliary element shaping the verbal complex.",
    # Adjectives
    "ADJ|amod|S9": "Premodifying adjective — paints the noun before arrival.",
    "ADJ|acomp|S9": "Predicate adjective — linked by a copula at Colour Station.",
    "ADJ|amod|S8L": "Comparative adjective — detours through The Scale.",
    "ADJ|acomp|S8L": "Comparative predicate — measures against a reference track.",
    "ADJ|amod|S8R": "Superlative adjective — climbs toward The Peak.",
    "ADJ|acomp|S8R": "Superlative predicate — tops the local gradient.",
    "ADJ|*|S9": "Plain adjective — colour and quality at Colour Station.",
    "ADJ|*|S8L": "Comparative form — routed to The Scale.",
    "ADJ|*|S8R": "Superlative form — routed to The Peak.",
    "ADJ|*|*": "Adjective — quality and restriction.",
    # Adverbs
    "ADV|advmod|S5": "Manner adverb — modulates the verb at Detail Engine.",
    "ADV|advmod|S6": "Adverb with wider scope — timed or sentential at The Clock.",
    "ADV|npadvmod|S6": "Noun-phrase adverbial — often temporal at The Clock.",
    "ADV|advmod|S6": "Adverb not strictly manner-only — The Clock keeps temporal rhythm.",
    "ADV|*|S5": "Adverb linked to verbal detail.",
    "ADV|*|S6": "Adverb — temporal or sentence-level shading at The Clock.",
    "ADV|*|*": "Adverb — scope depends on head.",
    # Prepositions
    "ADP|prep|S6": "Preposition — builds the PP shell at The Clock (T×P×M).",
    "ADP|agent|S6": "Agentive by-phrase — passive counterpart track at The Clock.",
    "ADP|*|S6": "Preposition — case and path at The Clock.",
    "ADP|*|*": "Preposition on the map.",
    # Fallbacks
    "*|*|*": "Token on the grammar map — role read from POS and dependency.",
}


def get_note(pos: str, dep: str, stations: tuple[str, ...]) -> str:
    if dep == "dobj":
        dep = "obj"
    joined = ",".join(stations) if stations else "*"
    candidates = [
        f"{pos}|{dep}|{joined}",
        f"{pos}|{dep}|*",
        f"{pos}|*|*",
        "*|*|*",
    ]
    for key in candidates:
        if key in _NOTES:
            return _NOTES[key]
    return _NOTES["*|*|*"]
