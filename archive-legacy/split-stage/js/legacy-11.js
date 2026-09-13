

function _vmToneNatural(tone){
  try{
    var str=String(tone||'').trim();if(!str)return '';
    var EMO={'亲昵/撒娇':'语气亲昵、带点撒娇','开心':'语气开心','兴奋':'语气兴奋','愤怒/激动':'语气激动','难过/低落':'语气低落','疲惫':'听起来有些疲惫','紧张/不安':'语气有些紧张不安','犹豫/不确定':'语气有些犹豫','平静/中性':'语气平静'};
    var EMO2={'亲昵/撒娇':'撒娇','开心':'开心','兴奋':'兴奋','愤怒/激动':'激动','难过/低落':'低落','疲惫':'疲惫','紧张/不安':'不安','犹豫/不确定':'犹豫','平静/中性':'平静'};
    var out=[];
    str.split(/[；;]/).forEach(function(seg){
      seg=seg.trim();if(!seg)return;var m9;
      if((m9=seg.match(/^情绪倾向[:：](.+)$/))){var e9=m9[1].replace(/[\(（](?:较高|中等|较低)置信[\)）]\s*$/,'').trim().split(/，兼有|,兼有/);var a9=EMO[e9[0].trim()]||('语气'+e9[0].trim().replace(/\//g,'、'));if(e9[1]){var b9=e9[1].trim();a9+='，也有点'+(EMO2[b9]||b9.replace(/\//g,'、'))}out.push(a9);return}
      if((m9=seg.match(/^声线\/变化[:：](.+)$/))){m9[1].split('、').slice(0,3).forEach(function(v9){v9=v9.trim();if(v9&&!/\d/.test(v9))out.push(v9)});return}
      var t9=seg.replace(/\([^)]*\)/g,'').replace(/（[^）]*）/g,'').trim();
      if(/^语速/.test(t9)){if(/偏慢|偏快/.test(t9))out.push(t9);return}
      if(/^音量/.test(t9)){if(!/中等/.test(t9))out.push(t9);return}
      if(/停顿/.test(t9)){if(/较多/.test(t9))out.push('停顿较多');return}
      if(/^基频/.test(t9)){var r9=t9.split('·')[1];if(r9&&!/\d/.test(r9))out.push(r9.trim());return}
      if(/^语调/.test(t9)){if(!/中等/.test(t9))out.push(t9);return}
      if(t9&&t9.length<=12&&!/\d/.test(t9))out.push(t9);
    });
    return out.join('、');
  }catch(e){return ''}
}

var _vmACtx=null;
const _CALL_INSTR_BLOCK='\n\n【语音通话】以「[语音通话] 」或「[视频通话] 」开头的用户消息不是文字消息，而是对方此刻正与你实时通话时说出口的话。语音已被识别成文字，可能有少量同音错别字，按语境理解即可、不必逐字指出。此时你在接电话，而不是在处理任务，请像平时打电话一样口语化地接住这句话：短句、直接回应，一般三五句以内；不要用列表、标题、表格、代码块或括号动作描写，也不要把对方说的话当成任务需求来分析。前缀方括号内还可能附有「声学语气参考」——那是本机对这句话音频的即时声学摘要（情绪倾向/语速/音量/语调等），供你感知对方此刻的状态，自然回应即可，不要复述或逐项点评。你的回复会被逐句朗读给对方。收到「[语音通话已结束…]」或「[视频通话已结束…]」即表示电话已挂断，之后恢复平时的聊天方式。';/* 手机端：去「请」（提示词审查 #6） */
const _VID_INSTR_BLOCK='\n\n【视频通话】对方此刻开着摄像头在跟你视频通话，TA 的话以「[视频通话] 」前缀出现（同样是语音识别成文字）。若消息附有图片，那是 TA 镜头此刻的画面（按 TA 的设置间隔提供，不是每句都有；没给图就不要猜画面内容）。看到画面时可以自然地提起你看见的东西，别逐帧汇报。执行操作要用标签、界面才会执行（标签会自动从朗读里隐去）：想留影时输出 <ws_vsnap/>，界面会拍一张快照存进聊天，一次最多一枚、别连拍；没有标签就没有动作，不要在话里假装拍了。';
const _VGIFT_INSTR_BLOCK='\n【送礼物】视频通话里你可以选择送对方礼物——不涉及任何真实支付，它是一份心意和仪式感。在回复末尾输出 <ws_vgift kind=\"heart\"/>：kind 五选一，分量递增——heart 小心心（日常小心意）、bouquet 花束（郑重一点的场合）、fireworks 夏日烟火（隆重，对方屏幕上放烟花）、meteor 流星雨（更华丽隆重，整屏流星划过）、galaxy 银河铁道之夜（最高档礼物，星河与光的列车，极少数时刻）。\n一次一件，每条回复最多一枚标签。用户界面会放出送礼气泡、在聊天里落一张礼物卡、计入本次通话的礼物统计。\n规则：送礼物时说清楚为什么送，让礼物有来处；不要一被索要就送——分量越重越该稀有。\n送礼的选择权在你手上。如果对方很想要某个礼物，而你没有足够对等的理由去赠送，你可以选择和对方用礼物来谈一些有趣的条件，或是让对方满足你的要求——依你们的关系、你想要对方满足你什么要求而定。\n没有标签就没有礼物，不要口头假装送过。';/* 手机端：三档；手机端：礼物一期（仅视频通话进行中且开关开启时拼接注入） */
const _VID_NOVIS_NOTE='\n（当前接口不接收图片：本通视频通话你收不到任何画面帧或照片，与对方摄像头无关。不要描述或猜测画面、不要说画面黑；需要时说明你这边看不到画面。）';
const _GCALL_HIST_NOTE='\n【通话标记说明】历史消息里以「[语音通话] 」或「[视频通话] 」开头的，是 {U} 之前在群通话中说出口的话（语音识别成文字，可能有少量同音错别字）；「[语音通话已结束…]」「[视频通话已结束…]」是系统标记，表示那次通话已经挂断，标记之后若附有【通话记录】，那是那次通话的压缩纪要。这些都是过去的事，现在是普通的文字聊天。';
const _CALL_LANG_NAMES={en:'英语',ja:'日语',ko:'韩语'};const _CALL_LANG_EX={en:'It is a bit cold today.',ja:'今日はちょっと寒いね。',ko:'오늘은 좀 춥네.'};
function _callLangClause(l){var n=_CALL_LANG_NAMES[l]||'';return '\n【通话外语模式】本次通话开启了'+n+'朗读：通话中你的每一句话先用中文写出（用作屏幕字幕），随后紧跟同一句的'+n+'版本、整句包在 <ibsay> 与 </ibsay> 之间，例：今天有点冷。<ibsay>'+(_CALL_LANG_EX[l]||'It is a bit cold today.')+'</ibsay>。屏幕只显示中文，<ibsay> 里的'+n+'会被读出来；除这个标签外不要用任何其它标记，也不要单独解释翻译。非通话消息不使用此格式。'}/* v138-c：③外语朗读子句 */
function _ibVoiceClause(l){
  var n=_CALL_LANG_NAMES[l]||'';
  if(!n)return '\n\n【语音条】用户为你开启了语音条：当某条回复很适合「说出口」（问候、安慰、道晚安、一句撒娇或感叹）时，在该条消息的最末尾追加一个自闭合标签 <ibvoice/>。用户会在这条消息下看到一条可点播的语音条，点开听到的就是这条消息的原文朗读。普通信息性回复不要加；一条回复至多一个；语音通话中不要使用本标签；除该标签外不要附加任何解释。';
  return '\n\n【语音条·'+n+'】用户为你开启了'+n+'语音条：当某条回复适合「说出口」时，正文照常全部用中文写，然后在消息最末尾把同一段话的'+n+'版本包进 <ibvoice>…</ibvoice>（例：<ibvoice>'+(_CALL_LANG_EX[l]||'')+'</ibvoice>）。气泡只显示中文，语音条会用'+n+'朗读，用户点语音条旁的「文」可查看'+n+'原文——'+n+'绝不要写进正文。普通信息性回复不要加；一条回复至多一个；语音通话中不要使用本标签。';
}
const _ALARM_INSTR_BLOCK='\n\n【手机闹钟】用户已允许你操作 TA 手机系统时钟里的闹钟。标签如下；ws_alarm / ws_alarm_off / ws_alarm_snooze / ws_timer 每条回复合计最多 3 个，ws_alarm_list 不计：\n<ws_alarm time="HH:MM" label="用途" date="YYYY-MM-DD" days="1,3,5"/>\n<ws_alarm_off label="闹钟名"/> 或 <ws_alarm_off time="HH:MM"/> 或 <ws_alarm_off id="IB 记录 id"/>\n<ws_alarm_snooze minutes="10"/>\n<ws_alarm_list/>\n<ws_timer minutes="分钟数" label="用途"/>\n规则：\n- time 必填，24 小时制；label 30 字内、写清用途（之后按 label 关闭最可靠）。\n- 不写 date 也不写 days＝最近的一次（24 小时内响）。\n- days＝每周重复，1=周一 … 7=周日，逗号分隔；每天＝1,2,3,4,5,6,7。系统时钟只支持「每周」这一种重复，每月 / 每年不支持，如实告诉用户。\n- date＝指定日期的一次性闹钟，可以是今后一年内任意一天，不能与 days 同时给。24 小时内的立即写入系统时钟；超过 24 小时的由 IB 登记、在响铃前 24 小时内自动写入（回执里会写明），写入前可用 <ws_alarm_off id="…"/> 精确撤销。\n- ws_alarm_off 按 label 或 time 请求系统时钟关闭匹配的闹钟（一次性闹钟＝关闭，重复闹钟＝跳过下一次）；没匹配到或匹配到多个时，系统时钟可能弹出选择界面让用户确认。\n- ws_alarm_snooze 只对正在响铃的闹钟有效。\n- ws_alarm_list 返回 IB 经手的闹钟记录（含 id、状态、下次响铃）与系统当前最近一个闹钟；用户在系统时钟里手动建的其他闹钟 IB 看不到。\n- 倒计时走系统时钟的计时器，1–1440 分钟；没有取消标签，要取消请用户到时钟里手动关。\n执行结果会在之后的消息回传给你（设闹钟时附系统最近一个闹钟的时间供核对）；未收到回执前不要声称已设好。闹钟与 IB 日历是两套独立功能，不要互相代替。';
function _alarmToolOn(){try{return !!(_mp&&_mp.alarm&&_mp.alarm.on)&&!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform()&&window.Capacitor.Plugins&&window.Capacitor.Plugins.IBAlarm)}catch(e){return false}}/* 手机端：#3 开关 + 壳内插件双门槛 */

const _PROCALL_INSTR_BLOCK='\n\n【打电话功能】你可以在回复中单独一行输出 <ws_call say="一句话"/> 给用户打电话；加 kind="video"（<ws_call say="一句话" kind="video"/>）就是视频电话。say 里写一段不超过 16 个字的自然表述，作为你打电话的理由，用户屏幕上会浮出来电提示与这一段话。每条回复最多 1 次。语音是常态；视频电话在有画面才有意义的时候用（想看看 TA、看 TA 在做什么、让 TA 看看你），偶尔为之。TA 接听后就是正常通话（走通话管线，文字稿会留在聊天历史）。执行结果会随后续消息回传给你。';/* 手机端：分语音 / 视频，视频偶尔为之（用户口径） *//* 手机端：#4 say 替代 reason；旧 reason 属性仍兼容解析 */
var _ibInvT=0;
function _ibCallKindM(m){
  try{var t=String((m&&m.content)||'');if(/<ws_call\b[^>]*\bkind\s*=\s*["']?video/i.test(t))return 'video';var sy=(t.match(/\bsay\s*=\s*"([^"]*)"/)||[])[1]||'';if(/^\s*[\[【]?视频[\]】｜|:：]/.test(sy))return 'video'}catch(e){}return 'voice'}
function _ibSayStrip(s){return String(s||'').replace(/^\s*[\[【]?视频[\]】｜|:：]\s*/,'')}
function _ibShowCallInvite(cfg,reason,video){reason=_ibSayStrip(reason);video=!!video;/* 手机端：video＝视频来电 */
  try{var old9=document.getElementById('ib-callinv');if(old9)old9.remove()}catch(e){}
  try{if(_ibInvT){clearTimeout(_ibInvT);_ibInvT=0}}catch(e){}
  if(!document.getElementById('ib-callinv-style')){
    var st=document.createElement('style');st.id='ib-callinv-style';
    st.textContent='#ib-callinv{position:fixed;z-index:4650;top:calc(14px + var(--sat,0px));left:50%;transform:translateX(-50%);width:min(92vw,380px);display:flex;align-items:center;gap:11px;padding:11px 12px;border-radius:22px;'
      +'border:1px solid rgba(255,255,255,0.55);background:linear-gradient(168deg,rgba(252,254,255,0.86),rgba(238,245,253,0.72));color:#122644;'
      +'box-shadow:0 18px 46px rgba(20,35,70,0.26),inset 0 1px 0 rgba(255,255,255,0.85);backdrop-filter:blur(22px) saturate(1.5);-webkit-backdrop-filter:blur(22px) saturate(1.5);'
      +'animation:ibInvIn 0.42s cubic-bezier(0.2,0.9,0.3,1.1)}'
      +'body.theme-infernal #ib-callinv{background:linear-gradient(168deg,rgba(24,34,58,0.88),rgba(15,22,40,0.8));color:#e9effc;border-color:rgba(255,255,255,0.2);box-shadow:0 18px 46px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.16)}'
      +'#ib-callinv.out{animation:ibInvOut 0.26s ease forwards}'
      +'@keyframes ibInvIn{from{transform:translate(-50%,-130%);opacity:0}to{transform:translate(-50%,0);opacity:1}}'
      +'@keyframes ibInvOut{to{transform:translate(-50%,-130%);opacity:0}}'
      +'#ib-callinv .ci-ava{position:relative;flex:none;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:1.2rem;overflow:visible;background:linear-gradient(160deg,rgba(255,255,255,0.9),rgba(255,255,255,0.5));border:1px solid #fff;box-shadow:0 6px 16px rgba(70,110,170,0.28)}'
      +'body.theme-infernal #ib-callinv .ci-ava{background:linear-gradient(160deg,rgba(255,255,255,0.18),rgba(255,255,255,0.05));border-color:rgba(255,255,255,0.3)}'
      +'#ib-callinv .ci-ava img{width:100%;height:100%;border-radius:50%;object-fit:cover}'
      +'#ib-callinv .ci-ava::before{content:"";position:absolute;inset:-6px;border-radius:50%;border:1px solid var(--acc);opacity:0.55;animation:ibInvRing 1.7s ease-out infinite}'
      +'@keyframes ibInvRing{0%{transform:scale(0.92);opacity:0.6}100%{transform:scale(1.42);opacity:0}}'
      +'@media (prefers-reduced-motion:reduce){#ib-callinv,#ib-callinv .ci-ava::before{animation:none}}'
      +'#ib-callinv .ci-m{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}'
      +'#ib-callinv .ci-nm{font-family:var(--serif);font-weight:600;font-size:1.02rem;letter-spacing:0.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      +'#ib-callinv .ci-t{font-style:normal;font-size:0.74rem;opacity:0.62;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      +'#ib-callinv .ci-t.say{font-family:var(--serif);font-style:italic;font-size:0.84rem;opacity:0.78}'
      +'#ib-callinv .ci-b{flex:none;width:40px;height:40px;border-radius:50%;border:1px solid rgba(120,160,210,0.5);background:rgba(255,255,255,0.7);color:inherit;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;-webkit-tap-highlight-color:transparent;box-shadow:inset 0 1px 0 #fff,0 6px 14px rgba(88,124,178,0.18)}'
      +'body.theme-infernal #ib-callinv .ci-b{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.24);box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 6px 14px rgba(0,0,0,0.3)}'
      +'#ib-callinv .ci-b svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}'
      +'#ib-callinv .ci-b:active{transform:scale(0.92)}'
      +'#ib-callinv .ci-yes{border-color:rgba(114,168,216,0.7);background:linear-gradient(168deg,rgba(114,168,216,0.34),rgba(114,168,216,0.14));color:var(--acc)}'
      +'body.theme-infernal #ib-callinv .ci-yes{background:linear-gradient(168deg,rgba(114,168,216,0.3),rgba(114,168,216,0.1))}'
      +'#ib-callinv .ci-yes svg{fill:currentColor;stroke:none;width:19px;height:19px}';
    document.head.appendChild(st);
  }
  var av='';try{av=_pfAvatar(cfg)||''}catch(e){}
  var nm='AI';try{nm=cfgName(cfg)||'AI'}catch(e){}
  var d=document.createElement('div');d.id='ib-callinv';d.setAttribute('role','dialog');d.setAttribute('aria-label',nm+(video?' 邀你视频通话':' 邀你语音通话'));
  d.innerHTML='<span class="ci-ava">'+(av?'<img src="'+esc(av)+'" alt="">':esc(nm.charAt(0).toUpperCase()))+'</span>'
    +'<span class="ci-m"><b class="ci-nm">'+esc(nm)+'</b><i class="ci-t'+(reason?' say':'')+'">'+(reason?((video?'视频来电 · ':'')+esc(reason)):(video?'邀你视频通话':'邀你语音通话'))+'</i></span>'/* 手机端：#4 AI 写的那句话代替默认文案（衬线斜体略加醒目） */
    +'<button type="button" class="ci-b ci-no" aria-label="暂不接听"><svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button>'
    +'<button type="button" class="ci-b ci-yes" aria-label="接听"><svg viewBox="0 0 24 24"><path d="M20.4 15.5v2.5a1.9 1.9 0 0 1-2.1 1.9 16.4 16.4 0 0 1-14.2-14.2A1.9 1.9 0 0 1 6 3.6h2.5a1.9 1.9 0 0 1 1.9 1.6c.12.9.34 1.77.66 2.6a1.9 1.9 0 0 1-.43 2l-1.06 1.06a14.8 14.8 0 0 0 3.53 3.53l1.06-1.06a1.9 1.9 0 0 1 2-.43c.83.32 1.7.54 2.6.66a1.9 1.9 0 0 1 1.66 1.93z"/></svg></button>';
  document.body.appendChild(d);
  var close=function(){try{if(_ibInvT){clearTimeout(_ibInvT);_ibInvT=0}}catch(e){}try{if(window.IBNative&&window.IBNative.callDismiss)window.IBNative.callDismiss()}catch(e){}try{d.classList.add('out');setTimeout(function(){try{d.remove()}catch(e){}},280)}catch(e){}};/* 手机端：横幅关掉同时撤原生来电通知 */
  d.querySelector('.ci-no').addEventListener('click',close);
  d.querySelector('.ci-yes').addEventListener('click',async function(){
    close();
    try{await openConv(cfg);await new Promise(function(r){setTimeout(r,280)});if(window._IBCALL)await window._IBCALL.open(video?{video:true}:undefined)}catch(e){toast('接听失败，请到会话里手动拨打')}
  });
  _ibInvT=setTimeout(close,60000);
  try{window._ibPendCall={fid:cfg.id,say:reason||'',ts:Date.now(),video:video};if(window.IBNative&&window.IBNative.available&&window.IBNative.callRing&&document.visibilityState!=='visible'){var _ic9='';try{_ic9=_ibAvaSmGet(cfg.id)||'';_ibAvaSmWarm(cfg.id)}catch(e){}window.IBNative.callRing({fid:cfg.id,name:nm,say:reason||'',kind:video?'video':'voice',icon:_ic9,theme:document.body.classList.contains('theme-infernal')?'dark':'light',timeout:60000})}}catch(e){}/* 手机端：应用不在前台时改走原生来电（CallStyle 通知＋铃声震动＋锁屏全屏），接听 / 拒绝各自回到这里 */
  try{navigator.vibrate&&navigator.vibrate([90,70,90])}catch(e){}
}
async function _ibProCallExecM(cfg,op){/* 手机端：#2 执行器：门槛→上限→弹窗；结果按动作类回传 */
  try{
    var cs9=await loadCALL();
    var pid=cfg?cfg.id:'';
    var _pcOn9=function(s9){return !!(s9&&s9.on!==false&&s9.perApi&&s9.perApi[pid]&&s9.perApi[pid].procall)};
    var pOn=_pcOn9(cs9);
    if(!pOn){try{cs9=await loadCALL(true);pOn=_pcOn9(cs9)}catch(e){}}
    if(!pOn)return{ok:false,reason:'主动打电话未开启（通话设置 → 独立配置 → 这位 AI），请不要再输出该标签'};
    if(cfg&&cfg._group)return{ok:false,reason:'群聊不支持来电'};
    if(op._pcCap)return{ok:false,reason:'来电邀请每条回复最多 1 个，多余的未执行'};
    if(window._IBCALL&&window._IBCALL.active&&window._IBCALL.active())return{ok:true,label:'来电邀请 · 已在通话中',response:'你们当前已经在通话中，没有再弹来电小窗。'};
    var raw9=String(op.say||wsAttr(op.attrs||'','say')||wsAttr(op.attrs||'','reason')||''),vk9=/^video$/i.test(String(op.kind||wsAttr(op.attrs||'','kind')||''))||/^\s*[\[【]?视频[\]】｜|:：]/.test(raw9),say9=_ibclSayTrim(_ibSayStrip(raw9));/* 手机端：kind="video" 或「视频｜」前缀＝视频来电 *//* 手机端：展示硬顶 40→16 字口径（超出加省略号），横幅与来电卡同一口径 */
    _ibShowCallInvite(cfg,say9,vk9);
    return{ok:true,label:(vk9?'视频':'')+'来电邀请已送达',say:say9,video:vk9,response:(vk9?'视频':'')+'来电提示已在用户屏幕弹出（60 秒无人理会自动收起），来电卡也已显示在聊天里'+(say9?'（写着「'+say9+'」）':'')+'。用户接听即进入'+(vk9?'视频':'语音')+'通话；未接听时请不要反复发起。'};/* 手机端：回传口径去掉「未接不代表拒绝」的安慰句（与提示词审查 #2 同向） */
  }catch(e){return{ok:false,reason:'来电弹窗失败：'+String((e&&e.message)||e).slice(0,60)}}
}

function _ibclIsEnd(m){return !!(m&&m.role==='user'&&/^\[(?:语音|视频)通话已结束/.test(String(m.content||'')))}
function _giftNamesM(m){var c=(typeof _cfgs!=='undefined'&&_cfgs||[]).find(function(x){return x&&x.id===(m&&m.friendId)});return {aN:(c&&cfgName(c))||'TA',uN:((typeof _about!=='undefined'&&_about&&_about.name)||'用户')}}
function _giftLineM(m){
  try{var g=(m&&m.gift)||{};var t=((typeof _IBGIFT!=='undefined')&&_IBGIFT[g.kind]||{}).t||g.kind||'礼物';var nm=_giftNamesM(m);var n=parseInt(g.n,10)||1;return '[礼物记录] '+nm.aN+' 在视频通话中向 '+nm.uN+' 送出了礼物「'+t+'」'+(n>1?' ×'+n:'')+'。'}catch(e){return String((m&&m.content)||'')}}
function _giftSumLineM(m){/* 结束标记的 API 副本追加礼物汇总（读 callEnd.gifts，谁送给谁写明） */
  try{var gs=(m&&m.callEnd&&m.callEnd.gifts)||null;if(!gs||!(gs.total>0))return '';var nm=_giftNamesM(m);var ks=gs.kinds||gs.cnt||{};var ord=(typeof _IBGIFT!=='undefined')?Object.keys(_IBGIFT):[];var parts=[];ord.forEach(function(k){if(ks[k]>0)parts.push(((_IBGIFT[k]||{}).t||k)+' ×'+ks[k])});Object.keys(ks).forEach(function(k){if(ord.indexOf(k)<0&&ks[k]>0)parts.push(k+' ×'+ks[k])});return '[视频通话中 '+nm.aN+' 送给 '+nm.uN+' 的礼物：'+(parts.length?parts.join('、'):('共 '+gs.total+' 件'))+'（共 '+gs.total+' 件）]'}catch(e){return ''}}
function _snapLineM(m){/* TA 拍的快照同样是用户侧消息，API 副本写明拍摄者 */
  try{var nm=_giftNamesM(m);return (m&&m.snap==='ai')?('[视频通话留影] 这张图是 '+nm.aN+' 在视频通话中拍下的 '+nm.uN+' 的镜头画面。'):'[视频通话快照] 这张图是视频通话中拍下的镜头画面。'}catch(e){return '[视频通话快照]'}}
function _ibclSayTrim(t){t=String(t||'').replace(/\s+/g,' ').trim();return t.length>60?t.slice(0,60)+'…':t}
function _ibclAvaM(el,c,nm){try{if(!el)return;var av=c?(_pfAvatar(c)||''):'';if(av){el.style.backgroundImage='url("'+av+'")';el.textContent=''}else{el.style.backgroundImage='';el.textContent=(nm||'?').trim().charAt(0).toUpperCase()||'?'}}catch(e){}}
function _ibclInviteM(m,inv){var op=(inv&&inv.op)||{},res=(inv&&inv.res)||null;
  var _vk=_ibCallKindM(m)==='video',say=_ibclSayTrim(_ibSayStrip(op.say||wsAttr(op.attrs||'','say')||wsAttr(op.attrs||'','reason')||''));/* 手机端 */
  var ci=m.callInv||{};
  var c=(_cfgs||[]).find(function(x){return x.id===m.friendId})||null;
  var nm='TA';try{nm=(c?cfgName(c):(m.senderName||''))||'TA'}catch(e){}
  var w=document.createElement('div');w.className='ibcl-wrap';w.dataset.invFor=m.id||'';
  var d=document.createElement('div');d.className='ibcl inv';
  var fail=!!(res&&res.ok===false),ans=ci.st==='answered',decl=ci.st==='declined';
  d.innerHTML='<div class="l-ava" aria-hidden="true"></div><div class="l-nm"></div><div class="l-sub">'+(_vk?'邀你视频通话':'邀你语音通话')+'</div><div class="l-say"></div><div class="l-note" hidden></div><div class="l-acts"></div>';
  _ibclAvaM(d.querySelector('.l-ava'),c,nm);
  d.querySelector('.l-nm').textContent=nm;
  var _sayEl=d.querySelector('.l-say');if(say)_sayEl.textContent='\u201c'+say+'\u201d';else _sayEl.hidden=true;/* 手机端：②默认文案已在 .l-sub 那行，没写 say 时不再重复一遍 */
  var note=d.querySelector('.l-note'),acts=d.querySelector('.l-acts');
  var IC_YES='<svg viewBox=\"0 0 24 24\"><path d=\"M20.4 15.5v2.5a1.9 1.9 0 0 1-2.1 1.9 16.4 16.4 0 0 1-14.2-14.2A1.9 1.9 0 0 1 6 3.6h2.5a1.9 1.9 0 0 1 1.9 1.6c.12.9.34 1.77.66 2.6a1.9 1.9 0 0 1-.43 2l-1.06 1.06a14.8 14.8 0 0 0 3.53 3.53l1.06-1.06a1.9 1.9 0 0 1 2-.43c.83.32 1.7.54 2.6.66a1.9 1.9 0 0 1 1.66 1.93z\"/></svg>',IC_NO='<svg viewBox=\"0 0 24 24\"><path d=\"M3.6 14.9c-1.1-1.1-1-2.9.2-3.9C6.5 8.8 9.3 7.8 12 7.8s5.5 1 8.2 3.2c1.2 1 1.3 2.8.2 3.9l-1.3 1.3c-.9.9-2.3 1-3.3.3l-1.6-1.2c-.6-.4-.9-1.1-.9-1.8v-1c-.4-.1-.8-.1-1.3-.1s-.9 0-1.3.1v1c0 .7-.3 1.4-.9 1.8l-1.6 1.2c-1 .7-2.4.6-3.3-.3z\"/></svg>';
  function mkc(kind,lab,fn){var a=document.createElement('div');a.className='l-act';var b=document.createElement('button');b.type='button';b.className='l-cb '+kind;b.setAttribute('aria-label',lab);b.innerHTML=kind==='yes'?IC_YES:IC_NO;b.addEventListener('click',function(ev){ev.stopPropagation();fn(b)});var sp=document.createElement('span');sp.textContent=lab;a.appendChild(b);a.appendChild(sp);acts.appendChild(a)}
  function mkl(t,pri,fn){var b=document.createElement('button');b.type='button';b.className='l-lnk'+(pri?' pri':'');b.textContent=t;b.addEventListener('click',function(ev){ev.stopPropagation();fn(b)});acts.appendChild(b)}
  if(fail){d.classList.add('fail');note.hidden=false;note.textContent=String((res&&res.reason)||'来电未送达').slice(0,60)}
  else if(ans){d.classList.add('done');note.hidden=false;note.textContent='已接听 · '+_hmOnly(ci.at||ci.ts);mkl('再拨一次',false,function(){_ibclAnswerM(m,c)})}
  else if(decl){d.classList.add('done');note.hidden=false;note.textContent='当时没有接听';mkl('回拨',true,function(){_ibclAnswerM(m,c)})}
  else{mkc('no','暂不',function(){_ibclDeclineM(m,c)});mkc('yes','接听',function(){_ibclAnswerM(m,c)})}
  w.appendChild(d);return w}
async function _ibclUnfoldOnDelM(m){
  try{var tr=(m&&m.callEnd&&m.callEnd.transcript)||[];if(!tr.length)return;
    for(var i=0;i<tr.length;i++){try{var r=await dbGet('chatMessages',tr[i].id);if(r&&r.callFold){delete r.callFold;await dbPut('chatMessages',r)}}catch(e){}}
    try{if(typeof _msgs!=='undefined'&&_msgs&&_msgs.forEach)_msgs.forEach(function(x){if(x&&x.callFold&&tr.some(function(t){return t&&t.id===x.id}))delete x.callFold})}catch(e){}
  }catch(e){}}
async function _ibclAnswerM(m,c){
  try{
    if(window._IBCALL&&window._IBCALL.active&&window._IBCALL.active()){toast('已在通话中');return}
    if(!c){toast('这位联系人已不存在');return}
    if(!_activeCfg||_activeCfg.id!==c.id){await openConv(c);await new Promise(function(r){setTimeout(r,280)})}
    try{var b9=document.getElementById('ib-callinv');if(b9)b9.remove()}catch(e){}
    try{if(window.IBNative&&window.IBNative.callDismiss)window.IBNative.callDismiss()}catch(e){}/* 手机端 */
    if(window._IBCALL)await window._IBCALL.open(_ibCallKindM(m)==='video'?{video:true}:undefined);/* 手机端：视频来电按视频接 */
    if(window._IBCALL&&window._IBCALL.active()&&m){m.callInv={st:'answered',at:Date.now()};try{await dbPut('chatMessages',m)}catch(e){}try{redrawMsg(m)}catch(e){}}
    else{try{if(c)_gwFeedQ.push({fid:c.id,text:'[来电] 用户点了接听，但通话未能建立（本机设备或权限原因），这次没有接通。'})}catch(e){}}/* v167-p ②：接听失败也回传，与「暂不」对称 */
  }catch(e){toast('接听失败，请到会话里手动拨打')}}
async function _ibclDeclineM(m,c){
  try{if(window.IBNative&&window.IBNative.callDismiss)window.IBNative.callDismiss()}catch(e){}/* 手机端 */
  if(m){m.callInv={st:'declined',at:Date.now()};try{await dbPut('chatMessages',m)}catch(e){}}
  try{var b9=document.getElementById('ib-callinv');if(b9)b9.remove()}catch(e){}
  try{if(c)_gwFeedQ.push({fid:c.id,text:'[来电] 用户看到了你的来电邀请，这次没有接听，请不要反复发起。'})}catch(e){}/* 婉拒落库＋随下一条消息回传 */
  try{redrawMsg(m)}catch(e){}}

var _recPendM={},_recErrM={};
async function _callWriterM(c){if(c&&c._group){var u9=(typeof pickGroupUtilCfg==='function')?pickGroupUtilCfg(c._group):null;if(u9)return u9}/* 手机端：群通话的执笔＝群里第一位配好 Key 的未静默成员 */var p={};try{var s=(typeof loadCALL==='function')?await loadCALL():await dbGet('apiSettings','callSettings');p=(s&&s.perApi&&s.perApi[c.id])||{}}catch(e){p={}}if(p&&p.memApi){var w=(_cfgs||[]).find(function(a){return a.id===p.memApi});if(w&&w.apiKey)return w}return c}
function _txtOfM(r){if(r==null)return '';if(typeof r==='string')return r;if(typeof r==='object'){var s=String(r.t||r.text||r.content||'');if(!s.trim()&&r.k)s=String(r.k);return s.replace(/```[a-zA-Z]*[ \t]*/g,'')}return String(r)}
function _fmtDurM(s){s=Math.max(0,Math.round(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function _callRecTask(aN,uN,o9){o9=o9||{};var gp=!!o9.grp;return (gp?('这是群「'+aN+'」里'+uN+'与多位成员的一次'+(o9.vid?'视频':'语音')+'群通话完整文字稿（未删节）'):('这是'+aN+'与'+uN+'一次'+(o9.vid?'视频':'语音')+'通话的完整文字稿（未删节）'))+'。这次通话之后，原始文字稿只在聊天界面里展示、不再计入上下文；上下文中只保留你写的这段通话记录，供后续对话参考。写一段通话记录：\n1. 第三人称、客观陈述：谈了什么、'+(gp?'谁':'')+'说定了什么（约定、时间、地点、待办）、'+(gp?'各人':'双方')+'的态度与情绪基调，以及会影响后续对话的细节。\n2. 只写通话里真实出现的内容，不推测、不补写、不评价。\n3. 用名字称呼'+(gp?'每个人':'双方')+'，不用含混的代词开头。\n4. 100～800 字，按内容多少定长短，可以分段。'+(o9.gift?'\n5. 文字稿里「（向 '+uN+' 送出礼物：…）」是通话界面的礼物记录：礼物是 '+aN+' 送给 '+uN+' 的，写进记录时要写明是 '+aN+' 送出的，不能写成 '+uN+' 送的。':'')+'\n只输出记录正文，不要标题、不要解释、不要引号。'}
function _recCap(t,max){t=String(t||'').trim();if(t.length<=max)return t;var cut=t.slice(0,max),i=Math.max(cut.lastIndexOf('。'),cut.lastIndexOf('！'),cut.lastIndexOf('？'),cut.lastIndexOf('.'),cut.lastIndexOf('!'),cut.lastIndexOf('?'));return i>max*0.6?cut.slice(0,i+1):cut+'…'}/* 硬上限：超长时退到最后一个句末 */
async function _callTranscriptM(m){var fid=m.friendId,th=m.threadId||'';
  var all=(await dbGetByIndex('chatMessages','byFriend',fid)).filter(function(x){return (x.threadId||'')===th}).sort(function(a,b){return (a.timestamp||0)-(b.timestamp||0)});
  var ix=all.findIndex(function(x){return x.id===m.id});if(ix<0)throw new Error('找不到这条通话记录');
  var end=all[ix],block=[],raw=[],st9=(end.callEnd&&end.callEnd.transcript)||null;
  if(st9&&st9.length){block=st9.slice()}
  else{for(var i=ix-1;i>=0;i--){var x=all[i];if(x.role==='user'){if(/^\[(?:语音|视频)通话\] /.test(String(x.content||''))||x.gift||/^\[视频通话快照\]/.test(String(x.content||'')))block.unshift(x);else break}/* 手机端：礼物 / 快照消息不再截断回溯 */else block.unshift(x)}
   while(block.length&&block[0].role!=='user')block.shift();
   var nx=all[ix+1];if(nx&&nx.role!=='user'&&(nx.timestamp||0)-(end.timestamp||0)<600000)block.push(nx);
   raw=block.slice()}
  if(!block.length)throw new Error('这次通话没有可总结的内容');
  var c=(_cfgs||[]).find(function(x){return x.id===fid})||((typeof _activeCfg!=='undefined'&&_activeCfg&&_activeCfg.id===fid)?_activeCfg:null);if(!c)throw new Error('找不到通话对象');/* 手机端：群通话 */
  var uN=(_about&&_about.name)||'用户',aN=cfgName(c);
  var body=block.map(function(x){if(/^\[视频通话快照\]/.test(String(x.content||'')))return (x.snap==='ai'?'（'+(x.snapBy||aN)+' 拍了一张画面快照）':'（画面快照一张）');if(x.gift)return aN+'：（向 '+uN+' 送出礼物：'+(((typeof _IBGIFT!=='undefined')&&_IBGIFT[x.gift.kind]||{}).t||x.gift.kind)+(((x.gift.n||1)>1)?' ×'+x.gift.n:'')+'）';return (x.role==='user'?uN+'：'+String(x.content||'').replace(/^\[(?:语音|视频)通话\] /,''):(x.senderName||aN)+'：'+String(x.content||'').replace(/<ws_vgift\b[^>]*\/?>/gi,'').replace(/<ws_vsnap\b[^>]*\/?>/gi,'').trim())}).join('\n');/* 手机端：礼物行入稿 */
  var mm=String(end.content||'').match(/时长\s*([\d:]+)\s*·\s*共\s*(\d+)\s*轮/),ce=end.callEnd||{};
  var dt=new Date(end.timestamp||Date.now()),ds=dt.getFullYear()+'年'+(dt.getMonth()+1)+'月'+dt.getDate()+'日';
  return {end:end,c:c,uN:uN,aN:aN,body:body,ds:ds,raw:raw,hasGift:block.some(function(x){return !!(x&&x.gift)}),marker:String(end.content||'').split('\n')[0],dur:(ce.dur!=null?_fmtDurM(ce.dur):(mm?mm[1]:'?')),turns:(ce.turns!=null?ce.turns:(mm?mm[2]:'?'))}}
async function _genCallRecM(m){var res=null;_recPendM[m.id]=1;delete _recErrM[m.id];_recPaintM(m.id);
  try{var T=await _callTranscriptM(m),gen=await _callWriterM(T.c);if(!gen||!gen.apiKey)throw new Error('没有可用的执笔 API');
    var sys=_callRecTask(T.aN,T.uN,{vid:!!(T.end.callEnd&&T.end.callEnd.video),gift:!!T.hasGift,grp:!!(T.c&&T.c._group)}),userText='【通话信息】'+T.ds+' · 时长 '+T.dur+' · 共 '+T.turns+' 轮\n【完整文字稿】\n'+T.body;
    var test=Object.assign({},gen,{streaming:false,thinkingEnabled:false,promptCache:false});
    var r=await callAI(test,[{role:'user',content:userText}],sys,function(){},null,null);
    var txt=_recCap(_txtOfM(r).trim().replace(/^["'“”「」『』]+|["'“”「」『』]+$/g,'').trim(),800);if(!txt)throw new Error('生成为空');
    var ce0=T.end.callEnd||{},fold=!(ce0.transcript&&ce0.transcript.length)&&T.raw.length>0;
    res={rec:txt,recBy:cfgName(gen),recAt:Date.now()};T.end.callEnd=Object.assign({},ce0,res);
    if(fold){T.end.callEnd.transcript=T.raw.map(function(x){var o9={id:x.id,role:x.role,content:String(x.content||''),timestamp:x.timestamp||0};if(x.gift)o9.gift=x.gift;if(x.snap)o9.snap=x.snap;return o9});T.end.content=T.marker+'\n'+'【通话记录】（通话内容已压缩为下面这段记录，原始文字稿仅在聊天里展示、不再计入上下文）'+'\n'+txt}/* 手机端：①原始文字稿收进结束消息，正文换成压缩后的通话记录 */
    await dbPut('chatMessages',T.end);res.content=T.end.content;
    if(m!==T.end){m.callEnd=T.end.callEnd;m.content=T.end.content}
    if(fold){var ids9={};T.raw.forEach(function(x){ids9[x.id]=1});for(var k9=0;k9<T.raw.length;k9++){var rm9=T.raw[k9];rm9.callFold=1;try{if(!rm9.callAudio){var cur9=await dbGet('chatMessages',rm9.id);if(cur9&&cur9.callAudio)rm9.callAudio=cur9.callAudio}}catch(e){}try{await dbPut('chatMessages',rm9)}catch(e){}/* 本轮：折叠写回不覆盖语音条 */}
      try{_msgs.forEach(function(x){if(ids9[x.id])x.callFold=1})}catch(e){}}
  }catch(e){_recErrM[m.id]=String((e&&e.message)||e).slice(0,60);toast('通话记录未生成：'+_recErrM[m.id])}
  delete _recPendM[m.id];_recPaintM(m.id,res);return res}
function _recRowM(d,m){var host=d.querySelector('.e-recw'),bh=d.querySelector('.e-recbh');if(!host||!bh)return;host.innerHTML='';bh.innerHTML='';var ce=m.callEnd||{},pend=!!_recPendM[m.id],err=_recErrM[m.id];
  if(!ce.rec&&!pend&&!err)return;
  var bt=document.createElement('button');bt.type='button';bt.className='e-rec';var box=document.createElement('div');box.className='e-recbox';
  if(pend){bt.disabled=true;bt.textContent='通话记录 · 生成中…'}
  else if(!ce.rec){bt.textContent='通话记录 · 未生成，点击重试';bt.addEventListener('click',function(ev){ev.stopPropagation();_genCallRecM(m)})}
  else{bt.innerHTML='<span>通话记录</span><svg viewBox="0 0 16 16"><path d="M4 6l4 4 4-4"/></svg>';box.textContent=ce.rec;if(ce.recBy){var by=document.createElement('span');by.className='e-recby';by.textContent=ce.recBy+' · 执笔';box.appendChild(by)}
    bt.addEventListener('click',function(ev){ev.stopPropagation();var o=!bt.classList.contains('open');bt.classList.toggle('open',o);box.classList.toggle('open',o)})}
  host.appendChild(bt);bh.appendChild(box)}
function _recPaintM(msgId,ce){try{document.querySelectorAll('.ibcl-wrap[data-end-for="'+msgId+'"]').forEach(function(w){var m=w._m;if(!m)return;if(ce){if(ce.content)m.content=ce.content;m.callEnd=Object.assign({},m.callEnd||{},{rec:ce.rec,recBy:ce.recBy,recAt:ce.recAt})}var d=w.querySelector('.ibcl');if(d)_recRowM(d,m)})}catch(e){}}
var _IBGIFT={
  heart:{t:'小心心',e:'❤️',tier:1,cls:'gb-heart',ic:'<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="ibgH" x1="0.15" y1="0.1" x2="0.85" y2="0.95"><stop offset="0" stop-color="#ffc9dc"/><stop offset="0.55" stop-color="#f29bbf"/><stop offset="1" stop-color="#e07fae"/></linearGradient></defs><path d="M12 20.5C7.9 17.7 3.2 14 3.2 9.4 3.2 6.7 5.2 4.8 7.6 4.8c1.9 0 3.4 1.1 4.4 2.6 1-1.5 2.5-2.6 4.4-2.6 2.4 0 4.4 1.9 4.4 4.6 0 4.6-4.7 8.3-8.8 11.1z" fill="url(#ibgH)"/><path d="M6.2 9.2c.1-1.4 1-2.5 2.3-2.8" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="1.1" stroke-linecap="round"/></svg>',dur:4200,on:true},
  bouquet:{t:'花束',e:'💐',tier:2,cls:'gb-bouquet',ic:'<img src="data:image/webp;base64,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" alt="" draggable="false">',dur:5000,on:true},
  fireworks:{t:'夏日烟火',e:'🎆',tier:3,cls:'gb-fireworks',ic:'<img src=\"data:image/webp;base64,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\" alt=\"\" draggable=\"false\">',fx:'fireworks',dur:6200,on:true},
  meteor:{t:'流星雨',e:'🌠',tier:4,cls:'gb-meteor',ic:'<img src=\"data:image/webp;base64,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\" alt=\"\" draggable=\"false\">',fx:'meteor',dur:7500,on:true},/* 手机端：开放；占位 SVG，换贴图只改此处 */
  galaxy:{t:'银河铁道之夜',e:'🌌',tier:5,cls:'gb-galaxy',ic:'<img src=\"data:image/webp;base64,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\" alt=\"\" draggable=\"false\">',fx:'galaxy',dur:9600,on:true}/* 手机端：开放；占位 SVG，换贴图只改此处 */
};
var _ibgSeq=0;function _ibGiftIcon(g){try{if(!g)return '';if(g.ic){var s9=String(g.ic);if(/^<img/i.test(s9))return s9;_ibgSeq++;return s9.replace(/ibg([A-Z])/g,'ibg$1'+_ibgSeq)}return '<span class="gb-e">'+(g.e||'')+'</span>'}catch(e){return ''}}
function _ibclGiftM(m){
  var w=document.createElement('div');w.className='ibcl-wrap';w.dataset.giftFor=m.id||'';
  var d=document.createElement('div');d.className='ibcl end gift';
  var gf=m.gift||{},gk=(_IBGIFT[gf.kind]?gf.kind:'heart'),g=_IBGIFT[gk];d.classList.add('g-'+gk);/* 手机端：读礼物目录，按档上色 */
  var n=Math.max(1,Math.min(10,parseInt(gf.n,10)||1));
  var c=(_cfgs||[]).find(function(x){return x.id===m.friendId})||null;
  var nm='TA';try{nm=(c?cfgName(c):'')||'TA'}catch(e){}
  d.innerHTML='<div class="e-grow"><div class="e-hd"><div class="e-ava" aria-hidden="true"></div><div class="e-m"><div class="e-nm"></div><div class="e-k">GIFT · FOR YOU</div><div class="e-meta"></div></div></div></div>'
    +'<div class="e-gtile" aria-hidden="true"><span class="gb-ic"></span></div>';/* 手机端：右侧改玻璃贴图槽（按档配色），即将来每档贴图落位；手机端：左文右礼 */
  _ibclAvaM(d.querySelector('.e-ava'),c,nm);
  d.querySelector('.e-nm').textContent=nm;
  d.querySelector('.e-meta').textContent=g.t+(n>1?' ×'+n:'');/* 手机端：一次一件不显数量；旧卡带数量照显 */
  d.querySelector('.e-gtile .gb-ic').innerHTML=_ibGiftIcon(g);
  w.appendChild(d);return w;
}
function _ibclEndM(m){
  var w=document.createElement('div');w.className='ibcl-wrap';w.dataset.endFor=m.id||'';
  var d=document.createElement('div');d.className='ibcl end';var isV=!!(m.callEnd&&m.callEnd.video);/* 手机端 */
  var mm=String(m.content||'').match(/时长\s*([\d:]+)\s*·\s*共\s*(\d+)\s*轮/),dur=mm?mm[1]:'?',tn=mm?mm[2]:'?';
  var c=(_cfgs||[]).find(function(x){return x.id===m.friendId})||((typeof _activeCfg!=='undefined'&&_activeCfg&&_activeCfg.id===m.friendId)?_activeCfg:null);/* 手机端：群通话结束卡取群名 */
  var nm='TA';try{nm=(c?cfgName(c):'')||'TA'}catch(e){}
  d.innerHTML='<div class="e-hd"><div class="e-ava" aria-hidden="true"></div><div class="e-m"><div class="e-nm"></div><div class="e-k">'+(isV?'VIDEO':'VOICE')+' CALL · ENDED</div><div class="e-meta"></div></div><i class="e-ic" aria-hidden="true"><svg viewBox=\"0 0 24 24\"><path d=\"M3.6 14.9c-1.1-1.1-1-2.9.2-3.9C6.5 8.8 9.3 7.8 12 7.8s5.5 1 8.2 3.2c1.2 1 1.3 2.8.2 3.9l-1.3 1.3c-.9.9-2.3 1-3.3.3l-1.6-1.2c-.6-.4-.9-1.1-.9-1.8v-1c-.4-.1-.8-.1-1.3-.1s-.9 0-1.3.1v1c0 .7-.3 1.4-.9 1.8l-1.6 1.2c-1 .7-2.4.6-3.3-.3z\"/></svg></i></div>'
    +'<div class="e-acts"><button type="button" class="e-btn"></button><span class="e-recw"></span></div><div class="e-recbh"></div>';
  _ibclAvaM(d.querySelector('.e-ava'),c,nm);
  d.querySelector('.e-nm').textContent=nm;
  d.querySelector('.e-meta').textContent=dur+' · Round '+tn;/* 手机端：③ */
  try{var gz=m.callEnd&&m.callEnd.gifts;if(gz&&gz.total){var gr=document.createElement('div');gr.className='e-gifts';var gl=document.createElement('span');gl.className='lb';gl.textContent='本次礼物';gr.appendChild(gl);Object.keys(gz.kinds||{}).forEach(function(k){var g=_IBGIFT[k]||null;var s=document.createElement('span');s.className='g';var ic=document.createElement('i');ic.className='gb-ic';ic.innerHTML=g?_ibGiftIcon(g):'';s.appendChild(ic);s.appendChild(document.createTextNode((g?g.t:k)+' ×'+gz.kinds[k]));gr.appendChild(s)});var tt=document.createElement('span');tt.className='tt';tt.textContent='共 '+gz.total+' 件';gr.appendChild(tt);d.querySelector('.e-m').appendChild(gr)}}catch(e){}/* 手机端：小胶囊列（图标＋名 ×n）；手机端：结束卡礼物汇总 */
  var b=d.querySelector('.e-btn');
  if(m.memSaved){b.textContent='Saved ✓';b.disabled=true}
  else{b.textContent='Save memory';b.addEventListener('click',function(ev){ev.stopPropagation();_ibclSaveMemM(b,m)})}
  w._m=m;_recRowM(d,m);/* 手机端：①「通话记录 ▾」下拉；手机端：②与 Save memory 并排 */
  w.appendChild(d);return w}
async function _ibclSaveMemM(btn,m){
  try{btn.disabled=true;btn.textContent='Saving…';
    var fid=m.friendId,th=m.threadId||'';
    var all=(await dbGetByIndex('chatMessages','byFriend',fid)).filter(function(x){return (x.threadId||'')===th}).sort(function(a,b){return (a.timestamp||0)-(b.timestamp||0)});
    var ix=all.findIndex(function(x){return x.id===m.id});if(ix<0)throw new Error('找不到这条通话记录');
    var end=all[ix];if(end.memSaved){m.memSaved=end.memSaved;btn.textContent='Saved ✓';return}
    var block=[];for(var i=ix-1;i>=0;i--){var x=all[i];if(x.role==='user'){if(/^\[(?:语音|视频)通话\] /.test(String(x.content||''))||x.gift||/^\[视频通话快照\]/.test(String(x.content||'')))block.unshift(x);else break}/* 手机端：礼物 / 快照消息不再截断回溯 */else block.unshift(x)}
    while(block.length&&block[0].role!=='user')block.shift();
    var nx=all[ix+1];if(nx&&nx.role!=='user'&&(nx.timestamp||0)-(end.timestamp||0)<600000)block.push(nx);/* 挂断后才补完的那条回复也算这次通话 */
    if(!block.length)throw new Error('这次通话没有可总结的内容');
    var c=(_cfgs||[]).find(function(x){return x.id===fid})||((typeof _activeCfg!=='undefined'&&_activeCfg&&_activeCfg.id===fid)?_activeCfg:null);if(!c)throw new Error('找不到通话对象');/* 手机端：群通话 */
    var uN=(_about&&_about.name)||'用户',aN=cfgName(c);
    var body=block.map(function(x){if(/^\[视频通话快照\]/.test(String(x.content||'')))return (x.snap==='ai'?'（'+(x.snapBy||aN)+' 拍了一张画面快照）':'（画面快照一张）');if(x.gift)return aN+'：（向 '+uN+' 送出礼物：'+(((typeof _IBGIFT!=='undefined')&&_IBGIFT[x.gift.kind]||{}).t||x.gift.kind)+(((x.gift.n||1)>1)?' ×'+x.gift.n:'')+'）';return (x.role==='user'?uN+'：'+String(x.content||'').replace(/^\[(?:语音|视频)通话\] /,''):(x.senderName||aN)+'：'+String(x.content||'').replace(/<ws_vgift\b[^>]*\/?>/gi,'').replace(/<ws_vsnap\b[^>]*\/?>/gi,'').trim())}).join('\n');/* 手机端：礼物行入稿 */
    var mm=String(end.content||'').match(/时长\s*([\d:]+)\s*·\s*共\s*(\d+)\s*轮/);
    var dt=new Date(end.timestamp||Date.now()),ds=dt.getFullYear()+'年'+(dt.getMonth()+1)+'月'+dt.getDate()+'日';
    var gen=await _callWriterM(c);if(!gen.apiKey)throw new Error('没有可用的执笔 API');/* 手机端：②执笔 API 改读通话设置「独立配置」里的选择，不再挂在对话摘要 API 上 */
    var gN=(c._group)?(cfgName(gen)||aN):aN;
    var hyb=Object.assign({},gen,{nickname:gN,_group:false});
    var task='你是'+gN+'，刚刚和'+uN+(c._group?('和群「'+(c._group.name||aN)+'」里的其他成员一起挂了群通话'):'挂了电话')+'。下面是这通'+(c._group?'群通话':'电话')+'的完整文字稿（未删节）。\n请以'+gN+'的第一人称，把这通电话写成一条你想留住的记忆——像挂断电话后自己在心里回味刚才的对话那样：\n1. 记下电话是怎么开始的、聊了什么；具体的事记准（提到的事件、约定、时间地点、'+uN+'的状态和在意的事）。\n2. 也写下你的感受：'+uN+'当时的语气、让你在意或触动的瞬间、挂断后心里剩下的情绪。轻松的通话就写得轻松，要紧的事就记得认真，语气跟着这通电话本身走。\n3. 只写通话里真实出现的内容，不推测、不补写。\n4. 用名字称呼彼此，不要用含混的代词开头。'+(block.some(function(x){return !!(x&&x.gift)})?'\n（文字稿里「（向 '+uN+' 送出礼物：…）」是通话界面的礼物记录：礼物是你送给 '+uN+' 的，不是 '+uN+' 送给你的。）':'')+'\n5. 内容 120～300 字，单段成文。';
    var userText='【通话信息】'+ds+' · 时长 '+(mm?mm[1]:'?')+' · 共 '+(mm?mm[2]:'?')+' 轮\n【完整文字稿】\n'+body;
    var mem=await _ibGenMemCore(hyb,userText,task,{rawSource:'call',sourceId:end.id,titleFallback:'通话记忆 · '+gN,domainFallback:'日常',forceVisibility:'private',grp:!!(c&&c._group)});
    end.memSaved=mem.id;try{await dbPut('chatMessages',end)}catch(e){}
    if(m!==end)m.memSaved=mem.id;
    btn.textContent='Saved ✓';toast('通话记忆已生成：'+mem.title+'（'+cfgName(gen)+' 执笔）');
    try{redrawMsg(m)}catch(e){}
  }catch(e){btn.disabled=false;btn.textContent='Save memory';toast('生成记忆失败：'+String((e&&e.message)||e).slice(0,60))}}
function _callEffMerge(cs,fid){
  cs=cs||{};
  var p=fid&&cs.perApi&&cs.perApi[fid];
  var base=(!p||!p.use)?Object.assign({},cs):Object.assign({},cs,{tts:(p.tts==='cloud'||p.tts==='off')?p.tts:'sys',sysVoice:String(p.sysVoice||''),provider:/^(el|mm|az|ali|doubao)$/.test(p.provider)?p.provider:'oai',ep:String(p.ep||''),key:String(p.key||''),gid:String(p.gid||''),model:String(p.model||''),voice:String(p.voice||''),rate:Math.max(0.5,Math.min(2,parseFloat(p.rate)||1)),lang:(p.lang&&{en:1,ja:1,ko:1}[p.lang])?p.lang:'',vol:(p.vol!=null&&p.vol!=='')?p.vol:cs.vol});
  base.vol=Math.max(0.1,Math.min(1,parseFloat(base.vol)||1));
  base.vbOn=!!(p&&p.vbOn);
  base.vbLang=(p&&p.vbLang&&{en:1,ja:1,ko:1}[p.vbLang])?p.vbLang:'';
  return base;
}
/* ═══ 手机端：语音通话（Call）模块 ═══ */

/* ── 设置（apiSettings/callSettings，随备份往返；电脑端不读不写，互导无害） ── */
let _callS=null,_callFromDb=false,_callDefSnap='';
function _callDef(){return {id:'callSettings',on:true,tts:'sys',sysVoice:'',rate:1,bargein:true,ep:'',key:'',model:'',voice:'',provider:'oai',gid:'',lang:'',perApi:{}}}
function _callMergeDirty(mem,base){/* v159-p：把「默认骨架 + 用户此后改过的键」里真正改过的部分并回库记录（顶层按值比对、perApi 按 fid 逐键比对） */
  var snap=null;try{snap=_callDefSnap?JSON.parse(_callDefSnap):null}catch(e){snap=null}
  if(!mem||!base)return;var sv=snap||{};
  Object.keys(mem).forEach(function(k){if(k==='id'||k==='perApi')return;var a=mem[k],b=sv[k];if(JSON.stringify(a)!==JSON.stringify(b))base[k]=a});
  var mp=mem.perApi||{},sp=(sv.perApi)||{};base.perApi=base.perApi||{};
  Object.keys(mp).forEach(function(f){var pm=mp[f]||{},ps=sp[f]||null;Object.keys(pm).forEach(function(k){if(!ps||JSON.stringify(pm[k])!==JSON.stringify(ps[k])){base.perApi[f]=base.perApi[f]||{};base.perApi[f][k]=pm[k]}})});
}
function _ibcWhenDb(fn){var n=0;(function w(){try{if(typeof db!=='undefined'&&db){fn();return}}catch(e){}if(++n<150)setTimeout(w,200)})()}
async function loadCALL(force){
  if(_callS&&_callFromDb&&!force)return _callS;
  let r=null,_rdBad=false;try{if(typeof db==='undefined'||!db)throw new Error('db not ready');r=await dbGet('apiSettings','callSettings')}catch(e){_rdBad=true}
  if(_rdBad){
    if(_callS)return _callS;
    _callS=_callDef();_callFromDb=false;try{_callDefSnap=JSON.stringify(_callS)}catch(e){_callDefSnap=''}
    return _callS;
  }
  const _prev=_callS,_prevDb=_callFromDb;
  _callS=Object.assign(_callDef(),r||{});/* v138-c：①③新键 provider/gid/lang；手机端：#2 perApi 每 API 单独配置 */
  if(!_callS.perApi||typeof _callS.perApi!=='object')_callS.perApi={};
  if(_prev&&!_prevDb){try{_callMergeDirty(_prev,_callS)}catch(e){}}/* 内存里是默认骨架：只把用户在骨架上改过的键带过来 */
  else{try{if(_prev&&_prev.perApi)Object.keys(_prev.perApi).forEach(function(k9){var a9=_prev.perApi[k9],b9=_callS.perApi[k9];if(!a9)return;if(!b9){_callS.perApi[k9]=a9;return}['procall','vbOn','vbLang','use'].forEach(function(f9){if(b9[f9]==null&&a9[f9]!=null)b9[f9]=a9[f9]})})}catch(e){}}
  _callFromDb=true;_callDefSnap='';
  return _callS;
}
async function saveCALL(){if(!_callS)return;
  if(!_callFromDb){
    const mem=_callS;let r=null,ok=false;try{if(typeof db==='undefined'||!db)throw new Error('db not ready');r=await dbGet('apiSettings','callSettings');ok=true}catch(e){ok=false}
    if(!ok){toast('设置没能保存，请稍后重试');return}
    _callS=Object.assign(_callDef(),r||{});if(!_callS.perApi||typeof _callS.perApi!=='object')_callS.perApi={};
    try{_callMergeDirty(mem,_callS)}catch(e){}_callFromDb=true;_callDefSnap='';
  }
  try{await dbPut('apiSettings',_callS)}catch(e){try{await dbPut('apiSettings',_callS)}catch(e2){toast('设置没能保存，请重试');return}}
  try{var _bk=await dbGet('apiSettings','callSettings');
    var _n9=_callS.perApi?Object.keys(_callS.perApi).length:0,_m9=(_bk&&_bk.perApi)?Object.keys(_bk.perApi).length:0;
    if(_n9&&_m9<_n9)await dbPut('apiSettings',_callS);/* 写后回读核对：每 AI 记录少了就补写一次 */
  }catch(e){}
}
try{window.loadCALL=loadCALL}catch(e){}

/*IBCALL-PURE-BEGIN*/
/* ── 纯函数区（重采样 / WAV 封装 / 朗读净化 / 分句 / VAD 推进），可脱离 DOM 单测 ── */
function _ibcResample(f32,srcRate,dstRate){
  var n,i;
  if(srcRate===dstRate){n=f32.length;var o0=new Int16Array(n);for(i=0;i<n;i++){var v0=Math.max(-1,Math.min(1,f32[i]));o0[i]=v0<0?v0*0x8000:v0*0x7FFF}return o0}
  n=Math.max(1,Math.round(f32.length*dstRate/srcRate));
  var o=new Int16Array(n);var step=(f32.length-1)/Math.max(1,n-1);
  for(i=0;i<n;i++){var p=i*step;var i0=Math.floor(p);var i1=Math.min(f32.length-1,i0+1);var t=p-i0;
    var v=f32[i0]*(1-t)+f32[i1]*t;v=Math.max(-1,Math.min(1,v));o[i]=v<0?v*0x8000:v*0x7FFF}
  return o;
}
function _ibcWavEncode(chunks,rate){
  var n=0,i,j;for(i=0;i<chunks.length;i++)n+=chunks[i].length;
  var buf=new ArrayBuffer(44+n*2);var dv=new DataView(buf);
  function ws(off,s){for(var k=0;k<s.length;k++)dv.setUint8(off+k,s.charCodeAt(k))}
  ws(0,'RIFF');dv.setUint32(4,36+n*2,true);ws(8,'WAVE');ws(12,'fmt ');
  dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);
  dv.setUint32(24,rate,true);dv.setUint32(28,rate*2,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);
  ws(36,'data');dv.setUint32(40,n*2,true);
  var off=44;for(i=0;i<chunks.length;i++){var c=chunks[i];for(j=0;j<c.length;j++){dv.setInt16(off,c[j],true);off+=2}}
  return buf;
}
function _ibcSpeechSan(s){
  s=String(s||'');
  try{var _tq=s.match(/^\s*【语气[:：]\s*([^】]{1,6})】\s*/);if(_tq){window._ibToneHint=_tq[1].trim();s=s.slice(_tq[0].length)}}catch(e){}/* 语气标记只给合成端：念前剥掉、系统语音不念 */
  var F='(?:(?:ws|mem|cal|ib|bt|am|make|beyond|mcp|tool|file|fs)_[a-z0-9_]*|tool|run|think|thinking|mcp|ibvoice|find|replace)';
  s=s.replace(new RegExp('<('+F+')\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>','gi'),' ');
  s=s.replace(new RegExp('<'+F+'\\b[^>]*\\/>','gi'),' ');/* 只吃自闭合；未闭合的开标签交给下一步截断，流式中途不念出指令正文 */
  var m=s.search(new RegExp('<'+F+'(?![a-z0-9_])','i'));if(m>=0)s=s.slice(0,m);
  s=s.replace(/<\/?[a-z][a-z0-9_:.-]*\b[^>]*\/?>/gi,' ');/* 未知标签只去标记，正文保留 */
  s=s.replace(/```[\s\S]*?```/g,' ');
  var f=s.indexOf('```');if(f>=0)s=s.slice(0,f);
  return s;
}
function _ibcCleanSent(s){
  s=String(s||'');
  s=s.replace(/<ibvoice\b[^>]*>[\s\S]*?<\/ibvoice\s*>/gi,' ').replace(/<\/?ibvoice[^>]*\/?>/gi,' ');/* 手机端：#2 通话中不该出现语音条标签，出现也不朗读原文 */
  s=s.replace(/<\/?[a-z][a-z0-9_:.-]*\b[^>]*\/?>/gi,' ');
  s=s.replace(/\[([^\]]{1,60})\]\([^)]*\)/g,'$1');
  s=s.replace(/https?:\/\/\S+/g,'（链接）');
  s=s.replace(/[*_`~#>|]+/g,'');
  s=s.replace(/[\u{1F000}-\u{1FAFF}]/gu,'');
  s=s.replace(/[\u2190-\u21FF\u2460-\u25FF\u2700-\u27BF\u2B00-\u2BFF\uFE0F]/g,'');
  s=s.replace(/\s+/g,' ').trim();
  return s;
}
function _ibcSplit(sn,from,fin){
  var out=[],i=from,last=from;
  var B='。！？!?…\n',S='；;';
  var CL='。！？!?…”」』〉》）)\u0027"~\n';
  for(;i<sn.length;i++){
    var c=sn.charAt(i);
    if(B.indexOf(c)>=0||S.indexOf(c)>=0){
      var j=i+1;while(j<sn.length&&CL.indexOf(sn.charAt(j))>=0)j++;
      var seg=sn.slice(last,j);
      if(seg.trim().length>=2)out.push(seg);
      last=j;i=j-1;
      continue;
    }
    if(i-last>=88){
      var k=i;while(k>last+20&&'，,、 \u3000'.indexOf(sn.charAt(k))<0)k--;
      if(k>last+20){var sg=sn.slice(last,k+1);if(sg.trim().length>=2)out.push(sg);last=k+1;i=k}
    }
  }
  if(fin){var tail=sn.slice(last);if(tail.trim().length>=1){out.push(tail);last=sn.length}}
  return{sents:out,next:last};
}
function _ibcVadStep(st,rms,ms){
  
  if(!st.cal){st.calN=(st.calN||0)+1;st.noise=(st.noise||0.006)*0.9+rms*0.1;if(st.calN>=16){st.cal=true;st.noise=Math.max(0.002,st.noise)}return ''}
  if(rms<Math.max(st.noise*1.5,0.004))st.noise=st.noise*0.995+rms*0.005;
  var thS=Math.max(st.noise*3.2,0.012),thK=Math.max(st.noise*2.0,0.008);
  if(!st.voiced){
    if(rms>thS){st.voiced=true;st.voMs=ms;st.siMs=0;return 'start'}
    return '';
  }
  if(rms>thK){st.voMs+=ms;st.siMs=0}else st.siMs+=ms;
  if(st.siMs>=700||st.voMs+st.siMs>=45000){
    var ok=st.voMs>=320;st.voiced=false;st.voMs=0;st.siMs=0;return ok?'end':'drop';
  }
  return '';
}
function _ibcHexToBuf(h){
  h=String(h||'').replace(/\s+/g,'');
  if(!h||h.length%2)return null;
  if(!/^[0-9a-fA-F]+$/.test(h))return null;
  var n=h.length/2,u=new Uint8Array(n);
  for(var i=0;i<n;i++)u[i]=parseInt(h.substr(i*2,2),16);
  return u.buffer;
}
/*IBCALL-PURE-END*/
const IBCALL=(function(){
'use strict';
const SR=16000;
const UI={};
let built=false,isOpen=false;
let cfg=null,threadId='',myKey='';
let stream=null,ctx=null,srcNode=null,anaMic=null,proc=null,muteGain=null,outGain=null,anaOut=null;
let state='idle',muted=false;
let t0=0,timerIv=0,turns=0,raf=0,wl=null;
let cloudDead=false,sysDead=false,asrOff=false;
let ring=[],ringSamples=0,utterStart=-1;
const RING_MAX=SR*60;
let vad={cal:false,calN:0,noise:0.006,voiced:false,voMs:0,siMs:0};
let bargeMs=0;
let q=[],speaking=false,curSrc=null;
let curRaw='',cur=0,dropStream=false,turnBusy=false,lastSaid='',lastTurnT=0;
let rawCur=0,langMode='',_confSig='';/* v138-c：③外语解析游标 / ④确认条签名 */
let speakGen=0,ttsAc=null,_min9=false,_pill=null,_pillT=null;/* 手机端：#4 悬浮窗最小化态 *//* 打断代际号：作废迟到的云端音频 */
let accCol='#72a8d8';
let avLvl=0,avPh=0;/* v174：③头像后声波：电平与相位 */
let hbLastUser=0,hbLastAi=0,hbCount=0,hbBusy=false,hbGen=0,hbJit=-1,hbJitKey=0;/* v174：①hbJit＝这一次心跳在间隔之上再多等的随机秒数（0～90% 间隔，静默计时起点变了就重掷） *//* v174：①通话心跳：最近一次你开口 / TA 说完的时刻、连续心跳句数、在途生成代际号 */

const CSS=''

+'#ibcall{position:fixed;inset:0;z-index:4300;display:flex;flex-direction:column;align-items:center;'
+'padding:calc(14px + var(--sat,0px)) calc(22px + var(--sar,0px)) calc(18px + var(--sab,0px)) calc(22px + var(--sal,0px));overflow:hidden;touch-action:manipulation;'
+'color:#e9effc;background:linear-gradient(178deg,#131c31 0%,#0d1426 46%,#080d1b 100%)}'
+'body:not(.theme-infernal) #ibcall{color:#122644;background:linear-gradient(180deg,#aecae6 0%,#c5d9ee 34%,#dee9f6 66%,#f3f7fc 100%)}'
+'#ibcall[hidden]{display:none}'
+'#ibcall:not(.mini){will-change:opacity;isolation:isolate}'
+'body.ibcall-full #cv-msgs>*{visibility:hidden}'/* 手机端：全屏通话期间底下聊天列表只排版不绘制（收成小条时恢复），流式落字不再逐字重绘被盖住的列表 */
+'#ibcall::before{content:"";position:absolute;inset:-10%;pointer-events:none;z-index:0;'
+'background:radial-gradient(46% 34% at 22% 24%,rgba(120,170,226,0.26),transparent 72%),radial-gradient(40% 30% at 78% 58%,rgba(96,140,204,0.2),transparent 72%),radial-gradient(34% 26% at 52% 86%,rgba(140,178,224,0.14),transparent 72%)}'
+'body:not(.theme-infernal) #ibcall::before{background:'
+'radial-gradient(52% 18% at 18% 20%,rgba(255,255,255,0.95),rgba(255,255,255,0) 72%),'
+'radial-gradient(40% 14% at 44% 14%,rgba(255,255,255,0.85),rgba(255,255,255,0) 70%),'
+'radial-gradient(58% 20% at 82% 30%,rgba(255,255,255,0.8),rgba(255,255,255,0) 74%),'
+'radial-gradient(46% 15% at 64% 44%,rgba(255,255,255,0.55),rgba(255,255,255,0) 70%),'
+'radial-gradient(70% 22% at 30% 58%,rgba(255,255,255,0.4),rgba(255,255,255,0) 74%)}'
+'#ibcall::after{content:"";position:absolute;inset:-12%;pointer-events:none;z-index:0;'
+'background:radial-gradient(54% 40% at 70% 20%,rgba(150,140,220,0.13),transparent 74%),radial-gradient(48% 36% at 26% 74%,rgba(90,150,210,0.15),transparent 74%)}'
+'body:not(.theme-infernal) #ibcall::after{background:'
+'radial-gradient(120% 34% at 50% 100%,rgba(255,255,255,0.85),rgba(255,255,255,0) 78%),'
+'radial-gradient(60% 30% at 84% 74%,rgba(194,213,236,0.49),rgba(194,213,236,0) 72%),'
+'linear-gradient(180deg,rgba(155,186,222,0.26) 0%,rgba(155,186,222,0) 40%)}'/* 手机端 #1：霁光与高空青同步回调半档 *//* 手机端 #2a：地平霁光＋高空一层青，撑开纵深 */
+'#ibcall>*{position:relative;z-index:1}'
+'#ibcall .ibc-top{width:100%;display:flex;flex-direction:column;align-items:center;flex:none}'
+'#ibcall .ibc-timer{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI","PingFang SC","Noto Sans SC",sans-serif;font-weight:500;font-size:0.92rem;letter-spacing:0.03em;opacity:0.8;font-variant-numeric:tabular-nums;margin-top:9px}'/* 手机端：①系统无衬线、等宽数字 *//* 手机端 #1：字体改聊天窗口计时同族等宽栈（--monoP）、字距收窄；位置移到昵称与状态词之间 */
+'#ibcall .ibc-mid{flex:1;width:100%;display:flex;flex-direction:column;align-items:center;min-height:0;padding-top:clamp(2px,3.2vh,30px);gap:8px}'
+'#ibcall .ibc-avaw{flex:none;position:relative;display:flex;align-items:center;justify-content:center;padding:12px}'
+'#ibcall .ibc-ava{position:relative;z-index:1;width:124px;height:124px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
+'font-family:var(--serif);font-size:2.4rem;background:linear-gradient(160deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04));'
+'border:1px solid rgba(255,255,255,0.28);box-shadow:inset 0 1px 0 rgba(255,255,255,0.4),inset 0 -6px 14px rgba(255,255,255,0.06),0 12px 36px rgba(0,0,0,0.32);flex:none}'
+'body:not(.theme-infernal) #ibcall .ibc-ava{background:linear-gradient(160deg,rgba(255,255,255,0.92),rgba(255,255,255,0.5));border-color:#fff;box-shadow:inset 0 1px 0 #fff,inset 0 -6px 14px rgba(120,160,210,0.12),0 12px 30px rgba(70,110,170,0.3)}'
+'#ibcall .ibc-ava img{width:100%;height:100%;border-radius:50%;object-fit:cover}'
+'#ibcall .ibc-ava::before{content:"";position:absolute;inset:-10px;border-radius:50%;border:1px solid currentColor;opacity:0;pointer-events:none}'

+'#ibcall[data-state="think"] .ibc-ava::before{opacity:0.45;animation:ibcSpin 1.6s linear infinite;border-color:transparent;border-top-color:currentColor}'

+'#ibcall .ibc-breath{position:absolute;inset:-12px;border-radius:50%;pointer-events:none;z-index:0;'
+'background:radial-gradient(circle,rgba(255,255,255,0.72) 0%,rgba(172,198,232,0.38) 44%,rgba(158,186,222,0) 70%);'
+'animation:ibcHalo 3.8s ease-in-out infinite;will-change:transform,opacity}'
+'body.theme-infernal #ibcall .ibc-breath{background:radial-gradient(circle,rgba(208,226,252,0.4) 0%,rgba(122,168,226,0.3) 46%,rgba(96,140,204,0) 70%)}'
+'#ibcall[data-state="speak"] .ibc-breath{animation-duration:2.5s;--ho:0.88}'
+'@keyframes ibcHalo{0%,100%{transform:scale(0.985);opacity:0.4}50%{transform:scale(1.05);opacity:var(--ho,0.68)}}'

+'#ibcall .ibc-avwave{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:520px;max-width:100vw;height:150px;pointer-events:none;z-index:0;display:block}'
+'@keyframes ibcSpin{to{transform:rotate(360deg)}}'
+'@media (prefers-reduced-motion:reduce){#ibcall .ibc-ava,#ibcall .ibc-ava::before,#ibcall .ibc-breath{animation:none!important;transition:none!important}#ibcall .ibc-breath{opacity:0.35}}'/* 手机端 #3：清单随光效改组更新 */
+'#ibcall .ibc-name{font-family:var(--serif);font-weight:600;font-size:1.62rem;letter-spacing:0.05em;margin-top:-2px;'
+'text-shadow:0 1px 0 rgba(255,255,255,0.08),0 2px 6px rgba(0,0,0,0.55),0 0 14px rgba(var(--glow),0.24)}'/* #4 社交圈名片同族衬线＋站内字效（ph-cn 同配方放大） */
+'body:not(.theme-infernal) #ibcall .ibc-name{color:#4f6a93;text-shadow:0 1px 0 rgba(255,255,255,0.92),0 2px 5px rgba(120,152,200,0.3),0 4px 10px rgba(120,152,200,0.16)}'/* 手机端：明亮模式昵称改低饱和蓝灰，描影只留白高光与淡蓝柔影，不再压黑 */
+'body:not(.theme-infernal) #ibcall{color:#4b6690}body:not(.theme-infernal) #ibcall .ibc-timer{color:#6c84aa;opacity:0.92}body:not(.theme-infernal) #ibcall .ibc-en{color:#7b91b5;opacity:0.88}body:not(.theme-infernal) #ibcall .ibc-sub{color:#6d84a8}'/* 手机端：明亮模式基色 / 计时 / 状态词 / 提示行统一降到蓝灰 */
+'body:not(.theme-infernal) #ibcall .ibc-ly{color:#6b82a8;opacity:0.62}body:not(.theme-infernal) #ibcall .ibc-ly.cur{color:#3f5b87;opacity:1}'/* 手机端：歌词区 TA 的句子：平句蓝灰、当前句低饱和藏青，不再是墨黑 */
+'#ibcall .ibc-en{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI","PingFang SC","Noto Sans SC",sans-serif;font-style:normal;font-weight:400;font-size:0.8rem;letter-spacing:0.16em;opacity:0.55;margin:0 0 2px;min-height:1.2em;text-align:center}'/* 手机端：①状态词改无衬线正体 *//* 手机端 #1：状态词换衬线斜体、0.4em 大字距收到 0.13em *//* 手机端 #2b：字号 0.64→0.8rem、整行下移约 10px */
+'#ibcall .ibc-wavew{flex:none;width:min(100%,440px);height:52px;padding:0 10px;margin-top:12px}'/* 手机端 #2b：随状态行同步下移 */
+'#ibcall .ibc-wavew canvas{display:block;width:100%;height:100%}'
+'#ibcall .ibc-lyr{flex:1 1 auto;min-height:120px;width:min(100%,540px);margin-top:6px;overflow-y:auto;scrollbar-width:none;-ms-overflow-style:none;overscroll-behavior:contain;contain:layout paint;'
+'display:flex;flex-direction:column;align-items:center;gap:11px;padding:16px;text-align:center;'
+'-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 26px,#000 calc(100% - 26px),transparent 100%);mask-image:linear-gradient(180deg,transparent 0,#000 26px,#000 calc(100% - 26px),transparent 100%)}'
+'#ibcall .ibc-lyr::before,#ibcall .ibc-lyr::after{content:"";flex:none;margin:auto}'/* 句少时垂直居中；一旦溢出 margin:auto 自动压 0，退化为普通滚动、顶部内容仍可达 */
+'#ibcall .ibc-lyr::-webkit-scrollbar{display:none}'
+'#ibcall .ibc-ly{flex:none;max-width:100%;font-family:"Noto Sans SC","PingFang SC",-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.95rem;letter-spacing:0.01em;line-height:1.6;opacity:0.4;word-break:break-word;transition:opacity 0.45s,color 0.45s}'
+'#ibcall .ibc-ly.cur{opacity:1;font-size:1.06rem;text-shadow:0 2px 16px rgba(0,0,0,0.28)}'
+'#ibcall .ibc-ly .ibc-ly-sub{display:block;font-size:inherit;line-height:inherit;letter-spacing:inherit;opacity:1;margin-top:3px}'
+'body:not(.theme-infernal) #ibcall .ibc-ly.cur{text-shadow:0 2px 12px rgba(255,255,255,0.65)}'
+'#ibcall .ibc-ly.me{font-family:"Noto Sans SC",sans-serif;font-size:0.84rem;letter-spacing:0.02em;opacity:0.6;color:#7fb2e4}'
+'body:not(.theme-infernal) #ibcall .ibc-ly.me{color:#6f93c2}'/* 手机端：我方句子同步降一档 */
+'#ibcall .ibc-ly.me.cur{opacity:0.95;font-size:0.9rem;color:#a6ccf2;text-shadow:none}'
+'body:not(.theme-infernal) #ibcall .ibc-ly.me.cur{color:#4577b3}'/* 手机端 #2：当前句＝明亮主题 acc 本色 */
+'#ibcall .ibc-flex{display:none}'
+'#ibcall .ibc-sub{flex:none;width:min(100%,500px);min-height:1.3em;font-size:0.76rem;line-height:1.7;opacity:0.55;text-align:center;padding:0 6px}'
+'#ibcall .ibc-btns{flex:none;display:flex;align-items:flex-end;justify-content:center;gap:26px;width:100%;padding:8px 0 22px}'
+'#ibcall .ibc-bw{position:relative}'
+'#ibcall .ibc-b{width:58px;height:58px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:inherit;'
+'border:1px solid rgba(255,255,255,0.24);background:linear-gradient(168deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05));'
+'backdrop-filter:blur(14px) saturate(1.45);-webkit-backdrop-filter:blur(14px) saturate(1.45);'
+'box-shadow:inset 0 1px 0 rgba(255,255,255,0.3),0 10px 26px rgba(0,0,0,0.3);-webkit-tap-highlight-color:transparent;transition:transform 0.16s,background 0.3s,box-shadow 0.3s}'
+'body:not(.theme-infernal) #ibcall .ibc-b{background:linear-gradient(168deg,rgba(255,255,255,0.8),rgba(255,255,255,0.48));border-color:#fff;box-shadow:inset 0 1px 0 #fff,0 8px 20px rgba(88,124,178,0.2)}'
+'#ibcall .ibc-b:active{transform:scale(0.92)}'
+'#ibcall .ibc-b svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}'
+'#ibcall .ibc-b.on{background:rgba(226,96,92,0.26);border-color:rgba(230,120,116,0.7);color:#ffd9d7}'
+'body:not(.theme-infernal) #ibcall .ibc-b.on{background:rgba(226,84,84,0.2);border-color:rgba(216,90,90,0.75);color:#b0413d}'
+'#ibcall .ibc-b.end{width:64px;height:64px;color:#f2f7ff;border-color:rgba(158,186,224,0.55);'
+'background:linear-gradient(168deg,#6d84a8,#55698b);'
+'box-shadow:inset 0 1px 0 rgba(255,255,255,0.35),0 10px 26px rgba(0,0,0,0.32),0 0 18px rgba(114,150,200,0.2)}'
+'body:not(.theme-infernal) #ibcall .ibc-b.end{color:#fff;border-color:rgba(255,255,255,0.75);background:linear-gradient(168deg,#93abcd,#7a93b8);box-shadow:inset 0 1px 0 rgba(255,255,255,0.55),0 10px 24px rgba(88,124,178,0.34)}'
+'#ibcall .ibc-b.end svg{width:29px;height:29px;fill:currentColor;stroke:none}'
+'#ibcall .ibc-b.intr{width:46px;height:46px;opacity:0.35;pointer-events:none}'/* 手机端 #2f：打断降为小钮（46px 仍够指尖），排位挪到静音与挂断之间 */
+'#ibcall .ibc-b.intr svg{width:19px;height:19px}'
+'#ibcall[data-state="speak"] .ibc-b.intr,#ibcall[data-state="think"] .ibc-b.intr{opacity:1;pointer-events:auto}#ibcall.nobarge .ibc-bw:has(#ibc-intr){display:none}#ibcall.nobarge .ibc-btns{gap:34px}'
+'#ibcall .ibc-blab{position:absolute;bottom:-19px;left:50%;transform:translateX(-50%);font-size:0.66rem;letter-spacing:0.1em;opacity:0.6;white-space:nowrap}'
+'#ibcall .ibc-type{flex:none;width:min(100%,460px);display:flex;gap:8px;padding:4px 0 2px}'
+'#ibcall .ibc-type[hidden]{display:none}'
+'#ibcall .ibc-type input{flex:1;min-width:0;border-radius:999px;border:1px solid rgba(255,255,255,0.22);background:rgba(255,255,255,0.09);color:inherit;padding:10px 16px;font-size:0.95rem;outline:none;'
+'backdrop-filter:blur(12px) saturate(1.4);-webkit-backdrop-filter:blur(12px) saturate(1.4);box-shadow:inset 0 1px 0 rgba(255,255,255,0.24)}'
+'body:not(.theme-infernal) #ibcall .ibc-type input{background:rgba(255,255,255,0.7);border-color:rgba(120,160,210,0.5)}'
+'#ibcall .ibc-type button{flex:none;border-radius:999px;border:1px solid rgba(255,255,255,0.26);background:linear-gradient(168deg,rgba(255,255,255,0.2),rgba(255,255,255,0.08));color:inherit;padding:0 18px;font-size:0.9rem;'
+'backdrop-filter:blur(12px) saturate(1.4);-webkit-backdrop-filter:blur(12px) saturate(1.4);box-shadow:inset 0 1px 0 rgba(255,255,255,0.28)}'
+'body:not(.theme-infernal) #ibcall .ibc-type button{background:rgba(255,255,255,0.75);border-color:rgba(120,160,210,0.55)}'
+'#ibcall .ibc-conf{flex:none;width:min(100%,460px);max-height:118px;overflow:auto;display:flex;flex-direction:column;gap:6px;padding:2px 0}'
+'#ibcall .ibc-conf[hidden]{display:none}'
+'#ibcall .ibc-conf-row{display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.08);border-radius:14px;padding:7px 10px;font-size:0.78rem;'
+'backdrop-filter:blur(12px) saturate(1.4);-webkit-backdrop-filter:blur(12px) saturate(1.4);box-shadow:inset 0 1px 0 rgba(255,255,255,0.2)}'
+'body:not(.theme-infernal) #ibcall .ibc-conf-row{background:rgba(255,255,255,0.62);border-color:rgba(120,160,210,0.5)}'
+'#ibcall .ibc-conf-t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:0.9}'
+'#ibcall .ibc-cb{flex:none;border-radius:10px;border:1px solid rgba(255,255,255,0.32);background:rgba(255,255,255,0.14);color:inherit;padding:5px 11px;font-size:0.76rem}'
+'#ibcall .ibc-cb.ok{background:rgba(114,168,216,0.3);border-color:rgba(114,168,216,0.7)}'
+'body:not(.theme-infernal) #ibcall .ibc-cb{background:rgba(255,255,255,0.8);border-color:rgba(120,160,210,0.55)}'
+'#ibcall .ibc-conf-row.pay{opacity:0.85}';/* v138-c：②④样式 */

const MIC_ON='<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const MIC_OFF='<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16"/></svg>';

function ensureUI(){
  if(built)return;built=true;
  try{
    const st=document.createElement('style');st.id='ibcall-style';st.textContent=CSS;document.head.appendChild(st);
    const d=document.createElement('div');d.id='ibcall';d.hidden=true;
    d.innerHTML=''
      +'<div class="ibc-top"></div>'/* 手机端 #1：计时迁出顶栏 */
      +'<div class="ibc-mid">'
      +'<div class="ibc-en" id="ibc-en"></div><div class="ibc-avaw"><i class="ibc-breath" aria-hidden="true"></i><canvas class="ibc-avwave" id="ibc-avwave" aria-hidden="true"></canvas><div class="ibc-ava" id="ibc-ava"><span id="ibc-ava-t"></span><img id="ibc-ava-i" alt="" style="display:none"></div></div>'/* 手机端 #3：光效层收敛为呼吸盘＋三波纹 *//* 手机端 #2c：光效层置于头像下方 */
      +'<div class="ibc-name" id="ibc-name"></div><div class="ibc-timer" id="ibc-timer">0:00</div>'/* 手机端 #1：昵称 → 计时 → 状态词 *//* 手机端：#4 英文状态行 */
      +'<div class="ibc-wavew"><canvas id="ibc-wave" aria-hidden="true"></canvas></div>'
      +'<div class="ibc-lyr" id="ibc-lyr" aria-live="polite"></div><div class="ibc-sub" id="ibc-sub"></div><i class="ibc-flex" aria-hidden="true"></i>'/* 手机端：#2 歌词流；手机端：#4 压矮＋弹性垫底 */
      +'</div>'
      +'<div class="ibc-dm" id="ibc-dm"><div class="ibc-gl" id="ibc-gl"></div><div class="ibc-dmw" id="ibc-dmw"></div></div>'/* 手机端：视频模式弹幕区（非视频态由 CSS 隐藏） */
      +'<div class="ibc-conf" id="ibc-conf" hidden></div>'
      +'<div class="ibc-type" id="ibc-type" hidden><input id="ibc-type-in" type="text" maxlength="500" placeholder="Type something or not..." autocomplete="off"><button type="button" id="ibc-type-send">Send</button></div>'
      +'<div class="ibc-btns">'
      +'<div class="ibc-bw"><button class="ibc-b" id="ibc-kb" aria-label="打字"><svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="11" rx="2.4"/><path d="M6.2 10.4h.01M9.4 10.4h.01M12.6 10.4h.01M15.8 10.4h.01M6.2 13.2h.01M9.4 13.2h.01M12.6 13.2h.01M15.8 13.2h.01M8 15.8h8"/></svg></button><span class="ibc-blab">打字</span></div>'
      +'<div class="ibc-bw"><button class="ibc-b end" id="ibc-end" aria-label="挂断"><svg viewBox="0 0 24 24"><path d="M3.6 14.9c-1.1-1.1-1-2.9.2-3.9C6.5 8.8 9.3 7.8 12 7.8s5.5 1 8.2 3.2c1.2 1 1.3 2.8.2 3.9l-1.3 1.3c-.9.9-2.3 1-3.3.3l-1.6-1.2c-.6-.4-.9-1.1-.9-1.8v-1c-.4-.1-.8-.1-1.3-.1s-.9 0-1.3.1v1c0 .7-.3 1.4-.9 1.8l-1.6 1.2c-1 .7-2.4.6-3.3-.3z"/></svg></button><span class="ibc-blab">挂断</span></div>'/* 手机端 #2：挂断挪到打字与静音之间 */
      +'<div class="ibc-bw"><button class="ibc-b" id="ibc-mute" aria-label="静音">'+MIC_ON+'</button><span class="ibc-blab">静音</span></div>'
      +'<div class="ibc-bw"><button class="ibc-b intr" id="ibc-intr" aria-label="打断"><svg viewBox="0 0 24 24"><rect x="6.8" y="6.8" width="10.4" height="10.4" rx="2"/></svg></button><span class="ibc-blab">打断</span></div>'/* 手机端 #2：打断收尾第四位 */
      +'</div>'
      +'<video class="ibc-cam" id="ibc-cam" autoplay playsinline muted></video>'/* 手机端：本机摄像头铺底，muted 防回授 */
      +'<div class="ibc-doo" id="ibc-doo"></div>'/* 手机端：AI 装饰贴纸层 */
      +'<div class="ibc-vt" id="ibc-vt"><button type="button" class="ibc-vb" id="ibc-shot" aria-label="夹带画面：随下一句发给 TA"><svg viewBox="0 0 24 24"><path d="M4 8.2c0-1 .8-1.8 1.8-1.8h1.7l1.3-1.9h6.4l1.3 1.9h1.7c1 0 1.8.8 1.8 1.8v8.6c0 1-.8 1.8-1.8 1.8H5.8c-1 0-1.8-.8-1.8-1.8z"/><circle cx="12" cy="12.4" r="3.4"/></svg></button><div class="ibc-shotc" id="ibc-shotc" hidden><img id="ibc-shotc-img" alt=""><button type="button" class="sc-x" id="ibc-shotc-x" aria-label="取消夹带">×</button></div><button type="button" class="ibc-vb" id="ibc-flip" aria-label="翻转镜头"><svg viewBox="0 0 24 24"><path d="M4.8 9.5A7.6 7.6 0 0 1 19 11M19.2 14.5A7.6 7.6 0 0 1 5 13"/><path d="M19 6.8V11h-4.2M5 17.2V13h4.2"/></svg></button><button type="button" class="ibc-vgc" id="ibc-vgc" hidden>🎁<b id="ibc-vgn">0</b></button></div>'
      +'<div class="ibc-vgp" id="ibc-vgp" hidden><div class="vgp-t">本次礼物</div><div id="ibc-vgl"></div></div>'/* 手机端：礼物统计下拉 */
      +'<button type="button" class="ibc-minb" id="ibc-min" aria-label="缩小成悬浮窗" title="缩小成悬浮窗，通话不断"><svg viewBox="0 0 24 24"><path d="M6 10l6 6 6-6"/></svg></button>';
    document.body.appendChild(d);
    
    try{
      var st2=document.createElement('style');st2.id='ibcall-style-v150';st2.textContent='#ibcall .ibc-minb{position:absolute;right:calc(14px + var(--sar,0px));top:calc(10px + var(--sat,0px));z-index:6;width:44px;height:44px;border-radius:15px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;border:1px solid rgba(255,255,255,0.22);background:rgba(255,255,255,0.10);color:inherit;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;backdrop-filter:blur(10px) saturate(1.4);-webkit-backdrop-filter:blur(10px) saturate(1.4);box-shadow:inset 0 1px 0 rgba(255,255,255,0.25)}body:not(.theme-infernal) #ibcall .ibc-minb{border-color:rgba(255,255,255,0.85);background:rgba(255,255,255,0.55);box-shadow:inset 0 1px 0 #fff}#ibcall .ibc-minb::before{content:"";position:absolute;inset:-10px;border-radius:26px}#ibcall .ibc-minb svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}#ibcall .ibc-minb:active{transform:scale(0.94)}#ibcall.mini{visibility:hidden;pointer-events:none}#ibcall-pill{position:fixed;z-index:4700;top:calc(64px + var(--sat,0px));right:12px;display:flex;align-items:center;gap:10px;padding:9px 15px 9px 9px;border-radius:999px;border:1px solid rgba(255,255,255,0.65);background:linear-gradient(150deg,rgba(255,255,255,0.9),rgba(238,246,255,0.6));color:#122644;box-shadow:0 14px 34px rgba(20,35,70,0.26),inset 0 1px 0 #fff,inset 0 -10px 18px rgba(140,170,220,0.14);backdrop-filter:blur(22px) saturate(1.55);-webkit-backdrop-filter:blur(22px) saturate(1.55);cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:none}body.theme-infernal #ibcall-pill{background:linear-gradient(150deg,rgba(52,70,108,0.5),rgba(18,28,52,0.32));color:#eef3fd;border-color:rgba(255,255,255,0.34);box-shadow:0 14px 34px rgba(0,0,0,0.42),inset 0 1px 0 rgba(255,255,255,0.32),inset 0 -10px 18px rgba(110,150,215,0.14);backdrop-filter:blur(26px) saturate(1.75);-webkit-backdrop-filter:blur(26px) saturate(1.75)}#ibcall-pill[hidden]{display:none}#ibcall-pill .pl-ava{position:relative;width:42px;height:42px;border-radius:50%;background:rgba(120,150,200,0.25);border:1px solid rgba(255,255,255,0.65);display:flex;align-items:center;justify-content:center;font-size:1rem;overflow:hidden;flex:none}#ibcall-pill .pl-ava img{width:100%;height:100%;object-fit:cover;display:none}#ibcall-pill .pl-nm{max-width:124px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.92rem;font-weight:600;letter-spacing:0.02em}#ibcall-pill .pl-t{font-family:"IBM Plex Mono",monospace;font-size:0.95rem;letter-spacing:0.06em;font-variant-numeric:tabular-nums}#ibcall-pill .pl-dot{width:8px;height:8px;border-radius:50%;background:#6fae7d;flex:none;animation:ibcPd 1.6s ease-in-out infinite}#ibcall-pill[data-st=speak] .pl-dot{background:#72a8d8}#ibcall-pill[data-st=think] .pl-dot{background:#d8b06a}#ibcall-pill[data-st=rec] .pl-dot,#ibcall-pill[data-st=asr] .pl-dot{background:#d88a8a}@keyframes ibcPd{0%,100%{opacity:0.45;transform:scale(0.85)}50%{opacity:1;transform:scale(1)}}@media (prefers-reduced-motion:reduce){#ibcall-pill .pl-dot{animation:none}}';document.head.appendChild(st2);
      _pill=document.createElement('div');_pill.id='ibcall-pill';_pill.hidden=true;_pill.setAttribute('role','button');_pill.setAttribute('aria-label','回到通话');_pill.title='点一下回到通话，按住可拖动';
      _pill.innerHTML='<span class="pl-ava"><span id="ibcp-t"></span><img id="ibcp-i" alt=""></span><span class="pl-nm" id="ibcp-n"></span><span class="pl-t" id="ibcp-t2">0:00</span><span class="pl-dot"></span>';/* 手机端：#3 胶囊补昵称 */
      document.body.appendChild(_pill);_pillT=_pill.querySelector('#ibcp-t2');
      var _pd=null;
      _pill.addEventListener('pointerdown',function(ev){_pd={x:ev.clientX,y:ev.clientY,l:_pill.offsetLeft,t:_pill.offsetTop,mv:false};try{_pill.setPointerCapture(ev.pointerId)}catch(e){}});
      _pill.addEventListener('pointermove',function(ev){if(!_pd)return;var dx=ev.clientX-_pd.x,dy=ev.clientY-_pd.y;if(!_pd.mv&&dx*dx+dy*dy<49)return;_pd.mv=true;var L=Math.max(6,Math.min(window.innerWidth-_pill.offsetWidth-6,_pd.l+dx)),T=Math.max(6,Math.min(window.innerHeight-_pill.offsetHeight-6,_pd.t+dy));_pill.style.left=L+'px';_pill.style.top=T+'px';_pill.style.right='auto'});
      _pill.addEventListener('pointerup',function(){var mv=_pd&&_pd.mv;_pd=null;if(!mv)setMini(false)});
      _pill.addEventListener('pointercancel',function(){_pd=null});
      var mb=d.querySelector('#ibc-min');if(mb)mb.addEventListener('click',function(){setMini(true)});
      window.addEventListener('resize',function(){if(isOpen&&!_min9)sizeCanvas()});/* 手机端：#3 旋屏/键盘改尺后画布重取尺，波形不再拉糊 */
      window.addEventListener('orientationchange',function(){setTimeout(function(){if(isOpen&&!_min9)sizeCanvas()},350)});
      document.addEventListener('visibilitychange',function(){try{if(document.visibilityState==='hidden')_fxReset()}catch(e){}/* 手机端：切后台即停特效 */if(isOpen&&document.visibilityState==='visible'){try{var C9=window.Capacitor;if(!(C9&&C9.isNativePlatform&&C9.isNativePlatform()&&C9.Plugins&&C9.Plugins.IBShell)){kaw(false);kaw(true)}}catch(e){kaw(false);kaw(true)}}});/* 手机端：#3 网页 wakeLock 切后台被系统释放，回前台重取；壳内原生 FLAG 常驻不折腾 */
    }catch(e){}
    UI.root=d;UI.en=d.querySelector('#ibc-en');UI.timer=d.querySelector('#ibc-timer');/* 手机端：#4 状态行→昵称下英文状态 */
    UI.avaT=d.querySelector('#ibc-ava-t');UI.avaI=d.querySelector('#ibc-ava-i');UI.name=d.querySelector('#ibc-name');
    UI.wave=d.querySelector('#ibc-wave');UI.lyr=d.querySelector('#ibc-lyr');UI.sub=d.querySelector('#ibc-sub');UI.avw=d.querySelector('#ibc-avwave');/* v174：③头像后声波画布 */
    try{UI.lyr.addEventListener('scroll',function(){var el9=UI.lyr;var atB=el9.scrollHeight-el9.scrollTop-el9.clientHeight<28;_lyrHold=!atB;if(_lyrHoldT)clearTimeout(_lyrHoldT);if(_lyrHold)_lyrHoldT=setTimeout(function(){_lyrHold=false;_lyrFollow()},2600)},{passive:true})}catch(e){}/* 手机端：#2 手动上翻回看：停在半途 2.6s 无操作自动回到最新 */
    UI.mute=d.querySelector('#ibc-mute');
    UI.conf=d.querySelector('#ibc-conf');UI.type=d.querySelector('#ibc-type');UI.typeIn=d.querySelector('#ibc-type-in');UI.kb=d.querySelector('#ibc-kb');/* v138-c：②④ */
    UI.cam=d.querySelector('#ibc-cam');UI.vt=d.querySelector('#ibc-vt');
    try{['playing','loadeddata'].forEach(function(ev9){UI.cam.addEventListener(ev9,function(){try{UI.cam.classList.add('live')}catch(e){}})})}catch(e){}UI.dm=d.querySelector('#ibc-dm');UI.doo=d.querySelector('#ibc-doo');UI.dmw=d.querySelector('#ibc-dmw');UI.gl=d.querySelector('#ibc-gl');UI.att=d.querySelector('#ibc-shot');UI.vgc=d.querySelector('#ibc-vgc');UI.vgn=d.querySelector('#ibc-vgn');UI.vgp=d.querySelector('#ibc-vgp');UI.vgl=d.querySelector('#ibc-vgl');/* 手机端：视频通话件；手机端：+装饰层；手机端：+弹幕滚层 */
    try{UI.dmw.addEventListener('scroll',function(){var el9=UI.dmw;_dmHold=el9.scrollHeight-el9.scrollTop-el9.clientHeight>=28})}catch(e){}/* 手机端：手指上滑即停跟，滑回底部恢复 */
    try{if(UI.vgc)UI.vgc.addEventListener('click',function(ev){ev.stopPropagation();_vgPanel()})}catch(e){}/* 手机端：礼物统计下拉 */
    try{var _ab9=d.querySelector('#ibc-shot');if(_ab9)_ab9.addEventListener('click',async function(){/* 手机端：按下＝夹住并弹缩略图；再按＝换成当前画面；× 才取消 */
      if(!vidOn)return;
      var csA=null;try{csA=await loadCALL()}catch(e){}
      var QA=_vidQPick(csA),fr=_vidFrame(QA.e,QA.q);
      if(!fr){toast('画面还没就绪');return}
      var re9=!!_vidPend;_vidPend=fr;_shotChip(fr);
      try{navigator.vibrate&&navigator.vibrate(re9?[20,40,20]:30)}catch(e){}
      toast(re9?'已换成当前画面':'已夹住当前画面——随你下一句一起发给 TA；再按换一帧，点缩略图上的 × 取消');
    })}catch(e){}/* 手机端：手动夹带画面 */
    try{var _scx9=d.querySelector('#ibc-shotc-x');if(_scx9)_scx9.addEventListener('click',function(ev){ev.stopPropagation();_vidPend=null;_shotChip(null);toast('已取消夹带')})}catch(e){}
    try{var stV2=document.createElement('style');stV2.id='ibcall-style-vid2';stV2.textContent='#ibcall-vwin{position:fixed;right:12px;top:calc(84px + var(--sat,0px));width:104px;height:148px;z-index:4310;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.35);box-shadow:0 6px 22px rgba(0,0,0,0.38);background:#000;touch-action:none}#ibcall-vwin[hidden]{display:none}#ibcall-vwin video{width:100%;height:100%;object-fit:cover}#ibcall-vwin video.mir{transform:scaleX(-1)}#ibcall-vwin .vw-t{position:absolute;left:0;right:0;bottom:0;padding:3px 0 4px;text-align:center;font-size:0.68rem;color:#fff;background:linear-gradient(0deg,rgba(0,0,0,0.55),transparent);pointer-events:none}#ibcall .ibc-doo{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}#ibcall:not(.vid) .ibc-doo{display:none}#ibcall .ibc-doo span{position:absolute;font-size:34px;transform:translate(-50%,-50%);animation:ibcDoo 5.6s ease forwards;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.35))}@keyframes ibcDoo{0%{opacity:0;transform:translate(-50%,-50%) scale(0.4)}12%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}22%{transform:translate(-50%,-50%) scale(1)}78%{opacity:1}100%{opacity:0;transform:translate(-50%,-62%) scale(1)}}#ibcall .ibc-gl{width:min(73%,420px);display:flex;flex-direction:column;gap:6px;pointer-events:none;padding-bottom:4px}.ibc-gb{align-self:flex-start;display:flex;align-items:center;gap:7px;padding:6px 13px 6px 9px;border-radius:999px;color:#fff;font-size:0.85rem;border:1px solid rgba(255,255,255,0.22);background:linear-gradient(96deg,rgba(118,150,202,0.62),rgba(88,114,168,0.56));box-shadow:0 4px 14px rgba(40,60,110,0.3);backdrop-filter:blur(8px) saturate(1.3);-webkit-backdrop-filter:blur(8px) saturate(1.3);animation:ibcGbIn 0.32s ease;opacity:1;transition:opacity 0.4s}.ibc-gb.gb-heart{background:linear-gradient(96deg,rgba(248,182,208,0.94),rgba(238,142,188,0.9));border-color:rgba(255,222,236,0.62);box-shadow:0 4px 16px rgba(232,124,172,0.38);color:#fff;text-shadow:0 1px 3px rgba(160,50,100,0.35)}.ibc-gb.out{opacity:0}.ibc-gb .gb-ic{flex:none;width:22px;height:22px;display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.18))}.ibc-gb .gb-ic svg,.ibc-gb .gb-ic img{width:100%;height:100%;display:block}.ibc-gb .gb-e{font-size:1rem;line-height:1}.ibc-gb.gb-bouquet{border-radius:15px;padding:6px 14px 6px 9px;background:linear-gradient(96deg,rgba(228,239,254,0.96),rgba(184,208,244,0.92));border-color:rgba(255,255,255,0.88);box-shadow:0 4px 18px rgba(118,158,222,0.4),inset 0 1px 0 #fff;color:#2f4c7c;text-shadow:0 1px 0 rgba(255,255,255,0.65)}.ibc-gb.gb-bouquet .gb-ic{width:26px;height:26px;margin:-2px 0}.ibc-gb.gb-fireworks{position:relative;overflow:hidden;padding:6px 8px 6px 9px;background:linear-gradient(96deg,rgba(34,44,88,0.94),rgba(74,58,124,0.9));border-color:rgba(255,214,150,0.6);box-shadow:0 6px 22px rgba(255,170,90,0.3),0 0 16px rgba(255,200,120,0.28),inset 0 1px 0 rgba(255,235,190,0.35);color:#fff4dc;text-shadow:0 1px 4px rgba(120,60,0,0.45)}.ibc-gb.gb-fireworks .gb-ic{width:26px;height:26px;margin:-2px 0;filter:drop-shadow(0 0 5px rgba(255,208,120,0.7))}.ibc-gb.gb-fireworks::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 32%,rgba(255,255,255,0.3) 50%,transparent 68%);transform:translateX(-120%);animation:ibcGbSheen 2.4s ease-in-out 0.35s 2;pointer-events:none}@keyframes ibcGbSheen{to{transform:translateX(120%)}}@media (prefers-reduced-motion:reduce){.ibc-gb.gb-fireworks::after{animation:none}}.ibc-gb .gb-t,.ibc-gb .gb-ic{position:relative;z-index:1}.ibc-gb.gb-meteor{position:relative;overflow:hidden;padding:7px 9px 7px 10px;background:linear-gradient(96deg,rgba(22,30,72,0.95),rgba(60,44,118,0.92));border-color:rgba(190,210,255,0.65);box-shadow:0 8px 26px rgba(90,120,255,0.35),0 0 18px rgba(150,180,255,0.3),inset 0 1px 0 rgba(220,230,255,0.4);color:#eef2ff;text-shadow:0 1px 4px rgba(20,30,90,0.6)}.ibc-gb.gb-meteor .gb-ic{width:28px;height:28px;margin:-3px 0;filter:drop-shadow(0 0 6px rgba(180,200,255,0.8))}.ibc-gb.gb-meteor .gb-streak{position:absolute;left:-34%;top:-10%;width:34%;height:120%;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,0.55) 50%,transparent 60%);transform:skewX(-20deg);animation:ibcGbStreak 1.6s ease-in-out 0.2s 3;pointer-events:none;z-index:0}@keyframes ibcGbStreak{to{left:110%}}.ibc-gb.gb-galaxy{position:relative;overflow:hidden;padding:8px 12px 8px 11px;background:linear-gradient(96deg,#0b1231 0%,#1a2050 46%,#2b1d55 100%);border-color:rgba(255,226,170,0.55);box-shadow:0 10px 30px rgba(40,60,160,0.45),0 0 22px rgba(255,210,140,0.22),inset 0 1px 0 rgba(255,236,200,0.28);color:#fff7e8;text-shadow:0 1px 4px rgba(0,0,40,0.7)}.ibc-gb.gb-galaxy .gb-ic{width:30px;height:30px;margin:-4px 0;filter:drop-shadow(0 0 7px rgba(255,220,150,0.8))}.ibc-gb.gb-galaxy .gb-way{position:absolute;left:-20%;right:-20%;top:-40%;bottom:-40%;z-index:0;pointer-events:none;background:linear-gradient(100deg,transparent 22%,rgba(190,206,255,0.14) 40%,rgba(255,240,210,0.34) 50%,rgba(190,206,255,0.14) 60%,transparent 78%);filter:blur(4px);animation:ibcGbWay 6s ease-in-out infinite alternate}@keyframes ibcGbWay{from{transform:translateX(-6%) rotate(-2deg)}to{transform:translateX(6%) rotate(2deg)}}@media (prefers-reduced-motion:reduce){.ibc-gb.gb-meteor .gb-streak,.ibc-gb.gb-galaxy .gb-way{animation:none}}.ibc-fx{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;display:none;z-index:4305}#ibcall .ibc-fx{position:absolute;z-index:0}.ibc-fx.on{display:block}.ibc-gb i{font-style:normal;font-weight:700;margin-left:1px}@keyframes ibcGbIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}#ibcall .ibc-vgc{min-width:46px;height:34px;border-radius:999px;padding:0 11px;display:flex;gap:5px;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.24);background:rgba(0,0,0,0.30);color:#fff;font-size:0.98rem;backdrop-filter:blur(10px) saturate(1.3);-webkit-backdrop-filter:blur(10px) saturate(1.3)}#ibcall .ibc-vgc b{font-size:0.8rem;font-weight:700}#ibcall .ibc-vgc[hidden]{display:none}#ibcall .ibc-vgp{position:absolute;right:calc(12px + var(--sar,0px));top:calc(216px + var(--sat,0px));z-index:6;min-width:158px;border-radius:14px;padding:10px 13px;background:rgba(18,18,26,0.8);border:1px solid rgba(255,255,255,0.18);backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3);color:#fff;font-size:0.85rem}#ibcall .ibc-vgp[hidden]{display:none}#ibcall .ibc-vgp .vgp-t{font-weight:600;opacity:0.75;margin-bottom:6px;font-size:0.74rem;letter-spacing:0.08em}#ibcall .ibc-vgp .r{display:flex;justify-content:space-between;gap:16px;padding:3px 0}#ibcall .ibc-vgp .r.tt{border-top:1px solid rgba(255,255,255,0.14);margin-top:4px;padding-top:6px}.ibc-vb.on{background:rgba(88,140,220,0.62);border-color:rgba(190,215,255,0.9);box-shadow:0 0 0 3px rgba(120,170,240,0.35),0 0 14px rgba(120,170,240,0.5)}#ibcall .ibc-shotc{position:absolute;right:58px;top:0;width:52px;height:52px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.75);box-shadow:0 4px 14px rgba(0,0,0,0.4);background:#000;z-index:3}#ibcall .ibc-shotc[hidden]{display:none}#ibcall .ibc-shotc img{width:100%;height:100%;object-fit:cover;display:block}#ibcall .ibc-shotc .sc-x{position:absolute;right:2px;top:2px;width:18px;height:18px;border-radius:50%;border:0;padding:0;background:rgba(0,0,0,0.58);color:#fff;font-size:13px;line-height:18px;text-align:center}#ibcall .ibc-shotc.in{animation:ibcShotIn 0.32s cubic-bezier(0.2,0.9,0.3,1.15)}@keyframes ibcShotIn{0%{transform:scale(0.55);opacity:0;filter:brightness(2)}60%{filter:brightness(1.6)}100%{transform:scale(1);opacity:1;filter:brightness(1)}}#ibcall .ibc-cam{transition:filter 0.7s ease}#ibcall.fx-glow .ibc-cam{filter:brightness(1.12) saturate(1.16) contrast(1.02)}#ibcall-vwin video{transition:filter 0.7s ease}#ibcall-vwin.fx-glow video{filter:brightness(1.12) saturate(1.16)}#ibcall .ibc-vgp .gb-ic{display:inline-block;width:16px;height:16px;vertical-align:-3px;margin-right:5px}#ibcall .ibc-vgp .gb-ic svg,#ibcall .ibc-vgp .gb-ic img{width:100%;height:100%;display:block}#ibcall .ibc-vgp .gb-e{font-size:0.9rem}';document.head.appendChild(stV2)}catch(e){}
    try{
      _vw=document.createElement('div');_vw.id='ibcall-vwin';_vw.hidden=true;_vw.setAttribute('role','button');_vw.title='点按回到视频通话';
      _vw.innerHTML='<video id="ibcw-v" autoplay playsinline muted></video><span class="vw-t" id="ibcw-t">0:00</span>';
      document.body.appendChild(_vw);_vwV=_vw.querySelector('#ibcw-v');_vwT=_vw.querySelector('#ibcw-t');
      var _vd=null;
      _vw.addEventListener('pointerdown',function(ev){_vd={x:ev.clientX,y:ev.clientY,l:_vw.offsetLeft,t:_vw.offsetTop,mv:false};try{_vw.setPointerCapture(ev.pointerId)}catch(e){}});
      _vw.addEventListener('pointermove',function(ev){if(!_vd)return;var dx=ev.clientX-_vd.x,dy=ev.clientY-_vd.y;if(!_vd.mv&&dx*dx+dy*dy<49)return;_vd.mv=true;var L=Math.max(6,Math.min(window.innerWidth-_vw.offsetWidth-6,_vd.l+dx)),T=Math.max(6,Math.min(window.innerHeight-_vw.offsetHeight-6,_vd.t+dy));_vw.style.left=L+'px';_vw.style.top=T+'px';_vw.style.right='auto';_vw.style.bottom='auto'});
      _vw.addEventListener('pointerup',function(){var mv=_vd&&_vd.mv;_vd=null;if(!mv)setMini(false)});
      _vw.addEventListener('pointercancel',function(){_vd=null});
    }catch(e){}/* 手机端：视频折叠小画面窗（同流双消费，点按还原，可拖动） */
    try{var stV=document.createElement('style');stV.id='ibcall-style-vid';stV.textContent='#ibcall.vid::before,#ibcall.vid::after{display:none}#ibcall>.ibc-cam{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;background:#000;opacity:0;transition:opacity 0.28s}#ibcall>.ibc-cam.live{opacity:1}#ibcall .ibc-cam.mir{transform:scaleX(-1)}#ibcall:not(.vid) .ibc-cam,#ibcall:not(.vid) .ibc-vt,#ibcall:not(.vid) .ibc-dm{display:none}#ibcall.vid,body:not(.theme-infernal) #ibcall.vid{color:#fff;background:#000}#ibcall.vid .ibc-mid{position:absolute;left:calc(12px + var(--sal,0px));top:calc(10px + var(--sat,0px));right:auto;width:auto;flex:none;flex-direction:row;align-items:center;gap:9px;padding:5px 13px 5px 6px;min-height:0;border-radius:999px;background:rgba(0,0,0,0.32);border:1px solid rgba(255,255,255,0.16);backdrop-filter:blur(10px) saturate(1.3);-webkit-backdrop-filter:blur(10px) saturate(1.3);z-index:2;max-width:72vw}#ibcall.vid .ibc-avaw{padding:0}#ibcall.vid .ibc-ava{width:38px;height:38px;font-size:1rem}#ibcall.vid .ibc-ava::before{inset:-5px}#ibcall.vid .ibc-breath{inset:-6px}#ibcall.vid .ibc-avwave,#ibcall.vid .ibc-wavew,#ibcall.vid .ibc-lyr,#ibcall.vid .ibc-sub,#ibcall.vid .ibc-en,#ibcall.vid .ibc-flex{display:none}#ibcall.vid .ibc-name,body:not(.theme-infernal) #ibcall.vid .ibc-name{font-size:0.98rem;margin-top:0;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,0.55)}#ibcall.vid .ibc-timer,body:not(.theme-infernal) #ibcall.vid .ibc-timer{font-size:0.78rem;opacity:0.88;color:#fff;margin:0 0 0 2px}#ibcall .ibc-vt{position:absolute;right:calc(12px + var(--sar,0px));top:calc(62px + var(--sat,0px));display:flex;flex-direction:column;gap:12px;z-index:2}#ibcall .ibc-vb{width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,0.24);background:rgba(0,0,0,0.30);color:#fff;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px) saturate(1.3);-webkit-backdrop-filter:blur(10px) saturate(1.3)}#ibcall .ibc-vb svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}#ibcall .ibc-vb:active{transform:scale(0.94)}#ibcall .ibc-dm{flex:1 1 auto;min-height:0;width:calc(100% + 10px);margin-left:-10px;align-self:flex-start;display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;padding:0 14px 4px 0;pointer-events:none;z-index:1}#ibcall .ibc-dmw{width:min(73%,420px);max-height:34vh;overflow-y:auto;scrollbar-width:none;-ms-overflow-style:none;display:flex;flex-direction:column;gap:6px;pointer-events:auto;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 22%);mask-image:linear-gradient(180deg,transparent 0,#000 22%);overscroll-behavior:contain}#ibcall .ibc-dmw::-webkit-scrollbar{display:none}#ibcall .ibc-dmi{max-width:100%;background:rgba(0,0,0,0.36);border:1px solid rgba(255,255,255,0.10);border-radius:15px;padding:6px 12px;font-size:0.87rem;line-height:1.42;color:#fff;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:ibcDmIn 0.28s ease;word-break:break-word;white-space:pre-wrap}#ibcall .ibc-dmi.me{background:rgba(64,110,180,0.42);border-color:rgba(140,180,240,0.28)}#ibcall .ibc-dmi .ibc-dmn{font-weight:600;opacity:0.8;margin-right:6px}@keyframes ibcDmIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}#ibcall .ibc-flash{position:absolute;inset:0;background:#fff;opacity:0.85;z-index:5;pointer-events:none;animation:ibcFlash 0.42s ease forwards}@keyframes ibcFlash{to{opacity:0}}#ibcall.vid .ibc-minb{background:rgba(0,0,0,0.30);border-color:rgba(255,255,255,0.24);color:#fff}#ibcall.vid .ibc-b:not(.end){background:rgba(0,0,0,0.34);border-color:rgba(255,255,255,0.2);color:#fff}#ibcall.vid .ibc-blab{display:none}#ibcall.vid .ibc-btns{padding:8px 0 12px}';document.head.appendChild(stV)}catch(e){}
    try{var _fb9=d.querySelector('#ibc-flip');if(_fb9)_fb9.addEventListener('click',function(){doFlip()})}catch(e){}
    
    try{if(UI.cam)UI.cam.addEventListener('click',function(){if(state==='speak'||state==='think')interrupt('tap')})}catch(e){}
    UI.mute.addEventListener('click',toggleMute);
    if(UI.kb)UI.kb.addEventListener('click',function(){try{if(UI.type.hidden){UI.type.hidden=false;UI.typeIn.focus()}else{UI.type.hidden=true}}catch(e){}});
    var _tsB=d.querySelector('#ibc-type-send');if(_tsB)_tsB.addEventListener('click',doTypeSend);
    if(UI.typeIn)UI.typeIn.addEventListener('keydown',function(ev){if(ev.key==='Enter'&&!ev.isComposing){ev.preventDefault();doTypeSend()}});
    d.querySelector('#ibc-end').addEventListener('click',function(){endCall('user')});
    d.querySelector('#ibc-intr').addEventListener('click',function(){interrupt('tap')});
    UI.wave.addEventListener('click',function(){if(state==='speak'||state==='think')interrupt('tap')});
    try{var _avT9=d.querySelector('#ibc-ava');if(_avT9)_avT9.addEventListener('click',function(){if(state==='speak'||state==='think')interrupt('tap')})}catch(e){}/* 手机端：#3界面 头像盖在画布中央，点头像同样打断 */
  }catch(e){built=false}
}
function refreshColors(){try{const s=getComputedStyle(document.body);const a=(s.getPropertyValue('--acc')||'').trim();if(a)accCol=a}catch(e){}}
function sizeCanvas(){try{const cv=UI.wave;const dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=Math.max(200,Math.round(cv.clientWidth*dpr));cv.height=Math.max(28,Math.round((cv.clientHeight||52)*dpr));
  var aw=UI.avw;if(aw){var w9=Math.max(240,Math.min(520,(UI.root&&UI.root.clientWidth)||window.innerWidth||360));aw.style.width=w9+'px';aw.width=Math.round(w9*dpr);aw.height=Math.round(150*dpr)}/* v174：③头像后声波画布随页宽取尺 */}catch(e){}}/* 手机端：#6 独立细条取尺 *//* 手机端：#3界面 画布随 hero 横区取尺 */
function _ibcNavHang(nid,nth){
  try{
    if(!isOpen||!cfg)return;
    if(nid===cfg.id&&String(nth||'')===String(threadId||''))return;/* 回到同一会话（通知直达等）不动 */
    endCall('nav');
    toast('已离开通话所在的会话，通话已挂断——悬浮通话目前只在会话内有效');
  }catch(e){}
}
function setMini(on){
  _min9=!!on;try{if(_fxRun)_fxMount()}catch(e){}/* 手机端：特效画布随全屏 / 小窗换挂载点，场不断 */
  try{UI.root.classList.toggle('mini',_min9)}catch(e){}
  try{document.body.classList.toggle('ibcall-full',!!isOpen&&!_min9);if(_min9){var _bx9=document.getElementById('cv-msgs');if(_bx9)_bx9.scrollTop=_bx9.scrollHeight}}catch(e){}/* 手机端：收成小条＝聊天列表恢复绘制并滚到底 */
  try{
    if(!_pill)return;
    if(_min9){
      var t9=_pill.querySelector('#ibcp-t'),i9=_pill.querySelector('#ibcp-i');
      var srcA=(UI.avaI&&UI.avaI.style.display!=='none')?UI.avaI.src:'';
      if(srcA){i9.src=srcA;i9.style.display='block';t9.style.display='none'}
      else{i9.style.display='none';t9.style.display='';t9.textContent=(UI.avaT&&UI.avaT.textContent)||'☎'}
      if(_pillT)_pillT.textContent=fmtDur(Math.max(0,Math.round((Date.now()-t0)/1000)));
      try{var n9=_pill.querySelector('#ibcp-n');if(n9)n9.textContent=(cfg?cfgName(cfg):'')||''}catch(e){}/* 手机端：#3 昵称随头像同步 */
      _pill.dataset.st=state;_pill.hidden=false;
      try{if(vidOn&&_vw){_vwV.srcObject=vidStream;_vwV.classList.toggle('mir',!!(UI.cam&&UI.cam.classList.contains('mir')));_vw.hidden=false;_pill.hidden=true;if(_vwT)_vwT.textContent=fmtDur(Math.max(0,Math.round((Date.now()-t0)/1000)))}}catch(e){}/* 手机端：视频折叠成小画面窗 */
    }else{_pill.hidden=true;try{if(_vw){_vw.hidden=true;if(_vwV)_vwV.srcObject=null}}catch(e){}sizeCanvas()}/* 手机端：还原时收窗断流引用 */
  }catch(e){}
}
var _statTx='';
function setState(st,txt){state=st;try{UI.root.dataset.state=st;if(txt!=null)_statTx=String(txt);if(UI.en)UI.en.textContent=({listen:'Listening...',rec:'Listening...',asr:'Listening...',speak:'Saying...',think:'Thinking...'})[st]||''}catch(e){}}
var _lyrHold=false,_lyrHoldT=0,_lyrLast=null,_lyrShowMe=true;
var vidOn=false,vidStream=null,vidFace='user',_dmLast=null,_dmHold=false,_vidErr='',_vidLastLook=0,_vw=null,_vwV=null,_vwT=null;var _vtSeen=[];var _vgCnt={},_vgTotal=0;var _vidPend=null;/* 手机端：看画面节拍 / 小画面窗 / 标签去重；手机端：礼物计数 *//* 手机端：视频通话状态 */
function _lyrMeName(){try{return (_about&&_about.name)||'你'}catch(e){return '你'}}
function _lyrAiName(){try{return _capNm||(cfg&&cfgName(cfg))||'TA'}catch(e){return 'TA'}}/* 手机端：#6 歌词行带昵称 */
function _lyrReset(){try{UI.lyr.innerHTML='';_lyrHold=false;_lyrLast=null;if(_lyrHoldT){clearTimeout(_lyrHoldT);_lyrHoldT=0}}catch(e){}}
function _lyrFollow(){try{if(!_lyrHold)UI.lyr.scrollTop=UI.lyr.scrollHeight}catch(e){}}
function _lyrPush(who,text,sub){/* v174：②sub＝第二行（外语模式下的中文字幕） */
  try{
    if(!text)return;
    if(_lyrLast&&_lyrLast.who===who&&_lyrLast.text===text&&(_lyrLast.sub||'')===(sub||''))return;/* 连续同句去重（重试/回显） */
    var prev=UI.lyr.lastElementChild;if(prev)prev.classList.remove('cur');
    var d9=document.createElement('div');d9.className='ibc-ly cur'+(who==='me'?' me':'');d9.textContent=text;
    if(sub){var s9=document.createElement('span');s9.className='ibc-ly-sub';s9.textContent=sub;d9.appendChild(s9)}
    UI.lyr.appendChild(d9);_lyrLast={who:who,text:text,sub:sub||''};
    try{if(vidOn)_dmPush(who,text)}catch(e){}/* 手机端：视频模式下同一条字幕并联进弹幕区 */
    while(UI.lyr.childElementCount>120)UI.lyr.removeChild(UI.lyr.firstElementChild);/* 超长通话截尾，只留近 120 句 */
    _lyrFollow();
  }catch(e){}
}
function setCap(main,sub){
  try{
    if(sub!=null)UI.sub.textContent=sub;
    if(main==null)return;
    var s=String(main);
    if(!s){var c9=UI.lyr&&UI.lyr.lastElementChild;if(c9)c9.classList.remove('cur');_lyrLast=null;return}
    if(s.indexOf('你：')===0){if(_lyrShowMe)_lyrPush('me',_lyrMeName()+'：'+s.slice(2))}
    else _lyrPush('ai',_lyrAiName()+'：'+s.replace(/^[“"]+|[”"]+$/g,''));
  }catch(e){}
}
function setCapAi(cap,foreign){
  try{UI.sub.textContent='';var c9=String(cap||'').replace(/^[“"]+|[”"]+$/g,''),f9=String(foreign||'').replace(/^[“"]+|[”"]+$/g,'');
    if(!c9&&!f9)return;
    if(f9&&f9!==c9){var pre9=(_lyrLast&&_lyrLast.who==='ai')?'':(_lyrAiName()+'：');_lyrPush('ai',pre9+f9,c9)}/* v174：②双语只在 TA 这一段的第一句带昵称，后面连着的句子不再每句重复「昵称：」 */
    else _lyrPush('ai',_lyrAiName()+'：'+(c9||f9))}catch(e){}
}
function fmtDur(s){return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2)}
function kaw(on){
  try{const C=window.Capacitor;
    if(C&&C.isNativePlatform&&C.isNativePlatform()&&C.Plugins&&C.Plugins.IBShell&&typeof C.Plugins.IBShell.keepAwake==='function'){C.Plugins.IBShell.keepAwake({on:!!on});return}
  }catch(e){}
  if(on){try{if(navigator.wakeLock&&navigator.wakeLock.request)navigator.wakeLock.request('screen').then(function(l){wl=l}).catch(function(){})}catch(e){}}
  else{try{if(wl)wl.release()}catch(e){}wl=null}
}
async function openCall(opts){
  const c=_activeCfg,wantVid=!!(opts&&opts.video);/* 手机端 */
  if(isOpen){
    if(c&&cfg&&c.id===cfg.id){if(!!wantVid!==!!vidOn){toast(vidOn?'视频通话进行中——先挂断这通，再从菜单拨语音':'语音通话进行中——先挂断这通，再从菜单拨视频');return}setMini(false)}/* 手机端：两条入口不互通 */
    else toast('正在与「'+((cfg&&cfgName(cfg))||'对方')+'」通话中，请先挂断再拨打');
    return;
  }
  if(!c){toast('先打开一个对话再拨打');return}
  if(c._group&&!(typeof pickGroupUtilCfg==='function'&&pickGroupUtilCfg(c._group))){toast('群里还没有配好 API Key 的成员');return}
  const cs=await loadCALL();
  if(cs.on===false){toast('语音通话已关闭（API 页 → 工具 → 通话设置 可重新开启）');return}
  if(wantVid&&!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)){toast(window.isSecureContext?'这台环境没有摄像头通道——想聊就从菜单拨语音通话':'非 HTTPS 环境开不了摄像头——想聊就从菜单拨语音通话');return}
  await loadVT();
  asrOff=!vtReady();
  var vidTypeSel=(wantVid&&cs.vidIn==='type');if(vidTypeSel)asrOff=true;
  if(!c.apiKey&&!c._group){toast('这个配置还没有 API Key，请到 API 页填写');return}/* 手机端：群聊看成员 */
  if(!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)){asrOff=true;toast(window.isSecureContext?'此环境不支持麦克风——转打字模式':'非 HTTPS 环境浏览器禁用麦克风——转打字模式')}/* 手机端：#5 降级而非拒绝进入 */
  cfg=c;threadId=_activeThread?_activeThread.id:'';myKey=_keyOf(cfg.id,threadId);_spkFid='';_spkNm='';_capNm='';_voiceFid='';/* 手机端 */
  ensureUI();if(!built){toast('通话界面初始化失败');return}
  const _efO=_callEffMerge(cs,c.id);langMode=(_efO.lang&&{en:1,ja:1,ko:1}[_efO.lang])?_efO.lang:'';if(c._group)langMode='';rawCur=0;_confSig='';/* v138-c：③④；手机端：#2 外语模式按该 API 有效值 */
  try{UI.conf.hidden=true;UI.conf.innerHTML='';UI.type.hidden=true;UI.typeIn.value=''}catch(e){}
  /* 用户手势内解锁：AudioContext 静音一帧 + 预热 speechSynthesis */
  try{if(!ctx||ctx.state==='closed')ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){ctx=null}
  try{if(ctx&&ctx.state==='suspended')ctx.resume()}catch(e){}
  try{if(ctx){const b=ctx.createBuffer(1,1,22050);const s=ctx.createBufferSource();s.buffer=b;s.connect(ctx.destination);s.start(0)}}catch(e){}
  try{if('speechSynthesis' in window){speechSynthesis.cancel();speechSynthesis.getVoices()}}catch(e){}
  if(!ctx){toast('此环境不支持音频处理');cleanupAudio();return}
  
  if(!asrOff){
    try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}
    catch(err){stream=null;asrOff=true;toast('麦克风不可用（'+String((err&&err.message)||err).slice(0,50)+'）——转打字模式')}
  }
  try{
    if(!asrOff&&stream){
      srcNode=ctx.createMediaStreamSource(stream);
      anaMic=ctx.createAnalyser();anaMic.fftSize=1024;anaMic.smoothingTimeConstant=0.55;
      proc=ctx.createScriptProcessor(2048,1,1);
      muteGain=ctx.createGain();muteGain.gain.value=0;/* 采集链静音落地：ScriptProcessor 需要接到 destination 才会跑，增益 0 防自听 */
      srcNode.connect(anaMic);
      srcNode.connect(proc);proc.connect(muteGain);muteGain.connect(ctx.destination);
      proc.onaudioprocess=onAudio;
    }
    outGain=ctx.createGain();anaOut=ctx.createAnalyser();anaOut.fftSize=1024;anaOut.smoothingTimeConstant=0.5;
    outGain.connect(anaOut);anaOut.connect(ctx.destination);
  }catch(e){toast('音频初始化失败：'+String((e&&e.message)||e).slice(0,60));cleanupAudio();return}
  /* 复位 */
  ring=[];ringSamples=0;utterStart=-1;
  vad={cal:false,calN:0,noise:0.006,voiced:false,voMs:0,siMs:0};bargeMs=0;
  q=[];speaking=false;curSrc=null;curRaw='';cur=0;dropStream=false;turnBusy=false;lastSaid='';lastTurnT=0;_vbCol=null;_vbPendV9=[];_vbT0V9=Date.now();/* 本轮：语音条收集器随开打清空，记下通话起点 */
  cloudDead=false;sysDead=false;muted=false;turns=0;t0=Date.now();
  hbLastUser=t0;hbLastAi=0;hbCount=0;hbBusy=false;hbGen++;avLvl=0;/* v174：①③复位 */
  isOpen=true;
  try{document.body.classList.add('ibcall-full')}catch(e){}/* 手机端：全屏通话标记 */
  _lyrReset();/* 手机端：#2 新通话清空歌词流 */
  try{_lyrShowMe=(cs.lyrMe!==false)}catch(e){_lyrShowMe=true}/* 手机端：#6 我方句子显隐（全局设置） */
  try{UI.mute.classList.remove('on');UI.mute.innerHTML=MIC_ON}catch(e){}
  try{const av=_pfAvatar(cfg);/* v176-p：群头像走 _pfAvatar（认群） */
    if(av){UI.avaI.src=av;UI.avaI.style.display='';UI.avaT.style.display='none'}
    else{UI.avaI.style.display='none';UI.avaT.style.display='';UI.avaT.textContent=(cfgName(cfg)||'?').charAt(0).toUpperCase()}
    UI.name.textContent=cfgName(cfg)||'';
  }catch(e){}
  try{_min9=false;UI.root.classList.remove('mini');if(_pill)_pill.hidden=true}catch(e){}/* 手机端：#4 */
  UI.root.hidden=false;
  try{Promise.resolve(loadCALL()).then(function(s9){UI.root.classList.toggle('nobarge',!!(s9&&s9.bargein===false))})}catch(e){}/* 手机端：③语音打断关闭时不出「打断」钮 */
  vidOn=false;try{UI.root.classList.remove('vid')}catch(e){}
  if(wantVid){
    vidOn=true;vidFace=(cs.vidFace==='env')?'environment':'user';try{UI.root.classList.add('vid')}catch(e){}_dmReset();_vidLastLook=0;_vtSeen.length=0;try{if(UI.doo)UI.doo.innerHTML=''}catch(e){}_fxReset();_vgCnt={};_vgTotal=0;_vidPend=null;try{_shotChip(null)}catch(e){}try{window._ibcEphM=null}catch(e){}try{if(UI.att)UI.att.classList.remove('on');if(UI.gl)UI.gl.innerHTML='';if(UI.vgc){UI.vgc.hidden=(cs.vidGift!==true);if(UI.vgn)UI.vgn.textContent='0'}if(UI.vgp)UI.vgp.hidden=true}catch(e){}/* 手机端；手机端：夹带/临时帧复位 */
    try{if(cs.vidSee&&cs.vidSee!=='off'&&typeof _noVisionM==='function'){if(c._group){var _mv9=(c._group.members||[]).map(function(id){return (_cfgs||[]).find(function(a){return a.id===id})}).filter(function(a){return a&&a.apiKey&&!_noVisionM(a)});if(!_mv9.length)toast('注意：群里没有标记为「识图」的成员，画面不会发给任何人——去成员的编辑页打开「支持图片识别（视觉能力）」')}else if(_noVisionM(c)){toast('注意：这条 API 被标记为「不识图」，画面不会发过去——模型确实带视觉的话，去它的编辑页打开「支持图片识别（视觉能力）」再试')}}}catch(e){}/* 手机端：拨视频当场把话说明 */
    vidStart().then(function(ok){if(!ok&&isOpen&&vidOn){toast('摄像头没打开（'+(_vidErr||'未知原因')+'）——已挂断；想聊可以从菜单拨语音通话');try{endCall('viderr')}catch(e){}}});
  }
  refreshColors();sizeCanvas();
  kaw(true);
  startTimer();
  if(raf)cancelAnimationFrame(raf);
  raf=requestAnimationFrame(loop);
  try{var mw9=UI.mute.closest('.ibc-bw');(mw9||UI.mute).style.display=asrOff?'none':''}catch(e){}
  if(vidTypeSel){/* 手机端：用户主动选的文字视频，不提「配识别」 */
    setState('listen','文字模式');
    setCap('','文字视频通话：点下面的「打字」和 TA 说话。');
    try{UI.type.hidden=false}catch(e){}
  }else if(asrOff){
    setState('listen','打字模式');
    setCap('','这次通话不收音：点下面的「打字」和 TA 说话，TA 照常出声回你。想用嘴说，请到 API 页 → 工具 → 语音转写 配好识别接口。');
  }else{
    setState('listen','正在听 · 校准环境音');
    setCap('','');/* 手机端：提示行「像打电话一样开口就行，说完停一下会自动发出」按要求删空（提示词审查 #8） */
  }
}
function onAudio(e){
  if(!isOpen)return;
  let f;try{f=e.inputBuffer.getChannelData(0)}catch(err){return}
  let s=0;for(let i=0;i<f.length;i++){const v=f[i];s+=v*v}
  const rms=Math.sqrt(s/f.length);
  const frameMs=f.length/ctx.sampleRate*1000;
  const seg=_ibcResample(f,ctx.sampleRate,SR);
  ring.push(seg);ringSamples+=seg.length;
  while(ringSamples>RING_MAX&&ring.length>1){ringSamples-=ring[0].length;ring.shift();if(utterStart>0)utterStart--;else if(utterStart===0)utterStart=0}
  if(state==='speak'){
    /* 语音打断：TA 说话时持续开麦，连续高能量约 0.42s 即打断（回声消除已开；误触多可在设置里关掉） */
    if(!muted&&_callS&&_callS.bargein!==false){
      if(rms>Math.max(vad.noise*6,0.035))bargeMs+=frameMs;else bargeMs=Math.max(0,bargeMs-frameMs*2);
      if(bargeMs>=420){bargeMs=0;interrupt('voice')}
    }
    return;
  }
  bargeMs=0;
  if(muted||state==='asr'||state==='think'){vad.voiced=false;vad.voMs=0;vad.siMs=0;utterStart=-1;return}
  if(state!=='listen'&&state!=='rec')return;
  const act=_ibcVadStep(vad,rms,frameMs);
  if(act==='start'){
    /* 起点回拨约 0.35s，别吃掉第一个字 */
    let back=Math.round(SR*0.35),idx=ring.length-1,acc=0;
    while(idx>0&&acc<back){acc+=ring[idx].length;idx--}
    utterStart=idx;
    hbLastUser=Date.now();hbCount=0;hbGen++;
    setState('rec','在听你说…');
  }else if(act==='end'){
    const st0=utterStart;utterStart=-1;
    if(st0>=0)finishUtter(st0);else setState('listen','正在听…');
  }else if(act==='drop'){
    utterStart=-1;setState('listen','正在听…');
  }else if(!vad.cal&&state==='listen'){/* 校准中不动状态文案 */}
  else if(vad.cal&&state==='listen'&&_statTx.indexOf('校准')>=0){setState('listen',muted?'已关闭麦克风':'正在听…')}/* 手机端：#4 改读内部留档 */
}
async function finishUtter(st0){
  let chunks=ring.slice(Math.max(0,st0));
  let drop=Math.round(SR*0.3);/* 结尾静音少带一点 */
  while(drop>0&&chunks.length){const lastC=chunks[chunks.length-1];
    if(lastC.length<=drop){drop-=lastC.length;chunks.pop()}
    else{chunks[chunks.length-1]=lastC.subarray(0,lastC.length-drop);drop=0}}
  if(!chunks.length){setState('listen','正在听…');return}
  if(asrOff){setCap('','这次通话没配语音识别，听不见你——请点「打字」');setState('listen','打字模式');return}/* 手机端：#5 */
  const blob=new Blob([_ibcWavEncode(chunks,SR)],{type:'audio/wav'});
  setState('asr','听清中…');
  let text='';
  try{text=await callASR(blob)}
  catch(err){
    if(!isOpen)return;
    setCap('','识别失败：'+String((err&&err.message)||err).slice(0,60)+'（检查语音转写接口）');
    setState('listen','正在听…');return;
  }
  if(!isOpen)return;
  text=String(text||'').trim();
  if(!text){setCap('','没听清，再说一次？');setState('listen','正在听…');return}
  var tone9='';
  try{
    var tl9=0,i9;for(i9=0;i9<chunks.length;i9++)tl9+=chunks[i9].length;
    if(tl9>SR*0.6){
      var flat9=new Float32Array(tl9),o9=0;
      for(i9=0;i9<chunks.length;i9++){var ck9=chunks[i9];for(var j9=0;j9<ck9.length;j9++)flat9[o9+j9]=ck9[j9]/32768;o9+=ck9.length}
      tone9=_vmToneAnalyze({sampleRate:SR,numberOfChannels:1,length:tl9,duration:tl9/SR,getChannelData:function(){return flat9}},text)||'';
    }
  }catch(e9){}
  setCap('你：'+text,'');
  sendOut(text,tone9);
}
async function callASR(blob){
  const vt=await loadVT();
  const fd=new FormData();
  fd.append('file',blob,'call.wav');
  fd.append('model',vt.model||'whisper-1');
  const ac=new AbortController();const tm=setTimeout(function(){ac.abort()},25000);
  try{
    const res=await fetch(vtUrl(vt.endpoint),{method:'POST',headers:{'Authorization':'Bearer '+vt.apiKey},body:fd,signal:ac.signal});
    clearTimeout(tm);
    const raw=await res.text();
    if(!res.ok)throw new Error('HTTP '+res.status);
    try{const j=JSON.parse(raw);return j.text||(j.data&&j.data.text)||''}catch(e){return raw.trim()}
  }catch(err){clearTimeout(tm);throw (err&&err.name==='AbortError'?new Error('超时'):err)}
}
async function sendOut(text,tone){
  if(!isOpen)return;
  if(!_activeCfg||_activeCfg.id!==cfg.id||((_activeThread?_activeThread.id:'')!==threadId)){endCall('convGone');try{toast('会话已切换，通话已挂断')}catch(e){}return}
  turnBusy=true;dropStream=false;curRaw='';cur=0;rawCur=0;lastSaid='';lastTurnT=Date.now();/* v138-c：③rawCur 同步复位 */
  hbLastUser=Date.now();hbCount=0;hbGen++;
  setState('think','对方在想…');
  var sent9=false;try{sent9=(await sendQuickText((vidOn?'[视频通话] ':'[语音通话] ')+text,await (async function(){var ex9=tone?{callTone:tone}:{};try{if(vidOn){var cs9=await loadCALL(),Q9=_vidQPick(cs9);
    if(_vidPend){ex9.images=[{dataUrl:_vidPend,mime:'image/jpeg'}];_vidPend=null;try{_shotChip(null)}catch(e){}}
    var md9=String(cs9.vidSee||'off');
    if(md9!=='off'&&!ex9.images){var iv9=(md9==='turn')?0:(parseInt(md9)||0)*1000;
      if(!iv9||Date.now()-_vidLastLook>=iv9){var fr9=_vidFrame(Q9.e,Q9.q);if(fr9){ex9.ephImages=[{dataUrl:fr9,mime:'image/jpeg'}];_vidLastLook=Date.now()}}
    }
  }}catch(e){}return Object.keys(ex9).length?ex9:null})()))!==false}catch(e){}
  if(sent9)turns++;/* 修：发送被锁挡下 / 无 Key 时这轮没发出，不再计入轮数（结束卡 Round 虚高） */
  /* 若发送锁被占且这条没发出去，sendQuickText 会 toast；400ms 后核对状态，避免卡在「在想」 */
  setTimeout(function(){try{
    if(isOpen&&turnBusy&&!speaking&&!q.length&&!_sendKeys.has(myKey)){turnBusy=false;if(state==='think')setState('listen','正在听…')}
  }catch(e){}},400);
}
/* ── 发送管线三处回调（genReply/saveAi 里各一行挂钩） ── */
function onDelta(c,t,spk){
  if(!isOpen||!c||!cfg||c.id!==cfg.id||dropStream)return;
  lastTurnT=Date.now();if(spk){if(spk.id!==_spkFid){curRaw='';cur=0;rawCur=0;lastSaid=''}_spkFid=spk.id;_spkNm=cfgName(spk)}
  curRaw=String(t||'');
  if(langMode){feedLang(curRaw,false);return}/* v138-c：③外语模式走原文游标 */
  const sn=_ibcSpeechSan(curRaw);
  if(cur>sn.length)cur=sn.length;
  const r=_ibcSplit(sn,cur,false);
  if(r.sents.length){cur=r.next;for(let i=0;i<r.sents.length;i++)enq(r.sents[i])}
}
function onAiMsg(c,am,spk){
  if(!isOpen||!c||!cfg||c.id!==cfg.id||dropStream)return;
  lastTurnT=Date.now();if(spk){if(spk.id!==_spkFid){curRaw='';cur=0;rawCur=0;lastSaid=''}_spkFid=spk.id;_spkNm=cfgName(spk)}/* 手机端：换人复位（同 onDelta） *//* 手机端 */
  try{_vidTags(String((am&&am.content)||''),am&&am.id)}catch(e){}/* 手机端：TA 自主拍照 / 画装饰 */
  if(langMode){
    const full=String((am&&am.content)||'');
    if(!curRaw)rawCur=0;/* 续答轮 / 后台整条：从头解析 */
    if(rawCur>full.length)rawCur=0;
    feedLang(full,true);
    curRaw='';rawCur=0;cur=0;
    return;
  }
  const sn=_ibcSpeechSan(String((am&&am.content)||''));
  const sr=_ibcSpeechSan(curRaw);
  let from=0;
  if(sr&&cur>0){
    const n=Math.min(cur,sn.length,sr.length);
    if(n>0&&sn.slice(0,n)===sr.slice(0,n))from=Math.min(cur,sn.length);/* 同一条流式的收尾：只补没读的尾巴 */
  }
  const r=_ibcSplit(sn,from,true);
  for(let i=0;i<r.sents.length;i++)enq(r.sents[i]);
  curRaw='';cur=0;
}
function onTurnEnd(c){
  try{window._ibcEphM=null}catch(e){}/* 手机端：临时帧一轮即焚 */
  if(!isOpen||!c||!cfg||c.id!==cfg.id)return;
  turnBusy=false;dropStream=false;curRaw='';cur=0;hbLastAi=Date.now();/* v174：①静默计时从 TA 这轮结束起算 */
  if(!speaking&&!q.length&&state!=='asr'&&state!=='rec')setState('listen',muted?'已关闭麦克风':'正在听…');
}
function feedLang(raw,fin){
  var OP='<ibsay>',CL='</ibsay>';
  if(rawCur>raw.length)rawCur=0;
  for(;;){
    var o=raw.indexOf(OP,rawCur);
    if(o<0)break;
    var c=raw.indexOf(CL,o+OP.length);
    if(c<0)break;
    var cap=_ibcCleanSent(_ibcSpeechSan(raw.slice(rawCur,o)));
    var say=_ibcCleanSent(_ibcSpeechSan(raw.slice(o+OP.length,c)));
    rawCur=c+CL.length;
    if(say)enq2(say,cap||say,langMode);
    else if(cap)enq2(cap,cap,'');
  }
  if(fin){
    var rest=raw.slice(rawCur);rawCur=raw.length;
    var sn=_ibcSpeechSan(rest);
    var r=_ibcSplit(sn,0,true);
    for(var i=0;i<r.sents.length;i++){var s2=_ibcCleanSent(r.sents[i]);if(s2)enq2(s2,s2,'')}
  }
}
var _spkFid='',_spkNm='',_capNm='',_voiceFid='';
var _vbT0V9=0,_vbPendV9=[];
var _vbCol=null;
function _abB64V9(ab){try{var u=new Uint8Array(ab),CH=8192,out='';for(var i=0;i<u.length;i+=CH){out+=String.fromCharCode.apply(null,u.subarray(i,Math.min(i+CH,u.length)))}return btoa(out)}catch(e){return ''}}
function _vbMimeV9(ab){try{var h=new Uint8Array(ab,0,4),s4=String.fromCharCode(h[0],h[1],h[2],h[3]);if(s4==='RIFF')return 'data:audio/wav;base64,';if(s4==='OggS')return 'data:audio/ogg;base64,';if(s4==='fLaC')return 'data:audio/flac;base64,'}catch(e){}return 'data:audio/mpeg;base64,'}
function _vbFlushV9(fin){
  var col=_vbCol;_vbCol=null;if(col&&col.clips&&col.clips.length)_vbPendV9.push(col);
  if(!_vbPendV9.length)return;
  var batches=_vbPendV9;_vbPendV9=[];var convId=cfg?cfg.id:'';var isG=!!(cfg&&cfg._group);var t0=_vbT0V9||0;
  var pick=function(list,strict,x0,fx){var fb=null;
    for(var i=list.length-1;i>=0;i--){var m=list[i];if(!m||m.role!=='assistant'||m.callHb)continue;
      if((m.timestamp||0)<t0-60000)continue;
      if(String(m.friendId||'')!==String(convId))continue;
      if(isG&&String(m.senderId||'')!==String(fx))continue;
      if(x0){try{if(_ibcSpeechSan(String(m.content||'')).indexOf(x0)>=0)return m}catch(e){}}
      if(!strict&&!fb&&!m.callAudio)fb=m;
    }
    return fb};
  var attach=async function(col,strict){var clips=col.clips.map(function(c){return{d:c.d,s:c.s}});var fx=col.fid||'';var x0=String((col.clips[0]&&col.clips[0].x)||'').slice(0,24);
    var tgt=null,inMem=false;
    try{if(typeof _msgs!=='undefined'&&Array.isArray(_msgs)&&_activeCfg&&_activeCfg.id===convId){tgt=pick(_msgs,strict,x0,fx);inMem=!!tgt}}catch(e){}
    if(!tgt){var all=[];try{all=await dbGetAll('chatMessages')}catch(e){}
      all=all.filter(function(m){return m&&String(m.friendId||'')===String(convId)}).sort(function(x,y){return (x.timestamp||0)-(y.timestamp||0)});
      tgt=pick(all,strict,x0,fx)}
    if(!tgt)return false;
    tgt.callAudio=(Array.isArray(tgt.callAudio)?tgt.callAudio:[]).concat(clips).slice(0,200);
    await dbPut('chatMessages',tgt);
    if(inMem){try{redrawMsg(tgt)}catch(e){}}
    return true};
  (async function(){try{
    var left=[];
    for(var b=0;b<batches.length;b++){var ok=false;try{ok=await attach(batches[b],true)}catch(e){}if(!ok)left.push(batches[b])}
    if(!left.length)return;
    if(!fin){_vbPendV9=left.concat(_vbPendV9);return}
    await new Promise(function(r){setTimeout(r,1500)});
    for(var b2=0;b2<left.length;b2++){var ok2=false;try{ok2=await attach(left[b2],true)}catch(e){}if(!ok2){try{await attach(left[b2],false)}catch(e){}}}
  }catch(e){}})()}
function enq2(say,cap,lg){
  if(!say)return;
  if(say===lastSaid)return;lastSaid=say;
  q.push({t:say,c:cap||say,lg:lg||'',fid:_spkFid,nm:_spkNm});
  if(!speaking)drain();
}
function enq(s){
  s=_ibcCleanSent(s);
  if(!s)return;
  if(s===lastSaid)return;lastSaid=s;
  q.push({t:s,c:s,lg:'',fid:_spkFid,nm:_spkNm});/* 手机端：每句带上成员 */
  if(!speaking)drain();
}
async function drain(){
  if(speaking)return;speaking=true;
  setState('speak','对方在说…');
  while(isOpen&&q.length){
    const it=q.shift();
    const say=(typeof it==='string')?it:it.t;
    const cap=(typeof it==='string')?it:(it.c||it.t);
    const lg=(typeof it==='string')?'':(it.lg||'');
    _capNm=(typeof it==='string')?'':(it.nm||'');_voiceFid=(typeof it==='string')?'':(it.fid||'');
    setCapAi(cap,lg?say:'');/* v174：②双语 */
    try{await speakOne(say,lg)}catch(e){}
  }
  try{_vbFlushV9()}catch(eV9){}
  speaking=false;hbLastAi=Date.now();/* v174：①TA 说完了 */
  if(!isOpen)return;
  if(turnBusy)setState('think','对方在想…');
  else{setState('listen',muted?'已关闭麦克风':'正在听…');setCap('','')}
}
async function speakOne(s,lg){
  const g=speakGen;
  const cs=_callEffMerge(await loadCALL(),cfg?cfg.id:'');/* 手机端：#2 按当前对话 API 取有效声音 */
  if(g!==speakGen||!isOpen)return;
  if(vidOn&&_callS&&_callS.vidTts==='mute')cs.tts='off';
  const mode=(cs.tts==='cloud'&&!cloudDead)?'cloud':(cs.tts==='off'?'off':'sys');
  if(mode==='off'){await new Promise(function(r){setTimeout(r,Math.min(2600,420+s.length*130))});return}
  if(mode==='cloud'){
    try{await speakCloud(s,cs);return}
    catch(err){if(String((err&&err.message)||'')==='已打断')return;cloudDead=true;toast('云端音色失败，本次通话改用系统语音：'+String((err&&err.message)||err).slice(0,70))}
  }
  await speakSys(s,cs,lg);
}
function speakSys(s,cs,lg){
  return new Promise(function(res){
    if(sysDead||!('speechSynthesis' in window)){
      setCap(null,'本机没有可用的语音引擎，只显示字幕');/* v174：②句子已由 drain 入歌词流，这里只写提示行，不再重复推一遍原句 */
      setTimeout(res,Math.min(2600,420+s.length*130));return;
    }
    let done=false,tm=0;
    const fin=function(){if(done)return;done=true;clearTimeout(tm);res()};
    let u;
    try{u=new SpeechSynthesisUtterance(s)}catch(e){sysDead=true;fin();return}
    const LMAP={en:'en-US',ja:'ja-JP',ko:'ko-KR'};
    u.lang=(lg&&LMAP[lg])?LMAP[lg]:'zh-CN';u.volume=Math.max(0.1,Math.min(1,parseFloat(cs.vol)||1));/* v138-c：③外语句按语种发音 *//* 手机端：#1 音量随有效配置 */
    u.rate=Math.max(0.5,Math.min(2,parseFloat(cs.rate)||1));
    try{const vs=speechSynthesis.getVoices()||[];
      let v=null;
      if(cs.sysVoice)v=vs.find(function(x){return x&&(x.voiceURI===cs.sysVoice||x.name===cs.sysVoice)})||null;
      if(lg){const pf=u.lang.slice(0,2).toLowerCase();
        if(!(v&&String(v.lang||'').toLowerCase().indexOf(pf)===0))v=vs.find(function(x){return x&&String(x.lang||'').toLowerCase().indexOf(pf)===0})||null;
      }
      if(v)u.voice=v;
    }catch(e){}
    u.onend=fin;
    u.onerror=function(ev){const er=ev&&ev.error;if(er==='not-allowed'||er==='synthesis-unavailable'||er==='synthesis-failed'||er==='language-unavailable'||er==='voice-unavailable')sysDead=true;fin()};
    tm=setTimeout(fin,3200+s.length*360);
    try{speechSynthesis.speak(u)}catch(e){sysDead=true;fin()}
  });
}
function ttsUrl(ep){
  let u=String(ep||'').trim().replace(/\/+$/,'');
  if(!u)return'';
  if(/\/audio\/speech$/i.test(u))return u;
  if(!/\/v\d+[a-z]*$/i.test(u))u+='/v1';
  return u+'/audio/speech';
}
async function cloudFetchTTS(s,cs,signal){
  const prov=(cs&&cs.provider)||'oai';
  var _tn='';try{var _tm9=String(s||'').match(/^\s*【语气[:：]\s*([^】]{1,6})】\s*/);if(_tm9){_tn=_tm9[1].trim();s=String(s).slice(_tm9[0].length)}else if(window._ibToneHint){_tn=String(window._ibToneHint)}}catch(e){}try{window._ibToneHint=''}catch(e){}var _tone=(typeof window._ibToneMap==='function')?window._ibToneMap(_tn):null;/* 语气：标签只到这里，剥掉再按引擎映射 */
  let res;
  if(prov==='el'){
    if(!cs.key)throw new Error('未配置 ElevenLabs Key');
    if(!cs.voice)throw new Error('ElevenLabs 需在「音色」填 voice_id');
    let base=String(cs.ep||'').trim().replace(/\/+$/,'')||'https://api.elevenlabs.io';
    if(!/\/v\d+$/i.test(base))base+='/v1';
    const u=base+'/text-to-speech/'+encodeURIComponent(cs.voice)+'?output_format=mp3_44100_128';
    res=await fetch(u,{method:'POST',headers:{'xi-api-key':cs.key,'Content-Type':'application/json'},body:JSON.stringify(Object.assign({text:((_tone&&_tone.el&&_tone.el.tag&&/v3/i.test(String(cs.model||'')))?(_tone.el.tag+' '):'')+s,model_id:(cs.model||'eleven_multilingual_v2')},(_tone&&_tone.el&&!/v3/i.test(String(cs.model||'')))?{voice_settings:{stability:_tone.el.stab,similarity_boost:0.75,style:_tone.el.style,use_speaker_boost:true}}:{})),signal:signal});
  }else if(prov==='mm'){
    if(!cs.key)throw new Error('未配置 MiniMax Key');
    if(!cs.gid)throw new Error('MiniMax 需填 GroupId');
    let base=String(cs.ep||'').trim().replace(/\/+$/,'')||'https://api.minimax.chat';
    if(!/\/v\d+$/i.test(base))base+='/v1';
    const rr0=Math.max(0.5,Math.min(2,parseFloat(cs.rate)||1));
    res=await fetch(base+'/t2a_v2?GroupId='+encodeURIComponent(cs.gid),{method:'POST',headers:{'Authorization':'Bearer '+cs.key,'Content-Type':'application/json'},body:JSON.stringify({model:(cs.model||'speech-02-turbo'),text:s,stream:false,voice_setting:Object.assign({voice_id:(cs.voice||'female-shaonv'),speed:rr0},(_tone&&_tone.mm)?{emotion:_tone.mm}:{}),audio_setting:{format:'mp3',sample_rate:32000}}),signal:signal});
  }else if(prov==='az'){
    if(!cs.key)throw new Error('未配置 Azure 密钥');
    let base=String(cs.ep||'').trim().replace(/\/+$/,'');
    if(!base)throw new Error('Azure 需在 Endpoint 填区域端点（如 https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1）');
    if(!/\/cognitiveservices\/v1$/i.test(base))base+='/cognitiveservices/v1';
    const voA=cs.voice||'zh-CN-XiaoxiaoNeural';
    const lgA=(/^([a-z]{2,3}-[A-Za-z]{2,4})/.exec(voA)||[])[1]||'zh-CN';
    const rrA=Math.max(0.5,Math.min(2,parseFloat(cs.rate)||1));
    const escX=function(x){return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')};
    const ssml='<speak version="1.0" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="'+lgA+'"><voice name="'+escX(voA)+'">'+((_tone&&_tone.az)?('<mstts:express-as style="'+_tone.az+'">'):'')+'<prosody rate="'+Math.round((rrA-1)*100)+'%">'+escX(s)+'</prosody>'+((_tone&&_tone.az)?'</mstts:express-as>':'')+'</voice></speak>';
    res=await fetch(base,{method:'POST',headers:{'Ocp-Apim-Subscription-Key':cs.key,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'audio-24khz-48kbitrate-mono-mp3'},body:ssml,signal:signal});
  }else if(prov==='doubao'){
    const kd9=String(cs.key||'').trim();let ki9=kd9.indexOf(':');if(ki9<0)ki9=kd9.indexOf('|');
    if(!kd9||ki9<=0)throw new Error('豆包需在 Key 栏填「appid:access_token」（中间英文冒号）');
    const appid9=kd9.slice(0,ki9).trim(),tok9=kd9.slice(ki9+1).trim();
    if(!cs.voice)throw new Error('豆包需在「音色」填 voice_type');
    let baseD=String(cs.ep||'').trim().replace(/\/+$/,'')||'https://openspeech.bytedance.com';
    const urlD=/\/api\/v1\/tts$/i.test(baseD)?baseD:baseD+'/api/v1/tts';
    const rrD=Math.max(0.5,Math.min(2,parseFloat(cs.rate)||1));
    const bodyD={app:{appid:appid9,token:tok9,cluster:(cs.model||'volcano_tts')},user:{uid:'ib_user'},audio:{voice_type:cs.voice,encoding:'mp3',speed_ratio:rrD},request:{reqid:'ib'+Date.now()+'_'+Math.floor(Math.random()*1e6),text:s,operation:'query'}};
    const hdrD={'Authorization':'Bearer;'+tok9,'Content-Type':'application/json'};
    let jD=null;
    try{res=await fetch(urlD,{method:'POST',headers:hdrD,body:JSON.stringify(bodyD),signal:signal});if(!res.ok)throw new Error('HTTP '+res.status);jD=await res.json()}
    catch(eD9){const C9=window.Capacitor,H9=(C9&&C9.isNativePlatform&&C9.isNativePlatform())?(C9.Plugins&&C9.Plugins.CapacitorHttp):null;
      if(!H9||typeof H9.request!=='function')throw eD9;
      const n9=await H9.request({url:urlD,method:'POST',headers:hdrD,data:bodyD,connectTimeout:22000,readTimeout:22000});
      jD=(typeof n9.data==='string')?JSON.parse(n9.data):n9.data}
    if(!jD||jD.code!==3000||!jD.data)throw new Error('豆包 TTS：'+String((jD&&(jD.message||jD.code))||'返回异常').slice(0,60));
    const bs9=atob(String(jD.data)),u89=new Uint8Array(bs9.length);for(let i9=0;i9<bs9.length;i9++)u89[i9]=bs9.charCodeAt(i9);
    return u89.buffer;
  }else if(prov==='ali'){
    if(!cs.key)throw new Error('未配置阿里云 DashScope Key');
    let base=String(cs.ep||'').trim().replace(/\/+$/,'')||'https://dashscope.aliyuncs.com';
    const r1=await fetch(base+'/api/v1/services/aigc/multimodal-generation/generation',{method:'POST',headers:{'Authorization':'Bearer '+cs.key,'Content-Type':'application/json'},body:JSON.stringify({model:(cs.model||'qwen-tts'),input:{text:s,voice:(cs.voice||'Cherry')}}),signal:signal});
    const raw1=await r1.text();
    if(!r1.ok)throw new Error('HTTP '+r1.status+(raw1?' · '+raw1.slice(0,80):''));
    let j1=null;try{j1=JSON.parse(raw1)}catch(e){}
    const au=j1&&j1.output&&j1.output.audio&&(j1.output.audio.url||j1.output.audio.data);
    if(!au)throw new Error('阿里云未返回音频'+((j1&&j1.message)?('：'+String(j1.message).slice(0,60)):''));
    if(!/^https?:/i.test(au)){const bsA=atob(String(au).replace(/\s+/g,''));const u8A=new Uint8Array(bsA.length);for(let i4=0;i4<bsA.length;i4++)u8A[i4]=bsA.charCodeAt(i4);return u8A.buffer}
    res=await fetch(au,{signal:signal});
  }else{
    const u=ttsUrl(cs.ep);
    if(!u||!cs.key)throw new Error('未配置云端音色（Endpoint / Key）');
    const body={model:cs.model||'',input:s,response_format:'mp3'};
    if(cs.voice)body.voice=cs.voice;
    const rr=parseFloat(cs.rate);if(rr&&rr!==1)body.speed=Math.max(0.5,Math.min(2,rr));
    res=await fetch(u,{method:'POST',headers:{'Authorization':'Bearer '+cs.key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:signal});
  }
  if(!res.ok){let raw='';try{raw=await res.text()}catch(e){}throw new Error('HTTP '+res.status+(raw?' · '+raw.slice(0,80):''))}
  if(prov==='mm'){
    const raw=await res.text();
    let j=null;try{j=JSON.parse(raw)}catch(e){}
    const hx=j&&j.data&&j.data.audio;
    if(!hx)throw new Error('MiniMax 未返回音频'+((j&&j.base_resp&&j.base_resp.status_msg)?('：'+String(j.base_resp.status_msg).slice(0,60)):''));
    let ab=_ibcHexToBuf(hx);
    if(!ab||ab.byteLength<200){try{const bs=atob(String(hx).replace(/\s+/g,''));const u8=new Uint8Array(bs.length);for(let i2=0;i2<bs.length;i2++)u8[i2]=bs.charCodeAt(i2);ab=u8.buffer}catch(e){}}
    if(!ab||ab.byteLength<200)throw new Error('MiniMax 音频解码失败');
    return ab;
  }
  return await res.arrayBuffer();
}
async function speakCloud(s,cs){
  const g=speakGen;/* 代际号：打断/挂断后作废迟到的音频 */
  const ac=new AbortController();ttsAc=ac;const tm=setTimeout(function(){ac.abort()},22000);
  let ab;
  try{ab=await cloudFetchTTS(s,cs,ac.signal)}
  catch(err){clearTimeout(tm);if(ttsAc===ac)ttsAc=null;if(g!==speakGen||!isOpen)throw new Error('已打断');
    const ms=String((err&&err.message)||'');
    if(err&&err.name==='AbortError')throw new Error('超时');
    if(/未配置|需填|需在|未返回|^HTTP |MiniMax|Azure|阿里|解码/.test(ms))throw new Error(ms);/* 手机端：#5 */
    throw new Error('网络或跨域拦截（接口需允许 CORS）')}
  clearTimeout(tm);if(ttsAc===ac)ttsAc=null;
  if(g!==speakGen||!isOpen)throw new Error('已打断');
  if(!ab||ab.byteLength<200)throw new Error('返回音频为空');
  const buf=await new Promise(function(ok,bad){try{ctx.decodeAudioData(ab.slice(0),ok,bad)}catch(e){bad(e)}});
  if(g!==speakGen||!isOpen)throw new Error('已打断');
  try{if(cs&&cs.voiceKeep!=='off'){
    if(_vbCol&&_vbCol.fid!==(_voiceFid||''))_vbFlushV9();
    if(!_vbCol)_vbCol={fid:(_voiceFid||''),clips:[]};
    var b64V=_abB64V9(ab);
    if(b64V&&_vbCol.clips.length<200)_vbCol.clips.push({d:_vbMimeV9(ab)+b64V,s:Math.max(1,Math.round((buf&&buf.duration)||1)),x:String(s||'').slice(0,80)});
  }}catch(eV9){}
  await new Promise(function(resv){
    let done=false,sf=0;
    const fin=function(){if(done)return;done=true;clearTimeout(sf);curSrc=null;resv()};
    let src;
    try{src=ctx.createBufferSource();src.buffer=buf;src.connect(outGain)}catch(e){fin();return}
    try{if(outGain&&outGain.gain)outGain.gain.value=Math.max(0.1,Math.min(1,parseFloat(cs.vol)||1))}catch(e){}/* 手机端：#1 音量 */
    curSrc=src;
    let du=buf.duration;
    try{if(/^(el|ali)$/.test((cs&&cs.provider)||'oai')){const rrE=Math.max(0.5,Math.min(2,parseFloat(cs.rate)||1));if(rrE!==1){src.playbackRate.value=rrE;du=buf.duration/rrE}}}catch(e){}/* v138-c：①ElevenLabs 无服务端语速，本机变速 */
    sf=setTimeout(fin,du*1000+2500);
    src.onended=fin;
    try{src.start(0)}catch(e){fin()}
  });
}
function interrupt(why){
  if(!isOpen)return;
  try{_vbFlushV9()}catch(eV9){}
  speakGen++;try{if(ttsAc)ttsAc.abort()}catch(e){}
  dropStream=true;q.length=0;lastSaid='';
  try{if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}
  try{if(curSrc)curSrc.stop(0)}catch(e){}
  try{if(_sendKeys.has(myKey)){const c=_acMap[myKey];if(c)c.abort()}}catch(e){}
  turnBusy=false;hbGen++;hbLastUser=Date.now();/* v174：①打断＝你在动作，作废在途心跳 */
  setCap('','已打断');
  setState('listen',muted?'已关闭麦克风':'正在听…');
}
function toggleMute(){
  muted=!muted;
  vad.voiced=false;vad.voMs=0;vad.siMs=0;utterStart=-1;
  try{UI.mute.classList.toggle('on',muted);UI.mute.innerHTML=muted?MIC_OFF:MIC_ON}catch(e){}
  if(state==='listen'||state==='rec')setState('listen',muted?'已关闭麦克风':'正在听…');
}
function doTypeSend(){
  try{
    var v=String((UI.typeIn&&UI.typeIn.value)||'').trim();
    if(!v)return;
    UI.typeIn.value='';try{UI.type.hidden=true}catch(e){}
    if(speaking||q.length||state==='speak'||state==='think')interrupt('type');
    vad.voiced=false;vad.voMs=0;vad.siMs=0;utterStart=-1;
    setCap('你：'+v,'');
    sendOut(v);
  }catch(e){}
}
function _rowTs(el){try{var r=el.closest('.m');var m9=/^msg_(\d+)/.exec((r&&r.dataset&&r.dataset.id)||'');return m9?+m9[1]:0}catch(e){return 0}}
function confAct(title,idx,which){/* v138-c：④确认条＝替你按下聊天里那张卡的按钮；元素现查现按，卡片重绘不串位 */
  try{
    var cards=document.querySelectorAll('#cv-msgs .ws-op-card.pending');
    var hit=null,pool=[];
    for(var i=0;i<cards.length;i++){
      if(_rowTs(cards[i])<t0)continue;
      var bt=cards[i].querySelector('.ws-op-btns');if(!bt)continue;
      var bs=bt.querySelectorAll('button');if(bs.length<2)continue;
      var tt='';try{var b=cards[i].querySelector('.ws-op-text b');tt=String((b&&b.textContent)||(cards[i].querySelector('.ws-op-text')||{}).textContent||'')}catch(e){}
      var it={t:String(tt||'').slice(0,40),bs:bs};pool.push(it);
      if(!hit&&title&&it.t===title)hit=it;
    }
    if(!hit)hit=pool[Math.min(idx,pool.length-1)]||null;
    if(!hit)return;
    (which==='ok'?hit.bs[0]:hit.bs[1]).click();
  }catch(e){}
}
function confScan(){
  try{
    var box=UI.conf;if(!box)return;
    var rows=[];
    var cards=document.querySelectorAll('#cv-msgs .ws-op-card.pending');
    for(var i=0;i<cards.length;i++){
      if(_rowTs(cards[i])<t0)continue;
      var bt=cards[i].querySelector('.ws-op-btns');if(!bt)continue;
      var bs=bt.querySelectorAll('button');if(bs.length<2)continue;
      var tt='';try{var b=cards[i].querySelector('.ws-op-text b');tt=String((b&&b.textContent)||(cards[i].querySelector('.ws-op-text')||{}).textContent||'')}catch(e){}
      rows.push(String(tt||'待确认的调用').slice(0,40));
    }
    var payN=0;var pcs=document.querySelectorAll('#cv-msgs .pr-card');
    for(var k=0;k<pcs.length;k++){if(_rowTs(pcs[k])>=t0&&!/\b(paid|declined)\b/.test(pcs[k].className))payN++}
    if(!rows.length&&!payN){if(!box.hidden){box.hidden=true;box.innerHTML=''}_confSig='';return}
    var sig=rows.join('|')+'#'+payN;
    if(sig===_confSig&&!box.hidden)return;
    _confSig=sig;box.innerHTML='';
    rows.forEach(function(t,ix){
      var d=document.createElement('div');d.className='ibc-conf-row';
      var s1=document.createElement('span');s1.className='ibc-conf-t';s1.textContent=t;
      var b1=document.createElement('button');b1.type='button';b1.className='ibc-cb ok';b1.textContent='执行';
      b1.addEventListener('click',function(){confAct(t,ix,'ok')});
      var b2=document.createElement('button');b2.type='button';b2.className='ibc-cb';b2.textContent='跳过';
      b2.addEventListener('click',function(){confAct(t,ix,'no')});
      d.appendChild(s1);d.appendChild(b1);d.appendChild(b2);box.appendChild(d);
    });
    if(payN){var p=document.createElement('div');p.className='ibc-conf-row pay';p.textContent='TA 发起了 '+payN+' 笔 AI付——支付要你亲手在支付宝完成，请挂断后在聊天里处理';box.appendChild(p)}
    box.hidden=false;
  }catch(e){}
}
function _hbTick(){
  if(!isOpen||!_callS||_callS.hb!==true)return;
  if(cfg&&cfg._group)return;
  if(hbBusy||hbCount>=10)return;
  if(state!=='listen'||speaking||q.length||turnBusy)return;
  if(_sendKeys.has(myKey))return;
  var sec=Math.max(20,Math.min(600,parseInt(_callS.hbSec)||45));
  var from=Math.max(hbLastUser||0,hbLastAi||0,t0||0);
  if(hbJitKey!==from||hbJit<0){hbJitKey=from;hbJit=Math.random()*sec*0.9;if(Math.random()<0.12)hbJit+=sec*0.6}
  if(Date.now()-from<(sec+hbJit)*1000)return;
  _hbFire();
}
async function _hbFire(){
  hbBusy=true;var g=++hbGen,c=cfg,th=threadId;
  try{
    if(!c||!c.apiKey)return;
    var about=null;try{about=await loadAbout()}catch(e){}
    var meN=(about&&about.name)||'用户';
    var ctx='当前时间：'+new Date().toLocaleString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long',hour:'2-digit',minute:'2-digit'})+'。\n';
    if(c.relationship)ctx+='你和对方的关系是：'+c.relationship+'。\n';
    var seal=th?Number((_activeThread&&_activeThread.id===th&&_activeThread.sealTimestamp)||0):Number(c.sealTimestamp||0),hist=[];/* v174：⑧频道用频道封档线 */
    try{hist=(await dbGetByIndex('chatMessages','byFriend',c.id)).filter(function(m){return String(m.threadId||'')===String(th||'')&&(m.timestamp||0)>seal&&!m.callFold}).sort(function(a,b){return (a.timestamp||0)-(b.timestamp||0)}).slice(-10)}catch(e){}
    if(hist.length){ctx+='\n【最近的对话（含这次通话里已经说过的话）】\n';hist.forEach(function(m){ctx+=(m.gift?_giftLineM(m):((m.role==='user'?meN:cfgName(c))+'：'+String(m.content||(m.voice?'[语音消息]':'')).replace(/^\[(?:语音|视频)通话\] /,'').slice(0,160)))+'\n'})}
    var quiet=Math.max(0,Math.round((Date.now()-Math.max(hbLastUser||0,hbLastAi||0,t0||0))/1000));
    var hbStyles=['接着刚才的话题往下说一点，或者补一句你刚想到的','随口说说你此刻在想什么、在做什么，不必提问','轻轻问一句对方在干什么、是不是走神了','说点无关紧要的闲话，像电话那头的人自言自语','对TA主动说一句话吧——一声哼、一句嘟囔、叫一声 TA 的名字、一句温柔的话语，询问TA还在不在'];
    var hbStyle=hbStyles[Math.floor(Math.random()*hbStyles.length)];
    ctx+='\n你们正在语音通话中，电话没有挂断，但已经安静了大约 '+quiet+' 秒——对方一直没有说话'+(hbCount?'；在这之前你已经主动开口 '+hbCount+' 次，对方都没有回应，别再重复同样的问法，语气可以更随意、更短，也可以只是陪着不催':'')+'。\n请像真的在打电话一样自然地主动说一句（这次的方向：'+hbStyle+'）：口语、简短，一两句以内，不要客套、不要总结、不要一上来就问"在吗"；不要用列表、标题、表格、括号动作描写，不要输出任何标签或说明，直接输出你要说的话。';
    if(langMode&&typeof _callLangClause==='function')ctx+=_callLangClause(langMode);
    var ac=new AbortController();var pa=(typeof mpAi==='function')?mpAi(c):undefined;
    var r=await callAI(Object.assign({},c,{thinkingEnabled:false,streaming:false}),[{role:'user',content:ctx}],(c.systemPrompt||'').trim(),function(){},ac.signal,pa);
    var t=String((r&&r.t)||'').replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi,'').trim();
    if(!t)return;
    if(g!==hbGen||!isOpen||state!=='listen'||speaking||q.length||turnBusy||_sendKeys.has(myKey))return;/* 撞车即弃：生成期间你开口 / 打字 / 挂断了 */
    if(!_activeCfg||_activeCfg.id!==c.id||((_activeThread?_activeThread.id:'')!==(th||'')))return;
    var am={id:'msg_'+Date.now()+'_chb',role:'assistant',content:t.slice(0,600),friendId:c.id,senderName:cfgName(c),timestamp:Date.now(),proactive:true,callHb:true};
    if(th)am.threadId=th;
    await dbPut('chatMessages',am);
    try{_msgs.push(am);var bx=convEl('cv-msgs');if(bx){var em=bx.querySelector('.empty');if(em)em.remove();bx.appendChild(buildMsgEl(am,_msgs[_msgs.length-2]||null));pinBottom()}}catch(e){}
    hbCount++;lastTurnT=Date.now();
    if(langMode){rawCur=0;feedLang(t,true);rawCur=0}
    else{var sn=_ibcSpeechSan(t),rr=_ibcSplit(sn,0,true);for(var i=0;i<rr.sents.length;i++)enq(rr.sents[i])}
    try{_friendsBump()}catch(e){}
  }catch(e){}finally{hbBusy=false}
}
function startTimer(){
  stopTimer();
  timerIv=setInterval(function(){
    if(!isOpen)return;
    const sec=Math.max(0,Math.round((Date.now()-t0)/1000));
    try{UI.timer.textContent=fmtDur(sec)}catch(e){}
    try{if(_min9){if(_pillT)_pillT.textContent=fmtDur(sec);if(_pill)_pill.dataset.st=state;if(_vw&&!_vw.hidden&&_vwT)_vwT.textContent=fmtDur(sec)}}catch(e){}try{refreshColors()}catch(e){}/* 手机端：#4 胶囊随动；#3 通话中切主题波形跟色 */
    try{confScan()}catch(e){}/* v138-c：④确认条随心跳刷新 */
    try{_hbTick()}catch(e){}/* v174：①通话心跳 */
    /* 看门狗：请求失败等异常路径若没走到回合结束钩子，别卡死在「在想」 */
    try{if(turnBusy&&!speaking&&!q.length&&state==='think'&&!_sendKeys.has(myKey)&&Date.now()-lastTurnT>3000){turnBusy=false;setState('listen',muted?'已关闭麦克风':'正在听…')}}catch(e){}
  },500);
}
function stopTimer(){if(timerIv){clearInterval(timerIv);timerIv=0}}

let fakeT=0,waveLvl=0,wavePh=0,_wvB9=null;
function _wvBuf9(n){if(!_wvB9||_wvB9.length!==n)_wvB9=new Uint8Array(n);return _wvB9}/* 手机端 #2d：每帧 new Uint8Array→复用缓冲，掐掉 60fps 的分配/GC 底噪 */
function _ibcLvl(data){/* 波形样本 → 0–1 峰值电平 */
  if(!data)return 0;
  let mx=0;for(let i=0;i<data.length;i+=2){const v=Math.abs(data[i]-128);if(v>mx)mx=v}
  return Math.min(1,mx/96);
}
function fakeLvl(a){fakeT+=0.05;return a*(0.62+0.38*Math.sin(fakeT*2.3)*Math.sin(fakeT*0.7+1.4))}
function loop(){
  if(!isOpen){raf=0;return}
  raf=requestAnimationFrame(loop);
  if(_min9)return;/* 手机端：#4 悬浮态不画 */
  const cv=UI.wave;if(!cv||!cv.width)return;
  const g=cv.getContext('2d');if(!g)return;
  const W=cv.width,H=cv.height,mid=H/2;
  
  let target=0;
  if(state==='speak'){
    if(curSrc&&anaOut){const d2=_wvBuf9(anaOut.fftSize);anaOut.getByteTimeDomainData(d2);target=_ibcLvl(d2)}
    else target=Math.max(0.2,fakeLvl(0.85));
  }else if(state==='think')target=Math.max(0.05,fakeLvl(0.13));
  else if(muted)target=0.04;
  else if(anaMic){const d3=_wvBuf9(anaMic.fftSize);anaMic.getByteTimeDomainData(d3);target=_ibcLvl(d3)}
  else target=0.06;
  waveLvl+=(target-waveLvl)*(target>waveLvl?0.5:0.08);
  wavePh+=0.055+waveLvl*0.11;
  try{_ibcDrawAvWave(state==='speak'?target:(state==='think'?0.14:0.07))}catch(e){}/* v174：③头像后声波只随 TA 说话的电平走 */
  
  g.clearRect(0,0,W,H);
  const N=56,gap=W/N,bw=Math.max(2,gap*0.42),r=Math.min(bw/2,H*0.08);
  const base=Math.max(1.5,H*0.05),amp=H*0.44*(0.1+0.9*waveLvl);
  g.fillStyle=_ibcBarFill(g,W,H);/* 手机端：明亮模式改白＋浅蓝（中央偏白、两端浅蓝），暗色照旧主题强调色 */
  for(let i2=0;i2<N;i2++){
    const t=i2/(N-1),cx2=t*2-1;
    const env=0.2+0.8*Math.exp(-cx2*cx2*3.1);
    const n1=Math.sin(wavePh*1.35+i2*0.52),n2=Math.sin(wavePh*0.62+i2*0.23+1.7),n3=Math.sin(wavePh*2.3+i2*0.91+4.1);
    const h=Math.max(base,base+amp*env*Math.abs(0.55*n1+0.3*n2+0.15*n3));
    const x=gap*i2+(gap-bw)/2,y=mid-h;
    if(env>0.86&&waveLvl>0.08){const gw=bw*2.1,gx=x-(gw-bw)/2;g.globalAlpha=0.09+0.2*waveLvl;
      if(g.roundRect){g.beginPath();g.roundRect(gx,y,gw,h*2,gw/2);g.fill()}else g.fillRect(gx,y,gw,h*2)}
    g.globalAlpha=(0.24+(_ibcLight()?0.14:0))+0.66*env*(0.35+0.65*waveLvl);
    if(g.roundRect){g.beginPath();g.roundRect(x,y,bw,h*2,r);g.fill()}
    else g.fillRect(x,y,bw,h*2);
  }
  g.globalAlpha=1;
}

var _avwGrd=null,_avwGrdKey='',_avwGlow=null,_barGrd=null,_barGrdKey='';
function _ibcLight(){try{return !document.body.classList.contains('theme-infernal')}catch(e){return true}}
function _ibcBarFill(g,W,H){if(!_ibcLight())return accCol;var key=W+'|'+H;if(_barGrdKey!==key||!_barGrd){_barGrd=g.createLinearGradient(0,0,W,0);_barGrd.addColorStop(0,'#9dbbe2');_barGrd.addColorStop(0.5,'#f7faff');_barGrd.addColorStop(1,'#9dbbe2');_barGrdKey=key}return _barGrd}
function _ibcRgb(c,fb){try{var m=String(c||'').trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(m){var h=m[1];if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];return parseInt(h.slice(0,2),16)+','+parseInt(h.slice(2,4),16)+','+parseInt(h.slice(4,6),16)}var r=String(c||'').match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);if(r)return r[1]+','+r[2]+','+r[3]}catch(e){}return fb}
function _ibcDrawAvWave(lvlT){
  var cv=UI.avw;if(!cv||!cv.width)return;
  var g=cv.getContext('2d');if(!g)return;
  avLvl+=(lvlT-avLvl)*(lvlT>avLvl?0.32:0.06);
  var rm=false;try{rm=document.body.classList.contains('ib-reduce')||(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)}catch(e){}
  if(!rm)avPh+=0.014+avLvl*0.075;
  var W=cv.width,H=cv.height,mid=H/2,dark=false;
  try{dark=document.body.classList.contains('theme-infernal')}catch(e){}
  var col=dark?_ibcRgb(accCol,'150,190,232'):'255,255,255',colG=dark?col:'255,255,255',key=W+'|'+col+'|'+colG;
  if(_avwGrdKey!==key||!_avwGrd){_avwGrd=g.createLinearGradient(0,0,W,0);_avwGrd.addColorStop(0,'rgba('+col+',0)');_avwGrd.addColorStop(0.14,'rgba('+col+',1)');_avwGrd.addColorStop(0.86,'rgba('+col+',1)');_avwGrd.addColorStop(1,'rgba('+col+',0)');_avwGlow=g.createLinearGradient(0,0,W,0);_avwGlow.addColorStop(0,'rgba('+colG+',0)');_avwGlow.addColorStop(0.14,'rgba('+colG+',1)');_avwGlow.addColorStop(0.86,'rgba('+colG+',1)');_avwGlow.addColorStop(1,'rgba('+colG+',0)');_avwGrdKey=key}
  g.clearRect(0,0,W,H);
  var A=H*0.36*(0.12+0.88*avLvl),N=84,dpr=W/Math.max(1,cv.clientWidth||W);
  var L=[{f:1.55,k:1,p:0,sp:1},{f:1.15,k:0.78,p:2.1,sp:-0.8},{f:1.95,k:0.62,p:4.2,sp:1.35}];
  g.lineCap='round';g.lineJoin='round';g.strokeStyle=_avwGrd;
  for(var li=0;li<L.length;li++){var ln=L[li];
    g.beginPath();
    for(var j=0;j<=N;j++){var t=j/N,x=t*W,env=Math.pow(Math.sin(Math.PI*t),1.15);
      var y=mid+A*ln.k*env*Math.sin(2*Math.PI*ln.f*t+ln.p+avPh*ln.sp);
      if(j)g.lineTo(x,y);else g.moveTo(x,y)}
    g.strokeStyle=_avwGlow||_avwGrd;g.lineWidth=(dark?5.5:6.5)*dpr;g.globalAlpha=dark?(0.05+0.1*avLvl):(0.14+0.2*avLvl);g.stroke();
    g.strokeStyle=_avwGrd;g.lineWidth=(li?1.3:1.6)*dpr;g.globalAlpha=dark?((li?0.3:0.42)+0.3*avLvl):((li?0.62:0.82)+0.18*avLvl);g.stroke();/* 手机端：明亮模式白线需更实、浅蓝柔光略宽略亮才看得出 */
  }
  g.globalAlpha=1;
}
function cleanupAudio(){
  try{if(proc){proc.onaudioprocess=null;proc.disconnect()}}catch(e){}
  try{if(srcNode)srcNode.disconnect()}catch(e){}
  try{if(muteGain)muteGain.disconnect()}catch(e){}
  try{if(anaMic)anaMic.disconnect()}catch(e){}
  try{if(outGain)outGain.disconnect()}catch(e){}
  try{if(anaOut)anaOut.disconnect()}catch(e){}
  try{if(stream)stream.getTracks().forEach(function(t){t.stop()})}catch(e){}
  stream=null;proc=null;srcNode=null;muteGain=null;anaMic=null;anaOut=null;outGain=null;curSrc=null;
}

function _dmReset(){try{var _dw=UI.dmw||UI.dm;if(_dw)_dw.innerHTML='';_dmLast=null;_dmHold=false}catch(e){}}
function _dmPush(who,text){
  try{
    var _dw=UI.dmw||UI.dm;if(!_dw||!text)return;
    if(_dmLast&&_dmLast.who===who&&_dmLast.text===text)return;_dmLast={who:who,text:String(text)};
    var d=document.createElement('div');d.className='ibc-dmi'+(who==='me'?' me':'');
    var t=String(text),i=t.indexOf(':');
    if(i>0&&i<14){var b=document.createElement('b');b.className='ibc-dmn';b.textContent=t.slice(0,i);d.appendChild(b);d.appendChild(document.createTextNode(t.slice(i+1)))}
    else d.appendChild(document.createTextNode(t));
    _dw.appendChild(d);if(!_dmHold)try{_dw.scrollTop=_dw.scrollHeight}catch(e){}
    while(_dw.children.length>60)_dw.removeChild(_dw.firstChild);/* 手机端：可回看，上限 60 条 */
  }catch(e){}
}
function _vidFrame(edge,q){/* 手机端：抓当前帧（大窗或小窗谁活着用谁；前置纠镜像） */
  try{
    var v=(UI.cam&&UI.cam.videoWidth)?UI.cam:((_vwV&&_vwV.videoWidth)?_vwV:null);
    if(!v)return '';
    var sc=Math.min(1,(edge||512)/Math.max(v.videoWidth,v.videoHeight));
    var cv=document.createElement('canvas');cv.width=Math.max(2,Math.round(v.videoWidth*sc));cv.height=Math.max(2,Math.round(v.videoHeight*sc));
    var g=cv.getContext('2d');
    if(v.classList.contains('mir')){g.translate(cv.width,0);g.scale(-1,1)}
    g.drawImage(v,0,0,cv.width,cv.height);
    return cv.toDataURL('image/jpeg',q||0.72);
  }catch(e){return ''}
}
function _vidQPick(cs){var v=_vidQNormM(cs&&cs.vidQ);return v==='l'?{e:384,q:0.6}:(v==='h'?{e:768,q:0.8}:{e:512,q:0.72})}/* 手机端：画质三档 */
function _dooSpawn(kind,x,y){/* 手机端：贴一枚装饰，5.8s 自散 */
  try{
    if(!UI.doo)return;
    var MAP={heart:'❤️',star:'⭐',sparkle:'✨',flower:'🌸',note:'🎵'};
    var sp=document.createElement('span');sp.textContent=MAP[String(kind||'').toLowerCase()]||'✨';
    x=parseFloat(x);y=parseFloat(y);
    if(!(x>=0&&x<=1))x=0.5;if(!(y>=0&&y<=1))y=0.35;
    sp.style.left=(Math.max(0.04,Math.min(0.96,x))*100)+'%';sp.style.top=(Math.max(0.06,Math.min(0.94,y))*100)+'%';
    UI.doo.appendChild(sp);
    while(UI.doo.children.length>12)UI.doo.removeChild(UI.doo.firstChild);
    setTimeout(function(){try{sp.remove()}catch(e){}},5800);
  }catch(e){}
}
var _fxQ=[],_fxP=[],_fxS=[],_fxRun=false,_fxNext=0,_fxLast=0,_fxEl=null;
var _FXGAP={fireworks:1300,meteor:2600,galaxy:8600};/* 同种类相邻两场的起始间隔 ms */
function _fxMount(){
  try{
    if(!_fxEl){_fxEl=document.createElement('canvas');_fxEl.className='ibc-fx';_fxEl.setAttribute('aria-hidden','true')}
    var want=_min9?document.body:UI.root;if(!want)return null;
    if(_fxEl.parentNode!==want){if(_min9)want.appendChild(_fxEl);else{var ref=UI.doo;if(ref&&ref.parentNode===want)want.insertBefore(_fxEl,ref.nextSibling);else want.appendChild(_fxEl)}}
    var dpr=Math.min(2,window.devicePixelRatio||1),w=window.innerWidth,h=window.innerHeight;
    if(_fxEl.width!==Math.round(w*dpr)||_fxEl.height!==Math.round(h*dpr)){_fxEl.width=Math.round(w*dpr);_fxEl.height=Math.round(h*dpr)}
    _fxEl._dpr=dpr;return _fxEl;
  }catch(e){return null}
}
function _fxChatVisible(){/* 小窗态只在对话界面可见时放：#conv 打开且屏幕中部命中的元素属于它（锁屏 / 其它页盖上去即停） */
  try{
    var cv=document.getElementById('conv');if(!cv||!cv.classList.contains('open')||!document.body.classList.contains('on-conv'))return false;
    var r=cv.getBoundingClientRect();if(!(r.width>0&&r.height>0))return false;
    var el=document.elementFromPoint(Math.round(window.innerWidth/2),Math.round(window.innerHeight*0.6));
    if(!el)return true;return !!(el.closest&&el.closest('#conv'));
  }catch(e){return true}
}
function _fxCanPlay(){try{if(!isOpen||!vidOn)return false;if(document.visibilityState==='hidden')return false;return _min9?_fxChatVisible():true}catch(e){return false}}
function _fxReset(){try{_fxQ.length=0;_fxP.length=0;_fxS.length=0;_fxRun=false;_fxGlow(false);if(_fxEl){var g=_fxEl.getContext('2d');if(g)g.clearRect(0,0,_fxEl.width,_fxEl.height);_fxEl.classList.remove('on')}}catch(e){}}
function _fxQueue(kind,n){
  try{
    if(!_fxCanPlay())return;
    if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    n=Math.max(1,Math.min(10,parseInt(n,10)||1));
    for(var i=0;i<n;i++)_fxQ.push(kind);
    if(!_fxRun){if(!_fxMount())return;_fxRun=true;_fxNext=0;_fxLast=0;_fxEl.classList.add('on');requestAnimationFrame(_fxFrame)}
  }catch(e){}
}
function _fxDim(){var c=_fxEl,dpr=c._dpr||1,H=c.height/dpr;return {W:c.width/dpr,H:H,sc:Math.max(0.7,Math.min(1.3,H/800))}}
function _fxLaunch(kind){/* 开一场 */
  var D=_fxDim();
  if(kind==='meteor'){_fxS.push({k:'meteor',t:0,dur:5200,next:0,big:600,D:D,stars:_fxStars(D,34,0.72),fl:0});_fxGlow(true)}
  else if(kind==='galaxy'){_fxS.push({k:'galaxy',t:0,dur:8200,D:D,stars:_fxStars(D,120,0.6),emit:0,met:0,img:_fxGalaxyBuild(D)})}/* v165-p：上半屏银河 8.2s */
  else{var tx=D.W*(0.2+Math.random()*0.6),ty=D.H*(0.14+Math.random()*0.3);_fxS.push({k:'rocket',t:0,dur:680+Math.random()*180,x:tx+(Math.random()-0.5)*D.W*0.1,y:D.H*0.98,tx:tx,ty:ty,tail:[],D:D})}
}
function _fxStars(D,n,hf){var a=[];for(var i=0;i<n;i++)a.push({x:Math.random()*D.W,y:Math.random()*D.H*hf,r:0.6+Math.random()*1.3,ph:Math.random()*6.28,sp:1.5+Math.random()*2.5});return a}
function _fxGlow(on){try{if(UI.root)UI.root.classList.toggle('fx-glow',!!on);if(_vw)_vw.classList.toggle('fx-glow',!!on)}catch(e){}}
function _fxBurst(s){/* 烟火炸开（手机端 加码）：110 粒、三套配色轮换（含紫白）、三成粒子半途二次炸裂、冲击环＋大光晕 */
  var D=s.D,PALS=[['#ffd98a','#ffbf7d','#ff9a86','#ffe9b8','#bfdcff'],['#c9a0ff','#e2b8ff','#ffffff','#9fd0ff','#ffd98a'],['#bfe6ff','#ffd6a0','#ffffff','#ffb0a0','#9fd0ff']],PAL=PALS[Math.floor(Math.random()*PALS.length)];
  var n=110,base=Math.random()*6.283;
  for(var i=0;i<n;i++){var a=base+i/n*6.283+(Math.random()-0.5)*0.16,sp=(2.8+Math.random()*3.4)*D.sc;
    _fxP.push({x:s.tx,y:s.ty,px:s.tx,py:s.ty,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,dec:0.3+Math.random()*0.28,c:PAL[i%PAL.length],r:1.6+Math.random()*1.3,tw:Math.random()*6.28,g:0.026,dr:0.981,st:1,cr:(i%10<3)?1:0})}
  _fxP.push({x:s.tx,y:s.ty,vx:0,vy:0,life:1,dec:2.2,c:'#fff6dc',r:88*D.sc,glow:1});
  _fxP.push({x:s.tx,y:s.ty,vx:0,vy:0,life:1,dec:1.9,r:6*D.sc,ring:1,c:PAL[0]});
}
function _fxCrackle(p){/* 二次炸裂：5 粒小白火 */for(var i=0;i<5;i++){var a=Math.random()*6.283,sp=0.9+Math.random()*1.4;_fxP.push({x:p.x,y:p.y,px:p.x,py:p.y,vx:p.vx*0.4+Math.cos(a)*sp,vy:p.vy*0.4+Math.sin(a)*sp,life:1,dec:1.4+Math.random()*0.8,c:['#ffffff','#fff3c9','#ffe1ff'][i%3],r:0.9+Math.random()*0.8,tw:Math.random()*6.28,g:0.02,dr:0.97})}}
function _fxMeteorStep(s,dt){/* 流星雨（手机端 加码）：小流星密集、大流星带光晕头＋火星尾并触发闪光；发射窗口到 dur-1100ms */
  s.fl=Math.max(0,s.fl-dt/300);
  if(s.t>=s.dur-1100)return;
  var D=s.D;s.next-=dt;s.big-=dt;
  var spawn=function(big){var fromTop=Math.random()<0.7,x=fromTop?D.W*(0.3+Math.random()*0.75):D.W*1.04,y=fromTop?-12-Math.random()*D.H*0.08:D.H*(-0.05+Math.random()*0.4);
    var sp=(big?(6+Math.random()*3):(9+Math.random()*6))*D.sc,ang=2.28+(Math.random()-0.5)*0.22;
    _fxP.push({x:x,y:y,px:x,py:y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:1,dec:big?(0.55+Math.random()*0.25):(1+Math.random()*0.5),c:big?'#ffffff':['#ffffff','#dfe9ff','#cfd9ff','#ffe9c9'][Math.floor(Math.random()*4)],r:big?(2.6+Math.random()*0.8):(1+Math.random()*0.8),tw:Math.random()*6.28,g:0.006,dr:0.998,line:big?(18+Math.random()*8):(6+Math.random()*4),big:big?1:0})};
  if(s.next<=0){s.next=90+Math.random()*110;spawn(false)}
  if(s.big<=0){s.big=620+Math.random()*420;spawn(true);s.fl=1}
}
function _fxMeteorDraw(g,s){/* 光幕＋星幕：进场 600ms 渐显、末尾 900ms 渐隐；大流星出现时闪一下 */
  var D=s.D,T=s.t,A=Math.min(1,T/600)*Math.min(1,Math.max(0,(s.dur-T)/900));
  var lg=g.createLinearGradient(0,0,0,D.H);lg.addColorStop(0,'rgba(124,142,255,'+((0.22+0.1*s.fl)*A).toFixed(3)+')');lg.addColorStop(0.55,'rgba(96,110,220,'+((0.12+0.05*s.fl)*A).toFixed(3)+')');lg.addColorStop(1,'rgba(60,70,160,0)');
  g.globalAlpha=1;g.fillStyle=lg;g.fillRect(0,0,D.W,D.H);
  for(var i=0;i<s.stars.length;i++){var st=s.stars[i];g.globalAlpha=A*(0.25+0.75*Math.abs(Math.sin(st.ph+T/1000*st.sp)));g.fillStyle='#eef4ff';g.beginPath();g.arc(st.x,st.y,st.r,0,6.283);g.fill()}
  g.globalAlpha=1;
}
function _fxRailPt(D,u){return {x:-D.W*0.08+u*D.W*1.16,y:D.H*0.42-u*D.H*0.24+Math.sin(u*Math.PI*1.3)*D.H*0.05}}
function _fxGalaxyBuild(D){
  try{var c=document.createElement('canvas'),dpr=Math.min(1.5,(_fxEl&&_fxEl._dpr)||1),W=D.W,H=D.H*0.62;c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);var g=c.getContext('2d');if(!g)return null;g.setTransform(dpr,0,0,dpr,0,0);
    var blobs=[['186,204,255',0.16],['210,196,255',0.13],['255,236,200',0.11],['160,190,255',0.14],['236,222,255',0.1]];
    for(var i=0;i<34;i++){var u=i/33,p=_fxRailPt(D,u),r=D.H*0.07+Math.random()*D.H*0.075,b=blobs[i%blobs.length],gr=g.createRadialGradient(p.x,p.y,0,p.x,p.y,r);gr.addColorStop(0,'rgba('+b[0]+','+b[1]+')');gr.addColorStop(0.55,'rgba('+b[0]+','+(b[1]*0.35).toFixed(3)+')');gr.addColorStop(1,'rgba('+b[0]+',0)');g.fillStyle=gr;g.beginPath();g.arc(p.x,p.y+(Math.random()-0.5)*D.H*0.05,r,0,6.283);g.fill()}
    for(var j=0;j<40;j++){var u2=j/39,p2=_fxRailPt(D,u2),r2=D.H*0.022+Math.random()*D.H*0.02,g2=g.createRadialGradient(p2.x,p2.y,0,p2.x,p2.y,r2);g2.addColorStop(0,'rgba(255,248,232,0.24)');g2.addColorStop(1,'rgba(255,248,232,0)');g.fillStyle=g2;g.beginPath();g.arc(p2.x,p2.y,r2,0,6.283);g.fill()}
    var CS=['#ffffff','#dfe9ff','#fff1d6','#cfd8ff'];
    for(var k=0;k<900;k++){var u3=Math.random(),p3=_fxRailPt(D,u3),sp=(Math.random()-0.5)*D.H*0.24*Math.sqrt(Math.random());g.globalAlpha=0.25+Math.random()*0.5;g.fillStyle=CS[k%4];g.beginPath();g.arc(p3.x+(Math.random()-0.5)*W*0.02,p3.y+sp,0.35+Math.random()*0.7,0,6.283);g.fill()}
    g.globalAlpha=1;return c;
  }catch(e){return null}
}
function _fxGalaxyDraw(g,s,dt){
  var D=s.D,T=s.t,A=Math.min(1,T/1000)*Math.min(1,Math.max(0,(s.dur-T)/1400)),H2=D.H*0.62;
  var lg=g.createLinearGradient(0,0,0,H2);lg.addColorStop(0,'rgba(8,12,40,'+(0.36*A).toFixed(3)+')');lg.addColorStop(0.75,'rgba(8,12,40,'+(0.16*A).toFixed(3)+')');lg.addColorStop(1,'rgba(8,12,40,0)');g.globalAlpha=1;g.fillStyle=lg;g.fillRect(0,0,D.W,H2);
  if(s.img){var dx=Math.sin(T/6000)*D.W*0.015,dy=Math.cos(T/7000)*D.H*0.008;g.globalAlpha=A*0.96;try{g.drawImage(s.img,dx,dy,D.W,H2)}catch(e){}}
  for(var i=0;i<s.stars.length;i++){var st=s.stars[i],tw=0.3+0.7*Math.abs(Math.sin(st.ph+T/1000*st.sp));g.globalAlpha=A*tw;g.fillStyle='#f4f7ff';g.beginPath();g.arc(st.x,st.y,st.r,0,6.283);g.fill();
    if(st.r>1.35){var L=st.r*4*tw;g.globalAlpha=A*tw*0.7;g.strokeStyle='#f4f7ff';g.lineWidth=0.6;g.beginPath();g.moveTo(st.x-L,st.y);g.lineTo(st.x+L,st.y);g.moveTo(st.x,st.y-L);g.lineTo(st.x,st.y+L);g.stroke()}}
  var u=Math.max(0,Math.min(1,(T-900)/5600));u=u<0.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
  if(T>=900&&u<1){
    var hp=_fxRailPt(D,u),gr=g.createRadialGradient(hp.x,hp.y,0,hp.x,hp.y,40*D.sc);gr.addColorStop(0,'rgba(255,236,190,'+(0.42*A).toFixed(3)+')');gr.addColorStop(1,'rgba(255,236,190,0)');g.globalAlpha=1;g.fillStyle=gr;g.beginPath();g.arc(hp.x,hp.y,40*D.sc,0,6.283);g.fill();
    for(var c=0;c<7;c++){var uu=u-c*0.024;if(uu<0)break;var p1=_fxRailPt(D,uu),p2=_fxRailPt(D,Math.max(0,uu-0.012)),ang=Math.atan2(p2.y-p1.y,p2.x-p1.x);g.save();g.translate(p1.x,p1.y);g.rotate(ang);g.globalAlpha=A*(c===0?1:0.85);g.fillStyle=c===0?'#fff6e2':'#ffd98a';var Lc=D.sc*(c===0?16:13),Hh=D.sc*(c===0?7:6);g.fillRect(-Lc/2,-Hh/2,Lc,Hh);g.globalAlpha=A*0.95;g.fillStyle='#fff9ea';g.fillRect(-Lc/2+2,-Hh/2+1.5,Lc/2-3,Hh-3);g.fillRect(2,-Hh/2+1.5,Lc/2-3,Hh-3);g.restore()}
    s.emit-=dt;if(s.emit<=0){s.emit=80;var tp=_fxRailPt(D,Math.max(0,u-0.17));_fxP.push({x:tp.x,y:tp.y,px:tp.x,py:tp.y,vx:(Math.random()-0.5)*0.5,vy:-0.25-Math.random()*0.45,life:1,dec:0.8+Math.random()*0.5,c:['#ffe9b8','#ffd98a','#ffffff'][Math.floor(Math.random()*3)],r:0.8+Math.random()*1,tw:Math.random()*6.28,g:-0.003,dr:0.99})}
  }
  if(!s.met&&T>=3400){s.met=1;var sx=D.W*(0.55+Math.random()*0.4),sy=-8,ang2=2.35,spd=8*D.sc;_fxP.push({x:sx,y:sy,px:sx,py:sy,vx:Math.cos(ang2)*spd,vy:Math.sin(ang2)*spd,life:1,dec:0.75,c:'#ffffff',r:2.2,tw:0,g:0.004,dr:0.998,line:20,big:1})}
  g.globalAlpha=1;
}
function _fxFrame(ts){
  try{
    if(!_fxRun)return;
    if(!_fxCanPlay()){_fxReset();return}
    var c=_fxMount();if(!c){_fxReset();return}var g=c.getContext('2d'),dpr=c._dpr||1;if(!g){_fxReset();return}
    var dt=_fxLast?Math.min(48,ts-_fxLast):16;_fxLast=ts;var f=dt/16.7;
    if(_fxQ.length&&ts>=_fxNext){var kq=_fxQ.shift();_fxLaunch(kq);_fxNext=ts+(_FXGAP[kq]||1000)+Math.random()*200}
    g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,c.width/dpr,c.height/dpr);
    var hasMeteor=false;
    for(var i=_fxS.length-1;i>=0;i--){var s=_fxS[i];s.t+=dt;
      if(s.k==='rocket'){var k=Math.min(1,s.t/s.dur),e9=1-Math.pow(1-k,3),x=s.x+(s.tx-s.x)*e9,y=s.y+(s.ty-s.y)*e9;
        s.tail.unshift({x:x,y:y});if(s.tail.length>10)s.tail.pop();
        for(var j=0;j<s.tail.length;j++){var p9=s.tail[j];g.globalAlpha=(1-j/s.tail.length)*0.6;g.fillStyle='#ffe4a8';g.beginPath();g.arc(p9.x,p9.y,Math.max(0.4,1.8-j*0.12),0,6.283);g.fill()}
        g.globalAlpha=1;g.fillStyle='#fff8e4';g.beginPath();g.arc(x,y,2.3,0,6.283);g.fill();
        if(Math.random()<0.6)_fxP.push({x:x,y:y,px:x,py:y,vx:(Math.random()-0.5)*0.9,vy:0.4+Math.random()*0.8,life:1,dec:2.2+Math.random(),c:'#ffd98a',r:0.8+Math.random()*0.7,tw:0,g:0.03,dr:0.98});/* 手机端：升空撒火花 */
        if(k>=1){_fxS.splice(i,1);_fxBurst(s)}}
      else if(s.k==='meteor'){hasMeteor=true;_fxMeteorDraw(g,s);_fxMeteorStep(s,dt);if(s.t>=s.dur)_fxS.splice(i,1)}
      else if(s.k==='galaxy'){_fxGalaxyDraw(g,s,dt);if(s.t>=s.dur)_fxS.splice(i,1)}
    }
    if(!hasMeteor&&UI.root&&UI.root.classList.contains('fx-glow'))_fxGlow(false);
    for(var i2=_fxP.length-1;i2>=0;i2--){var p=_fxP[i2];
      if(p.glow){p.life-=p.dec*dt/1000;if(p.life<=0){_fxP.splice(i2,1);continue}var gr=g.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);gr.addColorStop(0,'rgba(255,246,220,'+(0.6*p.life).toFixed(3)+')');gr.addColorStop(1,'rgba(255,246,220,0)');g.globalAlpha=1;g.fillStyle=gr;g.beginPath();g.arc(p.x,p.y,p.r,0,6.283);g.fill();continue}
      if(p.ring){p.life-=p.dec*dt/1000;if(p.life<=0){_fxP.splice(i2,1);continue}var rr=p.r+(1-p.life)*140*(p.r/6);g.globalAlpha=0.55*p.life;g.strokeStyle=p.c;g.lineWidth=2.2*p.life+0.4;g.beginPath();g.arc(p.x,p.y,rr,0,6.283);g.stroke();continue}
      p.px=p.x;p.py=p.y;var dr=Math.pow(p.dr||0.975,f);p.vx*=dr;p.vy=p.vy*dr+(p.g||0)*f;p.x+=p.vx*f;p.y+=p.vy*f;p.life-=p.dec*dt/1000;p.tw+=0.35*f;
      if(p.life<=0){_fxP.splice(i2,1);continue}
      if(p.cr&&p.life<0.52){p.cr=0;_fxCrackle(p)}
      var a=Math.max(0,Math.min(1,p.life))*(p.life<0.35?(0.55+0.45*Math.abs(Math.sin(p.tw))):1);
      if(p.line){var L=p.line,lg=g.createLinearGradient(p.x,p.y,p.x-p.vx*L,p.y-p.vy*L);lg.addColorStop(0,p.c);lg.addColorStop(1,'rgba(255,255,255,0)');g.globalAlpha=a;g.strokeStyle=lg;g.lineWidth=p.r;g.lineCap='round';g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-p.vx*L,p.y-p.vy*L);g.stroke();
        if(p.big){var hg=g.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*6);hg.addColorStop(0,'rgba(255,255,255,'+(0.7*a).toFixed(3)+')');hg.addColorStop(0.4,'rgba(200,215,255,'+(0.28*a).toFixed(3)+')');hg.addColorStop(1,'rgba(200,215,255,0)');g.fillStyle=hg;g.beginPath();g.arc(p.x,p.y,p.r*6,0,6.283);g.fill();
          if(Math.random()<0.7&&_fxP.length<420)_fxP.push({x:p.x-p.vx*(1+Math.random()*3),y:p.y-p.vy*(1+Math.random()*3),px:p.x,py:p.y,vx:(Math.random()-0.5)*0.8,vy:(Math.random()-0.5)*0.8,life:1,dec:1.6+Math.random()*0.8,c:['#ffffff','#ffe9c9','#dfe9ff'][Math.floor(Math.random()*3)],r:0.7+Math.random()*0.7,tw:0,g:0.012,dr:0.985})}
        g.fillStyle='#fff';g.beginPath();g.arc(p.x,p.y,p.r*0.9,0,6.283);g.fill();continue}
      if(p.st){g.globalAlpha=a*0.55;g.strokeStyle=p.c;g.lineWidth=p.r*1.5;g.lineCap='round';g.beginPath();g.moveTo(p.px,p.py);g.lineTo(p.x,p.y);g.stroke()}
      g.globalAlpha=a;g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,p.r*(0.6+0.4*p.life),0,6.283);g.fill()}
    g.globalAlpha=1;
    if(!_fxQ.length&&!_fxS.length&&!_fxP.length){_fxReset();return}
    requestAnimationFrame(_fxFrame);
  }catch(e){_fxReset()}
}
function _vidTags(txt,mid){
  try{
    if(!vidOn||!txt)return;
    if(mid){if(_vtSeen.indexOf(mid)>=0)return;_vtSeen.push(mid);if(_vtSeen.length>10)_vtSeen.shift()}
    var cs=_callS||{};
    if(cs.vidSnap!==false&&/<ws_vsnap\b[^>]*\/?>/i.test(txt))doShot('ai');
    if(cs.vidGift===true){
      var g0=/<ws_vgift\b([^>]*?)\/?>/i.exec(txt);
      if(g0){var ga=g0[1]||'';
        var gk=String(((/kind\s*=\s*"?([a-zA-Z]+)/.exec(ga)||[])[1]||'heart')).toLowerCase();
        _vgSend(gk,1);/* 手机端：一次一件，不再解析 n */
      }
    }
  }catch(e){}
}
function _shotChip(fr){
  try{var c=UI.root&&UI.root.querySelector('#ibc-shotc'),im=c&&c.querySelector('img');if(!c)return;
    if(!fr){c.hidden=true;if(im)im.removeAttribute('src');if(UI.att)UI.att.classList.remove('on');return}
    if(im)im.src=fr;c.hidden=false;c.classList.remove('in');void c.offsetWidth;c.classList.add('in');if(UI.att)UI.att.classList.add('on');
  }catch(e){}}
var _VG=_IBGIFT;/* 手机端：礼物表改引全局目录 _IBGIFT（五档预置、三档开放）；手机端：礼物一期 */
function _vgSend(kind,n){
  try{
    if(!vidOn)return;var cs=_callS||{};if(cs.vidGift!==true)return;
    var g=_VG[kind];if(!g||g.on===false){kind='heart';g=_VG.heart}/* 手机端：未开放档回落小心心 */
    n=1;/* 手机端：一次一件（去掉数量，AI 不必选数字） */
    _vgCnt[kind]=(_vgCnt[kind]||0)+1;_vgTotal+=1;
    _vgBubble(g,n,kind);_vgChipUpd();if(g.fx)_fxQueue(g.fx,n);/* 手机端：有特效的档送几件排几场 */
    var c9=cfg,th9=threadId;if(!c9)return;
    var um={id:'msg_'+Date.now()+'_g',role:'user',content:'[TA 送出了礼物：'+g.t+']',friendId:c9.id,timestamp:Date.now(),gift:{kind:kind,n:n,by:'ai'}};try{um.content=_giftLineM(um)}catch(e){}/* v171-p：落库正文即写明谁送给谁 */
    if(th9)um.threadId=th9;
    dbPut('chatMessages',um).then(function(){
      try{
        if(_activeCfg&&_activeCfg.id===c9.id&&((_activeThread?_activeThread.id:'')===(th9||''))){
          _msgs.push(um);var box=convEl('cv-msgs');
          if(box){var ee=box.querySelector('.empty');if(ee)ee.remove();box.appendChild(buildMsgEl(um,_msgs[_msgs.length-2]||null));pinBottom();}
        }
      }catch(e){}
    }).catch(function(){});
  }catch(e){}
}
function _vgPill(g,n){
  var b=document.createElement('div');b.className='ibc-gb'+(g.cls?' '+g.cls:'');
  var ic=document.createElement('span');ic.className='gb-ic';ic.innerHTML=_ibGiftIcon(g);
  var sp=document.createElement('span');sp.className='gb-t';sp.textContent=_lyrAiName()+' 送出 '+g.t;
  b.appendChild(ic);b.appendChild(sp);return b;/* 手机端：一次一件，去掉 ×n 与跳数 */
}
var _VGB={
  heart:function(g,n){return _vgPill(g,n)},
  bouquet:function(g,n){return _vgPill(g,n)},
  fireworks:function(g,n){return _vgPill(g,n)},
  meteor:function(g,n){var b=_vgPill(g,n);var s=document.createElement('span');s.className='gb-streak';b.appendChild(s);return b},/* 手机端：斜向流光扫过 */
  galaxy:function(g,n){var b=_vgPill(g,n);var s=document.createElement('span');s.className='gb-way';b.appendChild(s);return b}
};
function _vgBubble(g,n,kind){
  try{
    if(!UI.gl)return;
    var mk=_VGB[kind]||_VGB.heart,b=mk(g,n);
    UI.gl.appendChild(b);
    while(UI.gl.children.length>3)UI.gl.removeChild(UI.gl.firstChild);
    setTimeout(function(){try{b.classList.add('out');setTimeout(function(){try{b.remove()}catch(e){}},430)}catch(e){}},g.dur||4200);
  }catch(e){}
}
function _vgChipUpd(){try{if(UI.vgn)UI.vgn.textContent=String(_vgTotal);if(UI.vgc&&_vgTotal>0)UI.vgc.hidden=false}catch(e){}}
function _vgPanel(){
  try{
    if(!UI.vgp)return;
    if(!UI.vgp.hidden){UI.vgp.hidden=true;return}
    var h='',ks=Object.keys(_vgCnt);
    if(!ks.length)h='<div class="r"><span>还没有收到礼物</span></div>';
    else{ks.forEach(function(k){var g=_VG[k]||_VG.heart;h+='<div class="r"><span><i class="gb-ic">'+_ibGiftIcon(g)+'</i>'+g.t+'</span><b>×'+_vgCnt[k]+'</b></div>'});h+='<div class="r tt"><span>共</span><b>'+_vgTotal+' 件</b></div>'}
    UI.vgl.innerHTML=h;UI.vgp.hidden=false;
  }catch(e){}
}
async function vidStart(){
  try{
    if(window.IBNative&&window.IBNative.camPerm){/* 原生先要 CAMERA 运行时权限：首答未落地时轮询等用户点完（最长约 8s） */
      var g=null;try{g=await window.IBNative.camPerm()}catch(e){}
      if(g&&!g.granted&&g.requested){for(var w9=0;w9<16;w9++){await new Promise(function(r){setTimeout(r,500)});try{g=await window.IBNative.camPerm()}catch(e){break}if(g&&g.granted)break}}
      if(g&&!g.granted)throw new Error('相机权限未授予');
    }
    vidStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:vidFace,width:{ideal:1280},height:{ideal:720}},audio:false});
    if(!vidOn||!isOpen){try{vidStream.getTracks().forEach(function(t){t.stop()})}catch(e){}vidStream=null;return true}
    UI.cam.srcObject=vidStream;try{UI.cam.classList.toggle('mir',vidFace==='user')}catch(e){}
    try{await UI.cam.play()}catch(e){}
    return true;
  }catch(err){
    _vidErr=String((err&&err.message)||err).slice(0,40);
    vidStop();
    return false;
  }
}
function vidStop(){try{if(UI.cam){UI.cam.srcObject=null;UI.cam.classList.remove('live')}}catch(e){}try{if(vidStream)vidStream.getTracks().forEach(function(t){t.stop()})}catch(e){}vidStream=null}
async function doFlip(){
  if(!vidOn)return;
  var prev=vidFace;vidFace=(vidFace==='user')?'environment':'user';vidStop();
  if(await vidStart())return;
  vidFace=prev;
  if(await vidStart()){toast('这台设备切不了那个镜头，保持原镜头');return}
  toast('镜头没能恢复（'+(_vidErr||'未知原因')+'）——已挂断');
  try{endCall('viderr')}catch(e){}
}
function doShot(by){/* 手机端：by='ai' 表示 TA 自主拍照 */
  try{
    if(!vidOn||!vidStream){toast('摄像头未就绪');return}
    var v=(UI.cam&&UI.cam.videoWidth)?UI.cam:((_vwV&&_vwV.videoWidth)?_vwV:null);if(!v){toast('画面还没出来，稍等一下');return}/* 手机端：折叠时从小画面窗取帧 */
    var sc=Math.min(1,1280/Math.max(v.videoWidth,v.videoHeight));
    var cv=document.createElement('canvas');cv.width=Math.round(v.videoWidth*sc);cv.height=Math.round(v.videoHeight*sc);
    var g=cv.getContext('2d');
    if(v.classList.contains('mir')){g.translate(cv.width,0);g.scale(-1,1)}/* 快照与预览同向（前置镜像） */
    g.drawImage(v,0,0,cv.width,cv.height);
    var du=cv.toDataURL('image/jpeg',0.82);
    if(!_min9)try{var fl=document.createElement('i');fl.className='ibc-flash';UI.root.appendChild(fl);setTimeout(function(){try{fl.remove()}catch(e){}},430)}catch(e){}
    var c9=cfg,th9=threadId;if(!c9)return;
    var um={id:'msg_'+Date.now()+'_u',role:'user',content:'[视频通话快照]',friendId:c9.id,timestamp:Date.now(),images:[{dataUrl:du,mime:'image/jpeg'}],snap:by||'ai'};/* 手机端：记下拍摄者（与电脑端同字段） */if(c9._group&&by==='ai'&&_spkNm)um.snapBy=_spkNm;
    if(th9)um.threadId=th9;
    dbPut('chatMessages',um).then(function(){
      try{
        if(_activeCfg&&_activeCfg.id===c9.id&&((_activeThread?_activeThread.id:'')===(th9||''))){
          _msgs.push(um);var box=convEl('cv-msgs');
          if(box){var ee=box.querySelector('.empty');if(ee)ee.remove();box.appendChild(buildMsgEl(um,_msgs[_msgs.length-2]||null));pinBottom()}
        }
      }catch(e){}
      toast(by==='ai'?'TA 拍了一张，存进了这段聊天':'已拍下一张，存进了这段聊天');
    }).catch(function(){toast('快照保存失败')});
    _dmLast=null;if(by==='ai')_dmPush('ai',((c9._group&&_spkNm)?_spkNm:_lyrAiName())+':📷 拍了一张');else _dmPush('me','📷 拍了一张快照');_dmLast=null;/* 手机端：群里按快门的是正在生成的成员（与 snapBy 同口径），不是正在朗读的成员 */
  }catch(e){toast('快照失败：'+String((e&&e.message)||e).slice(0,40))}
}
async function endCall(reason){
  if(!isOpen)return;isOpen=false;
  try{_vbFlushV9(true)}catch(eV9){}
  var wasVid=vidOn;vidOn=false;vidStop();try{UI.root.classList.remove('vid')}catch(e){}_dmReset();try{if(_vw){_vw.hidden=true;if(_vwV)_vwV.srcObject=null}}catch(e){}try{if(UI.doo)UI.doo.innerHTML=''}catch(e){}_fxReset();_vtSeen.length=0;var _vgSnap=(wasVid&&_vgTotal>0)?{total:_vgTotal,kinds:Object.assign({},_vgCnt)}:null;_vgCnt={};_vgTotal=0;_vidPend=null;try{_shotChip(null)}catch(e){}try{window._ibcEphM=null}catch(e){}try{if(UI.att)UI.att.classList.remove('on');if(UI.vgc)UI.vgc.hidden=true;if(UI.vgp)UI.vgp.hidden=true;if(UI.gl)UI.gl.innerHTML=''}catch(e){}/* 手机端；手机端：收窗清层；手机端：礼物快照与复位 */
  try{document.body.classList.remove('ibcall-full');var _bx8=document.getElementById('cv-msgs');if(_bx8)_bx8.scrollTop=_bx8.scrollHeight}catch(e){}/* 手机端 */
  speakGen++;try{if(ttsAc)ttsAc.abort()}catch(e){}
  const dur=Math.max(1,Math.round((Date.now()-t0)/1000));
  const myTurns=turns,c=cfg,th=threadId;
  try{if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}
  try{if(curSrc)curSrc.stop(0)}catch(e){}
  q.length=0;speaking=false;turnBusy=false;dropStream=false;
  stopTimer();
  if(raf){cancelAnimationFrame(raf);raf=0}
  cleanupAudio();
  ring=[];ringSamples=0;utterStart=-1;
  kaw(false);
  try{UI.root.hidden=true;setCap('','')}catch(e){}
  try{if(_lyrHoldT){clearTimeout(_lyrHoldT);_lyrHoldT=0}_lyrHold=false}catch(e){}
  try{_min9=false;UI.root.classList.remove('mini');if(_pill)_pill.hidden=true}catch(e){}/* 手机端：#4 */
  try{UI.conf.hidden=true;UI.conf.innerHTML='';UI.type.hidden=true;UI.typeIn.value=''}catch(e){}langMode='';rawCur=0;_confSig='';/* v138-c：②③④ */
  /* 通话记录标记：只入历史不触发回复；AI 下条消息自然看到，缓存按追加走 */
  if(myTurns>0&&c){
    try{
      const um={id:'msg_'+Date.now()+'_u',role:'user',content:'[语音通话已结束 · 时长 '+fmtDur(dur)+' · 共 '+myTurns+' 轮]',friendId:c.id,timestamp:Date.now(),callEnd:{dur:dur,turns:myTurns}};if(wasVid){um.callEnd.video=1;if(_vgSnap)um.callEnd.gifts=_vgSnap;um.content='[视频通话已结束 · 时长 '+fmtDur(dur)+' · 共 '+myTurns+' 轮]'}/* 手机端：结束卡走 VIDEO 角标，标记两种均被识别 *//* 手机端：①结构化字段（与电脑端同） */
      if(th)um.threadId=th;
      await dbPut('chatMessages',um);
      try{const s9=await loadCALL();const pp9=(s9&&s9.perApi&&s9.perApi[c.id])||{};if(pp9.autoRec===1){_recPendM[um.id]=1;_genCallRecM(um).catch(function(){})}}catch(e){}
      if(_activeCfg&&_activeCfg.id===c.id&&((_activeThread?_activeThread.id:'')===(th||''))){
        _msgs.push(um);
        const box=convEl('cv-msgs');
        if(box){const emptyEl=box.querySelector('.empty');if(emptyEl)emptyEl.remove();
          box.appendChild(buildMsgEl(um,_msgs[_msgs.length-2]||null));pinBottom()}
      }
    }catch(e){}
  }
  cfg=null;threadId='';myKey='';
}
/* ── 试听（设置页「试听一句」）：走当前音色设置，独立于通话 ── */
async function testSpeak(ov){/* 手机端：#2 可传入一套合并后的配置试听（每 API 行的「试听这套配置」用） */
  const cs=ov||await loadCALL(true);
  const s='你好，这是语音通话的试听，一切正常。';
  if(cs.tts==='off'){toast('当前选择「仅字幕」，通话中不发声');return}
  if(cs.tts==='cloud'){
    toast('云端合成中…');
    try{
      const ab=await cloudFetchTTS(s,cs,null);/* v138-c：①与通话同一套多服务商请求 */
      if(!ab||ab.byteLength<200)throw new Error('返回音频为空');
      const a=new Audio(URL.createObjectURL(new Blob([ab],{type:'audio/mpeg'})));
      try{if(/^(el|ali)$/.test((cs&&cs.provider)||'oai')){const rrT=Math.max(0.5,Math.min(2,parseFloat(cs.rate)||1));if(rrT!==1)a.playbackRate=rrT}}catch(e){}
      a.onended=function(){try{URL.revokeObjectURL(a.src)}catch(e){}};a.onerror=a.onended;/* 手机端：#3 失败也回收 objectURL */
      try{a.volume=Math.max(0.1,Math.min(1,parseFloat(cs.vol)||1))}catch(e){}/* 手机端：#1 */
      await a.play();
    }catch(err){toast('试听失败：'+String((err&&err.message)||err).slice(0,90))}
    return;
  }
  if(!('speechSynthesis' in window)){toast('此环境没有系统语音合成');return}
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(s);
    u.lang='zh-CN';u.rate=Math.max(0.5,Math.min(2,parseFloat(cs.rate)||1));u.volume=Math.max(0.1,Math.min(1,parseFloat(cs.vol)||1));/* 手机端：#1 */
    if(cs.sysVoice){const vs=speechSynthesis.getVoices()||[];
      const v=vs.find(function(x){return x&&(x.voiceURI===cs.sysVoice||x.name===cs.sysVoice)});
      if(v)u.voice=v}
    u.onerror=function(){toast('系统语音播放失败——本机可能没有中文语音引擎')};
    speechSynthesis.speak(u);
  }catch(e){toast('系统语音不可用')}
}
try{window.cloudFetchTTS=cloudFetchTTS;window._ibcCleanSent=_ibcCleanSent}catch(e){}/* 手机端：#2 供 IBVB 语音条模块复用（本块是 IIFE） */
return{open:openCall,end:endCall,test:testSpeak,active:function(){return isOpen},vid:function(){return vidOn},
  _onDelta:onDelta,_onAiMsg:onAiMsg,_onTurnEnd:onTurnEnd};
})();
try{window._IBCALL=IBCALL}catch(e){}

var IBVB=(function(){
  var sty=false,cache={},cur=null;
  function ensureSty(){
    if(sty)return;sty=true;
    try{var st=document.createElement('style');st.id='ibvb-style';st.textContent=''
    +'.ibvb-wrap{margin-top:8px}'
    +'.ibvb{display:inline-flex;align-items:center;gap:9px;padding:8px 12px;border-radius:999px;border:1px solid var(--glass-line);background:var(--soft);cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;max-width:min(78vw,300px)}'
    +'.ibvb .vb-p{flex:none;width:26px;height:26px;border-radius:50%;background:var(--vb-knob,rgba(120,168,220,0.24));color:var(--vb-tri,var(--acc));display:flex;align-items:center;justify-content:center;transition:background 0.2s}'
    +'.ibvb .vb-p svg{width:13px;height:13px;fill:currentColor;stroke:none}'
    +'.ibvb[data-st=play] .vb-p .vb-i1{display:none}.ibvb:not([data-st=play]) .vb-p .vb-i2{display:none}'
    +'.ibvb[data-st=load] .vb-p svg{display:none}'
    +'.ibvb[data-st=load] .vb-p::after{content:"";width:12px;height:12px;border:2px solid rgba(255,255,255,0.45);border-top-color:#fff;border-radius:50%;animation:ibvbSpin 0.8s linear infinite}'
    +'@keyframes ibvbSpin{to{transform:rotate(360deg)}}'
    +'.ibvb .vb-w{display:flex;align-items:center;gap:2.5px;height:16px;color:inherit}'
    +'.ibvb .vb-w i{width:2.5px;border-radius:2px;background:var(--vb-wave,currentColor);opacity:var(--vb-waveop,0.55);height:6px}'
    +'.ibvb .vb-w i:nth-child(2){height:11px}.ibvb .vb-w i:nth-child(3){height:15px}.ibvb .vb-w i:nth-child(4){height:9px}.ibvb .vb-w i:nth-child(5){height:13px}.ibvb .vb-w i:nth-child(6){height:7px}'
    +'.ibvb[data-st=play] .vb-w i{animation:ibvbW 0.9s ease-in-out infinite alternate}'
    +'.ibvb[data-st=play] .vb-w i:nth-child(2){animation-delay:0.12s}.ibvb[data-st=play] .vb-w i:nth-child(3){animation-delay:0.24s}.ibvb[data-st=play] .vb-w i:nth-child(4){animation-delay:0.36s}.ibvb[data-st=play] .vb-w i:nth-child(5){animation-delay:0.48s}.ibvb[data-st=play] .vb-w i:nth-child(6){animation-delay:0.6s}'
    +'@keyframes ibvbW{from{transform:scaleY(0.55)}to{transform:scaleY(1.35)}}'
    +'@media (prefers-reduced-motion:reduce){.ibvb[data-st=play] .vb-w i,.ibvb[data-st=load] .vb-p::after{animation:none}}'
    +'.ibvb .vb-d{font-size:0.72rem;opacity:0.7;font-variant-numeric:tabular-nums;white-space:nowrap}'
        +'.ibvb .vb-t{flex:none;width:25px;height:25px;padding:0;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--glass-line);opacity:0.72;transition:opacity 0.2s,background 0.2s}'+'.ibvb .vb-t svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}'+'.ibvb .vb-t.on svg{fill:currentColor;opacity:0.9}'+'.ibvb .vb-t.on{opacity:1;background:rgba(120,168,220,0.2)}'
    +'.ibvb-tx{margin-top:6px;font-size:0.78rem;line-height:1.6;opacity:0.78;padding:6px 10px;border-left:2px solid var(--glass-line);white-space:pre-wrap;word-break:break-word;max-width:min(78vw,300px)}'
    +'.ibvb-tx[hidden]{display:none}';
    document.head.appendChild(st)}catch(e){}
  }
  function estSec(t){t=String(t||'');var z=0,o=0;for(var i=0;i<t.length;i++){var c=t.charCodeAt(i);if(c>=0x2e80)z++;else if(c>32)o++}return Math.max(1,Math.min(180,Math.round(z/3.6+o/13)))}
  function fmt(n){n=Math.max(1,Math.round(n));return n+'″'}
  function plain(m){/* 原声模式：这条消息本身的可读文本（剥思考链/代码块/标签后走通话同款净化） */
    var t=String((m&&m.content)||'');
    t=t.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi,' ');
    t=t.replace(/```[\s\S]*?```/g,' ');
    t=t.replace(/<[^>\n]{0,300}>/g,' ');
    try{if(typeof window._ibcCleanSent==='function')t=window._ibcCleanSent(t)}catch(e){}
    return String(t||'').trim().slice(0,600);
  }
  function stop(){
    if(!cur)return;
    try{if(cur.a){cur.a.pause();cur.a.currentTime=0}}catch(e){}
    try{if(cur.u&&('speechSynthesis' in window))speechSynthesis.cancel()}catch(e){}
    try{if(cur.el)cur.el.dataset.st='idle'}catch(e){}
    cur=null;
  }
  async function synthPlay(el,text,eff,lg,msgId,durEl){
    var LMAP={en:'en-US',ja:'ja-JP',ko:'ko-KR'};
    try{var _tq=String(text||'').match(/^\s*【语气[:：]\s*([^】]{1,6})】\s*/);if(_tq){window._ibToneHint=_tq[1].trim();text=String(text).slice(_tq[0].length)}}catch(e){}/* 语气标签只给合成端：不念、不进时长与缓存键 */
    var vol=Math.max(0.1,Math.min(1,parseFloat(eff.vol)||1));
    if(eff.tts==='cloud'&&typeof window.cloudFetchTTS==='function'){
      try{
        var key=String(eff.provider||'')+'|'+String(eff.voice||'')+'|'+String(eff.model||'')+'|'+lg+'|'+text.length;
        var hit=cache[msgId];var url=(hit&&hit.key===key)?hit.url:null;
        if(!url){
          el.dataset.st='load';
          var ab=await window.cloudFetchTTS(text,eff,null);
          if(!ab||ab.byteLength<200)throw new Error('返回音频为空');
          if(hit&&hit.url){try{URL.revokeObjectURL(hit.url)}catch(e){}}
          url=URL.createObjectURL(new Blob([ab],{type:'audio/mpeg'}));
          cache[msgId]={key:key,url:url};
        }
        var a=new Audio(url);a.volume=vol;
        try{if(/^(el|ali)$/.test(String(eff.provider||'oai'))){var rr=Math.max(0.5,Math.min(2,parseFloat(eff.rate)||1));if(rr!==1)a.playbackRate=rr}}catch(e){}
        a.onloadedmetadata=function(){try{if(durEl&&isFinite(a.duration)&&a.duration>0)durEl.textContent=fmt(a.duration/(a.playbackRate||1))}catch(e){}};
        a.onended=function(){if(cur&&cur.a===a){cur=null;el.dataset.st='idle'}};
        a.onerror=a.onended;
        cur={el:el,a:a};el.dataset.st='play';
        await a.play();return;
      }catch(err){el.dataset.st='idle';toast('云端合成失败，改用系统语音：'+String((err&&err.message)||err).slice(0,60))}
    }
    if(!('speechSynthesis' in window)){el.dataset.st='idle';toast('本机没有可用的语音引擎');return}
    try{
      speechSynthesis.cancel();
      var u=new SpeechSynthesisUtterance(text);
      u.lang=(lg&&LMAP[lg])?LMAP[lg]:'zh-CN';
      u.rate=Math.max(0.5,Math.min(2,parseFloat(eff.rate)||1));u.volume=vol;
      try{var vs=speechSynthesis.getVoices()||[];var v=null;
        if(eff.sysVoice)v=vs.find(function(x){return x&&(x.voiceURI===eff.sysVoice||x.name===eff.sysVoice)})||null;
        var pf=u.lang.slice(0,2).toLowerCase();
        if(!(v&&String(v.lang||'').toLowerCase().indexOf(pf)===0))v=vs.find(function(x){return x&&String(x.lang||'').toLowerCase().indexOf(pf)===0})||v;
        if(v)u.voice=v;
      }catch(e){}
      u.onend=function(){if(cur&&cur.u===u){cur=null;el.dataset.st='idle'}};
      u.onerror=u.onend;
      cur={el:el,u:u};el.dataset.st='play';
      speechSynthesis.speak(u);
    }catch(e){el.dataset.st='idle';toast('系统语音不可用')}
  }
  /* v213-p：声波根数按胶囊宽算（与自己那侧的 _vmBars 同一公式），不再死写 6 根 */
  function _vbBarStr(sec){
    var cap=(typeof _vmWidth==='function')?_vmWidth(sec):Math.round(Math.min(238,116+Math.min(sec||1,60)*2.05));
    var n=Math.max(7,Math.min(40,Math.round((cap-98)/5.2)));
    var h='';for(var i=0;i<n;i++)h+='<i></i>';return h;
  }
  function bar(m,vb){
    ensureSty();
    var wrap=document.createElement('div');wrap.className='ibvb-wrap';
    var el=document.createElement('div');el.className='ibvb';el.dataset.st='idle';el.setAttribute('role','button');el.setAttribute('aria-label','播放语音条');
    var hasTx=!!(vb&&vb.t);
    var _vbSec=estSec(hasTx?vb.t:plain(m));
    el.innerHTML='<span class="vb-p"><svg class="vb-i1" viewBox="0 0 16 16"><path d="M5 3.4v9.2L13 8 5 3.4z"/></svg><svg class="vb-i2" viewBox="0 0 16 16"><path d="M5 3.5h2.2v9H5zM8.8 3.5H11v9H8.8z"/></svg></span>'
      +'<span class="vb-w">'+_vbBarStr(_vbSec)+'</span>'
      +'<span class="vb-d">'+fmt(_vbSec)+'</span>'
            +(hasTx?'<span class="vb-t" role="button" aria-label="查看语音条原文" title="原文"><svg viewBox="0 0 24 24"><path d="M12 20.3 4.7 13a4.6 4.6 0 1 1 6.5-6.5l.8.8.8-.8A4.6 4.6 0 1 1 19.3 13z"/></svg></span>':'');
    var tx=null;
    if(hasTx){tx=document.createElement('div');tx.className='ibvb-tx';tx.hidden=true;tx.textContent=vb.t}
    var durEl=el.querySelector('.vb-d'),lgEl=null;
    if(hasTx){el.querySelector('.vb-t').addEventListener('click',function(ev){ev.stopPropagation();if(tx){tx.hidden=!tx.hidden;ev.currentTarget.classList.toggle('on',!tx.hidden)}})}/* v211-p：展开态高亮 */
    el.addEventListener('click',async function(){
      if(el.dataset.st==='play'||el.dataset.st==='load'){stop();return}
      stop();
      try{
        var eff=_callEffMerge(await loadCALL(true),(m&&m.friendId)||'');
        var lg=hasTx?(eff.vbLang||''):'';
        var text=hasTx?vb.t:plain(m);
        if(!text){toast('这条消息没有可朗读的内容');return}
        
        if(eff.tts==='off'){toast('该 AI 当前是「仅字幕（不发声）」，到通话设置里换个声音');return}
        await synthPlay(el,text,eff,lg,String((m&&m.id)||Math.random()),durEl);
      }catch(err){el.dataset.st='idle';toast('播放失败：'+String((err&&err.message)||err).slice(0,60))}
    });
    wrap.appendChild(el);if(tx)wrap.appendChild(tx);
    return wrap;
  }
  function say(text,eff,lg){/* 设置页「试听语音条效果」复用 */
    ensureSty();var el=document.createElement('div');el.dataset.st='idle';
    stop();synthPlay(el,String(text||''),eff||{},lg||'','__prev__',null);
  }
  return {bar:bar,say:say,stop:stop};
})();
try{window.IBVB=IBVB}catch(e){}
/* ── 语音通话·设置绑定（API 页 → 工具 → 语音通话；存 apiSettings/callSettings） ── */
function _ibcCloudVis(){try{
  const v=($('call-tts')||{}).value;
  const cg=$('call-cloud-g');if(cg)cg.style.display=v==='cloud'?'':'none';
  const sg=$('call-sysv-g');if(sg)sg.style.display=v==='sys'?'':'none';
  const pv=(_callS&&_callS.provider)||'oai';
  const ps=$('call-prov');if(ps&&ps.value!==pv)ps.value=pv;
  const gg=$('call-gid-g');if(gg)gg.style.display=pv==='mm'?'':'none';
  try{var vk9=$('call-vkeep');if(vk9)vk9.value=(_callS&&_callS.voiceKeep==='off')?'off':'on'}catch(e){}/* 本轮：语音留档随配置回显 */
  const pr=$('call-presets');if(pr)pr.style.display=pv==='oai'?'':'none';
  const sv=$('call-preset-sv-g');if(sv)sv.style.display=pv==='oai'?'':'none';
  const ep=$('call-ep'),md=$('call-model'),vo=$('call-voice'),nt=$('call-ep-note'),ht=$('call-cloud-hint');
  if(pv==='el'){
    if(ep)ep.placeholder='留空 = https://api.elevenlabs.io';
    if(md)md.placeholder='eleven_multilingual_v2（留空默认）';
    if(vo)vo.placeholder='音色 ID（voice_id，必填）';
    if(nt)nt.textContent='（留空用官方地址）';
    if(ht)ht.textContent='ElevenLabs：Key 在官网个人设置的 API Keys；「音色」填 Voices 页里那串音色 ID（不是名字）。语速由本机变速实现。多语言天生支持。跨域（CORS）没逐家实测，点「试听一句」自检，不通就换一家。';
  }else if(pv==='mm'){
    if(ep)ep.placeholder='留空 = https://api.minimax.chat';
    if(md)md.placeholder='speech-02-turbo（留空默认）';
    if(vo)vo.placeholder='female-shaonv（留空默认）';
    if(nt)nt.textContent='（国内主站可留空；海外账号填官网给你的接口地址）';
    if(ht)ht.textContent='MiniMax：除 Key 外还要账号后台「基本信息」里的 GroupId。「音色」填官方音色 ID（如 female-shaonv），也支持你自己克隆的音色 ID；中日英都能念。点「试听一句」自检。';
  }else if(pv==='az'){
    if(ep)ep.placeholder='https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1';
    if(md)md.placeholder='（Azure 不用填模型）';
    if(vo)vo.placeholder='zh-CN-XiaoxiaoNeural（留空默认）';
    if(nt)nt.textContent='（按你的语音资源区域改子域，如 eastasia / eastus）';
    if(ht)ht.textContent='Azure 微软语音：Key 用「语音服务」资源的密钥，Endpoint 填对应区域的 TTS 端点。「音色」填 Neural 音色名（如 zh-CN-XiaoxiaoNeural / zh-CN-YunxiNeural / zh-CN-XiaoyiNeural）。语速走服务端 SSML；官方对浏览器放行跨域，点「试听一句」自检。';
  }else if(pv==='ali'){
    if(ep)ep.placeholder='留空 = https://dashscope.aliyuncs.com';
    if(md)md.placeholder='qwen-tts（留空默认，可填 qwen-tts-latest）';
    if(vo)vo.placeholder='Cherry（留空默认；可选 Serena / Ethan / Chelsie）';
    if(nt)nt.textContent='（国内主站可留空）';
    if(ht)ht.textContent='阿里云 Qwen-TTS（DashScope）：Key 用百炼平台的 API-KEY（sk- 开头），走 REST、拿到音频地址后再取流，实测端点与音频桶都放行浏览器跨域。语速由本机变速实现。注意：老的 CosyVoice/Sambert 仅 WebSocket 那套仍然接不了，这里走的是 qwen-tts。';
  }else if(pv==='doubao'){
    if(ep)ep.placeholder='留空 = https://openspeech.bytedance.com';
    if(md)md.placeholder='volcano_tts（留空默认；此栏填 cluster）';
    if(vo)vo.placeholder='zh_female_cancan_mars_bigtts（voice_type，必填）';
    if(nt)nt.textContent='（留空用官方地址）';
    if(ht)ht.textContent='豆包（火山引擎语音技术）：在火山引擎控制台「语音技术-语音合成」开通后拿 App ID 和 Access Token，Key 栏填「appid:access_token」（中间英文冒号）；「音色」填 voice_type；「模型」栏留空即经典 volcano_tts，用豆包大模型音色也填这个 cluster。该端点未确认放行浏览器跨域，点「试听一句」自检。';
  }else{
    if(ep)ep.placeholder='https://api.siliconflow.cn/v1';
    if(md)md.placeholder='FunAudioLLM/CosyVoice2-0.5B';
    if(vo)vo.placeholder='FunAudioLLM/CosyVoice2-0.5B:anna';
    if(nt)nt.textContent='（可只填到 /v1）';
    if(ht)ht.textContent='任何 OpenAI 兼容的 /v1/audio/speech 接口都能接：SiliconFlow 的 CosyVoice2、OpenAI 的 tts，自建 GPT-SoVITS 一类网关也行——这就是给「AI 声音」留的口子。请求由应用内浏览器直接发出，接口需允许跨域（CORS）；合成失败会自动回落系统语音。注意：阿里百炼（dashscope）的 CosyVoice 只有 WebSocket 且要求握手头鉴权，浏览器直连不通，别把它的地址填在这里——要用阿里的声音，请把「云端服务商」切到「阿里云 Qwen-TTS」。';/* 手机端：#5 */
  }
}catch(e){}}
function _ibcFillVoices(){try{
  const sel=$('call-sysvoice');if(!sel||!('speechSynthesis' in window))return;
  const vs=(speechSynthesis.getVoices()||[]).slice();
  vs.sort(function(a,b){
    const az=/zh|cmn|中/i.test(String(a.lang)+String(a.name))?0:1;
    const bz=/zh|cmn|中/i.test(String(b.lang)+String(b.name))?0:1;
    return az-bz||String(a.name).localeCompare(String(b.name));
  });
  const cur=(_callS&&_callS.sysVoice)||'';
  let h='<option value="">自动（跟随系统）</option>';
  for(let i=0;i<vs.length;i++){const v=vs[i];if(!v)continue;
    const val=v.voiceURI||v.name;
    h+='<option value="'+esc(val)+'">'+esc(String(v.name||'')+' · '+String(v.lang||''))+'</option>';
  }
  sel.innerHTML=h;
  sel.value=cur;if(sel.value!==cur)sel.value='';
}catch(e){}}
try{_ibcWhenDb(function(){(async function(){
  const cs=await loadCALL();
  sw2($('call-on'),cs.on!==false);
  sw2($('call-barge'),cs.bargein!==false);
  sw2($('call-lyrme'),cs.lyrMe!==false);/* 手机端：#6 */
  var _vf9=$('call-vidface');if(_vf9){_vf9.value=(cs.vidFace==='env')?'env':'user'}/* 手机端 */
  var _vs9=$('call-vidsee');if(_vs9){_vs9.value=String(cs.vidSee||'off');if(_vs9.value!==String(cs.vidSee||'off'))_vs9.value='off'}
  sw2($('call-vidsnap'),cs.vidSnap!==false);sw2($('call-vidgift'),cs.vidGift===true);
  var _vt9=$('call-vidtts');if(_vt9){_vt9.value=(cs.vidTts==='mute')?'mute':'follow'}
  var _vi9=$('call-vidin');if(_vi9){_vi9.value=(cs.vidIn==='type')?'type':'follow'}/* 手机端 */
  var _vq9=$('call-vidq');if(_vq9){_vq9.value=_vidQNormM(cs.vidQ)}/* 手机端 *//* 手机端：#6 */
  sw2($('call-hb'),cs.hb===true);var _hbs9=$('call-hbsec');if(_hbs9){_hbs9.value=String(cs.hbSec||45);if(_hbs9.value!==String(cs.hbSec||45))_hbs9.value='45'}/* v174：①通话心跳回填 */
  const ts=$('call-tts');if(ts)ts.value=(cs.tts==='cloud'||cs.tts==='off')?cs.tts:'sys';
  const rs=$('call-rate');if(rs){rs.value=String(cs.rate||1);if(rs.value!==String(cs.rate||1))rs.value='1'}
  if($('call-ep'))$('call-ep').value=cs.ep||'';
  if($('call-key'))$('call-key').value=cs.key||'';
  if($('call-model'))$('call-model').value=cs.model||'';
  if($('call-voice'))$('call-voice').value=cs.voice||'';
  if($('call-gid'))$('call-gid').value=cs.gid||'';/* v138-c：① */
  const lg9=$('call-lang');if(lg9){lg9.value=cs.lang||'';if(lg9.value!==(cs.lang||''))lg9.value=''}/* v138-c：③ */
  _ibcCloudVis();_ibcFillVoices();
})().catch(function(){})})}catch(e){}
try{if('speechSynthesis' in window&&speechSynthesis.addEventListener)speechSynthesis.addEventListener('voiceschanged',_ibcFillVoices)}catch(e){}
try{var _co=$('call-on');if(_co)_co.addEventListener('click',async function(){await loadCALL();_callS.on=_callS.on===false?true:false;sw2(_co,_callS.on);await saveCALL();toast(_callS.on?'语音通话已开启（下一条消息重建一次缓存）':'语音通话已关闭（下一条消息重建一次缓存）')})}catch(e){}
try{var _cb=$('call-barge');if(_cb)_cb.addEventListener('click',async function(){await loadCALL();_callS.bargein=_callS.bargein===false?true:false;sw2(_cb,_callS.bargein);await saveCALL()})}catch(e){}
try{var _chb=$('call-hb');if(_chb)_chb.addEventListener('click',async function(){await loadCALL();_callS.hb=_callS.hb===true?false:true;sw2(_chb,_callS.hb===true);await saveCALL();toast(_callS.hb?'通话心跳已开启（下一通电话生效，不影响提示缓存）':'通话心跳已关闭')})}catch(e){}/* v174：①通话心跳开关 */
try{var _chs=$('call-hbsec');if(_chs)_chs.addEventListener('change',async function(e2){await loadCALL();_callS.hbSec=Math.max(20,Math.min(600,parseInt(e2.target.value)||45));await saveCALL()})}catch(e){}/* v174：①心跳间隔 */
try{var _clm=$('call-lyrme');if(_clm)_clm.addEventListener('click',async function(){await loadCALL();_callS.lyrMe=_callS.lyrMe===false?true:false;sw2(_clm,_callS.lyrMe!==false);await saveCALL();toast(_callS.lyrMe===false?'通话字幕将只显示 TA 的话（下一通电话生效）':'通话字幕恢复双方都显示（下一通电话生效）')})}catch(e){}/* 手机端：#6 */
try{var _cvf=$('call-vidface');if(_cvf)_cvf.addEventListener('change',async function(e2){await loadCALL();_callS.vidFace=(e2.target.value==='env')?'env':'user';await saveCALL()})}catch(e){}/* 手机端 */
try{var _cvs=$('call-vidsee');if(_cvs)_cvs.addEventListener('change',async function(e2){await loadCALL();var vv=e2.target.value;_callS.vidSee=({off:1,turn:1,'30':1,'60':1}[vv])?vv:'off';await saveCALL()})}catch(e){}
try{var _cvp=$('call-vidsnap');if(_cvp)_cvp.addEventListener('click',async function(){await loadCALL();_callS.vidSnap=_callS.vidSnap===false?true:false;sw2(_cvp,_callS.vidSnap!==false);await saveCALL()})}catch(e){}
try{var _cvg=$('call-vidgift');if(_cvg)_cvg.addEventListener('click',async function(){await loadCALL();_callS.vidGift=_callS.vidGift===true?false:true;sw2(_cvg,_callS.vidGift===true);await saveCALL();toast(_callS.vidGift?'礼物系统已开启（只在视频通话里生效）':'礼物系统已关闭')})}catch(e){}/* 手机端→手机端 */
try{var _cvt=$('call-vidtts');if(_cvt)_cvt.addEventListener('change',async function(e2){await loadCALL();_callS.vidTts=(e2.target.value==='mute')?'mute':'follow';await saveCALL()})}catch(e){}
try{var _cvi=$('call-vidin');if(_cvi)_cvi.addEventListener('change',async function(e2){await loadCALL();_callS.vidIn=(e2.target.value==='type')?'type':'follow';await saveCALL()})}catch(e){}/* 手机端 */
try{var _cvq=$('call-vidq');if(_cvq)_cvq.addEventListener('change',async function(e2){await loadCALL();var q=e2.target.value;_callS.vidQ=(q==='l'||q==='h')?q:'m';await saveCALL()})}catch(e){}/* 手机端 */
try{var _ct=$('call-tts');if(_ct)_ct.addEventListener('change',async function(e2){await loadCALL();_callS.tts=e2.target.value;_ibcCloudVis();await saveCALL()})}catch(e){}
try{var _cr=$('call-rate');if(_cr)_cr.addEventListener('change',async function(e2){await loadCALL();_callS.rate=Math.max(0.5,Math.min(2,parseFloat(e2.target.value)||1));await saveCALL()})}catch(e){}
try{var _cv=$('call-sysvoice');if(_cv)_cv.addEventListener('change',async function(e2){await loadCALL();_callS.sysVoice=e2.target.value||'';await saveCALL()})}catch(e){}
try{var _cp9=$('call-prov');if(_cp9)_cp9.addEventListener('change',async function(e2){await loadCALL();_callS.provider=e2.target.value||'oai';_ibcCloudVis();await saveCALL()})}catch(e){}/* v138-c：①服务商切换 */
try{var _vk9=$('call-vkeep');if(_vk9)_vk9.addEventListener('change',async function(e2){await loadCALL();_callS.voiceKeep=(e2.target.value==='off')?'off':'';await saveCALL();toast(e2.target.value==='off'?'已关闭通话语音留档':'已开启通话语音留档：云端音色每句话都会留成语音条')})}catch(e){}/* 本轮：语音留档开关 */
try{var _cl9=$('call-lang');if(_cl9)_cl9.addEventListener('change',async function(e2){await loadCALL();_callS.lang=e2.target.value||'';await saveCALL();toast(_callS.lang?'已开启外语朗读（下一条消息重建一次提示缓存）':'已恢复中文朗读（下一条消息重建一次提示缓存）')})}catch(e){}/* v138-c：③朗读语言 */
try{['call-ep','call-key','call-model','call-voice','call-gid'].forEach(function(id){
  var el=$(id);if(!el)return;
  el.addEventListener('change',async function(e2){await loadCALL();
    var k=id==='call-ep'?'ep':(id==='call-key'?'key':(id==='call-model'?'model':(id==='call-gid'?'gid':'voice')));
    _callS[k]=String(e2.target.value||'').trim();await saveCALL()});
})}catch(e){}
try{var _psf=$('call-preset-sf');if(_psf)_psf.addEventListener('click',async function(){
  await loadCALL();
  _callS.provider='oai';_callS.ep='https://api.siliconflow.cn/v1';_callS.model='FunAudioLLM/CosyVoice2-0.5B';_callS.voice='FunAudioLLM/CosyVoice2-0.5B:anna';
  if($('call-ep'))$('call-ep').value=_callS.ep;if($('call-model'))$('call-model').value=_callS.model;if($('call-voice'))$('call-voice').value=_callS.voice;_ibcCloudVis();
  await saveCALL();var ck=$('call-key');if(ck&&!ck.value){try{ck.focus()}catch(e){}}
  toast('已填入 SiliconFlow 的 CosyVoice2 示例，补上你的 Key 即可（音色可换 :alex/:bella/:anna 等）');
})}catch(e){}
try{var _poa=$('call-preset-oa');if(_poa)_poa.addEventListener('click',async function(){
  await loadCALL();
  _callS.provider='oai';_callS.ep='https://api.openai.com/v1';_callS.model='gpt-4o-mini-tts';_callS.voice='alloy';
  if($('call-ep'))$('call-ep').value=_callS.ep;if($('call-model'))$('call-model').value=_callS.model;if($('call-voice'))$('call-voice').value=_callS.voice;_ibcCloudVis();
  await saveCALL();var ck2=$('call-key');if(ck2&&!ck2.value){try{ck2.focus()}catch(e){}}
  toast('已填入 OpenAI tts 示例，补上你的 Key 即可');
})}catch(e){}
try{var _psv=$('call-preset-sv');if(_psv)_psv.addEventListener('click',async function(){
  await loadCALL();
  _callS.provider='oai';_callS.model='tts-1';_callS.voice='';
  if($('call-model'))$('call-model').value=_callS.model;if($('call-voice'))$('call-voice').value=_callS.voice;
  _ibcCloudVis();await saveCALL();
  var ce=$('call-ep');if(ce){ce.placeholder='http://电脑IP:9880/v1（你的 GPT-SoVITS 网关地址）';try{ce.focus()}catch(e){}}
  toast('GPT-SoVITS 走「OpenAI 兼容网关」：在电脑上跑一个兼容 /v1/audio/speech 的转发（社区有现成项目），把它的地址填进 Endpoint；手机要能访问到它（同一局域网或做了穿透），模型 / 音色按你网关的要求填');
})}catch(e){}/* v138-c：①GPT-SoVITS 网关示例（本质仍是 OpenAI 兼容） */
try{var _cts=$('call-test');if(_cts)_cts.addEventListener('click',function(){IBCALL.test()})}catch(e){}

async function _ibcListFetch(){
  const btn=$('call-list-fetch'),wrap=$('call-list-wrap'),sel=$('call-list'),hint=$('call-list-hint');if(!btn||!sel||!wrap||!hint)return;
  await loadCALL();const pv=_callS.provider||'oai',key=String($('call-key')&&$('call-key').value||_callS.key||'').trim(),ep=String($('call-ep')&&$('call-ep').value||_callS.ep||'').trim();
  const show=function(items,note){sel.innerHTML='<option value="">— 选中即填入 —</option>'+items.map(function(it){return '<option value="'+esc(it.v)+'">'+esc(it.t)+'</option>'}).join('');wrap.style.display='';hint.style.display='';hint.textContent=note||''};
  const fail=function(msg){wrap.style.display='none';hint.style.display='';hint.textContent=msg};
  btn.disabled=true;btn.textContent='拉取中…';
  try{
    if(pv==='ali'){show([{v:'m:qwen-tts',t:'模型 · qwen-tts（默认）'},{v:'m:qwen-tts-latest',t:'模型 · qwen-tts-latest'},{v:'v:Cherry',t:'音色 · Cherry（默认）'},{v:'v:Serena',t:'音色 · Serena'},{v:'v:Ethan',t:'音色 · Ethan'},{v:'v:Chelsie',t:'音色 · Chelsie'}],'阿里云这条通道只有 Qwen-TTS 系列，官方没有可拉取的列表，这是内置清单；CosyVoice 系列在此通道不可用，要它的声音去 SiliconFlow。');return}
    if(pv==='mm'){show([{v:'m:speech-02-turbo',t:'模型 · speech-02-turbo（默认）'},{v:'m:speech-02-hd',t:'模型 · speech-02-hd'},{v:'m:speech-01-turbo',t:'模型 · speech-01-turbo'},{v:'v:female-shaonv',t:'音色 · female-shaonv（默认）'},{v:'v:female-yujie',t:'音色 · female-yujie'},{v:'v:female-tianmei',t:'音色 · female-tianmei'},{v:'v:male-qn-qingse',t:'音色 · male-qn-qingse'},{v:'v:male-qn-jingying',t:'音色 · male-qn-jingying'},{v:'v:presenter_male',t:'音色 · presenter_male'},{v:'v:audiobook_female_1',t:'音色 · audiobook_female_1'}],'MiniMax 官方没有可拉取的列表，这是常用系统音色的内置清单；自己克隆的音色 ID 直接手输到「音色」。');return}
    if(pv==='el'){if(!key)throw new Error('先填 API Key');let base=ep.replace(/\/+$/,'')||'https://api.elevenlabs.io';if(!/\/v\d+$/i.test(base))base+='/v1';const r=await fetch(base+'/voices',{headers:{'xi-api-key':key}});if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();const vs=((j&&j.voices)||[]).map(function(v){return {v:'v:'+v.voice_id,t:'音色 · '+(v.name||v.voice_id)+(v.category?'（'+v.category+'）':'')}});show(vs.concat([{v:'m:eleven_multilingual_v2',t:'模型 · eleven_multilingual_v2（默认）'},{v:'m:eleven_flash_v2_5',t:'模型 · eleven_flash_v2_5'},{v:'m:eleven_turbo_v2_5',t:'模型 · eleven_turbo_v2_5'}]),'共 '+vs.length+' 个音色，选中自动填 voice_id；模型按需选。');return}
    if(pv==='az'){if(!key)throw new Error('先填密钥');let base=ep.replace(/\/+$/,'');if(!base)throw new Error('先在 Endpoint 填区域端点');base=base.replace(/\/cognitiveservices\/v1$/i,'');const r=await fetch(base+'/cognitiveservices/voices/list',{headers:{'Ocp-Apim-Subscription-Key':key}});if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();const vs=(Array.isArray(j)?j:[]).filter(function(v){return v&&v.ShortName}).sort(function(a,b){var az=/^zh-/i.test(a.Locale)?0:1,bz=/^zh-/i.test(b.Locale)?0:1;return az-bz||String(a.ShortName).localeCompare(String(b.ShortName))}).map(function(v){return {v:'v:'+v.ShortName,t:'音色 · '+v.ShortName+(v.LocalName?'（'+v.LocalName+'）':'')}});show(vs,'共 '+vs.length+' 个音色，中文排前；选中自动填入「音色」。');return}
    if(!key)throw new Error('先填 API Key');
    const cands=(typeof _modelListReqCustom==='function'?_modelListReqCustom(ep||'https://api.siliconflow.cn/v1',key):[]).filter(function(c){return c.kind==='openai'});
    let list=null;
    for(let i=0;i<cands.length&&!list;i++){const c=cands[i];try{const ac=new AbortController();const tm=setTimeout(function(){ac.abort()},7000);const r=await fetch(c.url,{headers:c.headers,signal:ac.signal});clearTimeout(tm);if(!r.ok)continue;const j=await r.json();const L=_modelListParse('openai',j);if(L.length)list=L}catch(e){}}
    if(!list)throw new Error('没有拿到模型列表');
    const tts=list.filter(function(m){return /tts|speech|voice|cosy|sovits|fish|sambert|chattts|melo|kokoro|audio/i.test(m.id)});
    const use=tts.length?tts:list;
    show(use.map(function(m){return {v:'m:'+m.id,t:'模型 · '+m.id}}),(tts.length?'只列出语音合成类模型（'+tts.length+' 个）':'接口没标出语音模型，列出全部 '+list.length+' 个')+'；选中自动填入「模型」。音色各家没有统一列表：SiliconFlow 系统音色 alex / anna / bella / benjamin / charles / claire / david / diana，写法「模型名:音色名」。');
  }catch(e){fail('拉取失败：'+String(e&&e.message||e).slice(0,80)+'。不影响使用，按 GUIDE「云端音色怎么填」手填即可。')}
  finally{btn.disabled=false;btn.textContent='拉取模型 / 音色列表'}
}
try{var _clf=$('call-list-fetch');if(_clf)_clf.addEventListener('click',function(){_ibcListFetch().catch(function(){})})}catch(e){}
try{var _cls=$('call-list');if(_cls)_cls.addEventListener('change',async function(){const v=String(_cls.value||'');if(!v)return;await loadCALL();
  if(v.indexOf('m:')===0){_callS.model=v.slice(2);if($('call-model'))$('call-model').value=_callS.model;
    try{if(/siliconflow/i.test(String(_callS.ep||''))){const vo=String(_callS.voice||'');const mm=vo.match(/^(.+):([^:]+)$/);_callS.voice=mm?(_callS.model+':'+mm[2]):(vo?vo:(_callS.model+':anna'));if($('call-voice'))$('call-voice').value=_callS.voice}}catch(e){}/* SiliconFlow 音色写法「模型:音色」，换模型时前半段跟着对齐 */
  }else if(v.indexOf('v:')===0){_callS.voice=v.slice(2);if($('call-voice'))$('call-voice').value=_callS.voice}
  await saveCALL();toast('已填入'+(v.indexOf('m:')===0?'模型':'音色')+'，点「试听一句」验证');_cls.value=''})}catch(e){}

var _ibcsBuilt=false,_ibcsSty=false,_ibcsVoiceOpts='<option value="">自动（跟随系统）</option>',_ibcsTab='g',_ibcsDetC=null;
function _ibcsStyle(){
  if(_ibcsSty)return;_ibcsSty=true;
  
  try{const st9=document.createElement('style');st9.id='ibcs-style';st9.textContent=''
  +'#ib-callset[hidden]{display:none}'
  +'#ib-callset .ibcs-wrap{max-width:640px;margin:0 auto}'
  /* ── 顶栏：悬浮玻璃胶囊（#topbar 同规格：8px+安全区悬浮、17px 圆角、玻璃模糊、居中标题） ── */
  +'#ib-callset .ov2-head{flex:none;display:flex;align-items:center;gap:6px;margin:calc(8px + var(--sat,0px)) 10px 0;padding:0 8px;height:50px;border-radius:17px;border:1px solid var(--glass-line);background:var(--glass);backdrop-filter:blur(20px) saturate(1.55);-webkit-backdrop-filter:blur(20px) saturate(1.55);box-shadow:var(--glass-shadow)}'
  +'#ib-callset .ov2-tt{flex:1;min-width:0;text-align:center;font-family:var(--disp);font-weight:400;font-size:0.92rem;letter-spacing:0.14em;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  +'#ib-callset .ov2-tt small{display:block;font-weight:400;font-size:0.56rem;letter-spacing:0.12em;color:var(--tx3);margin-top:1px}'
  +'#ib-callset .ov2-x{flex:none;width:34px;height:34px;border-radius:50%;border:1px solid var(--glass-line);background:var(--panel);font-size:0.9rem;color:var(--tx2);line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;box-shadow:0 2px 8px rgba(90,120,170,0.12)}'
  +'#ib-callset .ibcs-hsp{flex:none;width:34px}'
  +'#ib-callset .ov2-body{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:16px 14px calc(86px + var(--sab,0px))}'
  +'#ib-callset.det .ov2-body{padding-bottom:calc(24px + var(--sab,0px))}'
  /* ── 页首 lede 与分区标签 ── */
  +'#ib-callset .pg-hero{padding:4px 2px 12px}'
  +'#ib-callset .sec-label{margin:18px 6px 10px}'
  +'#ib-callset #ibcs-global>.sec-label:first-child{margin-top:10px}'
  +'#ib-callset .ov2-hint{font-size:0.72rem;line-height:1.7;color:var(--tx3);margin:12px 4px 0}'
  /* ── 设置卡：沿用全站 .card + .fx-card 底图 LOGO，加一层有界玻璃 ── */
  +'#ib-callset .card{margin-bottom:12px;backdrop-filter:blur(16px) saturate(1.3);-webkit-backdrop-filter:blur(16px) saturate(1.3)}'
  /* ── 底部页签坞：悬浮玻璃胶囊（#dock 同规格：12px 边距、20px 圆角、图标+小字纵排、命中强调色） ── */
  +'#ib-callset .ibcs-tabs{position:absolute;left:12px;right:12px;bottom:calc(10px + var(--sab,0px));height:58px;border-radius:20px;display:flex;align-items:stretch;padding:0 4px;background:var(--glass);border:1px solid var(--glass-line);backdrop-filter:blur(20px) saturate(1.55);-webkit-backdrop-filter:blur(20px) saturate(1.55);box-shadow:var(--glass-shadow);z-index:4}'
  +'#ib-callset .ibcs-tabs button{flex:1;min-width:0;border:none;background:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#16325e;font-size:0.6rem;letter-spacing:0.06em;cursor:pointer;-webkit-tap-highlight-color:transparent;padding:0}'
  +'body.theme-infernal #ib-callset .ibcs-tabs button{color:#dce7f8}'
  +'#ib-callset .ibcs-tabs button svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1.5px 3px rgba(42,107,176,0.38))}'
  +'#ib-callset .ibcs-tabs button.on{color:var(--acc);font-weight:600}'
  +'#ib-callset .ibcs-tabs button.on svg{filter:drop-shadow(0 1.5px 4px rgba(42,107,176,0.5))}'
  +'#ib-callset.det .ibcs-tabs{display:none}'/* 详情页占满时底坞让位 */
  +'#ib-callset .ibcs-pane[hidden]{display:none}'
  
  +'#ib-callset .ibcs-row{display:flex;align-items:center;gap:11px;border:1px solid var(--glass-line);background:var(--glass);backdrop-filter:blur(14px) saturate(1.35);-webkit-backdrop-filter:blur(14px) saturate(1.35);border-radius:16px;padding:12px 13px;margin-bottom:10px;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:box-shadow 0.4s,transform 0.25s;box-shadow:0 4px 16px rgba(90,120,170,0.1)}'
  +'#ib-callset .ibcs-row:active{transform:scale(0.985)}'
  +'#ib-callset .ibcs-ava{flex:none;width:42px;height:42px;border-radius:50%;overflow:hidden;background:#cdd9ec;display:flex;align-items:center;justify-content:center;font-weight:700;color:#4a6288;box-shadow:0 0 0 2px rgba(255,255,255,0.55),0 2px 8px rgba(90,120,170,0.22)}'
  +'body.theme-infernal #ib-callset .ibcs-ava{box-shadow:0 0 0 2px rgba(150,185,230,0.28),0 2px 8px rgba(0,0,0,0.4)}'
  +'#ib-callset .ibcs-ava img{width:100%;height:100%;object-fit:cover}'
  +'#ib-callset .ibcs-mm{flex:1;min-width:0}'
  +'#ib-callset .ibcs-nm{font-weight:700;font-size:0.92rem;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  +'#ib-callset .ibcs-md{font-size:0.66rem;color:var(--tx3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px}'
  +'#ib-callset .ibcs-chips{flex:none;display:flex;gap:5px;align-items:center}'
  +'#ib-callset .ibcs-chip{font-size:0.6rem;padding:3px 8px;border-radius:999px;border:1px solid var(--panel-line);background:var(--panel);color:var(--tx3);white-space:nowrap}'
  +'#ib-callset .ibcs-chip.acc{border-color:rgba(114,168,216,0.55);color:var(--acc);font-weight:700;box-shadow:0 0 10px rgba(114,168,216,0.2) inset}'
  +'#ib-callset .ibcs-arrow{flex:none;width:16px;height:16px;opacity:0.4;color:var(--tx2)}'
  +'#ib-callset .ibcs-arrow svg{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
  +'#ib-callset .ibcs-row.flash{box-shadow:0 0 0 2px var(--acc),0 4px 16px rgba(90,120,170,0.1)}'
  /* ── 详情页：资料头玻璃带＋返回键 ── */
  +'#ib-callset .ibcs-dethd{display:flex;align-items:center;gap:12px;margin:4px 0 14px;padding:12px 13px;border-radius:18px;border:1px solid var(--glass-line);background:var(--glass);backdrop-filter:blur(16px) saturate(1.4);-webkit-backdrop-filter:blur(16px) saturate(1.4);box-shadow:0 4px 16px rgba(90,120,170,0.1)}'
  +'#ib-callset .ibcs-dethd .ibcs-ava{width:52px;height:52px}'
  +'#ib-callset .ibcs-dethd .ibcs-nm{font-size:1.02rem}'
  +'#ib-callset .ibcs-back{flex:none;width:36px;height:36px;border-radius:50%;border:1px solid var(--glass-line);background:var(--panel);color:var(--tx2);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;-webkit-tap-highlight-color:transparent;box-shadow:0 2px 8px rgba(90,120,170,0.12)}'
  +'#ib-callset .ibcs-back svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
  /* ── 跟随全局/单独配置：分段胶囊 ── */
  +'#ib-callset .ibcs-seg{display:flex;gap:4px;border:1px solid var(--panel-line);background:var(--panel);border-radius:14px;padding:4px;margin-bottom:12px}'
  +'#ib-callset .ibcs-seg button{flex:1;border:none;background:none;color:var(--tx2);font-size:0.8rem;padding:9px 0;border-radius:10px;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background 0.25s,color 0.25s}'
  +'#ib-callset .ibcs-seg button.on{background:var(--acc);color:#fff;font-weight:700;box-shadow:0 3px 10px rgba(74,109,168,0.35)}'
  +'body.theme-infernal #ib-callset .ibcs-seg button.on{color:#0d1830;box-shadow:0 3px 12px rgba(147,184,236,0.3)}'
  ;document.head.appendChild(st9)}catch(e){}
}
function _ibcsBuild(){
  if(_ibcsBuilt)return true;
  _ibcsStyle();
  try{
    const ov=document.createElement('div');ov.id='ib-callset';ov.className='ib-ov2';ov.hidden=true;
    ov.innerHTML='<div class="ov2-head"><button class="ov2-x" id="ibcs-x" aria-label="关闭">✕</button><div class="ov2-tt" id="ibcs-tt">全局通话配置<small>GLOBAL CALL</small></div><div class="ibcs-hsp" aria-hidden="true"></div></div>'
     +'<div class="ov2-body"><div class="ibcs-wrap">'
     +'<div class="ibcs-pane" id="ibcs-pane-g">'
       +'<div class="pg-hero"><div class="ph-title">Call<span class="ph-cn">语音与视频通话</span></div></div>'/* 手机端：#4 双 lede 撤除，改 DIY 页同款 P2 标题头 */
       +'<div id="ibcs-global"></div><div id="ibcs-gx"></div><div id="ibcs-gv"></div>'
       +'<p class="ov2-hint">云端 Key 随 callSettings 存本机并随备份导出，注意保管备份档。</p>'
     +'</div>'
     +'<div class="ibcs-pane" id="ibcs-pane-p" hidden>'
       +'<div id="ibcs-perapi"></div>'
       +'<p class="ov2-hint">给某位 AI 改朗读语言或语音条设置后，只有 TA 的下一条消息会重建一次提示缓存，之后恢复稳定命中；全局与其他 AI 不受影响。</p>'
     +'</div>'
     +'<div class="ibcs-pane" id="ibcs-pane-d" hidden></div>'
     +'</div></div>'
     +'<div class="ibcs-tabs"><button data-t="g" class="on"><svg viewBox="0 0 24 24"><path d="M6.4 4.4v5.2M6.4 13.4v6.2M12 4.4v9.2M12 17.4v2.2M17.6 4.4v3.2M17.6 11.4v8.2"/><path d="M4.2 9.6h4.4M9.8 13.4h4.4M15.4 7.6h4.4"/></svg>全局配置</button>'
     +'<button data-t="p"><svg viewBox="0 0 24 24"><circle cx="9.2" cy="8.8" r="3.4"/><path d="M3.8 19.6a5.5 5.5 0 0 1 10.8 0"/><path d="M16.8 7.4a5 5 0 0 1 0 7.2"/><path d="M19.4 5a8.6 8.6 0 0 1 0 12"/></svg>独立配置</button></div>';
    document.body.appendChild(ov);
    ov.querySelector('#ibcs-x').addEventListener('click',closeCallSet);
    Array.prototype.forEach.call(ov.querySelectorAll('.ibcs-tabs button'),function(b){b.addEventListener('click',function(){_ibcsSwitch(b.dataset.t)})});
    const pool=$('call-card-pool');const host=ov.querySelector('#ibcs-global');
    if(pool&&host){while(pool.firstChild)host.appendChild(pool.firstChild)}/* 原卡整体搬入：监听随节点走，绑定不失效（v142 机制原样） */
    try{
      const bigCard=host.querySelector('.card');
      if(bigCard){
        const IC9={
          call:'<svg viewBox="0 0 24 24"><path d="M7 4.1c.9-.4 1.9-.1 2.4.7l1.3 2c.5.7.4 1.7-.2 2.3l-.9.9c.9 1.8 2.4 3.3 4.2 4.2l.9-.9c.6-.6 1.6-.7 2.3-.2l2 1.3c.8.5 1.1 1.5.7 2.4l-.8 1.4c-.4.8-1.3 1.3-2.2 1.1C11 18.5 5.5 13 4.6 7.1c-.2-.9.3-1.8 1.1-2.2z"/></svg>',
          voice:'<svg viewBox="0 0 24 24"><path d="M4 10.2v3.6M8 7.4v9.2M12 4.6v14.8M16 7.4v9.2M20 10.2v3.6"/></svg>',
          lang:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.3 3.9 5.1 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.1-3.9-8.5S9.4 5.8 12 3.5z"/></svg>',
          barge:'<svg viewBox="0 0 24 24"><path d="M8.4 5.5v13M15.6 5.5v13"/></svg>',hb:'<svg viewBox="0 0 24 24"><path d="M3 12h4l2.2-5 3.4 10 2.4-6.2 1.5 1.2H21"/></svg>'
        };
        const secl9=function(t){const d=document.createElement('div');d.className='sec-label';d.textContent=t;return d};
        const mkfx9=function(ic){const c=document.createElement('div');c.className='card fx-card';c.innerHTML='<div class="fx-ico">'+ic+'</div>';return c};
        const grab9=function(id,up){const el=bigCard.querySelector('#'+id);return el?(up?el.closest(up):el):null};
        const onTog=grab9('call-on','.tog');
        const lyrmeTog=grab9('call-lyrme','.tog');/* 手机端：#6 新 tog 显式入「通话」卡 */
        let hintP=null;{let n9=onTog&&onTog.nextElementSibling;if(n9&&lyrmeTog&&n9===lyrmeTog)n9=n9.nextElementSibling;if(n9&&n9.classList&&n9.classList.contains('hint'))hintP=n9}
        const ttsG=grab9('call-tts','.f-group');
        const sysvG=grab9('call-sysv-g',null);
        const cloudG=grab9('call-cloud-g',null);
        const langG=grab9('call-lang','.f-group');
        const rateRow=grab9('call-rate','.f-row');
        const bargeTog=grab9('call-barge','.tog');const hbTog=grab9('call-hb','.tog'),hbG=grab9('call-hb-g',null);/* 手机端：通话心跳拆出独立卡 */
        const vidFaceG=grab9('call-vidface','.f-group'),vidSeeG=grab9('call-vidsee','.f-group'),vidTtsG=grab9('call-vidtts','.f-group'),vidInG=grab9('call-vidin','.f-group'),vidQG=grab9('call-vidq','.f-group'),vidSnapT=grab9('call-vidsnap','.tog'),vidGiftT=grab9('call-vidgift','.tog'),vidHintP=grab9('call-vid-hint',null);/* 手机端：视频设置从语音卡里拆出来 */
        if(onTog&&ttsG&&langG&&rateRow&&bargeTog){
          const frag=document.createDocumentFragment();
          const c1=mkfx9(IC9.call);c1.appendChild(onTog);if(lyrmeTog)c1.appendChild(lyrmeTog);if(hintP)c1.appendChild(hintP);
          const c2=mkfx9(IC9.voice);c2.appendChild(ttsG);if(sysvG)c2.appendChild(sysvG);if(cloudG)c2.appendChild(cloudG);
          const c3=mkfx9(IC9.lang);c3.appendChild(langG);c3.appendChild(rateRow);
          const c4=mkfx9(IC9.barge);c4.appendChild(bargeTog);const c6=mkfx9(IC9.hb);if(hbTog)c6.appendChild(hbTog);if(hbG)c6.appendChild(hbG);
          const c5=mkfx9('<svg viewBox="0 0 24 24"><rect x="3" y="6.5" width="13" height="11" rx="2.4"/><path d="M16 10.6l5-2.9v8.6l-5-2.9z"/></svg>');
          [vidFaceG,vidSeeG,vidQG,vidTtsG,vidInG,vidSnapT,vidGiftT,vidHintP].forEach(function(n9){if(n9)c5.appendChild(n9)});/* 手机端：先摘走视频件，剩余才落进 c4 */
          while(bigCard.firstChild)c4.appendChild(bigCard.firstChild);
          var gn9=document.createElement('p');gn9.className='ov2-hint';gn9.style.cssText='margin:0 6px -6px';gn9.textContent='以下各项语音与视频通话共用；视频通话专属项在本页末尾。';frag.appendChild(gn9);/* 手机端 */frag.appendChild(secl9('通话'));frag.appendChild(c1);
          frag.appendChild(secl9('TA 的声音'));frag.appendChild(c2);
          frag.appendChild(secl9('朗读语言与语速'));frag.appendChild(c3);
          frag.appendChild(secl9('语音打断'));frag.appendChild(c4);if(c6.childElementCount>1){frag.appendChild(secl9('通话心跳'));frag.appendChild(c6)}/* 手机端 */
          if(c5.childElementCount>1){var gv9=ov.querySelector('#ibcs-gv')||null;(gv9||frag).appendChild(secl9('视频通话专属'));(gv9||frag).appendChild(c5)}/* 手机端：挪到全局页末尾、改名「专属」；手机端 */
          host.appendChild(frag);
          bigCard.remove();
        }
      }
    }catch(e){}
    try{/* 手机端：#1 全局音量（新增；每 AI 可覆盖） */
      const gx=ov.querySelector('#ibcs-gx');
      gx.innerHTML='<div class="sec-label">全局音量</div><div class="card fx-card"><div class="fx-ico"><svg viewBox="0 0 24 24"><path d="M4.5 10v4h3.6l4.9 3.8V6.2L8.1 10z"/><path d="M16.2 9.2a4.2 4.2 0 0 1 0 5.6M18.8 6.8a7.6 7.6 0 0 1 0 10.4"/></svg></div><div class="f-group" style="margin-bottom:0"><label>音量档位</label><div class="sel"><select id="ibcs-gvol"><option value="1">100%（默认）</option><option value="0.8">80%</option><option value="0.6">60%</option><option value="0.4">40%</option></select></div><p class="hint" style="margin:6px 0 0">对通话朗读、试听与语音条统一生效；每位 AI 可在「独立配置」里单独调。</p></div></div>';/* 手机端：#3 音量卡随 fx 精致卡规格；id 与既有监听不变 */
      gx.querySelector('#ibcs-gvol').addEventListener('change',async function(e2){await loadCALL();_callS.vol=Math.max(0.1,Math.min(1,parseFloat(e2.target.value)||1));await saveCALL()});
    }catch(e){}
    _ibcsBuilt=true;return true;
  }catch(e){_ibcsBuilt=false;return false}
}
function _ibcsSwitch(t){
  const ov=$('ib-callset');if(!ov)return;_ibcsTab=(t==='p')?'p':'g';
  _ibcsCloseDetail(true);
  ov.querySelector('#ibcs-pane-g').hidden=_ibcsTab!=='g';
  ov.querySelector('#ibcs-pane-p').hidden=_ibcsTab!=='p';
  Array.prototype.forEach.call(ov.querySelectorAll('.ibcs-tabs button'),function(b){b.classList.toggle('on',b.dataset.t===_ibcsTab)});
  try{var tt9=ov.querySelector('#ibcs-tt');if(tt9)tt9.innerHTML=(_ibcsTab==='p')?'独立通话配置<small>PER-AI CALL</small>':'全局通话配置<small>GLOBAL CALL</small>'}catch(e){}/* 手机端：#4 顶栏胶囊随页签双语切换 */
  try{ov.querySelector('.ov2-body').scrollTop=0}catch(e){}
}
function closeCallSet(){try{_ibcsCloseDetail(true);const ov=$('ib-callset');if(ov)ov.hidden=true}catch(e){}}
function openCallSet(fid){
  if(!_ibcsBuild()){toast('通话设置初始化失败');return}
  const ov=$('ib-callset');if(!ov)return;
  try{if(ov.classList.contains('ibcs-page')||ov.parentNode!==document.body){ov.classList.remove('ibcs-page');document.body.appendChild(ov)}}catch(e){}/* 全屏面板模式：若正挂在 Voice 页里则搬回 body（Voice 页再次打开时会重新搬入） */
  ov.hidden=false;
  (async function(){
    try{
      await loadCALL();await loadCfgs();_ibcsFillVoiceSel();
      try{const gv=ov.querySelector('#ibcs-gvol');if(gv){gv.value=String(_callS.vol||1);if(gv.value!==String(_callS.vol||1))gv.value='1'}}catch(e){}
      _ibcsRenderPerApi('');
      if(fid){const c9=(_cfgs||[]).find(function(x){return x&&x.id===fid&&!x._group});_ibcsSwitch('p');if(c9)_ibcsOpenDetail(c9)}/* 手机端：#1 抽屉入口带 fid 直达该 AI 详情页 */
      else _ibcsSwitch(_ibcsTab||'g');
    }catch(e){}
  })();
}
function _ibcsFillVoiceSel(){
  try{
    if(!('speechSynthesis' in window))return;
    const vs=(speechSynthesis.getVoices()||[]).slice();
    vs.sort(function(a,b){const az=/zh|cmn|中/i.test(String(a.lang)+String(a.name))?0:1;const bz=/zh|cmn|中/i.test(String(b.lang)+String(b.name))?0:1;return az-bz||String(a.name).localeCompare(String(b.name))});
    let h='<option value="">自动（跟随系统）</option>';
    for(let i=0;i<vs.length;i++){const v=vs[i];if(!v)continue;const val=v.voiceURI||v.name;h+='<option value="'+esc(val)+'">'+esc(String(v.name||'')+' · '+String(v.lang||''))+'</option>'}
    _ibcsVoiceOpts=h;
  }catch(e){}
}
function _ibcsP(fid){_callS.perApi=_callS.perApi||{};let p=_callS.perApi[fid];if(!p){p={use:0};_callS.perApi[fid]=p}return p}
async function _ibcsSetUse(fid,use){
  await loadCALL();const p=_ibcsP(fid);
  if(use&&!p._init){/* 首次切单独配置：拷贝当前全局做起点，改起来不用从零填 */
    const g9=_callS;
    p.tts=(g9.tts==='cloud'||g9.tts==='off')?g9.tts:'sys';p.sysVoice=g9.sysVoice||'';p.provider=g9.provider||'oai';
    p.ep=g9.ep||'';p.key=g9.key||'';p.gid=g9.gid||'';p.model=g9.model||'';p.voice=g9.voice||'';p.rate=g9.rate||1;p.lang=g9.lang||'';p.vol=(g9.vol!=null?g9.vol:1);p._init=1;/* 手机端：#1 +vol */
  }
  p.use=use?1:0;await saveCALL();
}
function _ibcsRenderPerApi(selFid){
  const host=document.querySelector('#ib-callset #ibcs-perapi');if(!host)return;
  host.innerHTML='';
  const list=(_cfgs||[]).filter(function(c){return c&&!c._group});
  if(!list.length){host.innerHTML='<div class="empty" style="padding:14px">还没有 API 配置（到 API 页添加后这里会列出）</div>';return}
  list.forEach(function(c){
    const p0=(_callS.perApi&&_callS.perApi[c.id])||null;const on=!!(p0&&p0.use);const vb=!!(p0&&p0.vbOn);
    const row=document.createElement('div');row.className='ibcs-row';row.dataset.fid=c.id;
    const av=_pfAvatar(c);
    row.innerHTML='<div class="ibcs-ava">'+(av?'<img src="'+esc(av)+'" alt="">':esc((cfgName(c)||'?').charAt(0).toUpperCase()))+'</div>'
      +'<div class="ibcs-mm"><div class="ibcs-nm">'+esc(cfgName(c))+'</div><div class="ibcs-md">'+esc(provLabel(c))+'</div></div>'
      +'<div class="ibcs-chips">'+(on?'<span class="ibcs-chip acc">已单独配置</span>':'<span class="ibcs-chip">跟随全局</span>')+(vb?'<span class="ibcs-chip acc">语音条</span>':'')+'</div>'
      +'<span class="ibcs-arrow"><svg viewBox="0 0 16 16"><path d="M6 3.5 10.5 8 6 12.5"/></svg></span>';
    row.addEventListener('click',function(){_ibcsOpenDetail(c)});
    host.appendChild(row);
  });
  if(selFid){try{const r9=host.querySelector('.ibcs-row[data-fid="'+selFid+'"]');if(r9)r9.classList.add('flash');setTimeout(function(){try{r9&&r9.classList.remove('flash')}catch(e){}},2400)}catch(e){}}
}
function _ibcsCloseDetail(silent){
  const ov=$('ib-callset');if(!ov)return;
  const d=ov.querySelector('#ibcs-pane-d');if(!d)return;
  if(d.hidden&&!ov.classList.contains('det'))return;
  d.hidden=true;d.innerHTML='';ov.classList.remove('det');_ibcsDetC=null;
  if(!silent){ov.querySelector('#ibcs-pane-p').hidden=false;_ibcsRenderPerApi('');try{ov.querySelector('.ov2-body').scrollTop=0}catch(e){}}
}
function _ibcsOpenDetail(c){/* 手机端：#1 每 AI 独立配置详情页（返回键回列表，底栏随详情隐藏） */
  const ov=$('ib-callset');if(!ov||!c)return;_ibcsDetC=c;
  ov.classList.add('det');
  ov.querySelector('#ibcs-pane-g').hidden=true;ov.querySelector('#ibcs-pane-p').hidden=true;
  const d=ov.querySelector('#ibcs-pane-d');d.hidden=false;
  const av=_pfAvatar(c);
  d.innerHTML='<div class="ibcs-dethd"><button class="ibcs-back" type="button" aria-label="返回列表"><svg viewBox="0 0 16 16"><path d="M10 3.5 5.5 8 10 12.5"/></svg></button>'
    +'<div class="ibcs-ava">'+(av?'<img src="'+esc(av)+'" alt="">':esc((cfgName(c)||'?').charAt(0).toUpperCase()))+'</div>'
    +'<div class="ibcs-mm"><div class="ibcs-nm">'+esc(cfgName(c))+'</div><div class="ibcs-md">'+esc(provLabel(c))+'</div></div></div>'
    +'<div class="sec-label">声音 · 通话与语音条共用</div>'
    +'<div class="card fx-card"><div class="fx-ico"><svg viewBox="0 0 24 24"><path d="M4 10.2v3.6M8 7.4v9.2M12 4.6v14.8M16 7.4v9.2M20 10.2v3.6"/></svg></div><div class="ibcs-seg" id="ibcs-d-seg"><button type="button" data-u="0">跟随全局</button><button type="button" data-u="1">单独配置</button></div><div id="ibcs-d-voice"></div></div>'
    +'<div class="sec-label">TA 的开关</div>'
    +'<div class="card fx-card"><div id="ibcs-d-vb"></div><div id="ibcs-d-pc"></div><div id="ibcs-d-rec"></div></div>'/* 手机端：②三卡合一 */
    +'<p class="ov2-hint">语音条使用 TA 当前生效的声音。改朗读语言或语音条设置后，TA 的下一条消息重建一次提示缓存。</p>';
  d.querySelector('.ibcs-back').addEventListener('click',function(){_ibcsCloseDetail(false)});
  _ibcsDetVoice(c.id);
  _ibcsDetVb(c.id);
  _ibcsDetPc(c.id);/* 手机端：#2 */
  _ibcsDetRec(c.id);/* 手机端：② */
  try{ov.querySelector('.ov2-body').scrollTop=0}catch(e){}
}
function _ibcsDetVoice(fid){
  const ov=$('ib-callset');if(!ov)return;
  const seg=ov.querySelector('#ibcs-d-seg'),hostV=ov.querySelector('#ibcs-d-voice');if(!seg||!hostV)return;
  const p0=(_callS.perApi&&_callS.perApi[fid])||null;const on=!!(p0&&p0.use);
  Array.prototype.forEach.call(seg.querySelectorAll('button'),function(b){
    b.classList.toggle('on',(b.dataset.u==='1')===on);
    b.onclick=async function(){await _ibcsSetUse(fid,b.dataset.u==='1');_ibcsDetVoice(fid)};
  });
  if(on){hostV.innerHTML='';_ibcsFillEd(hostV,fid)}
  else{
    hostV.innerHTML='<p class="hint" style="margin:10px 0 2px">正在跟随「全局配置」的声音、朗读语言与音量。切到「单独配置」可为 TA 定制音色、云端服务商、语速等。</p><button class="btn wide" type="button" id="ibcs-d-testg">试听当前生效的声音</button>';
    const tb=hostV.querySelector('#ibcs-d-testg');
    if(tb)tb.addEventListener('click',async function(){await loadCALL();try{IBCALL.test(_callEffMerge(_callS,fid))}catch(e){toast('试听不可用')}});
  }
}
function _ibcsDetVb(fid){
  const ov=$('ib-callset');if(!ov)return;const box=ov.querySelector('#ibcs-d-vb');if(!box)return;
  const p=_ibcsP(fid);
  box.innerHTML='<div class="tog"><div class="tog-m"><div class="tog-t">启用语音条</div><div class="tog-s">开启后 TA 可在消息末尾附一条可点播的语音条。切换后 TA 的下一条消息重建一次提示缓存。</div></div><div class="sw2" id="ibcs-d-vbon"></div></div>'
   +'<div class="f-group" style="margin:12px 0 0"><label>语音条语言</label><div class="sel"><select id="ibcs-d-vblang"><option value="">原声（播放消息本身）</option><option value="en">English（气泡中文，语音条英语）</option><option value="ja">日本語（气泡中文，语音条日语）</option><option value="ko">한국어（气泡中文，语音条韩语）</option></select></div></div>'
   +'<button class="btn wide" type="button" id="ibcs-d-vbtest" style="margin:10px 0 12px">试听语音条</button>';
  const sw=box.querySelector('#ibcs-d-vbon');sw2(sw,!!p.vbOn);
  sw.addEventListener('click',async function(){
    await loadCALL();const pp=_ibcsP(fid);pp.vbOn=pp.vbOn?0:1;sw2(sw,!!pp.vbOn);await saveCALL();
    toast(pp.vbOn?'语音条已开启（TA 的下一条消息重建一次缓存）':'语音条已关闭（TA 的下一条消息重建一次缓存）');
  });
  const sel=box.querySelector('#ibcs-d-vblang');
  sel.value=(p.vbLang&&{en:1,ja:1,ko:1}[p.vbLang])?p.vbLang:'';
  sel.addEventListener('change',async function(e2){
    await loadCALL();const pp=_ibcsP(fid);pp.vbLang=({en:1,ja:1,ko:1}[e2.target.value])?e2.target.value:'';await saveCALL();
    toast(pp.vbLang?'语音条改为外语版（TA 的下一条消息重建一次缓存）':'语音条恢复原声（TA 的下一条消息重建一次缓存）');
  });
  box.querySelector('#ibcs-d-vbtest').addEventListener('click',async function(){
    await loadCALL();const eff=_callEffMerge(_callS,fid);const lg=eff.vbLang||'';
    const SAMP={'':'你好呀，这就是语音条的效果。',en:'Hey, this is how the voice memo sounds.',ja:'ねえ、ボイスメッセージはこんな感じだよ。',ko:'안녕, 음성 메시지는 이런 느낌이야.'};
    try{if(window.IBVB&&IBVB.say)IBVB.say(SAMP[lg]||SAMP[''],eff,lg);else toast('语音条播放器未就绪')}catch(e){toast('试听失败')}
  });
}
function _ibcsDetPc(fid){
  const ov=$('ib-callset');if(!ov)return;const box=ov.querySelector('#ibcs-d-pc');if(!box)return;
  const p=_ibcsP(fid);
  box.innerHTML='<div class="tog"><div class="tog-m"><div class="tog-t">主动来电</div><div class="tog-s">开启后 system 增加一段说明：TA 可在回复中发起来电，屏幕上出现来电小窗，接听与否由你决定，60 秒无操作自动收起。切换后 TA 的下一条消息重建一次提示缓存。</div></div><div class="sw2" id="ibcs-d-pcon"></div></div>';
  const sw=box.querySelector('#ibcs-d-pcon');sw2(sw,!!p.procall);
  sw.addEventListener('click',async function(){
    await loadCALL();const pp=_ibcsP(fid);pp.procall=pp.procall?0:1;sw2(sw,!!pp.procall);await saveCALL();
    toast('已保存，TA 的下一条消息重建一次提示缓存');
  });
}
function _ibcsDetRec(fid){/* 手机端：②执笔 API 与自动通话记录，纯 per-API（不看 use）；手机端：②并入「TA 的开关」卡 */
  const ov=$('ib-callset');if(!ov)return;const box=ov.querySelector('#ibcs-d-rec');if(!box)return;
  const p=_ibcsP(fid);
  box.innerHTML='<div class="tog nb"><div class="tog-m"><div class="tog-t">通话结束后压缩成通话记录</div><div class="tog-s">挂断后由执笔 API 写一段 100～800 字的通话记录进入上下文；通话中的原话仍原样留在聊天里展示，只是不再计入上下文，结束卡可展开查看。关闭后通话中的每句话原样留在对话与上下文里。</div></div><div class="sw2" id="ibcs-d-recon"></div></div>'
   +'<div class="f-group" style="margin:12px 0 0"><label>执笔 API</label><div class="sel"><select id="ibcs-d-recapi"></select></div></div>'
   +'<p class="hint" style="margin:8px 0 0">通话记录与「Save memory」由执笔 API 生成：记录为第三人称纪要，记忆以 TA 的第一人称写成。生成失败时原文不变，可在卡上重试。</p>';
  const sel=box.querySelector('#ibcs-d-recapi');
  const o0=document.createElement('option');o0.value='';o0.textContent='TA 本人（当前联系人的 API）';sel.appendChild(o0);
  (_cfgs||[]).forEach(function(x){if(!x||x._group||x.id===fid)return;const o=document.createElement('option');o.value=x.id;o.textContent=cfgName(x)+(x.model?' · '+x.model:'');sel.appendChild(o)});
  sel.value=(p.memApi&&(_cfgs||[]).some(function(x){return x.id===p.memApi}))?p.memApi:'';
  sel.addEventListener('change',async function(e2){await loadCALL();const pp=_ibcsP(fid);pp.memApi=e2.target.value||'';await saveCALL()});
  const sw=box.querySelector('#ibcs-d-recon');sw2(sw,p.autoRec===1);
  sw.addEventListener('click',async function(){await loadCALL();const pp=_ibcsP(fid);pp.autoRec=(pp.autoRec===1)?0:1;sw2(sw,pp.autoRec===1);await saveCALL();toast(pp.autoRec===1?'挂断后将压缩成通话记录（原话仍显示，仅不再计入上下文）':'已关闭，通话中的每句话原样留在对话与上下文里')});
}
function _ibcsFillEd(ed,fid){
  if(!ed)return;const p=_ibcsP(fid);
  ed.innerHTML=''
   +'<div class="f-group"><label>TA 的声音</label><div class="sel"><select data-k="tts"><option value="sys">系统语音（本机）</option><option value="cloud">云端音色</option><option value="off">仅字幕（不发声）</option></select></div></div>'
   +'<div class="f-group" data-g="sysv"><label>系统音色</label><div class="sel"><select data-k="sysVoice">'+_ibcsVoiceOpts+'</select></div></div>'
   +'<div data-g="cloud">'
   +'<div class="f-group"><label>云端服务商</label><div class="sel"><select data-k="provider"><option value="oai">OpenAI 兼容（SiliconFlow / OpenAI / 自建网关）</option><option value="el">ElevenLabs</option><option value="mm">MiniMax</option><option value="az">Azure 微软语音</option><option value="ali">阿里云 Qwen-TTS</option><option value="doubao">豆包（火山引擎语音）</option></select></div></div>'
   +'<div class="f-group"><label>Endpoint</label><input data-k="ep" placeholder="https://api.siliconflow.cn/v1"></div>'
   +'<div class="f-group"><label>API Key</label><input data-k="key" type="password" autocomplete="off" placeholder="sk-…"></div>'
   +'<div class="f-group" data-g="gid"><label>GroupId（MiniMax 必填）</label><input data-k="gid" placeholder="账号后台「基本信息」里的 GroupId"></div>'
   +'<div class="f-group"><label>模型</label><input data-k="model" placeholder="FunAudioLLM/CosyVoice2-0.5B"></div>'
   +'<div class="f-group"><label>音色（voice）</label><input data-k="voice" placeholder="CosyVoice2 写 模型:音色；ElevenLabs 填 voice_id"></div>'
   +'</div>'
   +'<div class="f-row"><div class="f-group"><label>朗读语言</label><div class="sel"><select data-k="lang"><option value="">中文（默认）</option><option value="en">英语 English</option><option value="ja">日语 日本語</option><option value="ko">韩语 한국어</option></select></div></div>'
   +'<div class="f-group"><label>语速</label><div class="sel"><select data-k="rate"><option value="0.85">0.85×</option><option value="1">1×（默认）</option><option value="1.1">1.1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></div></div>'
   +'<div class="f-group"><label>音量</label><div class="sel"><select data-k="vol"><option value="1">100%</option><option value="0.8">80%</option><option value="0.6">60%</option><option value="0.4">40%</option></select></div></div></div>'/* 手机端：#1 每 AI 音量 */
   +'<button class="btn wide" type="button" data-k="test">试听这套配置</button>';
  const V=function(k){return ed.querySelector('[data-k="'+k+'"]')};
  V('tts').value=(p.tts==='cloud'||p.tts==='off')?p.tts:'sys';
  V('sysVoice').value=p.sysVoice||'';if(V('sysVoice').value!==(p.sysVoice||''))V('sysVoice').value='';
  V('provider').value=/^(el|mm|az|ali|doubao)$/.test(p.provider)?p.provider:'oai';/* 手机端：#5 */
  V('ep').value=p.ep||'';V('key').value=p.key||'';V('gid').value=p.gid||'';V('model').value=p.model||'';V('voice').value=p.voice||'';
  V('lang').value=p.lang||'';if(V('lang').value!==(p.lang||''))V('lang').value='';
  V('rate').value=String(p.rate||1);if(V('rate').value!==String(p.rate||1))V('rate').value='1';
  V('vol').value=String(p.vol!=null&&p.vol!==''?p.vol:(_callS.vol||1));if(!/^(1|0\.8|0\.6|0\.4)$/.test(V('vol').value))V('vol').value='1';/* 手机端：#1 */
  const vis=function(){
    const t9=V('tts').value,pv=V('provider').value;
    ed.querySelector('[data-g="sysv"]').style.display=t9==='sys'?'':'none';
    ed.querySelector('[data-g="cloud"]').style.display=t9==='cloud'?'':'none';
    ed.querySelector('[data-g="gid"]').style.display=pv==='mm'?'':'none';
  };vis();
  ['tts','sysVoice','provider','ep','key','gid','model','voice','lang','rate','vol'].forEach(function(k){
    V(k).addEventListener('change',async function(e2){
      await loadCALL();const pp=_ibcsP(fid);
      const v9=String(e2.target.value||'');
      if(k==='rate')pp.rate=Math.max(0.5,Math.min(2,parseFloat(v9)||1));
      else if(k==='vol')pp.vol=Math.max(0.1,Math.min(1,parseFloat(v9)||1));/* 手机端：#1 */
      else pp[k]=(k==='ep'||k==='key'||k==='gid'||k==='model'||k==='voice')?v9.trim():v9;
      pp.use=1;await saveCALL();vis();
      if(k==='lang')toast(pp.lang?'该 AI 已开启外语朗读（其下一条消息重建一次提示缓存）':'该 AI 已恢复中文朗读（其下一条消息重建一次提示缓存）');
    });
  });
  V('test').addEventListener('click',async function(){
    await loadCALL();
    try{IBCALL.test(_callEffMerge(_callS,fid))}catch(e){toast('试听不可用')}
  });
}
try{window.openCallSet=openCallSet;window.closeCallSet=closeCallSet}catch(e){}
try{var _cso9=$('call-set-open');if(_cso9)_cso9.addEventListener('click',function(){openCallSet('')})}catch(e){}
