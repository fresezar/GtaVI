-- Community pin suggestions (phase 1: no accounts). One row per suggestion.
-- status: pending -> approved | rejected; approved -> published once copied into content/pins.json.
CREATE TABLE suggestions (
  id            TEXT PRIMARY KEY,              -- sug_<ULID>
  created_at    TEXT NOT NULL,                 -- ISO timestamp
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  category_id   TEXT NOT NULL,
  title         TEXT NOT NULL,
  x             REAL NOT NULL,                 -- pin frame (0..1 on the GTADB grid)
  y             REAL NOT NULL,
  proof_url     TEXT NOT NULL,
  note          TEXT,
  name          TEXT,                          -- credit ("Found by"); optional
  locale        TEXT NOT NULL DEFAULT 'en',
  ip_hash       TEXT NOT NULL,                 -- salted SHA-256, for rate limits only; the IP itself is never stored
  pin_id        TEXT,                          -- pin_<ULID>, set on approval
  reviewed_at   TEXT,
  reason        TEXT                           -- rejection reason (shown to nobody but the moderator for now)
);
CREATE INDEX suggestions_status ON suggestions (status, created_at);
CREATE INDEX suggestions_ip ON suggestions (ip_hash, created_at);
