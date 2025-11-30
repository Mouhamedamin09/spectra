/**
 * Ad Control Service
 * Controls when ads are shown to avoid annoying users
 */

class AdControlService {
  private clickCount: number = 0;
  private readonly MIN_CLICKS_BEFORE_ADS = 2; // Skip first click, start ads from 2nd click
  private readonly CLICKS_BETWEEN_ADS = 3; // Show ad every 3 clicks after first ad
  private scriptLoaded: boolean = false;
  private readonly AD_SCRIPT_URL = '//pl28143153.effectivegatecpm.com/bb/26/1c/bb261cd0f7c70fa55e0c02536254ee9b.js';

  constructor() {
    // Check if user has existing click count in session
    const stored = sessionStorage.getItem('adClickCount');
    this.clickCount = stored ? parseInt(stored, 10) : 0;
    
    // If user has already clicked enough times in previous session, load script immediately
    if (this.clickCount >= this.MIN_CLICKS_BEFORE_ADS) {
      this.loadAdScript();
    }
  }

  /**
   * Load the ad script dynamically
   */
  private loadAdScript(): void {
    if (this.scriptLoaded) return;
    
    console.log('[AdControl] Loading ad script...');
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = this.AD_SCRIPT_URL;
    script.async = true;
    document.head.appendChild(script);
    this.scriptLoaded = true;
  }

  /**
   * Call this on every navigation click
   * Returns true if an ad should be shown
   */
  shouldShowAd(): boolean {
    this.clickCount++;
    sessionStorage.setItem('adClickCount', this.clickCount.toString());

    // Don't show ad on first click
    if (this.clickCount < this.MIN_CLICKS_BEFORE_ADS) {
      console.log(`[AdControl] Click ${this.clickCount} - No ad (warming up)`);
      return false;
    }

    // Load script if not loaded yet (this enables the ads)
    if (!this.scriptLoaded) {
      this.loadAdScript();
    }

    // After first ad eligibility, show ad every N clicks
    const clicksSinceEligible = this.clickCount - this.MIN_CLICKS_BEFORE_ADS;
    const shouldShow = clicksSinceEligible % this.CLICKS_BETWEEN_ADS === 0;
    
    if (shouldShow) {
      console.log(`[AdControl] Click ${this.clickCount} - Showing ad`);
    } else {
      console.log(`[AdControl] Click ${this.clickCount} - No ad`);
    }

    return shouldShow;
  }

  /**
   * Show an interstitial ad if conditions are met
   */
  showInterstitialIfEligible(): void {
    if (!this.shouldShowAd()) {
      return;
    }
    // The script itself handles the popunder/interstitial when loaded/triggered
  }

  /**
   * Reset click counter (e.g., on new session)
   */
  reset(): void {
    this.clickCount = 0;
    sessionStorage.removeItem('adClickCount');
  }
}

export const adControlService = new AdControlService();
