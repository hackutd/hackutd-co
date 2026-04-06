const events = [
  { year: "2017", name: "HackUTD I" },
  { year: "2018", name: "HackUTD II" },
  { year: "2019", name: "HackUTD III" },
  { year: "2022", name: "HackUTD IV" },
  { year: "2023", name: "HackUTD V" },
  { year: "2024", name: "HackUTD VI" },
  { year: "2025", name: "HackUTD VII" },
];

export default function Timeline() {
  return (
    <section id="hackathons" className="px-8 py-32">
      <div className="flex items-center gap-4 overflow-x-auto">
        {events.map((event) => (
          <div
            key={event.year}
            className="flex shrink-0 flex-col items-center gap-2"
          >
            <div className="h-4 w-4 rounded-full bg-purple" />
            <span className="text-sm font-medium">{event.year}</span>
            <span className="text-xs text-muted">{event.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
