import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { a11yManager } from '../utils/accessibility.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade Skills Section Controller v8.0 (VOLCANIC ARSENAL)
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectural Upgrades:
 * - Native Synergy: Stripped the external ScorchedCarvingCard dependency to completely unify the GSAP timeline and eliminate disjointed loading.
 * - Spatial Expansion: Injected significant vertical padding to alleviate congestion and let the UI breathe.
 * - Superheated Typography: The domain title is fortified with a multi-layered incandescent text-shadow for absolute visibility.
 * - Seamless Matrix: The left Magma Core and right Data Pane now load simultaneously as a single fused entity.
 */
export class SkillsSection {
  constructor(container, data) {
    this.container = container;
    
    // Bind to the full JSON skills array
    this.skillsData = data && data.length > 0 ? data : [];
    
    this.scrollTriggers = []; 
    this.isReducedMotion = a11yManager?.shouldReduceMotion() || false;
    
    console.log('[SkillsSection] Igniting Volcanic Arsenal...');
  }

  init() {
    if (this.skillsData.length === 0) return;
    this._injectStyles();
    this._buildDOM();
    this._setupAnimations();
  }

  _injectStyles() {
    if (document.getElementById('skills-section-styles')) return;
    const style = document.createElement('style');
    style.id = 'skills-section-styles';
    style.innerHTML = `
      /* Vertical Spacing Overhaul */
      .skills-container-wrapper {
        padding: 10rem 0; /* Massive breathing room */
        perspective: 2000px;
        width: 100%;
      }

      .arsenal-header {
        font-family: var(--font-display, serif);
        font-size: clamp(2rem, 5vw, 3.5rem);
        margin-bottom: 5rem; 
        text-align: center; 
        pointer-events: auto; 
        color: #ffffff; 
        letter-spacing: 6px;
        text-shadow: 0 0 30px rgba(255, 34, 0, 0.8), 0 0 10px rgba(255, 170, 0, 0.5);
      }
      
      .arsenal-stream {
        display: flex;
        flex-direction: column;
        gap: 3.5rem;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }

      /* Unified Split-Slab Row */
      .skill-unified-row {
        display: flex;
        width: 100%;
        pointer-events: auto;
        border-radius: 8px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.8);
        transition: transform 0.4s ease, box-shadow 0.4s ease;
      }

      .skill-unified-row:hover {
        transform: translateY(-5px);
        box-shadow: 0 30px 60px rgba(0,0,0,0.95);
      }

      /* --- LEFT PANE: NATIVE MAGMA CORE --- */
      .magma-core-pane {
        position: relative;
        flex: 1;
        min-width: 320px;
        background: linear-gradient(160deg, #110a08 0%, #080402 50%, #020101 100%);
        border-radius: 8px 0 0 8px;
        border: 1px solid rgba(255, 51, 0, 0.2);
        border-right: none;
        padding: 3rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        box-shadow: inset 0 0 40px rgba(0,0,0,0.8);
        overflow: hidden;
        z-index: 2;
        transition: border-color 0.4s ease;
      }

      .magma-core-pane::before {
        content: '';
        position: absolute;
        inset: 0;
        opacity: 0.15;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        z-index: -1;
        pointer-events: none;
      }

      .magma-aura {
        position: absolute;
        inset: -2px;
        z-index: -2;
        background: linear-gradient(45deg, #ff3300, transparent, #ffaa00);
        opacity: 0;
        filter: blur(15px);
        transition: opacity 0.5s ease;
        pointer-events: none;
      }

      .skill-unified-row:hover .magma-core-pane { border-color: rgba(255, 51, 0, 0.5); }
      .skill-unified-row:hover .magma-aura { opacity: 0.5; }

      /* Superheated Domain Title */
      .skill-category-title {
        margin: 0; 
        color: #ffffff; 
        text-transform: uppercase; 
        letter-spacing: 3px; 
        font-size: 1.4rem; 
        font-family: var(--font-display, serif);
        text-shadow: 0 0 10px #ff3300, 0 0 20px #ff0000, 0 0 35px #ffaa00;
      }

      /* --- RIGHT PANE: DATA INTERFACE --- */
      .skills-extended-pane {
        flex: 1.5;
        background: linear-gradient(135deg, #0a0b10 0%, #050608 100%);
        border: 1px solid rgba(0, 255, 255, 0.1);
        border-left: 2px solid rgba(255, 51, 0, 0.4); /* The Magma Seam */
        border-radius: 0 8px 8px 0;
        padding: 2.5rem 3.5rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        box-shadow: inset -20px 0 40px rgba(0, 0, 0, 0.8);
        z-index: 1;
        transition: border-left-color 0.4s ease;
      }

      .skill-unified-row:hover .skills-extended-pane {
        border-left-color: #ffaa00;
      }

      /* The Brick Chips */
      .brick-chip-matrix {
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;
      }

      .brick-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #080302;
        border: 1px solid rgba(255, 51, 0, 0.3);
        border-radius: 3px;
        color: #ffaa80;
        font-family: var(--font-mono, monospace);
        font-size: 0.8rem;
        letter-spacing: 1px;
        text-transform: uppercase;
        box-shadow: 2px 2px 0px rgba(255, 51, 0, 0.15);
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        opacity: 0; /* Handled by GSAP */
        transform: translateY(10px);
      }

      .brick-chip .chip-icon {
        color: #ff3300;
        font-size: 0.95rem;
        text-shadow: 0 0 8px rgba(255, 51, 0, 0.8);
      }

      .brick-chip:hover {
        background: rgba(255, 51, 0, 0.15);
        border-color: #ffaa00;
        color: #ffffff;
        transform: translate(-3px, -3px) !important; /* Overrides GSAP resting state */
        box-shadow: 5px 5px 0px rgba(255, 51, 0, 0.4), 0 0 15px rgba(255, 51, 0, 0.2);
      }

      @media (max-width: 900px) {
        .skill-unified-row { flex-direction: column; }
        .magma-core-pane { border-radius: 8px 8px 0 0; border-right: 1px solid rgba(255, 51, 0, 0.2); border-bottom: none; padding: 2.5rem; }
        .skills-extended-pane { border-radius: 0 0 8px 8px; border-left: 1px solid rgba(0, 255, 255, 0.1); border-top: 2px solid rgba(255, 51, 0, 0.4); padding: 2.5rem; }
      }
    `;
    document.head.appendChild(style);
  }

  _buildDOM() {
    this.container.className = 'viewport-section pointer-passthrough z-ui-base';
    
    // Default icons mapping if missing
    const getIcon = (domain) => {
      const d = domain.toLowerCase();
      if (d.includes('ai') || d.includes('machine')) return '/assets/icons/ai-core.svg';
      if (d.includes('edge') || d.includes('system')) return '/assets/icons/edge-node.svg';
      if (d.includes('cyber') || d.includes('security')) return '/assets/icons/shield-lock.svg';
      return '/assets/icons/terminal.svg';
    };

    const streamHTML = this.skillsData.map((skill, i) => `
      <article class="skill-unified-row" data-index="${i}">
        
        <div class="magma-core-pane">
          <div class="magma-aura"></div>
          <header style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;">
            <div style="width: 48px; height: 48px; filter: drop-shadow(0 0 15px rgba(255,51,0,1));">
              <img src="${getIcon(skill.domain)}" alt="" style="width: 100%; height: 100%;" onerror="this.style.display='none'">
            </div>
            <h3 class="skill-category-title">${skill.domain}</h3>
          </header>
        </div>

        <div class="skills-extended-pane">
          <div class="brick-chip-matrix">
            ${skill.technical_skills.map(tech => `
              <div class="brick-chip">
                <span class="chip-icon">◈</span>
                <span class="chip-text">${tech}</span>
              </div>
            `).join('')}
          </div>
        </div>

      </article>
    `).join('');

    this.container.innerHTML = `
      <div class="skills-container-wrapper container">
        <h2 class="arsenal-header">ARSENAL & DOMAINS</h2>
        <div class="arsenal-stream">
          ${streamHTML}
        </div>
      </div>
    `;

    this.title = this.container.querySelector('.arsenal-header');
    this.rows = this.container.querySelectorAll('.skill-unified-row');
  }

  _setupAnimations() {
    if (this.isReducedMotion) {
      gsap.set(this.title, { opacity: 1, y: 0 });
      this.rows.forEach(row => {
        gsap.set(row, { opacity: 1, y: 0, filter: 'none' });
        gsap.set(row.querySelectorAll('.brick-chip'), { opacity: 1, y: 0 });
      });
      return;
    }

    // Title Intro
    gsap.fromTo(this.title, 
      { opacity: 0, y: -40, scale: 1.1, textShadow: '0 0 100px #ff2200' },
      { 
        opacity: 1, y: 0, scale: 1, textShadow: '0 0 30px rgba(255, 34, 0, 0.8), 0 0 10px rgba(255, 170, 0, 0.5)',
        duration: 1.4, ease: "expo.out",
        scrollTrigger: { trigger: this.container, start: "top 80%" }
      }
    );

    // Flawlessly Synchronized Row Activation
    this.rows.forEach((row, i) => {
      const chips = row.querySelectorAll('.brick-chip');

      // Initial resting state for the entire row
      gsap.set(row, { opacity: 0, y: 60, filter: 'blur(15px)' });

      this.scrollTriggers.push(
        ScrollTrigger.create({
          trigger: row,
          start: "top 85%",
          onEnter: () => {
            const tl = gsap.timeline();

            // 1. Unify the load: The entire fused row comes in as one clean object
            tl.to(row, {
              opacity: 1, y: 0, filter: 'blur(0px)',
              duration: 1.0, ease: "power3.out",
              clearProps: "filter" // Clear blur to prevent scrolling performance issues
            });

            // 2. Brick Chips slam in sequentially immediately after the row solidifies
            tl.to(chips, { 
              opacity: 1, y: 0, 
              duration: 0.6, stagger: 0.05, ease: "back.out(1.5)",
              clearProps: "transform" // Critical: Clears GSAP transform so CSS hover works perfectly
            }, "-=0.4");
          }
        })
      );
    });
  }

  dispose() {
    console.log('[SkillsSection] Extinguishing Volcanic Arsenal...');
    this.scrollTriggers.forEach(st => st.kill());
    this.scrollTriggers = [];
    gsap.killTweensOf('*');
    this.container.innerHTML = '';
  }
}