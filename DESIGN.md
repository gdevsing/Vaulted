# Design

Vaulted uses a single permanent theme called **Midnight Coral**. There is no light mode, no toggle, no theme switching. The design decisions are made once and held consistently across every screen.

---

## Principles

**Contrast over decoration.** Every element earns its place. If something doesn't carry information, it doesn't exist.

**Colour is semantic.** Coral means active, interactive, or important. Green means positive or enabled. Red means negative or destructive. Asset colours (blue, green, purple, orange) always mean the same asset class everywhere.

**Asymmetric cards.** Cards have `border-radius: 3px 20px 20px 3px` — a sharp left edge, a rounded right. The sharp left edge creates vertical rhythm when cards stack. The rounded right softens the layout.

**Toggles are outlined. Actions are filled.** A button that represents state uses an outline. A button that triggers something uses a filled background. This distinction is applied everywhere without exception.

---

## Colour

### Base palette

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0F0F0F` | Page background |
| `--surface-solid` | `#1A1A1A` | Card backgrounds |
| `--ink` | `#F0F0F0` | Primary text |
| `--ink2` | `#6A6A6A` | Secondary text, labels, metadata |
| `--ink3` | `#1E1E1E` | Disabled backgrounds |
| `--border` | `rgba(255,255,255,0.07)` | Card and input borders |
| `--border-strong` | `rgba(255,255,255,0.12)` | Emphasis borders |

### Accent

| Token | Value | Usage |
|---|---|---|
| `--gold` | `#FF4757` | Coral — primary accent, active states, logo needle |
| `--gold-dark` | `#C03040` | Coral dark — gradient endpoint |

> The `--gold` token is named for historical reasons. Its value is coral, not gold.

### Semantic

| Token | Value | Usage |
|---|---|---|
| `--positive` | `#7DD68A` | Gains, enabled states, ON buttons |
| `--negative` | `#E87070` | Losses, errors, destructive actions |

### Asset classes

These colours are fixed. They represent asset classes consistently across the dashboard donut, account card borders, allocation pills, and the trends breakdown chart.

| Asset | Colour | Hex |
|---|---|---|
| Cash | Blue | `#60A5FA` |
| Shares | Green | `#4ADE80` |
| Crypto | Purple | `#C084FC` |
| Super | Orange | `#FB923C` |

### Hero card gradient

The net worth hero card on Dashboard and Milestones uses:

```css
background: linear-gradient(135deg, #FF6B6B 0%, #FF4757 55%, #C0392B 100%);
```

Two decorative circles sit top-right:

```css
/* Large circle */
position: absolute; top: -50px; right: -50px;
width: 180px; height: 180px; border-radius: 50%;
background: rgba(255,255,255,0.07);

/* Small circle */
position: absolute; top: -10px; right: 50px;
width: 90px; height: 90px; border-radius: 50%;
background: rgba(255,255,255,0.04);
```

---

## Typography

Three typefaces, each with a distinct role.

| Font | Role | Usage |
|---|---|---|
| **Audiowide** | Display | VAULTED wordmark, net worth amounts, page titles, milestone numbers |
| **JetBrains Mono** | UI | All labels, metadata, navigation, buttons, form inputs, badges |
| **Cormorant Garamond** | Accent | Italic subtitles, serif flourishes, target labels |

### Scale

| Name | Size | Font | Usage |
|---|---|---|---|
| Display | 28–38px | Audiowide | Net worth hero |
| Title | 17–18px | Audiowide | Page headings |
| Card title | 14px | Audiowide | Card section headers |
| Body | 10–11px | JetBrains Mono | Account names, values |
| Label | 7–9px | JetBrains Mono | Eyebrows, metadata, nav |
| Micro | 6–7px | JetBrains Mono | Badges, currency, timestamps |
| Serif accent | 12–13px | Cormorant Garamond italic | "of $500,000 target", subtitles |

---

## Components

### Cards

```css
border-radius: 3px 20px 20px 3px;
background: var(--surface);        /* gradient surface */
border: 1px solid var(--border);
padding: 18px 20px;
```

Cards do not have left border accents — that space is reserved for account cards where the left border communicates asset class.

**Account cards** use a `2.5px` left border in the asset colour:
- Cash → `#60A5FA`
- Shares → `#4ADE80`
- Crypto → `#C084FC`
- Super → `#FB923C`

### Inputs

```css
background: rgba(255,255,255,0.04);
border: 1px solid var(--border);
border-radius: 2px 9px 9px 2px;
color: var(--ink);
font-family: var(--font-mono);
```

Focus state adds `border-color: var(--gold)` and a subtle coral glow.

### Navigation

Bottom navigation bar with 5 items: HOME, SYNC, TRENDS, GOALS, ADMIN.

- Active item: `var(--gold)` coral colour
- Inactive: `var(--ink2)` grey
- No background pill or indicator — colour only

### Logo

The logo is a clock dial: outer ring, inner ring, 12 o'clock tick mark, and a needle pointing to the 10 o'clock position (−60° from 12). The needle and centre dot are `#FF4757` coral. The ring and tick are `#F0F0F0`.

The VAULTED wordmark sits to the right in Audiowide.

---

## Button grammar

Two categories. Applied without exception throughout the app.

### Toggles — represent state

Outline only. Never filled. The outline colour communicates the active state.

```
Active:   border rgba(255,71,87,0.5) + bg rgba(255,71,87,0.12) + text var(--gold)
Inactive: border var(--border)       + bg transparent           + text var(--ink2)
```

**Used for:** owner tabs (COMBINED/GURDEV/JASMINE/JOINT), asset filter tabs (ALL/CASH/SHARES/CRYPTO/SUPER), time range filters (1M/3M/6M/1Y/ALL), view toggles (NET WORTH/BREAKDOWN), sync mode tabs (MANUAL/SCREENSHOT/NO CHANGE), restore mode tabs (GITHUB/UPLOAD), owner ON/OFF.

### Actions — trigger something

Filled or strongly outlined. The fill weight communicates importance.

| Type | Background | Border | Text | Examples |
|---|---|---|---|---|
| Primary | `var(--gold)` | none | `#0C0A08` | SAVE, CONFIRM, DONE, + ADD, RESTORE DATABASE, SAVE BALANCE, ENTER THE VAULT |
| Positive | `rgba(125,214,138,0.12)` | `var(--positive)` | `var(--positive)` | TEST, RUN NOW |
| Destructive | `rgba(232,112,112,0.12)` | `var(--negative)` | `var(--negative)` | DELETE, REMOVE |
| Secondary | `transparent` | `var(--border)` | `var(--ink2)` | CANCEL, SKIP |
| Caution | `transparent` | `rgba(255,71,87,0.5)` | `rgba(255,71,87,0.9)` | LOGOUT, ? |
| Disabled | `var(--ink3)` | none | `var(--ink2)` | Any action in invalid/loading state |

All action buttons:
```css
border-radius: 2px 9px 9px 2px;
font-family: var(--font-mono);
font-size: 9–11px;
letter-spacing: 0.1em;
```

---

## Spacing

Vaulted uses an informal 8dp grid. Common values:

| Context | Value |
|---|---|
| Page padding | `16–20px` horizontal |
| Card padding | `18px 20px` |
| Gap between cards | `12–16px` |
| Gap within a card | `8–10px` |
| Label to value | `3–4px` |
| Button padding | `8–14px` vertical, `10–32px` horizontal |

---

## Icons

Admin cards each have a unique icon in `var(--gold)`, font-mono 16px, no left border:

| Card | Icon |
|---|---|
| Owner Labels | `⊙` |
| Cron Jobs | `⟳` |
| ntfy connected | `◈` |
| Biometric Lock | `⌖` |
| Restore Database | `↺` |
| Gemini AI | `✦` |
| ntfy.sh Notifications | `◎` |
| GitHub Backup | GitHub SVG mark |
| App Settings | `⚙` |

Navigation icons use the same mono character style:

| Section | Icon |
|---|---|
| Home | `◈` |
| Sync | `↺` |
| Trends | `↝` |
| Goals | `◎` |
| Admin | `⊞` |
