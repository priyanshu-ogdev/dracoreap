import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { SocialEmblems } from '../ui/SocialEmblems.js';
import { a11yManager } from '../utils/accessibility.js';

gsap.registerPlugin(ScrollTrigger);

export class ContactSection {
  constructor(container, data, appSystems = {}) {
    this.container = container;
    this.profileData = data.profile || {};
    
    this.dragon = appSystems.dragon || null;
    this.camera = appSystems.camera || null;
    this.lightning = appSystems.lightning || null;
    this.flames = appSystems.flames || null;

    this.components = { emblems: [] };
    this.scrollTrigger = null;
    this._eventListeners = []; 
    this.isReducedMotion = a11yManager?.shouldReduceMotion() || false;
  }

  init() {
    this._injectVaultStyles();
    this._buildDOM();
    this._mountComponents();
    this._bindTiltPhysics();
    this._setupAnimations();
    this._bindVFXEvents();
  }

  _injectVaultStyles() {
    if (document.getElementById('contact-vault-styles')) return;

    const style = document.createElement('style');
    style.id = 'contact-vault-styles';
    style.innerHTML = `
      .contact-vault-monolith {
        position: relative;
        background: linear-gradient(170deg, #0a0e14 0%, #05070a 50%, #020305 100%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 8px;
        z-index: 1;
        transition: box-shadow 0.4s ease, border-color 0.4s ease;
        box-shadow: 0 30px 60px rgba(0,0,0,0.9), inset 0 0 40px rgba(0,0,0,0.8);
        border: 1px solid rgba(0, 255, 255, 0.05);
        /* ⚡ FIX: Scaled down horizontal padding for mobile */
        padding: clamp(2rem, 6vw, 6rem) clamp(1rem, 4vw, 6rem);
        width: 100%;
        max-width: 850px;
        margin: 0 auto;
        box-sizing: border-box;
      }
      
      .contact-vault-monolith::before {
        content: ''; position: absolute; inset: 0; opacity: 0.15; border-radius: inherit; pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        z-index: -1;
      }

      .contact-vault-monolith:hover {
        border-color: rgba(0, 255, 255, 0.3);
        box-shadow: 0 40px 80px rgba(0,0,0,0.95), inset 0 0 60px rgba(0, 255, 255, 0.05);
      }

      .vault-edge-glow {
        position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 0.4s ease; border-radius: inherit;
        background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0, 255, 255, 0.1), transparent 40%); z-index: 0;
      }
      .contact-vault-monolith:hover .vault-edge-glow { opacity: 1; }

      .contact-title {
        font-family: var(--font-display, serif); 
        /* ⚡ FIX: Dropped min font-size and made letter spacing fluid so it wraps cleanly */
        font-size: clamp(1.5rem, 6vw, 3.5rem); 
        color: #ffffff; 
        margin: 0; 
        letter-spacing: clamp(2px, 1.5vw, 6px);
        line-height: 1.2;
        text-shadow: 0 0 40px rgba(0, 255, 255, 0.4), 0 0 10px rgba(0, 170, 255, 0.2);
        word-wrap: break-word;
      }
      .contact-subtitle { 
        color: #a0958a; 
        font-family: var(--font-mono, monospace); 
        text-transform: uppercase; 
        letter-spacing: clamp(1px, 1vw, 4px); 
        font-size: clamp(0.75rem, 2vw, 0.95rem); 
        margin-top: 1.5rem; 
      }
      .vault-divider { width: 100px; height: 2px; background: linear-gradient(90deg, transparent, #00ffff, transparent); margin: 2rem auto; box-shadow: 0 0 15px #00ffff; }

      .socials-target {
        display: flex; justify-content: center; flex-wrap: wrap; gap: 1rem; position: relative; z-index: 9999; min-height: 80px; pointer-events: auto;
      }
    `;
    document.head.appendChild(style);
  }

  _buildDOM() {
    this.container.className = 'viewport-section pointer-passthrough z-ui-base';
    const { name } = this.profileData;
    const currentYear = new Date().getFullYear();
    
    // ⚡ FIX: Added calc(var(--vh, 1vh) * 100) for mobile height
    this.container.innerHTML = `
      <div class="container" style="display: flex; flex-direction: column; align-items: center; text-align: center; min-height: calc(var(--vh, 1vh) * 100); justify-content: center; pointer-events: none; position: relative; perspective: 2000px; width: 100%;">
        
        <div class="contact-monolith-wrapper" style="pointer-events: auto; width: 100%; margin-bottom: 4rem;">
          <div class="contact-vault-monolith">
            <div class="vault-edge-glow"></div>
            
            <div class="contact-header" style="margin-bottom: clamp(2rem, 5vw, 4rem); position: relative; z-index: 2;">
              <h2 class="contact-title">CONNECT WITH THE ENGINEER</h2>
              <div class="vault-divider"></div>
              <p class="contact-subtitle">Ready to forge zero-leakage Edge architectures?</p>
            </div>

            <div class="socials-target"></div>
          </div>
        </div>

        <footer class="contact-footer" style="position: absolute; bottom: 2rem; width: 100%; text-align: center; pointer-events: auto; padding: 0 1rem;">
          <p style="font-family: var(--font-mono, monospace); font-size: clamp(0.65rem, 1.5vw, 0.8rem); color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 2px;">
            © ${currentYear} ${name || 'Priyanshu Roy'}. Engineered for Privacy-First Edge Computing.
          </p>
        </footer>
      </div>
    `;

    this.monolithWrapper = this.container.querySelector('.contact-monolith-wrapper');
    this.monolithCard = this.container.querySelector('.contact-vault-monolith');
    this.socialsTarget = this.container.querySelector('.socials-target');
    this.footer = this.container.querySelector('.contact-footer');
  }

  _bindTiltPhysics() {
    if (this.isReducedMotion || !this.monolithWrapper) return;

    const onMouseMove = (e) => {
      const rect = this.monolithWrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const tiltX = ((centerY - y) / centerY) * 3; 
      const tiltY = ((x - centerX) / centerX) * 3;

      gsap.to(this.monolithCard, { rotationX: tiltX, rotationY: tiltY, duration: 0.8, ease: "power2.out" });
      this.monolithCard.style.setProperty('--mouse-x', `${x}px`);
      this.monolithCard.style.setProperty('--mouse-y', `${y}px`);
    };

    const onMouseLeave = () => {
      gsap.to(this.monolithCard, { rotationX: 0, rotationY: 0, duration: 1.2, ease: "elastic.out(1, 0.4)" });
    };

    this.monolithWrapper.addEventListener('mousemove', onMouseMove);
    this.monolithWrapper.addEventListener('mouseleave', onMouseLeave);
    
    this._eventListeners.push(
      { el: this.monolithWrapper, type: 'mousemove', fn: onMouseMove },
      { el: this.monolithWrapper, type: 'mouseleave', fn: onMouseLeave }
    );
  }

_mountComponents() {
    const { socials, email } = this.profileData;
    const activeLinks = { ...socials };
    delete activeLinks.twitter; 
    
    // 1. Pass the raw email so SocialEmblems builds the envelope icon normally
    if (email) {
      activeLinks.email = email.replace('mailto:', '').trim(); 
    }

    const emblems = new SocialEmblems(this.socialsTarget, {
      links: activeLinks,
      magneticStrength: 0.3
    });
    this.components.emblems.push(emblems);

    // 2. ⚡ THE BYPASS: Intercept the DOM and force Gmail Web Compose
    if (email) {
      setTimeout(() => {
        // Find the anchor tag SocialEmblems just created that contains the mailto link
        const emailAnchor = this.socialsTarget.querySelector('a[href*="mailto:"]');
        
        if (emailAnchor) {
          const cleanEmail = email.replace('mailto:', '').trim();
          // Hijack the href to use Google's direct compose API
          emailAnchor.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${cleanEmail}`;
          // Force it to open safely in a brand new browser tab
          emailAnchor.target = '_blank';
          emailAnchor.rel = 'noopener noreferrer';
        }
      }, 50); // 50ms delay ensures the DOM is fully rendered before we hijack it
    }
  }
  
  _bindVFXEvents() {
    if (this.isReducedMotion) return;

    const onMouseOver = (e) => {
      if (e.target.closest('a') && this.lightning) {
        this.lightning.stormIntensity = 0.5;
        this.lightning.triggerBurst(null, 1);
      }
    };

    const onMouseDown = (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;
      
      if (this.dragon) this.dragon.setState('roaring');
      const dragonPos = this.dragon?.dragonPosition || new THREE.Vector3(0, 0, -2);
      
      if (this.lightning) { this.lightning.stormIntensity = 2.5; this.lightning.triggerBurst(dragonPos, 3); }
      if (this.flames) { this.flames.lavaIntensity = 1.0; this.flames.triggerBurst(300, dragonPos); }
      if (this.camera) { this.camera.triggerShake(3.0, 1.0); }

      setTimeout(() => {
        if (this.dragon) this.dragon.setState('idle');
        if (this.lightning) this.lightning.stormIntensity = 0.1;
        if (this.flames) this.flames.lavaIntensity = 0.1;
      }, 2000);
    };

    this.socialsTarget.addEventListener('mouseover', onMouseOver);
    this.socialsTarget.addEventListener('mousedown', onMouseDown);

    this._eventListeners.push(
      { el: this.socialsTarget, type: 'mouseover', fn: onMouseOver },
      { el: this.socialsTarget, type: 'mousedown', fn: onMouseDown }
    );
  }

  _setupAnimations() {
    if (this.isReducedMotion) {
      gsap.set([this.monolithCard, this.footer, this.socialsTarget], { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' });
      return;
    }

    gsap.set(this.monolithCard, { opacity: 0, y: 150, scale: 0.85, filter: 'blur(20px)', rotationX: 15 });
    gsap.set(this.footer, { opacity: 0 });
    gsap.set(this.socialsTarget, { opacity: 0, y: 30 });

    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.container,
      start: 'top 75%',
      onEnter: () => {
        const tl = gsap.timeline();
        tl.to(this.monolithCard, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', rotationX: 0, duration: 1.6, ease: "expo.out" })
          .to(this.socialsTarget, { opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.5)" }, "-=0.8")
          .to(this.footer, { opacity: 1, duration: 1.5, ease: "power2.inOut" }, "-=0.8");
      }
    });
  }

  dispose() {
    this._eventListeners.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));
    this._eventListeners = [];
    if (this.scrollTrigger) this.scrollTrigger.kill();
    gsap.killTweensOf([this.monolithCard, this.socialsTarget, this.footer]);
    this.components.emblems.forEach(c => c.dispose());
    this.container.innerHTML = '';
  }
}