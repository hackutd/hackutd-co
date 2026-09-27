# Brand assets

Everything here is generated from `app/components/preloader/logoPaths.ts`
(derived from `app/assets/brand/black-hackutd-logo.svg`) by
`node scripts/brand-assets.mts` (needs `google-chrome` and `ffmpeg`), so the
web preloader, the Lottie file and the video outros share one animation.

| File                               | Use                                                                 |
| ---------------------------------- | ------------------------------------------------------------------- |
| `hackutd-logo-draw.json`           | Lottie, white glyphs, 2248x785, 60 fps, 2.6 s. Web/app embeds.      |
| `hackutd-logo-draw-white.webm`     | VP9 + alpha, white glyphs, 1080x1920, 30 fps, 3.5 s. Dark footage.  |
| `hackutd-logo-draw-white-4444.mov` | ProRes 4444 + alpha, white glyphs. Final Cut / After Effects.       |
| `hackutd-logo-draw-black.webm`     | VP9 + alpha, black glyphs. Light footage.                           |
| `hackutd-logo-draw-black-4444.mov` | ProRes 4444 + alpha, black glyphs.                                  |
| `hackutd-logo-draw.mp4`            | H.264, white glyphs on the site dark (#1a1a1a), 1080x1920. Reels.   |

The pink accent glyph is brand `#FF005E` in every variant.

Timing: glyphs stroke on left to right over 2 s, the fill fades in from
1.6–2.2 s, the stroke fades out by 2.4 s, then the clips hold the finished
logo.
