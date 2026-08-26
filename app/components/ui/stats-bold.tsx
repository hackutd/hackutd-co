const SUPPORTING_STATS = [
  {
    value: "3500+",
    title: "Applicants",
    description: "Students applied to HackUTD",
    accent: "text-orange",
  },
  {
    value: "330+",
    title: "Female & Nonbinary",
    description: "Participants",
    accent: "text-pink",
  },
  {
    value: "53",
    title: "Schools",
    description: "Besides UTD represented",
    accent: "text-purple",
  },
] as const;

export const BoldStats = () => {
  return (
    <section
      id="stats"
      aria-labelledby="stats-heading"
      data-section-gradient="stats"
      className="relative isolate flex min-h-screen flex-col justify-center px-8 py-24 sm:px-10 md:py-32 lg:px-12"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 md:gap-16">
        <h2 id="stats-heading" className="sr-only">
          HackUTD by the numbers
        </h2>

        <div className="grid items-stretch gap-8 border-b border-foreground/30 pb-10 md:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] md:gap-12 md:pb-14">
          <div className="flex flex-col justify-center gap-4 lg:flex-row lg:items-baseline lg:justify-start lg:gap-8">
            <span className="shrink-0 text-[clamp(5.5rem,12vw,10rem)] font-medium leading-[0.8] tracking-[-0.075em] text-foreground">
              1200+
            </span>

            <div className="max-w-sm">
              <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Participants
              </h3>
              <p className="mt-2 text-base text-muted md:text-lg">
                At Fall 2025 HackUTD
              </p>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="relative min-h-52 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,var(--color-amber)_0%,var(--color-orange)_28%,var(--color-pink)_62%,var(--color-purple)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
          >
            <div className="absolute -left-[12%] -top-[55%] h-[130%] w-[75%] rounded-full bg-white/55 blur-3xl" />
            <div className="absolute -bottom-[65%] right-[2%] h-[125%] w-[70%] rounded-full bg-purple/60 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(255,255,255,0.4),transparent_22%)]" />
          </div>
        </div>

        <div className="grid sm:grid-cols-3">
          {SUPPORTING_STATS.map((stat) => (
            <article
              key={stat.value}
              className="border-b border-foreground/20 py-8 first:pt-0 last:border-b-0 sm:border-b-0 sm:border-r sm:px-8 sm:py-1 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0"
            >
              <p
                className={`mb-3 text-5xl font-medium tracking-[-0.055em] md:text-6xl ${stat.accent}`}
              >
                {stat.value}
              </p>
              <h3 className="text-lg font-semibold tracking-tight md:text-xl">
                {stat.title}
              </h3>
              <p className="mt-2 max-w-[24ch] text-sm leading-relaxed text-muted md:text-base">
                {stat.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BoldStats;
