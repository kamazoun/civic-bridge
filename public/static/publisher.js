// Public Information Portal — the office side of Civic Bridge.
// One page, rendered as the official information portal of the selected
// country's region, in that country's administrative language. Offices sign
// in here to publish notices; residents see them in the app within a second.

const esc = (value = "") => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const COUNTRY_SLUGS = { Togo: "togo", Kenya: "kenya", "Côte d’Ivoire": "cote-divoire", Ghana: "ghana", Nigeria: "nigeria" };
const LEVEL_PHOTOS = { "ward-council": "/static/images/rep-ward.jpeg", "district-council": "/static/images/rep-district.jpeg", prefecture: "/static/images/rep-prefecture.jpeg", governor: "/static/images/rep-region.jpeg" };

// How each portal presents itself: the state, its motto, the issuing body,
// the administrative language and the accent colour taken from the flag.
const PORTALS = {
  Togo: { lang: "fr", state: "République Togolaise", motto: "Travail · Liberté · Patrie", body: "Portail d’information publique", issuer: "Région Maritime · Préfecture du Golfe", accent: "#006a4e", accent2: "#ffce00" },
  "Côte d’Ivoire": { lang: "fr", state: "République de Côte d’Ivoire", motto: "Union · Discipline · Travail", body: "Portail d’information publique", issuer: "District autonome d’Abidjan", accent: "#f77f00", accent2: "#009e60" },
  Kenya: { lang: "en", state: "Republic of Kenya", motto: "Harambee", body: "Public Information Portal", issuer: "Nairobi City County Government", accent: "#006600", accent2: "#bb0000" },
  Ghana: { lang: "en", state: "Republic of Ghana", motto: "Freedom and Justice", body: "Public Information Portal", issuer: "Northern Regional Coordinating Council", accent: "#006b3f", accent2: "#fcd116" },
  Nigeria: { lang: "en", state: "Federal Republic of Nigeria", motto: "Unity and Faith, Peace and Progress", body: "Public Information Portal", issuer: "Lagos State Government", accent: "#008751", accent2: "#008751" },
};

const STRINGS = {
  en: {
    country: "Country", online: "Service online", nav_notices: "Public notices", nav_offices: "Offices", nav_publish: "Officers’ workspace", nav_resident: "Read as a resident →",
    intro_label: "OFFICIAL NOTICES", intro_title: (region) => `Notices and announcements from the public services of ${region}.`, intro_body: "Every notice names the office responsible, the area concerned and the date. Residents can question any notice through Civic Bridge; replies are published.",
    stamp_label: "LAST PUBLICATION", stamp_note: "Public information desk", notices_label: "PUBLIC NOTICES", notices_title: "Latest notices", count: (n) => `${n} notice${n === 1 ? "" : "s"} published`, none: "No notice has been published for this area yet.",
    more: (n) => `Show ${n} more`, open_in_app: "Open in Civic Bridge →", area_label: "SERVICE AREA", filter_label: "BY SUBJECT", all: "All subjects",
    offices_label: "OFFICES", offices_title: "Who is responsible for what", remit: "Remit", coverage: "Coverage", office_stats: (notices, replies) => `${notices} notice${notices === 1 ? "" : "s"} · ${replies} public repl${replies === 1 ? "y" : "ies"}`,
    publish_label: "OFFICERS’ WORKSPACE", publish_title: "Publish a notice", publish_body: "Authorised office accounts publish here. The notice enters the public record immediately and reaches residents’ Civic Bridge feed within a second.",
    f_office: "Issuing office", f_category: "Subject", f_title: "Title", f_locality: "Area concerned", f_summary: "What residents should understand", f_body: "Details: dates, amounts, conditions, next step", f_ref: "Reference number or source link (optional)", f_note: "Published notices cannot be silently edited: corrections are published as new notices or as a public reply.", f_submit: "Publish notice",
    signed_in: (name) => `Signed in as ${name}`, office_account: "office account", sign_out: "Sign out", sign_in_required: "Office sign-in required", sign_in_body: "Only representative office accounts can publish.", not_office: (name, role) => `You are signed in as ${name} (${role}), which cannot publish.`, demo_hint: "Demo office account: office / civic2026.", username: "Username", password: "Password", sign_in: "Sign in", not_office_error: "This account is not a representative office account.", sign_in_failed: "Sign-in failed.",
    published: "Published. Residents will see it within a second.", publish_failed: "The notice could not be published.", select_office: "Choose the issuing office",
    categories: ["Public notice", "Works", "Water", "Energy", "Health", "Education", "Markets", "Transport", "Sanitation", "Land", "Permits", "Tax", "Identity", "Elections", "Employment", "Safety", "Flooding", "Public meeting", "Budget", "Agriculture", "Livestock"],
    footer_body: "Official notices of the public services. Questions and replies are public.", footer_note: (year) => `© ${year}`,
  },
  fr: {
    country: "Pays", online: "Service en ligne", nav_notices: "Avis publics", nav_offices: "Bureaux", nav_publish: "Espace agents", nav_resident: "Consulter en tant que résident →",
    intro_label: "AVIS OFFICIELS", intro_title: (region) => `Avis et communiqués des services publics de la ${region}.`, intro_body: "Chaque avis indique le bureau responsable, la zone concernée et la date. Les résidents peuvent interroger tout avis via Civic Bridge ; les réponses sont publiées.",
    stamp_label: "DERNIÈRE PUBLICATION", stamp_note: "Guichet d’information publique", notices_label: "AVIS PUBLICS", notices_title: "Derniers avis", count: (n) => `${n} avis publié${n === 1 ? "" : "s"}`, none: "Aucun avis n’a encore été publié pour cette zone.",
    more: (n) => `Afficher ${n} de plus`, open_in_app: "Ouvrir dans Civic Bridge →", area_label: "ZONE DESSERVIE", filter_label: "PAR SUJET", all: "Tous les sujets",
    offices_label: "BUREAUX", offices_title: "Qui est responsable de quoi", remit: "Attributions", coverage: "Ressort", office_stats: (notices, replies) => `${notices} avis · ${replies} réponse${replies === 1 ? "" : "s"} publique${replies === 1 ? "" : "s"}`,
    publish_label: "ESPACE AGENTS", publish_title: "Publier un avis", publish_body: "Les comptes de bureau autorisés publient ici. L’avis entre immédiatement au registre public et apparaît dans le fil Civic Bridge des résidents en une seconde.",
    f_office: "Bureau émetteur", f_category: "Sujet", f_title: "Titre", f_locality: "Zone concernée", f_summary: "Ce que les résidents doivent comprendre", f_body: "Détails : dates, montants, conditions, prochaine étape", f_ref: "Numéro de référence ou lien source (facultatif)", f_note: "Un avis publié ne peut pas être modifié en silence : les corrections sont publiées comme nouvel avis ou comme réponse publique.", f_submit: "Publier l’avis",
    signed_in: (name) => `Connecté en tant que ${name}`, office_account: "compte de bureau", sign_out: "Se déconnecter", sign_in_required: "Connexion de bureau requise", sign_in_body: "Seuls les comptes de bureau représentatif peuvent publier.", not_office: (name, role) => `Vous êtes connecté·e en tant que ${name} (${role}), qui ne peut pas publier.`, demo_hint: "Compte de démonstration : office / civic2026.", username: "Identifiant", password: "Mot de passe", sign_in: "Se connecter", not_office_error: "Ce compte n’est pas un compte de bureau représentatif.", sign_in_failed: "La connexion a échoué.",
    published: "Publié. Les résidents le verront en une seconde.", publish_failed: "L’avis n’a pas pu être publié.", select_office: "Choisir le bureau émetteur",
    categories: ["Avis public", "Travaux", "Eau", "Énergie", "Santé", "Éducation", "Marchés", "Transport", "Assainissement", "Foncier", "Permis", "Impôts", "Identité", "Élections", "Emploi", "Sécurité", "Inondations", "Réunion publique", "Budget", "Agriculture", "Élevage"],
    footer_body: "Avis officiels des services publics. Les questions et les réponses sont publiques.", footer_note: (year) => `© ${year}`,
  },
};

const state = { country: "Togo", region: "", area: "", reps: [], notices: [], category: "", shown: 9, stats: {} };
const $ = (selector) => document.querySelector(selector);
const t = (key, ...args) => { const value = (STRINGS[PORTALS[state.country].lang] || STRINGS.en)[key]; return typeof value === "function" ? value(...args) : value; };
const toast = $("#publisher-toast");
function showToast(message) { toast.textContent = message; toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 3400); }
function currentUser() { try { return JSON.parse(localStorage.getItem("civic-bridge-user") || "null"); } catch (error) { return null; } }
function savedArea() { try { return JSON.parse(localStorage.getItem("civic-bridge-area") || "null"); } catch (error) { return null; } }
const repPhoto = (rep) => rep.photo || `/static/images/reps/${COUNTRY_SLUGS[state.country]}-${rep.id}.jpeg`;

function applyChrome() {
  const portal = PORTALS[state.country];
  document.documentElement.lang = portal.lang;
  document.documentElement.style.setProperty("--gold", portal.accent2);
  document.documentElement.style.setProperty("--accent", portal.accent);
  document.title = `${portal.body} · ${portal.issuer}`;
  $("#strip-state").textContent = `${portal.state} · ${portal.motto}`;
  $("#strip-switch-label").textContent = t("country");
  $("#brand-title").textContent = portal.body.toUpperCase();
  $("#brand-subtitle").textContent = portal.issuer;
  $("#status-online").textContent = t("online");
  $("#nav-notices").textContent = t("nav_notices");
  $("#nav-offices").textContent = t("nav_offices");
  $("#nav-publish").textContent = t("nav_publish");
  $("#nav-resident").textContent = t("nav_resident");
  $("#intro-label").textContent = t("intro_label");
  $("#intro-title").textContent = t("intro_title", state.region);
  $("#intro-body").textContent = t("intro_body");
  $("#stamp-label").textContent = t("stamp_label");
  $("#stamp-note").textContent = t("stamp_note");
  $("#notices-label").textContent = t("notices_label");
  $("#notices-title").textContent = t("notices_title");
  $("#area-label").textContent = t("area_label");
  $("#area-name").textContent = state.area;
  $("#area-region").textContent = `${state.region} · ${state.country}`;
  $("#filter-label").textContent = t("filter_label");
  $("#offices-label").textContent = t("offices_label");
  $("#offices-title").textContent = t("offices_title");
  $("#publish-label").textContent = t("publish_label");
  $("#publish-title").textContent = t("publish_title");
  $("#publish-body").textContent = t("publish_body");
  ["office", "category", "title", "locality", "summary", "body", "ref", "note", "submit"].forEach((key) => { $(`#f-${key}`).textContent = t(`f_${key}`); });
  $("#footer-title").textContent = `${portal.state} — ${portal.body}`;
  $("#footer-body").textContent = t("footer_body");
  $("#footer-note").textContent = t("footer_note", new Date().getFullYear());
  $("#locality").value = state.area;
  $("#category").innerHTML = t("categories").map((item) => `<option>${esc(item)}</option>`).join("");
  $("#responsible_office").innerHTML = `<option value="">${t("select_office")}</option>` + state.reps.map((rep) => `<option value="${esc(rep.name)}">${esc(rep.display_name || rep.name)} · ${esc(rep.level)}</option>`).join("");
  const select = $("#portal-country");
  select.innerHTML = Object.keys(PORTALS).map((country) => `<option ${country === state.country ? "selected" : ""}>${esc(country)}</option>`).join("");
}

function renderOffices() {
  $("#office-directory").innerHTML = state.reps.map((rep) => {
    const stats = state.stats[rep.id] || {};
    return `<article class="office-card"><div class="office-card-top"><span class="office-level">${esc(rep.level).toUpperCase()}</span><img class="office-avatar" src="${esc(repPhoto(rep))}" alt="" onerror="this.onerror=null;this.src='${esc(LEVEL_PHOTOS[rep.id] || "")}'" /></div><h3>${esc(rep.display_name || rep.name)}</h3><div class="office-role">${esc(rep.name)}</div><dl class="office-facts"><dt>${t("remit")}</dt><dd>${esc(rep.focus)}</dd><dt>${t("coverage")}</dt><dd>${esc(rep.coverage)}</dd></dl><p class="office-stats">${t("office_stats", stats.updates_issued || 0, stats.responses_on_file || 0)}</p></article>`;
  }).join("");
}

function noticeCard(notice, featured = false) {
  const office = notice.office || notice.responsible_office || "";
  return `<article class="${featured ? "featured-inner" : "notice-item"}"><div class="notice-kicker"><span>${esc(notice.category || "")}</span><span>·</span><span>${esc(notice.date || "")}</span></div><h3>${esc(notice.title || notice.headline)}</h3><p>${esc(notice.summary)}</p>${featured && notice.body ? `<p class="notice-body">${esc(notice.body)}</p>` : ""}<div class="notice-meta"><strong>${esc(notice.locality)}</strong><span>${esc(office)}</span></div><a class="source-link" href="/#record/${encodeURIComponent(notice.id)}">${t("open_in_app")}</a></article>`;
}

function renderNotices() {
  const notices = state.notices.filter((notice) => !state.category || notice.category === state.category);
  $("#notice-count").textContent = t("count", notices.length);
  $("#last-updated").textContent = state.notices[0]?.date || "—";
  const categories = [...new Set(state.notices.map((notice) => notice.category).filter(Boolean))].sort();
  $("#category-filter").innerHTML = [`<button type="button" class="filter-chip ${!state.category ? "active" : ""}" data-category="">${t("all")}</button>`, ...categories.map((category) => `<button type="button" class="filter-chip ${state.category === category ? "active" : ""}" data-category="${esc(category)}">${esc(category)}</button>`)].join("");
  document.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => { state.category = button.dataset.category; state.shown = 9; renderNotices(); }));
  if (!notices.length) { $("#featured-notice").innerHTML = `<div class="featured-placeholder">${t("none")}</div>`; $("#recent-notices").innerHTML = ""; $("#more-notices").hidden = true; return; }
  $("#featured-notice").innerHTML = noticeCard(notices[0], true);
  const rest = notices.slice(1, 1 + state.shown);
  $("#recent-notices").innerHTML = rest.map((notice) => noticeCard(notice)).join("");
  const remaining = notices.length - 1 - rest.length;
  const more = $("#more-notices");
  more.hidden = remaining <= 0;
  more.textContent = t("more", Math.min(remaining, 9));
  more.onclick = () => { state.shown += 9; renderNotices(); };
}

function renderAuth() {
  const box = $("#publisher-auth");
  const form = $("#notice-form");
  const user = currentUser();
  const office = user && user.role_key === "office" && user.token;
  form.classList.toggle("locked", !office);
  form.querySelectorAll("input,select,textarea,button").forEach((el) => { el.disabled = !office; });
  if (office) {
    box.innerHTML = `<div class="auth-state"><span><strong>${t("signed_in", esc(user.label))}</strong> · ${t("office_account")}</span><button type="button" id="publisher-signout" class="link-btn">${t("sign_out")}</button></div>`;
    box.querySelector("#publisher-signout").addEventListener("click", () => { fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: user.token }) }).catch(() => {}); localStorage.removeItem("civic-bridge-user"); renderAuth(); });
    // Seeded office accounts belong to one office: preselect it.
    if (user.office_id) { const rep = state.reps.find((item) => item.id === user.office_id); if (rep) $("#responsible_office").value = rep.name; }
    return;
  }
  box.innerHTML = `<form id="publisher-login" class="auth-inline"><div><strong>${t("sign_in_required")}</strong><p>${t("sign_in_body")} ${user ? t("not_office", esc(user.label), esc(user.role || user.role_key)) : t("demo_hint")}</p></div><label>${t("username")}<input name="username" autocomplete="username" required /></label><label>${t("password")}<input name="password" type="password" autocomplete="current-password" required /></label><button type="submit">${t("sign_in")}</button><p class="auth-inline-error" hidden></p></form>`;
  const login = box.querySelector("#publisher-login");
  login.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(login).entries());
    const err = login.querySelector(".auth-inline-error");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("sign_in_failed"));
      if (data.user.role_key !== "office") throw new Error(t("not_office_error"));
      localStorage.setItem("civic-bridge-user", JSON.stringify({ ...data.user, token: data.token }));
      renderAuth();
    } catch (error) { err.textContent = error.message; err.hidden = false; }
  });
}

async function loadCountry(country) {
  state.country = PORTALS[country] ? country : "Togo";
  try { localStorage.setItem("civic-bridge-portal-country", state.country); } catch (error) { /* optional */ }
  const data = await (await fetch("/api/bootstrap")).json();
  const context = (data.country_contexts || {})[state.country] || {};
  const saved = savedArea();
  const locality = (data.localities || []).find((item) => item.country === state.country);
  state.area = (saved?.country === state.country && saved.area) || locality?.name || context.locality || "";
  state.region = (saved?.country === state.country && saved.region) || locality?.region || context.region || "";
  state.reps = context.representatives || [];
  state.category = ""; state.shown = 9;
  try { state.stats = (await (await fetch(`/api/representatives/stats?country=${encodeURIComponent(state.country)}`)).json()).representatives || {}; } catch (error) { state.stats = {}; }
  applyChrome();
  renderOffices();
  renderAuth();
  await loadNotices();
}

async function loadNotices() {
  try {
    const response = await fetch("/api/publisher/notices", { cache: "no-store" });
    if (!response.ok) return;
    const notices = ((await response.json()).notices || []).filter((notice) => notice.country === state.country);
    if (JSON.stringify(notices.map((n) => n.id)) === JSON.stringify(state.notices.map((n) => n.id))) return;
    state.notices = notices;
    renderNotices();
  } catch (error) { /* keep what is shown */ }
}

$("#notice-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector(".publish-button");
  button.disabled = true;
  const payload = Object.fromEntries(new FormData(form).entries());
  const rep = state.reps.find((item) => item.name === payload.responsible_office);
  payload.office = rep ? rep.display_name : payload.responsible_office;
  payload.country = state.country; payload.region = state.region; payload.token = (currentUser() || {}).token || "";
  try {
    const response = await fetch("/api/publisher/notices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || t("publish_failed"));
    form.reset(); $("#locality").value = state.area; renderAuth();
    showToast(t("published"));
    await loadNotices();
    try { state.stats = (await (await fetch(`/api/representatives/stats?country=${encodeURIComponent(state.country)}`)).json()).representatives || {}; renderOffices(); } catch (error) { /* optional */ }
  } catch (error) { showToast(error.message); } finally { button.disabled = false; }
});

$("#portal-country").addEventListener("change", (event) => loadCountry(event.target.value));
document.querySelectorAll(".gov-nav a[href^='#']").forEach((link) => link.addEventListener("click", () => { document.querySelectorAll(".gov-nav a").forEach((item) => item.classList.toggle("active", item === link)); }));

let portalCountry = savedArea()?.country;
try { portalCountry = localStorage.getItem("civic-bridge-portal-country") || portalCountry; } catch (error) { /* optional */ }
loadCountry(portalCountry || "Togo");
setInterval(loadNotices, 1000);
