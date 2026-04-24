/**
 * Industry-Grade Accessibility (A11y) Manager v6.0 (WCAG AAA STANDARD)
 * Bridges the WebGL black-box with the DOM accessibility tree.
 * * Architectural Upgrades:
 * - Mobile Touch Routing: Intercepts `touchstart` to instantly disable keyboard navigation mode, preventing sticky focus rings on mobile.
 * - Motion Scalar: Added `getMotionScalar()` so WebGL can smoothly dampen animations instead of brutally disabling them.
 * - Focus Restoration Memory: Returns users to their exact DOM position after overlays close.
 * - Dynamic Canvas Context: Narrates the 3D WebGL state directly into the accessibility tree.
 */
class AccessibilityManager {
  constructor() {
    this.state = {
      isKeyboardUser: false,
      prefersReducedMotion: false,
      prefersHighContrast: false,
      prefersReducedData: false,
    };

    this.liveRegion = null;
    this.webglCanvas = null;
    this._subscribers = [];
    
    // Queue system for screen reader announcements
    this._announcementQueue = [];
    this._isAnnouncing = false;

    // Focus Management State
    this._focusTrapHandler = null;
    this._previousFocus = null; 
    this._trappedContainer = null;

    // Bound methods for clean listener toggling
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handlePointerDown = this._handlePointerDown.bind(this);

    this._init();
  }

  _init() {
    this._createLiveRegion();
    this._setupMediaQueries();
    
    // Default to mouse/touch mode until a keyboard tap is detected
    window.addEventListener('keydown', this._handleKeyDown);

    console.log(`[A11yManager] Protocol Active | Motion: ${this.state.prefersReducedMotion ? 'Reduced' : 'Full'}`);
  }

  /**
   * Links the A11y Manager to your main Three.js Canvas.
   * @param {HTMLCanvasElement} canvas 
   */
  registerWebGLCanvas(canvas) {
    if (!canvas) return;
    this.webglCanvas = canvas;
    this.webglCanvas.setAttribute('role', 'img');
    this.webglCanvas.setAttribute('aria-label', 'A 3D cinematic scene of an Obsidian Dragon.');
    this.webglCanvas.tabIndex = 0; 
  }

  /**
   * Updates the canvas description as the user scrolls.
   * @param {string} description
   */
  updateCanvasContext(description) {
    if (this.webglCanvas) {
      this.webglCanvas.setAttribute('aria-label', description);
    }
  }

  _createLiveRegion() {
    this.liveRegion = document.createElement('div');
    this.liveRegion.id = 'webgl-announcer';
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    
    Object.assign(this.liveRegion.style, {
      position: 'absolute',
      width: '1px', height: '1px',
      padding: '0', margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap', border: '0'
    });

    document.body.appendChild(this.liveRegion);
  }

  _setupMediaQueries() {
    const bindQuery = (query, stateKey, eventName) => {
      const mq = window.matchMedia(query);
      this.state[stateKey] = mq.matches;
      mq.addEventListener('change', (e) => {
        this.state[stateKey] = e.matches;
        this._notifySubscribers(eventName, e.matches);
      });
    };

    bindQuery('(prefers-reduced-motion: reduce)', 'prefersReducedMotion', 'motionPreferenceChanged');
    bindQuery('(prefers-contrast: more)', 'prefersHighContrast', 'contrastPreferenceChanged');
    bindQuery('(prefers-reduced-data: reduce)', 'prefersReducedData', 'dataPreferenceChanged');
  }

  _handleKeyDown(e) {
    if (e.key === 'Tab' || e.key === 'Enter') {
      this.state.isKeyboardUser = true;
      document.body.classList.add('keyboard-navigation'); 
      this._notifySubscribers('navigationModeChanged', 'keyboard');
      
      window.removeEventListener('keydown', this._handleKeyDown);
      window.addEventListener('mousedown', this._handlePointerDown);
      window.addEventListener('touchstart', this._handlePointerDown, { passive: true });
    }
  }

  _handlePointerDown() {
    this.state.isKeyboardUser = false;
    document.body.classList.remove('keyboard-navigation');
    this._notifySubscribers('navigationModeChanged', 'pointer');
    
    window.removeEventListener('mousedown', this._handlePointerDown);
    window.removeEventListener('touchstart', this._handlePointerDown);
    window.addEventListener('keydown', this._handleKeyDown);
  }

  announce(message, priority = 'polite') {
    if (!this.liveRegion) return;

    if (priority === 'assertive') {
      this._processAnnouncement(message, priority);
    } else {
      this._announcementQueue.push(message);
      if (!this._isAnnouncing) {
        this._processQueue();
      }
    }
  }

  _processQueue() {
    if (this._announcementQueue.length === 0) {
      this._isAnnouncing = false;
      return;
    }

    this._isAnnouncing = true;
    const message = this._announcementQueue.shift();
    this._processAnnouncement(message, 'polite');

    setTimeout(() => this._processQueue(), 1500);
  }

  _processAnnouncement(message, priority) {
    this.liveRegion.textContent = ''; 
    this.liveRegion.setAttribute('aria-live', priority);
    
    setTimeout(() => {
      this.liveRegion.textContent = message;
    }, 50);
  }

  trapFocus(container) {
    if (!container) return;
    
    this._previousFocus = document.activeElement;
    this._trappedContainer = container;

    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, details, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    this._focusTrapHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.releaseFocus();
        this._notifySubscribers('escapePressed', container);
        return;
      }

      const isTabPressed = e.key === 'Tab' || e.keyCode === 9;
      if (!isTabPressed) return;

      if (e.shiftKey) { 
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else { 
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', this._focusTrapHandler);
    first.focus();
  }

  releaseFocus() {
    if (!this._trappedContainer || !this._focusTrapHandler) return;
    
    this._trappedContainer.removeEventListener('keydown', this._focusTrapHandler);
    this._focusTrapHandler = null;
    this._trappedContainer = null;

    if (this._previousFocus && typeof this._previousFocus.focus === 'function') {
      this._previousFocus.focus();
    }
    this._previousFocus = null;
  }

  shouldReduceMotion() { return this.state.prefersReducedMotion; }
  
  /**
   * Returns a multiplier for WebGL lerping. 
   * 1.0 = Full speed, 0.1 = Highly dampened/reduced.
   */
  getMotionScalar() {
    return this.state.prefersReducedMotion ? 0.1 : 1.0;
  }

  shouldReduceData() { return this.state.prefersReducedData; }
  isKeyboardNavigating() { return this.state.isKeyboardUser; }

  subscribe(event, callback) {
    this._subscribers.push({ event, callback });
    return () => {
      this._subscribers = this._subscribers.filter(sub => sub.callback !== callback);
    };
  }

  _notifySubscribers(event, data) {
    this._subscribers
      .filter(sub => sub.event === event)
      .forEach(sub => sub.callback(data));
  }
}

export const a11yManager = new AccessibilityManager();