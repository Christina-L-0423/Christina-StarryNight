

(function(){
'use strict';
var LS='ib_qqm';
var S={uin:'',key:'',lt:0,euin:'',openid:'',rt:'',at:'',rk:'',exp:0,unionid:'',strUin:'',nick:'',ava:'',vip:'',q:[],pl:{id:0,dirid:0,name:''},lv:'hq',ai:{search:true,playlist:true,like:false,edit:false,create:false},pls:[],plsAt:0,proxy:'',guid:''};
function load(){try{var j=JSON.parse(localStorage.getItem(LS)||'null');if(j&&typeof j==='object'){Object.keys(j).forEach(function(k){S[k]=j[k]});if(!S.ai||typeof S.ai!=='object')S.ai={search:true,playlist:true,like:false,edit:false,create:false};if(!Array.isArray(S.q))S.q=[];if(!S.pl)S.pl={id:0,dirid:0,name:''};if(!Array.isArray(S.pls))S.pls=[]}}catch(e){}}
var _svT=0;function _saveNow(){_svT=0;try{localStorage.setItem(LS,JSON.stringify(S,function(k,v){if(k==='lyrics'||k==='coverData'||k==='_hd')return undefined;return v}))}catch(e){}}function save(){if(_svT)return;_svT=setTimeout(_saveNow,300)}try{window.addEventListener('pagehide',function(){if(_svT){clearTimeout(_svT);_saveNow()}});document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&_svT){clearTimeout(_svT);_saveNow()}})}catch(e){}
function rndHex(n){var s='';for(var i=0;i<n;i++)s+=Math.floor(Math.random()*16).toString(16);return s}
load();if(!S.guid){S.guid=rndHex(32);save()}
window._qqm=S;
function N_(){return (typeof _ncm!=='undefined'&&_ncm)?_ncm:null}
function on(){var n=N_();return !!(n&&n.mode==='qqm')}
window._qqmOn=on;
function logged(){return !!(S.key&&S.uin)}
function $i(x){return document.getElementById(x)}
function T(x){try{toast(x)}catch(e){}}
function fmtDur(s){s=Math.max(0,Math.round(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function form(o){return Object.keys(o).map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(o[k]==null?'':o[k])}).join('&')}
function hash33(t,h){h=h|0;for(var i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return h&2147483647}
function b64utf8(b){try{var s=atob(String(b||'').replace(/\s/g,''));var u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return new TextDecoder('utf-8').decode(u)}catch(e){return ''}}
/* ── 传输 ── */
var UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
function nat(){return null}/* 浏览器版：接口走 JSONP 直连，只有扫码登录经跨域中转 */
function proxyFor(u){var p=String(S.proxy||'').trim();if(!p){try{p=String((N_()&&N_().proxy)||'').trim()}catch(e){}}if(!p){try{p=String((_mp&&_mp.mcp&&_mp.mcp.proxy)||'').trim()}catch(e){}}if(!p)return '';return p.indexOf('{url}')>=0?p.replace('{url}',encodeURIComponent(u)):(p+encodeURIComponent(u))}/* QQ 音乐页自己填的中转 → 网易云页填的 → MCP 卡；拼法同一套。只有扫码登录用得到 */
var NO_PROXY='扫码登录要先在 DIY → MCP 卡（或网易云登录页）填「跨域中转」；粘贴凭证不需要';
var QIMEI='cc8d07a748d4be0a8b91eafa100014a1730e';
function comm(extra){var c={ct:'11',cv:'13020508',v:'13020508',tmeAppID:'qqmusic',QIMEI36:QIMEI,uid:'3931641530',format:'json',inCharset:'utf-8',outCharset:'utf-8'};if(logged()){c.qq=String(S.uin);c.authst=S.key;c.tmeLoginType=String(S.lt||2)}if(extra)Object.keys(extra).forEach(function(k){c[k]=extra[k]});return c}
function cookieStr(){if(!logged())return '';return 'uin='+S.uin+'; qqmusic_uin='+S.uin+'; qqmusic_key='+S.key+'; qm_keyst='+S.key+'; tmeLoginType='+(S.lt||2)}
var jpN=0;
function jsonp(url,tmo){return new Promise(function(res,rej){var cb='_ibqq'+(++jpN)+'_'+rndHex(6),sc=document.createElement('script'),done=false;var tm=setTimeout(function(){fin();rej(new Error('QQ 音乐请求超时'))},tmo||20000);function fin(){if(done)return;done=true;clearTimeout(tm);try{delete window[cb]}catch(e){window[cb]=undefined}try{sc.remove()}catch(e){}}window[cb]=function(j){fin();res(j)};sc.onerror=function(){fin();rej(new Error('网络错误：QQ 音乐接口不可达'))};sc.src=url+(url.indexOf('?')<0?'?':'&')+'callback='+cb;document.head.appendChild(sc)})}
function isAuthErr(code){return code===1000||code===104401||code===104400}
async function cgi(mod,meth,param,opt){opt=opt||{};var body={comm:comm(opt.comm),req_1:{module:mod,method:meth,param:param||{}}};var N=nat(),j=null;
  if(N){var hd={'Referer':'https://y.qq.com/','User-Agent':UA,'Accept':'application/json, text/plain, */*','Content-Type':'application/json'};var ck=cookieStr();if(ck)hd['Cookie']=ck;
    var r;try{r=await N.request({url:'https://u.y.qq.com/cgi-bin/musicu.fcg',method:'POST',headers:hd,data:JSON.stringify(body),responseType:'text',connectTimeout:15000,readTimeout:20000})}catch(e){throw new Error('网络错误：'+String((e&&e.message)||e).slice(0,100))}
    if(r&&typeof r.data==='string'){try{j=JSON.parse(r.data)}catch(e){}}else if(r&&r.data&&typeof r.data==='object')j=r.data;
  }else{j=await jsonp('https://u.y.qq.com/cgi-bin/musicu.fcg?data='+encodeURIComponent(JSON.stringify(body)))}
  var rq=j&&j.req_1;if(!rq)throw new Error('QQ 音乐响应无法解析');
  var code=rq.code|0;
  if(!opt.raw&&code!==0){if(isAuthErr(code)&&logged()&&!opt._retried&&S.rk){var ok=false;try{ok=await refresh()}catch(e){}if(ok)return cgi(mod,meth,param,Object.assign({},opt,{_retried:true}))}var er=new Error(isAuthErr(code)?'登录已失效，重新登录':('QQ 音乐返回 code '+code+(rq.data&&rq.data.msg?'：'+rq.data.msg:'')));er.code=code;er.json=rq;throw er}
  return opt.raw?rq:(rq.data||{})}
async function fetchRaw(url,opt){opt=opt||{};var N=nat();
  if(N){var hd={'User-Agent':UA};if(opt.referer)hd['Referer']=opt.referer;if(opt.cookie)hd['Cookie']=opt.cookie;if(opt.form!=null)hd['Content-Type']='application/x-www-form-urlencoded';
    var r;try{r=await N.request({url:url,method:opt.method||(opt.form!=null?'POST':'GET'),headers:hd,data:opt.form!=null?opt.form:undefined,responseType:opt.blob?'blob':'text',connectTimeout:15000,readTimeout:opt.timeout||20000,disableRedirects:!!opt.noRedirect})}catch(e){throw new Error('网络错误：'+String((e&&e.message)||e).slice(0,100))}
    var H={};try{Object.keys((r&&r.headers)||{}).forEach(function(k){H[String(k).toLowerCase()]=r.headers[k]})}catch(e){}
    var txt=(r&&typeof r.data==='string')?r.data:((r&&r.data&&typeof r.data==='object')?JSON.stringify(r.data):'');
    return{status:(r&&r.status)|0,text:opt.blob?'':txt,b64:opt.blob?txt.replace(/[\r\n\s]/g,''):'',setCookie:String(H['set-cookie']||''),location:String(H['location']||'')}}
  var px=proxyFor(url);if(!px)throw new Error(NO_PROXY);
  var hb={'X-IB-UA':UA};if(opt.referer)hb['X-IB-Referer']=opt.referer;if(opt.cookie)hb['X-IB-Cookie']=opt.cookie;if(opt.noRedirect)hb['X-IB-Redirect']='manual';if(opt.form!=null)hb['Content-Type']='application/x-www-form-urlencoded';
  var ac=new AbortController(),tmo=setTimeout(function(){try{ac.abort()}catch(e){}},opt.timeout||20000),rb;
  try{rb=await fetch(px,{method:opt.method||(opt.form!=null?'POST':'GET'),headers:hb,body:opt.form!=null?opt.form:undefined,signal:ac.signal})}catch(e){clearTimeout(tmo);throw new Error(e&&e.name==='AbortError'?'中转超时':'网络错误：跨域中转不可达，或它没放行这个主机')}
  clearTimeout(tmo);var st=parseInt(rb.headers.get('x-ib-status')||'',10)||(rb.status|0);
  var out={status:st,text:'',b64:'',blobUrl:'',setCookie:rb.headers.get('x-ib-set-cookie')||'',location:rb.headers.get('x-ib-location')||''};
  if(opt.noRedirect&&!rb.headers.get('x-ib-status'))out.oldWorker=true;
  if(opt.blob){try{out.blobUrl=URL.createObjectURL(await rb.blob())}catch(e){}}else{try{out.text=await rb.text()}catch(e){}}
  return out}
function cookiesOf(sc){var m={},re=/(?:^|,\s*)([A-Za-z0-9_\-]+)=([^;,\s]*)/g,x;while((x=re.exec(String(sc||'')))){var k=x[1];if(/^(path|domain|expires|max-age|secure|httponly|samesite)$/i.test(k))continue;m[k]=x[2]}return m}
/* ── 数据整形 ── */
function cov(al,sg,w){var m=al&&al.mid;if(m)return 'https://y.gtimg.cn/music/photo_new/T002R'+w+'x'+w+'M000'+m+'.jpg';var s=sg&&sg[0]&&sg[0].mid;return s?('https://y.gtimg.cn/music/photo_new/T001R'+w+'x'+w+'M000'+s+'.jpg'):''}
function mkRec(s){if(!s||!s.mid)return null;var sg=s.singer||s.singers||[],al=s.album||{};var ar=sg.map(function(a){return a&&(a.name||a.title)}).filter(Boolean).join(' / ');var dur=s.interval||0;var pay=s.pay||{};
  return{id:'qqm_'+s.mid,qmid:s.mid,qid:s.id|0,qtype:(s.type|0)||0,qqm:true,name:String(s.title||s.name||''),title:String(s.title||s.name||''),artist:ar,album:String(al.title||al.name||''),cover:cov(al,sg,500),dur:dur,fee:pay.pay_play?1:0,mediaMid:(s.file&&s.file.media_mid)||'',metaScanned:true,analysis:{version:(window.IBMusicCore&&window.IBMusicCore.VERSION)||1,summary:'',duration:dur,qqm:true}}}
function thumb(u){return String(u||'').replace('R500x500','R150x150')}
function pickCred(txt){txt=String(txt||'').trim();var out={uin:'',key:''};var m=txt.match(/(?:^|[;\s])(?:qqmusic_key|qm_keyst)=([^;\s]+)/i);if(m)out.key=m[1];var m2=txt.match(/(?:^|[;\s])(?:uin|qqmusic_uin|wxuin)=o?([0-9]+)/i);if(m2)out.uin=m2[1];if(!out.key){var m3=txt.match(/\b(W_X_[A-Za-z0-9_\-]+|Q_H_L_[A-Za-z0-9_\-]+)/);if(m3)out.key=m3[1]}if(!out.uin){var m4=txt.match(/\b([0-9]{5,20})\b/);if(m4)out.uin=m4[1]}return out}
function ltOf(key){return /^W_X/.test(String(key||''))?1:2}
/* ── 账号 ── */
function setCred(d){S.uin=String(d.musicid||d.str_musicid||S.uin||'');S.strUin=String(d.str_musicid||'');S.key=String(d.musickey||'');S.lt=d.loginType||d.login_type||ltOf(S.key);S.euin=String(d.encryptUin||d.encrypt_uin||S.euin||'');S.openid=String(d.openid||'');S.rt=String(d.refresh_token||'');S.at=String(d.access_token||'');S.rk=String(d.refresh_key||'');S.exp=d.expired_at||0;S.unionid=String(d.unionid||'');save()}
async function refresh(){if(!S.rk||!S.key)return false;var p={openid:S.openid,refresh_token:S.rt,access_token:S.at,expired_in:S.exp,musicid:parseInt(S.uin,10)||0,str_musicid:S.strUin||S.uin,musickey:S.key,unionid:S.unionid,refresh_key:S.rk,loginMode:2};var rq=await cgi('music.login.LoginServer','Login',p,{comm:{tmeLoginType:S.lt||2},raw:true,_retried:true});if(rq.code!==0||!rq.data||!rq.data.musickey)return false;setCred(rq.data);return true}/* musickey 有期限：过期时用 refresh_key 换一把新的（与 QQ 音乐客户端同一接口） */
async function account(){var rq=await cgi('music.UserInfo.userInfoServer','GetLoginUserInfo',{},{raw:true});
  if(isAuthErr(rq.code|0)){var ok=false;if(S.rk){try{ok=await refresh()}catch(e){}}if(ok)rq=await cgi('music.UserInfo.userInfoServer','GetLoginUserInfo',{},{raw:true});if(isAuthErr(rq.code|0)){var er=new Error('凭证无效或已过期');er.code=301;throw er}}
  var d=rq.data||{};var f=function(o,ks){for(var i=0;i<ks.length;i++){var v=o&&o[ks[i]];if(v)return String(v)}return ''};
  S.nick=f(d,['nick','nickname','Nick','NickName','name','Name']);S.ava=f(d,['headurl','headUrl','HeadUrl','avatar','Avatar','head']);var eu=f(d,['encryptUin','encrypt_uin','EncryptUin','euin']);if(eu)S.euin=eu;
  if((!S.nick||!S.ava)&&S.euin){try{var h=await cgi('music.UnifiedHomepage.UnifiedHomepageSrv','GetHomepageHeader',{uin:S.euin,IsQueryTabDetail:1});var bi=(h&&h.Info&&h.Info.BaseInfo)||{};if(!S.nick&&bi.Name)S.nick=String(bi.Name);if(!S.ava&&bi.Avatar)S.ava=String(bi.Avatar);if(!S.euin&&bi.EncryptedUin)S.euin=String(bi.EncryptedUin)}catch(e){}}
  if(!S.nick)S.nick='用户 '+S.uin;
  try{var v=await cgi('VipLogin.VipLoginInter','vip_login_base',{});var id=(v&&v.identity)||{};S.vip=id.HugeVip?'豪华绿钻':(v&&v.svip?'SVIP':(id.vip?'绿钻':'普通账号'))}catch(e){S.vip=''}
  save();return S}
async function playlists(force){if(!force&&S.pls.length&&Date.now()-S.plsAt<600000)return S.pls;var out=[];
  var j=await cgi('music.musicasset.PlaylistBaseRead','GetPlaylistByUin',{uin:String(S.uin)});
  (j.v_playlist||[]).forEach(function(p){if(!p)return;var dir=(p.dirid!=null?p.dirid:p.dirId)|0;out.push({id:(p.tid||p.id||p.dissid)|0,dirid:dir,name:String(p.dirName||p.title||p.dissname||p.name||''),n:(p.songnum||p.songNum||p.song_cnt)|0,pic:String(p.picurl||p.picUrl||p.cover||p.logo||''),mine:true,liked:dir===201})});
  if(!out.some(function(p){return p.liked}))out.unshift({id:0,dirid:201,name:'我喜欢',n:0,pic:'',mine:true,liked:true});
  else out.sort(function(a,b){return (b.liked?1:0)-(a.liked?1:0)});
  if(S.euin){try{var f=await cgi('music.musicasset.PlaylistFavRead','CgiGetPlaylistFavInfo',{uin:S.euin,offset:0,size:60});(f.v_list||[]).forEach(function(p){if(!p)return;out.push({id:(p.dissid||p.tid||p.id)|0,dirid:0,name:String(p.dissname||p.title||p.name||''),n:(p.songnum||p.songNum)|0,pic:String(p.logo||p.picurl||p.cover||''),mine:false,by:String(p.nickname||p.nick||'')})})}catch(e){}}
  S.pls=out;S.plsAt=Date.now();save();return out}
async function tracksOf(pl,cap){cap=cap||500;var p={disstid:pl.liked?0:(pl.id|0),dirid:pl.liked?201:(pl.dirid|0),tag:true,song_begin:0,song_num:cap,userinfo:true,orderlist:true};if(pl.liked&&S.euin)p.enc_host_uin=S.euin;
  var j=await cgi('music.srfDissInfo.DissInfo','CgiGetDiss',p);var list=(j.songlist||[]).map(mkRec).filter(Boolean);var di=j.dirinfo||{};
  return{name:String(di.title||pl.name||''),list:list,total:(j.total_song_num|0)||list.length}}
async function radio(){var j=await cgi('music.radioProxy.MbTrackRadioSvr','get_radio_track',{id:99,num:20,from:0,scene:0,song_ids:[]});return (j.tracks||[]).map(mkRec).filter(Boolean)}
async function radar(){var j=await cgi('music.recommend.TrackRelationServer','GetRadarSong',{Page:1,ReqType:0,FavSongs:[],EntranceSongs:[]});return (j.VecSongs||[]).map(function(x){return mkRec(x&&(x.Track||x.track||x))}).filter(Boolean)}
async function top(id){var j=await cgi('music.musicToplist.Toplist','GetDetail',{topId:id,offset:0,num:100,period:''});return (j.songInfoList||[]).map(mkRec).filter(Boolean)}
async function search(q,n){var j=await cgi('music.search.SearchCgiService','DoSearchForQQMusicDesktop',{query:String(q||''),num_per_page:n||12,page_num:1,search_type:0});return (((j.body||{}).song||{}).list||[]).map(mkRec).filter(Boolean)}
async function lyric(rec){var j=await cgi('music.musichallSong.PlayLyricInfo','GetPlayLyricInfo',{songMid:rec.qmid,songId:rec.qid,qrc:0,trans:1,roma:0});var lrc=b64utf8(j.lyric||''),tl=b64utf8(j.trans||'');if(!lrc)return null;var ly=window.IBMusicCore.parseLyrics(lrc,'qqm.lrc');ly.timed=!!(ly.segments&&ly.segments.length);ly.source='lrc';if(tl)ly.translation=tl;return ly}
var LV=[['sq','F000','.flac'],['hq','M800','.mp3'],['std','M500','.mp3'],['low','C400','.m4a']];
async function songUrl(rec){var from=LV.findIndex(function(x){return x[0]===(S.lv||'hq')});if(from<0)from=1;var ladder=LV.slice(from);var mid=rec.qmid;
  var j=await cgi('music.vkey.GetVkey','UrlGetVkey',{guid:S.guid,songmid:ladder.map(function(){return mid}),songtype:ladder.map(function(){return rec.qtype||0}),uin:String(S.uin||'0'),loginflag:1,platform:'20',filename:ladder.map(function(l){return l[1]+mid+mid+l[2]})});
  var infos=j.midurlinfo||[],u='',got='';for(var i=0;i<infos.length&&!u;i++){var pu=infos[i]&&infos[i].purl;if(pu){u='https://dl.stream.qqmusic.qq.com/'+pu;got=ladder[i][0]}}
  if(!u)throw new Error(rec.fee?'这首歌当前账号没有播放权限（需要绿钻，或版权限制）':'没取到播放地址（版权限制，或登录已失效）');
  rec._lv=got;rec._lowered=(got!==(S.lv||'hq'));return u}/* 一次请求带整条音质阶梯（无损 → 高品 → 标准 → 流畅），取第一个有地址的档 */
async function plWrite(pl,rec,add){var j=await cgi('music.musicasset.PlaylistDetailWrite',add?'AddSonglist':'DelSonglist',{dirId:pl.dirid|0,tid:pl.id|0,bFmtUtf8:true,v_songInfo:[{songId:rec.qid|0,songType:rec.qtype|0}]},{raw:true});if(j.code!==0){if(j.code===80092&&add)throw new Error('这首歌已经在歌单里了');var er=new Error('QQ 音乐返回 code '+j.code);er.code=j.code;throw er}return true}
async function like(rec,yes){return plWrite({id:0,dirid:201},rec,yes)}
async function plCreate(name){var j=await cgi('music.musicasset.PlaylistBaseWrite','AddPlaylist',{dirName:String(name||'')});var r=(j&&j.result)||j||{};S.plsAt=0;return{id:(r.tid|0),dirid:(r.dirId|0),name:String(r.dirName||name||'')}}
async function coverData(rec){if(!rec.cover||rec.coverData)return;var N=nat();if(!N)return;try{var r=await N.request({url:rec.cover.replace('R500x500','R300x300'),method:'GET',headers:{'User-Agent':UA},responseType:'blob',connectTimeout:15000,readTimeout:20000});var b=(r&&typeof r.data==='string')?r.data.replace(/[\r\n\s]/g,''):'';if(b&&b.length<400000)rec.coverData='data:image/jpeg;base64,'+b}catch(e){}}
/* ── 模式切换（模式值与网易云共用 ib_ncm.mode） ── */
function stopAudio(){try{var a=_pwA();a.pause();a.removeAttribute('src');a.load()}catch(e){}try{if(_pw.url){URL.revokeObjectURL(_pw.url);_pw.url=''}}catch(e){}}
async function setMode(m){if(typeof _ncmSetMode==='function')return _ncmSetMode(m)}
function setQueue(list,pl,playFrom){S.q=list.slice();S.pl=pl||{id:0,dirid:0,name:''};save();_pw.list=S.q;_pw.idx=-1;if(S.q.length&&playFrom!==false)_pwPlayIdx(0);else{_pwPaint();_pwListDraw()}}
/* ── 播放内核挂钩（只在 QQ 音乐模式下生效；本地与网易云路径一字不变） ── */
var _pwLoad2=_pwLoad;_pwLoad=async function(){if(!on())return _pwLoad2();_pw.list=S.q;if(_pw.idx>=_pw.list.length)_pw.idx=_pw.list.length?_pw.list.length-1:-1};
var _pwPlayIdx2=_pwPlayIdx,playTok=0,failN=0;
_pwPlayIdx=async function(i){if(!on())return _pwPlayIdx2(i);await _pwLoad();
  if(!_pw.list.length){T('队列为空，先选一个歌单');_pwPaint();return}
  if(!(_pw.list[0]&&_pw.list[0].qqm))return _pwPlayIdx2(i);
  i=((i%_pw.list.length)+_pw.list.length)%_pw.list.length;_pw.idx=i;var rec=_pw.list[i],a=_pwA();var tok=++playTok;_pwPaint();_pwListDraw();
  var url='';try{url=await songUrl(rec)}catch(e){T(String((e&&e.message)||e))}
  if(tok!==playTok)return;
  try{if(_pw.url){URL.revokeObjectURL(_pw.url);_pw.url=''}}catch(e){}
  if(!url){failN++;if(failN>=3){failN=0;T('连续 3 首都取不到地址，已停下——检查账号或网络');return}if(_pw.list.length>1&&_pw.mode!=='one')setTimeout(function(){if(tok===playTok)_pwPlayIdx(i+1)},700);return}
  a.src=url;ensure(rec);
  try{await a.play();failN=0;if(rec._lowered)T('这一档音质没有权限，已降到'+({sq:'无损',hq:'高品质',std:'标准',low:'流畅'}[rec._lv]||rec._lv))}catch(e){if(tok!==playTok)return;failN++;T('播放失败');if(failN>=3){failN=0;T('连续 3 首都放不出来，已停下——检查网络或账号');return}if(_pw.list.length>1&&_pw.mode!=='one')setTimeout(function(){if(tok===playTok)_pwPlayIdx(i+1)},700);return}
  _pwPaint();_pwListDraw();try{_musicSyncCardsM()}catch(e){}
};
var jobs={};
function ensure(rec){if(!rec||!rec.qqm||jobs[rec.id])return;jobs[rec.id]=(async function(){try{if(!rec.lyrics){var ly=null;try{ly=await lyric(rec)}catch(e){}rec.lyrics=ly||{source:'lrc',segments:[],text:'',timed:false,at:Date.now(),none:true};try{if(window._maRefreshMusicM)window._maRefreshMusicM()}catch(e){}}await coverData(rec);_pwPaint()}catch(e){}finally{delete jobs[rec.id]}})()}
var _pwAddFiles2=_pwAddFiles;_pwAddFiles=async function(files,ctx){if(on()){var fs=Array.prototype.slice.call(files||[]).filter(function(f){return f&&f.size});var C=window.IBMusicCore;var lyr=C?fs.filter(C.isLyricFile):[],aud=C?fs.filter(C.isAudioFile):fs;
    if(lyr.length&&!aud.length){var rec=cur();if(!rec){T('先播放一首歌再导入歌词');return}try{var txt=(typeof _musicReadLyricsTextM==='function')?await _musicReadLyricsTextM(lyr[0]):await lyr[0].text();var ly=C.parseLyrics(txt,lyr[0].name);ly.timed=!!(ly.segments&&ly.segments.length);rec.lyrics=ly;T('歌词已绑定到当前歌曲（QQ 音乐曲目只保留本次）');try{if(window._maRefreshMusicM)window._maRefreshMusicM()}catch(e){}}catch(e){T('歌词解析失败')}return}
    await setMode('local')}return _pwAddFiles2(files,ctx)};
var drawTok=0;
var _pwListDraw2=_pwListDraw;_pwListDraw=function(){if(!on())return _pwListDraw2();try{var b2=$i('pw-add2');if(b2)b2.textContent='QQ 音乐歌单'}catch(e){}var box=$i('pw-list'),sh=$i('sheet-music');if(!box||!sh||!sh.classList.contains('open'))return;box.innerHTML='';
  var hd=document.createElement('div');hd.className='pwl-hd';hd.textContent=S.pl.name?('QQ 音乐 · '+S.pl.name):'QQ 音乐';box.appendChild(hd);
  if(!_pw.list.length){var em=document.createElement('div');em.className='empty';em.textContent='队列为空。点下方「QQ 音乐歌单」选一个歌单或搜歌。';box.appendChild(em);return}
  var tok=++drawTok,list=_pw.list;function mk(r,i){var row=document.createElement('div');row.className='pwl-row'+(i===_pw.idx?' on':'');row.innerHTML='<span class="pwl-n">'+(i+1)+'</span><span class="pwl-t">'+esc(r.title||r.name)+(r.artist?' <i class="pwl-ar">'+esc(r.artist)+'</i>':'')+'</span><span class="pwl-d">'+fmtDur(r.dur)+'</span><button class="pwl-x" title="移出队列"><svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button>';
    row.addEventListener('click',function(){_pwPlayIdx(i)});row.querySelector('.pwl-x').addEventListener('click',function(e){e.stopPropagation();var was=(i===_pw.idx);S.q.splice(i,1);save();_pw.list=S.q;if(was){stopAudio();_pw.idx=S.q.length?Math.min(i,S.q.length-1):-1;if(_pw.idx>=0)_pwPlayIdx(_pw.idx)}else if(i<_pw.idx)_pw.idx--;_pwPaint();_pwListDraw()});return row}
  var i=0;function step(){if(tok!==drawTok||!box.isConnected)return;var frag=document.createDocumentFragment(),end=Math.min(list.length,i+(i?80:60));for(;i<end;i++)frag.appendChild(mk(list[i],i));box.appendChild(frag);if(i<list.length)setTimeout(step,16)}step()};
/* 「一起听」上下文：QQ 音乐曲目没有本机结构分析，按歌名 / 歌手 / 专辑 / 歌词组织 */
(function(){var C=window.IBMusicCore;if(!C)return;var ctx0=C.context;C.context=function(rec,sec,dur,fid,ma){if(!(rec&&rec.qqm))return ctx0.apply(this,arguments);ma=ma||{};var out=['【一起听歌】','正在播放：《'+(rec.title||rec.name)+'》'+(rec.artist?' · '+rec.artist:'')+(rec.album?'（专辑《'+rec.album+'》）':'')+'（QQ 音乐，用户自己账号的歌单）'+((fid&&ma.mate===fid)?'（'+_amUserName()+'此刻正和你一起听这首歌）':'')];
  if(isFinite(sec))out.push('当前进度：'+C.fmt(sec)+(isFinite(dur)&&dur>0?' / '+C.fmt(dur):''));
  var near=C.nearLyrics(rec.lyrics,sec,12);if(near.length)out.push('当前附近歌词：\n'+near.map(function(s){return C.fmt(s.start)+' '+s.text}).join('\n'));else if(rec.lyrics&&rec.lyrics.text)out.push('这首歌有歌词但没有时间轴，无法定位当前一句。');else out.push('这首歌没有取到歌词。');
  out.push('以上是程序实际取得的曲目 / 歌词参考。没有提供的具体旋律、编曲或细节不要假装听见；可以基于这些事实自然陪对方听。');return out.join('\n\n')}})();
/* ── AI 控制：协议块与执行器扩展（受 Presence「允许 AI 控制播放器」总开关） ── */
function aiLines(){if(!on()||!logged())return[];var ai=S.ai||{},L=[];
  if(ai.search)L.push('<ws_music op="search" q="歌名 或 歌手 歌名"/> 点歌——在 QQ 音乐搜索、把第一首匹配加进队列并播放');
  if(ai.playlist)L.push('<ws_music op="playlist" q="歌单名"/> 切到用户的某个歌单（模糊匹配；q="我喜欢" 播放红心歌单，q="猜你喜欢" 播放个性电台，q="雷达" 播放雷达推荐，q="热歌榜" / "新歌榜" 播放榜单）');
  if(ai.view)L.push('<ws_music op="view" q="歌单列表 | 歌单名 | 我喜欢" n="20"/> 查看（只读）：q 省略或写「歌单列表」列出全部歌单；写歌单名或「我喜欢」列该歌单曲目，n 省略＝全部（最多 200 首）；结果全文随下一条消息回传');/* v222-p */
  if(ai.like)L.push('<ws_music op="like"/> 红心当前曲（加进「我喜欢」）　<ws_music op="unlike"/> 取消红心');
  if(ai.edit)L.push('<ws_music op="add" q="歌名" to="歌单名"/> 把歌加进用户自建的歌单（q 省略＝当前曲）　<ws_music op="remove" q="歌名" to="歌单名"/> 从歌单移除');
  if(ai.create)L.push('<ws_music op="create" q="歌单名"/> 在用户账号里新建歌单');
  L.push('<ws_music op="mode" q="loop|one|rand"/> 播放模式：列表循环 / 单曲循环 / 随机');return L}
window._qqmInstrM=function(){var L=aiLines();if(!L.length)return'';return '\n【QQ 音乐】播放器已切到 QQ 音乐模式，放的是用户自己账号里的歌。除上面的播放器指令外，还可用：\n'+L.join('\n')+'\n仍是每条回复最多 1 个播放器指令，执行结果会回传。红心 / 加歌 / 删歌 / 建歌单会真实改动用户的 QQ 音乐账号，只在用户明确要求时做；用户的歌单名单会在聊到音乐时作为参考资料提供。'};
function fuzzy(list,key,q){q=String(q||'').trim().toLowerCase();if(!q)return -1;var i=list.findIndex(function(x){return String(x[key]||'').toLowerCase()===q});if(i<0)i=list.findIndex(function(x){return String(x[key]||'').toLowerCase().indexOf(q)>=0});if(i<0)i=list.findIndex(function(x){return q.indexOf(String(x[key]||'').toLowerCase())>=0&&String(x[key]||'').length>=2});return i}
function cur(){return (_pw.idx>=0&&_pw.list)?_pw.list[_pw.idx]:null}
async function findPl(q,mineOnly){var pls=(await playlists()).filter(function(p){return !mineOnly||p.mine});var i=fuzzy(pls,'name',q);if(i<0)throw new Error('用户的歌单里没有「'+q+'」。可用歌单：'+pls.slice(0,20).map(function(p){return p.name}).join(' / '));return pls[i]}
async function pickSong(q){if(!q){var c=cur();if(!c)throw new Error('没有正在播放的歌，也没有指定歌名');return c}var i=fuzzy(_pw.list||[],'title',q);if(i>=0)return _pw.list[i];var rs=await search(q,3);if(!rs.length)throw new Error('QQ 音乐搜不到「'+q+'」');return rs[0]}
async function exec(op,q,ext){ext=ext||{};var ai=S.ai||{};
  if(!logged())return{ok:false,label:'QQ 音乐',detail:'用户还没登录 QQ 音乐'};
  try{
    if(op==='search'){if(!ai.search)return{ok:false,label:'点歌',detail:'用户未开放「点歌」'};var rs=await search(q,5);if(!rs.length)return{ok:false,label:'点歌',detail:'QQ 音乐搜不到「'+q+'」'};var r=rs[0];var j=S.q.findIndex(function(x){return x.qmid===r.qmid});if(j<0){var at=_pw.idx>=0?_pw.idx+1:S.q.length;S.q.splice(at,0,r);save();_pw.list=S.q;j=at}await _pwPlayIdx(j);return{ok:true,label:'点歌',detail:'《'+r.title+'》'+(r.artist?' · '+r.artist:'')+(r.fee?'（VIP 曲目，按用户账号权限播放）':'')}}
    if(op==='playlist'){if(!ai.playlist)return{ok:false,label:'切歌单',detail:'用户未开放「切换歌单」'};var qq=String(q||'').replace(/\s+/g,'');
      if(/猜你喜欢|电台|私人|fm|radio/i.test(qq)){var d=await radio();if(!d.length)return{ok:false,label:'猜你喜欢',detail:'电台没有返回歌曲'};setQueue(d,{id:'radio',dirid:0,name:'猜你喜欢'});return{ok:true,label:'猜你喜欢',detail:d.length+' 首，已从第一首开始'}}
      if(/雷达|radar/i.test(qq)){var rd=await radar();if(!rd.length)return{ok:false,label:'雷达推荐',detail:'雷达没有返回歌曲'};setQueue(rd,{id:'radar',dirid:0,name:'雷达推荐'});return{ok:true,label:'雷达推荐',detail:rd.length+' 首，已从第一首开始'}}
      if(/热歌|新歌|飙升|榜/i.test(qq)){var tid=/新歌/.test(qq)?27:(/飙升/.test(qq)?62:26),tn={27:'新歌榜',62:'飙升榜',26:'热歌榜'}[tid];var tp=await top(tid);if(!tp.length)return{ok:false,label:tn,detail:'榜单没有返回歌曲'};setQueue(tp,{id:'top'+tid,dirid:0,name:tn});return{ok:true,label:tn,detail:tp.length+' 首，已从第一首开始'}}
      var p=/我喜欢|红心|喜欢的|like/i.test(qq)?(await playlists()).filter(function(x){return x.liked})[0]:await findPl(q);if(!p)return{ok:false,label:'切歌单',detail:'没有找到「我喜欢」'};var t=await tracksOf(p);if(!t.list.length)return{ok:false,label:'切歌单',detail:'歌单「'+p.name+'」是空的'};setQueue(t.list,{id:p.id,dirid:p.dirid,name:p.name});return{ok:true,label:'切歌单',detail:'「'+p.name+'」'+t.list.length+' 首'+(t.total>t.list.length?'（歌单共 '+t.total+' 首，只载入前 '+t.list.length+' 首）':'')+'，已从第一首开始'}}
    if(op==='like'||op==='unlike'){if(!ai.like)return{ok:false,label:'红心',detail:'用户未开放「红心」'};var s=await pickSong(q);await like(s,op==='like');S.plsAt=0;return{ok:true,label:op==='like'?'红心':'取消红心',detail:'《'+s.title+'》'}}
    if(op==='add'||op==='remove'){if(!ai.edit)return{ok:false,label:'歌单',detail:'用户未开放「加进 · 移出歌单」'};if(!ext.to)return{ok:false,label:'歌单',detail:'缺少 to="歌单名"'};var s2=await pickSong(q);var pl=await findPl(ext.to,true);await plWrite(pl,s2,op==='add');S.plsAt=0;return{ok:true,label:op==='add'?'加进歌单':'移出歌单',detail:'《'+s2.title+'》→「'+pl.name+'」'}}
    if(op==='create'){if(!ai.create)return{ok:false,label:'新建歌单',detail:'用户未开放「新建歌单」'};if(!q)return{ok:false,label:'新建歌单',detail:'缺少歌单名'};var np=await plCreate(String(q).slice(0,40));return{ok:true,label:'新建歌单',detail:'「'+(np.name||q)+'」'+(np.id?'（id '+np.id+'）':'')}}
    if(op==='view'){if(!ai.view)return{ok:false,label:'查看歌单',detail:'用户未开放「查看歌单」'};var qv=String(q||'').replace(/\s+/g,''),nv=parseInt(ext.n,10);nv=(isFinite(nv)&&nv>0)?Math.min(nv,200):0;var fmtL=function(x,i){return (i+1)+'. 《'+x.title+'》'+(x.artist?' · '+x.artist:'')};
      if(/排行|record|rank/i.test(qv))return{ok:false,label:'听歌排行',detail:'QQ 音乐没有提供播放排行接口'};
      if(!qv||/歌单列表|全部歌单|我的歌单|列表|^lists?$/i.test(qv)){var pls=await playlists(true);return{ok:true,label:'歌单列表',detail:pls.length+' 个歌单',path:'QQ 音乐 · 歌单列表',response:'用户的 QQ 音乐歌单（'+pls.length+' 个）：\n'+pls.map(function(p){return (p.liked?'♥ ':'')+'「'+p.name+'」'+p.n+' 首'}).join('\n')}}
      var pv=null;if(/红心|喜欢|like/i.test(qv)){pv=(await playlists()).filter(function(p){return p.liked})[0]||null}if(!pv)pv=await findPl(q);var tv=await tracksOf(pv,nv||500);var lst=nv?tv.list.slice(0,nv):tv.list;return{ok:true,label:'查看歌单',detail:'「'+(tv.name||pv.name)+'」列出 '+lst.length+' 首',path:'QQ 音乐 · 歌单「'+(tv.name||pv.name)+'」',response:'歌单「'+(tv.name||pv.name)+'」（共 '+(tv.total||lst.length)+' 首，列出 '+lst.length+' 首）：\n'+lst.map(fmtL).join('\n')}}
    if(op==='mode'){var m=String(q||'').toLowerCase();m=/one|单曲/.test(m)?'one':(/rand|随机|shuffle/.test(m)?'rand':'loop');_pw.mode=m;_pwPaint();try{await loadMP();_mp.ui=_mp.ui||{};_mp.ui.musicMode=m;await saveMP()}catch(e){}try{if(window._maRefreshMusicM)window._maRefreshMusicM()}catch(e){}return{ok:true,label:'播放模式',detail:m==='one'?'单曲循环':(m==='rand'?'随机播放':'列表循环')}}
  }catch(e){return{ok:false,label:'QQ 音乐',detail:String((e&&e.message)||e).slice(0,160)}}
  return null}
var QQ_OPS={search:1,playlist:1,like:1,unlike:1,add:1,remove:1,create:1,mode:1,view:1};/* v222-p：+view */
var _mtExec2=_mtExec;_mtExec=async function(op,q,ext){if(on()&&QQ_OPS[op]){var r=await exec(op,q,ext);if(r)return r}return _mtExec2(op,q,ext)};
var _bmt2=buildMusicTail;buildMusicTail=function(userMsg,fid){var s=_bmt2(userMsg,fid)||'';try{var ma=(_mp&&_mp.musicAi)||{};if(on()&&logged()&&ma.ctl&&S.ai&&S.ai.playlist&&typeof _musicRelatedM==='function'&&_musicRelatedM(userMsg,cur())&&S.pls.length){s+=(s?'\n\n':'')+'【QQ 音乐歌单】'+(S.pl.name?'当前：「'+S.pl.name+'」；':'')+'用户的歌单：'+S.pls.slice(0,30).map(function(p){return '「'+p.name+'」'}).join(' ')}}catch(e){}return s};
/* ── UI：音源行 ── */
function paintSrc(){var b=$i('masrc-qqm');if(b)b.classList.toggle('on',on());var st=$i('masrc-qqm-s');if(st)st.textContent=logged()?(S.nick+(S.pl.name?' · '+S.pl.name:'')):'登录账号，听自己的歌单'}
window._qqmPaintSrc=paintSrc;
/* ── UI：QQ 音乐 sheet ── */
var qrTmr=null,qrKey='',qrAlive=false;
function stopQr(){qrAlive=false;if(qrTmr){clearTimeout(qrTmr);qrTmr=null}qrKey=''}
function sheetOpen(){var sh=$i('sheet-qqm');return !!(sh&&sh.classList.contains('open'))}
function openQqm(){paint();openSheet('sheet-qqm')}
window._qqmOpen=openQqm;
function paint(){var b=$i('qqm-body');if(!b)return;stopQr();
  if(!logged())return paintLogin(b);
  b.innerHTML='<div class="ncm-acc"><div class="ma-ava ncm-ava" id="qqm-ava"></div><div class="ncm-accm"><b>'+esc(S.nick||'—')+'</b><small>'+esc(S.vip||'')+(S.uin?(S.vip?' · ':'')+S.uin:'')+'</small></div><button class="btn ncm-out" id="qqm-logout" type="button">退出</button></div>'
    +'<label class="spill ncm-spill"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="qqm-q" placeholder="搜歌 · 歌名 / 歌手" autocomplete="off" enterkeyhint="search"></label><div id="qqm-res"></div>'
    +'<div class="sec-label ncm-sl">歌单</div><div id="qqm-pls"><div class="empty" style="padding:14px">正在读取歌单…</div></div>'
    +'<div class="sec-label ncm-sl">播放</div><div class="f-group"><label>音质</label><div class="sel"><select id="qqm-lv"><option value="low">流畅</option><option value="std">标准</option><option value="hq">高品质</option><option value="sq">无损</option></select></div></div><p class="hint" style="margin:-2px 0 0">选的那一档没权限时自动往下降一档。</p>'
    +'<div class="sec-label ncm-sl">AI 控制</div><p class="hint" style="margin:0 0 4px">受 Presence「允许 AI 控制播放器」总开关约束；开着的项会写进 TA 的系统能力行，切换后 TA 的下一条消息重建一次提示缓存。</p>'
    +tog('search','点歌','按歌名或歌手搜索，把第一首匹配加进队列并播放。')+tog('playlist','切换歌单','切到你的某个歌单、我喜欢、猜你喜欢、雷达推荐或榜单；聊到音乐时你的歌单名单会作为参考资料提供。')+tog('view','查看歌单','把你的歌单列表、某个歌单或「我喜欢」的曲目（全部或前 N 首）列给 TA 看；只读，不改动账号（QQ 音乐没有播放排行接口）。')+tog('like','红心','把当前曲或指定歌曲加进「我喜欢」，或移出。')+tog('edit','加进 · 移出歌单','把歌加进你自建的歌单，或从歌单移除。')+tog('create','新建歌单','在你的账号里新建歌单。');
  try{var av=$i('qqm-ava');if(S.ava){av.style.backgroundImage='url("'+S.ava+'")';av.style.backgroundSize='cover';av.textContent=''}else av.textContent=(S.nick||'?').slice(0,1)}catch(e){}
  $i('qqm-logout').addEventListener('click',async function(){if(!await confirmDlg('退出 QQ 音乐账号？队列会清空。','退出'))return;S.uin='';S.key='';S.lt=0;S.euin='';S.openid='';S.rt='';S.at='';S.rk='';S.exp=0;S.unionid='';S.strUin='';S.nick='';S.ava='';S.vip='';S.pls=[];S.plsAt=0;S.q=[];S.pl={id:0,dirid:0,name:''};save();stopAudio();_pw.idx=-1;_pw.list=S.q;_pwPaint();_pwListDraw();paint();paintSrc()});
  var lv=$i('qqm-lv');lv.value=S.lv||'hq';lv.addEventListener('change',function(){S.lv=lv.value;save()});
  b.querySelectorAll('.sw2[data-ai]').forEach(function(el){var k=el.getAttribute('data-ai');sw2(el,!!(S.ai&&S.ai[k]));el.addEventListener('click',function(){S.ai=S.ai||{};S.ai[k]=!S.ai[k];save();sw2(el,!!S.ai[k])})});
  var qi=$i('qqm-q'),res=$i('qqm-res'),qt=null;
  async function doSearch(){var q=String(qi.value||'').trim();if(!q){res.innerHTML='';return}res.innerHTML='<div class="empty" style="padding:12px">搜索中…</div>';try{var rs=await search(q,12);if(String(qi.value||'').trim()!==q)return;if(!rs.length){res.innerHTML='<div class="empty" style="padding:12px">没有找到「'+esc(q)+'」</div>';return}res.innerHTML='';rs.forEach(function(r){var row=document.createElement('div');row.className='mate-row ncm-row';row.innerHTML='<div class="ma-ava ncm-cv"'+(r.cover?' style="background-image:url(&quot;'+esc(thumb(r.cover))+'&quot;)"':'')+'></div><div class="ncm-rm"><b>'+esc(r.title)+(r.fee?' <i class="ncm-vip">VIP</i>':'')+'</b><small>'+esc(r.artist||'')+(r.album?' · '+esc(r.album):'')+'</small></div><span class="pwl-d">'+fmtDur(r.dur)+'</span>';row.addEventListener('click',function(){var j=S.q.findIndex(function(x){return x.qmid===r.qmid});if(j<0){var at=_pw.idx>=0?_pw.idx+1:S.q.length;S.q.splice(at,0,r);save();_pw.list=S.q;j=at}closeSheets();_pwPlayIdx(j)});res.appendChild(row)})}catch(e){res.innerHTML='<div class="empty" style="padding:12px">'+esc(String((e&&e.message)||e))+'</div>'}}
  qi.addEventListener('input',function(){clearTimeout(qt);qt=setTimeout(doSearch,500)});qi.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();clearTimeout(qt);doSearch();try{qi.blur()}catch(x){}}});
  paintPls();
}
function tog(k,t,s){return '<div class="tog nb ncm-tog"><div class="tog-m"><div class="tog-t">'+t+'</div><div class="tog-s">'+s+'</div></div><div class="sw2" data-ai="'+k+'"></div></div>'}
var SYS=[{id:'radio',name:'猜你喜欢',sub:'按你的口味挑的个性电台',tag:'猜'},{id:'radar',name:'雷达推荐',sub:'算法给你挑的下一批',tag:'雷'},{id:'top26',name:'热歌榜',sub:'站内播放热度前 300',tag:'热'},{id:'top27',name:'新歌榜',sub:'新歌里的热门',tag:'新'}];
async function sysList(id){if(id==='radio')return radio();if(id==='radar')return radar();var m=/^top(\d+)$/.exec(id);if(m)return top(parseInt(m[1],10));return[]}
async function paintPls(force){var box=$i('qqm-pls');if(!box)return;try{var pls=await playlists(force);if(!$i('qqm-pls'))return;box.innerHTML='';
    var rows=[];pls.filter(function(p){return p.liked}).forEach(function(p){rows.push(p)});SYS.forEach(function(x){rows.push({id:x.id,dirid:0,name:x.name,n:0,pic:'',sys:true,sub:x.sub,tag:x.tag})});pls.filter(function(p){return !p.liked}).forEach(function(p){rows.push(p)});
    rows.forEach(function(p){var row=document.createElement('div');row.className='mate-row ncm-row'+(String(S.pl.id)===String(p.id)&&(p.sys||S.pl.dirid===p.dirid)?' on':'');row.innerHTML='<div class="ma-ava ncm-cv'+(p.sys||p.liked?' sys':'')+'"'+(p.pic&&!p.liked?' style="background-image:url(&quot;'+esc(p.pic)+'&quot;)"':'')+'>'+(p.sys?(p.tag||''):(p.liked?'♥':''))+'</div><div class="ncm-rm"><b>'+esc(p.name)+'</b><small>'+(p.sys?esc(p.sub||''):(p.liked?'红心歌单':(p.n+' 首'+(p.mine?'':' · 收藏的'+(p.by?' · '+esc(p.by):'')))))+'</small></div>';
      row.addEventListener('click',async function(){try{row.classList.add('busy');var t;if(p.sys){var l=await sysList(p.id);t={name:p.name,list:l,total:l.length}}else t=await tracksOf(p);if(!t.list.length){T('这个歌单是空的');row.classList.remove('busy');return}setQueue(t.list,{id:p.id,dirid:p.dirid|0,name:t.name||p.name});closeSheets();if(t.total>t.list.length)T('歌单共 '+t.total+' 首，载入前 '+t.list.length+' 首')}catch(e){row.classList.remove('busy');T(String((e&&e.message)||e))}});box.appendChild(row)});
    var rf=document.createElement('button');rf.type='button';rf.className='btn ncm-refresh';rf.textContent='刷新歌单';rf.addEventListener('click',function(){box.innerHTML='<div class="empty" style="padding:14px">正在读取歌单…</div>';paintPls(true)});box.appendChild(rf);
  }catch(e){box.innerHTML='<div class="empty" style="padding:14px">'+esc(String((e&&e.message)||e))+'</div>';if(e&&(e.code===301||isAuthErr(e.code))){S.key='';save();paint()}}}
function paintLogin(b){
  b.innerHTML='<div class="ncm-tabs"><button class="btn on" type="button" data-t="wx">微信扫码</button><button class="btn" type="button" data-t="qq">QQ 扫码</button><button class="btn" type="button" data-t="cred">粘贴凭证</button></div>'
    +'<div class="ncm-pane" data-p="wx"><div class="qqm-qr" id="qqm-wxbox"><img id="qqm-wxqr" alt="" hidden></div><div class="ncm-st" id="qqm-wxst">正在获取二维码…</div><p class="hint" style="text-align:center">用微信「扫一扫」；只有这一台手机时，截图后在微信扫一扫右上角选相册。二维码约 5 分钟内有效，过期点一下刷新。</p></div>'
    +'<div class="ncm-pane" data-p="qq" hidden><div class="qqm-qr" id="qqm-qqbox"><img id="qqm-qqqr" alt="" hidden></div><div class="ncm-st" id="qqm-qqst">正在获取二维码…</div><p class="hint" style="text-align:center">用 QQ「扫一扫」；只有这一台手机时，截图后在 QQ 扫一扫里选相册。QQ 扫码要中转是 GUIDE → DIY 里的 v4 版代码（比 v3 多认一个 X-IB-Redirect 头）；旧版只能微信扫码或粘贴凭证。</p></div>'
    +'<div class="ncm-pane" data-p="cred" hidden><div class="f-group"><label>凭证</label><textarea id="qqm-cred" rows="3" placeholder="uin=…; qqmusic_key=… 或整段 Cookie"></textarea></div><p class="hint">电脑浏览器登录 y.qq.com → F12 → Application → Cookies，复制 uin 与 qqmusic_key（或 qm_keyst）两项，整段粘贴也行。凭证有期限，失效后再粘一次。</p><button class="btn primary" type="button" id="qqm-login-cred" style="width:100%">登录</button></div>'
    +(nat()?'':('<div class="f-group" style="margin-top:14px"><label>跨域中转 <span class="lb-note">（只有扫码登录用；留空沿用网易云页 / MCP 卡填的那条）</span></label><input id="qqm-proxy" autocomplete="off" placeholder="https://你的名字.workers.dev/?u=" value="'+esc(S.proxy||'')+'"></div><p class="hint" style="margin:-4px 0 8px">当前生效：'+(proxyFor('https://open.weixin.qq.com/')?'已配置':'未配置')+'</p>'))
    +'<p class="hint" style="margin-top:12px">账号只存在本机，不进备份，不发给任何 AI；听歌、搜歌、歌单请求由浏览器直接发往 QQ 音乐（不经中转）。绿钻曲目能不能完整播放取决于这个账号。</p>';
  b.querySelectorAll('.ncm-tabs .btn').forEach(function(bt){bt.addEventListener('click',function(){b.querySelectorAll('.ncm-tabs .btn').forEach(function(x){x.classList.toggle('on',x===bt)});var t=bt.getAttribute('data-t');b.querySelectorAll('.ncm-pane').forEach(function(p){p.hidden=p.getAttribute('data-p')!==t});stopQr();if(t==='wx')startWx();else if(t==='qq')startQq()})});
  var pxi=$i('qqm-proxy');if(pxi)pxi.addEventListener('change',function(){S.proxy=String(pxi.value||'').trim();save();T(S.proxy?'QQ 音乐中转已保存':'已清空，沿用网易云页 / MCP 卡的中转');paint()});
  $i('qqm-login-cred').addEventListener('click',async function(){var c=pickCred($i('qqm-cred').value);if(!c.key||!c.uin){T('没识别到 uin 与 qqmusic_key');return}var bt=this;bt.disabled=true;try{await finishLogin({musicid:c.uin,musickey:c.key,loginType:ltOf(c.key)})}finally{bt.disabled=false}});
  startWx();
}
function qrImg(imgId,boxId,src,fallbackText){var img=$i(imgId);if(!img)return;img.hidden=false;img.onerror=function(){try{var box=$i(boxId);if(!box||!fallbackText)return;img.hidden=true;var cv=document.createElement('canvas');cv.width=200;cv.height=200;box.appendChild(cv);var dark=document.body.classList.contains('theme-infernal');IBQR.draw(cv,fallbackText,200,dark?'#e6eefb':'#1a2740',dark?'#111b30':'#ffffff')}catch(e){}};img.src=src}
function wxPoll(uuid){var url='https://lp.open.weixin.qq.com/connect/l/qrconnect?uuid='+encodeURIComponent(uuid)+'&_='+Date.now();
  if(nat())return fetchRaw(url,{referer:'https://open.weixin.qq.com/',timeout:45000}).then(function(r){var m=/wx_errcode=(\d+);window\.wx_code='([^']*)'/.exec(r.text||'');return m?{code:parseInt(m[1],10),wx:m[2]}:{code:0,wx:''}});
  return new Promise(function(res,rej){var sc=document.createElement('script'),done=false;var tm=setTimeout(function(){fin();res({code:408,wx:''})},45000);function fin(){if(done)return;done=true;clearTimeout(tm);try{sc.remove()}catch(e){}}sc.onload=function(){var c=parseInt(window.wx_errcode,10)||0,w=String(window.wx_code||'');try{window.wx_code=''}catch(e){}fin();res({code:c,wx:w})};sc.onerror=function(){fin();rej(new Error('网络错误：微信接口不可达'))};sc.src=url;document.head.appendChild(sc)})}/* 这条轮询接口本来就是给 script 标签用的（返回 window.wx_errcode=…），浏览器直连即可 */
async function startWx(){stopQr();var st=$i('qqm-wxst');if(!st)return;var img=$i('qqm-wxqr');if(img){img.hidden=true;img.removeAttribute('src')}try{var box=$i('qqm-wxbox');box&&box.querySelectorAll('canvas').forEach(function(c){c.remove()})}catch(e){}
  if(!nat()&&!proxyFor('https://open.weixin.qq.com/')){st.textContent=NO_PROXY;st.onclick=function(){startWx()};return}
  st.textContent='正在获取二维码…';var key=rndHex(8);qrKey=key;qrAlive=true;
  try{var page=await fetchRaw('https://open.weixin.qq.com/connect/qrconnect?'+form({appid:'wx48db31d5'+'0e334801',redirect_uri:'https://y.qq.com/portal/wx_redirect.html?login_type=2&surl=https://y.qq.com/',response_type:'code',scope:'snsapi_login',state:'STATE',href:'https://y.qq.com/mediastyle/music_v17/src/css/popup_wechat.css#wechat_redirect'}),{timeout:20000});
    var m=/\/connect\/qrcode\/([A-Za-z0-9_\-]+)/.exec(page.text||'')||/uuid=([A-Za-z0-9_\-]+)"/.exec(page.text||'');if(!m)throw new Error('没拿到微信登录 uuid');var uuid=m[1];if(qrKey!==key||!$i('qqm-wxst'))return;
    qrImg('qqm-wxqr','qqm-wxbox','https://open.weixin.qq.com/connect/qrcode/'+uuid,'https://open.weixin.qq.com/connect/confirm?uuid='+uuid);st.textContent='等待扫码';var since=Date.now();
    (async function loop(){while(qrAlive&&qrKey===key&&$i('qqm-wxst')&&sheetOpen()){if(Date.now()-since>330000){st.textContent='二维码已过期，点击刷新';stopQr();return}var r;try{r=await wxPoll(uuid)}catch(e){st.textContent=String((e&&e.message)||e)+'，点击重试';stopQr();return}if(!qrAlive||qrKey!==key)return;
        if(r.code===404)st.textContent='已扫码，在微信里点确认';else if(r.code===403){st.textContent='已在微信里取消，点击重新生成';stopQr();return}else if(r.code===402){st.textContent='二维码已过期，点击刷新';stopQr();return}else if(r.code===405&&r.wx){stopQr();st.textContent='登录中…';try{var rq=await cgi('music.login.LoginServer','Login',{code:r.wx,strAppid:'wx48db31d5'+'0e334801'},{comm:{tmeLoginType:1},raw:true});if(rq.code!==0||!rq.data||!rq.data.musickey)throw new Error(loginErr(rq.code));await finishLogin(rq.data)}catch(e){st.textContent='登录失败：'+String((e&&e.message)||e)+'，点击重试'}return}else st.textContent='等待扫码';
        if(nat())await new Promise(function(r2){qrTmr=setTimeout(r2,1200)})}})();
  }catch(e){st.textContent='二维码获取失败：'+String((e&&e.message)||e)+'，点击重试';stopQr()}
  st.onclick=function(){if(!qrAlive)startWx()}}
async function startQq(){stopQr();var st=$i('qqm-qqst');if(!st)return;var img=$i('qqm-qqqr');if(img){img.hidden=true;img.removeAttribute('src')}
  if(!nat()&&!proxyFor('https://ssl.ptlogin2.qq.com/')){st.textContent=NO_PROXY;st.onclick=function(){startQq()};return}
  st.textContent='正在获取二维码…';var key=rndHex(8);qrKey=key;qrAlive=true;
  try{var r0=await fetchRaw('https://ssl.ptlogin2.qq.com/ptqrshow?'+form({appid:'716027609',e:'2',l:'M',s:'3',d:'72',v:'4',t:String(Math.random()),daid:'383',pt_3rd_aid:'100497308'}),{referer:'https://xui.ptlogin2.qq.com/',blob:true});
    var qrsig=(cookiesOf(r0.setCookie).qrsig)||'';if(!qrsig)throw new Error(nat()?'没拿到 qrsig':'没拿到 qrsig（中转是不是旧版代码？QQ 扫码要 GUIDE 里的 v4 版）');if(qrKey!==key||!$i('qqm-qqst'))return;
    qrImg('qqm-qqqr','qqm-qqbox',r0.blobUrl||('data:image/png;base64,'+r0.b64),'');st.textContent='等待扫码';var since=Date.now(),tok=hash33(qrsig);
    (async function loop(){while(qrAlive&&qrKey===key&&$i('qqm-qqst')&&sheetOpen()){if(Date.now()-since>330000){st.textContent='二维码已过期，点击刷新';stopQr();return}var r;
        try{r=await fetchRaw('https://ssl.ptlogin2.qq.com/ptqrlogin?'+form({u1:'https://graph.qq.com/oauth2.0/login_jump',ptqrtoken:String(tok),ptredirect:'0',h:'1',t:'1',g:'1',from_ui:'1',ptlang:'2052',action:'0-0-'+Date.now(),js_ver:'20102616',js_type:'1',pt_uistyle:'40',aid:'716027609',daid:'383',pt_3rd_aid:'100497308',has_onekey:'1'}),{referer:'https://xui.ptlogin2.qq.com/',cookie:'qrsig='+qrsig})}catch(e){st.textContent=String((e&&e.message)||e)+'，点击重试';stopQr();return}
        if(!qrAlive||qrKey!==key)return;var mm=/ptuiCB\(([\s\S]*?)\)/.exec(r.text||'');var args=mm?mm[1].split(',').map(function(x){return x.trim().replace(/^'|'$/g,'')}):[];var code=parseInt(args[0],10);
        if(code===66)st.textContent='等待扫码';else if(code===67)st.textContent='已扫码，在 QQ 里点确认';else if(code===65){st.textContent='二维码已过期，点击刷新';stopQr();return}else if(code===68){st.textContent='已在 QQ 里取消，点击重新生成';stopQr();return}
        else if(code===0){stopQr();st.textContent='登录中…';try{var u=args[2]||'';var uin=(/[?&]uin=(\d+)/.exec(u)||[])[1],sigx=(/[?&]ptsigx=([0-9a-fA-F]+)/.exec(u)||[])[1];if(!uin||!sigx)throw new Error('没拿到登录参数');await qqAuthorize(uin,sigx)}catch(e){st.textContent='登录失败：'+String((e&&e.message)||e)+'，点击重试'}return}
        else if(!isNaN(code)&&args[4]){st.textContent=args[4]}
        await new Promise(function(r2){qrTmr=setTimeout(r2,2500)})}})();
  }catch(e){st.textContent='二维码获取失败：'+String((e&&e.message)||e)+'，点击重试';stopQr()}
  st.onclick=function(){if(!qrAlive)startQq()}}
async function qqAuthorize(uin,sigx){var r1=await fetchRaw('https://ssl.ptlogin2.graph.qq.com/check_sig?'+form({uin:uin,pttype:'1',service:'ptqrlogin',nodirect:'0',ptsigx:sigx,s_url:'https://graph.qq.com/oauth2.0/login_jump',ptlang:'2052',ptredirect:'100',aid:'716027609',daid:'383',j_later:'0',low_login_hour:'0',regmaster:'0',pt_login_type:'3',pt_aid:'0',pt_aaid:'16',pt_light:'0',pt_3rd_aid:'100497308'}),{referer:'https://xui.ptlogin2.qq.com/',noRedirect:true});
  if(r1.oldWorker)throw new Error('中转是旧版代码：QQ 扫码要换成 GUIDE → DIY 里的 v4 版');var ck=cookiesOf(r1.setCookie);if(!ck.p_skey)throw new Error('没拿到 p_skey');var cookie=Object.keys(ck).map(function(k){return k+'='+ck[k]}).join('; ');
  var r2=await fetchRaw('https://graph.qq.com/oauth2.0/authorize',{form:form({response_type:'code',client_id:'100497308',redirect_uri:'https://y.qq.com/portal/wx_redirect.html?login_type=1&surl=https://y.qq.com/',scope:'get_user_info,get_app_friends',state:'state',switch:'',from_ptlogin:'1',src:'1',update_auth:'1',openapi:'1010_1030',g_tk:String(hash33(ck.p_skey,5381)),auth_time:String(Date.now()),ui:rndHex(8)+'-'+rndHex(4)+'-'+rndHex(4)+'-'+rndHex(4)+'-'+rndHex(12)}),cookie:cookie,referer:'https://graph.qq.com/',noRedirect:true});
  var code=(/[?&]code=([^&]+)/.exec(r2.location||'')||[])[1];if(!code)throw new Error('没拿到授权 code');
  var rq=await cgi('QQConnectLogin.LoginServer','QQLogin',{code:code},{comm:{tmeLoginType:2},raw:true});if(rq.code!==0||!rq.data||!rq.data.musickey)throw new Error(loginErr(rq.code));await finishLogin(rq.data)}
function loginErr(code){return ({1000:'登录参数无效或已过期',104401:'登录参数无效或已过期',104400:'登录参数无效或已过期',20261:'登录参数错误',20271:'验证码错误',20272:'账号绑定异常',20274:'账号绑定缺失',20277:'账号受限',20278:'账号受限',20279:'登录设备数量超限',20450:'账号已被封禁',104604:'操作过于频繁，稍后再试'}[code])||('QQ 音乐返回 code '+code)}
async function finishLogin(d){setCred(d);try{await account();S.plsAt=0;save();T('已登录：'+S.nick);if(!on()){await setMode('qqm')}paint();paintSrc()}catch(e){S.key='';S.uin='';save();T('登录无效：'+String((e&&e.message)||e));paint()}}
/* ── 绑定 ── */
function bind(){
  var a2=$i('pw-add2');if(a2)a2.addEventListener('click',function(e){if(!on())return;e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();openQqm()},true);
  var mq=$i('masrc-qqm');if(mq)mq.addEventListener('click',async function(){if(!on())await setMode('qqm');openQqm()});
  var tl=$i('qqm-tolocal');if(tl)tl.addEventListener('click',async function(){await setMode('local');closeSheets()});
  paintSrc();
  if(on()){_pw.list=S.q;try{_pwPaint()}catch(e){}}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
