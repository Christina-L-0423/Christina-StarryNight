

(function(){try{
  if(localStorage.getItem('ib_lockOn')==='0')return;/* v101-m：锁屏默认开启；只有明确写入 0 才跳过预遮罩 */
  var dk=(localStorage.getItem('ib_m_theme')||'internal')==='infernal';
  var st=document.createElement('style');st.id='lk-preveil-style';
  st.textContent='#lk-preveil{position:fixed;inset:0;z-index:4001;background:'+(dk?'#0d1524':'#eef2f8')+';transition:opacity 0.4s}#lk-preveil.off{opacity:0;pointer-events:none}';
  document.head.appendChild(st);
  document.addEventListener('DOMContentLoaded',function(){try{var v=document.createElement('div');v.id='lk-preveil';document.body.appendChild(v)}catch(e){}});
}catch(e){}})();
