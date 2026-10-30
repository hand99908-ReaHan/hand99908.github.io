(function () {
  "use strict";
  function target(config, ua, touchIPad) {
    ua = ua || "";
    var wechat = /MicroMessenger/i.test(ua), ios = /iPhone|iPad|iPod/i.test(ua) || !!touchIPad;
    var android = /Android/i.test(ua), fallback = config.officialDownloadPage;
    if (wechat) return {href:fallback, fallback:fallback, os:ios?"ios":android?"android":"other", wechat:true};
    if (ios) return {href:config.iosAppStoreUrl, fallback:fallback, os:"ios", wechat:false};
    if (android) {
      var brand = /honor/i.test(ua)?"honor":/huawei/i.test(ua)?"huawei":/xiaomi|redmi|miui|\bmi[\s/]/i.test(ua)?"xiaomi":/vivo/i.test(ua)?"vivo":/oppo|oneplus/i.test(ua)?"oppo":"";
      var href = config.androidMarkets[brand] || config.androidOfficialDownloadUrl || fallback;
      return {href:href,fallback:fallback,os:"android",wechat:false,externalScheme:!/^https:\/\//.test(href)};
    }
    return {href:fallback,fallback:fallback,os:"desktop",wechat:false};
  }
  function bind(anchor,config) {
    var t = target(config,navigator.userAgent,navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
    anchor.href = t.href;
    anchor.onclick = function (event) {
      if (!t.externalScheme) return;
      event.preventDefault();
      var timer = null;
      function cancel() { clearTimeout(timer); document.removeEventListener("visibilitychange",hidden);window.removeEventListener("pagehide",cancel); }
      function hidden() { if(document.hidden) cancel(); }
      document.addEventListener("visibilitychange",hidden);window.addEventListener("pagehide",cancel);
      timer=setTimeout(function () { cancel(); if(!document.hidden)location.assign(t.fallback); },1800);
      location.assign(t.href);
    };
    return t;
  }
  window.FamilyDownloads = {target:target,bind:bind};
})();
