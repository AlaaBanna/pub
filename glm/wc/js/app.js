/* ===== State ===== */
var swaps={};
var results={};
var pathView='qf';

/* ===== Group swap ===== */
function oSw(g){
  swaps[g]=!swaps[g];
  for(var i=0;i<R32D.length;i++){
    var m=R32D[i];
    if((m.s1&&m.s1.ty==='g'&&m.s1.g===g)||(m.s2&&m.s2.ty==='g'&&m.s2.g===g)){
      delete results[m.id];
      var ds=gds(m.id);for(var j=0;j<ds.length;j++)delete results[ds[j]];
    }
  }
  toast('Group '+g+': '+(swaps[g]?'1st and 2nd swapped':'Original order restored'));
  safeRender();
}

/* ===== Set knockout winner (click team in bracket) ===== */
function oTC(id,tc){
  var t=gmt(id);if(!t[0]||!t[1])return;if(tc!==t[0]&&tc!==t[1])return;
  var prev=results[id]?results[id].w:null;
  if(prev===tc){delete results[id]}
  else{var sc=results[id]?results[id].sc:'\u2014';var pn=results[id]?results[id].pn:null;results[id]={sc:sc,w:tc,pn:pn}}
  var ds=gds(id);for(var j=0;j<ds.length;j++)delete results[ds[j]];
  safeRender();
}

/* ===== Path view tab ===== */
function setPV(v){pathView=v;renderPath()}

/* ===== Reset ===== */
function resetAll(){
  swaps={};results=JSON.parse(JSON.stringify(INIT));pathView='qf';
  toast('All results reset to original');safeRender();
}

/* ===== Theme toggle ===== */
function toggleTheme(){
  document.body.classList.toggle('light');
  var isL=document.body.classList.contains('light');
  document.getElementById('themeBtn').innerHTML=isL?'<i class="fa-solid fa-moon"></i>':'<i class="fa-solid fa-sun"></i>';
  try{localStorage.setItem('wc26-t',isL?'l':'d')}catch(e){}
}

/* ===== Toast notification ===== */
function toast(msg){
  var ex=document.querySelector('.toast');if(ex)ex.remove();
  var t=document.createElement('div');t.className='toast';t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(function(){t.classList.add('show')},10);
  setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove()},300)},2200);
}

/* ===== Init ===== */
results=JSON.parse(JSON.stringify(INIT));
var gl2=['A','B','C','D','E','F','G','H','I','J','K','L'];
for(var i=0;i<gl2.length;i++)swaps[gl2[i]]=false;
try{if(localStorage.getItem('wc26-t')==='l'){document.body.classList.add('light');document.getElementById('themeBtn').innerHTML='<i class="fa-solid fa-moon"></i>'}}catch(e){}
safeRender();