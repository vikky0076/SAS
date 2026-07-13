import AINetworkBackground from '../components/AINetworkBackground';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Problem from '../components/Problem';
import Solution from '../components/Solution';
import Features from '../components/Features';
import DashboardPreview from '../components/DashboardPreview';
import Benefits from '../components/Benefits';
import TechStack from '../components/TechStack';
import Testimonials from '../components/Testimonials';
import Pricing from '../components/Pricing';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <>
      {/* 1. Interactive AI Neural Particle Background */}
      <AINetworkBackground />

      {/* 2. Navigation Header */}
      <Navbar />

      {/* 3. App Section Layers */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Hero />
        <Problem />
        <Solution />
        <Features />
        <DashboardPreview />
        <Benefits />
        <TechStack />
        <Testimonials />
        <Pricing />
        <Contact />
        <Footer />
      </div>
    </>
  );
}
