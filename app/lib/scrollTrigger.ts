import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let isConfigured = false;

export function configureScrollTrigger() {
  if (isConfigured) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({
    ignoreMobileResize: true,
  });

  isConfigured = true;
}
