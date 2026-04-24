import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { a11yManager } from '../utils/accessibility.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade Certificate Section Controller v2.0 (HOLOGRAPHIC ARCHIVES)
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectural Upgrades:
 * - Dynamic Payload: Strictly driven by the external JSON payload. Zero hardcoded fallbacks.
 * - Plasma-Scorched Stone: Cyan/Silver holographics over deep obsidian rock.
 * - Staggered Materialization: Clean, ghost-like fade-in tailored for professional credentials.
 * - Responsive Typography: Strict word-breaking and clamp constraints for mobile perfection.
 */
export class CertificateSection {
  constructor(container, data) {
    this.container = container;
    
    // Strictly utilize the passed JSON payload
    this.certData = data || [];

    this.isReducedMotion = a11yManager?.shouldReduceMotion() || false;
    this.cards = [];
    this.tiltListeners = [];
    
    console.log('[CertificateSection] Accessing Holographic Archives...');
  }

  init() {
    if (this.certData.length === 0) {
      console.warn('[CertificateSection] No certificate data provided. Aborting render.');
      return;
    }

    this._injectStyles();
    this._buildDOM();
    this._setupReveal();
    if (!this.isReducedMotion) {
      this._setupInteractivePhysics();
    }
  }

  _injectStyles() {
    if (document.getElementById('cert-section-styles')) return;
    const style = document.createElement('style');
    style.id = 'cert-section-styles';
    style.innerHTML = `
      .cert-header {
        font-family: var(--font-display, serif);
        font-size: clamp(2rem, 5vw, 3.5rem);
        margin-bottom: 4rem; 
        text-align: center; 
        color: #ffffff; 
        letter-spacing: 6px;
        text-shadow: 0 0 30px rgba(0, 255, 255, 0.4), 0 0 10px rgba(0, 170, 255, 0.2);
      }
      
      .cert-grid {
        display: grid; 
        grid-template-columns: repeat(3, 1fr); 
        gap: 2.5rem;
        padding: 1rem;
        width: 100%;
      }

      @media (max-width: 1024px) {
        .cert-grid { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 768px) {
        .cert-grid { grid-template-columns: 1fr; }
      }

      .holo-cert-link {
        display: block;
        text-decoration: none;
        outline: none;
        transform-style: preserve-3d;
        perspective: 1500px;
        cursor: pointer;
      }

      .holo-cert-card {
        position: relative;
        height: 100%;
        min-height: 220px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 2rem;
        border-radius: 6px;
        background: linear-gradient(170deg, #0a1118 0%, #05070a 50%, #020305 100%);
        box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.9), 0 15px 35px rgba(0, 0, 0, 0.8);
        border: 1px solid rgba(0, 255, 255, 0.1);
        transform-style: preserve-3d;
        transition: border-color 0.4s ease, box-shadow 0.4s ease;
      }

      .holo-cert-card::before {
        content: '';
        position: absolute;
        inset: 0;
        opacity: 0.1;
        border-radius: inherit;
        pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.05' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        z-index: 1;
      }

      .holo-frame {
        position: absolute;
        inset: -2px;
        border-radius: 8px;
        z-index: 0;
        pointer-events: none;
        background: linear-gradient(45deg, rgba(0, 255, 255, 0.5), transparent 40%, transparent 60%, rgba(255, 215, 0, 0.3));
        opacity: 0;
        transition: opacity 0.5s ease;
        filter: blur(4px);
      }

      .holo-scanner {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: rgba(0, 255, 255, 0.8);
        box-shadow: 0 0 15px rgba(0, 255, 255, 1);
        opacity: 0;
        z-index: 5;
        pointer-events: none;
      }

      .holo-cert-link:hover .holo-cert-card {
        border-color: rgba(0, 255, 255, 0.5);
        box-shadow: inset 0 0 40px rgba(0, 255, 255, 0.05), 0 20px 40px rgba(0, 0, 0, 0.9);
      }
      .holo-cert-link:hover .holo-frame {
        opacity: 1;
      }
      .holo-cert-link:hover .holo-scanner {
        opacity: 1;
        animation: scanDown 2s ease-in-out infinite alternate;
      }

      @keyframes scanDown {
        0% { transform: translateY(0); }
        100% { transform: translateY(100%); }
      }

      .cert-content {
        position: relative;
        z-index: 10;
        transform: translateZ(30px); 
      }

      .cert-issuer {
        font-family: var(--font-mono, monospace);
        font-size: 0.85rem;
        color: #ffaa00; 
        letter-spacing: 2px;
        text-transform: uppercase;
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .cert-name {
        font-family: var(--font-display, serif);
        font-size: clamp(1.2rem, 2.5vw, 1.6rem);
        color: #ffffff;
        margin: 0 0 1.5rem 0;
        line-height: 1.3;
        word-wrap: break-word;
        white-space: normal;
        text-shadow: 0 2px 10px rgba(0, 255, 255, 0.2);
      }

      .cert-footer {
        font-family: var(--font-mono, monospace);
        font-size: 0.75rem;
        color: #8899aa;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        border-top: 1px solid rgba(0, 255, 255, 0.1);
        padding-top: 1rem;
      }
    `;
    document.head.appendChild(style);
  }

  _buildDOM() {
    this.container.className = 'viewport-section pointer-passthrough z-ui-base';
    
    this.container.innerHTML = `
      <div class="container" style="max-width: 1400px; margin: 0 auto;">
        <h2 class="cert-header">CREDENTIALS</h2>
        
        <div class="cert-grid">
          ${this.certData.map(cert => `
            <a href="${cert.file_url || cert.verification_link || '#'}" target="_blank" rel="noopener noreferrer" class="holo-cert-link" aria-label="View ${cert.name} Certificate">
              
              <article class="holo-cert-card">
                <div class="holo-frame"></div>
                <div class="holo-scanner"></div>
                
                <div class="cert-content">
                  <header class="cert-issuer">
                    <span>${cert.issuer}</span>
                    <span style="color: #00ffff;">◈</span>
                  </header>
                  
                  <h3 class="cert-name">${cert.name}</h3>
                  
                  <footer class="cert-footer">
                    <div style="display: flex; justify-content: space-between;">
                      <span>ACQUIRED:</span>
                      <span style="color: #e0e0e0;">${cert.date}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span>ID:</span>
                      <span style="color: #00ffff;">${cert.credential_id || 'VERIFIED'}</span>
                    </div>
                  </footer>
                </div>
              </article>
              
            </a>
          `).join('')}
        </div>
      </div>
    `;

    this.title = this.container.querySelector('.cert-header');
    this.cards = this.container.querySelectorAll('.holo-cert-link');
  }

  _setupReveal() {
    if (this.isReducedMotion) {
      gsap.set([this.title, this.cards], { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(this.title, 
      { opacity: 0, y: -30, filter: 'blur(10px)' },
      { 
        opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: this.container, start: "top 80%" }
      }
    );

    gsap.fromTo(this.cards, 
      { opacity: 0, y: 50, rotationX: 15, scale: 0.95 },
      { 
        opacity: 1, 
        y: 0, 
        rotationX: 0, 
        scale: 1, 
        duration: 1.2, 
        stagger: 0.15, 
        ease: "power2.out",
        scrollTrigger: {
          trigger: this.container.querySelector('.cert-grid'),
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }

  _setupInteractivePhysics() {
    this.cards.forEach(linkWrapper => {
      const cardInner = linkWrapper.querySelector('.holo-cert-card');
      
      const xSet = gsap.quickTo(cardInner, "rotationY", { duration: 0.6, ease: "power2.out" });
      const ySet = gsap.quickTo(cardInner, "rotationX", { duration: 0.6, ease: "power2.out" });

      const onMouseMove = (e) => {
        const rect = linkWrapper.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const xPct = (mouseX / rect.width) - 0.5; 
        const yPct = (mouseY / rect.height) - 0.5; 
        
        xSet(xPct * 8);
        ySet(-yPct * 8); 
      };

      const onMouseLeave = () => {
        xSet(0);
        ySet(0);
        gsap.to(cardInner, { rotationX: 0, rotationY: 0, duration: 0.8, ease: "elastic.out(1, 0.6)" });
      };

      linkWrapper.addEventListener('mousemove', onMouseMove);
      linkWrapper.addEventListener('mouseleave', onMouseLeave);
      
      this.tiltListeners.push({ wrapper: linkWrapper, onMouseMove, onMouseLeave });
    });
  }

  dispose() {
    console.log('[CertificateSection] Archiving Records...');
    
    this.tiltListeners.forEach(({ wrapper, onMouseMove, onMouseLeave }) => {
      wrapper.removeEventListener('mousemove', onMouseMove);
      wrapper.removeEventListener('mouseleave', onMouseLeave);
    });
    this.tiltListeners = [];
    
    ScrollTrigger.getAll().forEach(st => {
      if (st.trigger === this.container || st.trigger === this.container.querySelector('.cert-grid')) {
        st.kill();
      }
    });
    
    gsap.killTweensOf([this.title, this.cards]);
    this.container.innerHTML = '';
  }
}