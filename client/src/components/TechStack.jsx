import useScrollReveal from '../hooks/useScrollReveal';
import './TechStack.css';

export default function TechStack() {
  const [sectionRef, isVisible] = useScrollReveal();

  const techs = [
    { name: "React", type: "Frontend", desc: "Core interface engine for rendering glassmorphic modules and real-time dashboard elements." },
    { name: "Node.js", type: "Backend API", desc: "High-throughput server layer managing camera synchronization webhooks and user profiles." },
    { name: "MongoDB", type: "Database", desc: "NoSQL architecture housing classroom logs, presence logs, and student identity templates." },
    { name: "OpenCV", type: "Computer Vision", desc: "Computer vision library powering image preprocessing, scaling, and camera feed alignment." },
    { name: "TensorFlow", type: "Deep Learning", desc: "Deep neural networks trained for face recognition profiles and anti-proxy liveness tests." },
    { name: "Vercel", type: "Cloud Edge", desc: "Global edge CDN delivering sub-100ms dashboard updates and serverless hosting operations." },
    { name: "Render", type: "AI Backend Host", desc: "Secure cloud server hosting containerized deep learning inference processes." }
  ];

  return (
    <section className="section-padding techstack-section" id="tech-stack">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Hardware & Software Stack</h2>
          <p className="section-subtitle">
            An enterprise-ready ecosystem engineered for low latency, security, and scalability.
          </p>
        </div>

        <div 
          ref={sectionRef} 
          className={`tech-grid scroll-reveal ${isVisible ? 'visible' : ''}`}
        >
          {techs.map((tech, idx) => (
            <div key={idx} className="glass-panel tech-card">
              <div className="tech-chip-header">
                <span className="tech-chip-connection"></span>
                <span className="tech-tag-badge">{tech.type}</span>
              </div>
              <h3 className="tech-name">{tech.name}</h3>
              <p className="tech-desc">{tech.desc}</p>
              
              {/* Animated corner light details */}
              <span className="tech-corner-light tl"></span>
              <span className="tech-corner-light br"></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
