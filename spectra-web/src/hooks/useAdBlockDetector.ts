import { useState, useEffect } from 'react';

export const useAdBlockDetector = () => {
  const [isDetected, setIsDetected] = useState(false);

  useEffect(() => {
    const checkAdBlock = async () => {
      // Create a bait element with classes commonly blocked by ad blockers
      const bait = document.createElement('div');
      bait.className = 'adsbox ad-banner doubleclick ad-placement carbon-ads';
      bait.style.position = 'absolute';
      bait.style.top = '-1000px';
      bait.style.left = '-1000px';
      bait.style.width = '1px';
      bait.style.height = '1px';
      bait.innerHTML = '&nbsp;';
      document.body.appendChild(bait);

      // Small delay to let ad blocker run
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if the element was hidden or collapsed by an ad blocker
      const isBlocked = 
        bait.offsetHeight === 0 || 
        window.getComputedStyle(bait).display === 'none' || 
        window.getComputedStyle(bait).visibility === 'hidden';

      if (isBlocked) {
        console.log('[AdBlock] Detection: Positive');
        setIsDetected(true);
      } else {
        // Double check with a network request bait (optional, but effective)
        try {
          const req = new Request('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
            method: 'HEAD',
            mode: 'no-cors'
          });
          await fetch(req);
        } catch (e) {
          // Network error usually means blocked
          console.log('[AdBlock] Network Detection: Positive');
          setIsDetected(true);
        }
      }

      document.body.removeChild(bait);
    };

    checkAdBlock();
  }, []);

  return isDetected;
};
