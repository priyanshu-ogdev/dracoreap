import gsap from 'gsap';
import { a11yManager } from '../utils/accessibility.js';

/**
 * Industry-Grade Volcanic Tome Button v8.0 (OBSIDIAN MAGMA)
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectural Upgrades:
 * - Scorched Earth Reset: Added aggressive CSS resets (`all: unset`, `appearance: none`) to completely strip browser default button/anchor styles.
 * - Dimension Enforcement: Enforced strict `min-width` and `min-height` directly in the CSS to prevent the 3D children from collapsing.
 * - Z-Index Layering: Perfectly stacked the 3D container behind the text, and the invisible hitbox shield in front of everything.
 */
export class VolcanicTomeButton {
  constructor(element, options = {}) {
    if (!element) {
      console.warn('[VolcanicTomeButton] Target element is null.');
      return;
    }
    
    this.el = element; 
    this.config = {
      magneticStrength: options.magneticStrength ?? 0.3,
      tiltMaxDeg: options.tiltMaxDeg ?? 15,
      text: options.text || element.textContent.trim() || 'INITIATE',
      ...options
    };
    
    this.isReducedMotion = a11yManager?.shouldReduceMotion() || false;
    this.bounds = { width: 0, height: 0, left: 0, top: 0 };
    
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    this.init();
  }

  init() {
    this._injectStyles();
    this._buildDOM();
    this._setupPhysics();
    this._bindEvents();
    
    // Slight delay to ensure DOM layout is complete before measuring
    setTimeout(() => this._calculateBounds(), 150);
    window.addEventListener('resize', () => this._calculateBounds(), { passive: true });
  }

  _injectStyles() {
    if (document.getElementById('volcanic-tome-styles')) return;

    const style = document.createElement('style');
    style.id = 'volcanic-tome-styles';
    style.innerHTML = `
      /* AGGRESSIVE RESET: Strips all browser defaults from buttons/anchors */
      .volcanic-tome-btn {
        all: unset; 
        -webkit-appearance: none;
        appearance: none;
        box-sizing: border-box;
        position: relative;
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        min-width: 260px;
        min-height: 75px;
        text-decoration: none !important;
        outline: none !important;
        cursor: pointer;
        perspective: 1000px;
        user-select: none;
        -webkit-user-select: none;
        background: transparent !important;
        border: none !important;
        padding: 0;
        margin: 0;
      }

      /* HITBOX SHIELD: Z-Index 9999 catches all events flawlessly */
      .tome-hitbox {
        position: absolute;
        inset: -15px;
        z-index: 9999;
        cursor: pointer;
        background: transparent;
      }

      /* The 3D Container holds the rock and magma */
      .tome-container {
        position: absolute;
        inset: 0;
        border-radius: 4px;
        transform-style: preserve-3d;
        background: #050202; 
        border: 1px solid rgba(255, 34, 0, 0.2); 
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.9), inset 0 0 10px rgba(0,0,0,0.9);
        transition: border-color 0.4s ease, box-shadow 0.4s ease;
        z-index: 1; /* Behind the text */
      }

      .volcanic-tome-btn.is-hovered .tome-container {
        border-color: rgba(255, 34, 0, 0.8);
        box-shadow: 0 25px 50px rgba(255, 34, 0, 0.15), inset 0 0 20px rgba(255, 34, 0, 0.2);
      }

      /* The Burning Core */
      .magma-core {
        position: absolute;
        inset: -8px;
        background: radial-gradient(circle at center, #ffaa00 0%, #ff3300 40%, #1a0000 100%);
        opacity: 0;
        transform: scale(0.95);
        z-index: 2;
        filter: blur(10px);
      }

      /* The Heavy Stone Plates */
      .obsidian-plate {
        position: absolute;
        left: -2px; right: -2px;
        height: 52%;
        background: #0a0505;
        z-index: 3;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E");
      }

      .top-plate {
        top: -1px;
        border-bottom: 2px solid #330a0a;
        border-radius: 4px 4px 0 0;
      }

      .bottom-plate {
        bottom: -1px;
        border-top: 2px solid #330a0a;
        border-radius: 0 0 4px 4px;
      }

      /* Tectonic Shockwave */
      .tectonic-ripple {
        position: absolute;
        width: 10px; height: 10px;
        border-radius: 50%;
        background: #ffffff;
        pointer-events: none;
        transform: translate(-50%, -50%) scale(0);
        z-index: 15;
        mix-blend-mode: overlay;
        opacity: 0;
      }

      /* Dynamic Embers */
      .tome-ember {
        position: absolute;
        width: 3px; height: 3px;
        background: #ffaa00;
        border-radius: 50%;
        box-shadow: 0 0 6px #ff3300;
        pointer-events: none;
        z-index: 5;
      }

      /* Text Display - Sits on top of the container */
      .tome-text {
        position: relative;
        z-index: 100; /* In front of container, behind hitbox */
        font-family: var(--font-display, 'Cinzel', serif); 
        font-size: 1.15rem;
        font-weight: 700;
        letter-spacing: 4px;
        color: #ffddcc; 
        text-transform: uppercase;
        pointer-events: none; 
        transform: translateZ(40px); 
        transition: color 0.3s ease, text-shadow 0.3s ease;
      }

      .volcanic-tome-btn.is-hovered .tome-text {
        color: #ffffff;
        text-shadow: 0 0 15px #ff3300, 0 0 30px #ffaa00;
      }
    `;
    document.head.appendChild(style);
  }

  _buildDOM() {
    this.el.classList.add('volcanic-tome-btn');
    
    // Wipe existing content and inject the rigid structure
    this.el.innerHTML = `
      <div class="tome-hitbox"></div>
      <div class="tome-container">
        <div class="magma-core"></div>
        <div class="obsidian-plate top-plate"></div>
        <div class="obsidian-plate bottom-plate"></div>
        <div class="tectonic-ripple"></div>
      </div>
      <span class="tome-text">${this.config.text}</span>
    `;

    this.hitbox = this.el.querySelector('.tome-hitbox');
    this.tomeContainer = this.el.querySelector('.tome-container');
    this.topPlate = this.el.querySelector('.top-plate');
    this.bottomPlate = this.el.querySelector('.bottom-plate');
    this.magmaCore = this.el.querySelector('.magma-core');
    this.ripple = this.el.querySelector('.tectonic-ripple');
    this.textNode = this.el.querySelector('.tome-text');
  }

  _setupPhysics() {
    // Isolate physics to inner elements to prevent conflict with external entrance animations
    this.tiltX = gsap.quickTo(this.tomeContainer, "rotationX", { duration: 0.6, ease: "power3.out" });
    this.tiltY = gsap.quickTo(this.tomeContainer, "rotationY", { duration: 0.6, ease: "power3.out" });
    
    this.moveXContainer = gsap.quickTo(this.tomeContainer, "x", { duration: 0.6, ease: "power3.out" });
    this.moveYContainer = gsap.quickTo(this.tomeContainer, "y", { duration: 0.6, ease: "power3.out" });
    
    this.moveXText = gsap.quickTo(this.textNode, "x", { duration: 0.6, ease: "power3.out" });
    this.moveYText = gsap.quickTo(this.textNode, "y", { duration: 0.6, ease: "power3.out" });
  }

  _calculateBounds() {
    this.bounds = this.el.getBoundingClientRect();
  }

  _bindEvents() {
    if (!this.isReducedMotion) {
      // Bind exclusively to the invisible hitbox shield
      this.hitbox.addEventListener('mousemove', this._onMouseMove, { passive: true });
      this.hitbox.addEventListener('mouseenter', this._onMouseEnter, { passive: true });
      this.hitbox.addEventListener('mouseleave', this._onMouseLeave, { passive: true });
    }
    
    this.hitbox.addEventListener('click', this._onClick);
    this.el.addEventListener('keydown', this._onKeyDown);
  }

  _spawnEmbers() {
    if (this.isReducedMotion || !this.tomeContainer) return;
    
    for (let i = 0; i < 10; i++) {
      const ember = document.createElement('div');
      ember.className = 'tome-ember';
      this.tomeContainer.appendChild(ember);

      const startX = (this.bounds.width / 2) + (Math.random() * 80 - 40);
      
      gsap.fromTo(ember, 
        { x: startX, y: this.bounds.height / 2, opacity: 1, scale: Math.random() * 1.5 },
        {
          x: startX + (Math.random() * 120 - 60),
          y: -30 - (Math.random() * 50),
          opacity: 0,
          duration: 0.8 + Math.random(),
          ease: "power2.out",
          onComplete: () => ember.remove()
        }
      );
    }
  }

  _onMouseEnter() {
    if (this.bounds.width === 0) this._calculateBounds();
    this.el.classList.add('is-hovered');

    // Tectonic Plate Split
    gsap.to(this.topPlate, { y: '-12%', duration: 0.6, ease: "back.out(1.5)" });
    gsap.to(this.bottomPlate, { y: '12%', duration: 0.6, ease: "back.out(1.5)" });
    
    // Core Ignition
    gsap.to(this.magmaCore, { opacity: 1, scale: 1.1, duration: 0.5, ease: "power2.out" });
    
    this._spawnEmbers();
  }

  _onMouseMove(e) {
    if (this.bounds.width === 0) return;

    const mouseX = e.clientX - this.bounds.left;
    const mouseY = e.clientY - this.bounds.top;
    
    const xPct = (mouseX / this.bounds.width) - 0.5;
    const yPct = (mouseY / this.bounds.height) - 0.5;

    const magX = xPct * (this.bounds.width * this.config.magneticStrength);
    const magY = yPct * (this.bounds.height * this.config.magneticStrength);
    
    this.moveXContainer(magX);
    this.moveYContainer(magY);
    
    // Deep parallax for text
    this.moveXText(magX * 1.5); 
    this.moveYText(magY * 1.5);

    this.tiltX(-yPct * this.config.tiltMaxDeg);
    this.tiltY(xPct * this.config.tiltMaxDeg);
  }

  _onMouseLeave() {
    this.el.classList.remove('is-hovered');

    this.tiltX(0);
    this.tiltY(0);
    this.moveXContainer(0);
    this.moveYContainer(0);
    this.moveXText(0);
    this.moveYText(0);

    // Stone closure
    gsap.to([this.topPlate, this.bottomPlate], { y: '0%', duration: 0.7, ease: "elastic.out(1, 0.6)" });
    gsap.to(this.magmaCore, { opacity: 0, scale: 0.95, duration: 0.5 });
  }

  _onClick(e) {
    if (this.isReducedMotion) return;

    // Physical slam effect
    gsap.timeline()
      .to(this.tomeContainer, { scale: 0.90, duration: 0.05, ease: "power3.in" })
      .to(this.tomeContainer, { scale: 1, duration: 0.8, ease: "elastic.out(1, 0.3)" });

    // Intense Detonation Shockwave
    const clickX = e.clientX ? e.clientX - this.bounds.left : this.bounds.width / 2;
    const clickY = e.clientY ? e.clientY - this.bounds.top : this.bounds.height / 2;

    if (this.ripple) {
      gsap.fromTo(this.ripple, 
        { x: clickX, y: clickY, scale: 0, opacity: 1 },
        { scale: 5, opacity: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }

  _onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.hitbox.click(); 
    }
  }

  dispose() {
    if (!this.el) return;
    
    this.hitbox.removeEventListener('mousemove', this._onMouseMove);
    this.hitbox.removeEventListener('mouseenter', this._onMouseEnter);
    this.hitbox.removeEventListener('mouseleave', this._onMouseLeave);
    this.hitbox.removeEventListener('click', this._onClick);
    this.el.removeEventListener('keydown', this._onKeyDown);
    
    gsap.killTweensOf([this.tomeContainer, this.textNode, this.topPlate, this.bottomPlate, this.magmaCore, this.ripple]);
  }
}