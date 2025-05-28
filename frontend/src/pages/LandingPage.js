import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GuestLanding.css';
import heroImage from '../assests/hero-image.png'

const GuestLandingPage = () => {
  const navigate = useNavigate();

  
  const [activeModal, setActiveModal] = useState(null);

  // Dummy data for modals
  const modalContent = {
    privacy: {
      title: "Privacy Policy",
      content: "At Shrinkoo, we value your privacy. We don't sell your data to third parties. All link analytics are anonymized and used solely to improve our service."
    },
    terms: {
      title: "Terms of Service",
      content: "By using Shrinkoo, you agree not to create spammy or malicious links. We reserve the right to remove any links that violate our community guidelines."
    },
    contact: {
      title: "Contact Us",
      content: "Have questions? Reach out to our support team at support@shrinkoo.app. We typically respond within 24 hours."
    }
  };

  const openModal = (modalType) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <div className="guest-landing-container">
      {/* Modal Overlay */}
      {activeModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{modalContent[activeModal].title}</h3>
            <p>{modalContent[activeModal].content}</p>
            <button onClick={closeModal} className="modal-close-btn">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="guest-nav">
        <div className="nav-brand">Shrinkoo</div>
        <div className="nav-actions">
          <button onClick={() => navigate('/login')} className="nav-button login-btn">
            Login
          </button>
          <button onClick={() => navigate('/login')} className="nav-button login-btn">
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Shorten, Share, and Track Your Links</h1>
          <p className="hero-subtitle">Shrinkoo V2.0 helps you create memorable short links, track their performance, and understand your audience better.</p>
          <div className="hero-cta">
            <button onClick={() => navigate('/login')} className="cta-primary">
              Get Started
            </button>
            <button onClick={() => navigate('/login')} className="cta-secondary">
              Learn More
            </button>
          </div>
        </div>
        
        {/* Replace the placeholder with your actual image */}
        <div className="hero-image">
          <img 
            src={heroImage} 
            alt="Shrinkoo - Shrink Your Links, Expand Your Reach" 
            className="hero-img"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Powerful Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <h2 className="section-title">Trusted by Thousands</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="rating">{"★".repeat(testimonial.rating)}</div>
              <p className="quote">"{testimonial.quote}"</p>
              <p className="author">- {testimonial.author}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2>Ready to Supercharge Your Links?</h2>
        <button onClick={() => navigate('/login')} className="cta-primary large">
          Start Free Today
        </button>
      </section>

      {/* Footer */}
      <footer className="guest-footer">
        <div className="footer-content">
          <div className="footer-brand">Shrinkoo</div>
          <div className="footer-links">
            <button onClick={() => openModal('privacy')} className="footer-link-btn">
              Privacy
            </button>
            <button onClick={() => openModal('terms')} className="footer-link-btn">
              Terms
            </button>
            <button onClick={() => openModal('contact')} className="footer-link-btn">
              Contact
            </button>
          </div>
          <div className="footer-copyright">© {new Date().getFullYear()} Shrinkoo. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

// Sample data
const features = [
  {
    icon: "🔗",
    title: "Link Shortening",
    description: "Create custom short links in just one click."
  },
  {
    icon: "📊",
    title: "Click Analytics",
    description: "Track how many clicks your links receive."
  },
  {
    icon: "🔒",
    title: "Secure Links",
    description: "All links are protected with HTTPS encryption."
  }
];

const testimonials = [
  {
    quote: "Shrinkoo has completely transformed how I share links with my audience.",
    author: "Sarah M.",
    rating: 5
  },
  {
    quote: "The analytics dashboard is incredibly useful for my marketing campaigns.",
    author: "James L.",
    rating: 5
  },
  {
    quote: "Simple to use but packed with powerful features.",
    author: "Priya K.",
    rating: 5
  }
];

export default GuestLandingPage;