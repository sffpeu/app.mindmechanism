"""Spanish journey note descriptions for the Grammar Transit Map.

Spanish uses standard Universal Dependencies from es_core_news_lg.
Enhanced UD subtypes (nsubj:pass) are normalised in mapper.py.
Spanish is pro-drop — the subject pronoun is often absent; the verb
carries person/number agreement morphology instead.
"""

from __future__ import annotations

_NOTES_ES: dict[str, str] = {
    # Determinantes (S3 = La Puerta)
    "DET|det|S3":       "Artículo definido o indefinido. Ancla el nombre en género y número.",
    "DET|det|*":        "Determinante. Dirige el tráfico hacia la plataforma nominal precisa.",
    # Sustantivos — sujeto en la Fundación (S4)
    "NOUN|nsubj|S4":        "Sustantivo común, sujeto. Pilar de la proposición.",
    "NOUN|nsubj|S4,S9":     "Sustantivo-sujeto con escolta adjetiva — color antes de la llegada.",
    "NOUN|nsubjpass|S4":    "Sujeto de construcción pasiva — recibe la acción.",
    "NOUN|nsubjpass|S4,S9": "Sujeto pasivo con modificador adjetival.",
    "NOUN|obj|S3":          "Objeto directo. El verbo entrega su carga aquí.",
    "NOUN|obj|S3,S9":       "Objeto directo acompañado de adjetivo.",
    "NOUN|iobj|S3":         "Objeto indirecto. La acción llega al destinatario.",
    "NOUN|obl|S3":          "Complemento oblicuo — rol sintáctico precisado por la preposición.",
    "NOUN|nmod|S3":         "Modificador nominal — precisa o restringe el nombre vecino.",
    "NOUN|appos|S3":        "Aposición — segunda etiqueta sobre el mismo referente.",
    "NOUN|conj|S3":         "Sustantivo coordinado — comparte rama con un SN paralelo.",
    "NOUN|*|S3":            "Sustantivo guiado por La Puerta (rol no-sujeto).",
    "NOUN|*|S4":            "Sustantivo anclado como sujeto en la Fundación.",
    "NOUN|*|S4,S9":         "Sustantivo-sujeto con modificador adjetival en la Estación Color.",
    "NOUN|*|S3,S9":         "Sustantivo no-sujeto coloreado por adjetivo en la Estación Color.",
    "NOUN|*|*":             "Elemento nominal en el mapa.",
    # Nombres propios
    "PROPN|nsubj|S4":       "Nombre propio, sujeto — entidad nombrada en la Fundación.",
    "PROPN|nsubj|S4,S9":    "Nombre propio-sujeto con adjetivo de acompañamiento.",
    "PROPN|obj|S3":         "Nombre propio objeto — destino nombrado en la Línea N.",
    "PROPN|*|S3":           "Nombre propio pasando por La Puerta.",
    "PROPN|*|S4":           "Nombre propio como sujeto en la Fundación.",
    "PROPN|*|*":            "Nombre propio en el mapa.",
    # Verbos
    "VERB|ROOT|S1":         "Verbo finito principal — la Sala de Máquinas fija horario y potencia.",
    "VERB|ROOT|S1,S5":      "Verbo principal con adverbio — el Motor Detalle añade la manera.",
    "VERB|ROOT|S1,S7":      "Forma no-finita principal — El Desvío gestiona el infinitivo y gerundio.",
    "VERB|ROOT|S1,S5,S7":   "Verbo no-finito con adverbios — Máquina, Desvío y Detalle activos.",
    "VERB|ccomp|S1":        "Verbo completivo — locomotora de la proposición subordinada.",
    "VERB|xcomp|S1":        "Complemento abierto — arrastra una proposición en infinitivo.",
    "VERB|advcl|S1":        "Verbo de cláusula adverbial — horario secundario.",
    "VERB|relcl|S1":        "Verbo de relativa — vía de servicio para el antecedente.",
    "VERB|conj|S1":         "Verbo coordinado — potencia paralela desde el mismo sujeto.",
    "VERB|*|S1":            "Verbo en la Sala de Máquinas — porta tiempo y núcleo eventivo.",
    "VERB|*|S1,S5":         "Verbo con hijos adverbiales — manera vía Motor Detalle.",
    "VERB|*|S1,S7":         "Verbo con forma inf./ger. — también marcado en El Desvío.",
    "VERB|*|*":             "Verbo — núcleo eventivo de la proposición.",
    # Auxiliares
    "AUX|aux|S2":           "Auxiliar — compañero de tiempo o aspecto en el Nudo de Autoridad.",
    "AUX|auxpass|S2":       "Auxiliar pasivo — construye la voz pasiva en el Nudo.",
    "AUX|cop|S2":           "Cópula — enlaza sujeto y atributo en el Nudo de Autoridad.",
    "AUX|ROOT|S2":          "Auxiliar o cópula en la raíz — el Nudo sostiene el finito.",
    "AUX|*|S2":             "Auxiliar o modal — finitud y modo en el Nudo de Autoridad.",
    "AUX|*|*":              "Elemento auxiliar que estructura el complejo verbal.",
    # Adjetivos
    "ADJ|amod|S9":          "Adjetivo epíteto — colorea el nombre antes de la llegada.",
    "ADJ|amod|S8L":         "Adjetivo comparativo — desvío por La Balanza.",
    "ADJ|amod|S8R":         "Adjetivo superlativo — asciende hacia La Cima.",
    "ADJ|*|S9":             "Adjetivo simple — color y cualidad en la Estación Color.",
    "ADJ|*|S8L":            "Forma comparativa — guiada hacia La Balanza.",
    "ADJ|*|S8R":            "Forma superlativa — guiada hacia La Cima.",
    "ADJ|*|*":              "Adjetivo — cualidad y restricción.",
    # Adverbios
    "ADV|advmod|S5":        "Adverbio de manera — modula el verbo en el Motor Detalle.",
    "ADV|advmod|S6":        "Adverbio de alcance amplio — temporal o frásico en El Reloj.",
    "ADV|*|S5":             "Adverbio ligado al detalle verbal.",
    "ADV|*|S6":             "Adverbio — matiz temporal o frásico en El Reloj.",
    "ADV|*|*":              "Adverbio — alcance dependiente del núcleo.",
    # Preposiciones
    "ADP|case|S6":          "Preposición — construye la cáscara del SP en El Reloj (T×P).",
    "ADP|obl:agent|S6":     "Sintagma agentivo (por/de) — contraparte pasiva en El Reloj.",
    "ADP|*|S6":             "Preposición — caso y camino en El Reloj.",
    "ADP|*|*":              "Preposición en el mapa.",
    # Numerales
    "NUM|nummod|S3":        "Numeral cuantificador — ramal D en La Puerta.",
    "NUM|*|S3":             "Numeral como determinante — La Puerta lo gestiona.",
    "NUM|*|S8L":            "Numeral autónomo — La Balanza. Cifra como grado o referencia.",
    "NUM|*|*":              "Numeral — cantidad o medida en el mapa.",
    # Retorno
    "*|*|*":                "Token en el mapa gramatical — rol leído desde POS y dependencia.",
}


def get_note_es(pos: str, dep: str, stations: tuple[str, ...]) -> str:
    joined = ",".join(stations) if stations else "*"
    candidates = [
        f"{pos}|{dep}|{joined}",
        f"{pos}|{dep}|*",
        f"{pos}|*|*",
        f"*|*|{joined}",
        "*|*|*",
    ]
    for key in candidates:
        if key in _NOTES_ES:
            return _NOTES_ES[key]
    return _NOTES_ES["*|*|*"]
