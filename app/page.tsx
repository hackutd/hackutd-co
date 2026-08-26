import { SCROLL_ROOT_ATTR } from "./lib/scrollAnchor";
import PageBackground from "./components/background/PageBackground";
import Navbar from "./components/navbar/Navbar";
import Hero from "./components/hero/Hero";
import Mission from "./components/mission/Mission";
import BoldStats from "./components/ui/stats-bold";
import Teams from "./components/teams/Teams";
import Projects from "./components/projects/Projects";
import Timeline from "./components/timeline/Timeline";
import Sponsors from "./components/sponsors/Sponsors";
import Footer from "./components/footer/Footer";
import ThemeCurtain from "./components/theme/ThemeCurtain";

export default function Home() {
  return (
    <>
      <PageBackground />
      {/* The in-flow children of this wrapper are the page's scroll
          sections; the resize anchor reads them from here. */}
      <div {...{ [SCROLL_ROOT_ATTR]: "" }} className="relative z-10">
        <ThemeCurtain />
        <Navbar />
        <Hero />
        <Mission afterStatement={<BoldStats />} />
        <Teams />
        <Projects />
        <Timeline />
        <Sponsors />
        <Footer />
      </div>
    </>
  );
}
