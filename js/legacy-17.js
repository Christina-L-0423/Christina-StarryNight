
(function(){
'use strict';
var ON=true,SUB=false,FROM=false,BUSY=false,LASTD=null;
var CSS=''
+'.ibsf-hide{display:none!important}'
+'#ib-blog-back{display:none}body.blog-reading #ib-blog-back,body.on-sub #ib-blog-back{display:none!important}'
+'body.on-sub #blog-side-btn{display:none!important}'
/* 暗色日志页：固定全屏光斑底层（不随页面容器裁切） */
+'#ib-blog-amb{position:fixed;inset:0;pointer-events:none;z-index:-1;display:none;background:radial-gradient(58% 42% at 22% 20%,rgba(96,150,230,.20),transparent 62%),radial-gradient(50% 38% at 82% 28%,rgba(184,124,222,.12),transparent 64%),radial-gradient(48% 40% at 70% 86%,rgba(90,210,190,.11),transparent 66%),radial-gradient(40% 34% at 22% 82%,rgba(120,170,235,.10),transparent 64%)}'
+'body.theme-infernal.on-blog #ib-blog-amb{display:block}'
+'#ib-shelf{margin:4px 0 18px}'
+'#ib-shelf .shc-rule{position:relative;height:1px;margin:16px 10px 16px;background:linear-gradient(90deg,transparent,rgba(150,182,228,.55),transparent)}#ib-shelf .shc-rule::after{content:"";position:absolute;left:50%;top:-2px;width:5px;height:5px;margin-left:-2.5px;border-radius:50%;background:rgba(150,182,228,.75)}'
+'body.theme-infernal #ib-shelf .shc-rule{background:linear-gradient(90deg,transparent,rgba(165,188,232,.4),transparent)}body.theme-infernal #ib-shelf .shc-rule::after{background:rgba(165,188,232,.6)}'
+'.post-card.shc{padding:13px 16px 12px;margin-bottom:11px}'
+'.shc .pc-date,.shc .pc-main{position:relative;z-index:1}'
+'.shc .pc-date{background:linear-gradient(165deg,rgba(114,168,216,.2),rgba(150,182,228,.08))}.shc .pc-date b{font-size:1.18rem}.shc .pc-date small{letter-spacing:.08em}'
+'.shc .pc-cat svg{width:12px;height:12px;vertical-align:-2px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}'
+'.shc .pc-cat{padding:4px 8px}.shc.big .pc-main{padding-right:24%}'
+'.shc.mine .pc-cat{color:#c9788a}body.theme-infernal .shc.mine .pc-cat{color:rgba(228,150,164,.92)}'
/* 用户分类卡 / 好友卡：右侧从卡面色过渡到徽标块的蓝 */
+'.shc.tint::after{content:"";position:absolute;top:0;bottom:0;right:0;width:60%;z-index:0;pointer-events:none;background:linear-gradient(90deg,transparent 0%,rgba(114,168,216,.10) 40%,rgba(114,168,216,.32) 100%)}.shc.tint{border-color:transparent;background-clip:padding-box}.shc.tint::before{content:"";position:absolute;inset:0;border-radius:18px;border:1px solid var(--panel-line);pointer-events:none;z-index:1;-webkit-mask-image:linear-gradient(90deg,#000 40%,transparent 100%);mask-image:linear-gradient(90deg,#000 40%,transparent 100%)}/* v8：外框描边不再画在卡自身的 border 上（overflow:hidden 下无法遮它），改由 ::before 画一圈 1px 描边并用蒙版从 40% 处随右侧渐变一起淡到透明；卡自身 border 透明、背景只铺到 padding-box，视觉位置只向内 1px */'
+'.shc.tint.friend::after{background:linear-gradient(90deg,transparent 0%,rgba(90,130,190,.12) 40%,rgba(90,130,190,.36) 100%)}'
+'body.theme-infernal .shc.tint::after{background:linear-gradient(90deg,transparent 0%,rgba(96,128,172,.16) 40%,rgba(96,128,172,.42) 100%)}body.theme-infernal .shc.tint.friend::after{background:linear-gradient(90deg,transparent 0%,rgba(80,120,180,.18) 40%,rgba(80,120,180,.46) 100%)}'
/* 三张大卡 · 明亮：斜切彩层 + 卡底渐变线（沿用） */
+'.shc.big{--s1:#9ec8f2;--s2:#c9b8f0;--s3:#f2c9c9;--s4:#f2e3b8;--s5:#a9dcc9;--g1:rgba(120,160,230,.32);--g2:rgba(150,120,220,.18)}'
+'.shc.big.all .pc-date{background:linear-gradient(135deg,rgba(158,200,242,.5),rgba(201,184,240,.36),rgba(242,201,201,.3))}'
+'.shc.big.mine{--s1:#f3c4d3;--s2:#f7d6df;--s3:#f9e3e9;--s4:#fbeef1;--s5:#f3c4d3;--g1:rgba(214,120,150,.3);--g2:rgba(150,90,120,.16)}.shc.big.mine .pc-date{background:linear-gradient(165deg,rgba(243,196,211,.5),rgba(249,227,233,.3))}'
+'.shc.big.ta{--s1:#8fb4e6;--s2:#a9c6ee;--s3:#c3d8f4;--s4:#dbe8f8;--s5:#8fb4e6;--g1:rgba(90,180,220,.3);--g2:rgba(60,110,170,.16)}.shc.big.ta .pc-date{background:linear-gradient(165deg,rgba(143,180,230,.45),rgba(195,216,244,.25))}'
+'.shc-pages{position:absolute;right:-8px;top:8px;bottom:8px;width:42%;pointer-events:none;z-index:0;-webkit-mask-image:linear-gradient(90deg,transparent,#000 46%);mask-image:linear-gradient(90deg,transparent,#000 46%)}'
+'.shc-pages i{position:absolute;top:0;bottom:0;width:40%;border-radius:14px 10px 10px 14px;transform:skewX(-9deg);box-shadow:inset 0 1px 0 rgba(255,255,255,.55)}'
+'.shc-pages i:nth-child(1){right:0;background:linear-gradient(180deg,var(--s1),var(--s2));opacity:.95}.shc-pages i:nth-child(2){right:13%;background:linear-gradient(180deg,var(--s2),var(--s3));opacity:.78}.shc-pages i:nth-child(3){right:26%;background:linear-gradient(180deg,var(--s3),var(--s4));opacity:.6}.shc-pages i:nth-child(4){right:39%;background:linear-gradient(180deg,var(--s4),var(--s5));opacity:.44}.shc-pages i:nth-child(5){right:52%;background:linear-gradient(180deg,var(--s5),var(--s1));opacity:.3}'
+'.shc.big::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;z-index:0;background:linear-gradient(90deg,var(--s1),var(--s2),var(--s3),var(--s4),var(--s5));opacity:.9}'
/* 三张大卡 · 暗色：描边玻璃薄片 + 主色柔光 + 主色底线（另起一套，不用彩虹层） */
+'body.theme-infernal .shc-pages i{background:transparent;border:1px solid rgba(165,188,232,.30);box-shadow:none;border-radius:12px 8px 8px 12px}'
+'body.theme-infernal .shc-pages i:nth-child(1){background:linear-gradient(180deg,var(--g1),var(--g2));opacity:.95}body.theme-infernal .shc-pages i:nth-child(2){opacity:.74}body.theme-infernal .shc-pages i:nth-child(3){opacity:.56}body.theme-infernal .shc-pages i:nth-child(4){opacity:.4}body.theme-infernal .shc-pages i:nth-child(5){opacity:.26}'
+'body.theme-infernal .shc.big.mine{--g1:rgba(96,150,230,.30);--g2:rgba(60,110,190,.16)}'
+'body.theme-infernal .shc.big::before{content:"";position:absolute;right:-8%;top:-45%;width:58%;height:190%;z-index:0;pointer-events:none;background:radial-gradient(closest-side,var(--g1),transparent);opacity:.6}'
+'body.theme-infernal .shc.big::after{background:linear-gradient(90deg,transparent,var(--g1) 45%,var(--g2) 80%,transparent);opacity:.9}'
+'body.theme-infernal .shc.big.all .pc-date{background:linear-gradient(135deg,rgba(111,159,212,.42),rgba(154,143,208,.3),rgba(207,148,164,.24))}body.theme-infernal .shc.big.mine .pc-date{background:linear-gradient(165deg,rgba(96,150,230,.4),rgba(40,70,120,.4))}body.theme-infernal .shc.big.ta .pc-date{background:linear-gradient(165deg,rgba(90,130,190,.4),rgba(40,60,100,.4))}'
+'.shc.shc-empty{opacity:.82}.shc.shc-empty .post-card-preview{font-style:italic}'
+'#ib-shelf .shc-tip{margin:8px 4px 0;font-size:.74rem;color:var(--tx3);line-height:1.7}';
var IC={
 grid:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.6" height="6.6" rx="1.6"/><rect x="13.4" y="4" width="6.6" height="6.6" rx="1.6"/><rect x="4" y="13.4" width="6.6" height="6.6" rx="1.6"/><rect x="13.4" y="13.4" width="6.6" height="6.6" rx="1.6"/></svg>',
 heart:'<svg viewBox="0 0 24 24"><path d="M12 19.6C7.3 16.4 4 13.3 4 9.9 4 7.4 5.9 5.6 8.2 5.6c1.5 0 2.9.8 3.8 2 .9-1.2 2.3-2 3.8-2 2.3 0 4.2 1.8 4.2 4.3 0 3.4-3.3 6.5-8 9.7z"/></svg>',
 quill:'<svg viewBox="0 0 24 24"><path d="M19.5 4.5c-5 .3-8.6 2-10.8 5.2-1.6 2.3-2.3 5-2.7 8.6"/><path d="M19.5 4.5c-.2 4.4-1.6 7.6-4.3 9.6-1.9 1.4-4.3 2.1-7.2 2.3"/><path d="M5 20.5c.8-2.7 1.9-4.9 3.4-6.7"/></svg>'};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function el(t,c){var d=document.createElement(t);if(c)d.className=c;return d}
function dstr(ts){try{var d=new Date(ts||0);if(isNaN(d))return '';return (d.getMonth()+1)+' 月 '+d.getDate()+' 日'}catch(e){return ''}}
function card(kind,cat,label,b){var n=(b&&b.n)||0,last=b&&b.last;var big=(kind==='all'||kind==='mine'||kind==='ta');
  var w=el('div','post-card shc '+kind+(big?' big':' tint')+(n?'':' shc-empty'));w.dataset.cat=cat;
  var chip=kind==='all'?IC.grid:kind==='mine'?IC.heart:(kind==='ta'||kind==='friend')?IC.quill:'';
  w.innerHTML=(big?'<span class="shc-pages"><i></i><i></i><i></i><i></i><i></i></span>':'')
  +'<div class="pc-date"><b>'+n+'</b><small>POSTS</small></div>'
  +'<div class="pc-main"><div class="post-card-title">'+esc(label)+'</div>'
  +'<div class="post-card-preview">'+(last?('最新：'+esc(last.title||'无标题')):(kind==='cat'?'这个分类里还没有日志':'还没有日志'))+'</div>'
  +'<div class="post-card-meta">'+(chip?('<span class="pc-cat">'+chip+'</span>'):'')+'<span>'+n+' 篇</span>'+(last?('<span class="pc-dot">·</span><span>'+esc(dstr(last.created))+'</span>'):'')+'</div></div>';return w}
function amb(){if(document.getElementById('ib-blog-amb'))return;var d=el('div');d.id='ib-blog-amb';document.body.appendChild(d)}
function host(){var h=document.getElementById('ib-shelf');if(h)return h;var sec=document.getElementById('sec-blog-list');var hero=sec&&sec.querySelector('.pg-hero');if(!hero)return null;h=el('div');h.id='ib-shelf';var dk=sec.querySelector('#m-diary-keys');(dk||hero).insertAdjacentElement('afterend',h);h.onclick=onTap;return h}
function backBtn(){var b=document.getElementById('ib-blog-back');if(b)return b;var mb=document.getElementById('menu-btn');if(!mb)return null;b=el('button','icon-btn');b.id='ib-blog-back';b.type='button';b.setAttribute('aria-label','返回');b.innerHTML='<svg viewBox="0 0 24 24"><path d="M15 5.5 8.5 12 15 18.5"/></svg>';mb.insertAdjacentElement('afterend',b);
  b.addEventListener('click',function(){if(!ON){ON=true;SUB=FROM;FROM=false;bActiveCat='all';bSearchQ='';var si=document.getElementById('m-blog-search');if(si)si.value='';blogRender()}else if(SUB){SUB=false;sync()}try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}});return b}
function showBack(on){var b=backBtn(),mb=document.getElementById('menu-btn');if(!b||!mb)return;b.style.display=on?'flex':'none';mb.style.display=on?'none':''}
async function build(){if(BUSY)return;BUSY=true;try{var h=host();if(!h)return;
  var posts=[];try{posts=await _postsLiteM('')}catch(e){}
  var scope=posts.filter(function(pp){return pp&&(bDiaryMode?isLockedPost(pp):!isLockedPost(pp))});
  var cats=[];try{cats=await dbGetAll('categories')}catch(e){}
  function bump(o,k,pp){var b=o[k]||(o[k]={n:0,last:null});b.n++;if(!b.last||(pp.created||0)>(b.last.created||0))b.last={title:pp.title,created:pp.created}}
  var byCat={},all={n:0,last:null},mine={n:0,last:null},aiAll={n:0,last:null},ai={},nm={};
  scope.forEach(function(pp){bump({x:all},'x',pp);var k=pp.category||'';if(k)bump(byCat,k,pp);
    if(pp.aiWritten){bump({x:aiAll},'x',pp);var id=String(pp.author||'');if(!id)return;bump(ai,id,pp);
      if(!nm[id]){var c9=((typeof _cfgs!=='undefined'&&_cfgs)||[]).concat((typeof _archived!=='undefined'&&_archived)||[]).filter(function(c){return c&&c.id===id})[0];nm[id]=c9?(typeof cfgName==='function'?cfgName(c9):(c9.nickname||c9.model||'TA')):(pp.authorName||'TA')}}
    else bump({x:mine},'x',pp)});
  var ids=Object.keys(ai).sort(function(x,y){return ai[y].n-ai[x].n});
  h.innerHTML='';
  if(SUB){ids.forEach(function(id){h.appendChild(card('friend','ai:'+id,(nm[id]||'TA')+' Writings',ai[id]))});return}
  h.appendChild(card('all','all','全部分类',all));h.appendChild(card('mine','mine','My Blog',mine));
  if(aiAll.n)h.appendChild(card('ta','__friends','Friends Blog',aiAll));
  if(cats.length){h.appendChild(el('div','shc-rule'));cats.forEach(function(c){if(c&&c.name)h.appendChild(card('cat',c.name,c.name,byCat[c.name]))})}
  else{var tip=el('div','shc-tip');tip.textContent='还没有分类：右上角圆钮拉出目录可以新建；全部分类 / My Blog / Friends Blog 一直都在。';h.appendChild(tip)}
  }finally{BUSY=false}}
function onTap(e){var f=e.target.closest('.shc');if(!f)return;var cat=f.dataset.cat||'all';
  if(cat==='__friends'){SUB=true;sync();try{window.scrollTo({top:0,behavior:'smooth'})}catch(e2){window.scrollTo(0,0)}return}
  ON=false;FROM=SUB;SUB=false;bActiveCat=cat;blogRender();try{window.scrollTo({top:0,behavior:'smooth'})}catch(e3){window.scrollTo(0,0)}}
function titles(){try{var dm=!!bDiaryMode,tt=document.getElementById('tb-title');if(tt&&document.body.classList.contains('on-blog'))tt.textContent=dm?'Password Diary':((typeof TITLES!=='undefined'&&TITLES.blog)||'Blog');var bh=document.querySelector('#blog-side .bsd-head');if(bh)bh.textContent=dm?'Password Diary':'Blog'}catch(e){}}/* 进了密码日记本：顶栏与右侧目录抽屉的「Blog」一并改「Password Diary」，退出即还原 */
function sync(){var h=host();if(!h)return;amb();titles();var ok=!bDiaryMode||bDiaryUnlocked;if(LASTD!==bDiaryMode){LASTD=bDiaryMode;ON=true;SUB=false;FROM=false}
  h.classList.toggle('diary',!!bDiaryMode);
  var home=ON&&ok&&!bSearchQ&&bActiveCat==='all';
  h.style.display=home?'':'none';
  var sb=document.querySelector('#sec-blog-list .blog-sticky-bar');if(sb)sb.classList.toggle('ibsf-hide',home);
  var mp=document.getElementById('m-posts');if(mp)mp.classList.toggle('ibsf-hide',home);
  showBack(ok&&document.body.classList.contains('on-blog')&&(!ON||SUB));
  if(home)build()}
try{var st=el('style');st.textContent=CSS;document.head.appendChild(st)}catch(e){}
try{var _br0=blogRender;blogRender=async function(){await _br0.apply(this,arguments);try{sync()}catch(e){}}}catch(e){}
try{var _nv0=navTo;navTo=function(p){_nv0.apply(this,arguments);if(p==='blog'){try{sync()}catch(e){}}else{try{showBack(false)}catch(e){}}}}catch(e){}
document.addEventListener('click',function(e){if(e.target.closest('#m-cat-bar .btoc-row')&&!e.target.closest('.btoc-x')){ON=false;FROM=false;SUB=false}},true);
try{var si=document.getElementById('m-blog-search');if(si)si.addEventListener('input',function(){if(String(this.value||'').trim()){ON=false;SUB=false}},true)}catch(e){}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(sync,0);amb()});else{setTimeout(sync,0);amb()}
})();
