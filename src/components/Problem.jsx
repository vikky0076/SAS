import { UserMinus, FileSpreadsheet, AlertTriangle, Clock, BarChart3, Frown } from 'lucide-react';
import useScrollReveal from '../hooks/useScrollReveal';
import './Problem.css';

export default function Problem() {
  const [sectionRef, isVisible] = useScrollReveal();

  const challenges = [
    {
      icon: <UserMinus size={24} />,
      title: "Proxy Attendance",
      desc: "Peer-to-peer sign-ins and identity fraud undermine the credibility of academic registers.",
      accent: "red"
    },
    {
      icon: <FileSpreadsheet size={24} />,
      title: "Manual Record Keeping",
      desc: "Instructors waste 10–15 minutes of every single class calling names, stalling learning momentum.",
      accent: "orange"
    },
    {
      icon: <AlertTriangle size={24} />,
      title: "Human Errors",
      desc: "Mismarked entries, lost paper records, and manual entry errors lead to administrative confusion.",
      accent: "purple"
    },
    {
      icon: <Clock size={24} />,
      title: "Lack of Real-Time Tracking",
      desc: "Administrators and parents remain unaware of student absences until days or weeks later.",
      accent: "blue"
    },
    {
      icon: <BarChart3 size={24} />,
      title: "Limited Analytics",
      desc: "Siloed paperwork makes it impossible to run preventative alerts or identify attendance drops.",
      accent: "pink"
    },
    {
      icon: <Frown size={24} />,
      title: "Low Student Engagement",
      desc: "Starting lectures with administrative roll calls fosters a passive, uninspired classroom energy.",
      accent: "green"
    }
  ];

  return (
    <section className="section-padding problems-section" id="problems">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Challenges in Traditional Systems</h2>
          <p className="section-subtitle">
            Current manual and legacy attendance models are inefficient, insecure, and disconnected from classroom engagement.
          </p>
        </div>

        <div 
          ref={sectionRef} 
          className={`grid-3 challenges-grid scroll-reveal ${isVisible ? 'visible' : ''}`}
        >
          {challenges.map((item, idx) => (
            <div key={idx} className="glass-panel challenge-card">
              <div className={`challenge-icon-box ${item.accent}`}>
                {item.icon}
              </div>
              <h3 className="challenge-card-title">{item.title}</h3>
              <p className="challenge-card-desc">{item.desc}</p>
              
              {/* Card Cyber HUD Highlight */}
              <div className="card-border-glow"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
