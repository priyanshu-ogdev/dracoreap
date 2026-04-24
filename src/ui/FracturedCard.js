import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { a11yManager } from '../utils/accessibility.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Industry-Grade Fractured UI Card v5.0 (OBSIDIAN SHATTER)
 * * Architectural Upgrades:
 * - Fractured Glass Injection: Dynamically builds SVG shatter-lines on initialization.
 * - Reactive Magma Borders: Uses mouse-tracking to illuminate the card's physical edges.
 * - Materialization Reveal: GSAP triggers a violent "snap-together" effect from the storm fog.
 */
export class FracturedCard {
  constructor(element, options = {}) {
    this.el = element;
    
    this.config = {
      tiltMaxDeg: options.tiltMaxDeg ?? 8, // Increased slightly to show off the internal depth
      delay: options.delay ?? 0,
      glowColor: options.glowColor ?? 'rgba(255, 255, 255, 0.8)', // Ancient Storm White/Cyan
      ...options
    };

    this.isReducedMotion = a11yManager?.shouldReduceMotion() || false;
    this.bounds = { width: 0, height: 0, left: 0, top: 0 };
    
    this.xSet = null;
    this.ySet = null;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    
    this.init();
  }

  init() {
    this.el.classList.add('obsidian-shatter-card');
    
    // Inject the magical borders and broken glass SVG
    this._buildMagicalArtifacts();
    this._setupReveal();
    
    if (!this.isReducedMotion) {
      this._setupGSAP();
      this.el.addEventListener('mouseenter', this._onMouseEnter, { passive: true });
      this.el.addEventListener('mousemove', this._onMouseMove, { passive: true });
      this.el.addEventListener('mouseleave', this._onMouseLeave, { passive: true });
      window.addEventListener('resize', () => this.bounds = this.el.getBoundingClientRect(), { passive: true });
    }
  }

  /**
   * Dynamically constructs the visual layers so your HTML remains clean.
   */
  _buildMagicalArtifacts() {
    // 1. The Magical Glowing Border
    const border = document.createElement('div');
    border.className = 'magical-border';
    
    // 2. The Shattered Glass Overlay (Procedural SVG Cracks)
    const shatterLayer = document.createElement('div');
    shatterLayer.className = 'shatter-layer';
    shatterLayer.innerHTML = `
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,20 L30,35 L25,60 L0,80 Z" class="shard" />
        <path d="M30,35 L60,15 L75,50 L45,65 Z" class="shard" />
        <path d="M25,60 L45,65 L55,100 L0,100 Z" class="shard" />
        <path d="M60,15 L100,0 L100,45 L75,50 Z" class="shard" />
        <path d="M75,50 L100,45 L100,100 L55,100 Z" class="shard" />
        <polyline points="0,20 30,35 60,15 100,0" class="crack-line" />
        <polyline points="30,35 25,60 0,80" class="crack-line" />
        <polyline points="25,60 45,65 75,50 100,45" class="crack-line" />
        <polyline points="45,65 55,100" class="crack-line" />
      </svg>
    `;

    this.el.prepend(shatterLayer);
    this.el.prepend(border);
  }

  _setupReveal() {
    if (this.isReducedMotion) {
      gsap.set(this.el, { opacity: 1, y: 0, filter: 'blur(0px)' });
      return;
    }

    // Violent snap-in from the storm
    gsap.fromTo(this.el, 
      { 
        opacity: 0, 
        y: 40, 
        scale: 0.9,
        filter: 'blur(20px) contrast(200%)',
        rotationX: 10,
        rotationY: -10
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px) contrast(100%)',
        rotationX: 0,
        rotationY: 0,
        duration: 1.2,
        delay: this.config.delay,
        ease: "expo.out(1.2, 0.7)", // Snaps into place heavily
        scrollTrigger: {
          trigger: this.el,
          start: "top 85%", 
          toggleActions: "play none none reverse"
        }
      }
    );
  }

  _setupGSAP() {
    this.xSet = gsap.quickTo(this.el, "rotationY", { ease: "power3.out", duration: 0.4 });
    this.ySet = gsap.quickTo(this.el, "rotationX", { ease: "power3.out", duration: 0.4 });
  }

  _onMouseEnter() {
    this.bounds = this.el.getBoundingClientRect();
    this.el.classList.add('is-active');
  }

  _onMouseMove(e) {
    const mouseX = e.clientX - this.bounds.left;
    const mouseY = e.clientY - this.bounds.top;
    
    const xPct = (mouseX / this.bounds.width) - 0.5;
    const yPct = (mouseY / this.bounds.height) - 0.5;

    // Physical Tilt
    this.xSet(xPct * this.config.tiltMaxDeg);
    this.ySet(-yPct * this.config.tiltMaxDeg);

    // Pipe coordinates to CSS for the fracture lighting
    this.el.style.setProperty('--mouse-x', `${mouseX}px`);
    this.el.style.setProperty('--mouse-y', `${mouseY}px`);
  }

  _onMouseLeave() {
    this.xSet(0);
    this.ySet(0);
    this.el.classList.remove('is-active');
    
    gsap.to(this.el, {
      rotationX: 0,
      rotationY: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.4)"
    });
  }

  dispose() {
    this.el.removeEventListener('mouseenter', this._onMouseEnter);
    this.el.removeEventListener('mousemove', this._onMouseMove);
    this.el.removeEventListener('mouseleave', this._onMouseLeave);
    
    ScrollTrigger.getAll().forEach(st => {
      if (st.trigger === this.el) st.kill();
    });
    
    gsap.killTweensOf(this.el);
  }
}