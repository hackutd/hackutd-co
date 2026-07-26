/**
 * How long navbar chrome takes to cross-fade when the palette changes — both
 * on scroll, as sections hand the navbar between its light and dark themes,
 * and on a site theme swap.
 *
 * Deliberately short: halfway through a swap the text sits between the two
 * palettes and the two logo images are both half-transparent, so the whole bar
 * loses contrast. Long enough to notice at 300ms; at this length the blend is
 * gone before it registers as the navbar going blank.
 */
export const NAVBAR_COLOR_TRANSITION = "duration-150";
