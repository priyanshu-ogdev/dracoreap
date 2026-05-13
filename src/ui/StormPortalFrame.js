import gsap from 'gsap';
import { a11yManager } from '../utils/accessibility.js';

/**
 * Industry-Grade Storm Portal Frame v6.0 (OBSIDIAN SHATTER)
 * Engineered for the Obsidian Tempest UI layer.
 * * Architectural Upgrades:
 * - Structural Guarantee: CSS is internalized and strictly enforces an `aspect-ratio: 16/9` bounding box so the layout never collapses.
 * - Ancient Storm Aesthetic: Iframe is trapped in grayscale/blur until the seal is breached.
 * - Reactive Fractures: Procedural SVG shatter overlay integrated with mouse-tracking cyan light.
 * - Memory-Safe Protocol: Cached binds and strict GC cleanup.
 */
export class StormPortalFrame {
  constructor(element, options = {}) {
    this.container = element;
    this.config = {
      project: options.project || {},
      enableLazyLoad: options.enableLazyLoad ?? true,
      fallbackOnMobile: options.fallbackOnMobile ?? true,
      ...options
    };
    
    this.isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad/i.test(navigator.userAgent);
    this.isActive = false; 
    this.observer = null;
    this.bounds = { width: 0, height: 0, left: 0, top: 0 };

    // Cache bound methods to prevent memory leaks
    this._onIframeLoad = this._onIframeLoad.bind(this);
    this._enableInteraction = this._enableInteraction.bind(this);
    this._disableInteraction = this._disableInteraction.bind(this);
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseEnter = this._onMouseEnter.bind(this);

    this.init();
  }

  init() {
    this._injectStyles();
    this.container.classList.add('storm-portal-container');
    
    if (this.config.fallbackOnMobile && this.isMobile) {
      this._renderFallback();
      return;
    }

    if (this.config.enableLazyLoad) {
      this._setupLazyLoad();
    } else {
      this._buildDOM();
    }
  }

  _injectStyles() {
    if (document.getElementById('storm-portal-styles')) return;
    const style = document.createElement('style');
    style.id = 'storm-portal-styles';
    style.innerHTML = `
      .storm-portal-container {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9; /* Enforces strict layout geometry */
        border-radius: 8px;
        background-color: #010103;
        overflow: hidden;
        border: 1px solid rgba(0, 255, 255, 0.1);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
      }
      
      .storm-iframe-wrapper {
        position: absolute; inset: 0; z-index: 1;
        filter: grayscale(1) contrast(1.2) blur(3px);
        transition: filter 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        opacity: 0; /* Controlled by GSAP */
      }
      
      .storm-portal-container.is-breached .storm-iframe-wrapper {
        filter: grayscale(0) contrast(1) blur(0px);
      }
      
      .storm-iframe-wrapper iframe {
        width: 100%; height: 100%; border: none; pointer-events: none; background: #fff;
      }
      
      .storm-portal-container.is-breached .storm-iframe-wrapper iframe {
        pointer-events: auto;
      }

      .storm-magical-border {
        position: absolute; inset: 0; z-index: 2; pointer-events: none; opacity: 0.6;
        background: radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0, 255, 255, 0.15), transparent 50%);
        transition: opacity 0.5s ease;
      }
      
      .storm-portal-container.is-breached .storm-magical-border {
        opacity: 1; background: transparent;
        box-shadow: inset 0 0 20px rgba(0, 255, 255, 0.1);
        border: 1px solid rgba(0, 255, 255, 0.3);
      }

      .storm-shatter-overlay {
        position: absolute; inset: 0; z-index: 10;
        background: rgba(5, 7, 10, 0.7);
        display: flex; align-items: center; justify-content: center; flex-direction: column;
        opacity: 0; /* Controlled by GSAP */
      }
      
      .storm-crack-svg {
        position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;
        mask-image: radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black 20%, transparent 70%);
        -webkit-mask-image: radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black 20%, transparent 70%);
      }
      
      .storm-crack-line {
        fill: none; stroke: rgba(0, 255, 255, 0.6); stroke-width: 1px; filter: drop-shadow(0 0 4px #00ffff);
      }

      .storm-action-core {
        position: relative; z-index: 11; display: flex; flex-direction: column; align-items: center; gap: 1rem;
      }

      .storm-btn {
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(0, 255, 255, 0.5);
        color: #00ffff; padding: 0.8rem 2rem; font-family: var(--font-mono, monospace); font-size: 0.9rem; letter-spacing: 2px;
        cursor: pointer; backdrop-filter: blur(4px); transition: all 0.3s ease; text-transform: uppercase;
      }
      
      .storm-btn:hover {
        background: rgba(0, 255, 255, 0.15); color: #fff; box-shadow: 0 0 15px rgba(0, 255, 255, 0.6); border-color: #fff;
      }

      .storm-link {
        color: rgba(255, 255, 255, 0.6); font-family: var(--font-body, sans-serif); font-size: 0.85rem; text-decoration: none;
        border-bottom: 1px solid transparent; transition: color 0.3s ease, border-color 0.3s ease;
      }
      
      .storm-link:hover { color: #fff; border-bottom-color: #fff; }

      .storm-loader {
        position: absolute; inset: 0; z-index: 5; display: flex; align-items: center; justify-content: center;
        font-family: var(--font-mono, monospace); color: #00ffff; font-size: 0.85rem; letter-spacing: 3px;
      }
      .storm-loader .blink { animation: blink 1s step-end infinite; }
      @keyframes blink { 50% { opacity: 0; } }
    `;
    document.head.appendChild(style);
  }

  _setupLazyLoad() {
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this._buildDOM();
        this.observer.disconnect();
      }
    }, { rootMargin: '400px 0px' });
    
    this.observer.observe(this.container);
  }

  _buildDOM() {
    const { project } = this.config;
    const previewUrl = project.preview_url;
    
    if (!previewUrl) {
      this._renderFallback();
      return;
    }

    this.container.innerHTML = `
      <div class="storm-magical-border"></div>
      
      <div class="storm-iframe-wrapper">
        <iframe title="${project.title} Live Environment" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" loading="lazy"></iframe>
      </div>
      
      <div class="storm-loader">[ SUMMONING FRAGMENT... ]<span class="blink">|</span></div>
      
      <div class="storm-shatter-overlay">
        <svg class="storm-crack-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline points="0,30 20,40 40,20 100,10" class="storm-crack-line" />
          <polyline points="20,40 15,70 0,90" class="storm-crack-line" />
          <polyline points="15,70 50,60 80,80 100,75" class="storm-crack-line" />
          <polyline points="40,20 60,50 50,60" class="storm-crack-line" />
        </svg>
        <div class="storm-action-core">
          <button class="storm-btn">[ SHATTER VEIL ]</button>
          <a href="${project.preview_url}" target="_blank" rel="noopener noreferrer" class="storm-link">Traverse ↗</a>
        </div>
      </div>
    `;

    this.iframeWrapper = this.container.querySelector('.storm-iframe-wrapper');
    this.iframe = this.container.querySelector('iframe');
    this.loader = this.container.querySelector('.storm-loader');
    this.overlay = this.container.querySelector('.storm-shatter-overlay');

    this.iframe.addEventListener('load', this._onIframeLoad);
    
    const interactBtn = this.overlay.querySelector('.storm-btn');
    interactBtn.addEventListener('click', this._enableInteraction);
    
    this.container.addEventListener('mouseenter', this._onMouseEnter, { passive: true });
    this.container.addEventListener('mousemove', this._onMouseMove, { passive: true });
    window.addEventListener('resize', () => this.bounds = this.container.getBoundingClientRect(), { passive: true });
    
    this.iframe.src = previewUrl;
  }

  _onMouseEnter() {
    this.bounds = this.container.getBoundingClientRect();
  }

  _onMouseMove(e) {
    if (this.isActive || this.bounds.width === 0) return; 
    const mouseX = e.clientX - this.bounds.left;
    const mouseY = e.clientY - this.bounds.top;
    this.container.style.setProperty('--mouse-x', `${mouseX}px`);
    this.container.style.setProperty('--mouse-y', `${mouseY}px`);
  }

  _onIframeLoad() {
    const tl = gsap.timeline();
    
    tl.to(this.loader, { opacity: 0, duration: 0.2, onComplete: () => this.loader.remove() });
    
    // Lightning Strike Entrance
    tl.set(this.iframeWrapper, { opacity: 1 })
      .to(this.iframeWrapper, { opacity: 0.1, duration: 0.05, ease: "none" })
      .to(this.iframeWrapper, { opacity: 0.9, duration: 0.05, ease: "none" })
      .to(this.iframeWrapper, { opacity: 0.2, duration: 0.05, ease: "none" })
      .to(this.iframeWrapper, { opacity: 1.0, duration: 0.1, ease: "power2.out" });
      
    tl.to(this.overlay, { opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.1");
  }

  _enableInteraction() {
    if (this.isActive) return;
    this.isActive = true;

    this.container.classList.add('is-breached');

    gsap.to(this.overlay, {
      opacity: 0,
      scale: 1.05,
      duration: 0.5,
      ease: 'power3.in',
      onComplete: () => {
        this.overlay.style.pointerEvents = 'none';
      }
    });

    document.addEventListener('click', this._handleOutsideClick);
    document.addEventListener('keydown', this._handleKeyDown);
  }

  _disableInteraction() {
    if (!this.isActive) return;
    this.isActive = false;

    this.container.classList.remove('is-breached');
    this.overlay.style.pointerEvents = 'auto';
    
    gsap.to(this.overlay, {
      opacity: 1,
      scale: 1.0,
      duration: 0.5,
      ease: 'power2.out'
    });

    document.removeEventListener('click', this._handleOutsideClick);
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  _handleOutsideClick(e) {
    if (this.isActive && !this.container.contains(e.target)) {
      this._disableInteraction();
    }
  }

  _handleKeyDown(e) {
    if (this.isActive && e.key === 'Escape') {
      this._disableInteraction();
    }
  }

  _renderFallback() {
    const { project } = this.config;
    const thumb = project.thumbnail_url || '/assets/images/placeholder.webp';
    
    this.container.innerHTML = `
      <div style="position: relative; width: 100%; height: 100%; border-radius: 8px; overflow: hidden; filter: grayscale(1);">
        <img src="${thumb}" alt="${project.title} Preview" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.5;">
        <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(5,7,10,0.6);">
          <a href="${project.preview_url}" target="_blank" rel="noopener noreferrer" class="storm-btn" style="text-decoration: none;">
            [ TRAVERSE ↗ ]
          </a>
        </div>
      </div>
    `;
  }

  dispose() {
    this.observer?.disconnect();
    document.removeEventListener('click', this._handleOutsideClick);
    document.removeEventListener('keydown', this._handleKeyDown);
    if (this.iframe) this.iframe.removeEventListener('load', this._onIframeLoad);
    this.container.removeEventListener('mouseenter', this._onMouseEnter);
    this.container.removeEventListener('mousemove', this._onMouseMove);
    
    gsap.killTweensOf([this.overlay, this.loader, this.iframeWrapper]);
    this.container.innerHTML = '';
  }
}