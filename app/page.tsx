import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import SelectedWork from "@/components/SelectedWork";
import QuackShot from "@/components/QuackShot";
import Photography from "@/components/Photography";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import SmoothScroll from "@/components/SmoothScroll";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Nav />
      <main>
        <Hero />
        <About />
        <SelectedWork />
        <QuackShot />
        <Photography />
        <Testimonials />
        <Contact />
      </main>
    </>
  );
}
