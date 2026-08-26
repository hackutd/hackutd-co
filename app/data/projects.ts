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
    name: "Jury",
    label: "Competition",
    description: "Fair, fast project judging.",
    link: "https://github.com/hackutd/jury",
    image: "/projects/jury.png",
    imageWidth: 311,
    imageHeight: 324,
  },
  {
    name: "Harp",
    label: "Spring Event",
    description: "Design meets hardware.",
    link: "https://github.com/hackutd/harp",
    image: "/projects/harp.png",
    imageWidth: 512,
    imageHeight: 512,
  },
];
