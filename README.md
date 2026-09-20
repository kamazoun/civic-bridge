# Civic Bridge

**You shouldn't have to understand how government is structured to find out what affects you.**

Civic information is organised around institutions and documents. A farmer with a water problem has to already know whether that is a ward matter, a district works department, a regional directorate or a national utility before they can even start looking. Civic Bridge inverts that: you say who you are — your work, your stage of life, where you live, in your own words and language — and it assembles the slice of government that actually touches you, across every level at once, in the order it matters to you, next to the people the same decision lands on.

Three moves, in order:

1. **Who is responsible** — the full ward → district → region → national chain for your country, each office with its remit, its published notices, its replies and its response rate, so you know who to address.
2. **What matters to you** — a profile you describe in free text; the app shows *what it understood* and you correct it; a fixed, published weight table orders the feed and every record explains *why it is there*. Order changes, access never does.
3. **Who else this lands on** — everyone in your country with the same topic in their profile is a group: compare notes, ask what others were told, prepare one common question — with your name or anonymously.

Plain-language explanation beside the original source, with *what the document does not say* kept as a separate field and turned into a question addressed to the responsible office, is how a record becomes readable and actionable. It is infrastructure, not the idea. A local model through [Ollama](https://ollama.com) does the language work so nothing leaves the community; everything degrades to honest, labelled fallbacks without it.

| | |
|---|---|
| **Runtime** | Python 3.9+ standard library; no dependencies, build step, or database |
| **AI** | Local model via Ollama — translation, feedback drafts, source explanation |
| **Privacy** | No hosted AI provider, no telemetry; the only external services are map tiles and reverse geocoding |

---

## Table of contents

1. [Quick start](#1-quick-start)
2. [Installation](#2-installation)
   - 2.1 [Native installation with Ollama](#21-native-installation-with-ollama)
   - 2.2 [Docker](#22-docker)
   - 2.3 [Free hosting](#23-free-hosting)
3. [Configuration](#3-configuration)
4. [Features](#4-features)
5. [Architecture](#5-architecture)
   - 5.1 [Components](#51-components)
   - 5.2 [Record schema](#52-record-schema)
   - 5.3 [State and persistence](#53-state-and-persistence)
   - 5.4 [Local AI integration](#54-local-ai-integration)
   - 5.5 [External network access](#55-external-network-access)
6. [API reference](#6-api-reference)
7. [Repository structure](#7-repository-structure)
8. [Licence](#8-licence)

---

## 1. Quick start

Requirements: Python 3.9 or later, [Ollama](https://ollama.com) with a pulled model.

```sh
ollama pull gemma4

git clone https://github.com/kamazoun/civic-bridge.git
cd civic-bridge
CIVIC_BRIDGE_OLLAMA_MODEL=gemma4 python3 app.py
```

Open <http://127.0.0.1:8000>. The Public Information Portal is at <http://127.0.0.1:8000/publisher>.

## 2. Installation

| | Native + Ollama | Docker |
|---|---|---|
| Prerequisites | Python 3.9+, Ollama | Docker with Compose |
| Model | Any Ollama model (`gemma4` in this guide, ~9.6 GB) | `gemma3:4b` (~3.3 GB) |
| Hardware acceleration | Automatic (NVIDIA, AMD, Apple Silicon) | CPU only, unless Linux + NVIDIA (see 2.2) |
| Typical translation latency | 2–6 s | 6–60 s depending on CPU |

### 2.1 Native installation with Ollama

**Step 1 — Install Ollama and pull a model.**

```sh
# Linux
curl -fsSL https://ollama.com/install.sh | sh
# macOS / Windows: install from https://ollama.com/download

ollama pull gemma4
```

Ollama detects NVIDIA, AMD, and Apple GPUs automatically when drivers are present. After the first AI request, `ollama ps` shows whether the model is running on GPU or CPU. Models larger than GPU memory are split between GPU and system RAM.

**Step 2 — Start Civic Bridge.**

```sh
git clone https://github.com/kamazoun/civic-bridge.git
cd civic-bridge
CIVIC_BRIDGE_OLLAMA_MODEL=gemma4 ./run_demo.sh
```

Windows (PowerShell):

```powershell
$env:CIVIC_BRIDGE_OLLAMA_MODEL = "gemma4"; python app.py
```

**Step 3 — Open <http://127.0.0.1:8000>.** The header banner confirms the model is connected; if not, it states exactly what is missing (not configured, service unreachable, or model not pulled) with the command that resolves it.

Any Ollama model can be substituted: `ollama pull <model>` then `CIVIC_BRIDGE_OLLAMA_MODEL=<model>`.

### 2.2 Docker

```sh
git clone https://github.com/kamazoun/civic-bridge.git
cd civic-bridge
docker compose up
```

Open <http://localhost:8000>. Compose starts three services: the application, an Ollama runtime, and a one-off job that pulls `gemma3:4b`. The application is usable immediately; the banner reports model download progress and clears when the model is ready. Subsequent starts reuse the downloaded model (stored in the `ollama-models` volume).

Notes:

- First start downloads approximately 6 GB (Ollama image ~2.7 GB, model ~3.3 GB).
- Docker Desktop on macOS/Windows: allocate at least 6 GB of memory (Settings → Resources).
- The application waits up to 4 minutes per AI response in Docker mode (`CIVIC_BRIDGE_OLLAMA_TIMEOUT=240`).
- Stop with `Ctrl+C` or `docker compose down`; add `-v` to remove the model volume.

**Linux with an NVIDIA GPU.** With the NVIDIA driver and [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) installed, the GPU can be passed to the Ollama container and a larger model used:

```sh
CIVIC_BRIDGE_OLLAMA_MODEL=gemma4 docker compose -f docker-compose.yml -f docker-compose.gpu.yml up
```

Docker Desktop on macOS does not support GPU passthrough; use the native installation there.

**Application container only, host Ollama.** To run the application in Docker against an Ollama already installed on the host:

```sh
CIVIC_BRIDGE_OLLAMA_URL=http://host.docker.internal:11434/api/generate \
CIVIC_BRIDGE_OLLAMA_MODEL=gemma4 \
docker compose up --build --no-deps app
```

On Linux, Ollama must listen on all interfaces for this (`OLLAMA_HOST=0.0.0.0`, e.g. via `sudo systemctl edit ollama`).

### 2.3 Free hosting

The image needs nothing but Python, so it runs on any free container host. The repository ships a `render.yaml` blueprint:

1. Push the repository to GitHub.
2. On [render.com](https://render.com) choose **New → Blueprint**, pick the repository, accept the defaults. Render builds the `Dockerfile`, injects `PORT`, and gives you an `https://….onrender.com` URL.
3. First start seeds the platform (about 15 s), then the site is live.

Two things to know about free tiers: there is no local AI (translation and drafts fall back to the labelled templates; set `CIVIC_BRIDGE_OLLAMA_URL` to a hosted Ollama if you have one), and the disk is ephemeral — the instance sleeps after 15 minutes without traffic and comes back with a freshly seeded state, so accounts created by visitors do not survive a restart. To keep them, point `CIVIC_BRIDGE_DATA_DIR` at a persistent disk (Render paid disk, a Fly.io volume, or any VM such as Oracle Cloud's always-free tier, which is also large enough to run Ollama).

## 3. Configuration

All configuration is by environment variable.

| Variable | Default | Purpose |
|---|---|---|
| `HOST` | `127.0.0.1` | Bind address (`0.0.0.0` in Docker) |
| `PORT` | `8000` | Listening port |
| `PRODUCT_NAME` | `Civic Bridge` | Product name shown in the interface |
| `CIVIC_BRIDGE_OLLAMA_MODEL` | *(empty)* | Ollama model name, e.g. `gemma4`, `gemma3:4b` |
| `CIVIC_BRIDGE_OLLAMA_URL` | `http://127.0.0.1:11434/api/generate` | Ollama generate endpoint |
| `CIVIC_BRIDGE_OLLAMA_TIMEOUT` | `0` (per-call default 30 s) | Seconds to wait for one model response |
| `CIVIC_BRIDGE_RUNTIME` | `local` | Set to `docker` by Compose; adjusts the AI status banner |
| `CIVIC_BRIDGE_DATA_DIR` | `./data` | Directory holding `state.json` (accounts and all activity). Put it on a persistent disk in production |
| `PYTHON` | `python3` | Interpreter used by `run_demo.sh` |
| `CIVIC_BRIDGE_PORT` | `8000` | Host port mapping (Docker Compose only) |

## 4. Features

**Source records.** Every record carries the original passage, a plain-language explanation, confirmed facts, open questions, resident perspectives, an evidence list, a timeline, and per-channel delivery text. Open questions are actionable: each one is a button that opens the Feedback tab pre-filled with that question and addressed to the record's responsible office (`responsibleOffice()` in `app.js`, `FIXTURE_RECORD_OFFICE` in `app.py`); the draft (`build_draft`, model or template) makes that gap the central ask, and the saved draft records the office it was addressed to. Record identifiers are stable across countries, so ranking and voting behave identically in every language.

**Location and language.** Area is set from browser location (reverse geocoding) or chosen from a map. Interface language and translation targets follow the country.

**Profile: free text → what we understood → fixed weights.** A person describes what they do (or who they are filling this in for) in any language, typed or spoken. `POST /api/profile/interpret` maps that into a *controlled vocabulary* of 24 civic topics (`CIVIC_TOPICS` in `app.py`) plus one plain sentence — by the local model when connected, by EN/FR/local-word keyword matching otherwise — and never free-forms categories. The sentence and topic chips are shown back ("What we understood… so we will show you first…"), removable and addable; the person's edit always wins. Ranking is then a published rule (`INTEREST_POSITION_WEIGHTS`: first two topics +3, next two +2, then +1; `AGE_TOPIC_WEIGHTS` for the age band), and every ranked record carries a **"Why am I seeing this here?"** panel with the person's own words, what was understood, and the exact points. The model never orders anything directly. Data rule, enforced in the prompt and by construction in the fallback: ethnicity, religion, politics, health, immigration status, income, exact address, gender and named individuals are ignored even if volunteered. Age informs relevance only — no gating anywhere.

**Groups.** A group is everyone in a country whose profile lists a topic — computed, never stored, shown as a count and a list of localities, never a member list (`GET /api/groups`, `/api/groups/{topic}`). Each group has its own conversation and the records on that topic; every record's "Who else this lands on" card links to its group. Signed-in accounts sync their topics to the server (`POST /api/profile/interests`) so groups follow the account.

**Questions with an owner.** "Send to ‹office›" publishes the question on the record (under *Questions to ‹office›*) and on the office's page (*Questions received*), where an office account can reply with one click ("Reply to this →" pre-fills the right of reply). *My questions* lists what you sent, to whom, and whether that office has replied since. Answers — and silence — are public.

**Anonymous participation.** Comments, perspectives and group posts can be posted as "A resident of Lomé (market trade)": the persona carries only a topic and a locality, the account id stays server-side and is stripped from every public view (`public_post`), and no phone number is ever attached to a post.

**Representatives.** A four-level institutional hierarchy per country using its own administrative vocabulary. Each office has a profile whose statistics — records on file, sourced records, questions received, office replies, response rate, community pulse, last activity — are computed live from activity on the platform (`representative_stats` in `app.py`), a track record, a focus area, follow/watchlist, and a labelled right of reply that only office accounts can post. Portraits resolve per country and level from `public/static/images/reps/{country}-{level}.jpeg`.

**Explain a source.** Pasted text, a URL, or an uploaded PDF becomes a new record. PDF text extraction is dependency-free (`extract_pdf_text`: FlateDecode streams, `Tj`/`TJ` operators). URLs are fetched with a 2 MB cap and 6 s timeout and reduced to plain text. The model returns `plain_language`, `facts`, and `unknowns` under a JSON schema.

**Translation.** Performed by the local model under a JSON schema so facts and unknowns stay separate in the translated output. A fast malformed response is retried once; a slow failure is not. Every translation is labelled *machine translation — not yet reviewed*, with the original one click away.

**Voice — not an assistant.** Two buttons, nothing that talks back. *Read this record to me* uses the phone's own speech synthesis with per-language voice detection (`SPEECH_LANG_CODES`, and an honest message when a language has no installed voice). *Say your question instead of typing* uses speech recognition to put the resident's spoken words into the question box — the question then goes to a human office through the same path as a typed one. No conversational agent exists in the product; the local model only rewrites, translates and extracts, and every output it produces is labelled for review.

**Access channels.** Subscriptions by WhatsApp, SMS, email, and voice call, plus community join cards. Records carry per-channel wording (`web`, `voice`, `text`).

**Public Information Portal.** `/publisher` is the office side: rendered as the official information portal of the selected country's region, in its administrative language and flag colours (`PORTALS` in `publisher.js`) — the state and motto, the issuing body, notices filterable by subject, an office directory with each office's remit and live counts, and an officers' workspace where signed-in office accounts publish. A published notice enters the public record at once and becomes a record in the app whose facts and *unknowns are read from the notice's own text* — by the local model at publication when connected (`derive_notice_content`), otherwise by sentence heuristics keyed on uncertainty phrases in the notice's language ("n'est pas encore fixé", "to be confirmed"…) — so "what the source does not say" is never boilerplate; the record is labelled *published by the office · not independently verified*. Every portal card deep-links to its record (`/#record/{id}`). The ingestion contract is described in [docs/DATA_PIPELINE.md](docs/DATA_PIPELINE.md).

**Community.** Independent *Helpful* / *Needs more clarity* toggles, comments, resident-authored perspectives, share. Community data is scoped per country, so the same reference record carries different conversations in Lomé and Nairobi.

**Accounts.** Username + password sign-up and sign-in (PBKDF2-SHA256, server-side session tokens, standard library only — no e-mail, no external identity provider). Two roles: resident and representative office. Publishing notices and posting a right of reply require an office account. Demo accounts `resident` and `office` (password `civic2026`) sign in with one click; the seeded office accounts per country are listed in [docs/ACCOUNTS.md](docs/ACCOUNTS.md).

**Seeded platform.** On first start `seed_data.py` populates every country with about 50 accounts, 45–55 published notices per country dated over the previous six months, comments, votes, perspectives, feedback drafts, office replies and shares — deterministic, so every fresh deployment shows the same living platform. Everything seeded is fictional and labelled as such.

## 5. Architecture

### 5.1 Components

```
┌──────────────────────────────┐   ┌──────────────────────────────┐
│  Resident application        │   │  Public Information Portal   │
│  public/index.html           │   │  public/publisher.html       │
│  public/static/app.js        │   │  public/static/publisher.js  │
│  (no framework, no build)    │   │                              │
└──────────────┬───────────────┘   └──────────────┬───────────────┘
               │ JSON over HTTP                    │
               ▼                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  app.py — single-process HTTP server (Python standard library)   │
│  • country contexts generated from specifications                │
│  • in-memory state guarded by per-collection locks               │
│  • dependency-free PDF and HTML text extraction                  │
│  • Ollama client with JSON-schema-constrained output             │
└──────────────────────────────┬───────────────────────────────────┘
                               │ optional, localhost only
                               ▼
                    ┌─────────────────────┐
                    │  Ollama (local LLM) │
                    └─────────────────────┘
```

Both front ends are served by the same process deliberately: the live publish → arrival handoff requires shared state, and a single process keeps setup zero-configuration. The portal is visually and behaviourally independent (own stylesheet, own scripts) and reads only the bootstrap and notice endpoints.

### 5.2 Record schema

```
id, title, category, location, source_date, source_label,
status, status_detail, summary, plain_language,
facts[], unknowns[], perspectives[{label, body}],
evidence[{label, quote, page, kind}],
timeline[{date, label, detail, state: done|current|pending}],
channels{web, voice, text}
```

The same shape is used for records created by *Explain a source* and for records created from published notices; it is the contract an ingestion pipeline targets.

### 5.3 State and persistence

| Data | Where | Lifetime |
|---|---|---|
| Selected area, session token, preferences, follows, subscriptions | Browser `localStorage`, keyed per account | Until cleared by the user |
| Accounts, sessions, comments, votes, perspectives, feedback drafts, right-of-reply responses, published notices, explained sources, shares | Server memory, one lock per collection, snapshotted to `$CIVIC_BRIDGE_DATA_DIR/state.json` after every write (atomic rename) | Persistent while that file persists; seeded again by `seed_data.py` if it is absent |
| Reference records, representatives | Generated at start-up from `app.py` | Immutable |

### 5.4 Local AI integration

- Transport: Ollama's HTTP generate endpoint, called with `urllib` (no SDK).
- **Structured output:** every call passes a JSON schema in Ollama's `format` field, so translations, drafts, and explanations arrive as typed fields rather than free text.
- **Guardrail prompt:** the model is instructed to use only the supplied text and never invent a date, office, quote, completion state, or statistic, and to keep uncertainty visible.
- **Availability check:** `GET /api/ai-status` probes the Ollama tag list with a 2-second timeout and reports `configured`, `reachable`, and `model_available` separately, so the interface names the exact missing step.
- **Timeouts and retries:** per-call timeout is 30 s by default (`CIVIC_BRIDGE_OLLAMA_TIMEOUT` overrides, 240 s in Docker). Translation retries once on a fast malformed response.
- **Data boundary:** source text is sent only to the configured Ollama URL, which defaults to `127.0.0.1`. No hosted provider is contacted.

### 5.5 External network access

The application itself makes no outbound requests except to Ollama and, for *Explain a source*, to a URL the user supplies. The browser contacts:

| Service | Purpose | When |
|---|---|---|
| unpkg (Leaflet) and OpenStreetMap tiles | Country/area selection map | Area picker only |
| OpenStreetMap Nominatim | Reverse geocoding of browser location to a country | First visit with location permission |

Everything else operates offline. Text and JSON responses are gzip-compressed when the browser accepts it (`send_bytes`): the application script goes from 208 KB to 54 KB and the bootstrap payload from 1 MB to 97 KB, which matters on metered mobile data.

## 6. API reference

All endpoints return JSON. Mutating endpoints identify the account by a session `token` in the request body; community endpoints also take `country` because reference record ids repeat across countries.

**Accounts**

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | `username`, `password`, `display_name`, `role` (`resident` / `office`) → `token`, `user` |
| POST | `/api/auth/login` | `username`, `password` → `token`, `user` |
| POST | `/api/auth/logout` | Invalidate a `token` |
| GET | `/api/auth/me?token=` | Current account, or 401 |

**System**

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/ai-status` | Ollama configuration, reachability, model availability, runtime |
| GET | `/api/session` | Account mode, role labels, number of registered accounts |
| GET | `/api/bootstrap` | Product configuration, country contexts, localities, saved drafts |
| GET | `/api/dashboard` | Area metrics |
| GET | `/api/localities` | Pilot areas |

**Records and community**

| Method | Path | Description |
|---|---|---|
| GET | `/api/records?q=` | Search records |
| GET | `/api/records/{id}` | One record (country-resolved) |
| GET | `/api/records/{id}/community` | Comments, vote totals, caller's votes, perspectives |
| POST | `/api/records/{id}/vote` | Toggle `helpful` or `needs-clarity` |
| POST | `/api/records/{id}/comments` | Add a comment (`anonymous`, `persona` optional) |
| POST | `/api/records/{id}/perspectives` | Add a resident perspective (`anonymous`, `persona` optional) |
| POST | `/api/records/{id}/translate` | Translate a record |
| POST | `/api/share` | Record a simulated share |

**Issues, news, representatives**

| Method | Path | Description |
|---|---|---|
| GET | `/api/issues` | Issue tracker |
| GET | `/api/news` | News items |
| GET | `/api/representatives` | Offices for the area |
| GET | `/api/representatives/stats?country=` | Live activity statistics and replies for every office of a country |
| GET | `/api/representatives/{id}?country=` | Office profile with statistics and responses |
| POST | `/api/representatives/{id}/response` | Post a right of reply (office account) |

**Feedback and sources**

| Method | Path | Description |
|---|---|---|
| POST | `/api/feedback/draft` | Structured reviewable draft (model or template) |
| POST | `/api/feedback` | Send a question to the record's responsible office (public; `anonymous`, `persona` optional; signed-in) |
| GET | `/api/feedback?token=` | The caller's sent questions, each with `office_replied` |
| POST | `/api/sources/explain` | Text, URL, or base64 PDF → new record |
| POST | `/api/profile/interpret` | Free-text description (any language) → `interests` (controlled topic ids) + `understood` sentence; model or keyword fallback |
| POST | `/api/profile/interests` | Save a signed-in account's edited topics (drives group membership) |
| GET | `/api/groups?country=` | Member count and post count per topic |
| GET | `/api/groups/{topic}?country=` | One group: count, localities, posts |
| POST | `/api/groups/{topic}/posts` | Post to a group (`anonymous`, `persona`) |
| POST | `/api/voice/transcribe` | Deterministic sample transcript |

**Public Information Portal**

| Method | Path | Description |
|---|---|---|
| GET | `/publisher` | Portal page |
| GET | `/api/publisher/notices` | Published notices |
| POST | `/api/publisher/notices` | Publish a notice (office account; becomes record, issue, and news item) |

## 7. Repository structure

```
app.py                         Server, data model, country contexts, accounts, persistence, AI client
seed_data.py                   First-run seeding: accounts, notices, comments, votes, replies
render.yaml                    One-click deployment blueprint for Render
data/state.json                Persisted platform state (created at first start, git-ignored)
run_demo.sh                    Launcher (PYTHON, PORT, PRODUCT_NAME)
Dockerfile                     Application image (python:3.12-slim)
docker-compose.yml             Application + Ollama + model pull
docker-compose.gpu.yml         NVIDIA GPU overlay for Linux
public/
  index.html                   Resident application shell
  publisher.html               Public Information Portal shell
  static/app.js                Resident application (views, i18n, speech, polling)
  static/publisher.js          Portal logic
  static/styles.css            Resident application styles
  static/publisher.css         Portal styles
  static/images/               Office portraits
docs/
  ACCOUNTS.md                  Demo and seeded office accounts
  DATA_PIPELINE.md             Ingestion design and feed contract
  COUNTRY_SOURCE_PACK.md       Reference public documents per country
```

## 8. Licence

To be confirmed.
