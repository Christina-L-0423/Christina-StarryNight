
(function(){if(window.__IB_BLBETA)return;window.__IB_BLBETA=1;
/* ═══ 八、Bubble Lab（任务书第七组）：受控 JSON 白名单，实时预览，4 方案槽 ═══ */
var BL_LIM={bga:[0,360],radius:[0,34],maxw:[50,96],px:[4,26],py:[2,20],ts:[0.7,1.2],bgo:[0,1],blur:[0,34],bw:[0,3],bo:[0,1],shadow:[0,0.6],gap:[0,20],glass:[0.6,2.2],dsz:[10,72],dxy:[-40,40],dop:[0.05,1],fw:[4,40],fslice:[4,120]};/* v128：九宫格外框钳制（厚度/切片） *//* v125-a：#1 deco 槽位钳制（尺寸/偏移/不透明度） */
var BL_DEF={u:{radius:14,maxw:85,px:16,py:12,ts:0.92,tc:'',bg:'',bg2:'',bga:135,bgo:0.14,bc:'',bw:1,bo:0.4,blur:0,shadow:0.08,r4:null,frame:{on:false,svg:'',w:14,slice:30}},
            a:{radius:14,maxw:85,px:16,py:12,ts:0.92,tc:'',bg:'',bg2:'',bga:135,bgo:0.55,bc:'',bw:1,bo:0.35,blur:0,shadow:0.08,r4:null,frame:{on:false,svg:'',w:14,slice:30}},
            c:{gap:0,glass:1,tail:true}};
function _blDecoSlot(sz){return {on:false,svg:'',size:sz,dx:0,dy:0,op:1,tint:''}}
function _blDecoDef(){return {tl:_blDecoSlot(26),tr:_blDecoSlot(26),bl:_blDecoSlot(26),br:_blDecoSlot(26),tail:_blDecoSlot(22)}}
BL_DEF.u.deco=_blDecoDef();BL_DEF.a.deco=_blDecoDef();
function _blSvgSan(s){
  s=String(s||'').trim();if(!s)return '';
  if(s.length>4000)s=s.slice(0,4000);
  if(!/^<svg[\s>]/i.test(s)||!/<\/svg\s*>$/i.test(s))return '';
  s=s.replace(/<\s*(script|foreignObject|iframe|object|embed)\b[\s\S]*?(?:<\/\s*\1\s*>|\/>)/gi,'');
  s=s.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'');
  s=s.replace(/(href|xlink:href)\s*=\s*("(?!#|data:)[^"]*"|'(?!#|data:)[^']*')/gi,'');
  s=s.replace(/url\s*\(\s*(['"]?)(?!#|data:)[^)]*\)/gi,'none');
  if(/javascript:/i.test(s))return '';
  return s;
}
function _blClamp(v,k){var L=BL_LIM[k];if(!L)return v;v=parseFloat(v);if(isNaN(v))return L[0];return Math.max(L[0],Math.min(L[1],v))}
function _blHexOk(h){return /^#[0-9a-fA-F]{6}$/.test(String(h||''))}
function _blRgba(hex,op){var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return 'rgba('+r+','+g+','+b+','+(+op).toFixed(2)+')'}
function _blLoad(){try{var o=JSON.parse(localStorage.getItem('ib_bublab')||'null');if(o&&o.cfg)return o}catch(e){}return {on:false,cfg:JSON.parse(JSON.stringify(BL_DEF)),slots:[]}}
var _bl=_blLoad();
if(!Array.isArray(_bl.slots))_bl.slots=[];
while(_bl.slots.length<10)_bl.slots.push(null);/* v128 任务2：方案槽 4→10（旧存档自动补位） */
function _blSanitize(cfg){
  var out=JSON.parse(JSON.stringify(BL_DEF));
  ['u','a'].forEach(function(S){
    var src=(cfg&&cfg[S])||{};
    ['radius','maxw','px','py','ts','bgo','bw','bo','blur','shadow'].forEach(function(k){if(src[k]!==undefined)out[S][k]=_blClamp(src[k],k==='shadow'?'shadow':k)});
    ['tc','bg','bc','bg2'].forEach(function(k){out[S][k]=_blHexOk(src[k])?src[k]:''});out[S].bga=_blClamp(src.bga!==undefined?src.bga:135,'bga');/* 双色渐变 */
    out[S].r4=(Array.isArray(src.r4)&&src.r4.length===4)?src.r4.map(function(v){return _blClamp(v,'radius')}):null;/* v128：四角独立圆角 */
    var fsrc=(src.frame&&typeof src.frame==='object')?src.frame:{},fo9=out[S].frame;
    fo9.svg=_blSvgSan(fsrc.svg);fo9.on=!!fsrc.on&&!!fo9.svg;
    fo9.w=_blClamp(fsrc.w!==undefined?fsrc.w:fo9.w,'fw');fo9.slice=_blClamp(fsrc.slice!==undefined?fsrc.slice:fo9.slice,'fslice');/* v128：九宫格外框 */
    var dsrc=(src.deco&&typeof src.deco==='object')?src.deco:{};out[S].deco=_blDecoDef();
    ['tl','tr','bl','br','tail'].forEach(function(P){var d0=dsrc[P]||{},o0=out[S].deco[P];
      o0.on=!!d0.on;o0.svg=_blSvgSan(d0.svg);if(!o0.svg)o0.on=false;
      o0.size=_blClamp(d0.size!==undefined?d0.size:o0.size,'dsz');
      o0.dx=_blClamp(d0.dx||0,'dxy');o0.dy=_blClamp(d0.dy||0,'dxy');
      o0.op=_blClamp(d0.op!==undefined?d0.op:1,'dop');
      o0.tint=_blHexOk(d0.tint)?d0.tint:'';
    });
  });
  var c=(cfg&&cfg.c)||{};
  out.c.gap=_blClamp(c.gap!==undefined?c.gap:0,'gap');
  out.c.glass=_blClamp(c.glass!==undefined?c.glass:1,'glass');
  out.c.tail=c.tail!==false;
  return out;
}
function _blCss(cfg,scope){scope=scope||'';
  function side(S,sel,tailCorner){
    var s=cfg[S],_dk=s.deco||{},_rr=(s.r4&&s.r4.length===4)?s.r4:[s.radius,s.radius,s.radius,s.radius];/* v128：r4 四角独立圆角 [左上,右上,右下,左下] */
    var _tOn=(cfg.c.tail&&!(_dk.tail&&_dk.tail.on));/* v125-a：#1 自定义尾巴启用时默认缺角小尾巴自动隐藏 */
    var _fr9=s.frame||{};
    var br=S==='u'?(_rr[0]+'px '+_rr[1]+'px '+(_tOn?4:_rr[2])+'px '+_rr[3]+'px'):(_rr[0]+'px '+_rr[1]+'px '+_rr[2]+'px '+(_tOn?4:_rr[3])+'px');
    var css=sel+'{border-radius:'+br+'!important;max-width:100%!important;padding:'+s.py+'px '+s.px+'px!important;font-size:'+s.ts+'rem!important;';
    if(s.tc)css+='color:'+s.tc+'!important;';
    if(s.bg&&s.bg2)css+='background:linear-gradient('+(s.bga||135)+'deg,'+_blRgba(s.bg,s.bgo)+','+_blRgba(s.bg2,s.bgo)+')!important;';else if(s.bg)css+='background:'+_blRgba(s.bg,s.bgo)+'!important;';/* bg2 给出即双色渐变 */
    if(s.bc)css+='border-color:'+_blRgba(s.bc,s.bo)+'!important;';
    css+='border-width:'+s.bw+'px!important;';
    if(_fr9.on&&_fr9.svg)css+='border-style:solid!important;border-width:'+_fr9.w+'px!important;border-color:transparent!important;background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;border-image:url("data:image/svg+xml;charset=utf-8,'+encodeURIComponent(_fr9.svg)+'") '+_fr9.slice+' fill / '+_fr9.w+'px stretch!important;';
    else if(s.blur>0)css+='backdrop-filter:blur('+s.blur+'px) saturate('+cfg.c.glass+')!important;-webkit-backdrop-filter:blur('+s.blur+'px) saturate('+cfg.c.glass+')!important;';
    css+='box-shadow:0 4px 18px rgba(10,20,40,'+s.shadow.toFixed(2)+')!important}';
    var rowSel=S==='u'?scope+'.mrow.user':scope+'.mrow.ai';
    css+=rowSel+' .m-body .m-col,'+rowSel+' .m-body>.m{max-width:min('+s.maxw+'%,calc(100% - 46px))!important}';
    css+=rowSel+':not(.hasava) .m-body .m-col,'+rowSel+':not(.hasava) .m-body>.m{max-width:'+s.maxw+'%!important}';
    css+=rowSel+'>.m{max-width:'+s.maxw+'%!important}';
    try{
      var _sl9=[['tl'],['tr'],['bl'],['br'],['tail']],_im9=[],_ps9=[],_sz9=[],_pd9=0;
      _sl9.forEach(function(sl){var P=sl[0],d0=_dk[P];if(!(d0&&d0.on&&d0.svg))return;
        var sv=d0.svg;
        if(d0.tint)sv=sv.replace(/currentColor/g,d0.tint);
        if(d0.op<1)sv=sv.replace(/^<svg/i,'<svg opacity="'+d0.op+'"');
        var need=Math.ceil(d0.size/2+Math.max(Math.abs(d0.dx),Math.abs(d0.dy)))+2;if(need>_pd9)_pd9=need;
        _im9.push('url("data:image/svg+xml;charset=utf-8,'+encodeURIComponent(sv)+'")');
        _sz9.push(d0.size+'px '+d0.size+'px');
        _ps9.push({P:P,d:d0});
      });
      if(_im9.length){
        _pd9=Math.min(48,_pd9);
        var _pc9=_ps9.map(function(o9){var d0=o9.d,P=o9.P;
          var xl='left '+(_pd9-d0.size/2+d0.dx)+'px',xr='right '+(_pd9-d0.size/2-d0.dx)+'px';
          var yt='top '+(_pd9-d0.size/2+d0.dy)+'px',yb='bottom '+(_pd9-d0.size/2-d0.dy)+'px';
          if(P==='tail')return (S==='u'?xr:xl)+' '+yb;
          return (P==='tl'||P==='bl'?xl:xr)+' '+(P==='tl'||P==='tr'?yt:yb);
        });
        css+=sel+'{position:relative}';
        css+=sel+'::after{content:"";position:absolute;left:'+(-_pd9)+'px;right:'+(-_pd9)+'px;top:'+(-_pd9)+'px;bottom:'+(-_pd9)+'px;pointer-events:none;z-index:2;background-repeat:no-repeat;background-image:'+_im9.join(',')+';background-position:'+_pc9.join(',')+';background-size:'+_sz9.join(',')+'}';
      }else{
        css+=sel+'::after{content:none}';
      }
    }catch(e){}
    return css;
  }
  var css=side('a',scope+'.m.ai')+side('u',scope+'.m.user');
  if(cfg.c.gap>0)css+=scope+'.mrow{margin-bottom:'+cfg.c.gap+'px!important}';
  return css;
}
function _blApply(){
  var st=document.getElementById('ib-bublab-css');
  if(!_bl.on){if(st)st.textContent='';return}
  if(!st){st=document.createElement('style');st.id='ib-bublab-css';document.head.appendChild(st)}
  st.textContent=_blCss(_bl.cfg);
}
function _blSave(){try{localStorage.setItem('ib_bublab',JSON.stringify(_bl))}catch(e){}}
var _blPrev=null;
var _blDSel={u:'tl',a:'tl'};/* v125-a：#1 装饰面板当前选中槽位 */
function _blPrompt(){
  var cur={u:_bl.cfg.u,a:_bl.cfg.a,c:_bl.cfg.c};
  return '请为一个聊天应用设计消息气泡样式。只输出一个 JSON 对象，不要任何解释、前后缀或代码块标记。\n'
   +'结构：{"u":{我方气泡},"a":{AI 气泡},"c":{公共}}。\n'
   +'u / a 内可用字段与范围：radius 圆角 0-34、maxw 最大宽度百分比 50-96、px 左右内距 4-26、py 上下内距 2-20、ts 字号 rem 0.7-1.2、tc 文字色 #RRGGBB、bg 背景色 #RRGGBB、bg2 第二背景色 #RRGGBB（给出就与 bg 做双色渐变，可做粉紫、蓝绿、彩虹感）、bga 渐变角度 0-360（默认 135）、bgo 背景不透明度 0-1（两色共用）、bc 描边色 #RRGGBB、bw 描边宽 0-3、bo 描边不透明度 0-1、blur 毛玻璃模糊 0-34、shadow 投影浓度 0-0.6。\n'
   +'c 内可用字段：gap 气泡间距 0-20、glass 玻璃饱和度 0.6-2.2、tail 是否保留小尾巴 true/false。\n'
   +'u / a 内还可各带 deco 对象定义气泡四角装饰与自定义小尾巴：deco:{tl:{…},tr:{…},bl:{…},br:{…},tail:{…}}（tl/tr/bl/br＝左上/右上/左下/右下角，tail＝气泡尾巴位，我方在右下、对方在左下）。每个槽位字段：on 启用 true/false、svg 一段完整的 <svg …>…</svg> 代码（务必用正方形 viewBox 如 viewBox="0 0 24 24"；欢迎用 SMIL 动画元素 animate / animateTransform / animateMotion / set 或 <svg> 内 <style> 做动态款式；禁止 <scr'+'ipt>、事件属性与外部链接；配色可写 currentColor 交给 tint 统一上色）、size 显示尺寸 px 10-72、dx / dy 相对角点的偏移 -40~40、op 不透明度 0.05-1、tint 上色 #RRGGBB（空字符串保留 svg 自身配色）。\n'
   +'u / a 内还可选配：r4 四角圆角数组 [左上,右上,右下,左下]（0-34，给出则覆盖 radius，可做不对称气泡形）；frame 九宫格外框 {"on":true,"svg":"<svg width=\"120\" height=\"120\" viewBox=\"0 0 120 120\">…</svg>","w":4-40,"slice":4-120}——svg 是整只气泡的皮（QQ 个性气泡原理）：必须写 width/height，装饰画在四角四边、中心用可拉伸的面，slice 为切片距离（默认 30）、w 为边框厚度 px；启用后覆盖该侧底色、描边与毛玻璃，气泡随文字伸缩。\n'
   +'超出范围会被钳制，未知字段会被忽略；tc/bg/bc 给空字符串表示沿用应用默认配色；deco 各槽 svg 经安全清洗后为空会被自动关闭。\n'
   +'当前配置（可在此基础上微调）：'+JSON.stringify(cur)+'\n'
   +'风格要求：（在此描述你想要的感觉，例如「奶油拟物」「赛博霓虹」「极简墨白」）';
}
function _blSheet(){
  var old=document.getElementById('ib-bl-ov');if(old)old.remove();
  if(!document.getElementById('ib-bl-style')){var _bst=document.createElement('style');_bst.id='ib-bl-style';_bst.textContent=
    '#ib-bl-ov{position:fixed;inset:0;z-index:4600;display:flex;flex-direction:column;background:linear-gradient(180deg,#f3f7fd 0%,#e9effa 62%,#e4ebf7 100%);color:#1d2c44}body.theme-infernal #ib-bl-ov{background:linear-gradient(180deg,#141a2e,#0f1526);color:#dfe8f8}'
    +'#ib-bl-ov .blx-hd{flex:none;display:flex;align-items:center;gap:10px;padding:calc(10px + var(--sat,0px)) 16px 10px;border-bottom:1px solid rgba(90,120,170,0.18);background:rgba(255,255,255,0.72)}body.theme-infernal #ib-bl-ov .blx-hd{background:rgba(20,28,48,0.9);border-color:rgba(165,188,230,0.16)}body.ib-reduce #ib-bl-ov .blx-hd{background:#eef3fb}body.ib-reduce.theme-infernal #ib-bl-ov .blx-hd{background:#1b2740}'
    +'#ib-bl-ov .blx-tt{flex:1;min-width:0;font-weight:700;font-size:1.02rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#ib-bl-ov .blx-tt small{display:block;font-weight:400;font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;opacity:.55}'
    +'#ib-bl-ov .blx-x{flex:none;width:34px;height:34px;border-radius:50%;border:1px solid rgba(90,120,170,0.3);background:rgba(255,255,255,0.85);font-size:.95rem;color:#33415c;line-height:1}body.theme-infernal #ib-bl-ov .blx-x{background:rgba(255,255,255,.08);color:#dfe8f8;border-color:rgba(165,188,230,.3)}'
    +'#ib-bl-ov .blx-page{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 14px calc(96px + var(--sab,0px))}#ib-bl-ov .blx-page[hidden]{display:none}'
    +'#ib-bl-ov .blx-tabs{position:absolute;left:12px;right:12px;bottom:calc(10px + var(--sab,0px));height:58px;border-radius:20px;display:flex;align-items:stretch;padding:0 4px;background:rgba(255,255,255,.78);border:1px solid rgba(90,120,170,.22);box-shadow:0 8px 24px rgba(30,50,90,.12)}body.theme-infernal #ib-bl-ov .blx-tabs{background:rgba(24,32,54,.92);border-color:rgba(165,188,230,.2)}'
    +'#ib-bl-ov .blx-tabs button{flex:1;border:0;background:none;font:inherit;font-size:.74rem;color:var(--tx2,#3b4a66);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-radius:16px;margin:4px 2px;-webkit-tap-highlight-color:transparent}#ib-bl-ov .blx-tabs button.on{color:var(--acc,#3f74ad);background:rgba(114,168,216,.16)}#ib-bl-ov .blx-tabs button svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}'
    +'#ib-bl-ov .blx-pv{padding:14px 12px;border-radius:14px;background:rgba(255,255,255,.55);border:1px solid rgba(90,120,170,.18)}body.theme-infernal #ib-bl-ov .blx-pv{background:rgba(255,255,255,.05);border-color:rgba(165,188,230,.16)}#ib-bl-ov .blx-pv .mrow{display:flex;margin:6px 0}#ib-bl-ov .blx-pv .mrow.user{justify-content:flex-end}#ib-bl-ov .blx-pv .m{max-width:78%;padding:10px 14px;border-radius:14px;font-size:.9rem;line-height:1.6;background:rgba(245,250,255,.55);border:1px solid rgba(114,168,216,.28);color:var(--tx,#1d2c44)}#ib-bl-ov .blx-pv .m.user{background:rgba(102,150,226,.14)}body.theme-infernal #ib-bl-ov .blx-pv .m{background:rgba(175,195,228,.08);color:#e6eefc}body.theme-infernal #ib-bl-ov .blx-pv .m.user{background:rgba(68,116,178,.28)}#ib-bl-ov .blx-pv.mini{padding:8px}#ib-bl-ov .blx-pv.mini .m{font-size:.7rem;padding:6px 9px;max-width:90%}'
    +'#ib-bl-ov .blx-m{max-width:88%;margin:8px 0;padding:10px 13px;border-radius:14px;font-size:.88rem;line-height:1.65;white-space:pre-wrap;word-break:break-word}#ib-bl-ov .blx-m.u{margin-left:auto;background:rgba(102,150,226,.16);border:1px solid rgba(102,150,226,.32);border-bottom-right-radius:5px}#ib-bl-ov .blx-m.a{margin-right:auto;background:rgba(255,255,255,.5);border:1px solid rgba(90,120,170,.18);border-bottom-left-radius:5px;white-space:normal;max-width:96%}body.theme-infernal #ib-bl-ov .blx-m.a{background:rgba(255,255,255,.06);border-color:rgba(165,188,230,.16)}'
    +'#ib-bl-ov .blx-m.a .blx-pv{margin:10px 0 6px}#ib-bl-ov .blx-code{margin:6px 0;font-size:.74rem}#ib-bl-ov .blx-code summary{cursor:pointer;color:var(--acc,#3f74ad)}#ib-bl-ov .blx-code pre{margin:6px 0 0;max-height:220px;overflow:auto;padding:8px 10px;border-radius:9px;font-size:.66rem;line-height:1.5;background:rgba(20,30,54,.06);white-space:pre-wrap;word-break:break-all}body.theme-infernal #ib-bl-ov .blx-code pre{background:rgba(0,0,0,.25)}'
    +'#ib-bl-ov .blx-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}#ib-bl-ov .blx-acts button,#ib-bl-ov .blx-sb button,#ib-bl-ov .blx-pop button{font:inherit;font-size:.76rem;padding:7px 12px;border-radius:999px;border:1px solid rgba(114,168,216,.5);background:rgba(114,168,216,.16);color:var(--acc,#3f74ad);-webkit-tap-highlight-color:transparent}body.theme-infernal #ib-bl-ov .blx-acts button,body.theme-infernal #ib-bl-ov .blx-sb button,body.theme-infernal #ib-bl-ov .blx-pop button{color:#dbe9ff;background:rgba(120,160,220,.22)}'
    +'#ib-bl-ov .blx-pop{position:fixed;left:14px;right:14px;bottom:calc(150px + var(--sab,0px));z-index:5;padding:10px;border-radius:14px;background:#f2f7fd;border:1px solid rgba(90,120,170,.22);box-shadow:0 14px 40px rgba(20,35,70,.18);display:flex;flex-wrap:wrap;gap:8px}body.theme-infernal #ib-bl-ov .blx-pop{background:#1b2740}#ib-bl-ov .blx-pop b{width:100%;font-weight:400;font-size:.72rem;opacity:.7}'
    +'#ib-bl-ov .blx-in{position:absolute;left:12px;right:12px;bottom:calc(76px + var(--sab,0px));display:flex;gap:8px;align-items:flex-end}#ib-bl-ov .blx-in textarea{flex:1;min-height:42px;max-height:120px;resize:none;padding:10px 14px;border-radius:14px;border:1px solid rgba(90,120,170,.25);background:rgba(255,255,255,.85);font:inherit;font-size:.88rem;color:inherit}body.theme-infernal #ib-bl-ov .blx-in textarea{background:rgba(20,28,48,.9);border-color:rgba(165,188,230,.22)}#ib-bl-ov .blx-send{flex:none;width:42px;height:42px;border-radius:50%;border:1px solid rgba(114,168,216,.5);background:rgba(114,168,216,.18);color:var(--acc,#3f74ad);display:flex;align-items:center;justify-content:center}#ib-bl-ov .blx-send svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}#ib-bl-ov .blx-send[disabled]{opacity:.45}'
    +'#ib-bl-ov .blx-tip{font-size:.78rem;line-height:1.7;opacity:.75;text-align:center;padding:12px 8px}#ib-bl-ov .blx-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px 0 8px}#ib-bl-ov .blx-chips::-webkit-scrollbar{display:none}#ib-bl-ov .blx-chips span{flex:none;font-size:.74rem;padding:5px 11px;border-radius:999px;border:1px solid rgba(90,120,170,.22);background:rgba(255,255,255,.4)}body.theme-infernal #ib-bl-ov .blx-chips span{background:rgba(255,255,255,.06);border-color:rgba(165,188,230,.2)}'
    +'#ib-bl-ov .blx-sec{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;opacity:.6;margin:16px 2px 8px}#ib-bl-ov .blx-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}#ib-bl-ov .blx-slot{border-radius:14px;border:1px solid rgba(90,120,170,.18);background:rgba(255,255,255,.4);padding:8px}body.theme-infernal #ib-bl-ov .blx-slot{background:rgba(255,255,255,.04);border-color:rgba(165,188,230,.14)}#ib-bl-ov .blx-slot.empty .blx-pv.mini{min-height:52px;opacity:.5}#ib-bl-ov .blx-sn{font-size:.74rem;margin:6px 2px 4px;opacity:.8}#ib-bl-ov .blx-sb{display:flex;gap:6px}#ib-bl-ov .blx-sb button{padding:5px 10px;font-size:.72rem}'
    +'#ib-bl-ov .blx-rg{display:grid;grid-template-columns:78px 1fr 44px;align-items:center;gap:10px;padding:7px 4px;font-size:.8rem}#ib-bl-ov .blx-rg b{font-weight:400;text-align:right;font-variant-numeric:tabular-nums;opacity:.85}#ib-bl-ov .blx-rg input[type=range]{width:100%;height:24px;-webkit-appearance:none;appearance:none;background:transparent}#ib-bl-ov .blx-rg input[type=range]::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:rgba(114,168,216,.35)}#ib-bl-ov .blx-rg input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;margin-top:-9px;border-radius:50%;background:#fff;border:1px solid rgba(114,168,216,.7);box-shadow:0 2px 6px rgba(30,50,90,.18)}';
    _bst.textContent+='#ib-bl-ov .blx-clr{flex:none;border:none;background:none;padding:4px 8px;margin-right:2px;font:inherit;font-size:.8rem;color:inherit;opacity:.6;cursor:pointer}#ib-bl-ov .blx-clr:active{opacity:1}'
    +'#ib-bl-ov .blx-pen{flex:none;max-width:32vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:1px solid rgba(90,120,170,.28);background:rgba(255,255,255,.45);border-radius:999px;padding:4px 10px;margin-right:6px;font:inherit;font-size:.72rem;color:inherit;opacity:.88;cursor:pointer}body.theme-infernal #ib-bl-ov .blx-pen{background:rgba(255,255,255,.06);border-color:rgba(165,188,230,.25)}'
    +'#ib-bl-ov .blx-pv{position:relative;overflow:hidden}#ib-bl-ov .blx-pv::before{content:\"\";position:absolute;inset:-18%;pointer-events:none;filter:blur(2px);background:radial-gradient(42% 56% at 18% 22%,rgba(122,172,236,.26),transparent 60%),radial-gradient(46% 62% at 83% 80%,rgba(255,192,172,.18),transparent 62%),radial-gradient(30% 42% at 70% 14%,rgba(160,225,205,.15),transparent 65%)}body.theme-infernal #ib-bl-ov .blx-pv::before{background:radial-gradient(42% 58% at 16% 20%,rgba(96,150,230,.30),transparent 60%),radial-gradient(46% 62% at 84% 80%,rgba(190,120,220,.16),transparent 62%),radial-gradient(30% 42% at 72% 12%,rgba(90,210,190,.14),transparent 65%)}#ib-bl-ov .blx-pv .mrow{position:relative;z-index:1}'
    +'#ib-bl-ov .blx-pv.mini{max-height:104px;overflow:hidden;-webkit-mask-image:linear-gradient(#000 70%,transparent);mask-image:linear-gradient(#000 70%,transparent)}'
    +'#ib-bl-ov .blx-wait{display:inline-flex;gap:5px;padding:3px 2px}#ib-bl-ov .blx-wait i{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.3;animation:blxw 1.1s ease-in-out infinite}#ib-bl-ov .blx-wait i:nth-child(2){animation-delay:.18s}#ib-bl-ov .blx-wait i:nth-child(3){animation-delay:.36s}@keyframes blxw{0%,100%{opacity:.22;transform:translateY(0)}45%{opacity:.9;transform:translateY(-2px)}}'
    +'#ib-bl-ov .blx-m.u{width:fit-content;max-width:78%}#ib-bl-ov .blx-sec{display:block;margin-top:5px;font-size:.72rem;opacity:.72;letter-spacing:.02em}'
    +'#ib-bl-ov .blx-intro{margin:4px 0 14px;padding:12px 12px 6px;border-radius:18px;border:1px solid rgba(90,120,170,.16);background:rgba(255,255,255,.5);box-shadow:0 6px 18px rgba(70,110,170,.08)}body.theme-infernal #ib-bl-ov .blx-intro{background:rgba(255,255,255,.05);border-color:rgba(165,188,230,.2);box-shadow:0 8px 20px rgba(0,0,0,.3)}#ib-bl-ov .blx-intro .blx-chips{padding:0 0 8px}#ib-bl-ov .blx-intro .blx-tip{padding:8px 4px 6px;text-align:left;font-size:.76rem;opacity:.7}'
    +'#ib-bl-ov .blx-in{padding:8px 10px;border-radius:18px;background:rgba(255,255,255,.84);border:1px solid rgba(90,120,170,.2);box-shadow:0 8px 22px rgba(70,110,170,.12);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}body.theme-infernal #ib-bl-ov .blx-in{background:rgba(28,36,56,.88);border-color:rgba(165,188,230,.22);box-shadow:0 8px 22px rgba(0,0,0,.4)}#ib-bl-ov .blx-page{padding-bottom:calc(150px + var(--sab,0px))}';
    document.head.appendChild(_bst)}
  var PV='<div class="mrow user"><div class="m user">(ﾉ≧∇≦)ﾉ ⌒ ♡ﾟ*｡</div></div><div class="mrow ai"><div class="m ai">｡*ﾟ♡⌒(๑˃ᴗ˂)ﾉ</div></div><div class="mrow user"><div class="m user">( ˘▽˘)っ喵喵~~</div></div><div class="mrow ai"><div class="m ai">~~喵喵⊂(･ω･*⊂)</div></div>';/* 手机端：预览台词换两组长颜文字互动（抛心接心、递茶接茶） */
  var ov=document.createElement('div');ov.id='ib-bl-ov';
  ov.innerHTML='<div class="blx-hd"><div class="blx-tt">Bubble Lab · 水水的气泡实验室<small>Sui\'s Lab · Bubble schemes</small></div><button class="blx-pen" id="bl-pen" type="button">执笔 · —</button><div class="sw2" id="bl-on"></div><button class="blx-clr" id="bl-clear" type="button">清空</button><button class="blx-x" id="bl-close" type="button">✕</button></div>'
    +'<div class="blx-page" id="blx-lab"></div><div class="blx-page" id="blx-sch" hidden></div>'
    +'<div class="blx-in" id="blx-in"><textarea id="blx-ta" rows="1" placeholder="说你想要的气泡：粉色系液态玻璃、奶油拟物、赛博霓虹…"></textarea><button class="blx-send" id="blx-send" type="button" aria-label="发送"><svg viewBox="0 0 20 20"><path d="M3.5 10h12M11 5.5l4.5 4.5-4.5 4.5"/></svg></button></div>'
    +'<div class="blx-tabs"><button type="button" data-t="lab" class="on"><svg viewBox="0 0 24 24"><path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v6a3.5 3.5 0 0 1-3.5 3.5H10l-4 3.5V16A3.5 3.5 0 0 1 4 12.5z"/></svg>Sui\'s Lab</button><button type="button" data-t="sch"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>气泡方案</button></div>';
  document.body.appendChild(ov);
  var swOn=ov.querySelector('#bl-on');sw2(swOn,!!_bl.on);swOn.addEventListener('click',function(){_bl.on=!_bl.on;sw2(swOn,!!_bl.on);_blApply();_blSave();toast(_bl.on?'Bubble Lab 已开启':'Bubble Lab 已关闭（恢复默认气泡）')});
  ov.querySelector('#bl-close').addEventListener('click',function(){ov.remove()});
  ov.querySelector('#bl-clear').addEventListener('click',function(){if(!H.length){toast('没有可清的');return}H.length=0;try{localStorage.removeItem('ib_bl_chat')}catch(e){}for(var kk in CARDS)delete CARDS[kk];paint();toast('聊天已清空（方案槽与当前气泡不受影响）')});/* 手机端：上下文攒大了随手清 */
  function _penLbl(){var b=ov.querySelector('#bl-pen');if(!b)return;var c=cfgOf();b.textContent='执笔 · '+((c&&(typeof cfgName==='function'?cfgName(c):(c.nickname||c.model)))||'未配置')}
  _penLbl();
  ov.querySelector('#bl-pen').addEventListener('click',function(){var cs=(Array.isArray(_cfgs)?_cfgs:[]).filter(function(c){return c&&c.id&&!c.archived&&!c._group});if(!cs.length){toast('先到 API 页添加一位 TA');return}pop('实验室执笔（与水水共用）',cs.map(function(c){return {t:cfgName(c),v:c.id}}),async function(id){try{if(typeof loadMP==='function')await loadMP()}catch(e){}try{_mp.helper=_mp.helper||{};_mp.helper.api=id;if(typeof saveMP==='function')await saveMP()}catch(e){}_penLbl();var c9=cs.filter(function(x){return x.id===id})[0];toast('实验室与水水改用：'+(c9?cfgName(c9):'—'))})});/* 手机端：执笔切换小签 */
  ov.querySelector('.blx-tabs').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;ov.querySelectorAll('.blx-tabs button').forEach(function(x){x.classList.toggle('on',x===b)});var lab=b.dataset.t==='lab';$('blx-lab').hidden=!lab;$('blx-sch').hidden=lab;$('blx-in').style.display=lab?'':'none';if(!lab)blxDrawSch()});
  /* ── Sui's Lab：聊着改 ── */
  var H=(function(){try{var h=JSON.parse(localStorage.getItem('ib_bl_chat')||'[]');return Array.isArray(h)?h:[]}catch(e){return []}})();
  function persist(){try{localStorage.setItem('ib_bl_chat',JSON.stringify(H.slice(-24)))}catch(e){}}
  function esc9(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  var list=$('blx-lab'),K=0;
  function svgList(cfg){var out=[];['u','a'].forEach(function(S){var d=(cfg[S]&&cfg[S].deco)||{};Object.keys(d).forEach(function(sl){if(d[sl]&&d[sl].on&&d[sl].svg)out.push({n:(S==='u'?'我方':'TA')+' · '+sl,svg:d[sl].svg})});if(cfg[S]&&cfg[S].frame&&cfg[S].frame.on&&cfg[S].frame.svg)out.push({n:(S==='u'?'我方':'TA')+' · 外框',svg:cfg[S].frame.svg})});return out}
  function card(k,cfg){var css=_blCss(cfg,'#blx-pv-'+k+' ');return '<style>'+css+'</style><div class="blx-pv" id="blx-pv-'+k+'">'+PV+'</div>'
    +'<details class="blx-code"><summary>CSS（'+css.length+' 字）</summary><pre>'+esc9(css)+'</pre></details>'+svgList(cfg).map(function(x){return '<details class="blx-code"><summary>SVG · '+esc9(x.n)+'</summary><pre>'+esc9(x.svg)+'</pre></details>'}).join('')
    +'<div class="blx-acts" data-k="'+k+'"><button type="button" data-a="wear">穿上（全局）</button><button type="button" data-a="slot">存为方案</button></div>'}
  var CARDS={};
  function addMsg(role,text,cfg,save){var d=document.createElement('div');d.className='blx-m '+(role==='u'?'u':'a');
    if(role==='u')d.textContent=text||'';else{var pro=text?((typeof mdRenderHtml==='function')?mdRenderHtml(String(text),false):esc9(text)):'';d.innerHTML=pro;if(cfg){var k=++K;CARDS[k]=cfg;d.insertAdjacentHTML('beforeend',card(k,cfg))}}
    list.appendChild(d);list.scrollTop=list.scrollHeight;if(save!==false){H.push({r:role,t:text||'',cfg:cfg||null});persist()}return d}
  function paint(){list.innerHTML='';K=0;if(!H.length){list.innerHTML='<div class="blx-intro"><div class="blx-chips"><span>粉色系液态玻璃</span><span>奶油拟物，圆角大一点</span><span>极简墨白，细描边</span><span>赛博霓虹，带发光</span><span>我方深蓝、TA 霜白</span><span>四角来点小星星装饰</span></div><div class="blx-tip">我是水水 (⁎˃ᴗ˂⁎) 说一句你想要的气泡，我直接做出来给你看：预览、CSS、SVG 都在回复里，喜欢就穿上、存成方案。（PWA：暂不支持「给好友」）</div></div>';return}
    H.forEach(function(m){addMsg(m.r,m.t,m.cfg,false)})}
  list.addEventListener('click',function(e){var ch=e.target.closest('.blx-chips span');if(ch){$('blx-ta').value=ch.textContent;send();return}
    var b=e.target.closest('.blx-acts button');if(!b)return;var k=+b.parentElement.dataset.k,cfg=CARDS[k];if(!cfg)return;var act=b.dataset.a;
    if(act==='wear'){_blPrev=JSON.parse(JSON.stringify(_bl.cfg));_bl.cfg=_blSanitize(cfg);_bl.on=true;sw2(swOn,true);_blApply();_blSave();toast('穿上了 (｡･ω･｡)ﾉ♡');return}
    if(act==='slot'){pickSlot(function(i){_bl.slots[i]=JSON.parse(JSON.stringify(_blSanitize(cfg)));_blSave();toast('已存入方案 '+(i+1))},'存到哪个方案槽');return}
    if(act==='friend'){var cs=(Array.isArray(_cfgs)?_cfgs:[]).filter(function(c){return c&&c.id&&!c.archived});if(!cs.length){toast('还没有好友');return}
      pop('给谁穿（会先存进一个方案槽）',cs.map(function(c){return {t:cfgName(c),v:c.id}}),function(fid){var i=-1;for(var j=0;j<10;j++){if(!_bl.slots[j]){i=j;break}}if(i<0){toast('十个方案槽都满了，先去「气泡方案」清一个');return}
        _bl.slots[i]=JSON.parse(JSON.stringify(_blSanitize(cfg)));_blSave();var map=_pfMapLoad();map[fid]=Object.assign({},map[fid]||{},{u:String(i),a:String(i)});_pfMapSave(map);var c9=cs.filter(function(x){return x.id===fid})[0];toast('已给 '+(c9?cfgName(c9):'TA')+' 穿上（方案 '+(i+1)+'）')})}});
  function pop(title,items,cb){var old=ov.querySelector('.blx-pop');if(old)old.remove();var p=document.createElement('div');p.className='blx-pop';p.innerHTML='<b>'+esc9(title)+'</b>'+items.map(function(it){return '<button type="button" data-v="'+esc9(it.v)+'">'+esc9(it.t)+'</button>'}).join('')+'<button type="button" data-v="__x">取消</button>';ov.appendChild(p);
    p.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;p.remove();if(b.dataset.v!=='__x')cb(b.dataset.v)})}
  function pickSlot(cb,title){var items=[];for(var i=0;i<10;i++)items.push({t:'方案 '+(i+1)+(_bl.slots[i]?'（覆盖）':''),v:String(i)});pop(title||'选一个方案槽',items,function(v){cb(parseInt(v,10))})}
  function cfgOf(){var cs=(Array.isArray(_cfgs)?_cfgs:[]).filter(function(c){return c&&c.id&&!c.archived});var id=(_mp&&_mp.helper&&_mp.helper.api)||'';return cs.filter(function(c){return c.id===id})[0]||cs[0]||null}
  function sys(lc){var spec='';try{spec=_blPrompt().split('\n')}catch(e){spec=[]}if(!Array.isArray(spec))spec=String(spec).split('\n');spec=spec.filter(function(l){return l.indexOf('当前配置')!==0&&l.indexOf('风格要求')!==0&&l.indexOf('请为一个聊天应用')!==0}).join('\n');
    return '【水水 · 气泡实验室】你是 Internal Beyond 的小助手水水（作者 Sui / 水 的分身），此刻在气泡实验室里替用户设计聊天气泡。用户用一句话说感觉，你直接出一整套气泡。爱发颜文字，句尾至多一枚（避开 ` * _）。\n'
      +'【怎么答】先用一两句话说这套气泡的感觉与你做了什么改动；然后另起一行给一个 ```json 代码块，代码块之外不再写别的。全新方案：u（我方）/ a（TA）/ c（公共）三段给全。微调（「再淡一点」「圆角大一点」「TA 那边换成霜白」）：只回你要改的字段就行，客户端会把它合并进【当前配置】——deco 按槽给、槽里没写的项保留；frame 要动就把那一槽整个给全（on 与 svg 一起）。想加装饰就用 deco 槽写 svg（正方形 viewBox、可用 SMIL 动画、禁 script 与外链），想换整只气泡的皮就用 frame。颜色给 #RRGGBB；不确定的字段不要乱填。\n'
      +'【字段规格】\n'+spec+'\n'
      +'【当前配置】（你最近给出的那套；微调都在这上面改）'+JSON.stringify(lc?{u:lc.u,a:lc.a,c:lc.c}:{u:_bl.cfg.u,a:_bl.cfg.a,c:_bl.cfg.c})}
  function parse(t,lc){t=String(t||'');var m=t.match(/```(?:json)?\s*([\s\S]*?)```/i),js=m?m[1]:'',pro=m?t.slice(0,m.index):t;
    if(!js){var i=t.indexOf('{'),j=t.lastIndexOf('}');if(i>=0&&j>i){js=t.slice(i,j+1);pro=t.slice(0,i)}}
    var obj=null;if(js){try{obj=JSON.parse(js)}catch(e){try{obj=JSON.parse(js.replace(/,\s*([}\]])/g,'$1'))}catch(e2){obj=null}}}
    if(obj&&typeof obj==='object'){var base=JSON.parse(JSON.stringify(lc||_bl.cfg));/* 手机端：合并基准＝模型看到的那套（最近一条带方案的回复），与【当前配置】一致 */['u','a','c'].forEach(function(S){if(obj[S]&&typeof obj[S]==='object'){Object.keys(obj[S]).forEach(function(k){if(k==='deco'&&obj[S].deco&&typeof obj[S].deco==='object'){base[S].deco=base[S].deco||_blDecoDef();Object.keys(obj[S].deco).forEach(function(sl){if(base[S].deco[sl]&&obj[S].deco[sl]&&typeof obj[S].deco[sl]==='object')Object.assign(base[S].deco[sl],obj[S].deco[sl])})}else base[S][k]=obj[S][k]})}});
      try{return {pro:pro.trim(),cfg:_blSanitize(base)}}catch(e){return {pro:pro.trim(),cfg:null}}}
    return {pro:t.trim(),cfg:null}}
  var busy=false;
  async function send(){var ta=$('blx-ta'),q=(ta.value||'').trim();if(!q||busy)return;var cfg=cfgOf();if(!cfg){addMsg('a','还没有可用的 API。先到 API 页添加一个，回来再试。');return}
    ta.value='';ta.style.height='';addMsg('u',q);busy=true;$('blx-send').disabled=true;var wait=addMsg('a','',null,false);var _wt0=Date.now(),_wtm=null;if(wait){wait.innerHTML='<span class="blx-wait"><i></i><i></i><i></i></span><span class="blx-sec">水水正在思考…… 0 秒</span>';_wtm=setInterval(function(){var el9=wait.querySelector('.blx-sec');if(!el9||!wait.isConnected){clearInterval(_wtm);return}el9.textContent='水水正在思考…… '+Math.round((Date.now()-_wt0)/1000)+' 秒'},1000)}/* 手机端：三点呼吸；手机端：读秒 */
    try{var lastCfg=null;for(var li=H.length-1;li>=0;li--){if(H[li].r==='a'&&H[li].cfg){lastCfg=H[li].cfg;break}}
      var msgs=[];H.slice(-9,-1).forEach(function(m){var r=m.r==='u'?'user':'assistant',c=m.r==='u'?m.t:(m.t+(m.cfg?'\n（这一条当时给过完整 JSON，略；最新一套见【当前配置】）':''));if(!msgs.length&&r!=='user')return;if(msgs.length&&msgs[msgs.length-1].role===r){msgs[msgs.length-1].content+='\n'+c;return}msgs.push({role:r,content:c})});msgs.push({role:'user',content:q});
      var test=Object.assign({},cfg,{streaming:false,thinkingEnabled:false,promptCache:false,webSearch:false});var r=await Promise.race([callAI(test,msgs,sys(lastCfg),function(){},null,null),new Promise(function(_,rej){setTimeout(function(){rej(new Error('等了 180 秒还没回：整套方案带多枚动画 SVG 时本来就生成得慢，稍后再试，或换个快一点的执笔 API'))},180000)})]);var t=(r&&r.t)||'';if(!String(t).trim())throw new Error('TA 回了空内容，再说一遍试试');var p=parse(t,lastCfg);if(_wtm)clearInterval(_wtm);wait.remove();
      addMsg('a',p.pro||(p.cfg?'做好了，看看这套 (｡･ω･｡)ﾉ♡':'这次没拿到有效的 JSON，再说一遍试试'),p.cfg)}
    catch(e){if(_wtm)clearInterval(_wtm);wait.remove();var em=String((e&&e.message)||e);if(/length|token|context|too.?long|maximum|exceed/i.test(em))em+='（多半是上下文太长：点右上「清空」再说一遍）';addMsg('a','出错了：'+em)}
    finally{busy=false;$('blx-send').disabled=false}}
  $('blx-send').addEventListener('click',send);$('blx-ta').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});$('blx-ta').addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,96)+'px'});/* 手机端：输入框随内容长高至四行 */
  paint();
  /* ── 气泡方案：穿衣室 + 基础拉条 ── */
  var RG=[['radius','圆角',0,34,1],['bgo','背景不透明',0,1,0.02],['blur','毛玻璃',0,34,1],['bw','描边宽',0,3,0.5],['bo','描边不透明',0,1,0.02],['shadow','投影',0,0.6,0.02],['ts','字号 rem',0.7,1.2,0.02],['px','左右内距',4,26,1],['py','上下内距',2,20,1]];
  function blxDrawSch(){var host=$('blx-sch');var html='<style>'+_blCss(_bl.cfg,'#blx-cur ')+'</style><div class="blx-sec">当前全局 · '+(_bl.on?'已开启':'已关闭')+'</div><div class="blx-pv" id="blx-cur">'+PV+'</div>'
      +'<div class="blx-sec">基础调整（我方与 TA 同调）</div><div class="blx-slot">'+RG.map(function(g){var v=_bl.cfg.u[g[0]];if(v==null)v=g[2];return '<div class="blx-rg"><span>'+g[1]+'</span><input type="range" data-k="'+g[0]+'" min="'+g[2]+'" max="'+g[3]+'" step="'+g[4]+'" value="'+v+'"><b>'+v+'</b></div>'}).join('')+'<div class="blx-sb" style="margin-top:8px"><button type="button" data-undo="1">撤销上次穿上</button><button type="button" data-reset="1">恢复默认</button></div></div>'
      +'<div class="blx-sec">方案槽 · 穿衣室</div><div class="blx-grid">';
    for(var i=0;i<10;i++){var s=_bl.slots[i];if(s){var sc=_blSanitize(s);html+='<style>'+_blCss(sc,'#blx-s'+i+' ')+'</style><div class="blx-slot"><div class="blx-pv mini" id="blx-s'+i+'">'+PV+'</div><div class="blx-sn">方案 '+(i+1)+'</div><div class="blx-sb"><button type="button" data-w="'+i+'">穿上</button><button type="button" data-d="'+i+'">删</button></div></div>'}
      else html+='<div class="blx-slot empty"><div class="blx-pv mini"></div><div class="blx-sn">方案 '+(i+1)+' · 空</div><div class="blx-sb"><button type="button" data-s="'+i+'">存当前</button></div></div>'}
    host.innerHTML=html+'</div>';
    host.querySelectorAll('input[type=range]').forEach(function(r){r.addEventListener('input',function(){var k=r.dataset.k,v=parseFloat(r.value);_bl.cfg.u[k]=v;_bl.cfg.a[k]=v;r.nextElementSibling.textContent=v;var st=host.querySelector('style');if(st)st.textContent=_blCss(_bl.cfg,'#blx-cur ');_blApply();_blSave()})});
    host.onclick=function(e){var b=e.target.closest('button');if(!b)return;
      if(b.dataset.w!==undefined){_blPrev=JSON.parse(JSON.stringify(_bl.cfg));_bl.cfg=_blSanitize(_bl.slots[+b.dataset.w]);_bl.on=true;sw2(swOn,true);_blApply();_blSave();blxDrawSch();toast('已穿上方案 '+(+b.dataset.w+1))}
      else if(b.dataset.d!==undefined){_bl.slots[+b.dataset.d]=null;_blSave();blxDrawSch();toast('已清空方案 '+(+b.dataset.d+1))}
      else if(b.dataset.s!==undefined){_bl.slots[+b.dataset.s]=JSON.parse(JSON.stringify(_bl.cfg));_blSave();blxDrawSch();toast('当前气泡已存入方案 '+(+b.dataset.s+1))}
      else if(b.dataset.undo){if(!_blPrev){toast('没有可撤销的');return}_bl.cfg=_blSanitize(_blPrev);_blPrev=null;_blApply();_blSave();blxDrawSch();toast('已撤销')}
      else if(b.dataset.reset){_blPrev=JSON.parse(JSON.stringify(_bl.cfg));_bl.cfg=_blSanitize(JSON.parse(JSON.stringify(BL_DEF)));_blApply();_blSave();blxDrawSch();toast('已恢复默认')}}}
}
_bl.cfg=_blSanitize(_bl.cfg);_blApply();
var _blBtn=$('bl-open');if(_blBtn)_blBtn.addEventListener('click',_blSheet);

(function(){var def={id:'bubblelab',name:'Bubble Lab',sdk:2,builtin:true,icon:'<path d="M9.5 3h5"/><path d="M10.2 3v5.1L5.5 16.9A2.6 2.6 0 0 0 7.9 20.5h8.2a2.6 2.6 0 0 0 2.4-3.6L13.8 8.1V3"/><path d="M7.3 14h9.4"/><circle cx="10.4" cy="17.2" r="1"/><circle cx="13.6" cy="16" r=".7"/><circle cx="12.2" cy="18.6" r=".5"/>',/* 手机端：换带水冒泡的烧杯；旧图标带 <svg> 外壳过不了 ICON_RE、桌面一直落在默认图标，注册图标只收内层元素 */mount:function(root){try{_blSheet()}catch(e){}return{unmount:function(){}}}};
  function reg(){try{if(_mp){_mp.apps=_mp.apps||{};_mp.apps.on=_mp.apps.on||{};var dirty=false;if(!_mp.apps.on.bubblelab){_mp.apps.on.bubblelab=1;dirty=true}_mp.desk=_mp.desk||{};_mp.desk.pages=_mp.desk.pages||{};if(!_mp.desk.pages['app:x:bubblelab']){_mp.desk.pages['app:x:bubblelab']=2;dirty=true}if(dirty&&typeof saveMP==='function')saveMP()}}catch(e){}try{if(window.IBApps&&IBApps.register)IBApps.register(def)}catch(e){}}
  reg();setTimeout(reg,1500);setTimeout(reg,4000);
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('[data-dk="app:x:bubblelab"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();_blSheet()},true);})();
try{var st9=document.createElement('style');st9.textContent='#ib-bl-ov details{display:none!important}';document.head.appendChild(st9)}catch(e){}
})();
