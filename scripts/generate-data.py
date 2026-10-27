import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SERIF_NAMES = '''
Alegreya
Aleo
Alice
Amiri
Andada Pro
Arbutus Slab
Arvo
Asar
Averia Serif Libre
Besley
BioRhyme
Bitter
Bodoni Moda
Brawler
Bree Serif
Buenard
Brygada 1918
Caladea
Cardo
Castoro
Cormorant
Cormorant Garamond
Cormorant Infant
Cormorant SC
Cormorant Unicase
Crete Round
Crimson Pro
Crimson Text
DM Serif Display
DM Serif Text
Domine
EB Garamond
Eczar
Enriqueta
Esteban
Fauna One
Fanwood Text
Fenix
Forum
Fraunces
Frank Ruhl Libre
GFS Didot
Gentium Book Plus
Glegoo
Gloock
Grenze
Hahmlet
Headland One
Hepta Slab
IBM Plex Serif
Ibarra Real Nova
Imbue
Inknut Antiqua
Instrument Serif
Josefin Slab
Judson
Kaisei Decol
Kaisei HarunoUmi
Kaisei Opti
Kaisei Tokumin
Karma
Kotta One
Kreon
Kurale
Ledger
Libre Baskerville
Libre Bodoni
Literata
Lora
Lustria
Maitree
Marcellus
Markazi Text
Martel
Mate
Mate SC
Merriweather
Newsreader
Noto Serif
Noto Serif Display
Noto Serif JP
Noto Serif KR
Noto Serif SC
Noto Serif TC
Old Standard TT
Oranienbaum
Ovo
Petrona
Piazzolla
Playfair Display
Playfair Display SC
Podkova
Poltawski Nowy
Prata
Quando
Quattrocento
Radley
Rakkas
Ramaraja
Rasa
Rhodium Libre
Roboto Slab
Rokkitt
Rosarivo
Rozha One
Rufina
Sahitya
Sanchez
Sawarabi Mincho
Scope One
Shippori Mincho
Shippori Mincho B1
Slabo 13px
Slabo 27px
Source Serif 4
Spectral
Stoke
Suranna
Taviraj
Tienne
Trirong
Unna
Vidaloka
Vollkorn
Vollkorn SC
Young Serif
Zilla Slab
Abril Fatface
Adamina
Alike
Alike Angular
Amethysta
Antic Slab
Arapey
Artifika
Belgrano
Bellefair
Bentham
Cantata One
Caudex
Chonburi
Cinzel
Cinzel Decorative
Copse
Cutive
Cutive Mono
Della Respira
Donegal One
Eagle Lake
Elsie
Elsie Swash Caps
Fjord One
Goudy Bookletter 1911
IM Fell DW Pica
IM Fell English
IM Fell French Canon
IM Fell Great Primer
Lancelot
Linden Hill
Manuale
Montaga
Nixie One
Noticia Text
Port Lligat Slab
Prociono
Sorts Mill Goudy
Tinos
Uncial Antiqua
Vesper Libre
Viaoda Libre
Zen Antique
Zen Antique Soft
Zen Old Mincho
BIZ UDMincho
Hina Mincho
Noto Serif Armenian
Noto Serif Bengali
Noto Serif Devanagari
Noto Serif Ethiopic
Noto Serif Georgian
Noto Serif Hebrew
Noto Serif Khmer
Noto Serif Lao
Noto Serif Malayalam
Noto Serif Myanmar
Noto Serif Sinhala
Noto Serif Thai
Noto Serif Tibetan
Noto Serif Yezidi
Adobe Caslon
Aldus
American Typewriter
Amasis
Aster
Athelas
ATF Garamond
Baskerville
Bell MT
Bembo
Berkeley Oldstyle
Benton Modern
Bodoni
Bodoni 72
Bodoni MT
Book Antiqua
Bookman Old Style
Brill
Bulmer
Calisto MT
Calvert
Cambria
Canela
Caslon
Caslon Antique
Centaur
Century Schoolbook
Charter
Cheltenham
Clarendon
Cochin
Concorde
Corona
Dante
De Vinne
Didot
Ehrhardt
Electra
Fairfield
Filosofia
Fournier
Garamond
Georgia
Goudy Old Style
Granjon
Haarlemmer
Hoefler Text
Imperial
Iowan Old Style
Janson
Joanna
Jenson
Junicode
Kepler
Kis
Linotype Didot
Lyon Text
Malabar
Mercury Text
Minion Pro
Miller
Modern No. 20
Monticello
Mrs Eaves
New Baskerville
New Caledonia
New Century Schoolbook
New Spirit
Nimbus Roman
Palatino
Palatino Linotype
Plantin
Plantin Schoolbook
Sabon
Sabon Next
Scotch Roman
Serifa
Stempel Garamond
Stone Serif
Swift
Tiempos Text
Times New Roman
Trump Mediaeval
Utopia
Walbaum
Warnock Pro
Windsor
'''

SANS_NAMES = '''
ABeeZee
Abel
Afacad
Afacad Flux
Advent Pro
Alata
Alef
Alegreya Sans
Alegreya Sans SC
Alexandria
Almarai
Alumni Sans
Amiko
Andika
Anonymous Pro
Anta
Anton
Antonio
Archivo
Archivo Black
Archivo Narrow
Arimo
Armata
Arsenal
Asap
Assistant
Atkinson Hyperlegible
Audiowide
Averia Sans Libre
B612
B612 Mono
Baloo 2
Barlow
Barlow Condensed
Barlow Semi Condensed
Bebas Neue
Be Vietnam Pro
Belleza
BenchNine
Biryani
Black Ops One
Blinker
Bowlby One SC
Bruno Ace
Cabin
Cabin Condensed
Cairo
Candal
Cantarell
Capriola
Carme
Carrois Gothic
Catamaran
Chakra Petch
Changa
Changa One
Chivo
Chivo Mono
Comfortaa
Commissioner
Comme
Convergence
Cuprum
Darker Grotesque
Dela Gothic One
Denk One
Didact Gothic
Dosis
DynaPuff
Epilogue
Encode Sans
Encode Sans Condensed
Encode Sans Expanded
Exo
Exo 2
Familjen Grotesk
Figtree
Fira Code
Fira Mono
Fira Sans
Fira Sans Condensed
Fjalla One
Francois One
Gabarito
Galindo
Gantari
Geist
Gemunu Libre
Genos
Georama
Gidugu
Golos Text
Gothic A1
Gowun Dodum
Gugi
Hanken Grotesk
Heebo
Hind
Hind Madurai
Hind Siliguri
IBM Plex Mono
IBM Plex Sans
IBM Plex Sans Condensed
IBM Plex Sans Devanagari
Imprima
Inconsolata
Inder
Inter
Istok Web
Jaldi
Jockey One
Josefin Sans
Jost
Jura
Kanit
Karla
Khand
Kodchasan
Kosugi
Koulen
Krub
Kulim Park
Kumbh Sans
League Gothic
League Spartan
Lexend
Lexend Deca
Lexend Exa
Lexend Giga
Lexend Mega
Lexend Peta
Lexend Tera
Lexend Zetta
Libre Franklin
Livvic
Londrina Solid
M PLUS 1
M PLUS 1 Code
M PLUS 2
M PLUS Rounded 1c
Manjari
Manrope
Maven Pro
Meera Inimai
Merriweather Sans
Metrophobic
Michroma
Mina
Mitr
Monda
Montserrat
Montserrat Alternates
Mooli
Mulish
MuseoModerno
Mynerve
Nanum Gothic
Nanum Gothic Coding
News Cycle
Noto Sans
Noto Sans Display
Noto Sans JP
Noto Sans KR
Noto Sans SC
Noto Sans TC
Nunito
Nunito Sans
Odibee Sans
Onest
Open Sans
Orbitron
Oswald
Outfit
Overpass
Overpass Mono
Oxygen
Oxygen Mono
PT Mono
PT Sans
PT Sans Caption
PT Sans Narrow
Padauk
Palanquin
Palanquin Dark
Pathway Extreme
Paytone One
Phudu
Play
Plus Jakarta Sans
Poetsen One
Poppins
Prompt
Public Sans
Questrial
Quicksand
Rajdhani
Raleway
Red Hat Display
Red Hat Mono
Red Hat Text
Red Rose
Roboto
Roboto Condensed
Roboto Flex
Roboto Mono
Ropa Sans
Rosario
Rubik
Ruda
Russo One
Saira
Saira Condensed
Saira Extra Condensed
Saira Semi Condensed
Sarabun
Sarpanch
Sawarabi Gothic
Scada
Schibsted Grotesk
Sen
Shanti
Signika
Signika Negative
Silkscreen
Sintony
Sofia Sans
Sofia Sans Condensed
Sora
Space Grotesk
Space Mono
Spline Sans
Spline Sans Mono
Staatliches
Syne
Tajawal
Teko
Text Me One
Titillium Web
Tomorrow
Trispace
Ubuntu
Ubuntu Condensed
Ubuntu Mono
Unbounded
Unica One
Urbanist
Varela Round
Varta
Vazirmatn
Victor Mono
Viga
Voces
Wix Madefor Display
Wix Madefor Text
Work Sans
Yanone Kaffeesatz
Yantramanav
Ysabeau
Zen Kaku Gothic Antique
Zen Kaku Gothic New
Zen Kurenaido
Zen Maru Gothic
Akkurat
Akzidenz-Grotesk
Arial
Arial Nova
Avenir
Avenir Next
Avant Garde
Bahnschrift
Bell Gothic
Calibri
Candara
Century Gothic
Clearview
Compacta
Corbel
Dax
DIN
DIN Next
Effra
Eras
Eurostile
FF DIN
FF Mark
FF Meta
Franklin Gothic
Franklin Gothic Book
Frutiger
Futura
Futura PT
Gill Sans
Gotham
Graphik
Helvetica
Helvetica Neue
Helvetica Now
Humanist 521
ITC Avant Garde Gothic
ITC Franklin Gothic
Interstate
Kabel
Lato
Liberation Sans
Lucida Sans
Meta
Myriad Pro
Neue Haas Grotesk
Neue Montreal
Neue Plak
News Gothic
Nimbus Sans
Optima
Proxima Nova
Publico Sans
Rotis Sans
Scala Sans
Segoe UI
Segoe UI Variable
Source Sans 3
Source Sans Pro
Tahoma
Trade Gothic
Trebuchet MS
Univers
Univers Next
Verdana
Whitney
Work Sans Variable
'''


def unique_names(raw):
    names, seen = [], set()
    for line in raw.splitlines():
        name = line.strip()
        key = name.casefold()
        if name and key not in seen:
            names.append(name)
            seen.add(key)
    return names

serif = unique_names(SERIF_NAMES)
sans = unique_names(SANS_NAMES)
serif_keys = {name.casefold() for name in serif}
sans = [name for name in sans if name.casefold() not in serif_keys]
# More known families, added only if the first curated set needs a few entries.
serif_extras = unique_names('''Albertus
Arnhem
Austin
Baskerville Old Face
Bell Centennial
Benton Modern Display
Bookman
Caledonia
Caslon Graphique
Century Old Style
Clarendon Text
Clearface
Cushing
Eldorado
Emerson
Equity Text
Freight Text
Galliard
Garamond Premier Pro
Goudy
Hightower Text
ITC Berkeley Oldstyle
ITC Bookman
ITC Legacy Serif
Jubilat
Lexicon
Linotype Sabon
New Baskerville
Old Style 7
Plantin Infant
Requiem
Scotch Modern
Stempel Schneidler
Tiempos Headline
Trump Mediaeval
''')
sans_extras = unique_names('''Antenna
Arial Unicode MS
Avenir Book
Avenir Light
Avenir LT Std
Avenir Next LT Pro
Benton Sans
Bernhard Gothic
Bliss
Brandon Grotesque
Brown
Circular Std
Colfax
Conduit
Core Sans
DIN 2014
Engravers Gothic
Europa
FF Scala Sans
Foco
Founders Grotesk
Frutiger LT Std
Frutiger Neue
Futura Now
Gibson
Gotham Rounded
GT America
GT Eesti
GT Walsheim
ITC Conduit
ITC Officina Sans
ITC Stone Sans
Klavika
Knockout
Maison Neue
Mercury Sans
Metropolis
Neue Haas Unica
Nexa
Objective
Omnes
Proxima Soft
Questa Sans
Rational
Rotis Semi Sans
Sofia Pro
Söhne
Trade Gothic LT
TT Commons
TT Norms Pro
Univers 55
Verlag
Vista Sans
''')
for name in serif_extras:
    if name.casefold() not in {x.casefold() for x in serif}:
        serif.append(name)
for name in sans_extras:
    if name.casefold() not in {x.casefold() for x in sans} and name.casefold() not in {x.casefold() for x in serif}:
        sans.append(name)

serif = serif[:200]
sans = sans[:200]
if len(serif) != 200 or len(sans) != 200:
    raise SystemExit(f'Need exactly 200 families per category; got Serif={len(serif)}, Sans-Serif={len(sans)}')

serif_tips = [
    'Look for small finishing strokes at the ends of the main letterforms; compare the feet on the stems.',
    'Inspect the terminals: the strokes end in visible serifs rather than plain, unadorned cuts.',
    'Notice how the small finishing strokes anchor letters such as I, T, E, and n.',
    'Look at the contrast between thick and thin strokes and the finishing feet on vertical stems.',
    'Examine letter terminals and bracketed joins; serif details remain visible even at smaller sizes.',
    'Check the ends of the strokes for short crossbars or feet, especially on capitals and lowercase stems.'
]
sans_tips = [
    'Look for clean stroke terminals without small finishing serifs; the ends are generally plain.',
    'Inspect letters such as I, T, E, and n: the strokes end cleanly rather than forming feet.',
    'Notice the unadorned terminals and relatively simple joins between strokes.',
    'Check the ends of vertical stems for the absence of small finishing strokes.',
    'Focus on terminal shapes: they are clean cuts, not bracketed or unbracketed serifs.',
    'Look for a simplified letter skeleton with no small finishing strokes at the stroke ends.'
]
fonts = []
for category, names, tips, prefix in [('Serif', serif, serif_tips, 'serif'), ('Sans-Serif', sans, sans_tips, 'sans')]:
    for index, name in enumerate(names, 1):
        fonts.append({
            'id': f'{prefix}_{index}',
            'name': name,
            'category': category,
            'anatomicalTip': tips[(index - 1) % len(tips)],
        })
assert len(fonts) == 400
assert len({item['name'].casefold() for item in fonts}) == 400
(ROOT / 'public/data/fonts.json').write_text(json.dumps({'fonts': fonts}, ensure_ascii=False, indent=2) + '\n')

WORDS = '''aardvark abacus abandon abate abbey abdomen abduct aberration ability ablaze abolish abrasion abrupt abscond absence absolute absorb abstract absurd abundance academy accelerate acceleration accent acclaim account accuracy achieve acid acknowledge acoustic acquire across action active adapt addendum adequate adjacent adjust administer admiration adopt adore adventure advocate aesthetic aerial affection affinity agile algorithm align alike alliteration allocate alphabet alter altitude altruism ambiguity ambitious amplitude analogy analysis anatomy anchor ancient anecdote angle animate annual anomaly anticipate antiquity apartment aperture apology apparatus apparent appeal appearance appetite applause application appreciate approach appropriate aqua arcade archaic architect archive ardent argument arithmetic arrangement articulate ascend aspect aspiration assemble assert asset assist astute asymmetry atmosphere atom attach attain attention attitude audience augment authentic authority autumn available avenue awaken axis balance balcony bandwidth banquet barrier baseline beacon beautiful beginning believe benevolent bias binary biography blossom blueprint bold botanical boundary brand breathe brilliant broadcast bronze browser budget buffer build cadence calculate calibration calm camera candidate canvas capacity capital capture cardinal careful cascade category celebrate celestial center ceramic certainty challenge character charcoal chart clarity classification classic clean clear clever client climate clockwise cluster coalition coherent collaborate collection color column combine comfort command commerce common communicate community compare compass compassion compete compile complex compose composition comprehend concept concise concrete conduct confidence configure connect conscience consistent constellation construct contrast contribute control converge conversation coordinate core cornerstone correct correlate craft creative credibility crimson critical curiosity current curve cycle data debate decision declare decorate dedication deep default delicate deliver demonstrate density depth design detail develop dialogue dimension direction discover discipline display distinction diversity document domain dominant double dramatic draw dynamic earth edition educate effect efficiency elegant element elevate eliminate embrace emerge emphasis empirical enable encourage endear endeavor energy enhance enough enumerate environment equal equation era ergonomic error essence establish estimate ethics evaluate evidence evolve exact examine example exceed excellent exercise expand expectation experience expert explain explore express extension extensive external extract fabricate fact faculty fair familiar family fantasy feature feedback feeling field figure file filter final fine finish flexible flourish focus focal folk following font force form format formula forward framework freedom frequency fresh friendly fringe frontier function future galaxy game gamut gather general generation generous geometry gesture glow grace gradient grammar graph gratitude gravity grid growth guarantee guide habit harmony harvest headline health heart height heritage hero highlight horizon hospitality human humility hybrid hypothesis identity ignite illustration imagery imagination impact implement implication improve impulse incentive inclusive index indicate individual industry infinity influence information infrastructure ingredient initial innovate insight inspire integrate integrity interact interest interface internal interpret interval introduce intuition inventory investment invite iterate journey journal judge justice kernel key kindness kinetic knowledge label language lantern latent latitude launch layer learning legacy legal lens liberty library life light limit lineage line linear linguistic listen literal literacy lively logic longitude loop luminous machine magazine magic magnitude maintenance manage management manifest manner manual map margin market master material mathematics meaning measure mechanism media mediate memory mental mention merge message method metric milestone mimic mindful minimal minute mirror mission mobile model moderate modern module momentum monitor monochrome motion motive multiply museum music narrative natural navigate necessary negative network neutral new normal note notation notice nuance objective observe obtain obvious occasion ocean octagon odd observe offer offset omniscient ongoing opaque open operate opinion opportunity optimize option orbit order organic organize origin original outcome outline output overview oxygen page palette parallel parameter particle pattern pause perception performance period perspective phase philosophy photograph phrase physical piano pictogram picture pilot pixel place planet platform play playful plot point poetic policy positive possible potential practice precise predict preference prepare presence presentation preserve pressure preview primary principle print priority process produce product profile program progress project proof proportion prototype psychology public purpose quality quantum query question quick quiet quotient radar radical random range rationale reach reason rebuild recall receive record recover rectangle recur reference refine reflect reform refresh region regular relate reliable relief render renew repeat replace report represent request require research reserve resolve resource respect response responsive restore result retain retrieve review rhythm ribbon rigorous rise risk ritual role rotation round route routine rubric rule sample satisfy scale scan scenario science scope score screen script search section secure segment select selection semantic sentence sequence series serif serious service settle shape share sharp shift signal simple simplify simulate single sketch skill slant slender slogan slow smooth social software solid solution solve sonic sort source space spatial speak special spectrum specimen spell spin spirit split sponsor stage standard state static station status strategy stream structure style sublime subtle sufficient summary supervise support surface survey switch symbol syllable symmetry synchronize syntax system table tactile tactic talent tangent target task taste teach technique text texture theory threshold thrive ticket tidy timeline title toggle tolerance tool topic total trace track trade tradition train transform transition transparent transpose trend trial triangulate trigger trim triumph trust truth typography ultimate underline understand unify uniform unique unit universal universe unknown unlock update upgrade uppercase utility validate value variation vector velocity verify version vertical vertex viable vibrant video view visual vocabulary vocal void volume volunteer wander warm warning wavelength welcome whole width wisdom word work world worth write writing yield zenith'''.split()
words = list(dict.fromkeys(WORDS))
if len(words) < 200:
    raise SystemExit('Vocabulary list unexpectedly short')
(ROOT / 'public/data/words.json').write_text(json.dumps({'words': words}, ensure_ascii=False, indent=2) + '\n')
print(f'Wrote {len(fonts)} fonts (200 Serif, 200 Sans-Serif) and {len(words)} words')
