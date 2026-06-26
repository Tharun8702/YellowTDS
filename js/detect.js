class BotDetector {
  constructor(args) {
    this.monitoring = false;
    this.domain = args.domain || '';
    this.debug = args.debug || false;
    
    this.timeout = args.timeout || 1000;
    this.timeoutId = -1;
    this.activeEventListeners = new Map(); 
   
    this.tzStart = args.tzStart || 0;
    this.tzEnd = args.tzEnd || 0;

    this.selectedTests = args.tests || [];
    this.interactiveTests = {};
    this.passedInteractiveTests = new Set();
    
    this.Tests = {
      KEYDOWN: 'keydown',
      POINTERDOWN: 'pointerdown',
      DEVICEMOTION: 'devicemotion',
      DEVICEORIENTATION: 'deviceorientation',
      TIMEZONE: 'timezone',
      AUDIOCONTEXT: 'audiocontext',
      WEBDRIVER: 'webdriver',
      PLUGINS: 'plugins',
      WEBGL: 'webgl',
      CANVAS: 'canvas',
      SCREEN: 'screen'
    };

    this.nonInteractiveTests = [this.Tests.TIMEZONE, this.Tests.AUDIOCONTEXT, this.Tests.WEBDRIVER, this.Tests.PLUGINS, this.Tests.WEBGL, this.Tests.CANVAS, this.Tests.SCREEN];
    this.interactiveTestNames = [this.Tests.KEYDOWN, this.Tests.POINTERDOWN, this.Tests.DEVICEMOTION, this.Tests.DEVICEORIENTATION];
  }

  log(text) {
    if (this.debug) {
      console.log(text);
    }
  }

  runNonInteractiveTests() {
    this.log('Running non-interactive tests...');
    
    if (this.selectedTests.includes(this.Tests.TIMEZONE)) {
      this.log('Checking timezone...');
      if (!this.checkTimeZone()) {
        this.failTest('timezone');
        return false;
      }
    }

    if (this.selectedTests.includes(this.Tests.AUDIOCONTEXT)) {
      this.log('Checking audio context...');
      if (!this.checkAudioContext()) {
        this.failTest('audiocontext');
        return false;
      }
    }

    if (this.selectedTests.includes(this.Tests.WEBDRIVER)) {
      this.log('Checking webdriver flag...');
      if (!this.checkWebDriver()) {
        this.failTest('webdriver');
        return false;
      }
    }

    if (this.selectedTests.includes(this.Tests.PLUGINS)) {
      this.log('Checking browser plugins...');
      if (!this.checkPlugins()) {
        this.failTest('no_plugins');
        return false;
      }
    }

    if (this.selectedTests.includes(this.Tests.WEBGL)) {
      this.log('Checking WebGL renderer...');
      if (!this.checkWebGL()) {
        this.failTest('webgl');
        return false;
      }
    }

    if (this.selectedTests.includes(this.Tests.CANVAS)) {
      this.log('Checking canvas rendering...');
      if (!this.checkCanvas()) {
        this.failTest('canvas');
        return false;
      }
    }

    if (this.selectedTests.includes(this.Tests.SCREEN)) {
      this.log('Checking screen resolution...');
      if (!this.checkScreen()) {
        this.failTest('screen');
        return false;
      }
    }

    return true; 
  }

  initializeInteractiveTests() {
    const interactiveTestsToRun = this.selectedTests.filter(test => 
      this.interactiveTestNames.includes(test)
    );

    if (interactiveTestsToRun.length === 0) {
      this.log('No interactive tests enabled, calling passfunc');
      this.passfunc();
      return;
    }

    this.log(`Initializing ${interactiveTestsToRun.length} interactive tests: ${interactiveTestsToRun.join(', ')}`);

    interactiveTestsToRun.forEach(test => {
      this.setupInteractiveTest(test);
    });

    this.timeoutId = -1;
    this.log('Waiting indefinitely for user interaction');
  }

  checkInteractiveTestsComplete() {
    const requiredTests = this.selectedTests.filter(test => 
      this.interactiveTestNames.includes(test)
    );
    
    const allPassed = requiredTests.every(test => 
      this.passedInteractiveTests.has(test)
    );

    if (allPassed) {
      this.log('All interactive tests passed!');
      clearTimeout(this.timeoutId);
      this.removeAllEventListeners();
      this.passfunc();
    } else {
      this.log(`Still waiting for: ${requiredTests.filter(test => !this.passedInteractiveTests.has(test)).join(', ')}`);
    }
  }

  removeAllEventListeners() {
    this.log('Removing all active event listeners');
    this.activeEventListeners.forEach((listener, eventType) => {
      window.removeEventListener(eventType, listener);
    });
    this.activeEventListeners.clear();
  }

  failTest(reason) {
    this.log(`Test failed: ${reason}`);
    let script = document.createElement('script');
    script.setAttribute('src', `${this.domain}js/index.php?reason=${reason}`);
    document.body.appendChild(script);
    script.remove();
    this.monitoring = false;
    window.botDetector = null;
  }
  
  passfunc() {
      let url = `${this.domain}js/index.php`;
      const curParams = new URLSearchParams(window.location.search);
      const params = new URLSearchParams();
      if (curParams.size>0)
          params.append('tds_qs', btoa(decodeURIComponent(window.location.search.replace("?", ""))));
      params.append('tds_ref', document.referrer);
      url += `?${params.toString()}`;
      
      let script = document.createElement('script');
      script.setAttribute('src', url);
      document.body.appendChild(script);
      script.remove();
      
      this.monitoring = false;
      window.botDetector = null;
  }

  checkTimeZone() {
    try {
      this.log('Min allowed tz: ' + this.tzStart);
      this.log('Max allowed tz: ' + this.tzEnd);
      let curZone = -(new Date().getTimezoneOffset() / 60);
      this.log('Current tz: ' + curZone);
      return curZone >= this.tzStart && curZone <= this.tzEnd;
    } catch (e) {
      this.log('Failed to check timezone: ' + e);
      return false;
    }
  }

  checkAudioContext() {
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      let context = new AudioContext();
      this.log('Audio engine found!');
      return true;
    } catch (e) {
      this.log('Audio context failed: ' + e);
      return false;
    }
  }

  checkWebDriver() {
    try {
      if (navigator.webdriver) {
        this.log('navigator.webdriver is true');
        return false;
      }
      this.log('navigator.webdriver check passed');
      return true;
    } catch (e) {
      this.log('Failed to check webdriver: ' + e);
      return false;
    }
  }

  checkPlugins() {
    try {
      if (!this.isMobileDevice()) {
        if (navigator.plugins.length > 0) {
          this.log('Plugins check passed');
          return true;
        }
        // Chrome 76+ intentionally hides plugin info (length always 0)
        const ua = navigator.userAgent.toLowerCase();
        const isChrome = /chrome|crios/.test(ua) && !/edge|opr|edg/.test(ua);
        if (isChrome) {
          this.log('Chrome detected, plugins API is hidden, skipping test');
          return true;
        }
        this.log('No browser plugins found on non-mobile device');
        return false;
      }
      this.log('Plugins check passed (mobile)');
      return true;
    } catch (e) {
      this.log('Failed to check plugins: ' + e);
      return false;
    }
  }

  checkWebGL() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        this.log('WebGL not available');
        return false;
      }
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        this.log('WebGL debug info not available');
        return true;
      }
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL).toLowerCase();
      this.log('WebGL vendor: ' + vendor + ', renderer: ' + renderer);
      const headlessIndicators = ['swiftshader', 'llvmpipe', 'mesa', 'google'];
      const isHeadless = headlessIndicators.some(i => renderer.includes(i) || vendor.includes(i));
      if (isHeadless) {
        this.log('Headless WebGL renderer detected');
        return false;
      }
      return true;
    } catch (e) {
      this.log('Failed to check WebGL: ' + e);
      return false;
    }
  }

  checkCanvas() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        this.log('Canvas 2D context not available');
        return false;
      }
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('BotDetectorCanvasTest', 2, 15);
      const dataUrl = canvas.toDataURL();
      if (!dataUrl || dataUrl === 'data:,') {
        this.log('Canvas produced empty output');
        return false;
      }
      this.log('Canvas check passed');
      return true;
    } catch (e) {
      this.log('Failed to check canvas: ' + e);
      return false;
    }
  }

  checkScreen() {
    try {
      const w = screen.width;
      const h = screen.height;
      const cd = screen.colorDepth;
      const pd = screen.pixelDepth;
      this.log('Screen: ' + w + 'x' + h + ' colorDepth:' + cd + ' pixelDepth:' + pd);
      if ((w === 800 && h === 600) || (w === 1024 && h === 768)) {
        this.log('Headless default resolution detected');
        return false;
      }
      if (cd === 0 || pd === 0) {
        this.log('Suspicious screen color/pixel depth');
        return false;
      }
      return true;
    } catch (e) {
      this.log('Failed to check screen: ' + e);
      return false;
    }
  }

  isMobileDevice() {
    const ua = navigator.userAgent.toLowerCase();
    return /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua);
  }

  setupInteractiveTest(test) {
    switch (test) {
      case this.Tests.KEYDOWN:
      case this.Tests.POINTERDOWN:
        const eventListener = (evt) => {
          this.log(`${test} event detected`);
          this.passedInteractiveTests.add(test);
          this.activeEventListeners.delete(test);
          window.removeEventListener(test, eventListener);
          this.checkInteractiveTestsComplete();
        };
        this.activeEventListeners.set(test, eventListener);
        window.addEventListener(test, eventListener);
        break;
        
      case this.Tests.DEVICEORIENTATION:
        this.setupOrientationTest(test);
        break;
        
      case this.Tests.DEVICEMOTION:
        this.setupMotionTest(test);
        break;
    }
  }

  setupOrientationTest(test) {
    let orientationCount = 0;
    let orientation = null;
    let orientdelta = 3;
    let orientdiff = 0;
    let orientdiffmax = 3;
    
    const eventListener = (et) => {
      const { alpha, beta, gamma } = et;
      orientationCount++;
      
      if (orientation) {
        const delta = Math.sqrt(
          Math.pow(alpha - orientation.alpha, 2) +
          Math.pow(beta - orientation.beta, 2) +
          Math.pow(gamma - orientation.gamma, 2)
        );
        this.log(`Orientation: alpha:${alpha} beta:${beta} gamma:${gamma}. Delta:${delta}`);
        if (delta >= orientdelta) {
          orientdiff++;
          this.log(`Orientation Diff found! Delta:${delta}. Found number:${orientdiff}`);
          if (orientdiff >= orientdiffmax) {
            this.log(`Found MAXIMUM orientation diffs: ${orientdiffmax}! Test passed!`);
            this.activeEventListeners.delete(test);
            window.removeEventListener(test, eventListener);
            this.passedInteractiveTests.add(test);
            this.checkInteractiveTestsComplete();
          }
        }
      }
      orientation = { alpha, beta, gamma };
    };
    
    if (this.isAndroidDevice()) {
      this.activeEventListeners.set(test, eventListener);
      window.addEventListener(test, eventListener);
    } else {
      this.log("Not an Android device, orientation test auto-passed!");
      this.passedInteractiveTests.add(test);
      this.checkInteractiveTestsComplete();
    }
  }

  setupMotionTest(test) {
    let motionCount = 0;
    let acceleration = null;
    let acceldelta = 0.5;
    let acceldiff = 0;
    let acceldiffmax = 3;
    
    const eventListener = (et) => {
      let curX = et.acceleration?.x || 0;
      let curY = et.acceleration?.y || 0;
      let curZ = et.acceleration?.z || 0;
      let curMagnitude = Math.sqrt(curX * curX + curY * curY + curZ * curZ);
      this.log(`${test}: X:${curX} Y:${curY} Z:${curZ} Magnitude:${curMagnitude}`);
      motionCount++;
      
      if (acceleration) {
        let prevX = acceleration.x;
        let prevY = acceleration.y;
        let prevZ = acceleration.z;
        let prevMagnitude = Math.sqrt(prevX * prevX + prevY * prevY + prevZ * prevZ);
        
        let curDelta = Math.abs(curMagnitude - prevMagnitude);
        if (curDelta > acceldelta) {
          acceldiff++;
          this.log(`Acceleration diff found! Delta: ${curDelta}. Found number: ${acceldiff}`);
          
          if (acceldiff >= acceldiffmax) {
            this.log(`MAXIMUM acceleration diffs found: ${acceldiffmax}. Test passed!`);
            this.activeEventListeners.delete(test);
            window.removeEventListener(test, eventListener);
            this.passedInteractiveTests.add(test);
            this.checkInteractiveTestsComplete();
          }
        }
      }
      acceleration = { x: curX, y: curY, z: curZ };
    };

    if (this.isAndroidDevice()) {
      this.activeEventListeners.set(test, eventListener);
      window.addEventListener(test, eventListener);
    } else {
      this.log("Not an Android device, motion test auto-passed!");
      this.passedInteractiveTests.add(test);
      this.checkInteractiveTestsComplete();
    }
  }

  isAndroidDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('android');
  }

  monitor() {
    if (this.monitoring) {
      this.log('Already MONITORING!');
      return;
    }

    this.monitoring = true;
    this.log('Starting bot detection...');
    
    if (!this.runNonInteractiveTests()) {
      return; 
    }
    
    this.initializeInteractiveTests();
  }
};


if (!window.botDetector){
  console.log("BOTDETECTOR NOT FOUND, INITIALIZING");
  window.botDetector = new BotDetector({
      debug: {DEBUG},
      timeout: {JSTIMEOUT},
      tests: ["{JSCHECKS}"],
      tzStart: {JSTZMIN},
      tzEnd: {JSTZMAX},
      domain: "{DOMAIN}"
  });
  document.addEventListener('DOMContentLoaded', function() {
      if (window.botDetector){
          console.log("DOMCONTENTLOADED MONITOR STARTING...");
          window.botDetector.monitor();
      }
      else{
          console.log("BOTDETECTOR IS NULL, MONITOR NOT STARTED");
      }
  });
}