import gsap from 'gsap';
import { a11yManager } from '../utils/accessibility.js';

/**
 * Industry-Grade Social Emblems Component v8.1 (OBSIDIAN DATALINKS)
 * * Architectural Upgrades:
 * - Removed `transform-style: preserve-3d` to guarantee browser hitboxes render correctly.
 * - Simplified Z-Indexing so the `<a>` tag cleanly registers all physical clicks.
 */
export class SocialEmblems {
  constructor(container, options = {}) {
    this.container = container;
    this.config = {
      links: options.links || {},
      magneticStrength: options.magneticStrength ?? 0.3,
      ...options
    };
    
    this.isReducedMotion = a11yManager?.shouldReduceMotion() || false;
    this.emblems = [];
    this.init();
  }

  init() {
    this._injectMagitechStyles();
    this._render();
    this._setupPhysics();
  }

  _injectMagitechStyles() {
    if (document.getElementById('magitech-emblem-styles')) return;
    const style = document.createElement('style');
    style.id = 'magitech-emblem-styles';
    style.innerHTML = `
      .social-emblem-list {
        display: flex; flex-wrap: wrap; gap: 3rem; list-style: none; padding: 0; margin: 0; justify-content: center; pointer-events: auto;
      }

      .magitech-shard {
        position: relative; display: flex; align-items: center; justify-content: center;
        width: 72px; height: 72px; text-decoration: none; outline: none;
        z-index: 100; cursor: pointer; pointer-events: auto !important; 
        /* STRIPPED: preserve-3d */
      }
      
      .shard-hitbox {
        position: absolute; inset: -5px; z-index: 999; cursor: pointer; background: transparent;
      }

      .shard-core {
        position: absolute; inset: 0; background: #050202; 
        clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
        transition: filter 0.2s ease;
      }

      .shard-glass {
        position: absolute; inset: 4px; background: rgba(10, 15, 20, 0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
        clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%); box-shadow: inset 0 0 15px rgba(0, 255, 255, 0.05); transition: background 0.3s ease;
      }

      .tech-reticle {
        position: absolute; inset: -15px; width: calc(100% + 30px); height: calc(100% + 30px); pointer-events: none; overflow: visible;
      }
      .reticle-frame { fill: none; stroke: rgba(255, 255, 255, 0.1); stroke-width: 1px; transition: stroke 0.3s ease; }
      .data-trace, .data-trace-alt { fill: none; stroke-width: 1.5px; stroke-linecap: square; opacity: 0; }
      .data-trace { stroke: #00ffff; filter: drop-shadow(0 0 4px #00ffff); }
      .data-trace-alt { stroke: #ff1133; filter: drop-shadow(0 0 4px #ff1133); }

      .icon-wrapper { position: relative; z-index: 10; display: flex; align-items: center; justify-content: center; pointer-events: none; }
      .icon-main { position: relative; width: 24px; height: 24px; stroke: #e0e0e0; filter: drop-shadow(0 0 0px transparent); transition: stroke 0.3s ease, filter 0.3s ease, transform 0.3s ease; }

      .magitech-shard:hover .shard-glass { background: rgba(0, 255, 255, 0.05); }
      .magitech-shard:hover .reticle-frame { stroke: rgba(255, 255, 255, 0.3); }
      .magitech-shard:hover .data-trace, .magitech-shard:hover .data-trace-alt { opacity: 1; }
      .magitech-shard:hover .icon-main { stroke: #00ffff; filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.8)); transform: scale(1.1); }
      .magitech-shard:active .shard-core { filter: brightness(2); }
      .magitech-shard:active .icon-main { transform: scale(0.9); transition: transform 0.1s ease; }
    `;
    document.head.appendChild(style);
  }

  _render() {
    const iconDict = {
      github: `<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>`,
      linkedin: `<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle>`,
      instagram: `<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>`,
      email: `<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>`,
      default: `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>`
    };

    const activeLinks = [];
    Object.keys(this.config.links).forEach(key => {
      const url = this.config.links[key];
      if (url) {
        const isEmail = key.toLowerCase() === 'email' || url.includes('@');
        const finalUrl = isEmail && !url.startsWith('mailto:') ? `mailto:${url}` : url;
        
        activeLinks.push({
          name: key,
          url: finalUrl,
          svgInner: iconDict[key.toLowerCase()] || iconDict.default,
          target: isEmail ? '_self' : '_blank'
        });
      }
    });

    const hexPath = "M50 2 L95 25 L95 75 L50 98 L5 75 L5 25 Z";

    this.container.innerHTML = `
      <ul class="social-emblem-list" aria-label="Social Links">
        ${activeLinks.map(link => `
          <li>
            <a href="${link.url}" target="${link.target}" rel="noopener noreferrer" class="magitech-shard" aria-label="${link.name}">
              
              <div class="shard-hitbox"></div>

              <svg class="tech-reticle" viewBox="0 0 100 100">
                <path class="reticle-frame" d="${hexPath}"></path>
                <path class="data-trace" d="${hexPath}" stroke-dasharray="20 180" stroke-dashoffset="0"></path>
                <path class="data-trace-alt" d="${hexPath}" stroke-dasharray="10 190" stroke-dashoffset="100"></path>
                <circle cx="50" cy="2" r="2" fill="rgba(255,255,255,0.5)"></circle>
                <circle cx="95" cy="75" r="2" fill="rgba(255,255,255,0.5)"></circle>
                <circle cx="5" cy="75" r="2" fill="rgba(255,255,255,0.5)"></circle>
              </svg>

              <div class="shard-core">
                <div class="shard-glass"></div>
              </div>
              
              <div class="icon-wrapper">
                <svg class="icon-main" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${link.svgInner}</svg>
              </div>
            </a>
          </li>
        `).join('')}
      </ul>
    `;
  }

  _setupPhysics() {
    this.emblems = Array.from(this.container.querySelectorAll('.magitech-shard'));

    this.emblems.forEach((emblem) => {
      const core = emblem.querySelector('.shard-core');
      const reticle = emblem.querySelector('.tech-reticle');
      const dataTrace = emblem.querySelector('.data-trace');
      const dataTraceAlt = emblem.querySelector('.data-trace-alt');
      
      const xSet = gsap.quickTo(core, "x", { duration: 0.5, ease: "power3.out" });
      const ySet = gsap.quickTo(core, "y", { duration: 0.5, ease: "power3.out" });

      if (!this.isReducedMotion) {
        emblem.addEventListener('mouseenter', () => {
          gsap.killTweensOf([reticle, dataTrace, dataTraceAlt]);
          gsap.to(reticle, { rotation: "+=60", duration: 0.4, ease: "back.out(2.0)", overwrite: "auto" });
          gsap.to(dataTrace, { strokeDashoffset: "-=200", duration: 1.5, repeat: -1, ease: "none", overwrite: "auto" });
          gsap.to(dataTraceAlt, { strokeDashoffset: "+=200", duration: 2.0, repeat: -1, ease: "none", overwrite: "auto" });
        });

        emblem.addEventListener('mousemove', (e) => {
          const rect = emblem.getBoundingClientRect();
          const x = (e.clientX - rect.left - rect.width / 2) * this.config.magneticStrength;
          const y = (e.clientY - rect.top - rect.height / 2) * this.config.magneticStrength;
          
          xSet(x);
          ySet(y);
          // Scale/Translate instead of rotate3d to prevent hitbox clipping
          gsap.to(core, { rotationY: x * 0.5, rotationX: -y * 0.5, duration: 0.4, overwrite: "auto" });
        });

        emblem.addEventListener('mouseleave', () => {
          gsap.killTweensOf([core, reticle, dataTrace, dataTraceAlt]);
          xSet(0); ySet(0);
          gsap.to(core, { x: 0, y: 0, rotationY: 0, rotationX: 0, duration: 0.8, ease: "elastic.out(1, 0.4)", overwrite: true });
          gsap.to(reticle, { rotation: "-=60", duration: 0.5, ease: "power3.out", overwrite: true });
        });
      }
    });
  }

  dispose() {
    gsap.killTweensOf('*');
    this.container.innerHTML = '';
  }
}