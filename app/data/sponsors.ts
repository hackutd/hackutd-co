import type { StaticImageData } from "next/image";

// Static imports so next/image reads each logo's intrinsic size from the file
// at build time; a missing or renamed file fails the build instead of 404ing.
import utd_department_cs from "@/app/assets/sponsors/utd_department_cs.png";
import toyota from "@/app/assets/sponsors/toyota.png";
import eog from "@/app/assets/sponsors/eog.png";
import sg from "@/app/assets/sponsors/sg.png";
import cbre from "@/app/assets/sponsors/CBRE.png";
import rc from "@/app/assets/sponsors/rc.png";
import axxess from "@/app/assets/sponsors/axxess.png";
import cognizant from "@/app/assets/sponsors/cognizant.png";
import scale from "@/app/assets/sponsors/scale.png";
import nmc2 from "@/app/assets/sponsors/nmc2_dark.webp";
import nvidia from "@/app/assets/sponsors/nvidia_dark.svg";
import google from "@/app/assets/sponsors/google.svg";
import statefarm from "@/app/assets/sponsors/statefarm.svg";
import mlh from "@/app/assets/sponsors/mlh.svg";
import capital_one from "@/app/assets/sponsors/capital_one.svg";
import goldman_sachs from "@/app/assets/sponsors/goldman_sachs.svg";
import facebook from "@/app/assets/sponsors/facebook.svg";
import jpmorgan from "@/app/assets/sponsors/jpmorgan_chase.svg";
import sticker_mule from "@/app/assets/sponsors/sticker_mule.svg";
import standout_stickers from "@/app/assets/sponsors/standout_stickers.svg";
import ti from "@/app/assets/sponsors/ti.svg";
import l3 from "@/app/assets/sponsors/l3.svg";
import veolia from "@/app/assets/sponsors/veolia.png";
import CoreLogic from "@/app/assets/sponsors/CoreLogic.png";
import FannieMae from "@/app/assets/sponsors/FannieMae_dark.svg";
import Fidelity from "@/app/assets/sponsors/Fidelity_dark.svg";
import Frontier from "@/app/assets/sponsors/Frontier.png";
import Geico from "@/app/assets/sponsors/Geico.png";
import Incogni from "@/app/assets/sponsors/Incogni_dark.png";
import MME from "@/app/assets/sponsors/MME.jpeg";
import NordPass from "@/app/assets/sponsors/NordPass_dark.png";
import NordVPN from "@/app/assets/sponsors/NordVPN_dark.svg";
import PRHI from "@/app/assets/sponsors/PRHI.png";
import PNC from "@/app/assets/sponsors/PNC.png";
import benq from "@/app/assets/sponsors/benq.png";
import SNAP_AR from "@/app/assets/sponsors/SnapAR.png";
import SNAP_GHOST from "@/app/assets/sponsors/SnapGhost_dark.svg";
import INFOSYS from "@/app/assets/sponsors/Infosys.png";
import PINATA from "@/app/assets/sponsors/pinata.png";
import tmobile from "@/app/assets/sponsors/tmobile.svg";

export type Sponsor = {
  name: string;
  img: StaticImageData;
  link: string;
  needs_white_bg?: boolean;
};

const SPONSORS_MAP: Record<string, Sponsor> = {
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
