import { pinTextFor } from "@/data/pinText";

export const dynamic = "force-static";

export function GET() {
  return Response.json(pinTextFor("es"));
}
