/**
 * Buzz Zap Modal
 * A lightweight modal payment component for Nostr Buzz Zap Gateway
 * v1.0.0
 */
(function() {
  const BASE_URL = "https://nostr.buzz";
  
  // Default configuration
  const DEFAULT_CONFIG = {
    primaryColor: "#0080ff",
    secondaryColor: "#666",
    backgroundColor: "#f9f9f9",
    darkBackgroundColor: "#1a1a1a",
    defaultMethod: "lightning",
    defaultTheme: "dark",
    logo: null,
    containerClass: "",
    i18n: {
      title: "Support via Zap",
      payButton: "Send Zap",
      cancelButton: "Cancel",
      amountLabel: "Amount (sats)",
      methodLabel: "Payment Method",
      commentLabel: "Comment (optional)",
      successMessage: "Payment Successful!",
      errorMessage: "Payment Failed",
      loadingMessage: "Processing...",
      lightning: "Lightning",
      cashu: "Cashu",
      ark: "Ark"
    }
  };
  
  // Create a copy of default config
  const config = Object.assign({}, DEFAULT_CONFIG);
  
  // Helper function to get zap URL
  function getZapUrl(pubkey) {
    return `${BASE_URL}/zap/${pubkey}`;
  }
  
  // Check if pubkey is valid npub or hex
  function validatePubkey(pubkey) {
    // Basic validation for npub
    if (pubkey.startsWith('npub1') && pubkey.length >= 32) {
      return true;
    }
    
    // Basic validation for hex
    if (/^[0-9a-f]{64}$/i.test(pubkey)) {
      return true;
    }
    
    return false;
  }
  
  // Helper function to retry API calls
  async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
  }
  
  // Helper function to create DOM elements
  function createElement(tag, attributes) {
    const element = document.createElement(tag);
    if (attributes) {
      Object.keys(attributes).forEach(key => {
        element[key] = attributes[key];
      });
    }
    return element;
  }
  
  // Helper function to escape HTML
  function escapeHtml(str) {
    return ("" + str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  
  // Helper function to close the modal
  function closeModal() {
    const modal = document.getElementById("buzz-zap-modal");
    if (modal) {
      // Add animation for smooth removal
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
    }
  }
  
  // Create modal styles
  function createStyles(isDark) {
    const theme = isDark ? "dark" : "light";
    const backgroundColor = isDark ? config.darkBackgroundColor : config.backgroundColor;
    
    return `
    .buzz-zap-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.6);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      opacity: 0;
      transition: opacity 0.3s ease;
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
    }
    .buzz-zap-modal.visible {
      opacity: 1;
    }
    .buzz-zap-content {
      width: 100%;
      max-width: 400px;
      border-radius: 12px;
      overflow: hidden;
      background-color: ${backgroundColor};
      color: ${isDark ? "#fff" : "#333"};
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      position: relative;
      transform: translateY(20px);
      transition: transform 0.3s ease;
    }
    .buzz-zap-modal.visible .buzz-zap-content {
      transform: translateY(0);
    }
    .buzz-zap-header {
      background-color: ${config.primaryColor};
      padding: 15px 20px;
      color: white;
      font-weight: bold;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .buzz-zap-close {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background-color: rgba(255,255,255,0.2);
      transition: background-color 0.2s;
    }
    .buzz-zap-close:hover {
      background-color: rgba(255,255,255,0.3);
    }
    .buzz-zap-body {
      padding: 20px;
      position: relative;
      overflow: hidden;
    }
    .buzz-zap-field {
      margin-bottom: 16px;
    }
    .buzz-zap-label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: ${isDark ? "#eaeaea" : "#555"};
    }
    .buzz-zap-input, .buzz-zap-select, .buzz-zap-textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid ${isDark ? "#444" : "#ddd"};
      background-color: ${isDark ? "#333" : "#fff"};
      color: ${isDark ? "#fff" : "#333"};
      border-radius: 6px;
      font-size: 15px;
      transition: border-color 0.2s;
    }
    .buzz-zap-input:focus, .buzz-zap-select:focus, .buzz-zap-textarea:focus {
      border-color: ${config.primaryColor};
      outline: none;
      box-shadow: 0 0 0 2px ${config.primaryColor}33;
    }
    .buzz-zap-preset {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .buzz-zap-preset button {
      border: 1px solid ${isDark ? "#444" : "#ddd"};
      background: ${isDark ? "#333" : "#f5f5f5"};
      color: ${isDark ? "#fff" : "#333"};
      border-radius: 20px;
      padding: 5px 10px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .buzz-zap-preset button:hover {
      background: ${isDark ? "#444" : "#e5e5e5"};
    }
    .buzz-zap-preset button.active {
      background: ${config.primaryColor};
      color: white;
      border-color: ${config.primaryColor};
      transform: scale(1.05);
    }
    .buzz-zap-footer {
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border-top: 1px solid ${isDark ? "#444" : "#eee"};
    }
    .buzz-zap-btn {
      padding: 10px 15px;
      border-radius: 6px;
      border: none;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      transition: all 0.2s ease;
    }
    .buzz-zap-btn-primary {
      background-color: ${config.primaryColor};
      color: white;
    }
    .buzz-zap-btn-primary:hover {
      background-color: ${shadeColor(config.primaryColor, -15)};
      transform: translateY(-1px);
    }
    .buzz-zap-btn-outline {
      background-color: transparent;
      border: 1px solid ${isDark ? "#444" : "#ddd"};
      color: ${isDark ? "#eaeaea" : "#666"};
    }
    .buzz-zap-btn-outline:hover {
      background-color: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"};
    }
    .buzz-zap-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }
    .buzz-zap-loading, .buzz-zap-success, .buzz-zap-error {
      text-align: center;
      padding: 30px 20px;
    }
    .buzz-zap-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }
    .buzz-zap-success .buzz-zap-icon {
      color: #4CAF50;
    }
    .buzz-zap-error .buzz-zap-icon {
      color: #F44336;
    }
    .buzz-zap-qr {
      text-align: center;
      margin: 20px 0;
    }
    .buzz-zap-qr img {
      max-width: 200px;
      border: 8px solid white;
      border-radius: 6px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.1);
    }
    .buzz-zap-note {
      font-size: 13px;
      color: ${isDark ? "#aaa" : "#888"};
      margin-top: 15px;
      text-align: center;
    }
    .buzz-zap-amount-field {
      position: relative;
    }
    .buzz-zap-amount-field input {
      padding-left: 28px;
    }
    .buzz-zap-currency {
      position: absolute;
      left: 12px;
      top: 11px;
      font-size: 15px;
      color: ${isDark ? "#aaa" : "#888"};
    }
    .buzz-zap-logo {
      height: 24px;
      margin-right: 10px;
      object-fit: contain;
    }
    .buzz-zap-spinner {
      display: inline-block;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      animation: buzz-spin 1s linear infinite;
    }
    @keyframes buzz-spin {
      to { transform: rotate(360deg); }
    }
    .buzz-zap-error-notification {
      background-color: ${isDark ? "#422" : "#f8d7da"};
      color: ${isDark ? "#f88" : "#721c24"};
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 15px;
      font-size: 14px;
      display: flex;
      align-items: center;
    }
    .buzz-zap-error-notification svg {
      margin-right: 8px;
      flex-shrink: 0;
    }
    .buzz-zap-countdown {
      margin-top: 10px;
      font-size: 13px;
      color: ${isDark ? "#aaa" : "#888"};
    }
    @media (max-width: 480px) {
      .buzz-zap-content {
        max-width: 92%;
        margin: 0 4%;
      }
      .buzz-zap-preset {
        gap: 6px;
      }
      .buzz-zap-preset button {
        font-size: 12px;
        padding: 4px 8px;
      }
    }
    `;
  }
  
  // Function to darken/lighten color
  function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    R = (R > 0) ? R : 0;
    G = (G > 0) ? G : 0;
    B = (B > 0) ? B : 0;

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
  }
  
  // Lightning payment handler
  async function handleLightningPayment(response, checkUrl) {
    return new Promise((resolve, reject) => {
      // Create Lightning payment UI
      const container = document.createElement('div');
      container.className = 'buzz-zap-body';
      
      // QR code section
      const qrContainer = document.createElement('div');
      qrContainer.className = 'buzz-zap-qr';
      
      const qrCode = document.createElement('img');
      qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(response.payment.invoice)}&size=200x200`;
      qrCode.alt = 'Lightning QR Code';
      qrContainer.appendChild(qrCode);
      
      // Invoice copy section
      const invoiceField = document.createElement('div');
      invoiceField.className = 'buzz-zap-field';
      
      const invoiceInput = document.createElement('input');
      invoiceInput.type = 'text';
      invoiceInput.className = 'buzz-zap-input';
      invoiceInput.value = response.payment.invoice;
      invoiceInput.readOnly = true;
      
      const copyButton = document.createElement('button');
      copyButton.className = 'buzz-zap-btn buzz-zap-btn-primary';
      copyButton.style.marginTop = '8px';
      copyButton.style.width = '100%';
      copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> <span style="margin-left:8px">Copy Invoice</span>';
      copyButton.onclick = function() {
        invoiceInput.select();
        document.execCommand('copy');
        copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> <span style="margin-left:8px">Copied!</span>';
        
        setTimeout(() => {
          copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> <span style="margin-left:8px">Copy Invoice</span>';
        }, 2000);
      };
      
      invoiceField.append(invoiceInput, copyButton);
      
      // Payment countdown
      const countdownContainer = document.createElement('div');
      countdownContainer.className = 'buzz-zap-countdown';
      countdownContainer.textContent = 'Waiting for payment...';
      
      // Try to make a direct payment if WebLN is available
      const webLnContainer = document.createElement('div');
      webLnContainer.style.marginBottom = '15px';
      
      // Check if webln is available
      if (typeof window.webln !== 'undefined') {
        const webLnButton = document.createElement('button');
        webLnButton.className = 'buzz-zap-btn buzz-zap-btn-primary';
        webLnButton.style.marginTop = '15px';
        webLnButton.style.width = '100%';
        webLnButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg> <span style="margin-left:8px">Pay with WebLN</span>';
        webLnButton.onclick = async function() {
          try {
            await window.webln.enable();
            await window.webln.sendPayment(response.payment.invoice);
            resolve(response);
          } catch (error) {
            console.error('WebLN payment error:', error);
            const errorMsg = document.createElement('div');
            errorMsg.className = 'buzz-zap-error-notification';
            errorMsg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Failed to pay with WebLN: ' + (error.message || 'Unknown error');
            webLnContainer.innerHTML = '';
            webLnContainer.appendChild(errorMsg);
          }
        };
        webLnContainer.appendChild(webLnButton);
      }
      
      const instructions = document.createElement('p');
      instructions.className = 'buzz-zap-note';
      instructions.innerHTML = 'Open your Lightning wallet, scan the QR code or paste the invoice to pay. <br>This window will update automatically when payment is detected.';
      
      // Cancel button
      const cancelButton = document.createElement('button');
      cancelButton.className = 'buzz-zap-btn buzz-zap-btn-outline';
      cancelButton.style.marginTop = '15px';
      cancelButton.style.width = '100%';
      cancelButton.textContent = config.i18n.cancelButton;
      cancelButton.onclick = () => {
        clearInterval(checkInterval);
        reject('Cancelled');
      };
      
      // Construct the UI
      container.append(qrContainer, webLnContainer, invoiceField, countdownContainer, instructions, cancelButton);
      
      // Replace the modal body with our payment UI
      const modalBody = document.querySelector('.buzz-zap-body');
      modalBody.innerHTML = '';
      modalBody.appendChild(container);
      
      // Set up countdown
      const expiryTime = (response.payment.expires * 1000) || 300000;
      const startTime = Date.now();
      
      // Update countdown function
      function updateCountdown() {
        const elapsed = Date.now() - startTime;
        const remaining = expiryTime - elapsed;
        
        if (remaining <= 0) {
          countdownContainer.textContent = 'Invoice expired';
          return false;
        }
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        countdownContainer.textContent = `Payment expires in: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        return true;
      }
      
      // Initial countdown update
      updateCountdown();
      
      // Update countdown every second
      const countdownInterval = setInterval(() => {
        if (!updateCountdown()) {
          clearInterval(countdownInterval);
        }
      }, 1000);
      
      // Start polling for payment status
      const checkInterval = setInterval(async () => {
        try {
          const checkResponse = await fetchWithRetry(`${checkUrl}/check/${response.payment.id}`);
          const checkData = await checkResponse.json();
          
          if ('status' in checkData && checkData.status === 'paid') {
            clearInterval(checkInterval);
            clearInterval(countdownInterval);
            resolve(checkData);
          }
        } catch (error) {
          console.error('Payment check error:', error);
        }
      }, 2000);
      
      // Set a timeout to clear the interval after payment expires
      setTimeout(() => {
        clearInterval(checkInterval);
        clearInterval(countdownInterval);
        if (document.contains(container)) {
          countdownContainer.textContent = 'Invoice expired. Please try again.';
          reject('Timeout');
        }
      }, expiryTime);
    });
  }
  
  // Cashu payment handler
  async function handleCashuPayment(response) {
    return new Promise((resolve, reject) => {
      // Create Cashu payment UI
      const container = document.createElement('div');
      container.className = 'buzz-zap-body';
      
      const title = document.createElement('p');
      title.textContent = 'Your Cashu token is ready:';
      
      const tokenField = document.createElement('div');
      tokenField.className = 'buzz-zap-field';
      
      const tokenInput = document.createElement('textarea');
      tokenInput.className = 'buzz-zap-textarea';
      tokenInput.value = response.payment.token;
      tokenInput.readOnly = true;
      tokenInput.rows = 4;
      
      // Generate QR code for cashu token
      const qrContainer = document.createElement('div');
      qrContainer.className = 'buzz-zap-qr';
      
      const qrCode = document.createElement('img');
      qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(response.payment.token)}&size=200x200`;
      qrCode.alt = 'Cashu Token QR Code';
      qrContainer.appendChild(qrCode);
      
      const copyButton = document.createElement('button');
      copyButton.className = 'buzz-zap-btn buzz-zap-btn-primary';
      copyButton.style.marginTop = '8px';
      copyButton.style.width = '100%';
      copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> <span style="margin-left:8px">Copy Token</span>';
      copyButton.onclick = function() {
        tokenInput.select();
        document.execCommand('copy');
        copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> <span style="margin-left:8px">Copied!</span>';
        
        setTimeout(() => {
          copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> <span style="margin-left:8px">Copy Token</span>';
        }, 2000);
      };
      
      const instructions = document.createElement('p');
      instructions.className = 'buzz-zap-note';
      instructions.innerHTML = 'Scan this QR or paste the token in your Cashu wallet.<br>This token contains the value to complete the payment.';
      
      // Try to use cashu wallet if available
      const walletButton = document.createElement('button');
      walletButton.className = 'buzz-zap-btn buzz-zap-btn-primary';
      walletButton.style.marginTop = '15px';
      walletButton.style.width = '100%';
      walletButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg> <span style="margin-left:8px">Open in Cashu Wallet</span>';
      
      // Attempt to open in Cashu wallet
      walletButton.onclick = function() {
        try {
          window.location.href = `cashu:${encodeURIComponent(response.payment.token)}`;
          setTimeout(() => {
            // If we're still here after a delay, assume it failed
            const note = document.createElement('p');
            note.className = 'buzz-zap-note';
            note.style.color = 'orange';
            note.textContent = 'If nothing happened, you may not have a Cashu wallet installed or configured.';
            container.insertBefore(note, instructions.nextSibling);
          }, 1500);
        } catch (error) {
          console.error('Failed to open Cashu wallet:', error);
        }
      };
      
      // Buttons container
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'buzz-zap-footer';
      
      const closeButton = document.createElement('button');
      closeButton.className = 'buzz-zap-btn buzz-zap-btn-outline';
      closeButton.textContent = 'Close';
      closeButton.onclick = () => {
        resolve(response);
      };
      
      const doneButton = document.createElement('button');
      doneButton.className = 'buzz-zap-btn buzz-zap-btn-primary';
      doneButton.textContent = 'Done';
      doneButton.onclick = () => {
        resolve(response);
      };
      
      buttonContainer.append(closeButton, doneButton);
      tokenField.append(tokenInput, copyButton);
      container.append(title, qrContainer, tokenField, walletButton, instructions);
      container.appendChild(buttonContainer);
      
      // Replace the modal body
      const modalBody = document.querySelector('.buzz-zap-body');
      modalBody.innerHTML = '';
      modalBody.appendChild(container);
    });
  }
  
  // Success screen
  async function showSuccessScreen(response) {
    return new Promise((resolve) => {
      const container = document.createElement('div');
      container.className = 'buzz-zap-success';
      
      const icon = document.createElement('div');
      icon.className = 'buzz-zap-icon';
      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      
      const title = document.createElement('h3');
      title.textContent = config.i18n.successMessage;
      
      const message = document.createElement('p');
      message.textContent = 'Thank you for your support!';
      
      // Show transaction details if available
      if (response.payment && response.payment.id) {
        const details = document.createElement('p');
        details.className = 'buzz-zap-note';
        details.innerHTML = `Transaction ID: <br><span style="font-family: monospace;">${response.payment.id}</span>`;
        container.appendChild(details);
      }
      
      const doneButton = document.createElement('button');
      doneButton.className = 'buzz-zap-btn buzz-zap-btn-primary';
      doneButton.style.marginTop = '20px';
      doneButton.textContent = 'Done';
      doneButton.onclick = () => {
        resolve(response);
        closeModal();
      };
      
      container.append(icon, title, message, doneButton);
      
      // Replace the modal body
      const modalBody = document.querySelector('.buzz-zap-body');
      modalBody.innerHTML = '';
      modalBody.appendChild(container);
    });
  }
  
  // Error screen
  async function showErrorScreen(error) {
    return new Promise((resolve) => {
      const container = document.createElement('div');
      container.className = 'buzz-zap-error';
      
      const icon = document.createElement('div');
      icon.className = 'buzz-zap-icon';
      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-circle"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
      
      const title = document.createElement('h3');
      title.textContent = config.i18n.errorMessage;
      
      const message = document.createElement('p');
      message.textContent = error.message || 'An error occurred during payment processing.';
      
      const closeButton = document.createElement('button');
      closeButton.className = 'buzz-zap-btn buzz-zap-btn-primary';
      closeButton.style.marginTop = '20px';
      closeButton.textContent = 'Close';
      closeButton.onclick = () => {
        resolve(null);
        closeModal();
      };
      
      // Retry button
      const retryButton = document.createElement('button');
      retryButton.className = 'buzz-zap-btn buzz-zap-btn-outline';
      retryButton.style.marginTop = '10px';
      retryButton.textContent = 'Try Again';
      retryButton.onclick = () => {
        const event = new Event('retry');
        container.dispatchEvent(event);
      };
      
      container.append(icon, title, message, closeButton, retryButton);
      
      // Replace the modal body
      const modalBody = document.querySelector('.buzz-zap-body');
      modalBody.innerHTML = '';
      modalBody.appendChild(container);
    });
  }
  
  // Create spinner for loading state
  function createSpinner(color) {
    const spinner = document.createElement('div');
    spinner.className = 'buzz-zap-spinner';
    return spinner;
  }
  
  // Loading screen
  function createLoadingScreen() {
    const container = document.createElement('div');
    container.className = 'buzz-zap-loading';
    
    const spinner = createSpinner();
    spinner.className = 'buzz-zap-loading-spinner';
    
    const message = document.createElement('p');
    message.textContent = config.i18n.loadingMessage;
    
    container.append(spinner, message);
    return container;
  }
  
  // Process payment
  async function processPayment(pubkey, options) {
    try {
      // Validate pubkey
      if (!validatePubkey(pubkey)) {
        throw new Error('Invalid public key format');
      }
      
      // Get the zap URL
      const zapUrl = getZapUrl(pubkey);
      
      // Prepare the query parameters
      const params = new URLSearchParams();
      params.append('amount', options.amount.toString());
      params.append('method', options.method);
      if (options.comment) {
        params.append('comment', options.comment);
      }
      if (options.event_id) {
        params.append('event_id', options.event_id);
      }
      if (options.relay) {
        params.append('relay', options.relay);
      }
      
      // Make the API call with retry
      const response = await fetchWithRetry(`${zapUrl}?${params.toString()}`);
      const json = await response.json();
      
      // Handle error responses
      if (json.status !== 'ok') {
        throw new Error(json.message || config.i18n.errorMessage);
      }
      
      // Handle different payment methods
      switch (json.payment.method) {
        case 'lightning':
          await handleLightningPayment(json, zapUrl);
          break;
        case 'cashu':
          await handleCashuPayment(json);
          break;
        case 'ark':
          // Future: implement Ark payment flow
          await showSuccessScreen(json);
          break;
        default:
          // General success screen for other methods
          await showSuccessScreen(json);
      }
      
      // Call the success callback
      options.onSuccess(json);
      return json;
      
    } catch (error) {
      console.error('Payment error:', error);
      return showErrorScreen(error);
    }
  }
  
  // Main modal API
  const BuzzZapModal = {
    // Open the modal
    open: async function(pubkey, options = {}) {
      // Merge options with defaults
      const mergedOptions = Object.assign({
        amount: 1000, // millisats
        method: config.defaultMethod,
        comment: '',
        theme: config.defaultTheme || 'dark',
        title: config.i18n.title,
        position: 'center',
        event_id: null,
        relay: null,
        onSuccess: () => {},
        onClose: () => {}
      }, options);
      
      // Set theme
      let isDark = mergedOptions.theme === 'dark';
      
      // Check if modal already exists
      if (document.getElementById('buzz-zap-modal')) {
        return;
      }
      
      // Create the modal container
      const modal = document.createElement('div');
      modal.id = 'buzz-zap-modal';
      modal.className = `buzz-zap-modal ${config.containerClass}`.trim();
      
      // Add styles
      const styles = document.createElement('style');
      styles.textContent = createStyles(isDark);
      
      // Create modal content
      const content = document.createElement('div');
      content.className = 'buzz-zap-content';
      
      // Add styles and content to modal
      modal.append(styles, content);
      
      // Close handler
      const handleClose = () => {
        closeModal();
        mergedOptions.onClose();
      };
      
      // Create UI elements
      const fragment = document.createDocumentFragment();
      
      // Header
      const header = document.createElement('div');
      header.className = 'buzz-zap-header';
      
      const titleEl = document.createElement('div');
      titleEl.style.display = 'flex';
      titleEl.style.alignItems = 'center';
      
      // Add logo if configured
      if (config.logo) {
        const logo = document.createElement('img');
        logo.src = config.logo;
        logo.className = 'buzz-zap-logo';
        titleEl.appendChild(logo);
      }
      
      titleEl.appendChild(document.createTextNode(mergedOptions.title));
      
      const closeButton = document.createElement('button');
      closeButton.className = 'buzz-zap-close';
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Close');
      closeButton.onclick = handleClose;
      
      header.append(titleEl, closeButton);
      fragment.appendChild(header);
      
      // Body
      const body = document.createElement('div');
      body.className = 'buzz-zap-body';
      
      // Amount field
      const amountField = document.createElement('div');
      amountField.className = 'buzz-zap-field';
      
      const amountLabel = document.createElement('label');
      amountLabel.className = 'buzz-zap-label';
      amountLabel.textContent = config.i18n.amountLabel;
      
      const amountWrapper = document.createElement('div');
      amountWrapper.className = 'buzz-zap-amount-field';
      
      const currencySymbol = document.createElement('span');
      currencySymbol.className = 'buzz-zap-currency';
      currencySymbol.textContent = '₿';
      
      const amountInput = document.createElement('input');
      amountInput.className = 'buzz-zap-input';
      amountInput.type = 'number';
      amountInput.value = (mergedOptions.amount / 1000).toString(); // Convert msats to sats
      amountInput.min = '1';
      amountInput.step = '1';
      amountInput.setAttribute('aria-label', 'Amount in satoshis');
      
      // Preset amount buttons
      const presetContainer = document.createElement('div');
      presetContainer.className = 'buzz-zap-preset';
      
      const presetAmounts = [21, 100, 1000, 5000, 21000];
      presetAmounts.forEach(amount => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = amount.toLocaleString();
        button.className = mergedOptions.amount === amount * 1000 ? 'active' : '';
        button.onclick = function() {
          amountInput.value = amount.toString();
          mergedOptions.amount = amount * 1000;
          
          // Update active state
          presetAmounts.forEach((amt, i) => {
            presetContainer.children[i].className = 1000 * Number(amountInput.value) === amt * 1000 ? 'active' : '';
          });
        };
        presetContainer.appendChild(button);
      });
      
      amountWrapper.append(currencySymbol, amountInput);
      amountField.append(amountLabel, amountWrapper, presetContainer);
      
      // Method field
      const methodField = document.createElement('div');
      methodField.className = 'buzz-zap-field';
      
      const methodLabel = document.createElement('label');
      methodLabel.className = 'buzz-zap-label';
      methodLabel.textContent = config.i18n.methodLabel;
      
      const methodSelect = document.createElement('select');
      methodSelect.className = 'buzz-zap-select';
      methodSelect.setAttribute('aria-label', 'Payment method');
      
      const methods = {
        'lightning': config.i18n.lightning,
        'cashu': config.i18n.cashu,
        'ark': config.i18n.ark
      };
      
      Object.entries(methods).forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        option.selected = mergedOptions.method === value;
        methodSelect.appendChild(option);
      });
      
      methodField.append(methodLabel, methodSelect);
      
      // Comment field
      const commentField = document.createElement('div');
      commentField.className = 'buzz-zap-field';
      
      const commentLabel = document.createElement('label');
      commentLabel.className = 'buzz-zap-label';
      commentLabel.textContent = config.i18n.commentLabel;
      
      const commentInput = document.createElement('textarea');
      commentInput.className = 'buzz-zap-textarea';
      commentInput.rows = 2;
      commentInput.value = mergedOptions.comment || '';
      commentInput.setAttribute('aria-label', 'Comment');
      commentInput.placeholder = 'Optional message to include with payment';
      
      commentField.append(commentLabel, commentInput);
      
      // Append fields to body
      body.append(amountField, methodField, commentField);
      
      // Footer
      const footer = document.createElement('div');
      footer.className = 'buzz-zap-footer';
      
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'buzz-zap-btn buzz-zap-btn-outline';
      cancelBtn.textContent = config.i18n.cancelButton;
      cancelBtn.onclick = handleClose;
      
      const payBtn = document.createElement('button');
      payBtn.className = 'buzz-zap-btn buzz-zap-btn-primary';
      payBtn.textContent = config.i18n.payButton;
      
      footer.append(cancelBtn, payBtn);
      
      // Append everything to fragment
      fragment.append(header, body, footer);
      
      // Add fragment to content
      content.appendChild(fragment);
      
      // Add modal to document
      document.body.appendChild(modal);
      
      // Make modal visible with animation
      setTimeout(() => {
        modal.classList.add('visible');
      }, 10);
      
      // Event listeners
      amountInput.addEventListener('input', () => {
        const value = Number(amountInput.value);
        if (!isNaN(value) && value > 0) {
          mergedOptions.amount = value * 1000; // Convert to msats
          
          // Update active state of preset buttons
          presetAmounts.forEach((amt, i) => {
            presetContainer.children[i].className = 1000 * Number(amountInput.value) === amt * 1000 ? 'active' : '';
          });
        }
      });
      
      methodSelect.addEventListener('change', () => {
        mergedOptions.method = methodSelect.value;
      });
      
      commentInput.addEventListener('input', () => {
        mergedOptions.comment = commentInput.value;
      });
      
      // Handle keyboard events
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          handleClose();
        } else if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
          payBtn.click();
        }
      });
      
      // Pay button click handler
      payBtn.addEventListener('click', async function() {
        // Disable the pay button and show loading
        payBtn.disabled = true;
        payBtn.textContent = 'Processing...';
        
        // Show loading screen
        body.innerHTML = '';
        body.appendChild(createLoadingScreen());
        
        try {
          await processPayment(pubkey, mergedOptions);
        } catch (error) {
          console.error('Payment error:', error);
          const errorScreen = await showErrorScreen(error);
          
          // Set up retry handler
          errorScreen.addEventListener('retry', () => {
            body.innerHTML = '';
            body.appendChild(createLoadingScreen());
            processPayment(pubkey, mergedOptions).catch(console.error);
          });
        }
      });
    },
    
    // Promise-based version
    openAsync: function(pubkey, options = {}) {
      return new Promise((resolve, reject) => {
        options.onSuccess = (data) => {
          resolve(data);
        };
        
        options.onClose = () => {
          reject(new Error('Payment cancelled'));
        };
        
        this.open(pubkey, options);
      });
    },
    
    // Update configuration
    config: function(newConfig) {
      Object.assign(config, newConfig);
      return this;
    },
    
    // Close the modal programmatically
    close: closeModal
  };
  
  // Check if document is ready before exporting
  function docReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(fn, 1);
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }
  
  // Export to window when document is ready
  docReady(() => {
    window.BuzzZapModal = BuzzZapModal;
  });
})();
