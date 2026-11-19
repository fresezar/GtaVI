"use client";

import { useEffect } from "react";
import { rememberRef } from "@/data/partners";

/** On a partner page: remember the partner for the suggest form and count one visit per browser session. */
export default function RefCapture({ slug }: { slug: string }) {
  useEffect(() => {
    rememberRef(slug);
    const key = `sixstar.visit.${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage blocked: still count */
    }
    fetch("/api/ref/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);
  return null;
}
