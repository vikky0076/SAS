import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Building2, Users } from 'lucide-react';
import useScrollReveal from '../hooks/useScrollReveal';
import './Contact.css';

export default function Contact() {
  const [sectionRef, isVisible] = useScrollReveal();
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    size: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear errors when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Coordinator name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Institutional email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.institution.trim()) newErrors.institution = "Institution name is required";
    if (!formData.size) newErrors.size = "Please select institution size";
    if (!formData.message.trim()) newErrors.message = "Message details are required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', institution: '', size: '', message: '' });
    }, 1800);
  };

  return (
    <section className="section-padding contact-section" id="contact">
      <div className="bg-glow-orb contact-glow-1" style={{ bottom: '5%', left: '10%', width: '400px', height: '400px', background: 'rgba(59, 130, 246, 0.15)' }}></div>
      
      <div className="container contact-container">
        
        {/* Contact Info Column */}
        <div className="contact-info-col">
          <h2 className="section-title text-left">Deploy AttendAI at Your Institution</h2>
          <p className="contact-subtitle-text">
            Coordinate with our integration engineering team to schedule camera calibration audits and request demo access.
          </p>

          <div className="contact-info-list" ref={sectionRef}>
            <div className={`contact-info-item scroll-reveal ${isVisible ? 'visible' : ''}`}>
              <div className="info-icon-box">
                <Building2 size={20} />
              </div>
              <div>
                <h4>Hardware Alignment</h4>
                <p>Compatible with standard RTSP/ONVIF IP cameras. No proprietary camera nodes required.</p>
              </div>
            </div>

            <div className={`contact-info-item scroll-reveal ${isVisible ? 'visible' : ''}`}>
              <div className="info-icon-box purple">
                <Users size={20} />
              </div>
              <div>
                <h4>FERPA/GDPR Compliant</h4>
                <p>Features zero facial database exposure. Cryptographic vectors secure student privacy.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="contact-form-col">
          <div className="glass-panel contact-form-card">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="inquiry-form">
                <h3 className="form-card-title">Institutional Inquiry Form</h3>
                
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Coordinator Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`form-input ${errors.name ? 'input-error' : ''}`}
                    placeholder="Dr. Sarah Jenkins"
                  />
                  {errors.name && <span className="error-message-text"><AlertCircle size={12} /> {errors.name}</span>}
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Institutional Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                      placeholder="s.jenkins@stanford.edu"
                    />
                    {errors.email && <span className="error-message-text"><AlertCircle size={12} /> {errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="institution" className="form-label">Institution Name</label>
                    <input
                      type="text"
                      id="institution"
                      name="institution"
                      value={formData.institution}
                      onChange={handleInputChange}
                      className={`form-input ${errors.institution ? 'input-error' : ''}`}
                      placeholder="Stanford University"
                    />
                    {errors.institution && <span className="error-message-text"><AlertCircle size={12} /> {errors.institution}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="size" className="form-label">Total Student Capacity</label>
                  <select
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className={`form-input ${errors.size ? 'input-error' : ''}`}
                  >
                    <option value="" disabled>Select Student Count...</option>
                    <option value="k-12">K-12 school (&lt; 200 students)</option>
                    <option value="department">Single Department (&lt; 1,000 students)</option>
                    <option value="university">Full University (&lt; 10,000 students)</option>
                    <option value="multi-campus">Multi-campus (&gt; 10,000 students)</option>
                  </select>
                  {errors.size && <span className="error-message-text"><AlertCircle size={12} /> {errors.size}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">Integration Requirements</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={`form-input form-textarea ${errors.message ? 'input-error' : ''}`}
                    placeholder="Briefly describe your existing camera layouts and registration database (e.g. Canvas, custom SQL)..."
                  ></textarea>
                  {errors.message && <span className="error-message-text"><AlertCircle size={12} /> {errors.message}</span>}
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary form-submit-btn" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner-loader"></div> Processing...
                    </>
                  ) : (
                    <>
                      Submit Request <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="form-success-container">
                <div className="success-icon-wrapper">
                  <CheckCircle2 size={56} className="success-icon-svg" />
                </div>
                <h3 className="success-title">Inquiry Received</h3>
                <p className="success-desc">
                  Thank you for contacting AttendAI. Our camera calibration engineers will review your specs and email you within 24 hours to schedule a diagnostic sync.
                </p>
                <button className="btn btn-secondary" onClick={() => setIsSubmitted(false)}>
                  Submit Another Inquiry
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
