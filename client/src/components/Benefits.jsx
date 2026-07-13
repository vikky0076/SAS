import { useEffect, useState } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import './Benefits.css';

export default function Benefits() {
  const [sectionRef, isVisible] = useScrollReveal();
  
  // States for counters
  const [accuracy, setAccuracy] = useState(0);
  const [adminReduction, setAdminReduction] = useState(0);
  const [processingSpeed, setProcessingSpeed] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    // Counter helper function
    const animateCount = (target, setter, duration = 1500) => {
      let startTime = null;

      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        setter(Math.floor(progress * target));
        
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    };

    animateCount(95, setAccuracy, 1200);
    animateCount(80, setAdminReduction, 1400);
    animateCount(60, setProcessingSpeed, 1000);
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="section-padding benefits-section" id="benefits">
      {/* Background radial highlight */}
      <div className="bg-glow-orb benefits-glow" style={{ top: '50%', left: '5%', width: '400px', height: '400px', background: 'rgba(99, 102, 241, 0.12)' }}></div>

      <div className="container">
        <div className="benefits-grid">
          
          <div className="benefit-counter-card">
            <div className="counter-number-wrapper">
              <span className="counter-number text-gradient-blue">{accuracy}</span>
              <span className="counter-unit">%</span>
            </div>
            <h3 className="benefit-title">Recognition Accuracy</h3>
            <p className="benefit-desc">State-of-the-art dual-spectral facial match profiles that minimize false rejections.</p>
          </div>

          <div className="benefit-counter-card">
            <div className="counter-number-wrapper">
              <span className="counter-number text-gradient-purple">{adminReduction}</span>
              <span className="counter-unit">%</span>
            </div>
            <h3 className="benefit-title">Reduced Admin Overhead</h3>
            <p className="benefit-desc">Automating rosters releases instructors from repetitive tasks to focus on teaching.</p>
          </div>

          <div className="benefit-counter-card">
            <div className="counter-number-wrapper">
              <span className="counter-number text-gradient">{processingSpeed}</span>
              <span className="counter-unit">%</span>
            </div>
            <h3 className="benefit-title">Faster Lecture Startup</h3>
            <p className="benefit-desc">Synchronized computer vision scans rooms in under 5 seconds, maximizing lecture hour efficiency.</p>
          </div>

          <div className="benefit-counter-card">
            <div className="counter-number-wrapper">
              <span className="counter-number text-gradient-blue">Real</span>
              <span className="counter-unit">-Time</span>
            </div>
            <h3 className="benefit-title">Instant Synced Insights</h3>
            <p className="benefit-desc">Immediate alerts synced with registry portals and dashboards for active attendance logs.</p>
          </div>

        </div>
      </div>
    </section>
  );
}
