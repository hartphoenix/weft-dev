---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/a300232e-c699-4469-939d-f662529bd582.jsonl
stamped: 2026-03-23T02:32:02.465Z
---
# Email Writer

Drafts personalized inquiry emails for housing listings. You add
listing URLs to a Google Sheet, then say "draft emails" in Claude Code.
It reads each listing, writes an email in your voice, and saves drafts
locally for you to review and send.

## What you need

- A Mac with [Claude Code](https://claude.ai/code) installed
- A Google account

## Setup (5 minutes)

### 1. Install the skill

Open Terminal and run:

```
cp -r email-writer ~/.claude/skills/
```

(If you received this as a zip file, unzip it first, then run the
command from the folder containing `email-writer/`.)

### 2. Create your Google Sheet

Make a new Google Sheet with two columns:

| A (URL) | B (Notes) |
|---------|-----------|
| https://craigslist.org/listing/123 | love the kitchen |
| https://listingsproject.com/listing/456 | ask about move-in date |

- **Column A: URL** — paste listing links here (required)
- **Column B: Notes** — anything you want mentioned in the email (optional)

### 3. Share the sheet

1. Click **Share** (top right of Google Sheets)
2. Under "General access", change to **"Anyone with the link"**
3. Make sure it says **Viewer**
4. Copy the link

### 4. Run it

Open Claude Code (in any directory) and say:

> draft emails

The first time, it will walk you through setup — paste your sheet
link, share a couple example emails you've sent before, and pick how
you want drafts organized.

After setup, just say "draft emails" whenever you add new listings to
your sheet.

### 5. Find your drafts

Drafts are saved to:

```
~/.config/email-writer/drafts/
```

Open the file(s) in any text editor. Each draft has a subject line and
email body ready to copy-paste into Gmail.

## Tips

- **Notes column is powerful.** Write "love the natural light" or "ask
  about parking" and the email will weave it in naturally.
- **Say "reset"** to re-draft all listings from scratch.
- **Say "re-draft [URL]"** to redo just one.
- **Say "update examples"** to change the example emails your drafts
  are based on.
- **Some sites won't load** (Zillow, Apartments.com use heavy
  JavaScript). If a listing gets skipped, paste the key details into
  the Notes column and re-draft it.

## Files it creates

All state lives in `~/.config/email-writer/`:

| File | What it is |
|------|-----------|
| `config.json` | Your sheet URL, name, preferences |
| `examples.md` | The example emails you provided |
| `processed.json` | Tracks which URLs have been drafted |
| `drafts/` | Your draft emails |

To start completely fresh, delete the `~/.config/email-writer/`
folder and run "draft emails" again.
