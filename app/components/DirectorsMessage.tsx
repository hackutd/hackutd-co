export default function DirectorsMessage() {
  return (
    <section className="flex flex-col items-center px-8 py-32">
      {/* Director photo placeholder */}
      <div className="h-64 w-full max-w-lg rounded-lg bg-white/5" />

      <blockquote className="mt-8 max-w-lg text-center text-muted">
        <p>
          We&apos;re the directors of HackUTD this year and we&apos;re very excited for
          the next iteration of our event. Our team works hard all year round to
          make our events possible, and we can&apos;t wait to put on one more
          successful hackathon!
        </p>
        <footer className="mt-4 font-medium text-foreground">
          — Mia Dina &amp; Amy Leaning
        </footer>
      </blockquote>

      {/* Team avatar row */}
      <div className="mt-8 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-10 rounded-full bg-white/10" />
        ))}
      </div>
    </section>
  );
}
