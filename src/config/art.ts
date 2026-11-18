/**
 * Official GTA VI artwork used as decoration (© Rockstar Games, credited in the footer).
 * Source JPGs live in media-src/ (untracked); `npm run media` crops + resizes them into public/media/.
 * Kill switch: SITE.officialArt = false removes every one of these from the site in one step.
 *
 * focusY: where the subject sits vertically in the portrait original (0 top .. 1 bottom).
 */
export interface ArtAsset {
  src: string;
  aspect: number;
  focusY: number;
  widths: readonly number[];
}

export const ART = {
  backdrop: { src: "HXRoX68WEAAIBko.jpg", aspect: 16 / 9, focusY: 0.43, widths: [960, 1920] },
  hero: { src: "HXRoX6vWwAA5l2p.jpg", aspect: 4 / 5, focusY: 0.72, widths: [560, 960] },
  "card-map": { src: "HXRoX6xW0AAByCa.jpg", aspect: 16 / 10, focusY: 0.78, widths: [480, 800] },
  "card-checklists": { src: "HXRoX6zXIAALsNL.jpg", aspect: 16 / 10, focusY: 0.45, widths: [480, 800] },
  "card-vehicles": { src: "HXRoX6-WUAAkBpI.jpg", aspect: 16 / 10, focusY: 0.42, widths: [480, 800] },
  "card-weapons": { src: "HXRoX6uW4AEDlpk.jpg", aspect: 16 / 10, focusY: 0.45, widths: [480, 800] },
  "card-missions": { src: "HXRoX61XIAErG1j.jpg", aspect: 16 / 10, focusY: 0.62, widths: [480, 800] },
  "card-money": { src: "HXRoX6vXMAACxP8.jpg", aspect: 16 / 10, focusY: 0.42, widths: [480, 800] },
  "card-online": { src: "HXRoX65WkAA_sL1.jpg", aspect: 16 / 10, focusY: 0.42, widths: [480, 800] },
  "card-radio": { src: "HXRoX6_XkAAkDD3.jpg", aspect: 16 / 10, focusY: 0.58, widths: [480, 800] },
  "banner-news": { src: "HXRoX6yXEAAirNC.jpg", aspect: 3 / 1, focusY: 0.47, widths: [960, 1600] },
  "banner-checklists": { src: "HXRoX77XQAAVqJw.jpg", aspect: 3 / 1, focusY: 0.68, widths: [960, 1600] },
  "banner-missables": { src: "HXRoX61XIAErG1j.jpg", aspect: 3 / 1, focusY: 0.62, widths: [960, 1600] },
} as const satisfies Record<string, ArtAsset>;

export type ArtName = keyof typeof ART;

export const artUrl = (name: ArtName, width: number) => `/media/${name}-${width}.webp`;
export const artSrcSet = (name: ArtName) => ART[name].widths.map((w) => `${artUrl(name, w)} ${w}w`).join(", ");
