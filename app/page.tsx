import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Portfolio from "@/components/Portfolio";
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
        <Portfolio />
        <QuackShot />
        <Photography />
        <Testimonials />
        <Contact />
      </main>
    </>
  );
}
