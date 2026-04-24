import gsap from 'gsap';
import * as THREE from 'three';
import { a11yManager } from '../utils/accessibility.js';
import { NameCard } from '../ui/NameCard.js';
import { VolcanicTomeButton } from '../ui/VolcanicTomeButton.js';

/**
 * Industry-Grade Intro Section Controller v16.0 (CATACLYSM SYNERGY)
 * * Architectural Upgrades:
 * - Fluid Mobile Typography: Re-engineered the Name scaling using deep clamp() limits to prevent awkward word-wrapping on narrow mobile screens.
 * - Particle Assembly Reveal: Replaced the staggered blade slice with a simultaneous, randomized coordinate gathering effect for the name.
 * - GSAP Warning Resolved: Purged explicit webkit-prefixes from animations to let GSAP's CSS plugin handle it cleanly without throwing errors.
 */
export class IntroSection {
  constructor(container, profileData, appSystems) {
    this.container = container;
    this.data = profileData || {};
    
    this.dragon = appSystems.dragon;
    this.camera = appSystems.camera;
    
    this.lightning = appSystems.lightning;
    this.flames = appSystems.flames;
    this.sceneManager = appSystems.sceneManager; 

    this.state = {
      isTransitioning: false
    };

    this.isReducedMotion = a11yManager?.shouldReduceMotion() || false;
    this.nameCard = null;
    this.volcanicBtn = null;

    this._handleClick = this._handleClick.bind(this);
  }

  init() {
    document.body.style.overflow = 'hidden';
    
    this._injectStyles();
    this._buildDOM();
    this._mountComponents();
    this._setupAnimations();
    this._bindEvents();
  }

  _injectStyles() {
    if (document.getElementById('intro-section-styles')) return;

    const style = document.createElement('style');
    style.id = 'intro-section-styles';
    style.innerHTML = `
      .hero-layout {
        display: flex; gap: 4rem; align-items: center; width: 100%; max-width: 1200px;
      }

      .hero-avatar-wrapper {
        position: relative; width: 250px; height: 250px; flex-shrink: 0;
        opacity: 0; transform: scale(0.8) translateZ(-50px); filter: blur(10px);
      }

      .avatar-orbital-trace {
        position: absolute; inset: -6px; border-radius: 50%;
        background: conic-gradient(from 0deg, transparent 0%, rgba(0,255,255,0.8) 25%, transparent 50%, rgba(255,51,0,0.8) 75%, transparent 100%);
        animation: spin 6s linear infinite;
        box-shadow: 0 0 40px rgba(0, 255, 255, 0.2), inset 0 0 20px rgba(255, 51, 0, 0.2);
        z-index: 1;
      }

      .avatar-core {
        position: absolute; inset: 0; border-radius: 50%; overflow: hidden;
        border: 4px solid #050202; background: #000; z-index: 2; box-shadow: 0 15px 35px rgba(0,0,0,0.8);
      }

      .avatar-core img {
        width: 100%; height: 100%; object-fit: cover; filter: contrast(1.15) grayscale(0.1); transition: filter 0.4s ease;
      }
      .hero-avatar-wrapper:hover .avatar-core img { filter: contrast(1.1) grayscale(0); }

      @keyframes spin { 100% { transform: rotate(360deg); } }

      .name-card-wrapper .magma-orb {
        mix-blend-mode: screen; 
        filter: url(#liquid-magma) blur(6px) brightness(1.3) !important;
        opacity: 0.85;
      }

      .arch-chip {
        padding: 0.6rem 1.2rem; background: rgba(255, 51, 0, 0.05); border: 1px solid rgba(255, 51, 0, 0.2); 
        border-radius: 4px; color: #fff; font-family: var(--font-mono, monospace); font-size: 0.85rem; letter-spacing: 2px;
        backdrop-filter: blur(4px); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(255, 51, 0, 0.1);
        opacity: 0; transform: translateY(20px); text-transform: uppercase;
      }

      .resume-orb-btn {
        display: flex; align-items: center; justify-content: center;
        width: 64px; height: 64px; border-radius: 50%;
        background: rgba(10, 5, 5, 0.6);
        border: 1px solid rgba(255, 51, 0, 0.3);
        color: #ffaa00; text-decoration: none;
        box-shadow: 0 0 20px rgba(0,0,0,0.8), inset 0 0 10px rgba(255, 51, 0, 0.2);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        opacity: 0; transform: scale(0.5); 
        flex-shrink: 0;
      }

      .resume-orb-btn svg { width: 28px; height: 28px; transition: transform 0.3s ease; filter: drop-shadow(0 0 4px rgba(255,170,0,0.6)); }

      .resume-orb-btn:hover {
        background: rgba(255, 51, 0, 0.15);
        border-color: #ff3300; color: #fff;
        box-shadow: 0 0 25px rgba(255, 51, 0, 0.4), inset 0 0 15px rgba(255, 170, 0, 0.3);
        transform: scale(1.1) !important;
      }
      .resume-orb-btn:hover svg { transform: translateY(-2px); filter: drop-shadow(0 0 8px #fff); }

      @keyframes floatAnim0 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
      @keyframes floatAnim1 { 0%, 100% { transform: translateY(-4px); } 50% { transform: translateY(6px); } }
      @keyframes floatAnim2 { 0%, 100% { transform: translateY(3px); } 50% { transform: translateY(-5px); } }
      
      .float-anim-0 { animation: floatAnim0 4s ease-in-out infinite; }
      .float-anim-1 { animation: floatAnim1 5s ease-in-out infinite; }
      .float-anim-2 { animation: floatAnim2 4.5s ease-in-out infinite; }

      @media (max-width: 900px) {
        .hero-layout { flex-direction: column; align-items: center; text-align: center; gap: 2rem; }
        .hero-avatar-wrapper { width: 180px; height: 180px; }
        .hero-card-row { flex-direction: column; }
      }
    `;
    document.head.appendChild(style);
  }

  _buildDOM() {
    const name = this.data.name || "Priyanshu Roy";
    const nickname = this.data.nickname || "The OG Dev";
    const title = this.data.title || "AI & ML Security Architect";
    const taglineStr = this.data.tagline || "Zero-Leakage Edge Architectures | Threat Intelligence | Cyber-Forensic ML";
    const avatar = this.data.photo_url || "/assets/images/profile-core.webp";
    const resumeUrl = this.data.resume_url || "#";

    const chipsHTML = taglineStr.split('|').map((tech, i) => `
      <div class="arch-chip float-anim-${i % 3}">
        <span style="color: var(--color-cyan, #00ffff); margin-right: 6px;">◈</span> ${tech.trim()}
      </div>
    `).join('');

    const nameSpans = name.split('').map(char => 
      char === ' ' ? '&nbsp;' : `<span class="intro-name-char" style="display:inline-block; will-change: transform, opacity, color, filter;">${char}</span>`
    ).join('');

    const resumeSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="12" y2="18"></line><line x1="15" y1="15" x2="12" y2="18"></line></svg>`;

    // ⚡ FIX: Dropped clamp minimum to 1.5rem and made letter-spacing fluid to prevent word break on mobile
    this.container.innerHTML = `
      <div class="hero-persistent-wrapper container" style="position: relative; z-index: 10; min-height: 100vh; display: flex; align-items: center; justify-content: flex-start; padding-top: 10vh; padding-left: 5vw;">
        <div class="hero-layout">
          
          <div class="hero-avatar-wrapper">
            <div class="avatar-orbital-trace"></div>
            <div class="avatar-core"><img src="${avatar}" alt="${name}" /></div>
          </div>

          <div class="hero-info" style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 1.5rem;">
            
            <div class="hero-card-row" style="display: flex; align-items: center; gap: 1.5rem;">
              <div id="sovereign-name-card-mount" style="flex: 1;"></div>
              
              <a href="${resumeUrl}" target="_blank" rel="noopener noreferrer" class="resume-orb-btn" aria-label="Download Resume">
                ${resumeSVG}
              </a>
            </div>

            <div class="hero-chips" style="display: flex; gap: 1rem; flex-wrap: wrap;">${chipsHTML}</div>
          </div>

        </div>
      </div>

      <div class="intro-cinematic-overlay" style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 100; background: rgba(2, 3, 5, 0.85); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); transition: background 0.1s ease-out; pointer-events: auto;">
        <div class="intro-content" style="position: relative; z-index: 2; perspective: 1200px; text-align: center; display: flex; flex-direction: column; align-items: center; width: 100%; padding: 0 1rem;">
          
          <div class="intro-nickname" style="font-family: var(--font-mono); color: #ff3300; letter-spacing: 4px; font-size: 0.9rem; margin-bottom: 1rem; opacity: 0; transform: translateY(-20px);">
            ${nickname.toUpperCase()}
          </div>

          <h1 class="intro-dragon-name" aria-label="${name}" style="font-family: var(--font-display); font-size: clamp(1.5rem, 8vw, 6rem); color: #ffffff; text-shadow: 0 0 40px rgba(255, 51, 0, 0.3); margin-bottom: 0.5rem; letter-spacing: clamp(2px, 2vw, 8px); display: flex; justify-content: center; flex-wrap: wrap;">
            ${nameSpans}
          </h1>
          
          <h3 class="intro-dragon-title" style="font-family: var(--font-heading); font-size: clamp(1rem, 2vw, 1.5rem); color: var(--color-cyan, #00ffff); letter-spacing: 6px; opacity: 0; transform: translateY(20px); margin-bottom: 1rem;">
            ${title}
          </h3>

          <p class="intro-tagline" style="font-family: var(--font-mono); font-size: 0.85rem; color: #8899aa; letter-spacing: 2px; max-width: 600px; opacity: 0; margin-bottom: 3.5rem;">
            ${taglineStr}
          </p>
          
          <div class="enter-btn-target" style="opacity: 0; transform: scale(0.8); cursor: pointer;">
            <button class="intro-ignite-btn"></button>
          </div>

        </div>
      </div>
    `;

    this.overlay = this.container.querySelector('.intro-cinematic-overlay');
    this.introNickname = this.container.querySelector('.intro-nickname');
    this.nameChars = this.container.querySelectorAll('.intro-name-char');
    this.introTitle = this.container.querySelector('.intro-dragon-title');
    this.introTagline = this.container.querySelector('.intro-tagline');
    
    this.btnTarget = this.container.querySelector('.enter-btn-target');
    this.igniteBtn = this.container.querySelector('.intro-ignite-btn');
    
    this.avatarProfile = this.container.querySelector('.hero-avatar-wrapper');
    this.resumeBtn = this.container.querySelector('.resume-orb-btn');
    this.archChips = this.container.querySelectorAll('.arch-chip');

    this.nameCard = new NameCard(this.container.querySelector('#sovereign-name-card-mount'), name, title);
  }

  _mountComponents() {
    this.volcanicBtn = new VolcanicTomeButton(this.igniteBtn, {
      text: 'LAUNCH',
      magneticStrength: 0.4
    });
  }

  _setupAnimations() {
    if (this.isReducedMotion) {
      gsap.set([this.introNickname, this.nameChars, this.introTitle, this.introTagline, this.btnTarget], { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 });
      return;
    }

    const tl = gsap.timeline({ delay: 0.2 });

    tl.to(this.introNickname, { opacity: 1, y: 0, duration: 1.0, ease: "power3.out" });

    // ⚡ FIX: Particles Gathering Effect
    // Start completely scattered and blurred
    tl.fromTo(this.nameChars, 
      { 
        opacity: 0,
        x: () => (Math.random() - 0.5) * 500,
        y: () => (Math.random() - 0.5) * 500,
        z: () => (Math.random() - 0.5) * 500,
        rotationX: () => (Math.random() - 0.5) * 180,
        rotationY: () => (Math.random() - 0.5) * 180,
        rotationZ: () => (Math.random() - 0.5) * 180,
        scale: () => Math.random() * 2,
        filter: 'blur(20px)',
        color: '#dc143c'
      },
      { 
        opacity: 1,
        x: 0, y: 0, z: 0,
        rotationX: 0, rotationY: 0, rotationZ: 0,
        scale: 1,
        filter: 'blur(0px)',
        color: '#ffffff',
        textShadow: '0 0 20px rgba(255, 10, 43, 0.4)',
        duration: 2.5,
        ease: "expo.out",
        stagger: 0 // Simultaneous gathering
      }, "-=0.5"
    );

    tl.to(this.introTitle, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }, "-=1.0");
    tl.to(this.introTagline, { opacity: 1, duration: 1.0, ease: "none" }, "-=0.8");

    tl.to(this.btnTarget, { opacity: 1, scale: 1, duration: 1.5, ease: "elastic.out(1, 0.6)" }, "-=0.5");
  }

  _bindEvents() {
    this.btnTarget.addEventListener('click', this._handleClick);
    
    this.btnTarget.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._handleClick();
      }
    });
  }

  _handleClick() {
    if (this.state.isTransitioning) return;
    this.state.isTransitioning = true;

    gsap.to(this.btnTarget, { scale: 1.1, filter: 'brightness(2)', duration: 0.2, yoyo: true, repeat: 1 });
    
    setTimeout(() => {
      gsap.set(this.overlay, { background: 'rgba(255, 255, 255, 0.9)' });

      if (!this.isReducedMotion && this.camera) this.camera.triggerShake(3.0, 0.8);

      if (this.lightning) {
        this.lightning.stormIntensity = 1.5; 
        this.lightning.triggerBurst(); 
      }
      if (this.flames) {
        this.flames.lavaIntensity = 1.0;
      }
      if (this.sceneManager?.lightingSetup) {
        this.sceneManager.lightingSetup.setState('flying'); 
      }

      gsap.to([this.introNickname, this.nameChars, this.introTitle, this.introTagline, this.btnTarget], {
        opacity: 0, z: 600, rotationZ: () => (Math.random() - 0.5) * 45, rotationX: () => (Math.random() - 0.5) * 60,
        scale: 2.5, filter: 'blur(30px)', duration: 0.7, stagger: 0.01, ease: "expo.in"
      });

      setTimeout(() => {
        if (this.dragon) this.dragon.setState('roaring');
      }, 100); 

      // ⚡ FIX: Purged webkitBackdropFilter to resolve the GSAP warning spam
      gsap.to(this.overlay, {
        backdropFilter: 'blur(0px)', background: 'rgba(5, 7, 10, 0.0)',
        duration: 1.5, delay: 0.2, ease: "power3.out",
        onComplete: () => {
          this.overlay.style.display = 'none'; 
          document.body.style.overflow = '';
          
          if (this.dragon) this.dragon.setState('flying');

          if (this.nameCard) {
            this.nameCard.build(); 
            setTimeout(() => this.nameCard.open(), 200); 
          }
          
          const syncDelay = this.isReducedMotion ? 0 : 0.8;

          gsap.to(this.avatarProfile, { 
            opacity: 1, scale: 1, z: 0, filter: 'blur(0px)', 
            duration: 1.2, delay: syncDelay, ease: "back.out(1.2)" 
          });
          
          gsap.to(this.resumeBtn, {
            opacity: 1, scale: 1, duration: 1.0, delay: syncDelay + 0.3, ease: "elastic.out(1, 0.5)"
          });

          gsap.to(this.archChips, {
            opacity: 1, y: 0, duration: 0.8, stagger: 0.1, 
            delay: syncDelay + 0.4, ease: "back.out(1.2, 0.5)"
          });
        }
      });
    }, 400); 
  }

  dispose() {
    this.btnTarget?.removeEventListener('click', this._handleClick);
    if (this.volcanicBtn) this.volcanicBtn.dispose();
    if (this.nameCard) this.nameCard.dispose();
    gsap.killTweensOf([this.introNickname, this.nameChars, this.introTitle, this.introTagline, this.btnTarget, this.overlay, this.avatarProfile, this.resumeBtn, this.archChips]);
    this.container.innerHTML = '';
  }
}