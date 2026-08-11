---
name: email-writer
description: >-
  Drafts personalized housing inquiry emails from a Google Sheet of
  listing URLs. Use when: "draft emails", "write housing emails",
  "check listings", "apartment emails", or "email-writer".
---

# Email Writer

Reads a Google Spreadsheet of housing listing URLs, fetches each
listing page, and drafts a personalized inquiry email matching the
user's voice and style. Saves drafts locally for review before sending.

## First-run setup

If `~/.config/email-writer/config.json` does not exist, enter setup
mode. Walk the user through each step conversationally.

### Step 1: Google Sheet URL

Ask the user for their Google Sheet URL. Accept any of these formats:
- Full URL: `https://docs.google.com/spreadsheets/d/1a2b3c.../edit`
- Sheet ID only: `1a2b3c...`
- Export URL: `https://docs.google.com/spreadsheets/d/1a2b3c.../export?format=csv`

Extract the sheet ID and construct the CSV export URL:
```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid=0
```

Validate by fetching the URL with WebFetch. If the fetch fails, tell
the user:

> I can't reach your spreadsheet. Make sure it's shared as "Anyone
> with the link" (view access). Go to File → Share → General access →
> "Anyone with the link" → Viewer.

### Step 2: Example emails

Ask the user to paste 2-3 emails they've previously sent to housing
listers. Explain why:

> Paste 2-3 emails you've already sent to landlords or listers. These
> set the tone, style, and length for your drafts. The more personality
> in your examples, the better the drafts will match your voice.

Save all examples to `~/.config/email-writer/examples.md` with a
simple header:

```markdown
# Example Emails

## Example 1
[pasted email]

## Example 2
[pasted email]
```

### Step 3: User details

Ask for details that go into every email:
- **Name** (required) — how they sign their emails
- **Phone** (optional) — include in signature if provided
- **Move-in date** (optional) — e.g., "May 2026", "flexible"
- **Occupants** (optional) — e.g., "2 people, 1 cat"
- **Standing requirements** (optional) — things they always need to
  mention, e.g., "must allow cats", "need parking", "work from home"

### Step 4: Output mode

Ask: "How do you want your drafts organized?"

Present three options:

**a) Single file** — All drafts in one file with separators between
them. Easy to scroll through and review as a batch.

**b) Separate files** — One file per email, all in the same folder.
Easy to delete or edit individually.

**c) Folder per batch** — Each time you run this, it creates a dated
folder with one file per email inside. Keeps different days' batches
separate.

Save the choice as `outputMode` in config: `"single"`, `"separate"`,
or `"batch-folders"`.

### Step 5: Create config

Write the following files:

**`~/.config/email-writer/config.json`:**
```json
{
  "sheetId": "<extracted>",
  "csvUrl": "https://docs.google.com/spreadsheets/d/<id>/export?format=csv&gid=0",
  "userName": "<from step 3>",
  "userPhone": "<from step 3, or null>",
  "moveInDate": "<from step 3, or null>",
  "occupants": "<from step 3, or null>",
  "requirements": "<from step 3, or null>",
  "outputMode": "<from step 4>",
  "setupComplete": true
}
```

**`~/.config/email-writer/examples.md`:** (already written in step 2)

**`~/.config/email-writer/processed.json`:** `{}`

Create the `~/.config/email-writer/drafts/` directory.

### Step 6: Confirm

Show the user a summary of their config and offer to do a test run on
the first URL in their sheet.

---

## Normal run

When `config.json` exists and the user says "draft emails" (or any
trigger phrase), execute the core loop:

### 1. Load state

Read these files:
- `~/.config/email-writer/config.json`
- `~/.config/email-writer/examples.md`
- `~/.config/email-writer/processed.json`

### 2. Fetch the spreadsheet

Use WebFetch to fetch the CSV export URL from config. Parse the CSV:
- First row is headers
- Column A: URL (required)
- Column B: Notes (optional)
- Handle quoted CSV fields (Google Sheets quotes fields containing
  commas or newlines)

### 3. Filter URLs

Remove any URL that already appears in `processed.json`. The remaining
URLs are the batch to process.

If no new URLs: tell the user "All URLs in your spreadsheet have been
processed. Add new ones or say 'reset' to re-draft."

### 4. Process each listing

For batches larger than 10 URLs, process 10 at a time and ask the
user whether to continue with the next batch.

For each URL:

**a. Fetch the listing page.**

Use WebFetch with this prompt:

> Extract from this housing listing: property name or address, price
> or rent amount, number of bedrooms and bathrooms, key features and
> amenities, location details and neighborhood info, any standout or
> unique details worth mentioning in an inquiry email. Return the
> extracted information in a structured format.

If WebFetch returns an error (404, timeout, blocked), note the URL as
skipped and continue to the next one.

**b. Draft the email.**

Using the fetched listing details, the user's notes from the
spreadsheet row, and the example emails from `examples.md`, draft an
inquiry email that:

- Opens with a specific detail from the listing (demonstrates the
  sender actually read it — not a generic opener)
- Naturally incorporates the user's notes if present (e.g., if notes
  say "ask about parking", weave a parking question into the email
  naturally — don't just append it)
- Matches the tone, style, and approximate length of the examples
- Includes the user's name and relevant details from config (move-in
  date, occupants, requirements) where they fit naturally
- Includes the listing URL for reference
- Is ready to copy-paste into Gmail — no placeholders, no brackets,
  no instructions to the user within the email body

**c. Write the draft.**

Write according to the configured `outputMode`:

- **`single`**: Append to `~/.config/email-writer/drafts/drafts-YYYY-MM-DD.md`
  using the format below, separated by `---`.
- **`separate`**: Write to `~/.config/email-writer/drafts/[address-slug].md`
  where `address-slug` is a kebab-case version of the property address
  or name (e.g., `123-main-st-apt-4.md`).
- **`batch-folders`**: Create `~/.config/email-writer/drafts/YYYY-MM-DD/`
  if it doesn't exist, then write `[address-slug].md` inside it.

**d. Update tracking.**

Add the URL to `processed.json`:
```json
{
  "https://example.com/listing/123": {
    "status": "drafted",
    "date": "2026-03-22",
    "address": "123 Main St"
  }
}
```

### 5. Report

After processing all URLs, report:
- How many new drafts were written
- How many were skipped (and why — 404, error, etc.)
- How many were already processed
- The file path where drafts were saved

---

## Draft format

Each draft follows this structure:

```markdown
## [Property Name/Address] — $[Price]
**Listing:** [URL]
**Drafted:** [date]
**Notes:** [user notes from spreadsheet, or "none"]

**Subject:** [email subject line]

[Email body — ready to copy-paste]
```

In `single` mode, drafts are separated by `---` on its own line.
In `separate` and `batch-folders` modes, each file contains one draft.

---

## Commands

These natural language triggers activate the skill:

| Trigger | Action |
|---------|--------|
| "draft emails", "check listings", "apartment emails" | Normal run — process new URLs |
| "set up email writer", "configure email writer" | Re-enter setup (overwrites config) |
| "reset", "start fresh" | Clear processed.json so all URLs re-draft |
| "re-draft [URL]" | Remove one URL from processed.json, re-draft it |
| "update examples" | Replace example emails in examples.md |
| "show config" | Display current settings |
| "change output mode" | Update the outputMode in config |

---

## Edge cases

**Sheet not accessible.** Guide the user to check sharing settings.
Show the exact URL being fetched so they can debug.

**Empty spreadsheet.** "Your spreadsheet has no listing URLs yet. Add
some to column A and try again."

**Listing page 404 or error.** Note the URL as skipped in the report,
continue with the remaining URLs. Don't stop the batch.

**Large batches (>10 URLs).** Process 10 at a time. After each batch
of 10, ask: "10 drafts done. Continue with the next [N]?"

**CSV parsing.** Google Sheets CSV export uses standard RFC 4180
quoting: fields containing commas, newlines, or double quotes are
wrapped in double quotes; literal double quotes are escaped as `""`.
Handle this when parsing.

**Re-run same day (single mode).** Append to the same dated file.
Already-processed URLs are skipped via processed.json.

**Config directory doesn't exist.** Create `~/.config/email-writer/`
and all subdirectories as needed during setup.

<!-- session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/a300232e-c699-4469-939d-f662529bd582.jsonl | 2026-03-23T02:31:44.121Z -->
