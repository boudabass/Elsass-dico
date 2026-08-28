# Handoff: Elsass Dico — Mobile App UI

## Overview
Mobile app design for **Elsass Dico**, the Français ⇄ Alsacien dictionary. Covers 16 screen states across 13 flows: search/home (+ empty state), word entry detail, A–Z browse (+ empty-letter state), report-an-error (forum redirect), login, first-login/set-password (valid + expired link), 3 role variants of the contributor/profile space, propose-a-word form, "Mes contributions" (+ empty state), and a generic loading/skeleton pattern. Navigation is header-icon based (Search / Dictionnaire / Compte icons in the top bar) rather than a bottom tab bar; secondary/task screens (entry detail, report, login, first-login, propose-a-word, mes contributions) use a stack header (back-chevron or close-X + centered title, no root nav icons).

## About the Design Files
The bundled file (`Elsass Dico Mobile.dc.html`) is a **design reference built in HTML** — a static, high-fidelity mockup of 6 phone screens side by side, not production code to copy directly. The task is to **recreate these screens pixel-faithfully inside the target codebase's existing environment**.

**Target codebase**: the attached `Elsass_dico` repo is a Next.js 15 (App Router) + Tailwind + shadcn/ui web app (Supabase backend). It has **no native/mobile app scaffold today** — only a responsive web UI (`src/app/page.tsx`, `src/app/entree/[id]/page.tsx`, etc.). Two implementation paths, pick based on the team's goals:
- **Mobile-responsive web** (fastest, reuses existing Next.js/Supabase/shadcn stack, existing server actions in `src/app/actions/*`): build these 6 screens as new responsive routes/components inside the existing app, replacing the current desktop-oriented layout at narrow widths.
- **Native/PWA wrapper** (React Native, Capacitor, or installable PWA): if a true native app is wanted, scaffold that separately and call the existing Supabase backend / port the server actions to client-callable APIs.
If unsure which, ask the product owner before starting — it changes the file structure significantly.

## Fidelity
**High-fidelity.** Colors, type, spacing, and copy are final and grounded in the project's design system (see Design Tokens) and real dictionary data pulled from the repo (`Dictionnaire/A/mots.json`, `Dictionnaire/B/mots.json`, `documentation/01-PRD.md`). Recreate pixel-faithfully; do not restyle.

## Screens / Views

All screens share a phone frame 402×874 (iPhone-class viewport), status bar clearance of 54px at the top, and a common header pattern:
- **Header bar**: 54px top padding (status bar clearance) + content row, height ~56px total, `border-bottom: 1px solid var(--border-subtle)`, background white, `padding: 0 16px`, flex row `justify-content: space-between; align-items: center`.
- **Leading slot**: either the wordmark ("Elsass Dico" in Azimut, 20px, `--red-500`) on root/tab screens, a 40×40 circular back-chevron button (`--ink-900` chevron, `--gray-100` bg) on stack screens, or a close-X button on modal/task screens (report error).
- **Trailing slot** (tab-root screens only — Search, Dictionnaire, Mon espace): 3 icon buttons, 40×40 circular, `gap: 6px`. The icon matching the current screen gets `background: var(--red-50)` and `stroke: var(--red-500)`; the other two are `stroke: var(--gray-400)`, transparent background. Icons (Lucide-style, 20×20, stroke-width 2): search (circle+diagonal line), book (two open pages), user (circle head + shoulder arc).

### 1. Recherche (Home / Search)
- **Purpose**: primary entry point — free-text search, bidirectional FR/ALS.
- **Layout**: header (wordmark left, 3 nav icons right, search icon active) → scrollable body, `padding: 20px 16px 32px`.
- **Components**:
  - Greeting: "Salut !" — 800 weight, 21px, `--ink-900`.
  - Subtext: "Cherche un mot, français ou alsacien." — `--text-sm`, `--text-secondary`.
  - Search pill: 48px tall, `border-radius: 999px`, `border: 1px solid var(--border-default)`, white bg, search icon (`--gray-400`) + typed value "à pied" (600 weight, 16px, `--ink-900`).
  - ORTHAL character row: wrapping row of 36×36 chips (`à ì ü ù ë ö ä œ`), `border-radius: 8px`, `border: 1px solid var(--border-subtle)`, `background: var(--gray-0)`, 600/15px text, `gap: 6px`.
  - Section label "Résultats" — 700/12px, uppercase, `letter-spacing: .06em`, `--text-muted`.
  - Result cards (×2), `border: 1px solid var(--border-subtle)`, `background: var(--surface-card)`, `border-radius: var(--radius-md)`, `padding: 14px`, `margin-bottom: 10px`:
    - Card 1: "aller à pied" (700/16px) + "expression" type label (12px muted) → "z'Füass geh" (700/18px) → pill badge "Alsacien unifié" (`background: var(--gold-50)`, `color: var(--gold-700)`, 12px/600).
    - Card 2: "à" (700/16px) + "mot" label → "z'füass" (700/18px) → note "aussi : ze fös (à pied), ze Schtrosburi" (`--text-sm`, `--text-secondary`).

### 2. Fiche de mot (Entry detail)
- **Purpose**: full detail for one dictionary entry — all translation variants, canonical form, provenance.
- **Layout**: header (back chevron left, 3 nav icons right, search active) → body `padding: 18px 16px 32px`.
- **Components**:
  - Title "à" — 800/32px `--ink-900`; subtitle "mot" — `--text-sm` `--text-muted`.
  - Translation list, `gap: 10px`:
    - Canonical card (index 0): `border: 1px solid var(--gold-500)`, `background: rgba(182,132,31,0.07)`, `border-radius: var(--radius-md)`, `padding: 14px`. Text "z' comme z'Mehlhüsa" (700/20px `--ink-900`) + crown badge "Canonique" (`background: var(--gold-500)`, `color: var(--ink-900)`, 700/12px, pill).
    - 3 plain variant cards (600/17px `--ink-900`, `border: 1px solid var(--border-subtle)`, white bg): "ze Schtrosburi", "z'füass", "ze fös (à pied)".
  - Attestations card: shield-check icon (`--gold-700`) + "3 attestations" (700/14px); source list (`--text-sm` links): "Dictionnaire Grasser (1961)", "Norme ORTHAL 2023 — AGATE".
  - Action row: "Copier" (outline button, 1px `--border-strong`, 44px tall, flex:1) + "Signaler" (ghost, `color: var(--red-500)`, flag icon, flex:1).

### 3. Dictionnaire A–Z (Browse)
- **Purpose**: alphabetical browse of the full dictionary.
- **Layout**: header (title "Dictionnaire" left, 3 nav icons right, book active) → alphabet rail (horizontal scroll, `padding: 12px 16px 4px`, `border-bottom: 1px solid var(--border-subtle)`) → scrollable grouped list.
- **Components**:
  - Alphabet chips: 32×32 circles, `border-radius: 999px`, 700/13px. Active letter (B): `background: var(--red-500)`, white text. Available-but-inactive (A, C, D): `background: var(--gray-100)`, `color: var(--gray-400)`. Not-yet-populated (E, F…): no background, `color: var(--gray-300)`.
  - Letter section header: 800/26px `--ink-900`, `padding: 16px 0 8px` (subsequent groups get `border-top: 1px solid var(--border-subtle)` + `margin-top: 8px`).
  - List rows (52px-ish, `padding: 12px 0`, `border-bottom: 1px solid var(--border-subtle)` except last in group): word + optional article in muted parenthetical (600/16px `--ink-900`, article 400/muted) on top, translation preview below (`--text-sm` `--text-secondary`); trailing chevron-right (`--gray-300`).
  - Data shown — Group B: "baba (être)" → "baff schteh"; "baba (le)" → "d'r Rossinlaküacha"; "bagou (le)" → "d' Zungafärtikait"; "bague (la)" → "d'r Reng". Group A: "à" → "z'füass".

### 4. Signaler une erreur (Report → forum redirect)
- **Purpose**: point the user to the community forum for corrections/discussion — **no in-app vote or free-text form**. Revised from an earlier draft: anonymous in-app submission isn't backend-feasible yet, so this screen redirects instead of collecting input.
- **Layout**: modal-style header (close-X left, centered title "Signaler une erreur", no nav icons) → body `padding: 20px 16px 32px`.
- **Components**:
  - Context strip (unchanged): `background: var(--gray-50)`, `border: 1px solid var(--border-subtle)`, `border-radius: var(--radius-md)`, `padding: 12px 14px`, text "Segment concerné : **à pied → z'füass**".
  - Explanatory text: "Les signalements et propositions de correction se discutent sur le forum du dictionnaire, pas directement dans l'app." (`--text-base`/1.6, `--text-secondary`).
  - Secondary outline button, full width, 44px, clipboard icon: "Copier le segment" — copies the segment text to the clipboard for pasting into the forum post.
  - Primary CTA, full width, DS `Button variant="primary" size="lg"`: "Ouvrir le forum du dictionnaire ↗" — opens `https://www.theelsassisch.com/forum/dictionnaire-2` in a new tab.
  - Note below the CTA: "Ça quitte l'app et ouvre theelsassisch.com dans un nouvel onglet." (`--text-xs`, `--text-muted`, centered).

### 5. Connexion (Login)
- **Purpose**: auth entry point for contributors.
- **Layout**: header (back-chevron left, centered title "Connexion", no nav icons) → centered body `padding: 32px 24px`.
- **Components**:
  - Wordmark "Elsass Dico" (Azimut, 26px, `--red-500`, centered).
  - Heading "Heureux de te revoir" (800/22px, centered) + sub "Connecte-toi pour contribuer au dictionnaire." (`--text-sm` `--text-secondary`, centered).
  - Two DS `Input` fields: "Adresse email" (placeholder `toi@example.com`) and "Mot de passe" (placeholder `••••••••`, type password), `margin-bottom: 14px` between them.
  - Right-aligned link "Mot de passe oublié ?" (`--text-sm`).
  - DS `Button variant="primary" size="lg"` full-width "Se connecter".
  - Divider "ou" (`--text-xs` `--text-muted`, centered).
  - DS `Button variant="outline" size="lg"` full-width "Créer un compte".
  - Footer note "En continuant, tu acceptes nos conditions." (`--text-xs` `--text-muted`, centered).

### 6. Mon espace (Profile) — 3 role variants
Content differs by role; all three share the header (title "Mon espace" left, 3 nav icons right, user/account active) and identity row (52×52 avatar `background: var(--ink-900)`, white initials, 700/17px + name 700/17px).

**6a — Lecteur (reader)**: identity row with a plain gray "Lecteur" pill (`background: var(--gray-100)`, `color: var(--gray-600)`, no icon) — no stats, no arbitration, no history. Below it, a single card (`border: 1px solid var(--border-subtle)`, `border-radius: var(--radius-md)`, `padding: 16px`): heading "Envie de compléter le dictionnaire ?" (700/15px) + body "Deviens contributeur pour proposer des mots et voter sur les traductions de la communauté." (`--text-sm` `--text-secondary`) + full-width DS `Button variant="primary"` "Devenir contributeur". Then "Se déconnecter" ghost button.

**6b — Contributeur**: identity row with gold "Contributeur" pill (pen icon, `background: var(--gold-50)`, `color: var(--gold-700)`). Stats grid: 3 equal columns (`border: 1px solid var(--border-subtle)`, `border-radius: var(--radius-md)`, `padding: 10px`, centered) — big number (800/19px) + label (`--text-xs` `--text-muted`): "12 propositions", "34 votes", "3 promotions". **No "À arbitrer" section** — arbitration/promotion is admin-only. "Mes dernières contributions": 2 rows, contribution text (600/15px) + status pill "Validée" (`--success-100`/`--success-500`) or "En attente" (`--warning-100`/`--warning-500`). "Se déconnecter" ghost button.

**6c — Admin**: identity row with solid dark "Admin" pill (shield icon, `background: var(--ink-900)`, white text). Same stats grid as 6b, **plus** the "À arbitrer" section (uppercase 700/12px label + card: word context "bagou (le)" muted → current canonical row "d' Zungafärtikait" + gold "Canonique" pill → divider → alternate variant "d' Grosschnurra" + "Promouvoir" outline button, 32px). Same "Mes dernières contributions" and "Se déconnecter" as 6b.

### 7. Proposer un mot (Propose / edit a word)
- **Purpose**: crowdsourced word submission (PRD §4.4), reached from "Mon espace" → "Proposer un mot".
- **Layout**: stack header (back-chevron left, centered title, no nav icons) → body `padding: 20px 16px 32px`.
- **Two states, same fields** — only title/CTA/cancel differ:
  - **Create**: title "Proposer un mot", primary CTA "Proposer", no cancel link.
  - **Edit**: title "Modifier la contribution", primary CTA "Enregistrer", plus a secondary "Annuler" text link/button below the CTA.
- **Components**:
  - Intro text: "Écris l'alsacien comme tu le prononces : la mise en graphie ORTHAL se fait à l'arbitrage." (`--text-sm`, `--text-secondary`).
  - Field "Français" (required, marked with `--red-500` asterisk) — bordered input box, `border: 1px solid var(--border-default)`, `border-radius: var(--radius-sm)`, 46px tall, placeholder "ex : bagou".
  - Field "Alsacien" (required, same styling) — placeholder "ex : d' Zungafärtikait".
  - Field "Type" — select, same box styling + chevron-down icon; options: mot / expression / toponyme / prénom (default "Mot").
  - Field "Secteur" (optional) — select, same styling; options: Bas-Rhin / Haut-Rhin / non précisé (default "Non précisé").
  - Field "Contexte" (optional) — text input, placeholder "ex : le fruit" (disambiguates homonyms).
  - Field labels: 600/13px `--ink-900`; optional fields get a `(optionnel)` suffix in `--text-muted`/400 weight.
  - Primary CTA: full-width DS `Button variant="primary" size="lg"`.

### 8. Mes contributions (My contributions)
- **Purpose**: track own proposals and review peers' pending proposals (PRD §4.4 crowdsourcing/moderation loop).
- **Layout**: stack header (back-chevron left, centered title "Mes contributions", no nav icons) → scrollable body in two sections, `padding: 18px 16px 32px`.
- **Section 1 — "Mes propositions"** (uppercase 700/12px label): one card per own proposal, `border: 1px solid var(--border-subtle)`, `background: var(--surface-card)`, `border-radius: var(--radius-md)`, `padding: 14px`:
  - Line 1: "français → alsacien" (700/16px `--ink-900`).
  - Line 2: type + contexte (`--text-sm`, `--text-secondary`).
  - Line 3: score "X/5 confirmations" (700/14px `--ink-900`, **not** a publication status) on the left; on the right, either:
    - Two 32×32 icon buttons (edit pencil on `--gray-100`, delete trash on `--red-50`/`--red-500`) — while still editable, **or**
    - A locked pill "Retenue dans une entrée" (lock icon, `background: var(--gray-100)`, `color: var(--gray-600)`) if the proposal already founded a published entry (frozen, non-editable).
  - Example data: "bagou → d' Grosschnurra" (2/5, editable) and "bague → d'r Reng" (5/5, locked/retenue).
  - **Delete confirmation modal**: centered overlay dialog, `background: rgba(17,17,17,0.45)` backdrop, white card `border-radius: var(--radius-lg)`, `padding: 20px`. Title "Supprimer « [français] » ?" (800/18px). Body: "Ta proposition « [alsacien] » quitte la file de validation avec les confirmations reçues. Tu pourras la reproposer, mais son score repart de zéro." (`--text-sm`/1.5, `--text-secondary`). Two 44px buttons: "Annuler" (outline, `--border-strong`) / "Supprimer" (filled `--red-500`, white text).
- **Section 2 — "À valider"** (peer proposals): same card shape, but line 2 shows the author's name instead of "own" context, and the right-side control is a single button:
  - Not yet voted: outline button "Confirmer" (`border: 1px solid var(--border-strong)`, transparent bg).
  - Already voted: filled button "Confirmé" (`background: var(--success-500)`, white text, no border) — visually distinct filled-vs-outline state.
  - Example data: "baba → baff schteh" by Marie K. (3/5, not yet confirmed) and "à → ze fös (à pied)" by Thomas H. (5/5, confirmed).

### 9. Première connexion — définir un mot de passe (2 states)
- **Purpose**: onboarding entry point for a contributor who received an invite link handed out manually by an admin (this project has no automatic invite email). Arrival screen — no back button.
- **Layout**: no header bar, just status-bar clearance (54px) then centered body `padding: 24px`.
- **State A — valid link** (cap "9"): wordmark (Azimut, 26px, `--red-500`, centered) → heading "Définir ton mot de passe" (800/22px, centered) → subtext "Choisis le mot de passe qui te servira à te connecter." (`--text-sm` `--text-secondary`, centered) → DS `Input` "Mot de passe" (password) → helper "8 caractères minimum." (`--text-xs` `--text-muted`) → DS `Input` "Confirmer le mot de passe" (password) → full-width DS `Button variant="primary" size="lg"` "Enregistrer".
- **State B — expired link** (cap "9b"): centered, no form/CTA at all — a muted broken-link icon (34–40px, `--gray-400`) → heading "Lien expiré" (800/22px) → body "Ce lien n'est plus valide. Demande à un administrateur de t'en générer un nouveau." (`--text-sm`/1.5, `--text-secondary`).

## Empty & loading states
A static mockup never shows these by default — drawn explicitly here as dedicated screens:
- **10 — Recherche, aucun résultat**: same header/search-pill/ORTHAL-chip layout as screen 1, query "flouzedibulle" (a made-up French-side query, not an invented Alsatian translation). Below the chips: centered empty state — crossed-out search icon (34px, `--gray-300`) → "Aucun résultat pour « flouzedibulle »." (700/16px) → "Ce mot n'est pas encore dans le dictionnaire." (`--text-sm` `--text-secondary`) → discreet link "Proposer ce mot →" (600/`--text-sm`, `--red-500`) — **only shown when logged in**, per the brief.
- **11 — Dictionnaire, lettre vide**: same header/alphabet-rail as screen 3, letter "C" active (red pill) with no entries. Body: letter header "C" (800/26px) → centered empty state — muted book icon (30px, `--gray-300`) → "Aucune entrée validée pour la lettre C pour l'instant." (700/15px) → "De nouveaux mots arrivent chaque semaine." (`--text-sm` `--text-secondary`).
- **12 — Mes contributions, vide**: same header as screen 8. Each section ("Mes propositions", "À valider") replaced by a dashed-border placeholder card (`border: 1px dashed var(--border-default)`, `border-radius: var(--radius-md)`, `padding: 22px 16px`, centered): "Aucune proposition pour l'instant." + link "Proposer un mot →" for the first section; "Rien à valider pour l'instant." (no link) for the second.
- **13 — Chargement (pattern générique)**: reusable list-loading skeleton — 5 stacked rows, each a title bar (~50–62% width, 15px tall) + subtitle bar (~30–40% width, 11px tall), both `border-radius: 4px`, `background: var(--gray-200)`, separated by `border-bottom: 1px solid var(--border-subtle)`. Bars pulse via a shared `.skel` class (`@keyframes skelPulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }`, 1.4s ease-in-out infinite). Apply this same row shape to any list screen (search results, browse list, contributions) while its data is loading.

## Interactions & Behavior
This pass is a **static mockup** — no wired interactivity was built. Expected real behavior to implement:
- Search (screen 1): debounced (~250ms) live search as the user types, same pattern as the existing web app's `rechercherAction` in `src/app/actions/recherche.ts` — reuse or adapt this action.
- ORTHAL character chips: tapping inserts the character into the search field at the cursor.
- Result card tap → navigate to Entry detail (screen 2), same data shape as `chargerEntree()` in `src/app/actions/recherche.ts`.
- Entry detail "Signaler" → opens screen 4 (Report), passing the segment/entry context.
- Report screen vote buttons: single-select toggle (Oui XOR Non); submits to the feedback/contributions pipeline (`src/app/actions/contributions.ts`).
- Alphabet rail (screen 3): tapping a letter scrolls/loads that letter's group; letters with no data yet (E onward, until more `Dictionnaire/<letter>` folders are ingested) are disabled.
- Login → on success, navigate to screen 6 (Mon espace); reuse `src/app/actions/auth.ts`.
- "Promouvoir" button (screen 6): promotes the tapped variant to index 0 / canonical for that entry — mirrors the "Promouvoir" flow in `documentation/06-INTERFACE-UI-PUBLIC.md` §5, backed by `src/app/actions/arbitrage.ts`.
- Header nav icons (search/book/user): standard tab-style navigation — switch root screen, no back stack.
- Screen 7 (Proposer un mot): submits to the existing `/contributions` pipeline — reuse/adapt `src/app/actions/contributions.ts`. Same form serves create and edit; edit mode is entered from a "Modifier" tap on screen 8 and pre-fills all fields from the existing proposal.
- Screen 8 (Mes contributions): "Confirmer" tap registers the current user's vote for a peer proposal and flips the button to the filled "Confirmé" state (increments the X/5 score elsewhere in the list). Delete (trash icon) opens the confirmation modal shown in the mockup; confirming removes the proposal and its accumulated confirmations, resetting its score to 0 if reproposed. A proposal that already founded a published dictionary entry becomes frozen (locked pill, no edit/delete) — mirrors the arbitration rule in `documentation/06-INTERFACE-UI-PUBLIC.md`. Empty state (screen 12) shows when both lists are empty.
- Screen 4 (Signaler): "Copier le segment" writes the segment text to the clipboard (Web Clipboard API); "Ouvrir le forum du dictionnaire" opens `https://www.theelsassisch.com/forum/dictionnaire-2` in a new tab/browser — no in-app submission.
- Screen 9 (Première connexion): token from the invite link is validated on load — expired/invalid → state B (screen 9b, dead end, no retry in-app); valid → state A form; on submit, sets the password and signs the user in, landing on screen 6b (Contributeur) or 6c (Admin) depending on their assigned role.
- Screen 6 role variants: which of 6a/6b/6c renders is driven purely by the authenticated user's role (`lecteur` / `contributeur` / `admin`) from `useAuth()` — same route, conditional sections.
- Loading skeleton (screen 13): show while a list request (search, browse, contributions) is in flight; swap for the real rows or the matching empty state (10/11/12) once it resolves.

## State Management
- Search: query string, debounce timer, loading flag, results array — mirrors `AccueilPage` in `src/app/page.tsx` (`terme`, `recherche`, `resultats`, `aCherche` state).
- Entry detail: loaded entry object (translations array, sources, nb_attestations) — mirrors `chargerEntree()` return shape.
- Report: selected vote (up/down/none), free-text correction field, submission status (idle/sending/sent/error).
- Login: email, password, submit status, error message.
- Contributor profile: user/role (`useAuth()` pattern already in the repo, `src/components/auth-provider.tsx`), stats, arbitration queue items, contribution history — needs new server actions/queries if not already present.
- Propose/edit form (screen 7): mode flag (create/edit), field values (français, alsacien, type, secteur, contexte), validation state (français + alsacien required), submit status.
- Mes contributions (screen 8): own-proposals list (with score, locked flag), peer-proposals list (with author, score, voted flag), delete-confirmation modal open/target state; empty-list flags per section (screen 12).
- Search (screen 10) and browse (screen 11): a distinct "no results" / "empty letter" boolean derived from an empty response, separate from the loading flag.
- First login (screen 9): invite-token validity (valid/expired), password + confirm-password fields, client-side match/length validation, submit status.
- Any list screen: a `status: 'loading' | 'empty' | 'ready' | 'error'` flag selecting between skeleton (13), the screen-specific empty state (10/11/12), and the populated list.

## Design Tokens
Colors (from `_ds/.../tokens/colors.css`):
- `--red-500 #a7070d` (primary brand), `--red-700 #6e0407` (hover/pressed), `--red-50 #fbeaeb` (light tint)
- `--gold-500 #b6841f` (secondary brand, background/pill fills only — never as text on white below `--gold-700`), `--gold-50 #fbf3e1`, `--gold-700 #704e12` (accessible text tint)
- `--ink-900 #111111` (primary text), `--gray-400 #a79d98` (muted icon/text), `--gray-300 #cfc7c3`, `--gray-100 #f1eeec`, `--gray-50 #faf8f7`, `--gray-0 #ffffff`
- `--border-subtle #e4dfdc`, `--border-default #cfc7c3`, `--border-strong #111111`
- `--success-500 #2f7d4f` / `--success-100 #dff1e6`, `--warning-500 #c77c1f` / `--warning-100 #f7e8d2`

Typography (from `tokens/typography.css`):
- Display: `--font-display: 'Azimut', Georgia, serif` — wordmark/logo only, never body text.
- Body/UI: `--font-body: 'Archivo', -apple-system, sans-serif`.
- Scale used: 12px (labels), 13–15px (secondary/buttons), 16–18px (body/list titles), 19–22px (headings), 26–32px (display numbers/big titles).
- Weights: 400 regular, 600 semibold (most UI labels), 700 bold, 800 black (headings/big numbers).

Spacing/radius (from `tokens/spacing.css` / `effects.css`):
- `--radius-sm: 4px` (inputs/textarea), `--radius-md: 8px` (buttons/cards), pill = `999px` for badges/chips/search field.
- Card padding 14px; section padding 16–20px horizontal; row gaps 6–10px.

## Assets
- `assets/logo.webp` — primary Elsass Dico / The Elsassisch wordmark lockup (not directly placed in these 6 screens, but available for splash/login refinement).
- `Azimut-Regular.otf` — brand display font, loaded via `@font-face` in the DS bundle (`tokens/fonts.css`); already present in the target repo at `src/app/fonts/Azimut-Regular.otf`.
- Icons: inline SVG, hand-drawn Lucide-style (stroke, 2px weight) — search, book, user, chevron-left, close-X, crown, shield-check, thumbs-up/down, flag, chevron-down, pencil, trash, lock. No icon library file is bundled; recreate with Lucide React (`lucide-react`, already a dependency in the target repo) using the equivalent icons: `Search`, `BookOpen`, `User`, `ChevronLeft`, `X`, `Crown`, `ShieldCheck`, `ThumbsUp`/`ThumbsDown`, `Flag`, `ChevronDown`, `Pencil`, `Trash2`, `Lock`.

## Files
- `Elsass Dico Mobile.dc.html` — the full 6-screen mockup (source of truth for this handoff; open in a browser to view/inspect).
- `ios-frame.jsx` — device-bezel component used only to present the mockup at phone scale; **not part of the app itself**, purely presentational scaffolding for this design pass.
- Reference data/logic already in the target repo (not duplicated here — read directly): `src/app/page.tsx`, `src/app/entree/[id]/page.tsx`, `src/app/actions/recherche.ts`, `src/app/actions/contributions.ts`, `src/app/actions/arbitrage.ts`, `src/app/actions/auth.ts`, `src/components/auth-provider.tsx`, `src/app/globals.css` (existing web color tokens — the mobile screens use the newer DS token names above instead), `documentation/01-PRD.md`, `documentation/06-INTERFACE-UI-PUBLIC.md`.
