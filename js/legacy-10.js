

(function(){
'use strict';
var CAP=window.Capacitor;
var native=false;try{native=!!(CAP&&CAP.isNativePlatform&&CAP.isNativePlatform())}catch(e){}
if(!native){window.IBNative={available:false,platform:'web',has:function(){return false}};return}
var P=(CAP&&CAP.Plugins)||{};
var Shell=P.IBShell||null,App=P.App||null;
document.documentElement.classList.add('ib-native');


function applyInsets(ins){try{
  if(!ins)return;var r=document.documentElement.style;
  r.setProperty('--sat',(ins.top|0)+'px');r.setProperty('--sar',(ins.right|0)+'px');
  r.setProperty('--sab',(ins.bottom|0)+'px');r.setProperty('--sal',(ins.left|0)+'px');
  IBN.insets={top:ins.top|0,right:ins.right|0,bottom:ins.bottom|0,left:ins.left|0};
}catch(e){}}
if(Shell){
  try{Shell.addListener('insets',function(d){applyInsets(d)})}catch(e){}
  try{Shell.getInsets().then(applyInsets).catch(function(){})}catch(e){}
}


if(Shell){
  try{Shell.addListener('route',function(d){try{if(d&&d.route&&typeof window._ibRouteGo==='function')window._ibRouteGo(d.route)}catch(e){}})}catch(e){}
  try{Shell.addListener('presenceWake',function(d){try{if(d&&d.convId&&typeof window._ibPresenceWake==='function')window._ibPresenceWake(d.convId)}catch(e){}})}catch(e){}
}


var _lastLight=null;
function wantLight(){try{
  if(document.body&&document.body.classList.contains('theme-infernal'))return true;
  if(document.documentElement.classList.contains('sp-dark'))return true;
  var lk=document.getElementById('lockscr');if(lk&&lk.offsetParent!==null)return true;
  var pv=document.getElementById('lk-preveil');if(pv&&!pv.classList.contains('off'))return true;
  return false;
}catch(e){return false}}
function syncBars(){var L=wantLight();if(L===_lastLight)return;_lastLight=L;
  if(Shell){try{Shell.setBarStyle({light:L})}catch(e){}}}
try{
  var mo=new MutationObserver(function(){syncBars()});
  mo.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  var boot=function(){try{mo.observe(document.body,{attributes:true,attributeFilter:['class'],childList:true})}catch(e){}syncBars()};
  if(document.body)boot();else document.addEventListener('DOMContentLoaded',boot);
}catch(e){}
syncBars();


var _exitAt=0;
function _vis(el){return !!(el&&el.offsetParent!==null)}
function exitAsk(){var now=Date.now();
  if(now-_exitAt<1900){try{if(App&&App.exitApp)App.exitApp()}catch(e){}return true}
  _exitAt=now;try{if(typeof window.toast==='function')window.toast('再按一次退出 IB')}catch(e){}
  return true}
function backStep(){try{
  var el;
  if(document.getElementById('lk-ptset'))return true;/* 图案设置浮层：吞返回，用面板内按钮 */
  var lk=document.getElementById('lockscr'),pv=document.getElementById('lk-preveil');
  if((lk&&_vis(lk))||(pv&&!pv.classList.contains('off')&&_vis(pv)))return exitAsk();/* 锁屏态无可关层，走退出确认 */
  el=document.getElementById('dlg-scrim');
  if(el&&el.classList.contains('show')){if(typeof window._dlgEnd==='function'){window._dlgEnd(false)}else{el.click()}return true}
  if(document.querySelector('.sheet.open')){if(typeof window.closeSheets==='function'){window.closeSheets()}else{var sc=document.getElementById('sheet-scrim');if(sc)sc.click()}return true}
  el=document.getElementById('drawer');
  if(el&&el.classList.contains('open')){if(typeof window.drawer==='function'){window.drawer(false)}else{var ds=document.getElementById('drawer-scrim');if(ds)ds.click()}return true}
  el=document.getElementById('music-app');if(el&&el.classList.contains('open')){el.classList.remove('open');return true}
  el=document.getElementById('cal-app');if(el&&el.classList.contains('open')){el.classList.remove('open');return true}
  if(document.body.classList.contains('on-sub')){
    var subs=document.querySelectorAll('[data-subback]'),hit=null;
    for(var i=0;i<subs.length;i++){var tid=subs[i].getAttribute('data-subback'),tg=tid?document.getElementById(tid):null;
      if(tg&&tg.classList.contains('open')){hit=subs[i];break}}
    if(hit){hit.click()}else{document.body.classList.remove('on-sub')}
    return true}
  if(document.body.classList.contains('on-conv')){el=document.getElementById('cv-back');if(el){el.click();return true}}
  if(document.body.classList.contains('blog-reading')&&typeof window.backToListM==='function'){window.backToListM();return true}
  var pg=document.querySelector('.page.active');
  if(pg&&pg.id==='page-icode'){el=document.getElementById('ic-back');if(el&&el.style.display!=='none'&&_vis(el)){el.click();return true}}
  if(pg&&pg.id!=='page-profile'&&typeof window.navTo==='function'){window.navTo('profile');return true}
  return exitAsk();
}catch(e){return exitAsk()}}
if(App&&App.addListener){try{App.addListener('backButton',function(){backStep()})}catch(e){}}


var IBN={
  available:true,platform:'android',bridge:2,insets:{top:0,right:0,bottom:0,left:0},
  has:function(k){return ['insets','bars','back','route','exit','notify','presence'].indexOf(String(k))>=0},
  getInsets:function(){return Shell?Shell.getInsets():Promise.resolve(IBN.insets)},
  setBarStyle:function(light){if(Shell){try{Shell.setBarStyle({light:!!light})}catch(e){}}},
  openRoute:function(r){try{if(typeof window._ibRouteGo==='function'&&r)window._ibRouteGo(String(r));else if(typeof window.navTo==='function'&&r)window.navTo(String(r))}catch(e){}},
  notify:function(o){o=o||{};if(Shell){try{Shell.notify({ch:String(o.ch||'app'),title:String(o.title||'IB'),body:String(o.body||''),route:String(o.route||'')})}catch(e){}}},
  presenceSync:function(p){if(Shell){try{Shell.presenceSync(p||{})}catch(e){}}},
  presenceCancel:function(){if(Shell){try{Shell.presenceCancel()}catch(e){}}},
  back:function(){return backStep()},
  exit:function(){try{if(App&&App.exitApp)App.exitApp()}catch(e){}}
};
window.IBNative=IBN;
})();
