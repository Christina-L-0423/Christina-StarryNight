'use strict';

function _pfMapLoad(){try{return JSON.parse(localStorage.getItem('ib_blpf')||'{}')||{}}catch(e){return {}}}
function _pfMapSave(m9){try{localStorage.setItem('ib_blpf',JSON.stringify(m9))}catch(e){}}
function _pfBgGet(fid){try{return localStorage.getItem('ib_bgpf_'+fid)||''}catch(e){return ''}}
function _pfDimGet(fid){try{var m0=_pfMapLoad()[fid];var v0=m0&&parseInt(m0.dim);return (v0>=0&&v0<=70)?v0:0}catch(e){return 0}}
function _pfDimLay(dim){var dark=document.body.classList.contains('theme-infernal');var c=(dark?'rgba(10,16,30,':'rgba(246,249,253,')+(dim/100)+')';return 'linear-gradient('+c+','+c+'),'}
function _pfApply(fid){/* 进入会话时调用；fid 空＝清理回全局 */
  var box=null;try{box=convEl('cv-msgs')}catch(e){}
  if(!box)return;
  if(!fid){box.style.backgroundImage='';box.style.backgroundSize='';box.style.backgroundPosition='';return}
  var bg=_pfBgGet(fid);
  if(bg){var dim=_pfDimGet(fid);
    box.style.backgroundImage=(dim>0?_pfDimLay(dim):'')+'url("'+bg+'")';
    box.style.backgroundSize='cover';box.style.backgroundPosition='center';
  }else{box.style.backgroundImage='';box.style.backgroundSize='';box.style.backgroundPosition=''}
}
function _pfSheet(c){/* ib-ov2 通用皮肤（随主题明暗）＋仿真双气泡预览＋淡化滑杆 */
  var old9=document.getElementById('ib-pf-ov');if(old9)old9.remove();
  var map9=_pfMapLoad();
  var bg9=_pfBgGet(c.id),dim9=_pfDimGet(c.id);
  var ov9=document.createElement('div');ov9.id='ib-pf-ov';ov9.className='ib-ov2';
  ov9.innerHTML='<div class="ov2-head"><div class="ov2-hava" id="pf-hava"></div><div class="ov2-tt">'+esc(cfgName(c))+'<small>专属聊天背景 · 仅本机，不进备份</small></div><button class="ov2-x" id="pf-close">✕</button></div>'
    +'<div class="ov2-body">'
    +'<div class="ov2-lab">聊天背景图<small>只在与 TA 的聊天里生效</small></div>'
    +'<div class="ov2-card">'
      +'<div class="pfbg-pv" id="pf-bg-pv"><div class="pfbg-dim" id="pf-dim-pv"></div><div class="pfbg-mk a"><div class="mbb a">这里是 TA 的气泡</div></div><div class="pfbg-mk u"><div class="mbb u">这是你发出的样子</div></div></div>'
      +'<div style="display:flex;gap:8px;margin-top:10px"><button class="ov2-btn" id="pf-bg-pick" style="flex:1">选择图片</button><button class="ov2-btn" id="pf-bg-clear" style="flex:1"'+(bg9?'':' disabled')+'>清除背景</button></div>'
      +'<input type="file" id="pf-bg-file" accept="image/*" style="display:none">'
      +'<div class="ov2-lab" style="margin:14px 0 2px">淡化背景<small id="pf-dim-val">'+dim9+'%</small></div>'
      +'<input type="range" class="ov2-range" id="pf-dim" min="0" max="70" step="5" value="'+dim9+'"'+(bg9?'':' disabled')+'>'
      +'<div class="ov2-hint">图片压缩后存在本机（长边 1080、约 1MB 内）；淡化是叠在背景上的一层半透明底色（随主题明暗），字看不清就往右拉。不进备份、不去电脑端。</div>'
    +'</div>'
    +'</div>';
  document.body.appendChild(ov9);
  try{setAvaEl($('pf-hava'),c.avatar||'',cfgName(c))}catch(e){}
  function pvDraw(){
    var pv=$('pf-bg-pv'),dp=$('pf-dim-pv');if(!pv)return;
    pv.style.backgroundImage=bg9?('url("'+bg9+'")'):'';
    var dark=document.body.classList.contains('theme-infernal');
    dp.style.background=(bg9&&dim9>0)?((dark?'rgba(10,16,30,':'rgba(246,249,253,')+(dim9/100)+')'):'';
    var dv=$('pf-dim-val');if(dv)dv.textContent=dim9+'%';
  }
  pvDraw();
  function liveApply(){if(typeof _activeCfg!=='undefined'&&_activeCfg&&_activeCfg.id===c.id)_pfApply(c.id)}
  function saveMap9(){
    var o=map9[c.id]||{};
    if(dim9>0)o.dim=dim9;else delete o.dim;
    if(Object.keys(o).length)map9[c.id]=o;else delete map9[c.id];
    _pfMapSave(map9);liveApply();
  }
  $('pf-close').addEventListener('click',function(){ov9.remove()});
  $('pf-dim').addEventListener('input',function(){dim9=parseInt(this.value)||0;pvDraw();saveMap9()});
  $('pf-bg-pick').addEventListener('click',function(){$('pf-bg-file').click()});
  $('pf-bg-file').addEventListener('change',async function(){
    var f9=this.files&&this.files[0];this.value='';if(!f9)return;
    try{
      var du9=await compressImg(f9,1080,0.82);
      if(du9.length>900000)du9=await compressImg(f9,800,0.6);
      if(du9.length>900000){toast('图片过大，压缩后仍超限，请换一张');return}
      try{localStorage.setItem('ib_bgpf_'+c.id,du9)}catch(e){toast('本机存储空间不足，背景未保存');return}
      bg9=du9;$('pf-bg-clear').disabled=false;$('pf-dim').disabled=false;pvDraw();liveApply();
      toast('背景已设置（仅本机）');
    }catch(e){toast('图片处理失败')}
  });
  $('pf-bg-clear').addEventListener('click',function(){
    try{localStorage.removeItem('ib_bgpf_'+c.id)}catch(e){}
    bg9='';dim9=0;$('pf-dim').value=0;$('pf-bg-clear').disabled=true;$('pf-dim').disabled=true;
    pvDraw();saveMap9();toast('背景已清除');
  });
}
try{window._pfApply=_pfApply;window._pfSheet=_pfSheet}catch(e){}
