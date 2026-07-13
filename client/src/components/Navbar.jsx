import { useState, useEffect } from 'react';
import { Shield, Menu, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo">
          <Shield className="logo-icon" size={26} />
          <span className="logo-text">Attend<span className="text-accent">AI</span></span>
        </Link>

        {/* Desktop Menu */}
        <div className="navbar-menu-desktop">
          <a href="#problems" className="nav-link">Challenges</a>
          <a href="#solution" className="nav-link">How it Works</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#dashboard" className="nav-link">Portal Preview</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#contact" className="nav-link">Contact</a>
        </div>

        <div className="navbar-actions-desktop">
          <Link to="/login" className="btn btn-primary nav-btn">
            Login Portal <ArrowRight size={16} />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle Menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`navbar-menu-mobile ${isOpen ? 'active' : ''}`}>
        <a href="#problems" className="mobile-nav-link" onClick={() => setIsOpen(false)}>Challenges</a>
        <a href="#solution" className="mobile-nav-link" onClick={() => setIsOpen(false)}>How it Works</a>
        <a href="#features" className="mobile-nav-link" onClick={() => setIsOpen(false)}>Features</a>
        <a href="#dashboard" className="mobile-nav-link" onClick={() => setIsOpen(false)}>Portal Preview</a>
        <a href="#pricing" className="mobile-nav-link" onClick={() => setIsOpen(false)}>Pricing</a>
        <a href="#contact" className="mobile-nav-link" onClick={() => setIsOpen(false)}>Contact</a>
        <Link to="/login" className="btn btn-primary mobile-nav-btn" onClick={() => setIsOpen(false)}>
          Login Portal <ArrowRight size={16} />
        </Link>
      </div>
    </nav>
  );
}
