
/* APP 稳定性：全局错误捕获，防止白屏 */
window.onerror=function(msg,src,line,col,err){try{console.error('[IB]',msg,src,line,err)}catch(e){}return false};
window.addEventListener('unhandledrejection',function(e){try{console.error('[IB-Promise]',e.reason)}catch(x){}});
