import type { Metadata } from "next";
import Backdrop from "@/components/ui/Backdrop";
import AdminQueue from "@/features/community/AdminQueue";

/** Moderator page: not linked, not in the sitemap, not indexed. The API itself checks the token. */
export const metadata: Metadata = {
  title: "Onay kuyruğu",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="min-h-dvh">
      <Backdrop />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <AdminQueue />
      </main>
    </div>
  );
}
