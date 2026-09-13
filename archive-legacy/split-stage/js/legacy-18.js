
(function(){'use strict';
var CUR=null;
function esc9(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function row(){var r=document.getElementById('aset-preset-row');if(r)return r;var key=document.getElementById('aset-key');var fg=key&&key.closest('.f-group');if(!fg)return null;r=document.createElement('div');r.className='f-group';r.id='aset-preset-row';r.style.cssText='margin-top:12px;display:none';
  r.innerHTML='<label>接口预设 <span class="lb-note">（自定义中转专用：模型 + 地址 + 密钥一套一套存，随时切）</span></label>'
  +'<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><div class="sel" style="flex:1;min-width:0"><select id="aset-preset"><option value="">（选一套换上并保存）</option></select></div><button class="btn" type="button" id="aset-preset-del" style="flex:none">删</button></div>'
  +'<div style="display:flex;gap:8px;align-items:center"><input id="aset-preset-name" placeholder="给当前这套起个名" autocomplete="off" style="flex:1;min-width:0"><button class="btn" type="button" id="aset-preset-add" style="flex:none">存为预设</button></div>'
  +'<p class="hint" id="aset-preset-hint" style="margin:6px 0 0"></p>';
  fg.insertAdjacentElement('afterend',r);
  r.querySelector('#aset-preset').addEventListener('change',onPick);
  r.querySelector('#aset-preset-add').addEventListener('click',onAdd);
  r.querySelector('#aset-preset-del').addEventListener('click',onDel);
  return r}
function list(){try{return (CUR&&_mp&&_mp.perAi&&_mp.perAi[CUR]&&Array.isArray(_mp.perAi[CUR].presets))?_mp.perAi[CUR].presets:[]}catch(e){return []}}
async function save(arr){try{if(typeof loadMP==='function')await loadMP()}catch(e){}_mp.perAi=_mp.perAi||{};_mp.perAi[CUR]=_mp.perAi[CUR]||{};_mp.perAi[CUR].presets=arr;try{if(typeof saveMP==='function')await saveMP()}catch(e){}}
function paint(){var r=row();if(!r)return;var prov=document.getElementById('aset-provider');var on=prov&&prov.value==='custom';r.style.display=on?'':'none';if(!on)return;
  var sel=r.querySelector('#aset-preset'),ps=list();sel.innerHTML='<option value="">（选一套换上并保存）</option>'+ps.map(function(p,i){return '<option value="'+i+'">'+esc9(p.name)+' · '+esc9(p.model||'')+'</option>'}).join('');
  var h=r.querySelector('#aset-preset-hint');h.textContent=CUR?(ps.length?('共 '+ps.length+' 套。选一套会直接换上并保存这张配置。'):'还没有预设：把模型、地址、密钥填好，起个名点「存为预设」。'):'新配置先保存一次，再回来存预设。';
  r.querySelector('#aset-preset-add').disabled=!CUR}
function onPick(){var i=parseInt(this.value,10);var ps=list();if(!(i>=0&&ps[i]))return;var p=ps[i];var m=document.getElementById('aset-model'),u=document.getElementById('aset-endpoint'),k=document.getElementById('aset-key');if(m)m.value=p.model||'';if(u)u.value=p.endpoint||'';if(k)k.value=p.key||'';try{if(typeof _modelListReset==='function')_modelListReset()}catch(e){}toast('已换到预设「'+p.name+'」，正在保存');this.value='';var sb=document.getElementById('aset-save');if(sb)setTimeout(function(){sb.click()},60)}
async function onAdd(){if(!CUR){toast('新配置先保存一次');return}var m=document.getElementById('aset-model'),u=document.getElementById('aset-endpoint'),k=document.getElementById('aset-key'),nmEl=document.getElementById('aset-preset-name');
  var model=(m&&m.value.trim())||'',ep=(u&&u.value.trim())||'',key=(k&&k.value.trim())||'',name=(nmEl&&nmEl.value.trim())||'';
  if(!model||!ep){toast('模型与接口地址都填好再存');return}if(!name)name=model;
  var ps=list().slice(),ix=-1;ps.forEach(function(p,i){if(p.name===name)ix=i});var rec={name:name,model:model,endpoint:ep,key:key};if(ix>=0)ps[ix]=rec;else ps.push(rec);
  await save(ps);if(nmEl)nmEl.value='';paint();toast((ix>=0?'已更新预设「':'已存为预设「')+name+'」')}
async function onDel(){var sel=document.getElementById('aset-preset');var i=sel?parseInt(sel.value,10):-1;var ps=list();if(!(i>=0&&ps[i])){toast('先在下拉里选一套要删的预设');return}
  var okc=false;try{okc=await confirmDlg('删除预设「'+ps[i].name+'」？','删除')}catch(e){okc=true}if(!okc)return;ps=ps.slice();ps.splice(i,1);await save(ps);paint();toast('已删除')}
try{var _oa=openAset;openAset=function(c){_oa.apply(this,arguments);try{CUR=(c&&c.id)||null;paint()}catch(e){}}}catch(e){}
document.addEventListener('change',function(e){if(e.target&&e.target.id==='aset-provider'){try{paint()}catch(e2){}}});
})();
