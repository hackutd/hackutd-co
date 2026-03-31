const teams = ["Marketing", "Tech"];

export default function Constellation() {
  return (
    <section id="team" className="px-8 py-32">
      <h2 className="text-5xl font-bold leading-tight md:text-6xl">
        The
        <br />
        Constellation
      </h2>

      <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
        {teams.map((team) => (
          <div key={team} className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-medium text-pink">{team}</h3>
            {/* Team member nodes will go here */}
            <div className="h-48 w-full rounded-lg bg-white/5" />
          </div>
        ))}
      </div>
    </section>
  );
}
