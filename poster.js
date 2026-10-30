(function () {
  "use strict";
  // Display and download the approved artwork itself; never repaint its text or QR.
  function loadImage(src) {
    return new Promise(function(resolve,reject) {
      if (!src) return reject(new Error("海报图片暂时没加载出来，请重试"));
      var img = new Image(), timer = setTimeout(function () {
        img.onload = img.onerror = null;
        reject(new Error("海报加载超时，请检查网络后重试"));
      }, 15000);
      img.onload = function () { clearTimeout(timer); resolve(img); };
      img.onerror = function () { clearTimeout(timer); reject(new Error("海报图片暂时没加载出来，请重试")); };
      img.src = src;
    });
  }
  async function generate(o) {
    var key = o.result.sex + o.result.persona_code;
    var src = o.config.poster.images[key], img = await loadImage(src);
    return {url:src, source:src, original:true, width:img.naturalWidth, height:img.naturalHeight,
      filename:"真实画风_"+o.result.persona_name+".png", file:null};
  }
  async function prepareFile(poster) {
    if (poster.file) return poster.file;
    if (location.protocol === "file:" || typeof File !== "function") return null;
    var response = await fetch(poster.source, {cache:"force-cache"});
    if (!response.ok) throw new Error("海报暂时无法分享，请保存图片后再试");
    var blob = await response.blob();
    if (blob.type && !/^image\//.test(blob.type)) throw new Error("海报格式暂不支持分享");
    poster.file = new File([blob], poster.filename, {type:"image/png"});
    return poster.file;
  }
  window.FamilyPoster = {generate:generate,prepareFile:prepareFile};
})();
