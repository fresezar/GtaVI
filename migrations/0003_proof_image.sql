-- Screenshot proof uploaded with a suggestion (R2 key in the PROOFS bucket). Deleted, and set back to NULL,
-- once a moderator approves or rejects the suggestion. proof_url may then be '' (image was the only proof).
ALTER TABLE suggestions ADD COLUMN proof_image TEXT;
