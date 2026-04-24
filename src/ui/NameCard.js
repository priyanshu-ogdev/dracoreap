import gsap from 'gsap';

/**
 * Industry-Grade Name Card v6.1 (MAGMA COALESCENCE)
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectural Upgrades:
 * - Fluid Lava Physics: Uses a hyper-realistic SVG `feTurbulence` liquid fire filter.
 * - Singularity Entrance: The initial orb violently collapses into a high-density point before expanding into the solid card (removing the old 3D flip).
 * - Magma Convergence Hover: Replaced 3D tilt with a thermodynamic effect where raw magma energy surges inward from the card's perimeter on hover.
 */
export class NameCard {
  constructor(targetId, name = "Priyanshu Roy", title = "AI Researcher & Technologist") {
    this.mountNode = typeof targetId === 'string' ? document.getElementById(targetId) : targetId;
    this.name = name;
    this.title = title;
    
    this.container = null;
    this.orb = null;
    this.card = null;
    this.convergeRing = null;
    this.cardGlow = null;
    this.engravedName = null;
  }

  build() {
    if (!this.mountNode) return;

    this._injectStyles();

    this.container = document.createElement('div');
    this.container.className = 'name-card-wrapper';

    // SVG Filter for realistic liquid magma
    const svgFilter = `
      <svg style="position:absolute; width:0; height:0;" aria-hidden="true">
        <filter id="liquid-magma">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 0.2 0 0 0  0 0 0 0 0  0 0 0 1 0" in="noise" result="coloredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="coloredNoise" scale="30" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    `;

    this.container.innerHTML = `
      ${svgFilter}
      <div class="magma-orb"></div>
      
      <div class="solidified-card">
        <div class="card-glow-aura"></div>
        <div class="magma-converge-ring"></div>
        
        <div class="card-inner-content">
          <h1 class="card-engraved-name">${this.name}</h1>
          <h3 class="card-engraved-title">${this.title}</h3>
          <div class="card-tech-line"></div>
        </div>
      </div>
    `;

    this.mountNode.appendChild(this.container);

    this.orb = this.container.querySelector('.magma-orb');
    this.card = this.container.querySelector('.solidified-card');
    this.convergeRing = this.container.querySelector('.magma-converge-ring');
    this.cardGlow = this.container.querySelector('.card-glow-aura');
    this.engravedName = this.container.querySelector('.card-engraved-name');
    
    // Initial State: Orb scales up to boil
    gsap.set(this.orb, { scale: 0, opacity: 0 });
    gsap.set(this.card, { opacity: 0, scale: 0.8, filter: 'blur(20px) contrast(200%)' });
    
    // The Gather Phase
    gsap.to(this.orb, { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.5)" });
  }

  open() {
    if (!this.orb || !this.card) return;

    const tl = gsap.timeline();

    // 1. The Implosion (Magma converges into a singularity)
    tl.to(this.orb, { 
      scale: 0.1, 
      opacity: 1, 
      filter: 'brightness(3) blur(2px)', 
      duration: 0.4, 
      ease: "power4.in" 
    });

    // 2. The Detonation Shockwave
    tl.to(this.orb, { 
      scale: 6, 
      opacity: 0, 
      duration: 0.3, 
      ease: "power2.out" 
    });

    // 3. The Solidification (Card materializes from the heat)
    tl.to(this.card, {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px) contrast(100%)',
      duration: 1.2,
      ease: "elastic.out(1, 0.6)"
    }, "-=0.2");

    // --- MAGMA CONVERGENCE HOVER ---
    this.card.addEventListener('mouseenter', () => {
      // The outer ring violently collapses inward
      gsap.to(this.convergeRing, { 
        scale: 1, 
        opacity: 1, 
        duration: 0.5, 
        ease: "expo.out" 
      });
      
      // The background aura tightens and burns hotter
      gsap.to(this.cardGlow, { 
        opacity: 0.9, 
        scale: 0.95, 
        duration: 0.5, 
        ease: "expo.out" 
      });

      // The engraved text absorbs the heat
      gsap.to(this.engravedName, { 
        color: '#ffffff', 
        textShadow: '0 0 20px #ff3300, 0 0 40px #ffaa00', 
        duration: 0.3 
      });
    });

    this.card.addEventListener('mouseleave', () => {
      // The heat dissipates outward
      gsap.to(this.convergeRing, { 
        scale: 1.05, 
        opacity: 0, 
        duration: 0.8, 
        ease: "power2.out" 
      });
      
      gsap.to(this.cardGlow, { 
        opacity: 0.3, 
        scale: 1, 
        duration: 0.8, 
        ease: "power2.out" 
      });

      gsap.to(this.engravedName, { 
        color: '#ffffff', 
        textShadow: '0 0 15px rgba(255, 51, 0, 0.4)', 
        duration: 0.6 
      });
    });
  }

  _injectStyles() {
    if (document.getElementById('name-card-styles')) return;

    const style = document.createElement('style');
    style.id = 'name-card-styles';
    style.innerHTML = `
      .name-card-wrapper {
        position: relative;
        width: 100%;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        /* Prevent interactions from triggering prematurely */
        pointer-events: none; 
      }

      /* Liquid Magma Orb */
      .magma-orb {
        position: absolute;
        top: 50%; left: 30%;
        transform: translate(-50%, -50%);
        width: 120px; height: 120px;
        border-radius: 50%;
        background: radial-gradient(circle at center, #ffffff 0%, #ffaa00 20%, #ff3300 60%, #1a0000 100%);
        box-shadow: 0 0 60px #ff3300, inset 0 0 20px #ffffff;
        filter: url(#liquid-magma) blur(2px);
        pointer-events: none;
        z-index: 5;
      }

      /* The Final Solid Card */
      .solidified-card {
        position: relative;
        width: 100%;
        max-width: 600px;
        padding: 3rem 4rem;
        background: rgba(5, 2, 2, 0.85); 
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 6px;
        border: 1px solid rgba(255, 51, 0, 0.2);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), inset 0 0 30px rgba(255, 51, 0, 0.05);
        z-index: 10;
        overflow: hidden;
        pointer-events: auto; /* Re-enable for the hover effect */
        cursor: default;
      }

      /* Base Ambient Glow */
      .card-glow-aura {
        position: absolute;
        inset: -20px;
        background: radial-gradient(circle at bottom right, rgba(255, 51, 0, 0.3) 0%, transparent 60%);
        pointer-events: none;
        z-index: 1;
        opacity: 0.3;
      }

      /* Convergence Heat Ring */
      .magma-converge-ring {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        border: 2px solid #ff3300;
        box-shadow: inset 0 0 30px rgba(255, 51, 0, 0.8), 0 0 30px rgba(255, 170, 0, 0.6);
        opacity: 0;
        transform: scale(1.05);
        pointer-events: none;
        z-index: 2;
      }

      .card-inner-content {
        position: relative;
        z-index: 5;
      }

      .card-engraved-name {
        font-family: var(--font-display, serif);
        font-size: clamp(2rem, 4vw, 3.5rem);
        margin: 0;
        color: #ffffff;
        letter-spacing: 6px;
        text-shadow: 0 0 15px rgba(255, 51, 0, 0.4);
      }

      .card-engraved-title {
        font-family: var(--font-mono, monospace);
        font-size: clamp(0.9rem, 1.5vw, 1.1rem);
        margin-top: 1rem;
        color: #00ffff;
        letter-spacing: 6px;
        text-transform: uppercase;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
      }

      .card-tech-line {
        width: 60px;
        height: 2px;
        background: #ff3300;
        margin-top: 1.5rem;
        box-shadow: 0 0 10px #ff3300;
      }
    `;
    document.head.appendChild(style);
  }

  dispose() {
    gsap.killTweensOf('*');
    if (this.mountNode) this.mountNode.innerHTML = '';
  }
}