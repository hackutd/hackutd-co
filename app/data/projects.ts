export type Project = {
  name: string;
  label: string;
  description: string;
  link: string;
  /** Path under public/ */
  image: string;
  /** Intrinsic pixel dimensions of the asset, so next/image can reserve the right aspect ratio */
  imageWidth: number;
  imageHeight: number;
};

export const projects: Project[] = [
  {
    name: "HackUTD 2026",
    label: "Fall 2026",
    description: "Texas' largest 24-hour hackathon returns.",
    link: "https://zeroday.hackutd.co/",
    image: "/projects/zero_day.png",
    imageWidth: 781,
    imageHeight: 307,
  },
  {
    name: "Harp",
    label: "Applications",
    description: "Hacker Applications & Review Platform.",
    link: "https://github.com/hackutd/harp",
    image: "/projects/harp.png",
    imageWidth: 512,
    imageHeight: 512,
  },
  {
    name: "Jury",
    label: "Judging",
    description: "A modern hackathon judging platform.",
    link: "https://github.com/hackutd/jury",
    image: "/projects/jury.png",
    imageWidth: 311,
    imageHeight: 324,
  },
  {
    name: "HackUTD Docs",
    label: "Open Source",
    description: "Centralized documentation for all of our open-source software.",
    link: "https://docs.hackutd.co",
    image: "/brand/logo.svg",
    imageWidth: 2000,
    imageHeight: 2000,
  },
  {
    name: "HackUTD Guide",
    label: "Tech Platform",
    description:
      "Find guides, resources, and everything you need to know about a hackathon in one place.",
    link: "https://guide.hackutd.co",
    image: "/brand/logo.svg",
    imageWidth: 2000,
    imageHeight: 2000,
  },
];
