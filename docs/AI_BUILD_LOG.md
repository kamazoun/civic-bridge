# How AI coding tools were used

The idea, the civic framing, the country choices and the product decisions are mine. I used AI coding tools to build, test and iterate the software. This log records how, so the working method can be judged rather than guessed.

## Tools

- **Claude Code** (Anthropic; Claude Opus 5) in the terminal, against this repository, for most of the implementation, browser-driven verification and documentation; later also to lay out the pitch deck from my notes and to edit the demo video (subtitles, zooms, title and closing cards) around my own recording.
- **OpenAI Codex** for earlier passes on the interface.
- **Ollama** with `gemma4` locally as the product's own model (translation, drafts, source explanation, profile interpretation) — not a build tool, but the reason no hosted AI provider is involved.
- **Google Flow** for the representative portraits (fictional people) and the illustration clips in the demo video.

## Working method

Each session followed the same loop: state the outcome wanted in product terms, let the tool read the code and propose the change, apply it, then **verify in a real browser** — Claude Code drove headless Chromium with Playwright, set the area to each country, clicked through the flow, took screenshots and reported console errors — before the change was accepted. Anything that only "looked right in the diff" was not accepted.

Representative sessions, in order:

| Date | Outcome | How AI was used |
|---|---|---|
| 17 Sep | Platform skeleton: records with facts/unknowns, five country contexts, FR/EN interface, Ollama translation, publisher portal | Generated from a written product spec; iterated visually in the browser |
| 18 Sep | Explain a source (text / URL / PDF), read-aloud and dictation, personalisation, README as an engineering document | Model proposed the dependency-free PDF text extraction; the schema-constrained JSON prompts were designed together |
| 19 Sep | Twenty per-country portraits mapped from a Flow export by wardrobe colour; 640 px web versions | Claude Code viewed each image, matched it to its prompt and renamed/resized |
| 20 Sep | Representative statistics computed from platform activity instead of hard-coded numbers | Model audited where numbers came from, proposed the derivation, implemented `representative_stats` |
| 20 Sep | Accounts (PBKDF2, sessions, roles), JSON persistence, `seed_data.py` with ~250 accounts, ~240 notices and ~1,000 comments across five countries | Seed content (notice topics, resident comments, office replies in FR/EN with local neighbourhoods and names) written with the model; volumes and timelines verified against the API |
| 20 Sep | Free-text profession interpreted by the local model into topic weights; life-stage weights | Prompt and schema designed with the model; tested with French, English and Yorùbá inputs |
| 20 Sep | Unknowns become questions addressed to the responsible office; gzip; README opener | Triggered by an independent AI review of the repository that pointed out the claim was not yet wired |
| 20 Sep | Repositioning around the person: free-text profile → visible/editable "what we understood" → fixed weights; "Why am I seeing this?"; anonymous posting; groups by topic × country | I wrote the brief with a second AI session; implemented and browser-verified in this one, including a sensitive-data probe of the interpreter ("moto-taxi driver, Muslim, diabetic" → transport, roads; nothing else echoed) |

## What I did not use the tools for

- Choosing the problem, the tracks, the countries or the institutional hierarchies.
- Recording the demo: the walkthrough and the narration are mine.
- Generating any "real" government content — every record and notice is labelled illustrative.

## Mistakes caught by the loop

Worth recording because they are the reason for the verification step: a phone-number placeholder hard-coded to Togo's dialling code that showed in Lagos; seeded notices that loaded on the server but never rendered on first paint; office replies keyed by level only, so a reply in Togo appeared in Kenya; timestamps generated a few days in the future. All were found by driving the app, not by reading the code.
