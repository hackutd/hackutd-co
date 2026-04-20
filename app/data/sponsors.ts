export interface Sponsor {
  name: string;
  logo?: string;
  url?: string;
}

export const SPONSORS = [
  { name: "fb",   logo: "/sponsor-logos/icons8-facebook-48.png",   url: "https://google.com"   },
  { name: "rando", logo: "/sponsor-logos/1.png",                   url: "https://google.com"   },
  { name: "rando2", logo: "/sponsor-logos/2.png",                   url: "https://google.com"   },
  // ↑ drop a png in /public/sponsor-logos/, add one line here. done.
];
