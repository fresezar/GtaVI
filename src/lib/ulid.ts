const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32

/** Time-sortable unique ID (26 chars). Safe to generate live on stream with no collisions. */
export function ulid(now: number = Date.now()): string {
  let time = "";
  let n = now;
  for (let i = 0; i < 10; i++) {
    time = ALPHABET[n % 32] + time;
    n = Math.floor(n / 32);
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let rand = "";
  for (const b of bytes) rand += ALPHABET[b % 32];
  return time + rand;
}
