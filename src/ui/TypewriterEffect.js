import gsap from 'gsap';
import { a11yManager } from '../utils/accessibility.js';

/**
 * Industry-Grade Magical Glyph Revealer v8.1 (VOLCANIC FORGE - ULTRA PERF)
 * * Architectural Upgrades:
 * - Word-Wrap Engine: Rebuilt the DOM string parser. It now groups characters into invisible "Word Containers" so the browser wraps whole words to the next line on mobile, instead of slicing words in half.
 * - Paint Thrashing Eliminated: Uses pure transforms and opacity.
 * - DOM Batching: Utilizes DocumentFragment for zero-reflow injection.
 */
export class TypewriterEffect {
  constructor(container, options = {}) {
    this.container = container;
    this.config = {
      text: options.text || '',
      totalDuration: options.duration ?? 1.5, 
      autoStart: options.autoStart ?? true,
      fireColor: options.fireColor ?? '#ffffff', 
      ...options
    };

    this.isReducedMotion = a11yManager?.shouldReduceMotion() || false;
    this.chars = []; 
    this.timeline = null;
    
    this.init();
  }

  init() {
    this._setupDOM();
    this._buildTimeline();
    
    if (this.config.autoStart && !this.isReducedMotion) {
      this.play();
    }
  }

  _setupDOM() {
    this.container.innerHTML = '';
    
    // A11y: Visually hidden full text for screen readers
    const srText = document.createElement('span');
    srText.className = 'sr-only'; 
    srText.innerHTML = this.config.text;
    this.container.appendChild(srText);

    // The Visual Container
    this.visibleContainer = document.createElement('span');
    this.visibleContainer.setAttribute('aria-hidden', 'true');
    this.container.appendChild(this.visibleContainer);

    const rawText = this.config.text.replace(/<br\s*\/?>/gi, '\n');
    const fragment = document.createDocumentFragment(); 

    // ⚡ FIX: Split text by spaces and newlines, preserving the delimiters
    const words = rawText.split(/(\s+|\n)/);

    words.forEach(word => {
      // 1. Handle Newlines
      if (word === '\n') {
        fragment.appendChild(document.createElement('br'));
        return;
      }

      // 2. Handle Spaces (so we don't lose them)
      if (word.trim() === '') {
        const spaceSpan = document.createElement('span');
        spaceSpan.innerHTML = word.replace(/ /g, '&nbsp;');
        fragment.appendChild(spaceSpan);
        return;
      }

      // 3. Handle Actual Words
      // We wrap the word in an inline-block container that refuses to break internally
      const wordContainer = document.createElement('span');
      wordContainer.style.display = 'inline-block';
      wordContainer.style.whiteSpace = 'nowrap'; 

      // Now we generate the individual animated letters inside the word container
      for (let i = 0; i < word.length; i++) {
        const span = document.createElement('span');
        span.style.display = 'inline-block'; 
        span.style.opacity = '0'; 
        span.style.willChange = 'opacity, transform'; 
        span.innerHTML = word[i];
        
        wordContainer.appendChild(span);
        this.chars.push(span);
      }

      fragment.appendChild(wordContainer);
    });

    this.visibleContainer.appendChild(fragment);

    if (this.isReducedMotion) {
      this.chars.forEach(span => { span.style.opacity = '1'; });
    }
  }

  _buildTimeline() {
    if (this.isReducedMotion || this.chars.length === 0) return;

    this.timeline = gsap.timeline({ paused: true });

    gsap.set(this.chars, { 
        opacity: 0, 
        y: -10, 
        scale: 1.2, 
        color: this.config.fireColor
    });

    this.timeline.to(this.chars, {
      opacity: 1,
      y: 0,
      scale: 1,
      color: 'inherit', 
      duration: 0.5, 
      stagger: {
        amount: this.config.totalDuration, 
        from: "start"
      },
      ease: "back.out(1.5)", 
      force3D: true 
    });
  }

  play() {
    if (this.isReducedMotion || !this.timeline) return;
    this.timeline.play();
  }

  complete() {
    if (this.isReducedMotion || !this.timeline) return;
    this.timeline.progress(1.0);
  }

  setProgress(progress) {
    if (this.isReducedMotion || !this.timeline) return;
    this.timeline.progress(progress);
  }

  dispose() {
    if (this.timeline) this.timeline.kill();
    this.container.innerHTML = '';
    this.chars = [];
  }
}
