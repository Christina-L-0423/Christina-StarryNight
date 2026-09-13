

(function(){try{
var sp=document.getElementById('ib-splash');if(!sp)return;
var fill=document.getElementById('sp-fill'),pct=document.getElementById('sp-pct'),
    dotsEl=document.getElementById('sp-dots'),wEl=document.getElementById('sp-welcome');
var dark=false;try{dark=localStorage.getItem('ib_m_theme')==='infernal'}catch(e){}
var RM=false;try{RM=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var timers=[],ivs=[],raf=0,dead=false;
function T(f,ms){var t=setTimeout(f,ms);timers.push(t);return t}
function I(f,ms){var t=setInterval(f,ms);ivs.push(t);return t}
function clearAll(){timers.forEach(clearTimeout);ivs.forEach(clearInterval);timers=[];ivs=[];if(raf){cancelAnimationFrame(raf);raf=0}}
function cleanup(){if(dead)return;dead=true;clearAll();try{sp.remove()}catch(e){}
  var st=document.getElementById('ib-splash-style');if(st)st.remove();
  var pc=document.getElementById('ib-splash-precheck');if(pc)pc.remove();
  var fp=document.getElementById('ib-splash-firstpaint');if(fp)fp.remove();
  document.documentElement.classList.remove('sp-dark')}
sp.addEventListener('touchmove',function(e){e.preventDefault()},{passive:false});
var dn=0,dotHold=false;I(function(){if(document.hidden)return;if(dotHold){dotsEl.textContent='';dn=0;dotHold=false;return}dn++;dotsEl.textContent='...'.slice(0,dn);if(dn>=3)dotHold=true},RM?220:320);
var msg='Welcome to '+(dark?'Infernal':'Internal')+' Beyond';
var wDotsEl=null,wdn=0,wdHold=false;
function wDotsStart(){if(wDotsEl)return;
  wEl.textContent='';var ww=document.createElement('span');ww.className='sp-loading-word';ww.textContent=msg;
  wDotsEl=document.createElement('span');wDotsEl.className='sp-dots sp-dots6';ww.appendChild(wDotsEl);wEl.appendChild(ww);
  I(function(){if(document.hidden||!wDotsEl)return;if(wdHold){wDotsEl.textContent='';wdn=0;wdHold=false;return}wdn++;wDotsEl.textContent='......'.slice(0,wdn);if(wdn>=6)wdHold=true},RM?220:320)}
T(function(){var wi=0,wiv=null;wEl.textContent='';wiv=I(function(){if(document.hidden)return;if(wi<msg.length){wEl.textContent=msg.slice(0,++wi)}else{if(wiv)clearInterval(wiv);wDotsStart()}},RM?18:48)},RM?180:920);
var loaded=document.readyState==='complete',t0=performance.now(),hiddenAt=0;
addEventListener('load',function(){loaded=true},{once:true});
function ready(now){if(now-t0>9000)return true;if(!loaded)return false;
  var v=document.getElementById('lk-preveil');return !v||v.classList.contains('off')}
var MIN=RM?1800:5200,fin=false,finT=0,lastPct=-1;
function draw(v){var x=Math.max(0,Math.min(100,v));fill.style.transform='translateZ(0) scaleX('+(x/100).toFixed(4)+')';
  var n=Math.round(x);if(n!==lastPct){lastPct=n;pct.textContent=n+'%'}}
function frame(now){if(dead)return;if(document.hidden){raf=requestAnimationFrame(frame);return}
  var el=now-t0;
  if(!fin){var k=Math.min(1,el/MIN),e=1-Math.pow(1-k,3);draw(e*96);
    if(k>=1&&ready(now)){fin=true;finT=now}}
  else{var q=Math.min(1,(now-finT)/260);draw(96+4*q);
    if(q>=1){finish();return}}
  raf=requestAnimationFrame(frame)}
function finish(){if(dead)return;draw(100);dotsEl.textContent='...';try{if(!wDotsEl)wDotsStart();if(wDotsEl)wDotsEl.textContent='......'}catch(e){}clearAll();sp.classList.add('paused');
  T(function(){if(!dead)sp.classList.add('done')},360);
  T(cleanup,1140)}
function onVis(){if(dead)return;var now=performance.now();
  if(document.hidden){if(!hiddenAt){hiddenAt=now;sp.classList.add('suspended')}}
  else if(hiddenAt){var d=now-hiddenAt;t0+=d;if(fin&&finT)finT+=d;hiddenAt=0;sp.classList.remove('suspended')}}
document.addEventListener('visibilitychange',onVis);
addEventListener('pageshow',function(e){if(e.persisted)cleanup()});
raf=requestAnimationFrame(frame);
}catch(e){try{var bad=document.getElementById('ib-splash');if(bad)bad.remove();var fp=document.getElementById('ib-splash-firstpaint');if(fp)fp.remove();document.documentElement.classList.remove('sp-dark')}catch(x){}}
})();
