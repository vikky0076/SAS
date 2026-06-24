import { useEffect } from 'react';
import AINetworkBackground from './components/AINetworkBackground';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Problem from './components/Problem';
import Solution from './components/Solution';
import Features from './components/Features';
import DashboardPreview from './components/DashboardPreview';
import Benefits from './components/Benefits';
import TechStack from './components/TechStack';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function App() {
  // Global interactive cursor glow coordinate listener
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      document.documentElement.style.setProperty('--mouse-x', `${x}px`);
      document.documentElement.style.setProperty('--mouse-y', `${y}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {/* 1. Interactive AI Neural Particle Background */}
      <AINetworkBackground />

      {/* 2. Global Spotlight Glow (Mouse Follow) */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          pointerEvents: 'none',
          background: `radial-gradient(circle 450px at var(--mouse-x, -500px) var(--mouse-y, -500px), rgba(99, 102, 241, 0.05), transparent 80%)`
        }}
      />

      {/* 3. Navigation Header */}
      <Navbar />

      {/* 4. App Section Layers */}
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
