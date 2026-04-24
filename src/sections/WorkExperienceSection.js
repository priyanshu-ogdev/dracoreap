import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { a11yManager } from '../utils/accessibility.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade Work Experience Controller v1.0 (VOLCANIC TIMELINE)
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectural Upgrades:
 * - Hazy Materialization: Cards emerge from deep blur and high contrast via ScrollTrigger.
 * - Fire-Glitch Resonance: Hovering triggers severe RGB channel splitting and SVG heat displacement.
 * - Magma Vein Timeline: A vertical glowing trace that anchors the professional history.
 * - Elemental Chips: Tech stack badges dynamically cycle through distinct thematic backgrounds.
 */
export class WorkExperienceSection {
  constructor(container, data) {
    this.container = container;
    this.expData = data || [];
    this.isReducedMotion = a11yManager?.shouldReduceMotion() || false;
    
    this.cards = [];
    this.hoverListeners = [];
    
    console.log('[WorkExperience] Accessing Volcanic Timeline Records...');
  }

  init() {
    if (this.expData.length === 0) return;

    this._injectStyles();
    this._buildDOM();
    this._setupReveal();
    if (!this.isReducedMotion) {
      this._setupInteractions();
    }
  }

  _injectStyles() {
    if (document.getElementById('work-exp-styles')) return;
    const style = document.createElement('style');
    style.id = 'work-exp-styles';
    style.innerHTML = `
      .exp-header {
        font-family: var(--font-display, serif);
        font-size: clamp(2rem, 5vw, 3.5rem);
        margin-bottom: 5rem; 
        text-align: center; 
        color: #ffffff; 
        letter-spacing: 6px;
        text-shadow: 0 0 30px rgba(255, 34, 0, 0.5), 0 0 10px rgba(255, 170, 0, 0.3);
      }

      /* The Magma Vein (Vertical Timeline) */
      .timeline-container {
        position: relative;
        max-width: 1000px;
        margin: 0 auto;
        padding-left: 2rem;
      }

      .timeline-container::before {
        content: '';
        position: absolute;
        top: 0; left: 0; bottom: 0;
        width: 2px;
        background: linear-gradient(to bottom, rgba(255,51,0,0.8), rgba(0,255,255,0.4), rgba(255,51,0,0.8));
        box-shadow: 0 0 15px rgba(255, 51, 0, 0.6);
        z-index: 0;
      }

      /* The Fractured Card Base */
      .exp-card-wrapper {
        position: relative;
        margin-bottom: 4rem;
        padding-left: 3rem;
        perspective: 1000px;
      }

      /* Timeline Node (The glowing dot on the line) */
      .exp-node {
        position: absolute;
        top: 0; left: -6px;
        width: 14px; height: 14px;
        border-radius: 50%;
        background: #000;
        border: 2px solid #00ffff;
        box-shadow: 0 0 10px #00ffff;
        z-index: 2;
        transition: all 0.3s ease;
      }

      .exp-card-wrapper:hover .exp-node {
        background: #00ffff;
        box-shadow: 0 0 20px #00ffff, 0 0 40px #ff3300;
        border-color: #ff3300;
      }

      /* The Card Surface */
      .fractured-exp-card {
        position: relative;
        background: rgba(8, 10, 14, 0.85); /* Deep obsidian */
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 51, 0, 0.15);
        border-radius: 4px;
        padding: 2.5rem;
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.8);
        overflow: hidden;
        transform-style: preserve-3d;
        transition: border-color 0.4s ease;
      }

      /* SVG Fire Distortion Border (Hidden until hover) */
      .fire-distortion-layer {
        position: absolute;
        inset: -2px;
        border: 2px solid #ff3300;
        border-radius: 4px;
        filter: url(#exp-fire-filter);
        opacity: 0;
        pointer-events: none;
        z-index: 0;
        transition: opacity 0.3s ease;
      }

      .exp-card-wrapper:hover .fire-distortion-layer {
        opacity: 0.8;
      }

      .exp-card-wrapper:hover .fractured-exp-card {
        border-color: transparent;
      }

      /* Content Z-Indexing */
      .exp-content {
        position: relative;
        z-index: 5;
      }

      /* Typography & Glitch */
      .exp-role {
        font-family: var(--font-display, serif);
        font-size: clamp(1.4rem, 3vw, 1.8rem);
        color: #ffffff;
        margin: 0 0 0.5rem 0;
        letter-spacing: 2px;
        position: relative;
      }

      .exp-company {
        font-family: var(--font-mono, monospace);
        font-size: 1rem;
        color: var(--color-cyan, #00ffff);
        margin-bottom: 1.5rem;
        letter-spacing: 3px;
        text-transform: uppercase;
      }

      .exp-timeline-date {
        position: absolute;
        top: 2.5rem; right: 2.5rem;
        font-family: var(--font-mono, monospace);
        font-size: 0.85rem;
        color: #667788;
        letter-spacing: 2px;
      }

      .exp-description {
        font-family: var(--font-body, sans-serif);
        font-size: 0.95rem;
        color: #a0a0a0;
        line-height: 1.7;
        margin-bottom: 1.5rem;
      }

      .exp-achievements {
        list-style: none;
        padding: 0;
        margin: 0 0 2rem 0;
      }
      .exp-achievements li {
        font-family: var(--font-body, sans-serif);
        font-size: 0.9rem;
        color: #d0d0d0;
        margin-bottom: 0.8rem;
        padding-left: 1.5rem;
        position: relative;
      }
      .exp-achievements li::before {
        content: '▹';
        position: absolute;
        left: 0; top: -2px;
        color: #ff3300;
        font-size: 1.2rem;
      }

      /* Elemental Chips */
      .exp-chips-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;
      }

      .elemental-chip {
        font-family: var(--font-mono, monospace);
        font-size: 0.75rem;
        padding: 0.4rem 0.8rem;
        border-radius: 2px;
        letter-spacing: 1px;
        text-transform: uppercase;
        border: 1px solid;
      }

      /* Dynamic Chip Backgrounds */
      .chip-type-0 { background: rgba(0, 255, 255, 0.05); border-color: rgba(0, 255, 255, 0.3); color: #00ffff; }
      .chip-type-1 { background: rgba(255, 51, 0, 0.05); border-color: rgba(255, 51, 0, 0.3); color: #ff3300; }
      .chip-type-2 { background: rgba(255, 170, 0, 0.05); border-color: rgba(255, 170, 0, 0.3); color: #ffaa00; }
      .chip-type-3 { background: rgba(200, 200, 255, 0.05); border-color: rgba(200, 200, 255, 0.3); color: #e0e0ff; }

      @media (max-width: 768px) {
        .timeline-container { padding-left: 1rem; }
        .exp-card-wrapper { padding-left: 2rem; }
        .exp-timeline-date { position: relative; top: 0; right: 0; margin-bottom: 1rem; display: block; }
      }
    `;
    document.head.appendChild(style);
  }

  _buildDOM() {
    this.container.className = 'viewport-section z-ui-base';

    // Inject the SVG Fire Filter required for the border distortion
    const svgFilter = `
      <svg style="position: absolute; width: 0; height: 0;" aria-hidden="true">
        <filter id="exp-fire-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.08" numOctaves="2" result="noise" id="exp-noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    `;

    this.container.innerHTML = `
      ${svgFilter}
      <div class="container" style="max-width: 1200px; margin: 0 auto;">
        <h2 class="exp-header">EXPERIENCE & OPERATIONS</h2>
        
        <div class="timeline-container">
          ${this.expData.map((exp, i) => `
            <div class="exp-card-wrapper">
              <div class="exp-node"></div>
              
              <article class="fractured-exp-card">
                <div class="fire-distortion-layer"></div>
                
                <div class="exp-content">
                  <div class="exp-timeline-date">${exp.timeline.start} // ${exp.timeline.end || 'PRESENT'}</div>
                  
                  <div class="glitch-target-container" style="position: relative;">
                    <h3 class="exp-role glitch-main">${exp.role}</h3>
                    <h3 class="exp-role glitch-red" style="position: absolute; top:0; left:0; color: #ff0033; opacity: 0; pointer-events: none;">${exp.role}</h3>
                    <h3 class="exp-role glitch-cyan" style="position: absolute; top:0; left:0; color: #00ffff; opacity: 0; pointer-events: none;">${exp.role}</h3>
                  </div>

                  <div class="exp-company">${exp.company}</div>
                  
                  <p class="exp-description">${exp.description}</p>
                  
                  ${exp.achievements ? `
                    <ul class="exp-achievements">
                      ${exp.achievements.map(ach => `<li>${ach}</li>`).join('')}
                    </ul>
                  ` : ''}

                  <div class="exp-chips-container">
                    ${exp.tech_stack.map((tech, techIndex) => `
                      <span class="elemental-chip chip-type-${techIndex % 4}">${tech}</span>
                    `).join('')}
                  </div>
                </div>

              </article>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.title = this.container.querySelector('.exp-header');
    this.wrappers = this.container.querySelectorAll('.exp-card-wrapper');
    this.noiseElement = this.container.querySelector('#exp-noise');
  }

  _setupReveal() {
    if (this.isReducedMotion) return;

    // Title Reveal
    gsap.fromTo(this.title, 
      { opacity: 0, y: -40, filter: 'blur(15px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.5, ease: "power3.out", scrollTrigger: { trigger: this.container, start: "top 80%" } }
    );

    // Hazy Load: Cards materialize from deep blur as user scrolls
    this.wrappers.forEach((wrapper, index) => {
      const card = wrapper.querySelector('.fractured-exp-card');
      const node = wrapper.querySelector('.exp-node');

      gsap.fromTo([card, node], 
        { 
          opacity: 0, 
          y: 60, 
          rotationX: 10, 
          filter: 'blur(20px) contrast(200%)' // The "Hazy Load" 
        },
        { 
          opacity: 1, 
          y: 0, 
          rotationX: 0, 
          filter: 'blur(0px) contrast(100%)', 
          duration: 1.4, 
          ease: "expo.out",
          scrollTrigger: {
            trigger: wrapper,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });
  }

  _setupInteractions() {
    this.wrappers.forEach(wrapper => {
      const mainText = wrapper.querySelector('.glitch-main');
      const redText = wrapper.querySelector('.glitch-red');
      const cyanText = wrapper.querySelector('.glitch-cyan');
      
      let glitchTimeline;

      const onMouseEnter = () => {
        // Fire up the SVG noise frequency for a more aggressive burn
        if (this.noiseElement) {
          gsap.to(this.noiseElement, { attr: { baseFrequency: '0.08 0.15' }, duration: 0.3 });
        }

        // Trigger RGB Cyber-Glitch
        glitchTimeline = gsap.timeline();
        glitchTimeline
          .to(mainText, { opacity: 0, duration: 0.05 })
          .to(redText, { opacity: 0.8, x: -4, y: 2, duration: 0.05 }, "<")
          .to(cyanText, { opacity: 0.8, x: 4, y: -2, duration: 0.05 }, "<")
          .to([redText, cyanText], { x: 0, y: 0, opacity: 0, duration: 0.15, ease: "power2.in" })
          .to(mainText, { opacity: 1, duration: 0.1 }, "-=0.1");
      };

      const onMouseLeave = () => {
        // Settle the fire down
        if (this.noiseElement) {
          gsap.to(this.noiseElement, { attr: { baseFrequency: '0.04 0.08' }, duration: 0.8 });
        }
        
        // Reset text
        if (glitchTimeline) glitchTimeline.kill();
        gsap.set([redText, cyanText], { opacity: 0, x: 0, y: 0 });
        gsap.set(mainText, { opacity: 1 });
      };

      wrapper.addEventListener('mouseenter', onMouseEnter);
      wrapper.addEventListener('mouseleave', onMouseLeave);
      
      this.hoverListeners.push({ wrapper, onMouseEnter, onMouseLeave });
    });
  }

  dispose() {
    this.hoverListeners.forEach(({ wrapper, onMouseEnter, onMouseLeave }) => {
      wrapper.removeEventListener('mouseenter', onMouseEnter);
      wrapper.removeEventListener('mouseleave', onMouseLeave);
    });
    this.hoverListeners = [];
    
    ScrollTrigger.getAll().forEach(st => {
      if (st.trigger === this.container || Array.from(this.wrappers).includes(st.trigger)) {
        st.kill();
      }
    });
    
    gsap.killTweensOf('*'); // Kills all tweens within this scope
    this.container.innerHTML = '';
  }
}