
/* v196-p：共读间并入主文件（与手机端同一段） */

(function(){
  if(!window.IBApps)return;
  var host=null,ctx=null;
  /* ── 设置（存档键 cfg，随备份） ── */
  var S={fs:'m',lh:'m',pad:'n',font:'body',paper:'auto',flip:'tap',vib:0,prog:'page',nudge:0,notes:1,auto:0,wake:0,tailChars:1800,sumEvery:8000,lastAi:''};
  var OPT={
    fs:[['s','小'],['m','中'],['l','大']],lh:[['s','紧凑'],['m','标准（同 Blog）'],['l','宽松']],pad:[['n','标准'],['w','宽']],
    font:[['body','跟随 Blog'],['serif','衬线']],paper:[['auto','跟随主题'],['warm','暖黄'],['green','护眼绿']],
    flip:[['tap','点两侧＋滑动'],['swipe','仅滑动']],prog:[['page','页码'],['pct','百分比'],['left','剩余页']],
    nudge:[[0,'关（默认）'],[1,'停 1 分钟'],[2,'停 2 分钟'],[3,'停 3 分钟'],[5,'停 5 分钟'],[10,'停 10 分钟']],
    tailChars:[[600,'600 字'],[1200,'1200 字'],[1800,'1800 字（默认）'],[0,'整页']],
    sumEvery:[[0,'关'],[4000,'每 4000 字'],[8000,'每 8000 字（默认）'],[16000,'每 16000 字']],
    vib:[[0,''],[1,'']],notes:[[0,''],[1,'']],auto:[[0,''],[1,'']],wake:[[0,''],[1,'']]
  };
  /* 设置页：照项目设置页的卡 / 下拉 / 圆钮（全局 .set-card / .f-group / .sel / .tog / .sw） */
  var CARDS=[
    ['排版',[['sel','fs','字号'],['sel','lh','行距'],['sel','pad','页边距'],['sel','font','字体','跟随 Blog＝与日志正文同一字体'],['sel','paper','纸色','只换阅读区，不动主题']]],
    ['翻页与进度',[['sel','flip','翻页方式','仅滑动＝点两侧不翻页，防误触'],['sel','prog','进度显示'],['sw','vib','翻页震动','翻一页轻震一下']]],
    ['TA 的参与',[['sel','nudge','TA 主动开口','在同一页停满这么久没说话，TA 先开口'],['sel','tailChars','附给 TA 的原文','每句话带上这一页多少字；越长越准，也越费 token'],['sel','sumEvery','前文梗概','读过这么多字就把前文压一次梗概，随每句话带上；关＝只带这一页'],['sw','auto','TA 回话时展开纸条区','']]],
    ['其他',[['sw','notes','纸条区','这条频道里的往来'],['sw','wake','阅读时屏幕常亮','进书亮着、离开释放；锁屏或切后台自动放开']]]
  ];
  var LAYOUT_KEYS={fs:1,lh:1,pad:1,font:1};
  var FS={s:'0.82rem',m:'0.92rem',l:'1.04rem'},LH={s:'1.7',m:'2',l:'2.3'},PAD={n:'14px 18px 22px',w:'18px 30px 28px'};
  var FONT={body:'inherit',serif:'var(--serif)'};
  var PAPER={auto:['',''],warm:['#f5eedf','#3b3226'],green:['#e5efe3','#26382b']};
  /* ── 状态 ── */
  var B=null,T='',starts=[0],done=false,pi=0,est=900,chapters=[],bms=[];
  var sess=null,notes=[],sum={text:'',upTo:0},sumBusy=false,quote='',lastSel='',aiList=[],aiId='',posts=[],posMap={},qStr='',notesOpen=false;
  var probe=null,pageEl=null,posT=null,tickT=null,bgT=null,resT=null,onMsg=null,onTurn=null,onDelta=null,onSel=null,onRes=null,onVis=null,ro=null,busyLayout=false,imm=false,lastTouch=0,roSize='',wl=null,pending=false,pendAt=0,pendT=null,typ=null,listIds='';
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function q(sel){return host?host.querySelector(sel):null}
  function toast(t){try{ctx.ui.toast(t)}catch(e){}}
  function render(t){try{return ctx.blog.render(t)}catch(e){return esc(t)}}
  function dateOf(ts){var d=new Date(ts||0);return {d:String(d.getDate()).padStart(2,'0'),m:['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()]}}
  function short(t,n){t=String(t||'');return t.length>n?t.slice(0,n)+'…':t}
  function css(){
    var old=document.getElementById('cr-css');if(old)old.remove();
    var st=document.createElement('style');st.id='cr-css';
    st.textContent=''
    +'.cr{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;color:var(--tx);font-family:inherit}'
    +'.cr-shelf{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 14px calc(24px + var(--sab,0px))}'
    +'.cr-hero{flex:none;display:flex;align-items:flex-start;gap:10px;padding:calc(6px + var(--sat,0px)) 14px 0}.cr-hero .pg-hero{flex:1;min-width:0}.cr-hero .ph-sub{font-family:var(--disp);font-weight:300;font-size:0.58rem;letter-spacing:0.26em;color:var(--tx3);text-transform:uppercase;margin-top:6px}'
    +'.cr-tools{display:flex;gap:8px;align-items:center;margin:6px 0 10px}.cr-shelf .f-group{margin:0 0 12px}'
    +'.cr-nchip{flex:none;display:none;align-items:center;justify-content:center;gap:6px;margin:8px 14px 0;padding:6px;font-size:0.7rem;color:var(--tx3);border:1px dashed var(--line);border-radius:12px;cursor:pointer}.cr-nchip.on{display:flex}.cr-nb .think{margin:0 0 6px;font-size:0.72rem}'
    +'.cr-spill{flex:1;min-width:0;display:flex;align-items:center;gap:9px;border:1px solid var(--line);border-radius:999px;padding:9px 14px;background:var(--panel)}'
    +'.cr-spill svg{width:15px;height:15px;flex:none;stroke:var(--tx3);fill:none;stroke-width:1.7;stroke-linecap:round}'
    +'.cr-spill input{flex:1;min-width:0;background:none;border:none;outline:none;color:var(--tx);font-size:0.82rem;font-family:inherit}.cr-spill input::placeholder{color:var(--tx3)}'
    +'.cr-who{flex:none;position:relative;max-width:42%}.cr-who select{width:100%;appearance:none;-webkit-appearance:none;border:1px solid var(--line);border-radius:999px;background:var(--panel);color:var(--tx);padding:9px 28px 9px 13px;font-size:0.78rem;font-family:inherit;outline:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    +'.cr-who::after{content:"";position:absolute;right:12px;top:50%;width:6px;height:6px;border-right:1.5px solid var(--tx3);border-bottom:1.5px solid var(--tx3);transform:translateY(-70%) rotate(45deg);pointer-events:none}'
    +'.cr-lab{font-family:var(--disp);font-weight:300;font-size:0.58rem;letter-spacing:0.26em;color:var(--tx3);text-transform:uppercase;margin:14px 2px 8px}'
    +'.cr-book.mini{padding:10px 14px}.cr-book.mini .cr-date{padding:5px 0 4px}.cr-book.mini .cr-bt{font-size:0.96rem}.cr-book.mini .cr-bs{margin-top:2px}'
    +'.cr-book.mini{position:relative;padding-right:34px}.cr-rmx{position:absolute;top:7px;right:8px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.82rem;line-height:1;color:var(--tx3);border:1px solid var(--panel-line);opacity:.72}.cr-rmx:active{opacity:1;color:#c95a63;border-color:rgba(201,90,99,.5)}'
    +'.cr-book{position:relative;display:flex;gap:14px;align-items:flex-start;background:var(--panel);border:1px solid var(--panel-line);border-radius:19px;padding:15px 16px 13px;margin-bottom:12px;cursor:pointer;overflow:hidden;box-shadow:0 8px 26px rgba(90,120,170,0.11);-webkit-tap-highlight-color:transparent}'
    +'.cr-book::before{content:"";position:absolute;inset:0 0 auto 0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent);pointer-events:none}'
    +'.cr-book:active{transform:translateY(1px) scale(0.995)}'
    +'body.theme-infernal .cr-book{box-shadow:0 8px 26px rgba(0,0,0,0.24)}body.theme-infernal .cr-book::before{background:linear-gradient(90deg,transparent,rgba(160,190,225,0.22),transparent)}'
    +'.cr-date{flex:none;width:47px;border-radius:13px;padding:7px 0 6px;text-align:center;background:linear-gradient(165deg,rgba(255,255,255,0.6),rgba(214,231,248,0.28));border:1px solid rgba(255,255,255,0.6);box-shadow:inset 0 1px 0 rgba(255,255,255,0.8)}'
    +'body.theme-infernal .cr-date{background:linear-gradient(165deg,rgba(96,128,172,0.22),rgba(24,34,58,0.4));border-color:rgba(165,190,228,0.2);box-shadow:inset 0 1px 0 rgba(210,228,250,0.1)}'
    +'.cr-date b{display:block;font-family:var(--serif);font-weight:600;font-size:1.32rem;line-height:1;color:var(--acc)}.cr-date.rd b{font-size:1.1rem;letter-spacing:0.02em}'
    +'.cr-date small{display:block;font-family:var(--disp);font-weight:300;font-size:0.47rem;letter-spacing:0.2em;color:var(--tx3);margin-top:4px;text-transform:uppercase}'
    +'.cr-bm{flex:1;min-width:0}.cr-bt{font-family:var(--serif);font-weight:600;font-size:1.1rem;color:var(--tx);letter-spacing:0.02em;line-height:1.3}'
    +'.cr-bs{font-size:0.75rem;color:var(--tx2);margin-top:2px}.cr-bs i{font-style:normal;color:var(--acc)}'
    +'.cr-bp{font-size:0.76rem;line-height:1.72;color:var(--tx3);margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-all}'
    +'.cr-meta{display:flex;flex-wrap:wrap;align-items:center;gap:7px;font-size:0.6rem;color:var(--tx3);margin-top:9px;letter-spacing:0.05em}'
    +'.cr-cat{display:inline-flex;align-items:center;padding:2.5px 9px;border-radius:999px;border:1px solid rgba(114,168,216,0.34);color:var(--acc);background:rgba(150,190,235,0.1);letter-spacing:0.06em}'
    +'.cr-empty{padding:18px 12px;font-size:0.8rem;color:var(--tx2);text-align:center;line-height:1.7}'
    /* 顶栏（照 Blog 阅读页玻璃条）；内联层贴顶，留安全区 */
    +'.cr-top{flex:none;display:flex;align-items:center;gap:8px;margin:calc(6px + var(--sat,0px)) 10px 0;padding:8px 10px;border-radius:16px;background:var(--sheet);border:1px solid var(--glass-line);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}'
    +'.cr-mini{flex:none;border:1px solid var(--line);border-radius:999px;padding:6px 12px;background:none;color:var(--tx2);font-size:0.72rem;font-family:inherit;letter-spacing:0.04em;cursor:pointer;-webkit-tap-highlight-color:transparent;white-space:nowrap}'
    +'.cr-mini.on{color:var(--acc);border-color:var(--acc)}'
    +'.cr-tt{flex:1;min-width:0;font-family:var(--serif);font-weight:600;font-size:0.96rem;color:var(--tx);letter-spacing:0.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    +'.cr-tt small{display:block;font-family:var(--disp);font-weight:300;font-size:0.56rem;letter-spacing:0.22em;color:var(--tx3);text-transform:uppercase;margin-top:1px}'
    +'.cr-fsw{display:flex;gap:2px;flex:none}.cr-fsb{border:none;background:none;color:var(--tx3);cursor:pointer;padding:2px 6px;font-family:var(--serif)}'
    +'.cr-fsb[data-fs=s]{font-size:0.72rem}.cr-fsb[data-fs=m]{font-size:0.88rem}.cr-fsb[data-fs=l]{font-size:1.05rem}.cr-fsb.on{color:var(--acc)}'
    +'.cr-prog{flex:none;height:2px;border-radius:2px;background:var(--line);margin:8px 14px 0;overflow:hidden}.cr-prog i{display:block;height:100%;width:0;background:var(--acc);transition:width 0.15s linear}'
    +'.cr-page{flex:1;min-height:0;position:relative;overflow:hidden;background:var(--cr-paper,transparent)}'
    +'.cr-text,.cr-probe{position:absolute;inset:0;overflow:hidden;letter-spacing:0.01em;color:var(--cr-ink,var(--tx));word-break:break-word;overflow-wrap:anywhere;-webkit-user-select:text;user-select:text}'
    +'.cr-text.mdr,.cr-probe.mdr{color:var(--cr-ink,var(--tx))}.cr-text p,.cr-probe p{white-space:pre-wrap;color:inherit}.cr-text img,.cr-probe img{max-width:100%;height:auto}'
    
    +'.cr-text pre.md-cb,.cr-probe pre.md-cb{white-space:pre-wrap;word-break:break-all;overflow-wrap:anywhere;overflow-x:hidden}'
    +'.cr-text pre.md-cb code,.cr-probe pre.md-cb code{white-space:inherit}'
    +'.cr-text table,.cr-probe table{display:block;max-width:100%;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;scrollbar-width:thin;scrollbar-color:var(--acc) transparent;padding-bottom:6px;-webkit-mask-image:linear-gradient(90deg,#000 88%,rgba(0,0,0,.35));mask-image:linear-gradient(90deg,#000 88%,rgba(0,0,0,.35))}'
    +'.cr-text table::-webkit-scrollbar{height:4px}.cr-text table::-webkit-scrollbar-track{background:transparent}.cr-text table::-webkit-scrollbar-thumb{background:var(--acc);opacity:.7;border-radius:4px}'
    +'.cr-text table th,.cr-text table td,.cr-probe table th,.cr-probe table td{white-space:nowrap}'
    +'.cr-probe{visibility:hidden;pointer-events:none}'
    +'.cr-hint{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);padding:3px 10px;border-radius:999px;background:var(--sheet);border:1px solid var(--glass-line);font-family:var(--disp);font-size:0.56rem;letter-spacing:0.12em;color:var(--tx3);white-space:nowrap;pointer-events:none}'
    +'.cr-busy{position:absolute;left:0;right:0;top:40%;text-align:center;font-size:0.72rem;color:var(--tx2);letter-spacing:0.1em;pointer-events:none}'
    +'.cr-notes{flex:none;display:flex;flex-direction:column}.cr-notes[hidden]{display:none}'
    +'.cr-peek{flex:none;display:flex;align-items:center;gap:8px;padding:9px 14px;margin:0 8px;font-size:0.76rem;color:var(--tx2);cursor:pointer;background:var(--sheet);border:1px solid var(--glass-line);border-top:1px dashed var(--glass-line);border-radius:0 0 18px 18px;box-shadow:0 8px 20px rgba(40,60,100,0.08);-webkit-tap-highlight-color:transparent}'
    +'.cr-peek b{flex:1;min-width:0;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--tx)}.cr-peek small{flex:none;font-family:var(--disp);font-size:0.62rem;letter-spacing:0.06em;color:var(--tx3)}'
    +'.cr-peek i{flex:none;width:6px;height:6px;border-right:1.5px solid var(--tx3);border-bottom:1.5px solid var(--tx3);transform:rotate(-135deg);margin-left:2px;transition:transform 0.2s}.cr-notes.open .cr-peek i{transform:rotate(45deg)}'
    +'.cr-nl{display:none;height:30vh;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 10px 8px;flex-direction:column;gap:8px}.cr-notes.open .cr-nl{display:flex}'
    +'.cr-nl .m{font-size:0.86rem;padding:9px 13px;max-width:88%}.cr-nl .mh-ava{width:26px;height:26px;font-size:0.68rem}.cr-nl .m-time{font-size:0.56rem}.cr-nl .mrow{margin-bottom:2px}'
    +'.cr-secs{align-self:flex-start;font-family:var(--disp);font-size:0.58rem;letter-spacing:0.08em;color:var(--tx3);margin:-4px 0 2px 38px}'
    +'.cr-bar{flex:none;margin:6px 10px calc(10px + var(--sab,0px))}'
    +'.cr-ta{flex:1;resize:none;border:1px solid var(--glass-line);border-radius:16px;background:rgba(255,255,255,0.55);color:var(--tx);font-size:1rem;line-height:1.5;padding:10px 14px;font-family:inherit;max-height:110px;min-height:42px;-webkit-appearance:none;outline:none}'
    +'body.theme-infernal .cr-ta{background:rgba(14,22,42,0.5)}.cr-ta:focus{border-color:var(--acc)}'
    +'.cr-quote{flex:none;display:none;align-items:center;gap:8px;margin:4px 14px 0;padding:5px 12px;font-size:0.7rem;color:var(--tx2);border:1px solid var(--glass-line);border-radius:12px;background:var(--sheet)}'
    +'.cr-quote.on{display:flex}.cr-quote b{flex:1;min-width:0;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--tx)}'
    +'.cr.imm .cr-top,.cr.imm .cr-prog,.cr.imm .cr-notes,.cr.imm .cr-quote,.cr.imm .cr-nchip{display:none}'
    /* 层：目录 / 设置（设置用项目自己的 .set-card / .f-group / .sel / .tog / .sw） */
    +'.cr-lay{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;background:linear-gradient(180deg,#f3f7fd 0%,#e9effa 62%,#e4ebf7 100%);color:var(--tx)}'
    +'body.theme-infernal .cr-lay{background:linear-gradient(180deg,#111b30 0%,#0d1526 60%,#0a111f 100%)}'
        +'.cr-lay .cr-lh{flex:none;display:flex;align-items:center;gap:8px;padding:calc(12px + var(--sat,0px)) 14px 10px;border-bottom:1px solid var(--line)}'
    +'.cr-lay .cr-lh b{flex:1;font-family:var(--serif);font-weight:600;font-size:1.2rem;color:var(--tx)}'
    +'.cr-lay .cr-lb{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 16px calc(16px + var(--sab,0px))}'
    +'.cr-lay .set-card{margin-top:12px}.cr-lay .tog:last-child{border-bottom:none}'
    +'.cr-tr{display:flex;align-items:baseline;gap:8px;padding:9px 2px;font-family:var(--serif);font-size:0.96rem;color:var(--tx);cursor:pointer;-webkit-tap-highlight-color:transparent}'
    +'.cr-tr.on{color:var(--acc)}.cr-tr .cr-tn{flex:none;max-width:68%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    +'.cr-tr .cr-td{flex:1;min-width:12px;border-bottom:1px dotted var(--line);transform:translateY(-4px)}'
    +'.cr-tr .cr-tp{flex:none;font-family:var(--disp);font-size:0.66rem;letter-spacing:0.06em;color:var(--tx3);font-variant-numeric:tabular-nums}'
    +'.cr-tr .cr-x{flex:none;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:0.76rem;line-height:1;color:var(--tx3);opacity:0.7}'
    +'.cr-tr small{display:block;font-family:inherit;font-size:0.62rem;color:var(--tx3);margin-top:2px}';
    document.head.appendChild(st);
  }
  /* ── 设置 / 存档 ── */
  async function loadS(){try{var s=await ctx.storage.get('cfg');if(s&&typeof s==='object'){if(s.font==='sans')s.font='body';Object.keys(OPT).forEach(function(k){if(s[k]===undefined)return;var ok=OPT[k].some(function(o){return String(o[0])===String(s[k])});if(ok)S[k]=(typeof OPT[k][0][0]==='number')?Number(s[k]):String(s[k])});if(typeof s.lastAi==='string')S.lastAi=s.lastAi}}catch(e){}}
  function saveS(){try{ctx.storage.set('cfg',S)}catch(e){}}
  function pct(){if(!T.length)return 0;var e=starts[pi+1]||T.length;return Math.min(100,Math.round(e/T.length*100))}
  function totalPages(){return done?starts.length:Math.max(starts.length,Math.round(T.length/Math.max(80,est)))}
  function chapAt(off){var c=null;for(var i=0;i<chapters.length;i++){if(chapters[i].off<=off)c=chapters[i];else break}return c}
  var posBy={};/* v203-p：每位 TA 各一份进度（书 × TA），顶层仍是最近一次 */
  function posRec(){var c=chapAt(starts[pi]||0);var r={off:starts[pi]||0,page:pi+1,pct:pct(),title:B?B.title:'',ch:c?c.title:'',cfgId:(sess&&sess.cfgId)||aiId||'',updated:Date.now()};var by={};try{Object.keys(posBy||{}).forEach(function(k){if(posBy[k])by[k]=posBy[k]})}catch(e){}if(r.cfgId)by[r.cfgId]={off:r.off,page:r.page,pct:r.pct,ch:r.ch,updated:r.updated};r.by=by;posBy=by;return r}
  function savePos(){if(!B)return;clearTimeout(posT);posT=setTimeout(function(){try{if(B)ctx.storage.set('pos_'+B.id,posRec())}catch(e){}},400)}
  function vib(){if(S.vib){try{if(navigator.vibrate)navigator.vibrate(8)}catch(e){}}}
  async function wakeOn(){if(!S.wake||!B||wl)return;try{if(navigator.wakeLock&&navigator.wakeLock.request){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',function(){wl=null})}}catch(e){wl=null}}
  function wakeOff(){try{if(wl)wl.release()}catch(e){}wl=null}
  
  var CH_RE=/^(?:#{1,4}\s*)?(?:第\s*[0-9零〇一二三四五六七八九十百千两]+\s*[章节回卷部集幕篇]|(?:chapter|CHAPTER|Chapter)\s*\d+|卷\s*[0-9零〇一二三四五六七八九十百千]+|序章|终章|尾声|楔子|前言|后记|番外(?:篇)?)(?:[\s：:·、—\-]?.*)?$/;
  function detectChapters(){var out=[],pos=0;T.split('\n').forEach(function(line){var l=line.trim();if(l&&l.length<=44&&CH_RE.test(l))out.push({off:pos,title:l.replace(/^#{1,4}\s*/,'')});pos+=line.length+1});return out.length>=2?out:[]}
  
  function fits(t){if(!probe||probe.clientHeight<40)return true;probe.innerHTML=render(t);return probe.scrollHeight<=probe.clientHeight+1}
  function nextEnd(s){
    var n=T.length;if(s>=n)return n;
    var hi=Math.min(n,s+Math.max(200,Math.min(6000,Math.round(est*1.5)))),lo=s+1;
    if(fits(T.slice(s,hi))){if(hi>=n)return n;while(hi<n){var h2=Math.min(n,s+(hi-s)*2);if(fits(T.slice(s,h2))){hi=h2;if(hi>=n)return n}else{lo=hi;hi=h2;break}}if(hi>=n&&fits(T.slice(s,n)))return n}
    while(lo<hi){var mid=(lo+hi+1)>>1;if(fits(T.slice(s,mid)))lo=mid;else hi=mid-1}
    var e=Math.max(s+1,lo);
    if(e<n){var from=Math.max(s+40,e-90);if(from<e){var win=T.slice(from,e),re=/[\n。！？!?…”」』）)]/g,last=-1,m;while((m=re.exec(win)))last=m.index;if(last>=0)e=from+last+1}}
    while(e<n&&T.charAt(e)==='\n')e++;
    return e;
  }
  function ensure(k){while(starts.length<=k+1&&!done){var s=starts[starts.length-1];var e=nextEnd(s);est=Math.max(80,e-s);if(e>=T.length){done=true;break}starts.push(e)}}
  function bg(){clearTimeout(bgT);if(done||!host)return;bgT=setTimeout(function(){if(!host||!probe)return;if(document.hidden){bg();return}var c=0;while(!done&&c<10){ensure(starts.length);c++}paintPg();bg()},document.hidden?1500:60)}/* v206-p：退到后台不再后台排版（省 CPU，也不给系统杀后台的理由） */
  async function relayout(keepOff){
    if(!probe||busyLayout)return;busyLayout=true;var off=typeof keepOff==='number'?keepOff:(starts[pi]||0);
    starts=[0];done=false;pi=0;
    var bz=q('.cr-busy');if(bz)bz.textContent='排版中…';
    var n=0;while(!done&&(starts[starts.length-1]<=off)){ensure(starts.length);if(++n%14===0){paintPg();await new Promise(function(r){setTimeout(r,0)});if(!host||!probe){busyLayout=false;return}}}
    pi=0;for(var i=0;i<starts.length;i++){if(starts[i]<=off)pi=i;else break}
    if(bz)bz.textContent='';busyLayout=false;paintPage();bg();
  }
  function applyStyle(){
    if(!probe||!pageEl)return;
    [probe,pageEl].forEach(function(el){el.style.fontSize=FS[S.fs];el.style.lineHeight=LH[S.lh];el.style.padding=PAD[S.pad];el.style.fontFamily=FONT[S.font]||'inherit'});
    var pg=q('.cr-page');if(pg){var p=PAPER[S.paper]||PAPER.auto;if(p[0]){pg.style.setProperty('--cr-paper',p[0]);pg.style.setProperty('--cr-ink',p[1])}else{pg.style.removeProperty('--cr-paper');pg.style.removeProperty('--cr-ink')}}
    Array.prototype.forEach.call(host.querySelectorAll('.cr-fsb'),function(b){b.classList.toggle('on',b.getAttribute('data-fs')===S.fs)});
  }
  /* ── 界面 ── */
  function progText(){var tot=totalPages(),tt=done?String(tot):('约 '+tot);if(S.prog==='pct')return pct()+'%';if(S.prog==='left')return '余 '+(done?'':'约 ')+Math.max(0,tot-(pi+1))+' 页';return (pi+1)+' / '+tt}
  function paintPg(){var pr=q('.cr-prog i');if(pr)pr.style.width=pct()+'%';var h=q('.cr-hint');if(h&&B){var c=chapAt(starts[pi]||0);h.textContent=(pi===0&&!imm?((S.flip==='tap'?'左右滑动或点两侧翻页 · 点中间沉浸':'左右滑动翻页 · 点中间沉浸')+' · '):'')+progText()+(c?(' · '+c.title):'')}}
  function paintPage(){
    if(!pageEl||!B)return;ensure(pi+1);
    var s=starts[pi]||0,e=starts[pi+1]||T.length;pageEl.innerHTML=render(T.slice(s,e).replace(/\n+$/,''));
    paintPg();savePos();if(sess)sess.lastAct=Date.now();updSum();
  }
  function go(d){if(!B||busyLayout)return;var k=pi+d;if(k<0){toast('已经是第一页');return}if(k>pi){ensure(k+1);if(k>=starts.length){toast('已经是最后一页');return}}pi=k;vib();paintPage()}
  function gotoOff(off){if(!B||busyLayout)return;while(!done&&starts[starts.length-1]<=off)ensure(starts.length);var k=0;for(var i=0;i<starts.length;i++){if(starts[i]<=off)k=i;else break}pi=k;paintPage()}
  /* ── 纸条区：直接读频道里的聊天记录 ── */
  function stripAi(t){return String(t||'').replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi,' ').replace(/<(ws|mem|cal|ib|bt|am)_[a-z0-9_]*\b[^>]*>[\s\S]*?<\/(?:ws|mem|cal|ib|bt|am)_[a-z0-9_]*\s*>/gi,' ').replace(/<(ws|mem|cal|ib|bt|am)_[a-z0-9_]*\b[^>]*\/?>/gi,' ').replace(/\s+\n/g,'\n').trim()}
  function splitThink(t){var th='';t=String(t||'').replace(/<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>/gi,function(_,x){th+=(th?'\n':'')+String(x).trim();return ' '});return {th:th.trim(),body:stripAi(t)}}
  var rsCache=[];
  function loadNotes(){/* v2.3.0：notes 只供顶部窥视行；列表由底座 msgEl 画（含标记分隔线） */
    notes=[];rsCache=[];if(!sess)return;var cur=ctx.chat.current();if(!cur||cur.id!==sess.cfgId||cur.threadId!==sess.threadId)return;
    var rs=[];try{rs=ctx.chat.recent(50)||[]}catch(e){}rsCache=rs;
    rs.forEach(function(m){if(!m||m.mark||(!m.content&&!m.thinking))return;var t=String(m.content||'');if(m.role==='user'&&t.indexOf('[共读]')===0)return;var th='';if(m.role==='assistant'){th=String(m.thinking||'').trim();var sp=splitThink(t);if(!th)th=sp.th;t=sp.body}if(!t&&!th)return;notes.push({role:m.role==='user'?'user':'ai',text:t.slice(0,600),th:th.slice(0,3000),t:m.timestamp||0,who:m.senderName||(sess?sess.cfgName:'TA')})});
  }
  function mine(ev){return !!(sess&&ev&&ev.cfgId===sess.cfgId&&String(ev.threadId||'')===String(sess.threadId||''))}
  function paintPeek(){var last=notes[notes.length-1];var pk=q('.cr-peek');
    if(pk)pk.innerHTML='<b>'+(pending?(esc(sess?sess.cfgName:'TA')+(typ&&typ.got?' 正在写…':' 正在想…')+(pendAt?('（'+Math.round((Date.now()-pendAt)/1000)+' 秒）'):'')):(last?((last.role==='user'?'我：':esc(last.who||'TA')+'：')+esc((last.text||'（只有思考，没说出口）').replace(/\s+/g,' '))):'还没有纸条。在书页上划一段字、按左下角的引号键引用，或在下面写给 TA。'))+'</b><small>'+(notes.length?(notes.length+' 条 · '+(notesOpen?'收起':'展开')):'')+'</small><i></i>'}
  function paintNotes(force){
    var box=q('.cr-notes'),chip=q('.cr-nchip');if(!box)return;box.hidden=!S.notes;if(chip)chip.classList.toggle('on',!S.notes);if(!S.notes){onSize();return}
    box.classList.toggle('open',notesOpen);loadNotes();paintPeek();
    var nl=q('.cr-nl');if(nl){var ids=rsCache.map(function(m){return m.id}).join(',');
      if(force||ids!==listIds){listIds=ids;var keep=typ&&typ.row&&typ.row.parentNode===nl;if(keep)nl.removeChild(typ.row);nl.innerHTML='';var prev='';rsCache.forEach(function(m){var el=null;try{el=ctx.ui.msgEl(m.id,prev)}catch(e){el=null}if(el)nl.appendChild(el);prev=m.id});if(keep)nl.appendChild(typ.row)}
      nl.scrollTop=nl.scrollHeight}
    onSize();
  }
  function pendOn(){
    if(pending)return;pending=true;pendAt=Date.now();
    var nl=q('.cr-nl');try{typ=ctx.ui.typingEl(sess?sess.cfgId:'')}catch(e){typ=null}
    if(typ&&typ.row&&nl){var sc=document.createElement('div');sc.className='cr-secs';sc.textContent='正在想 · 0 秒';typ.row.appendChild(sc);typ.secs=sc;nl.appendChild(typ.row);nl.scrollTop=nl.scrollHeight}
    if(S.auto&&S.notes&&!notesOpen)notesOpen=true;paintNotes(true);
    clearInterval(pendT);pendT=setInterval(function(){if(typ&&typ.secs)typ.secs.textContent=(typ.got?'正在写 · ':'正在想 · ')+Math.round((Date.now()-pendAt)/1000)+' 秒';paintPeek()},1000);
  }
  function pendOff(){clearInterval(pendT);pendT=null;pending=false;pendAt=0;if(typ&&typ.row){try{typ.row.remove()}catch(e){}}typ=null;paintNotes(true)}
  function onDeltaEv(ev){
    if(!mine(ev)||!typ)return;var t=String(ev.text||''),k=String(ev.think||'');
    if(k&&typ.thWrap){typ.thWrap.style.display='';if(typ.thEl)typ.thEl.textContent=k}
    if(t&&typ.txtEl){typ.got=true;try{typ.bubble.classList.remove('typing')}catch(e){}typ.txtEl.textContent=t}
    var nl=q('.cr-nl');if(nl&&nl.scrollHeight-nl.scrollTop-nl.clientHeight<140)nl.scrollTop=nl.scrollHeight;
  }
  function setQuote(t){quote=String(t||'').trim().slice(0,240);var el=q('.cr-quote');if(!el)return;el.classList.toggle('on',!!quote);var b=el.querySelector('b');if(b)b.textContent=quote?('引用：'+quote):''}
  function setImm(on){imm=!!on;var cr=q('.cr');if(cr)cr.classList.toggle('imm',imm);var lay=q('.cr-lay');if(lay)lay.remove();onSize()}
  /* ── 发给 TA 的隐藏上下文与常量块 ── */
  function tail(){
    var s=starts[pi]||0,e=starts[pi+1]||T.length;var page=T.slice(s,e).trim();var cut=false;if(S.tailChars>0&&page.length>S.tailChars){page=page.slice(0,S.tailChars);cut=true}
    var c=chapAt(s);var back=(sum.text&&s<sum.upTo);
    return '\n———— 以下是系统随消息附上的共读状态，不是对方说的话；对方真正说的话在最上面 ————\n【共读】《'+B.title+'》· 第 '+(pi+1)+(done?(' / '+starts.length):'')+' 页 · 进度 '+pct()+'%'+(c?(' · '+c.title):'')
      +'\n[对方此刻读到的这一页'+(cut?('（本页前 '+S.tailChars+' 字）'):'')+']\n'+page
      +(sum.text?('\n['+(back?'已读部分的梗概（对方此刻回看到了前面的页）':'前文梗概')+']\n'+sum.text):'')
      +'\n[说明] 以上就是这一轮你读到的全部，后面的页你还没读到。接对方最上面那句话，像平时聊天一样，短一点。';
  }
  function sysBlock(){return '【共读】你们正在一起读《'+B.title+'》：对方在读，你陪着读。对方每条消息的末尾会有一段「系统随消息附上的共读状态」——此刻读到的那一页原文和前文梗概；那不是对方说的话，对方说的话在消息最上面。这一页和梗概就是你读到的全部，后面的内容你没读到，不预告、不猜剧情、不引用没给你的段落。对方在页边写的话像坐在旁边看书时随口说的，照平时聊天的样子接，短一点；对方引了哪句就从那句说起。'}
  async function updSum(){
    if(!B||sumBusy||!sess||!S.sumEvery)return;var upto=starts[pi]||0;if(upto-sum.upTo<S.sumEvery)return;
    sumBusy=true;var bid=B.id;
    try{var chunk=T.slice(sum.upTo,upto).slice(-Math.max(12000,S.sumEvery));
      var t=await ctx.ai.call('把下面这段书的内容压缩成前情梗概：只写发生了什么、人物和关系走到哪一步，300 字以内，不评论不解读，直接输出梗概。'+(sum.text?('\n\n【此前的梗概】\n'+sum.text):'')+'\n\n【新读到的段落】\n'+chunk,{cfgId:sess.cfgId,maxTokens:700});
      if(t&&B&&B.id===bid){sum={text:String(t).trim().slice(0,600),upTo:upto};await ctx.storage.set('sum_'+bid,sum)}
    }catch(e){}finally{sumBusy=false}
  }
  /* ── 会话：开「共读 · 书名」频道＋挂常量块＋落「共读开始」标记线；退出落「共读结束」并摘块 ── */
  function threadOpts(){return {kind:'coread',name:'共读 · '+short(B.title,24),film:{title:B.title,hash:'post_'+B.id},quiet:true,memory:true}}
  async function startSession(){
    var ai=aiList.filter(function(a){return a.id===aiId})[0];if(!ai){toast('先选一位 TA');return false}
    var tid='';try{tid=await ctx.chat.openThread(ai.id,threadOpts())}catch(e){toast('打不开共读频道：'+String((e&&e.message)||e));return false}
    if(!host||!B)return false;
    sess={cfgId:ai.id,cfgName:ai.name,threadId:tid,startPage:pi,count:0,startedAt:Date.now(),lastAct:Date.now(),lastNudge:0,nudgeN:0,marked:false};listIds='';
    try{if(S.lastAi!==ai.id){S.lastAi=ai.id;saveS()}}catch(e){}
    try{ctx.sys.set(sysBlock(),{cfgId:ai.id,data:{postId:B.id,title:B.title}})}catch(e){}
    return true;
  }
  async function markStart(){/* v2.0.1：标记线只在第一次开口时落 */
    if(!sess||sess.marked)return;sess.marked=true;
    try{await ctx.chat.mark({kind:'coread',phase:'start',label:'共读 · 一起读《'+short(B.title,16)+'》'+(pi>0?(' · 从第 '+(pi+1)+' 页接着读'):''),content:'[共读] 我们开始一起读《'+B.title+'》。'+(pi>0?('从第 '+(pi+1)+' 页接着读。'):''),data:{postId:B.id,page:pi+1}})}catch(e){}
  }
  async function ensureThread(){if(!sess)return startSession();var cur=ctx.chat.current();if(!cur||cur.id!==sess.cfgId||cur.threadId!==sess.threadId){try{sess.threadId=await ctx.chat.openThread(sess.cfgId,threadOpts())}catch(e){toast('打不开共读频道');return false}}return true}
  async function endSession(){
    if(!sess)return;var s=sess;sess=null;try{ctx.sys.clear()}catch(e){}
    if(!s.marked)return;/* 没开过口就不留「共读结束」 */
    try{await ctx.chat.mark({kind:'coread',phase:'end',label:'共读结束 · 读到第 '+(pi+1)+' 页 · 聊了 '+s.count+' 句',content:'[共读] 这次一起读到第 '+(pi+1)+' 页，聊了 '+s.count+' 句。',data:{postId:B?B.id:'',page:pi+1,count:s.count}})}catch(e){}
  }
  async function sendNote(){
    var ta=q('.cr-bar textarea');if(!ta)return;var v=ta.value.trim();if(!v&&!quote){toast('写点什么给 TA');return}
    if(!await ensureThread())return;await markStart();
    var text=(quote?('「'+quote+'」\n'):'')+v;
    ta.value='';ta.style.height='';setQuote('');lastSel='';
    try{var ok=await ctx.chat.send(text,{tail:tail(),coread:{postId:B.id,page:pi+1,off:starts[pi]||0}});if(ok===false){toast('没有发出去');return}}
    catch(e){toast(String((e&&e.message)||e));return}
    paintNotes();if(!sess)return;sess.count++;sess.lastAct=Date.now();sess.nudgeN=0;
  }
  function typing(){var ta=q('.cr-bar textarea');return !!(ta&&(ta.value.trim()||document.activeElement===ta))}
  async function tick(){
    if(!sess||!S.nudge||!host||!B)return;var now=Date.now(),gap=S.nudge*60000;
    if(document.hidden||typing()||pending){sess.lastAct=now;return}
    if(now-sess.lastAct<gap||sess.nudgeN>=2||now-sess.lastNudge<Math.max(gap,600000))return;
    sess.lastNudge=now;sess.lastAct=now;sess.nudgeN++;await markStart();
    var ok=false;try{ok=await ctx.chat.nudge({kind:'coread',phase:'idle',label:'停留 '+S.nudge+' 分钟 · 第 '+(pi+1)+' 页',content:'[共读] 我在第 '+(pi+1)+' 页停了约 '+S.nudge+' 分钟，没说话。',tail:tail()+'\n[主动开口] 对方在这一页停了一会儿没说话，你先开口：就这一页说点什么、或问问对方看到哪儿了，一两句就好，自然一点。'})}catch(e){}
    if(!ok&&sess){sess.nudgeN--;sess.lastNudge=now-Math.max(gap,600000)+30000}
  }
  /* ── 书架 ── */
  function bookCard(p,mini,rr,fid){
    mini=(mini===true);var pp=rr||posMap[p.id];var d=dateOf(p.created);
    if(mini){var who=fid?aiList.filter(function(a){return a.id===fid})[0]:null;return '<div class="cr-book mini" data-id="'+esc(p.id)+'" data-fid="'+esc(fid||'')+'"><span class="cr-rmx" title="删除这条最近在读（进度与共读频道一并删除）">×</span><div class="cr-date'+(pp?' rd':'')+'">'+(pp?('<b>'+(pp.pct||0)+'<small style="display:inline;margin:0;font-size:0.5rem">%</small></b><small>read</small>'):('<b>'+d.d+'</b><small>'+d.m+'</small>'))+'</div><div class="cr-bm"><div class="cr-bt">'+esc(p.title)+'</div><div class="cr-bs">'+(pp?((who?('与 '+esc(who.name)+' '):'')+'读到 <i>'+esc(pp.ch||('第 '+(pp.page||1)+' 页'))+'</i> · '+(pp.pct||0)+'%'):'还没开始读')+'</div></div></div>'}/* 手机端：最近在读只显标题与阅读进度；v203-p：加「与谁」 */
    return '<div class="cr-book" data-id="'+esc(p.id)+'">'
      +'<div class="cr-date'+(pp?' rd':'')+'">'+(pp?('<b>'+(pp.pct||0)+'<small style="display:inline;margin:0;font-size:0.5rem">%</small></b><small>read</small>'):('<b>'+d.d+'</b><small>'+d.m+'</small>'))+'</div>'
      +'<div class="cr-bm"><div class="cr-bt">'+esc(p.title)+'</div>'
      +((pp&&pp.ch)?('<div class="cr-bs">读到 · <i>'+esc(pp.ch)+'</i></div>'):(p.subtitle?('<div class="cr-bs">'+esc(p.subtitle)+'</div>'):''))
      +(p.excerpt?('<div class="cr-bp">'+esc(p.excerpt)+'</div>'):'')
      +'<div class="cr-meta">'+(p.category?('<span class="cr-cat">'+esc(p.category)+'</span>'):'')+'<span>'+p.chars+' 字</span>'+(pp?('<span>·</span><span>第 '+(pp.page||1)+' 页</span>'):'')+'</div></div></div>';
  }
  function paintShelfList(){
    var box=q('#cr-list');if(!box)return;var s=qStr.trim().toLowerCase();
    var vis=s?posts.filter(function(p){return (p.title+' '+(p.subtitle||'')+' '+(p.category||'')+' '+(p.excerpt||'')).toLowerCase().indexOf(s)!==-1}):posts;
    var recent=[];if(!s){vis.forEach(function(p){var pp=posMap[p.id];if(!pp)return;var by=(pp.by&&typeof pp.by==='object')?pp.by:null;var ks=by?Object.keys(by).filter(function(k){return !!by[k]}):[];if(ks.length)ks.forEach(function(k){recent.push({p:p,fid:k,r:by[k]})});else recent.push({p:p,fid:pp.cfgId||'',r:pp})});recent.sort(function(a,b){return (b.r.updated||0)-(a.r.updated||0)});recent=recent.slice(0,5)}/* v203-p：最近在读按「书 × TA」各一条，绑到那位 TA 的共读频道 */
    box.innerHTML=(recent.length?('<div class="cr-lab">最近在读</div>'+recent.map(function(e){return bookCard(e.p,true,e.r,e.fid)}).join('')):'')
      +'<div class="cr-lab">书架 · '+vis.length+' 本</div>'
      +(vis.length?vis.map(function(p){return bookCard(p,false)}).join(''):'<div class="cr-empty">'+(s?'没有匹配的日志。':'Blog 里还没有日志。先在 Blog 写一篇，或把 txt 导入成一篇。')+'</div>');
    Array.prototype.forEach.call(box.querySelectorAll('.cr-book'),function(r){r.addEventListener('click',function(ev){if(ev.target&&ev.target.closest&&ev.target.closest('.cr-rmx')){ev.stopPropagation();rmRecent(r.getAttribute('data-id'),r.getAttribute('data-fid')||'');return}openBook(r.getAttribute('data-id'),r.getAttribute('data-fid')||'')})});
    try{var labs=box.querySelectorAll('.cr-lab'),shelfLab=labs[labs.length-1],n=shelfLab?shelfLab.nextElementSibling:null;while(n){var nx=n.nextElementSibling;if(n.classList&&n.classList.contains('cr-book')&&n.classList.contains('mini')){var p2=posts.filter(function(p){return p.id===n.getAttribute('data-id')})[0];if(p2){var tmp=document.createElement('div');tmp.innerHTML=bookCard(p2,false);var nn=tmp.firstChild;nn.addEventListener('click',function(){openBook(nn.getAttribute('data-id'),'')});n.parentNode.replaceChild(nn,n)}}n=nx}}catch(e){}
  }
  async function rmRecent(bid,fid){
    var p9=posts.filter(function(x){return x.id===bid})[0];var ttl=p9?p9.title:'这本书';
    var who=fid?(aiList.filter(function(a){return a.id===fid})[0]||null):null;
    var okc=false;try{okc=await confirmDlg('删除「'+ttl+'」'+(who?('与 '+who.name+' '):'')+'的这条最近在读？\n阅读进度会清掉，对应的「共读 · 书名」频道与里面的纸条一并删除；日志本身不动。','删除')}catch(e){okc=window.confirm('删除这条最近在读？进度与频道一并删除')}
    if(!okc)return;
    try{if(!fid){await ctx.storage.remove('pos_'+bid);try{await ctx.storage.remove('sum_'+bid)}catch(e2){}}
      else{var v=await ctx.storage.get('pos_'+bid);if(v){if(v.by&&typeof v.by==='object')delete v.by[fid];if(v.cfgId===fid){delete v.cfgId;delete v.pct;delete v.page;delete v.ch;delete v.updated}
        var left=(v.by&&Object.keys(v.by).length)||v.cfgId;if(left)await ctx.storage.set('pos_'+bid,v);else{await ctx.storage.remove('pos_'+bid);try{await ctx.storage.remove('sum_'+bid)}catch(e3){}}}}}catch(e){}
    try{if(fid&&typeof dbGetAll==='function'&&typeof dbDelete==='function'){var ths=await dbGetAll('chatThreads');for(var i=0;i<ths.length;i++){var t=ths[i];if(!t||t.friendId!==fid||t.kind!=='coread'||!t.film||t.film.hash!==('post_'+bid))continue;
      var ms=await dbGetAll('chatMessages');for(var j=0;j<ms.length;j++){if(ms[j]&&ms[j].threadId===t.id)await dbDelete('chatMessages',ms[j].id)}
      await dbDelete('chatThreads',t.id);try{await dbDelete('chatSummaries','sum_'+t.id)}catch(e4){}}}}catch(e){}
    if(B&&B.id===bid&&sess&&sess.cfgId===fid){try{ctx.sys.clear()}catch(e){}sess=null}
    try{toast('已删除')}catch(e){}paintShelf()}
  async function paintShelf(){
    if(!host)return;host.innerHTML='<div class="cr"><div class="cr-top"><button class="cr-mini" id="cr-x">← Blog</button><div class="cr-tt">共读间<small>Co-reading</small></div></div><div class="cr-shelf"><div class="cr-empty">读取书架…</div></div></div>';
    q('#cr-x').addEventListener('click',function(){ctx.ui.close()});
    posts=[];try{posts=await ctx.blog.list()}catch(e){}
    posMap={};try{var ks=await ctx.storage.list();for(var i=0;i<ks.length;i++){if(String(ks[i]).indexOf('pos_')===0){var v=await ctx.storage.get(ks[i]);if(v)posMap[String(ks[i]).slice(4)]=v}}}catch(e){}
    try{aiList=(await ctx.chat.list()).filter(function(a){return !a.isGroup})}catch(e){aiList=[]}
    if(!host)return;
    (function(){var has=function(id){return !!id&&aiList.some(function(a){return a.id===id})};if(has(aiId))return;var cur=ctx.chat.current();if(cur&&!cur.isGroup&&has(cur.id)){aiId=cur.id;return}var rec=Object.keys(posMap).map(function(k){return posMap[k]}).sort(function(a,b){return (b.updated||0)-(a.updated||0)}).filter(function(x){return has(x.cfgId)})[0];if(rec){aiId=rec.cfgId;return}if(has(S.lastAi)){aiId=S.lastAi;return}aiId=aiList[0]?aiList[0].id:''})();
    var sh=q('.cr-shelf');if(!sh)return;
    sh.innerHTML='<div class="cr-tools"><label class="cr-spill"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="cr-q" placeholder="搜索标题、副标题、分类或内容…" autocomplete="off" value="'+esc(qStr)+'"></label>'
      +'</div><div class="f-group"><label>和谁一起读</label><div class="sel"><select id="cr-ai">'+(aiList.length?aiList.map(function(a){return '<option value="'+esc(a.id)+'"'+(a.id===aiId?' selected':'')+'>'+esc(a.name)+'</option>'}).join(''):'<option value="">还没有 1对1 对话</option>')+'</select></div></div>'
      +'<div id="cr-list"></div>'
      +'<div class="cr-empty" style="padding:8px 4px 0;font-size:0.68rem;color:var(--tx3)">一篇日志＝一本书 · 密码日记本不列入 · 聊天落在 TA 的「共读 · 书名」频道里</div>';
    paintShelfList();
    var sel=q('#cr-ai');if(sel)sel.addEventListener('change',function(){aiId=sel.value});
    var inp=q('#cr-q');if(inp)inp.addEventListener('input',function(){qStr=inp.value;paintShelfList()});
  }
  /* ── 阅读器 ── */
  function cleanupBook(){clearTimeout(bgT);clearTimeout(resT);clearInterval(pendT);pending=false;typ=null;listIds='';try{if(ro)ro.disconnect()}catch(e){}ro=null;B=null;T='';starts=[0];done=false;pi=0;notes=[];bms=[];chapters=[];probe=null;pageEl=null;quote='';lastSel='';imm=false;roSize='';notesOpen=false;sum={text:'',upTo:0}}
  async function openBook(id,fid){/* v203-p：fid＝从「最近在读」点进来的那位 TA */
    if(!aiId){toast('先选一位 TA');return}
    var p=null;try{p=await ctx.blog.get(id)}catch(e){}
    if(!host)return;
    if(!p||!p.content){toast('这篇打不开');return}
    B={id:p.id,title:p.title||'无标题'};T=String(p.content).replace(/\r\n?/g,'\n').replace(/\u200b/g,'');chapters=detectChapters();
    bms=[];try{bms=(await ctx.storage.get('bm_'+B.id))||[]}catch(e){}
    sum={text:'',upTo:0};try{var sv=await ctx.storage.get('sum_'+B.id);if(sv&&typeof sv==='object')sum={text:String(sv.text||''),upTo:sv.upTo|0}}catch(e){}
    var pos=null;try{pos=await ctx.storage.get('pos_'+B.id)}catch(e){}
    posBy=(pos&&pos.by&&typeof pos.by==='object')?Object.assign({},pos.by):{};
    if(fid&&aiList.some(function(a){return a.id===fid}))aiId=fid;/* v203-p：点的是哪位 TA 的那条就接着和 TA 读 */
    else if(pos&&pos.cfgId&&aiList.some(function(a){return a.id===pos.cfgId}))aiId=pos.cfgId;/* 上次和谁读的就接着和谁读 */
    if(!host||!B)return;
    imm=false;notesOpen=false;paintReader();
    try{if(T.length>200000){toast('正在排版 '+(T.length/1048576).toFixed(1)+' MB 的书，稍等');if(pageEl)pageEl.innerHTML='<div style="padding:32px 0;text-align:center;color:var(--tx3);font-size:.8rem">正在排版 '+(T.length/1048576).toFixed(1)+' MB…</div>';await new Promise(function(r){setTimeout(r,40)})}}catch(e){}/* v241-a / v207-p：大书先给提示 */
    var pb=(aiId&&posBy[aiId])||pos;/* v203-p：进度按这位 TA 取；没和 TA 读过就从最近一次接着 */
    await relayout((pb&&pb.off)|0);
    if(!host||!B)return;
    if(!await startSession()){cleanupBook();if(host)paintShelf();return}
    paintNotes(true);try{if(ctx.chat.busy(sess.cfgId))pendOn()}catch(e){}wakeOn();
  }
  function paintReader(){
    var ai=aiList.filter(function(a){return a.id===aiId})[0];
    host.innerHTML='<div class="cr">'
      +'<div class="cr-top"><button class="cr-mini" id="cr-back">← 书架</button><div class="cr-tt">'+esc(B.title)+(ai?('<small>与 '+esc(ai.name)+' 共读</small>'):'')+'</div><span class="cr-fsw"><button class="cr-fsb" data-fs="s">A</button><button class="cr-fsb" data-fs="m">A</button><button class="cr-fsb" data-fs="l">A</button></span><button class="cr-mini" id="cr-toc" aria-label="目录与书签">目录</button><button class="cr-mini" id="cr-gear" aria-label="设置">⋯</button></div>'
      +'<div class="cr-prog"><i></i></div>'
      +'<div class="cr-page"><div class="cr-probe pv-body mdr"></div><div class="cr-text pv-body mdr"></div><div class="cr-busy"></div><div class="cr-hint"></div></div>'
      +'<div class="cr-nchip" id="cr-nchip">纸条区已隐藏 · 点这里显示</div>'
      +'<div class="cr-notes"'+(S.notes?'':' hidden')+'><div class="cr-peek"></div><div class="cr-nl"></div></div>'
      +'<div class="cr-quote"><b></b><button class="cr-mini" id="cr-qx">×</button></div>'
      +'<div class="cv-input glass cr-bar"><button class="cv-mini" id="cr-qbtn" title="引用：把书页上划中的字引进纸条" aria-label="引用"><svg viewBox="0 0 24 24"><path d="M6.5 5.5v13"/><path d="M11 8h7M11 12h7M11 16h4.5"/></svg></button><textarea class="cr-ta" rows="1" placeholder="写在页边给 TA…"></textarea><button class="send-btn" id="cr-send" aria-label="寄出"><svg viewBox="0 0 24 24"><path d="M4 12h13M13 6l6 6-6 6"/></svg></button></div>'
      +'</div>';
    probe=q('.cr-probe');pageEl=q('.cr-text');applyStyle();
    q('#cr-back').addEventListener('click',async function(){await leaveBook();if(host)paintShelf()});
    q('#cr-gear').addEventListener('click',openSettings);
    q('#cr-toc').addEventListener('click',openToc);
    Array.prototype.forEach.call(host.querySelectorAll('.cr-fsb'),function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-fs');if(v===S.fs)return;if(busyLayout){toast('排版中，稍等一下再改');return}S.fs=v;saveS();applyStyle();relayout(starts[pi]||0)})});
    q('.cr-peek').addEventListener('click',function(){if(!notes.length)return;notesOpen=!notesOpen;paintNotes()});
    q('#cr-nchip').addEventListener('click',function(){S.notes=1;saveS();paintNotes()});
    var pg=q('.cr-page'),sx=0,sy=0,st=0,hs=false;
    function hasSel(){var sel=window.getSelection();return !!(sel&&String(sel).trim())}
    function inHScroll(n){try{while(n&&n!==pg&&n.nodeType===1){if(n.scrollWidth>n.clientWidth+2){var ox=getComputedStyle(n).overflowX;if(ox==='auto'||ox==='scroll')return true}n=n.parentNode}}catch(e){}return false}/* 触点落在可横滑的表格 / 代码块里：这一下交给它自己滚，不翻页 */
    function tapAt(x){if(q('.cr-lay'))return;if(hasSel())return;var w=pg.clientWidth,rx=x-pg.getBoundingClientRect().left;
      if(S.flip==='tap'&&rx<w*0.3)go(-1);else if(S.flip==='tap'&&rx>w*0.7)go(1);else setImm(!imm)}
    pg.addEventListener('touchstart',function(ev){var t=ev.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now();hs=inHScroll(ev.target)},{passive:true});
    pg.addEventListener('touchend',function(ev){lastTouch=Date.now();var t=ev.changedTouches[0];var dx=t.clientX-sx,dy=t.clientY-sy;
      if(hs&&Math.abs(dx)>8){hs=false;return}/* 横滑元素内的横向手势不翻页 */
      if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.4){if(hasSel())return;go(dx<0?1:-1);return}
      if(Math.abs(dx)<8&&Math.abs(dy)<8&&Date.now()-st<300)tapAt(t.clientX);
    },{passive:true});
    pg.addEventListener('click',function(ev){if(Date.now()-lastTouch<700)return;if(ev.target.closest&&ev.target.closest('a'))return;tapAt(ev.clientX)});
    roSize=pg.clientWidth+'x'+pg.clientHeight;
    if(window.ResizeObserver){try{ro=new ResizeObserver(function(){onSize()});ro.observe(pg)}catch(e){ro=null}}
    q('#cr-send').addEventListener('click',sendNote);
    var ta=q('.cr-bar textarea');ta.addEventListener('input',function(){ta.style.height='';ta.style.height=Math.min(110,ta.scrollHeight)+'px';if(sess)sess.lastAct=Date.now()});
    ta.addEventListener('blur',function(){setTimeout(onSize,120)});
    q('#cr-qbtn').addEventListener('click',function(){var sel=window.getSelection();var t=sel?String(sel).trim():'';if(!t&&lastSel)t=lastSel;if(!t){toast('先在书页上划一段字');return}setQuote(t);lastSel='';try{if(sel&&sel.removeAllRanges)sel.removeAllRanges()}catch(e){}});
    q('#cr-qx').addEventListener('click',function(){setQuote('')});
  }
  function onSize(){
    var pg=q('.cr-page');if(!pg||!B)return;var sz=pg.clientWidth+'x'+pg.clientHeight;if(sz===roSize)return;
    var ae=document.activeElement;if(ae&&ae.tagName==='TEXTAREA')return;
    roSize=sz;clearTimeout(resT);resT=setTimeout(function tryIt(){if(!B||!probe)return;if(busyLayout){resT=setTimeout(tryIt,250);return}relayout(starts[pi]||0)},200);
  }
  /* ── 目录与书签 ── */
  function closeLay(){var l=q('.cr-lay');if(l)l.remove()}
  function openToc(){
    closeLay();var cr=q('.cr');if(!cr)return;var lay=document.createElement('div');lay.className='cr-lay';
    var curOff=starts[pi]||0,curCh=chapAt(curOff);
    var h='<div class="cr-lh"><b>目录</b><button class="cr-mini" id="cr-bm-add">＋ 当前页加书签</button><button class="cr-mini" id="cr-lay-x">关闭</button></div><div class="cr-lb">';
    h+='<div class="cr-lab">章节 · '+(chapters.length?(chapters.length+' 处'):'未识别到')+'</div>';
    if(chapters.length)h+=chapters.map(function(c){return '<div class="cr-tr'+(curCh===c?' on':'')+'" data-off="'+c.off+'"><span class="cr-tn">'+esc(c.title)+'</span><span class="cr-td"></span><span class="cr-tp">'+Math.round(c.off/Math.max(1,T.length)*100)+'%</span></div>'}).join('');
    else h+='<div class="cr-empty" style="padding:6px 0 10px;text-align:left">行首写「第X章」「Chapter N」或 Markdown 标题「# 第X章」就能识别出章节。</div>';
    h+='<div class="cr-lab">书签 · '+bms.length+' 个</div>';
    h+=(bms.length?bms.map(function(b,i){return '<div class="cr-tr" data-off="'+b.off+'"><span class="cr-tn">'+esc(b.snip||'（空页）')+'<small>'+new Date(b.t).toLocaleString('zh-CN')+'</small></span><span class="cr-td"></span><span class="cr-tp">'+Math.round(b.off/Math.max(1,T.length)*100)+'%</span><span class="cr-x" data-bm="'+i+'">×</span></div>'}).join(''):'<div class="cr-empty" style="padding:6px 0;text-align:left">还没有书签。</div>')+'</div>';
    lay.innerHTML=h;cr.appendChild(lay);
    lay.querySelector('#cr-lay-x').addEventListener('click',closeLay);
    lay.querySelector('#cr-bm-add').addEventListener('click',function(){var s=starts[pi]||0;if(bms.some(function(b){return b.off===s})){toast('这一页已有书签');return}bms.push({off:s,page:pi+1,t:Date.now(),snip:T.slice(s,s+40).replace(/\s+/g,' ').trim()});bms=bms.slice(-50);try{ctx.storage.set('bm_'+B.id,bms)}catch(e){}toast('已加书签');openToc()});
    Array.prototype.forEach.call(lay.querySelectorAll('.cr-tr'),function(r){r.addEventListener('click',function(ev){var x=ev.target.closest('.cr-x');if(x){var i=parseInt(x.getAttribute('data-bm'));bms.splice(i,1);try{ctx.storage.set('bm_'+B.id,bms)}catch(e){}openToc();return}closeLay();gotoOff(parseInt(r.getAttribute('data-off'))||0)})});
  }
  /* ── 设置：项目设置页同款卡 / 下拉 / 圆钮 ── */
  function openSettings(){
    closeLay();var cr=q('.cr');if(!cr)return;var lay=document.createElement('div');lay.className='cr-lay';
    var h='<div class="cr-lh"><b>共读间设置</b><button class="cr-mini" id="cr-lay-x">完成</button></div><div class="cr-lb">';
    CARDS.forEach(function(card){
      h+='<div class="cr-lab">'+esc(card[0])+'</div><div class="set-card">';
      card[1].forEach(function(r){var k=r[1];
        if(r[0]==='sel')h+='<div class="f-group"><label>'+esc(r[2])+(r[3]?('<span class="lb-note"> · '+esc(r[3])+'</span>'):'')+'</label><div class="sel"><select data-k="'+k+'">'+OPT[k].map(function(o){return '<option value="'+esc(o[0])+'"'+(String(S[k])===String(o[0])?' selected':'')+'>'+esc(o[1])+'</option>'}).join('')+'</select></div></div>';
        else h+='<div class="tog"><div class="tog-m"><div class="tog-t">'+esc(r[2])+'</div>'+(r[3]?('<div class="tog-s">'+esc(r[3])+'</div>'):'')+'</div><div class="sw2'+(S[k]?' on':'')+'" data-k="'+k+'" role="switch"></div></div>';
      });
      h+='</div>';
    });
    h+='<div class="cr-empty" style="padding:12px 4px;font-size:0.68rem">设置随备份走。存的只有进度、书签与前文梗概，书从 Blog 现读。</div></div>';
    lay.innerHTML=h;cr.appendChild(lay);
    lay.querySelector('#cr-lay-x').addEventListener('click',closeLay);
    Array.prototype.forEach.call(lay.querySelectorAll('select[data-k]'),function(sel){sel.addEventListener('change',function(){apply(sel.getAttribute('data-k'),sel.value)})});
    Array.prototype.forEach.call(lay.querySelectorAll('.sw2[data-k]'),function(sw){sw.addEventListener('click',function(){var k=sw.getAttribute('data-k');if(apply(k,S[k]?0:1)!==false)sw.classList.toggle('on',!!S[k])})});
    function apply(k,raw){
      if(!OPT[k])return false;var val=(typeof OPT[k][0][0]==='number')?Number(raw):String(raw);
      if(LAYOUT_KEYS[k]&&busyLayout){toast('排版中，稍等一下再改');return false}
      S[k]=val;saveS();
      if(LAYOUT_KEYS[k]){applyStyle();relayout(starts[pi]||0)}
      else if(k==='paper')applyStyle();else if(k==='notes')paintNotes();else if(k==='prog'||k==='flip')paintPg();
      else if(k==='wake'){if(val)wakeOn();else wakeOff()}else if(k==='nudge'&&sess)sess.lastAct=Date.now();
      return true;
    }
  }
  async function leaveBook(){wakeOff();if(sess)await endSession();if(B){try{await ctx.storage.set('pos_'+B.id,posRec())}catch(e){}}cleanupBook()}
  IBApps.register({
    id:'coread',name:'共读间',version:'2.7.0',sdk:2,inline:'blog',wall:true,
    icon:'<path d="M12 6.6c-1.7-1.4-3.9-2.1-6.6-2.1v13c2.7 0 4.9.7 6.6 2.1 1.7-1.4 3.9-2.1 6.6-2.1v-13c-2.7 0-4.9.7-6.6 2.1z"/><path d="M12 6.6v13"/>',
    mount:async function(h,c){
      host=h;ctx=c;css();host.style.padding='0';host.style.overflow='hidden';host.style.display='flex';host.style.flexDirection='column';
      await loadS();if(!host)return;
      onMsg=function(am){if(!sess||!am||am.role!=='assistant'||am.threadId!==sess.threadId)return;if(am.friendId&&am.friendId!==sess.cfgId)return;sess.count++;sess.lastAct=Date.now();if(S.auto&&S.notes&&!notesOpen)notesOpen=true;if(typ&&typ.row){try{typ.row.remove()}catch(e){}typ=null}paintNotes(true)};
      onTurn=function(ev){if(!mine(ev))return;if(ev.state==='start')pendOn();else if(ev.state==='end')pendOff()};
      onDelta=function(ev){onDeltaEv(ev)};
      ctx.on('message',onMsg);ctx.on('turn',onTurn);ctx.on('delta',onDelta);
      onSel=function(){try{var sel=window.getSelection();if(!sel||!sel.rangeCount||!pageEl)return;var t=String(sel).trim();if(t&&pageEl.contains(sel.anchorNode))lastSel=t.slice(0,240)}catch(e){}};
      document.addEventListener('selectionchange',onSel);
      onRes=function(){onSize()};window.addEventListener('resize',onRes);
      onVis=function(){if(!document.hidden){if(sess)sess.lastAct=Date.now();wakeOn()}};document.addEventListener('visibilitychange',onVis);
      tickT=setInterval(function(){tick()},15000);
      var hint='';try{hint=String(window._ibCoreadHintM||'');window._ibCoreadHintM=''}catch(e){}
      await paintShelf();
      if(hint&&host)openBook(hint);
    },
    back:function(){var l=q('.cr-lay');if(l){l.remove();return true}return false},/* v2.3.0：返回键先关目录 / 设置层 */
    unmount:function(){
      try{if(onMsg)ctx.off('message',onMsg);if(onTurn)ctx.off('turn',onTurn);if(onDelta)ctx.off('delta',onDelta)}catch(e){}try{document.removeEventListener('selectionchange',onSel)}catch(e){}try{window.removeEventListener('resize',onRes)}catch(e){}try{document.removeEventListener('visibilitychange',onVis)}catch(e){}
      clearInterval(tickT);clearTimeout(posT);wakeOff();
      if(B){try{ctx.storage.set('pos_'+B.id,posRec())}catch(e){}}
      if(sess){endSession()}
      cleanupBook();host=null;
    }
  });
})();

