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
 * Exported as an array for components like the 3D globe that need to iterate over all sponsors.
 * Maps internal 'img' and 'link' to 'logo' and 'url' to match component expectations.
 */
export const SPONSORS = Object.values(SPONSORS_MAP).map((s) => ({
  ...s,
  logo: s.img,
  url: s.link,
}));

// Keep the map as the default export for potential key-based lookups
export default SPONSORS_MAP;