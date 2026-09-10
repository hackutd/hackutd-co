import type { StaticImageData } from "next/image";
import harp from "@/app/assets/projects/harp.png";
import jury from "@/app/assets/projects/jury.png";
import hackutdLogo from "@/app/assets/brand/logo.svg";

export type Project = {
  name: string;
  label: string;
  description: string;
  link: string;
  /** Statically imported so next/image gets the intrinsic size from the file */
  image: StaticImageData;
};

export const projects: Project[] = [
  {
    name: "Harp",
    label: "Applications",
    description: "Hacker Applications & Review Platform.",
    link: "https://github.com/hackutd/harp",
    image: harp,
  },
  {
    name: "Jury",
    label: "Judging",
    description: "A modern hackathon judging platform.",
    link: "https://github.com/hackutd/jury",
    image: jury,
  },
  {
    name: "HackUTD Docs",
    label: "Open Source",
    description: "Centralized documentation for all of our open-source software.",
    link: "https://docs.hackutd.co",
    image: hackutdLogo,
  },
  {
    name: "HackUTD Guide",
    label: "Tech Platform",
    description:
      "Find guides, resources, and everything you need to know about a hackathon in one place.",
    link: "https://guide.hackutd.co",
    image: hackutdLogo,
  },
];
