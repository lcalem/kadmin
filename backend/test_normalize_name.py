from utils import normalize_name

assert normalize_name('Lucas Roger-Loir', origin="freeform") == "lucas_roger-loir"
assert normalize_name('Lucie Durand', origin="freeform") == "lucie_durand"
assert normalize_name('Émilie du Châtelet', origin="freeform") == "emilie_du-chatelet"
assert normalize_name('Machin de Truc', origin="freeform") == "machin_de-truc"
assert normalize_name('Jean-Charles Bidule-Truc', origin="freeform") == "jean-charles_bidule-truc"
assert normalize_name('abel-laval', origin="filename") == "abel_laval"
assert normalize_name('machine-al_truc', origin="filename") == "machine_al-truc"