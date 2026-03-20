---
source: voice-memos/archive/transcripts/2026-03-16-1826-build-your-own-dashboard-zillow-plus.md
audio: voice-memos/archive/audio/2026-03-16-1826-build-your-own-dashboard-zillow-plus.m4a
origin: 2026-03-16T22:31:33
routed: 2026-03-20T00:00:00
session: ~/.claude/projects/-Users-rhhart-Documents-GitHub-weft-dev/6f8c0bf4-b2d0-42a1-bf51-f9959d13fca8.jsonl
context: >
  Hart describes a housing search product: a Claude cron job that scrapes
  listing sites daily, fronted by an intake interview that captures
  aesthetic preferences, neighborhood priorities, and roommate needs.
title: Housing search tool — scraper + intake interview + priority sorting
type: plan-seed
---

 Seven minutes. Okay. Seven minutes to record any of these ideas and then I'm going to stop.
 So we're talking about building a
 sort of Claude Cron job, a wake up routine once a day that scrapes a number of input portals, StreetEasy, Zillow. What other ones would you think?
 Listings Project, Craigslist.
 Facebook. Can Facebook be scraped in this way? I feel like there are probably Facebook groups. It would need your sign in keys or it would need their API and I think their API just got more restrictive so we'll have to check on that but that's a action item.
 The
 the flow in UX terms would be, you start with an interview about what you want most out of your housing situation.
 The
 intake interview tries to build the best script it can to capture the wants of the user. There's a few ones anticipated that would be supplied by like
 a question like, what visual aesthetics matter the most to you, do you have a mood board of the things that you aspire to aesthetically or collect because you like them.
 Let me pattern match to those in the image searches that I do.
 The neighborhoods would be pretty easy to encode.
 The kinds of neighborhoods would be easy enough to encode you could just kind of describe the things that you'd like to have nearby like green space or a bodega that runs all night or something like that.
 And then it could kind of consider different layers because right now it doesn't like Zillow doesn't include your nearness to like an organic grocery store.
 But you could totally build that in.
 Yeah, you could even just like
 try to priority sort for your priorities we talked about those with jet we should be able to load that document in and just have it take the priorities that we agreed on as roommates and
 kind of sort those into a bin and say these are the ones that are easy to program for these are the ones you'll have to watch for on emails I send you.
 And I'll send these as often as you say, like, is it once a day once every two days you probably want to be reminded once a day if you're on the active search.
 You could just tell it in natural language, how you felt about pets or your roommate situation if you were also looking for those.
