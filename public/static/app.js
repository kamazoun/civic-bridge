const state = {
  productName: "Civic Bridge",
  records: [],
  issues: [],
  representatives: [],
  news: [],
  localities: [],
  locations: [],
  countryContexts: {},
  publishedNotices: [],
  dashboard: { metrics: [], languages: [], area: "", region: "", country: "" },
  feedback: [],
  recordId: null,
  view: "home",
  tab: "overview",
  draft: null,
  repLevel: "All levels",
  issueFilter: "All issues",
  recordsShown: 12,
  newsLanguage: "English",
  locationCountry: "",
  locationRegion: "",
  locationLocality: "",
  repId: null,
  repResponses: {},
  repStats: null,
  askUnknown: null,
  feedbackLoadedFor: null,
  groups: [],
  groupTopic: null,
  group: null,
  sessionId: (() => { try { return localStorage.getItem("civic-bridge-session") || (localStorage.setItem("civic-bridge-session", Math.random().toString(36).slice(2)), localStorage.getItem("civic-bridge-session")); } catch (error) { return "anon"; } })(),
  followedRepresentatives: new Set(),
  user: null,
  community: {},
  shareTarget: null,
  pendingAction: null,
  publisherNoticeIds: new Set(),
  explainMode: "text",
  explainBusy: false,
  explainTitleDraft: "",
  translation: null,
  preferences: { name: "", description: "", interests: [], understood: "", age: "", mode: "", language: "" },
  aiStatus: null,
  aiStatusDismissed: false,
  voicesLoaded: false,
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

function uiLang() {
  const country = state.dashboard.country || state.locationCountry || "";
  const known = state.countryContexts[country]?.language_code;
  if (known) return known;
  return country === "Togo" || country === "Côte d’Ivoire" ? "fr" : "en";
}

function t(key, ...args) {
  const table = STRINGS[uiLang()] || STRINGS.en;
  const value = key in table ? table[key] : STRINGS.en[key];
  if (value === undefined) return key;
  return typeof value === "function" ? value(...args) : value;
}

// Small "?" that explains a term on hover / focus. Texts live in HELP (EN/FR).
function help(key) {
  const text = (HELP[uiLang()] || HELP.en)[key];
  return text ? `<span class="help" tabindex="0" role="note" aria-label="${esc(text)}"><i>?</i><span class="help-box">${esc(text)}</span></span>` : "";
}
const HELP = {
  en: {
    published_notice: "A notice an office published on the Public Information Portal. It is exactly what the office wrote — not checked by anyone else — and the office that published it is named on the record.",
    reference_record: "One of five hand-written example records per country (water, road, clinic, school, power), included so the app can be explored before any office has published. They are labelled illustrative.",
    for_you: "The three records most relevant to your profile, if you set one in Settings. Ranking is a fixed, published points table; each record explains its points. Order changes, never what you can see.",
    everything: "Every record for your area, newest first: notices published by offices plus the reference records.",
    offices: "The levels of government for your country, from your ward or commune up to the national level. Each office has a public page: its notices, its replies, and how often it answers.",
    records_on_file: "Notices and records attributed to this office: what it has published, plus the reference records in its remit.",
    sourced: "Records backed by an actual published document, as opposed to the illustrative reference records.",
    response_rate: "Office replies divided by questions residents asked on its records (comments, perspectives, saved drafts). Computed live; nothing is entered by hand.",
    community_pulse: "Share of votes on this office's records that said “helpful” rather than “needs clarity”.",
    unknowns: "Sentences in the source that leave something open — a date, a place, an amount. Each one is a button: it becomes a question addressed to the office responsible.",
    not_verified: "The record shows what the office published, word for word. Civic Bridge does not check it against other sources — it makes it readable and questionable.",
    understood: "The app's reading of what you typed, turned into topics from a fixed list. It is a guess: remove or add topics; your edit always wins. Nothing sensitive is kept.",
    groups: "A group is everyone in your country whose profile lists the same topic. You see a count and a conversation, never a member list.",
    anonymous: "Posts as “A resident of <your area> (<your first topic>)”. Your account is never attached to the post.",
    voice: "Not an assistant: nothing talks back. One button reads the record aloud (your phone's own voices), the other turns your spoken words into text in the box. Your question still goes to a human office.",
    questions: "Questions residents sent to this office through the record. They are public, so the office's answer — or its silence — is visible to everyone. The office replies with its right of reply.",
    home: "Your front page. Top: the records most relevant to you. Right: the offices responsible in your area. Below: everything on the record for your area, newest first.",
    public_view: "You are reading without an account. Everything is visible; sign in only when you want to ask an office, comment, vote or join a group.",
    office_view: "You are signed in as an office. You can answer residents' questions on your office's page and publish notices on the portal.",
    resident_view: "You are signed in as a resident. You can ask offices, comment, vote and join groups — under your name or anonymously.",
    levels: "The levels of government that exist in this country, from the most local to the national. Every record is attributed to one of them.",
    plain_language: "The record's content rewritten in plain words. It never replaces the source: the original passage is always shown beside it.",
    translate: "Translation into a local language by the model running on this server. Machine translation, not reviewed — the original is one click away.",
    facts: "What the source actually states. Taken from the text, never added.",
    perspectives: "How the same record looks to different people — traders, parents, elderly residents. Residents can add their own.",
    next_step: "Where this record can go: a question addressed to the office responsible, sent from the Feedback tab.",
    source_record: "The original passage and where it comes from. Illustrative for the reference records; the published notice itself for notices.",
    votes: "Two independent buttons: Helpful and Needs clarity. They feed the office's community pulse. One vote each, per account.",
    lands_on: "How many people in your country have this record's topic in their profile — and the group where they talk about it.",
    feedback_tab: "Write or say your question. The draft is built from the record and your words; you send it to the office responsible, publicly.",
    perspective: "Whose point of view your question speaks from. It only shapes the wording of the draft.",
    note_language: "The language of your question and of the draft.",
    structured_draft: "A draft built from the source and your words, by the local model or a template. Read it, edit it, then send it. Nothing is sent until you press Send.",
    addressed: "The office this record is attributed to. Your question is published on the record and on that office's page.",
    focus: "The office's stated remit — what it is responsible for.",
    public_record: "Live figures computed from activity on this platform: notices, questions, replies, votes. Nothing is entered by hand.",
    right_of_reply: "Where an office account answers residents publicly. The original question or comment stays visible; every reply is labelled as the office's.",
    track_record: "The same figures as sentences, so they can be read aloud or repeated.",
    responses: "Everything this office has answered, newest first.",
    group_conversation: "Posts by people who share this topic in your country. Sign in to post, with your name or anonymously.",
    group_records: "Every record in your area on this topic, newest first.",
    my_questions: "The questions you sent, the office each one is addressed to, and whether that office has replied since. Questions are public; this page is just your list.",
    settings: "Who you are, in your words; the app shows what it understood and you correct it. This changes the order of what you see, never what you can see.",
    age: "Adds a small life-stage weight to the ranking (jobs and ID at 18–29, land and permits at 30–44, health at 60+). It never restricts anything.",
    mode: "Whether a record opens as text or offers to read itself aloud.",
    language: "Pre-selects the translation language on records and the voice used to read them.",
    location: "Your country decides the institutions, the language and the notices you see. Detected from the browser or chosen on the map; nothing is stored beyond the name of the area.",
    accounts: "Accounts need a username and a password, nothing else. Reading never needs one; asking, commenting, voting and groups do.",
    explain: "Any document — pasted text, a link or a PDF — becomes a record with the same structure: plain language, what it says, what it does not say. Labelled as submitted by you, not verified.",
    representatives: "The offices for your area, one per level of government, with live figures on how they publish and answer.",
    timeline: "What has happened with this record and what is still pending, as the source states it.",
    tab_evidence: "Evidence: the source beside its explanation, what it says and what it does not say.",
    tab_feedback: "Feedback: write or say your question and send it to the office responsible.",
    tab_representative: "Representative: the office this record is attributed to, and its public page.",
  },
  fr: {
    published_notice: "Un avis qu’un bureau a publié sur le portail d’information publique. C’est exactement ce que le bureau a écrit — vérifié par personne d’autre — et le bureau émetteur est nommé sur la fiche.",
    reference_record: "L’une des cinq fiches d’exemple rédigées à la main par pays (eau, route, centre de santé, école, électricité), présentes pour explorer l’application avant toute publication. Elles sont marquées « illustratives ».",
    for_you: "Les trois fiches les plus pertinentes pour votre profil, si vous en avez défini un dans Paramètres. Le classement est une table de points fixe et publiée ; chaque fiche explique ses points. L’ordre change, jamais ce que vous pouvez voir.",
    everything: "Toutes les fiches de votre zone, du plus récent au plus ancien : les avis publiés par les bureaux plus les fiches de référence.",
    offices: "Les niveaux de gouvernement de votre pays, de votre commune ou quartier jusqu’au niveau national. Chaque bureau a une page publique : ses avis, ses réponses, et sa fréquence de réponse.",
    records_on_file: "Avis et fiches attribués à ce bureau : ce qu’il a publié, plus les fiches de référence de son ressort.",
    sourced: "Fiches appuyées par un document réellement publié, par opposition aux fiches de référence illustratives.",
    response_rate: "Réponses du bureau divisées par les questions posées par les résidents sur ses fiches (commentaires, points de vue, brouillons). Calculé en direct ; rien n’est saisi à la main.",
    community_pulse: "Part des votes sur les fiches de ce bureau qui ont dit « utile » plutôt que « manque de clarté ».",
    unknowns: "Les phrases de la source qui laissent quelque chose en suspens — une date, un lieu, un montant. Chacune est un bouton : elle devient une question adressée au bureau responsable.",
    not_verified: "La fiche montre ce que le bureau a publié, mot pour mot. Civic Bridge ne le vérifie pas auprès d’autres sources — il le rend lisible et interrogeable.",
    understood: "La lecture que fait l’application de ce que vous avez tapé, traduite en thèmes d’une liste fixe. C’est une hypothèse : retirez ou ajoutez des thèmes ; votre correction l’emporte toujours. Rien de sensible n’est conservé.",
    groups: "Un groupe, c’est toutes les personnes de votre pays dont le profil mentionne le même thème. Vous voyez un nombre et une conversation, jamais une liste de membres.",
    anonymous: "Publie en tant que « Un·e résident·e de <votre zone> (<votre premier thème>) ». Votre compte n’est jamais attaché au message.",
    voice: "Pas un assistant : rien ne vous répond. Un bouton lit la fiche à voix haute (les voix de votre téléphone), l’autre transforme vos mots dits en texte dans le champ. Votre question va toujours à un bureau humain.",
    questions: "Les questions que les résidents ont envoyées à ce bureau via la fiche. Elles sont publiques : la réponse du bureau — ou son silence — est visible de tous. Le bureau répond par son droit de réponse.",
    home: "Votre page d’accueil. En haut : les fiches les plus pertinentes pour vous. À droite : les bureaux responsables de votre zone. En bas : tout ce qui est au dossier pour votre zone, du plus récent au plus ancien.",
    public_view: "Vous consultez sans compte. Tout est visible ; connectez-vous seulement pour interroger un bureau, commenter, voter ou rejoindre un groupe.",
    office_view: "Vous êtes connecté·e en tant que bureau. Vous pouvez répondre aux questions des résidents sur la page de votre bureau et publier des avis sur le portail.",
    resident_view: "Vous êtes connecté·e en tant que résident·e. Vous pouvez interroger les bureaux, commenter, voter et rejoindre des groupes — sous votre nom ou anonymement.",
    levels: "Les niveaux de gouvernement qui existent dans ce pays, du plus local au national. Chaque fiche est attribuée à l’un d’eux.",
    plain_language: "Le contenu de la fiche réécrit en mots simples. Cela ne remplace jamais la source : le passage original est toujours affiché à côté.",
    translate: "Traduction vers une langue locale par le modèle qui tourne sur ce serveur. Traduction automatique, non relue — l’original est à un clic.",
    facts: "Ce que la source affirme réellement. Tiré du texte, jamais ajouté.",
    perspectives: "Comment la même fiche se présente pour différentes personnes — commerçants, parents, aînés. Les résidents peuvent ajouter la leur.",
    next_step: "Où cette fiche peut mener : une question adressée au bureau responsable, envoyée depuis l’onglet Retour.",
    source_record: "Le passage original et sa provenance. Illustratif pour les fiches de référence ; l’avis publié lui-même pour les avis.",
    votes: "Deux boutons indépendants : Utile et Manque de clarté. Ils alimentent la participation communautaire du bureau. Un vote chacun, par compte.",
    lands_on: "Combien de personnes de votre pays ont le thème de cette fiche dans leur profil — et le groupe où elles en parlent.",
    feedback_tab: "Écrivez ou dites votre question. Le brouillon est construit à partir de la fiche et de vos mots ; vous l’envoyez au bureau responsable, publiquement.",
    perspective: "Le point de vue depuis lequel votre question parle. Cela n’influence que la formulation du brouillon.",
    note_language: "La langue de votre question et du brouillon.",
    structured_draft: "Un brouillon construit à partir de la source et de vos mots, par le modèle local ou un gabarit. Lisez-le, modifiez-le, puis envoyez-le. Rien n’est envoyé avant d’appuyer sur Envoyer.",
    addressed: "Le bureau auquel cette fiche est attribuée. Votre question est publiée sur la fiche et sur la page de ce bureau.",
    focus: "Les attributions déclarées du bureau — ce dont il est responsable.",
    public_record: "Chiffres calculés en direct à partir de l’activité sur cette plateforme : avis, questions, réponses, votes. Rien n’est saisi à la main.",
    right_of_reply: "Là où un compte de bureau répond publiquement aux résidents. La question ou le commentaire d’origine reste visible ; chaque réponse est étiquetée comme celle du bureau.",
    track_record: "Les mêmes chiffres en phrases, pour être lus à voix haute ou répétés.",
    responses: "Tout ce que ce bureau a répondu, du plus récent au plus ancien.",
    group_conversation: "Les messages des personnes qui partagent ce thème dans votre pays. Connectez-vous pour écrire, sous votre nom ou anonymement.",
    group_records: "Toutes les fiches de votre zone sur ce thème, du plus récent au plus ancien.",
    my_questions: "Les questions que vous avez envoyées, le bureau à qui chacune est adressée, et s’il a répondu depuis. Les questions sont publiques ; cette page n’est que votre liste.",
    settings: "Qui vous êtes, avec vos mots ; l’application montre ce qu’elle a compris et vous corrigez. Cela change l’ordre de ce que vous voyez, jamais ce que vous pouvez voir.",
    age: "Ajoute une petite pondération d’étape de vie au classement (emploi et pièces d’identité à 18–29 ans, foncier et permis à 30–44, santé à 60+). Cela ne restreint jamais rien.",
    mode: "Si une fiche s’ouvre en texte ou propose de se lire à voix haute.",
    language: "Présélectionne la langue de traduction des fiches et la voix qui les lit.",
    location: "Votre pays détermine les institutions, la langue et les avis que vous voyez. Détecté par le navigateur ou choisi sur la carte ; rien n’est conservé au-delà du nom de la zone.",
    accounts: "Un compte demande un identifiant et un mot de passe, rien d’autre. Lire n’en demande jamais ; interroger, commenter, voter et les groupes, oui.",
    explain: "Tout document — texte collé, lien ou PDF — devient une fiche de même structure : langage simple, ce qu’il dit, ce qu’il ne dit pas. Marquée comme soumise par vous, non vérifiée.",
    representatives: "Les bureaux de votre zone, un par niveau de gouvernement, avec des chiffres en direct sur ce qu’ils publient et ce qu’ils répondent.",
    timeline: "Ce qui s’est passé pour cette fiche et ce qui reste en attente, tel que la source l’indique.",
    tab_evidence: "Preuves : la source à côté de son explication, ce qu’elle dit et ce qu’elle ne dit pas.",
    tab_feedback: "Retour : écrivez ou dites votre question et envoyez-la au bureau responsable.",
    tab_representative: "Représentant : le bureau auquel cette fiche est attribuée, et sa page publique.",
  },
};

function statusLabel(status) {
  const map = { "Sent to office": "status_sent_to_office", "Open question": "status_open_question", "Needs update": "status_needs_update", "Published locally": "status_published_locally", "New public update": "status_new_public_update" };
  return map[status] ? t(map[status]) : status;
}

function applyStaticChrome() {
  document.documentElement.lang = uiLang();
  document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = t(element.dataset.i18n); });
  document.title = `${state.productName} · ${t("app_title_suffix")}`;
}

const STRINGS = {
  en: {
    app_title_suffix: "Civic information",
    badge_trusted: "Trusted civic information",
    sidebar_eyebrow: "CIVIC INFORMATION",
    sidebar_tagline: "One source. Clear meaning. A path to respond.",
    nav_overview: "Overview",
    nav_issues: "Issues",
    nav_representatives: "Representatives",
    nav_news: "News & alerts",
    nav_channels: "Access channels",
    nav_groups: "People like you",
    groups_eyebrow: "PEOPLE THIS LANDS ON",
    groups_title: "The same issue, the same place, the same situation.",
    groups_body: "A group is everyone in your country whose profile lists the same topic. Compare notes, ask what others were told, prepare one common question — with your name or without it.",
    groups_mine_eyebrow: "YOUR GROUPS · FROM YOUR PROFILE",
    groups_all_eyebrow: "ALL GROUPS IN YOUR COUNTRY",
    groups_no_profile: "Tell us what you do in Settings and your groups appear here. Browsing stays open to everyone either way.",
    groups_loading: "Loading…",
    group_members: (n) => `${n} member${n === 1 ? "" : "s"}`,
    group_posts: (n) => `${n} post${n === 1 ? "" : "s"}`,
    group_from_profile: "from your profile",
    groups_privacy_note: "Groups show a member count, never a member list. Posting anonymously shows only your topic and locality; your account is never attached to the post, and no phone number is ever linked to it.",
    back_to_groups: "← Back to groups",
    group_eyebrow: "GROUP",
    group_intro: (n, country) => `${n} people in ${country} have this topic in their profile.`,
    group_localities: (list) => `Where they are: ${list}`,
    group_members_label: "members",
    group_not_in_profile: "This topic is not in your profile — you can still read and post.",
    group_posts_eyebrow: "CONVERSATION",
    group_posts_title: "What people in this situation are saying.",
    group_post_label: "Ask or share something with the group",
    group_post_placeholder: "Did anyone else get this notice? What were you told?",
    group_post_button: "Post to the group",
    group_no_posts: "No posts yet. Start the conversation.",
    group_records_eyebrow: "RECORDS FOR THIS GROUP",
    group_records_title: "What is on the record for this topic.",
    group_records_body: "Every notice and record in your area that concerns this topic, newest first.",
    group_no_records: "No records on this topic in your area yet.",
    lands_on_eyebrow: "WHO ELSE THIS LANDS ON",
    lands_on_body: (n, topic, area) => `${n} people in your country list ${topic} in their profile. You are not working this out alone.`,
    lands_on_body_unknown: (topic) => `People whose profile lists ${topic} see this record first too.`,
    open_group_arrow: "Open the group →",
    nav_feedback: "My questions",
    sidebar_saved_records: "Latest records",
    sidebar_all_records: (n) => `All ${n} records →`,
    sidebar_review_title: "Review before sharing",
    sidebar_review_body: "Your words stay yours.",
    sidebar_empty_records: "Choose an area to load saved records.",
    sign_in: "Sign in to participate",
    open_account_menu: "Open account menu",
    // Auth / account modals
    modal_participation: "PARTICIPATION",
    modal_choose_account: "Sign in to take part",
    modal_choose_account_body: "Comments, votes, follows and office replies are tied to an account so residents and offices can see who said what.",
    modal_local_account_note: "Accounts are stored on this Civic Bridge server. No e-mail, no external sign-in.",
    auth_tab_login: "Sign in",
    auth_tab_register: "Create an account",
    auth_username: "Username",
    auth_password: "Password",
    auth_display_name: "Name shown on your comments",
    auth_role: "I am a…",
    auth_submit_login: "Sign in",
    auth_submit_register: "Create my account",
    auth_quick_title: "Or try a demo account",
    auth_quick_note: "One click, shared with other visitors — good for a first look.",
    auth_failed: "Sign-in failed.",
    auth_session_expired: "Your session has expired. Sign in again.",
    toast_account_created: (name) => `Welcome, ${name}. Your account is ready.`,
    close: "Close",
    account_resident_label: "Resident account",
    account_resident_role: "Resident",
    account_organizer_label: "Community organizer account",
    account_organizer_role: "Community organizer",
    account_office_label: "Representative office account",
    account_office_role: "Representative office",
    modal_account_eyebrow: "ACCOUNT",
    account_menu_body: (role) => `${role} · Your comments, votes and replies are saved on the server under this account.`,
    sign_out: "Sign out",
    toast_user_selected: (label) => `${label} selected.`,
    toast_signed_out: "Signed out.",
    toast_rep_unfollowed: "Representative removed from your watchlist.",
    toast_rep_followed: "Representative added to your watchlist.",
    // Share modal
    modal_share_eyebrow: "SHARE A SOURCE",
    modal_share_title: "Choose a channel",
    modal_share_body: "The source label and plain-language context travel with the share. No message is sent outside this browser.",
    share_source_backed: (area) => `Source-backed link · ${area}`,
    your_area: "your area",
    share_whatsapp_desc: "Send to a WhatsApp-style conversation",
    share_sms_desc: "Open a short-message simulation",
    share_group_desc: "Post to a moderated local group",
    share_copy_desc: "Copy a reviewable source link",
    modal_share_footnote: "Share activity is saved locally for this session.",
    toast_share_recorded: (channel) => `Share to ${channel} recorded.`,
    toast_link_copied: "Link copied.",
    toast_share_opening: (channel) => `Opening ${channel}…`,
    sidebar_portal_title: "Office side: Public Information Portal ↗",
    sidebar_portal_note: "Where offices publish the notices you see here.",
    toast_share_failed: "Share could not be saved.",
    civic_update_fallback: "Civic Bridge update",
    representative_profile: "Representative profile",
    civic_source_fallback: "Civic source",
    // Community panel
    community_pulse_eyebrow: "COMMUNITY PULSE",
    community_pulse_title: "Did this explanation help?",
    community_signal: "Community signal",
    community_pulse_intro: "Vote after reading the source. Add a short comment so other residents can see what remains unclear.",
    vote_helpful: "Helpful",
    vote_needs_clarity: "Needs more clarity",
    add_public_comment: "Add a public comment",
    comment_placeholder: "What should the next update answer?",
    add_comment: "Add comment",
    auth_required_note: "Sign in to vote, comment, or share.",
    community_comments_eyebrow: "COMMUNITY COMMENTS",
    community_comments_empty: "No comments yet. Be the first to add a source-backed question.",
    toast_vote_saved: "Your community pulse vote is saved.",
    toast_comment_added: "Comment added to the community record.",
    toast_comment_required: "Add a short comment first.",
    toast_vote_failed: "Vote could not be saved.",
    toast_comment_failed: "Comment could not be saved.",
    // Map
    map_pick_country_label: "Interactive map for choosing a country",
    map_pick_country_loading: "Map tiles are loading. Choose a country from the list below.",
    // Role banners
    role_public_eyebrow: "PUBLIC VIEW",
    role_public_title: "Read the latest records for your area.",
    role_public_body: "Sign in when you want to follow an office, vote, comment, or share.",
    role_office_eyebrow: "OFFICE WORKSPACE",
    role_office_title: "Monitor commitments and answer public questions.",
    role_office_body: "Review open issues, publish updates, and add context to the public record.",
    role_office_button: "Open office profile",
    role_organizer_eyebrow: "COMMUNITY ORGANIZER VIEW",
    role_organizer_title: "Coordinate trusted updates across your area.",
    role_organizer_body: "See community signals, open questions, and the channels people use to receive information.",
    role_organizer_button: "Manage access channels",
    role_resident_eyebrow: "RESIDENT VIEW",
    role_resident_title: "Follow decisions and make your question visible.",
    role_resident_body: "Read the source, choose a representative, and respond in your own words.",
    role_resident_button: "Review issues",
    // Subscription
    modal_subscription_confirmed: "SUBSCRIPTION CONFIRMED",
    modal_subscribed_title: "You’re subscribed",
    subscription_body: (channel, area, contact) => `${channel} updates for <strong>${area}</strong> will be sent to <strong>${contact}</strong>.`,
    next_update_eyebrow: "NEXT UPDATE",
    next_update_body: "Source, plain-language summary, and what to do next",
    subscription_change_note: "You can change this subscription from Access channels.",
    done: "Done",
    toast_contact_required: "Enter a phone number or email address first.",
    // Home
    home_eyebrow: "YOUR CIVIC DESK",
    home_title: "Stay close to the decisions shaping your area.",
    home_body_no_area: "Choose your country, region, and locality to load the records and representative offices relevant to you.",
    location_set: "LOCATION SET",
    location_needed: "LOCATION NEEDED",
    change_location: "Change location",
    choose_location: "Choose location",
    metric_location: "Location",
    metric_location_detail: "Choose your area to begin",
    metric_representatives: "Representatives",
    metric_representatives_detail: "Loaded after area selection",
    metric_issues: "Issues",
    metric_issues_detail: "Records follow your area",
    metric_languages: "Languages",
    metric_languages_detail: "Available translations",
    metric_open_questions: "Open questions",
    metric_open_questions_office_detail: "Awaiting an office response",
    metric_commitments: "Commitments",
    metric_commitments_detail: "Published by this office",
    metric_response_rate: "Response rate",
    metric_response_rate_detail: "Questions answered",
    metric_pending_review: "Pending review",
    metric_pending_review_detail: "Updates to verify",
    metric_open_questions_area_detail: "Across your area",
    metric_community_pulse: "Community pulse",
    metric_community_pulse_detail: "Recent feedback signal",
    metric_channels: "Channels",
    metric_channels_detail: "Web, radio, SMS, WhatsApp",
    metric_sources_checked: "Sources checked",
    metric_sources_checked_detail: "With provenance attached",
    your_area_eyebrow: "YOUR AREA",
    area_view_eyebrow: "WHO IS RESPONSIBLE · LEVELS OF GOVERNMENT HERE",
    choose_area_see_map: "Choose an area to see your map",
    change_area_arrow: "Change area →",
    choose_area_arrow: "Choose area →",
    watchlist_eyebrow: "THE OFFICES",
    watchlist_title: "Who you can address",
    view_all_arrow: "View all →",
    watchlist_empty: "Choose an area to load the representative hierarchy.",
    view_all_issues_arrow: "View all issues →",
    language_access_eyebrow: "LANGUAGE ACCESS",
    language_access_title: "One source, more ways to understand it.",
    explore_channels_arrow: "Explore access channels →",
    source_pipeline_eyebrow: "SOURCE PIPELINE",
    source_pipeline_title: "What the workspace keeps separate",
    pipeline_source_found: "Source found",
    pipeline_meaning_checked: "Meaning checked",
    pipeline_community_response: "Community response",
    pipeline_delivery_verified: "Delivery verified",
    toast_now_watching: (area) => `Now watching ${area}.`,
    // Records / search
    no_matching_record: "No matching record yet. Try a different question.",
    record_count: (n) => `${n} record${n === 1 ? "" : "s"}`,
    // Area required state
    choose_area_first_title: "Choose your area first.",
    choose_area_first_body: "Set a country, region, and locality so the issues, representatives, and public updates match where you live.",
    // Issues
    issue_tracker_eyebrow: "ISSUE TRACKER",
    issue_tracker_title: "Everything on the record for your area.",
    issue_tracker_body: "Newest first. Notices published by the offices and the reference records, each with its source and the office responsible.",
    issues_near: (n, area) => `${n} issues near ${area}`,
    source_labelled_records: "Source-labelled records for this area",
    filter_all_issues: "Everything",
    latest_eyebrow: "LATEST",
    show_more_records: (n, left) => `Show ${n} more (${left} remaining)`,
    filter_notices: "Published notices",
    filter_reference: "Reference records",
    status_open_question: "Open question",
    status_sent_to_office: "Sent to the office",
    status_needs_update: "Needs update",
    status_published_locally: "Published locally",
    status_new_public_update: "New public update",
    updated_label: (date) => `Updated ${date}`,
    open_evidence_arrow: "Open evidence →",
    view_source_note_arrow: "View source note →",
    toast_source_note: "Source note opened in the full issue workflow.",
    // Representatives
    rep_map_eyebrow: "REPRESENTATIVE MAP",
    rep_map_title: "Choose who to follow.",
    rep_map_body: "Move through the country-specific offices that may be responsible for an issue. Each office has a public trail with commitments and updates.",
    area_eyebrow: "AREA",
    change_area: "Change area",
    representative_level: "Representative level",
    offices_in_view: (n) => `${n} office${n === 1 ? "" : "s"} in this view`,
    follow: "Follow",
    following: "Following",
    public_focus_eyebrow: "PUBLIC FOCUS",
    stat_commitments: "records on file",
    stat_verified: "sourced",
    stat_response_rate: "response rate",
    no_activity_yet: "No activity yet",
    last_update_label: (date) => `Last update ${date}`,
    open_public_profile_arrow: "Open public profile →",
    hierarchy_scale_eyebrow: "HOW THE MAP SCALES",
    hierarchy_scale_title: "One area, several levels of responsibility.",
    hierarchy_scale_body: "A resident can start with a locality and move through the institutions used in the selected country. The source trail stays visible at every level.",
    // Locations
    set_area_eyebrow: "SET YOUR AREA",
    set_area_title: "Start with where you are.",
    set_area_body: "Choose a country, region, and locality so Civic Bridge can show the right issues and representative offices. You can change this later.",
    location_stays_note: "Location stays in this demo",
    location_permission_note: "Browser location is never requested without consent",
    location_map_eyebrow: "LOCATION MAP",
    pick_a_country: "Pick a country",
    live_map: "Live map",
    map_caption: "OpenStreetMap view · select a marker or use the country list",
    recommended_starting_area: "Recommended starting area",
    available_area: "Available area",
    civic_desk_eyebrow: "YOUR CIVIC DESK",
    choose_place_title: "Choose the place you want to follow.",
    choose_place_body: "The location sets the initial representative hierarchy and the local records shown on your dashboard.",
    use_my_location: "Use my location",
    use_my_location_note: "Only after you give permission",
    or_choose_manually: "or choose manually",
    country_label: "Country",
    region_label: "Region / province",
    locality_label: "Locality, ward, or address",
    locality_placeholder: "Type your locality or address",
    selected_area_eyebrow: "SELECTED AREA",
    choose_a_locality: "Choose a locality",
    set_this_area: "Set this area",
    location_disclaimer: "Production note: location permission, address lookup, and representative boundaries would come from approved services. This prototype uses fictional records.",
    toast_requesting_location: "Requesting location permission…",
    toast_location_unavailable: "Location is unavailable here. Choose your area manually.",
    toast_location_found_other: (country) => `Location found in ${country}. Choose an available area manually.`,
    toast_location_found: (country) => `Location found in ${country}. Review it, then set this area.`,
    toast_location_failed: "We could not resolve that location. Choose your area manually.",
    toast_location_denied: "Location permission was not granted. Choose your area manually.",
    // Representative detail
    back_to_representatives: "← Back to representatives",
    office_level_suffix: (level) => `${level} office`,
    follow_office: "Follow office",
    share_profile: "Share profile",
    public_profile_verified: "✓ Public profile",
    stat_card_commitments: "Records on file",
    stat_card_commitments_detail: "attributed to this office",
    stat_card_verified: "Sourced",
    stat_card_verified_detail: "backed by a published document",
    stat_card_response_rate: "Response rate",
    stat_card_response_rate_detail: "office replies per question received",
    stat_card_community_pulse: "Community pulse",
    stat_card_community_pulse_detail: "helpful votes on its records",
    public_record_eyebrow: "PUBLIC RECORD",
    public_record_title: "What the office has put on the record.",
    activity_statistics: "Activity statistics",
    public_record_body: "Computed live from activity on this platform: published notices, office replies, resident questions and votes. Nothing here is entered by hand.",
    bar_commitments_evidence: "Records with a source document",
    bar_questions_answered: "Questions answered",
    bar_community_pulse: "Community pulse",
    list_last_update: "Last update",
    list_questions_received: "Questions received",
    list_updates_issued: "Updates issued",
    list_office_replies: "Office replies",
    right_of_reply_eyebrow: "RIGHT OF REPLY",
    right_of_reply_title: "Let the office add context.",
    right_of_reply_body: "A representative can correct a detail or explain a decision. The original community comment stays visible, and every reply is labelled.",
    response_type_label: "Response type",
    response_type_correct: "Correct a factual detail",
    response_type_context: "Add context to a comment",
    response_type_source: "Share a source",
    office_response_label: "Office response",
    office_response_placeholder: "Add a short, source-linked response for residents to review...",
    submit_response: "Submit response for review",
    response_disclaimer: "This stays local and is marked “Submitted for review.”",
    responses_on_file_eyebrow: "RESPONSES ON FILE",
    office_response_fallback: "Office response",
    no_response_yet: "No office response yet. The original record remains visible.",
    office_only_reply: "Only a signed-in representative office account can post a reply here. Residents can comment on any record.",
    toast_response_required: "Add a short response before submitting.",
    toast_response_saved: "Response saved locally and marked for review.",
    toast_response_failed: "Response could not be saved.",
    // News
    news_eyebrow: "NEWS & ALERTS",
    news_title: "See the update. Check the source.",
    news_body: "Public notices, project briefs, and service updates stay connected to their original record.",
    updates_count: (n) => `${n} updates`,
    last_checked: (date) => `Last checked ${date}`,
    language_preview_eyebrow: "LANGUAGE PREVIEW",
    read_in_your_language: "Read the summary in your language",
    subscribe_area_alerts: "Subscribe to area alerts",
    available_in: (languages) => `Available in ${languages}`,
    original_summary: "Original summary",
    translation_preview: (lang) => `Translation preview · ${lang}`,
    share_source: "Share source",
    trust_check_eyebrow: "TRUST CHECK",
    trust_check_title: "Forward the source, not the rumour.",
    trust_check_body: "Every update carries its source label, date, and what remains unconfirmed. Translation makes the message easier to understand; it does not change the evidence.",
    // Channels hub
    access_channels_eyebrow: "ACCESS CHANNELS",
    access_channels_title: "Same evidence, different ways in.",
    access_channels_body: "Choose the channel that fits the connection, device, and language available to you.",
    low_bandwidth_ready: "Low-bandwidth ready",
    audio_sms_whatsapp_web: "Audio, SMS, WhatsApp, and web",
    channel_web_title: "Web workspace",
    channel_web_body: "Search an issue, read the source beside a plain-language explanation, and follow the responsible office.",
    channel_web_detail: "For smartphones, computers, and shared devices",
    channel_audio_title: "Radio + basic phone",
    channel_audio_body: "Hear a short audio summary through community radio or a keypad phone, then record a question in your own words.",
    channel_audio_detail: "For shared radios, feature phones, and low data",
    channel_text_title: "WhatsApp / SMS",
    channel_text_body: "Receive the source label, a translated summary, and the next update through a lightweight text exchange.",
    channel_text_detail: "For intermittent connectivity and group sharing",
    subscribe_locality_eyebrow: "SUBSCRIBE TO A LOCALITY",
    subscribe_locality_title: (area) => `Receive updates for ${area}.`,
    subscribe_locality_body: "Subscriptions are saved in this browser session. A production version would connect to an approved WhatsApp, SMS, or IVR provider.",
    voice_call: "Voice call",
    channel_field_label: "Channel",
    contact_field_label: "Phone or email",
    area_field_label: "Area",
    subscribe: "Subscribe",
    toast_subscription_saved: "Subscription saved for this area.",
    language_access_title2: "Start with what people already speak.",
    original_source_language: "Original source language",
    translation_pathway: "Translation pathway",
    whatsapp_community_eyebrow: "WHATSAPP COMMUNITY",
    whatsapp_community_title: "Join the local updates group.",
    whatsapp_community_body: "Scan to receive source-labelled notices and discuss what needs clarification.",
    open_whatsapp_invite: "Open WhatsApp invite",
    discord_community_eyebrow: "DISCORD COMMUNITY",
    discord_community_title: "Join the civic builders network.",
    discord_community_body: "Share translation ideas, accessibility feedback, and public data questions.",
    open_discord_invite: "Open Discord invite",
    toast_whatsapp_ready: "WhatsApp invite ready to open.",
    toast_discord_ready: "Discord invite ready to open.",
    toast_map_note: "The map connects localities to public records.",
    // Record detail
    back_to_records: "← Back to records",
    tab_evidence: "Evidence",
    tab_feedback: "Feedback",
    tab_representative: "Representative",
    tab_channels: "Channels",
    // Overview tab
    plain_language_eyebrow: "IN PLAIN LANGUAGE",
    what_source_says: "What the source says",
    what_we_cannot_confirm: "What the source does not say — click one to ask",
    ask_office_about_this: "Turn this into a question for the responsible office",
    ask_office_arrow: (office) => `Ask ${office} →`,
    addressed_to: (office) => `Your question will be addressed to: ${office}.`,
    addressed_to_eyebrow: "ADDRESSED TO",
    asking_about: (question) => `Open question from the source: “${question}”`,
    source_record_eyebrow: "SOURCE RECORD",
    evidence_open_question: "Open question",
    evidence_verified: "Verified",
    evidence_published: "Published by the office",
    evidence_submitted: "Submitted by you",
    evidence_illustrative: "Illustrative",
    record_available_review: "This record is available for review.",
    different_priorities_eyebrow: "DIFFERENT PRIORITIES",
    different_priorities_title: "People can share a source without having the same need.",
    different_priorities_body: "The tool keeps each perspective visible instead of flattening the discussion into a score.",
    next_step_eyebrow: "NEXT STEP",
    next_step_title: "Ask a question that can be followed up.",
    next_step_body: "Move from an unclear announcement to a source, a specific question, and a visible response path.",
    draft_feedback_arrow: "Draft feedback →",
    // Feedback tab
    your_words_first_eyebrow: "YOUR WORDS FIRST",
    your_words_first_title: "Your question, in your words — typed or spoken.",
    your_words_first_body: "Say or type what you want to know. The draft that follows is a starting point: read it, change it, then send it to the office. No machine answers it.",
    audio_access: "Listen and speak",
    audio_access_detail: " · for low literacy, low light, busy hands",
    use_sample: "▶ Use sample",
    voice_caption: "The record is read aloud by your phone; your spoken words go into the box below, nowhere else.",
    perspective_label: "Which perspective is closest?",
    community_question: "Community question",
    language_of_note_label: "Language of your note",
    your_words_label: "Your words",
    your_words_placeholder: "Write the question you want the responsible office to answer...",
    create_reviewable_draft: "Create reviewable draft",
    clear: "Clear",
    structured_draft_label: "STRUCTURED DRAFT · EDIT BEFORE SHARING",
    prepared_by_ollama: "Prepared by a local Ollama model",
    prepared_by_fallback: "Prepared by the local fallback",
    save_draft: "Save draft",
    send_to_office: (office) => `Send to ${office}`,
    send_note: "Your question is published on this record and on the office's page, so its answer — or its silence — is public.",
    toast_question_sent: (office) => `Sent to ${office}. It is now on the record.`,
    questions_to_office_eyebrow: (office) => `QUESTIONS TO ${office}`,
    no_questions_yet: "No question has been sent to the office about this record yet.",
    ask_the_office_arrow: "Ask the office →",
    questions_received_eyebrow: "QUESTIONS RECEIVED",
    no_questions_received: "No question received yet.",
    reply_to_this: "Reply to this →",
    re_prefix: "Re:",
    office_replied: "Office replied since",
    awaiting_reply: "Awaiting the office's reply",
    sent_anonymously: "sent anonymously",
    sign_in_to_see_questions: "Sign in to see the questions you sent.",
    community_view_eyebrow: "COMMUNITY VIEW",
    community_view_title: "Keep agreement and difference visible.",
    community_view_body: "A useful summary shows what is shared, what is unanswered, and where priorities differ.",
    shared_facts: "Shared facts",
    open_questions: "Open questions",
    different_priorities_col: "Different priorities",
    community_view_disclaimer: "The tool helps clarify the disagreement. It does not decide who is right.",
    toast_transcript_added: "Sample transcript added. Review it before creating the draft.",
    toast_draft_created: "Draft created. Check the wording before saving.",
    drafting: "Preparing draft… (local AI can take a few seconds)",
    toast_draft_saved: "Draft saved — not yet sent.",
    // Representative tab (per-record)
    timeline_eyebrow: "PUBLIC RECORD TIMELINE",
    timeline_title: "Follow the decision after the announcement.",
    timeline_body: "A proposal, an update, and a verified delivery are different things. The timeline keeps those states separate.",
    accountability_check_eyebrow: "ACCOUNTABILITY CHECK",
    current_status: "Current status",
    accountability_note: "The record does not claim completion until a source confirms it.",
    resident_can_request: "What a resident can request",
    request_dated_update: "A dated next update",
    request_responsible_office: "The responsible office",
    request_evidence: "Evidence of delivery",
    // Channels tab (per-record)
    one_source_three_ways: "ONE SOURCE · THREE WAYS IN",
    meet_people_title: "Meet people where connectivity allows.",
    meet_people_body: "The evidence stays the same even when the channel changes. This is a lightweight preview for the demo.",
    channel_web_short: "Web",
    channel_audio_short: "Radio + basic phone",
    channel_text_short: "WhatsApp / SMS",
    text_only_preview: "TEXT-ONLY PREVIEW",
    bubble_question_plan: "What is planned for this record?",
    bubble_source_says: (text, source) => `The source says: ${text} Source: ${source}.`,
    bubble_question_unanswered: "What is still unanswered?",
    design_promise_eyebrow: "DESIGN PROMISE",
    design_promise_title: "Same evidence, less friction.",
    design_promise_body: "A person should not need a high-bandwidth device or specialist vocabulary to find the source and ask a useful question.",
    // Feedback list
    my_feedback_eyebrow: "MY QUESTIONS",
    my_feedback_title: "What you asked,<br />and who owes an answer.",
    my_feedback_body: "Every question you sent, the office it is addressed to, and whether that office has replied since.",
    saved_drafts_count: (n) => `${n} question${n === 1 ? "" : "s"} sent`,
    nothing_sent_note: "Questions are public on the record and on the office's page",
    no_drafts_yet: "No question sent yet. Open a record, click what the source does not say, and send it to the office.",
    // Boot / errors
    open_through_server_title: "Open Civic Bridge through the local server",
    // Explain a source
    nav_explain: "Explain a source",
    explain_eyebrow: "EXPLAIN A SOURCE",
    explain_title: "Point the tool at a real document.",
    explain_body: "Paste text, paste a link, or upload a PDF. The tool builds the same source-linked explanation you see on every other record — original excerpt, plain-language rewrite, and open questions — and marks it clearly as submitted by you.",
    explain_mode_text: "Paste text",
    explain_mode_url: "Paste a link",
    explain_mode_pdf: "Upload a PDF",
    explain_title_label: "Title (optional)",
    explain_title_placeholder: "e.g. Market road resurfacing notice",
    explain_text_label: "Source text",
    explain_text_placeholder: "Paste the notice, brief, or announcement text here…",
    explain_url_label: "Document link",
    explain_url_placeholder: "https://example.gov/notice.html",
    explain_pdf_label: "PDF file",
    explain_pdf_hint: "Extraction is best-effort and works fully offline — no file leaves this computer except to this local server. If a PDF can't be read, paste its text instead.",
    explain_submit: "Explain this source",
    explain_submitting: "Reading the source…",
    explain_disclaimer: "Nothing here is verified against a live government feed. The record is clearly labelled as submitted by you, just like a local publisher notice.",
    explain_no_file: "Choose a PDF file first.",
    toast_explain_success: "Source explained — review the draft below.",
    toast_network_error: "Could not reach the local server. Check it's still running.",
    // Audio avatar
    avatar_talk_button: "Say your question instead of typing",
    voice_read_button: "Read this record to me",
    avatar_listening: "Listening…",
    avatar_speaking: "Speaking…",
    avatar_unsupported: "Voice isn't supported in this browser — use the text box below instead.",
    avatar_heard: (text) => `Heard: “${text}”`,
    avatar_mic_denied: "Microphone permission was not granted.",
    // Personalization / profile
    profession_farmer: "Farmer / crop grower",
    profession_herder: "Cattle breeder / herder",
    profession_fisher: "Fisher",
    profession_vendor: "Market vendor",
    profession_butcher: "Butcher",
    profession_shopkeeper: "Shopkeeper / kiosk owner",
    profession_wholesaler: "Wholesaler / importer",
    profession_mason: "Mason / builder",
    profession_carpenter: "Carpenter",
    profession_electrician: "Electrician",
    profession_plumber: "Plumber",
    profession_tailor: "Tailor / seamstress",
    profession_hairdresser: "Hairdresser / barber",
    profession_mechanic: "Mechanic",
    profession_welder: "Welder / metalworker",
    profession_driver: "Taxi / moto-taxi driver",
    profession_transporter: "Transport operator / trucker",
    profession_health: "Nurse / community health worker",
    profession_pharmacist: "Pharmacist",
    profession_healer: "Traditional practitioner",
    profession_teacher: "Teacher",
    profession_student: "Student",
    profession_researcher: "Researcher / academic",
    profession_civil_servant: "Civil servant",
    profession_community_leader: "Community leader / chief",
    profession_journalist: "Journalist / radio presenter",
    profession_ngo: "NGO / association worker",
    profession_religious: "Religious leader",
    profession_business: "Small business owner",
    profession_investor: "Entrepreneur / investor",
    profession_engineer: "Civil engineer / architect",
    profession_lawyer: "Lawyer / paralegal",
    profession_accountant: "Accountant / bookkeeper",
    profession_it: "IT / digital worker",
    profession_public_company: "Public company manager",
    profession_homemaker: "Homemaker",
    profession_retired: "Retired",
    profession_jobseeker: "Job seeker",
    profession_other: "Other / prefer not to say",
    profession_group_0: "Agriculture & livestock",
    profession_group_1: "Trade & markets",
    profession_group_2: "Crafts & construction",
    profession_group_3: "Transport",
    profession_group_4: "Health",
    profession_group_5: "Education",
    profession_group_6: "Public & community",
    profession_group_7: "Business & professions",
    profession_group_8: "Home & other",
    recommended_eyebrow: "RECOMMENDED FOR YOU",
    matches_profile: "Matches your profile",
    sorted_for_profile: (profession) => `Sorted for ${profession}`,
    // Perspectives (resident-added)
    add_perspective_label: "Add your perspective",
    perspective_title_placeholder: "Short label, e.g. “Night-shift access”",
    perspective_body_placeholder: "What does this mean for you specifically?",
    submit_perspective: "Add perspective",
    submitted_by: (label) => `Submitted by ${label}`,
    toast_perspective_added: "Your perspective was added to the record.",
    toast_perspective_required: "Add a short label and description first.",
    // Representative track record
    track_record_eyebrow: "TRACK RECORD",
    track_record_title: "What this office has done over time.",
    track_record_entry_commitments: (n, date) => `${n} public record${n === 1 ? "" : "s"} on file · last activity: ${date}.`,
    track_record_entry_verified: (n, total) => `${n} of ${total} records are backed by a published source document.`,
    track_record_entry_replies: (replies, questions) => `${replies} office repl${replies === 1 ? "y" : "ies"} to ${questions} resident question${questions === 1 ? "" : "s"} on its records.`,
    track_record_entry_focus: (focus) => `Ongoing focus area: ${focus}.`,
    // Real local-language translation (via local Ollama)
    translate_label: "Read in",
    translating: "Translating…",
    translation_unavailable: "Translation needs a connected local Ollama model. See README for CIVIC_BRIDGE_OLLAMA_MODEL.",
    machine_translation_badge: "Machine translation via local Ollama — not yet reviewed.",
    show_original: "Show original",
    // Settings
    nav_settings: "Settings",
    settings_eyebrow: "SETTINGS",
    settings_title: "Make this yours.",
    settings_body: "You describe who you are; the app shows what it understood, and you correct it. That profile changes the order of what you see — never what you can see. Saved in this browser; when you sign in, your topics also travel with your account so your groups follow you.",
    settings_scope_note: "This applies to this browser on this device. Sign in and it stays with your local account here; without signing in, it still applies for this session.",
    settings_name_label: "Your name (optional)",
    settings_name_placeholder: "How should we address you?",
    settings_description_label: "Tell us what you do — or who you are filling this in for",
    settings_description_hint: "In any language, in your own words. For example: “I farm maize and sell at the market on Fridays” · “Je suis enseignante à l’école primaire” · “mo n ta ẹran ni ọja”.",
    settings_description_placeholder: "I sell tomatoes at the roadside and keep three goats…",
    understand_me: "Understand this",
    understood_eyebrow: "WHAT WE UNDERSTOOD",
    understood_note: "This is our guess. Remove or add topics below — your edit always wins. Nothing else is inferred, stored or learned from what you do on the platform.",
    show_first_eyebrow: "SO WE WILL SHOW YOU FIRST",
    remove_interest: "Remove",
    add_interest: "+ add a topic",
    clear_profile: "Clear my profile",
    understood_by_model: "Interpreted by the local model. Correct it if it is wrong.",
    understood_by_keywords: "No local model connected — interpreted by keyword matching. Correct it if it is wrong.",
    why_am_i_seeing_this: "Why am I seeing this here?",
    why_interest: (topic, points, words, understood) => `This record is about ${topic}. ${words ? `You told us ${words}, which we understood as “${understood}”, ` : `Your profile lists ${understood}, `}so ${topic} counts +${points}.`,
    why_age: (band, points) => `Your age band (${band}) adds +${points}: it changes order only, never what you can see.`,
    why_total: (total) => `Score: +${total}. Records with 0 simply keep their date order.`,
    why_fixed_weights: "The weights are a fixed, published table in the source code. We infer nothing behind your back and learn nothing from your behaviour.",
    why_correct_it: "We inferred this — correct it →",
    post_anonymously: (persona) => `Post anonymously, as “${persona}”`,
    settings_profession_text_label: "What do you do? (any language)",
    settings_profession_text_placeholder: "e.g. I sell fish at Bè market · je suis maçon à Abobo · mo n ta ẹran",
    speak_profession: "Say it instead of typing",
    profession_interpreting: "Understanding…",
    profession_understood: (label, topics) => `Understood as: ${label} · what we will surface first: ${topics}.`,
    profession_ai_unavailable: "The local AI is not connected, so the description could not be interpreted. Pick from the list below instead.",
    settings_profession_label: "Or pick from the list",
    settings_profession_placeholder: "Choose a profession",
    settings_age_label: "Age range (optional)",
    settings_age_placeholder: "Prefer not to say",
    age_under18: "Under 18",
    age_18_29: "18–29",
    age_30_44: "30–44",
    age_45_59: "45–59",
    age_60plus: "60+",
    settings_mode_label: "How would you like updates?",
    mode_read: "Read the text",
    mode_listen: "Listen when possible",
    mode_either: "No preference",
    settings_language_label: "Preferred language",
    settings_language_none: "Choose your area first to see local languages",
    toast_preferences_saved: "Preferences saved to this browser.",
    adapted_for: (name) => `Adapted for ${name}`,
    listen_button: "Listen",
    stop_listening: "Stop",
    settings_aside_eyebrow: "WHAT THIS CHANGES",
    settings_aside_title: "Where these preferences show up.",
    settings_aside_body: "Your topics reorder the Overview and Issues so what concerns you surfaces first, and decide which groups are yours. Every record shows “Why am I seeing this here?” with the exact points. Age band adds a small life-stage weight. Reading comfort sets whether a record opens as text or offers to read itself aloud; preferred language pre-selects translation. Nothing is inferred from your behaviour and nothing sensitive is kept.",
    // AI connection status
    ai_status_missing_title: "Local AI isn't connected.",
    ai_status_missing_body: "Translation, read-aloud, structured feedback drafts, and “Explain a source” all need it. In a terminal, run:",
    ai_status_missing_command: "ollama serve\nCIVIC_BRIDGE_OLLAMA_MODEL=<your-model> ./run_demo.sh",
    ai_status_unreachable_title: "Ollama is configured but not responding.",
    ai_status_unreachable_body: "Make sure the Ollama app or service is running (‘ollama serve’), then reload this page.",
    ai_status_model_missing_title: (model) => `The model "${model}" isn't available in Ollama.`,
    ai_status_model_missing_body: (model) => `Run: ollama pull ${model}`,
    ai_status_dismiss: "Dismiss",
    ai_status_docker_title: (model) => `Local AI is starting — the model "${model}" is still downloading.`,
    ai_status_docker_body: "First start only (a few GB). Everything else works now; translation, drafts, and “Explain a source” switch on by themselves when the download finishes. Progress:",
    voice_availability_note: "Voice playback depends on which languages your browser and operating system already have installed — it may not be available for every language listed here.",
    record_tabs_hint: "Translate or listen to this record on Evidence · ask the office on Feedback.",
    voice_missing_title: (language) => `No voice installed for ${language} on this device.`,
    voice_missing_body: "Text translation still works fully — this only affects spoken playback.",
    voice_help_mac: "On macOS: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices…",
    voice_help_windows: "On Windows: Settings → Time & Language → Speech → Manage voices",
    voice_help_android: "On Android: Settings → Accessibility → Text-to-speech output → install voice data",
    voice_help_chromeos: "On Chrome OS: Settings → Accessibility → Text-to-Speech",
    voice_help_generic: "Check your device's accessibility or language settings for additional text-to-speech voices.",
    voice_help_not_guaranteed: "Not every language is offered by every device yet — this isn't guaranteed to add it.",
    voice_available_note: (language) => `A voice for ${language} is installed — playback should work.`,
  },
  fr: {
    app_title_suffix: "Information civique",
    badge_trusted: "Information civique fiable",
    sidebar_eyebrow: "INFORMATION CIVIQUE",
    sidebar_tagline: "Une source. Un sens clair. Un chemin pour répondre.",
    nav_overview: "Vue d’ensemble",
    nav_issues: "Dossiers",
    nav_representatives: "Représentants",
    nav_news: "Actualités et alertes",
    nav_channels: "Canaux d’accès",
    nav_groups: "Des gens comme vous",
    groups_eyebrow: "LES PERSONNES CONCERNÉES",
    groups_title: "Même sujet, même lieu, même situation.",
    groups_body: "Un groupe, c’est toutes les personnes de votre pays dont le profil mentionne le même thème. Comparez, demandez ce qu’on a dit aux autres, préparez une question commune — avec votre nom ou sans.",
    groups_mine_eyebrow: "VOS GROUPES · D’APRÈS VOTRE PROFIL",
    groups_all_eyebrow: "TOUS LES GROUPES DE VOTRE PAYS",
    groups_no_profile: "Dites-nous ce que vous faites dans Paramètres et vos groupes apparaîtront ici. La consultation reste ouverte à tous dans tous les cas.",
    groups_loading: "Chargement…",
    group_members: (n) => `${n} membre${n === 1 ? "" : "s"}`,
    group_posts: (n) => `${n} message${n === 1 ? "" : "s"}`,
    group_from_profile: "d’après votre profil",
    groups_privacy_note: "Les groupes affichent un nombre de membres, jamais une liste. Publier anonymement ne montre que votre thème et votre localité ; votre compte n’est jamais attaché au message, et aucun numéro de téléphone n’y est lié.",
    back_to_groups: "← Retour aux groupes",
    group_eyebrow: "GROUPE",
    group_intro: (n, country) => `${n} personnes en ${country} ont ce thème dans leur profil.`,
    group_localities: (list) => `Où elles sont : ${list}`,
    group_members_label: "membres",
    group_not_in_profile: "Ce thème n’est pas dans votre profil — vous pouvez quand même lire et écrire.",
    group_posts_eyebrow: "CONVERSATION",
    group_posts_title: "Ce que disent les personnes dans cette situation.",
    group_post_label: "Posez une question ou partagez avec le groupe",
    group_post_placeholder: "Quelqu’un d’autre a reçu cet avis ? Qu’est-ce qu’on vous a dit ?",
    group_post_button: "Publier dans le groupe",
    group_no_posts: "Aucun message pour l’instant. Lancez la conversation.",
    group_records_eyebrow: "FICHES DE CE GROUPE",
    group_records_title: "Ce qui est au dossier sur ce thème.",
    group_records_body: "Chaque avis et fiche de votre zone qui concerne ce thème, du plus récent au plus ancien.",
    group_no_records: "Aucune fiche sur ce thème dans votre zone pour l’instant.",
    lands_on_eyebrow: "QUI D’AUTRE EST CONCERNÉ",
    lands_on_body: (n, topic, area) => `${n} personnes de votre pays ont « ${topic} » dans leur profil. Vous n’êtes pas seul·e à devoir comprendre ceci.`,
    lands_on_body_unknown: (topic) => `Les personnes dont le profil mentionne « ${topic} » voient aussi cette fiche en premier.`,
    open_group_arrow: "Ouvrir le groupe →",
    nav_feedback: "Mes questions",
    sidebar_saved_records: "Dernières fiches",
    sidebar_all_records: (n) => `Toutes les ${n} fiches →`,
    sidebar_review_title: "Relisez avant de partager",
    sidebar_review_body: "Vos mots vous appartiennent.",
    sidebar_empty_records: "Choisissez une zone pour charger les fiches enregistrées.",
    sign_in: "Se connecter pour participer",
    open_account_menu: "Ouvrir le menu du compte",
    modal_participation: "PARTICIPATION",
    modal_choose_account: "Connectez-vous pour participer",
    modal_choose_account_body: "Commentaires, votes, suivis et réponses des bureaux sont liés à un compte, pour que résidents et bureaux sachent qui a dit quoi.",
    modal_local_account_note: "Les comptes sont conservés sur ce serveur Civic Bridge. Pas d’e-mail, pas de connexion externe.",
    auth_tab_login: "Se connecter",
    auth_tab_register: "Créer un compte",
    auth_username: "Nom d’utilisateur",
    auth_password: "Mot de passe",
    auth_display_name: "Nom affiché sur vos commentaires",
    auth_role: "Je suis…",
    auth_submit_login: "Se connecter",
    auth_submit_register: "Créer mon compte",
    auth_quick_title: "Ou essayez un compte de démonstration",
    auth_quick_note: "Un clic, partagé avec les autres visiteurs — pratique pour un premier aperçu.",
    auth_failed: "La connexion a échoué.",
    auth_session_expired: "Votre session a expiré. Reconnectez-vous.",
    toast_account_created: (name) => `Bienvenue, ${name}. Votre compte est prêt.`,
    close: "Fermer",
    account_resident_label: "Compte résident",
    account_resident_role: "Résident",
    account_organizer_label: "Compte organisateur communautaire",
    account_organizer_role: "Organisateur communautaire",
    account_office_label: "Compte bureau représentatif",
    account_office_role: "Bureau représentatif",
    modal_account_eyebrow: "COMPTE",
    account_menu_body: (role) => `${role} · Vos commentaires, votes et réponses sont enregistrés sur le serveur sous ce compte.`,
    sign_out: "Se déconnecter",
    toast_user_selected: (label) => `${label} sélectionné.`,
    toast_signed_out: "Déconnecté.",
    toast_rep_unfollowed: "Représentant retiré de votre liste de suivi.",
    toast_rep_followed: "Représentant ajouté à votre liste de suivi.",
    modal_share_eyebrow: "PARTAGER UNE SOURCE",
    modal_share_title: "Choisissez un canal",
    modal_share_body: "L’étiquette de la source et le contexte en langage simple accompagnent le partage. Aucun message n’est envoyé hors de ce navigateur.",
    share_source_backed: (area) => `Lien source vérifiable · ${area}`,
    your_area: "votre zone",
    share_whatsapp_desc: "Envoyer vers une conversation de type WhatsApp",
    share_sms_desc: "Ouvrir une simulation de message court",
    share_group_desc: "Publier dans un groupe local modéré",
    share_copy_desc: "Copier un lien source vérifiable",
    modal_share_footnote: "L’activité de partage est enregistrée localement pour cette session.",
    toast_share_recorded: (channel) => `Partage vers ${channel} enregistré.`,
    toast_link_copied: "Lien copié.",
    toast_share_opening: (channel) => `Ouverture de ${channel}…`,
    sidebar_portal_title: "Côté administration : portail d’information publique ↗",
    sidebar_portal_note: "Là où les bureaux publient les avis que vous voyez ici.",
    toast_share_failed: "Le partage n’a pas pu être enregistré.",
    civic_update_fallback: "Mise à jour Civic Bridge",
    representative_profile: "Profil du représentant",
    civic_source_fallback: "Source civique",
    community_pulse_eyebrow: "PARTICIPATION COMMUNAUTAIRE",
    community_pulse_title: "Cette explication vous a-t-elle aidé ?",
    community_signal: "Signal communautaire",
    community_pulse_intro: "Votez après avoir lu la source. Ajoutez un court commentaire pour que les autres résidents voient ce qui reste flou.",
    vote_helpful: "Utile",
    vote_needs_clarity: "À clarifier",
    add_public_comment: "Ajouter un commentaire public",
    comment_placeholder: "Que devrait préciser la prochaine mise à jour ?",
    add_comment: "Ajouter le commentaire",
    auth_required_note: "Connectez-vous pour voter, commenter ou partager.",
    community_comments_eyebrow: "COMMENTAIRES DE LA COMMUNAUTÉ",
    community_comments_empty: "Aucun commentaire pour l’instant. Soyez le premier à poser une question sourcée.",
    toast_vote_saved: "Votre vote de participation communautaire est enregistré.",
    toast_comment_added: "Commentaire ajouté à la fiche communautaire.",
    toast_comment_required: "Ajoutez d’abord un court commentaire.",
    toast_vote_failed: "Le vote n’a pas pu être enregistré.",
    toast_comment_failed: "Le commentaire n’a pas pu être enregistré.",
    map_pick_country_label: "Carte interactive pour choisir un pays",
    map_pick_country_loading: "Le fond de carte se charge. Choisissez un pays dans la liste ci-dessous.",
    role_public_eyebrow: "VUE PUBLIQUE",
    role_public_title: "Consultez les dernières fiches de votre zone.",
    role_public_body: "Connectez-vous pour suivre un bureau, voter, commenter ou partager.",
    role_office_eyebrow: "ESPACE DU BUREAU",
    role_office_title: "Suivez les engagements et répondez aux questions publiques.",
    role_office_body: "Passez en revue les dossiers ouverts, publiez des mises à jour et ajoutez du contexte à la fiche publique.",
    role_office_button: "Ouvrir le profil du bureau",
    role_organizer_eyebrow: "VUE ORGANISATEUR COMMUNAUTAIRE",
    role_organizer_title: "Coordonnez des mises à jour fiables dans votre zone.",
    role_organizer_body: "Consultez les signaux communautaires, les questions ouvertes et les canaux utilisés pour recevoir l’information.",
    role_organizer_button: "Gérer les canaux d’accès",
    role_resident_eyebrow: "VUE RÉSIDENT",
    role_resident_title: "Suivez les décisions et rendez votre question visible.",
    role_resident_body: "Lisez la source, choisissez un représentant et répondez avec vos propres mots.",
    role_resident_button: "Consulter les dossiers",
    modal_subscription_confirmed: "ABONNEMENT CONFIRMÉ",
    modal_subscribed_title: "Vous êtes abonné",
    subscription_body: (channel, area, contact) => `Les mises à jour ${channel} pour <strong>${area}</strong> seront envoyées à <strong>${contact}</strong>.`,
    next_update_eyebrow: "PROCHAINE MISE À JOUR",
    next_update_body: "Source, résumé en langage simple, et prochaine étape à suivre",
    subscription_change_note: "Vous pouvez modifier cet abonnement depuis Canaux d’accès.",
    done: "Terminé",
    toast_contact_required: "Entrez d’abord un numéro de téléphone ou une adresse e-mail.",
    home_eyebrow: "VOTRE ESPACE CIVIQUE",
    home_title: "Restez proche des décisions qui concernent votre zone.",
    home_body_no_area: "Choisissez votre pays, votre région et votre localité pour charger les fiches et bureaux représentatifs qui vous concernent.",
    location_set: "ZONE DÉFINIE",
    location_needed: "ZONE À DÉFINIR",
    change_location: "Changer de zone",
    choose_location: "Choisir une zone",
    metric_location: "Zone",
    metric_location_detail: "Choisissez votre zone pour commencer",
    metric_representatives: "Représentants",
    metric_representatives_detail: "Chargés après le choix de la zone",
    metric_issues: "Dossiers",
    metric_issues_detail: "Les fiches suivent votre zone",
    metric_languages: "Langues",
    metric_languages_detail: "Traductions disponibles",
    metric_open_questions: "Questions ouvertes",
    metric_open_questions_office_detail: "En attente d’une réponse du bureau",
    metric_commitments: "Engagements",
    metric_commitments_detail: "Publiés par ce bureau",
    metric_response_rate: "Taux de réponse",
    metric_response_rate_detail: "Questions répondues",
    metric_pending_review: "En attente de vérification",
    metric_pending_review_detail: "Mises à jour à vérifier",
    metric_open_questions_area_detail: "Dans toute votre zone",
    metric_community_pulse: "Participation communautaire",
    metric_community_pulse_detail: "Signal de retour récent",
    metric_channels: "Canaux",
    metric_channels_detail: "Web, radio, SMS, WhatsApp",
    metric_sources_checked: "Sources vérifiées",
    metric_sources_checked_detail: "Avec provenance jointe",
    your_area_eyebrow: "VOTRE ZONE",
    area_view_eyebrow: "QUI EST RESPONSABLE · LES NIVEAUX ICI",
    choose_area_see_map: "Choisissez une zone pour voir votre carte",
    change_area_arrow: "Changer de zone →",
    choose_area_arrow: "Choisir une zone →",
    watchlist_eyebrow: "LES BUREAUX",
    watchlist_title: "À qui vous adresser",
    view_all_arrow: "Tout voir →",
    watchlist_empty: "Choisissez une zone pour charger la hiérarchie représentative.",
    view_all_issues_arrow: "Voir tous les dossiers →",
    language_access_eyebrow: "ACCÈS LINGUISTIQUE",
    language_access_title: "Une source, plusieurs façons de la comprendre.",
    explore_channels_arrow: "Explorer les canaux d’accès →",
    source_pipeline_eyebrow: "PARCOURS DE LA SOURCE",
    source_pipeline_title: "Ce que l’espace de travail garde distinct",
    pipeline_source_found: "Source trouvée",
    pipeline_meaning_checked: "Sens vérifié",
    pipeline_community_response: "Réponse communautaire",
    pipeline_delivery_verified: "Livraison vérifiée",
    toast_now_watching: (area) => `Vous suivez maintenant ${area}.`,
    no_matching_record: "Aucune fiche correspondante. Essayez une autre question.",
    record_count: (n) => `${n} fiche${n === 1 ? "" : "s"}`,
    choose_area_first_title: "Choisissez d’abord votre zone.",
    choose_area_first_body: "Définissez un pays, une région et une localité pour que les dossiers, représentants et mises à jour publiques correspondent à votre lieu de vie.",
    issue_tracker_eyebrow: "SUIVI DES DOSSIERS",
    issue_tracker_title: "Tout ce qui est au dossier pour votre zone.",
    issue_tracker_body: "Du plus récent au plus ancien. Les avis publiés par les bureaux et les fiches de référence, chacun avec sa source et le bureau responsable.",
    issues_near: (n, area) => `${n} dossiers près de ${area}`,
    source_labelled_records: "Fiches sourcées pour cette zone",
    filter_all_issues: "Tout",
    latest_eyebrow: "À LA UNE",
    show_more_records: (n, left) => `Afficher ${n} de plus (${left} restantes)`,
    filter_notices: "Avis publiés",
    filter_reference: "Fiches de référence",
    status_open_question: "Question ouverte",
    status_sent_to_office: "Envoyée au bureau",
    status_needs_update: "Mise à jour requise",
    status_published_locally: "Publié localement",
    status_new_public_update: "Nouvelle mise à jour publique",
    updated_label: (date) => `Mis à jour ${date}`,
    open_evidence_arrow: "Ouvrir les preuves →",
    view_source_note_arrow: "Voir la note de source →",
    toast_source_note: "Note de source ouverte dans le flux complet du dossier.",
    rep_map_eyebrow: "CARTE DES REPRÉSENTANTS",
    rep_map_title: "Choisissez qui suivre.",
    rep_map_body: "Parcourez les bureaux propres au pays pouvant être responsables d’un dossier. Chaque bureau a un historique public avec engagements et mises à jour.",
    area_eyebrow: "ZONE",
    change_area: "Changer de zone",
    representative_level: "Niveau de représentation",
    offices_in_view: (n) => `${n} bureau${n === 1 ? "" : "x"} dans cette vue`,
    follow: "Suivre",
    following: "Suivi",
    public_focus_eyebrow: "PRIORITÉ PUBLIQUE",
    stat_commitments: "fiches au dossier",
    stat_verified: "sourcées",
    stat_response_rate: "taux de réponse",
    no_activity_yet: "Aucune activité pour l’instant",
    last_update_label: (date) => `Dernière mise à jour ${date}`,
    open_public_profile_arrow: "Ouvrir le profil public →",
    hierarchy_scale_eyebrow: "COMMENT LA CARTE S’ÉTEND",
    hierarchy_scale_title: "Une zone, plusieurs niveaux de responsabilité.",
    hierarchy_scale_body: "Un résident peut partir d’une localité et parcourir les institutions du pays sélectionné. Le fil de la source reste visible à chaque niveau.",
    set_area_eyebrow: "DÉFINISSEZ VOTRE ZONE",
    set_area_title: "Commencez par où vous êtes.",
    set_area_body: "Choisissez un pays, une région et une localité pour que Civic Bridge affiche les bons dossiers et bureaux représentatifs. Vous pourrez modifier ce choix plus tard.",
    location_stays_note: "La localisation reste dans cette démonstration",
    location_permission_note: "La localisation du navigateur n’est jamais demandée sans consentement",
    location_map_eyebrow: "CARTE DE LOCALISATION",
    pick_a_country: "Choisir un pays",
    live_map: "Carte en direct",
    map_caption: "Vue OpenStreetMap · sélectionnez un repère ou utilisez la liste des pays",
    recommended_starting_area: "Zone de démarrage recommandée",
    available_area: "Zone disponible",
    civic_desk_eyebrow: "VOTRE ESPACE CIVIQUE",
    choose_place_title: "Choisissez le lieu que vous voulez suivre.",
    choose_place_body: "La localisation définit la hiérarchie représentative initiale et les fiches locales affichées sur votre tableau de bord.",
    use_my_location: "Utiliser ma position",
    use_my_location_note: "Seulement après votre autorisation",
    or_choose_manually: "ou choisissez manuellement",
    country_label: "Pays",
    region_label: "Région / province",
    locality_label: "Localité, quartier ou adresse",
    locality_placeholder: "Saisissez votre localité ou votre adresse",
    selected_area_eyebrow: "ZONE SÉLECTIONNÉE",
    choose_a_locality: "Choisir une localité",
    set_this_area: "Définir cette zone",
    location_disclaimer: "Note de production : l’autorisation de localisation, la recherche d’adresse et les limites représentatives proviendraient de services agréés. Ce prototype utilise des fiches fictives.",
    toast_requesting_location: "Demande d’autorisation de localisation…",
    toast_location_unavailable: "La localisation n’est pas disponible ici. Choisissez votre zone manuellement.",
    toast_location_found_other: (country) => `Position trouvée en/au ${country}. Choisissez une zone disponible manuellement.`,
    toast_location_found: (country) => `Position trouvée en/au ${country}. Vérifiez-la, puis définissez cette zone.`,
    toast_location_failed: "Impossible de résoudre cette position. Choisissez votre zone manuellement.",
    toast_location_denied: "L’autorisation de localisation n’a pas été accordée. Choisissez votre zone manuellement.",
    back_to_representatives: "← Retour aux représentants",
    office_level_suffix: (level) => `Bureau — ${level}`,
    follow_office: "Suivre ce bureau",
    share_profile: "Partager le profil",
    public_profile_verified: "✓ Profil public",
    stat_card_commitments: "Fiches au dossier",
    stat_card_commitments_detail: "attribuées à ce bureau",
    stat_card_verified: "Sourcées",
    stat_card_verified_detail: "appuyées par un document publié",
    stat_card_response_rate: "Taux de réponse",
    stat_card_response_rate_detail: "réponses du bureau par question reçue",
    stat_card_community_pulse: "Participation communautaire",
    stat_card_community_pulse_detail: "votes « utile » sur ses fiches",
    public_record_eyebrow: "FICHE PUBLIQUE",
    public_record_title: "Ce que le bureau a consigné publiquement.",
    activity_statistics: "Statistiques d’activité",
    public_record_body: "Calculé en direct à partir de l’activité sur cette plateforme : avis publiés, réponses du bureau, questions et votes des résidents. Rien n’est saisi à la main.",
    bar_commitments_evidence: "Fiches avec document source",
    bar_questions_answered: "Questions répondues",
    bar_community_pulse: "Participation communautaire",
    list_last_update: "Dernière mise à jour",
    list_questions_received: "Questions reçues",
    list_updates_issued: "Mises à jour publiées",
    list_office_replies: "Réponses du bureau",
    right_of_reply_eyebrow: "DROIT DE RÉPONSE",
    right_of_reply_title: "Laissez le bureau ajouter du contexte.",
    right_of_reply_body: "Un représentant peut corriger un détail ou expliquer une décision. Le commentaire communautaire original reste visible, et chaque réponse est étiquetée.",
    response_type_label: "Type de réponse",
    response_type_correct: "Corriger un détail factuel",
    response_type_context: "Ajouter du contexte à un commentaire",
    response_type_source: "Partager une source",
    office_response_label: "Réponse du bureau",
    office_response_placeholder: "Ajoutez une courte réponse sourcée que les résidents pourront consulter...",
    submit_response: "Soumettre la réponse pour vérification",
    response_disclaimer: "Ceci reste local et est marqué « Soumis pour vérification ».",
    responses_on_file_eyebrow: "RÉPONSES ENREGISTRÉES",
    office_response_fallback: "Réponse du bureau",
    no_response_yet: "Aucune réponse du bureau pour l’instant. La fiche originale reste visible.",
    office_only_reply: "Seul un compte bureau représentatif connecté peut répondre ici. Les résidents peuvent commenter chaque fiche.",
    toast_response_required: "Ajoutez une courte réponse avant de soumettre.",
    toast_response_saved: "Réponse enregistrée localement et marquée pour vérification.",
    toast_response_failed: "La réponse n’a pas pu être enregistrée.",
    news_eyebrow: "ACTUALITÉS ET ALERTES",
    news_title: "Consultez la mise à jour. Vérifiez la source.",
    news_body: "Avis publics, notes de projet et mises à jour de service restent liés à leur fiche d’origine.",
    updates_count: (n) => `${n} mises à jour`,
    last_checked: (date) => `Dernière vérification ${date}`,
    language_preview_eyebrow: "APERÇU LINGUISTIQUE",
    read_in_your_language: "Lisez le résumé dans votre langue",
    subscribe_area_alerts: "S’abonner aux alertes de la zone",
    available_in: (languages) => `Disponible en ${languages}`,
    original_summary: "Résumé original",
    translation_preview: (lang) => `Aperçu de traduction · ${lang}`,
    share_source: "Partager la source",
    trust_check_eyebrow: "VÉRIFICATION DE CONFIANCE",
    trust_check_title: "Transmettez la source, pas la rumeur.",
    trust_check_body: "Chaque mise à jour porte son étiquette de source, sa date et ce qui reste non confirmé. La traduction facilite la compréhension du message ; elle ne change pas la preuve.",
    access_channels_eyebrow: "CANAUX D’ACCÈS",
    access_channels_title: "Même preuve, différentes façons d’y accéder.",
    access_channels_body: "Choisissez le canal adapté à votre connexion, votre appareil et votre langue.",
    low_bandwidth_ready: "Adapté au faible débit",
    audio_sms_whatsapp_web: "Audio, SMS, WhatsApp et web",
    channel_web_title: "Espace web",
    channel_web_body: "Recherchez un dossier, lisez la source à côté d’une explication en langage simple, et suivez le bureau responsable.",
    channel_web_detail: "Pour smartphones, ordinateurs et appareils partagés",
    channel_audio_title: "Radio + téléphone basique",
    channel_audio_body: "Écoutez un court résumé audio via la radio communautaire ou un téléphone à touches, puis enregistrez une question avec vos propres mots.",
    channel_audio_detail: "Pour radios partagées, téléphones basiques et faible connexion",
    channel_text_title: "WhatsApp / SMS",
    channel_text_body: "Recevez l’étiquette de la source, un résumé traduit et la prochaine mise à jour via un échange texte léger.",
    channel_text_detail: "Pour connexion intermittente et partage en groupe",
    subscribe_locality_eyebrow: "S’ABONNER À UNE LOCALITÉ",
    subscribe_locality_title: (area) => `Recevez les mises à jour pour ${area}.`,
    subscribe_locality_body: "Les abonnements sont enregistrés dans cette session du navigateur. Une version en production se connecterait à un fournisseur WhatsApp, SMS ou vocal agréé.",
    voice_call: "Appel vocal",
    channel_field_label: "Canal",
    contact_field_label: "Téléphone ou e-mail",
    area_field_label: "Zone",
    subscribe: "S’abonner",
    toast_subscription_saved: "Abonnement enregistré pour cette zone.",
    language_access_title2: "Commencez par les langues déjà parlées.",
    original_source_language: "Langue d’origine de la source",
    translation_pathway: "Parcours de traduction",
    whatsapp_community_eyebrow: "COMMUNAUTÉ WHATSAPP",
    whatsapp_community_title: "Rejoignez le groupe de mises à jour locales.",
    whatsapp_community_body: "Scannez pour recevoir des avis sourcés et discuter de ce qui reste à clarifier.",
    open_whatsapp_invite: "Ouvrir l’invitation WhatsApp",
    discord_community_eyebrow: "COMMUNAUTÉ DISCORD",
    discord_community_title: "Rejoignez le réseau des bâtisseurs civiques.",
    discord_community_body: "Partagez des idées de traduction, des retours d’accessibilité et des questions sur les données publiques.",
    open_discord_invite: "Ouvrir l’invitation Discord",
    toast_whatsapp_ready: "Invitation WhatsApp prête à ouvrir.",
    toast_discord_ready: "Invitation Discord prête à ouvrir.",
    toast_map_note: "La carte relie les localités aux fiches publiques.",
    back_to_records: "← Retour aux fiches",
    tab_evidence: "Preuves",
    tab_feedback: "Retour",
    tab_representative: "Représentant",
    tab_channels: "Canaux",
    plain_language_eyebrow: "EN LANGAGE SIMPLE",
    what_source_says: "Ce que dit la source",
    what_we_cannot_confirm: "Ce que la source ne dit pas — cliquez pour poser la question",
    ask_office_about_this: "Transformer ceci en question pour le bureau responsable",
    ask_office_arrow: (office) => `Demander à ${office} →`,
    addressed_to: (office) => `Votre question sera adressée à : ${office}.`,
    addressed_to_eyebrow: "ADRESSÉE À",
    asking_about: (question) => `Question ouverte tirée de la source : « ${question} »`,
    source_record_eyebrow: "FICHE SOURCE",
    evidence_open_question: "Question ouverte",
    evidence_verified: "Vérifié",
    evidence_published: "Publié par le bureau",
    evidence_submitted: "Soumis par vous",
    evidence_illustrative: "Illustratif",
    record_available_review: "Cette fiche est disponible pour vérification.",
    different_priorities_eyebrow: "PRIORITÉS DIFFÉRENTES",
    different_priorities_title: "On peut partager une source sans avoir le même besoin.",
    different_priorities_body: "L’outil garde chaque point de vue visible au lieu de réduire la discussion à un score.",
    next_step_eyebrow: "PROCHAINE ÉTAPE",
    next_step_title: "Posez une question qui pourra être suivie.",
    next_step_body: "Passez d’une annonce peu claire à une source, une question précise, et un chemin de réponse visible.",
    draft_feedback_arrow: "Rédiger un retour →",
    your_words_first_eyebrow: "VOS MOTS D’ABORD",
    your_words_first_title: "Votre question, avec vos mots — écrite ou dite.",
    your_words_first_body: "Dites ou écrivez ce que vous voulez savoir. Le brouillon qui suit est un point de départ : lisez-le, modifiez-le, puis envoyez-le au bureau. Aucune machine n’y répond.",
    audio_access: "Écouter et parler",
    audio_access_detail: " · pour lire peu, lire mal, ou avoir les mains prises",
    use_sample: "▶ Utiliser l’exemple",
    voice_caption: "La fiche est lue à voix haute par votre téléphone ; vos mots dits vont dans le champ ci-dessous, nulle part ailleurs.",
    perspective_label: "Quel point de vue se rapproche le plus du vôtre ?",
    community_question: "Question communautaire",
    language_of_note_label: "Langue de votre note",
    your_words_label: "Vos mots",
    your_words_placeholder: "Rédigez la question que vous voulez poser au bureau responsable...",
    create_reviewable_draft: "Créer un brouillon vérifiable",
    clear: "Effacer",
    structured_draft_label: "BROUILLON STRUCTURÉ · À MODIFIER AVANT DE PARTAGER",
    prepared_by_ollama: "Préparé par un modèle Ollama local",
    prepared_by_fallback: "Préparé par le mécanisme local de secours",
    save_draft: "Enregistrer le brouillon",
    send_to_office: (office) => `Envoyer à ${office}`,
    send_note: "Votre question est publiée sur cette fiche et sur la page du bureau : sa réponse — ou son silence — est publique.",
    toast_question_sent: (office) => `Envoyé à ${office}. C’est maintenant au dossier.`,
    questions_to_office_eyebrow: (office) => `QUESTIONS À ${office}`,
    no_questions_yet: "Aucune question n’a encore été envoyée au bureau sur cette fiche.",
    ask_the_office_arrow: "Interroger le bureau →",
    questions_received_eyebrow: "QUESTIONS REÇUES",
    no_questions_received: "Aucune question reçue pour l’instant.",
    reply_to_this: "Répondre à ceci →",
    re_prefix: "Réf. :",
    office_replied: "Le bureau a répondu depuis",
    awaiting_reply: "En attente de la réponse du bureau",
    sent_anonymously: "envoyée anonymement",
    sign_in_to_see_questions: "Connectez-vous pour voir les questions que vous avez envoyées.",
    community_view_eyebrow: "VUE COMMUNAUTAIRE",
    community_view_title: "Gardez visibles les accords et les désaccords.",
    community_view_body: "Un bon résumé montre ce qui est partagé, ce qui reste sans réponse, et où les priorités diffèrent.",
    shared_facts: "Faits partagés",
    open_questions: "Questions ouvertes",
    different_priorities_col: "Priorités différentes",
    community_view_disclaimer: "L’outil aide à clarifier le désaccord. Il ne décide pas qui a raison.",
    toast_transcript_added: "Exemple de transcription ajouté. Relisez-le avant de créer le brouillon.",
    toast_draft_created: "Brouillon créé. Vérifiez la formulation avant d’enregistrer.",
    drafting: "Préparation du brouillon… (l’IA locale peut prendre quelques secondes)",
    toast_draft_saved: "Brouillon enregistré — pas encore envoyé.",
    timeline_eyebrow: "CHRONOLOGIE DE LA FICHE PUBLIQUE",
    timeline_title: "Suivez la décision après l’annonce.",
    timeline_body: "Une proposition, une mise à jour et une livraison vérifiée sont des choses différentes. La chronologie garde ces états distincts.",
    accountability_check_eyebrow: "VÉRIFICATION DE REDEVABILITÉ",
    current_status: "Statut actuel",
    accountability_note: "La fiche ne prétend pas être achevée tant qu’une source ne le confirme pas.",
    resident_can_request: "Ce qu’un résident peut demander",
    request_dated_update: "Une prochaine mise à jour datée",
    request_responsible_office: "Le bureau responsable",
    request_evidence: "Une preuve de livraison",
    one_source_three_ways: "UNE SOURCE · TROIS FAÇONS D’Y ACCÉDER",
    meet_people_title: "Atteindre les gens selon leur connectivité.",
    meet_people_body: "La preuve reste la même même quand le canal change. Ceci est un aperçu léger pour la démonstration.",
    channel_web_short: "Web",
    channel_audio_short: "Radio + téléphone basique",
    channel_text_short: "WhatsApp / SMS",
    text_only_preview: "APERÇU TEXTE SEUL",
    bubble_question_plan: "Qu’est-ce qui est prévu pour cette fiche ?",
    bubble_source_says: (text, source) => `La source dit : ${text} Source : ${source}.`,
    bubble_question_unanswered: "Qu’est-ce qui reste sans réponse ?",
    design_promise_eyebrow: "ENGAGEMENT DE CONCEPTION",
    design_promise_title: "Même preuve, moins de friction.",
    design_promise_body: "Personne ne devrait avoir besoin d’un appareil haut débit ou d’un vocabulaire spécialisé pour trouver la source et poser une question utile.",
    my_feedback_eyebrow: "MES QUESTIONS",
    my_feedback_title: "Ce que vous avez demandé,<br />et qui doit répondre.",
    my_feedback_body: "Chaque question envoyée, le bureau à qui elle est adressée, et s’il a répondu depuis.",
    saved_drafts_count: (n) => `${n} question${n === 1 ? "" : "s"} envoyée${n === 1 ? "" : "s"}`,
    nothing_sent_note: "Les questions sont publiques sur la fiche et sur la page du bureau",
    no_drafts_yet: "Aucune question envoyée. Ouvrez une fiche, cliquez sur ce que la source ne dit pas, et envoyez-la au bureau.",
    open_through_server_title: "Ouvrez Civic Bridge via le serveur local",
    nav_explain: "Expliquer une source",
    explain_eyebrow: "EXPLIQUER UNE SOURCE",
    explain_title: "Pointez l'outil vers un vrai document.",
    explain_body: "Collez un texte, collez un lien, ou importez un PDF. L'outil construit la même explication sourcée que sur toute autre fiche — extrait original, reformulation en langage simple, et questions ouvertes — et la marque clairement comme soumise par vous.",
    explain_mode_text: "Coller un texte",
    explain_mode_url: "Coller un lien",
    explain_mode_pdf: "Importer un PDF",
    explain_title_label: "Titre (optionnel)",
    explain_title_placeholder: "ex. Avis de réfection de la route du marché",
    explain_text_label: "Texte source",
    explain_text_placeholder: "Collez ici le texte de l'avis, de la note ou de l'annonce…",
    explain_url_label: "Lien du document",
    explain_url_placeholder: "https://exemple.gouv/avis.html",
    explain_pdf_label: "Fichier PDF",
    explain_pdf_hint: "L'extraction est faite au mieux et fonctionne entièrement hors ligne — aucun fichier ne quitte cet ordinateur, sauf vers ce serveur local. Si un PDF ne peut pas être lu, collez plutôt son texte.",
    explain_submit: "Expliquer cette source",
    explain_submitting: "Lecture de la source…",
    explain_disclaimer: "Rien ici n'est vérifié auprès d'un flux gouvernemental en direct. La fiche est clairement marquée comme soumise par vous, comme un avis du guichet local.",
    explain_no_file: "Choisissez d'abord un fichier PDF.",
    toast_explain_success: "Source expliquée — relisez le brouillon ci-dessous.",
    toast_network_error: "Impossible de joindre le serveur local. Vérifiez qu'il fonctionne toujours.",
    avatar_talk_button: "Dire votre question au lieu de l’écrire",
    voice_read_button: "Me lire cette fiche",
    avatar_listening: "Écoute…",
    avatar_speaking: "Parle…",
    avatar_unsupported: "La voix n'est pas prise en charge par ce navigateur — utilisez plutôt le champ de texte ci-dessous.",
    avatar_heard: (text) => `Entendu : « ${text} »`,
    avatar_mic_denied: "L'autorisation du microphone n'a pas été accordée.",
    profession_farmer: "Agriculteur·rice",
    profession_herder: "Éleveur·se de bétail",
    profession_fisher: "Pêcheur·se",
    profession_vendor: "Vendeur·se au marché",
    profession_butcher: "Boucher·ère",
    profession_shopkeeper: "Boutiquier·ère / kiosque",
    profession_wholesaler: "Grossiste / importateur·rice",
    profession_mason: "Maçon·ne",
    profession_carpenter: "Menuisier·ère",
    profession_electrician: "Électricien·ne",
    profession_plumber: "Plombier·ère",
    profession_tailor: "Couturier·ère",
    profession_hairdresser: "Coiffeur·se",
    profession_mechanic: "Mécanicien·ne",
    profession_welder: "Soudeur·se / ferronnier·ère",
    profession_driver: "Chauffeur de taxi / moto-taxi",
    profession_transporter: "Transporteur·rice / routier·ère",
    profession_health: "Infirmier·ère / agent de santé communautaire",
    profession_pharmacist: "Pharmacien·ne",
    profession_healer: "Tradipraticien·ne",
    profession_teacher: "Enseignant·e",
    profession_student: "Étudiant·e / élève",
    profession_researcher: "Chercheur·se / universitaire",
    profession_civil_servant: "Fonctionnaire",
    profession_community_leader: "Chef de quartier / leader communautaire",
    profession_journalist: "Journaliste / animateur·rice radio",
    profession_ngo: "Agent d’ONG / association",
    profession_religious: "Responsable religieux·se",
    profession_business: "Petit·e entrepreneur·se",
    profession_investor: "Entrepreneur·se / investisseur·se",
    profession_engineer: "Ingénieur·e civil·e / architecte",
    profession_lawyer: "Avocat·e / parajuriste",
    profession_accountant: "Comptable",
    profession_it: "Informaticien·ne / numérique",
    profession_public_company: "Dirigeant·e d’entreprise publique",
    profession_homemaker: "Au foyer",
    profession_retired: "Retraité·e",
    profession_jobseeker: "En recherche d’emploi",
    profession_other: "Autre / je préfère ne pas dire",
    profession_group_0: "Agriculture et élevage",
    profession_group_1: "Commerce et marchés",
    profession_group_2: "Artisanat et construction",
    profession_group_3: "Transport",
    profession_group_4: "Santé",
    profession_group_5: "Éducation",
    profession_group_6: "Service public et communauté",
    profession_group_7: "Entreprise et professions",
    profession_group_8: "Foyer et autres",
    recommended_eyebrow: "RECOMMANDÉ POUR VOUS",
    matches_profile: "Correspond à votre profil",
    sorted_for_profile: (profession) => `Trié pour ${profession}`,
    add_perspective_label: "Ajouter votre point de vue",
    perspective_title_placeholder: "Titre court, ex. « Accès de nuit »",
    perspective_body_placeholder: "Qu'est-ce que cela signifie pour vous en particulier ?",
    submit_perspective: "Ajouter ce point de vue",
    submitted_by: (label) => `Soumis par ${label}`,
    toast_perspective_added: "Votre point de vue a été ajouté à la fiche.",
    toast_perspective_required: "Ajoutez d'abord un court titre et une description.",
    track_record_eyebrow: "HISTORIQUE",
    track_record_title: "Ce que ce bureau a fait dans le temps.",
    track_record_entry_commitments: (n, date) => `${n} fiche${n === 1 ? "" : "s"} publique${n === 1 ? "" : "s"} au dossier · dernière activité : ${date}.`,
    track_record_entry_verified: (n, total) => `${n} fiche${n === 1 ? "" : "s"} sur ${total} appuyée${n === 1 ? "" : "s"} par un document source publié.`,
    track_record_entry_replies: (replies, questions) => `${replies} réponse${replies === 1 ? "" : "s"} du bureau pour ${questions} question${questions === 1 ? "" : "s"} de résidents sur ses fiches.`,
    track_record_entry_focus: (focus) => `Priorité en cours : ${focus}.`,
    translate_label: "Lire en",
    translating: "Traduction en cours…",
    translation_unavailable: "La traduction nécessite un modèle Ollama local connecté. Voir le README pour CIVIC_BRIDGE_OLLAMA_MODEL.",
    machine_translation_badge: "Traduction automatique via Ollama local — pas encore relue.",
    show_original: "Afficher l'original",
    nav_settings: "Paramètres",
    settings_eyebrow: "PARAMÈTRES",
    settings_title: "Personnalisez cet espace.",
    settings_body: "Vous dites qui vous êtes ; l’application montre ce qu’elle a compris, et vous corrigez. Ce profil change l’ordre de ce que vous voyez — jamais ce que vous pouvez voir. Enregistré dans ce navigateur ; connecté·e, vos thèmes suivent aussi votre compte pour que vos groupes vous suivent.",
    settings_scope_note: "Ceci s'applique à ce navigateur sur cet appareil. Si vous vous connectez, cela reste avec votre compte local ici ; sans connexion, cela s'applique quand même pour cette session.",
    settings_name_label: "Votre nom (optionnel)",
    settings_name_placeholder: "Comment devons-nous vous appeler ?",
    settings_description_label: "Dites-nous ce que vous faites — ou pour qui vous remplissez ceci",
    settings_description_hint: "Dans la langue de votre choix, avec vos mots. Par exemple : « Je cultive du maïs et je vends au marché le vendredi » · “I am a teacher at the primary school” · « mo n ta ẹran ni ọja ».",
    settings_description_placeholder: "Je vends des tomates au bord de la route et j’élève trois chèvres…",
    understand_me: "Comprendre",
    understood_eyebrow: "CE QUE NOUS AVONS COMPRIS",
    understood_note: "C’est notre interprétation. Retirez ou ajoutez des thèmes ci-dessous — votre correction l’emporte toujours. Rien d’autre n’est déduit, conservé ou appris de ce que vous faites sur la plateforme.",
    show_first_eyebrow: "NOUS VOUS MONTRERONS D’ABORD",
    remove_interest: "Retirer",
    add_interest: "+ ajouter un thème",
    clear_profile: "Effacer mon profil",
    understood_by_model: "Interprété par le modèle local. Corrigez si c’est faux.",
    understood_by_keywords: "Aucun modèle local connecté — interprétation par mots-clés. Corrigez si c’est faux.",
    why_am_i_seeing_this: "Pourquoi je vois ceci ici ?",
    why_interest: (topic, points, words, understood) => `Cette fiche concerne ${topic}. ${words ? `Vous nous avez dit ${words}, que nous avons compris comme « ${understood} », ` : `Votre profil indique ${understood}, `}donc ${topic} compte +${points}.`,
    why_age: (band, points) => `Votre tranche d’âge (${band}) ajoute +${points} : cela change l’ordre, jamais ce que vous pouvez voir.`,
    why_total: (total) => `Score : +${total}. Les fiches à 0 gardent simplement l’ordre par date.`,
    why_fixed_weights: "Les pondérations sont une table fixe et publiée dans le code source. Rien n’est déduit dans votre dos, rien n’est appris de votre comportement.",
    why_correct_it: "Nous l’avons déduit — corrigez-le →",
    post_anonymously: (persona) => `Publier anonymement, en tant que « ${persona} »`,
    settings_profession_text_label: "Que faites-vous ? (dans la langue de votre choix)",
    settings_profession_text_placeholder: "ex. je vends du poisson au marché de Bè · I am a mason in Abobo · mo n ta ẹran",
    speak_profession: "Le dire au lieu de l’écrire",
    profession_interpreting: "Compréhension en cours…",
    profession_understood: (label, topics) => `Compris comme : ${label} · ce que nous mettrons en avant : ${topics}.`,
    profession_ai_unavailable: "L’IA locale n’est pas connectée, la description n’a pas pu être interprétée. Choisissez dans la liste ci-dessous.",
    settings_profession_label: "Ou choisissez dans la liste",
    settings_profession_placeholder: "Choisissez une profession",
    settings_age_label: "Tranche d'âge (optionnel)",
    settings_age_placeholder: "Je préfère ne pas dire",
    age_under18: "Moins de 18 ans",
    age_18_29: "18–29 ans",
    age_30_44: "30–44 ans",
    age_45_59: "45–59 ans",
    age_60plus: "60 ans et plus",
    settings_mode_label: "Comment préférez-vous recevoir les mises à jour ?",
    mode_read: "Lire le texte",
    mode_listen: "Écouter quand c'est possible",
    mode_either: "Aucune préférence",
    settings_language_label: "Langue préférée",
    settings_language_none: "Choisissez d'abord votre zone pour voir les langues locales",
    toast_preferences_saved: "Préférences enregistrées dans ce navigateur.",
    adapted_for: (name) => `Adapté pour ${name}`,
    listen_button: "Écouter",
    stop_listening: "Arrêter",
    settings_aside_eyebrow: "CE QUE CELA CHANGE",
    settings_aside_title: "Où ces préférences apparaissent.",
    settings_aside_body: "Vos thèmes réorganisent la Vue d’ensemble et les Dossiers pour que ce qui vous concerne apparaisse en premier, et déterminent vos groupes. Chaque fiche affiche « Pourquoi je vois ceci ici ? » avec les points exacts. La tranche d’âge ajoute une petite pondération d’étape de vie. Le confort de lecture détermine si une fiche s’ouvre en texte ou se lit à voix haute ; la langue préférée présélectionne la traduction. Rien n’est déduit de votre comportement et rien de sensible n’est conservé.",
    ai_status_missing_title: "L'IA locale n'est pas connectée.",
    ai_status_missing_body: "La traduction, la lecture audio, les brouillons de retour structurés et « Expliquer une source » en ont besoin. Dans un terminal, exécutez :",
    ai_status_missing_command: "ollama serve\nCIVIC_BRIDGE_OLLAMA_MODEL=<votre-modèle> ./run_demo.sh",
    ai_status_unreachable_title: "Ollama est configuré mais ne répond pas.",
    ai_status_unreachable_body: "Vérifiez que l'application ou le service Ollama fonctionne (« ollama serve »), puis rechargez cette page.",
    ai_status_model_missing_title: (model) => `Le modèle « ${model} » n'est pas disponible dans Ollama.`,
    ai_status_model_missing_body: (model) => `Exécutez : ollama pull ${model}`,
    ai_status_dismiss: "Ignorer",
    ai_status_docker_title: (model) => `L'IA locale démarre — le modèle « ${model} » est en cours de téléchargement.`,
    ai_status_docker_body: "Au premier démarrage seulement (quelques Go). Tout le reste fonctionne déjà ; la traduction, les brouillons et « Expliquer une source » s'activent d'eux-mêmes à la fin du téléchargement. Progression :",
    voice_availability_note: "La lecture audio dépend des langues déjà installées sur votre navigateur et votre système — elle peut ne pas être disponible pour toutes les langues listées ici.",
    record_tabs_hint: "Traduisez ou écoutez cette fiche depuis Preuves · interrogez le bureau depuis Retour.",
    voice_missing_title: (language) => `Aucune voix installée pour le ${language} sur cet appareil.`,
    voice_missing_body: "La traduction écrite fonctionne toujours pleinement — seule la lecture audio est concernée.",
    voice_help_mac: "Sur macOS : Réglages Système → Accessibilité → Contenu énoncé → Voix système → Gérer les voix…",
    voice_help_windows: "Sur Windows : Paramètres → Heure et langue → Voix → Gérer les voix",
    voice_help_android: "Sur Android : Paramètres → Accessibilité → Synthèse vocale → installer les données vocales",
    voice_help_chromeos: "Sur Chrome OS : Paramètres → Accessibilité → Synthèse vocale",
    voice_help_generic: "Vérifiez les paramètres d'accessibilité ou de langue de votre appareil pour des voix de synthèse supplémentaires.",
    voice_help_not_guaranteed: "Toutes les langues ne sont pas encore proposées par tous les appareils — rien ne garantit que cela l'ajoutera.",
    voice_available_note: (language) => `Une voix pour le ${language} est installée — la lecture devrait fonctionner.`,
  },
};

const LANGUAGE_PROFILES = {
  Togo: ["Français", "Éwé", "Kabyè", "Mina"],
  Kenya: ["English", "Kiswahili", "Dholuo", "Kikuyu"],
  "Côte d’Ivoire": ["Français", "Dioula", "Baoulé", "Mooré"],
  Ghana: ["English", "Twi", "Dagbani", "Ewe"],
  Nigeria: ["English", "Hausa", "Yorùbá", "Igbo"],
};

const COUNTRY_SLUGS = { Togo: "togo", Kenya: "kenya", "Côte d’Ivoire": "cote-divoire", Ghana: "ghana", Nigeria: "nigeria" };

const PROFESSION_GROUPS = [
  { key: "profession_group_0", ids: ["farmer", "herder", "fisher"] },
  { key: "profession_group_1", ids: ["vendor", "butcher", "shopkeeper", "wholesaler"] },
  { key: "profession_group_2", ids: ["mason", "carpenter", "electrician", "plumber", "tailor", "hairdresser", "mechanic", "welder"] },
  { key: "profession_group_3", ids: ["driver", "transporter"] },
  { key: "profession_group_4", ids: ["health", "pharmacist", "healer"] },
  { key: "profession_group_5", ids: ["teacher", "student", "researcher"] },
  { key: "profession_group_6", ids: ["civil_servant", "community_leader", "journalist", "ngo", "religious"] },
  { key: "profession_group_7", ids: ["business", "investor", "engineer", "lawyer", "accountant", "it", "public_company"] },
  { key: "profession_group_8", ids: ["homemaker", "retired", "jobseeker", "other"] },
];
const PROFESSIONS = PROFESSION_GROUPS.flatMap((group) => group.ids.map((id) => ({ id, key: `profession_${id}`, group: group.key })));

// --- Life-relevance ranking -------------------------------------------------
// Every issue maps to a topic (from its stable id, category or priority —
// never the translated title). Profession and age range each carry a small
// weight table over topics; the sum orders the feed. Readable, editable, no
// machine learning. 0/absent means "no particular match".
const TOPIC_KEYWORDS = {
  water: ["water-access", "water", "eau"], roads: ["market-road", "road", "route", "voirie"], health: ["clinic-supply", "health", "santé", "vaccin", "clinic", "choléra", "cholera"],
  education: ["school-supply", "education", "éducation", "school", "scolaire"], energy: ["power-outage", "power", "energy", "énergie", "délestage", "electric"],
  works: ["works", "travaux", "drain", "caniveau"], markets: ["market", "marché"], registry: ["civil registry", "état civil", "naissance", "birth"],
  safety: ["safety", "sécurité", "fire", "incendie"], permits: ["permit", "permis", "construire", "building"], transport: ["transport", "gare", "terminal", "bus"],
  sanitation: ["sanitation", "assainissement", "toilet", "latrine", "waste", "ordures"], budget: ["budget"], flooding: ["flood", "inondation", "pluies", "rains"],
  employment: ["employment", "emploi", "youth", "jeunes", "training", "formation"], land: ["land", "foncier", "parcelle", "plot"], exams: ["exam", "examen"],
  tax: ["tax", "impôt", "levy", "taxe"], identity: ["identity", "identité", "id card", "carte d"], elections: ["election", "électorale", "voter"],
  meeting: ["meeting", "réunion"], services: ["services", "lighting", "éclairage", "lampadaire"],
  livestock: ["livestock", "élevage", "bétail", "animal"], farming: ["agriculture", "farmer", "fertili", "engrais", "harvest", "récolte"],
};
const PROFESSION_TOPIC_WEIGHTS = {
  farmer: { water: 3, land: 3, flooding: 2, roads: 2, markets: 1, energy: 1 }, herder: { water: 3, land: 3, health: 1, roads: 1, flooding: 1 }, fisher: { water: 3, flooding: 2, markets: 2, safety: 1 },
  vendor: { markets: 3, roads: 2, sanitation: 2, tax: 2, energy: 1, safety: 1 }, butcher: { markets: 3, sanitation: 3, health: 2, water: 2, tax: 1 }, shopkeeper: { markets: 2, tax: 3, energy: 2, safety: 1, permits: 1 }, wholesaler: { tax: 3, transport: 3, roads: 2, markets: 2, permits: 1 },
  mason: { permits: 3, land: 3, works: 2, budget: 1, employment: 1 }, carpenter: { permits: 2, works: 2, markets: 1, energy: 1 }, electrician: { energy: 3, works: 2, permits: 1, services: 2 }, plumber: { water: 3, works: 2, sanitation: 2, permits: 1 }, tailor: { markets: 2, energy: 3, tax: 1, exams: 1 }, hairdresser: { energy: 3, water: 2, markets: 1, tax: 1 }, mechanic: { transport: 2, roads: 2, energy: 2, tax: 1 }, welder: { energy: 3, permits: 1, works: 1, safety: 1 },
  driver: { roads: 3, transport: 3, energy: 1, safety: 1, tax: 1 }, transporter: { roads: 3, transport: 3, tax: 2, flooding: 1 },
  health: { health: 3, water: 2, sanitation: 2, energy: 1 }, pharmacist: { health: 3, energy: 2, tax: 1 }, healer: { health: 3, registry: 1, meeting: 1 },
  teacher: { education: 3, exams: 3, health: 1, water: 1, meeting: 1 }, student: { education: 3, exams: 3, employment: 2, identity: 2, elections: 1 }, researcher: { education: 2, budget: 2, elections: 1, meeting: 1 },
  civil_servant: { budget: 2, meeting: 2, elections: 1, identity: 1, services: 1 }, community_leader: { meeting: 3, budget: 2, safety: 2, water: 1, land: 1, flooding: 1 }, journalist: { meeting: 2, budget: 2, elections: 2, safety: 1, health: 1 }, ngo: { health: 2, education: 2, flooding: 2, meeting: 1, budget: 1 }, religious: { meeting: 2, registry: 1, safety: 1, health: 1 },
  business: { tax: 3, energy: 2, permits: 2, markets: 1, roads: 1 }, investor: { land: 3, permits: 3, tax: 2, budget: 2, employment: 1 }, engineer: { works: 3, permits: 3, roads: 2, budget: 2, flooding: 1 }, lawyer: { land: 2, registry: 2, elections: 2, permits: 1, identity: 1 }, accountant: { tax: 3, budget: 2, permits: 1 }, it: { energy: 2, identity: 1, employment: 1, budget: 1 }, public_company: { budget: 3, works: 2, energy: 2, water: 2, meeting: 1 },
  homemaker: { water: 2, health: 2, education: 2, sanitation: 1, registry: 1 }, retired: { health: 3, registry: 1, water: 1, identity: 1, meeting: 1 }, jobseeker: { employment: 3, identity: 2, exams: 1, transport: 1 }, other: {},
};
// Life stage: what people at that age are typically dealing with.
const AGE_TOPIC_WEIGHTS = {
  under18: { education: 2, exams: 2, safety: 1 }, "18-29": { employment: 2, exams: 1, identity: 2, elections: 1 }, "30-44": { land: 2, permits: 2, education: 1, tax: 1, registry: 1 },
  "45-59": { land: 1, tax: 1, budget: 1, health: 1 }, "60plus": { health: 2, registry: 1, water: 1, identity: 1 },
};

const TOPIC_NAMES = {
  en: { water: "water access", roads: "roads", health: "health services", education: "schools", energy: "electricity", works: "public works", markets: "market trade", registry: "civil registry", safety: "safety", permits: "permits & licences", transport: "transport", sanitation: "sanitation", budget: "public budget", flooding: "flooding", employment: "jobs & training", land: "land", exams: "exams", tax: "taxes & fees", identity: "ID cards", elections: "elections", meeting: "public meetings", services: "municipal services", farming: "farming", livestock: "livestock & animal health" },
  fr: { water: "accès à l’eau", roads: "routes", health: "services de santé", education: "écoles", energy: "électricité", works: "travaux publics", markets: "commerce au marché", registry: "état civil", safety: "sécurité", permits: "permis et licences", transport: "transport", sanitation: "assainissement", budget: "budget public", flooding: "inondations", employment: "emploi et formation", land: "foncier", exams: "examens", tax: "impôts et taxes", identity: "pièces d’identité", elections: "élections", meeting: "réunions publiques", services: "services municipaux", farming: "agriculture", livestock: "élevage et santé animale" },
};
function topicNames(weights) {
  const names = TOPIC_NAMES[uiLang()] || TOPIC_NAMES.en;
  return Object.entries(weights || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([topic]) => names[topic] || topic).join(" · ");
}

function issueTopic(issue) {
  const haystack = `${issue.id || ""} ${issue.type || ""} ${issue.priority || ""} ${issue.category || ""}`.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) if (keywords.some((word) => haystack.includes(word))) return topic;
  return "";
}

// The profile is a list of interests (controlled vocabulary, model-proposed,
// user-edited) plus an age band. Ranking is a fixed, published rule: the
// first two interests weigh 3, the next two 2, the rest 1; the age band
// adds its own small table. Nothing is learned from behaviour.
const INTEREST_POSITION_WEIGHTS = [3, 3, 2, 2, 1, 1];
const hasProfession = () => (state.preferences.interests || []).length > 0;
function interestWeight(topic) {
  const index = (state.preferences.interests || []).indexOf(topic);
  return index < 0 ? 0 : INTEREST_POSITION_WEIGHTS[Math.min(index, INTEREST_POSITION_WEIGHTS.length - 1)];
}
function professionLabel() {
  const names = TOPIC_NAMES[uiLang()] || TOPIC_NAMES.en;
  return (state.preferences.interests || []).slice(0, 2).map((topic) => names[topic] || topic).join(" · ");
}
function professionWeight(issue) {
  const topic = issueTopic(typeof issue === "string" ? { id: issue } : issue);
  if (!topic) return 0;
  return interestWeight(topic) + ((AGE_TOPIC_WEIGHTS[state.preferences.age] || {})[topic] || 0);
}
// "Why am I seeing this?" — the whole chain in the person's own terms.
function rankingExplanation(issue) {
  const topic = issueTopic(issue);
  if (!topic) return "";
  const names = TOPIC_NAMES[uiLang()] || TOPIC_NAMES.en;
  const fromInterest = interestWeight(topic);
  const fromAge = (AGE_TOPIC_WEIGHTS[state.preferences.age] || {})[topic] || 0;
  if (!fromInterest && !fromAge) return "";
  const parts = [];
  const understood = (state.preferences.understood || professionLabel()).replace(/^(we understood|nous avons compris)\s*:\s*/i, "");
  if (fromInterest) parts.push(t("why_interest", names[topic] || topic, fromInterest, state.preferences.description ? `“${state.preferences.description}”` : "", understood));
  if (fromAge) parts.push(t("why_age", t(AGE_RANGES.find((item) => item.id === state.preferences.age)?.key || "age_18_29"), fromAge));
  return `<details class="why-panel"><summary>${t("why_am_i_seeing_this")}</summary><div><p>${parts.join(" ")}</p><p class="why-total">${t("why_total", fromInterest + fromAge)}</p><p class="why-fixed">${t("why_fixed_weights")}</p><button class="text-btn" data-route="settings">${t("why_correct_it")}</button></div></details>`;
}

function rankForProfile(issues) {
  // Profile changes order only, never access: every record stays in the list.
  return issues
    .map((issue, index) => ({ issue, index, score: professionWeight(issue) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.issue);
}
const LEVEL_PHOTO_FALLBACK = { "ward-council": "/static/images/rep-ward.jpeg", "district-council": "/static/images/rep-district.jpeg", prefecture: "/static/images/rep-prefecture.jpeg", governor: "/static/images/rep-region.jpeg" };

function representativeProfile(rep) {
  const slug = COUNTRY_SLUGS[state.dashboard.country] || "";
  const fallback = LEVEL_PHOTO_FALLBACK[rep.id] || "";
  const photo = rep.photo || (slug ? `/static/images/reps/${slug}-${rep.id}.jpeg` : fallback);
  return { person: rep.display_name || rep.name, photo, fallback };
}

const pctText = (value) => (value === null || value === undefined ? "—" : `${value}%`);
const pctWidth = (value) => (value === null || value === undefined ? 0 : value);
const sourcedPct = (rep) => (rep.commitments ? Math.round((rep.verified / rep.commitments) * 100) : 0);

function formatActivityDate(iso) {
  if (!iso) return t("no_activity_yet");
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(uiLang() === "fr" ? "fr-FR" : "en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Overlay server-computed activity statistics onto the representatives of
// the selected country. Returns true when a displayed number changed.
function applyRepresentativeStats(stats) {
  if (!stats || stats.country !== state.dashboard.country) return false;
  const before = JSON.stringify(state.representatives.map((rep) => [rep.commitments, rep.verified, rep.questions_received, rep.updates_issued, rep.responses_on_file, rep.response_rate, rep.community_pulse, rep.last_update]));
  state.repStats = stats;
  state.representatives = state.representatives.map((rep) => {
    const entry = stats.representatives[rep.id];
    if (!entry) return rep;
    const { responses, ...numbers } = entry;
    state.repResponses[rep.id] = responses || [];
    return { ...rep, ...numbers, last_update: formatActivityDate(numbers.last_update) };
  });
  return before !== JSON.stringify(state.representatives.map((rep) => [rep.commitments, rep.verified, rep.questions_received, rep.updates_issued, rep.responses_on_file, rep.response_rate, rep.community_pulse, rep.last_update]));
}

async function refreshRepresentativeStats() {
  if (!state.dashboard.country) return false;
  try {
    const response = await fetch(`/api/representatives/stats?country=${encodeURIComponent(state.dashboard.country)}`, { cache: "no-store" });
    if (!response.ok) return false;
    return applyRepresentativeStats(await response.json());
  } catch (error) { return false; }
}

// Which office a record is addressed to: fixtures by topic (same table as
// FIXTURE_RECORD_OFFICE in app.py), published notices by the office chosen at
// publication, anything else by its responsible_office text.
const FIXTURE_RECORD_OFFICE = { "market-road": "ward-council", "clinic-supply": "district-council", "water-access": "prefecture", "school-supply": "governor", "power-outage": "governor" };
function responsibleOffice(record) {
  const byLevel = state.representatives.find((rep) => rep.id === FIXTURE_RECORD_OFFICE[record.id]);
  if (byLevel) return { id: byLevel.id, name: representativeName(byLevel), office: byLevel.name };
  const notice = state.publishedNotices.find((item) => item.id === record.id);
  const target = notice?.responsible_office || notice?.office || record.responsible_office || "";
  const rep = state.representatives.find((item) => item.name === target || item.display_name === target);
  if (rep) return { id: rep.id, name: representativeName(rep), office: rep.name };
  return { id: "", name: target || t("request_responsible_office"), office: target };
}

// The public face of an anonymous post: an interest and a locality, never a
// name or account. "A market trader in Lomé" / "Un·e résident·e de Lomé".
function anonymousPersona() {
  const names = TOPIC_NAMES[uiLang()] || TOPIC_NAMES.en;
  const first = (state.preferences.interests || [])[0];
  const where = state.dashboard.area || state.dashboard.country || "";
  if (uiLang() === "fr") return first ? `Un·e résident·e de ${where} (${names[first]})` : `Un·e résident·e de ${where}`;
  return first ? `A resident of ${where} (${names[first]})` : `A resident of ${where}`;
}

function representativeName(rep) {
  return representativeProfile(rep).person;
}

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function getRecord() {
  return state.records.find((record) => record.id === state.recordId);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function persistUser() {
  try {
    if (state.user) localStorage.setItem("civic-bridge-user", JSON.stringify(state.user));
    else localStorage.removeItem("civic-bridge-user");
  } catch (error) { /* optional local persistence */ }
}

function persistFollowed() {
  if (!state.user) return;
  try { localStorage.setItem(`civic-bridge-followed-${state.user.id}`, JSON.stringify([...state.followedRepresentatives])); } catch (error) { /* optional */ }
}

function preferencesKey() {
  return state.user ? `civic-bridge-preferences-${state.user.id}` : "civic-bridge-preferences-guest";
}

function loadPreferences() {
  const empty = { name: "", description: "", interests: [], understood: "", age: "", mode: "", language: "" };
  try {
    const saved = JSON.parse(localStorage.getItem(preferencesKey()) || "null") || {};
    // Older profiles stored a profession id (or model weights); carry them
    // into the interests list so nothing saved is lost.
    if (!Array.isArray(saved.interests)) saved.interests = [];
    if (!saved.interests.length && saved.topicWeights) saved.interests = Object.entries(saved.topicWeights).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([topic]) => topic);
    if (!saved.interests.length && saved.profession) saved.interests = Object.entries(PROFESSION_TOPIC_WEIGHTS[saved.profession] || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([topic]) => topic);
    if (!saved.description && saved.professionText) saved.description = saved.professionText;
    if (!saved.understood && saved.professionLabel) saved.understood = saved.professionLabel[uiLang()] || saved.professionLabel.en || "";
    delete saved.profession; delete saved.topicWeights; delete saved.professionText; delete saved.professionLabel;
    state.preferences = { ...empty, ...saved };
  } catch (error) {
    state.preferences = { ...empty };
  }
}

function syncInterests() {
  if (!state.user?.token) return;
  fetch("/api/profile/interests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: authToken(), interests: state.preferences.interests || [], country: state.dashboard.country, locality: state.dashboard.area }) }).catch(() => {});
}

function persistPreferences() {
  try { localStorage.setItem(preferencesKey(), JSON.stringify(state.preferences)); } catch (error) { /* optional */ }
  syncInterests();
}

function applyAreaContext() {
  if (!state.dashboard.area) return;
  const context = state.countryContexts[state.dashboard.country];
  if (!context) return;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  state.records = clone(context.records || []);
  state.issues = clone(context.issues || []);
  state.news = clone(context.news || []);
  state.representatives = clone(context.representatives || []);
  applyRepresentativeStats(state.repStats);
  state.dashboard.metrics = clone(context.dashboard?.metrics || []);
  state.dashboard.languages = clone(context.languages || LANGUAGE_PROFILES[state.dashboard.country] || []);
  state.dashboard.hierarchy = clone(context.hierarchy || []);
  state.dashboard.last_sync = context.dashboard?.last_sync || t("home_eyebrow");
  state.newsLanguage = state.dashboard.languages[0] || "English";
  const locationLabel = `${state.dashboard.area} · ${state.dashboard.region || state.dashboard.country || "selected area"}`;
  state.records = state.records.map((record) => ({ ...record, location: locationLabel, locality: state.dashboard.area, region: state.dashboard.region }));
  state.issues = state.issues.map((issue) => ({ ...issue, locality: state.dashboard.area }));
  state.news = state.news.map((item) => ({ ...item, locality: state.dashboard.area }));
  const relevantNotices = state.publishedNotices.filter((notice) => !notice.country || notice.country === state.dashboard.country);
  relevantNotices.slice().reverse().forEach((notice) => {
    const record = publisherRecord(notice);
    state.records.unshift(record);
    state.news.unshift({ id: notice.id, headline: notice.title || notice.headline, type: notice.category || "Public notice", date: notice.date || "Just published", status: "Published locally", locality: notice.locality, source: `${notice.office || "Public Information Desk"} · local publication`, summary: notice.summary, languages: state.dashboard.languages || ["English"] });
    state.issues.unshift({ id: notice.id, title: record.title, type: record.category, locality: notice.locality, status: "New public update", priority: "Community follow-up", last_update: notice.date || "Today", source: record.source_label, summary: notice.summary });
  });
  loadGroups();
  // Area tiles reflect what is actually on the platform for this country.
  const isFrench = uiLang() === "fr";
  if (state.dashboard.metrics[0]) state.dashboard.metrics[0] = { ...state.dashboard.metrics[0], value: String(state.issues.length), detail: isFrench ? `${relevantNotices.length} avis publiés · 5 fiches de référence` : `${relevantNotices.length} published notices · 5 reference records` };
  if (state.dashboard.metrics[2]) state.dashboard.metrics[2] = { ...state.dashboard.metrics[2], value: String(relevantNotices.length), detail: isFrench ? "Avis publiés par les bureaux" : "Notices published by offices" };
  state.repLevel = "All levels";
}

function publisherRecord(notice) {
  // Mirrors published_notice_record() in app.py: same content, in the
  // notice's own language. Facts and unknowns come from the notice text
  // (derived on the server at publication), never from boilerplate.
  const fr = (notice.country ? ["Togo", "Côte d’Ivoire"].includes(notice.country) : uiLang() === "fr");
  const office = notice.office || notice.responsible_office || (fr ? "Guichet d’information publique" : "Public Information Desk");
  const location = `${notice.locality}${notice.region ? ` · ${notice.region}` : state.dashboard.region ? ` · ${state.dashboard.region}` : ""}`;
  const source = notice.source_url || "/publisher";
  const facts = notice.facts?.length ? notice.facts : [notice.summary];
  const unknowns = notice.unknowns?.length ? notice.unknowns : (fr ? ["Quand la prochaine mise à jour publique sera-t-elle publiée ?"] : ["When will the next public update be published?"]);
  return {
    id: notice.id,
    title: notice.title || notice.headline,
    category: notice.category || (fr ? "Avis public" : "Public notice"),
    location, country: notice.country || state.dashboard.country,
    source_date: notice.date || (fr ? "À l’instant" : "Just published"),
    source_label: `${notice.responsible_office || office} · ${fr ? "publication officielle" : "official publication"}`,
    source_title: fr ? "Avis du portail d’information publique — non vérifié de manière indépendante" : "Public information portal notice — not independently verified",
    source_url: source,
    provenance_status: "published",
    provenance_note: fr ? `Avis publié par ${office} via le portail d’information publique ; il n’a pas été vérifié de manière indépendante.` : `Notice published by ${office} through the public information portal; it has not been independently verified.`,
    status: fr ? "Avis publié par le bureau" : "Notice published by the office",
    status_detail: fr ? "Non vérifié de manière indépendante" : "Not independently verified",
    summary: notice.summary,
    plain_language: notice.plain_language || notice.summary,
    facts, unknowns,
    perspectives: [{ label: fr ? "Question communautaire" : "Community question", body: fr ? "Les résidents peuvent consulter la source et demander une prochaine étape datée." : "Residents can review the source and ask for a dated next step." }],
    evidence: [{ label: fr ? "Avis publié" : "Published notice", quote: notice.body || notice.summary, page: fr ? "Portail d’information publique" : "Public information portal", kind: "published" }],
    timeline: [{ date: notice.date || (fr ? "Aujourd’hui" : "Today"), label: fr ? "Avis publié" : "Notice published", detail: fr ? `${office} a publié cet avis sur le portail d’information publique.` : `${office} published this notice on the public information portal.`, state: "done" }, { date: "—", label: fr ? "Prochaine mise à jour publique" : "Next public update", detail: fr ? "La source n’indique pas de date de suivi confirmée." : "The source does not state a confirmed follow-up date.", state: "pending" }],
    channels: { web: fr ? `Ouvrez la source publiée sur ${source}.` : `Open the published source at ${source}.`, voice: fr ? "Écoutez le résumé en langage simple sur une radio partagée ou un téléphone à touches." : "Listen to the plain-language summary on a shared radio or basic keypad phone.", text: fr ? "Recevez la même mise à jour par un échange léger WhatsApp ou SMS." : "Receive the same source-backed update through a lightweight WhatsApp or SMS-style exchange." },
    responsible_office: notice.responsible_office || office,
  };
}

function ingestPublisherNotices(notices) {
  const fresh = (notices || []).filter((notice) => notice.id && !state.publisherNoticeIds.has(notice.id));
  if (!fresh.length) return;
  fresh.forEach((notice) => { state.publishedNotices.push(notice); state.publisherNoticeIds.add(notice.id); });
  applyAreaContext();
  showToast(uiLang() === "fr" ? `${fresh.length} nouvel${fresh.length > 1 ? "s avis publiés" : " avis publié"} par les bureaux.` : `${fresh.length} new notice${fresh.length > 1 ? "s" : ""} published by the offices.`);
  render();
}

async function pollPublisherNotices() {
  try { const response = await fetch("/api/publisher/notices", { cache: "no-store" }); if (response.ok) ingestPublisherNotices((await response.json()).notices || []); } catch (error) { /* source desk is optional during offline use */ }
  if (!(await refreshRepresentativeStats())) return;
  const statViews = new Set(["home", "representatives", "representative-detail"]);
  if (!statViews.has(state.view)) return;
  const reply = document.querySelector("#rep-response");
  if (reply && (reply.value.trim() || document.activeElement === reply)) return;
  render();
}

function updateAccountButton() {
  const button = document.querySelector("#account-button");
  if (!button) return;
  button.innerHTML = state.user ? `<span class="account-avatar">${esc(state.user.initial || "R")}</span>${esc(state.user.label)}` : esc(t("sign_in"));
  button.setAttribute("aria-label", state.user ? t("open_account_menu") : t("sign_in"));
  button.onclick = () => state.user ? showAccountMenu() : showAuthModal();
}

function closeModal() {
  const next = state.pendingAction;
  state.pendingAction = null;
  state.shareTarget = null;
  const root = document.querySelector("#modal-root");
  if (root) root.innerHTML = "";
  if (next) next();
}

const ROLE_LABEL_KEYS = { resident: ["account_resident_label", "account_resident_role"], organizer: ["account_organizer_label", "account_organizer_role"], office: ["account_office_label", "account_office_role"] };
const userRole = () => state.user?.role_key || "";
const authToken = () => state.user?.token || "";

async function authRequest(path, payload) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || t("auth_failed"));
  return data;
}

function showAuthModal(mode = "login") {
  const root = document.querySelector("#modal-root");
  if (!root) return;
  const roleOptions = ["resident", "office"].map((key) => `<option value="${key}">${t(ROLE_LABEL_KEYS[key][1])}</option>`).join("");
  const demoAccounts = [
    { username: "resident", label: t("account_resident_label"), role: t("account_resident_role"), initial: "R" },
    { username: "office", label: t("account_office_label"), role: t("account_office_role"), initial: "O" },
  ];
  root.innerHTML = `<div class="modal-backdrop" data-close-modal><section class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><div class="modal-top"><div><span class="eyebrow">${t("modal_participation")} ${help("accounts")}</span><h2 id="auth-title">${t("modal_choose_account")}</h2></div><button class="modal-close" data-close-modal aria-label="${t("close")}">×</button></div><p class="modal-copy">${t("modal_choose_account_body")}</p>
    <div class="auth-tabs"><button class="auth-tab ${mode === "login" ? "active" : ""}" data-auth-mode="login">${t("auth_tab_login")}</button><button class="auth-tab ${mode === "register" ? "active" : ""}" data-auth-mode="register">${t("auth_tab_register")}</button></div>
    <form id="auth-form" class="auth-form" autocomplete="on">
      <label class="form-label" for="auth-username">${t("auth_username")}</label><input id="auth-username" class="feedback-select" name="username" autocomplete="username" required minlength="3" />
      <label class="form-label" for="auth-password">${t("auth_password")}</label><input id="auth-password" class="feedback-select" name="password" type="password" autocomplete="${mode === "login" ? "current-password" : "new-password"}" required minlength="6" />
      ${mode === "register" ? `<label class="form-label" for="auth-name">${t("auth_display_name")}</label><input id="auth-name" class="feedback-select" name="display_name" maxlength="60" /><label class="form-label" for="auth-role">${t("auth_role")}</label><select id="auth-role" class="feedback-select" name="role">${roleOptions}</select>` : ""}
      <p class="auth-error" id="auth-error" hidden></p>
      <button class="primary-btn auth-submit" type="submit">${mode === "login" ? t("auth_submit_login") : t("auth_submit_register")}</button>
    </form>
    <div class="auth-quick"><span class="eyebrow">${t("auth_quick_title")}</span><p class="modal-copy">${t("auth_quick_note")}</p><div class="account-options">${demoAccounts.map((user) => `<button class="account-option" data-demo-login="${user.username}"><span class="option-avatar">${user.initial}</span><span><strong>${esc(user.label)}</strong><small>${esc(user.role)}</small></span><span>→</span></button>`).join("")}</div></div>
    <p class="modal-footnote">${t("modal_local_account_note")}</p></section></div>`;
  const form = root.querySelector("#auth-form");
  const error = root.querySelector("#auth-error");
  const fail = (message) => { error.textContent = message; error.hidden = false; };
  root.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => showAuthModal(button.dataset.authMode)));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.country = state.dashboard.country || "";
    payload.locality = state.dashboard.area || "";
    form.querySelector(".auth-submit").disabled = true;
    try {
      const data = await authRequest(mode === "login" ? "/api/auth/login" : "/api/auth/register", payload);
      setUser({ ...data.user, token: data.token }, mode === "register");
    } catch (err) { fail(err.message); form.querySelector(".auth-submit").disabled = false; }
  });
  root.querySelectorAll("[data-demo-login]").forEach((button) => button.addEventListener("click", async () => {
    try {
      const data = await authRequest("/api/auth/login", { username: button.dataset.demoLogin, password: "civic2026" });
      setUser({ ...data.user, token: data.token });
    } catch (err) { fail(err.message); }
  }));
  root.querySelectorAll("[data-close-modal]").forEach((element) => element.addEventListener("click", (event) => { if (event.target === element) closeModal(); }));
  root.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", closeModal));
  root.querySelector("#auth-username").focus();
}

function showAccountMenu() {
  const root = document.querySelector("#modal-root");
  if (!root || !state.user) return;
  root.innerHTML = `<div class="modal-backdrop" data-close-modal><section class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="account-title"><div class="modal-top"><div><span class="eyebrow">${t("modal_account_eyebrow")}</span><h2 id="account-title">${esc(state.user.label)}</h2></div><button class="modal-close" data-close-modal aria-label="${t("close")}">×</button></div><p class="modal-copy">${t("account_menu_body", esc(state.user.role))}</p><button class="secondary-btn" id="open-settings">${t("nav_settings")}</button><button class="secondary-btn" id="sign-out">${t("sign_out")}</button></section></div>`;
  root.querySelector("#sign-out").addEventListener("click", signOut);
  root.querySelector("#open-settings").addEventListener("click", () => { closeModal(); setRoute("settings"); });
  root.querySelectorAll("[data-close-modal]").forEach((element) => element.addEventListener("click", (event) => { if (event.target === element) closeModal(); }));
}

function setUser(user, created = false) {
  const next = state.pendingAction;
  state.pendingAction = null;
  const guestPreferences = { ...state.preferences };
  const keys = ROLE_LABEL_KEYS[user.role_key];
  state.user = { ...user, role: keys ? t(keys[1]) : user.role };
  state.feedbackLoadedFor = null; state.feedback = [];
  persistUser();
  try {
    const saved = JSON.parse(localStorage.getItem(`civic-bridge-followed-${user.id}`) || "null");
    state.followedRepresentatives = new Set(saved || state.representatives.filter((rep) => rep.followed).map((rep) => rep.id));
  } catch (error) { /* use defaults */ }
  loadPreferences();
  if (!hasProfession() && !state.preferences.name && ((guestPreferences.interests || []).length || guestPreferences.name)) {
    state.preferences = { ...state.preferences, ...guestPreferences };
    persistPreferences();
  }
  document.querySelector("#modal-root").innerHTML = "";
  updateAccountButton();
  showToast(created ? t("toast_account_created", user.label) : t("toast_user_selected", user.label));
  if (next) next(); else render();
}

function signOut() {
  state.feedbackLoadedFor = null; state.feedback = [];
  if (state.user?.token) fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: state.user.token }) }).catch(() => {});
  state.user = null;
  persistUser();
  state.pendingAction = null;
  document.querySelector("#modal-root").innerHTML = "";
  state.followedRepresentatives = new Set();
  loadPreferences();
  updateAccountButton();
  render();
  showToast(t("toast_signed_out"));
}

function requireUser(action) {
  if (state.user) return action();
  state.pendingAction = action;
  showAuthModal();
}

function toggleFollow(id) {
  requireUser(() => {
    const following = state.followedRepresentatives.has(id);
    if (following) state.followedRepresentatives.delete(id); else state.followedRepresentatives.add(id);
    persistFollowed();
    render();
    showToast(following ? t("toast_rep_unfollowed") : t("toast_rep_followed"));
  });
}

function showShareModal(target) {
  state.shareTarget = target;
  const root = document.querySelector("#modal-root");
  if (!root) return;
  root.innerHTML = `<div class="modal-backdrop" data-close-modal><section class="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title"><div class="modal-top"><div><span class="eyebrow">${t("modal_share_eyebrow")}</span><h2 id="share-title">${t("modal_share_title")}</h2></div><button class="modal-close" data-close-modal aria-label="${t("close")}">×</button></div><p class="modal-copy">${t("modal_share_body")}</p><div class="share-preview"><span class="eyebrow">${esc(target.type || t("modal_share_eyebrow"))}</span><strong>${esc(target.title || t("civic_update_fallback"))}</strong><small>${t("share_source_backed", esc(state.dashboard.area || t("your_area")))}</small></div><div class="share-options">${[
    ["WhatsApp", t("share_whatsapp_desc")],
    ["SMS", t("share_sms_desc")],
    ["Copy link", t("share_copy_desc")],
  ].map(([channel, description]) => `<button class="share-option" data-share-channel="${channel}"><span class="option-avatar">${channel === "WhatsApp" ? "◌" : channel === "SMS" ? "✉" : channel === "Copy link" ? "↗" : "≋"}</span><span><strong>${channel}</strong><small>${description}</small></span><span>→</span></button>`).join("")}</div><p class="modal-footnote">${t("modal_share_footnote")}</p></section></div>`;
  root.querySelectorAll("[data-share-channel]").forEach((button) => button.addEventListener("click", () => submitShare(button.dataset.shareChannel)));
  root.querySelectorAll("[data-close-modal]").forEach((element) => element.addEventListener("click", (event) => { if (event.target === element) closeModal(); }));
  root.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", closeModal));
}

// Sharing is real: WhatsApp and SMS open the phone's own app with the text,
// Copy link uses the clipboard. The server only counts that a share happened.
async function submitShare(channel) {
  if (!state.shareTarget) return;
  const url = `${location.origin}${location.pathname}${state.view === "record" && state.recordId ? `#record/${encodeURIComponent(state.recordId)}` : ""}`;
  const text = `${state.shareTarget.title} — ${url}`;
  if (channel === "WhatsApp") window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  else if (channel === "SMS") location.href = `sms:?&body=${encodeURIComponent(text)}`;
  else { try { await navigator.clipboard.writeText(url); } catch (error) { /* clipboard blocked */ } }
  if (state.user) fetch("/api/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: authToken(), channel, target_type: state.shareTarget.type, target_title: state.shareTarget.title }) }).catch(() => {});
  document.querySelector("#modal-root").innerHTML = "";
  state.shareTarget = null;
  showToast(channel === "Copy link" ? t("toast_link_copied") : t("toast_share_opening", channel));
}

async function loadCommunity(recordId) {
  // Record ids repeat across countries, so drop the cache when the area's country changes.
  if (state.communityCountry !== state.dashboard.country) { state.community = {}; state.communityCountry = state.dashboard.country; }
  if (state.community[recordId]) return;
  const query = `?country=${encodeURIComponent(state.dashboard.country || "")}${state.user ? `&token=${encodeURIComponent(authToken())}` : ""}`;
  const response = await fetch(`/api/records/${encodeURIComponent(recordId)}/community${query}`);
  if (!response.ok) return;
  state.community[recordId] = await response.json();
  if (state.view === "record" && state.recordId === recordId && state.tab === "overview") renderRecord();
}

function renderCommunityPanel(record) {
  const community = state.community[record.id] || { comments: [], votes: { helpful: 0, "needs-clarity": 0 }, selected_vote: [] };
  const selected = community.selected_vote || [];
  return `<section class="panel community-panel"><div class="panel-heading"><div><span class="eyebrow">${t("community_pulse_eyebrow")} ${help("votes")}</span><h2>${t("community_pulse_title")}</h2></div><span class="live-pill"><i></i> ${t("community_signal")}</span></div><p class="panel-intro">${t("community_pulse_intro")}</p><div class="vote-row"><button class="vote-btn ${selected.includes("helpful") ? "selected" : ""}" data-vote="helpful"><span class="vote-icon">✓</span><span class="vote-text"><strong>${community.votes?.helpful || 0}</strong><small>${t("vote_helpful")}</small></span></button><button class="vote-btn needs-clarity ${selected.includes("needs-clarity") ? "selected" : ""}" data-vote="needs-clarity"><span class="vote-icon">!</span><span class="vote-text"><strong>${community.votes?.["needs-clarity"] || 0}</strong><small>${t("vote_needs_clarity")}</small></span></button></div><div class="questions-list"><span class="eyebrow">${t("questions_to_office_eyebrow", esc(responsibleOffice(record).name))} ${help("questions")}</span>${(community.questions || []).length ? (community.questions || []).map((item) => `<article class="comment-item question-item"><div class="comment-item-top"><strong>${esc(item.user_label)}</strong><small>${esc(formatActivityDate(item.created_at))} · ${esc(statusLabel(item.status))}</small></div>${item.question ? `<p class="asking-about">${esc(item.question)}</p>` : ""}<p>${esc(item.draft)}</p></article>`).join("") : `<div class="empty-reply">${t("no_questions_yet")}</div>`}<button class="text-btn" data-tab="feedback">${t("ask_the_office_arrow")}</button></div><div class="comment-form"><label class="form-label" for="record-comment">${t("add_public_comment")}</label><textarea id="record-comment" class="feedback-textarea" placeholder="${t("comment_placeholder")}"></textarea><label class="anon-toggle"><input type="checkbox" id="comment-anonymous" /> ${t("post_anonymously", esc(anonymousPersona()))} ${help("anonymous")}</label><div class="button-row"><button class="primary-btn" id="submit-record-comment">${t("add_comment")}</button>${!state.user ? `<span class="auth-required">${t("auth_required_note")}</span>` : ""}</div></div><div class="comment-list"><span class="eyebrow">${t("community_comments_eyebrow")}</span>${community.comments?.length ? community.comments.map((item) => `<article class="comment-item"><div class="comment-item-top"><strong>${esc(item.user_label)}</strong><small>${esc(formatActivityDate(item.created_at))}</small></div><p>${esc(item.message)}</p></article>`).join("") : `<p class="empty-comments">${t("community_comments_empty")}</p>`}</div></section>`;
}

function persistLocation() {
  try {
    localStorage.setItem("civic-bridge-area", JSON.stringify({ country: state.locationCountry, region: state.locationRegion, area: state.locationLocality }));
  } catch (error) {
    // Local persistence is optional in restricted browser contexts.
  }
}

function setRoute(view, recordId = null, tab = "overview") {
  state.view = view;
  state.recordId = recordId;
  state.tab = tab;
  state.draft = null;
  state.translation = null;
  state.autoAppliedFor = null;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAiStatusBanner() {
  const holder = document.querySelector("#ai-status-banner");
  if (!holder) return;
  const status = state.aiStatus;
  if (!status || state.aiStatusDismissed || (status.configured && status.reachable && status.model_available)) {
    holder.innerHTML = "";
    return;
  }
  let title, body;
  if (!status.configured) {
    title = t("ai_status_missing_title");
    body = `${t("ai_status_missing_body")}<pre>${esc(t("ai_status_missing_command"))}</pre>`;
  } else if (status.runtime === "docker") {
    title = t("ai_status_docker_title", esc(status.model));
    body = `<p>${t("ai_status_docker_body")}</p><pre>docker compose logs -f model-pull</pre>`;
  } else if (!status.reachable) {
    title = t("ai_status_unreachable_title");
    body = `<p>${t("ai_status_unreachable_body")}</p>`;
  } else {
    title = t("ai_status_model_missing_title", esc(status.model));
    body = `<p>${t("ai_status_model_missing_body", esc(status.model))}</p>`;
  }
  holder.innerHTML = `<div class="ai-status-bar"><div><strong>${title}</strong>${body}</div><button class="text-btn" id="dismiss-ai-status">${t("ai_status_dismiss")}</button></div>`;
  document.querySelector("#dismiss-ai-status")?.addEventListener("click", () => { state.aiStatusDismissed = true; renderAiStatusBanner(); });
}

async function loadAiStatus() {
  try {
    const response = await fetch("/api/ai-status");
    state.aiStatus = await response.json();
  } catch (error) {
    state.aiStatus = { configured: false, reachable: false, model: "", model_available: false };
  }
  renderAiStatusBanner();
  // Keep checking while AI isn't ready (Ollama opened later, model still downloading) so the banner clears by itself.
  const ready = state.aiStatus.configured && state.aiStatus.reachable && state.aiStatus.model_available;
  if (!ready && state.aiStatus.configured) setTimeout(loadAiStatus, 20000);
}

function renderSidebar() {
  const areaHolder = document.querySelector("#sidebar-area");
  const hasArea = Boolean(state.dashboard.area && state.dashboard.country);
  if (areaHolder) {
    const professionLabelText = professionLabel();
    areaHolder.innerHTML = `
      <button class="sidebar-area-card" data-route="locations">
        <span class="sidebar-area-eyebrow">${hasArea ? t("location_set") : t("location_needed")}</span>
        <strong>${hasArea ? esc(state.dashboard.area) : t("choose_location")}</strong>
        ${hasArea ? `<small>${esc(state.dashboard.region || "")}${state.dashboard.country ? ` · ${esc(state.dashboard.country)}` : ""}</small>` : ""}
        <span class="sidebar-area-action">${hasArea ? t("change_location") : t("choose_location")} →</span>
      </button>
      ${state.user ? `<div class="sidebar-account-card"><span class="account-avatar">${esc(state.user.initial || "R")}</span><div><strong>${esc(state.user.label)}</strong>${professionLabelText ? `<small>${esc(professionLabelText)}</small>` : ""}</div></div>` : ""}
    `;
  }
  const holder = document.querySelector("#sidebar-records");
  holder.innerHTML = "";
  if (areaHolder) areaHolder.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => setRoute(button.dataset.route)));
  document.querySelectorAll("[data-route]").forEach((button) => button.classList.toggle("active", button.dataset.route === state.view || (state.view === "record" && button.dataset.route === "home") || (state.view === "representative-detail" && button.dataset.route === "representatives")));
}

function cleanInterfaceCopy() {
  const replacements = [
    ["River District", "your selected area"],
    ["South River", "your region"],
    ["Fictional demo country", "your country"],
    ["This demo workspace", "Current workspace"],
    ["Fictional records for the demo workspace", "Source-labelled records for this area"],
    ["Illustrative map", "Area map"],
    ["Illustrative ", ""],
    ["Demo location", "Available location"],
    ["demo placeholder", "profile placeholder"],
    ["demo ward office", "ward office"],
    ["demo district office", "district office"],
    ["demo prefecture office", "prefecture office"],
    ["demo region office", "regional office"],
    ["Fictional demo profile", "Public profile"],
    ["published in this demo", "published in this workspace"],
    ["Demo statistics", "Activity statistics"],
    ["Demo translation preview", "Translation preview"],
    ["Demo translation pathway", "Translation pathway"],
    ["Local language (demo)", "Local language"],
    ["This demo keeps subscriptions local.", "Subscriptions are saved for this session."],
    ["Location stays in this demo", "Location stays on this device"],
    ["Demo behavior: this stays local and is marked", "This stays local and is marked"],
    ["This prototype uses fictional records.", "Source records are curated for this workspace."],
    ["This is a fictional record for demonstration.", "This source record is available for review."],
    ["lightweight simulation for the demo", "lightweight channel preview"],
    ["TEXT-ONLY SIMULATION", "TEXT-ONLY PREVIEW"],
    ["Nothing is sent from this demo", "Nothing is sent until you choose to send it"],
  ];
  replacements.forEach(([from, to]) => { app.innerHTML = app.innerHTML.replaceAll(from, to); });
}

function initLocationLeafletMap() {
  const stage = document.querySelector(".location-map-stage");
  if (!stage) return;
  stage.innerHTML = `<div id="location-map" class="area-map" aria-label="${esc(t("map_pick_country_label"))}"></div>`;
  if (!window.L) {
    stage.innerHTML += `<p class="map-fallback">${t("map_pick_country_loading")}</p>`;
    return;
  }
  const countryCenters = { Togo: [6.1319, 1.2228], Ghana: [7.95, -1.03], "Côte d’Ivoire": [7.54, -5.55], Kenya: [0.0236, 37.9062], Nigeria: [9.082, 8.6753] };
  const areaCenters = { Lomé: [6.1319, 1.2228], Nairobi: [-1.2864, 36.8172], Abidjan: [5.36, -4.0083], "Tamale North constituency": [9.4075, -0.8533], Lagos: [6.5244, 3.3792] };
  const selectedCenter = areaCenters[state.locationLocality] || countryCenters[state.locationCountry] || countryCenters.Togo;
  const map = window.L.map("location-map", { zoomControl: true, scrollWheelZoom: false, attributionControl: true }).setView(selectedCenter, 5);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap contributors" }).addTo(map);
  state.locations.forEach((location) => {
    const center = areaCenters[location.name] || countryCenters[location.country];
    if (!center) return;
    const marker = window.L.marker(center).addTo(map).bindTooltip(location.country, { direction: "top", offset: [0, -8] });
    marker.on("click", () => {
      state.locationCountry = location.country;
      const next = selectedLocation();
      state.locationRegion = next.regions?.[0] || "";
      state.locationLocality = state.localities.find((item) => item.country === state.locationCountry && item.region === state.locationRegion)?.name || "";
      render();
    });
  });
  window.setTimeout(() => map.invalidateSize(), 50);
}

function roleWorkspace() {
  if (!state.user) return `<section class="role-banner resident"><span class="eyebrow">${t("role_public_eyebrow")} ${help("public_view")}</span><strong>${t("role_public_title")}</strong><span>${t("role_public_body")}</span></section>`;
  if (userRole() === "office") return `<section class="role-banner office"><span class="eyebrow">${t("role_office_eyebrow")} ${help("office_view")}</span><strong>${t("role_office_title")}</strong><span>${t("role_office_body")}</span><button class="secondary-btn" data-route="representatives">${t("role_office_button")}</button></section>`;
  return `<section class="role-banner resident"><span class="eyebrow">${t("role_resident_eyebrow")} ${help("resident_view")}</span><strong>${t("role_resident_title")}</strong><span>${t("role_resident_body")}</span><button class="secondary-btn" data-route="issues">${t("role_resident_button")}</button></section>`;
}

function qrPattern() {
  return Array.from({ length: 64 }, (_, index) => `<i class="qr-cell ${((index * 17 + 3) % 7 < 3 || index < 8 || index % 8 < 2) ? "on" : ""}"></i>`).join("");
}



function renderHome() {
  const hasArea = Boolean(state.dashboard.area && state.dashboard.country);
  const area = hasArea ? state.dashboard.area : "No area selected";
  const region = hasArea ? state.dashboard.region : "Choose a country and locality";
  const country = hasArea ? state.dashboard.country : "Location needed";
  const visibleRepresentatives = hasArea ? state.representatives : [];
  const visibleIssues = hasArea ? rankForProfile(state.issues) : [];
  const baseMetrics = hasArea ? (state.dashboard.metrics || []) : [
    { label: t("metric_location"), value: "—", detail: t("metric_location_detail"), tone: "ochre" },
    { label: t("metric_representatives"), value: "—", detail: t("metric_representatives_detail"), tone: "blue" },
    { label: t("metric_issues"), value: "—", detail: t("metric_issues_detail"), tone: "green" },
    { label: t("metric_languages"), value: String((state.dashboard.languages || []).length || 0), detail: t("metric_languages_detail"), tone: "violet" },
  ];
  const totals = visibleRepresentatives.reduce((acc, rep) => {
    acc.questions += rep.questions_received || 0; acc.replies += rep.responses_on_file || 0; acc.records += rep.commitments || 0;
    acc.helpful += rep.votes?.helpful || 0; acc.unclear += rep.votes?.["needs-clarity"] || 0; return acc;
  }, { questions: 0, replies: 0, records: 0, helpful: 0, unclear: 0 });
  const areaResponseRate = totals.questions ? `${Math.min(100, Math.round((totals.replies / totals.questions) * 100))}%` : "—";
  const areaPulse = totals.helpful + totals.unclear ? `${Math.round((totals.helpful / (totals.helpful + totals.unclear)) * 100)}%` : "—";
  const metrics = !hasArea ? baseMetrics : userRole() === "office" ? [
    { label: t("metric_open_questions"), value: String(Math.max(0, totals.questions - totals.replies)), detail: t("metric_open_questions_office_detail"), tone: "ochre" },
    { label: t("metric_commitments"), value: String(totals.records), detail: t("metric_commitments_detail"), tone: "blue" },
    { label: t("metric_response_rate"), value: areaResponseRate, detail: t("metric_response_rate_detail"), tone: "green" },
    { label: t("metric_pending_review"), value: String(totals.replies), detail: t("metric_pending_review_detail"), tone: "violet" },
  ] : baseMetrics;
  const lead = hasArea ? visibleIssues[0] : null;
  const rest = hasArea ? visibleIssues.slice(1, 3) : [];
  const byline = (issue) => `<span>${esc(issue.source)}</span><span>${esc(issue.locality)}</span><span>${t("updated_label", esc(issue.last_update))}</span>${professionWeight(issue) > 0 ? `<span class="tag status">${t("matches_profile")}</span>` : ""}${rankingExplanation(issue)}`;
  app.innerHTML = `
    <section class="masthead">
      <div class="masthead-line"><span>${hasArea ? esc(state.dashboard.last_sync || "") : t("home_eyebrow")}</span>${hasArea ? `<span class="masthead-dot">·</span><span>${esc(area)}, ${esc(country)}</span>` : ""}</div>
      <h1>${t("home_title")} ${help("home")}</h1>
    </section>
    ${roleWorkspace()}
    ${hasArea ? "" : `<section class="empty-state setup-state" style="margin-bottom:20px"><div class="empty-icon">⌖</div><h2>${t("choose_area_first_title")}</h2><p>${t("home_body_no_area")}</p><button class="primary-btn" data-route="locations">${t("choose_location")}</button></section>`}
    <section class="news-layout">
      <div class="news-main">
        ${lead ? `
          <div class="for-you-head"><span class="eyebrow">${hasProfession() ? t("recommended_eyebrow") : t("latest_eyebrow")} ${help("for_you")}</span></div>
          <button class="lead-story" data-record="${esc(lead.id)}">
            <span class="story-kicker">${esc(lead.type)}</span>
            <h2>${esc(lead.title)}</h2>
            <p>${esc(lead.summary)}</p>
            <div class="story-byline">${byline(lead)}</div>
          </button>
          <div class="story-list">${rest.map((issue) => `<button class="story-row" data-record="${esc(issue.id)}"><span class="story-kicker">${esc(issue.type)}</span><h3>${esc(issue.title)}</h3><p>${esc(issue.summary)}</p><div class="story-byline">${byline(issue)}</div></button>`).join("")}</div>
        ` : ""}
      </div>
      <aside class="news-rail">
        <article class="rail-widget"><span class="eyebrow">${hasProfession() ? t("recommended_eyebrow") : t("your_area_eyebrow")}</span><h3>${hasProfession() ? t("sorted_for_profile", esc(professionLabel())) : (hasArea ? `${esc(area)}, ${esc(country)}` : t("choose_location"))}</h3><div class="rail-stat-row">${metrics.slice(0, 4).map((metric) => `<div class="rail-stat"><strong>${esc(metric.value)}</strong><span>${esc(metric.label)}</span></div>`).join("")}</div></article>
        <article class="rail-widget"><span class="eyebrow">${t("area_view_eyebrow")} ${help("levels")}</span><h3>${hasArea ? `${esc(area)}, ${esc(country)}` : t("choose_area_see_map")}</h3>${hasArea ? `<div class="language-row">${(state.dashboard.hierarchy || []).filter((level) => level !== "All levels" && level !== "Tous les niveaux").map((level) => `<span class="language-chip">${esc(level)}</span>`).join("")}</div>` : `<p class="panel-intro" style="margin:0">${t("home_body_no_area")}</p>`}<button class="text-btn" style="margin-top:10px" data-route="locations">${hasArea ? t("change_area_arrow") : t("choose_area_arrow")}</button></article>
        <article class="rail-widget"><span class="eyebrow">${t("watchlist_eyebrow")} ${help("offices")}</span><h3>${t("watchlist_title")}</h3><div class="watch-list">${hasArea ? visibleRepresentatives.slice(0, 3).map((rep) => `<button class="watch-row" data-route="representatives"><span class="avatar-mini">${esc(rep.level.slice(0, 1))}</span><span><strong>${esc(representativeName(rep))}</strong><small>${esc(representativeLocality(rep))}</small></span><span class="watch-arrow">↗</span></button>`).join("") : `<div class="empty-state">${t("watchlist_empty")}</div>`}</div><button class="text-btn" style="margin-top:8px" data-route="representatives">${t("view_all_arrow")}</button></article>
      </aside>
    </section>
      ${hasArea ? allRecordsSection() : ""}
  `;
  wireIssueFilters();
}

function renderRecordCards(records) {
  const grid = document.querySelector("#record-grid");
  if (!records.length) {
    grid.innerHTML = `<div class="empty-state">${t("no_matching_record")}</div>`;
    document.querySelector("#result-count").textContent = t("record_count", 0);
    return;
  }
  grid.innerHTML = records.map((record) => `
    <button class="record-card" data-record="${esc(record.id)}">
      <div class="record-card-top"><span class="case-kicker">${esc(record.category)}</span><span class="record-arrow" aria-hidden="true">↗</span></div>
      <h3>${esc(record.title)}</h3>
      <p>${esc(record.summary)}</p>
      <div class="record-meta"><span class="tag status">${esc(record.status)}</span><span class="tag open">${esc(record.status_detail)}</span><span class="tag">${esc(record.source_date)}</span></div>
    </button>
  `).join("");
  document.querySelector("#result-count").textContent = t("record_count", records.length);
  document.querySelectorAll("#record-grid [data-record]").forEach((button) => button.addEventListener("click", () => setRoute("record", button.dataset.record)));
}

async function loadGroups() {
  if (!state.dashboard.country) return;
  try {
    const response = await fetch(`/api/groups?country=${encodeURIComponent(state.dashboard.country)}`, { cache: "no-store" });
    if (response.ok) { state.groups = (await response.json()).groups || []; if (state.view === "groups") { renderGroups(true); } }
  } catch (error) { /* offline */ }
}

function groupCard(group) {
  const names = TOPIC_NAMES[uiLang()] || TOPIC_NAMES.en;
  const mine = (state.preferences.interests || []).includes(group.topic);
  return `<button class="group-card ${mine ? "mine" : ""}" data-group="${group.topic}"><strong>${esc(names[group.topic] || group.topic)}</strong><span>${t("group_members", group.members)} · ${t("group_posts", group.post_count ?? (group.posts || []).length)}</span>${mine ? `<em>${t("group_from_profile")}</em>` : ""}</button>`;
}

function renderGroups(fromLoad = false) {
  if (!state.dashboard.area || !state.dashboard.country) return renderAreaRequired();
  if (!fromLoad) loadGroups();
  const interests = state.preferences.interests || [];
  const mine = state.groups.filter((group) => interests.includes(group.topic));
  const others = state.groups.filter((group) => !interests.includes(group.topic) && group.members > 0);
  app.innerHTML = `
    <section class="page-head"><div><span class="eyebrow">${t("groups_eyebrow")} ${help("groups")}</span><h1>${t("groups_title")}</h1><p>${t("groups_body")}</p></div><div class="head-note"><strong>${esc(state.dashboard.area)}</strong><span>${esc(state.dashboard.country)}</span></div></section>
    ${interests.length ? `<span class="eyebrow">${t("groups_mine_eyebrow")}</span><section class="group-grid">${mine.map(groupCard).join("") || `<p class="empty-state">${t("groups_loading")}</p>`}</section>` : `<section class="panel"><span class="eyebrow">${t("groups_mine_eyebrow")}</span><p class="panel-intro">${t("groups_no_profile")}</p><button class="primary-btn" data-route="settings">${t("nav_settings")}</button></section>`}
    <span class="eyebrow" style="display:block;margin-top:22px">${t("groups_all_eyebrow")}</span>
    <section class="group-grid">${others.map(groupCard).join("") || `<p class="empty-state">${t("groups_loading")}</p>`}</section>
    <p class="disclaimer" style="margin-top:18px">${t("groups_privacy_note")}</p>`;
  document.querySelectorAll("[data-group]").forEach((button) => button.addEventListener("click", () => { state.groupTopic = button.dataset.group; state.group = null; setRoute("group"); }));
  bindAppActions();
}

async function renderGroupDetail() {
  if (!state.dashboard.country || !state.groupTopic) return setRoute("groups");
  const names = TOPIC_NAMES[uiLang()] || TOPIC_NAMES.en;
  const topic = state.groupTopic;
  if (!state.group || state.group.topic !== topic) {
    app.innerHTML = `<button class="breadcrumb" data-route="groups">${t("back_to_groups")}</button><p class="empty-state">${t("groups_loading")}</p>`;
    bindAppActions();
    try { const response = await fetch(`/api/groups/${encodeURIComponent(topic)}?country=${encodeURIComponent(state.dashboard.country)}`, { cache: "no-store" }); if (response.ok) state.group = await response.json(); } catch (error) { /* offline */ }
    if (!state.group || state.view !== "group") return;
  }
  const group = state.group;
  const related = state.issues.filter((issue) => issueTopic(issue) === topic).slice(0, 6);
  const mine = (state.preferences.interests || []).includes(topic);
  app.innerHTML = `
    <button class="breadcrumb" data-route="groups">${t("back_to_groups")}</button>
    <section class="page-head"><div><span class="eyebrow">${t("group_eyebrow")}</span><h1>${esc(names[topic] || topic)} · ${esc(state.dashboard.area)}</h1><p>${t("group_intro", group.members, esc(state.dashboard.country))}</p>${group.localities.length ? `<p class="field-hint">${t("group_localities", esc(group.localities.join(" · ")))}</p>` : ""}</div><div class="head-note"><strong>${group.members}</strong><span>${t("group_members_label")}</span></div></section>
    ${mine ? "" : `<div class="addressed-to">${t("group_not_in_profile")} <button class="text-btn" data-route="settings">${t("why_correct_it")}</button></div>`}
    <section class="section-grid rep-detail-grid">
      <article class="panel"><span class="eyebrow">${t("group_posts_eyebrow")} ${help("group_conversation")}</span><h2>${t("group_posts_title")}</h2>
        <div class="comment-form"><label class="form-label" for="group-message">${t("group_post_label")}</label><textarea id="group-message" class="feedback-textarea" placeholder="${t("group_post_placeholder")}"></textarea><label class="anon-toggle"><input type="checkbox" id="group-anonymous" /> ${t("post_anonymously", esc(anonymousPersona()))} ${help("anonymous")}</label><div class="button-row"><button class="primary-btn" id="submit-group-post">${t("group_post_button")}</button>${!state.user ? `<span class="auth-required">${t("auth_required_note")}</span>` : ""}</div></div>
        <div class="comment-list">${group.posts.length ? group.posts.map((item) => `<article class="comment-item"><div class="comment-item-top"><strong>${esc(item.user_label)}</strong><small>${esc(formatActivityDate(item.created_at))}</small></div><p>${esc(item.message)}</p></article>`).join("") : `<div class="empty-state">${t("group_no_posts")}</div>`}</div>
      </article>
      <aside class="panel"><span class="eyebrow">${t("group_records_eyebrow")} ${help("group_records")}</span><h2>${t("group_records_title")}</h2><p class="panel-intro">${t("group_records_body")}</p>
        ${related.length ? related.map((issue) => `<button class="watch-row" data-record="${esc(issue.id)}"><span><strong>${esc(issue.title)}</strong><small>${esc(issue.type)} · ${esc(issue.last_update)}</small></span><span class="watch-arrow">↗</span></button>`).join("") : `<div class="empty-state">${t("group_no_records")}</div>`}
        <p class="disclaimer" style="margin-top:14px">${t("groups_privacy_note")}</p>
      </aside>
    </section>`;
  bindAppActions();
  const submit = document.querySelector("#submit-group-post");
  if (submit) submit.addEventListener("click", () => requireUser(async () => {
    const message = document.querySelector("#group-message").value.trim();
    if (!message) return showToast(t("toast_comment_required"));
    const response = await fetch(`/api/groups/${encodeURIComponent(topic)}/posts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: authToken(), country: state.dashboard.country, message, anonymous: Boolean(document.querySelector("#group-anonymous")?.checked), persona: anonymousPersona() }) });
    const data = await response.json();
    if (!response.ok) return showToast(data.error || t("toast_comment_failed"));
    state.group.posts.unshift(data);
    renderGroupDetail();
    showToast(t("toast_comment_added"));
  }));
}

function renderAreaRequired() {
  app.innerHTML = `<section class="empty-state setup-state"><div class="empty-icon">⌖</div><h2>${t("choose_area_first_title")}</h2><p>${t("choose_area_first_body")}</p><button class="primary-btn" data-route="locations">${t("choose_location")}</button></section>`;
}

function wireIssueFilters() {
  document.querySelectorAll("[data-show-more]").forEach((button) => button.addEventListener("click", () => { state.recordsShown += 12; const y = window.scrollY; render(); window.scrollTo({ top: y }); }));
  document.querySelectorAll("[data-issue-filter]").forEach((button) => button.addEventListener("click", () => { state.issueFilter = button.dataset.issueFilter; state.recordsShown = 12; const y = window.scrollY; render(); window.scrollTo({ top: y }); }));
}

function wireRepresentativeControls() {
  document.querySelector("#rep-level")?.addEventListener("change", (event) => { state.repLevel = event.target.value; renderRepresentatives(); bindAppActions(); });
  document.querySelectorAll("[data-follow-rep]").forEach((button) => button.addEventListener("click", () => toggleFollow(button.dataset.followRep)));
}


function recordListMarkup(issues) {
  return `
    <section class="issue-list">${issues.map((issue) => { const hasRecord = state.records.some((record) => record.id === issue.id); return `<article class="issue-list-row"><div class="issue-list-main"><span class="case-kicker">${esc(issue.type)} · ${esc(issue.locality)}</span><h2>${esc(issue.title)}</h2><p>${esc(issue.summary)}</p><div class="record-meta"><span class="tag ${issue.status === "Illustrative fixture" ? "open" : "status"}">${esc(statusLabel(issue.status))}</span><span class="tag">${esc(issue.priority)}</span><span class="tag">${esc(t("updated_label", issue.last_update))}</span>${professionWeight(issue) > 0 ? `<span class="tag status">${t("matches_profile")}</span>` : ""}</div>${rankingExplanation(issue)}</div><div class="issue-list-side"><span class="issue-source">${esc(issue.source)}</span>${hasRecord ? `<button class="secondary-btn" data-record="${esc(issue.id)}">${t("open_evidence_arrow")}</button>` : `<button class="secondary-btn" data-action="issue-note">${t("view_source_note_arrow")}</button>`}</div></article>`; }).join("")}</section>
  `;
}

function allRecordsSection() {
  const filters = ["All issues", "notices", "reference"];
  const filterLabels = { "All issues": t("filter_all_issues"), notices: t("filter_notices"), reference: t("filter_reference") };
  const filterHelp = { "All issues": help("everything"), notices: help("published_notice"), reference: help("reference_record") };
  const isNotice = (issue) => String(issue.id || "").startsWith("notice-");
  const visible = state.issueFilter === "notices" ? state.issues.filter(isNotice) : state.issueFilter === "reference" ? state.issues.filter((issue) => !isNotice(issue)) : state.issues;
  return `
    <section class="all-records" id="all-records">
      <div class="section-heading"><div><span class="eyebrow">${t("issue_tracker_eyebrow")} ${help("everything")}</span><h2>${t("issues_near", state.issues.length, esc(state.dashboard.area))}</h2></div></div>
      <div class="filter-row issue-filters">${filters.map((filter) => `<span class="filter-with-help"><button class="filter-chip ${state.issueFilter === filter ? "selected" : ""}" data-issue-filter="${esc(filter)}">${esc(filterLabels[filter])}</button>${filterHelp[filter]}</span>`).join("")}</div>
      ${recordListMarkup(visible.slice(0, state.recordsShown))}
      ${visible.length > state.recordsShown ? `<button class="secondary-btn show-more" data-show-more>${t("show_more_records", Math.min(12, visible.length - state.recordsShown), visible.length - state.recordsShown)}</button>` : ""}
    </section>`;
}

function renderIssues() {
  // Issues merged into Home: same page, scrolled to the full list.
  renderHome();
  document.querySelector("#all-records")?.scrollIntoView({ block: "start" });
}

function renderRepresentatives() {
  if (!state.dashboard.area || !state.dashboard.country) return renderAreaRequired();
  const levels = state.dashboard.hierarchy || ["All levels", "Ward", "District", "Region"];
  const visible = state.repLevel === "All levels" ? state.representatives : state.representatives.filter((rep) => rep.level === state.repLevel);
  app.innerHTML = `
    <section class="page-head compact-head"><div><span class="eyebrow">${t("rep_map_eyebrow")} ${help("representatives")}</span><h1>${t("rep_map_title")}</h1><p>${t("rep_map_body")}</p></div><div class="area-switcher"><span class="eyebrow">${t("area_eyebrow")}</span><strong>${esc(state.dashboard.area || "")}</strong><small>${esc(state.dashboard.region || "")} · ${esc(state.dashboard.country || "")}</small><button class="secondary-btn" data-route="locations">${t("change_area")}</button></div></section>
    <div class="rep-toolbar"><label class="form-label" for="rep-level">${t("representative_level")}</label><select id="rep-level" class="feedback-select">${levels.map((level) => `<option ${state.repLevel === level ? "selected" : ""}>${esc(level)}</option>`).join("")}</select><span class="toolbar-note">${t("offices_in_view", visible.length)}</span></div>
    <section class="rep-grid">${visible.map((rep) => { const followed = state.followedRepresentatives.has(rep.id); const profile = representativeProfile(rep); const pct = sourcedPct(rep); return `<article class="rep-card"><div class="rep-card-top"><span class="rep-level">${esc(rep.level)}</span><button class="follow-btn ${followed ? "followed" : ""}" data-follow-rep="${esc(rep.id)}">${followed ? t("following") : t("follow")}</button></div><div class="rep-identity"><img class="rep-avatar-photo" src="${esc(profile.photo)}" alt="${esc(representativeName(rep))}" onerror="this.onerror=null;this.src='${esc(profile.fallback)}'" /><div><h2>${esc(representativeName(rep))}</h2><p>${esc(rep.name)} · ${esc(rep.role)} · ${esc(representativeLocality(rep))}</p></div></div><div class="rep-focus"><span class="eyebrow">${t("public_focus_eyebrow")} ${help("focus")}</span><strong>${esc(rep.focus)}</strong></div><div class="rep-stats"><div><strong>${rep.commitments}</strong><span>${t("stat_commitments")}</span></div><div><strong>${rep.verified}</strong><span>${t("stat_verified")}</span></div><div><strong>${pctText(rep.response_rate)}</strong><span>${t("stat_response_rate")}</span></div></div><div class="progress-track"><span style="width:${pct}%"></span></div><div class="rep-footer"><span>${esc(rep.coverage)}</span><span>${rep.last_update === t("no_activity_yet") ? t("no_activity_yet") : t("last_update_label", esc(rep.last_update))}</span></div><button class="text-btn profile-link" data-rep-detail="${esc(rep.id)}">${t("open_public_profile_arrow")}</button></article>`; }).join("")}</section>
    <article class="panel hierarchy-panel"><span class="eyebrow">${t("hierarchy_scale_eyebrow")}</span><h2>${t("hierarchy_scale_title")}</h2><p class="panel-intro">${t("hierarchy_scale_body")}</p><div class="hierarchy">${levels.filter((level) => level !== "All levels" && level !== "Tous les niveaux").map((level, index) => `${index ? '<i>→</i>' : ''}<span>${esc(level)}</span>`).join("")}</div></article>
  `;
  wireRepresentativeControls();
}

function selectedLocation() {
  return state.locations.find((item) => item.country === state.locationCountry) || state.locations[0] || { country: "Fictional demo country", regions: ["South River"] };
}

function wireLocationPicker() {
  document.querySelectorAll("[data-country]").forEach((button) => button.addEventListener("click", () => {
    state.locationCountry = button.dataset.country;
    const next = selectedLocation();
    state.locationRegion = next.regions?.[0] || "";
    state.locationLocality = state.localities.find((item) => item.country === state.locationCountry && item.region === state.locationRegion)?.name || "";
    render();
  }));
  const country = document.querySelector("#location-country");
  if (country) country.addEventListener("change", (event) => {
    state.locationCountry = event.target.value;
    const next = selectedLocation();
    state.locationRegion = next.regions?.[0] || "";
    state.locationLocality = state.localities.find((item) => item.country === state.locationCountry && item.region === state.locationRegion)?.name || "";
    render();
  });
  const region = document.querySelector("#location-region");
  if (region) region.addEventListener("change", (event) => {
    state.locationRegion = event.target.value;
    state.locationLocality = state.localities.find((item) => item.country === state.locationCountry && item.region === state.locationRegion)?.name || "";
    render();
  });
  const locality = document.querySelector("#location-locality");
  if (locality) locality.addEventListener(locality.tagName === "SELECT" ? "change" : "input", (event) => {
    state.locationLocality = event.target.value;
    const summary = document.querySelector(".location-summary strong");
    if (summary) summary.textContent = state.locationLocality || "Choose a locality";
  });
}

function reverseGeocodeAddress(coords) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${encodeURIComponent(coords.latitude)}&lon=${encodeURIComponent(coords.longitude)}`;
  return fetch(url, { headers: { Accept: "application/json" } }).then((response) => {
    if (!response.ok) throw new Error("reverse geocoding failed");
    return response.json();
  }).then((data) => data.address || {});
}

function matchLocationFromAddress(address) {
  const countryCode = String(address.country_code || "").toLowerCase();
  const match = state.locations.find((item) => ({ tg: "Togo", gh: "Ghana", ci: "Côte d’Ivoire", ke: "Kenya", ng: "Nigeria" }[countryCode] || "") === item.country);
  if (!match) return null;
  const detectedRegion = address.state || address.region || "";
  const region = match.regions.includes(detectedRegion) ? detectedRegion : (match.regions?.[0] || "");
  const rawLocality = address.city || address.town || address.village || address.municipality || "";
  const known = state.localities.filter((item) => item.country === match.country && item.region === region);
  const locality = known.some((item) => item.name === rawLocality) ? rawLocality : (known[0]?.name || rawLocality);
  return { country: match.country, region, locality, addressCountry: address.country || countryCode.toUpperCase() };
}

function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("no geolocation"));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
  });
}

async function requestBrowserLocation() {
  if (!navigator.geolocation) return showToast(t("toast_location_unavailable"));
  showToast(t("toast_requesting_location"));
  try {
    const { coords } = await getBrowserPosition();
    const address = await reverseGeocodeAddress(coords);
    const match = matchLocationFromAddress(address);
    if (!match) return showToast(t("toast_location_found_other", address.country || String(address.country_code || "").toUpperCase()));
    state.locationCountry = match.country;
    state.locationRegion = match.region;
    state.locationLocality = match.locality;
    setRoute("locations");
    showToast(t("toast_location_found", match.country));
  } catch (error) {
    showToast(error?.code === 1 ? t("toast_location_denied") : t("toast_location_failed"));
  }
}

async function autoDetectLocation() {
  if (!navigator.geolocation) return null;
  try {
    const { coords } = await getBrowserPosition();
    const address = await reverseGeocodeAddress(coords);
    return matchLocationFromAddress(address);
  } catch (error) {
    return null;
  }
}

function representativeLocality(rep) {
  return rep.locality || state.dashboard.area || "Selected area";
}

function renderLocations() {
  if (!state.locationCountry && state.locations[0]) {
    state.locationCountry = state.locations[0].country;
    state.locationRegion = state.locations[0].regions?.[0] || "";
  }
  const location = selectedLocation();
  const regions = location.regions || [];
  const localities = state.localities.filter((item) => item.country === location.country && item.region === state.locationRegion);
  const localityChoices = localities.length ? localities : [{ name: state.locationLocality || "Choose a locality" }];
  const hasKnownLocality = localities.some((item) => item.name === state.locationLocality);
  const localityField = localities.length && (!state.locationLocality || hasKnownLocality) ? `<select id="location-locality" class="feedback-select">${localityChoices.map((item) => `<option ${state.locationLocality === item.name ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select>` : `<input id="location-locality" class="feedback-select" value="${esc(state.locationLocality)}" placeholder="${t("locality_placeholder")}" />`;
  app.innerHTML = `
    <section class="page-head compact-head"><div><span class="eyebrow">${t("set_area_eyebrow")}</span><h1>${t("set_area_title")}</h1><p>${t("set_area_body")}</p></div><div class="head-note"><strong>${t("location_stays_note")}</strong><span>${t("location_permission_note")}</span></div></section>
    <section class="location-layout">
      <article class="panel location-map-panel"><div class="panel-heading"><div><span class="eyebrow">${t("location_map_eyebrow")}</span><h2>${t("pick_a_country")}</h2></div><span class="live-pill"><i></i> ${t("live_map")}</span></div><div class="location-map-stage"></div><p class="map-caption">${t("map_caption")}</p><div class="country-list">${state.locations.map((item) => `<button class="country-option ${state.locationCountry === item.country ? "selected" : ""}" data-country="${esc(item.country)}"><span class="country-dot"></span><span><strong>${esc(item.country)}</strong><small>${item.recommended ? t("recommended_starting_area") : t("available_area")}</small></span><span>→</span></button>`).join("")}</div></article>
      <article class="panel location-form-panel"><span class="eyebrow">${t("civic_desk_eyebrow")} ${help("location")}</span><h2>${t("choose_place_title")}</h2><p class="panel-intro">${t("choose_place_body")}</p><button class="geolocate-btn" data-action="geolocate"><span>⌖</span><span><strong>${t("use_my_location")}</strong><small>${t("use_my_location_note")}</small></span></button><div class="or-divider"><span>${t("or_choose_manually")}</span></div><label class="form-label" for="location-country">${t("country_label")}</label><select id="location-country" class="feedback-select">${state.locations.map((item) => `<option ${state.locationCountry === item.country ? "selected" : ""}>${esc(item.country)}</option>`).join("")}</select><label class="form-label" for="location-region">${t("region_label")}</label><select id="location-region" class="feedback-select">${regions.map((region) => `<option ${state.locationRegion === region ? "selected" : ""}>${esc(region)}</option>`).join("")}</select><label class="form-label" for="location-locality">${t("locality_label")}</label>${localityField}<div class="location-summary"><span class="eyebrow">${t("selected_area_eyebrow")}</span><strong>${esc(state.locationLocality || t("choose_a_locality"))}</strong><small>${esc(state.locationRegion)} · ${esc(state.locationCountry)}</small></div><button class="primary-btn set-area-btn" data-action="set-area">${t("set_this_area")}</button><p class="disclaimer">${t("location_disclaimer")}</p></article>
    </section>
  `;
  wireLocationPicker();
}

function representativeTrackRecord(rep) {
  return [
    t("track_record_entry_commitments", rep.commitments, rep.last_update),
    t("track_record_entry_verified", rep.verified, rep.commitments),
    t("track_record_entry_replies", rep.responses_on_file || 0, rep.questions_received || 0),
    t("track_record_entry_focus", rep.focus),
  ];
}

function renderRepresentativeDetail() {
  const rep = state.representatives.find((item) => item.id === state.repId);
  if (!rep) return setRoute("representatives");
  const verifiedPct = sourcedPct(rep);
  const responses = state.repResponses[rep.id] || [];
  app.innerHTML = `
    <button class="breadcrumb" data-route="representatives">${t("back_to_representatives")}</button>
    <section class="rep-detail-header"><div class="rep-photo"><img src="${esc(representativeProfile(rep).photo)}" alt="${esc(representativeName(rep))}" onerror="this.onerror=null;this.src='${esc(representativeProfile(rep).fallback)}'" /></div><div class="rep-detail-copy"><span class="rep-level">${t("office_level_suffix", esc(rep.level))}</span><h1>${esc(representativeName(rep))}</h1><p>${esc(rep.name)} · ${esc(rep.role)} · ${esc(representativeLocality(rep))} · ${esc(rep.coverage)}</p><div class="rep-detail-actions"><button class="follow-btn ${state.followedRepresentatives.has(rep.id) ? "followed" : ""}" data-follow-detail="${esc(rep.id)}">${state.followedRepresentatives.has(rep.id) ? t("following") : t("follow_office")}</button><button class="secondary-btn" data-action="share-representative" data-share-title="${esc(representativeName(rep))}">${t("share_profile")}</button><span class="verified-label">${t("public_profile_verified")}</span></div></div></section>
    <div class="rep-stat-grid"><article class="rep-stat-card"><span>${t("stat_card_commitments")} ${help("records_on_file")}</span><strong>${rep.commitments}</strong><small>${t("stat_card_commitments_detail")}</small></article><article class="rep-stat-card"><span>${t("stat_card_verified")} ${help("sourced")}</span><strong>${rep.verified}</strong><small>${t("stat_card_verified_detail")}</small></article><article class="rep-stat-card"><span>${t("stat_card_response_rate")} ${help("response_rate")}</span><strong>${pctText(rep.response_rate)}</strong><small>${t("stat_card_response_rate_detail")}</small></article><article class="rep-stat-card"><span>${t("stat_card_community_pulse")} ${help("community_pulse")}</span><strong>${pctText(rep.community_pulse)}</strong><small>${t("stat_card_community_pulse_detail")}</small></article></div>
    <section class="section-grid rep-detail-grid"><article class="panel"><div class="panel-heading"><div><span class="eyebrow">${t("public_record_eyebrow")} ${help("public_record")}</span><h2>${t("public_record_title")}</h2></div><span class="live-pill"><i></i> ${t("activity_statistics")}</span></div><p class="panel-intro">${t("public_record_body")}</p><div class="bar-list"><div class="bar-row"><div><span>${t("bar_commitments_evidence")}</span><strong>${verifiedPct}%</strong></div><div class="bar-track"><span style="width:${verifiedPct}%"></span></div></div><div class="bar-row"><div><span>${t("bar_questions_answered")}</span><strong>${pctText(rep.response_rate)}</strong></div><div class="bar-track"><span style="width:${pctWidth(rep.response_rate)}%"></span></div></div><div class="bar-row"><div><span>${t("bar_community_pulse")}</span><strong>${pctText(rep.community_pulse)}</strong></div><div class="bar-track"><span style="width:${pctWidth(rep.community_pulse)}%"></span></div></div></div><div class="public-record-list"><div><span>${t("list_last_update")}</span><strong>${esc(rep.last_update)}</strong></div><div><span>${t("list_questions_received")}</span><strong>${rep.questions_received}</strong></div><div><span>${t("list_updates_issued")}</span><strong>${rep.updates_issued}</strong></div><div><span>${t("list_office_replies")}</span><strong>${rep.responses_on_file || 0}</strong></div></div><p class="rep-bio">${esc(rep.bio)}</p></article><aside class="panel right-reply"><span class="eyebrow">${t("right_of_reply_eyebrow")} ${help("right_of_reply")}</span><h2>${t("right_of_reply_title")}</h2><p class="panel-intro">${t("right_of_reply_body")}</p>${userRole() === "office" ? `<label class="form-label" for="rep-response-type">${t("response_type_label")}</label><select id="rep-response-type" class="feedback-select"><option>${t("response_type_correct")}</option><option>${t("response_type_context")}</option><option>${t("response_type_source")}</option></select><label class="form-label" for="rep-response">${t("office_response_label")}</label><textarea id="rep-response" class="feedback-textarea" placeholder="${t("office_response_placeholder")}"></textarea><button class="primary-btn" id="submit-rep-response">${t("submit_response")}</button><p class="disclaimer">${t("response_disclaimer")}</p>` : `<p class="disclaimer office-only-note">${t("office_only_reply")}</p>`}<div class="reply-list"><span class="eyebrow">${t("questions_received_eyebrow")} ${help("questions")}</span>${(rep.questions || []).length ? (rep.questions || []).map((item) => `<div class="reply-item question-item"><strong>${esc(item.user_label)} · ${esc(formatActivityDate(item.created_at))}</strong><p>${esc(item.question || item.draft)}</p><small>${esc(item.record_title)}</small>${userRole() === "office" ? `<button class="text-btn" data-reply-to="${esc((item.question || item.draft).slice(0, 120))}">${t("reply_to_this")}</button>` : ""}</div>`).join("") : `<div class="empty-reply">${t("no_questions_received")}</div>`}</div><div class="reply-list"><span class="eyebrow">${t("responses_on_file_eyebrow")} ${help("responses")}</span>${responses.length ? responses.map((item) => `<div class="reply-item"><strong>${esc(item.type || t("office_response_fallback"))}</strong><p>${esc(item.message)}</p><small>${esc(item.user_label || t("office_response_fallback"))} · ${esc(item.status)} · ${esc(formatActivityDate(item.created_at))}</small></div>`).join("") : `<div class="empty-reply">${t("no_response_yet")}</div>`}</div></aside></section>
    <article class="panel" style="margin-top:18px"><span class="eyebrow">${t("track_record_eyebrow")} ${help("track_record")}</span><h2>${t("track_record_title")}</h2><ul class="fact-list">${representativeTrackRecord(rep).map((entry) => `<li>${esc(entry)}</li>`).join("")}</ul></article>
  `;
}



function renderRecord() {
  const record = getRecord();
  if (!record) return setRoute("home");
  const tabs = ["overview", "feedback", "representative"];
  app.innerHTML = `
    <button class="breadcrumb" data-route="home">${t("back_to_records")}</button>
    <section class="record-header">
      <div><span class="case-kicker">${esc(record.category)} · ${esc(record.location)}</span><h1>${esc(record.title)}</h1><p>${esc(record.summary)}</p></div>
      <div class="record-status"><div class="status-line"><span class="status-check">✓</span>${esc(record.status)} ${record.provenance_status === "published" ? help("not_verified") : record.provenance_status === "illustrative" ? help("reference_record") : ""}</div><small>${esc(record.source_label)}<br />${t("last_checked", esc(record.source_date))} · ${esc(record.status_detail)}</small><button class="secondary-btn share-source" data-action="share-source" data-share-title="${esc(record.title)}" data-share-type="${esc(record.category)}">${t("share_source")}</button></div>
    </section>
    <nav class="tabs" aria-label="Record sections">${tabs.map((tab) => `<button class="tab ${state.tab === tab ? "active" : ""}" data-tab="${tab}">${tab === "overview" ? t("tab_evidence") : tab === "feedback" ? t("tab_feedback") : tab === "representative" ? t("tab_representative") : t("tab_channels")}</button>`).join("")}</nav>
        <p class="tab-hint">${t("tab_evidence")} ${help("tab_evidence")} · ${t("tab_feedback")} ${help("tab_feedback")} · ${t("tab_representative")} ${help("tab_representative")}</p>
    <section class="detail-content">${state.tab === "overview" ? renderOverview(record) : state.tab === "feedback" ? renderFeedback(record) : renderRepresentative(record)}</section>
  `;
  cleanInterfaceCopy();
  wireRecordNavigation(record);
  bindAppActions();
  if (state.tab === "overview") loadCommunity(record.id);
}

function wireRecordNavigation(record) {
  const back = document.querySelector("[data-route=home]");
  if (back) back.addEventListener("click", () => setRoute("home"));
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => { state.tab = button.dataset.tab; renderRecord(); }));
  document.querySelectorAll("[data-ask-unknown]").forEach((button) => button.addEventListener("click", () => {
    const translation = state.translation?.recordId === record.id && state.translation.status === "ready" ? state.translation.result : null;
    const question = (translation ? translation.unknowns : record.unknowns)[Number(button.dataset.askUnknown)];
    state.askUnknown = { recordId: record.id, question, office: responsibleOffice(record) };
    state.draft = null;
    state.tab = "feedback";
    renderRecord();
    const field = document.querySelector("#feedback-text");
    if (field) { field.focus(); field.scrollIntoView({ block: "center", behavior: "smooth" }); }
  }));
  document.querySelectorAll("#app .addressed-box [data-rep-detail]").forEach((button) => button.addEventListener("click", () => { state.repId = button.dataset.repDetail; setRoute("representative-detail"); }));
  document.querySelectorAll("#app [data-open-group]").forEach((button) => button.addEventListener("click", () => { state.groupTopic = button.dataset.openGroup; state.group = null; setRoute("group"); }));
  bindRecordActions(record);
  if (state.tab === "overview") applyRecordPreferences(record);
}

function renderOverview(record) {
  const languages = state.dashboard.languages?.length ? state.dashboard.languages : ["English"];
  const originalLanguage = languages[0];
  const translation = state.translation?.recordId === record.id ? state.translation : null;
  const activeLanguage = translation?.language || originalLanguage;
  const showingTranslation = translation?.status === "ready";
  const plainLanguage = showingTranslation ? translation.result.plain_language : record.plain_language;
  const facts = showingTranslation ? translation.result.facts : record.facts;
  const unknowns = showingTranslation ? translation.result.unknowns : record.unknowns;
  return `
    <div class="section-grid">
      <article class="panel">
        <div class="panel-heading"><span class="eyebrow">${t("plain_language_eyebrow")} ${help("plain_language")}</span><div class="explanation-controls">${languages.length > 1 ? `<label class="translate-picker"><span>${t("translate_label")} ${help("translate")}</span><select id="translate-language">${languages.map((lang) => `<option value="${esc(lang)}" ${activeLanguage === lang ? "selected" : ""}>${esc(lang)}</option>`).join("")}</select></label>` : ""}<button class="secondary-btn compact-action" id="listen-plain-language" data-text="${esc(plainLanguage)}" data-lang="${esc(activeLanguage)}">${t("listen_button")}</button></div></div>
        ${state.preferences.name ? `<p class="adapted-note">${esc(t("adapted_for", state.preferences.name))}</p>` : ""}
        ${renderVoiceStatus(activeLanguage)}
        ${translation?.status === "loading" ? `<p class="translate-status">${t("translating")}</p>` : ""}
        ${translation?.status === "error" ? `<p class="translate-status error">${esc(translation.message || t("translation_unavailable"))}</p>` : ""}
        ${showingTranslation ? `<p class="translate-badge">${t("machine_translation_badge")} <button class="text-btn" id="show-original-language">${t("show_original")}</button></p>` : ""}
        <div class="explanation">${esc(plainLanguage)}</div>
        <div class="list-block"><h3>${t("what_source_says")} ${help("facts")}</h3><ul class="fact-list">${facts.map((fact) => `<li>${esc(fact)}</li>`).join("")}</ul></div>
        <div class="list-block"><h3>${t("what_we_cannot_confirm")} ${help("unknowns")}</h3><ul class="fact-list unknown askable">${unknowns.map((fact, index) => `<li><button class="ask-unknown" data-ask-unknown="${index}" title="${t("ask_office_about_this")}"><span>${esc(fact)}</span><small>${t("ask_office_arrow", esc(responsibleOffice(record).name))}</small></button></li>`).join("")}</ul></div>
      </article>
      <aside class="panel"><span class="eyebrow">${t("source_record_eyebrow")} ${help("source_record")}</span>${record.evidence.map((item) => `<div class="source-card ${item.kind === "open" ? "open" : ""}"><div class="source-top"><span>${esc(item.label)}</span><span>${item.kind === "open" ? t("evidence_open_question") : record.provenance_status === "verified" ? t("evidence_verified") : record.provenance_status === "published" ? t("evidence_published") : record.provenance_status === "user-submitted" ? t("evidence_submitted") : t("evidence_illustrative")}</span></div><blockquote>“${esc(item.quote)}”</blockquote><footer>${esc(record.source_label)} · ${esc(item.page)}</footer></div>`).join("")}<p class="disclaimer">${esc(record.provenance_note || t("record_available_review"))}</p></aside>
    </div>
    <div class="section-grid" style="margin-top:18px"><article class="panel"><span class="eyebrow">${t("different_priorities_eyebrow")} ${help("perspectives")}</span><h2>${t("different_priorities_title")}</h2><p class="panel-intro">${t("different_priorities_body")}</p>${[...record.perspectives, ...(state.community[record.id]?.perspectives || [])].map((item, index) => `<div class="perspective-card"><div class="perspective-mark">${index + 1}</div><div><h3>${esc(item.label)}</h3><p>${esc(item.body)}</p>${item.submitted ? `<small class="perspective-submitted">${esc(t("submitted_by", item.user_label))}</small>` : ""}</div></div>`).join("")}<div class="comment-form" style="margin-top:14px"><label class="form-label" for="perspective-label">${t("add_perspective_label")}</label><input id="perspective-label" class="feedback-select" placeholder="${t("perspective_title_placeholder")}" /><textarea id="perspective-body" class="feedback-textarea" style="margin-top:10px" placeholder="${t("perspective_body_placeholder")}"></textarea><label class="anon-toggle"><input type="checkbox" id="perspective-anonymous" /> ${t("post_anonymously", esc(anonymousPersona()))} ${help("anonymous")}</label><div class="button-row"><button class="primary-btn" id="submit-perspective">${t("submit_perspective")}</button>${!state.user ? `<span class="auth-required">${t("auth_required_note")}</span>` : ""}</div></div></article><aside class="panel"><span class="eyebrow">${t("next_step_eyebrow")} ${help("next_step")}</span><h2>${t("next_step_title")}</h2><p class="panel-intro">${t("next_step_body")}</p><p class="addressed-to">${t("addressed_to", esc(responsibleOffice(record).name))}</p><button class="primary-btn" data-tab="feedback">${t("draft_feedback_arrow")}</button>${(() => { const topic = issueTopic(record); const group = state.groups.find((item) => item.topic === topic); const names = TOPIC_NAMES[uiLang()] || TOPIC_NAMES.en; return topic ? `<div class="lands-on"><span class="eyebrow">${t("lands_on_eyebrow")} ${help("lands_on")}</span><p>${group ? t("lands_on_body", group.members, esc(names[topic] || topic), esc(state.dashboard.area)) : t("lands_on_body_unknown", esc(names[topic] || topic))}</p><button class="text-btn" data-open-group="${topic}">${t("open_group_arrow")}</button></div>` : ""; })()}</aside></div>
    ${renderCommunityPanel(record)}
  `;
}

function renderFeedback(record) {
  const draft = state.draft;
  return `
    <div class="feedback-layout">
      <article class="panel"><span class="eyebrow">${t("your_words_first_eyebrow")} ${help("feedback_tab")}</span><h2>${t("your_words_first_title")}</h2><p class="panel-intro">${t("your_words_first_body")}</p>
        <div class="voice-box"><div class="voice-box-top"><div><strong>${t("audio_access")}</strong><small>${t("audio_access_detail")}</small></div></div><div class="voice-actions"><button class="secondary-btn compact-action" id="voice-read">🔊 ${t("voice_read_button")}</button><button class="secondary-btn compact-action" id="avatar-talk">🎤 ${t("avatar_talk_button")}</button><small id="avatar-status"></small></div><p class="voice-caption">${t("voice_caption")} ${help("voice")}</p></div>
        <label class="form-label" for="perspective">${t("perspective_label")} ${help("perspective")}</label><select id="perspective" class="feedback-select"><option>${t("community_question")}</option>${record.perspectives.map((item) => `<option>${esc(item.label)}</option>`).join("")}</select>
        <label class="form-label" for="language">${t("language_of_note_label")} ${help("note_language")}</label><select id="language" class="feedback-select">${(state.dashboard.languages || ["English"]).map((language) => `<option>${esc(language)}</option>`).join("")}</select>
        ${(() => { const office = responsibleOffice(record); return `<div class="addressed-box"><span class="eyebrow">${t("addressed_to_eyebrow")} ${help("addressed")}</span><strong>${esc(office.name)}</strong>${office.office && office.office !== office.name ? `<small>${esc(office.office)}</small>` : ""}${office.id ? `<button class="text-btn" data-rep-detail="${esc(office.id)}">${t("open_public_profile_arrow")}</button>` : ""}${state.askUnknown?.recordId === record.id ? `<p class="asking-about">${t("asking_about", esc(state.askUnknown.question))}</p>` : ""}</div>`; })()}
        <label class="form-label" for="feedback-text">${t("your_words_label")}</label><textarea id="feedback-text" class="feedback-textarea" placeholder="${t("your_words_placeholder")}">${esc(draft?.original || (state.askUnknown?.recordId === record.id ? state.askUnknown.question : ""))}</textarea>
        <div class="button-row"><button class="primary-btn" id="make-draft">${t("create_reviewable_draft")}</button><button class="secondary-btn" id="clear-draft">${t("clear")}</button></div>
        ${draft ? `<div class="draft-box"><strong>${t("structured_draft_label")} ${help("structured_draft")}</strong><small>${draft.engine === "ollama" ? t("prepared_by_ollama") : t("prepared_by_fallback")}</small>${esc(draft.draft)}</div><ul class="check-list">${draft.checks.map((check) => `<li>${esc(check)}</li>`).join("")}</ul><label class="anon-toggle"><input type="checkbox" id="question-anonymous" /> ${t("post_anonymously", esc(anonymousPersona()))} ${help("anonymous")}</label><div class="button-row"><button class="primary-btn" id="save-draft">${t("send_to_office", esc(responsibleOffice(record).name))}</button></div><p class="disclaimer">${t("send_note")}</p>` : ""}
      </article>
      <aside class="panel"><span class="eyebrow">${t("community_view_eyebrow")}</span><h2>${t("community_view_title")}</h2><p class="panel-intro">${t("community_view_body")}</p><div class="columns-3"><div class="mini-column"><h4>${t("shared_facts")}</h4><p>${esc(record.facts[0])}</p></div><div class="mini-column"><h4>${t("open_questions")}</h4><p>${esc(record.unknowns[0])}</p></div><div class="mini-column"><h4>${t("different_priorities_col")}</h4><p>${esc(record.perspectives.map((item) => item.label).join(" · "))}</p></div></div><p class="disclaimer">${t("community_view_disclaimer")}</p></aside>
    </div>
  `;
}

function renderRepresentative(record) {
  return `<div class="section-grid"><article class="panel"><span class="eyebrow">${t("timeline_eyebrow")} ${help("timeline")}</span><h2>${t("timeline_title")}</h2><p class="panel-intro">${t("timeline_body")}</p><div class="timeline">${record.timeline.map((item) => `<div class="timeline-item ${item.state}"><span class="timeline-dot"></span><span class="timeline-date">${esc(item.date)}</span><div class="timeline-label">${esc(item.label)}</div><p class="timeline-detail">${esc(item.detail)}</p></div>`).join("")}</div></article><aside class="panel"><span class="eyebrow">${t("accountability_check_eyebrow")}</span><div class="promise-card"><small>${t("current_status")}</small><strong>${esc(record.status_detail)}</strong><p>${t("accountability_note")}</p></div><div class="list-block"><h3>${t("resident_can_request")}</h3><ul class="fact-list unknown"><li>${t("request_dated_update")}</li><li>${t("request_responsible_office")}</li><li>${t("request_evidence")}</li></ul></div></aside></div>`;
}


const AGE_RANGES = [
  { id: "under18", key: "age_under18" },
  { id: "18-29", key: "age_18_29" },
  { id: "30-44", key: "age_30_44" },
  { id: "45-59", key: "age_45_59" },
  { id: "60plus", key: "age_60plus" },
];

function renderUnderstoodCard() {
  const p = state.preferences;
  const names = TOPIC_NAMES[uiLang()] || TOPIC_NAMES.en;
  if (!p.interests.length && !p.understood) return "";
  const options = Object.keys(names).filter((topic) => !p.interests.includes(topic)).map((topic) => `<option value="${topic}">${esc(names[topic])}</option>`).join("");
  return `<div class="understood-card"><span class="eyebrow">${t("understood_eyebrow")} ${help("understood")}</span>
    ${p.understood ? `<p class="understood-sentence">${esc(p.understood)}</p>` : ""}
    <p class="field-hint">${t("understood_note")}</p>
    <span class="eyebrow">${t("show_first_eyebrow")}</span>
    <div class="interest-chips">${p.interests.map((topic, index) => `<span class="interest-chip"><span>${esc(names[topic] || topic)}</span><em>+${INTEREST_POSITION_WEIGHTS[Math.min(index, INTEREST_POSITION_WEIGHTS.length - 1)]}</em><button type="button" data-remove-interest="${topic}" aria-label="${t("remove_interest")}">×</button></span>`).join("")}
      <select id="add-interest" class="feedback-select chip-add"><option value="">${t("add_interest")}</option>${options}</select></div>
    <div class="button-row"><button type="button" class="text-btn" id="clear-profile">${t("clear_profile")}</button></div></div>`;
}

function renderSettings() {
  const languages = state.dashboard.languages || [];
  const p = state.preferences;
  app.innerHTML = `
    <section class="page-head compact-head"><div><span class="eyebrow">${t("settings_eyebrow")} ${help("settings")}</span><h1>${t("settings_title")}</h1><p>${t("settings_body")}</p></div></section>
    <section class="feedback-layout">
      <article class="panel">
        <label class="form-label" for="pref-name">${t("settings_name_label")}</label>
        <input id="pref-name" class="feedback-select" placeholder="${t("settings_name_placeholder")}" value="${esc(p.name || "")}" />
        <label class="form-label" for="pref-description">${t("settings_description_label")}</label>
        <p class="field-hint">${t("settings_description_hint")}</p>
        <div class="profession-row"><textarea id="pref-description" class="feedback-textarea" maxlength="600" placeholder="${t("settings_description_placeholder")}">${esc(p.description || "")}</textarea><button type="button" class="secondary-btn mic-btn" id="pref-description-mic" aria-label="${t("speak_profession")}" title="${t("speak_profession")}">🎤</button></div>
        <div class="button-row"><button type="button" class="primary-btn" id="pref-interpret">${t("understand_me")}</button><span class="field-hint" id="pref-interpret-status"></span></div>
        <div id="understood-card">${renderUnderstoodCard()}</div>
        <label class="form-label" for="pref-age">${t("settings_age_label")} ${help("age")}</label>
        <select id="pref-age" class="feedback-select"><option value="">${t("settings_age_placeholder")}</option>${AGE_RANGES.map((item) => `<option value="${item.id}" ${p.age === item.id ? "selected" : ""}>${esc(t(item.key))}</option>`).join("")}</select>
        <label class="form-label" for="pref-mode">${t("settings_mode_label")} ${help("mode")}</label>
        <select id="pref-mode" class="feedback-select"><option value="" ${!p.mode ? "selected" : ""}>${t("mode_either")}</option><option value="read" ${p.mode === "read" ? "selected" : ""}>${t("mode_read")}</option><option value="listen" ${p.mode === "listen" ? "selected" : ""}>${t("mode_listen")}</option></select>
        <label class="form-label" for="pref-language">${t("settings_language_label")} ${help("language")}</label>
        ${languages.length ? `<select id="pref-language" class="feedback-select">${languages.map((lang) => `<option value="${esc(lang)}" ${(p.language || languages[0]) === lang ? "selected" : ""}>${esc(lang)}</option>`).join("")}</select><div id="pref-language-voice-status">${renderVoiceStatus(p.language || languages[0])}</div>` : `<p class="disclaimer">${t("settings_language_none")}</p>`}
        <p class="disclaimer" style="margin-top:16px">${t("settings_scope_note")}</p>
      </article>
      <aside class="panel">
        <span class="eyebrow">${t("settings_aside_eyebrow")}</span><h2>${t("settings_aside_title")}</h2>
        <p class="panel-intro">${t("settings_aside_body")}</p>
      </aside>
    </section>
  `;
}

function wireSettingsForm() {
  const save = (patch) => {
    state.preferences = { ...state.preferences, ...patch };
    persistPreferences();
    showToast(t("toast_preferences_saved"));
    renderSidebar();
  };
  const name = document.querySelector("#pref-name");
  if (name) name.addEventListener("change", () => save({ name: name.value.trim() }));
  const description = document.querySelector("#pref-description");
  const status = document.querySelector("#pref-interpret-status");
  const refreshCard = () => { const card = document.querySelector("#understood-card"); if (card) { card.innerHTML = renderUnderstoodCard(); wireUnderstoodCard(); } };
  const interpret = async () => {
    const text = description.value.trim();
    if (!text) { save({ description: "", interests: [], understood: "" }); refreshCard(); return; }
    status.textContent = t("profession_interpreting");
    try {
      const response = await fetch("/api/profile/interpret", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: text, language: uiLang() === "fr" ? "Français" : "English" }) });
      const data = await response.json();
      if (!response.ok) { status.textContent = data.error || t("profession_ai_unavailable"); return; }
      save({ description: text, interests: data.interests, understood: data.understood });
      status.textContent = data.engine === "ollama" ? t("understood_by_model") : t("understood_by_keywords");
      refreshCard();
    } catch (error) { status.textContent = t("profession_ai_unavailable"); }
  };
  const wireUnderstoodCard = () => {
    document.querySelectorAll("[data-remove-interest]").forEach((button) => button.addEventListener("click", () => { save({ interests: state.preferences.interests.filter((topic) => topic !== button.dataset.removeInterest) }); refreshCard(); }));
    const add = document.querySelector("#add-interest");
    if (add) add.addEventListener("change", () => { if (add.value) { save({ interests: [...state.preferences.interests, add.value] }); refreshCard(); } });
    const clear = document.querySelector("#clear-profile");
    if (clear) clear.addEventListener("click", () => { save({ description: "", interests: [], understood: "" }); if (description) description.value = ""; refreshCard(); });
  };
  wireUnderstoodCard();
  const interpretButton = document.querySelector("#pref-interpret");
  if (interpretButton) interpretButton.addEventListener("click", interpret);
  if (description) description.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); interpret(); } });
  const mic = document.querySelector("#pref-description-mic");
  if (mic) mic.addEventListener("click", () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return showToast(t("avatar_unsupported"));
    const recognizer = new Recognition();
    recognizer.lang = speechLangCode(state.preferences.language || (state.dashboard.languages || ["English"])[0]);
    recognizer.interimResults = false;
    mic.classList.add("listening");
    recognizer.onresult = (event) => { description.value = event.results[0][0].transcript; interpret(); };
    recognizer.onerror = (event) => { if (event.error === "not-allowed" || event.error === "service-not-allowed") showToast(t("avatar_mic_denied")); };
    recognizer.onend = () => mic.classList.remove("listening");
    try { recognizer.start(); } catch (error) { mic.classList.remove("listening"); }
  });
  const age = document.querySelector("#pref-age");
  if (age) age.addEventListener("change", () => save({ age: age.value }));
  const mode = document.querySelector("#pref-mode");
  if (mode) mode.addEventListener("change", () => save({ mode: mode.value }));
  const language = document.querySelector("#pref-language");
  if (language) language.addEventListener("change", () => {
    save({ language: language.value });
    const holder = document.querySelector("#pref-language-voice-status");
    if (holder) holder.innerHTML = renderVoiceStatus(language.value);
  });
}

function renderExplain() {
  const mode = state.explainMode;
  const modes = [["text", t("explain_mode_text")], ["url", t("explain_mode_url")], ["pdf", t("explain_mode_pdf")]];
  const fields = mode === "text"
    ? `<label class="form-label" for="explain-text">${t("explain_text_label")}</label><textarea id="explain-text" class="feedback-textarea" style="min-height:240px" placeholder="${t("explain_text_placeholder")}"></textarea>`
    : mode === "url"
    ? `<label class="form-label" for="explain-url">${t("explain_url_label")}</label><input id="explain-url" class="feedback-select" placeholder="${t("explain_url_placeholder")}" />`
    : `<label class="form-label" for="explain-pdf">${t("explain_pdf_label")}</label><input id="explain-pdf" type="file" accept="application/pdf" class="feedback-select" /><p class="disclaimer">${t("explain_pdf_hint")}</p>`;
  app.innerHTML = `
    <section class="page-head compact-head"><div><span class="eyebrow">${t("explain_eyebrow")} ${help("explain")}</span><h1>${t("explain_title")}</h1><p>${t("explain_body")}</p></div></section>
    <section class="feedback-layout">
      <article class="panel">
        <div class="filter-row" style="margin-bottom:16px">${modes.map(([key, label]) => `<button class="filter-chip ${mode === key ? "selected" : ""}" data-explain-mode="${key}">${esc(label)}</button>`).join("")}</div>
        <label class="form-label" for="explain-title">${t("explain_title_label")}</label>
        <input id="explain-title" class="feedback-select" placeholder="${t("explain_title_placeholder")}" value="${esc(state.explainTitleDraft || "")}" />
        ${fields}
        <div class="button-row"><button class="primary-btn" id="explain-submit" ${state.explainBusy ? "disabled" : ""}>${state.explainBusy ? t("explain_submitting") : t("explain_submit")}</button></div>
        <p class="disclaimer">${t("explain_disclaimer")}</p>
      </article>
      <aside class="panel source-pipeline">
        <span class="eyebrow">${t("source_pipeline_eyebrow")}</span><h2>${t("source_pipeline_title")}</h2>
        <div class="pipeline-row"><span class="pipeline-step current">1<span>${t("pipeline_source_found")}</span></span><span class="pipeline-line"></span><span class="pipeline-step">2<span>${t("pipeline_meaning_checked")}</span></span><span class="pipeline-line"></span><span class="pipeline-step">3<span>${t("pipeline_community_response")}</span></span><span class="pipeline-line"></span><span class="pipeline-step">4<span>${t("pipeline_delivery_verified")}</span></span></div>
        <p class="panel-intro" style="margin-top:44px">${t("explain_disclaimer")}</p>
      </aside>
    </section>
  `;
  wireExplainForm();
}

function wireExplainForm() {
  document.querySelectorAll("[data-explain-mode]").forEach((button) => button.addEventListener("click", () => {
    state.explainTitleDraft = document.querySelector("#explain-title")?.value || "";
    state.explainMode = button.dataset.explainMode;
    renderExplain();
  }));
  const submit = document.querySelector("#explain-submit");
  if (submit) submit.addEventListener("click", submitExplain);
}

async function submitExplain() {
  const mode = state.explainMode;
  const title = document.querySelector("#explain-title")?.value || "";
  const payload = { mode, title, country: state.dashboard.country || "", region: state.dashboard.region || "", locality: state.dashboard.area || "" };
  if (mode === "text") {
    payload.text = document.querySelector("#explain-text")?.value || "";
  } else if (mode === "url") {
    payload.url = document.querySelector("#explain-url")?.value || "";
  } else {
    const fileInput = document.querySelector("#explain-pdf");
    const file = fileInput?.files?.[0];
    if (!file) return showToast(t("explain_no_file"));
    payload.filename = file.name;
    payload.data_base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",").pop());
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  state.explainBusy = true;
  renderExplain();
  try {
    const response = await fetch("/api/sources/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const record = await response.json();
    state.explainBusy = false;
    if (!response.ok) { renderExplain(); return showToast(record.error || t("explain_no_file")); }
    state.explainTitleDraft = "";
    state.records.unshift(record);
    showToast(t("toast_explain_success"));
    setRoute("record", record.id);
  } catch (error) {
    state.explainBusy = false;
    renderExplain();
    showToast(t("toast_network_error"));
  }
}

function renderFeedbackList() {
  if (state.user && !state.feedbackLoadedFor) { state.feedbackLoadedFor = state.user.id; fetch(`/api/feedback?token=${encodeURIComponent(authToken())}`).then((r) => r.ok ? r.json() : { feedback: [] }).then((data) => { state.feedback = data.feedback || []; if (state.view === "feedback") render(); }).catch(() => {}); }
  const myFeedback = state.user ? state.feedback : [];
  app.innerHTML = `<section class="page-head"><div><span class="eyebrow">${t("my_feedback_eyebrow")} ${help("my_questions")}</span><h1>${t("my_feedback_title")}</h1><p>${t("my_feedback_body")}</p></div><div class="head-note"><strong>${t("saved_drafts_count", myFeedback.length)}</strong><span>${t("nothing_sent_note")}</span></div></section><div class="feedback-list">${!state.user ? `<div class="empty-state">${t("sign_in_to_see_questions")}</div>` : myFeedback.length ? myFeedback.map((item) => `<article class="saved-feedback"><div class="saved-feedback-top"><h3>${esc(item.record_title)}</h3><small class="${item.office_replied ? "replied" : ""}">${item.office_replied ? t("office_replied") : t("awaiting_reply")}</small></div>${item.question ? `<p class="asking-about">${esc(item.question)}</p>` : ""}<p>${esc(item.draft)}</p><div class="record-meta" style="margin-top:12px">${item.office ? `<span class="tag">→ ${esc(item.office)}</span>` : ""}<span class="tag">${esc(formatActivityDate(item.created_at))}</span>${item.anonymous ? `<span class="tag">${t("sent_anonymously")}</span>` : ""}${item.office_id ? `<button class="text-btn" data-rep-detail="${esc(item.office_id)}">${t("open_public_profile_arrow")}</button>` : ""}</div></article>`).join("") : `<div class="empty-state">${t("no_drafts_yet")}</div>`}</div>`;
}

function speechSupport() {
  return { synth: "speechSynthesis" in window, recog: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition) };
}

const SPEECH_LANG_CODES = {
  English: "en-US", "Français": "fr-FR", Kiswahili: "sw-KE", Kikuyu: "ki-KE", Dholuo: "luo-KE",
  "Yorùbá": "yo-NG", Hausa: "ha-NG", Igbo: "ig-NG", Twi: "ak-GH", Dagbani: "dag-GH", Ewe: "ee-GH",
  "Éwé": "ee-TG", "Kabyè": "kbp-TG", Mina: "gej-TG", Dioula: "dyu-CI", "Baoulé": "bci-CI", "Mooré": "mos-BF",
};

function speechLangCode(language) {
  return SPEECH_LANG_CODES[language] || "en-US";
}

function cachedVoices() {
  if (!("speechSynthesis" in window)) return [];
  if (!state.voicesLoaded) {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) state.voicesLoaded = true;
    return voices;
  }
  return window.speechSynthesis.getVoices();
}

function hasVoiceFor(language) {
  const voices = cachedVoices();
  if (!voices.length) return null; // unknown yet — voice list not loaded
  const code = speechLangCode(language).toLowerCase();
  const base = code.split("-")[0];
  return voices.some((voice) => {
    const voiceLang = voice.lang.toLowerCase();
    return voiceLang === code || voiceLang.startsWith(`${base}-`) || voiceLang === base;
  });
}

function osVoiceHelpKey() {
  const ua = navigator.userAgent;
  if (/Android/.test(ua)) return "voice_help_android";
  if (/CrOS/.test(ua)) return "voice_help_chromeos";
  if (/Windows/.test(ua)) return "voice_help_windows";
  if (/Mac OS X/.test(ua)) return "voice_help_mac";
  return "voice_help_generic";
}

function renderVoiceStatus(language) {
  const has = hasVoiceFor(language);
  if (has === null) return `<p class="voice-availability-note">${t("voice_availability_note")}</p>`;
  if (has) return `<p class="voice-status ok">${esc(t("voice_available_note", language))}</p>`;
  return `<div class="voice-status missing"><strong>${esc(t("voice_missing_title", language))}</strong><p>${t("voice_missing_body")}</p><p>${t(osVoiceHelpKey())}</p><small>${t("voice_help_not_guaranteed")}</small></div>`;
}

function speakText(text, language) {
  if (!("speechSynthesis" in window) || !text) { showToast(t("avatar_unsupported")); return; }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLangCode(language);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function applyRecordPreferences(record) {
  if (state.autoAppliedFor === record.id) return;
  state.autoAppliedFor = record.id;
  const languages = state.dashboard.languages?.length ? state.dashboard.languages : ["English"];
  const originalLanguage = languages[0];
  const preferredLanguage = state.preferences.language;
  if (preferredLanguage && preferredLanguage !== originalLanguage && languages.includes(preferredLanguage)) {
    translateRecord(record, preferredLanguage);
  }
  if (state.preferences.mode === "listen") {
    speakText(record.plain_language, originalLanguage);
  }
}

function setAvatarState(mode) {
  const avatar = document.querySelector("#audio-avatar");
  if (avatar) {
    avatar.classList.toggle("speaking", mode === "speaking");
    avatar.classList.toggle("listening", mode === "listening");
  }
  const status = document.querySelector("#avatar-status");
  if (status) status.textContent = mode === "speaking" ? t("avatar_speaking") : mode === "listening" ? t("avatar_listening") : "";
}

function avatarSpeak(text, lang) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onstart = () => setAvatarState("speaking");
    utterance.onend = () => { setAvatarState("idle"); resolve(); };
    utterance.onerror = () => { setAvatarState("idle"); resolve(); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

async function startAvatarInteraction(record) {
  const support = speechSupport();
  if (!support.synth && !support.recog) return showToast(t("avatar_unsupported"));
  const languages = state.dashboard.languages?.length ? state.dashboard.languages : ["English"];
  const originalLanguage = languages[0];
  const translation = state.translation?.recordId === record.id ? state.translation : null;
  const activeLanguage = translation?.status === "ready" ? translation.language : originalLanguage;
  if (!support.recog) return showToast(t("avatar_unsupported"));
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognizer = new Recognition();
  recognizer.lang = speechLangCode(activeLanguage);
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 1;
  setAvatarState("listening");
  recognizer.onresult = (event) => {
    const heard = event.results[0][0].transcript;
    const field = document.querySelector("#feedback-text");
    if (field) field.value = heard;
    showToast(t("avatar_heard", heard));
  };
  recognizer.onerror = (event) => {
    if (event.error === "not-allowed" || event.error === "service-not-allowed") showToast(t("avatar_mic_denied"));
  };
  recognizer.onend = () => setAvatarState("idle");
  try { recognizer.start(); } catch (error) { setAvatarState("idle"); }
}

async function translateRecord(record, language) {
  const originalLanguage = (state.dashboard.languages || ["English"])[0];
  if (language === originalLanguage) { state.translation = null; renderRecord(); return; }
  state.translation = { recordId: record.id, language, status: "loading" };
  renderRecord();
  try {
    const response = await fetch(`/api/records/${encodeURIComponent(record.id)}/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language, country: state.dashboard.country }) });
    const data = await response.json();
    if (!response.ok) { state.translation = { recordId: record.id, language, status: "error", message: data.error }; return renderRecord(); }
    state.translation = { recordId: record.id, language, status: "ready", result: data };
  } catch (error) {
    state.translation = { recordId: record.id, language, status: "error", message: t("toast_network_error") };
  }
  renderRecord();
}

function bindRecordActions(record) {
  const avatarTalk = document.querySelector("#avatar-talk");
  if (avatarTalk) avatarTalk.addEventListener("click", () => startAvatarInteraction(record));
  const voiceRead = document.querySelector("#voice-read");
  if (voiceRead) voiceRead.addEventListener("click", () => {
    const languages = state.dashboard.languages?.length ? state.dashboard.languages : ["English"];
    const translation = state.translation?.recordId === record.id ? state.translation : null;
    const activeLanguage = translation?.status === "ready" ? translation.language : languages[0];
    avatarSpeak(translation?.status === "ready" ? translation.result.plain_language : record.plain_language, speechLangCode(activeLanguage));
  });
  const translateSelect = document.querySelector("#translate-language");
  if (translateSelect) translateSelect.addEventListener("change", (event) => translateRecord(record, event.target.value));
  const listenButton = document.querySelector("#listen-plain-language");
  if (listenButton) listenButton.addEventListener("click", () => {
    if (window.speechSynthesis?.speaking) { window.speechSynthesis.cancel(); listenButton.textContent = t("listen_button"); return; }
    const utterance = new SpeechSynthesisUtterance(listenButton.dataset.text);
    utterance.lang = speechLangCode(listenButton.dataset.lang);
    utterance.onend = () => { listenButton.textContent = t("listen_button"); };
    utterance.onerror = () => { listenButton.textContent = t("listen_button"); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    listenButton.textContent = t("stop_listening");
  });
  const showOriginal = document.querySelector("#show-original-language");
  if (showOriginal) showOriginal.addEventListener("click", () => { state.translation = null; renderRecord(); });
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => { state.tab = button.dataset.tab; renderRecord(); }));
  const makeDraft = document.querySelector("#make-draft");
  if (makeDraft) makeDraft.addEventListener("click", async () => {
    const text = document.querySelector("#feedback-text").value;
    const language = document.querySelector("#language").value;
    const perspective = document.querySelector("#perspective").value;
    makeDraft.disabled = true;
    makeDraft.textContent = t("drafting");
    try {
      const response = await fetch("/api/feedback/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ record_id: record.id, country: state.dashboard.country, text, language, perspective, office: responsibleOffice(record).office, office_name: responsibleOffice(record).name, question: state.askUnknown?.recordId === record.id ? state.askUnknown.question : "" }) });
      state.draft = await response.json();
      state.draft.original = state.draft.original || text;
      renderRecord();
      showToast(t("toast_draft_created"));
    } catch (error) {
      renderRecord();
      showToast(t("toast_network_error"));
    }
  });
  const clearDraft = document.querySelector("#clear-draft");
  if (clearDraft) clearDraft.addEventListener("click", () => { state.draft = null; renderRecord(); });
  const saveDraft = document.querySelector("#save-draft");
  if (saveDraft) saveDraft.addEventListener("click", () => requireUser(async () => {
    const office = responsibleOffice(record);
    const response = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ record_id: record.id, country: state.dashboard.country, token: authToken(), original: state.draft.original, draft: state.draft.draft, language: state.draft.language, perspective: state.draft.perspective, office: office.name, office_id: office.id, question: state.askUnknown?.recordId === record.id ? state.askUnknown.question : "", anonymous: Boolean(document.querySelector("#question-anonymous")?.checked), persona: anonymousPersona() }) });
    const saved = await response.json();
    if (!response.ok) return showToast(saved.error || t("toast_comment_failed"));
    state.feedback.unshift(saved);
    state.community[record.id] = { ...(state.community[record.id] || {}), questions: [saved, ...(state.community[record.id]?.questions || [])] };
    state.draft = null;
    state.askUnknown = null;
    state.tab = "overview";
    showToast(t("toast_question_sent", office.name));
    renderRecord();
    document.querySelector(".questions-list")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }));
  document.querySelectorAll("[data-vote]").forEach((button) => button.addEventListener("click", () => requireUser(async () => {
    const response = await fetch(`/api/records/${encodeURIComponent(record.id)}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: authToken(), country: state.dashboard.country, vote: button.dataset.vote }) });
    const data = await response.json();
    if (!response.ok) return showToast(data.error || t("toast_vote_failed"));
    state.community[record.id] = { ...(state.community[record.id] || {}), votes: data.votes, selected_vote: data.selected_vote, comments: state.community[record.id]?.comments || [] };
    renderRecord();
    showToast(t("toast_vote_saved"));
  })));
  const commentButton = document.querySelector("#submit-record-comment");
  if (commentButton) commentButton.addEventListener("click", () => requireUser(async () => {
    const field = document.querySelector("#record-comment");
    const message = field.value.trim();
    if (!message) return showToast(t("toast_comment_required"));
    const response = await fetch(`/api/records/${encodeURIComponent(record.id)}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: authToken(), country: state.dashboard.country, message, anonymous: Boolean(document.querySelector("#comment-anonymous")?.checked), persona: anonymousPersona() }) });
    const data = await response.json();
    if (!response.ok) return showToast(data.error || t("toast_comment_failed"));
    state.community[record.id] = { ...(state.community[record.id] || {}), comments: [data, ...(state.community[record.id]?.comments || [])], votes: state.community[record.id]?.votes || { helpful: 0, "needs-clarity": 0 } };
    renderRecord();
    showToast(t("toast_comment_added"));
  }));
  const perspectiveButton = document.querySelector("#submit-perspective");
  if (perspectiveButton) perspectiveButton.addEventListener("click", () => requireUser(async () => {
    const label = document.querySelector("#perspective-label").value.trim();
    const body = document.querySelector("#perspective-body").value.trim();
    if (!label || !body) return showToast(t("toast_perspective_required"));
    const response = await fetch(`/api/records/${encodeURIComponent(record.id)}/perspectives`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: authToken(), country: state.dashboard.country, label, body, anonymous: Boolean(document.querySelector("#perspective-anonymous")?.checked), persona: anonymousPersona() }) });
    const data = await response.json();
    if (!response.ok) return showToast(data.error || t("toast_perspective_required"));
    state.community[record.id] = { ...(state.community[record.id] || {}), perspectives: [...(state.community[record.id]?.perspectives || []), data] };
    renderRecord();
    showToast(t("toast_perspective_added"));
  }));
}

function bindAppActions() {
  document.querySelectorAll("#app [data-route]").forEach((button) => button.addEventListener("click", (event) => {
    if (button.tagName === "A") event.preventDefault();
    setRoute(button.dataset.route);
  }));
  document.querySelectorAll("#app [data-record]").forEach((button) => button.addEventListener("click", () => setRoute("record", button.dataset.record)));
  document.querySelectorAll("#app [data-rep-detail]").forEach((button) => button.addEventListener("click", () => { state.repId = button.dataset.repDetail; setRoute("representative-detail"); }));
  document.querySelectorAll("#app [data-follow-detail]").forEach((button) => button.addEventListener("click", () => toggleFollow(button.dataset.followDetail)));
  document.querySelectorAll("[data-reply-to]").forEach((button) => button.addEventListener("click", () => { const field = document.querySelector("#rep-response"); if (field) { field.value = `${t("re_prefix")} « ${button.dataset.replyTo} » — `; field.focus(); } }));
  const submitResponse = document.querySelector("#submit-rep-response");
  if (submitResponse) submitResponse.addEventListener("click", async () => {
    const message = document.querySelector("#rep-response").value.trim();
    if (!message) return showToast(t("toast_response_required"));
    submitResponse.disabled = true;
    const type = document.querySelector("#rep-response-type").value;
    const response = await fetch(`/api/representatives/${encodeURIComponent(state.repId)}/response`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, type, country: state.dashboard.country, token: authToken() }) });
    const item = await response.json();
    if (!response.ok) { submitResponse.disabled = false; return showToast(item.error || t("toast_response_failed")); }
    state.repResponses[state.repId] = [item, ...(state.repResponses[state.repId] || [])];
    renderRepresentativeDetail();
    bindAppActions();
    showToast(t("toast_response_saved"));
  });
  document.querySelectorAll("#app [data-action]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (button.dataset.action === "share-source" || button.dataset.action === "share-representative") {
      const targetType = button.dataset.action === "share-representative" ? t("representative_profile") : (button.dataset.shareType || t("civic_source_fallback"));
      const targetTitle = button.dataset.shareTitle || getRecord()?.title || t("civic_update_fallback");
      showShareModal({ type: targetType, title: targetTitle });
    }
    if (button.dataset.action === "geolocate") requestBrowserLocation();
    if (button.dataset.action === "set-area") { state.dashboard.area = state.locationLocality || state.locationRegion || state.locationCountry; state.dashboard.region = state.locationRegion || state.locationCountry; state.dashboard.country = state.locationCountry; applyAreaContext(); persistLocation(); setRoute("home"); showToast(t("toast_now_watching", state.dashboard.area)); }
  }));
}

function render() {
  if (state.view === "home") renderHome();
  else if (state.view === "issues") renderIssues();
  else if (state.view === "representatives") renderRepresentatives();
  else if (state.view === "locations") renderLocations();
  else if (state.view === "representative-detail") renderRepresentativeDetail();
  else if (state.view === "groups") renderGroups();
  else if (state.view === "group") renderGroupDetail();
  else if (state.view === "explain") renderExplain();
  else if (state.view === "settings") renderSettings();
  else if (state.view === "feedback") renderFeedbackList();
  else renderRecord();
  cleanInterfaceCopy();
  applyStaticChrome();
  bindAppActions();
  if (state.view === "record" && getRecord()) wireRecordNavigation(getRecord());
  if (state.view === "locations") { wireLocationPicker(); initLocationLeafletMap(); }
  if (state.view === "explain") wireExplainForm();
  if (state.view === "home" || state.view === "issues") wireIssueFilters();
  if (state.view === "representatives") wireRepresentativeControls();
  if (state.view === "settings") wireSettingsForm();
  renderSidebar();
  renderAiStatusBanner();
  updateAccountButton();
}

async function boot() {
  if (window.location.protocol === "file:") {
    app.innerHTML = `
      <section class="empty-state setup-state">
        <div class="empty-icon">↗</div>
        <h2>${t("open_through_server_title")}</h2>
        <p>This interface needs its local API. In Terminal, run <code>./run_demo.sh</code>, then open <strong>http://127.0.0.1:8000</strong>.</p>
      </section>`;
    return;
  }
  let data;
  try { data = await (await fetch("/api/bootstrap")).json(); } catch (error) { return; /* page navigated away or API not up yet */ }
  state.productName = data.product_name;
  state.records = data.records;
  state.issues = data.issues || [];
  state.representatives = data.representatives || [];
  state.news = data.news || [];
  // Notices already on the server (seeded or published earlier) load silently;
  // only notices that arrive later trigger the "new public update" toast.
  try {
    const noticesResponse = await fetch("/api/publisher/notices", { cache: "no-store" });
    state.publishedNotices = noticesResponse.ok ? ((await noticesResponse.json()).notices || []) : [];
  } catch (error) { state.publishedNotices = []; }
  state.publisherNoticeIds = new Set(state.publishedNotices.map((notice) => notice.id));
  state.localities = data.localities || [];
  state.locations = data.locations || [];
  state.countryContexts = data.country_contexts || {};
  state.dashboard = data.dashboard || state.dashboard;
  state.feedback = data.feedback || [];
  try { state.user = JSON.parse(localStorage.getItem("civic-bridge-user") || "null"); } catch (error) { state.user = null; }
  loadPreferences();
  state.followedRepresentatives = new Set(state.representatives.filter((rep) => rep.followed).map((rep) => rep.id));
  if (state.user) {
    try {
      const savedFollowed = JSON.parse(localStorage.getItem(`civic-bridge-followed-${state.user.id}`) || "null");
      if (Array.isArray(savedFollowed)) state.followedRepresentatives = new Set(savedFollowed);
    } catch (error) { /* use server defaults */ }
  }
  let savedLocation = null;
  try { savedLocation = JSON.parse(localStorage.getItem("civic-bridge-area") || "null"); } catch (error) { savedLocation = null; }
  if (savedLocation?.country === "Fictional demo country") savedLocation = null;
  // Clear the old seeded location so an existing browser never sees a false detection.
  if (savedLocation?.country === "Ghana" && savedLocation?.area === "Tamale North") savedLocation = null;
  // Do not reuse a location that no longer has a matching country-specific
  // fixture pack; otherwise Nairobi records could appear under an old Kisumu
  // or Tamale selection.
  if (savedLocation?.area && !state.localities.some((item) => item.country === savedLocation.country && item.region === savedLocation.region && item.name === savedLocation.area)) savedLocation = null;
  let shouldAutoDetect = false;
  if (savedLocation?.area) {
    state.locationCountry = savedLocation.country || "";
    state.locationRegion = savedLocation.region || "";
    state.locationLocality = savedLocation.area || "";
    state.dashboard.area = savedLocation.area;
    state.dashboard.region = savedLocation.region || "";
    state.dashboard.country = savedLocation.country || "";
    applyAreaContext();
  } else {
    state.locationCountry = "";
    state.locationRegion = "";
    state.locationLocality = "";
    state.dashboard.area = "";
    state.dashboard.region = "";
    state.dashboard.country = "";
    shouldAutoDetect = true;
  }
  if (state.user) {
    const keys = ROLE_LABEL_KEYS[state.user.role_key];
    if (!state.user.token || !keys) { state.user = null; persistUser(); }
    else {
      state.user.role = t(keys[1]); persistUser();
      fetch(`/api/auth/me?token=${encodeURIComponent(state.user.token)}`).then((r) => { if (r.status === 401) { state.user = null; persistUser(); updateAccountButton(); render(); showToast(t("auth_session_expired")); } }).catch(() => {});
    }
  }
  document.querySelector("#product-name").textContent = state.productName;
  document.querySelectorAll(".sidebar [data-route]").forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); setRoute(button.dataset.route); }));
  render();
  loadAiStatus();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", () => { state.voicesLoaded = true; render(); }, { once: true });
  }
  pollPublisherNotices();
  window.setInterval(pollPublisherNotices, 1000);
  // Deep link from a share or from the portal: open the record, switching
  // the area to the notice's own country/locality when needed.
  const deepLink = location.hash.match(/^#record\/(.+)$/);
  if (deepLink) {
    const id = decodeURIComponent(deepLink[1]);
    const notice = state.publishedNotices.find((item) => item.id === id);
    if (notice && notice.country && state.dashboard.country !== notice.country) {
      state.locationCountry = notice.country; state.locationRegion = notice.region || ""; state.locationLocality = notice.locality || "";
      state.dashboard.country = notice.country; state.dashboard.region = notice.region || notice.country; state.dashboard.area = notice.locality || notice.region || notice.country;
      applyAreaContext(); persistLocation(); shouldAutoDetect = false;
    }
    if (state.records.some((record) => record.id === id)) setRoute("record", id);
  }
  if (shouldAutoDetect) {
    autoDetectLocation().then((detected) => {
      if (!detected || !detected.locality || state.dashboard.area) return;
      state.locationCountry = detected.country;
      state.locationRegion = detected.region;
      state.locationLocality = detected.locality;
      state.dashboard.area = detected.locality;
      state.dashboard.region = detected.region;
      state.dashboard.country = detected.country;
      applyAreaContext();
      persistLocation();
      render();
      showToast(t("toast_location_found", detected.country));
    });
  }
}

boot().catch((error) => {
  app.innerHTML = `<div class="empty-state"><strong>Local server unavailable.</strong><br />Start the local server with <code>python3 app.py</code>, then refresh this page.</div>`;
  console.error(error);
});
