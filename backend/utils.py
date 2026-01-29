import re
import unicodedata
from typing import Literal

NameOrigin = Literal["freeform", "filename"]


def normalize_name(name: str, origin: NameOrigin = "freeform") -> str:
    """
    Normalizes names to firstname_lastname for photo matching.
    Émilie du Châtelet -> emilie_du-chatelet
    Antoine Chambert-Loir -> antoine_chambert-loir
    Haëtham Al Aswad -> haetham_al-aswad

    Freeform origin is name written humanly
    Filename origin is photo names with - and _ swapped
    """
    name = name.strip().lower()

    # strip accents
    name = unicodedata.normalize("NFKD", name)
    name = "".join(c for c in name if not unicodedata.combining(c))

    if origin == "freeform":
        # parts (treat space, -, _ as separator)
        name = re.sub(r"[_]", " ", name)
        parts = re.split(r"\s+", name)
        if len(parts) == 1:
            return parts[0]

        first = parts[0]
        last = "-".join(parts[1:])

        return f"{first}_{last}"

    if origin == "filename":
        # split by -
        first, last = name.split('-', 1)
        first = first.replace("_", "-")
        last = last.replace("_", "-")
        return f"{first}_{last}"