

(function(){
  var RE=/cloudflareinsights\.com|\/beacon\.min\.js|cf-beacon/i,n=0;
  function bad(el){try{return el&&el.tagName==='SCRIPT'&&RE.test(String(el.src||'')+' '+String((el.getAttribute&&el.getAttribute('data-cf-beacon'))||''))}catch(e){return false}}
  function sweep(){try{var ls=document.querySelectorAll('script[src]');for(var i=0;i<ls.length;i++)if(bad(ls[i])){try{ls[i].parentNode&&ls[i].parentNode.removeChild(ls[i])}catch(e){}n++}}catch(e){}window._ibBeaconPurged=n}
  sweep();
  try{new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var ad=ms[i].addedNodes||[];for(var j=0;j<ad.length;j++)if(bad(ad[j])){try{ad[j].parentNode&&ad[j].parentNode.removeChild(ad[j])}catch(e){}n++;window._ibBeaconPurged=n}}}).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
  window.addEventListener('DOMContentLoaded',sweep);
})();
