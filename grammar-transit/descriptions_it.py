"""Italian journey note descriptions for the Grammar Transit Map.

Italian uses standard Universal Dependencies from it_core_news_lg.
Enhanced UD subtypes (nsubj:pass, expl:impers, clit:obj) are normalised
in mapper.py. Italian is pro-drop and makes heavy use of clitic pronouns.
"""

from __future__ import annotations

_NOTES_IT: dict[str, str] = {
    # Determinanti (S3 = Il Portale)
    "DET|det|S3":       "Articolo determinativo o indeterminativo. Ancora il nome in genere e numero.",
    "DET|det|*":        "Determinante. Indirizza il traffico verso la piattaforma nominale precisa.",
    # Nomi — soggetto alla Fondazione (S4)
    "NOUN|nsubj|S4":        "Nome comune, soggetto. Pilastro portante della proposizione.",
    "NOUN|nsubj|S4,S9":     "Nome-soggetto con scorta aggettivale — colore prima dell'arrivo.",
    "NOUN|nsubjpass|S4":    "Soggetto di costruzione passiva — riceve l'azione.",
    "NOUN|nsubjpass|S4,S9": "Soggetto passivo con modificatore aggettivale.",
    "NOUN|obj|S3":          "Oggetto diretto. Il verbo consegna il suo carico qui.",
    "NOUN|obj|S3,S9":       "Oggetto diretto accompagnato da aggettivo.",
    "NOUN|iobj|S3":         "Oggetto indiretto. L'azione giunge al destinatario.",
    "NOUN|obl|S3":          "Complemento obliquo — ruolo sintattico precisato dalla preposizione.",
    "NOUN|nmod|S3":         "Modificatore nominale — precisa o restringe il nome vicino.",
    "NOUN|appos|S3":        "Apposizione — seconda etichetta sullo stesso referente.",
    "NOUN|conj|S3":         "Nome coordinato — condivide un ramo con un SN parallelo.",
    "NOUN|*|S3":            "Nome guidato dal Portale (ruolo non-soggetto).",
    "NOUN|*|S4":            "Nome ancorato come soggetto alla Fondazione.",
    "NOUN|*|S4,S9":         "Nome-soggetto con modificatore aggettivale alla Stazione Colore.",
    "NOUN|*|S3,S9":         "Nome non-soggetto colorato da un aggettivo alla Stazione Colore.",
    "NOUN|*|*":             "Elemento nominale sulla mappa.",
    # Nomi propri
    "PROPN|nsubj|S4":       "Nome proprio, soggetto — entità nominata alla Fondazione.",
    "PROPN|nsubj|S4,S9":    "Nome proprio-soggetto con aggettivo di accompagnamento.",
    "PROPN|obj|S3":         "Nome proprio oggetto — destinazione nominata sulla Linea N.",
    "PROPN|*|S3":           "Nome proprio che passa per Il Portale.",
    "PROPN|*|S4":           "Nome proprio come soggetto alla Fondazione.",
    "PROPN|*|*":            "Nome proprio sulla mappa.",
    # Verbi
    "VERB|ROOT|S1":         "Verbo finito principale — la Sala Macchine fissa l'orario e la potenza.",
    "VERB|ROOT|S1,S5":      "Verbo principale con avverbio — il Motore Dettaglio aggiunge la maniera.",
    "VERB|ROOT|S1,S7":      "Forma non-finita principale — Lo Scambio gestisce infinito e gerundio.",
    "VERB|ROOT|S1,S5,S7":   "Verbo non-finito con avverbi — Macchina, Scambio e Dettaglio attivi.",
    "VERB|ccomp|S1":        "Verbo completivo — locomotiva della proposizione incassata.",
    "VERB|xcomp|S1":        "Complemento aperto — trascina una proposizione all'infinito.",
    "VERB|advcl|S1":        "Verbo di proposizione avverbiale — orario secondario.",
    "VERB|relcl|S1":        "Verbo di relativa — binario di servizio per l'antecedente.",
    "VERB|conj|S1":         "Verbo coordinato — potenza parallela dallo stesso soggetto.",
    "VERB|*|S1":            "Verbo nella Sala Macchine — porta tempo e nucleo eventivo.",
    "VERB|*|S1,S5":         "Verbo con figli avverbiali — maniera via Motore Dettaglio.",
    "VERB|*|S1,S7":         "Verbo con forma inf./ger. — anche marcato allo Scambio.",
    "VERB|*|*":             "Verbo — nucleo eventivo della proposizione.",
    # Ausiliari
    "AUX|aux|S2":           "Ausiliare — compagno di tempo o aspetto al Nodo d'Autorità.",
    "AUX|auxpass|S2":       "Ausiliare passivo — costruisce la voce passiva al Nodo.",
    "AUX|cop|S2":           "Copula — collega soggetto e predicato al Nodo d'Autorità.",
    "AUX|ROOT|S2":          "Ausiliare o copula alla radice — il Nodo sostiene il finito.",
    "AUX|*|S2":             "Ausiliare o modale — finitezza e modo al Nodo d'Autorità.",
    "AUX|*|*":              "Elemento ausiliare che struttura il complesso verbale.",
    # Aggettivi
    "ADJ|amod|S9":          "Aggettivo attributivo — colora il nome prima dell'arrivo.",
    "ADJ|amod|S8L":         "Aggettivo comparativo — deviazione verso La Bilancia.",
    "ADJ|amod|S8R":         "Aggettivo superlativo — ascende verso La Vetta.",
    "ADJ|*|S9":             "Aggettivo semplice — colore e qualità alla Stazione Colore.",
    "ADJ|*|S8L":            "Forma comparativa — guidata verso La Bilancia.",
    "ADJ|*|S8R":            "Forma superlativa — guidata verso La Vetta.",
    "ADJ|*|*":              "Aggettivo — qualità e restrizione.",
    # Avverbi
    "ADV|advmod|S5":        "Avverbio di modo — modula il verbo al Motore Dettaglio.",
    "ADV|advmod|S6":        "Avverbio a portata ampia — temporale o frasale all'Orologio.",
    "ADV|*|S5":             "Avverbio legato al dettaglio verbale.",
    "ADV|*|S6":             "Avverbio — sfumatura temporale o frasale all'Orologio.",
    "ADV|*|*":              "Avverbio — portata dipendente dalla testa.",
    # Preposizioni
    "ADP|case|S6":          "Preposizione — costruisce il guscio del SP all'Orologio (T×P).",
    "ADP|obl:agent|S6":     "Sintagma agentivo (da/di) — controparte passiva all'Orologio.",
    "ADP|*|S6":             "Preposizione — caso e percorso all'Orologio.",
    "ADP|*|*":              "Preposizione sulla mappa.",
    # Clitici (pronomi clitici — tipicamente assorbiti in obj/iobj dopo normalizzazione)
    "PRON|clit:obj|S3":     "Clitico oggetto — pronome ridotto incorporato nel complesso verbale.",
    "PRON|obj|S3":          "Pronome oggetto diretto — a bordo sulla Linea N.",
    "PRON|iobj|S3":         "Pronome oggetto indiretto — il destinatario condensato.",
    # Numerali
    "NUM|nummod|S3":        "Numerale quantificatore — diramazione D al Portale.",
    "NUM|*|S3":             "Numerale come determinante — Il Portale lo gestisce.",
    "NUM|*|S8L":            "Numerale autonomo — La Bilancia. Cifra come grado o riferimento.",
    "NUM|*|*":              "Numerale — quantità o misura sulla mappa.",
    # Fallback
    "*|*|*":                "Token sulla mappa grammaticale — ruolo letto da POS e dipendenza.",
}


def get_note_it(pos: str, dep: str, stations: tuple[str, ...]) -> str:
    joined = ",".join(stations) if stations else "*"
    candidates = [
        f"{pos}|{dep}|{joined}",
        f"{pos}|{dep}|*",
        f"{pos}|*|*",
        f"*|*|{joined}",
        "*|*|*",
    ]
    for key in candidates:
        if key in _NOTES_IT:
            return _NOTES_IT[key]
    return _NOTES_IT["*|*|*"]
