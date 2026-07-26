import PageBackground from "./components/background/PageBackground";
import Navbar from "./components/navbar/Navbar";
import Hero from "./components/hero/Hero";
import Mission from "./components/mission/Mission";
import Teams from "./components/teams/Teams";
import Projects from "./components/projects/Projects";
import Timeline from "./components/timeline/Timeline";
import Sponsors from "./components/sponsors/Sponsors";
import FooterReveal from "./components/footer/FooterReveal";
import ThemeCurtain from "./components/theme/ThemeCurtain";

export default function Home() {
  return (
    <>
      <PageBackground />
      <div className="relative z-10">
        <ThemeCurtain />
        <Navbar />
        <Hero />
        <Mission />
        <Teams />
        <Projects />
        <Timeline />
        <Sponsors />
        <FooterReveal />
      </div>
    </>
  );
}
