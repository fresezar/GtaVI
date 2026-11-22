import { fileNumber, PINS } from "@/data/pins";
import { toCompact } from "@/lib/pinIndex";

// Written once at build time as /pin-data/pins.json: the compact pin list the map and the header stars load.
export const dynamic = "force-static";

export function GET() {
  return Response.json({ v: 1, pins: PINS.map((p) => toCompact(p, fileNumber(p.id))) });
}
