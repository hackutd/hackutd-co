import type { Stop } from "@/app/components/ui/ruixen-gradient-footer";

/**
 * Footer glow — the blurred rainbow pinned to the foot of the viewport, in the
 * brand palette rather than the component's stock spectrum.
 *
 * The stop offsets are the ones the shape was tuned for; only the colors are
 * ours. Read floor (0) → top (1): a deep violet-black ember on the floor rises
 * through brand purple to a bright pink at the waist, then out through amber,
 * orange and pink again, fading to nothing so the band has no top edge.
 *
 * The waist carries no white. The stock gradient puts a near-white band there
 * because its neighbours are blue and yellow, which cross through grey; ours
 * are violet and amber, so a lit tint of brand pink bridges them instead. It
 * does the same job — the bright core that keeps the glow from reading as one
 * flat wash — without washing out against the white panel behind it.
 *
 * The last stop is brand pink at zero alpha, not a plain `transparent`: many
 * engines interpolate an unqualified `transparent` through rgba(0,0,0,0), which
 * would grey the top of the fade.
 */
export const FOOTER_GRADIENT_STOPS: Stop[] = [
  { offset: 0, color: "#1B0630" },
  { offset: 0.1827, color: "#6C17FE" },
  { offset: 0.2837, color: "#9B6BFF" },
  { offset: 0.4135, color: "#FF5C9A" },
  { offset: 0.5866, color: "#FFA21F" },
  { offset: 0.6827, color: "#FF7A1B" },
  { offset: 0.8029, color: "#F31667" },
  { offset: 1, color: "#F3166700" },
];

/**
 * How the glow behaves.
 *
 * `height` doubles as the scroll distance the reveal takes and the room the
 * footer reserves beneath its content, so the rainbow lands under the wordmark
 * exactly as the page bottoms out.
 *
 * `minReveal` is 0 on purpose: the component's default leaves a thin strip of
 * rainbow pinned to the viewport for the whole page, which would sit under
 * every section above this one. Here the glow belongs to the footer alone.
 */
export const FOOTER_GRADIENT = {
  height: "40vh",
  minReveal: 0,
  stops: FOOTER_GRADIENT_STOPS,
} as const;
