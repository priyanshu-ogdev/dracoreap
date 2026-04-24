import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { a11yManager } from '../utils/accessibility.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade Scorched Carving Card v7.0 (EMBER WIND EDITION)
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectural Upgrades:
 * - Petrified Wood Core: Uses CSS gradients and SVG filters to simulate dark, ancient wood grain.
 * - Reactive Flame Frame: A procedural SVG border that acts like a ring of fire.
 * - Wind Physics: The flame frame distorts and leans based on hover velocity and scroll inertia.
 * - Pyromancy Reveal: Text doesn't fade in; it burns into the wood.
 */
export class ScorchedCarvingCard {
  constructor(element, options = {}) {
    this.el = element;
    this.config = {
      delay: options.delay ?? 0,
      tiltStrength: options.tiltStrength ?? 6, // Heavy wood, low tilt
      ...options
    };
    
    this.isReducedMotion = a11yManager?.shouldReduceMotion() || false;
    this.bounds = { width: 0, height: 0, left: 0, top: 0 };
    
    // Physics State
    this.mouseVelocity = { x: 0, y: 0 };
    this.lastMouse = { x: 0, y: 0 };
    this.windTracker = 0; // Feeds the SVG displacement map
    
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseEnter = this._handleMouseEnter.bind(this);
    this._handleMouseLeave = this._handleMouseLeave.bind(this);
    this._onTick = this._onTick.bind(this);
    
    this.init();
  }

  init() {
    this._injectStyles();
    this._sculptDOM();
    this._setupReveal();
    
    if (!this.isReducedMotion) {
      this._setupInteractivePhysics();
      // Start the render loop for the wind/fire physics
      gsap.ticker.add(this._onTick);
    }
  }

  _injectStyles() {
    if (document.getElementById('scorched-carving-styles')) return;

    const style = document.createElement('style');
    style.id = 'scorched-carving-styles';
    style.innerHTML = `
      .obsidian-carving {
        position: relative;
        border-radius: 6px;
        transform-style: preserve-3d;
        /* The Petrified Wood Base */
        background: linear-gradient(170deg, #1a100c 0%, #0a0503 50%, #030100 100%);
        box-shadow: 
          inset 0 0 40px rgba(0, 0, 0, 0.9),
          0 15px 35px rgba(0, 0, 0, 0.8);
        padding: 2.5rem;
        z-index: 10;
        cursor: pointer;
      }

      /* SVG Wood Grain Texture Overlay */
      .obsidian-carving::before {
        content: '';
        position: absolute;
        inset: 0;
        opacity: 0.15;
        border-radius: inherit;
        pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='wood'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01 0.4' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 0.5 0 0 0  0 0.2 0 0 0  0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23wood)'/%3E%3C/svg%3E");
        z-index: 1;
      }

      /* The Burning Frame */
      .flame-frame {
        position: absolute;
        inset: -6px;
        border-radius: 8px;
        z-index: -1;
        pointer-events: none;
        background: linear-gradient(45deg, #ff2200, #ffaa00, #ff2200);
        /* Apply the SVG Heat Displacement Filter */
        filter: url(#wind-flame-filter) blur(3px);
        opacity: 0.6;
        transition: opacity 0.4s ease;
      }

      .obsidian-carving:hover .flame-frame {
        opacity: 1;
      }

      /* Content Styling */
      .carving-content {
        position: relative;
        z-index: 5;
        transform: translateZ(20px);
      }

      /* Seared Typography */
      .seared-text {
        font-family: var(--font-display, 'Times New Roman', serif);
        color: #ffbbaa; /* Ashy pale orange */
        text-shadow: 
          0 1px 1px rgba(255,255,255,0.2), 
          0 -1px 2px rgba(0,0,0,0.8),
          0 0 15px rgba(255, 50, 0, 0.4);
        letter-spacing: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  _sculptDOM() {
    this.el.classList.add('obsidian-carving');

    // Tag headers for the seared styling
    const headers = this.el.querySelectorAll('h1, h2, h3, h4');
    headers.forEach(h => h.classList.add('seared-text'));

    const existingHTML = this.el.innerHTML;
    
    // Inject the SVG Filter required for the wind/fire frame
    const svgFilter = `
      <svg style="position: absolute; width: 0; height: 0;" aria-hidden="true">
        <filter id="wind-flame-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015 0.03" numOctaves="3" result="noise" id="flame-noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" xChannelSelector="R" yChannelSelector="G" id="flame-displace" />
        </filter>
      </svg>
    `;

    this.el.innerHTML = `
      ${svgFilter}
      <div class="flame-frame"></div>
      <div class="carving-content">${existingHTML}</div>
    `;

    this.flameNoise = this.el.querySelector('#flame-noise');
    this.flameDisplace = this.el.querySelector('#flame-displace');
  }

  _setupReveal() {
    if (this.isReducedMotion) {
      gsap.set(this.el, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    gsap.fromTo(this.el, 
      { 
        opacity: 0, 
        y: 60,
        scale: 0.9,
        rotationX: 10,
        filter: 'brightness(2) contrast(1.5)',
        boxShadow: '0 0 50px rgba(255, 50, 0, 0.8)'
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationX: 0,
        filter: 'brightness(1) contrast(1)', 
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.8)',
        duration: 1.4,
        delay: this.config.delay,
        ease: "power3.out", 
        scrollTrigger: {
          trigger: this.el,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }

  _setupInteractivePhysics() {
    this.xSet = gsap.quickTo(this.el, "rotationY", { duration: 0.6, ease: "power2.out" });
    this.ySet = gsap.quickTo(this.el, "rotationX", { duration: 0.6, ease: "power2.out" });

    // Target for the wind displacement strength
    this.windScale = { value: 15 };

    this.el.addEventListener('mouseenter', this._handleMouseEnter);
    this.el.addEventListener('mousemove', this._handleMouseMove);
    this.el.addEventListener('mouseleave', this._handleMouseLeave);
  }

  _handleMouseEnter(e) {
    this.bounds = this.el.getBoundingClientRect();
    this.lastMouse = { x: e.clientX, y: e.clientY };
    
    // Push the carving slightly forward, flare the fire
    gsap.to(this.el, { 
      scale: 1.02, 
      z: 30, 
      duration: 0.5, 
      ease: "back.out(1.2)" 
    });
    
    gsap.to(this.windScale, { value: 35, duration: 0.4 }); // Intensify the flames
  }

  _handleMouseMove(e) {
    // 1. Calculate physical tilt
    const mouseX = e.clientX - this.bounds.left;
    const mouseY = e.clientY - this.bounds.top;
    
    const xPct = (mouseX / this.bounds.width) - 0.5; 
    const yPct = (mouseY / this.bounds.height) - 0.5; 
    
    this.xSet(xPct * this.config.tiltStrength);
    this.ySet(-yPct * this.config.tiltStrength); 

    // 2. Calculate "Wind" velocity based on mouse speed
    this.mouseVelocity.x = e.clientX - this.lastMouse.x;
    this.mouseVelocity.y = e.clientY - this.lastMouse.y;
    this.lastMouse = { x: e.clientX, y: e.clientY };

    // Spike the wind strength when moving fast
    const speed = Math.min(Math.abs(this.mouseVelocity.x) + Math.abs(this.mouseVelocity.y), 50);
    gsap.to(this.windScale, { value: 35 + speed, duration: 0.2, overwrite: "auto" });
    
    // Cool it back down quickly when stopped
    gsap.to(this.windScale, { value: 35, duration: 0.8, delay: 0.1, overwrite: "auto" });
  }

  _handleMouseLeave() {
    this.xSet(0);
    this.ySet(0);
    
    gsap.to(this.el, { 
      scale: 1, 
      z: 0,
      duration: 0.8, 
      ease: "elastic.out(1, 0.5)"
    });

    // Settle the flames
    gsap.to(this.windScale, { value: 15, duration: 1.0 });
  }

  /**
   * The Render Loop: Continually animates the SVG Fire filter.
   */
  _onTick(time) {
    if (!this.flameNoise || !this.flameDisplace) return;
    
    // Animate the base frequency to make the flames "lick" upward
    this.windTracker -= 0.005; 
    this.flameNoise.setAttribute('baseFrequency', `0.015 ${0.03 + (Math.sin(time) * 0.01)}`);
    
    // Apply the dynamic displacement scale (reacts to mouse speed)
    this.flameDisplace.setAttribute('scale', this.windScale.value);
  }

  dispose() {
    gsap.ticker.remove(this._onTick);
    ScrollTrigger.getAll().forEach(st => {
      if (st.trigger === this.el) st.kill();
    });

    if (!this.isReducedMotion) {
      this.el.removeEventListener('mouseenter', this._handleMouseEnter);
      this.el.removeEventListener('mousemove', this._handleMouseMove);
      this.el.removeEventListener('mouseleave', this._handleMouseLeave);
    }
  }
}