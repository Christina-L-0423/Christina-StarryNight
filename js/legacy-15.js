

(function(){
'use strict';
var tmr=null;
function el(){return document.getElementById('mini-pw')}
function btn(){return document.getElementById('ma-minipw')}
function isOn(){try{return !!(typeof _mp!=='undefined'&&_mp&&_mp.ui&&_mp.ui.miniPw)}catch(e){return false}}
function cur(){try{return (typeof _pw!=='undefined'&&_pw&&_pw.idx>=0&&_pw.list&&_pw.list[_pw.idx])||null}catch(e){return null}}
function escT(x){return String(x).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function setTx(el,txt,speed){txt=String(txt||'');if(!el)return;if(el._mqT===txt)return;el._mqT=txt;el.classList.remove('mq');el.style.removeProperty('--mqw');el.style.removeProperty('--mqd');el.textContent=txt;if(!txt||document.body.classList.contains('ib-reduce'))return;var w=el.scrollWidth,cw=el.clientWidth;if(!cw||w-cw<=2)return;var gap=28;el.innerHTML='<span class="mq-tr"><span>'+escT(txt)+'</span><span aria-hidden="true">'+escT(txt)+'</span></span>';el.style.setProperty('--mqw',(w+gap)+'px');el.style.setProperty('--mqd',Math.max(5,Math.round((w+gap)/(speed||24)))+'s');el.classList.add('mq')}/* v206-p：超长就整段滚动循环（文字 + 28px 空隙接着再来一遍，线性匀速）；减少动效下保持省略号 */
function line(rec,sec){var L=rec&&rec.lyrics,segs=L&&L.segments;if(!segs||!segs.length)return '';var t='';for(var i=0;i<segs.length;i++){var st=segs[i]&&segs[i].start;if(st==null)break;if(st<=sec)t=segs[i].text||'';else break}return String(t||'').replace(/\s+/g,' ').trim()}
function musicOpen(){var m=document.getElementById('music-app');return !!(m&&m.classList.contains('open'))}
function locked(){var lk=document.getElementById('lockscr');return !!(lk&&lk.offsetParent!==null)}
function paint(){var b=el();if(!b)return;var onn=isOn();if(onn&&!tmr)start();var rec=cur();var vis=onn&&!!rec&&!musicOpen()&&!locked();
  var bt=btn();if(bt)bt.classList.toggle('on',isOn());
  if(!vis){if(!b.hidden)b.hidden=true;return}
  if(b.hidden)b.hidden=false;
  var a=null;try{a=_pwA()}catch(e){}var playing=!!(a&&!a.paused&&!a.ended);b.classList.toggle('playing',playing);
  var t=document.getElementById('mpw-t'),s=document.getElementById('mpw-s'),l=document.getElementById('mpw-l');
  var tt=String(rec.title||rec.name||'—'),ss=String(rec.artist||rec.album||'');
  setTx(t,tt);setTx(s,ss);
  var cv=b.querySelector('.mpw-disc b');if(cv){var c=String(rec.cover||'');if(cv.getAttribute('data-c')!==c){cv.setAttribute('data-c',c);cv.style.backgroundImage=c?('url("'+c.replace(/"/g,'%22')+'")'):'';b.classList.toggle('cov',!!c)}}
  var ly=line(rec,(a&&a.currentTime)||0);if(l&&l._mqT!==ly){setTx(l,ly,36);l.classList.toggle('none',!ly)}
}
function start(){if(tmr)return;tmr=setInterval(paint,600)}
function stop(){if(tmr){clearInterval(tmr);tmr=null}var b=el();if(b)b.hidden=true}
async function toggle(){try{await loadMP()}catch(e){}_mp.ui=_mp.ui||{};_mp.ui.miniPw=!_mp.ui.miniPw;try{await saveMP()}catch(e){}
  var bt=btn();if(bt)bt.classList.toggle('on',!!_mp.ui.miniPw);
  if(_mp.ui.miniPw){start();toast('迷你播放器已开：离开 MUSIC 后留在屏幕左侧')}else{stop();toast('迷你播放器已关')}}
function _vpW(){try{return Math.round((window.visualViewport&&window.visualViewport.width)||document.documentElement.clientWidth||window.innerWidth)}catch(e){return window.innerWidth}}function _vpH(){try{return Math.round((window.visualViewport&&window.visualViewport.height)||window.innerHeight)}catch(e){return window.innerHeight}}
function clampPos(x,y,b){var w=Math.round((b.getBoundingClientRect&&b.getBoundingClientRect().width)||b.offsetWidth||182),h=Math.round((b.getBoundingClientRect&&b.getBoundingClientRect().height)||b.offsetHeight||60),W=_vpW(),H=_vpH();return{x:Math.max(4,Math.min(W-w-4,x)),y:Math.max(4,Math.min(H-h-4,y))}}
function applyPos(){var b=el();if(!b)return;var p=null;try{p=_mp&&_mp.ui&&_mp.ui.miniPwPos}catch(e){}if(!p||typeof p.x!=='number'||typeof p.y!=='number')return;var W=window.innerWidth,H=window.innerHeight;var q=clampPos(Math.round(p.x*W),Math.round(p.y*H),b);b.style.left=q.x+'px';b.style.top=q.y+'px';b.style.bottom='auto'}
function drag(b){var sx=0,sy=0,ox=0,oy=0,moved=false,pid=null;
  b.addEventListener('pointerdown',function(e){if(e.button!==undefined&&e.button!==0)return;pid=e.pointerId;moved=false;sx=e.clientX;sy=e.clientY;var r=b.getBoundingClientRect();ox=r.left;oy=r.top;try{b.setPointerCapture(pid)}catch(x){}});
  b.addEventListener('pointermove',function(e){if(pid===null||e.pointerId!==pid)return;var dx=e.clientX-sx,dy=e.clientY-sy;if(!moved&&Math.abs(dx)+Math.abs(dy)<7)return;moved=true;b.classList.add('drag');var q=clampPos(ox+dx,oy+dy,b);b.style.left=q.x+'px';b.style.top=q.y+'px';b.style.bottom='auto'});
  function settle(save){b.classList.remove('drag');var r=b.getBoundingClientRect(),W=_vpW(),w=Math.round(r.width||b.offsetWidth||182),x=r.left,y=r.top;if(x<28)x=4;else if(W-(x+w)<28)x=W-w-4;/* v221-p：松手离左右边 28px 内自动贴边（贴到 4px），贴边不再靠手指能不能推到底 */var q=clampPos(x,y,b);b.style.left=q.x+'px';b.style.top=q.y+'px';b.style.bottom='auto';if(save)(async function(){try{await loadMP();_mp.ui=_mp.ui||{};_mp.ui.miniPwPos={x:q.x/W,y:q.y/_vpH()};await saveMP()}catch(x){}})()}
  function end(e){if(pid===null||(e&&e.pointerId!==pid))return;pid=null;try{b.releasePointerCapture(e.pointerId)}catch(x){}
    if(moved){settle(true);return}
    b.hidden=true;try{if(window.openMusicApp)openMusicApp()}catch(x){}}
  b.addEventListener('pointerup',end);b.addEventListener('pointercancel',function(e){if(pid===null)return;pid=null;if(moved)settle(true);else b.classList.remove('drag')});
  window.addEventListener('resize',applyPos);
}
function bind(){
  var bt=btn();if(bt)bt.addEventListener('click',function(e){e.stopPropagation();toggle()});
  var b=el();if(b)drag(b);
  try{if(typeof _pwPaint==='function'){var _pp0=_pwPaint;_pwPaint=function(){var r=_pp0.apply(this,arguments);try{paint()}catch(e){}return r}}}catch(e){}
  (async function(){try{await loadMP()}catch(e){}applyPos();if(isOn())start();else paint()})();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
