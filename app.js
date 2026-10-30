(function(){
  "use strict";
  var D=window.FAMILY_QUIZ_DATA, C=window.FAMILY_CONFIG, S=window.FAMILY_SHARE_DATA, E=window.FamilyQuizEngine;
  var P=D&&D.ui_policy||{}, app=document.getElementById("app"), modal=document.getElementById("modal"), modalContent=document.getElementById("modal-content");
  var version=window.FAMILY_DATA_VERSION, storageKey="jryb-real-style-20261029";
  function freshState(){return {version:version,screen:"home",sex:null,index:0,drafts:{"女":Array(8).fill(null),"男":Array(8).fill(null)}};}
  var state=freshState(), result=null, poster=null, posterRun=0, locked=false, advanceTimer=null, mountedAt=0, toastTimer=null, storageAvailable=true, lastFocus=null;
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function save(){try{sessionStorage.setItem(storageKey,JSON.stringify(state));}catch(e){storageAvailable=false;}}
  function clear(){try{sessionStorage.removeItem(storageKey);}catch(e){}}
  function validDraft(a){return Array.isArray(a)&&a.length===8&&a.every(function(v){return v===null||/^[ABCD]$/.test(v);});}
  function restore(){
    try{
      var s=JSON.parse(sessionStorage.getItem(storageKey)||"null");if(!s)return;
      if(s.version!==version||!s.drafts||!validDraft(s.drafts["女"])||!validDraft(s.drafts["男"])||!["home","question","result"].includes(s.screen)||![null,"女","男"].includes(s.sex)||!Number.isInteger(s.index)||s.index<0||s.index>7){clear();return;}
      state=s;
      if(s.screen!=="home"&&!s.sex){state=freshState();return;}
      if(s.sex)state.drafts[s.sex==="女"?"男":"女"]=Array(8).fill(null);
      if(s.sex){
        var first=state.drafts[s.sex].indexOf(null);
        if(first!==-1&&(s.screen==="result"||s.index>first)){state.screen="question";state.index=first;}
      }
    }catch(e){clear();}
  }
  function handleInvite(){
    var u=new URL(location.href);
    if(u.searchParams.get("invite")==="1"){clear();state=freshState();u.searchParams.delete("invite");u.hash="";history.replaceState(null,"",u.href);return true;}
    return false;
  }
  function track(name,params){window.dispatchEvent(new CustomEvent("family-quiz-event",{detail:{name:name,params:params||{}}}));}
  function toast(text){clearTimeout(toastTimer);var t=document.getElementById("toast");t.textContent=text;t.classList.add("visible");toastTimer=setTimeout(function(){t.classList.remove("visible");},3400);}
  function platform(){return /MicroMessenger/i.test(navigator.userAgent)?"wechat":/iPhone|iPad|iPod/i.test(navigator.userAgent)?"ios":/Android/i.test(navigator.userAgent)?"android":"desktop";}
  function safeWeb(value){try{var u=new URL(value);return u.protocol==="https:"?u.href:"";}catch(e){return "";}}
  function officialEntry(){return safeWeb(C.publicH5Url);}
  function testLink(){
    var base=officialEntry()||(/^https?:$/.test(location.protocol)?location.href:"");if(!base)return "";
    var u=new URL(base);u.search="";u.hash="";u.searchParams.set("source","personality_h5");u.searchParams.set("campaign","real_style");u.searchParams.set("invite","1");return u.href;
  }
  function appUrl(value){var v=safeWeb(value);if(!v)return "";var u=new URL(v);u.searchParams.set("source","personality_h5");return u.href;}
  function invalidatePoster(){posterRun++;if(poster){if(!poster.original)URL.revokeObjectURL(poster.url);poster=null;}}
  function persistRoute(push){var route={familyQuiz:true,screen:state.screen,sex:state.sex,index:state.index};try{if(push)history.pushState(route,"",location.href);else history.replaceState(route,"",location.href);}catch(e){}}
  function go(screen,opts){
    opts=opts||{};if(advanceTimer){clearTimeout(advanceTimer);advanceTimer=null;}locked=false;
    if(state.screen==="result"&&screen!=="result")invalidatePoster();
    state.screen=screen;if(opts.sex)state.sex=opts.sex;if(Number.isInteger(opts.index))state.index=opts.index;
    save();persistRoute(opts.push!==false);render();
  }
  function showModal(html){lastFocus=document.activeElement;modalContent.innerHTML=html;modal.scrollTop=0;if(!modal.open)modal.showModal();}
  function closeModal(){if(modal.open)modal.close();if(lastFocus&&document.contains(lastFocus))lastFocus.focus({preventScroll:true});}
  function homeConfirm(){
    if(state.screen==="home"){window.scrollTo({top:0});return;}
    showModal('<h2 id="modal-title" class="modal-title">回到首页？</h2><p class="modal-copy">本次答案会保留。选择另一版本时，会从头开始测试。</p><div class="modal-buttons"><button class="secondary-button" id="stay-here">继续当前测试</button><button class="primary" id="go-home">返回首页</button></div>');
    document.getElementById("stay-here").onclick=closeModal;
    document.getElementById("go-home").onclick=function(){closeModal();go("home");};
  }
  function resetAll(){invalidatePoster();result=null;clear();state=freshState();go("home");toast("可以重新选择版本，看看这次的真实画风");}
  function isPlaceholder(code){return C.personaPlaceholders.includes(code);}
  function imageHtml(code,className){
    return '<img class="'+esc(className||"")+'" src="'+esc(C.personaImages[code[0]][code[1]])+'" alt="'+esc(D.result_content[code[0]][code[1]].name)+(isPlaceholder(code)?"，角色形象待补齐":"")+'" data-persona-image="'+esc(code)+'" decoding="async">';
  }
  function attachImageFallbacks(){
    app.querySelectorAll("[data-persona-image]").forEach(function(img){img.onerror=function(){
      var code=img.dataset.personaImage,src=img.getAttribute("src"),box=document.createElement("div");
      box.className="image-fallback";box.innerHTML='<b>'+esc(D.result_content[code[0]][code[1]].name)+'</b><span>图片暂时没加载出来</span><button>重新加载图片</button>';
      box.querySelector("button").onclick=function(){box.replaceWith(img);img.src=src;};img.replaceWith(box);
    };});
  }
  function footer(){
    return '<footer class="result-footer"><p>仅供趣味娱乐，结果不代表专业心理测评。</p><div class="footer-actions"><button class="text-link" data-action="reset">'+esc(P.retest_enabled?"重新测一次":"")+'</button><button class="text-link" data-action="privacy">隐私说明</button></div></footer>';
  }
  function renderHome(){
    var count=state.sex?state.drafts[state.sex].filter(Boolean).length:0;
    var resume=count?'<div class="resume"><p>'+state.sex+'生版 · 已完成 '+count+'/8 题</p><button id="resume-last">'+(count===8?"查看本次结果":"继续上次答题")+' ↗</button></div>':"";
    var art=["C","S","N","L"].map(function(k,i){return '<div class="character-card character-'+i+'"><img src="'+esc(C.homeThumbnails[k])+'" alt="" decoding="async"><span>'+esc(D.result_content["女"][k].labels[0])+'</span></div>';}).join("");
    app.innerHTML='<div class="page-enter"><p class="eyebrow">生活趣味人格测试</p><h1 class="home-title" tabindex="-1" aria-label="'+esc(P.test_title)+'"><span class="title-lead">别装了！</span><span class="title-line">8道题测出</span><span class="title-line title-bottom">你的真实画风</span></h1><p class="home-sub">'+esc(P.subtitle)+'</p><div class="character-collage" aria-hidden="true"><span class="collage-spark">✧</span>'+art+'<span class="collage-spark last">✧</span></div><div class="intro-rule"><span><b>8</b>道生活小题</span><span><b>8</b>种有趣画风</span><span><b>0</b>标准答案</span></div><p class="first-instinct">'+esc(P.default_tips)+'</p><div class="start-grid"><button class="start-button" data-start="女">开始女生版 <span class="button-arrow" aria-hidden="true">↗</span></button><button class="start-button secondary" data-start="男">开始男生版 <span class="button-arrow" aria-hidden="true">↗</span></button></div>'+resume+'<p class="home-footnote">无需登录，凭第一反应选择。<br>仅供趣味娱乐，结果不代表专业心理测评。</p><div class="home-footer"><button class="text-link" data-action="privacy">隐私说明</button></div></div>';
    app.querySelectorAll("[data-start]").forEach(function(b){b.onclick=function(){
      var sex=b.dataset.start;
      if(state.sex===sex&&state.drafts[sex].some(Boolean)){
        showModal('<h2 id="modal-title" class="modal-title">继续这次测试？</h2><p class="modal-copy">你在'+sex+'生版已有答案，可以继续，也可以从头开始。</p><div class="modal-buttons"><button class="secondary-button" id="start-fresh">重新开始</button><button class="primary" id="start-resume">继续上次</button></div>');
        document.getElementById("start-fresh").onclick=function(){closeModal();start(sex);};
        document.getElementById("start-resume").onclick=function(){closeModal();resumeDraft(sex);};
      }else start(sex);
    };});
    var b=document.getElementById("resume-last");if(b)b.onclick=function(){resumeDraft(state.sex);};
  }
  function start(sex){
    invalidatePoster();result=null;state.drafts={"女":Array(8).fill(null),"男":Array(8).fill(null)};
    track("version_selected",{edition:sex});go("question",{sex:sex,index:0});
  }
  function resumeDraft(sex){var i=state.drafts[sex].indexOf(null);go(i===-1?"result":"question",{sex:sex,index:i===-1?7:i});}
  function renderQuestion(){
    var q=D.questions[state.sex][state.index],chosen=state.drafts[state.sex][state.index];
    app.innerHTML='<div class="page-enter"><div class="quiz-top"><button class="back-button" id="previous"><span aria-hidden="true">←</span> '+(state.index===0?"选择版本":"上一题")+'</button><span class="edition">'+state.sex+'生版</span></div><div class="progress-info"><span class="question-index">第 <b>'+String(state.index+1).padStart(2,"0")+'</b> / 8 题</span><small>凭第一反应选择</small></div><div class="progress-track" role="progressbar" aria-label="答题进度" aria-valuemin="0" aria-valuemax="8" aria-valuenow="'+(state.index+1)+'"><span style="width:'+((state.index+1)*12.5)+'%"></span></div><section class="question-main"><h1 class="question-title" id="question-title" tabindex="-1">'+esc(q.stem)+'</h1><div class="options" role="radiogroup" aria-labelledby="question-title">'+q.options.map(function(o){return '<button class="option'+(chosen===o.id?" selected":"")+'" role="radio" aria-checked="'+(chosen===o.id)+'" data-option="'+o.id+'"><span class="option-letter" aria-hidden="true">'+o.id+'</span><span class="option-text">'+esc(o.text)+'</span><span class="option-check" aria-hidden="true">✓</span></button>';}).join("")+'</div>'+(chosen?'<button class="quiz-next" id="next-saved">'+(state.index===7?"重新查看结果":"保留此答案，下一题 →")+'</button>':"")+'</section></div>';
    document.getElementById("previous").onclick=function(){if(locked)return;go(state.index===0?"home":"question",{index:Math.max(0,state.index-1)});};
    var options=Array.from(app.querySelectorAll("[data-option]"));
    options.forEach(function(b,i){b.onclick=function(){select(b.dataset.option);};b.onkeydown=function(e){var diff=["ArrowRight","ArrowDown"].includes(e.key)?1:["ArrowLeft","ArrowUp"].includes(e.key)?-1:0;if(diff){e.preventDefault();options[(i+diff+4)%4].focus();}};});
    var n=document.getElementById("next-saved");if(n)n.onclick=function(){select(chosen);};mountedAt=performance.now();
  }
  function select(answer){
    if(locked||state.screen!=="question"||!/^[ABCD]$/.test(answer)||performance.now()-mountedAt<160)return;
    locked=true;invalidatePoster();result=null;state.drafts[state.sex][state.index]=answer;save();
    track("question_answered",{edition:state.sex,question_no:state.index+1,option_id:answer});
    app.querySelectorAll("[data-option]").forEach(function(b){b.disabled=true;b.classList.toggle("selected",b.dataset.option===answer);b.setAttribute("aria-checked",String(b.dataset.option===answer));});
    var index=state.index;advanceTimer=setTimeout(function(){
      advanceTimer=null;locked=false;
      if(index<7){go("question",{index:index+1});return;}
      var first=state.drafts[state.sex].indexOf(null);
      if(first!==-1){toast("先把这道题补上，就能看到结果啦");go("question",{index:first});return;}
      try{result=E.classify(D,state.sex,state.drafts[state.sex]);track("quiz_completed",{edition:state.sex,persona_code:result.persona_code});go("result");}catch(e){showCalculationError();}
    },300);
  }
  function showCalculationError(){
    locked=false;app.innerHTML='<section class="error-state"><h1>结果暂时没算出来</h1><p>你的答案已保留，可以重新计算，或返回改选。</p><button class="primary" id="retry-result">重新计算</button><button class="text-link" id="edit-error">返回答题</button></section>';
    document.getElementById("retry-result").onclick=function(){go("result");};document.getElementById("edit-error").onclick=function(){go("question",{index:7});};
  }
  function renderResult(){
    try{result=E.classify(D,state.sex,state.drafts[state.sex]);}catch(e){showCalculationError();return;}
    var r=result.result_content,code=result.sex+result.persona_code,buddy=D.result_content[r.buddy[0]][r.buddy[1]];
    app.innerHTML='<article class="page-enter" data-result-code="'+esc(code)+'"><div class="result-topline"><p class="eyebrow">你的真实画风，藏不住了</p><button class="text-link" data-action="edit">修改答案</button></div><div class="result-art" data-section="persona-image">'+imageHtml(code)+'</div><div class="result-heading"><small>测出来，你是</small><h1 class="persona-name" id="result-title" tabindex="-1" data-section="name">'+esc(r.name)+'</h1><p class="one-liner" data-section="one-liner">'+esc(r.one_liner)+'</p><div class="labels" data-section="labels">'+r.labels.map(function(t){return '<span class="label">'+esc(t)+'</span>';}).join("")+'</div></div><section class="section portrait-copy" data-section="intro"><h2 class="section-title"><span class="section-no">01</span>人格自画像</h2>'+r.intro.map(function(t){return '<p>'+esc(t)+'</p>';}).join("")+'</section><section class="quote-block" data-section="quote"><span class="micro-label">经典语句</span><p>'+esc(r.quote)+'</p></section><div class="trait-row" data-section="bug"><h3><span aria-hidden="true">↯</span> 隐藏BUG</h3><p>'+esc(r.bug)+'</p></div><div class="trait-row" data-section="core"><h3><span aria-hidden="true">✧</span> 核心优点</h3><p>'+esc(r.core)+'</p></div><section class="section"><h2 class="section-title"><span class="section-no">02</span>你的最佳拍档</h2><div class="buddy-card"><div data-section="buddy"><span class="micro-label">和这一款，很合拍</span><h3>'+esc(buddy.name)+'</h3><p class="buddy-why">'+esc(r.buddy_why)+'</p></div><div data-section="buddy-image">'+imageHtml(r.buddy,"buddy-image")+'</div><p class="buddy-oneliner" data-section="buddy-one-liner">'+esc(buddy.one_liner)+'</p><div class="buddy-scene" data-section="buddy-scene"><span class="micro-label">相处名场面</span><p>'+esc(r.buddy_scene)+'</p></div></div></section><section class="result-share" data-section="share"><h2>晒一晒你的真实画风</h2><p>保存你的人格海报，也看看家人朋友是哪一款</p><button class="primary" id="generate-poster">'+esc(P.share_primary_button)+' <span aria-hidden="true">↗</span></button></section><section class="brand-conversion" data-section="brand-download"><div class="brand-inline"><img src="'+esc(C.brandLogo)+'" alt="家人有伴"><span class="brand-lockup"><b>家人有伴</b><span>Care-Like-Family</span></span></div><p class="brand-intro">'+esc(P.brand_intro)+'</p><p class="brand-slogan">'+esc(P.brand_slogan)+'</p><button class="secondary-button app-interest" id="app-cta">'+esc(P.app_button)+' <span aria-hidden="true">↗</span></button></section>'+footer()+'</article>';
    document.getElementById("generate-poster").onclick=generatePoster;
    document.getElementById("app-cta").onclick=function(){track("app_cta_click",{edition:state.sex,persona_code:result.persona_code});openApp();};
    attachImageFallbacks();track("result_view",{edition:state.sex,persona_code:result.persona_code});
  }
  function render(){
    if(state.screen==="home")renderHome();else if(state.screen==="question")renderQuestion();else renderResult();
    app.querySelectorAll('[data-action="privacy"]').forEach(function(b){b.onclick=showPrivacy;});
    app.querySelectorAll('[data-action="reset"]').forEach(function(b){b.onclick=resetAll;});
    app.querySelectorAll('[data-action="edit"]').forEach(function(b){b.onclick=function(){go("question",{index:7});};});
    window.scrollTo({top:0,behavior:"instant"});
    var focus=state.screen==="question"?document.getElementById("question-title"):state.screen==="result"?document.getElementById("result-title"):null;
    if(focus)focus.focus({preventScroll:true});
  }
  function copyNow(value){
    var ta=document.createElement("textarea"),active=document.activeElement;
    ta.value=value;ta.setAttribute("readonly","");ta.style.cssText="position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;";
    (modal.open?modalContent:document.body).appendChild(ta);ta.focus({preventScroll:true});ta.select();ta.setSelectionRange(0,ta.value.length);
    var ok=false;try{ok=document.execCommand("copy");}catch(e){}ta.remove();
    if(active&&document.contains(active))active.focus({preventScroll:true});return ok;
  }
  async function copyText(value,success,title,after){
    var ok=false;
    try{if(navigator.clipboard&&typeof navigator.clipboard.writeText==="function"){await navigator.clipboard.writeText(value);ok=true;}}catch(e){}
    if(!ok)ok=copyNow(value);
    if(ok){toast(success);if(after)after();return true;}
    showModal('<h2 id="modal-title" class="modal-title">手动复制'+esc(title)+'</h2><p class="modal-copy">浏览器没允许自动复制，请长按下方内容，全选后复制。</p><textarea readonly class="manual-copy" id="manual-copy" aria-label="'+esc(title)+'">'+esc(value)+'</textarea><div class="modal-stack"><button class="secondary-button" id="select-all">选中全部内容</button></div>');
    document.getElementById("select-all").onclick=function(){var t=document.getElementById("manual-copy");t.focus();t.select();t.setSelectionRange(0,t.value.length);};return false;
  }
  function copyPersona(){if(!result)return;return copyText(S[result.sex+result.persona_code].copy,"专属朋友圈文案已复制","朋友圈文案",function(){track("copy_share_text",{persona_code:result.persona_code});});}
  async function generatePoster(){
    if(!result)return;var b=document.getElementById("generate-poster");if(!b||b.disabled)return;
    b.disabled=true;b.textContent="正在生成你的海报…";var run=++posterRun,key=state.sex+state.drafts[state.sex].join("");
    try{
      var generated=poster||await window.FamilyPoster.generate({result:result,data:D,config:C});
      if(run!==posterRun||state.screen!=="result"||key!==state.sex+state.drafts[state.sex].join("")){if(generated!==poster&&!generated.original)URL.revokeObjectURL(generated.url);return;}
      poster=generated;track("poster_generated",{edition:state.sex,persona_code:result.persona_code});showPoster();
    }catch(e){
      showModal('<h2 id="modal-title" class="modal-title">海报暂时没生成</h2><p class="modal-copy">'+esc(e.message||"请检查网络后重试")+'</p><div class="modal-stack"><button class="primary" id="poster-retry">重新生成</button><button class="secondary-button" id="copy-without-poster">先复制朋友圈文案</button></div>');
      document.getElementById("poster-retry").onclick=function(){closeModal();generatePoster();};document.getElementById("copy-without-poster").onclick=copyPersona;
    }finally{if(document.contains(b)){b.disabled=false;b.innerHTML=esc(P.share_primary_button)+' <span aria-hidden="true">↗</span>';}}
  }
  function showPoster(){
    if(!poster||!result)return;
    var current=poster,copy=S[result.sex+result.persona_code].copy;
    showModal('<h2 id="modal-title" class="modal-title">这就是我的真实画风</h2><img class="poster-image" src="'+esc(poster.url)+'" alt="'+esc(result.persona_name)+'人格海报，可长按保存"><div class="modal-stack"><button class="primary" id="save-poster">保存图片</button><button class="secondary-button" id="poster-copy">复制专属朋友圈文案</button><button class="secondary-button" id="poster-system-share">分享海报给朋友</button></div><section class="share-guide" id="poster-share-guide" hidden><h3>分享到朋友圈</h3><p id="guide-copy-status"></p><ol><li>保存上方海报到相册</li><li>打开微信朋友圈，选择这张海报</li><li>粘贴文案，确认后发布</li></ol></section><div class="poster-link-row"><button class="text-link" id="share-test-link">分享测试链接 ↗</button></div><label class="copy-label" for="persona-share-copy">你的专属朋友圈文案</label><textarea readonly class="share-copy" id="persona-share-copy" aria-label="专属朋友圈文案">'+esc(copy)+'</textarea>');
    document.getElementById("save-poster").onclick=savePoster;
    document.getElementById("poster-copy").onclick=async function(){var ok=await copyPersona();if(ok&&document.getElementById("poster-copy"))document.getElementById("poster-copy").textContent="已复制 · 再复制一次";};
    document.getElementById("poster-system-share").onclick=sharePoster;
    document.getElementById("share-test-link").onclick=showLinkShare;
    var text=document.getElementById("persona-share-copy");text.style.height="auto";text.style.height=(text.scrollHeight+4)+"px";
    window.FamilyPoster.prepareFile(current).catch(function(){/* Saving the original remains available. */});
  }
  function savePoster(){
    if(!poster)return;
    if(platform()==="wechat"){toast("请长按上方海报，选择保存图片");return;}
    var a=document.createElement("a");a.href=poster.url;a.download=poster.filename;document.body.appendChild(a);a.click();a.remove();
    track("poster_saved",{persona_code:result.persona_code,stage:"download_requested"});toast("已发起图片下载，也可以长按海报保存");
  }
  async function sharePoster(){
    if(!poster||!result)return;
    var current=poster,personaCode=result.persona_code,text=S[result.sex+result.persona_code].copy,file=poster.file,copyPromise;
    try{copyPromise=navigator.clipboard&&typeof navigator.clipboard.writeText==="function"?navigator.clipboard.writeText(text).then(function(){return true;},function(){return copyNow(text);}):Promise.resolve(copyNow(text));}catch(e){copyPromise=Promise.resolve(copyNow(text));}
    var nativeShare=null;
    try{if(platform()!=="wechat"&&file&&navigator.share&&navigator.canShare&&navigator.canShare({files:[file]}))nativeShare=Promise.resolve(navigator.share({files:[file],title:P.test_title,text:text})).then(function(){return {ok:true};},function(error){return {error:error};});}catch(e){}
    var copied=await copyPromise;
    if(copied)track("copy_share_text",{persona_code:personaCode});
    if(nativeShare){var outcome=await nativeShare;if(outcome.ok){toast("已打开系统分享，请在所选应用中确认发送");return;}if(outcome.error&&outcome.error.name==="AbortError"){toast("已取消分享，海报仍可保存");return;}}
    if(poster!==current||!modal.open)return;
    var guide=document.getElementById("poster-share-guide");if(!guide){showPoster();guide=document.getElementById("poster-share-guide");}
    guide.hidden=false;document.getElementById("guide-copy-status").textContent=copied?"文案已复制，发布时直接粘贴即可。":"请先点击复制文案，再保存海报。";
    guide.scrollIntoView({block:"nearest",behavior:"smooth"});
    if(copied)toast("文案已复制，保存海报后即可去朋友圈分享");
  }
  function showLinkShare(){
    var url=testLink();
    showModal('<h2 id="modal-title" class="modal-title">邀请朋友，一起测测</h2><div class="test-link-card"><img class="link-cover" id="link-cover" src="'+esc(C.brandShareImage)+'" alt="8种人格一起亮相的绿色趣味手绘分享封面"><div class="test-link-card-copy"><span>家人有伴 · 趣味人格测试</span><p class="link-title">'+esc(P.public_sharing_title)+'</p><p>8道生活趣味题，看看朋友是哪一款。</p></div></div>'+(url?'<textarea readonly class="manual-copy compact" id="test-link-text" aria-label="测试链接">'+esc(url)+'</textarea><div class="modal-stack"><button class="primary" id="copy-test-link">复制测试链接</button><button class="secondary-button" id="native-share-link">分享测试链接</button></div>':'<p class="share-instruction">请在在线测试页面中打开此卡片，即可复制网址发给朋友。</p>')+'<p class="share-instruction" id="link-share-tip">'+(platform()==="wechat"?'点右上角“···”，选择发送给朋友或分享到朋友圈。':'朋友打开链接后，会从首页开始自己的测试。')+'</p><div class="poster-link-row"><button class="text-link" id="back-to-poster">← 返回我的海报</button></div>');
    var cover=document.getElementById("link-cover");cover.onerror=function(){this.hidden=true;};
    var b=document.getElementById("copy-test-link");if(b)b.onclick=function(){copyText(url,"测试链接已复制，发给朋友一起测测吧","测试链接",function(){track("copy_test_link");});};
    var n=document.getElementById("native-share-link");if(n)n.onclick=async function(){
      if(platform()!=="wechat"&&navigator.share){try{await navigator.share({title:P.public_sharing_title,text:window.FAMILY_SHARE_METADATA.description,url:url});return;}catch(e){if(e.name==="AbortError")return;}}
      var ok=await copyText(url,"测试链接已复制","测试链接");var tip=document.getElementById("link-share-tip");if(tip)tip.textContent=platform()==="wechat"?'点右上角“···”，选择发送给朋友或分享到朋友圈。':ok?'链接已复制，可以粘贴到微信发给朋友。':'请长按上方网址复制。';
    };
    document.getElementById("back-to-poster").onclick=showPoster;
  }
  function showDownloads(){
    var target=window.FamilyDownloads.target(C,navigator.userAgent,navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
    showModal('<h2 id="modal-title" class="modal-title download-title">让陪伴，多一种方式</h2><div class="brand-inline"><img src="'+esc(C.brandLogo)+'" alt="家人有伴"><span class="brand-lockup"><b>家人有伴</b><span>Care-Like-Family</span></span></div><div class="download-qr-card"><span class="download-tag">家人有伴 App</span><img class="download-qr" id="app-download-qr" src="'+esc(C.officialDownloadQRCode)+'" alt="扫码下载家人有伴App"><p>扫码下载，把陪伴带在身边</p></div><div class="modal-stack downloads"><a class="primary" id="download-app" href="'+esc(target.href)+'" rel="noopener noreferrer">点击下载家人有伴 App <span aria-hidden="true">↗</span></a></div><p class="download-platform-note">'+(target.wechat?'微信内如遇限制，请点右上角“···”，选择在浏览器中打开。':target.os==="desktop"?'支持 iOS / Android · 也可以用手机扫码下载':'即将前往对应应用商店；若未打开，可使用官方下载页。')+'</p><a class="download-fallback" href="'+esc(C.officialDownloadPage)+'" rel="noopener noreferrer">官方下载页 ↗</a><a class="official-site-card" id="official-website" href="'+esc(C.officialWebsite)+'" target="_blank" rel="noopener noreferrer"><span class="site-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5h14M5 17.5h14"/></svg></span><span><b>去家人有伴官网看看</b><small>jiarenyouban.com.cn</small></span><span class="site-arrow" aria-hidden="true">↗</span></a><div class="poster-link-row"><button class="text-link" id="downloads-close">返回结果</button></div>');
    window.FamilyDownloads.bind(document.getElementById("download-app"),C);
    document.getElementById("downloads-close").onclick=closeModal;
    document.getElementById("app-download-qr").onerror=function(){this.hidden=true;toast("二维码暂未加载，可点击下载按钮继续");};
    track("download_landing_view",{platform:platform()});
  }
  function openApp(){showDownloads();}
  function showPrivacy(){
    showModal('<h2 id="modal-title" class="modal-title">测试与隐私说明</h2><div class="privacy-copy"><p>'+esc(P.test_title)+'是一款趣味互动测试。结果仅供娱乐，不代表专业心理测评，也不提供心理诊断、医疗建议或健康评估。</p><p>无需登录，不索取手机号、通讯录、定位、照片或健康数据。本版本不向服务器发送答案，未接入第三方统计。</p><p>答案仅保存在当前浏览器会话中，用于刷新或返回后继续。关闭会话、浏览器清理数据或限制存储时，进度可能无法保留。'+(!storageAvailable?"当前浏览器未允许保存进度，刷新后需重新开始。":"")+'</p><p>“重新测一次”会清除本次答案。选择另一测试版本时，也会清空之前的答案。</p><p>分享的是人格海报或统一测试入口，图片和链接都不包含姓名、联系方式或完整答题记录。不会生成可公开查看他人答案的专属网址。</p></div><div class="modal-stack"><button class="secondary-button" id="privacy-close">我知道了</button></div>');
    document.getElementById("privacy-close").onclick=closeModal;
  }
  document.getElementById("brand-home").onclick=homeConfirm;document.getElementById("modal-close").onclick=closeModal;
  modal.addEventListener("click",function(e){if(e.target===modal){var r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
  window.addEventListener("popstate",function(e){
    closeModal();if(advanceTimer){clearTimeout(advanceTimer);advanceTimer=null;}locked=false;invalidatePoster();
    var r=e.state;
    if(!r||!r.familyQuiz||!["home","question","result"].includes(r.screen))state.screen="home";
    else{
      state.screen=r.screen;state.sex=r.sex;state.index=r.index;
      if(state.screen!=="home"&&(!state.sex||state.drafts[state.sex].some(function(v,i){return i<state.index&&!v;})))state.screen="home";
      if(state.screen==="result"&&state.drafts[state.sex].some(function(v){return !v;}))state.screen="home";
    }save();render();
  });
  try{
    E.validateData(D);if(!C||!C.personaImages||!S||Object.keys(S).length!==8||P.show_internal_codes!==false||P.service_cards_enabled!==false)throw new Error("资料不完整");
    var logo=document.getElementById("brand-logo");logo.src=C.brandLogo;logo.alt="家人有伴";logo.onerror=function(){this.onerror=null;this.src="./assets/logo-placeholder.svg";this.alt="官方Logo暂未加载";};
    try{sessionStorage.removeItem("jryb-family-persona-v1");}catch(e){}
    if(!handleInvite())restore();persistRoute(false);render();if(window.FamilyWechat)window.FamilyWechat.init(testLink());track("quiz_view",{platform:platform(),content_version:D.content_version});
  }catch(e){
    app.innerHTML='<section class="error-state"><h1>测试资料暂时没加载好</h1><p>请检查网络后重试，已保存的答题进度会保留。</p><button class="primary" id="reload-data">重新加载</button></section>';
    document.getElementById("reload-data").onclick=function(){location.reload();};
  }
})();
