import Image from "next/image";
import { projects } from "@/app/data/projects";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function ProjectNumber({ n, small }: { n: number; small?: boolean }) {
  const [a, b] = pad(n);
  const size = small ? "text-8xl" : "text-[160px]";
  const offset = small ? "mt-1" : "mt-2";
  return (
    <div className="absolute right-10 top-0 flex items-start select-none leading-none text-white/[0.07] font-serif">
      <span className={`${size} font-light`}>{a}</span>
      <span className={`${offset} ${size} font-light`}>{b}</span>
    </div>
  );
}

export default function Projects() {
  const [featured, ...rest] = projects;

  return (
    <section id="projects" className="px-8 py-32">
      <div className="grid grid-cols-2 gap-6">
        <div className="relative flex flex-col rounded-3xl border border-white/10 bg-neutral-900 px-8 pb-8 pt-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
          <ProjectNumber n={1} />
          <div className="flex flex-1 items-center justify-center py-12">
            <Image src={featured.image} alt={featured.name} width={400} height={400} className="object-contain" />
          </div>
          <div>
            <p className="mb-1 text-xs uppercase text-muted/60">{featured.label}</p>
            <h3 className="text-3xl font-medium">{featured.name}</h3>
            <p className="mt-3 text-sm text-muted/60">{featured.description}</p>
            <a href={featured.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-[#b5294e] transition-all duration-150 hover:text-sm">Learn More →</a>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {rest.map((project, i) => (
            <div key={project.name} className="relative flex flex-1 flex-row items-end justify-between rounded-3xl border border-white/10 bg-neutral-900 px-8 pb-8 pt-48 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
              <ProjectNumber n={i + 2} small />
              <div>
                <p className="mb-1 text-xs uppercase text-muted/60">{project.label}</p>
                <h3 className="text-3xl font-light">{project.name}</h3>
                <p className="mt-3 text-sm text-muted/60">{project.description}</p>
                <a href={project.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-[#b5294e] transition-all duration-150 hover:text-sm">Learn More →</a>
              </div>
              <Image src={project.image} alt={project.name} width={160} height={160} className="-mr-4 self-center object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
