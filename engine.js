(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory();else root.FamilyQuizEngine=factory();})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
  function validateData(data) {
    if (!data || !data.questions || !data.personas || !data.result_content || !data.anchors || !data.scoring) throw new Error("测试资料未加载完整");
    ["女","男"].forEach(function (sex) {
      var codes = Object.keys(data.personas[sex]);
      if (codes.length !== 4 || data.questions[sex].length !== 8) throw new Error("题库结构不完整");
      data.questions[sex].forEach(function (q, i) {
        if (q.q !== i+1 || !q.stem || q.options.length !== 4) throw new Error("题目结构不完整");
        q.options.forEach(function (o,j) {
          if(o.id !== "ABCD"[j] || !o.text || !codes.includes(o.primary) || Object.values(o.points).reduce(function(a,b){return a+b;},0)!==4) throw new Error("选项计分资料异常");
          Object.entries(o.points).forEach(function(pair){if(!codes.includes(pair[0]) || !Number.isInteger(pair[1]) || pair[1]<0) throw new Error("分值资料异常");});
        });
      });
      codes.forEach(function(c) {
        var r=data.result_content[sex][c];
        if(!r || r.labels.length!==3 || r.intro.length!==3) throw new Error("人格资料不完整");
        ["name","one_liner","quote","bug","core","buddy","buddy_why","buddy_scene"].forEach(function(k){if(typeof r[k]!=="string" || !r[k]) throw new Error("人格字段缺失");});
        if(!data.result_content[r.buddy[0]] || !data.result_content[r.buddy[0]][r.buddy[1]]) throw new Error("最佳拍档资料缺失");
      });
    });
    return true;
  }

/** Personality quiz scoring reference. Load quiz_config.json at runtime. */
function classify(config, sex, answers) {
  if (sex === '女生' || sex === '女生版') sex = '女';
  if (sex === '男生' || sex === '男生版') sex = '男';
  const ans = (Array.isArray(answers) ? answers.join('') : answers).toUpperCase().trim();
  if (!['女','男'].includes(sex) || !/^[ABCD]{8}$/.test(ans)) throw new Error('Invalid sex/answers');
  const questions = config.questions[sex];
  const codes = Object.keys(config.personas[sex]);
  const raw=Object.fromEntries(codes.map(k=>[k,0]));
  const main=Object.fromEntries(codes.map(k=>[k,0]));
  questions.forEach((q, i) => {
    const o = q.options['ABCD'.indexOf(ans[i])];
    for(const [k,v] of Object.entries(o.points)) raw[k]+=v;
    main[o.primary]+=1;
  });
  if(Object.values(raw).reduce((a,b)=>a+b,0)!==32) throw new Error('invalid total score');
  const exposure=Object.fromEntries(codes.map(k=>[k,questions.reduce((a,q)=>a+q.options.reduce((b,o)=>b+(o.points[k]??0),0),0)]));
  const score=Object.fromEntries(codes.map(k=>[k,4*raw[k]-exposure[k]]));
  let tied=codes.filter(k=>score[k]===Math.max(...codes.map(c=>score[c])));
  let decisionStage='corrected_score';
  if(tied.length>1){const m=Math.max(...tied.map(k=>main[k]));tied=tied.filter(k=>main[k]===m);decisionStage='primary_count';}
  const anchors=Object.fromEntries(codes.map(k=>[k,config.anchors[sex][k].reduce((n,[q,idx])=>n+Number(ans[q-1]==='ABCD'[idx]),0)]));
  if(tied.length>1){const m=Math.max(...tied.map(k=>anchors[k]));tied=tied.filter(k=>anchors[k]===m);decisionStage='anchor_count';}
  if(tied.length>1){const priority=(config.scoring.fallback_priority ?? config.scoring.fallback)[sex];tied.sort((a,b)=>priority.indexOf(a)-priority.indexOf(b));decisionStage='fixed_fallback';}
  const code=tied[0];
  return {sex, answers:ans, persona_code:code, persona_name:config.personas[sex][code].name, result_content:config.result_content[sex][code], score,decisionStage};
}

return {validateData:validateData,classify:classify};
});
