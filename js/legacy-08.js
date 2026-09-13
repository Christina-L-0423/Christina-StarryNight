

(function(){
  if(window.IBMusicCore)return;
  var VERSION=1;
  function fmt(sec){sec=Number(sec);if(!isFinite(sec)||sec<0)return'--:--';sec=Math.round(sec);return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')}
  function ext(name){var m=String(name||'').toLowerCase().match(/\.([a-z0-9]+)$/);return m?m[1]:''}
  function base(name){return String(name||'').replace(/\.[^.]+$/,'').trim()}
  function isLyricFile(f){var e=ext(f&&f.name);return e==='lrc'||e==='srt'||e==='vtt'}
  function isAudioFile(f){if(!f)return false;if(/^audio\//i.test(f.type||''))return true;return /^(mp3|m4a|mp4|wav|flac|ogg|oga|opus|webm|aac|mpeg|mpga|3gp|3gpp|amr|caf|aif|aiff)$/i.test(ext(f.name))}
  function cleanText(s){return String(s==null?'':s).replace(/^\uFEFF/,'').replace(/\u0000/g,'').trim()}
  function _utf16(bytes,be){var out='',i=0;if(bytes.length>=2){if(bytes[0]===0xff&&bytes[1]===0xfe){be=false;i=2}else if(bytes[0]===0xfe&&bytes[1]===0xff){be=true;i=2}}for(;i+1<bytes.length;i+=2){var c=be?((bytes[i]<<8)|bytes[i+1]):((bytes[i+1]<<8)|bytes[i]);if(c===0)continue;out+=String.fromCharCode(c)}return out}
  function _decText(bytes,enc){try{if(enc===1)return _utf16(bytes,false);if(enc===2)return _utf16(bytes,true);if(enc===3)return new TextDecoder('utf-8').decode(bytes);try{return new TextDecoder('iso-8859-1').decode(bytes)}catch(e){var s='';for(var i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);return s}}catch(e){return''}}
  function _syncSafe(a,b,c,d){return ((a&127)<<21)|((b&127)<<14)|((c&127)<<7)|(d&127)}
  function _u32(u,i){return (((u[i]<<24)>>>0)+(u[i+1]<<16)+(u[i+2]<<8)+u[i+3])>>>0}
  function _imgStart(u,start,end){for(var i=start;i<end-8;i++){if(u[i]===0xff&&u[i+1]===0xd8&&u[i+2]===0xff)return{at:i,mime:'image/jpeg'};if(u[i]===0x89&&u[i+1]===0x50&&u[i+2]===0x4e&&u[i+3]===0x47&&u[i+4]===0x0d&&u[i+5]===0x0a&&u[i+6]===0x1a&&u[i+7]===0x0a)return{at:i,mime:'image/png'}}return null}
  function blobDataUrl(blob){return new Promise(function(resolve,reject){var fr=new FileReader();fr.onload=function(){resolve(String(fr.result||''))};fr.onerror=reject;fr.readAsDataURL(blob)})}
  async function readMeta(file){
    var ret={title:base(file&&file.name)||'未命名音频',artist:'',album:'',cover:''};
    if(!file||ext(file.name)!=='mp3')return ret;
    try{
      var h=new Uint8Array(await file.slice(0,10).arrayBuffer());
      if(h.length<10||h[0]!==73||h[1]!==68||h[2]!==51)return ret;
      var ver=h[3],tagSize=_syncSafe(h[6],h[7],h[8],h[9]),cap=Math.min(file.size,10+tagSize,2*1024*1024);
      var u=new Uint8Array(await file.slice(0,cap).arrayBuffer()),p=10,lim=Math.min(u.length,10+tagSize);
      while(p+10<=lim){
        var id=String.fromCharCode(u[p],u[p+1],u[p+2],u[p+3]);
        if(!/^[A-Z0-9]{4}$/.test(id))break;
        var sz=ver===4?_syncSafe(u[p+4],u[p+5],u[p+6],u[p+7]):_u32(u,p+4);p+=10;
        if(!sz||p+sz>lim)break;
        if(id==='TIT2'||id==='TPE1'||id==='TALB'){
          var enc=u[p],txt=cleanText(_decText(u.slice(p+1,p+sz),enc));
          if(txt){if(id==='TIT2')ret.title=txt;else if(id==='TPE1')ret.artist=txt;else ret.album=txt}
        }else if((id==='APIC'||id==='PIC')&&!ret.cover){
          var im=_imgStart(u,p,p+sz);if(im){try{ret.cover=await blobDataUrl(new Blob([u.slice(im.at,p+sz)],{type:im.mime}))}catch(e){}}
        }
        p+=sz;
      }
    }catch(e){}
    return ret;
  }
  function parseLyrics(text,name){
    text=String(text||'').replace(/\r/g,'');var seg=[];
    var off=0,om=text.match(/\[offset:([+-]?\d+)\]/i);if(om)off=(parseInt(om[1],10)||0)/1000;
    text.split('\n').forEach(function(line){
      var ms=[...line.matchAll(/\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g)];
      if(!ms.length)return;
      var body=cleanText(line.replace(/\[[^\]]+\]/g,''));if(!body)return;
      ms.forEach(function(m){var frac=m[3]?Number('0.'+String(m[3]).padEnd(3,'0').slice(0,3)):0;seg.push({start:Math.max(0,Number(m[1])*60+Number(m[2])+frac+off),end:0,text:body})});
    });
    if(!seg.length){
      var re=/(?:^|\n)(?:\d+\n)?(\d{1,2}:\d{2}:\d{2}[,.]\d{3}|\d{1,2}:\d{2}[,.]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{3}|\d{1,2}:\d{2}[,.]\d{3})[^\n]*\n([\s\S]*?)(?=\n\s*\n|$)/g,m;
      function ts(s){var a=s.replace(',','.').split(':').map(Number);return a.length===3?a[0]*3600+a[1]*60+a[2]:a[0]*60+a[1]}
      while((m=re.exec(text))){var body=cleanText(m[3].replace(/\n+/g,' '));if(body)seg.push({start:ts(m[1]),end:ts(m[2]),text:body})}
    }
    seg.sort(function(a,b){return a.start-b.start});
    for(var i=0;i<seg.length;i++){if(!seg[i].end||seg[i].end<=seg[i].start)seg[i].end=(seg[i+1]?Math.max(seg[i].start+0.4,seg[i+1].start):seg[i].start+6)}
    return{source:ext(name)==='lrc'?'lrc':'subtitle',segments:seg,text:seg.map(function(x){return x.text}).join('\n'),at:Date.now()};
  }
  function _avg(a,from,to){var s=0,n=0;for(var i=Math.max(0,from);i<Math.min(a.length,to);i++){s+=a[i];n++}return n?s/n:0}
  async function analyze(blob){
    var ab=await blob.arrayBuffer(),AC=window.AudioContext||window.webkitAudioContext,ctx=null,b=null;
    try{ctx=new AC();b=await ctx.decodeAudioData(ab.slice(0))}finally{try{if(ctx&&ctx.close)await ctx.close()}catch(e){}}
    if(!b)throw new Error('无法解码音频');
    var sr=b.sampleRate,dur=b.duration||b.length/sr,winSec=2,win=Math.max(1,Math.floor(sr*winSec)),stride=Math.max(1,Math.floor(sr/1800)),raw=[];
    for(var start=0;start<b.length;start+=win){
      var end=Math.min(b.length,start+win),sum=0,n=0;
      for(var ch=0;ch<b.numberOfChannels;ch++){var d=b.getChannelData(ch);for(var j=start;j<end;j+=stride){var v=d[j]||0;sum+=v*v;n++}}
      raw.push(Math.sqrt(sum/Math.max(1,n)));
    }
    var sorted=raw.slice().sort(function(a,b){return a-b}),p95=sorted[Math.max(0,Math.min(sorted.length-1,Math.floor(sorted.length*0.95)))]||0,max=Math.max.apply(null,raw.concat([0.000001])),den=Math.max(0.000001,p95,max*0.58),v0=raw.map(function(x){return Math.min(1,x/den)}),sm=[];
    for(var i=0;i<v0.length;i++)sm.push((_avg(v0,i-1,i+2)));
    var energy=sm.map(function(v,i){return{s:+(i*winSec).toFixed(2),e:+Math.min(dur,(i+1)*winSec).toFixed(2),v:+Math.min(1,v).toFixed(3)}});
    var high=[];for(i=0;i<energy.length;i++)if(energy[i].v>=0.62)high.push(i);
    var clusters=[],cur=[];high.forEach(function(ix){if(!cur.length||ix-cur[cur.length-1]<=2)cur.push(ix);else{clusters.push(cur);cur=[ix]}});if(cur.length)clusters.push(cur);
    var best=null,bs=-1;clusters.forEach(function(c){var s=0;c.forEach(function(ix){s+=energy[ix].v});if(s>bs){bs=s;best=c}});
    if(!best||!best.length){var mi=0;for(i=1;i<energy.length;i++)if(energy[i].v>energy[mi].v)mi=i;best=[mi]}
    var peak=[energy[best[0]].s,energy[best[best.length-1]].e];
    var nE=energy.length,q1=_avg(sm,0,Math.ceil(nE*.22)),q2=_avg(sm,Math.floor(nE*.22),Math.ceil(nE*.55)),q3=_avg(sm,Math.floor(nE*.55),Math.ceil(nE*.82)),q4=_avg(sm,Math.floor(nE*.82),nE),parts=[];
    if(q2>q1*1.18||q3>q1*1.25)parts.push('前段较收敛，随后能量逐步抬升');
    else if(q1>q2*1.25)parts.push('开头能量较高，随后逐步收束');
    else parts.push('前中段动态相对平稳');
    if(peak[1]-peak[0]>=3)parts.push(fmt(peak[0])+'–'+fmt(peak[1])+' 附近是主要高能区');
    if(q4<Math.max(q2,q3)*0.62)parts.push('结尾明显回落');else if(q4>Math.max(q1,q2)*1.15)parts.push('结尾仍维持较高能量');
    return{version:VERSION,duration:+dur.toFixed(3),windowSec:winSec,energy:energy,peak:peak,summary:parts.join('；')+'。',analyzedAt:Date.now()};
  }
  function vtUrl(ep){var u=String(ep||'').trim().replace(/\/+$/,'');if(!u)return'';if(/\/audio\/transcriptions$/i.test(u))return u;if(/\/v\d+[a-z]*$/i.test(u))return u+'/audio/transcriptions';return u+'/v1/audio/transcriptions'}
  async function transcribe(rec,cfg,urlFn){
    if(!rec||!(rec.blob instanceof Blob)||!cfg||!cfg.endpoint||!cfg.apiKey||!cfg.model)return null;
    var url=(urlFn||vtUrl)(cfg.endpoint),filename=rec.name||((rec.title||'song')+'.mp3');
    async function once(verbose){
      var fd=new FormData();fd.append('file',rec.blob,filename);fd.append('model',cfg.model);if(verbose){fd.append('response_format','verbose_json');fd.append('timestamp_granularities[]','segment')}
      var ac=new AbortController(),tm=setTimeout(function(){try{ac.abort()}catch(e){}},120000);
      try{var res=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+cfg.apiKey},body:fd,signal:ac.signal}),raw=await res.text();if(!res.ok)throw new Error('HTTP '+res.status+'：'+raw.slice(0,180));var j;try{j=JSON.parse(raw)}catch(e){j={text:raw.trim()}};return j}finally{clearTimeout(tm)}
    }
    var j;try{j=await once(true)}catch(e){if(/HTTP 4\d\d/.test(String(e&&e.message||e)))j=await once(false);else throw e}
    var seg=[];if(Array.isArray(j&&j.segments)){j.segments.forEach(function(s){var t=cleanText(s.text);if(t)seg.push({start:+(Number(s.start)||0).toFixed(3),end:+(Number(s.end)||0).toFixed(3),text:t})})}
    var tx=cleanText((j&&j.text)||'');
    return{source:'transcript',segments:seg,text:tx||seg.map(function(x){return x.text}).join('\n'),timed:!!seg.length,at:Date.now()};
  }
  function currentEnergy(analysis,sec){if(!analysis||!Array.isArray(analysis.energy))return null;for(var i=0;i<analysis.energy.length;i++){var e=analysis.energy[i];if(sec>=e.s&&sec<e.e)return e.v}return null}
  var _MUS_HALLUC_RE=/^(?:\s*[♪♩♫♬~\-—_·.。]*\s*)(?:thank(?:s| you)[\s.!,]*(?:very much[\s.!]*)?(?:for (?:watching|listening)[\s.!]*)?|please (?:like[,\s]*(?:and )?)?subscribe.*|(?:subtitle[sd]?|caption(?:s|ed)?|transcri(?:bed|ption|pt)|translat(?:ed|ion))(?:\s+(?:by|provided by))?\b.*|amara\.org.*|www\.[^\s]+|感谢(?:观看|收听|支持|大家).*|谢谢(?:观看|收听|大家|你们)?[\s!！。~]*|多谢(?:观看|收听)?[\s!！。~]*|请?(?:一键三连|点赞|订阅|关注|转发).*|字幕(?:由|组|提供|制作|翻译).*|本?字幕.*|\[?(?:music|applause|instrumental|silence|音乐|间奏|前奏|尾奏|纯音乐|掌声)\]?)[\s.!！。]*$/i;
function _musicCleanSegsM(segs){try{
  var out=(segs||[]).filter(function(s){var tx=String((s&&s.text)||'').trim();if(!tx)return false;return !_MUS_HALLUC_RE.test(tx)});
  if(out.length){var uq={};out.forEach(function(s){uq[String(s.text).trim()]=1});var ks=Object.keys(uq);
    if(ks.length<=2&&ks.join('').length<14&&out.length>=3)return[];/* 同一两句短语刷屏＝无效转写 */}
  return out;
}catch(e){return segs||[]}}
function _musicCleanLyricsM(lyr){
  if(!lyr||!Array.isArray(lyr.segments))return lyr;
  var c=_musicCleanSegsM(lyr.segments);
  if(!c.length)return{source:lyr.source||'transcribe',segments:[],instrumental:true};
  if(c.length!==lyr.segments.length)return Object.assign({},lyr,{segments:c});
  return lyr}
try{window._musicCleanSegsM=_musicCleanSegsM;window._musicCleanLyricsM=_musicCleanLyricsM}catch(e){}
function nearLyrics(lyrics,sec,span){if(!lyrics||!Array.isArray(lyrics.segments))return[];span=span||12;return _musicCleanSegsM(lyrics.segments).filter(function(s){return Number(s.end)>=sec-span&&Number(s.start)<=sec+span}).slice(0,8)}
  function context(rec,sec,dur,fid,ma){ma=ma||{};
    if(!rec)return'';var a=rec.analysis||null,ly=rec.lyrics||null,title=rec.title||base(rec.name)||'未命名音频',artist=rec.artist||'',out=['【一起听歌】','正在播放：《'+title+'》'+(artist?' · '+artist:'')+((fid&&ma.mate===fid)?'（'+_amUserName()+'此刻正和你一起听这首歌）':'')];
    if(isFinite(sec))out.push('当前进度：'+fmt(sec)+(isFinite(dur)&&dur>0?' / '+fmt(dur):''));
    if(a&&a.summary){out.push('程序分析到的全曲结构：'+a.summary);var ev=currentEnergy(a,sec);if(ev!=null){var lab=ev>=.7?'高':ev>=.38?'中':'低';out.push('当前这一段的相对能量：'+lab+'（约 '+Math.round(ev*100)+'%）')}}else out.push('歌曲结构分析尚未完成。');
    var near=nearLyrics(ly,sec,12);if(near.length){out.push((ly.source==='lrc'?'当前附近歌词：':'当前附近人声转写：')+'\n'+near.map(function(s){return fmt(s.start)+' '+s.text}).join('\n'))}else if(ly&&ly.text&&!ly.timed){out.push('已取得人声文字稿，但没有可用时间轴，无法精确定位当前一句。')}
    out.push('以上是程序实际取得的音频/歌词参考。没有提供的具体乐器、歌词或细节不要假装听见；可以基于这些事实自然陪对方听。');
    return out.join('\n\n');
  }
  function snapshot(rec,sec,dur){return{trackId:rec&&rec.id||'',title:rec&&((rec.title)||base(rec.name))||'Music',artist:rec&&rec.artist||'',atSec:isFinite(sec)?+Number(sec).toFixed(2):0,duration:isFinite(dur)?+Number(dur).toFixed(2):((rec&&rec.analysis&&rec.analysis.duration)||0),created:Date.now()}}
  window.IBMusicCore={VERSION:VERSION,fmt:fmt,ext:ext,base:base,isLyricFile:isLyricFile,isAudioFile:isAudioFile,readMeta:readMeta,parseLyrics:parseLyrics,analyze:analyze,vtUrl:vtUrl,transcribe:transcribe,currentEnergy:currentEnergy,nearLyrics:nearLyrics,context:context,snapshot:snapshot};
})();

/* ══════════ Music Together · Mobile adapter ══════════ */
var _ibMusicMJobs={},_ibMusicMSeen={};
_pwName=function(r){return String((r&&(r.title||r.name))||'').replace(/\.[a-z0-9]{1,5}$/i,'')||'未命名音频'};
function _musicTrackByIdM(id){return (_pw.list||[]).find(function(x){return x&&x.id===id})||null}
async function _musicReadLyricsTextM(f){
  try{
    var ab=await f.arrayBuffer(),u=new Uint8Array(ab),txt='';
    if(u.length>=2&&u[0]===0xff&&u[1]===0xfe){try{return new TextDecoder('utf-16le').decode(u)}catch(e){}}
    if(u.length>=2&&u[0]===0xfe&&u[1]===0xff){try{return new TextDecoder('utf-16be').decode(u)}catch(e){}}
    if(u.length>=3&&u[0]===0xef&&u[1]===0xbb&&u[2]===0xbf){try{return new TextDecoder('utf-8').decode(u.subarray(3))}catch(e){}}
    try{txt=new TextDecoder('utf-8').decode(u)}catch(e){txt=await f.text()}
    var bad8=(txt.match(/\uFFFD/g)||[]).length;
    if(bad8){try{var gb=new TextDecoder('gb18030').decode(u),badg=(gb.match(/\uFFFD/g)||[]).length;if(badg<bad8)txt=gb}catch(e){}}
    return txt;
  }catch(e){try{return await f.text()}catch(x){return''}}
}
function _musicNormBaseM(name){
  var s=IBMusicCore.base(name||'');try{s=s.normalize('NFKC')}catch(e){}
  return s.toLowerCase().replace(/[\s\u3000]+/g,' ').replace(/(?:\s*[-_—–·]\s*)?(?:lyrics?|lyric|lrc|歌词|滚动歌词|逐字歌词)\s*$/i,'').replace(/[\s._\-—–·()[\]【】{}]+/g,'').trim()
}
async function _musicSaveLyricsFileM(f,opt){
  var txt=await _musicReadLyricsTextM(f);if(!txt)return false;
  var lyr=IBMusicCore.parseLyrics(txt,f.name);if(!lyr.segments.length){console.warn('[Lyrics import] no timed lines',f&&f.name);return false}
  await _pwLoad();var rec=null,opt=opt||{};
  if(opt.trackId)rec=(_pw.list||[]).find(function(r){return r&&r.id===opt.trackId})||null;
  if(!rec){var b=_musicNormBaseM(f.name);rec=(_pw.list||[]).find(function(r){return _musicNormBaseM(r.name||r.title)===b})||null}
  if(!rec)return false;
  lyr.imported=true;lyr.importedAt=Date.now();lyr.fileName=f.name||'';
  rec.lyrics=lyr;rec.lyricsAttemptedAt=Date.now();
  try{await dbPut('music',rec)}catch(e){console.error('[Lyrics save]',e);return false}
  try{if(window._maRefreshMusicM)window._maRefreshMusicM()}catch(e){}
  return true
}
_pwAddFiles=async function(files,ctx){
  var fs=Array.prototype.slice.call(files||[]).filter(function(f){return f&&f.size});if(!fs.length)return;
  ctx=ctx||{};
  var aud=fs.filter(IBMusicCore.isAudioFile),lyr=fs.filter(IBMusicCore.isLyricFile),ids=[],failed=0;
  if(!aud.length&&!lyr.length){toast('未识别到可用音频或歌词文件');return}
  await _pwLoad();var first=_pw.idx<0;
  for(var k=0;k<aud.length;k++){var f=aud[k],meta=null;
    try{meta=await IBMusicCore.readMeta(f)}catch(e){meta={title:IBMusicCore.base(f.name),artist:'',album:'',cover:''}}
    var rec={id:'msong_'+Date.now()+'_'+Math.floor(Math.random()*1e6),name:f.name||'音频',title:(meta&&meta.title)||IBMusicCore.base(f.name),artist:(meta&&meta.artist)||'',album:(meta&&meta.album)||'',cover:(meta&&meta.cover)||'',type:f.type||'',size:f.size||0,addedAt:Date.now()+k,src:'mobile',blob:f,metaScanned:true};
    try{await dbPut('music',rec);ids.push(rec.id)}catch(e){failed++;console.error('[Music import]',f&&f.name,e)}
  }
  await _pwLoad();var lk=0;
  for(k=0;k<lyr.length;k++){
    try{
      var bind=(ctx.mode==='lyrics'&&ctx.trackId&&lyr.length===1)?{trackId:ctx.trackId}:{};
      if(await _musicSaveLyricsFileM(lyr[k],bind))lk++
    }catch(e){console.warn('[Lyrics import]',e)}
  }
  if(aud.length){
    if(ids.length)toast('已添加 '+ids.length+' 首'+(failed?' · '+failed+' 首失败':'')+(lk?' · 绑定 '+lk+' 份歌词':''));
    else toast('音乐添加失败，请检查浏览器存储空间或文件格式');
  }else if(lyr.length)toast(lk?(ctx.mode==='lyrics'&&ctx.trackId&&lyr.length===1?'歌词已绑定到当前歌曲':'歌词已绑定'):'歌词解析失败，或没有找到可绑定的歌曲');
  _pwPaint();_pwListDraw();try{if(window._maRefreshMusicM)window._maRefreshMusicM()}catch(e){}
  if(first&&ids.length){var ix=_pw.list.findIndex(function(r){return r.id===ids[0]});if(ix>=0)_pwPlayIdx(ix)}
};
_pwPlayIdx=async function(i){
  await _pwLoad();if(!_pw.list.length){toast('曲库为空，先添加音乐');_pwPaint();return}i=((i%_pw.list.length)+_pw.list.length)%_pw.list.length;_pw.idx=i;var rec=_pw.list[i],a=_pwA();a.src=_pwSrc(rec);try{await a.play()}catch(e){toast('播放失败')}_pwPaint();_pwListDraw();try{await loadMP();_musicEnsureM(rec,!!(_mp.musicAi&&_mp.musicAi.share))}catch(e){_musicEnsureM(rec,false)}_musicSyncCardsM()
};
async function _musicEnsureM(rec,wantTranscript){
  if(!rec||!rec.id)return null;if(_ibMusicMJobs[rec.id])return _ibMusicMJobs[rec.id];
  _ibMusicMJobs[rec.id]=(async function(){var dirty=false;
    try{if(!rec.metaScanned&&rec.blob instanceof Blob){var m=await IBMusicCore.readMeta(rec.blob);rec.title=m.title||rec.title||IBMusicCore.base(rec.name);rec.artist=m.artist||rec.artist||'';rec.album=m.album||rec.album||'';rec.cover=m.cover||rec.cover||'';rec.metaScanned=true;dirty=true}}catch(e){}
    if(!rec.analysis||rec.analysis.version!==IBMusicCore.VERSION){try{rec.analysis=await IBMusicCore.analyze(rec.blob);dirty=true;if(_pw.idx>=0&&_pw.list[_pw.idx]&&_pw.list[_pw.idx].id===rec.id)toast('歌曲结构分析完成')}catch(e){}}
    if(dirty){try{await dbPut('music',rec)}catch(e){}_pwPaint();_pwListDraw()}
    if(wantTranscript&&!rec.lyrics&&rec.blob instanceof Blob){try{var vt=await loadVT();if(vt&&vt.endpoint&&vt.apiKey&&vt.model){var lr=await IBMusicCore.transcribe(rec,vt,vtUrl);lr=_musicCleanLyricsM(lr);var latest=null;try{latest=await dbGet('music',rec.id)}catch(x){}if(latest&&latest.lyrics){Object.assign(rec,latest);console.info('[Music Together] transcript discarded: lyrics already exist (manual import wins)')}else{rec.lyrics=lr||{source:'transcript',segments:[],text:'',timed:false,at:Date.now()};rec.lyricsAttemptedAt=Date.now();await dbPut('music',rec);if(lr&&((lr.segments&&lr.segments.length)||lr.text))toast('歌曲人声时间轴已生成');else toast('歌曲结构已分析，未识别到可用人声')}try{if(window._maRefreshMusicM)window._maRefreshMusicM()}catch(x){}}}catch(e){console.warn('[Music Together] transcript failed',e)}}
    _musicSyncCardsM();return rec;
  })();try{return await _ibMusicMJobs[rec.id]}finally{delete _ibMusicMJobs[rec.id]}
}
buildMusicTail=function(userMsg,fid){
  var ma=(_mp&&_mp.musicAi)||{};if(!ma.share&&!ma.ctl)return'';var seg=[],a=_pw&&_pw.a,rec=(_pw&&_pw.idx>=0&&_pw.list)?_pw.list[_pw.idx]:null;
  if(ma.share&&rec&&a&&!a.paused&&!(ma.mate&&fid&&fid!==ma.mate)){var du=isFinite(a.duration)?a.duration:(rec.analysis&&rec.analysis.duration);seg.push(IBMusicCore.context(rec,a.currentTime||0,du,fid,ma))}
  if(ma.ctl&&_musicRelatedM(userMsg,rec)){var names=[];try{(_pw.list||[]).slice(0,12).forEach(function(it){names.push('《'+_pwName(it)+'》')})}catch(e){}if(names.length)seg.push('【当前歌单】'+names.join(''))}
  return seg.join('\n\n')
};
function _musicRelatedM(text,rec){var t=String(text||'').replace(/<[^>]+>/g,' '),title=_pwName(rec);if(title&&title.length>2&&t.toLowerCase().indexOf(title.toLowerCase())>=0)return true;return /(这首|这段|歌|音乐|旋律|节奏|歌词|副歌|高潮|播放|暂停|上一首|下一首|song|music|track|melody|rhythm|lyrics|listen)/i.test(t)}
function _musicSvgM(pause){return pause?'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="5" width="3.2" height="14" rx="1"/><rect x="13.8" y="5" width="3.2" height="14" rx="1"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6.2v11.6L18 12z"/></svg>'}
function _musicBuildCardM(snap){
  var card=document.createElement('div');card.className='chat-music-card';card.dataset.track=snap.trackId||'';card.dataset.at=String(snap.atSec||0);card.dataset.dur=String(snap.duration||0);
  var art=document.createElement('div');art.className='cmc-art';var tr=_musicTrackByIdM(snap.trackId);if(tr&&tr.cover){var im=document.createElement('img');im.src=tr.cover;im.alt='';art.appendChild(im)}else art.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="17" r="2.4"/><circle cx="17" cy="15" r="2.4"/><path d="M10.4 17V7.2L19.4 5v10"/></svg>';
  var mid=document.createElement('div');mid.className='cmc-mid';var st=document.createElement('div');st.className='cmc-status';st.textContent='Listening Together';var ti=document.createElement('div');ti.className='cmc-title';ti.textContent=snap.title||'Music';var ar=document.createElement('div');ar.className='cmc-artist';ar.textContent=snap.artist||'Internal Beyond';var line=document.createElement('div');line.className='cmc-line';var bar=document.createElement('div');bar.className='cmc-bar';bar.innerHTML='<i></i>';var tm=document.createElement('span');tm.className='cmc-time';line.appendChild(bar);line.appendChild(tm);mid.appendChild(st);mid.appendChild(ti);mid.appendChild(ar);mid.appendChild(line);var btn=document.createElement('button');btn.className='cmc-play';btn.type='button';btn.innerHTML=_musicSvgM(false);card.appendChild(art);card.appendChild(mid);card.appendChild(btn);
  btn.addEventListener('click',async function(e){e.stopPropagation();await _pwLoad();var ix=_pw.list.findIndex(function(x){return x.id===card.dataset.track});if(ix<0){toast('这首歌已不在本机曲库');return}if(_pw.idx!==ix){await _pwPlayIdx(ix)}else{var a=_pwA();if(a.paused)a.play().catch(function(){toast('播放失败')});else a.pause()}_musicSyncCardsM()});
  bar.addEventListener('click',function(e){e.stopPropagation();var a=_pw.a;if(!a||_pw.idx<0||!_pw.list[_pw.idx]||_pw.list[_pw.idx].id!==card.dataset.track||!isFinite(a.duration))return;var r=bar.getBoundingClientRect();a.currentTime=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*a.duration;_musicSyncCardsM()});
  card.addEventListener('click',function(e){if(e.target.closest('button,.cmc-bar'))return;openSheet('sheet-music');_pwListDraw()});return card;
}
function _musicSyncCardsM(){var g=convEl('cv-msgs');if(!g)return;var cards=Array.from(g.querySelectorAll('.chat-music-card')),live=cards.length?cards[cards.length-1]:null;cards.forEach(function(c){var tr=_musicTrackByIdM(c.dataset.track),isLive=c===live&&_pw.idx>=0&&_pw.list[_pw.idx]&&_pw.list[_pw.idx].id===c.dataset.track,a=_pw.a,sec=isLive&&a?(a.currentTime||0):Number(c.dataset.at||0),du=isLive&&a&&isFinite(a.duration)?a.duration:Number(c.dataset.dur||0),fill=c.querySelector('.cmc-bar i'),tm=c.querySelector('.cmc-time'),btn=c.querySelector('.cmc-play'),st=c.querySelector('.cmc-status'),art=c.querySelector('.cmc-art');if(fill)fill.style.width=(du>0?Math.max(0,Math.min(100,sec/du*100)):0)+'%';if(tm)tm.textContent=IBMusicCore.fmt(sec)+(du>0?' / '+IBMusicCore.fmt(du):'');if(btn){var playing=!!(isLive&&a&&!a.paused);btn.innerHTML=_musicSvgM(playing);btn.classList.toggle('playing',playing)}if(st)st.textContent=isLive?'Listening Together':'Shared from listening';if(tr&&tr.cover&&art&&!art.querySelector('img')){art.innerHTML='';var im=document.createElement('img');im.src=tr.cover;im.alt='';art.appendChild(im)}})}
var _oldRenderAiBodyM=renderAiBody;renderAiBody=function(host,msgEl,m){_oldRenderAiBodyM(host,msgEl,m);if(m&&m.musicCard&&!host.querySelector(':scope>.chat-music-card'))host.appendChild(_musicBuildCardM(m.musicCard));setTimeout(_musicSyncCardsM,0)};
var _oldSaveAiM=saveAi;saveAi=async function(cfg,content,thinking,aiEl,ctx){var am=await _oldSaveAiM(cfg,content,thinking,aiEl,ctx);try{if(am&&!/<ws_music\b/i.test(String(content||''))){await loadMP();var ma=(_mp&&_mp.musicAi)||{},rec=(_pw.idx>=0&&_pw.list)?_pw.list[_pw.idx]:null,a=_pw.a;if(ma.share&&rec&&a&&!a.paused){var key=(am.friendId||'')+'|'+(am.threadId||'')+'|'+rec.id;if(!_ibMusicMSeen[key]||_musicRelatedM(content,rec)){_ibMusicMSeen[key]=1;am.musicCard=IBMusicCore.snapshot(rec,a.currentTime||0,isFinite(a.duration)?a.duration:(rec.analysis&&rec.analysis.duration));await dbPut('chatMessages',am);redrawMsg(am);_musicEnsureM(rec,true)}}}}catch(e){}return am};
var _oldProcIbOpsM=procIbOps;procIbOps=async function(cfg,m){var raw=String(m&&m.content||''),has=/<ws_music\b/i.test(raw),oldN=(m&&m.ibOps&&m.ibOps.length)||0;await _oldProcIbOpsM(cfg,m);if(!has||!m)return;try{await new Promise(function(r){setTimeout(r,90)});var labs={播放器:1,播放歌曲:1,播放:1,继续播放:1,暂停播放:1,暂停:1,下一首:1,上一首:1};if(Array.isArray(m.ibOps)){var kept=[],removed=false;m.ibOps.forEach(function(x,i){if(i>=oldN&&!removed&&x&&labs[x.label]){removed=true;return}kept.push(x)});m.ibOps=kept}var rec=(_pw.idx>=0&&_pw.list)?_pw.list[_pw.idx]:null,a=_pw.a;if(rec){m.musicCard=IBMusicCore.snapshot(rec,a?(a.currentTime||0):0,a&&isFinite(a.duration)?a.duration:(rec.analysis&&rec.analysis.duration));await dbPut('chatMessages',m);redrawMsg(m);_musicSyncCardsM()}}catch(e){}};
(function(){try{var f=$('pw-file');if(f)f.setAttribute('accept','audio/*,.mp3,.m4a,.aac,.wav,.flac,.ogg,.oga,.opus,.webm,.mp4,.mpeg,.mpga,.3gp,.3gpp,.amr,.caf,.aif,.aiff,.lrc,.srt,.vtt');var s=$('music-share');if(s)s.addEventListener('click',function(){setTimeout(async function(){try{await loadMP();if(_mp.musicAi&&_mp.musicAi.share&&_pw.idx>=0&&_pw.list[_pw.idx])_musicEnsureM(_pw.list[_pw.idx],true)}catch(e){}},80)});var a=_pwA();['timeupdate','play','pause','loadedmetadata','ended'].forEach(function(ev){a.addEventListener(ev,_musicSyncCardsM)})}catch(e){}})();

(function(){
  function $i(x){return document.getElementById(x)}
  var _maBound=false,_maTrackId='',_maLyrIdx=-1;
  function _maCur(){return (typeof _pw!=='undefined'&&_pw.idx>=0&&_pw.list)?_pw.list[_pw.idx]:null}
  window.openMusicApp=async function(){
    try{await _pwLoad()}catch(e){}
    var el=$i('music-app');if(!el)return;
    el.classList.add('open');_maBindOnce();_maPaint(true);_maDuoDraw();
  };
  function closeMusicApp(){var el=$i('music-app');if(el)el.classList.remove('open')}
  function _maBindOnce(){
    if(_maBound)return;_maBound=true;
    $i('ma-back').addEventListener('click',closeMusicApp);
    $i('ma-queue').addEventListener('click',function(){openSheet('sheet-music');try{_pwListDraw()}catch(e){}});
    $i('ma-addtop').addEventListener('click',function(){if(window._pwPickFiles)window._pwPickFiles('audio');else{var f=$('pw-file');if(f){try{f.value=''}catch(e){}f.click()}}});
    $i('ma-mate').addEventListener('click',_maMateBtn);
    $i('ma-play').addEventListener('click',function(){var b=$('pw-play');if(b)b.click();setTimeout(function(){_maPaint()},80)});
    $i('ma-prev').addEventListener('click',function(){var b=$('pw-prev');if(b)b.click()});
    $i('ma-next').addEventListener('click',function(){var b=$('pw-next');if(b)b.click()});
    $i('ma-mode').addEventListener('click',function(){var b=$('pw-mode');if(b)b.click();setTimeout(function(){_maPaint()},80)});
    var pb=$i('ma-pb');
    function seek(e){var a=_pwA();if(!a||!isFinite(a.duration)||a.duration<=0)return;var r=pb.getBoundingClientRect();var x=(e.touches&&e.touches[0]?e.touches[0].clientX:e.clientX);a.currentTime=Math.max(0,Math.min(1,(x-r.left)/r.width))*a.duration;_maTime()}
    pb.addEventListener('pointerdown',function(e){e.preventDefault();seek(e);
      var mv=function(ev){seek(ev)},up=function(){window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up)};
      window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up)});
    $i('ma-lyr').addEventListener('click',function(e){
      var ab=e.target.closest('#ma-lyradd');if(ab){if(window._pwPickFiles)window._pwPickFiles('lyrics');else{var f=$('pw-file');if(f){try{f.value=''}catch(x){}f.click()}}return}
      var ln=e.target.closest('.ma-ln');if(!ln)return;var s=parseFloat(ln.dataset.s);var a=_pwA();
      if(isFinite(s)){a.currentTime=s;a.play().catch(function(){})}
    });
    try{var a=_pwA();
      a.addEventListener('timeupdate',_maTime);
      a.addEventListener('play',function(){_maPaint()});
      a.addEventListener('pause',function(){_maPaint()});
      a.addEventListener('loadedmetadata',function(){_maPaint(true)});
    }catch(e){}
  }
  function _maPaint(fresh){
    var el=$i('music-app');if(!el||!el.classList.contains('open'))return;
    var cur=_maCur();var a=(typeof _pw!=='undefined'&&_pw.a)?_pw.a:null;
    $i('ma-t').textContent=cur?_pwName(cur):'Music';
    var sub='';
    if(!cur){sub=(typeof _pw!=='undefined'&&_pw.list&&_pw.list.length)?'从曲库选一首开始':'曲库为空 · 点右上角或「＋」添加音乐'}
    else sub=(cur.artist||cur.album||'InternalBeyond.com');
    $i('ma-s').textContent=sub;
    var playing=!!(a&&!a.paused&&cur);
    el.classList.toggle('playing',playing);
    var pw=$('pw-play');if(pw)$i('ma-play').innerHTML=pw.innerHTML;
    var pm=$('pw-mode');if(pm)$i('ma-mode').innerHTML=pm.innerHTML;
    var tid=cur?String(cur.id||''):'';
    if(fresh||tid!==_maTrackId){
      _maTrackId=tid;_maLyrIdx=-1;
      var cov=cur&&cur.cover?String(cur.cover):'';
      el.classList.toggle('has-cover',!!cov);
      var _vl=el.querySelector('.ma-vlabel');if(_vl)_vl.style.backgroundImage=cov?('url("'+cov+'")'):'';/* v92-m：封面直接落在唱片盘芯上 */
      $i('ma-bg').style.backgroundImage=cov?('url("'+cov+'")'):'';
      _maLyrDraw(cur);
    }
    _maTime();
  }
  window._maRefreshMusicM=function(){try{_maPaint(true)}catch(e){}};
  function _maLyrDraw(cur){
    var box=$i('ma-lyr');if(!box)return;box.innerHTML='';
    var raw=(cur&&cur.lyrics&&Array.isArray(cur.lyrics.segments))?cur.lyrics.segments.slice():[];
    var segs=(window._musicCleanSegsM||function(s){return s||[]})(raw);
    if(!cur){box.innerHTML='<div class="ma-lyr-empty">这里会显示逐句歌词。</div>';return}
    if(!segs.length){
      var _instr=!!(cur.lyrics&&(cur.lyrics.instrumental||raw.length))||!!cur.lyricsAttemptedAt;
      box.innerHTML=_instr
        ?'<div class="ma-lyr-empty">听起来是纯音乐——转写没有检出人声歌词。<br>如果它其实有词，可以直接导入 .lrc / .srt / .vtt 文件；单个文件会绑定到当前歌曲。<br><button class="btn mini" id="ma-lyradd">导入歌词文件</button></div>'
        :'<div class="ma-lyr-empty">这首歌还没有歌词。<br>直接导入 .lrc / .srt / .vtt 文件即可逐句滚动显示；单个文件会绑定到当前歌曲。<br><button class="btn mini" id="ma-lyradd">导入歌词文件</button></div>';
      return;
    }
    segs.sort(function(x,y){return (Number(x.start)||0)-(Number(y.start)||0)});
    segs.forEach(function(s){
      var d=document.createElement('div');d.className='ma-ln';d.dataset.s=String(Number(s.start)||0);
      d.textContent=String(s.text||'').trim()||'…';box.appendChild(d);
    });
  }
  function _maTime(){
    var el=$i('music-app');if(!el||!el.classList.contains('open'))return;
    var a=(typeof _pw!=='undefined'&&_pw.a)?_pw.a:null;if(!a)return;
    var cur=_maCur();var tid=cur?String(cur.id||''):'';
    if(tid!==_maTrackId){_maPaint(true);return}
    var d=a.duration;
    $i('ma-cur').textContent=_pwFmt(a.currentTime);
    $i('ma-dur').textContent=_pwFmt(d);
    var f=$i('ma-fill');if(f)f.style.width=((isFinite(d)&&d>0)?(a.currentTime/d*100):0)+'%';
    /* 歌词同步：最后一个 start<=t 的句子高亮并滚到视野中部 */
    var box=$i('ma-lyr');if(!box||!box.firstChild||box.firstChild.className==='ma-lyr-empty')return;
    var lns=box.children,idx=-1,tt=a.currentTime;
    for(var i=0;i<lns.length;i++){if(parseFloat(lns[i].dataset.s)<=tt+0.15)idx=i;else break}
    if(idx===_maLyrIdx)return;
    if(_maLyrIdx>=0&&lns[_maLyrIdx])lns[_maLyrIdx].classList.remove('on');
    _maLyrIdx=idx;
    if(idx>=0&&lns[idx]){lns[idx].classList.add('on');
      try{box.scrollTo({top:lns[idx].offsetTop-box.clientHeight/2+lns[idx].offsetHeight/2,behavior:'smooth'})}catch(e){box.scrollTop=lns[idx].offsetTop-box.clientHeight/2}}
  }
  /* ── 一起听 ── */
  function _maAvaHtml(src,name){
    return '<span class="ma-ava">'+(src?('<img src="'+esc(src)+'" alt="">'):('<span>'+esc(String(name||'?').slice(0,1))+'</span>'))+'</span>';
  }
  async function _maDuoDraw(){
    var host=$i('ma-duo');if(!host)return;
    try{await loadMP()}catch(e){}
    var ma=(_mp&&_mp.musicAi)||{};var mate=ma.mate||'';
    var cfg=null;
    if(mate){try{await loadCfgs()}catch(e){}cfg=((typeof _cfgs!=='undefined'&&_cfgs)||[]).find(function(x){return x&&x.id===mate})||null}
    var mbn=$i('ma-mate');if(mbn)mbn.classList.toggle('on',!!cfg);
    if(!cfg){host.innerHTML='';host.style.display='none';return}
    host.style.display='';
    var me=null;try{me=await loadAbout()}catch(e){}
    host.innerHTML='<div class="ma-duo2" role="button" title="一起听管理"><span class="pair">'
      +_maAvaHtml((typeof _pfAvatar==='function'?_pfAvatar(me||{}):(me&&me.avatar)),(me&&me.name)||'我')+_maAvaHtml((typeof _pfAvatar==='function'?_pfAvatar(cfg):cfg.avatar),cfgName(cfg))/* v117-p：#15 走 _pfAvatar（含 Infernal 套头像），修只显首字母 */
      +'</span><span class="ma-duo-cap" id="ma-duocap"></span></div>';
    _maCapDraw();
    host.querySelector('.ma-duo2').addEventListener('click',function(){_maMateSheet(cfg)});
  }
  function _maFmtDur(ms){ms=Math.max(0,+ms||0);var h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000);
    if(h>0)return h+' 小时 '+m+' 分钟';
    if(m>0)return m+' 分钟';
    return '1 分钟'}/* v93-m 任务④：不足一分钟也按 1 分钟显示 */
  function _maCapDraw(){
    var el=$i('ma-duocap');if(!el)return;
    var ma=(typeof _mp!=='undefined'&&_mp&&_mp.musicAi)||{};var mate=ma.mate||'';if(!mate)return;
    var nm='';try{var c=((typeof _cfgs!=='undefined'&&_cfgs)||[]).find(function(x){return x&&x.id===mate});nm=c?cfgName(c):''}catch(e){}
    var ms=(ma.mateTime&&ma.mateTime[mate])||0;
    el.textContent=nm+' 和你一起听了 '+_maFmtDur(ms);
  }
  function _maMateSheet(cfg){
    actionSheet([
      {label:'去和 '+cfgName(cfg)+' 聊天',fn:function(){closeMusicApp();try{openConv(cfg)}catch(e){navTo('chat')}}},
      {label:'结束一起听',danger:true,fn:async function(){await loadMP();_mp.musicAi=_mp.musicAi||{};delete _mp.musicAi.mate;await saveMP();_maDuoDraw();toast('已结束一起听（「共享正在播放」开关保持原样，可在设置里关）')}}
    ]);
  }
  function _maMateBtn(){
    var ma=(typeof _mp!=='undefined'&&_mp&&_mp.musicAi)||{};var mate=ma.mate||'';
    if(!mate){_maMatePick();return}
    var cfg=((typeof _cfgs!=='undefined'&&_cfgs)||[]).find(function(x){return x&&x.id===mate});
    if(cfg)_maMateSheet(cfg);else _maMatePick();
  }
  /* 一起听时长统计：全局累计（不依赖界面开着），20 秒节流落库，暂停时立即落一次 */
  var _mtAccLast=0,_mtAccDirty=0,_mtCapTick=0;
  try{(function(){var _aac=_pwA();
    _aac.addEventListener('timeupdate',function(){
      var now=Date.now();
      if(_mtAccLast&&!_aac.paused&&typeof _mp!=='undefined'&&_mp&&_mp.musicAi&&_mp.musicAi.mate){
        var d=now-_mtAccLast;
        if(d>0&&d<3000){var ma=_mp.musicAi;ma.mateTime=ma.mateTime||{};ma.mateTime[ma.mate]=(ma.mateTime[ma.mate]||0)+d;_mtAccDirty+=d;
          if(_mtAccDirty>=20000){_mtAccDirty=0;try{saveMP()}catch(e){}}
          if(now-_mtCapTick>10000){_mtCapTick=now;try{_maCapDraw()}catch(e){}}
        }
      }
      _mtAccLast=now;
    });
    _aac.addEventListener('pause',function(){_mtAccLast=0;if(_mtAccDirty>0){_mtAccDirty=0;try{saveMP()}catch(e){}}try{_maCapDraw()}catch(e){}});
    _aac.addEventListener('play',function(){_mtAccLast=Date.now()});
  })()}catch(e){}
  async function _maMatePick(){
    try{await loadCfgs()}catch(e){}
    var list=((typeof _cfgs!=='undefined'&&_cfgs)||[]).filter(function(c){return c&&!String(c.id).startsWith('group_')});
    var box=$i('mate-list');if(!box)return;
    box.innerHTML='';
    if(!list.length){box.innerHTML='<div class="empty">还没有 AI 好友，先去 API 页添加。</div>'}
    list.forEach(function(c){
      var row=document.createElement('div');row.className='mate-row';
      row.innerHTML=_maAvaHtml((typeof _pfAvatar==='function'?_pfAvatar(c):c.avatar),cfgName(c))+'<div style="flex:1;min-width:0"><b>'+esc(cfgName(c))+'</b><small>'+esc(c.model||'')+'</small></div>';
      row.addEventListener('click',async function(){
        await loadMP();_mp.musicAi=Object.assign({},_mp.musicAi||{},{mate:c.id,share:true});await saveMP();
        closeSheets();_maDuoDraw();
        toast('已开启一起听：正在播放与歌词此后只随消息带给 '+cfgName(c)+'（其他好友暂不共享），时长从现在开始累计');
      });
      box.appendChild(row);
    });
    openSheet('sheet-mate');
  }
  /* 桌面图标与聊天音乐卡入口 */
  var mb=$i('sb-musicapp');if(mb)mb.addEventListener('click',function(){openMusicApp()});
  document.addEventListener('click',function(e){
    if(!e.target||!e.target.closest)return;
    var c=e.target.closest('.chat-music-card');if(!c)return;
    if(e.target.closest('.cmc-play')||e.target.closest('.cmc-bar'))return;
    openMusicApp();
  });

  function _caSiteIcon(){try{var l=document.getElementById('ib-ati');return (l&&l.getAttribute('href'))||''}catch(e){return ''}}
  
  var _CA_HEART_D='M73.2 37C89.63 37 103.07 54.16 118 47.92C126.96 44.02 137.41 37 137.41 27.64C137.41 22.02 133.08 17.5 127.71 17.5C122.33 17.5 118 22.02 118 27.64C118 22.02 113.67 17.5 108.29 17.5C102.92 17.5 98.59 22.02 98.59 27.64C98.59 37 109.04 44.02 118 47.92C132.93 54.16 146.37 37 162.8 37';
  var _CA_ORBIT_D='M73.2 37A36.2 36.2 0 1 1 0.8 37A36.2 36.2 0 1 1 73.2 37C89.63 37 103.07 54.16 118 47.92C126.96 44.02 137.41 37 137.41 27.64C137.41 22.02 133.08 17.5 127.71 17.5C122.33 17.5 118 22.02 118 27.64C118 22.02 113.67 17.5 108.29 17.5C102.92 17.5 98.59 22.02 98.59 27.64C98.59 37 109.04 44.02 118 47.92C132.93 54.16 146.37 37 162.8 37A36.2 36.2 0 1 1 235.2 37A36.2 36.2 0 1 1 162.8 37C146.37 37 132.93 54.16 118 47.92C109.04 44.02 98.59 37 98.59 27.64C98.59 22.02 102.92 17.5 108.29 17.5C113.67 17.5 118 22.02 118 27.64C118 22.02 122.33 17.5 127.71 17.5C133.08 17.5 137.41 22.02 137.41 27.64C137.41 37 126.96 44.02 118 47.92C103.07 54.16 89.63 37 73.2 37Z';/* v142-p：#2 流光闭合轨道：左环整圈 → 爱心 → 右环整圈 → 爱心折返；环 r=36.2 正落在头像强调色描边带上 */
  var _CA_UNDER_SVG='<svg class="ca-orbit under" viewBox="0 0 236 74" aria-hidden="true"><path class="l-halo" d="'+_CA_HEART_D+'"/><path class="l-tube" d="'+_CA_HEART_D+'"/><path class="l-base" d="'+_CA_HEART_D+'"/></svg>';/* v143-p：#2 玻璃管三层 */
  var _CA_OVER_SVG='<svg class="ca-orbit over" viewBox="0 0 236 74" aria-hidden="true"><path class="l-liq" d="'+_CA_ORBIT_D+'" pathLength="100"/><path class="l-flow2" d="'+_CA_ORBIT_D+'" pathLength="100"/><path class="l-flow" d="'+_CA_ORBIT_D+'" pathLength="100"/><path class="l-glint" d="'+_CA_ORBIT_D+'" pathLength="100"/></svg>';/* v144-p：#2 增白色高光短段 l-glint（最上层） *//* v143-p：#2 液团 / 拖尾 / 亮头三层同轨同速 */
  function _caNameCls(s){return /[\u3040-\u30ff\u3400-\u9fff\uF900-\uFAFF\uAC00-\uD7AF]/.test(String(s||''))?'n-cjk':'n-lat'}/* v142-p：#2 名字按字符集配对排印（中西混排 CP 化） */
  var _caBound=false,_caHeroIdx=0,_caHeros=[];
  async function _caEarliest(fid){var mn=0;try{var ms=await dbGetByIndex('chatMessages','byFriend',fid);(ms||[]).forEach(function(m){var x=m.timestamp||m.ts||0;if(x&&(!mn||x<mn))mn=x})}catch(e){}return mn}
  async function _caBuildHeros(){
    _caHeros=[];
    var cs=null;try{cs=await _advCalSetM()}catch(e){}
    var ms=(cs&&cs.meetSet)||{};
    var list=[];try{await loadCfgs();list=(_cfgs||[]).concat((typeof _archived!=='undefined'&&_archived)||[])}catch(e){}
    var site=0,siteManual=0;
    var _sIso=ms.__ib__||ms.__ib;
    if(_sIso){var _sd=new Date(_sIso+'T00:00:00');if(!isNaN(_sd))siteManual=_sd.getTime()}
    for(var i=0;i<list.length;i++){
      var c=list[i];if(!c||!c.id||c._group)continue;
      var t=0,iso=ms[c.id];
      if(iso){var d0=new Date(iso+'T00:00:00');if(!isNaN(d0))t=d0.getTime()}
      if(!t)t=await _caEarliest(c.id);
      if(!t)t=c.created||0;
      if(t&&(!site||t<site))site=t;
      _caHeros.push({name:(typeof cfgName==='function'?cfgName(c):(c.nickname||c.model||'AI')),ts:t,ava:c.avatar||'',id:c.id});/* v140-p：#1 名片要头像 */
    }
    _caHeros.sort(function(a,b){return (a.ts||9e15)-(b.ts||9e15)});
    _caHeros.unshift({name:'InternalBeyond',ts:(siteManual||site),site:true});/* v142-p：#1 手动值优先，无手动值沿用推算 */
  }
  window.openCalApp=async function(){
    try{await loadCal()}catch(e){}
    try{if(typeof loadAbout==='function')await loadAbout()}catch(e){}/* v140-p：#1 名片要用户昵称与头像 */
    var el=$i('cal-app');if(!el)return;
    el.classList.add('open');_caBindOnce();
    _caHeroIdx=0;
    try{await _caBuildHeros()}catch(e){_caHeros=[{name:'InternalBeyond',ts:0,site:true}]}
    caRender();
  };
  function closeCalApp(){var el=$i('cal-app');if(el)el.classList.remove('open')}
  function _caBindOnce(){
    if(_caBound)return;_caBound=true;
    $i('ca-back').addEventListener('click',closeCalApp);
    $i('ca-new').addEventListener('click',function(){_caOpenSheet('',ymd(new Date()))});
    var _caRs=null;window.addEventListener('resize',function(){clearTimeout(_caRs);_caRs=setTimeout(function(){var el=$i('cal-app');if(el&&el.classList.contains('open'))_caFitNames($i('ca-hero'))},120)});/* v141-p：#2 旋转 / 改宽时重算字号 */
  }
  function _caKindCls(k){return k==='anni'||k==='anniv'||k==='birthday'?'k-anni':(k==='memo'?'k-memo':(k==='meet'?'k-meet':(k==='period'?'k-period':'')))}/* v156-p：#5 */
  function _caOpenSheet(editId,dateStr,ev){
    window._caleEditId=editId||'';
    $('cale-title').textContent=editId?'编辑事项':'新建事项';
    $('cale-t').value=ev?(ev.title||''):'';
    var k=(ev&&ev.kind)||'plan';$('cale-kind').value=(k==='anniv'||k==='birthday')?'anni':(k==='memo'?'memo':(k==='anni'?'anni':(k==='period'?'period':'plan')));/* v156-p：#5 */
    $('cale-date').value=(ev&&ev.date)||dateStr||ymd(new Date());
    $('cale-time').value=(ev&&ev.time)||'';
    $('cale-rep').value=(ev&&ev.repeat)||'once';/* evOccursOn 的不重复取值是 'once' */
    $('cale-lead').value=String((ev&&ev.lead!=null)?ev.lead:7);
    sw2($('cale-ai'),!!(ev&&ev.remind));
    $('cale-note').value=(ev&&ev.note)||'';
    try{$('cale-cycle').value=String((ev&&ev.cycle)||28);$('cale-pdays').value=String((ev&&ev.pdays)||5)}catch(e){}_calePeriodUI();/* v156-p：#5 */
    openSheet('sheet-cal');
  }
  function _caDu(ev){/* 距下一次发生的天数；单次已过 = 9999 */
    var t0=new Date();t0.setHours(0,0,0,0);
    for(var i=0;i<=366;i++){var d=new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()+i);try{if(evOccursOn(ev,ymd(d)))return i}catch(e){return 9999}}
    return 9999;
  }
  function _caFitNames(hero){
    try{
      var n=hero&&hero.querySelector('.ca-names');if(!n)return;
      n.style.fontSize='';n.classList.remove('wrap');
      var W=n.clientWidth;if(!W)return;
      var base=parseFloat(getComputedStyle(n).fontSize)||19,fs=base,min=Math.max(9,base*.55);
      while(n.scrollWidth>W+1&&fs>min){fs-=.5;n.style.fontSize=fs+'px'}
      if(n.scrollWidth>W+1)n.classList.add('wrap');
    }catch(e){}
  }
  function _caAnnivDu(ts){/* 周年倒计时 */
    if(!ts)return null;var t0=new Date();t0.setHours(0,0,0,0);var b=new Date(ts);
    var nx=new Date(t0.getFullYear(),b.getMonth(),b.getDate());
    if(nx<t0)nx=new Date(t0.getFullYear()+1,b.getMonth(),b.getDate());
    return Math.round((nx-t0)/86400000);
  }
  function caRender(){
    
    var hero=$i('ca-hero');
    if(hero){
      if(!_caHeros.length)_caHeros=[{name:'InternalBeyond',ts:0,site:true}];
      if(_caHeroIdx>=_caHeros.length)_caHeroIdx=0;if(_caHeroIdx<0)_caHeroIdx=_caHeros.length-1;
      var h=_caHeros[_caHeroIdx];
      var t0=new Date();t0.setHours(0,0,0,0);
      var nm=h.site?'与 InternalBeyond 的相遇纪念日':'与 '+h.name+' 的相遇纪念日';
      hero.classList.toggle('no-record',!h.ts);
      var meName=String((typeof _about!=='undefined'&&_about&&_about.name)||'Sui'),meAva='';
      try{meAva=(typeof _pfAvatar==='function'?_pfAvatar(_about):(_about&&_about.avatar))||''}catch(e){}
      var aiAva=h.site?_caSiteIcon():(h.ava||'');
      var html='<button class="ca-hb" id="ca-hprev" title="上一位"><svg viewBox="0 0 24 24"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg></button><div class="ca-hm">'
        +'<div class="ca-duo">'+_CA_UNDER_SVG+'<div class="ca-ava me"></div><div class="ca-ava ai'+(h.site?' site':'')+'"></div>'+_CA_OVER_SVG+'</div>'
        +'<div class="ca-names"><span class="'+_caNameCls(meName)+'">'+esc(meName)+'</span><i>&amp;</i><span class="'+_caNameCls(h.name)+'">'+esc(h.name)+'</span></div>';
      if(!h.ts){
        html+='<div class="ca-en">No record yet</div><div class="ca-anni">'+esc(nm)+'</div><div class="ca-meta2"><span>尚无记录 · 第一次说话的日子会记在这里</span></div>';
      }else{
        var b=new Date(h.ts);var comp=Math.max(0,Math.floor((t0-new Date(b.getFullYear(),b.getMonth(),b.getDate()))/86400000));
        var du=_caAnnivDu(h.ts);var pct=Math.max(0,Math.min(1,(365-du)/365));
        html+='<div class="ca-en">Together for <b>'+comp+'</b> '+(comp===1?'day':'days')+'</div>'
          +'<div class="ca-anni">'+esc(nm)+'</div>'
          +'<div class="ca-meta2"><span>'+b.getFullYear()+'年'+(b.getMonth()+1)+'月'+b.getDate()+'日</span><em'+(du===0?' class="today"':'')+'>'+(du===0?'就是今天 · Anniversary':'倒计时 <b>'+du+'</b> 天')+'</em></div>'
          +'<div class="ca-hbar"><i style="width:'+(pct*100).toFixed(1)+'%"></i></div>';
      }
      html+='</div><button class="ca-hb" id="ca-hnext" title="下一位"><svg viewBox="0 0 24 24"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg></button>';
      hero.innerHTML=html;
      _caFitNames(hero);/* v141-p：#2 名字完整显示 */
      try{setAvaEl(hero.querySelector('.ca-ava.me'),meAva,meName);setAvaEl(hero.querySelector('.ca-ava.ai'),aiAva,h.name)}catch(e){}
      var pv=$i('ca-hprev'),nx2=$i('ca-hnext');
      if(pv)pv.addEventListener('click',function(){_caHeroIdx--;caRender()});
      if(nx2)nx2.addEventListener('click',function(){_caHeroIdx++;caRender()});
    }
    
    var evs=(typeof _calEvents!=='undefined'&&_calEvents)||[];
    var rows=evs.map(function(ev){return{ev:ev,du:_caDu(ev)}});
    rows.sort(function(a,b){return a.du-b.du||String(a.ev.date||'').localeCompare(String(b.ev.date||''))});
    var lab=$i('ca-lab');if(lab)lab.innerHTML='<span>ALL · 全部日程</span><b>'+evs.length+' 项</b>';
    var box=$i('ca-list');if(!box)return;box.innerHTML='';
    if(!rows.length){box.innerHTML='<div class="ca-grp"><div class="ca-empty"><svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17M8 3v4M16 3v4M8.5 14h3M8.5 17h7"/></svg><span>还没有任何日程<br>点右上「＋」记下第一条</span></div></div>';return}
    var KN={plan:'计划',anni:'纪念日',anniv:'纪念日',birthday:'生日',memo:'备忘',meet:'相遇纪念',period:'生理期'};/* v156-p：#5 */
    var RN={cycle:'按周期',once:'单次',none:'单次',daily:'每天',weekly:'每周',monthly:'每月',yearly:'每年'};
    var MN=['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    function _leaf(ev,du){/* 日期叶：下一次发生的月/日；单次已过显原日期 */
      var d=null;
      if(du<9999){d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+du)}
      else{var p=String(ev.date||'').split('-');if(p.length===3)d=new Date(+p[0],+p[1]-1,+p[2])}
      if(!d||isNaN(d.getTime()))return'<div class="ca-leaf"><span>—</span><b>·</b></div>';
      return'<div class="ca-leaf"><span>'+MN[d.getMonth()]+'</span><b>'+d.getDate()+'</b></div>';
    }
    var GB=[{k:'today',en:'TODAY',cn:'今天',t:function(du){return du===0}},
      {k:'week',en:'WITHIN 7 DAYS',cn:'7 天内',t:function(du){return du>=1&&du<=7}},
      {k:'later',en:'UPCOMING',cn:'之后',t:function(du){return du>7&&du<9999}},
      {k:'past',en:'PAST',cn:'已过去',t:function(du){return du>=9999}}];
    GB.forEach(function(g){
      var part=rows.filter(function(r){return g.t(r.du)});
      if(!part.length)return;
      var gl=document.createElement('div');gl.className='ca-glab'+(g.k==='past'?' g-past':'');
      gl.innerHTML='<span class="en">'+g.en+'</span><span class="cn">'+g.cn+'</span><b>'+part.length+'</b>';
      box.appendChild(gl);
      var grp=document.createElement('div');grp.className='ca-grp';
      part.forEach(function(r){
        var ev=r.ev,du=r.du;
        var row=document.createElement('div');row.className='ca-ev '+_caKindCls(ev.kind)+(du>=9999?' past':'');
        var chips='<i class="ck">'+(KN[ev.kind]||'事项')+'</i><i>'+esc(String(ev.date||''))+(ev.endDate?'—'+esc(ev.endDate):'')+'</i><i>'+(RN[ev.repeat||'once']||'单次')+'</i><i>'+(ev.virtual?'当天与前后一天':(ev.remind?('提前'+((ev.lead!=null?ev.lead:7))+'天提醒'):'不提醒'))+'</i>'+(ev.time?'<i>'+esc(ev.time)+'</i>':'');/* v189-p */
        row.innerHTML=_leaf(ev,du)
          +'<div class="tt"><div class="t1"><b>'+esc(ev.title||'')+'</b></div><div class="t2">'+chips+'</div>'+(ev.note?'<div class="t3">'+esc(ev.note)+'</div>':'')+'</div>'
          +'<div class="rt"><span class="ca-du'+(du===0?' now':'')+'">'+(du>=9999?'已过去':(du===0?'今天':du+' 天后'))+'</span>'
          +'<button class="cx" title="删除"><svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button></div>';
        row.addEventListener('click',function(){_caOpenSheet(ev.id,ev.date,ev)});
        row.querySelector('.cx').addEventListener('click',async function(e){
          e.stopPropagation();
          if(!await confirmDlg('删除「'+(ev.title||'')+'」？','删除'))return;
          try{await dbDelete('calEvents',ev.id)}catch(err){toast('删除失败');return}
          await loadCal();caRender();try{drawCal()}catch(e2){}toast('已删除');
        });
        grp.appendChild(row);
      });
      box.appendChild(grp);
    });
  }
  window._caAppRefresh=async function(){/* 保存/AI 写日历后热刷新（参数兼容旧调用，忽略） */
    var el=$i('cal-app');if(!el||!el.classList.contains('open'))return;
    try{await loadCal()}catch(e){}
    caRender();
  };
  try{var _oldAdvCal=_advCalRefreshM;_advCalRefreshM=function(){try{_oldAdvCal()}catch(e){}try{window._caAppRefresh&&window._caAppRefresh()}catch(e){}}}catch(e){}
  var cb=$i('sb-calapp');if(cb)cb.addEventListener('click',function(){openCalApp()});
})();

