/* ===== Helpers ===== */
function fl(c){return TM[c]?TM[c].f:'\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E0073}\u{E0063}\u{E0074}\u{E007F}'}
function tn(c){return TM[c]?TM[c].n:c}
function fr(c){for(var i=0;i<TOP10.length;i++){if(TOP10[i].code===c)return TOP10[i].rank}return 99}
function rkb(c){var r=fr(c);if(r<=10)return'<span class="rb t10">#'+r+'</span>';return'<span class="rb nt">\u2014</span>'}
function gs(v){return v>0?'+'+v:v===0?'0':''+v}

/* ===== Group logic ===== */
function et(gl,pl){var p=pl;if(swaps[gl])p=p===1?2:1;return GR[gl][p-1].t}
function st(sl){if(sl.ty==='g')return et(sl.g,sl.p);if(sl.ty==='3')return TP[sl.i];return null}

/* ===== Match team resolution ===== */
function allMD(){return R32D.concat(R16D).concat(QFD).concat(SFD).concat([FID])}
function findMD(id){var a=allMD();for(var i=0;i<a.length;i++){if(a[i].id===id)return a[i]}return null}

function gmt(id){
  if(id==='third')return gmtLosers();
  var m=findMD(id);
  if(!m)return[null,null];
  if(m.s1)return[st(m.s1),st(m.s2)];
  if(m.fd){var r1=results[m.fd[0]],r2=results[m.fd[1]];return[r1?r1.w:null,r2?r2.w:null]}
  return[null,null];
}

/* 3rd place: SF losers, computed fresh every time (never stored in results) */
function gmtLosers(){
  var t0=gmt('sf_0'),t1=gmt('sf_1'),r0=results['sf_0'],r1=results['sf_1'];
  if(!t0[0]||!t0[1]||!t1[0]||!t1[1]||!r0||!r1)return[null,null];
  return[t0[0]===r0.w?t0[1]:t0[0],t1[0]===r1.w?t1[1]:t1[0]];
}

/* Cascade: find all downstream match IDs (does NOT include 'third') */
function gds(id){
  var all=R16D.concat(QFD).concat(SFD).concat([FID]),d=[];
  for(var i=0;i<all.length;i++){
    var m=all[i];
    if(m.fd&&(m.fd[0]===id||m.fd[1]===id)){
      d.push(m.id);var sub=gds(m.id);for(var j=0;j<sub.length;j++)d.push(sub[j]);
    }
  }
  return d;
}

/* ===== Path analysis ===== */
function getFullPath(tc,maxRd){
  var path=[];
  var rds=[{ms:R32D,lb:'R32'},{ms:R16D,lb:'R16'},{ms:QFD,lb:'QF'},{ms:SFD,lb:'SF'}];
  for(var ri=0;ri<rds.length;ri++){
    if(maxRd==='QF'&&ri>1)break;
    if(maxRd==='SF'&&ri>2)break;
    var roundMs=rds[ri].ms,roundLb=rds[ri].lb;
    for(var mi=0;mi<roundMs.length;mi++){
      var matchDef=roundMs[mi];
      if(!results[matchDef.id])continue;
      var teams=gmt(matchDef.id);
      if(!teams[0]||!teams[1])continue;
      if(teams[0]!==tc&&teams[1]!==tc)continue;
      var opp=teams[0]===tc?teams[1]:teams[0];
      var won=results[matchDef.id].w===tc;
      path.push({round:roundLb,opp:opp,won:won});
      break;
    }
  }
  return path;
}

function getTeamsAt(stage){
  var teams=[],src;
  if(stage==='QF')src=R16D;else if(stage==='SF')src=QFD;else if(stage==='Final')src=SFD;else return teams;
  for(var i=0;i<src.length;i++){if(results[src[i].id]&&results[src[i].id].w)teams.push(results[src[i].id].w)}
  return teams;
}

function pathStr(path){
  var tc=0;for(var i=0;i<path.length;i++){if(fr(path[i].opp)<=10)tc++}
  if(tc===0)return{label:'Easy',color:'easy',tc:0};
  if(tc===1)return{label:'Moderate',color:'moderate',tc:1};
  return{label:'Hard',color:'hard',tc:tc};
}

/* ===== Bracket position calculations ===== */
var CW=160,CH=46,PG=2,SG=20,HG=40;

function cVP(){
  var r32=[],y=0;
  for(var i=0;i<16;i++){r32.push({x:0,y:y});y+=(i%2===0)?CH+PG:CH+SG}
  var r16=[],qf=[];
  for(var i=0;i<8;i++){var a=r32[i*2],b=r32[i*2+1];r16.push({x:CW+HG,y:(a.y+CH/2+b.y+CH/2)/2-CH/2})}
  for(var i=0;i<4;i++){var a=r16[i*2],b=r16[i*2+1];qf.push({x:2*(CW+HG),y:(a.y+CH/2+b.y+CH/2)/2-CH/2})}
  var sf0={x:3*(CW+HG),y:(qf[0].y+CH/2+qf[1].y+CH/2)/2-CH/2};
  var sf1={x:3*(CW+HG),y:(qf[2].y+CH/2+qf[3].y+CH/2)/2-CH/2};
  var fin={x:4*(CW+HG),y:(sf0.y+CH/2+sf1.y+CH/2)/2-CH/2};
  var thi={x:4*(CW+HG),y:fin.y+CH+24};
  return{r32:r32,r16:r16,qf:qf,sf0:sf0,sf1:sf1,fin:fin,thi:thi,totalH:r32[15].y+CH};
}

/* ===== HTML builders ===== */
function bMC(id,t1,t2,x,y){
  if(!t1&&!t2)return'';
  var r=results[id],ck=t1&&t2;
  var c1=r&&r.w===t1?'w':'',c2=r&&r.w===t2?'w':'';
  var k1=ck?'ck':'',k2=ck?'ck':'';
  var s1='',s2='';
  if(r){var p=r.sc.split('-');if(r.pn){var pp=r.pn.split('-');s1='<span class="ts">'+p[0]+'</span><span class="tp">('+pp[0]+')</span>';s2='<span class="ts">'+p[1]+'</span><span class="tp">('+pp[1]+')</span>'}else{s1='<span class="ts">'+p[0]+'</span>';s2='<span class="ts">'+p[1]+'</span>'}}
  var sr=id.indexOf('r32_')===0||id.indexOf('r16_')===0;
  var b1=sr?rkb(t1):'',b2=sr?rkb(t2):'';
  var o1=ck?' onclick="oTC(\''+id+'\',\''+t1+'\')"':'';
  var o2=ck?' onclick="oTC(\''+id+'\',\''+t2+'\')"':'';
  return'<div class="mc" style="left:'+x+'px;top:'+y+'px"><div class="tr '+c1+' '+k1+'"'+o1+'><span class="tf">'+fl(t1)+'</span><span class="tn">'+tn(t1)+'</span>'+b1+s1+'</div><div class="tr '+c2+' '+k2+'"'+o2+'><span class="tf">'+fl(t2)+'</span><span class="tn">'+tn(t2)+'</span>'+b2+s2+'</div></div>';
}

function pC(f1,f2,tgt){
  var ar=f1.x+CW,ac=f1.y+CH/2,br=f2.x+CW,bc=f2.y+CH/2,tl=tgt.x,tc=tgt.y+CH/2,mx=(ar+tl)/2;
  return'<path d="M'+ar+','+ac+' L'+mx+','+ac+' L'+mx+','+tc+'"/><path d="M'+br+','+bc+' L'+mx+','+bc+' L'+mx+','+tc+'"/><path d="M'+mx+','+tc+' L'+tl+','+tc+'"/>';
}

/* ===== Main render ===== */
function render(){
  /* Top 10 */
  var tb=document.getElementById('top10bar'),th='';
  for(var i=0;i<TOP10.length;i++){var t=TOP10[i];th+='<div class="top10-chip"><span class="rk">#'+t.rank+'</span>'+fl(t.code)+' <span style="font-weight:600">'+t.name+'</span><span class="pt">'+Math.round(t.pts)+'</span></div>'}
  tb.innerHTML=th;

  /* Groups */
  var gg=document.getElementById('groupsGrid'),gh='';
  var gl=['A','B','C','D','E','F','G','H','I','J','K','L'];
  for(var li=0;li<gl.length;li++){
    var L=gl[li],teams=GR[L],sw=swaps[L],ord=[0,1,2,3];
    if(sw){var tmp=ord[0];ord[0]=ord[1];ord[1]=tmp}
    var rows='';
    for(var i=0;i<4;i++){
      var t=teams[ord[i]],pl=i+1,gc=t.gd>0?'gp':t.gd<0?'gn':'',pc=pl<=2?'p'+pl:'',qd=pl<=2?'<i class="fa-solid fa-circle qd"></i>':'';
      //rows+='<tr class="'+pc+'"><td>'+pl+'</td><td><span class="fl">'+fl(t.t)+'</span>'+tn(t.t)+qd+'</td><td>'+t.mp+'</td><td>'+t.w+'</td><td>'+t.d+'</td><td>'+t.l+'</td><td>'+t.gf+'</td><td>'+t.ga+'</td><td class="'+gc+'">'+gs(t.gd)+'</td><td style="font-weight:700">'+t.pts+'</td></tr>';
      rows+='<tr class="'+pc+'"><td>'+pl+'</td><td><span class="fl">'+fl(t.t)+'</span>'+t.t+'</td><td>'+t.mp+'</td><td>'+t.w+'</td><td>'+t.d+'</td><td>'+t.l+'</td><td>'+t.gf+'</td><td>'+t.ga+'</td><td class="'+gc+'">'+gs(t.gd)+'</td><td style="font-weight:700">'+t.pts+'</td></tr>';
    }
    gh+='<div class="gc"><div class="gh"><h3>Group '+L+'</h3><button class="sb '+(sw?'on':'')+'" onclick="oSw(\''+L+'\')"><i class="fa-solid fa-arrows-up-down" style="margin-right:3px"></i>Swap 1\u21942</button></div><table class="gt"><thead><tr><th>#</th><th>Team</th><th>MP</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  }
  gg.innerHTML=gh;

  /* Bracket */
  var bk=document.getElementById('bracket'),pos=cVP();
  var tw=4*(CW+HG)+CW;
  var bh='<div class="bk-col-labels" style="width:'+tw+'px">';
  var lbs=['R32','R16','QF','SF','FINAL'];
  for(var i=0;i<5;i++){bh+='<span style="left:'+(i*(CW+HG)+CW/2)+'px">'+lbs[i]+'</span>'}
  bh+='</div><div style="position:relative;width:'+tw+'px;height:'+pos.totalH+'px">';
  var svg='<svg class="bl" width="'+tw+'" height="'+pos.totalH+'">';
  for(var i=0;i<8;i++)svg+=pC(pos.r32[i*2],pos.r32[i*2+1],pos.r16[i]);
  for(var i=0;i<4;i++)svg+=pC(pos.r16[i*2],pos.r16[i*2+1],pos.qf[i]);
  svg+=pC(pos.qf[0],pos.qf[1],pos.sf0);
  svg+=pC(pos.qf[2],pos.qf[3],pos.sf1);
  svg+=pC(pos.sf0,pos.sf1,pos.fin);
  svg+='</svg>';
  bh+=svg;
  for(var i=0;i<16;i++){var t=gmt(R32D[i].id);bh+=bMC(R32D[i].id,t[0],t[1],pos.r32[i].x,pos.r32[i].y)}
  for(var i=0;i<8;i++){var t=gmt(R16D[i].id);bh+=bMC(R16D[i].id,t[0],t[1],pos.r16[i].x,pos.r16[i].y)}
  for(var i=0;i<4;i++){var t=gmt(QFD[i].id);bh+=bMC(QFD[i].id,t[0],t[1],pos.qf[i].x,pos.qf[i].y)}
  var t0=gmt(SFD[0].id);bh+=bMC(SFD[0].id,t0[0],t0[1],pos.sf0.x,pos.sf0.y);
  var t1=gmt(SFD[1].id);bh+=bMC(SFD[1].id,t1[0],t1[1],pos.sf1.x,pos.sf1.y);
  var ft=gmt('final');bh+=bMC('final',ft[0],ft[1],pos.fin.x,pos.fin.y);
  var tl=gmtLosers();bh+=bMC('third',tl[0],tl[1],pos.thi.x,pos.thi.y);
  bh+='<div class="bk-3rd-label" style="left:'+pos.thi.x+'px;top:'+(pos.thi.y-14)+'px">3RD PLACE</div>';
  bh+='</div>';
  bk.innerHTML=bh;

  /* Path analysis */
  renderPath();
}

function renderPath(){
  var tabs=document.getElementById('pathTabs'),pr=document.getElementById('pathRow'),pe=document.getElementById('pathEmpty');
  var hasR16=false,hasQF=false,hasSF=false;
  for(var i=0;i<R16D.length;i++){if(results[R16D[i].id]){hasR16=true;break}}
  for(var i=0;i<QFD.length;i++){if(results[QFD[i].id]){hasQF=true;break}}
  for(var i=0;i<SFD.length;i++){if(results[SFD[i].id]){hasSF=true;break}}
  var th='';
  if(hasR16)th+='<button class="ptab '+(pathView==='qf'?'on':'')+'" onclick="setPV(\'qf\')">Quarter-Finals</button>';
  if(hasQF)th+='<button class="ptab '+(pathView==='sf'?'on':'')+'" onclick="setPV(\'sf\')">Semi-Finals</button>';
  if(hasSF)th+='<button class="ptab '+(pathView==='final'?'on':'')+'" onclick="setPV(\'final\')">Final</button>';
  tabs.innerHTML=th;
  if(!hasR16){pr.innerHTML='';pe.style.display='block';return}
  pe.style.display='none';
  //var maxRd=pathView==='qf'?'QF':'SF';
  var maxRd=pathView==='qf'?'QF':pathView==='sf'?'SF':'ALL';
  //var stageKey=pathView==='final'?'Final':pathView;
  var stageKey=pathView==='final'?'Final':pathView==='qf'?'QF':'SF';
  var teams=getTeamsAt(stageKey);
  var ph='';
  for(var i=0;i<teams.length;i++){
    var team=teams[i],path=getFullPath(team,maxRd);
    if(path.length===0)continue;
    var str=pathStr(path);
    var bc=str.color==='easy'?'var(--green)':str.color==='moderate'?'var(--amber)':'var(--red)';
    var ic=str.color==='easy'?'fa-check-circle':str.color==='moderate'?'fa-exclamation-triangle':'fa-exclamation-circle';
    var dt=str.tc===0?'No top-10 opponent faced':str.tc+' top-10 opponent'+(str.tc>1?'s':'');
    var av=0;for(var j=0;j<path.length;j++){var r=fr(path[j].opp);av+=(r>10?20:r)}
    av=av/path.length;var pct=Math.max(5,(av/20)*100);
    ph+='<div class="pc '+str.color+'"><div class="pt2"><span class="pfl">'+fl(team)+'</span><span class="nm">'+tn(team)+'</span>'+(fr(team)<=10?'<span class="rb t10" style="font-size:10px">#'+fr(team)+'</span>':'')+'</div>';
    for(var j=0;j<path.length;j++){
      var step=path[j],wl=step.won?'<span class="wl ww">W</span>':'<span class="wl ll">L</span>';
      ph+='<div class="po"><div class="oi"><span class="rl">'+step.round+'</span><span class="tf">'+fl(step.opp)+'</span><span>'+tn(step.opp)+'</span></div>'+(fr(step.opp)<=10?'<span class="rb t10">#'+fr(step.opp)+'</span>':'<span class="rb nt">\u2014</span>')+wl+'</div>';
    }
    ph+='<div class="sb3"><div class="sf3" style="width:'+pct+'%;background:'+bc+'"></div></div>';
    ph+='<div class="pb3 '+str.color+'"><i class="fa-solid '+ic+'"></i>'+str.label+' Path \u2014 '+dt+'</div></div>';
  }
  pr.innerHTML=ph;
}

/* Error-safe wrapper: shows errors on page instead of silent blank */
function safeRender(){
  var el=document.getElementById('errDisplay');
  if(el)el.style.display='none';
  try{render()}
  catch(e){
    if(el){el.textContent='Error: '+e.message;el.style.display='block'}
    console.error(e);
  }
}