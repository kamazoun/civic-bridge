"""Seed a populated Civic Bridge platform.

Runs once, on the first start (no ``data/state.json`` yet), and fills every
country with accounts, published notices, comments, votes, resident
perspectives, feedback drafts, office replies and shares, dated over the
previous six months. Generation is deterministic (fixed random seed) so a
fresh deployment always shows the same platform.

Everything here is illustrative: fictional residents, fictional offices,
plausible but invented notices. Nothing is a real government publication.
"""
from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

SEED = 2026
DEMO_PASSWORD = "civic2026"

# ---------------------------------------------------------------------------
# Per-country flavour: neighbourhoods, names, currency, language.
# ---------------------------------------------------------------------------
COUNTRIES: dict[str, dict[str, Any]] = {
    "Togo": {
        "lang": "fr", "slug": "togo", "locality": "Lomé", "region": "Région Maritime", "currency": "FCFA",
        "areas": ["Bè", "Tokoin", "Adidogomé", "Agoè", "Nyékonakpoè", "Hédzranawoé", "Kodjoviakopé", "Adakpamé", "Bè-Kpota", "Amoutivé"],
        "first": ["Kossi", "Afi", "Kodjo", "Ama", "Yao", "Akossiwa", "Komi", "Sena", "Dela", "Edem", "Mawuli", "Esi", "Kokou", "Adjo", "Folly", "Ayélé", "Koffi", "Dzifa", "Elom", "Sika", "Mawusi", "Abra", "Kwami", "Enyonam"],
        "last": ["Agbeko", "Amegah", "Dossou", "Lawson", "Kpodar", "Adjavon", "Gbedemah", "Tsogbe", "Akakpo", "Sodji", "Mensah", "Dogbe", "Tchalla", "Attisso", "Kponton", "Ahlonko", "Amouzou", "Kuevi"],
        "offices": {"ward-council": "office.golfe1", "district-council": "office.prefecture-golfe", "prefecture": "office.region-maritime", "governor": "office.togo-national"},
    },
    "Côte d’Ivoire": {
        "lang": "fr", "slug": "cote-divoire", "locality": "Abidjan", "region": "Abidjan District", "currency": "FCFA",
        "areas": ["Abobo", "Yopougon", "Cocody", "Adjamé", "Koumassi", "Treichville", "Marcory", "Port-Bouët", "Attécoubé", "Anyama"],
        "first": ["Aya", "Koffi", "Kouadio", "Adjoua", "Yao", "Affoué", "Konan", "Amenan", "Mamadou", "Fatoumata", "Seydou", "Aminata", "Jean-Marc", "Marie-Laure", "Ibrahim", "Awa", "Souleymane", "Nadège", "Hervé", "Bintou", "Akissi", "Franck", "Rokia", "Désiré"],
        "last": ["Kouassi", "Koné", "Traoré", "N’Guessan", "Coulibaly", "Bamba", "Diabaté", "Yao", "Ouattara", "Konaté", "Kouamé", "Assi", "Gnahoré", "Touré", "Brou", "Silué", "Aké", "Digbeu"],
        "offices": {"ward-council": "office.abobo", "district-council": "office.district-abidjan", "prefecture": "office.region-abidjan", "governor": "office.ci-national"},
    },
    "Kenya": {
        "lang": "en", "slug": "kenya", "locality": "Nairobi", "region": "Nairobi County", "currency": "KSh",
        "areas": ["Kibera", "Kasarani", "Embakasi", "Kawangware", "Dagoretti", "Ruaraka", "Mathare", "Kayole", "Githurai", "Umoja"],
        "first": ["Wanjiku", "Otieno", "Achieng", "Kamau", "Njeri", "Mwangi", "Akinyi", "Kipchoge", "Wambui", "Omondi", "Muthoni", "Kariuki", "Atieno", "Njoroge", "Chebet", "Ochieng", "Nyambura", "Mutua", "Wafula", "Zawadi", "Brian", "Faith", "Kevin", "Mercy"],
        "last": ["Mwangi", "Odhiambo", "Kamau", "Wanjiru", "Ochieng", "Kariuki", "Njoroge", "Otieno", "Mutua", "Kimani", "Wekesa", "Oduya", "Karanja", "Auma", "Maina", "Kiptoo", "Barasa", "Mwende"],
        "offices": {"ward-council": "office.nairobi-ward", "district-council": "office.nairobi-constituency", "prefecture": "office.nairobi-county", "governor": "office.kenya-national"},
    },
    "Ghana": {
        "lang": "en", "slug": "ghana", "locality": "Tamale North constituency", "region": "Northern Region", "currency": "GH₵",
        "areas": ["Sagnarigu", "Nyohini", "Kalpohin", "Lamashegu", "Vittin", "Gumbihini", "Choggu", "Kukuo", "Jisonayili", "Zogbeli"],
        "first": ["Abdulai", "Fuseini", "Amina", "Sanatu", "Yakubu", "Zeinab", "Alhassan", "Mariama", "Sulemana", "Hawa", "Iddrisu", "Rukaya", "Mohammed", "Salamatu", "Adam", "Fatima", "Baba", "Zulaiha", "Issah", "Nafisa", "Kwame", "Abena", "Yaw", "Esther"],
        "last": ["Mahama", "Abukari", "Alhassan", "Fuseini", "Iddrisu", "Sulemana", "Yakubu", "Abdulai", "Ziblim", "Salifu", "Mumuni", "Andani", "Wumbei", "Musah", "Adam", "Osei", "Mensah", "Boateng"],
        "offices": {"ward-council": "office.tamale-electoral", "district-council": "office.tamale-assembly", "prefecture": "office.northern-rcc", "governor": "office.tamale-north"},
    },
    "Nigeria": {
        "lang": "en", "slug": "nigeria", "locality": "Lagos", "region": "Lagos State", "currency": "₦",
        "areas": ["Ikeja", "Yaba", "Surulere", "Agege", "Alimosho", "Ikorodu", "Mushin", "Oshodi", "Ajah", "Badagry"],
        "first": ["Adebayo", "Funmilayo", "Tunde", "Ngozi", "Chukwuemeka", "Bolanle", "Emeka", "Yetunde", "Ibrahim", "Kehinde", "Chioma", "Olamide", "Aisha", "Segun", "Amaka", "Damilola", "Musa", "Temitope", "Ifeoma", "Femi", "Bukola", "Uche", "Hauwa", "Tobi"],
        "last": ["Adeyemi", "Okafor", "Balogun", "Adebayo", "Eze", "Ogunleye", "Nwosu", "Bello", "Adewale", "Okonkwo", "Lawal", "Oyelaran", "Ibrahim", "Afolabi", "Chukwu", "Salami", "Nnamdi", "Akintola"],
        "offices": {"ward-council": "office.lagos-ward", "district-council": "office.lagos-lga", "prefecture": "office.lagos-state", "governor": "office.lagos-federal"},
    },
}

PROFESSIONS = {
    "fr": ["Enseignant(e)", "Commerçant(e)", "Infirmier(ère)", "Chauffeur", "Étudiant(e)", "Couturier(ère)", "Agriculteur(rice)", "Mécanicien(ne)", "Coiffeur(se)", "Retraité(e)", "Agent de santé communautaire", "Vendeur(se) au marché"],
    "en": ["Teacher", "Trader", "Nurse", "Driver", "Student", "Tailor", "Farmer", "Mechanic", "Hairdresser", "Retired", "Community health worker", "Market vendor"],
}
# Interests a seeded resident of each profession lists (same controlled
# vocabulary as CIVIC_TOPICS); index-aligned with PROFESSIONS.
PROFESSION_INTERESTS = [
    ["education", "exams", "meeting"], ["markets", "tax", "roads", "energy"], ["health", "water", "sanitation"], ["roads", "transport", "energy"],
    ["education", "exams", "employment", "identity"], ["energy", "markets", "tax"], ["farming", "water", "land", "livestock"], ["transport", "roads", "energy"],
    ["energy", "water", "markets"], ["health", "registry", "water"], ["health", "sanitation", "water", "meeting"], ["markets", "sanitation", "roads"],
]

# ---------------------------------------------------------------------------
# Notice topics, by office level. {area} = locality, {nb} = neighbourhood,
# {cur} = currency, {d1}/{d2} = dates, {office} = publishing office.
# ---------------------------------------------------------------------------
TOPICS: dict[str, dict[str, list[dict[str, str]]]] = {
    "ward-council": {
        "fr": [
            {"cat": "Avis public", "title": "Collecte des ordures à {nb} : nouveau calendrier à partir du {d1}", "summary": "La collecte passe à deux fois par semaine (mardi et vendredi) dans le quartier de {nb}. Sortez les sacs avant 6 h.", "body": "À partir du {d1}, les camions de collecte passeront le mardi et le vendredi matin à {nb}. Les points de regroupement restent les mêmes. Les dépôts sauvages sont passibles d’une amende de 10 000 {cur}. Signalez un passage manqué au bureau communal."},
            {"cat": "Réunion publique", "title": "Réunion de quartier à {nb} le {d1} : priorités {year}", "summary": "Les habitants de {nb} sont invités à discuter des priorités du quartier : éclairage, caniveaux, marché.", "body": "Le bureau communal organise une réunion publique le {d1} à 17 h à l’école primaire de {nb}. Ordre du jour : état des caniveaux, réparation de l’éclairage public, gestion du marché. Un compte rendu sera publié ici dans les sept jours."},
            {"cat": "Travaux", "title": "Curage des caniveaux à {nb} du {d1} au {d2}", "summary": "Des équipes cureront les caniveaux principaux de {nb} avant la saison des pluies. Certaines ruelles seront fermées par tranches.", "body": "Le curage commence le {d1} rue par rue et se termine le {d2}. Merci de ne pas stationner devant les caniveaux les jours indiqués sur les affiches. Les déblais seront enlevés dans les 48 heures."},
            {"cat": "Services", "title": "Éclairage public : 24 lampadaires réparés à {nb}", "summary": "Les lampadaires signalés en panne depuis mars ont été remplacés. Signalez ceux qui restent éteints.", "body": "Suite aux signalements des habitants, 24 lampadaires ont été remplacés à {nb} entre le {d1} et le {d2}. Une deuxième vague est prévue pour les rues secondaires. Pour signaler une panne, laissez le numéro du poteau au bureau communal."},
            {"cat": "Marchés", "title": "Marché de {nb} : nouvelle grille des droits de place", "summary": "Les droits de place passent à 200 {cur} par jour pour les étals au sol et 500 {cur} pour les boutiques. Reçus obligatoires.", "body": "La nouvelle grille s’applique à partir du {d1}. Tout paiement doit donner lieu à un reçu numéroté. Les collecteurs portent un badge. En cas d’abus, contactez le bureau communal avec le numéro de reçu."},
            {"cat": "État civil", "title": "Déclarations de naissance : permanence le samedi à {nb}", "summary": "Le service d’état civil ouvre le samedi matin à {nb} jusqu’au {d2} pour rattraper les déclarations tardives.", "body": "Une permanence est ouverte chaque samedi de 8 h à 12 h à la mairie annexe de {nb} jusqu’au {d2}. Apportez le certificat d’accouchement et une pièce d’identité. La déclaration dans les 45 jours est gratuite."},
            {"cat": "Sécurité", "title": "Points d’eau et incendie : exercice de quartier à {nb} le {d1}", "summary": "Un exercice de sécurité incendie aura lieu au marché de {nb}. Les sapeurs-pompiers présenteront les bornes disponibles.", "body": "L’exercice se déroule le {d1} de 9 h à 11 h. Les commerçants sont invités à participer. Une carte des bornes incendie de {nb} sera affichée au bureau communal."},
        ],
        "en": [
            {"cat": "Public notice", "title": "Waste collection in {nb}: new schedule from {d1}", "summary": "Collection moves to twice a week (Tuesday and Friday) in {nb}. Put bags out before 6 am.", "body": "From {d1} the collection trucks will pass on Tuesday and Friday mornings in {nb}. Collection points stay the same. Illegal dumping attracts a fine of 2,000 {cur}. Report a missed pickup to the ward office."},
            {"cat": "Public meeting", "title": "{nb} community meeting on {d1}: {year} priorities", "summary": "Residents of {nb} are invited to discuss ward priorities: street lighting, drains and the market.", "body": "The ward office holds a public meeting on {d1} at 5 pm at {nb} primary school. Agenda: condition of drains, street-light repairs, market management. Minutes will be published here within seven days."},
            {"cat": "Works", "title": "Drain clearing in {nb} from {d1} to {d2}", "summary": "Teams will clear the main drains in {nb} ahead of the rains. Some lanes close in stages.", "body": "Clearing starts on {d1}, street by street, and ends on {d2}. Please do not park over drains on the days shown on the posters. Spoil will be removed within 48 hours."},
            {"cat": "Services", "title": "Street lighting: 24 lamps repaired in {nb}", "summary": "Lamps reported faulty since March have been replaced. Report any that are still dark.", "body": "Following residents’ reports, 24 street lamps were replaced in {nb} between {d1} and {d2}. A second round covers side streets. To report a fault, leave the pole number with the ward office."},
            {"cat": "Markets", "title": "{nb} market: new schedule of daily fees", "summary": "Daily fees move to 50 {cur} for ground stalls and 150 {cur} for lock-up shops. Receipts are mandatory.", "body": "The new schedule applies from {d1}. Every payment must come with a numbered receipt. Collectors wear a badge. Report any abuse to the ward office with the receipt number."},
            {"cat": "Civil registry", "title": "Birth registration: Saturday desk in {nb}", "summary": "The civil registry opens on Saturday mornings in {nb} until {d2} to catch up on late registrations.", "body": "A desk is open every Saturday from 8 am to noon at the {nb} community hall until {d2}. Bring the hospital birth notification and an ID. Registration within 45 days is free."},
            {"cat": "Safety", "title": "Fire safety drill at {nb} market on {d1}", "summary": "A fire drill will take place at {nb} market. The fire service will show the hydrants available.", "body": "The drill runs on {d1} from 9 to 11 am. Traders are invited to take part. A map of {nb} hydrants will be posted at the ward office."},
        ],
    },
    "district-council": {
        "fr": [
            {"cat": "Travaux", "title": "Réhabilitation de la route du marché de {nb} : démarrage le {d1}", "summary": "Les travaux de la voie d’accès au marché de {nb} commencent le {d1} pour huit semaines. Déviation par l’axe principal.", "body": "L’entreprise retenue réalisera 1,2 km de chaussée et les caniveaux latéraux. Une déviation est balisée. Les commerçants gardent l’accès piéton. Point d’avancement publié toutes les deux semaines sur cette page."},
            {"cat": "Santé", "title": "Centre de santé de {nb} : horaires étendus jusqu’à 20 h", "summary": "Les consultations du centre de santé de {nb} sont prolongées en soirée du lundi au vendredi à partir du {d1}.", "body": "Pour réduire les files d’attente, le centre de santé de {nb} ouvre de 7 h à 20 h en semaine. La pharmacie suit les mêmes horaires. Les urgences restent assurées 24 h/24 à l’hôpital de référence."},
            {"cat": "Permis", "title": "Permis de construire : dépôt en ligne et délai de 30 jours", "summary": "Les demandes de permis de construire dans la préfecture se déposent désormais au guichet unique de {nb}. Délai annoncé : 30 jours.", "body": "À partir du {d1}, un seul guichet à {nb} reçoit les dossiers. Liste des pièces affichée sur place. Un récépissé daté est remis à chaque dépôt ; le délai de 30 jours court à partir de cette date."},
            {"cat": "Éducation", "title": "Inscriptions scolaires {year} : calendrier et frais", "summary": "Les inscriptions dans les écoles publiques de la préfecture ouvrent le {d1}. Aucun frais d’inscription n’est exigé au primaire.", "body": "Les écoles publiques inscrivent du {d1} au {d2}. Pièces : acte de naissance, carnet de vaccination. Tout frais demandé au primaire doit être signalé au bureau préfectoral. Les fournitures scolaires distribuées seront listées école par école."},
            {"cat": "Transport", "title": "Gare routière de {nb} : réorganisation des quais à partir du {d1}", "summary": "Les quais de la gare de {nb} sont réaffectés par destination. Les tarifs affichés restent inchangés.", "body": "La nouvelle organisation entre en vigueur le {d1}. Un plan est affiché à l’entrée. Les syndicats de transporteurs ont été consultés. Les tarifs officiels sont affichés sur chaque quai ; signalez toute surfacturation."},
            {"cat": "Assainissement", "title": "Latrines publiques du marché de {nb} remises en service", "summary": "Les latrines rénovées rouvrent le {d1}. Entretien confié à un comité de commerçants.", "body": "Les travaux de rénovation sont terminés. L’accès coûte 25 {cur}. Les recettes couvrent l’entretien et le gardiennage. Le comité publiera ses comptes chaque trimestre au bureau préfectoral."},
            {"cat": "Budget", "title": "Budget participatif : 12 projets retenus pour {year}", "summary": "Les habitants ont voté. Douze projets de quartier seront financés, dont trois à {nb}.", "body": "Sur 41 propositions, 12 projets ont été retenus pour un montant total de 85 millions {cur}. La liste complète avec les montants est disponible au bureau préfectoral et sera affichée dans chaque quartier concerné avant le {d2}."},
        ],
        "en": [
            {"cat": "Works", "title": "{nb} market road rehabilitation starts on {d1}", "summary": "Works on the access road to {nb} market begin on {d1} for eight weeks. Diversion via the main road.", "body": "The contractor will rebuild 1.2 km of carriageway and the side drains. A signed diversion is in place. Traders keep pedestrian access. A progress update will be published on this page every two weeks."},
            {"cat": "Health", "title": "{nb} health centre: opening hours extended to 8 pm", "summary": "Consultations at {nb} health centre run into the evening Monday to Friday from {d1}.", "body": "To cut waiting times, {nb} health centre opens from 7 am to 8 pm on weekdays. The pharmacy keeps the same hours. Emergencies are still handled 24/7 at the referral hospital."},
            {"cat": "Permits", "title": "Building permits: single desk and 30-day turnaround", "summary": "Building permit applications in the district are now filed at the one-stop desk in {nb}. Announced turnaround: 30 days.", "body": "From {d1} a single desk in {nb} receives applications. The list of required documents is posted there. A dated receipt is issued for every filing; the 30-day period runs from that date."},
            {"cat": "Education", "title": "{year} school enrolment: dates and fees", "summary": "Enrolment in the district’s public schools opens on {d1}. No enrolment fee may be charged at primary level.", "body": "Public schools enrol from {d1} to {d2}. Bring the birth certificate and vaccination card. Any fee requested at primary level should be reported to the district office. Distributed school supplies will be listed school by school."},
            {"cat": "Transport", "title": "{nb} bus terminal: bays reorganised from {d1}", "summary": "Bays at {nb} terminal are reassigned by destination. Posted fares are unchanged.", "body": "The new layout takes effect on {d1}. A plan is posted at the entrance. Transport unions were consulted. Official fares are posted at every bay; report any overcharging."},
            {"cat": "Sanitation", "title": "{nb} market public toilets back in service", "summary": "The renovated toilets reopen on {d1}. Upkeep is entrusted to a traders’ committee.", "body": "Renovation is complete. Use costs 5 {cur}. Receipts cover cleaning and security. The committee will publish its accounts every quarter at the district office."},
            {"cat": "Budget", "title": "Participatory budget: 12 projects selected for {year}", "summary": "Residents have voted. Twelve neighbourhood projects will be funded, three of them in {nb}.", "body": "Out of 41 proposals, 12 projects were selected for a total of 8.5 million {cur}. The full list with amounts is available at the district office and will be posted in each neighbourhood concerned before {d2}."},
        ],
    },
    "prefecture": {
        "fr": [
            {"cat": "Eau", "title": "Coupure d’eau programmée à {nb} et alentours le {d1}", "summary": "La société des eaux interrompt la distribution de 22 h à 5 h pour raccorder une nouvelle conduite. Stockez de l’eau.", "body": "L’interruption concerne {nb} et les quartiers voisins dans la nuit du {d1}. Le retour à la normale peut prendre jusqu’à 6 h le matin, avec une eau parfois trouble les premières heures. Camions-citernes disponibles au centre de santé en cas de besoin."},
            {"cat": "Santé", "title": "Campagne de vaccination rougeole-rubéole du {d1} au {d2}", "summary": "Vaccination gratuite des enfants de 9 mois à 5 ans dans tous les centres de santé de la région.", "body": "La campagne régionale se déroule du {d1} au {d2}. Aucun frais. Des équipes mobiles passent dans les marchés et les écoles. Apportez le carnet de vaccination s’il existe ; sinon un nouveau carnet est remis."},
            {"cat": "Inondations", "title": "Plan pluies {year} : zones à risque et points de repli", "summary": "La région publie la carte des zones inondables et les sites d’accueil en cas de crue.", "body": "Les quartiers de {nb} et des berges figurent en zone rouge. Les sites de repli sont les écoles et centres communautaires listés dans le plan, disponible au bureau régional et dans les mairies. Un numéro d’alerte gratuit est activé pendant la saison."},
            {"cat": "Routes", "title": "Axe {area}–périphérie : travaux nocturnes jusqu’au {d2}", "summary": "Réfection de chaussée par tronçons de nuit pour limiter les embouteillages. Circulation alternée.", "body": "Les travaux ont lieu de 21 h à 5 h jusqu’au {d2}. Une voie reste ouverte en circulation alternée. Les transporteurs sont invités à éviter l’axe entre 21 h et minuit. Le calendrier par tronçon est affiché au bureau régional."},
            {"cat": "Emploi", "title": "Programme jeunes {year} : 600 places de formation", "summary": "La région ouvre 600 places en formation professionnelle courte. Inscriptions jusqu’au {d2}.", "body": "Filières : électricité, plomberie, couture industrielle, maintenance moto, agroalimentaire. Conditions : 18–35 ans, résidence dans la région. Dossier à déposer au bureau régional ou dans les mairies avant le {d2}. Sélection publiée le mois suivant."},
            {"cat": "Élevage", "title": "Campagne de vaccination du bétail du {d1} au {d2}", "summary": "Vaccination gratuite des bovins, ovins, caprins et volailles dans les parcs et marchés à bétail de la région.", "body": "Les équipes vétérinaires passent dans chaque commune selon le calendrier affiché en mairie. Amenez les animaux tôt le matin. Un carnet de vaccination est remis par troupeau. Signalez toute mortalité inhabituelle au service régional de l’élevage."},
            {"cat": "Foncier", "title": "Opération de sécurisation foncière à {nb}", "summary": "Recensement des occupants et délivrance d’attestations pour les parcelles de {nb}. Passage des équipes du {d1} au {d2}.", "body": "Les équipes passeront maison par maison avec un badge officiel. Aucun paiement n’est demandé pendant le recensement. Les contestations sont reçues au bureau régional dans les 30 jours suivant l’affichage des listes."},
        ],
        "en": [
            {"cat": "Water", "title": "Planned water cut in {nb} and surroundings on {d1}", "summary": "The water company interrupts supply from 10 pm to 5 am to connect a new main. Store water.", "body": "The interruption affects {nb} and neighbouring areas on the night of {d1}. Normal supply may take until 6 am to resume, with cloudy water for the first hours. Water tankers are available at the health centre if needed."},
            {"cat": "Health", "title": "Measles-rubella vaccination campaign {d1} to {d2}", "summary": "Free vaccination of children aged 9 months to 5 years at every health centre in the county.", "body": "The county campaign runs from {d1} to {d2}. No fees. Mobile teams visit markets and schools. Bring the vaccination card if you have one; otherwise a new card is issued."},
            {"cat": "Flooding", "title": "{year} rains plan: risk zones and safe sites", "summary": "The county publishes the flood-risk map and the reception sites in case of flooding.", "body": "{nb} and the riverside settlements are in the red zone. Safe sites are the schools and community halls listed in the plan, available at the county office and sub-county offices. A free alert line is active during the season."},
            {"cat": "Roads", "title": "{area} ring road: night works until {d2}", "summary": "Resurfacing in night-time sections to limit traffic jams. One lane open each way.", "body": "Works run from 9 pm to 5 am until {d2}. One lane stays open under traffic control. Transporters are asked to avoid the road between 9 pm and midnight. The section schedule is posted at the county office."},
            {"cat": "Employment", "title": "{year} youth programme: 600 training places", "summary": "The county opens 600 places in short vocational courses. Applications until {d2}.", "body": "Courses: electrical, plumbing, industrial tailoring, motorcycle maintenance, food processing. Eligibility: 18–35, resident in the county. Apply at the county office or any sub-county office before {d2}. Selection published the following month."},
            {"cat": "Livestock", "title": "Livestock vaccination campaign {d1} to {d2}", "summary": "Free vaccination of cattle, sheep, goats and poultry at the county’s livestock markets and holding grounds.", "body": "Veterinary teams visit each sub-county on the schedule posted at the ward office. Bring animals early in the morning. A vaccination card is issued per herd. Report unusual deaths to the county livestock office."},
            {"cat": "Land", "title": "Land regularisation exercise in {nb}", "summary": "Census of occupants and issue of certificates for plots in {nb}. Teams visit from {d1} to {d2}.", "body": "Teams go house to house with an official badge. No payment is requested during the census. Objections are received at the county office within 30 days of the lists being posted."},
        ],
    },
    "governor": {
        "fr": [
            {"cat": "Énergie", "title": "Délestage : programme national de la semaine du {d1}", "summary": "La compagnie d’électricité publie les créneaux de coupure par zone. {area} : deux créneaux de trois heures.", "body": "Le programme couvre la semaine du {d1}. {nb} et les quartiers voisins sont coupés le mardi de 8 h à 11 h et le jeudi de 14 h à 17 h. Le programme peut changer en cas d’incident ; la version à jour est publiée chaque lundi."},
            {"cat": "Examens", "title": "Examens nationaux {year} : calendrier et centres", "summary": "Les dates des examens de fin de cycle sont fixées. Les convocations sont disponibles dans les établissements à partir du {d1}.", "body": "Les épreuves se déroulent du {d1} au {d2}. La liste des centres d’examen est affichée dans chaque école et sur cette page. Aucun frais n’est exigé pour retirer une convocation. Les résultats seront publiés en ligne et affichés dans les centres."},
            {"cat": "Impôts", "title": "Taxe professionnelle : échéance reportée au {d2}", "summary": "Les petites entreprises ont jusqu’au {d2} pour déclarer sans pénalité. Déclaration possible par téléphone.", "body": "Le report concerne les entreprises dont le chiffre d’affaires est inférieur au seuil. La déclaration se fait au centre des impôts ou par le service téléphonique gratuit. Un reçu est remis pour chaque paiement."},
            {"cat": "Identité", "title": "Carte d’identité nationale : nouveaux centres d’enrôlement", "summary": "Trois centres ouvrent à {area}, dont un à {nb}. Enrôlement gratuit sur rendez-vous.", "body": "Les centres ouvrent le {d1}. Pièces : acte de naissance ou jugement supplétif, certificat de résidence. L’enrôlement est gratuit. Toute demande de paiement doit être signalée. Délai de délivrance annoncé : 60 jours."},
            {"cat": "Élections", "title": "Révision des listes électorales du {d1} au {d2}", "summary": "Les nouveaux majeurs et les personnes ayant déménagé peuvent s’inscrire ou se transférer. Centres ouverts 7 j/7.", "body": "La révision se fait dans les centres d’enrôlement de chaque commune. Apportez une pièce d’identité. Les listes provisoires seront affichées 15 jours pour réclamation. Aucun frais n’est exigé."},
            {"cat": "Agriculture", "title": "Engrais subventionné : inscriptions des producteurs jusqu’au {d2}", "summary": "Les producteurs de maïs, riz et maraîchage peuvent s’inscrire pour l’engrais subventionné auprès des services agricoles. Quota par hectare déclaré.", "body": "L’inscription se fait au service agricole de la préfecture ou via les coopératives agréées avant le {d2}. Pièces : pièce d’identité, déclaration de superficie. Le prix subventionné est affiché ; tout dépassement doit être signalé. Distribution prévue trois semaines après la clôture."},
            {"cat": "Santé", "title": "Alerte sanitaire : cas de choléra signalés, mesures de prévention", "summary": "Des cas ont été confirmés dans deux régions. Consignes : eau traitée, lavage des mains, consultation rapide en cas de diarrhée.", "body": "Le ministère rappelle les mesures : boire de l’eau traitée ou bouillie, se laver les mains au savon, se rendre immédiatement au centre de santé en cas de diarrhée aqueuse. La prise en charge est gratuite dans les centres publics. Bilan mis à jour chaque semaine."},
        ],
        "en": [
            {"cat": "Energy", "title": "Load shedding: national schedule for the week of {d1}", "summary": "The power company publishes outage windows by zone. {area}: two three-hour windows.", "body": "The schedule covers the week of {d1}. {nb} and neighbouring areas are off on Tuesday 8–11 am and Thursday 2–5 pm. The schedule may change after incidents; the current version is published every Monday."},
            {"cat": "Exams", "title": "{year} national examinations: timetable and centres", "summary": "End-of-cycle exam dates are set. Candidate slips are available in schools from {d1}.", "body": "Papers run from {d1} to {d2}. The list of exam centres is posted in every school and on this page. No fee may be charged to collect a candidate slip. Results will be published online and posted at the centres."},
            {"cat": "Tax", "title": "Business levy: deadline extended to {d2}", "summary": "Small businesses have until {d2} to file without penalty. Filing possible by phone.", "body": "The extension applies to businesses below the turnover threshold. File at the tax office or through the free phone service. A receipt is issued for every payment."},
            {"cat": "Identity", "title": "National ID card: new enrolment centres", "summary": "Three centres open in {area}, one of them in {nb}. Free enrolment by appointment.", "body": "The centres open on {d1}. Documents: birth certificate or affidavit, proof of residence. Enrolment is free. Any request for payment should be reported. Announced issue time: 60 days."},
            {"cat": "Elections", "title": "Voter register review from {d1} to {d2}", "summary": "New adults and people who have moved can register or transfer. Centres open 7 days a week.", "body": "The review takes place at the enrolment centres of each ward. Bring an ID. Provisional lists will be posted for 15 days for objections. No fees are charged."},
            {"cat": "Agriculture", "title": "Subsidised fertiliser: farmer registration until {d2}", "summary": "Maize, rice and vegetable growers can register for subsidised fertiliser with the agricultural extension office. Quota per declared hectare.", "body": "Register at the district agricultural office or through accredited cooperatives before {d2}. Documents: ID, declaration of area farmed. The subsidised price is posted; any overcharge should be reported. Distribution starts three weeks after registration closes."},
            {"cat": "Health", "title": "Health alert: cholera cases reported, prevention measures", "summary": "Cases have been confirmed in two regions. Advice: treated water, hand washing, seek care quickly for diarrhoea.", "body": "The ministry reminds everyone: drink treated or boiled water, wash hands with soap, go to the health centre immediately for watery diarrhoea. Treatment is free at public facilities. The tally is updated weekly."},
        ],
    },
}

# ---------------------------------------------------------------------------
# Resident comments, office replies, perspectives, feedback drafts.
# ---------------------------------------------------------------------------
COMMENTS = {
    "fr": [
        "Merci pour l’information. Est-ce que {nb} est concerné aussi ou seulement le centre ?",
        "Chez nous à {nb}, rien n’a changé depuis l’annonce. Qui peut-on appeler ?",
        "Bonne initiative. Il faudrait aussi afficher cela à la radio communautaire pour ceux qui n’ont pas internet.",
        "La date indiquée tombe un jour de marché. Beaucoup de femmes ne pourront pas venir.",
        "Je confirme, les équipes sont passées ce matin à {nb}. Travail propre.",
        "Quel est le numéro à appeler si on constate un problème après les travaux ?",
        "On nous a demandé de payer 2 000 {cur} alors que l’avis dit que c’est gratuit. À qui signaler ?",
        "Le lien vers le document officiel ne s’ouvre pas sur mon téléphone.",
        "Est-ce que les horaires s’appliquent aussi le samedi ?",
        "Très clair, merci. Je partage dans le groupe WhatsApp du quartier.",
        "Pourquoi {nb} n’apparaît jamais dans les zones prioritaires ? On paie les mêmes taxes.",
        "La dernière fois, l’annonce disait 30 jours et ça a pris trois mois. On attend de voir.",
        "Merci au bureau d’avoir répondu à notre question de la semaine dernière.",
        "Il manque le nom du responsable à contacter. Un avis sans contact ne sert à rien.",
        "Question : est-ce que les personnes âgées peuvent être servies à domicile ?",
        "Ma mère à {nb} n’a pas pu se faire enrôler, on lui a dit de revenir dans un mois.",
        "C’est la troisième fois que cette date est reportée.",
        "Peut-on avoir la version en éwé ou en mina pour les anciens du quartier ?",
        "L’avis est daté mais la carte affichée au bureau est ancienne.",
        "Bravo, enfin une information claire avec les montants exacts.",
        "Les camions sont passés mais seulement dans les grandes rues, pas dans les ruelles de {nb}.",
        "Est-ce qu’il y aura un compte rendu écrit après la réunion ?",
        "Le centre de santé de {nb} n’avait pas les vaccins hier matin.",
        "Merci. Pouvez-vous préciser si les frais de dossier sont remboursables ?",
    ],
    "en": [
        "Thanks for the update. Does this cover {nb} as well or only the town centre?",
        "Here in {nb} nothing has changed since the announcement. Who do we call?",
        "Good move. Please also announce this on community radio for people without internet.",
        "The date given is a market day. Many women will not be able to attend.",
        "Confirmed, the teams came through {nb} this morning. Clean work.",
        "What number do we call if there is a problem after the works?",
        "We were asked to pay {cur} 500 even though the notice says it is free. Who do we report this to?",
        "The link to the official document does not open on my phone.",
        "Do the opening hours also apply on Saturdays?",
        "Very clear, thank you. Sharing in the {nb} WhatsApp group.",
        "Why is {nb} never in the priority zones? We pay the same rates.",
        "Last time the notice said 30 days and it took three months. Let’s see.",
        "Thank you to the office for answering our question from last week.",
        "The name of the responsible officer is missing. A notice without a contact is useless.",
        "Question: can elderly residents be served at home?",
        "My mother in {nb} could not enrol; she was told to come back in a month.",
        "This is the third time this date has been moved.",
        "Can we get a version in Kiswahili or Dagbani for the elders in the area?",
        "The notice is dated but the map posted at the office is old.",
        "Well done, finally clear information with exact amounts.",
        "The trucks came but only on the main roads, not the lanes in {nb}.",
        "Will there be written minutes after the meeting?",
        "{nb} health centre had no vaccines yesterday morning.",
        "Thanks. Can you clarify whether the processing fee is refundable?",
    ],
}

OFFICE_REPLIES = {
    "fr": [
        ("Corriger un détail factuel", "Précision : la date de fin indiquée dans l’avis est le {d2}, et non le {d1}. L’avis a été corrigé."),
        ("Ajouter du contexte à un commentaire", "Les ruelles de {nb} seront couvertes dans la deuxième phase, qui démarre après le {d2}. Le calendrier détaillé sera affiché au bureau."),
        ("Partager une source", "Le procès-verbal de la réunion est disponible au bureau et sera joint à cette fiche. Référence : PV-{ref}."),
        ("Ajouter du contexte à un commentaire", "Aucun frais n’est exigé pour ce service. Tout agent demandant un paiement doit être signalé avec son numéro de badge."),
        ("Corriger un détail factuel", "Le montant correct est {amount} {cur} par mois, pas par semaine. Merci au résident qui l’a signalé."),
        ("Ajouter du contexte à un commentaire", "Le retard vient d’une livraison de matériel attendue le {d1}. Une nouvelle date sera publiée ici dès confirmation."),
        ("Partager une source", "La liste des centres est jointe à l’avis. Version imprimée disponible dans chaque mairie annexe."),
        ("Ajouter du contexte à un commentaire", "Une version en langues locales est en préparation avec la radio communautaire ; diffusion prévue la semaine du {d2}."),
    ],
    "en": [
        ("Correct a factual detail", "Correction: the end date in the notice is {d2}, not {d1}. The notice has been amended."),
        ("Add context to a comment", "The lanes in {nb} are covered in phase two, which starts after {d2}. The detailed schedule will be posted at the office."),
        ("Share a source", "The minutes of the meeting are available at the office and will be attached to this record. Reference: MIN-{ref}."),
        ("Add context to a comment", "No fee is charged for this service. Any officer requesting payment should be reported with their badge number."),
        ("Correct a factual detail", "The correct amount is {cur} {amount} per month, not per week. Thanks to the resident who flagged it."),
        ("Add context to a comment", "The delay is due to a materials delivery expected on {d1}. A new date will be published here once confirmed."),
        ("Share a source", "The list of centres is attached to the notice. Printed copies are available at every sub-office."),
        ("Add context to a comment", "A local-language version is being prepared with community radio; broadcast planned for the week of {d2}."),
    ],
}

PERSPECTIVES = {
    "fr": [
        ("Vendeurs du marché", "Les travaux tombent en pleine période de rentrée, quand les ventes sont les plus fortes. Un accès piéton garanti est indispensable."),
        ("Parents d’élèves", "Les enfants traversent cette zone pour aller à l’école. Il faut des passages sécurisés pendant les travaux."),
        ("Personnes âgées", "Les files d’attente sont trop longues pour les anciens. Une file prioritaire ou un service à domicile aiderait."),
        ("Transporteurs", "La déviation ajoute 20 minutes par trajet. Les tarifs ne peuvent pas être augmentés sans avis officiel."),
        ("Agents de santé communautaire", "Nous pouvons relayer l’information porte à porte si le bureau nous fournit les affiches."),
        ("Femmes du quartier", "Les horaires du soir posent un problème de sécurité sur le chemin du retour ; l’éclairage doit suivre."),
        ("Jeunes de {nb}", "Nous demandons que les emplois de chantier soient proposés d’abord aux jeunes du quartier."),
    ],
    "en": [
        ("Market traders", "The works fall in the back-to-school period, when sales are highest. Guaranteed pedestrian access is essential."),
        ("Parents", "Children cross this area on the way to school. Safe crossings are needed during the works."),
        ("Elderly residents", "The queues are too long for older people. A priority line or home service would help."),
        ("Transport operators", "The diversion adds 20 minutes per trip. Fares cannot be raised without an official notice."),
        ("Community health workers", "We can relay the information door to door if the office gives us the posters."),
        ("Women of the neighbourhood", "Evening hours raise a safety problem on the way home; street lighting must keep up."),
        ("Youth of {nb}", "We ask that site jobs be offered first to young people from the neighbourhood."),
    ],
}

FEEDBACK_DRAFTS = {
    "fr": [
        "Bonjour, je souhaite savoir à quelle date exacte les travaux annoncés commenceront à {nb} et qui est le responsable à contacter en cas de problème.",
        "Nous demandons au bureau de publier la liste des bénéficiaires et les montants, comme promis dans l’avis du {d1}.",
        "Merci pour l’avis. Pouvez-vous confirmer que le service est gratuit et indiquer où signaler un agent qui demande un paiement ?",
        "Les habitants de {nb} demandent une réunion publique avant le démarrage, avec un compte rendu écrit affiché au quartier.",
        "Question : les personnes sans acte de naissance peuvent-elles quand même s’inscrire ? Quelle est la procédure ?",
    ],
    "en": [
        "Hello, I would like to know the exact date the announced works will start in {nb} and who to contact if there is a problem.",
        "We ask the office to publish the list of beneficiaries and the amounts, as promised in the notice of {d1}.",
        "Thank you for the notice. Can you confirm the service is free and say where to report an officer who asks for payment?",
        "Residents of {nb} request a public meeting before the start, with written minutes posted in the neighbourhood.",
        "Question: can people without a birth certificate still register? What is the procedure?",
    ],
}

GROUP_POSTS = {
    "fr": [
        "Quelqu’un à {nb} a-t-il reçu l’avis ? Chez nous rien n’est affiché.",
        "On se retrouve samedi matin au marché pour préparer nos questions au bureau. Qui vient ?",
        "J’ai posé la question au bureau la semaine dernière, toujours pas de réponse. Je relance ici pour que ce soit visible.",
        "Pour info : le service m’a dit que la date est repoussée de deux semaines. À confirmer par écrit.",
        "Est-ce que quelqu’un connaît le montant exact ? On m’a donné deux chiffres différents.",
        "Merci à ceux qui ont partagé le document. Je l’ai lu, la partie sur {nb} n’est pas claire.",
        "Proposition : on rédige une seule question commune et on la dépose ensemble.",
        "Nouveau ici. Même situation que vous à {nb}. Comment ça s’est passé pour vous ?",
    ],
    "en": [
        "Has anyone in {nb} received the notice? Nothing is posted where we are.",
        "Meeting Saturday morning at the market to prepare our questions for the office. Who is coming?",
        "I asked the office last week, still no answer. Raising it here so it stays visible.",
        "FYI: the service told me the date moves by two weeks. To be confirmed in writing.",
        "Does anyone know the exact amount? I was given two different figures.",
        "Thanks to those who shared the document. I read it; the part about {nb} is not clear.",
        "Proposal: we write one common question and submit it together.",
        "New here. Same situation as you in {nb}. How did it go for you?",
    ],
}

MONTHS = {"fr": ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."], "en": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}


def fmt_date(dt: datetime, lang: str) -> str:
    return f"{dt.day} {MONTHS[lang][dt.month - 1]} {dt.year}"


def seed(app: dict[str, Any]) -> None:
    """Populate the app module's in-memory stores. ``app`` is app.globals()."""
    rng = random.Random(SEED)
    now = datetime.now(timezone.utc)
    create_user = app["create_user"]
    register_notice = app["register_notice"]
    community_key = app["community_key"]
    COUNTRY_CONTEXTS = app["COUNTRY_CONTEXTS"]
    FIXTURE_RECORD_OFFICE = app["FIXTURE_RECORD_OFFICE"]

    def iso(dt: datetime) -> str:
        return min(dt, now - timedelta(minutes=rng.randint(5, 240))).isoformat(timespec="seconds")

    def rand_dt(start_days_ago: int, end_days_ago: int = 0) -> datetime:
        delta = rng.uniform(end_days_ago, start_days_ago)
        return now - timedelta(days=delta, hours=rng.uniform(0, 12))

    # Demo accounts: one per role, work in every country.
    create_user("resident", DEMO_PASSWORD, "Demo resident", "resident", user_id="resident-demo")
    create_user("organizer", DEMO_PASSWORD, "Demo community organizer", "organizer", user_id="organizer-demo")
    create_user("office", DEMO_PASSWORD, "Demo representative office", "office", user_id="office-demo")

    for country, cfg in COUNTRIES.items():
        lang = cfg["lang"]
        context = COUNTRY_CONTEXTS[country]
        reps = {rep["id"]: rep for rep in context["representatives"]}
        fill = lambda text, **kw: text.format(area=cfg["locality"], cur=cfg["currency"], year=now.year, **kw)

        # --- Accounts: residents, organizers, one office account per level
        residents: list[dict[str, Any]] = []
        used = set()
        for _ in range(rng.randint(38, 52)):
            first, last = rng.choice(cfg["first"]), rng.choice(cfg["last"])
            base = f"{first}.{last}".lower().replace("’", "").replace("'", "").replace("-", "")
            username = base if base not in used else f"{base}{rng.randint(2, 99)}"
            used.add(username)
            role = "organizer" if rng.random() < 0.12 else "resident"
            user = create_user(username, DEMO_PASSWORD, f"{first} {last}", role, country, rng.choice(cfg["areas"]))
            profession_index = rng.randrange(len(PROFESSIONS[lang]))
            user["profession"] = PROFESSIONS[lang][profession_index]
            interests = list(PROFESSION_INTERESTS[profession_index])
            if rng.random() < 0.4:
                interests.append(rng.choice(["flooding", "elections", "budget", "permits", "safety", "services"]))
            user["interests"] = [topic for topic in interests if topic not in interests[:interests.index(topic)]]
            user["created_at"] = iso(rand_dt(200, 5))
            residents.append(user)
        office_users = {}
        for level, username in cfg["offices"].items():
            office_users[level] = create_user(username, DEMO_PASSWORD, reps[level]["display_name"], "office", country, cfg["locality"], office_id=level)

        # --- Published notices: ~10–14 per office, spread over six months
        for level, rep in reps.items():
            topics = TOPICS[level][lang]
            count = rng.randint(10, 14)
            for i in range(count):
                topic = topics[i % len(topics)]
                # Every office has something from the last few days, then a long tail.
                published = rand_dt(3, 0.2) if i == 0 else rand_dt(12, 3) if i == 1 else rand_dt(180, 8)
                d1 = published + timedelta(days=rng.randint(3, 20))
                d2 = d1 + timedelta(days=rng.randint(7, 45))
                nb = rng.choice(cfg["areas"])
                kw = dict(nb=nb, d1=fmt_date(d1, lang), d2=fmt_date(d2, lang), office=rep["display_name"])
                notice = {
                    "id": f"notice-{uuid.UUID(int=rng.getrandbits(128)).hex[:10]}",
                    "title": fill(topic["title"], **kw), "headline": fill(topic["title"], **kw),
                    "category": topic["cat"], "locality": cfg["locality"], "region": cfg["region"], "country": country,
                    "office": rep["display_name"], "responsible_office": rep["name"],
                    "summary": fill(topic["summary"], **kw), "body": fill(topic["body"], **kw),
                    "source_url": "/publisher", "source": rep["display_name"],
                    "published_at": iso(published), "date": fmt_date(published, lang) + published.strftime(" · %H:%M UTC"),
                    "status": "Published", "published_by": office_users[level]["display_name"],
                }
                register_notice(notice, use_model=False)

        # --- Community activity on every record of this country
        records = list(context["records"]) + [app["RECORDS"][n["id"]] for n in app["PUBLISHED_NOTICES"] if n.get("country") == country]
        for record in records:
            key = community_key(country, record["id"])
            is_notice = record["id"].startswith("notice-")
            base_dt = datetime.fromisoformat(next((n["published_at"] for n in app["PUBLISHED_NOTICES"] if n["id"] == record["id"]), iso(rand_dt(150, 30))))
            nb = rng.choice(cfg["areas"])
            # comments
            n_comments = rng.choice([1, 1, 2, 2, 3, 3, 4, 5, 6, 8]) if is_notice else rng.randint(4, 9)
            items = []
            for template in rng.sample(COMMENTS[lang], min(n_comments, len(COMMENTS[lang]))):
                author = rng.choice(residents)
                items.append({"id": uuid.UUID(int=rng.getrandbits(128)).hex[:10], "user_id": author["id"], "user_label": author["display_name"], "type": "Community comment", "message": fill(template, nb=rng.choice([nb, author["locality"]])), "status": "Published for review", "created_at": iso(base_dt + timedelta(days=rng.uniform(0.1, 20)))})
            items.sort(key=lambda item: item["created_at"], reverse=True)
            if items:
                app["COMMENTS"][key] = items
            # votes
            voters = rng.sample(residents, min(len(residents), rng.randint(3, 34) if is_notice else rng.randint(18, 40)))
            helpful_share = rng.uniform(0.45, 0.92)
            votes = {}
            for voter in voters:
                choice = ["helpful"] if rng.random() < helpful_share else ["needs-clarity"]
                if rng.random() < 0.08:
                    choice = ["helpful", "needs-clarity"]
                votes[voter["id"]] = choice
            app["VOTES"][key] = votes
            # perspectives
            for label, body in rng.sample(PERSPECTIVES[lang], rng.choice([0, 0, 1, 1, 2])):
                author = rng.choice(residents)
                app["PERSPECTIVES"].setdefault(key, []).append({"id": uuid.UUID(int=rng.getrandbits(128)).hex[:10], "user_id": author["id"], "user_label": author["display_name"], "label": fill(label, nb=nb), "body": fill(body, nb=nb), "submitted": True, "created_at": iso(base_dt + timedelta(days=rng.uniform(0.5, 25)))})
            # feedback drafts
            for template in rng.sample(FEEDBACK_DRAFTS[lang], rng.choice([0, 0, 0, 1, 1, 2])):
                draft = fill(template, nb=nb, d1=fmt_date(base_dt, lang))
                author = rng.choice(residents)
                app["FEEDBACK"].append({"id": uuid.UUID(int=rng.getrandbits(128)).hex[:10], "user_id": author["id"], "user_label": author["display_name"], "record_id": record["id"], "record_title": record["title"], "original": draft, "draft": draft, "perspective": "Community question", "language": "Français" if lang == "fr" else "English", "country": country, "status": "Draft saved — not yet sent", "created_at": iso(base_dt + timedelta(days=rng.uniform(1, 30)))})

        # --- Office replies (right of reply), 6–12 per office
        for level, rep in reps.items():
            author = office_users[level]
            replies = []
            for kind, template in rng.sample(OFFICE_REPLIES[lang], rng.randint(6, 8)) + rng.sample(OFFICE_REPLIES[lang], rng.randint(0, 4)):
                dt = rand_dt(170, 1)
                replies.append({"id": uuid.UUID(int=rng.getrandbits(128)).hex[:10], "type": kind, "message": fill(template, nb=rng.choice(cfg["areas"]), d1=fmt_date(dt + timedelta(days=5), lang), d2=fmt_date(dt + timedelta(days=19), lang), ref=f"{now.year}-{rng.randint(100, 999)}", amount=rng.choice([500, 1000, 1500, 2500])), "status": "Submitted for review", "created_at": iso(dt), "user_id": author["id"], "user_label": author["display_name"]})
            replies.sort(key=lambda item: item["created_at"], reverse=True)
            app["REP_RESPONSES"][app["response_key"](country, level)] = replies

        # --- Group posts: for every topic some residents in this country care about
        topics_here = sorted({topic for u in residents for topic in u.get("interests", [])})
        for topic in topics_here:
            members = [u for u in residents if topic in u.get("interests", [])]
            for template in rng.sample(GROUP_POSTS[lang], min(len(GROUP_POSTS[lang]), rng.choice([1, 2, 3, 4, 6]))):
                author = rng.choice(members)
                anonymous = rng.random() < 0.3
                label = (f"Un·e résident·e de {author['locality']}" if lang == "fr" else f"A resident of {author['locality']}") if anonymous else author["display_name"]
                app["GROUP_POSTS"].setdefault(f"{country}|{topic}", []).append({"id": uuid.UUID(int=rng.getrandbits(128)).hex[:10], "user_id": author["id"], "user_label": label, "anonymous": anonymous, "message": fill(template, nb=rng.choice(cfg["areas"])), "created_at": iso(rand_dt(60, 0.5))})
        for key in list(app["GROUP_POSTS"]):
            app["GROUP_POSTS"][key].sort(key=lambda item: item["created_at"], reverse=True)

        # --- Shares
        for _ in range(rng.randint(25, 40)):
            record = rng.choice(records)
            author = rng.choice(residents)
            app["SHARES"].append({"id": uuid.UUID(int=rng.getrandbits(128)).hex[:10], "user_id": author["id"], "user_label": author["display_name"], "target_type": "source", "target_title": record["title"], "channel": rng.choice(["WhatsApp", "WhatsApp", "SMS", "Copy link", "Community group"]), "status": "Share recorded", "created_at": iso(rand_dt(150, 1))})

    app["FEEDBACK"].sort(key=lambda item: item["created_at"], reverse=True)
    app["SHARES"].sort(key=lambda item: item["created_at"], reverse=True)
    # Newest notices first in every feed
    app["PUBLISHED_NOTICES"].sort(key=lambda n: n["published_at"], reverse=True)
    order = {n["id"]: i for i, n in enumerate(app["PUBLISHED_NOTICES"])}
    for feed in (app["NEWS"], app["ISSUES"]):
        feed.sort(key=lambda item: order.get(item.get("id"), 10**6))
