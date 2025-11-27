import React, { useEffect, useRef } from 'react';

export const AdBanner: React.FC = () => {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bannerRef.current) {
      const iframe = document.createElement('iframe');
      iframe.style.width = '728px';
      iframe.style.height = '90px';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.scrolling = 'no';
      
      bannerRef.current.innerHTML = '';
      bannerRef.current.appendChild(iframe);
      
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; }</style>
            </head>
            <body>
              <script type="text/javascript">
                atOptions = {
                  'key' : '04304ccd75192ec1b6fa3febffc25cc0',
                  'format' : 'iframe',
                  'height' : 90,
                  'width' : 728,
                  'params' : {}
                };
              </script>
              <script type="text/javascript" src="//www.highperformanceformat.com/04304ccd75192ec1b6fa3febffc25cc0/invoke.js"></script>
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, []);

  return (
    <div 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        margin: '40px auto', 
        width: '100%',
        maxWidth: '100%',
        minHeight: '90px',
        overflow: 'hidden'
      }}
    >
      <div ref={bannerRef} />
    </div>
  );
};
