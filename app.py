#!/usr/bin/env python3
"""Local-first civic information proof of concept.

Run with: python3 app.py
Then open: http://127.0.0.1:8000

The demo intentionally uses fictional, clearly labelled records. The API is
real and local; the AI-like explanation step is deterministic so the demo is
repeatable without a network or API key.
"""

from __future__ import annotations

import base64
import binascii
import gzip
import hashlib
import html
import json
import os
import secrets
import re
import threading
import uuid
import urllib.error
import urllib.request
import zlib
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
PRODUCT_NAME = os.environ.get("PRODUCT_NAME", "Civic Bridge")
DATA_DIR = Path(os.environ.get("CIVIC_BRIDGE_DATA_DIR", str(ROOT / "data")))
STATE_FILE = DATA_DIR / "state.json"
OLLAMA_URL = os.environ.get("CIVIC_BRIDGE_OLLAMA_URL", "http://127.0.0.1:11434/api/generate")
OLLAMA_MODEL = os.environ.get("CIVIC_BRIDGE_OLLAMA_MODEL", "")
# Seconds to wait for one model answer. CPU-only runtimes (e.g. Ollama inside
# Docker on a laptop) need far longer than a GPU-backed local install.
OLLAMA_TIMEOUT = int(os.environ.get("CIVIC_BRIDGE_OLLAMA_TIMEOUT", "0") or 0)


RECORDS: dict[str, dict[str, Any]] = {
    "water-access": {
        "id": "water-access",
        "title": "Shared water point access plan",
        "category": "Stability & social cohesion",
        "location": "Tamale North · Northern Region",
        "source_date": "08 Sep 2026",
        "source_label": "Public notice · page 4",
        "status": "Source verified",
        "status_detail": "Delivery unverified",
        "summary": "The notice proposes a revised access schedule for a shared water point used by nearby households, fields, and a livestock route.",
        "plain_language": "A schedule change is proposed. The notice describes the change, but it does not confirm when implementation will begin or how the first week will be managed.",
        "facts": [
            "A revised access schedule is proposed for the shared water point.",
            "The notice names the water point and describes the intended access windows.",
            "The source is dated 08 September 2026 and is available for review.",
        ],
        "unknowns": [
            "Who will publish the final schedule?",
            "When will the change start?",
            "How will urgent access be handled during the transition?",
        ],
        "perspectives": [
            {"label": "Field access", "body": "The timing should protect irrigation and household water collection during the morning."},
            {"label": "Livestock route", "body": "The route needs a predictable window so animals can pass without blocking other users."},
        ],
        "evidence": [
            {"label": "Source passage", "quote": "The district proposes a revised access schedule for the shared water point.", "page": "Page 4", "kind": "verified"},
            {"label": "Implementation detail", "quote": "The notice does not state a confirmed start date or transition procedure.", "page": "Page 4", "kind": "open"},
        ],
        "timeline": [
            {"date": "08 Sep 2026", "label": "Proposal published", "detail": "Public notice added to the local record.", "state": "done"},
            {"date": "09 Sep 2026", "label": "Community questions collected", "detail": "Residents can review the source and submit questions.", "state": "current"},
            {"date": "—", "label": "Final schedule", "detail": "No confirmed publication date in the source.", "state": "pending"},
        ],
        "channels": {
            "web": "Search the record and open the evidence beside the plain-language explanation.",
            "voice": "Listen to a short audio explanation on a shared radio or basic keypad phone, then record a question in your own words.",
            "text": "Receive the same source-backed answer through a lightweight WhatsApp or SMS-style exchange.",
        },
    },
    "market-road": {
        "id": "market-road",
        "title": "Market road repair proposal",
        "category": "Transparency & accountability",
        "location": "Tamale North · Northern Region",
        "source_date": "04 Sep 2026",
        "source_label": "Public project brief · page 2",
        "status": "Source verified",
        "status_detail": "Work not yet verified",
        "summary": "A public project brief proposes repairs to the road linking the market and the health post.",
        "plain_language": "The brief says repairs are planned and identifies the road section. It does not show a contractor, a start date, or proof that work has begun.",
        "facts": [
            "The project brief identifies the road section between the market and health post.",
            "Repairs are described as planned, not completed.",
            "The source does not list a confirmed contractor or start date.",
        ],
        "unknowns": [
            "Which office is responsible for the next update?",
            "What is the expected start date?",
            "Where can residents verify completion?",
        ],
        "perspectives": [
            {"label": "Market access", "body": "The road should remain passable for vendors and customers while repairs are planned."},
            {"label": "Health access", "body": "The route needs a clear temporary path for people reaching the health post."},
        ],
        "evidence": [
            {"label": "Source passage", "quote": "The project brief proposes repairs to the market–health post road section.", "page": "Page 2", "kind": "verified"},
            {"label": "What is missing", "quote": "The brief does not identify a contractor, start date, or completion evidence.", "page": "Page 2", "kind": "open"},
        ],
        "timeline": [
            {"date": "04 Sep 2026", "label": "Project brief published", "detail": "The proposal enters the public record.", "state": "done"},
            {"date": "10 Sep 2026", "label": "Representative update requested", "detail": "Residents can ask for a dated implementation update.", "state": "current"},
            {"date": "—", "label": "Work verified", "detail": "No completion evidence is linked yet.", "state": "pending"},
        ],
        "channels": {
            "web": "Open the project brief, the source passage, and the missing implementation details.",
            "voice": "Hear the key update on a shared radio or basic keypad phone, then speak a question and review the structured draft.",
            "text": "Send a short source-backed status question through a low-bandwidth channel.",
        },
    },
}

# The extended workspace is intentionally fictional and source-labelled. It
# gives the demo enough structure to show issue tracking, representative
# coverage, public updates, and low-bandwidth access without scraping live data.
ISSUES: list[dict[str, Any]] = [
    {
        "id": "water-access",
        "title": "Shared water point access plan",
        "type": "Stability & social cohesion",
        "locality": "Tamale North",
        "status": "Open question",
        "priority": "Community follow-up",
        "last_update": "09 Sep 2026",
        "source": "Public notice · page 4",
        "summary": "A revised schedule is proposed, but the start date and transition plan are not confirmed.",
    },
    {
        "id": "market-road",
        "title": "Market road repair proposal",
        "type": "Transparency & accountability",
        "locality": "Tamale North",
        "status": "Needs update",
        "priority": "Public works",
        "last_update": "10 Sep 2026",
        "source": "Public project brief · page 2",
        "summary": "Repairs are planned between the market and health post, but delivery evidence is still missing.",
    },
    {
        "id": "clinic-supply",
        "title": "Clinic supply delivery update",
        "type": "Safety, reporting & protection",
        "locality": "Tamale North",
        "status": "Source verified",
        "priority": "Health access",
        "last_update": "11 Sep 2026",
        "source": "Health bulletin · page 1",
        "summary": "A delivery is recorded for the health post; residents still need public confirmation of quantities received.",
    },
]

REPRESENTATIVES: list[dict[str, Any]] = [
    {
        "id": "ward-council",
        "name": "Ward council office",
        "role": "Ward representative",
        "level": "Ward",
        "locality": "River District · Ward 3",
        "coverage": "12,480 residents",
        "followed": True,
        "last_update": "10 Sep 2026",
        "commitments": 8,
        "verified": 5,
        "response_rate": 63,
        "focus": "Water access and local roads",
    },
    {
        "id": "district-council",
        "name": "District council office",
        "role": "District council",
        "level": "District",
        "locality": "Tamale North",
        "coverage": "38,200 residents",
        "followed": True,
        "last_update": "09 Sep 2026",
        "commitments": 14,
        "verified": 9,
        "response_rate": 71,
        "focus": "Public works and shared services",
    },
    {
        "id": "prefecture",
        "name": "Prefecture information office",
        "role": "Prefectural office",
        "level": "Prefecture",
        "locality": "South River region",
        "coverage": "6 districts",
        "followed": False,
        "last_update": "02 Sep 2026",
        "commitments": 11,
        "verified": 7,
        "response_rate": 58,
        "focus": "Regional coordination and emergency notices",
    },
    {
        "id": "governor",
        "name": "Regional public information office",
        "role": "Governor's office",
        "level": "Region",
        "locality": "South River region",
        "coverage": "1 region",
        "followed": False,
        "last_update": "28 Aug 2026",
        "commitments": 19,
        "verified": 13,
        "response_rate": 54,
        "focus": "Regional plans and budget notices",
    },
]

REPRESENTATIVE_STATS: dict[str, dict[str, Any]] = {
    "ward-council": {"questions_received": 37, "updates_issued": 12, "public_meetings": 6, "community_pulse": 68, "bio": "Local office responsible for ward-level services and follow-up questions."},
    "district-council": {"questions_received": 54, "updates_issued": 19, "public_meetings": 9, "community_pulse": 61, "bio": "District office coordinating public works and shared services across wards."},
    "prefecture": {"questions_received": 29, "updates_issued": 8, "public_meetings": 4, "community_pulse": 52, "bio": "Prefectural information office coordinating notices across six districts."},
    "governor": {"questions_received": 82, "updates_issued": 21, "public_meetings": 11, "community_pulse": 47, "bio": "Regional information office publishing plans and budget notices."},
}
for _representative in REPRESENTATIVES:
    _representative.update(REPRESENTATIVE_STATS[_representative["id"]])

LOCATION_OPTIONS: list[dict[str, Any]] = [
    {"country": "Togo", "regions": ["Région Maritime"], "recommended": True},
    {"country": "Kenya", "regions": ["Nairobi County"], "recommended": False},
    {"country": "Côte d’Ivoire", "regions": ["Abidjan District"], "recommended": False},
    {"country": "Ghana", "regions": ["Northern Region"], "recommended": False},
    {"country": "Nigeria", "regions": ["Lagos State"], "recommended": False},
]

SOURCE_LIBRARY: list[dict[str, Any]] = [
    {
        "id": "kenya-nairobi-adp-2025",
        "country": "Kenya", "region": "Nairobi County", "title": "Nairobi County Annual Development Plan 2025/2026 preparation update",
        "publisher": "Nairobi City County Government", "date": "07 Aug 2024", "language": "English",
        "topic": "Development priorities and public participation",
        "summary": "The county update describes the preparation of the 2025/2026 Annual Development Plan and its relationship to the County Integrated Development Plan. It is a reference source for the Nairobi pilot, not yet attached to a resident record.",
        "url": "https://nairobi.go.ke/nairobi-county-embarks-on-formulation-of-annual-development-plan-for-2025-2026",
    },
    {
        "id": "ghana-tamale-budget-2022",
        "country": "Ghana", "region": "Northern Region", "title": "Tamale Metropolitan Assembly 2022 Budget Narrative",
        "publisher": "Tamale Metropolitan Assembly", "date": "2022", "language": "English",
        "topic": "District projects and service priorities",
        "summary": "The budget narrative records local development challenges and planned public services, including water and roads. It is a reference source for the Tamale pilot, not yet attached to a resident record.",
        "url": "https://tamalemetro.gov.gh/wp-content/uploads/2022/07/2022-BUDGET-NARATIVE.pdf",
    },
    {
        "id": "nigeria-citizens-budget-guide",
        "country": "Nigeria", "region": "Federal Republic of Nigeria", "title": "Citizens’ Guide to the Federal Budget",
        "publisher": "Budget Office of the Federation", "date": "Current public guide", "language": "English",
        "topic": "Budget allocations and public accountability",
        "summary": "The guide gives citizens a simpler route into federal budget documents and implementation information. Civic Bridge can connect a budget line to the office, locality, and question a resident wants answered.",
        "url": "https://budgetoffice.gov.ng/nbinfo/",
    },
    {
        "id": "cote-divoire-budget-citoyen-2021",
        "country": "Côte d’Ivoire", "region": "Côte d’Ivoire", "title": "Guide pour mieux comprendre le Budget de l’État",
        "publisher": "Ministère du Budget et du Portefeuille de l’État", "date": "2021", "language": "Français",
        "topic": "Budget citoyen et participation budgétaire",
        "summary": "Ce guide explique le budget de l’État dans un langage simple et présente le budget participatif comme une manière de recueillir les priorités des habitants pour les collectivités.",
        "url": "https://www.budget.gouv.ci/doc/Budget_Citoyen_2021_VERSIONF.pdf",
    },
]

NEWS: list[dict[str, Any]] = [
    {
        "id": "news-water",
        "headline": "Public notice proposes a new shared water schedule",
        "type": "Public notice",
        "date": "08 Sep 2026",
        "status": "Source verified",
        "locality": "Tamale North",
        "source": "Public notice · page 4",
        "summary": "The notice describes proposed access windows. It does not confirm a start date.",
        "languages": ["English", "Français", "Swahili"],
    },
    {
        "id": "news-road",
        "headline": "Market-to-clinic road repair enters the public record",
        "type": "Project brief",
        "date": "04 Sep 2026",
        "status": "Needs update",
        "locality": "Tamale North",
        "source": "Public project brief · page 2",
        "summary": "The brief names the road section but does not list a contractor or confirmed start date.",
        "languages": ["English", "Français"],
    },
    {
        "id": "news-clinic",
        "headline": "Health post bulletin records a supply delivery",
        "type": "Health bulletin",
        "date": "11 Sep 2026",
        "status": "Source verified",
        "locality": "Tamale North",
        "source": "Health bulletin · page 1",
        "summary": "A delivery is recorded; the quantity received still needs public confirmation.",
        "languages": ["English", "Swahili", "Lingala"],
    },
]

LOCALITIES: list[dict[str, Any]] = [
    # One named pilot area per country is safer than showing the same records
    # under unrelated cities. Additional areas can be added when they have
    # their own source pack and institutional mapping.
    {"id": "lome", "name": "Lomé", "region": "Région Maritime", "country": "Togo", "people": "1,800,000", "issues_open": 3, "source_coverage": 0},
    {"id": "nairobi", "name": "Nairobi", "region": "Nairobi County", "country": "Kenya", "people": "4,400,000", "issues_open": 3, "source_coverage": 0},
    {"id": "abidjan", "name": "Abidjan", "region": "Abidjan District", "country": "Côte d’Ivoire", "people": "6,300,000", "issues_open": 3, "source_coverage": 0},
    {"id": "tamale-north", "name": "Tamale North constituency", "region": "Northern Region", "country": "Ghana", "people": "Illustrative area", "issues_open": 3, "source_coverage": 0},
    {"id": "lagos", "name": "Lagos", "region": "Lagos State", "country": "Nigeria", "people": "15,000,000", "issues_open": 3, "source_coverage": 0},
]


def make_fixture_record(spec: dict[str, Any], country: str, region: str, locality: str, is_french: bool) -> dict[str, Any]:
    """Build a country-specific fixture without implying a live source."""
    issuer = spec["issuer"]
    unknowns = list(spec["unknowns"])
    if is_french:
        return {
            "id": spec["id"],
            "title": spec["title"],
            "category": spec["category"],
            "location": f"{locality} · {region}",
            "country": country,
            "region": region,
            "locality": locality,
            "source_date": "Scénario illustratif",
            "source_label": f"Maquette illustrative · {issuer}",
            "source_title": "Maquette de prototype — aucune publication gouvernementale en direct connectée",
            "source_url": "",
            "provenance_status": "illustrative",
            "provenance_note": "Cette fiche propre au pays illustre le fonctionnement de l’outil ; ce n’est pas une publication gouvernementale.",
            "status": "Maquette illustrative",
            "status_detail": "Aucune source gouvernementale en direct connectée",
            "summary": spec["summary"],
            "plain_language": spec["plain_language"],
            "facts": list(spec["facts"]),
            "unknowns": unknowns,
            "perspectives": [dict(item) for item in spec["perspectives"]],
            "evidence": [
                {"label": "Passage source illustratif", "quote": spec["excerpt"], "page": "Extrait de prototype", "kind": "illustrative"},
                {"label": "Ce qui reste inconnu", "quote": unknowns[0], "page": "Non établi", "kind": "open"},
            ],
            "timeline": [
                {"date": "Scénario de prototype", "label": "Fiche préparée", "detail": "Maquette propre au pays ajoutée pour la démonstration.", "state": "done"},
                {"date": "—", "label": "Vérification de la source réelle", "detail": "Un document public réel doit être joint avant toute publication.", "state": "pending"},
            ],
            "channels": {
                "web": f"Consultez le {spec['document_type'].lower()} illustratif et les questions ouvertes pour {locality}.",
                "voice": spec["voice"],
                "text": spec["text"],
            },
            "responsible_office": issuer,
        }
    return {
        "id": spec["id"],
        "title": spec["title"],
        "category": spec["category"],
        "location": f"{locality} · {region}",
        "country": country,
        "region": region,
        "locality": locality,
        "source_date": "Illustrative scenario",
        "source_label": f"Illustrative fixture · {issuer}",
        "source_title": "Prototype fixture — no live government publication connected",
        "source_url": "",
        "provenance_status": "illustrative",
        "provenance_note": "This country-specific record demonstrates the workflow; it is not a government publication.",
        "status": "Illustrative fixture",
        "status_detail": "No live government source connected",
        "summary": spec["summary"],
        "plain_language": spec["plain_language"],
        "facts": list(spec["facts"]),
        "unknowns": unknowns,
        "perspectives": [dict(item) for item in spec["perspectives"]],
        "evidence": [
            {"label": "Illustrative source passage", "quote": spec["excerpt"], "page": "Prototype excerpt", "kind": "illustrative"},
            {"label": "What remains unknown", "quote": unknowns[0], "page": "Not established", "kind": "open"},
        ],
        "timeline": [
            {"date": "Prototype scenario", "label": "Record prepared", "detail": "Country-specific fixture added for the demonstration.", "state": "done"},
            {"date": "—", "label": "Live source review", "detail": "A real public document must be attached before publication.", "state": "pending"},
        ],
        "channels": {
            "web": f"Review the illustrative {spec['document_type'].lower()} and the open questions for {locality}.",
            "voice": spec["voice"],
            "text": spec["text"],
        },
        "responsible_office": issuer,
    }


def make_country_context(country: str, spec: dict[str, Any]) -> dict[str, Any]:
    region = spec["region"]
    locality = spec["locality"]
    is_french = spec["languages"][0] == "Français"
    records = [make_fixture_record(item, country, region, locality, is_french) for item in spec["records"]]
    issues = [
        {
            "id": record["id"],
            "title": record["title"],
            "type": record["category"],
            "locality": locality,
            "status": item.get("issue_status", "Needs update"),
            "priority": item.get("priority", "Community follow-up"),
            "last_update": "Scénario illustratif" if is_french else "Illustrative scenario",
            "source": record["source_label"],
            "summary": record["summary"],
        }
        for item, record in zip(spec["records"], records)
    ]
    news = [
        {
            "id": record["id"],
            "headline": record["title"],
            "type": item.get("document_type", "Public information update"),
            "date": "Scénario illustratif" if is_french else "Illustrative scenario",
            "status": issue["status"],
            "locality": locality,
            "source": record["source_label"],
            "summary": record["summary"],
            "languages": list(spec["languages"]),
        }
        for item, record, issue in zip(spec["records"], records, issues)
    ]
    representatives = []
    for item in spec["representatives"]:
        representatives.append({
            "id": item["id"],
            "name": item["office"],
            "display_name": item["display_name"],
            "role": item["role"],
            "level": item["level"],
            "locality": item.get("locality", locality),
            "coverage": item["coverage"],
            "followed": item.get("followed", False),
            "last_update": "Scénario illustratif" if is_french else "Illustrative scenario",
            "commitments": item["commitments"],
            "verified": item["verified"],
            "response_rate": item["response_rate"],
            "focus": item["focus"],
            "questions_received": item["questions_received"],
            "updates_issued": item["updates_issued"],
            "public_meetings": item["public_meetings"],
            "community_pulse": item["community_pulse"],
            "bio": item["bio"],
        })
    metrics = [
        {"label": "Dossiers ouverts", "value": str(len(issues)), "detail": "Dossiers illustratifs uniquement", "tone": "ochre"},
        {"label": "Niveaux de représentation", "value": str(len(representatives)), "detail": "Hiérarchie propre au pays", "tone": "blue"},
        {"label": "Avis publiés", "value": "0", "detail": "Par les bureaux de votre pays", "tone": "green"},
        {"label": "Langues", "value": str(len(spec["languages"])), "detail": "Parcours linguistiques proposés", "tone": "violet"},
    ] if is_french else [
        {"label": "Open issues", "value": str(len(issues)), "detail": "Illustrative records only", "tone": "ochre"},
        {"label": "Representative levels", "value": str(len(representatives)), "detail": "Country-specific hierarchy", "tone": "blue"},
        {"label": "Published notices", "value": "0", "detail": "By the offices in your country", "tone": "green"},
        {"label": "Languages", "value": str(len(spec["languages"])), "detail": "Language pathways shown", "tone": "violet"},
    ]
    return {
        "country": country,
        "region": region,
        "locality": locality,
        "language_code": "fr" if is_french else "en",
        "hierarchy": list(spec["hierarchy"]),
        "languages": list(spec["languages"]),
        "records": records,
        "issues": issues,
        "news": news,
        "representatives": representatives,
        "dashboard": {"metrics": metrics, "languages": list(spec["languages"]), "last_sync": "Ce qui se passe" if is_french else "What is happening"},
    }


COUNTRY_CONTEXTS: dict[str, dict[str, Any]] = {
    "Togo": make_country_context("Togo", {
        "region": "Région Maritime", "locality": "Lomé",
        "hierarchy": ["Tous les niveaux", "Commune", "Préfecture", "Région", "National"],
        "languages": ["Français", "Éwé", "Kabyè", "Mina"],
        "records": [
            {"id": "water-access", "title": "Avis sur la desserte en eau à Lomé", "category": "Accès aux services publics", "document_type": "avis de service", "issuer": "Togolaise des Eaux (TdE) — scénario Lomé", "summary": "Ce scénario illustre un avis de service sur la desserte en eau dans certains quartiers de Lomé, sans présenter de calendrier officiel.", "plain_language": "Le message invite les habitants à vérifier une prochaine mise à jour, mais il ne confirme ni les quartiers concernés ni les horaires.", "excerpt": "Une mise à jour sur la desserte en eau des quartiers concernés sera communiquée par le service d’information de la Togolaise des Eaux.", "facts": ["Le scénario concerne l’accès à l’eau à Lomé.", "Les quartiers et les horaires ne sont pas établis dans cette maquette.", "L’opérateur doit confirmer le calendrier avant toute annonce publique."], "unknowns": ["Quels quartiers sont concernés ?", "À quelles dates et heures le service sera-t-il modifié ?", "Où sera publié l’avis officiel ?"], "perspectives": [{"label": "Accès des ménages", "body": "Les familles ont besoin d’un horaire prévisible pour organiser la collecte."}, {"label": "Activités locales", "body": "Les petits commerces ont besoin d’une information assez tôt pour s’adapter."}], "voice": "Écoutez un bref résumé sur la desserte en eau à Lomé, puis enregistrez votre question.", "text": "Recevez un résumé court avec le statut de la source et la prochaine question.", "issue_status": "Open question", "priority": "Desserte en eau"},
            {"id": "market-road", "title": "Point d’information sur les travaux de voirie au grand marché de Lomé", "category": "Transparence et responsabilité", "document_type": "avis de travaux", "issuer": "AGETUR-Togo — scénario Lomé", "summary": "Ce scénario présente un point d’information sur des travaux de voirie près du grand marché de Lomé.", "plain_language": "Les travaux sont envisagés, mais le tronçon exact, les dates et les dispositions pour les piétons ne sont pas confirmés.", "excerpt": "Des travaux de voirie sont envisagés à proximité du grand marché ; les dates et le plan de circulation feront l’objet d’une communication séparée.", "facts": ["Le scénario concerne la voirie autour du grand marché de Lomé.", "Les travaux sont présentés comme envisagés, et non achevés.", "Le tronçon et le calendrier doivent encore être confirmés."], "unknowns": ["Quel tronçon sera concerné ?", "Quand les travaux commenceront-ils ?", "Quel itinéraire temporaire sera prévu pour les piétons ?"], "perspectives": [{"label": "Accès au marché", "body": "Les vendeuses et les clients ont besoin d’un accès praticable pendant les travaux."}, {"label": "Sécurité des piétons", "body": "Un itinéraire temporaire clairement signalé doit rester accessible."}], "voice": "Écoutez le résumé des travaux au grand marché et demandez où trouver les dates officielles.", "text": "Posez une question courte sur le tronçon, le calendrier et la circulation.", "issue_status": "Needs update", "priority": "Travaux de voirie"},
            {"id": "clinic-supply", "title": "Mise à jour d’un centre de santé communautaire à Lomé", "category": "Santé et protection", "document_type": "mise à jour sanitaire", "issuer": "Direction régionale de la santé Maritime — scénario Lomé", "summary": "Ce scénario suit une vérification de stock dans un centre de santé communautaire de Lomé sans prétendre qu’une livraison a été effectuée.", "plain_language": "La vérification est annoncée, mais le centre, les produits et les quantités ne sont pas établis dans cette maquette.", "excerpt": "La disponibilité des produits essentiels sera vérifiée dans le centre de santé et fera l’objet d’un prochain rapport.", "facts": ["Le scénario concerne un centre de santé communautaire à Lomé.", "Il s’agit d’une vérification de stock, pas d’une preuve de livraison.", "Les produits et les quantités restent à préciser."], "unknowns": ["Quel centre et quels produits sont concernés ?", "Quelle quantité est disponible ?", "Quand le prochain rapport sera-t-il publié ?"], "perspectives": [{"label": "Accès des patients", "body": "Les patients doivent savoir avant de se déplacer si le service est disponible."}, {"label": "Personnel de santé", "body": "Le personnel a besoin d’un canal clair pour signaler les changements de stock."}], "voice": "Écoutez la mise à jour sanitaire et demandez quel centre et quels produits sont concernés.", "text": "Recevez la question de suivi dans un échange textuel court.", "issue_status": "Needs update", "priority": "Accès aux soins"},
            {"id": "school-supply", "title": "Mise à jour sur les fournitures scolaires à Lomé", "category": "Accès à l’éducation", "document_type": "mise à jour scolaire", "issuer": "Direction régionale de l’éducation Maritime — scénario Lomé", "summary": "Ce scénario suit une vérification des fournitures scolaires dans une école primaire de Lomé sans prétendre qu’une livraison a été effectuée.", "plain_language": "La vérification est annoncée, mais l’école, les fournitures et les quantités ne sont pas établies dans cette maquette.", "excerpt": "La disponibilité des manuels et fournitures essentielles sera vérifiée dans l’école primaire et fera l’objet d’un prochain rapport.", "facts": ["Le scénario concerne une école primaire de Lomé.", "Il s’agit d’une vérification de fournitures, pas d’une preuve de livraison.", "Les manuels et les quantités restent à préciser."], "unknowns": ["Quelle école et quelles fournitures sont concernées ?", "Quelle quantité est disponible ?", "Quand le prochain rapport sera-t-il publié ?"], "perspectives": [{"label": "Accès des élèves", "body": "Les familles ont besoin de savoir si les manuels seront disponibles avant la rentrée."}, {"label": "Personnel enseignant", "body": "Les enseignants ont besoin d’un canal clair pour signaler les manques de fournitures."}], "voice": "Écoutez la mise à jour scolaire et demandez quelle école et quelles fournitures sont concernées.", "text": "Recevez la question de suivi dans un échange textuel court.", "issue_status": "Needs update", "priority": "Accès à l’éducation"},
            {"id": "power-outage", "title": "Avis sur la fourniture d’électricité à Lomé", "category": "Accès aux services publics", "document_type": "avis de service", "issuer": "Compagnie Énergie Électrique du Togo (CEET) — scénario Lomé", "summary": "Ce scénario illustre un avis de service sur la fourniture d’électricité dans certains quartiers de Lomé, sans présenter de calendrier officiel.", "plain_language": "Le message invite les habitants à vérifier une prochaine mise à jour, mais il ne confirme ni les quartiers concernés ni les horaires de rétablissement.", "excerpt": "Une mise à jour sur la fourniture d’électricité des quartiers concernés sera communiquée par le service d’information de la CEET.", "facts": ["Le scénario concerne la fourniture d’électricité à Lomé.", "Les quartiers et les horaires ne sont pas établis dans cette maquette.", "L’opérateur doit confirmer le calendrier avant toute annonce publique."], "unknowns": ["Quels quartiers sont concernés ?", "À quelle heure le service sera-t-il rétabli ?", "Où sera publié l’avis officiel ?"], "perspectives": [{"label": "Activités locales", "body": "Les petits commerces ont besoin d’une information assez tôt pour s’adapter."}, {"label": "Accès des ménages", "body": "Les familles ont besoin d’un horaire prévisible pour organiser leurs activités."}], "voice": "Écoutez un bref résumé sur la fourniture d’électricité à Lomé, puis enregistrez votre question.", "text": "Recevez un résumé court avec le statut de la source et la prochaine question.", "issue_status": "Open question", "priority": "Fourniture d’électricité"},
        ],
        "representatives": [
            {"id": "ward-council", "display_name": "Bureau communal du Golfe 1", "office": "Bureau de participation communale", "role": "Bureau communal", "level": "Commune", "coverage": "Commune sélectionnée", "commitments": 6, "verified": 2, "response_rate": 35, "focus": "Services communaux et marchés", "questions_received": 19, "updates_issued": 5, "public_meetings": 3, "community_pulse": 60, "bio": "Bureau communal illustratif pour le pilote de Lomé."},
            {"id": "district-council", "display_name": "Préfecture du Golfe", "office": "Service d’information de la préfecture du Golfe", "role": "Bureau préfectoral", "level": "Préfecture", "coverage": "Préfecture du Golfe", "commitments": 8, "verified": 3, "response_rate": 39, "focus": "Coordination des services urbains", "questions_received": 27, "updates_issued": 7, "public_meetings": 4, "community_pulse": 55, "bio": "Bureau préfectoral illustratif pour le pilote de Lomé."},
            {"id": "prefecture", "display_name": "Conseil régional Maritime", "office": "Bureau régional d’information — Région Maritime", "role": "Bureau régional", "level": "Région", "coverage": "Région Maritime", "commitments": 7, "verified": 3, "response_rate": 42, "focus": "Coordination régionale et information publique", "questions_received": 24, "updates_issued": 6, "public_meetings": 3, "community_pulse": 51, "bio": "Bureau régional illustratif pour le pilote de Lomé."},
            {"id": "governor", "display_name": "Service national d’information", "office": "Service national d’information publique", "role": "Service national", "level": "National", "coverage": "Togo", "commitments": 10, "verified": 4, "response_rate": 40, "focus": "Politiques et services nationaux", "questions_received": 33, "updates_issued": 9, "public_meetings": 4, "community_pulse": 47, "bio": "Service national illustratif pour le pilote de Lomé."},
        ],
    }),
    "Kenya": make_country_context("Kenya", {
        "region": "Nairobi County", "locality": "Nairobi",
        "hierarchy": ["All levels", "Ward", "Constituency", "County", "National"],
        "languages": ["English", "Kiswahili", "Kikuyu", "Dholuo"],
        "records": [
            {"id": "water-access", "title": "Nairobi water service interruption update", "category": "Public service update", "document_type": "service update", "issuer": "Nairobi City Water and Sewerage Company", "summary": "An illustrative utility update explains that selected Nairobi neighbourhoods may receive revised water-service information, while exact interruption windows still need confirmation.", "plain_language": "The service message gives residents a reason to check for an updated schedule, but it does not yet establish the exact neighbourhood, time, or restoration commitment.", "excerpt": "Selected Nairobi service areas will receive an updated water-service notice through the utility information desk.", "facts": ["The scenario concerns a Nairobi water-service communication.", "The affected neighbourhood and time window are not established in this fixture.", "A utility or county source would need to confirm the schedule."], "unknowns": ["Which Nairobi neighbourhoods are affected?", "What are the start and restoration times?", "Where will the official schedule be published?"], "perspectives": [{"label": "Household access", "body": "Residents need a predictable collection window and clear notice of changes."}, {"label": "Small business", "body": "Shops and food businesses need enough notice to plan around a service interruption."}], "voice": "Hear a short Nairobi service summary, then record a question in your own words.", "text": "Receive a compact Nairobi service update with the source status and the next question.", "issue_status": "Open question", "priority": "Water access"},
            {"id": "market-road", "title": "Ward drainage maintenance notice", "category": "Transparency & accountability", "document_type": "county works notice", "issuer": "Nairobi City County public works office", "summary": "An illustrative county notice describes planned maintenance on drainage and access routes serving a Nairobi ward.", "plain_language": "Maintenance is proposed, but the fixture does not establish the exact route, contractor, start date, or completion evidence.", "excerpt": "The county public works office proposes maintenance on selected drainage and access routes in the ward.", "facts": ["The scenario concerns county-managed public works in Nairobi.", "The work is described as planned rather than completed.", "A route, funding line, and dated progress update are still needed."], "unknowns": ["Which ward route is included?", "When will maintenance begin and end?", "Who will publish completion evidence?"], "perspectives": [{"label": "Safe movement", "body": "Residents need a passable route during works and clear warnings around open drains."}, {"label": "Flood protection", "body": "Drain maintenance should reduce flooding risk before the next heavy rainfall."}], "voice": "Hear the Nairobi works summary, then ask where the route and dates will be published.", "text": "Send a short question about the Nairobi route, dates, and completion evidence.", "issue_status": "Needs update", "priority": "County works"},
            {"id": "clinic-supply", "title": "Primary health centre stock update", "category": "Safety, reporting & protection", "document_type": "health-service update", "issuer": "Nairobi County health services", "summary": "An illustrative health-service update records a stock review at a Nairobi primary health centre without claiming that supplies were received or distributed.", "plain_language": "The record says a stock review is being followed, but it does not establish the commodity, quantity, facility, or delivery status.", "excerpt": "The health services team will review stock availability at a selected primary health centre and report the next status.", "facts": ["The scenario concerns a Nairobi primary health centre.", "It is a stock-review scenario, not proof of a delivery.", "The commodity, quantity, and reporting date remain open."], "unknowns": ["Which facility and commodity are covered?", "What quantity was received or distributed?", "When will the health directorate publish the next report?"], "perspectives": [{"label": "Patient access", "body": "Patients need reliable information before travelling to a facility for a service."}, {"label": "Facility staff", "body": "Staff need a clear reporting path when stock status changes."}], "voice": "Listen to the health-service summary and ask which facility and supplies are covered.", "text": "Receive the facility status question in a compact text exchange.", "issue_status": "Needs update", "priority": "Health access"},
            {"id": "school-supply", "title": "Nairobi primary school supply update", "category": "Access to education", "document_type": "school-service update", "issuer": "Nairobi County education office", "summary": "This illustrative update follows a textbook and supply check at a Nairobi primary school without claiming that a delivery occurred.", "plain_language": "The scenario is about checking supply status; the school, materials, and quantities remain open until an official report identifies them.", "excerpt": "The education office will review textbook and supply availability at a selected primary school and publish the next status through its reporting channel.", "facts": ["The scenario concerns a Nairobi primary school.", "It is a supply-check scenario, not proof of a delivery.", "The school and materials remain unnamed in this fixture."], "unknowns": ["Which school and materials are covered?", "What quantity was received or is still needed?", "When will the next report be published?"], "perspectives": [{"label": "Family access", "body": "Parents need to know before the term starts whether textbooks will be available."}, {"label": "Teaching staff", "body": "Teachers need a clear channel to report shortages as they happen."}], "voice": "Hear the school-supply summary and ask which school and materials are covered.", "text": "Receive the school status question through a short text exchange.", "issue_status": "Needs update", "priority": "Education access"},
            {"id": "power-outage", "title": "Nairobi power supply update", "category": "Public service update", "document_type": "service update", "issuer": "Kenya Power — Nairobi scenario", "summary": "This illustrative utility update explains that selected Nairobi neighbourhoods may receive revised power-service information, while exact restoration windows still need confirmation.", "plain_language": "The service message gives residents a reason to check for an updated schedule, but it does not yet establish the exact neighbourhood, time, or restoration commitment.", "excerpt": "Selected Nairobi service areas will receive an updated power-service notice through the utility information desk.", "facts": ["The scenario concerns a Nairobi power-service communication.", "The affected neighbourhood and restoration time are not established in this fixture.", "The utility would need to confirm the schedule."], "unknowns": ["Which Nairobi neighbourhoods are affected?", "When will power be restored?", "Where will the official schedule be published?"], "perspectives": [{"label": "Household access", "body": "Residents need a predictable restoration window and clear notice of changes."}, {"label": "Small business", "body": "Shops need enough notice to plan around a power interruption."}], "voice": "Hear a short Nairobi power-service summary, then record a question in your own words.", "text": "Receive a compact Nairobi power update with the source status and the next question.", "issue_status": "Open question", "priority": "Power supply"},
        ],
        "representatives": [
            {"id": "ward-council", "display_name": "Nairobi ward office", "office": "Ward public participation office", "role": "Ward office", "level": "Ward", "coverage": "Selected ward", "commitments": 5, "verified": 2, "response_rate": 40, "focus": "Local services and ward priorities", "questions_received": 18, "updates_issued": 6, "public_meetings": 3, "community_pulse": 62, "bio": "Illustrative ward-level office for the Nairobi pilot."},
            {"id": "district-council", "display_name": "Nairobi constituency office", "office": "Constituency public information office", "role": "Constituency office", "level": "Constituency", "coverage": "Selected constituency", "commitments": 7, "verified": 3, "response_rate": 43, "focus": "Constituency development questions", "questions_received": 24, "updates_issued": 8, "public_meetings": 4, "community_pulse": 58, "bio": "Illustrative constituency-level office for the Nairobi pilot."},
            {"id": "prefecture", "display_name": "Nairobi City County office", "office": "Nairobi City County public information office", "role": "County office", "level": "County", "coverage": "Nairobi County", "commitments": 11, "verified": 5, "response_rate": 45, "focus": "County services and infrastructure", "questions_received": 39, "updates_issued": 12, "public_meetings": 6, "community_pulse": 55, "bio": "Illustrative county-level office for the Nairobi pilot."},
            {"id": "governor", "display_name": "National public information desk", "office": "National public information desk", "role": "National office", "level": "National", "coverage": "Kenya", "commitments": 9, "verified": 4, "response_rate": 44, "focus": "National policy and service information", "questions_received": 31, "updates_issued": 10, "public_meetings": 5, "community_pulse": 51, "bio": "Illustrative national-level office for the Nairobi pilot."},
        ],
    }),
    "Côte d’Ivoire": make_country_context("Côte d’Ivoire", {
        "region": "Abidjan District", "locality": "Abidjan",
        "hierarchy": ["Tous les niveaux", "Commune", "District autonome", "Région", "National"],
        "languages": ["Français", "Dioula", "Baoulé", "Mooré"],
        "records": [
            {"id": "water-access", "title": "Avis sur la desserte en eau à Abidjan", "category": "Accès aux services publics", "document_type": "avis de service", "issuer": "Service public de l’eau — scénario Abidjan", "summary": "Ce scénario illustre un avis de service sur la desserte en eau dans certains quartiers d’Abidjan, sans présenter de calendrier officiel.", "plain_language": "Le message invite les habitants à vérifier une prochaine mise à jour, mais il ne confirme ni les quartiers concernés ni les horaires.", "excerpt": "Une mise à jour sur la desserte en eau des quartiers concernés sera communiquée par le service d’information.", "facts": ["Le scénario concerne l’accès à l’eau à Abidjan.", "Les quartiers et les horaires ne sont pas établis dans cette maquette.", "Un opérateur ou une autorité compétente doit confirmer le calendrier."], "unknowns": ["Quels quartiers sont concernés ?", "À quelles dates et heures le service sera-t-il modifié ?", "Où sera publié l’avis officiel ?"], "perspectives": [{"label": "Accès des ménages", "body": "Les familles ont besoin d’un horaire prévisible pour organiser la collecte."}, {"label": "Activités locales", "body": "Les petits commerces ont besoin d’une information assez tôt pour s’adapter."}], "voice": "Écoutez un bref résumé sur la desserte en eau à Abidjan, puis enregistrez votre question.", "text": "Recevez un résumé court avec le statut de la source et la prochaine question.", "issue_status": "Open question", "priority": "Desserte en eau"},
            {"id": "market-road", "title": "Point d’information sur les travaux de voirie à Abobo", "category": "Transparence et responsabilité", "document_type": "avis de travaux", "issuer": "Service de voirie communale — scénario Abobo", "summary": "Ce scénario présente un point d’information sur des travaux de voirie près d’un marché d’Abobo.", "plain_language": "Les travaux sont envisagés, mais le tronçon exact, les dates et les dispositions pour les piétons ne sont pas confirmés.", "excerpt": "Des travaux de voirie sont envisagés à proximité du marché; les dates et le plan de circulation feront l’objet d’une communication séparée.", "facts": ["Le scénario concerne la voirie autour d’un marché d’Abobo.", "Les travaux sont présentés comme envisagés, et non achevés.", "Le tronçon et le calendrier doivent encore être confirmés."], "unknowns": ["Quel tronçon sera concerné ?", "Quand les travaux commenceront-ils ?", "Quel itinéraire temporaire sera prévu pour les piétons ?"], "perspectives": [{"label": "Accès au marché", "body": "Les vendeurs et les clients ont besoin d’un accès praticable pendant les travaux."}, {"label": "Sécurité des piétons", "body": "Un itinéraire temporaire clairement signalé doit rester accessible."}], "voice": "Écoutez le résumé des travaux à Abobo et demandez où trouver les dates officielles.", "text": "Posez une question courte sur le tronçon, le calendrier et la circulation.", "issue_status": "Needs update", "priority": "Travaux de voirie"},
            {"id": "clinic-supply", "title": "Mise à jour d’un centre de santé communautaire", "category": "Santé et protection", "document_type": "mise à jour sanitaire", "issuer": "Direction sanitaire locale — scénario Abidjan", "summary": "Ce scénario suit une vérification de stock dans un centre de santé communautaire d’Abidjan sans prétendre qu’une livraison a été effectuée.", "plain_language": "La vérification est annoncée, mais le centre, les produits et les quantités ne sont pas établis dans cette maquette.", "excerpt": "La disponibilité des produits essentiels sera vérifiée dans le centre de santé et fera l’objet d’un prochain rapport.", "facts": ["Le scénario concerne un centre de santé communautaire à Abidjan.", "Il s’agit d’une vérification de stock, pas d’une preuve de livraison.", "Les produits et les quantités restent à préciser."], "unknowns": ["Quel centre et quels produits sont concernés ?", "Quelle quantité est disponible ?", "Quand le prochain rapport sera-t-il publié ?"], "perspectives": [{"label": "Accès des patients", "body": "Les patients doivent savoir avant de se déplacer si le service est disponible."}, {"label": "Personnel de santé", "body": "Le personnel a besoin d’un canal clair pour signaler les changements de stock."}], "voice": "Écoutez la mise à jour sanitaire et demandez quel centre et quels produits sont concernés.", "text": "Recevez la question de suivi dans un échange textuel court.", "issue_status": "Needs update", "priority": "Accès aux soins"},
            {"id": "school-supply", "title": "Mise à jour sur les fournitures scolaires à Abidjan", "category": "Accès à l’éducation", "document_type": "mise à jour scolaire", "issuer": "Direction régionale de l’éducation — scénario Abidjan", "summary": "Ce scénario suit une vérification des fournitures scolaires dans une école primaire d’Abidjan sans prétendre qu’une livraison a été effectuée.", "plain_language": "La vérification est annoncée, mais l’école et les quantités ne sont pas établies dans cette maquette.", "excerpt": "La disponibilité des manuels sera vérifiée dans une école primaire du quartier et fera l’objet d’un prochain rapport.", "facts": ["Le scénario concerne une école primaire d’Abidjan.", "Il s’agit d’une vérification, pas d’une preuve de livraison.", "L’école et les quantités restent à préciser."], "unknowns": ["Quelle école est concernée ?", "Quelle quantité de manuels est disponible ?", "Quand le rapport sera-t-il publié ?"], "perspectives": [{"label": "Accès des élèves", "body": "Les familles veulent savoir si les manuels seront prêts avant la rentrée."}, {"label": "Personnel enseignant", "body": "Les enseignants ont besoin d’un canal pour signaler les manques."}], "voice": "Écoutez la mise à jour scolaire et demandez quelle école est concernée.", "text": "Posez une question courte sur les fournitures et la date du rapport.", "issue_status": "Needs update", "priority": "Éducation"},
            {"id": "power-outage", "title": "Avis sur la fourniture d’électricité à Abidjan", "category": "Accès aux services publics", "document_type": "avis de service", "issuer": "Compagnie Ivoirienne d’Électricité (CIE) — scénario Abidjan", "summary": "Ce scénario illustre un avis de service sur la fourniture d’électricité dans certains quartiers d’Abidjan, sans présenter de calendrier officiel.", "plain_language": "Le message invite les habitants à vérifier une prochaine mise à jour, mais il ne confirme ni les quartiers concernés ni les horaires de rétablissement.", "excerpt": "Une mise à jour sur la fourniture d’électricité des quartiers concernés sera communiquée par le service d’information de la CIE.", "facts": ["Le scénario concerne la fourniture d’électricité à Abidjan.", "Les quartiers et les horaires ne sont pas établis dans cette maquette.", "L’opérateur doit confirmer le calendrier."], "unknowns": ["Quels quartiers sont concernés ?", "À quelle heure le service sera-t-il rétabli ?", "Où sera publié l’avis officiel ?"], "perspectives": [{"label": "Activités locales", "body": "Les petits commerces ont besoin d’une information assez tôt pour s’adapter."}, {"label": "Accès des ménages", "body": "Les familles ont besoin d’un horaire prévisible."}], "voice": "Écoutez un bref résumé sur la fourniture d’électricité à Abidjan, puis enregistrez votre question.", "text": "Recevez un résumé court avec le statut de la source et la prochaine question.", "issue_status": "Open question", "priority": "Fourniture d’électricité"},
        ],
        "representatives": [
            {"id": "ward-council", "display_name": "Bureau communal d’Abobo", "office": "Bureau de participation communale", "role": "Bureau communal", "level": "Commune", "coverage": "Commune sélectionnée", "commitments": 6, "verified": 2, "response_rate": 33, "focus": "Services communaux et marchés", "questions_received": 21, "updates_issued": 5, "public_meetings": 3, "community_pulse": 59, "bio": "Bureau communal illustratif pour le pilote d’Abidjan."},
            {"id": "district-council", "display_name": "Bureau du District autonome", "office": "Service d’information du District autonome", "role": "Bureau du district", "level": "District autonome", "coverage": "District d’Abidjan", "commitments": 8, "verified": 3, "response_rate": 38, "focus": "Coordination des services urbains", "questions_received": 28, "updates_issued": 7, "public_meetings": 4, "community_pulse": 54, "bio": "Bureau du district illustratif pour le pilote d’Abidjan."},
            {"id": "prefecture", "display_name": "Bureau régional d’information", "office": "Bureau de coordination régionale", "role": "Bureau régional", "level": "Région", "coverage": "District d’Abidjan", "commitments": 7, "verified": 3, "response_rate": 43, "focus": "Coordination et information publique", "questions_received": 25, "updates_issued": 6, "public_meetings": 3, "community_pulse": 50, "bio": "Bureau régional illustratif pour le pilote d’Abidjan."},
            {"id": "governor", "display_name": "Service national d’information", "office": "Service national d’information publique", "role": "Service national", "level": "National", "coverage": "Côte d’Ivoire", "commitments": 10, "verified": 4, "response_rate": 40, "focus": "Politiques et services nationaux", "questions_received": 34, "updates_issued": 9, "public_meetings": 4, "community_pulse": 48, "bio": "Service national illustratif pour le pilote d’Abidjan."},
        ],
    }),
    "Ghana": make_country_context("Ghana", {
        "region": "Northern Region", "locality": "Tamale North constituency",
        "hierarchy": ["All levels", "Electoral area", "Municipal / Metropolitan Assembly", "Regional Coordinating Council", "Parliament constituency"],
        "languages": ["English", "Dagbani", "Twi", "Ewe"],
        "records": [
            {"id": "water-access", "title": "Tamale water project information update", "category": "Public service update", "document_type": "public information update", "issuer": "Tamale Metropolitan Assembly / Ghana Water Company scenario", "summary": "This illustrative update explains the status questions residents may ask about water projects serving Tamale and nearby communities.", "plain_language": "The scenario describes a public water update, but it does not establish a local schedule, construction milestone, or delivery date.", "excerpt": "Residents may request a dated update on the water project, the affected communities, and the next public information point.", "facts": ["The scenario concerns water-service information for Tamale.", "A project update is different from a confirmed household supply schedule.", "The responsible office and next dated update need to be identified."], "unknowns": ["Which communities and facilities are covered?", "What milestone has been completed?", "When will the next official update be published?"], "perspectives": [{"label": "Household water access", "body": "Residents need clear information about service timing and reliability."}, {"label": "Community planning", "body": "Local leaders need a dated update they can repeat accurately on radio and in meetings."}], "voice": "Hear the Tamale water-project summary, then record a question about the next dated update.", "text": "Receive a compact water-project update with the evidence status and open question.", "issue_status": "Open question", "priority": "Water access"},
            {"id": "market-road", "title": "Market approach road maintenance update", "category": "Transparency & accountability", "document_type": "works update", "issuer": "Tamale Metropolitan Assembly Works Department scenario", "summary": "This illustrative works update describes planned maintenance on an access route serving a market and nearby health service.", "plain_language": "Maintenance is proposed, but the scenario does not establish the road segment, contractor, dates, or completion evidence.", "excerpt": "The Works Department will provide a dated update on the market approach road, the planned intervention, and the temporary access arrangement.", "facts": ["The scenario concerns a market approach road in Tamale.", "The work is described as planned, not completed.", "A route identifier and dated progress evidence are still needed."], "unknowns": ["Which electoral area and road segment are covered?", "When will the work start?", "Where will residents verify completion?"], "perspectives": [{"label": "Market access", "body": "Vendors and customers need a passable route and advance notice of disruption."}, {"label": "Health access", "body": "People travelling to nearby services need a safe alternative path."}], "voice": "Listen to the Tamale works summary and ask where the road segment and dates will be published.", "text": "Ask a short question about the route, start date, and completion evidence.", "issue_status": "Needs update", "priority": "Public works"},
            {"id": "clinic-supply", "title": "Health facility stock reporting update", "category": "Safety, reporting & protection", "document_type": "health-service report", "issuer": "Northern Regional Health Directorate scenario", "summary": "This illustrative health-service report follows a stock review at a facility serving Tamale without claiming that a delivery occurred.", "plain_language": "The scenario keeps the facility and commodity details open until an official health report identifies them.", "excerpt": "The health directorate will review facility stock information and publish the next status through its reporting channel.", "facts": ["The scenario concerns health-facility stock reporting in the Northern Region.", "It does not claim that supplies were delivered.", "The facility, commodity, quantity, and reporting period remain open."], "unknowns": ["Which facility and commodities are covered?", "What quantity was received or issued?", "When will the next health report be published?"], "perspectives": [{"label": "Patient access", "body": "People need reliable information before travelling to a facility."}, {"label": "Health workers", "body": "Facilities need a consistent way to report shortages and replenishment."}], "voice": "Hear the health-service summary and ask which facility and commodities are covered.", "text": "Receive the facility status question through a short text exchange.", "issue_status": "Needs update", "priority": "Health access"},
            {"id": "school-supply", "title": "Tamale school supply reporting update", "category": "Access to education", "document_type": "school-service report", "issuer": "Ghana Education Service — Tamale scenario", "summary": "This illustrative report follows textbook and supply reporting at a school serving Tamale without claiming that a delivery occurred.", "plain_language": "The scenario keeps the school and material details open until an official education report identifies them.", "excerpt": "The education service will review school-level supply reports and publish the next status through its reporting channel.", "facts": ["The scenario concerns school-supply reporting in Tamale.", "It does not claim that materials were delivered.", "The school, materials, and quantity remain open."], "unknowns": ["Which school and materials are covered?", "What quantity was received or is still needed?", "When will the next report be published?"], "perspectives": [{"label": "Family access", "body": "Parents need reliable information before the school term begins."}, {"label": "Teaching staff", "body": "Schools need a consistent way to report shortages and restocking."}], "voice": "Hear the school-supply summary and ask which school and materials are covered.", "text": "Receive the school status question through a short text exchange.", "issue_status": "Needs update", "priority": "Education access"},
            {"id": "power-outage", "title": "Tamale power supply update", "category": "Public service update", "document_type": "public information update", "issuer": "Electricity Company of Ghana — Tamale scenario", "summary": "This illustrative update explains the status questions residents may ask about power supply serving Tamale and nearby communities.", "plain_language": "The scenario describes a public power update, but it does not establish a restoration schedule or affected area.", "excerpt": "Residents may request a dated update on the power interruption, the affected communities, and the next public information point.", "facts": ["The scenario concerns power-service information for Tamale.", "A service update is different from a confirmed restoration schedule.", "The responsible office and next dated update need to be identified."], "unknowns": ["Which communities are affected?", "What is the expected restoration time?", "When will the next official update be published?"], "perspectives": [{"label": "Household access", "body": "Residents need clear information about restoration timing."}, {"label": "Community planning", "body": "Local leaders need a dated update they can repeat accurately."}], "voice": "Hear the Tamale power-service summary, then record a question about the next dated update.", "text": "Receive a compact power-service update with the evidence status and open question.", "issue_status": "Open question", "priority": "Power supply"},
        ],
        "representatives": [
            {"id": "ward-council", "display_name": "Electoral area office", "office": "Electoral area assembly office", "role": "Assembly member office", "level": "Electoral area", "coverage": "Selected electoral area", "commitments": 5, "verified": 2, "response_rate": 40, "focus": "Local services and community questions", "questions_received": 17, "updates_issued": 5, "public_meetings": 3, "community_pulse": 64, "bio": "Illustrative electoral-area office for the Tamale pilot."},
            {"id": "district-council", "display_name": "Assembly public information office", "office": "Municipal / Metropolitan Assembly information office", "role": "Assembly office", "level": "Municipal / Metropolitan Assembly", "coverage": "Selected assembly area", "commitments": 8, "verified": 3, "response_rate": 38, "focus": "Public works and local services", "questions_received": 29, "updates_issued": 8, "public_meetings": 4, "community_pulse": 59, "bio": "Illustrative assembly-level office for the Tamale pilot."},
            {"id": "prefecture", "display_name": "Northern Regional Coordinating Council", "office": "Northern Regional Coordinating Council information office", "role": "Regional coordinating office", "level": "Regional Coordinating Council", "coverage": "Northern Region", "commitments": 7, "verified": 3, "response_rate": 43, "focus": "Regional coordination and public information", "questions_received": 24, "updates_issued": 6, "public_meetings": 3, "community_pulse": 53, "bio": "Illustrative regional coordinating office for the Tamale pilot."},
            {"id": "governor", "display_name": "Tamale North constituency office", "office": "Parliament constituency information office", "role": "Constituency office", "level": "Parliament constituency", "coverage": "Tamale North constituency", "commitments": 6, "verified": 2, "response_rate": 33, "focus": "Constituency questions and right of reply", "questions_received": 22, "updates_issued": 5, "public_meetings": 3, "community_pulse": 49, "bio": "Illustrative constituency-level office for the Tamale pilot."},
        ],
    }),
    "Nigeria": make_country_context("Nigeria", {
        "region": "Lagos State", "locality": "Lagos",
        "hierarchy": ["All levels", "Ward", "Local Government Area", "State", "Federal constituency"],
        "languages": ["English", "Yorùbá", "Igbo", "Hausa"],
        "records": [
            {"id": "water-access", "title": "Lagos water-service update", "category": "Public service update", "document_type": "service update", "issuer": "Lagos water-service information desk scenario", "summary": "This illustrative update describes how residents could follow water-service information in Lagos without claiming a live utility schedule.", "plain_language": "The scenario says residents should look for a service update, but it does not establish the affected area, timing, or restoration status.", "excerpt": "The service information desk will publish the affected Lagos service areas and the next water update when confirmed.", "facts": ["The scenario concerns water-service information in Lagos.", "No live interruption or restoration is being reported.", "The affected area and next update need confirmation."], "unknowns": ["Which Lagos local government area is affected?", "What are the service and restoration times?", "Where will the official utility notice appear?"], "perspectives": [{"label": "Household access", "body": "Residents need a clear service window and a reliable place to check updates."}, {"label": "Small businesses", "body": "Businesses need advance notice when water access may affect operations."}], "voice": "Hear the Lagos water-service summary, then ask which local government area and dates are covered.", "text": "Receive the service status and the next evidence question in a compact message.", "issue_status": "Open question", "priority": "Water access"},
            {"id": "market-road", "title": "Lagos market access-road rehabilitation update", "category": "Transparency & accountability", "document_type": "roadworks update", "issuer": "Lagos State public works information desk scenario", "summary": "This illustrative update follows a proposed rehabilitation of a market access road in Lagos.", "plain_language": "Rehabilitation is proposed, but the scenario does not establish the route, contractor, dates, traffic plan, or completion evidence.", "excerpt": "The public works information desk will publish the road section, works dates, and temporary access arrangements when confirmed.", "facts": ["The scenario concerns a Lagos market access road.", "The work is proposed, not reported as complete.", "A route identifier and dated progress update are still needed."], "unknowns": ["Which local government area and road section are covered?", "When will works begin?", "Where can residents verify progress?"], "perspectives": [{"label": "Market access", "body": "Traders and customers need a safe route throughout the works."}, {"label": "Traffic and safety", "body": "Temporary diversions should be published before construction begins."}], "voice": "Listen to the Lagos roadworks summary and ask where the route and dates will be confirmed.", "text": "Ask a short question about the road section, dates, and diversion plan.", "issue_status": "Needs update", "priority": "Roads"},
            {"id": "clinic-supply", "title": "Primary health-centre stock reporting update", "category": "Safety, reporting & protection", "document_type": "health-service report", "issuer": "Lagos State primary-health-care information desk scenario", "summary": "This illustrative report follows stock information at a primary health centre in Lagos without claiming a verified delivery.", "plain_language": "The scenario is about reporting stock status; the facility, commodity, quantity, and delivery status remain open.", "excerpt": "The health information desk will review primary health-centre stock reports and publish the next facility-level status.", "facts": ["The scenario concerns primary health-care stock reporting in Lagos.", "It does not claim that a delivery occurred.", "The facility and commodity details still need an official report."], "unknowns": ["Which facility and commodities are covered?", "What quantity is available or required?", "When will the next facility-level report be published?"], "perspectives": [{"label": "Patient access", "body": "People need accurate information before making a trip to a health centre."}, {"label": "Facility reporting", "body": "Health workers need a clear path to report shortages and replenishment."}], "voice": "Hear the health-service summary and ask which Lagos facility and supplies are covered.", "text": "Receive the facility status question through a short text exchange.", "issue_status": "Needs update", "priority": "Health access"},
            {"id": "school-supply", "title": "Lagos primary school supply update", "category": "Access to education", "document_type": "school-service update", "issuer": "Lagos State education information desk scenario", "summary": "This illustrative update follows a textbook and supply check at a Lagos primary school without claiming that a delivery occurred.", "plain_language": "The scenario is about checking supply status; the school, materials, and quantities remain open until an official report confirms them.", "excerpt": "The education information desk will review textbook and supply availability at a selected primary school and publish the next update when confirmed.", "facts": ["The scenario concerns a Lagos primary school.", "It is a supply-check scenario, not proof of a delivery.", "The school and materials remain unnamed in this fixture."], "unknowns": ["Which local government area and school are covered?", "What quantity was received or is still needed?", "Where will the official update be published?"], "perspectives": [{"label": "Family access", "body": "Parents need to know before the term starts whether textbooks will be available."}, {"label": "Teaching staff", "body": "Teachers need a clear channel to report shortages as they happen."}], "voice": "Hear the Lagos school-supply summary and ask which school and materials are covered.", "text": "Receive the school status question through a short text exchange.", "issue_status": "Needs update", "priority": "Education access"},
            {"id": "power-outage", "title": "Lagos power-service update", "category": "Public service update", "document_type": "service update", "issuer": "Ikeja Electric — Lagos scenario", "summary": "This illustrative update describes how residents could follow power-service information in Lagos without claiming a live utility schedule.", "plain_language": "The scenario says residents should look for a service update, but it does not establish the affected area, timing, or restoration status.", "excerpt": "The service information desk will publish the affected Lagos service areas and the next power update when confirmed.", "facts": ["The scenario concerns power-service information in Lagos.", "No live interruption or restoration is being reported.", "The affected area and next update need confirmation."], "unknowns": ["Which Lagos local government area is affected?", "What are the outage and restoration times?", "Where will the official utility notice appear?"], "perspectives": [{"label": "Household access", "body": "Residents need a clear restoration window and a reliable place to check updates."}, {"label": "Small businesses", "body": "Businesses need advance notice when power access may affect operations."}], "voice": "Hear the Lagos power-service summary, then ask which local government area and dates are covered.", "text": "Receive the service status and the next evidence question in a compact message.", "issue_status": "Open question", "priority": "Power supply"},
        ],
        "representatives": [
            {"id": "ward-council", "display_name": "Lagos ward office", "office": "Ward development office", "role": "Ward office", "level": "Ward", "coverage": "Selected ward", "commitments": 6, "verified": 2, "response_rate": 33, "focus": "Local service questions", "questions_received": 20, "updates_issued": 5, "public_meetings": 3, "community_pulse": 61, "bio": "Illustrative ward-level office for the Lagos pilot."},
            {"id": "district-council", "display_name": "Local Government Area office", "office": "Local Government Area information office", "role": "LGA office", "level": "Local Government Area", "coverage": "Selected LGA", "commitments": 9, "verified": 3, "response_rate": 38, "focus": "Local infrastructure and services", "questions_received": 32, "updates_issued": 9, "public_meetings": 4, "community_pulse": 57, "bio": "Illustrative LGA-level office for the Lagos pilot."},
            {"id": "prefecture", "display_name": "Lagos State office", "office": "Lagos State public information office", "role": "State office", "level": "State", "coverage": "Lagos State", "commitments": 12, "verified": 5, "response_rate": 42, "focus": "State services and public works", "questions_received": 46, "updates_issued": 13, "public_meetings": 6, "community_pulse": 52, "bio": "Illustrative state-level office for the Lagos pilot."},
            {"id": "governor", "display_name": "Federal constituency office", "office": "Federal constituency information office", "role": "Constituency office", "level": "Federal constituency", "coverage": "Selected constituency", "commitments": 8, "verified": 3, "response_rate": 38, "focus": "Federal questions and right of reply", "questions_received": 27, "updates_issued": 7, "public_meetings": 4, "community_pulse": 48, "bio": "Illustrative federal-constituency office for the Lagos pilot."},
        ],
    }),
}

# Keep the legacy single-context API endpoints aligned with the default
# Ghana pilot instead of exposing a second, unrelated set of seeded records.
RECORDS = {record["id"]: record for record in COUNTRY_CONTEXTS["Ghana"]["records"]}


def resolve_record(record_id: str, country: str = "") -> dict[str, Any] | None:
    """Every country reuses the same record ids, so look in the selected
    country's context first; published notices and explained sources only
    live in RECORDS."""
    for record in COUNTRY_CONTEXTS.get(country, {}).get("records", []):
        if record["id"] == record_id:
            return record
    return RECORDS.get(record_id)
ISSUES = list(COUNTRY_CONTEXTS["Ghana"]["issues"])
REPRESENTATIVES = list(COUNTRY_CONTEXTS["Ghana"]["representatives"])
NEWS = list(COUNTRY_CONTEXTS["Ghana"]["news"])

DASHBOARD: dict[str, Any] = {
    "area": "",
    "region": "",
    "country": "",
    "last_sync": "12 Sep 2026 · 08:40",
    "metrics": [
        {"label": "Open issues", "value": "3", "detail": "2 need a dated update", "tone": "ochre"},
        {"label": "Representatives", "value": "4", "detail": "Across ward to region", "tone": "blue"},
        {"label": "Sources checked", "value": "12", "detail": "Current workspace", "tone": "green"},
        {"label": "Languages", "value": "4", "detail": "English, French, Swahili, Lingala", "tone": "violet"},
    ],
    "languages": ["English", "Français", "Swahili", "Lingala"],
}


FEEDBACK: list[dict[str, Any]] = []
FEEDBACK_LOCK = threading.Lock()
REP_RESPONSES: dict[str, list[dict[str, Any]]] = {}
REP_RESPONSES_LOCK = threading.Lock()
USERS: dict[str, dict[str, Any]] = {}
USERS_LOCK = threading.Lock()
SESSIONS: dict[str, str] = {}
ROLE_LABELS = {
    "resident": {"en": "Resident", "fr": "Résident(e)"},
    "organizer": {"en": "Community organizer", "fr": "Organisateur communautaire"},
    "office": {"en": "Representative office", "fr": "Bureau représentatif"},
}
COMMENTS: dict[str, list[dict[str, Any]]] = {}
COMMENTS_LOCK = threading.Lock()
VOTES: dict[str, dict[str, list[str]]] = {}
VOTES_LOCK = threading.Lock()
SHARES: list[dict[str, Any]] = []
SHARES_LOCK = threading.Lock()
PERSPECTIVES: dict[str, list[dict[str, Any]]] = {}
PERSPECTIVES_LOCK = threading.Lock()
PUBLISHED_NOTICES: list[dict[str, Any]] = []
PUBLISHED_NOTICES_LOCK = threading.Lock()
# Groups are not stored: a group *is* "everyone in this country whose profile
# lists this topic". Only its posts are stored, keyed by country|topic.
GROUP_POSTS: dict[str, list[dict[str, Any]]] = {}
GROUP_POSTS_LOCK = threading.Lock()


# --- Representative activity statistics -----------------------------------
# Every number shown on a representative profile is computed from activity
# recorded on this server (published notices, office replies, comments,
# feedback drafts, perspectives, votes) — nothing is hard-coded per office.
# Fixture records are attributed to an office level by topic; published
# notices carry the office the publisher selected; office replies are keyed
# by country + office so the same level id in two countries never mixes.
FIXTURE_RECORD_OFFICE = {
    "market-road": "ward-council",
    "clinic-supply": "district-council",
    "water-access": "prefecture",
    "school-supply": "governor",
    "power-outage": "governor",
}


def response_key(country: str, representative_id: str) -> str:
    return f"{country}|{representative_id}" if country else representative_id


def office_records(country: str, representative: dict[str, Any]) -> list[dict[str, Any]]:
    """Records attributable to one office: topic-mapped fixtures for the
    country plus published notices whose responsible office is this one."""
    records = [
        record for record in COUNTRY_CONTEXTS.get(country, {}).get("records", [])
        if FIXTURE_RECORD_OFFICE.get(record["id"]) == representative["id"]
    ]
    office_names = {representative["name"], representative.get("display_name", "")}
    with PUBLISHED_NOTICES_LOCK:
        notices = [n for n in PUBLISHED_NOTICES if n.get("country") == country and (n.get("responsible_office") in office_names or n.get("office") in office_names)]
    records.extend(RECORDS[n["id"]] for n in notices if n["id"] in RECORDS)
    return records


def representative_stats(country: str, representative: dict[str, Any]) -> dict[str, Any]:
    records = office_records(country, representative)
    record_ids = [record["id"] for record in records]
    keys = [community_key(country, rid) for rid in record_ids]
    sourced = sum(record.get("provenance_status") != "illustrative" for record in records)
    with COMMENTS_LOCK:
        comments = sum(len(COMMENTS.get(k, [])) for k in keys)
    with PERSPECTIVES_LOCK:
        perspectives = sum(len(PERSPECTIVES.get(k, [])) for k in keys)
    with FEEDBACK_LOCK:
        drafts = sum(item.get("record_id") in record_ids and item.get("country", country) == country for item in FEEDBACK)
    with VOTES_LOCK:
        choices = [c for k in keys for c in VOTES.get(k, {}).values()]
    helpful = sum("helpful" in c for c in choices)
    unclear = sum("needs-clarity" in c for c in choices)
    with REP_RESPONSES_LOCK:
        responses = list(REP_RESPONSES.get(response_key(country, representative["id"]), []))
    with PUBLISHED_NOTICES_LOCK:
        notices = [n for n in PUBLISHED_NOTICES if n["id"] in record_ids]
    questions = comments + perspectives + drafts
    stamps = [n.get("published_at", "") for n in notices] + [r.get("created_at", "") for r in responses]
    last_update = max(stamps) if stamps else None
    with FEEDBACK_LOCK:
        received = [public_post(item) for item in FEEDBACK if item.get("record_id") in record_ids and item.get("country", country) == country][:12]
    return {
        "questions": received,
        "commitments": len(records),
        "verified": sourced,
        "questions_received": questions,
        "updates_issued": len(notices),
        "responses_on_file": len(responses),
        "response_rate": min(100, round(100 * len(responses) / questions)) if questions else None,
        "community_pulse": round(100 * helpful / (helpful + unclear)) if helpful + unclear else None,
        "votes": {"helpful": helpful, "needs-clarity": unclear},
        "last_update": last_update,
        "responses": responses,
    }


def country_representative_stats(country: str) -> dict[str, Any]:
    representatives = COUNTRY_CONTEXTS.get(country, {}).get("representatives", [])
    return {
        "country": country,
        "computed_at": now_iso(),
        "representatives": {rep["id"]: representative_stats(country, rep) for rep in representatives},
    }


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


FRENCH_COUNTRIES = {"Togo", "Côte d’Ivoire"}


# Phrases that mark a sentence as an open point rather than a fact. Used
# when no model is connected (and for seeding), so "what the notice does not
# say" is read from the notice itself instead of being boilerplate.
UNCERTAINTY_MARKERS = {
    "fr": ["pas encore", "n’est pas", "n'est pas", "ne sont pas", "à confirmer", "sera précisé", "sera communiqué", "seront communiqué", "reste à", "peut changer", "non précisé", "en attente", "ultérieurement", "dès confirmation", "sous réserve", "ne précise pas", "ne dit pas"],
    "en": ["not yet", "to be confirmed", "will be announced", "will be published", "will be confirmed", "may change", "remains", "not established", "pending", "once confirmed", "subject to", "does not say", "is not stated", "unclear", "later date"],
}
GENERIC_UNKNOWNS = {
    "fr": ["Quand la prochaine mise à jour publique sera-t-elle publiée ?", "Où les résidents peuvent-ils poser une question de suivi ?"],
    "en": ["When will the next public update be published?", "Where can residents ask a follow-up question?"],
}


def derive_notice_content(notice: dict[str, Any], use_model: bool = True) -> dict[str, Any]:
    """facts / unknowns / plain_language for a published notice, read from its
    own text. Model first when allowed and connected; otherwise sentence
    heuristics in the notice's language. Never invents dates or amounts."""
    is_french = notice.get("country") in FRENCH_COUNTRIES
    lang = "fr" if is_french else "en"
    text = " ".join(f"{notice.get('summary', '')} {notice.get('body', '')}".split())
    if use_model and OLLAMA_MODEL and len(text) > 40:
        generated = ollama_explain(text, notice.get("title", ""), "Français" if is_french else "English")
        if generated:
            norm = lambda value: re.sub(r"[^a-z0-9àâçéèêëîïôûùüÿœ]+", "", str(value).lower())
            open_points = {norm(item) for item in generated["unknowns"]}
            facts = [item for item in generated["facts"] if norm(item) not in open_points and not any(marker in item.lower() for marker in UNCERTAINTY_MARKERS[lang])]
            return {"facts": facts or generated["facts"][:2], "unknowns": generated["unknowns"], "plain_language": generated["plain_language"], "derived_by": "ollama"}
    sentences = [part.strip().rstrip(";:,").strip() for part in re.split(r"(?<=[.!?;])\s+", text) if len(part.strip()) > 12]
    unknowns = [sent for sent in sentences if any(marker in sent.lower() for marker in UNCERTAINTY_MARKERS[lang])]
    facts = [sent for sent in sentences if sent not in unknowns][:4] or [notice.get("summary", "")]
    for generic in GENERIC_UNKNOWNS[lang]:
        if len(unknowns) >= 3:
            break
        unknowns.append(generic)
    return {"facts": facts, "unknowns": unknowns[:4], "plain_language": notice.get("summary", ""), "derived_by": "heuristics"}


def published_notice_record(notice: dict[str, Any]) -> dict[str, Any]:
    """Normalize a publisher notice into the same reviewable record shape."""
    title = notice["title"]
    summary = notice["summary"]
    source = notice.get("source_url") or "/publisher"
    is_french = notice.get("country") in FRENCH_COUNTRIES
    date = notice.get("date", "À l’instant" if is_french else "Just published")
    responsible = notice.get("responsible_office") or notice.get("office") or ("Guichet d’information publique" if is_french else "Public Information Desk")
    derived = {"facts": notice.get("facts"), "unknowns": notice.get("unknowns"), "plain_language": notice.get("plain_language")}
    if not derived["facts"] or not derived["unknowns"]:
        derived = derive_notice_content(notice, use_model=False)
    if is_french:
        return {
            "id": notice["id"], "title": title, "category": notice.get("category", "Avis public"),
            "location": f"{notice.get('locality', 'Localité sélectionnée')}{' · ' + notice['region'] if notice.get('region') else ''}",
            "source_date": date, "source_label": f"{responsible} · publication locale",
            "source_title": "Avis du guichet local — non vérifié de manière indépendante",
            "source_url": source,
            "provenance_status": "published",
            "provenance_note": "Avis publié par " + (notice.get("office") or responsible) + " via le portail d’information publique ; il n’a pas été vérifié de manière indépendante.",
            "status": "Avis publié par le bureau", "status_detail": "Non vérifié de manière indépendante", "summary": summary,
            "plain_language": derived["plain_language"] or summary,
            "facts": derived["facts"],
            "unknowns": derived["unknowns"],
            "perspectives": [{"label": "Question communautaire", "body": "Les résidents peuvent consulter la source et demander une prochaine étape datée."}],
            "evidence": [{"label": "Avis publié", "quote": notice.get("body") or summary, "page": "Portail d’information publique", "kind": "published"}],
            "timeline": [{"date": date, "label": "Avis publié", "detail": "Le guichet d’information publique a ajouté cette mise à jour au fil des sources.", "state": "done"}, {"date": "—", "label": "Prochaine mise à jour publique", "detail": "La source ne mentionne pas de date de suivi confirmée.", "state": "pending"}],
            "channels": {"web": f"Ouvrez la source publiée sur {source}.", "voice": "Écoutez le résumé en langage simple sur une radio partagée ou un téléphone à touches.", "text": "Recevez la même mise à jour source par un échange léger WhatsApp ou SMS."},
        }
    return {
        "id": notice["id"], "title": title, "category": notice.get("category", "Public notice"),
        "location": f"{notice.get('locality', 'Selected locality')}{' · ' + notice['region'] if notice.get('region') else ''}",
        "source_date": date, "source_label": f"{responsible} · local publication",
        "source_title": "Local publisher notice — not independently verified",
        "source_url": source,
        "provenance_status": "published",
        "provenance_note": "Notice published by " + (notice.get("office") or responsible) + " through the public information portal; it has not been independently verified.",
        "status": "Notice published by the office", "status_detail": "Not independently verified", "summary": summary,
        "plain_language": derived["plain_language"] or summary,
        "facts": derived["facts"],
        "unknowns": derived["unknowns"],
        "perspectives": [{"label": "Community question", "body": "Residents can review the source and ask for a dated next step."}],
        "evidence": [{"label": "Published notice", "quote": notice.get("body") or summary, "page": "Public information portal", "kind": "published"}],
        "timeline": [{"date": date, "label": "Notice published", "detail": "The public information desk added this update to the source feed.", "state": "done"}, {"date": "—", "label": "Next public update", "detail": "The source does not state a confirmed follow-up date.", "state": "pending"}],
        "channels": {"web": f"Open the published source at {source}.", "voice": "Listen to the plain-language summary on a shared radio or basic keypad phone.", "text": "Receive the same source-backed update through a lightweight WhatsApp or SMS-style exchange."},
    }


# --- Accounts ---------------------------------------------------------------
# Real accounts: username + password (PBKDF2-SHA256, standard library only),
# server-side session tokens. No e-mail, no external identity provider.
def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 60_000, dklen=32)
    return f"{salt}${digest.hex()}"


def check_password(password: str, stored: str) -> bool:
    salt, _, digest = stored.partition("$")
    try:
        return secrets.compare_digest(hash_password(password, salt).split("$")[1], digest)
    except (ValueError, TypeError):
        return False


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {"id": user["id"], "username": user["username"], "label": user["display_name"], "role_key": user["role_key"], "role": user["role_key"], "initial": user["display_name"][:1].upper(), "country": user.get("country", ""), "locality": user.get("locality", ""), "office_id": user.get("office_id", "")}


def create_user(username: str, password: str, display_name: str, role_key: str, country: str = "", locality: str = "", office_id: str = "", user_id: str = "") -> dict[str, Any]:
    user = {
        "id": user_id or f"u-{uuid.uuid4().hex[:10]}",
        "username": username.lower(),
        "password": hash_password(password),
        "display_name": display_name,
        "role_key": role_key if role_key in ROLE_LABELS else "resident",
        "country": country,
        "locality": locality,
        "office_id": office_id,
        "created_at": now_iso(),
    }
    with USERS_LOCK:
        USERS[user["id"]] = user
    return user


def find_user_by_username(username: str) -> dict[str, Any] | None:
    username = username.lower().strip()
    with USERS_LOCK:
        return next((u for u in USERS.values() if u["username"] == username), None)


def open_session(user: dict[str, Any]) -> str:
    token = secrets.token_urlsafe(32)
    with USERS_LOCK:
        SESSIONS[token] = user["id"]
    return token


def session_user(token: str) -> dict[str, Any] | None:
    with USERS_LOCK:
        user_id = SESSIONS.get(str(token or ""))
        return USERS.get(user_id) if user_id else None


def register_notice(notice: dict[str, Any], use_model: bool = True) -> None:
    """Add a published notice to the record store, the news feed, the issue
    tracker and the publisher list (newest first). Facts and unknowns are
    read from the notice text first, so the app never shows boilerplate."""
    if not notice.get("facts") or not notice.get("unknowns"):
        notice.update(derive_notice_content(notice, use_model=use_model))
    RECORDS[notice["id"]] = published_notice_record(notice)
    is_french = notice.get("country") in FRENCH_COUNTRIES
    NEWS.insert(0, {"id": notice["id"], "headline": notice["title"], "type": notice["category"], "date": notice["date"], "status": "Published locally", "locality": notice["locality"], "source": f"{notice['office']} · local publication", "summary": notice["summary"], "languages": ["Français" if is_french else "English"]})
    ISSUES.insert(0, {"id": notice["id"], "title": notice["title"], "type": notice["category"], "locality": notice["locality"], "status": "New public update", "priority": "Community follow-up", "last_update": notice["date"], "source": f"{notice['office']} · live source", "summary": notice["summary"]})
    with PUBLISHED_NOTICES_LOCK:
        PUBLISHED_NOTICES.insert(0, notice)


def demo_user(token: str) -> dict[str, str] | None:
    """Resolve a session token to the public shape the handlers expect
    (`id`, `label`, `role`)."""
    user = session_user(token)
    return public_user(user) if user else None


def group_summary(country: str, topic: str) -> dict[str, Any]:
    """Member count (accounts in the country whose interests include the
    topic — never the members themselves), and the group's posts."""
    with USERS_LOCK:
        members = [u for u in USERS.values() if u.get("country") == country and topic in (u.get("interests") or [])]
    key = f"{country}|{topic}"
    with GROUP_POSTS_LOCK:
        posts = [public_post(item) for item in GROUP_POSTS.get(key, [])]
    localities = sorted({u.get("locality", "") for u in members if u.get("locality")})
    return {"topic": topic, "country": country, "members": len(members), "localities": localities[:8], "posts": posts, "name": {"en": CIVIC_TOPICS[topic]["en"], "fr": CIVIC_TOPICS[topic]["fr"]}}


def public_post(item: dict[str, Any]) -> dict[str, Any]:
    """What other people see of a comment or perspective. Anonymous posts
    carry only their persona label — the account id stays server-side."""
    if item.get("anonymous"):
        return {k: v for k, v in item.items() if k != "user_id"}
    return item


def community_key(country: str, record_id: str) -> str:
    """Fixture records reuse the same ids in every country, so comments,
    votes and perspectives on them are scoped by country. Published notices
    and explained sources already have globally unique ids."""
    return f"{country}|{record_id}" if country and record_id in FIXTURE_RECORD_OFFICE else record_id


# --- Persistence ------------------------------------------------------------
# The whole working set is small (thousands of rows), so it is kept in memory
# and snapshotted to one JSON file after every write. Point
# CIVIC_BRIDGE_DATA_DIR at a persistent disk to keep accounts and activity
# across restarts.
STATE_LOCK = threading.Lock()


def save_state() -> None:
    snapshot = {
        "users": USERS, "sessions": SESSIONS, "feedback": FEEDBACK, "rep_responses": REP_RESPONSES,
        "comments": COMMENTS, "votes": VOTES, "shares": SHARES, "perspectives": PERSPECTIVES,
        "published_notices": PUBLISHED_NOTICES,
        "group_posts": GROUP_POSTS,
        "extra_records": {rid: rec for rid, rec in RECORDS.items() if rid.startswith(("notice-", "explained-", "source-"))},
        "news": [n for n in NEWS if str(n.get("id", "")).startswith("notice-")],
        "issues": [i for i in ISSUES if str(i.get("id", "")).startswith("notice-")],
        "saved_at": now_iso(),
    }
    with STATE_LOCK:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        tmp = STATE_FILE.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(snapshot, ensure_ascii=False), encoding="utf-8")
        tmp.replace(STATE_FILE)


def load_state() -> bool:
    if not STATE_FILE.exists():
        return False
    data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    USERS.update(data.get("users", {}))
    SESSIONS.update(data.get("sessions", {}))
    FEEDBACK[:] = data.get("feedback", [])
    REP_RESPONSES.update(data.get("rep_responses", {}))
    COMMENTS.update(data.get("comments", {}))
    VOTES.clear(); VOTES.update(data.get("votes", {}))
    SHARES[:] = data.get("shares", [])
    PERSPECTIVES.update(data.get("perspectives", {}))
    PUBLISHED_NOTICES[:] = data.get("published_notices", [])
    GROUP_POSTS.update(data.get("group_posts", {}))
    RECORDS.update(data.get("extra_records", {}))
    NEWS[:0] = data.get("news", [])
    ISSUES[:0] = data.get("issues", [])
    return True


def default_community_comments(record: dict[str, Any]) -> list[dict[str, Any]]:
    """A couple of clearly-labelled illustrative comments shown only until a
    real one exists, so a freshly started server doesn't read as empty. Never
    persisted — the moment someone posts a real comment, these disappear.
    """
    is_french = record.get("country") in FRENCH_COUNTRIES
    label = "Exemple illustratif" if is_french else "Illustrative example"
    pairs = [
        ("Compte résident", "J'espère que le calendrier sera confirmé avant tout changement sur le terrain."),
        ("Compte organisateur communautaire", "Pouvons-nous obtenir une date précise de la part du bureau responsable ?"),
    ] if is_french else [
        ("Resident account", "I hope the schedule gets confirmed before anything changes on the ground."),
        ("Community organizer account", "Can we get a specific date from the responsible office?"),
    ]
    return [
        {"id": f"seed-comment-{index}", "user_id": "", "user_label": account_label, "type": label, "message": message, "status": label, "created_at": "Récent" if is_french else "Recent"}
        for index, (account_label, message) in enumerate(pairs, start=1)
    ]


def _pdf_unescape(raw: str) -> str:
    return re.sub(r"\\([()\\])", r"\1", raw)


def extract_pdf_text(data: bytes) -> str:
    """Best-effort, dependency-free extraction of readable text from a PDF.

    Handles the common case of FlateDecode-compressed content streams with
    Tj/TJ text-showing operators, which covers most PDFs produced by word
    processors and report generators. This is not a full PDF parser: pages
    built from scans or unusual embedded font encodings can yield little or
    no text, so callers must treat a short result as extraction failure
    rather than claim the document was understood.
    """
    parts: list[str] = []
    for match in re.finditer(rb"stream\r?\n(.*?)endstream", data, re.DOTALL):
        raw = match.group(1)
        try:
            content = zlib.decompress(raw)
        except zlib.error:
            content = raw
        decoded = content.decode("latin-1", errors="ignore")
        for str_match in re.finditer(r"\(((?:[^()\\]|\\.)*)\)\s*Tj", decoded):
            parts.append(_pdf_unescape(str_match.group(1)))
        for array_match in re.finditer(r"\[((?:[^\[\]]|\\.)*)\]\s*TJ", decoded):
            for str_match in re.finditer(r"\(((?:[^()\\]|\\.)*)\)", array_match.group(1)):
                parts.append(_pdf_unescape(str_match.group(1)))
    joined = " ".join(part.strip() for part in parts if part.strip())
    return re.sub(r"\s+", " ", joined).strip()


def extract_url_text(url: str) -> tuple[str, str]:
    """Fetch a URL and return (title, plain_text) using a crude HTML strip."""
    request = urllib.request.Request(url, headers={"User-Agent": "CivicBridgeDemo/0.1"})
    with urllib.request.urlopen(request, timeout=6) as response:
        raw = response.read(2_000_000)
        charset = response.headers.get_content_charset() or "utf-8"
    body = raw.decode(charset, errors="ignore")
    title_match = re.search(r"<title[^>]*>(.*?)</title>", body, re.IGNORECASE | re.DOTALL)
    title = re.sub(r"\s+", " ", title_match.group(1)).strip() if title_match else url
    body = re.sub(r"(?is)<(script|style|nav|header|footer)[^>]*>.*?</\1>", " ", body)
    text = re.sub(r"(?s)<[^>]+>", " ", body)
    text = html.unescape(text)
    return title, re.sub(r"\s+", " ", text).strip()


def naive_sentences(text: str, limit: int) -> list[str]:
    pieces = re.split(r"(?<=[.!?])\s+", text.strip())
    sentences = [piece.strip() for piece in pieces if len(piece.strip()) > 8]
    if sentences:
        return sentences[:limit]
    return [text[:220].strip()] if text.strip() else []


def ollama_explain(source_text: str, title: str, language: str) -> dict[str, Any] | None:
    if not OLLAMA_MODEL:
        return None
    schema = {
        "type": "object",
        "properties": {
            "plain_language": {"type": "string"},
            "facts": {"type": "array", "items": {"type": "string"}},
            "unknowns": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["plain_language", "facts", "unknowns"],
    }
    prompt = (
        "You are helping a resident understand a public document. Use only the text below. "
        "Never invent a date, office, quote, completion state, or statistic; keep uncertainty visible. "
        f"Respond in {language}. Return the requested JSON fields.\n\n"
        f"TITLE: {title}\nSOURCE TEXT (may be truncated):\n{source_text[:6000]}"
    )
    body = json.dumps({"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "format": schema}).encode("utf-8")
    request = urllib.request.Request(OLLAMA_URL, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=OLLAMA_TIMEOUT or 30) as response:
            payload = json.loads(response.read().decode("utf-8"))
        result = json.loads(str(payload.get("response", "")))
        if not isinstance(result, dict) or not isinstance(result.get("plain_language"), str):
            return None
        facts = [str(item).strip() for item in result.get("facts", []) if str(item).strip()][:6]
        unknowns = [str(item).strip() for item in result.get("unknowns", []) if str(item).strip()][:6]
        if not facts or not unknowns:
            return None
        return {"plain_language": result["plain_language"].strip(), "facts": facts, "unknowns": unknowns}
    except (OSError, urllib.error.URLError, TimeoutError, json.JSONDecodeError, TypeError, ValueError):
        return None


# --- Profile interpretation -------------------------------------------------
# A person describes who they are in their own words and language ("I sell
# tomatoes at the roadside and keep three goats", "je suis enseignante à
# Abobo", "mo n ta ẹran ni ọja"). The interpreter maps that into the
# CONTROLLED vocabulary below — a list of topic ids, never free-form
# categories — plus one plain sentence that is shown back to the person to
# confirm or correct. Ranking is then done by a fixed, published weight
# table on the client; the model never orders anything directly.
#
# Data rule: nothing sensitive is extracted or echoed. Ethnicity, religion,
# politics, health, immigration status, income, exact address, gender and
# named individuals are ignored even if volunteered (prompt instruction; the
# keyword fallback can only match occupations and topics by construction).
CIVIC_TOPICS: dict[str, dict[str, str]] = {
    "water": {"en": "water access", "fr": "accès à l’eau", "hint": "water supply, boreholes, water cuts"},
    "roads": {"en": "roads", "fr": "routes", "hint": "roads, market access roads, diversions"},
    "health": {"en": "health services", "fr": "services de santé", "hint": "clinics, vaccination, health alerts, medicines"},
    "education": {"en": "schools", "fr": "écoles", "hint": "schools, enrolment, school supplies"},
    "energy": {"en": "electricity", "fr": "électricité", "hint": "electricity, load shedding, power cuts"},
    "works": {"en": "public works", "fr": "travaux publics", "hint": "public works, drains, construction sites"},
    "markets": {"en": "market trade", "fr": "commerce au marché", "hint": "market days, stall fees, market management"},
    "registry": {"en": "civil registry", "fr": "état civil", "hint": "civil registry, birth certificates"},
    "safety": {"en": "safety", "fr": "sécurité", "hint": "fire, security, emergencies"},
    "permits": {"en": "permits & licences", "fr": "permis et licences", "hint": "building permits, business licences"},
    "transport": {"en": "transport", "fr": "transport", "hint": "bus terminals, transport fares, moto-taxis"},
    "sanitation": {"en": "sanitation", "fr": "assainissement", "hint": "waste collection, toilets, hygiene"},
    "budget": {"en": "public budget", "fr": "budget public", "hint": "public budget, participatory budget, spending"},
    "flooding": {"en": "flooding", "fr": "inondations", "hint": "rains, floods, risk zones"},
    "employment": {"en": "jobs & training", "fr": "emploi et formation", "hint": "jobs, training programmes, youth schemes"},
    "land": {"en": "land", "fr": "foncier", "hint": "land titles, plots, land regularisation"},
    "exams": {"en": "exams", "fr": "examens", "hint": "national examinations, results"},
    "tax": {"en": "taxes & fees", "fr": "impôts et taxes", "hint": "taxes, levies, business fees"},
    "identity": {"en": "ID cards", "fr": "pièces d’identité", "hint": "national ID cards, enrolment"},
    "elections": {"en": "elections", "fr": "élections", "hint": "voter registration, elections"},
    "meeting": {"en": "public meetings", "fr": "réunions publiques", "hint": "public meetings, consultations"},
    "services": {"en": "municipal services", "fr": "services municipaux", "hint": "street lighting, municipal services"},
    "farming": {"en": "farming", "fr": "agriculture", "hint": "crops, seeds, fertiliser, farm inputs, harvest"},
    "livestock": {"en": "livestock & animal health", "fr": "élevage et santé animale", "hint": "livestock, goats, cattle, poultry, animal vaccination, grazing"},
}

# Deterministic fallback: occupation and topic words (EN, FR, a few local
# words) → topic ids. Used when no model is connected, so the feature never
# silently disappears.
DESCRIPTION_KEYWORDS: dict[str, list[str]] = {
    "farming": ["farm", "crop", "maize", "cassava", "yam", "rice", "cocoa", "harvest", "agricult", "cultiv", "champ", "récolte", "maïs", "manioc", "igname", "planteur", "shamba", "kulima", "oko", "àgbẹ̀"],
    "livestock": ["goat", "cattle", "cow", "sheep", "poultry", "chicken", "herd", "livestock", "breeder", "chèvre", "bœuf", "vache", "mouton", "volaille", "éleveur", "élevage", "bétail", "mifugo", "ewúré", "màlúù"],
    "markets": ["market", "sell", "vendor", "trader", "trade", "stall", "shop", "kiosk", "tomato", "fish", "butcher", "marché", "vend", "commerç", "boutique", "étal", "poisson", "boucher", "soko", "biashara", "ọjà", "onísòwò"],
    "water": ["water", "borehole", "well", "tap", "eau", "forage", "puits", "maji", "omi"],
    "roads": ["road", "driver", "taxi", "moto", "boda", "okada", "route", "chauffeur", "barabara", "ọ̀nà"],
    "transport": ["transport", "bus", "truck", "lorry", "matatu", "danfo", "gbaka", "wôrô", "transporteur", "camion"],
    "health": ["nurse", "clinic", "health", "pharma", "midwife", "doctor", "infirm", "santé", "clinique", "sage-femme", "médecin", "afya", "ìlera"],
    "education": ["teacher", "school", "pupil", "student", "enseign", "école", "élève", "étudiant", "mwalimu", "shule", "olùkọ́", "ilé ìwé"],
    "exams": ["exam", "bac", "bepc", "wassce", "kcse", "examen", "candidat"],
    "energy": ["electric", "power", "solar", "welder", "hairdress", "barber", "tailor", "électric", "courant", "soudeur", "coiff", "couturi", "stima", "iná"],
    "works": ["mason", "builder", "construction", "carpenter", "plumber", "maçon", "bâtiment", "chantier", "menuisier", "plombier", "fundi"],
    "permits": ["permit", "licence", "license", "permis", "autorisation"],
    "land": ["land", "plot", "parcel", "title", "terrain", "parcelle", "foncier", "titre", "ardhi", "ilẹ̀"],
    "tax": ["tax", "levy", "impôt", "taxe", "patente", "kodi"],
    "employment": ["job", "unemploy", "looking for work", "apprentice", "training", "emploi", "chômage", "apprenti", "formation", "kazi", "iṣẹ́"],
    "identity": ["id card", "identity", "passport", "carte d’identité", "carte d'identité", "cni", "kitambulisho"],
    "elections": ["vote", "election", "électeur", "élection", "uchaguzi", "ìdìbò"],
    "registry": ["birth", "civil registry", "naissance", "état civil", "acte"],
    "budget": ["budget", "council", "conseil", "councillor", "journalist", "journaliste", "radio"],
    "meeting": ["chief", "leader", "association", "ngo", "ong", "organiz", "organis", "imam", "pastor", "pasteur", "chef de quartier"],
    "sanitation": ["waste", "garbage", "sanitation", "toilet", "ordures", "déchets", "assainissement", "latrine", "taka"],
    "flooding": ["flood", "rain", "inondation", "pluie", "mafuriko"],
    "safety": ["security", "fire", "police", "sécurité", "incendie", "usalama"],
    "services": ["lighting", "lamp", "éclairage", "lampadaire"],
    "household": [],
}
PROFILE_CACHE: dict[str, dict[str, Any]] = {}
PROFILE_CACHE_LOCK = threading.Lock()


def topic_names(topics: list[str], lang: str) -> str:
    return " · ".join(CIVIC_TOPICS[t][lang] for t in topics if t in CIVIC_TOPICS)


def interpret_description_keywords(text: str, lang: str) -> dict[str, Any]:
    """No-model path: count keyword hits per topic, keep the best six."""
    low = text.lower()
    scored = []
    for topic, words in DESCRIPTION_KEYWORDS.items():
        # short words must match whole words ("road", not "roadside"); longer
        # ones match as prefixes so "agricult" covers agriculture/agricultrice.
        hits = sum(len(re.findall(r"(?<!\w)" + re.escape(word) + (r"s?(?!\w)" if len(word) < 6 else ""), low)) for word in words)
        if hits and topic in CIVIC_TOPICS:
            scored.append((hits, topic))
    scored.sort(key=lambda item: (-item[0], list(CIVIC_TOPICS).index(item[1])))
    interests = [topic for _, topic in scored[:6]]
    if not interests:
        understood = ("Nous n’avons pas reconnu d’activité précise ; ajoutez des centres d’intérêt ci-dessous." if lang == "fr"
                      else "We did not recognise a specific activity; add interests below.")
    else:
        understood = (f"Nous avons compris : {topic_names(interests[:3], 'fr')}." if lang == "fr" else f"We understood: {topic_names(interests[:3], 'en')}.")
    return {"interests": interests, "understood": understood, "engine": "keywords"}


def interpret_description(text: str, language: str) -> dict[str, Any]:
    lang = "fr" if str(language).lower().startswith("fr") else "en"
    key = f"{lang}|{' '.join(text.lower().split())[:300]}"
    with PROFILE_CACHE_LOCK:
        if key in PROFILE_CACHE:
            return PROFILE_CACHE[key]
    result = None
    if OLLAMA_MODEL:
        schema = {
            "type": "object",
            "properties": {
                "interests": {"type": "array", "items": {"type": "string", "enum": list(CIVIC_TOPICS)}, "maxItems": 6},
                "understood": {"type": "string"},
            },
            "required": ["interests", "understood"],
        }
        vocab = "\n".join(f"- {topic}: {meta['hint']}" for topic, meta in CIVIC_TOPICS.items())
        prompt = (
            "Someone describes, in their own words and possibly in French, English or an African language (Éwé, Yorùbá, Kiswahili, Dioula, Dagbani, Hausa, Twi ...), "
            "what they do and what they care about — for themselves or on behalf of another person. "
            "Choose, from the controlled vocabulary below and nothing else, the 2 to 6 civic topics most relevant to that situation, most important first. "
            f"Then write ONE short plain clause in {'French — never English' if lang == 'fr' else 'English — never French'}, without any prefix, that restates the occupation or situation neutrally "
            f"(for example {'« vous vendez des tomates et élevez des chèvres »' if lang == 'fr' else '“you sell tomatoes and keep goats”'}) so the person can confirm or correct it. "
            "Strict rules: ignore and never mention ethnicity, religion, political views, health conditions or illnesses, immigration status, income, exact addresses, gender or any named person, even if the description includes them — "
            "they must influence neither the topics nor the sentence. Example: “chauffeur de moto-taxi, musulman, diabétique” → interests [\"transport\", \"roads\"], sentence “Nous avons compris : vous êtes chauffeur de moto-taxi.” "
            "Do not judge, advise or moralise.\n\n"
            f"VOCABULARY:\n{vocab}\n\nDESCRIPTION: {text[:600]}"
        )
        body = json.dumps({"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "format": schema}).encode("utf-8")
        request = urllib.request.Request(OLLAMA_URL, data=body, headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=OLLAMA_TIMEOUT or 30) as response:
                payload = json.loads(response.read().decode("utf-8"))
            parsed = json.loads(str(payload.get("response", "")))
            interests = []
            for topic in parsed.get("interests", []):
                if topic in CIVIC_TOPICS and topic not in interests:
                    interests.append(topic)
            understood = re.sub(r"^(we understood|nous avons compris)\s*:?\s*", "", " ".join(str(parsed.get("understood", "")).split()), flags=re.I).strip(" .«»\"“”")[:200]
            wrong_language = (lang == "en" and re.search(r"\b(vous|nous|êtes|est|une?)\b", understood, re.I)) or (lang == "fr" and re.search(r"\b(you|the|and|are)\b", understood, re.I))
            if interests and understood and not wrong_language:
                result = {"interests": interests[:6], "understood": ("Nous avons compris : " if lang == "fr" else "We understood: ") + understood + ".", "engine": "ollama"}
            elif interests:
                # Keep the model's topics, but say them in the interface language ourselves.
                fallback = interpret_description_keywords(text, lang)
                result = {"interests": interests[:6], "understood": ("Nous avons compris : " if lang == "fr" else "We understood: ") + topic_names(interests[:3], lang) + ".", "engine": "ollama"}
        except (OSError, urllib.error.URLError, TimeoutError, json.JSONDecodeError, TypeError, ValueError, AttributeError):
            result = None
    if not result:
        result = interpret_description_keywords(text, lang)
    with PROFILE_CACHE_LOCK:
        PROFILE_CACHE[key] = result
    return result


def build_explained_record(source_text: str, title: str, origin_label: str, area: dict[str, str], is_french: bool) -> dict[str, Any]:
    """Turn arbitrary user-submitted text into a full, review-labelled record.

    Reuses the same reviewable-draft posture as the seeded fixtures: an
    optional local Ollama model produces the plain-language rewrite when
    configured, and a transparent, non-fabricating fallback is used
    otherwise (the source sentences themselves, not an invented summary).
    """
    language = "Français" if is_french else "English"
    generated = ollama_explain(source_text, title or origin_label, language)
    facts = generated["facts"] if generated else naive_sentences(source_text, 4)
    if is_french:
        plain_language = generated["plain_language"] if generated else (
            "Ceci est une source que vous avez soumise. Les phrases ci-dessous sont reprises directement du texte fourni. "
            "Connectez un modèle Ollama local pour obtenir une reformulation automatique en langage simple."
        )
        unknowns = generated["unknowns"] if generated else [
            "Quel est le bureau responsable ?",
            "Quand cette information prend-elle effet ?",
            "Où peut-on vérifier cette information ?",
        ]
        status, status_detail = "Soumis par vous", "Non vérifié de manière indépendante"
        source_label = f"Source soumise · {origin_label}"
        source_title = "Source soumise par l'utilisateur — non vérifiée de manière indépendante"
        provenance_note = "Cette fiche a été créée à partir d'un document que vous avez fourni ; elle n'est pas vérifiée de manière indépendante."
        category = "Source soumise par l'utilisateur"
        evidence_label, evidence_open_label = "Extrait fourni", "Ce que cet extrait n'établit pas"
        timeline_label, timeline_detail = "Source soumise", "Ajoutée par vous pour une explication en langage simple."
        perspective_label = "Question communautaire"
        perspective_body = "Relisez la source et posez une question précise sur ce qui reste flou."
        channel_web = "Consultez l'explication en langage simple à côté du passage original."
        channel_voice = "Écoutez un résumé sur une radio partagée ou un téléphone à touches, puis posez votre question."
        channel_text = "Recevez le même résumé source par un échange léger WhatsApp ou SMS."
    else:
        plain_language = generated["plain_language"] if generated else (
            "This is a source you submitted. The sentences below are taken directly from the text you provided. "
            "Connect a local Ollama model for an automatic plain-language rewrite."
        )
        unknowns = generated["unknowns"] if generated else [
            "Which office is responsible?",
            "When does this take effect?",
            "Where can this be verified?",
        ]
        status, status_detail = "Submitted by you", "Not independently verified"
        source_label = f"Submitted source · {origin_label}"
        source_title = "User-submitted source — not independently verified"
        provenance_note = "This record was created from a document you provided; it is not independently verified."
        category = "User-submitted source"
        evidence_label, evidence_open_label = "Provided excerpt", "What this excerpt does not establish"
        timeline_label, timeline_detail = "Source submitted", "Added by you for a plain-language explanation."
        perspective_label = "Community question"
        perspective_body = "Re-read the source and ask a specific question about what remains unclear."
        channel_web = "Review the plain-language explanation beside the original passage."
        channel_voice = "Hear a short summary on a shared radio or basic keypad phone, then ask your question."
        channel_text = "Receive the same source-backed summary through a lightweight WhatsApp or SMS-style exchange."
    record_id = f"upload-{uuid.uuid4().hex[:10]}"
    display_title = title.strip() or (facts[0][:80] if facts else origin_label)
    locality, region, country = area.get("locality", ""), area.get("region", ""), area.get("country", "")
    today = datetime.now().strftime("%Y-%m-%d")
    return {
        "id": record_id, "title": display_title, "category": category,
        "location": f"{locality} · {region}" if locality else "",
        "country": country, "region": region, "locality": locality,
        "source_date": today, "source_label": source_label, "source_title": source_title, "source_url": "",
        "provenance_status": "user-submitted", "provenance_note": provenance_note,
        "status": status, "status_detail": status_detail,
        "summary": plain_language, "plain_language": plain_language,
        "facts": facts or [source_text[:200].strip()], "unknowns": unknowns,
        "perspectives": [{"label": perspective_label, "body": perspective_body}],
        "evidence": [
            {"label": evidence_label, "quote": (source_text[:400].strip() or display_title), "page": origin_label, "kind": "illustrative"},
            {"label": evidence_open_label, "quote": unknowns[0], "page": "—", "kind": "open"},
        ],
        "timeline": [{"date": today, "label": timeline_label, "detail": timeline_detail, "state": "done"}],
        "channels": {"web": channel_web, "voice": channel_voice, "text": channel_text},
        "responsible_office": origin_label,
    }


def ollama_status() -> dict[str, Any]:
    """Report whether local AI (translation, drafts, source explanations) is
    actually usable right now, so the frontend can say so upfront instead of
    only failing at the moment someone clicks something.
    """
    if not OLLAMA_MODEL:
        return {"configured": False, "reachable": False, "model": "", "model_available": False}
    try:
        tags_url = OLLAMA_URL.split("/api/")[0] + "/api/tags"
        with urllib.request.urlopen(urllib.request.Request(tags_url), timeout=2) as response:
            payload = json.loads(response.read().decode("utf-8"))
        available = [str(item.get("name", "")) for item in payload.get("models", [])]
        model_available = OLLAMA_MODEL in available or any(name.split(":")[0] == OLLAMA_MODEL.split(":")[0] for name in available)
        return {"configured": True, "reachable": True, "model": OLLAMA_MODEL, "model_available": model_available}
    except (OSError, urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
        return {"configured": True, "reachable": False, "model": OLLAMA_MODEL, "model_available": False}


def ollama_translate(record: dict[str, Any], language: str) -> dict[str, Any] | None:
    """Small models sometimes return empty or malformed JSON within a second or
    two; one quick retry recovers almost all of those. A slow failure (e.g. a
    timeout) is not retried, so the resident never waits twice as long."""
    import time
    started = time.monotonic()
    result = _ollama_translate_once(record, language)
    if result is None and OLLAMA_MODEL and time.monotonic() - started < 20:
        result = _ollama_translate_once(record, language)
    return result


def _ollama_translate_once(record: dict[str, Any], language: str) -> dict[str, Any] | None:
    """Translate a record's plain-language explanation into a local language.

    Requires a connected local Ollama model — there is no hosted-provider
    fallback here (this repository never sends source text to a hosted AI
    provider), and no hand-authored translation is substituted, because a
    wrong guess at a language the model was never checked against is worse
    than an honest "unavailable." The result is always labelled machine
    translation, not a human-reviewed one.
    """
    if not OLLAMA_MODEL:
        return None
    schema = {
        "type": "object",
        "properties": {
            "summary": {"type": "string"},
            "plain_language": {"type": "string"},
            "facts": {"type": "array", "items": {"type": "string"}},
            "unknowns": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["summary", "plain_language", "facts", "unknowns"],
    }
    prompt = (
        f"Translate the following civic-information record into {language}. "
        "Keep the meaning exact. Do not add, remove, soften, or invent any fact, date, number, office name, or claim — "
        "translate only what is given. Return the requested JSON fields, fully in the target language, with no English left over.\n\n"
        f"SUMMARY: {record['summary']}\n"
        f"PLAIN LANGUAGE: {record['plain_language']}\n"
        f"FACTS: {json.dumps(record['facts'], ensure_ascii=False)}\n"
        f"UNKNOWNS: {json.dumps(record['unknowns'], ensure_ascii=False)}"
    )
    body = json.dumps({"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "format": schema}).encode("utf-8")
    request = urllib.request.Request(OLLAMA_URL, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=OLLAMA_TIMEOUT or 45) as response:
            payload = json.loads(response.read().decode("utf-8"))
        result = json.loads(str(payload.get("response", "")))
        if not isinstance(result, dict) or not isinstance(result.get("plain_language"), str):
            return None
        facts = [str(item).strip() for item in result.get("facts", []) if str(item).strip()]
        unknowns = [str(item).strip() for item in result.get("unknowns", []) if str(item).strip()]
        if not facts or not unknowns:
            return None
        return {
            "language": language,
            "summary": str(result.get("summary", "")).strip() or record["summary"],
            "plain_language": result["plain_language"].strip(),
            "facts": facts,
            "unknowns": unknowns,
            "engine": "ollama",
        }
    except (OSError, urllib.error.URLError, TimeoutError, json.JSONDecodeError, TypeError, ValueError):
        return None


def ollama_draft(record: dict[str, Any], original: str, language: str, perspective: str, office: str = "", question: str = "") -> dict[str, Any] | None:
    if not OLLAMA_MODEL:
        return None
    schema = {
        "type": "object",
        "properties": {
            "plain_language": {"type": "string"},
            "facts": {"type": "array", "items": {"type": "string"}},
            "unknowns": {"type": "array", "items": {"type": "string"}},
            "next_step": {"type": "string"},
            "draft": {"type": "string"},
        },
        "required": ["plain_language", "facts", "unknowns", "next_step", "draft"],
    }
    prompt = (
        "Prepare a reviewable civic-information draft. Use only the source facts below. "
        "Never invent a date, office, quote, completion state, or statistic. Keep uncertainty visible. "
        f"Return the requested JSON fields. Language: {language or 'English'}. Perspective: {perspective or 'Community question'}.\n"
        + (f"The draft is a message addressed to this office: {office}. " if office else "")
        + (f"The resident is asking about this specific gap in the source — make it the central question of the draft: {question}\n\n" if question else "\n")
        + f"SOURCE TITLE: {record['title']}\nSOURCE LABEL: {record['source_label']}\n"
        f"SOURCE SUMMARY: {record['plain_language']}\nCONFIRMED FACTS: {json.dumps(record['facts'], ensure_ascii=False)}\n"
        f"OPEN QUESTIONS: {json.dumps(record['unknowns'], ensure_ascii=False)}\nCOMMUNITY NOTE: {original or 'I would like a clear update about this decision.'}"
    )
    body = json.dumps({"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "format": schema}).encode("utf-8")
    request = urllib.request.Request(OLLAMA_URL, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=OLLAMA_TIMEOUT or 30) as response:
            payload = json.loads(response.read().decode("utf-8"))
        result = json.loads(str(payload.get("response", "")))
        if not isinstance(result, dict) or not isinstance(result.get("draft"), str):
            return None
        return {
            "original": " ".join(original.strip().split()) or "I would like a clear update about this decision.",
            "draft": result["draft"].strip(),
            "language": language or "English",
            "perspective": perspective or "Community question",
            "source": record["source_label"],
            "office": office,
            "question": question,
            "plain_language": result.get("plain_language", record["plain_language"]),
            "facts": result.get("facts", record["facts"]),
            "unknowns": result.get("unknowns", record["unknowns"]),
            "next_step": result.get("next_step", "Please clarify the next step and the date for the next public update."),
            "engine": "ollama",
            "review_required": True,
            "checks": ["Source attached", "Structured JSON returned", "Human review required", "No message sent"],
        }
    except (OSError, urllib.error.URLError, TimeoutError, json.JSONDecodeError, TypeError, ValueError):
        return None


def build_draft(record: dict[str, Any], original: str, language: str, perspective: str, office: str = "", question: str = "") -> dict[str, Any]:
    """A reviewable message addressed to the responsible office. When the
    resident started from one of the record's open questions, that question
    is the spine of the draft — the gap in the document becomes the ask."""
    generated = ollama_draft(record, original, language, perspective, office, question)
    if generated:
        return generated
    clean_original = " ".join(original.strip().split())
    if not clean_original:
        clean_original = question or "I would like a clear update about this decision."
    is_french = (language or "").lower().startswith("fr")
    greeting = f"À l’attention de : {office}. " if office and is_french else f"To the {office}: " if office else ("Bonjour. " if is_french else "Hello. ")
    if is_french:
        draft = (
            f"{greeting}Je vous écris au sujet de « {record['title']} » ({record['source_label']}). "
            + (f"La source ne précise pas : {question} " if question else f"La source dit : {record['plain_language']} ")
            + f"Ma question : {clean_original} "
            f"Merci d’indiquer la réponse, la prochaine étape et la date de la prochaine mise à jour publique."
        )
    else:
        draft = (
            f"{greeting}I am writing about “{record['title']}” ({record['source_label']}). "
            + (f"The source does not say: {question} " if question else f"The source says: {record['plain_language']} ")
            + f"My question: {clean_original} "
            f"Please state the answer, the next step, and the date of the next public update."
        )
    return {
        "original": clean_original,
        "draft": draft,
        "language": language or "English",
        "perspective": perspective or "Community question",
        "source": record["source_label"],
        "office": office,
        "question": question,
        "checks": [
            "Original meaning preserved for review",
            "Source attached",
            "Human review required",
            "No message sent",
        ],
        "engine": "deterministic-local",
        "review_required": True,
    }


class DemoHandler(BaseHTTPRequestHandler):
    server_version = "CivicBridgeDemo/0.1"

    def log_message(self, fmt: str, *args: Any) -> None:
        # Keep terminal output useful during a screen-recorded demo.
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def send_bytes(self, payload: bytes, content_type: str, status: int = HTTPStatus.OK) -> None:
        # gzip text responses when the client accepts it: the app is meant for
        # thin connections, and app.js + bootstrap JSON compress about 5:1.
        compressible = content_type.startswith(("text/", "application/json", "image/svg"))
        if compressible and len(payload) > 1024 and "gzip" in self.headers.get("Accept-Encoding", ""):
            payload = gzip.compress(payload, compresslevel=6)
            encoding = "gzip"
        else:
            encoding = ""
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        if encoding:
            self.send_header("Content-Encoding", encoding)
            self.send_header("Vary", "Accept-Encoding")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def send_json(self, data: Any, status: int = HTTPStatus.OK) -> None:
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_bytes(payload, "application/json; charset=utf-8", status)

    def send_error_json(self, message: str, status: int = HTTPStatus.BAD_REQUEST) -> None:
        self.send_json({"error": message}, status)

    def read_json(self) -> dict[str, Any] | None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length) if length else b"{}"
            data = json.loads(body.decode("utf-8"))
            return data if isinstance(data, dict) else None
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
            return None

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path
        if path == "/" or path == "/index.html":
            return self.serve_file(PUBLIC / "index.html", "text/html; charset=utf-8")
        if path == "/publisher" or path == "/publisher.html":
            return self.serve_file(PUBLIC / "publisher.html", "text/html; charset=utf-8")
        if path.startswith("/static/"):
            requested = (PUBLIC / "static" / path.removeprefix("/static/")).resolve()
            if PUBLIC.resolve() not in requested.parents:
                return self.send_error_json("Invalid asset path", HTTPStatus.NOT_FOUND)
            content_types = {".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml"}
            return self.serve_file(requested, content_types.get(requested.suffix, "application/octet-stream"))
        if path == "/api/health":
            return self.send_json({"ok": True, "product": PRODUCT_NAME, "records": len(RECORDS)})
        if path == "/api/ai-status":
            return self.send_json({**ollama_status(), "runtime": os.environ.get("CIVIC_BRIDGE_RUNTIME", "local")})
        if path == "/api/session":
            user = demo_user(parse_qs(parsed.query).get("token", [""])[0])
            return self.send_json({"user": user, "mode": "accounts", "roles": ROLE_LABELS, "users_registered": len(USERS)})
        if path == "/api/auth/me":
            user = demo_user(parse_qs(parsed.query).get("token", [""])[0])
            if not user:
                return self.send_error_json("Session expired. Sign in again.", HTTPStatus.UNAUTHORIZED)
            return self.send_json({"user": user})
        if path == "/api/groups":
            country = parse_qs(parsed.query).get("country", [""])[0]
            if country not in COUNTRY_CONTEXTS:
                return self.send_error_json("Unknown country", HTTPStatus.NOT_FOUND)
            groups = [group_summary(country, topic) for topic in CIVIC_TOPICS]
            for group in groups:
                group["post_count"] = len(group.pop("posts"))
            return self.send_json({"groups": groups})
        if path.startswith("/api/groups/"):
            topic = path.removeprefix("/api/groups/").strip("/")
            country = parse_qs(parsed.query).get("country", [""])[0]
            if topic not in CIVIC_TOPICS or country not in COUNTRY_CONTEXTS:
                return self.send_error_json("Unknown group", HTTPStatus.NOT_FOUND)
            return self.send_json(group_summary(country, topic))
        if path == "/api/community/people":
            country = parse_qs(parsed.query).get("country", [""])[0]
            with USERS_LOCK:
                people = [public_user(u) for u in USERS.values() if not country or u.get("country") in ("", country)]
            return self.send_json({"people": people[:200], "total": len(people)})
        if path == "/api/bootstrap":
            return self.send_json({"product_name": PRODUCT_NAME, "tagline": "Understand the source. Speak your view. Follow through.", "records": list(RECORDS.values()), "feedback": [], "dashboard": DASHBOARD, "issues": ISSUES, "representatives": REPRESENTATIVES, "news": NEWS, "localities": LOCALITIES, "locations": LOCATION_OPTIONS, "source_library": SOURCE_LIBRARY, "country_contexts": COUNTRY_CONTEXTS})
        if path == "/api/dashboard":
            return self.send_json(DASHBOARD)
        if path == "/api/issues":
            return self.send_json({"issues": ISSUES})
        if path == "/api/representatives":
            return self.send_json({"representatives": REPRESENTATIVES})
        if path == "/api/representatives/stats":
            country = parse_qs(parsed.query).get("country", [""])[0]
            if country not in COUNTRY_CONTEXTS:
                return self.send_error_json("Unknown country", HTTPStatus.NOT_FOUND)
            return self.send_json(country_representative_stats(country))
        if path.startswith("/api/representatives/"):
            representative_id = path.removeprefix("/api/representatives/")
            country = parse_qs(parsed.query).get("country", [""])[0]
            pool = COUNTRY_CONTEXTS.get(country, {}).get("representatives", REPRESENTATIVES)
            representative = next((item for item in pool if item["id"] == representative_id), None)
            if not representative:
                return self.send_error_json("Representative not found", HTTPStatus.NOT_FOUND)
            with REP_RESPONSES_LOCK:
                responses = list(REP_RESPONSES.get(response_key(country, representative_id), []))
            stats = representative_stats(country, representative) if country else {}
            return self.send_json({"representative": {**representative, **{k: v for k, v in stats.items() if k != "responses"}}, "responses": responses})
        if path == "/api/news":
            return self.send_json({"news": NEWS})
        if path == "/api/publisher/notices":
            with PUBLISHED_NOTICES_LOCK:
                notices = list(PUBLISHED_NOTICES)
            return self.send_json({"notices": notices})
        if path == "/api/localities":
            return self.send_json({"localities": LOCALITIES})
        if path == "/api/records":
            query = parse_qs(parsed.query).get("q", [""])[0].lower().strip()
            records = list(RECORDS.values())
            if query:
                records = [r for r in records if query in f"{r['title']} {r['category']} {r['summary']}".lower()]
            return self.send_json({"records": records})
        if path.startswith("/api/records/") and path.endswith("/community"):
            record_id = path.removeprefix("/api/records/").removesuffix("/community").strip("/")
            record = resolve_record(record_id, parse_qs(parsed.query).get("country", [""])[0])
            if not record:
                return self.send_error_json("Record not found", HTTPStatus.NOT_FOUND)
            key = community_key(parse_qs(parsed.query).get("country", [""])[0], record_id)
            with COMMENTS_LOCK:
                comments = [public_post(item) for item in COMMENTS.get(key, [])]
            with VOTES_LOCK:
                vote_map = dict(VOTES.get(key, {}))
            counts = {"helpful": sum("helpful" in choices for choices in vote_map.values()), "needs-clarity": sum("needs-clarity" in choices for choices in vote_map.values())}
            viewer = demo_user(parse_qs(parsed.query).get("token", [""])[0])
            user_id = viewer["id"] if viewer else parse_qs(parsed.query).get("user_id", [""])[0]
            with PERSPECTIVES_LOCK:
                submitted_perspectives = [public_post(item) for item in PERSPECTIVES.get(key, [])]
            country = parse_qs(parsed.query).get("country", [""])[0]
            with FEEDBACK_LOCK:
                questions = [public_post(item) for item in FEEDBACK if item.get("record_id") == record_id and item.get("country", country) == country]
            return self.send_json({"questions": questions, "comments": comments, "votes": counts, "selected_vote": vote_map.get(user_id, []), "perspectives": submitted_perspectives})
        if path.startswith("/api/records/"):
            record_id = path.removeprefix("/api/records/")
            record = RECORDS.get(record_id)
            return self.send_json(record) if record else self.send_error_json("Record not found", HTTPStatus.NOT_FOUND)
        if path == "/api/feedback":
            viewer = demo_user(parse_qs(parsed.query).get("token", [""])[0])
            with FEEDBACK_LOCK:
                mine = [item for item in FEEDBACK if viewer and item.get("user_id") == viewer["id"]]
            # Has the office replied since the question was sent?
            with REP_RESPONSES_LOCK:
                for item in mine:
                    replies = REP_RESPONSES.get(response_key(item.get("country", ""), item.get("office_id", "")), [])
                    item["office_replied"] = any(reply.get("created_at", "") > item.get("created_at", "") for reply in replies)
            return self.send_json({"feedback": mine})
        return self.send_error_json("Not found", HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        data = self.read_json()
        if data is None:
            return self.send_error_json("Send a JSON object.")
        if parsed.path == "/api/auth/register":
            username = re.sub(r"[^a-z0-9._-]", "", str(data.get("username", "")).lower().strip())
            password = str(data.get("password", ""))
            display_name = " ".join(str(data.get("display_name", "")).split())[:60] or username
            role_key = str(data.get("role", "resident"))
            if len(username) < 3:
                return self.send_error_json("Choose a username of at least 3 letters or digits.")
            if len(password) < 6:
                return self.send_error_json("Choose a password of at least 6 characters.")
            if find_user_by_username(username):
                return self.send_error_json("That username is already taken.", HTTPStatus.CONFLICT)
            user = create_user(username, password, display_name, role_key, str(data.get("country", "")), str(data.get("locality", "")))
            token = open_session(user)
            save_state()
            return self.send_json({"token": token, "user": public_user(user)}, HTTPStatus.CREATED)
        if parsed.path == "/api/auth/login":
            user = find_user_by_username(str(data.get("username", "")))
            if not user or not check_password(str(data.get("password", "")), user["password"]):
                return self.send_error_json("Unknown username or wrong password.", HTTPStatus.UNAUTHORIZED)
            token = open_session(user)
            save_state()
            return self.send_json({"token": token, "user": public_user(user)})
        if parsed.path == "/api/auth/logout":
            with USERS_LOCK:
                SESSIONS.pop(str(data.get("token", "")), None)
            save_state()
            return self.send_json({"ok": True})
        if parsed.path == "/api/profile/interpret":
            text = " ".join(str(data.get("description", data.get("text", ""))).split())
            if len(text) < 2:
                return self.send_error_json("Describe what you do first.")
            return self.send_json({**interpret_description(text, str(data.get("language", "English"))), "topics": {topic: {"en": meta["en"], "fr": meta["fr"]} for topic, meta in CIVIC_TOPICS.items()}})

        if parsed.path == "/api/profile/interests":
            user = session_user(str(data.get("token", "")))
            if not user:
                return self.send_error_json("Sign in first.", HTTPStatus.UNAUTHORIZED)
            interests = [topic for topic in data.get("interests", []) if topic in CIVIC_TOPICS][:8]
            with USERS_LOCK:
                user["interests"] = interests
                if str(data.get("locality", "")):
                    user["locality"] = str(data.get("locality", ""))[:80]
                if str(data.get("country", "")) in COUNTRY_CONTEXTS:
                    user["country"] = str(data.get("country", ""))
            save_state()
            return self.send_json({"interests": interests})
        if parsed.path.startswith("/api/groups/") and parsed.path.endswith("/posts"):
            topic = parsed.path.removeprefix("/api/groups/").removesuffix("/posts").strip("/")
            country = str(data.get("country", ""))
            user = demo_user(str(data.get("token", "")))
            message = " ".join(str(data.get("message", "")).split())
            if topic not in CIVIC_TOPICS or country not in COUNTRY_CONTEXTS:
                return self.send_error_json("Unknown group", HTTPStatus.NOT_FOUND)
            if not user:
                return self.send_error_json("Sign in first.", HTTPStatus.UNAUTHORIZED)
            if not message:
                return self.send_error_json("Write a message first.")
            anonymous = bool(data.get("anonymous"))
            persona = " ".join(str(data.get("persona", "")).split())[:80]
            item = {"id": uuid.uuid4().hex[:10], "user_id": user["id"], "user_label": persona or ("Anonymous member" if anonymous else user["label"]), "anonymous": anonymous, "message": message, "created_at": now_iso()}
            with GROUP_POSTS_LOCK:
                GROUP_POSTS.setdefault(f"{country}|{topic}", []).insert(0, item)
            save_state()
            return self.send_json(public_post(item), HTTPStatus.CREATED)
        if parsed.path == "/api/voice/transcribe":
            preset = data.get("preset", "")
            transcript = data.get("text", "") or (
                "I want to know when the new access schedule starts and how the first week will work."
                if preset == "water"
                else "Please tell us when the market road repair will begin and where we can verify progress."
            )
            return self.send_json({"language": data.get("language", "English"), "transcript": transcript, "confidence": 0.94, "review_required": True})
        if parsed.path == "/api/publisher/notices":
            publisher = demo_user(str(data.get("token", "")))
            if not publisher or publisher["role_key"] != "office":
                return self.send_error_json("Sign in with a representative office account to publish.", HTTPStatus.UNAUTHORIZED)
            clean = lambda value, fallback="": " ".join(str(value or fallback).split())
            title = clean(data.get("title"))
            summary = clean(data.get("summary"))
            locality = clean(data.get("locality"), "Selected locality")
            if not title or not summary:
                return self.send_error_json("Headline and public summary are required.")
            notice_id = f"notice-{uuid.uuid4().hex[:10]}"
            published_at = now_iso()
            notice = {
                "id": notice_id,
                "title": title,
                "headline": title,
                "category": clean(data.get("category"), "Public notice"),
                "locality": locality,
                "region": clean(data.get("region")),
                "country": clean(data.get("country")),
                "office": clean(data.get("office"), "Public Information Desk"),
                "responsible_office": clean(data.get("responsible_office")),
                "summary": summary,
                "body": clean(data.get("body"), summary),
                "source_url": clean(data.get("source_url"), "/publisher"),
                "source": clean(data.get("source_url"), "Public Information Desk"),
                "published_at": published_at,
                "date": datetime.now().strftime("%d %b %Y · %H:%M UTC"),
                "status": "Published",
                "published_by": publisher["label"],
            }
            register_notice(notice)
            save_state()
            return self.send_json(notice, HTTPStatus.CREATED)
        if parsed.path == "/api/feedback/draft":
            record = resolve_record(str(data.get("record_id", "")), str(data.get("country", "")))
            if not record:
                return self.send_error_json("Record not found", HTTPStatus.NOT_FOUND)
            return self.send_json(build_draft(record, str(data.get("text", "")), str(data.get("language", "English")), str(data.get("perspective", "Community question")), str(data.get("office_name") or data.get("office") or ""), str(data.get("question", ""))))
        if parsed.path == "/api/sources/explain":
            mode = str(data.get("mode", "text"))
            country = str(data.get("country", ""))
            is_french = country in FRENCH_COUNTRIES
            title = str(data.get("title", "")).strip()
            area = {"locality": str(data.get("locality", "")), "region": str(data.get("region", "")), "country": country}
            if mode == "text":
                source_text = " ".join(str(data.get("text", "")).split())
                origin_label = "Texte collé" if is_french else "Pasted text"
                if len(source_text) < 20:
                    return self.send_error_json("Collez un texte source plus long d'abord." if is_french else "Paste more source text first.")
            elif mode == "url":
                url = str(data.get("url", "")).strip()
                if not url.startswith(("http://", "https://")):
                    return self.send_error_json("Indiquez un lien http(s) valide." if is_french else "Enter a valid http(s) link.")
                try:
                    fetched_title, source_text = extract_url_text(url)
                except (OSError, urllib.error.URLError, TimeoutError, ValueError):
                    return self.send_error_json("Impossible de récupérer ce lien." if is_french else "Could not fetch that link.")
                title = title or fetched_title
                origin_label = url
                if len(source_text) < 40:
                    return self.send_error_json("Aucun texte lisible trouvé à ce lien." if is_french else "Could not find readable text at that link.")
            elif mode == "pdf":
                filename = str(data.get("filename", "document.pdf")) or "document.pdf"
                try:
                    pdf_bytes = base64.b64decode(str(data.get("data_base64", "")), validate=False)
                except (ValueError, binascii.Error):
                    return self.send_error_json("Impossible de lire ce fichier PDF." if is_french else "Could not read that PDF file.")
                source_text = extract_pdf_text(pdf_bytes)
                origin_label = filename
                if len(source_text) < 40:
                    return self.send_error_json(
                        "Impossible d'extraire du texte lisible de ce PDF. Essayez de coller le texte à la place."
                        if is_french else
                        "Could not extract readable text from this PDF. Try pasting the text instead."
                    )
            else:
                return self.send_error_json("Unsupported mode.")
            record = build_explained_record(source_text, title, origin_label, area, is_french)
            RECORDS[record["id"]] = record
            save_state()
            return self.send_json(record, HTTPStatus.CREATED)
        if parsed.path == "/api/feedback":
            record = resolve_record(str(data.get("record_id", "")), str(data.get("country", "")))
            if not record:
                return self.send_error_json("Record not found", HTTPStatus.NOT_FOUND)
            draft = str(data.get("draft", "")).strip()
            original = str(data.get("original", "")).strip()
            if not draft:
                return self.send_error_json("Draft is required.")
            author = demo_user(str(data.get("token", "")))
            if not author:
                return self.send_error_json("Sign in to send a question to the office.", HTTPStatus.UNAUTHORIZED)
            anonymous = bool(data.get("anonymous"))
            persona = " ".join(str(data.get("persona", "")).split())[:80]
            item = {
                "id": uuid.uuid4().hex[:10],
                "user_id": author["id"],
                "user_label": persona or ("Anonymous resident" if anonymous else author["label"]),
                "anonymous": anonymous,
                "record_id": record["id"],
                "record_title": record["title"],
                "original": original,
                "draft": draft,
                "perspective": str(data.get("perspective", "Community question")),
                "language": str(data.get("language", "English")),
                "country": str(data.get("country", "")),
                "office": " ".join(str(data.get("office", "")).split())[:120],
                "office_id": " ".join(str(data.get("office_id", "")).split())[:40],
                "question": " ".join(str(data.get("question", "")).split())[:300],
                "status": "Sent to office",
                "created_at": now_iso(),
            }
            with FEEDBACK_LOCK:
                FEEDBACK.insert(0, item)
            save_state()
            return self.send_json(public_post(item), HTTPStatus.CREATED)
        if parsed.path.startswith("/api/records/") and parsed.path.endswith("/comments"):
            record_id = parsed.path.removeprefix("/api/records/").removesuffix("/comments").strip("/")
            user = demo_user(str(data.get("token", "")))
            message = " ".join(str(data.get("message", "")).split())
            key = community_key(str(data.get("country", "")), record_id)
            if not resolve_record(record_id, str(data.get("country", ""))):
                return self.send_error_json("Record not found", HTTPStatus.NOT_FOUND)
            if not user:
                return self.send_error_json("Choose a demo account first.", HTTPStatus.UNAUTHORIZED)
            if not message:
                return self.send_error_json("Comment is required.")
            anonymous = bool(data.get("anonymous"))
            persona = " ".join(str(data.get("persona", "")).split())[:80]
            item = {"id": uuid.uuid4().hex[:10], "user_id": user["id"], "user_label": persona or ("Anonymous resident" if anonymous else user["label"]), "anonymous": anonymous, "type": "Community comment", "message": message, "status": "Published for review", "created_at": now_iso()}
            with COMMENTS_LOCK:
                COMMENTS.setdefault(key, []).insert(0, item)
            save_state()
            return self.send_json(public_post(item), HTTPStatus.CREATED)
        if parsed.path.startswith("/api/records/") and parsed.path.endswith("/vote"):
            record_id = parsed.path.removeprefix("/api/records/").removesuffix("/vote").strip("/")
            user = demo_user(str(data.get("token", "")))
            vote = str(data.get("vote", ""))
            key = community_key(str(data.get("country", "")), record_id)
            if not resolve_record(record_id, str(data.get("country", ""))):
                return self.send_error_json("Record not found", HTTPStatus.NOT_FOUND)
            if not user:
                return self.send_error_json("Choose a demo account first.", HTTPStatus.UNAUTHORIZED)
            if vote not in {"helpful", "needs-clarity"}:
                return self.send_error_json("Vote must be helpful or needs-clarity.")
            with VOTES_LOCK:
                choices = set(VOTES.setdefault(key, {}).get(user["id"], []))
                if vote in choices:
                    choices.remove(vote)
                else:
                    choices.add(vote)
                VOTES[key][user["id"]] = sorted(choices)
                vote_map = dict(VOTES[key])
            counts = {"helpful": sum("helpful" in item for item in vote_map.values()), "needs-clarity": sum("needs-clarity" in item for item in vote_map.values())}
            save_state()
            return self.send_json({"votes": counts, "selected_vote": vote_map[user["id"]]})
        if parsed.path.startswith("/api/records/") and parsed.path.endswith("/perspectives"):
            record_id = parsed.path.removeprefix("/api/records/").removesuffix("/perspectives").strip("/")
            user = demo_user(str(data.get("token", "")))
            label = " ".join(str(data.get("label", "")).split())
            body = " ".join(str(data.get("body", "")).split())
            key = community_key(str(data.get("country", "")), record_id)
            if not resolve_record(record_id, str(data.get("country", ""))):
                return self.send_error_json("Record not found", HTTPStatus.NOT_FOUND)
            if not user:
                return self.send_error_json("Choose a demo account first.", HTTPStatus.UNAUTHORIZED)
            if not label or not body:
                return self.send_error_json("Add a short label and description first.")
            anonymous = bool(data.get("anonymous"))
            persona = " ".join(str(data.get("persona", "")).split())[:80]
            item = {"id": uuid.uuid4().hex[:10], "user_id": user["id"], "user_label": persona or ("Anonymous resident" if anonymous else user["label"]), "anonymous": anonymous, "label": label, "body": body, "submitted": True, "created_at": now_iso()}
            with PERSPECTIVES_LOCK:
                PERSPECTIVES.setdefault(key, []).append(item)
            save_state()
            return self.send_json(public_post(item), HTTPStatus.CREATED)
        if parsed.path.startswith("/api/records/") and parsed.path.endswith("/translate"):
            record_id = parsed.path.removeprefix("/api/records/").removesuffix("/translate").strip("/")
            record = resolve_record(record_id, str(data.get("country", "")))
            if not record:
                return self.send_error_json("Record not found", HTTPStatus.NOT_FOUND)
            language = str(data.get("language", "")).strip()
            if not language:
                return self.send_error_json("Choose a language.")
            result = ollama_translate(record, language)
            if not result:
                return self.send_error_json(
                    "Translation needs a connected local Ollama model (CIVIC_BRIDGE_OLLAMA_MODEL).",
                    HTTPStatus.SERVICE_UNAVAILABLE,
                )
            return self.send_json(result)
        if parsed.path == "/api/share":
            user = demo_user(str(data.get("token", "")))
            channel = " ".join(str(data.get("channel", "")).split())
            target_type = " ".join(str(data.get("target_type", "source")).split()) or "source"
            target_title = " ".join(str(data.get("target_title", "Civic Bridge update")).split()) or "Civic Bridge update"
            if not user:
                return self.send_error_json("Choose a demo account first.", HTTPStatus.UNAUTHORIZED)
            if channel not in {"WhatsApp", "SMS", "Copy link", "Community group"}:
                return self.send_error_json("Choose a supported channel.")
            item = {"id": uuid.uuid4().hex[:10], "user_id": user["id"], "user_label": user["label"], "target_type": target_type, "target_title": target_title, "channel": channel, "status": "Share recorded", "created_at": now_iso()}
            with SHARES_LOCK:
                SHARES.insert(0, item)
            save_state()
            return self.send_json(item, HTTPStatus.CREATED)
        if parsed.path.startswith("/api/representatives/") and parsed.path.endswith("/response"):
            representative_id = parsed.path.removeprefix("/api/representatives/").removesuffix("/response").strip("/")
            country = str(data.get("country", ""))
            pool = COUNTRY_CONTEXTS.get(country, {}).get("representatives", REPRESENTATIVES)
            representative = next((item for item in pool if item["id"] == representative_id), None)
            message = " ".join(str(data.get("message", "")).split())
            author = demo_user(str(data.get("token", "")))
            if not representative:
                return self.send_error_json("Representative not found", HTTPStatus.NOT_FOUND)
            if not author or author["role_key"] != "office":
                return self.send_error_json("Sign in with a representative office account to reply.", HTTPStatus.UNAUTHORIZED)
            if not message:
                return self.send_error_json("Response is required.")
            item = {"id": uuid.uuid4().hex[:10], "type": " ".join(str(data.get("type", "Add context to a comment")).split()) or "Add context to a comment", "message": message, "status": "Submitted for review", "created_at": now_iso(), "user_id": author["id"], "user_label": author["label"]}
            with REP_RESPONSES_LOCK:
                REP_RESPONSES.setdefault(response_key(country, representative_id), []).insert(0, item)
            save_state()
            return self.send_json(item, HTTPStatus.CREATED)
        return self.send_error_json("Not found", HTTPStatus.NOT_FOUND)

    def serve_file(self, path: Path, content_type: str) -> None:
        try:
            payload = path.read_bytes()
        except FileNotFoundError:
            return self.send_error_json("File not found", HTTPStatus.NOT_FOUND)
        if content_type.startswith("text/html"):
            # Version every static asset URL with its file's mtime so a browser
            # can never keep running an old script or stylesheet after a deploy.
            def versioned(match: re.Match[str]) -> str:
                asset = PUBLIC / match.group(0).lstrip("/")
                stamp = int(asset.stat().st_mtime) if asset.exists() else 0
                return f'{match.group(0)}?v={stamp}'
            payload = re.sub(r'(?<=["\'])/?static/[A-Za-z0-9_./-]+\.(?:js|css)(?=["\'?])', versioned, payload.decode("utf-8")).encode("utf-8")
        self.send_bytes(payload, content_type)


def bootstrap_data() -> None:
    """Restore the persisted state, or seed a populated platform on first run."""
    if load_state():
        print(f"Restored state from {STATE_FILE}: {len(USERS)} accounts, {len(PUBLISHED_NOTICES)} notices, {sum(len(v) for v in COMMENTS.values())} comments")
        return
    import seed_data
    seed_data.seed(globals())
    save_state()
    print(f"Seeded a fresh platform into {STATE_FILE}: {len(USERS)} accounts, {len(PUBLISHED_NOTICES)} notices, {sum(len(v) for v in COMMENTS.values())} comments")


def main() -> None:
    if not PUBLIC.exists():
        raise SystemExit(f"Missing public directory: {PUBLIC}")
    bootstrap_data()
    server = ThreadingHTTPServer((HOST, PORT), DemoHandler)
    print(f"{PRODUCT_NAME} demo running at http://{HOST}:{PORT}" + (" (open http://localhost:8000 or your mapped port)" if HOST == "0.0.0.0" else ""))
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping demo server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
