import { SITE } from "@/config/site";
import { ART, artSrcSet, artUrl, type ArtName } from "@/config/art";

/**
 * Responsive official artwork (decorative, so alt=""). Renders nothing when SITE.officialArt is off,
 * so every caller must look fine without it.
 */
export default function Art({
  name,
  sizes,
  className = "",
  priority = false,
}: {
  name: ArtName;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  if (!SITE.officialArt) return null;
  const a = ART[name];
  return (
    <img
      src={artUrl(name, a.widths[0])}
      srcSet={artSrcSet(name)}
      sizes={sizes}
      alt=""
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`object-cover ${className}`}
    />
  );
}
