(function () {
  "use strict";
  // Menu-share metadata only; H5 has no timeline composer API.
  var C=window.FAMILY_CONFIG, M=window.FAMILY_SHARE_METADATA;
  var signingUrl=location.href.split("#")[0];
  var api={status:"inactive",signingUrl:signingUrl};window.FamilyWechat=api;
  function sdk() {
    if(window.wx)return Promise.resolve(window.wx);
    return new Promise(function(resolve,reject){
      var script=document.createElement("script"),timer=setTimeout(function(){reject(new Error("sdk_timeout"));},10000);
      script.src=C.wechatSdkUrl;script.onload=function(){clearTimeout(timer);window.wx?resolve(window.wx):reject(new Error("sdk_unavailable"));};
      script.onerror=function(){clearTimeout(timer);reject(new Error("sdk_unavailable"));};document.head.appendChild(script);
    });
  }
  api.init=async function(link) {
    if(!/MicroMessenger/i.test(navigator.userAgent)||location.protocol==="file:"||!link)return;
    if(!C.wechatSignatureEndpoint&&!C.wechatJsSdkConfig)return;
    try{
      api.status="loading";
      var wx=await sdk(),signed=C.wechatJsSdkConfig;
      if(!signed){
        var url=new URL(C.wechatSignatureEndpoint,location.href);url.searchParams.set("url",signingUrl);
        var response=await fetch(url.href);if(!response.ok)throw new Error("signature_unavailable");
        signed=await response.json();signed=signed.data||signed;
      }
      if(!signed.appId||!signed.timestamp||!signed.nonceStr||!signed.signature)throw new Error("invalid_signature");
      wx.ready(function(){
        var image=new URL(C.wechatShareImage||C.brandShareImage,location.href).href;
        wx.updateAppMessageShareData({title:M.title,desc:M.description,link:link,imgUrl:image});
        wx.updateTimelineShareData({title:M.title,link:link,imgUrl:image});api.status="ready";
      });
      wx.error(function(){api.status="unavailable";});
      wx.config({debug:false,appId:signed.appId,timestamp:signed.timestamp,nonceStr:signed.nonceStr,signature:signed.signature,
        jsApiList:["updateAppMessageShareData","updateTimelineShareData"]});
    }catch(e){api.status="unavailable";}
  };
})();
