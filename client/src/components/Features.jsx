import { Scan, LayoutDashboard, BarChart3, FileSpreadsheet, HardDrive, Settings, Download, Shield } from 'lucide-react';
import useScrollReveal from '../hooks/useScrollReveal';
import './Features.css';

export default function Features() {
  const [gridRef, isVisible] = useScrollReveal();

  const featuresList = [
    {
      icon: <Scan size={22} />,
      title: "AI Face Recognition",
      desc: "Fast sub-100ms face matching with anti-spoofing algorithms that block proxy attendance via photograph or video playback.",
      accent: "blue",
      visual: (
        <div className="feature-visual scan-visual">
          <div className="mini-face">
            <div className="mini-scan-box">
              <div className="mini-corner tl"></div>
              <div className="mini-corner tr"></div>
              <div className="mini-corner bl"></div>
              <div className="mini-corner br"></div>
              <div className="mini-scan-line"></div>
            </div>
            <span className="mini-badge">MATCH 99.8%</span>
          </div>
        </div>
      )
    },
    {
      icon: <LayoutDashboard size={22} />,
      title: "Real-Time Dashboard",
      desc: "Keep admins, professors, and registry systems synchronized with instant roll-calls and student presence reports.",
      accent: "purple",
      visual: (
        <div className="feature-visual dash-visual">
          <div className="mini-stat-bar">
            <span className="bar-label">Present</span>
            <div className="bar-bg"><div className="bar-fill blue" style={{ width: '88%' }}></div></div>
            <span className="bar-val">88%</span>
          </div>
          <div className="mini-stat-bar">
            <span className="bar-label">Late</span>
            <div className="bar-bg"><div className="bar-fill orange" style={{ width: '8%' }}></div></div>
            <span className="bar-val">8%</span>
          </div>
        </div>
      )
    },
    {
      icon: <BarChart3 size={22} />,
      title: "Student Engagement Analytics",
      desc: "Go beyond roll call. Continuous attention detection maps overall focus trends, flagging fatigued or disengaged classrooms.",
      accent: "pink",
      visual: (
        <div className="feature-visual engage-visual">
          <svg className="sparkline" viewBox="0 0 120 40">
            <path d="M0,30 Q15,10 30,25 T60,15 T90,35 T120,10" fill="none" stroke="url(#bluePurpleGrad)" strokeWidth="2.5" />
            <circle cx="90" cy="35" r="4" fill="#ec4899" className="sparkline-pulse" />
            <defs>
              <linearGradient id="bluePurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )
    },
    {
      icon: <FileSpreadsheet size={22} />,
      title: "Automated Reports",
      desc: "Generate and export PDF, CSV, or Excel worksheets automatically. Deliver automated warnings for students with low attendance.",
      accent: "green",
      visual: (
        <div className="feature-visual report-visual">
          <div className="mini-doc-card">
            <div className="doc-icon"><Download size={14} /></div>
            <div className="doc-meta">
              <span className="doc-name">CS_Register_W12.csv</span>
              <span className="doc-size">14.2 KB • Done</span>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: <HardDrive size={22} />,
      title: "Cloud Data Storage",
      desc: "Fully encrypted AES-256 cloud architectures compliant with student privacy laws (FERPA/GDPR), ensuring high security.",
      accent: "blue",
      visual: (
        <div className="feature-visual cloud-visual">
          <div className="cloud-db-stack">
            <div className="db-layer"><Shield size={12} className="db-shield" /> Secure Nodes</div>
            <div className="db-layer mid"></div>
            <div className="db-layer bot"></div>
          </div>
        </div>
      )
    },
    {
      icon: <Settings size={22} />,
      title: "Faculty & Admin Management",
      desc: "Granular access hierarchies. Give professors class control, registrar offices system overviews, and department heads comparative indexes.",
      accent: "orange",
      visual: (
        <div className="feature-visual admin-visual">
          <div className="mini-user-badges">
            <span className="user-role-badge purple">Admin</span>
            <span className="user-role-badge blue">Faculty</span>
            <span className="user-role-badge green">Student</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="section-padding features-section" id="features">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">AI-Powered Features</h2>
          <p className="section-subtitle">
            Experience next-generation attendance technology designed for modern institutions.
          </p>
        </div>

        <div 
          ref={gridRef} 
          className={`grid-3 features-grid scroll-reveal ${isVisible ? 'visible' : ''}`}
        >
          {featuresList.map((feature, idx) => (
            <div key={idx} className="glass-panel feature-card">
              {feature.visual}
              
              <div className="feature-content-box">
                <div className={`feature-icon-wrapper ${feature.accent}`}>
                  {feature.icon}
                </div>
                <h3 className="feature-card-title">{feature.title}</h3>
                <p className="feature-card-desc">{feature.desc}</p>
              </div>

              {/* Glowing gradient overlay */}
              <div className="feature-card-hover-glow"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
