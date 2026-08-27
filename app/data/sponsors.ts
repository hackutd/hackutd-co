// raster imports - moved to public folder
const utd_department_cs = "/sponsors/utd_department_cs.png";
const toyota = "/sponsors/toyota.png";
const eog = "/sponsors/eog.png";
const sg = "/sponsors/sg.png";
const cbre = "/sponsors/CBRE.png";
const rc = "/sponsors/rc.png";
const axxess = "/sponsors/axxess.png";
const cognizant = "/sponsors/cognizant.png";
const scale = "/sponsors/scale.png";

const nmc2 = "/sponsors/nmc2_dark.webp";
// SVG imports
// for further context, the reason these are in separate locations is because I didn't want to work on configuring
// an SVG loader for webpack for the default import; this could be a potential future improvement
const SVG_LOC = "/sponsors/svg";
const nvidia = `${SVG_LOC}/nvidia_dark.svg`;
const google = `${SVG_LOC}/google.svg`;
const statefarm = `${SVG_LOC}/statefarm.svg`;
const mlh = `${SVG_LOC}/mlh.svg`;
const capital_one = `${SVG_LOC}/capital_one.svg`;
const goldman_sachs = `${SVG_LOC}/goldman_sachs.svg`;
const facebook = `${SVG_LOC}/facebook.svg`;
const jpmorgan = `${SVG_LOC}/jpmorgan_chase.svg`;
const sticker_mule = `${SVG_LOC}/sticker_mule.svg`;
const standout_stickers = `${SVG_LOC}/standout_stickers.svg`;
const ti = `${SVG_LOC}/ti.svg`;
const l3 = `${SVG_LOC}/l3.svg`;
const veolia = `${SVG_LOC}/veolia.png`;
const CoreLogic = `${SVG_LOC}/CoreLogic.png`;
const FannieMae = `${SVG_LOC}/FannieMae_dark.svg`;
const Fidelity = `${SVG_LOC}/Fidelity_dark.svg`;
const Frontier = `${SVG_LOC}/Frontier.png`;
const Geico = `${SVG_LOC}/Geico.png`;
const Incogni = `${SVG_LOC}/Incogni_dark.png`;
const MME = `${SVG_LOC}/MME.jpeg`;
const NordPass = `${SVG_LOC}/NordPass_dark.png`;
const NordVPN = `${SVG_LOC}/NordVPN_dark.svg`;
const PRHI = `${SVG_LOC}/PRHI.png`;
const PNC = `${SVG_LOC}/PNC.png`;
const benq = `${SVG_LOC}/benq.png`;
const SNAP_AR = `${SVG_LOC}/SnapAR.png`;
const SNAP_GHOST = `${SVG_LOC}/SnapGhost_dark.svg`;
const INFOSYS = `${SVG_LOC}/Infosys.png`;
const PINATA = `${SVG_LOC}/pinata.png`;
const tmobile = `${SVG_LOC}/tmobile.svg`;

const SPONSORS_MAP = {
  // Ordered by brand recognition — headline sponsors first, community/partner logos last.
  GOOGLE: {
    name: "Google",
    img: google,
    link: "https://about.google/",
  },
  NVIDIA: {
    name: "NVIDIA",
    img: nvidia,
    link: "https://www.nvidia.com/",
  },
  FACEBOOK: {
    name: "Facebook",
    img: facebook,
    link: "https://www.meta.com/",
  },
  T_MOBILE: {
    name: "T-Mobile",
    img: tmobile,
    link: "https://www.t-mobile.com/",
  },
  TOYOTA: {
    name: "Toyota",
    img: toyota,
    link: "https://www.toyota.com/",
  },
  JPMORGAN_CHASE: {
    name: "JP Morgan Chase & Co.",
    img: jpmorgan,
    link: "https://www.jpmorganchase.com/",
    needs_white_bg: true,
  },
  GOLDMAN_SACHS: {
    name: "Goldman Sachs",
    img: goldman_sachs,
    link: "http://www.goldmansachs.com/",
  },
  CAPITAL_ONE: {
    name: "Capital One",
    img: capital_one,
    needs_white_bg: true,
    link: "http://campus.capitalone.com/",
  },
  TI: {
    name: "Texas Instruments",
    img: ti,
    link: "https://www.ti.com/",
  },
  STATEFARM: {
    name: "StateFarm",
    img: statefarm,
    link: "https://www.statefarm.com/",
  },
  GEICO: {
    name: "Geico",
    img: Geico,
    link: "https://geico.wd1.myworkdayjobs.com/External",
  },
  FIDELITY: {
    name: "Fidelity",
    img: Fidelity,
    link: "https://leap.fidelitycareers.com",
  },
  SNAP_AR: {
    name: "Snap AR",
    img: SNAP_AR,
    link: "https://ar.snap.com/?lang=en-US",
  },
  SNAP_GHOST: {
    name: "Snap Ghost",
    img: SNAP_GHOST,
    link: "https://ar.snap.com/?lang=en-US",
  },
  PNC: {
    name: "PNC Bank",
    img: PNC,
    link: "https://www.pnc.com/",
  },
  INFOSYS: {
    name: "Infosys",
    img: INFOSYS,
    link: "https://www.infosys.com/",
  },
  COGNIZANT: {
    name: "Cognizant",
    img: cognizant,
    link: "https://www.cognizant.com/",
  },
  SCALE: {
    name: "Scale AI",
    img: scale,
    link: "https://scale.com/",
  },
  L3_HARRIS: {
    name: "L3 Harris",
    img: l3,
    link: "https://www.l3harris.com/",
  },
  CBRE: {
    name: "CBRE",
    img: cbre,
    link: "https://www.cbre.com/",
  },
  FANNIE_MAE: {
    name: "Fannie Mae",
    img: FannieMae,
    link: "https://www.fanniemae.com/careers",
  },
  EOG: {
    name: "EOG Resources",
    img: eog,
    link: "https://www.eogresources.com/",
  },
  VEOLIA: {
    name: "Veolia",
    img: veolia,
    link: "https://www.veolianorthamerica.com/",
  },
  FRONTIER: {
    name: "Frontier",
    img: Frontier,
    link: "https://frontier-careers.com/",
  },
  RING_CENTRAL: {
    name: "Ring Central",
    img: rc,
    link: "https://www.ringcentral.com/",
  },
  NORDVPN: {
    name: "Nord VPN",
    link: "https://nordvpn.com/",
    img: NordVPN,
  },
  NORDPASS: {
    name: "Nord Pass",
    link: "https://nordpass.com/",
    img: NordPass,
  },
  BENQ: {
    name: "BenQ",
    img: benq,
    link: "https://www.benq.com/en-us/index.html",
  },
  CORE_LOGIC: {
    name: "Core Logic",
    img: CoreLogic,
    link: "https://www.corelogic.com/culture/",
  },
  AXXESS: {
    name: "Axxess",
    img: axxess,
    link: "https://www.axxess.com/",
  },
  INCOGNI: {
    name: "Incogni",
    img: Incogni,
    link: "https://incogni.com/",
  },
  PINATA: {
    name: "Pinata",
    img: PINATA,
    link: "https://pinata.cloud/",
  },
  MLH: {
    name: "MLH",
    img: mlh,
    link: "https://mlh.io/",
    needs_white_bg: true,
  },
  STICKER_MULE: {
    name: "Sticker Mule",
    img: sticker_mule,
    link: "https://mule.to/p33e", // note: link is custom for sponsorship purposes
    needs_white_bg: true,
  },
  STANDOUT_STICKERS: {
    name: "Standout Stickers",
    img: standout_stickers,
    link: "http://hackp.ac/mlh-StandOutStickers-hackathons",
  },
  UTD_DPT_CS: {
    name: "UTD Department of Computer Science",
    img: utd_department_cs,
    link: "https://cs.utdallas.edu/",
  },
  STUDENT_GOV: {
    name: "UTD Student Government",
    img: sg,
    link: "https://sg.utdallas.edu/",
  },
  NMC2: {
    name: "NMC2",
    img: nmc2,
    link: "https://www.nmc2.com/",
  },
  MME: {
    name: "Modern Market Eatery",
    img: MME,
    link: "https://modernmarket.com/",
  },
  PRHI: {
    name: "PRHI",
    img: PRHI,
    link: "http://patientsafetytech.com/",
  },
};

/**
 * Intrinsic pixel dimensions of every logo file, so the sponsor grids can render
 * through next/image instead of a raw <img>. Without a real aspect ratio the
 * grid either distorts the logo or downloads a 4K variant for a 48px-tall slot.
 *
 * Read straight off the files' own headers (PNG IHDR, JPEG SOF, WebP VP8L, and
 * the SVG width/height or viewBox). Regenerate after adding or replacing a logo:
 *
 *   node scripts/sponsor-logo-dimensions.mjs
 */
const LOGO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "/sponsors/axxess.png": { width: 1200, height: 545 },
  "/sponsors/CBRE.png": { width: 1200, height: 422 },
  "/sponsors/cognizant.png": { width: 168, height: 50 },
  "/sponsors/eog.png": { width: 1200, height: 536 },
  "/sponsors/nmc2_dark.webp": { width: 1080, height: 1080 },
  "/sponsors/rc.png": { width: 501, height: 109 },
  "/sponsors/scale.png": { width: 187, height: 60 },
  "/sponsors/sg.png": { width: 300, height: 300 },
  "/sponsors/svg/benq.png": { width: 606, height: 332 },
  "/sponsors/svg/capital_one.svg": { width: 363, height: 130 },
  "/sponsors/svg/CoreLogic.png": { width: 1600, height: 279 },
  "/sponsors/svg/facebook.svg": { width: 431, height: 83 },
  "/sponsors/svg/FannieMae_dark.svg": { width: 812, height: 159 },
  "/sponsors/svg/Fidelity_dark.svg": { width: 2500, height: 549 },
  "/sponsors/svg/Frontier.png": { width: 1029, height: 1200 },
  "/sponsors/svg/Geico.png": { width: 1629, height: 640 },
  "/sponsors/svg/goldman_sachs.svg": { width: 169, height: 169 },
  "/sponsors/svg/google.svg": { width: 379, height: 128 },
  "/sponsors/svg/Incogni_dark.png": { width: 925, height: 426 },
  "/sponsors/svg/Infosys.png": { width: 1080, height: 1080 },
  "/sponsors/svg/jpmorgan_chase.svg": { width: 805, height: 101 },
  "/sponsors/svg/l3.svg": { width: 168, height: 36 },
  "/sponsors/svg/mlh.svg": { width: 284, height: 119 },
  "/sponsors/svg/MME.jpeg": { width: 302, height: 165 },
  "/sponsors/svg/NordPass_dark.png": { width: 2000, height: 425 },
  "/sponsors/svg/NordVPN_dark.svg": { width: 142, height: 32 },
  "/sponsors/svg/nvidia_dark.svg": { width: 1701, height: 324 },
  "/sponsors/svg/pinata.png": { width: 581, height: 851 },
  "/sponsors/svg/PNC.png": { width: 650, height: 200 },
  "/sponsors/svg/PRHI.png": { width: 1600, height: 823 },
  "/sponsors/svg/SnapAR.png": { width: 564, height: 138 },
  "/sponsors/svg/SnapGhost_dark.svg": { width: 800, height: 800 },
  "/sponsors/svg/standout_stickers.svg": { width: 600, height: 600 },
  "/sponsors/svg/statefarm.svg": { width: 657, height: 91 },
  "/sponsors/svg/sticker_mule.svg": { width: 512, height: 71 },
  "/sponsors/svg/ti.svg": { width: 744, height: 275 },
  "/sponsors/svg/tmobile.svg": { width: 130, height: 130 },
  "/sponsors/svg/veolia.png": { width: 1280, height: 320 },
  "/sponsors/toyota.png": { width: 471, height: 117 },
  "/sponsors/utd_department_cs.png": { width: 1374, height: 428 },
};

/** Nominal 2:1 for a logo added without a regenerated dimension entry. */
const FALLBACK_LOGO_DIMENSIONS = { width: 240, height: 120 };

/**
 * Exported as an array for components like the 3D globe that need to iterate over all sponsors.
 * Maps internal 'img' and 'link' to 'logo' and 'url' to match component expectations.
 */
export const SPONSORS = Object.values(SPONSORS_MAP).map((s) => ({
  ...s,
  logo: s.img,
  url: s.link,
  ...(LOGO_DIMENSIONS[s.img] ?? FALLBACK_LOGO_DIMENSIONS),
}));

// Keep the map as the default export for potential key-based lookups
export default SPONSORS_MAP;