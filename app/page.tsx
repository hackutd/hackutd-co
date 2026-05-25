import PageBackground from "./components/background/PageBackground";
import Navbar from "./components/navbar/Navbar";
import Hero from "./components/hero/Hero";
import Mission from "./components/mission/Mission";
import Teams from "./components/teams/Teams";
import Projects from "./components/projects/Projects";
import Timeline from "./components/timeline/Timeline";
import Sponsors from "./components/sponsors/Sponsors";
import Footer from "./components/footer/Footer";

export default function Home() {
  return (
    <>
      <PageBackground />
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Mission />
        <Teams />
        <Projects />
        <Timeline />
        <Sponsors />
        <div
          aria-hidden="true"
          className="pointer-events-none h-[calc(440px+12vh)] sm:h-[calc(400px+12vh)] md:h-[calc(280px+10vh)]"
        />
      </div>
      <Footer />
    </>
  );
}
