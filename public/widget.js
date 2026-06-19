(function() {
  // Config
  const config = window.DivaChat || {};
  const BASE_URL = (config.url || 'http://localhost:8080').replace(/\/$/, '');

  // 1. Inject Styles for the Widget
  const style = document.createElement('style');
  style.innerHTML = `
    #diva-chat-widget-btn {
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f0b429 0%, #d4a017 100%);
      box-shadow: 0 8px 24px rgba(240, 180, 41, 0.4);
      cursor: pointer;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      border: 2px solid rgba(255, 255, 255, 0.1);
    }
    #diva-chat-widget-btn:hover {
      transform: scale(1.05) translateY(-3px);
      box-shadow: 0 12px 30px rgba(240, 180, 41, 0.5);
    }
    #diva-chat-widget-btn svg {
      width: 30px;
      height: 30px;
      fill: #05030e; /* Dark icon to match Velvet Luxe */
      transition: transform 0.3s ease;
    }
    #diva-chat-widget-container {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 420px;
      height: 680px;
      max-height: calc(100vh - 110px);
      max-width: calc(100vw - 48px);
      background: #05030e;
      border-radius: 24px;
      z-index: 2147483646;
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.95);
      transform-origin: bottom right;
      transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
      overflow: hidden;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(200, 160, 255, 0.15);
    }
    #diva-chat-widget-container.diva-open {
      opacity: 1;
      pointer-events: all;
      transform: translateY(0) scale(1);
    }
    #diva-chat-widget-iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
    }
    
    /* Tablet (481px – 900px width) */
    @media (max-width: 900px) {
      #diva-chat-widget-container {
        bottom: 0;
        right: 0;
        width: 100vw;
        height: 92vh;
        max-height: 92vh;
        max-width: 100vw;
        border-radius: 20px 20px 0 0;
      }
      #diva-chat-widget-btn {
        bottom: 160px;
        right: 16px;
        width: 54px;
        height: 54px;
      }
    }
    /* Phone (up to 480px) — full screen */
    @media (max-width: 480px) {
      #diva-chat-widget-container {
        bottom: 0;
        right: 0;
        width: 100vw;
        height: 100vh;
        max-height: 100vh;
        max-width: 100vw;
        border-radius: 0;
      }
      #diva-chat-widget-btn {
        bottom: 160px;
        right: 16px;
        width: 52px;
        height: 52px;
      }
    }
    /* Short viewport (any width, height < 650px) — slide up from bottom */
    @media (max-height: 650px) {
      #diva-chat-widget-container {
        bottom: 0;
        right: 0;
        width: 100vw;
        height: 100vh;
        max-height: 100vh;
        max-width: 100vw;
        border-radius: 0;
      }
      #diva-chat-widget-btn {
        bottom: 90px;
        right: 20px;
      }
    }
  `;
  document.head.appendChild(style);

  // 2. Inject Button
  const btn = document.createElement('div');
  btn.id = 'diva-chat-widget-btn';
  
  // Default Chat Icon
  const chatIcon = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3C6.48 3 2 6.58 2 11C2 13.06 3.03 14.94 4.67 16.32C4.46 17.55 3.86 18.89 3.03 19.98C2.88 20.17 2.91 20.45 3.09 20.6C3.21 20.69 3.36 20.72 3.5 20.68C5.61 20.08 7.33 18.98 8.54 17.94C9.62 18.23 10.79 18.39 12 18.39C17.52 18.39 22 14.81 22 10.4C22 5.98 17.52 3 12 3ZM10.5 11C10.5 11.83 9.83 12.5 9 12.5C8.17 12.5 7.5 11.83 7.5 11C7.5 10.17 8.17 9.5 9 9.5C9.83 9.5 10.5 10.17 10.5 11ZM16.5 11C16.5 11.83 15.83 12.5 15 12.5C14.17 12.5 13.5 11.83 13.5 11C13.5 10.17 14.17 9.5 15 9.5C15.83 9.5 16.5 10.17 16.5 11Z"/></svg>';
  
  // Close Icon (X)
  const closeIcon = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/></svg>';
  
  btn.innerHTML = chatIcon;
  document.body.appendChild(btn);

  // 3. Inject Container & Iframe
  const container = document.createElement('div');
  container.id = 'diva-chat-widget-container';
  
  const iframe = document.createElement('iframe');
  iframe.id = 'diva-chat-widget-iframe';
  
  // Append ?widget=true to let the app know it's embedded
  // The app can read this and optionally hide the header/sidebar
  iframe.src = BASE_URL + '/?widget=true';
  iframe.title = "Digital Diva AI Chatbot";
  
  container.appendChild(iframe);
  document.body.appendChild(container);

  // 4. Handle Click
  let isOpen = false;
  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      container.classList.add('diva-open');
      btn.innerHTML = closeIcon;
    } else {
      container.classList.remove('diva-open');
      btn.innerHTML = chatIcon;
    }
  });

})();
