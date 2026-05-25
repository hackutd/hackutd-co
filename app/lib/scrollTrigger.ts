import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

let isConfigured = false;

export function configureScrollTrigger() {
  if (isConfigured) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger, CustomEase);
  ScrollTrigger.config({
    ignoreMobileResize: true,
  });

  isConfigured = true;
}
