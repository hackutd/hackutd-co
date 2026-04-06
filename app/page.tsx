import Navbar from "./components/navbar/Navbar";
import Hero from "./components/hero/Hero";
import Mission from "./components/mission/Mission";
import DirectorsMessage from "./components/mission/DirectorsMessage";
import Teams from "./components/teams/Teams";
import Projects from "./components/projects/Projects";
import Timeline from "./components/timeline/Timeline";
import Sponsors from "./components/sponsors/Sponsors";
import Footer from "./components/footer/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Mission />
      <DirectorsMessage />
      <Teams />
      <Projects />
      <Timeline />
      <Sponsors />
      <Footer />
    </>
  );
}
