import Image from "next/image";

export default function Projects() {
  return (
    <section id="projects" className="px-8 py-32">
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] px-8 pb-8 pt-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
          <div className="flex flex-1 items-center justify-center py-12">
            <Image src="/oldImg.png" alt="HackUTD 2026" width={400} height={400} className="object-contain" />
          </div>
          <div>
            <p className="mb-1 text-xs uppercase text-muted/60">Fall 2026</p>
            <h3 className="text-3xl font-medium">HackUTD 2026</h3>
            <p className="mt-3 text-sm text-muted/60">The largest hackathon at UT Dallas returns with new challenge tracks.</p>
            <p className="mt-2 inline-block text-xs font-semibold text-[#b5294e] transition-all duration-150 hover:text-sm">Learn More →</p>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-1 flex-col justify-end rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] px-8 pb-8 pt-48 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <p className="mb-1 text-xs uppercase text-muted/60">Competition</p>
            <h3 className="text-3xl font-light">Jury</h3>
            <p className="mt-3 text-sm text-muted/60">Industry professionals evaluate projects across execution and impact.</p>
            <p className="mt-2 inline-block text-xs font-semibold text-[#b5294e] transition-all duration-150 hover:text-sm">Learn More →</p>
          </div>
          <div className="flex flex-1 flex-col justify-end rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] px-8 pb-8 pt-48 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <p className="mb-1 text-xs uppercase text-muted/60">Spring Event</p>
            <h3 className="text-3xl font-light">Harp</h3>
            <p className="mt-3 text-sm text-muted/60">A creative-focused companion event pairing design and hardware.</p>
            <p className="mt-2 inline-block text-xs font-semibold text-[#b5294e] transition-all duration-150 hover:text-sm">Learn More →</p>
          </div>
        </div>
      </div>
    </section>
  );
}
