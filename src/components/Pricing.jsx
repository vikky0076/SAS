import { useState } from 'react';
import { Check, HelpCircle } from 'lucide-react';
import useScrollReveal from '../hooks/useScrollReveal';
import './Pricing.css';

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [sectionRef, isVisible] = useScrollReveal();

  const plans = [
    {
      name: "Starter",
      desc: "Ideal for individual schools and K-12 classrooms looking to automate registers.",
      monthlyPrice: 49,
      annualPrice: 39,
      features: [
        "Up to 150 student profiles",
        "Standard face recognition mapping",
        "Daily automated CSV registers",
        "Standard webcam/IP camera compatibility",
        "Next-business-day email support"
      ],
      popular: false,
      cta: "Get Starter",
      accent: "blue"
    },
    {
      name: "Professional",
      desc: "Perfect for departments, colleges, and technical universities requiring engagement data.",
      monthlyPrice: 149,
      annualPrice: 119,
      features: [
        "Up to 1,000 student profiles",
        "Anti-proxy liveness spoof checks",
        "Student engagement analytics",
        "Automated parent SMS and email alerts",
        "API integration with registrar systems",
        "24/7 priority support coverage"
      ],
      popular: true,
      cta: "Start Free Trial",
      accent: "purple"
    },
    {
      name: "Enterprise",
      desc: "Engineered for multi-campus setups, large universities, and district-wide rollouts.",
      monthlyPrice: "Custom",
      annualPrice: "Custom",
      features: [
        "Unlimited student profiles",
        "Dedicated GPU cloud clusters",
        "SAML/SSO integration support",
        "Direct LMS sync (Canvas, Blackboard)",
        "On-site configuration & calibration",
        "Dedicated account success manager"
      ],
      popular: false,
      cta: "Contact Enterprise",
      accent: "green"
    }
  ];

  return (
    <section className="section-padding pricing-section" id="pricing">
      <div className="bg-glow-orb pricing-glow" style={{ top: '30%', right: '5%', width: '500px', height: '500px', background: 'rgba(139, 92, 246, 0.12)' }}></div>

      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Transparent, Scale-Ready Pricing</h2>
          <p className="section-subtitle">
            Select the plan that fits your class capacities. Save 20% on annual billing cycles.
          </p>

          {/* Pricing Toggle Switch */}
          <div className="pricing-toggle-container">
            <span className={`toggle-label ${!isAnnual ? 'active' : ''}`}>Monthly</span>
            <button 
              className={`toggle-switch-btn ${isAnnual ? 'annual' : ''}`}
              onClick={() => setIsAnnual(!isAnnual)}
              aria-label="Toggle Billing Cycle"
            >
              <span className="toggle-switch-handle"></span>
            </button>
            <span className={`toggle-label ${isAnnual ? 'active' : ''}`}>
              Annually <span className="discount-pill">Save 20%</span>
            </span>
          </div>
        </div>

        <div 
          ref={sectionRef} 
          className={`grid-3 pricing-grid scroll-reveal ${isVisible ? 'visible' : ''}`}
        >
          {plans.map((plan, idx) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            
            return (
              <div 
                key={idx} 
                className={`glass-panel pricing-card ${plan.popular ? 'popular-card' : ''}`}
              >
                {plan.popular && <span className="popular-badge-label">MOST POPULAR</span>}

                <div className="pricing-card-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-desc">{plan.desc}</p>
                </div>

                <div className="plan-price-box">
                  {typeof price === 'number' ? (
                    <>
                      <span className="price-symbol">$</span>
                      <span className="price-amount">{price}</span>
                      <span className="price-period">/month</span>
                    </>
                  ) : (
                    <span className="price-amount custom-price">{price}</span>
                  )}
                  {typeof price === 'number' && isAnnual && (
                    <p className="billing-annually-sub">Billed annually</p>
                  )}
                </div>

                <div className="plan-divider"></div>

                <ul className="plan-features-list">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="feature-li-item">
                      <Check size={16} className={`check-icon-svg ${plan.accent}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <a 
                  href="#contact" 
                  className={`btn pricing-card-btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {plan.cta}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
