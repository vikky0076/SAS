import { Star } from 'lucide-react';
import useScrollReveal from '../hooks/useScrollReveal';
import './Testimonials.css';

export default function Testimonials() {
  const [sectionRef, isVisible] = useScrollReveal();

  const reviews = [
    {
      name: "Dr. Evelyn Vance",
      role: "Dean of Computer Science",
      institution: "Stanford University",
      text: "AttendAI has completely transformed our lecture startups. Lecturers save 10 minutes every hour, and the liveness spoof detection is extremely reliable.",
      rating: 5,
      avatar: "EV",
      grad: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
    },
    {
      name: "Prof. Liam Alvarez",
      role: "Registrar Operations Lead",
      institution: "Texas A&M",
      text: "The integration with our registry databases was seamless. Daily attendance sheets compile and log without a single manual click. Highly recommended.",
      rating: 5,
      avatar: "LA",
      grad: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
    },
    {
      name: "Dr. Clara Hastings",
      role: "Vice Principal",
      institution: "Oakridge Prep Academy",
      text: "Real-time alerts have improved parent communication. However, the spatial engagement score is what really helped us evaluate teaching methodologies.",
      rating: 5,
      avatar: "CH",
      grad: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)"
    }
  ];

  return (
    <section className="section-padding testimonials-section" id="testimonials">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Endorsed by Leading Faculty</h2>
          <p className="section-subtitle">
            See how registrars and deans utilize AttendAI to reclaim classroom hours.
          </p>
        </div>

        <div 
          ref={sectionRef} 
          className={`grid-3 testimonials-grid scroll-reveal ${isVisible ? 'visible' : ''}`}
        >
          {reviews.map((item, idx) => (
            <div key={idx} className="glass-panel review-card">
              <div className="review-stars">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} size={14} fill="#fbbf24" stroke="#fbbf24" />
                ))}
              </div>
              
              <p className="review-text">"{item.text}"</p>
              
              <div className="review-author">
                <div className="author-avatar" style={{ background: item.grad }}>
                  {item.avatar}
                </div>
                <div className="author-meta">
                  <h4 className="author-name">{item.name}</h4>
                  <p className="author-role">{item.role}</p>
                  <p className="author-institution">{item.institution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
