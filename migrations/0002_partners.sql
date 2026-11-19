-- Partner tracking. A suggestion remembers which partner page sent the player (slug from content/partners.json).
ALTER TABLE suggestions ADD COLUMN ref TEXT;
CREATE INDEX suggestions_ref ON suggestions (ref, status);

-- Unique visitors per partner page per day. ip_hash = the same salted daily hash as suggestions; no raw IPs.
CREATE TABLE partner_visits (
  slug     TEXT NOT NULL,
  day      TEXT NOT NULL,                 -- YYYY-MM-DD (UTC)
  ip_hash  TEXT NOT NULL,
  PRIMARY KEY (slug, day, ip_hash)
);
