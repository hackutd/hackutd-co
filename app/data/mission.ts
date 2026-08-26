export const missionContent = {
  statement:
    // A newline breaks the statement into its own spaced block, and *marked*
    // runs are bold key words — see BlurStatement.
    "We inspire students to *innovate* and learn *new technologies* through *hackathons*, 24-hour events with challenges, *free food & merch*, and *fun games & activities*. We host *HackUTD*, *North America's largest* 24 university hackathon. We also assist with other hackathons at UTD, and host helpful *workshops* that anyone can attend. Regardless of what we’re working on, we aim to make our hackathons *accessible and open to everyone*.\n*Hope to see you here!*",
  directorsMessage: {
    /** Rendered uppercase — keep normal casing here */
    eyebrow: "HackUTD 2026 — Directors",
    quote:
      "We're the directors of HackUTD this year and are very excited for the next iteration of our event. Our team works hard all year round to make our events possible, and we can't wait to put on one more successful hackathon!",
    authors: "Veer Shah & Alan Roybal",
    /** Rendered uppercase — keep normal casing here */
    role: "Co-Directors, HackUTD '26",
    photo: {
      src: "/mission/directors.JPG",
      alt: "Veer Shah and Alan Roybal, HackUTD 2026 co-directors",
    },
  },
} as const;
