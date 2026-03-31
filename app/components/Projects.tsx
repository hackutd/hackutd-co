const projects = [
  {
    name: "HackUTD 2026",
    description: "Our flagship hackathon event site.",
  },
  {
    name: "Lost in the Pages",
    description: "A creative interactive experience.",
  },
  {
    name: "Jury",
    description: "Hackathon judging and scoring platform.",
  },
  {
    name: "Harp",
    description: "Internal tooling for organizer workflows.",
  },
];

export default function Projects() {
  return (
    <section id="projects" className="px-8 py-32">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project.name}
            className="rounded-lg bg-white/5 p-8"
          >
            <h3 className="text-xl font-bold">{project.name}</h3>
            <p className="mt-2 text-muted">{project.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
