-- E-mail list: "tell me when GTA 6 Online launches" and the weekly digest. One row per address.
-- No sending yet: the list is collected now, a sender is wired up before the first mail goes out.
CREATE TABLE subscribers (
  email            TEXT PRIMARY KEY,           -- lower-cased
  created_at       TEXT NOT NULL,              -- consent time (ISO)
  topics           TEXT NOT NULL,              -- comma list: online, weekly
  locale           TEXT NOT NULL DEFAULT 'en',
  source           TEXT,                       -- page path the form was on
  ip_hash          TEXT NOT NULL,              -- salted daily hash, rate limit only
  token            TEXT NOT NULL,              -- unsubscribe link token
  unsubscribed_at  TEXT
);
CREATE INDEX subscribers_ip ON subscribers (ip_hash, created_at);
