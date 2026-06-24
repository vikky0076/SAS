import { Camera, Cpu, Database, BrainCircuit, ArrowRight } from 'lucide-react';
import useScrollReveal from '../hooks/useScrollReveal';
import './Solution.css';

export default function Solution() {
  const [timelineRef, isVisible] = useScrollReveal();

  const steps = [
    {
      icon: <Camera size={26} />,
      stepNum: "01",
      title: "Classroom Capture",
      desc: "Standard IP cameras stream secure video feeds at lecture commencement, removing the need for manual checkpoints."
    },
    {
      icon: <Cpu size={26} />,
      stepNum: "02",
      title: "AI Verification",
      desc: "Deep learning models verify student identity and perform anti-spoofing liveness checks in milliseconds."
    },
    {
      icon: <Database size={26} />,
      stepNum: "03",
      title: "Instant Logging",
      desc: "Registers are updated in real-time and push alerts synchronize with administrative databases and parent portals."
    },
    {
      icon: <BrainCircuit size={26} />,
      stepNum: "04",
      title: "Engagement Analysis",
      desc: "Aggregated spatial analysis measures classroom attentiveness indices, flagging participation drop-offs."
    }
  ];

  return (
    <section className="section-padding solution-section" id="solution">
      {/* Background Glowing Ambient Light */}
      <div className="bg-glow-orb solution-glow" style={{ bottom: '10%', right: '10%', width: '500px', height: '500px', background: 'rgba(139, 92, 246, 0.15)' }}></div>

      <div className="container">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            A frictionless four-step automated loop powered by cloud computer vision.
          </p>
        </div>

        <div 
          ref={timelineRef} 
          className={`timeline-container scroll-reveal ${isVisible ? 'visible' : ''}`}
        >
          {/* Timeline Connector Line */}
          <div className="timeline-line">
            <div className="timeline-progress-glow"></div>
          </div>

          <div className="steps-wrapper">
            {steps.map((step, idx) => (
              <div key={idx} className="step-card-wrapper">
                <div className="step-node-outer">
                  <div className="step-node">
                    {step.icon}
                    <span className="step-badge-num">{step.stepNum}</span>
                  </div>
                </div>
                
                <div className="glass-panel step-content-card">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="step-arrow-mobile">
                    <ArrowRight size={24} className="arrow-down-icon" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
