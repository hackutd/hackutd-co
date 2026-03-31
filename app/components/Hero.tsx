export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
        The Largest 24-Hour Hackathon in Texas
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted">
        Join thousands of students for a weekend of building, learning, and fun.
      </p>
      <a
        href="#apply"
        className="mt-8 rounded-full bg-pink px-8 py-3 font-medium text-white transition-opacity hover:opacity-90"
      >
        Apply Now
      </a>
      {/* Skyline illustration + gradient swoosh will go here */}
    </section>
  );
}
