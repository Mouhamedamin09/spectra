/**
 * Ad Control Service
 * Controls when ads are shown to avoid annoying users
 */

class AdControlService {
  private clickCount: number = 0;
  private readonly MIN_CLICKS_BEFORE_ADS = 2; // Skip first click, start ads from 2nd click
  private readonly CLICKS_BETWEEN_ADS = 3; // Show ad every 3 clicks after first ad

  constructor() {
    // Check if user has existing click count in session
    const stored = sessionStorage.getItem('adClickCount');
    this.clickCount = stored ? parseInt(stored, 10) : 0;
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

    // Call the ad script's interstitial function if it exists
    try {
      // @ts-ignore
      if (typeof window.atOptions !== 'undefined') {
        // @ts-ignore
        window.atOptions = {
          key: 'bb261cd0f7c70fa55e0c02536254ee9b',
          format: 'iframe',
          height: 90,
          width: 728,
          params: {}
        };
      }
    } catch (e) {
      console.warn('[AdControl] Failed to show ad:', e);
    }
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
