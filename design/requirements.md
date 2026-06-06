# Vaulted — Personal Net Worth Tracker
## Product Requirements Document
**Version:** 1.1  
**Date:** May 2026  
**Status:** Draft

---

## 1. Overview

Vaulted is a shared personal net worth tracking web application for a household of two (husband and wife). It aggregates balances across all financial accounts — banking, investments, crypto, and superannuation — into a single dashboard, tracking wealth over time with rich reporting and visualisations.

The app is designed to be hosted on a personal server, used exclusively by two people, with zero ongoing cost.

---

## 2. Goals

- Track total household net worth over time
- Support both automated (screenshot AI) and manual balance entry
- Provide meaningful reporting and trend analysis
- Be simple, guided, and satisfying to use weekly
- Cost absolutely nothing to run

---

## 3. Users

| User | Role |
|------|------|
| Husband | Full access — shared login |
| Wife | Full access — shared login |

Single shared login. No role differentiation. Both users have identical access.

---

## 4. Accounts

### 4.1 Initial Accounts

| Account | Owner | Asset Class | Currency | Update Method | Frequency |
|---------|-------|-------------|----------|---------------|-----------|
| Up Bank | Husband | Cash | AUD | Screenshot / Manual | Weekly |
| NAB | Husband | Cash | AUD | Screenshot / Manual | Weekly |
| ANZ | Husband | Cash | AUD | Screenshot / Manual | Weekly |
| ING | Husband | Cash | AUD | Screenshot / Manual | Weekly |
| Stake ASX | Husband | Shares | AUD | Screenshot / Manual | Fortnightly |
| Stake Wall St | Husband | Shares | USD | Screenshot / Manual | Fortnightly |
| Spaceship | Husband | Shares | AUD | Screenshot / Manual | Monthly |
| Swyftx | Husband | Crypto | AUD | Screenshot / Manual | Weekly |
| Wife's Bank | Wife | Cash | AUD | Screenshot / Manual | Weekly |
| Husband Super | Husband | Super | AUD | Screenshot / Manual | Monthly |
| Wife Super | Wife | Super | AUD | Screenshot / Manual | Monthly |

> **Note:** Stake is split into two separate accounts — Stake ASX (AUD) and Stake Wall St (USD). The USD balance is entered as-is and automatically converted to AUD using the daily exchange rate for net worth calculations. Both accounts appear under the same "Shares" asset class and are grouped together visually as "Stake" on the dashboard.

### 4.2 Account Properties

Each account has the following configurable properties:

- **Name** — display name (e.g. "NAB Everyday")
- **Institution** — institution name (e.g. "NAB")
- **Owner** — Husband / Wife / Joint
- **Asset Class** — Cash / Shares / Crypto / Super / Property (extensible)
- **Currency** — AUD (default) / USD / any other currency code
- **Update Method** — Screenshot AI / Manual Entry
- **Update Frequency** — Weekly / Fortnightly / Monthly
- **Active** — toggle to hide without deleting

---

## 5. Asset Classes

| Asset Class | Colour |
|-------------|--------|
| Cash / Banking | Blue (#3B82F6) |
| Shares / Investments | Green (#22C55E) |
| Crypto | Purple (#A855F7) |
| Super | Orange (#F97316) |
| Property | Amber (#F59E0B) |
| Net Worth (total) | Gold (#EAB308) |
| Warning / Overdue | Red (#EF4444) |

---

## 6. Tech Stack

| Component | Technology | Cost |
|-----------|-----------|------|
| Frontend | React + Recharts | Free |
| Backend | Node.js (Express) | Free |
| Database | SQLite | Free |
| Hosting | Oracle Cloud Always Free (Ubuntu VPS) | Free |
| AI Vision | Google Gemini 2.5 Flash API | Free tier |
| FX Rates | frankfurter.app (open source, no key needed) | Free |
| Notifications | ntfy.sh | Free |
| Backups | Cron job → Google Drive | Free |
| SSL | Let's Encrypt | Free |
| Version Control | GitHub | Free |

**Total ongoing cost: $0**

---

## 7. Multi-Currency Support

### 7.1 Overview
All net worth calculations are performed in AUD. Accounts denominated in foreign currencies (e.g. Stake Wall St in USD) are stored in their native currency and converted to AUD at the time of display using a daily exchange rate.

### 7.2 Exchange Rate Fetching
- **Source:** frankfurter.app — free, open source, no API key required
- **Frequency:** Fetched once daily via a background cron job
- **Stored:** Latest rates cached in SQLite (exchange_rates table)
- **Fallback:** If fetch fails, use last known rate with a visible "rate may be outdated" warning

### 7.3 How it works in the update flow
- When entering a USD balance (e.g. Stake Wall St), the user enters the value in USD
- The app shows the live AUD equivalent beneath: *"USD $12,400 ≈ AUD $19,220 @ 0.645"*
- The snapshot stores both the original currency value AND the AUD equivalent at time of entry
- Historical AUD values are locked at the rate used when the snapshot was taken (no retroactive recalculation)

### 7.4 Dashboard display
- All balances displayed in AUD throughout the app
- Foreign currency accounts show native currency in smaller text below: e.g. "$19,220 AUD (USD $12,400)"
- Exchange rate used is shown on hover / tap
- A small FX indicator shows if today's rate has moved significantly vs last update

### 7.5 Account grouping — Stake
- Stake ASX and Stake Wall St are separate accounts in the data model
- On the dashboard they are visually grouped under a "Stake" header
- Combined Stake total shown in AUD, with breakdown below
- In the update flow they appear as two consecutive steps, clearly labelled

---

## 8. Features

### 8.1 Authentication
- Single shared login (username + password)
- HTTPS enforced via Let's Encrypt
- Rate limiting on login attempts (brute force protection)
- Session persists for 7 days

### 8.2 Admin Panel — Account Management
- Add new account (name, institution, owner, asset class, currency, update method, frequency)
- Edit existing account properties
- Toggle account active/inactive
- Delete account (with confirmation)
- Reorder accounts within the guided flow
- View last updated date per account

### 8.3 Guided Weekly Update Flow

The core weekly update experience:

1. User receives ntfy.sh notification on their phone
2. Opens app — if accounts are due, the guided flow launches automatically
3. One account displayed at a time with progress bar
4. Per account options:
   - **Upload Screenshot** → Gemini AI extracts balance → confirmation screen ("I found $4,380.00 — correct?") → confirm or edit
   - **Enter Manually** → number input in native currency → AUD equivalent shown live → save
   - **Skip** → carries forward last known balance
5. For USD accounts (Stake Wall St): entry is in USD, live AUD conversion shown beneath
6. Accounts not due this week are skipped automatically (shown as "not due until [date]" with option to update anyway)
7. Flow remembers position if app is closed mid-way
8. On completion: summary screen showing net worth change vs last update

### 8.4 Screenshot AI Agent
- Upload screenshot from any banking/investment app
- Gemini 2.5 Flash Vision API extracts the balance
- For USD accounts, AI extracts USD value and app converts to AUD automatically
- Confirmation step before saving
- Manual override if AI extraction is incorrect
- Supports dark mode / light mode screenshots
- Works with any app layout

### 8.5 Manual Entry Fallback
- Available for any account at any time
- Number input in account's native currency
- For non-AUD accounts: live AUD equivalent shown as user types
- Optional note field (e.g. "received tax return")
- Saves immediately

### 8.6 Notifications (ntfy.sh)
- Configurable notification schedule: Weekly / Fortnightly / Monthly
- Fires on first Sunday of the configured period
- Message adapts: "3 accounts due for update today"
- User configures their ntfy.sh topic in settings
- No account needed on ntfy.sh

---

## 9. Reporting & Dashboard

### 9.1 Dashboard (Home Screen)
- Total household net worth in AUD (large, prominent)
- Change since last week and last month (dollar + percentage)
- Donut chart — breakdown by asset class
- Account cards — each account showing current balance in AUD, native currency shown beneath for foreign accounts, owner, last updated
- Stake ASX and Stake Wall St grouped visually with combined AUD total
- Accounts overdue for update flagged in red
- Biggest mover this week widget
- Owner filter toggle: [Combined] [Husband] [Wife]
- Current AUD/USD rate displayed subtly in footer

### 9.2 Net Worth Trend
- Line chart of total net worth over time (always AUD)
- Time filters: 1M / 3M / 6M / 1Y / All Time
- Previous year overlay for comparison
- Milestones marked on chart (e.g. first $50k, $100k)
- Filterable by owner: combined / husband / wife

### 9.3 Asset Class Breakdown Over Time
- Multi-line chart — one line per asset class
- Same time filters as net worth trend
- Shows which asset class is growing fastest
- Toggle individual asset classes on/off

### 9.4 Per Account History
- Individual balance trend chart (in AUD, with native currency toggle for foreign accounts)
- Highest / lowest balance recorded
- Average balance
- Last updated timestamp
- Full update history log with notes and exchange rate used

### 9.5 Weekly / Monthly Summary
- Net worth start vs end of period
- Dollar and percentage change
- Best performing account
- Worst performing account
- Each account's individual change
- FX impact note if USD/AUD rate moved significantly

### 9.6 Year in Review
- Auto-generated annually (available from 1 Jan)
- Net worth Jan 1 vs Dec 31
- Total growth — dollar and percentage
- Best month / worst month
- Best performing asset class
- Full year chart

### 9.7 Milestones & Goals
- Set a net worth goal (e.g. $100k, $250k)
- Progress bar showing how close
- Estimated date to reach goal based on current growth rate
- Past milestones logged with date achieved
- Celebration animation on milestone hit 🎉

### 9.8 Projections
- Based on average weekly/monthly growth rate
- Project net worth 6 months, 1 year, 3 years forward
- Displayed as a dashed extension of the trend chart
- Recalculates automatically each update

### 9.9 Allocation Targets
- Set target allocation percentages per asset class
  (e.g. 40% cash, 40% shares, 20% crypto)
- Dashboard shows current vs target
- Visual indicator if drifting from target

---

## 10. Additional Features

- **Notes per update** — optional short note on each balance entry for context
- **Export** — CSV and PDF export of full balance history (AUD values + native currency)
- **Dark / Light mode toggle**
- **Carry-forward** — skipped accounts use last known balance
- **Overdue flagging** — accounts not updated past their frequency are flagged red
- **Biggest mover widget** — highlights account with largest AUD change this week

---

## 11. Data Model (SQLite)

### accounts
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | |
| name | TEXT | Display name |
| institution | TEXT | |
| owner | TEXT | husband / wife / joint |
| asset_class | TEXT | cash / shares / crypto / super / property |
| currency | TEXT | AUD (default) / USD / etc |
| update_method | TEXT | screenshot / manual |
| frequency | TEXT | weekly / fortnightly / monthly |
| group_name | TEXT | Optional — e.g. "Stake" to visually group accounts |
| active | BOOLEAN | |
| created_at | DATETIME | |

### snapshots
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | |
| account_id | INTEGER FK | → accounts.id |
| balance_native | DECIMAL | Balance in account's native currency |
| balance_aud | DECIMAL | AUD equivalent at time of snapshot |
| exchange_rate | DECIMAL | Rate used for conversion (1.0 for AUD accounts) |
| note | TEXT | Optional |
| updated_at | DATETIME | |
| method | TEXT | screenshot / manual / carried-forward |

### exchange_rates
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | |
| currency_pair | TEXT | e.g. "USD_AUD" |
| rate | DECIMAL | |
| fetched_at | DATETIME | |

### goals
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | |
| name | TEXT | e.g. "First $100k" |
| target_amount | DECIMAL | In AUD |
| target_date | DATE | Optional |
| achieved_at | DATETIME | Null until hit |

### milestones
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | |
| amount | DECIMAL | In AUD |
| achieved_at | DATETIME | |

---

## 12. Non-Functional Requirements

- Hosted on Oracle Cloud Always Free (Ubuntu VPS)
- HTTPS via Let's Encrypt
- Weekly automated SQLite backup to Google Drive via cron
- Daily FX rate fetch via frankfurter.app cron job
- Mobile-responsive — works on phone browser
- Fast load times — target < 2s on mobile
- No third-party analytics or tracking
- Financial data never leaves the personal server (except Gemini API calls for screenshot processing)

---

## 13. Out of Scope

- Transaction-level tracking (balances only)
- Bill / expense tracking
- Multi-user accounts with separate logins
- Native mobile app (web app only)
- Open Banking / CDR API integrations
- Push notifications beyond ntfy.sh
- Real-time FX rates (daily is sufficient)

---

## 14. Future Considerations (Post V1)

- Property as a manual asset class
- Vehicle value tracking
- Debt / liability tracking (mortgages, loans) for true net worth
- Annual tax report export
- Superannuation contribution tracking
- Additional currency support beyond USD
