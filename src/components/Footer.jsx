import { Shield, Heart } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="container footer-content-grid">
        
        {/* Company Info Column */}
        <div className="footer-brand-col">
          <a href="#" className="footer-logo">
            <Shield className="footer-logo-icon" size={24} />
            <span>Attend<span className="logo-accent">AI</span></span>
          </a>
          <p className="footer-tagline">
            Automating classroom registries and engagement analytics with secure edge deep learning networks.
          </p>
          <div className="footer-socials">
            {/* Custom SVG for X / Twitter */}
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
            </a>
            {/* Custom SVG for LinkedIn */}
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            {/* Custom SVG for GitHub */}
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </a>
          </div>
        </div>

        {/* Product Column */}
        <div className="footer-links-col">
          <h4 className="footer-col-title">Platform</h4>
          <a href="#features">Features</a>
          <a href="#solution">How it Works</a>
          <a href="#dashboard">Portal Preview</a>
          <a href="#pricing">Pricing</a>
        </div>

        {/* Resources Column */}
        <div className="footer-links-col">
          <h4 className="footer-col-title">Resources</h4>
          <a href="#docs" onClick={(e) => e.preventDefault()}>Documentation</a>
          <a href="#api" onClick={(e) => e.preventDefault()}>API Reference</a>
          <a href="#guides" onClick={(e) => e.preventDefault()}>Camera Calibration Guides</a>
          <a href="#support" onClick={(e) => e.preventDefault()}>Help Center</a>
        </div>

        {/* Legal Column */}
        <div className="footer-links-col">
          <h4 className="footer-col-title">Legal</h4>
          <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          <a href="#ferpa" onClick={(e) => e.preventDefault()}>FERPA Compliance</a>
          <a href="#gdpr" onClick={(e) => e.preventDefault()}>GDPR Standards</a>
        </div>

      </div>

      <div className="footer-bottom-bar">
        <div className="container footer-bottom-flex">
          <p className="copyright-text">
            © {currentYear || 2026} AttendAI Inc. All rights reserved.
          </p>
          <p className="credits-text">
            Designed for secure classroom environments with <Heart size={12} fill="#ef4444" stroke="#ef4444" style={{ verticalAlign: 'middle', margin: '0 2px' }} /> by Google DeepMind Team.
          </p>
        </div>
      </div>
    </footer>
  );
}
