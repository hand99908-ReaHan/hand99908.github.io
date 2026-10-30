/* IT integration values. The test URL defaults to the actual hosted page. */
window.FAMILY_CONFIG = {
  release: "review-20261030-r2",
  brandLogo: "./assets/official-logo.jpg",
  brandLogoIsPlaceholder: false,
  brandShareImage: "./assets/share-cover.png",
  wechatShareImage: "./assets/share-square.png",
  publicH5Url: "",
  officialWebsite: "https://jiarenyouban.com.cn/",
  officialDownloadPage: "https://jiarenyouban.com.cn/download/",
  officialDownloadQRCode: "./assets/app-download-qr.png",
  iosAppStoreUrl: "https://apps.apple.com/cn/app/id6758881837",
  androidOfficialDownloadUrl: "https://a.app.qq.com/o/simple.jsp?pkgname=com.jiarenyouban.jryb",
  androidPackage: "com.jiarenyouban.jryb",
  androidMarkets: {
    huawei: "appmarket://details?id=com.jiarenyouban.jryb",
    honor: "honor-market://details?id=com.jiarenyouban.jryb",
    xiaomi: "mimarket://details?id=com.jiarenyouban.jryb",
    vivo: "vivomarket://details?id=com.jiarenyouban.jryb",
    oppo: "oppomarket://details?id=com.jiarenyouban.jryb"
  },
  /* Enable after IT authorizes the deployed H5 domain in the official account. */
  wechatSignatureEndpoint: "",
  wechatJsSdkConfig: null,
  wechatSdkUrl: "https://res.wx.qq.com/open/js/jweixin-1.6.0.js",
  personaImages: {
    "女": {C:"./assets/persona/女C.png",S:"./assets/persona/女S.png",N:"./assets/persona/女N.png",L:"./assets/persona/女L.png"},
    "男": {Q:"./assets/persona/男Q.png",P:"./assets/persona/男P.png",W:"./assets/persona/男W.png",X:"./assets/persona/男X.png"}
  },
  personaPlaceholders: [],
  homeThumbnails: {
    C:"./assets/persona/女C.png",S:"./assets/persona/女S.png",N:"./assets/persona/女N.png",L:"./assets/persona/女L.png"
  },
  poster: {
    finalDesign: true, width: 941, height: 1672,
    images: {
      "女C":"./assets/posters/女C.png", "女S":"./assets/posters/女S.png",
      "女N":"./assets/posters/女N.png", "女L":"./assets/posters/女L.png",
      "男Q":"./assets/posters/男Q.png", "男P":"./assets/posters/男P.png",
      "男W":"./assets/posters/男W.png", "男X":"./assets/posters/男X.png"
    }
  }
};
