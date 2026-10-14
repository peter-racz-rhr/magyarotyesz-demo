# Backend brief: magyarotyesz sync server

Paste this whole document into Manus. It describes exactly what to build.
Please follow the file format, API and rules exactly: the mobile app will
be wired to this contract by someone else. If something here is impossible
or clearly wrong, say so and explain before changing it.

---

## 1. What the app is

magyarotyesz is a mobile web app (Next.js PWA, already built, on Vercel) for
sharing **toilet door codes in Budapest**. People add a toilet on a map with
its door code, and others confirm whether the code still works.

The app is **offline-first**:

- When the phone is online, it downloads **all** toilets once, then only
  what changed since its last sync, and keeps everything on the phone.
- Everything a person does (add a toilet, vote, suggest a new code, edit
  their own toilet) goes into an **outbox** on the phone, each action with
  its own UUID. When the phone is online, the outbox is sent to the server.
  The same action may arrive **more than once** (retries, flaky networks),
  so the server must treat actions as idempotent.
- The server is the shared truth. It must keep working with **no database**:
  data lives in **small text files** on disk.

The most important data is **the code**. Get the code, its location and its
votes right first; everything else is secondary.

## 2. What to build

A small HTTP JSON API server.

- **Language/runtime:** Node.js 22 + TypeScript. Use Fastify or Hono. No
  database, no ORM, no external services.
- **Storage:** plain files under one data directory (`DATA_DIR`, default
  `/data`). Every file is JSON stored in a `.txt` file, pretty-printed (2
  spaces), UTF-8, so a human can open and read it.
- **Packaging:** a `Dockerfile` and `docker-compose.yml` that run the server
  with `DATA_DIR` mounted as a volume, so data survives restarts and updates.
  It must also run without Docker (`npm ci && npm run build && npm start`).
- **Size:** it must run comfortably on a tiny machine (1 CPU, 1 GB RAM). For
  scale: expect up to ~20,000 toilets, ~50,000 users, a few requests per
  second at peak.

## 3. Files on disk

```
/data
  toilets/<toiletId>.txt        one file per toilet (public data)
  votes/<toiletId>.txt          who voted what on that toilet (private)
  suggestions/<toiletId>.txt    new codes suggested by others (private, for the owner)
  users/<userId>.txt            one file per user (private)
  alerts/<userId>.txt           alerts for that user (private)
  changes.log                   append-only, one JSON object per line
  actions.log                   append-only, one line per processed action id (for idempotency)
  meta.txt                      { "seq": <last change number>, "oldestSeq": <first change still in changes.log> }
```

### 3.1 `toilets/<toiletId>.txt` (public)

```json
{
  "id": "6f1c2c1e-6c7b-4c0a-9a43-0f6f2a7d2b11",
  "name": "Gerlóczy Kávéház",
  "code": "4821#",
  "kind": "cafe",
  "access": "customers",
  "price": null,
  "hours": { "open": "07:00", "close": "23:00" },
  "wheelchair": true,
  "babyChanging": false,
  "note": "First floor, door next to the bar",
  "latitude": 47.4936,
  "longitude": 19.0555,
  "addedAt": "2026-10-14T15:30:00.000Z",
  "updatedAt": "2026-10-14T15:30:00.000Z",
  "confirmedAt": "2026-10-14T15:30:00.000Z",
  "reportedAt": null,
  "confirms": 1,
  "reports": 0,
  "version": 1
}
```

- `id`: UUID v4, **created by the phone** (so a toilet added offline keeps
  its id).
- `kind`: one of `cafe`, `restaurant`, `bar`, `mall`, `station`, `other`.
- `access`: one of `free`, `customers`, `paid`. `price` (forints, integer
  1–5000) only when `paid`, otherwise `null`.
- `hours`: `null` (unknown), `"24/7"`, or `{ "open": "HH:MM", "close": "HH:MM" }`
  (closing after midnight is allowed, e.g. 12:00–02:00).
- `confirms` / `reports`: how many **different users** currently say the
  code works / doesn't work.
- `confirmedAt` / `reportedAt`: last time anyone said it works / doesn't.
- `version`: increases by 1 on every change to this toilet.
- The owner's user id is **not** in this file (it's in `users/<userId>.txt`
  and in a server-side owner index, see 3.3), so downloading all toilets
  doesn't reveal who shared what.

### 3.2 `votes/<toiletId>.txt` (private)

```json
{ "<userId>": { "works": true, "at": "2026-10-14T15:31:00.000Z" } }
```

One vote per user per toilet. Voting again with the same value only
refreshes `at` (and `confirmedAt`/`reportedAt` on the toilet). Switching
moves the vote: `confirms` and `reports` must always equal the counts in
this file.

### 3.3 `users/<userId>.txt` (private)

```json
{
  "id": "u_7Hq2…",
  "tokenHash": "<sha256 hex of the user's secret token>",
  "createdAt": "…",
  "owns": ["<toiletId>", "…"],
  "adds": ["<ISO time of each toilet added, last 24h is enough>"],
  "banned": false
}
```

Keep an in-memory index built at startup: `toiletId -> ownerUserId`,
`tokenHash -> userId`.

### 3.4 `suggestions/<toiletId>.txt` (private, visible only to the owner)

```json
[{ "id": "<uuid>", "code": "5930#", "userId": "u_…", "at": "…" }]
```

### 3.5 `alerts/<userId>.txt` (private)

```json
[{ "id": "<uuid>", "toiletId": "…", "name": "Gerlóczy Kávéház", "kind": "report", "code": null, "at": "…", "read": false }]
```

`kind` is `report` (someone said the owner's code doesn't work) or
`suggestion` (someone suggested a new code; `code` is set). Keep the newest
100 per user.

### 3.6 `changes.log` (public feed, append-only)

One line per change, in order:

```
{"seq":1041,"at":"…","type":"upsert","toilet":{…the full public toilet…}}
{"seq":1042,"at":"…","type":"delete","toiletId":"…"}
```

`seq` increases by exactly 1 per change, across the whole server. Every
change to a public toilet file (add, vote, edit, delete) appends one line.
When the file grows past `CHANGES_KEEP` lines (default 50,000), compact it
by keeping only the newest lines and update `oldestSeq` in `meta.txt`.

### 3.7 Writing files safely (hard requirements)

- **One writer.** All writes go through a single in-process queue (a mutex),
  so two requests can never write the same file at the same time. The server
  runs as one process.
- **Atomic writes.** Write to `<file>.tmp`, `fsync`, then `rename` over the
  real file. A crash must never leave a half-written file.
- **Appends** to `changes.log` / `actions.log` are `fsync`ed before the
  request returns success.
- **Startup check.** On start, read every file; if one doesn't parse, move it
  to `/data/quarantine/` and log it instead of crashing. Rebuild the
  in-memory indexes from the files.
- Keep all public toilets in memory too (it's small), so reads never touch
  the disk.

## 4. Identity: anonymous phone key

No email, no password.

- `POST /v1/register` creates a user and returns `{ "userId": "u_…", "token": "<32 random bytes, base64url>" }`.
  The server stores only `sha256(token)`. The phone keeps the token.
- Every other write request sends `Authorization: Bearer <token>`.
- Lost token = lost account (that's accepted for v1).
- Rate-limit `/v1/register` per IP (e.g. 5 per hour) so nobody mass-creates
  accounts.

## 5. API

Base path `/v1`. JSON in, JSON out. Errors: `{ "error": "<machine_code>", "message": "<human text>" }`
with a fitting HTTP status. Timestamps are ISO 8601 UTC.

### `GET /v1/health`
`{ "ok": true, "seq": 1042, "toilets": 1234 }`

### `POST /v1/register`
See section 4.

### `GET /v1/snapshot`
All toilets at once, for a phone's first sync (or when its cursor is too
old).

```json
{ "seq": 1042, "toilets": [ { …public toilet… }, … ] }
```

Send it gzip-compressed and with an `ETag`; answer `304` when unchanged.

### `GET /v1/changes?since=<seq>`
Everything after `since`, oldest first, at most 1,000 per call.

```json
{ "seq": 1042, "more": false, "changes": [ { "seq": 1041, "type": "upsert", "toilet": {…} }, { "seq": 1042, "type": "delete", "toiletId": "…" } ] }
```

If `since` is older than `oldestSeq`, answer `410 Gone` with
`{ "error": "resync" }`: the phone then calls `/v1/snapshot` again. If
`more` is true, the phone calls again with the returned `seq`.

### `POST /v1/actions` (auth)
The outbox. The phone sends up to 100 actions at once, oldest first.

```json
{
  "actions": [
    {
      "id": "<uuid v4 made by the phone>",
      "type": "add_toilet",
      "at": "<when the person did it, ISO>",
      "location": { "latitude": 47.4936, "longitude": 19.0555, "accuracy": 18 },
      "payload": { … depends on type … }
    }
  ]
}
```

Answer, one result per action, same order:

```json
{
  "seq": 1045,
  "results": [
    { "id": "…", "status": "ok", "toilet": { …the toilet after the change… } },
    { "id": "…", "status": "duplicate" },
    { "id": "…", "status": "rejected", "error": "too_far", "message": "…" }
  ]
}
```

- **Idempotency:** if an action `id` was already processed (it's in
  `actions.log` / an in-memory set), return `duplicate` and change nothing.
- A rejected action is **final** (the phone drops it from its outbox and
  shows the message). A network error or 5xx means the phone retries later.
- Process actions in order; one rejected action doesn't stop the rest.

#### Action types

| type | payload | rules |
| --- | --- | --- |
| `add_toilet` | `{ id, name, code, kind, access, price, hours, wheelchair, babyChanging, note, latitude, longitude }` | Validate everything (section 6). `id` must be new. Must be **on the spot** (6.3). The user can add at most **10 toilets per 24 hours**. The adder becomes the owner and counts as the first `confirms` vote. |
| `vote` | `{ toiletId, works: true \| false }` | Must be on the spot. One vote per user, switching moves it (3.2). A `works: false` vote on someone else's toilet creates a `report` alert for the owner (not for your own toilet). |
| `suggest_code` | `{ toiletId, code }` | Not allowed on your own toilet (owners edit instead). Adds a suggestion and a `suggestion` alert for the owner. Max 3 open suggestions per user per toilet. |
| `edit_toilet` | `{ toiletId, changes: { name?, code?, note?, kind?, access?, price?, hours?, wheelchair?, babyChanging? } }` | **Owner only** (403 `not_owner` otherwise). If `code` changes: votes reset (the owner's vote becomes the only one: `confirms: 1`, `reports: 0`, `reportedAt: null`), and suggestions with that code are removed. |
| `accept_suggestion` | `{ toiletId, suggestionId }` | Owner only. Same as `edit_toilet` with that code. |
| `dismiss_suggestion` | `{ toiletId, suggestionId }` | Owner only. |
| `delete_toilet` | `{ toiletId }` | Owner only. Deletes the toilet's files and logs a `delete` change. |
| `mark_alerts_read` | `{}` | Marks all of the user's alerts read. |

### `GET /v1/me` (auth)
What only this user may see:

```json
{
  "userId": "u_…",
  "owns": ["<toiletId>", …],
  "votes": { "<toiletId>": true, "<toiletId>": false },
  "suggestions": { "<toiletId>": [ { "id": "…", "code": "5930#", "at": "…" } ] },
  "alerts": [ … newest first … ],
  "addsLeftToday": 7
}
```

(Don't include who suggested a code.)

### Admin (protected by `ADMIN_TOKEN` env var, header `X-Admin-Token`)

- `DELETE /v1/admin/toilets/:id`: remove a toilet (for takedown requests).
- `POST /v1/admin/users/:id/ban`: a banned user's actions are all
  `rejected` with `banned`.
- `GET /v1/admin/stats`: counts of toilets, users, actions today.

## 6. Validation and anti-abuse

### 6.1 Fields
- `name`: 1–80 characters after trimming. `code`: 1–20 characters.
  `note`: 0–200 characters. Strip control characters; keep accents (á, é, ő, ű…).
- `latitude` / `longitude` must be inside Budapest: latitude 47.35–47.62,
  longitude 18.92–19.34.
- Enums and `hours` exactly as in 3.1. Reject unknown fields.

### 6.2 Limits
- Rate limit per IP and per user (e.g. 120 requests/minute, `/v1/snapshot`
  10/minute). Answer `429` with `Retry-After`.
- Max request body 256 KB.

### 6.3 On the spot
For `add_toilet` and `vote`, the action's `location` must be within
**150 m** of the toilet (use the haversine distance) and its `accuracy` at
most 100 m. Otherwise reject with `too_far` (include the distance in metres
in the message) or `no_location`. This can be faked by a determined person;
it's there to stop casual fake codes, and that's accepted for v1.
Make the radius configurable (`NEAR_METRES`, default 150) and allow turning
the check off for testing (`ON_THE_SPOT=false`).

### 6.4 Time
Use the server's clock for stored times; keep the phone's `at` only for
ordering within one batch.

## 7. Configuration (env vars)

| name | default | meaning |
| --- | --- | --- |
| `PORT` | `8080` | HTTP port |
| `DATA_DIR` | `/data` | where the files live |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | comma-separated CORS origins (will include the Vercel URL) |
| `ADMIN_TOKEN` | (none) | admin endpoints are off when unset |
| `NEAR_METRES` | `150` | on-the-spot radius |
| `ON_THE_SPOT` | `true` | turn the distance check off for testing |
| `CHANGES_KEEP` | `50000` | lines kept in `changes.log` |
| `TRUST_PROXY` | `true` | read the client IP from `X-Forwarded-For` (behind Caddy / Cloudflare) |

CORS: allow only `ALLOWED_ORIGINS`, methods `GET, POST, DELETE, OPTIONS`,
headers `Authorization, Content-Type`.

## 8. Backups

- `scripts/backup.sh`: makes `backups/data-YYYY-MM-DD.tar.gz` of `DATA_DIR`
  (consistent: pause writes or copy under the write lock), keeps the newest
  14.
- Document how to run it nightly with cron, and how to restore.

## 9. Tests (required, with Vitest)

1. **Concurrency:** 200 parallel `add_toilet` and `vote` actions finish with
   no corrupted file, correct counts, and `seq` increasing by exactly 1 per
   change.
2. **Idempotency:** sending the same batch 3 times changes data only once;
   later sends return `duplicate`.
3. **Offline replay:** a batch made "offline" (old `at` times: add, then vote,
   then suggest) applies in order.
4. **Ownership:** non-owners get `not_owner` for edit, accept, dismiss and delete.
5. **Votes:** switching a vote moves it; the counts always equal the votes file.
6. **Code change resets votes** and removes matching suggestions.
7. **Limits:** the 11th add within 24 h is rejected (`daily_limit`).
8. **On the spot:** 151 m away is rejected, 149 m is accepted, off switch works.
9. **Sync:** snapshot plus changes since its `seq` gives the same state as a
   fresh snapshot; `410` when `since` is too old.
10. **Crash safety:** a corrupted toilet file is quarantined at startup and
    the server still starts.
11. **Validation:** outside Budapest, too-long name, bad enum, bad hours are
    rejected.

## 10. Deployment docs (in the README)

Write step-by-step instructions a beginner can follow:

1. **Oracle Cloud Always Free** (first home): create an Ubuntu VM (Ampere
   A1, 1 OCPU / 6 GB is plenty), open ports 80/443 in the security list,
   install Docker, run `docker compose up -d`, and put **Caddy** in front for
   automatic HTTPS on our domain (e.g. `api.<domain>`). Include the
   `Caddyfile` and a compose file with both services.
2. **A homelab** (later): the same container, exposed with a **Cloudflare
   Tunnel** (no open router ports). Include the `cloudflared` config.
3. **Moving between them:** stop, copy `DATA_DIR`, start.
4. How to set `ALLOWED_ORIGINS` to the Vercel URL.

## 11. Where the code goes (GitHub)

- **Repository:** `peter-racz-rhr/magyarotyesz-server`. It's a **new,
  separate repo**: create it yourself if it doesn't exist (owner
  `peter-racz-rhr`, **private**, no template). If your GitHub connection
  can't create repositories, stop and tell me, and I'll create an empty one
  and you push to it.
- **Never touch `peter-racz-rhr/magyarotyesz-demo`.** That is the mobile app
  (it's deployed automatically on every push). Don't push, branch or open a
  pull request there.
- **Branch:** push everything to `main`. The repo is new and empty, so there
  is nothing to merge into.
- **How to commit:** small commits with clear messages as you go (for
  example: "File store with atomic writes", "Sync endpoints", "Action
  processing", "Tests", "Docker and deploy docs"), not one huge commit at the
  end. Push after each major piece so the work is visible.
- **Never commit:** `.env`, tokens, anything under `data/`, `backups/`,
  `node_modules/`, `dist/`. Add a `.gitignore` for these in the first commit.
- **When you finish:** reply with the repo URL, the final commit hash, how to
  run it, and the result of `npm test`. If any requirement could not be met,
  list it clearly instead of hiding it.

## 12. Deliverables

- The repository above, containing TypeScript source, tests, `Dockerfile`,
  `docker-compose.yml`, `Caddyfile`, `.env.example` and `scripts/backup.sh`.
- `openapi.yaml` describing every endpoint above.
- `README.md`: what it is, how to run locally, how to test, how to deploy
  (section 10), the file format (section 3), and `curl` examples for every
  endpoint.
- `scripts/seed.ts`: creates a few demo toilets around Deák Ferenc tér for
  testing.
- All tests passing (`npm test`).

Not in scope: the mobile app, push notifications, photos, email, payments,
any database.
