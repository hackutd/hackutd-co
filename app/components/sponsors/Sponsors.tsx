export default function Sponsors() {
  return (
    <section id="sponsors" className="px-8 py-32">
      <div className="flex items-end justify-between">
        <h2 className="text-4xl font-bold md:text-5xl">Our Sponsors</h2>
        <a
          href="mailto:sponsors@hackutd.co"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Reach us at sponsors@hackutd.co
        </a>
      </div>

      {/* Sponsor logos grid placeholder */}
      <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex h-20 items-center justify-center rounded-lg bg-white/5">
            <span className="text-sm text-muted">Sponsor</span>
          </div>
        ))}
      </div>
    </section>
  );
}
