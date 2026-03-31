import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Mission from "./components/Mission";
import DirectorsMessage from "./components/DirectorsMessage";
import Constellation from "./components/Constellation";
import Projects from "./components/Projects";
import Timeline from "./components/Timeline";
import Sponsors from "./components/Sponsors";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Mission />
      <DirectorsMessage />
      <Constellation />
      <Projects />
      <Timeline />
      <Sponsors />
      <Footer />
    </>
  );
}
