async function o(){if("serviceWorker"in navigator)try{const e=await navigator.serviceWorker.register("/sw.js",{scope:"/"});return e.installing?console.log("Service worker installing"):e.waiting?console.log("Service worker installed, waiting to activate"):e.active&&console.log("Service worker active"),r(e),e}catch(e){return console.error("Service worker registration failed:",e),null}return null}function r(e){if(!e)return;setInterval(()=>{try{e.update()}catch(n){console.error("Error updating service worker:",n)}},60*60*1e3);let t=!1;navigator.serviceWorker&&navigator.serviceWorker.addEventListener("controllerchange",()=>{t||(t=!0,console.log("New service worker controller, refreshing page"),window.location.reload())}),e&&e.addEventListener("updatefound",()=>{const n=e.installing;n&&n.addEventListener("statechange",()=>{n.state==="installed"&&navigator.serviceWorker.controller&&a()})})}function a(){var t,n;const e=document.getElementById("pwa-notification");e&&(e.classList.remove("hidden"),e.innerHTML=`
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
          <path d="M11 12H3"></path>
          <path d="M16 6H3"></path>
          <path d="M16 18H3"></path>
          <path d="M18 9v6"></path>
          <path d="M21 12h-3"></path>
        </svg>
        <div>
          <p class="font-medium">App update available</p>
          <p class="text-sm text-muted-foreground">A new version of Nostr Buzz is available</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button id="pwa-update-dismiss" class="text-sm border rounded px-3 py-1 hover:bg-muted">
          Later
        </button>
        <button id="pwa-update-now" class="text-sm bg-primary text-primary-foreground rounded px-3 py-1 hover:bg-primary/90">
          Update Now
        </button>
      </div>
    </div>
  `,(t=document.getElementById("pwa-update-dismiss"))==null||t.addEventListener("click",()=>{e.classList.add("hidden")}),(n=document.getElementById("pwa-update-now"))==null||n.addEventListener("click",()=>{window.location.reload()}))}function s(){let e;const t=document.getElementById("pwa-install-button");window.addEventListener("beforeinstallprompt",n=>{n.preventDefault(),e=n,t&&(t.classList.remove("hidden"),t.addEventListener("click",()=>{e.prompt(),e.userChoice.then(i=>{i.outcome==="accepted"&&(console.log("User accepted the install prompt"),t.classList.add("hidden")),e=null})}))}),window.addEventListener("appinstalled",()=>{t&&t.classList.add("hidden"),console.log("PWA was installed"),e=null})}function l(){const e=()=>{const t=navigator.onLine;document.documentElement.dataset.networkStatus=t?"online":"offline",t?document.documentElement.dataset.wasOffline==="true"&&console.log("You are back online!"):console.log("You are offline. Some features may not be available."),document.documentElement.dataset.wasOffline=(!t).toString()};e(),window.addEventListener("online",e),window.addEventListener("offline",e)}function d(){try{setTimeout(()=>{o(),s(),l()},1e3)}catch(e){console.error("Error initializing PWA:",e)}}export{d as i};
