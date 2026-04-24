/**
 * Industry-Grade Hardware Governor & Responsive Manager v6.0 (OBSIDIAN TEMPEST)
 * Engineered for the master UI and WebGL orchestration.
 * * Architectural Upgrades:
 * - Mobile URL-Bar Defense: Silently absorbs vertical micro-resizes triggered by mobile browser address bars to prevent WebGL layout thrashing.
 * - True Viewport Engine: Calculates and injects `--vh` into the CSS root to fix the notorious mobile `100vh` scrolling bug.
 * - Aggressive Thermal Capping: Strict DPR limits for high-density mobile displays to prevent thermal throttling and battery drain.
 * - Async Battery Defense: Safely polls battery APIs to drop WebGL quality before the device dies.
 */
class ResponsiveManager {
  constructor() {
    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1440,
    };

    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      hasTouch: false,
      orientation: 'landscape',
      qualityTier: 'high', 
      isLowPowerMode: false
    };

    // Hardware profiling via browser APIs
    this.hardware = {
      cores: navigator.hardwareConcurrency || 4,
      memory: navigator.deviceMemory || 4, 
      isAppleMobile: /iPhone|iPad|iPod/i.test(navigator.userAgent),
      saveData: navigator.connection?.saveData || false
    };

    this._subscribers = [];
    this._resizeTimeout = null;

    this._handleResize = this._handleResize.bind(this);

    this._init();
  }

  _init() {
    this._detectTouch();
    this._calculateViewport();
    this.state.qualityTier = this._calculateOptimalQualityTier();

    // Async Battery Check (Non-blocking)
    this._checkBatteryStatus();

    // Listen for layout shifts
    window.addEventListener('resize', this._handleResize, { passive: true });
    
    // Modern Orientation API
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', this._handleResize, { passive: true });
    } else {
      window.addEventListener('orientationchange', this._handleResize, { passive: true });
    }

    console.log(`[Hardware Governor] Profile: ${this.hardware.cores} Cores, ~${this.hardware.memory}GB RAM.`);
    console.log(`[Hardware Governor] WebGL Tier Locked: [${this.state.qualityTier.toUpperCase()}]`);
  }

  /**
   * Safely checks the Battery Status API (Chrome/Edge/Opera only).
   * If the device is dying, it forces a downgrade to save thermals.
   */
  async _checkBatteryStatus() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        const evaluateBattery = () => {
          const isDying = !battery.charging && battery.level <= 0.20;
          if (isDying && !this.state.isLowPowerMode) {
            this.state.isLowPowerMode = true;
            this.state.qualityTier = 'low';
            console.warn('[Hardware Governor] Critical Battery Detected. Forcing LOW Quality Tier.');
            this._notifySubscribers({ ...this.state, majorShift: true });
          }
        };
        
        evaluateBattery();
        battery.addEventListener('levelchange', evaluateBattery);
        battery.addEventListener('chargingchange', evaluateBattery);
      } catch (e) {
        // Battery API blocked by permissions or unsupported
      }
    }
  }

  /**
   * Evaluates hardware limits and assigns a safe WebGL quality tier.
   */
  _calculateOptimalQualityTier() {
    const { cores, memory, isAppleMobile, saveData } = this.hardware;
    const { isMobile, width } = this.state;

    // Hard throttle for metered connections or battery saver mode
    if (saveData || this.state.isLowPowerMode) {
        return 'low';
    }

    // ULTRA: High-end workstations
    if (!isMobile && cores >= 8 && memory >= 8 && width >= 1920) {
      return 'ultra';
    }
    
    // HIGH: Standard laptops and capable desktops
    if (!isMobile && cores >= 4 && memory >= 4) {
      return 'high';
    }

    // MEDIUM: Modern smartphones (Apple A-series chips) and mid-tier laptops
    if (isAppleMobile || (cores >= 4 && memory >= 4)) {
      return 'medium';
    }

    // LOW: Budget mobile devices, low-RAM tablets, heavy thermal constraints
    return 'low';
  }

  _detectTouch() {
    this.state.hasTouch = (
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  _calculateViewport() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.state.width = w;
    this.state.height = h;
    this.state.orientation = w > h ? 'landscape' : 'portrait';

    this.state.isMobile = w <= this.breakpoints.mobile;
    this.state.isTablet = w > this.breakpoints.mobile && w <= this.breakpoints.tablet;
    this.state.isDesktop = w > this.breakpoints.tablet;

    // TRUE VIEWPORT INJECTION: Fixes mobile 100vh scrolling bugs
    // Usage in CSS: `height: calc(var(--vh, 1vh) * 100);`
    const vh = h * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  _handleResize() {
    // 150ms debounce prevents DOM thrashing during window drags
    if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
    
    this._resizeTimeout = setTimeout(() => {
      const prevWidth = this.state.width;
      const prevHeight = this.state.height;
      const prevMobile = this.state.isMobile;
      const prevOrientation = this.state.orientation;

      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      // MOBILE URL-BAR DEFENSE: 
      // If on mobile and ONLY the height changed (by less than 150px), it's just the address bar hiding/showing.
      // We update the CSS `--vh` variable, but we DO NOT trigger a heavy WebGL/Layout resize.
      if (this.state.isMobile && prevWidth === newWidth && Math.abs(prevHeight - newHeight) < 150) {
        this._calculateViewport(); // Updates CSS variable quietly
        return; // Halt execution. Do not notify subscribers to prevent canvas thrashing.
      }

      // Execute full recalculation for genuine layout shifts
      this._calculateViewport();

      const majorShift = (prevMobile !== this.state.isMobile) || (prevOrientation !== this.state.orientation);

      this._notifySubscribers({
        ...this.state,
        majorShift
      });
    }, 150);
  }

  /**
   * Generates the master configuration object consumed by the SceneManager and VFX Controllers.
   */
  getSystemConfig() {
    const tier = this.state.qualityTier;
    const isLow = tier === 'low';
    const isMedium = tier === 'medium';
    const isUltra = tier === 'ultra';

    return {
      qualityTier: tier,
      
      // Post-Processing & Shadows
      enablePostProcessing: !isLow, 
      enableShadows: !isLow,
      
      // CRITICAL: GPU Thermal Management (High-DPI Mobile Defense)
      // Mobile devices often have 3x pixel ratios which melt GPUs. Strictly cap them here.
      pixelRatioCap: isLow ? 1.0 : (isMedium ? 1.25 : (isUltra ? 2.0 : 1.5)),

      // Synced VFX Limitations (Mapped perfectly to Cataclysm v8.0)
      flameParticleCount: isLow ? 80 : (isMedium ? 200 : (isUltra ? 400 : 300)),
      maxLightningSegments: isLow ? 800 : (isMedium ? 2000 : (isUltra ? 5000 : 4000)),

      // UI/UX Modifiers
      isTouchDevice: this.state.hasTouch
    };
  }

  subscribe(callback) {
    this._subscribers.push(callback);
    callback(this.state);
    
    return () => {
      this._subscribers = this._subscribers.filter(cb => cb !== callback);
    };
  }

  _notifySubscribers(data) {
    this._subscribers.forEach(cb => {
      try { cb(data); } catch (e) { console.error('[ResponsiveManager] Subscriber Error:', e); }
    });
  }

  dispose() {
    window.removeEventListener('resize', this._handleResize);
    
    if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', this._handleResize);
    } else {
        window.removeEventListener('orientationchange', this._handleResize);
    }

    if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
    this._subscribers = [];
  }
}

// Export as a singleton
export const responsiveManager = new ResponsiveManager();