import { Play, ArrowRight, Scan, ShieldCheck, UserCheck, Activity } from 'lucide-react';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero-section" id="hero">
      {/* Ambient Lighting Orbs */}
      <div className="bg-glow-orb hero-glow-1" style={{ top: '10%', left: '15%', width: '400px', height: '400px', background: 'rgba(59, 130, 246, 0.25)' }}></div>
      <div className="bg-glow-orb hero-glow-2" style={{ top: '30%', right: '15%', width: '450px', height: '450px', background: 'rgba(139, 92, 246, 0.25)' }}></div>

      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-glow"></span>
            <span className="badge-text"><Activity size={12} className="badge-icon" /> Now Live: Version 2.0 Attendance Engine</span>
          </div>
          
          <h1 className="hero-title">
            Transform Classroom Attendance with <span className="text-gradient">Artificial Intelligence</span>
          </h1>
          
          <p className="hero-subtitle">
            Automate attendance tracking, prevent proxy attendance, and monitor classroom engagement in real-time.
          </p>

          <div className="hero-actions">
            <a href="#contact" className="btn btn-primary">
              Get Started <ArrowRight size={18} />
            </a>
            <a href="#dashboard" className="btn btn-secondary">
              <Play size={18} fill="currentColor" /> Watch Demo
            </a>
          </div>

          <div className="hero-features-preview">
            <div className="preview-item">
              <ShieldCheck size={18} className="preview-icon blue" />
              <span>Fraud Proof</span>
            </div>
            <div className="preview-item">
              <UserCheck size={18} className="preview-icon purple" />
              <span>Instant Verification</span>
            </div>
            <div className="preview-item">
              <Activity size={18} className="preview-icon pink" />
              <span>Attentiveness Scoring</span>
            </div>
          </div>
        </div>

        {/* Floating Interactive Face Scan Mockup */}
        <div className="hero-visual">
          <div className="scanner-widget-container floating-element">
            <div className="scanner-glass-card">
              <div className="card-header">
                <div className="dot-group">
                  <span className="window-dot red"></span>
                  <span className="window-dot yellow"></span>
                  <span className="window-dot green"></span>
                </div>
                <span className="status-indicator-live">● LIVE FEED</span>
              </div>
              
              <div className="scanner-feed">
                <img src="/student_scan_face.png" alt="Student scanning demonstration" className="student-feed-img" />
                
                {/* Bounding box scanning overlay */}
                <div className="scanning-box">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                  <div className="scanning-line"></div>
                  <div className="tracking-point"></div>
                </div>

                {/* Cyber HUD elements */}
                <div className="hud-readout hud-left">
                  <div>SYS_LNK: SECURE</div>
                  <div>FPS: 60</div>
                  <div>CAM_ID: 101_ENT</div>
                </div>
                <div className="hud-readout hud-right">
                  <div>X: 482.11</div>
                  <div>Y: 289.43</div>
                  <div>Z: 1.04</div>
                </div>
              </div>

              <div className="scanner-footer">
                <div className="result-metric">
                  <span className="metric-label">RECOGNITION PROFILE</span>
                  <span className="metric-value">Marcus Chen</span>
                </div>
                <div className="result-metric text-right">
                  <span className="metric-label">ACCURACY MATCH</span>
                  <span className="metric-value text-accent-green">99.42%</span>
                </div>
              </div>
            </div>

            {/* Overlapping Info Panels */}
            <div className="floating-info-card card-top-left">
              <div className="info-icon-wrapper purple-bg">
                <Scan size={18} className="glow-icon-purple" />
              </div>
              <div>
                <p className="floating-card-title">Real-Time Sync</p>
                <p className="floating-card-desc">Logged: CS-102 @ 13:21:05</p>
              </div>
            </div>

            <div className="floating-info-card card-bottom-right">
              <div className="info-icon-wrapper green-bg">
                <ShieldCheck size={18} className="glow-icon-green" />
              </div>
              <div>
                <p className="floating-card-title">Anti-Proxy System</p>
                <p className="floating-card-desc">Liveness check: VERIFIED</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
