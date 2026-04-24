import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TypewriterEffect } from '../ui/TypewriterEffect.js';
import { a11yManager } from '../utils/accessibility.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade About Section Controller v9.0 (THE ARCHITECT'S DOMAIN)
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectural Upgrades:
 * - Integrated Education Timeline: Injected the Education data as a nested, vertical timeline card sandwiched between the bio and directives.
 */
export class AboutSection {
  constructor(container, data, appSystems) {
    this.container = container;
    this.profileData = data.profile || {};
    this.aboutData = data.about || {};
    this.educationData = data.education || []; // Pull education data
    
    this.lightning = appSystems?.lightning || null;
    
    this.components = { typewriters: [] };
    this.scrollTriggers = [];
    this.eventListeners = []; 
    
    this.isReducedMotion = a11yManager?.shouldReduceMotion() || false;
    
    console.log('[AboutSection] Rendering The Architect\'s Domain...');
  }

  init() {
    this._injectStyles();
    this._buildDOM();
    this._mountComponents();
    this._setupHazyReveal();
    if (!this.isReducedMotion) {
      this._bindPhysics();
      this._bindInteractiveVFX();
    }
  }

  _injectStyles() {
    if (document.getElementById('about-domain-styles')) return;

    const style = document.createElement('style');
    style.id = 'about-domain-styles';
    style.innerHTML = `
      .about-header-container { text-align: center; margin-bottom: 5rem; }

      .about-title {
        font-family: var(--font-display, serif);
        font-size: clamp(2.5rem, 6vw, 4rem);
        color: #ffffff; letter-spacing: 6px;
        text-shadow: 0 0 30px rgba(255, 51, 0, 0.4), 0 0 10px rgba(255, 170, 0, 0.2);
        margin: 0;
      }

      .about-header-line {
        width: 100px; height: 2px; background: #ff3300; 
        margin: 1.5rem auto 0; box-shadow: 0 0 15px #ff3300;
      }

      /* --- SCORCHED CARVING SLAB (General) --- */
      .scorched-architect-card {
        position: relative; background: linear-gradient(170deg, #1a100c 0%, #0a0503 50%, #030100 100%);
        border-radius: 8px; z-index: 1;
        box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.9), 0 20px 50px rgba(0, 0, 0, 0.9);
        border: 1px solid rgba(255, 51, 0, 0.1);
        transform-style: preserve-3d;
        padding: clamp(2.5rem, 5vw, 4rem);
        margin-bottom: 3.5rem;
      }
      
      .scorched-architect-card::before {
        content: ''; position: absolute; inset: 0; opacity: 0.15; border-radius: inherit; pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='wood'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01 0.4' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 0.5 0 0 0  0 0.2 0 0 0  0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23wood)'/%3E%3C/svg%3E");
        z-index: -1;
      }

      .architect-flame-frame {
        position: absolute; inset: -2px; border-radius: 10px; z-index: -2; pointer-events: none;
        background: linear-gradient(45deg, #ff2200, transparent, #ffaa00);
        opacity: 0; filter: blur(8px); transition: opacity 0.5s ease;
      }
      .scorched-architect-card:hover .architect-flame-frame { opacity: 0.6; }

      /* --- BIO SECTION --- */
      .domain-grid {
        display: grid; gap: 4rem; align-items: start; grid-template-columns: 1fr; 
      }
      @media(min-width: 900px){ .domain-grid { grid-template-columns: 280px 1fr; } }

      .domain-sidebar { display: flex; flex-direction: column; align-items: center; gap: 2.5rem; }

      .architect-avatar-wrapper {
        position: relative; width: 220px; height: 220px; border-radius: 50%;
        border: 2px solid rgba(255, 51, 0, 0.3);
        box-shadow: 0 10px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,51,0,0.1);
        overflow: hidden; cursor: crosshair; transform: translateZ(30px);
        transition: border-color 0.3s ease, filter 0.3s ease, transform 0.4s ease;
      }
      .architect-avatar-wrapper:hover {
        border-color: rgba(255, 51, 0, 0.8); filter: brightness(1.2); transform: translateZ(40px) scale(1.05);
      }
      .architect-avatar-wrapper img {
        width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) grayscale(0.2); transition: filter 0.3s ease;
      }
      .architect-avatar-wrapper:hover img { filter: contrast(1.1) grayscale(0); }

      .diamond-chip-container { display: flex; flex-direction: column; gap: 1rem; width: 100%; transform: translateZ(20px); }
      .diamond-chip {
        display: flex; align-items: center; gap: 0.8rem; font-family: var(--font-mono, monospace); font-size: 0.85rem; 
        color: #ffaa80; text-transform: uppercase; letter-spacing: 1px; padding: 0.8rem 1rem; 
        background: rgba(255, 51, 0, 0.05); border: 1px solid rgba(255, 51, 0, 0.15); border-radius: 4px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      }
      .diamond-icon { color: #ff3300; font-size: 1rem; text-shadow: 0 0 8px rgba(255,51,0,0.8); }

      .bio-mount {
        font-size: 1.05rem; line-height: 1.9; color: #d0c5ba; font-family: var(--font-body, sans-serif);
        min-height: 200px; transform: translateZ(20px);
      }

      /* --- EDUCATION TIMELINE --- */
      .education-timeline-container {
        position: relative;
        padding-left: 2rem;
        transform: translateZ(20px);
      }
      
      .education-timeline-container::before {
        content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
        background: linear-gradient(180deg, transparent, rgba(255, 51, 0, 0.5), transparent);
      }

      .edu-item {
        position: relative; margin-bottom: 3rem;
      }
      .edu-item:last-child { margin-bottom: 0; }

      .edu-node {
        position: absolute; left: -2.4rem; top: 0.3rem; width: 14px; height: 14px;
        background: #000; border: 2px solid #ff3300; border-radius: 50%;
        box-shadow: 0 0 10px rgba(255,51,0,0.6);
      }

      .edu-header { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 1rem; }
      .edu-degree { font-family: var(--font-heading, serif); font-size: 1.3rem; color: #fff; letter-spacing: 1px; }
      .edu-field { font-family: var(--font-body, sans-serif); font-size: 1rem; color: #ffaa80; }
      .edu-meta { font-family: var(--font-mono, monospace); font-size: 0.85rem; color: #888; text-transform: uppercase; letter-spacing: 2px; }
      
      .edu-coursework {
        display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem;
      }
      .course-chip {
        padding: 0.3rem 0.8rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 3px; font-family: var(--font-mono, monospace); font-size: 0.75rem; color: #ccc;
      }

      /* --- FRACTURED CARD (Directives) --- */
      .fractured-directives-card {
        position: relative; background: rgba(10, 10, 12, 0.8); border-radius: 8px; transform-style: preserve-3d;
        padding: 3rem 4rem; border: 1px solid rgba(0, 255, 255, 0.1); overflow: hidden;
      }
      
      .magical-border {
        position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 0; opacity: 0; transition: opacity 0.4s ease;
        background: radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0, 255, 255, 0.15), transparent 40%);
      }
      .fractured-directives-card:hover .magical-border { opacity: 1; }

      .shatter-layer { position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: 0; transition: opacity 0.5s ease; }
      .fractured-directives-card:hover .shatter-layer { opacity: 1; }
      .shatter-layer svg {
        width: 100%; height: 100%;
        mask-image: radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black 10%, transparent 80%);
        -webkit-mask-image: radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black 10%, transparent 80%);
      }
      .crack-line { fill: none; stroke: rgba(0, 255, 255, 0.6); stroke-width: 1px; filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.8)); }

      .directives-content { position: relative; z-index: 5; transform: translateZ(20px); }
      
      .directives-title {
        font-size: 1.1rem; margin: 0 0 2rem 0; color: #00ffff; text-transform: uppercase; letter-spacing: 4px; 
        font-family: var(--font-mono, monospace); text-shadow: 0 0 15px rgba(0,255,255,0.4); text-align: center;
      }

      .directives-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
      @media(min-width: 900px){ .directives-grid { grid-template-columns: 1fr 1fr; } }

      .directive-item {
        display: flex; align-items: flex-start; gap: 1.2rem; font-family: var(--font-body, sans-serif); color: #e0e4eb;
        padding: 1.2rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(0, 255, 255, 0.05); border-radius: 4px;
        transition: border-color 0.3s ease, background 0.3s ease;
      }
      .directive-item:hover {
        border-color: rgba(0, 255, 255, 0.3); background: rgba(0, 255, 255, 0.05);
      }
    `;
    document.head.appendChild(style);
  }

  _buildDOM() {
    this.container.className = 'viewport-section pointer-passthrough z-ui-base';
    
    const { short, full, values } = this.aboutData;
    const photoUrl = this.profileData.photo_url || '';

    const shortPoints = short ? short.split(',').map(s => s.trim()).filter(Boolean) : [];

    // Parse Education Data
    const educationHTML = this.educationData.map(edu => `
      <div class="edu-item">
        <div class="edu-node"></div>
        <div class="edu-header">
          <div class="edu-degree">${edu.degree}</div>
          <div class="edu-field">${edu.field}</div>
          <div class="edu-meta">${edu.institution} | ${edu.timeline.start} - ${edu.timeline.end || 'Present'}</div>
        </div>
        ${edu.relevant_coursework ? `
          <div class="edu-coursework">
            ${edu.relevant_coursework.map(course => `<span class="course-chip">${course}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="container domain-container" style="max-width: 1200px; margin: 0 auto; perspective: 2000px;">
        
        <div class="about-header-container">
          <h2 class="about-title">THE ARCHITECT</h2>
          <div class="about-header-line"></div>
        </div>

        <div class="scorched-architect-card main-monolith bio-card">
          <div class="architect-flame-frame"></div>
          <div class="domain-grid">
            
            <div class="domain-sidebar">
              <div class="architect-avatar-wrapper" title="Initialize Plasma Strike">
                <img src="${photoUrl}" alt="${this.profileData.name}">
              </div>
              
              <div class="diamond-chip-container">
                ${shortPoints.map(pt => `
                  <div class="diamond-chip">
                    <span class="diamond-icon">◈</span>
                    <span>${pt}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="domain-main">
              <div class="bio-mount" data-bio="${full.replace(/"/g, '&quot;')}"></div>
            </div>

          </div>
        </div>

        <div class="scorched-architect-card main-monolith edu-card">
          <div class="architect-flame-frame"></div>
          <h3 class="directives-title" style="color: #ffaa80; text-shadow: 0 0 15px rgba(255,51,0,0.4);">ACADEMIC FOUNDATION</h3>
          <div class="education-timeline-container">
            ${educationHTML}
          </div>
        </div>

        ${values?.length ? `
          <div class="fractured-directives-card secondary-card">
            <div class="magical-border"></div>
            <div class="shatter-layer">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline points="0,20 30,30 40,10 100,5" class="crack-line" />
                <polyline points="30,30 25,60 0,80" class="crack-line" />
                <polyline points="25,60 55,50 85,70 100,65" class="crack-line" />
                <polyline points="40,10 60,45 55,50" class="crack-line" />
              </svg>
            </div>
            
            <div class="directives-content">
              <h3 class="directives-title">OPERATIONAL DIRECTIVES</h3>
              <div class="directives-grid">
                ${values.map(val => `
                  <div class="directive-item">
                    <span style="color: #00ffff; font-size: 1.1rem; transform: translateY(-2px); text-shadow: 0 0 8px rgba(0,255,255,0.8);">⟡</span>
                    <span>${val}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}

      </div>
    `;

    // Store references for animation
    this.monolithCards = this.container.querySelectorAll('.main-monolith'); // Grabs both Bio and Edu
    this.secondaryMonolith = this.container.querySelector('.secondary-card');
    this.avatar = this.container.querySelector('.architect-avatar-wrapper');
    this.bioMount = this.container.querySelector('.bio-mount');
  }

  _mountComponents() {
    const rawText = this.bioMount.dataset.bio;
    this.bioTypewriter = new TypewriterEffect(this.bioMount, {
      text: rawText,
      duration: 1.5, 
      glowColor: '#ff3300', 
      autoStart: false
    });
    this.components.typewriters.push(this.bioTypewriter);
  }

  _setupHazyReveal() {
    if (this.isReducedMotion) {
      gsap.set(this.monolithCards, { opacity: 1, y: 0, filter: 'blur(0px)' });
      if (this.secondaryMonolith) gsap.set(this.secondaryMonolith, { opacity: 1, y: 0, filter: 'blur(0px)' });
      this.bioTypewriter.complete();
      return;
    }

    // Set initial hazy states
    gsap.set(this.monolithCards, { opacity: 0, y: 60, filter: 'blur(20px) contrast(150%)', rotationX: 10 });
    if (this.secondaryMonolith) {
      gsap.set(this.secondaryMonolith, { opacity: 0, y: 40, filter: 'blur(15px)', rotationX: 5 });
    }

    this.scrollTriggers.push(
      ScrollTrigger.create({
        trigger: this.container,
        start: "top 75%",
        onEnter: () => {
          const tl = gsap.timeline();

          // 1. Resolve the Scorched Slabs (Bio & Edu)
          tl.to(this.monolithCards, {
            opacity: 1, y: 0, rotationX: 0,
            filter: 'blur(0px) contrast(100%)',
            duration: 1.4, stagger: 0.2, ease: "power3.out"
          });

          // 2. Start Typewriter on the bio
          tl.add(() => { this.bioTypewriter.play(); }, "-=0.8");

          // 3. Resolve the Directives Slab
          if (this.secondaryMonolith) {
            tl.to(this.secondaryMonolith, {
              opacity: 1, y: 0, rotationX: 0,
              filter: 'blur(0px)',
              duration: 1.2, ease: "power2.out"
            }, "-=0.6");
          }
        }
      })
    );
  }

  _bindPhysics() {
    const bindTilt = (card) => {
      if (!card) return;
      const onMouseMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const tiltX = ((centerY - y) / centerY) * 2; 
        const tiltY = ((x - centerX) / centerX) * 2;

        gsap.to(card, { rotationX: tiltX, rotationY: tiltY, duration: 0.6, ease: "power2.out" });
      };

      const onMouseLeave = () => {
        gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.8, ease: "power2.out" });
      };

      card.addEventListener('mousemove', onMouseMove);
      card.addEventListener('mouseleave', onMouseLeave);
      
      this.eventListeners.push(
        { el: card, type: 'mousemove', fn: onMouseMove },
        { el: card, type: 'mouseleave', fn: onMouseLeave }
      );
    };

    // Bind tilt to all main cards
    this.monolithCards.forEach(card => bindTilt(card));
    bindTilt(this.secondaryMonolith);

    // Magical Border tracking for the Fractured Directives Card
    if (this.secondaryMonolith) {
      const onBorderMove = (e) => {
        const rect = this.secondaryMonolith.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.secondaryMonolith.style.setProperty('--mouse-x', `${x}px`);
        this.secondaryMonolith.style.setProperty('--mouse-y', `${y}px`);
      };
      this.secondaryMonolith.addEventListener('mousemove', onBorderMove);
      this.eventListeners.push({ el: this.secondaryMonolith, type: 'mousemove', fn: onBorderMove });
    }
  }

  _bindInteractiveVFX() {
    const onClick = () => {
      if (this.lightning) {
        this.lightning.stormIntensity = 0.5; 
        this.lightning.triggerBurst();
      }
      gsap.fromTo(this.avatar, 
        { scale: 0.95, filter: 'brightness(1.5) contrast(1.2)' }, 
        { scale: 1, filter: 'brightness(1) contrast(1)', duration: 0.6, ease: "elastic.out(1, 0.4)" }
      );
    };

    this.avatar.addEventListener('click', onClick);
    this.eventListeners.push({ el: this.avatar, type: 'click', fn: onClick });
  }

  dispose() {
    console.log('[AboutSection] Disposing The Domain...');
    
    this.eventListeners.forEach(({ el, type, fn }) => {
      el.removeEventListener(type, fn);
    });
    this.eventListeners = [];

    this.scrollTriggers.forEach(st => st.kill());
    this.scrollTriggers = [];
    
    gsap.killTweensOf('*'); 
    
    this.components.typewriters.forEach(t => t.dispose());
    this.components.typewriters = [];
    
    this.container.innerHTML = '';
  }
}