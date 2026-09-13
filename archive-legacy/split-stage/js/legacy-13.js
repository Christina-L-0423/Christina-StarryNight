

var IBQR=(function(){
  var EXP=new Array(256),LOG=new Array(256);(function(){var x=1;for(var i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&256)x^=0x11d}for(var j=255;j<256;j++)EXP[j]=EXP[j-255]})();
  function gmul(a,b){if(!a||!b)return 0;return EXP[(LOG[a]+LOG[b])%255]}
  /* 纠错 L：版本 → [总码字, 每块纠错码字, 块数, 每块数据码字] */
  var T={1:[26,7,1,19],2:[44,10,1,34],3:[70,15,1,55],4:[100,20,1,80],5:[134,26,1,108],6:[172,18,2,68]};
  var ALIGN={1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34]};
  function rsGen(n){var g=[1];for(var i=0;i<n;i++){var ng=new Array(g.length+1).fill(0);for(var j=0;j<g.length;j++){ng[j]^=g[j];ng[j+1]^=gmul(g[j],EXP[i])}g=ng}return g}
  function rsEnc(data,n){var g=rsGen(n),r=new Array(n).fill(0);for(var i=0;i<data.length;i++){var c=data[i]^r[0];r.shift();r.push(0);if(c)for(var j=0;j<n;j++)r[j]^=gmul(g[j+1],c)}return r}
  function bytesOf(s){var u=unescape(encodeURIComponent(s)),o=[];for(var i=0;i<u.length;i++)o.push(u.charCodeAt(i));return o}
  function encode(text){
    var d=bytesOf(text),ver=0;for(var v=1;v<=6;v++){var cap=T[v][2]*T[v][3];if(d.length+2<=cap){ver=v;break}}
    if(!ver)throw new Error('QR too long');
    var t=T[ver],total=t[2]*t[3];var bits=[];function put(val,len){for(var i=len-1;i>=0;i--)bits.push((val>>i)&1)}
    put(4,4);put(d.length,8);d.forEach(function(b){put(b,8)});
    var rem=total*8-bits.length;put(0,Math.min(4,rem));while(bits.length%8)bits.push(0);
    var cw=[];for(var i=0;i<bits.length;i+=8){var b=0;for(var j=0;j<8;j++)b=(b<<1)|bits[i+j];cw.push(b)}
    var pad=[0xec,0x11],pi=0;while(cw.length<total)cw.push(pad[(pi++)&1]);
    var blocks=[],ecs=[];for(var k=0;k<t[2];k++){var blk=cw.slice(k*t[3],(k+1)*t[3]);blocks.push(blk);ecs.push(rsEnc(blk,t[1]))}
    var out=[];for(var i=0;i<t[3];i++)blocks.forEach(function(b){if(i<b.length)out.push(b[i])});for(var i=0;i<t[1];i++)ecs.forEach(function(b){out.push(b[i])});
    return{ver:ver,cw:out};
  }
  function matrix(ver,cw){
    var n=ver*4+17,M=[],R=[];for(var i=0;i<n;i++){M.push(new Array(n).fill(0));R.push(new Array(n).fill(false))}
    function set(r,c,v){M[r][c]=v?1:0;R[r][c]=true}
    function finder(r0,c0){for(var r=-1;r<=7;r++)for(var c=-1;c<=7;c++){var rr=r0+r,cc=c0+c;if(rr<0||cc<0||rr>=n||cc>=n)continue;var on=(r>=0&&r<=6&&c>=0&&c<=6)&&(r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4));set(rr,cc,on)}}
    finder(0,0);finder(0,n-7);finder(n-7,0);
    for(var i=8;i<n-8;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
    var al=ALIGN[ver];for(var a=0;a<al.length;a++)for(var b=0;b<al.length;b++){var r0=al[a],c0=al[b];if(R[r0][c0])continue;for(var r=-2;r<=2;r++)for(var c=-2;c<=2;c++)set(r0+r,c0+c,Math.max(Math.abs(r),Math.abs(c))!==1)}
    set(n-8,8,1);
    /* 格式信息位先占位 */
    for(var i=0;i<9;i++){if(i!==6){R[8][i]=true;R[i][8]=true}}for(var i=0;i<8;i++){R[8][n-1-i]=true;R[n-1-i][8]=true}
    /* 数据布放 */
    var bits=[];cw.forEach(function(b){for(var i=7;i>=0;i--)bits.push((b>>i)&1)});
    var bi=0,up=true;for(var col=n-1;col>0;col-=2){if(col===6)col--;for(var k=0;k<n;k++){var row=up?n-1-k:k;for(var dc=0;dc<2;dc++){var c=col-dc;if(R[row][c])continue;M[row][c]=bi<bits.length?bits[bi]:0;bi++}}up=!up}
    return{n:n,M:M,R:R};
  }
  function maskFn(m,r,c){switch(m){case 0:return (r+c)%2===0;case 1:return r%2===0;case 2:return c%3===0;case 3:return (r+c)%3===0;case 4:return (Math.floor(r/2)+Math.floor(c/3))%2===0;case 5:return (r*c)%2+(r*c)%3===0;case 6:return ((r*c)%2+(r*c)%3)%2===0;default:return ((r+c)%2+(r*c)%3)%2===0}}
  function applyMask(g,m){var n=g.n,out=[];for(var r=0;r<n;r++){out.push(g.M[r].slice());for(var c=0;c<n;c++)if(!g.R[r][c]&&maskFn(m,r,c))out[r][c]^=1}return out}
  function format(mask){var f=(1<<3)|mask;var v=f<<10;for(var i=14;i>=10;i--)if((v>>i)&1)v^=0x537<<(i-10);return ((f<<10)|v)^0x5412}
  function writeFormat(M,n,mask){var f=format(mask);var bit=function(i){return (f>>i)&1};
    for(var i=0;i<6;i++)M[8][i]=bit(14-i);M[8][7]=bit(8);M[8][8]=bit(7);M[7][8]=bit(6);for(var i=0;i<6;i++)M[5-i][8]=bit(5-i);
    for(var i=0;i<7;i++)M[n-1-i][8]=bit(14-i);for(var i=0;i<8;i++)M[8][n-8+i]=bit(7-i);}
  function penalty(M,n){var p=0;
    for(var r=0;r<n;r++){var run=1;for(var c=1;c<n;c++){if(M[r][c]===M[r][c-1]){run++;if(run===5)p+=3;else if(run>5)p++}else run=1}}
    for(var c=0;c<n;c++){var run=1;for(var r=1;r<n;r++){if(M[r][c]===M[r-1][c]){run++;if(run===5)p+=3;else if(run>5)p++}else run=1}}
    for(var r=0;r<n-1;r++)for(var c=0;c<n-1;c++){var v=M[r][c];if(v===M[r][c+1]&&v===M[r+1][c]&&v===M[r+1][c+1])p+=3}
    var dark=0;for(var r=0;r<n;r++)for(var c=0;c<n;c++)dark+=M[r][c];var k=Math.abs(dark*100/(n*n)-50)/5;p+=Math.floor(k)*10;return p}
  function make(text){var e=encode(text),g=matrix(e.ver,e.cw),best=null,bs=1e9;
    for(var m=0;m<8;m++){var M=applyMask(g,m);writeFormat(M,g.n,m);var s=penalty(M,g.n);if(s<bs){bs=s;best=M}}
    return{n:g.n,M:best,ver:e.ver}}
  function draw(canvas,text,size,fg,bg){var q=make(text),n=q.n,quiet=2,scale=Math.floor(size/(n+quiet*2)),px=scale*(n+quiet*2);canvas.width=px;canvas.height=px;var ctx=canvas.getContext('2d');ctx.fillStyle=bg||'#fff';ctx.fillRect(0,0,px,px);ctx.fillStyle=fg||'#000';for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.M[r][c])ctx.fillRect((c+quiet)*scale,(r+quiet)*scale,scale,scale);return q}
  return{make:make,draw:draw};
})();


(function(){
'use strict';
var LS='ib_ncm';
var S={mode:'local',cookie:'',csrf:'',uid:0,nick:'',ava:'',vip:0,q:[],pl:{id:0,name:''},lv:'exhigh',ai:{search:true,playlist:true,like:false,edit:false,create:false,desc:false},pls:[],plsAt:0,proxy:''};
function load(){try{var j=JSON.parse(localStorage.getItem(LS)||'null');if(j&&typeof j==='object'){Object.keys(j).forEach(function(k){S[k]=j[k]});if(!S.ai||typeof S.ai!=='object')S.ai={search:true,playlist:true,like:false,edit:false,create:false,desc:false};if(!Array.isArray(S.q))S.q=[];if(!S.pl)S.pl={id:0,name:''};if(!Array.isArray(S.pls))S.pls=[]}}catch(e){}}
var _svT=0;function _saveNow(){_svT=0;try{localStorage.setItem(LS,JSON.stringify(S,function(k,v){if(k==='lyrics'||k==='coverData'||k==='_hd')return undefined;return v}))}catch(e){}}function save(){if(_svT)return;_svT=setTimeout(_saveNow,300)}try{window.addEventListener('pagehide',function(){if(_svT){clearTimeout(_svT);_saveNow()}});document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&_svT){clearTimeout(_svT);_saveNow()}})}catch(e){}
load();
window._ncm=S;
function on(){return S.mode==='ncm'}
window._ncmOn=on;
function logged(){return !!S.cookie}
function $i(x){return document.getElementById(x)}
function T(x){try{toast(x)}catch(e){}}
function https(u){u=String(u||'');return u.replace(/^http:\/\//i,'https://')}
function fmtDur(s){s=Math.max(0,Math.round(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function form(o){return Object.keys(o).map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(o[k]==null?'':o[k])}).join('&')}
function rndHex(n){var s='';for(var i=0;i<n;i++)s+=Math.floor(Math.random()*16).toString(16);return s}
var NUID=rndHex(32);
/* ── 传输：经自己部署的跨域中转 ── */
var UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
function nat(){return null}/* 浏览器版一律走跨域中转 */
function proxyFor(u){var p=String(S.proxy||'').trim();if(!p){try{p=String((_mp&&_mp.mcp&&_mp.mcp.proxy)||'').trim()}catch(e){}}if(!p)return '';return p.indexOf('{url}')>=0?p.replace('{url}',encodeURIComponent(u)):(p+encodeURIComponent(u))}/* 网易云页自己填的中转优先，没填就沿用 MCP 卡「跨域中转」；拼法同一套 */
var NO_TRANSPORT='先到 DIY → MCP 卡填「跨域中转」（要用 GUIDE 里的新版 Worker 代码，并放行 music.163.com）';
function canGo(){return !!(nat()||proxyFor('https://music.163.com/'))}
function cookieStr(extra){var p=[];if(S.cookie)p.push('MUSIC_U='+S.cookie);if(S.csrf)p.push('__csrf='+S.csrf);p.push('os=pc','__remember_me=true','_ntes_nuid='+NUID,'_ntes_nnid='+NUID+','+Date.now());if(extra)p.push(extra);return p.join('; ')}
function msgOf(j){return String((j&&(j.message||j.msg||j.error))||('网易云返回 code '+(j&&j.code)))}
async function req(path,opt){opt=opt||{};
  var url='https://music.163.com'+path;var body=opt.form!=null?opt.form:(opt.data?form(opt.data):null);var method=opt.method||(body!=null?'POST':'GET');
  var N=nat(),st=0,j=null,hd2={};
  if(N){var hd={'Referer':'https://music.163.com/','User-Agent':UA,'Accept':'application/json, text/plain, */*','Cookie':cookieStr(opt.cookie)};if(body!=null)hd['Content-Type']='application/x-www-form-urlencoded';
    var r;try{r=await N.request({url:url,method:method,headers:hd,data:body!=null?body:undefined,responseType:'text',connectTimeout:15000,readTimeout:20000})}catch(e){throw new Error('网络错误：'+String((e&&e.message)||e).slice(0,100))}
    st=(r&&r.status)|0;if(r&&typeof r.data==='string'){try{j=JSON.parse(r.data)}catch(e){}}else if(r&&r.data&&typeof r.data==='object')j=r.data;
    try{var H=(r&&r.headers)||{};Object.keys(H).forEach(function(k){hd2[String(k).toLowerCase()]=H[k]})}catch(e){}
  }else{var px=proxyFor(url);if(!px)throw new Error(NO_TRANSPORT);
    var hb={'Accept':'application/json, text/plain, */*','X-IB-Cookie':cookieStr(opt.cookie),'X-IB-Referer':'https://music.163.com/','X-IB-UA':UA};if(body!=null)hb['Content-Type']='application/x-www-form-urlencoded';
    var ac=new AbortController(),tmo=setTimeout(function(){try{ac.abort()}catch(e){}},20000);var rb;
    try{rb=await fetch(px,{method:method,headers:hb,body:body!=null?body:undefined,signal:ac.signal})}catch(e){clearTimeout(tmo);throw new Error(e&&e.name==='AbortError'?'中转超时':'网络错误：跨域中转不可达，或它没放行 music.163.com')}
    clearTimeout(tmo);st=rb.status|0;var txt='';try{txt=await rb.text()}catch(e){}try{j=JSON.parse(txt)}catch(e){}
    try{hd2['set-cookie']=rb.headers.get('x-ib-set-cookie')||''}catch(e){}
    if(!j&&st>=400)throw new Error('中转返回 HTTP '+st+(st===403?'（口令不对或主机未放行）':''));
  }
  if(!j)throw new Error('HTTP '+st+'：响应无法解析'+(N?'':'（中转是不是旧版代码？）'));
  try{Object.defineProperty(j,'_hd',{value:hd2,enumerable:false})}catch(e){}
  if(!opt.raw&&j.code===-462&&!opt._w&&path.indexOf('/api/')===0){try{var p2=path.split('?')[0].replace(/^\/api\//,'/weapi/'),d2={};if(opt.data)Object.keys(opt.data).forEach(function(k){d2[k]=opt.data[k]});else if(path.indexOf('?')>0)path.split('?')[1].split('&').forEach(function(kv){var q=kv.indexOf('=');if(q>0)d2[decodeURIComponent(kv.slice(0,q))]=decodeURIComponent(kv.slice(q+1))});return await wreq(p2,d2,Object.assign({},opt,{_w:true}))}catch(e2){if(!(e2&&e2.code===-462))throw e2}}
  if(!opt.raw&&j.code!==undefined&&j.code!==200){var er=new Error(msgOf(j)+(j.code===-462?'（网易云风控 -462：不是登录失效，不用重新登录；过几分钟或换个网络再试）':''));er.code=j.code;er.json=j;throw er}
  return j;
}
/* ── weapi 加密（与网易云网页端同算法：AES-CBC 两轮 + RSA 无填充） ── */
var TE=new TextEncoder();var W_IV=TE.encode('0102030405060708'),W_KEY=TE.encode('0CoJUm6Qyw8W8jud'),W_B62='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
var W_N=BigInt('0xe0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7'),W_E=BigInt(65537);
function b64(u8){var s='';for(var i=0;i<u8.length;i++)s+=String.fromCharCode(u8[i]);return btoa(s)}
async function aesCbc(key,bytes){var k=await crypto.subtle.importKey('raw',key,{name:'AES-CBC'},false,['encrypt']);return b64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-CBC',iv:W_IV},k,bytes)))}
function modPow(b,e,m){var r=BigInt(1);b%=m;while(e>BigInt(0)){if(e&BigInt(1))r=r*b%m;e>>=BigInt(1);b=b*b%m}return r}
async function weapi(obj){obj=Object.assign({},obj,{csrf_token:S.csrf||''});var text=JSON.stringify(obj);var sk=new Uint8Array(16);crypto.getRandomValues(sk);for(var i=0;i<16;i++)sk[i]=W_B62.charCodeAt(sk[i]%62);
  var first=await aesCbc(W_KEY,TE.encode(text));var params=await aesCbc(sk,TE.encode(first));var hex='';Array.from(sk).reverse().forEach(function(x){hex+=('0'+x.toString(16)).slice(-2)});
  var ch=modPow(BigInt('0x'+hex),W_E,W_N).toString(16);while(ch.length<256)ch='0'+ch;return 'params='+encodeURIComponent(params)+'&encSecKey='+ch}
async function wreq(path,data,opt){opt=opt||{};return req(path+(path.indexOf('?')<0?'?csrf_token=':'&csrf_token=')+encodeURIComponent(S.csrf||''),Object.assign({form:await weapi(data||{}),method:'POST'},opt))}
function ibMd5(str){var u=unescape(encodeURIComponent(String(str)));var K=[],Sh=[7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];for(var i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296);
  var len=u.length,bl=((len+8>>6)+1)*16,w=new Array(bl).fill(0);for(var i=0;i<len;i++)w[i>>2]|=u.charCodeAt(i)<<((i%4)*8);w[len>>2]|=0x80<<((len%4)*8);w[bl-2]=(len*8)>>>0;w[bl-1]=Math.floor(len*8/4294967296);
  var a=0x67452301,b=0xefcdab89,c=0x98badcfe,d=0x10325476;function rl(x,n){return (x<<n)|(x>>>(32-n))}
  for(var j=0;j<bl;j+=16){var A=a,B=b,C=c,D=d;for(var i=0;i<64;i++){var f,g;if(i<16){f=(B&C)|(~B&D);g=i}else if(i<32){f=(D&B)|(~D&C);g=(5*i+1)%16}else if(i<48){f=B^C^D;g=(3*i+5)%16}else{f=C^(B|~D);g=(7*i)%16}var t=D;D=C;C=B;B=(B+rl((A+f+K[i]+w[j+g])|0,Sh[i]))|0;A=t}a=(a+A)|0;b=(b+B)|0;c=(c+C)|0;d=(d+D)|0}
  return [a,b,c,d].map(function(x){var s='';for(var i=0;i<4;i++)s+=('0'+((x>>>(i*8))&255).toString(16)).slice(-2);return s}).join('')}
/* ── 数据整形 ── */
function mkRec(s){if(!s||!s.id)return null;var ar=(s.ar||s.artists||[]).map(function(a){return a&&a.name}).filter(Boolean).join(' / ');var al=s.al||s.album||{};var pic=al.picUrl||s.picUrl||'';var dur=(s.dt||s.duration||0)/1000;
  return{id:'ncm_'+s.id,nid:s.id,ncm:true,name:String(s.name||''),title:String(s.name||''),artist:ar,album:String(al.name||''),cover:pic?(https(pic)+'?param=600y600'):'',dur:dur,fee:s.fee||0,metaScanned:true,analysis:{version:(window.IBMusicCore&&window.IBMusicCore.VERSION)||1,summary:'',duration:dur,ncm:true}}}
function pickCookie(txt){txt=String(txt||'').trim();var out={u:'',c:''};var m=txt.match(/MUSIC_U=([^;\s,]+)/i);if(m)out.u=m[1];else if(/^[0-9a-f]{20,}$/i.test(txt))out.u=txt;var m2=txt.match(/__csrf=([^;\s,]+)/i);if(m2)out.c=m2[1];return out}
function cookiesFrom(j){var h=(j&&j._hd)||{};var sc=String(h['set-cookie']||'');var out={u:'',c:''};var m=sc.match(/MUSIC_U=([^;,\s]+)/);if(m)out.u=m[1];var m2=sc.match(/__csrf=([^;,\s]+)/);if(m2)out.c=m2[1];return out}
/* ── 账号 ── */
async function account(){var j=await req('/api/w/nuser/account/get');var acc=j.account||{},pf=j.profile||null;if(!pf&&!acc.id){var er=new Error('登录已失效，重新登录');er.code=301;throw er}
  S.uid=acc.id||(pf&&pf.userId)||0;S.nick=(pf&&pf.nickname)||('用户'+S.uid);S.ava=pf&&pf.avatarUrl?(https(pf.avatarUrl)+'?param=120y120'):'';S.vip=(pf&&pf.vipType)||acc.vipType||0;save();return S}
async function playlists(force){if(!force&&S.pls.length&&Date.now()-S.plsAt<600000)return S.pls;var j=await req('/api/user/playlist?uid='+S.uid+'&limit=100&offset=0');
  S.pls=(j.playlist||[]).map(function(p){return{id:p.id,name:String(p.name||''),n:p.trackCount||0,pic:p.coverImgUrl?(https(p.coverImgUrl)+'?param=120y120'):'',mine:!!(p.creator&&p.creator.userId===S.uid),liked:p.specialType===5}});S.plsAt=Date.now();save();return S.pls}
async function details(ids){var out=[];for(var i=0;i<ids.length;i+=50){var c=ids.slice(i,i+50).map(function(id){return{id:id}});var j=await req('/api/v3/song/detail',{data:{c:JSON.stringify(c)}});(j.songs||[]).forEach(function(s){var r=mkRec(s);if(r)out.push(r)})}return out}
async function tracksOf(pid,cap){cap=cap||500;var j=await req('/api/v6/playlist/detail?id='+pid+'&n=1000&s=8');var pl=j.playlist||{};var got=(pl.tracks||[]).map(mkRec).filter(Boolean);var ids=(pl.trackIds||[]).map(function(t){return t&&t.id}).filter(Boolean);
  if(ids.length>got.length){var have={};got.forEach(function(r){have[r.nid]=1});var rest=ids.filter(function(id){return !have[id]}).slice(0,Math.max(0,cap-got.length));if(rest.length)got=got.concat(await details(rest))}
  if(ids.length){var order={};ids.forEach(function(id,i){order[id]=i});got.sort(function(a,b){return (order[a.nid]||0)-(order[b.nid]||0)})}
  return{name:String(pl.name||''),list:got.slice(0,cap),total:ids.length||got.length}}
async function daily(){var j=await req('/api/v3/discovery/recommend/songs');return ((j.data&&j.data.dailySongs)||[]).map(mkRec).filter(Boolean)}
async function fm(){var j=await req('/api/v1/radio/get');return (j.data||[]).map(mkRec).filter(Boolean)}
async function record(all){var j=await req('/api/v1/play/record?uid='+S.uid+'&type='+(all?0:1)+'&limit=100');var arr=(all?j.allData:j.weekData)||[];return arr.map(function(r){var rec=mkRec(r&&r.song);if(rec&&r.playCount)rec.plays=r.playCount|0;return rec}).filter(Boolean)}/* 我的听歌排行：type 1 本周 / 0 全部（与 MCP get_play_history 同一接口） */
async function search(q,n){var j=await req('/api/search/get?s='+encodeURIComponent(q)+'&type=1&limit='+(n||12)+'&offset=0');var songs=(j.result&&j.result.songs)||[];var ids=songs.map(function(s){return s.id});if(!ids.length)return[];try{var full=await details(ids);if(full.length){var by={};full.forEach(function(r){by[r.nid]=r});return ids.map(function(id){return by[id]}).filter(Boolean)}}catch(e){}return songs.map(mkRec).filter(Boolean)}
async function lyric(nid){var j=await req('/api/song/lyric?id='+nid+'&lv=1&tv=1');var lrc=(j.lrc&&j.lrc.lyric)||'';var tl=(j.tlyric&&j.tlyric.lyric)||'';if(!lrc)return null;var ly=window.IBMusicCore.parseLyrics(lrc,'ncm.lrc');ly.timed=!!(ly.segments&&ly.segments.length);ly.source='lrc';if(tl)ly.translation=tl;return ly}
async function songUrl(rec){var nid=rec.nid,lv=S.lv||'exhigh',u='',trial=false;
  var tries=[function(){return req('/api/song/enhance/player/url/v1?ids='+encodeURIComponent('['+nid+']')+'&level='+lv+'&encodeType=mp3',{raw:true})},
    function(){return wreq('/weapi/song/enhance/player/url/v1',{ids:'['+nid+']',level:lv,encodeType:'mp3'},{raw:true})},
    function(){return wreq('/weapi/song/enhance/player/url',{ids:'['+nid+']',br:320000},{raw:true})}];
  for(var i=0;i<tries.length&&!u;i++){try{var j=await tries[i]();var d=(j&&j.data&&j.data[0])||null;if(d&&d.url){u=https(d.url);trial=!!d.freeTrialInfo}}catch(e){}}
  if(!u){u='https://music.163.com/song/media/outer/url?id='+nid+'.mp3';rec._outer=true}else rec._outer=false;
  rec._trial=trial;return u}
async function like(nid,yes){await req('/api/song/like?trackId='+nid+'&like='+(yes?'true':'false')+'&csrf_token='+encodeURIComponent(S.csrf||''))}
async function plOp(pid,nid,op){try{await req('/api/playlist/manipulate/tracks?csrf_token='+encodeURIComponent(S.csrf||''),{data:{pid:pid,trackIds:JSON.stringify([nid]),op:op,csrf_token:S.csrf||''}})}catch(e){if(e.code===502&&op==='add')throw new Error('这首歌已经在歌单里了');throw e}}
async function plCreate(name,desc){var j=await req('/api/playlist/create?csrf_token='+encodeURIComponent(S.csrf||''),{data:{name:name,privacy:0,type:'NORMAL',csrf_token:S.csrf||''}});var pid=j.id||(j.playlist&&j.playlist.id);if(pid&&desc){try{await plDesc(pid,desc)}catch(e){}}S.plsAt=0;return pid}
async function plDesc(pid,desc){await req('/api/playlist/desc/update?csrf_token='+encodeURIComponent(S.csrf||''),{data:{id:pid,desc:desc,csrf_token:S.csrf||''}})}
async function coverData(rec){if(!rec.cover||rec.coverData)return;var N=nat();if(!N)return;try{var r=await N.request({url:rec.cover.replace(/\?param=.*$/,'?param=300y300'),method:'GET',headers:{'Referer':'https://music.163.com/','User-Agent':UA},responseType:'blob',connectTimeout:15000,readTimeout:20000});var b=(r&&typeof r.data==='string')?r.data.replace(/[\r\n\s]/g,''):'';if(b&&b.length<400000){var ct='image/jpeg';try{var H=(r&&r.headers)||{};Object.keys(H).forEach(function(k){if(String(k).toLowerCase()==='content-type'&&/image\//i.test(String(H[k])))ct=String(H[k]).split(';')[0]})}catch(e){}rec.coverData='data:'+ct+';base64,'+b}}catch(e){}}
/* ── 模式切换 ── */
function stopAudio(){try{var a=_pwA();a.pause();a.removeAttribute('src');a.load()}catch(e){}try{if(_pw.url){URL.revokeObjectURL(_pw.url);_pw.url=''}}catch(e){}}
async function setMode(m){if(S.mode===m)return;S.mode=m;save();stopAudio();_pw.idx=-1;await _pwLoad();_pwPaint();_pwListDraw();try{if(window._maRefreshMusicM)window._maRefreshMusicM()}catch(e){}paintSrc();T(m==='ncm'?'已切到网易云音乐':(m==='qqm'?'已切到 QQ 音乐':'已回到本地音乐'))}
window._ncmSetMode=setMode;
function setQueue(list,pl,playFrom){S.q=list.slice();S.pl=pl||{id:0,name:''};save();_pw.list=S.q;_pw.idx=-1;if(S.q.length&&playFrom!==false)_pwPlayIdx(0);else{_pwPaint();_pwListDraw()}}
/* ── 播放内核挂钩（只在网易云模式下生效，本地模式一字不变） ── */
var _pwLoad1=_pwLoad;_pwLoad=async function(){if(!on())return _pwLoad1();_pw.list=S.q;if(_pw.idx>=_pw.list.length)_pw.idx=_pw.list.length?_pw.list.length-1:-1};
var _pwPlayIdx1=_pwPlayIdx,playTok=0,failN=0;
_pwPlayIdx=async function(i){await _pwLoad();if(!on())return _pwPlayIdx1(i);
  if(!_pw.list.length){T('队列为空，先选一个歌单');_pwPaint();return}
  if(!(_pw.list[0]&&_pw.list[0].ncm))return _pwPlayIdx1(i);
  i=((i%_pw.list.length)+_pw.list.length)%_pw.list.length;_pw.idx=i;var rec=_pw.list[i],a=_pwA();var tok=++playTok;_pwPaint();_pwListDraw();
  var url='';try{url=await songUrl(rec)}catch(e){T(String((e&&e.message)||e))}
  if(tok!==playTok)return;
  try{if(_pw.url){URL.revokeObjectURL(_pw.url);_pw.url=''}}catch(e){}
  a.src=url;ensure(rec);
  try{await a.play();failN=0;if(rec._trial)T('VIP 曲目，当前账号只有试听片段')}catch(e){if(tok!==playTok)return;failN++;T('播放失败'+(rec._outer?'（未取到播放地址）':''));if(failN>=3){failN=0;T('连续 3 首都放不出来，已停下——检查网络或账号');return}if(_pw.list.length>1&&_pw.mode!=='one')setTimeout(function(){if(tok===playTok)_pwPlayIdx(i+1)},700);return}
  _pwPaint();_pwListDraw();try{_musicSyncCardsM()}catch(e){}
};
var jobs={};
function ensure(rec){if(!rec||!rec.ncm||jobs[rec.id])return;jobs[rec.id]=(async function(){try{if(!rec.lyrics){var ly=null;try{ly=await lyric(rec.nid)}catch(e){}rec.lyrics=ly||{source:'lrc',segments:[],text:'',timed:false,at:Date.now(),none:true};try{if(window._maRefreshMusicM)window._maRefreshMusicM()}catch(e){}}await coverData(rec);_pwPaint()}catch(e){}finally{delete jobs[rec.id]}})()}
var _pwAddFiles1=_pwAddFiles;_pwAddFiles=async function(files,ctx){if(on()){var fs=Array.prototype.slice.call(files||[]).filter(function(f){return f&&f.size});var C=window.IBMusicCore;var lyr=C?fs.filter(C.isLyricFile):[],aud=C?fs.filter(C.isAudioFile):fs;
    if(lyr.length&&!aud.length){var rec=cur();if(!rec){T('先播放一首歌再导入歌词');return}try{var txt=(typeof _musicReadLyricsTextM==='function')?await _musicReadLyricsTextM(lyr[0]):await lyr[0].text();var ly=C.parseLyrics(txt,lyr[0].name);ly.timed=!!(ly.segments&&ly.segments.length);rec.lyrics=ly;T('歌词已绑定到当前歌曲（网易云曲目只保留本次）');try{if(window._maRefreshMusicM)window._maRefreshMusicM()}catch(e){}}catch(e){T('歌词解析失败')}return}
    await setMode('local')}return _pwAddFiles1(files,ctx)};
var _pwListDraw1=_pwListDraw;_pwListDraw=function(){try{var b2=$i('pw-add2');if(b2)b2.textContent=on()?'网易云歌单':'添加音乐'}catch(e){}if(!on())return _pwListDraw1();var box=$i('pw-list'),sh=$i('sheet-music');if(!box||!sh||!sh.classList.contains('open'))return;box.innerHTML='';
  var hd=document.createElement('div');hd.className='pwl-hd';hd.textContent=S.pl.name?('网易云 · '+S.pl.name):'网易云';box.appendChild(hd);
  if(!_pw.list.length){var em=document.createElement('div');em.className='empty';em.textContent='队列为空。点下方「网易云歌单」选一个歌单或搜歌。';box.appendChild(em);return}
  var tok=++drawTok,list=_pw.list;function mk(r,i){var row=document.createElement('div');row.className='pwl-row'+(i===_pw.idx?' on':'');row.innerHTML='<span class="pwl-n">'+(i+1)+'</span><span class="pwl-t">'+esc(r.title||r.name)+(r.artist?' <i class="pwl-ar">'+esc(r.artist)+'</i>':'')+'</span><span class="pwl-d">'+fmtDur(r.dur)+'</span><button class="pwl-x" title="移出队列"><svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button>';
    row.addEventListener('click',function(){_pwPlayIdx(i)});row.querySelector('.pwl-x').addEventListener('click',function(e){e.stopPropagation();var was=(i===_pw.idx);S.q.splice(i,1);save();_pw.list=S.q;if(was){stopAudio();_pw.idx=S.q.length?Math.min(i,S.q.length-1):-1;if(_pw.idx>=0)_pwPlayIdx(_pw.idx)}else if(i<_pw.idx)_pw.idx--;_pwPaint();_pwListDraw()});return row}
  var i=0;function step(){if(tok!==drawTok||!box.isConnected)return;var frag=document.createDocumentFragment(),end=Math.min(list.length,i+(i?80:60));for(;i<end;i++)frag.appendChild(mk(list[i],i));box.appendChild(frag);if(i<list.length)setTimeout(step,16)}step()/* 低配机策略：长队列分批画（首批 60 行，之后每 16ms 80 行），再切一次重画会作废前一轮 */};
var drawTok=0;
/* 「一起听」上下文：网易云曲目没有本机结构分析，改按歌名 / 歌手 / 专辑 / 歌词组织 */
(function(){var C=window.IBMusicCore;if(!C)return;var ctx0=C.context;C.context=function(rec,sec,dur,fid,ma){if(!(rec&&rec.ncm))return ctx0.apply(this,arguments);ma=ma||{};var out=['【一起听歌】','正在播放：《'+(rec.title||rec.name)+'》'+(rec.artist?' · '+rec.artist:'')+(rec.album?'（专辑《'+rec.album+'》）':'')+'（网易云音乐，用户自己账号的歌单）'+((fid&&ma.mate===fid)?'（'+_amUserName()+'此刻正和你一起听这首歌）':'')];
  if(isFinite(sec))out.push('当前进度：'+C.fmt(sec)+(isFinite(dur)&&dur>0?' / '+C.fmt(dur):''));
  var near=C.nearLyrics(rec.lyrics,sec,12);if(near.length)out.push('当前附近歌词：\n'+near.map(function(s){return C.fmt(s.start)+' '+s.text}).join('\n'));else if(rec.lyrics&&rec.lyrics.text)out.push('这首歌有歌词但没有时间轴，无法定位当前一句。');else out.push('这首歌没有取到歌词。');
  out.push('以上是程序实际取得的曲目 / 歌词参考。没有提供的具体旋律、编曲或细节不要假装听见；可以基于这些事实自然陪对方听。');return out.join('\n\n')}})();
/* ── AI 控制：协议块与执行器扩展（受 Presence「允许 AI 控制播放器」总开关） ── */
function aiLines(){if(!on()||!logged())return[];var ai=S.ai||{},L=[];
  if(ai.search)L.push('<ws_music op="search" q="歌名 或 歌手 歌名"/> 点歌——在网易云搜索、把第一首匹配加进队列并播放');
  if(ai.playlist)L.push('<ws_music op="playlist" q="歌单名"/> 切到用户的某个歌单（模糊匹配；q="每日推荐" 播放今日推荐，q="私人FM" 播放私人 FM，q="听歌排行" / "全部听歌排行" 播放用户本周 / 全部听歌排行）');
  if(ai.view)L.push('<ws_music op="view" q="歌单列表 | 歌单名 | 红心 | 听歌排行 | 全部听歌排行" n="20"/> 查看（只读）：q 省略或写「歌单列表」列出全部歌单；写歌单名或「红心」列该歌单曲目，n 省略＝全部（最多 200 首）；「听歌排行」/「全部听歌排行」列用户本周 / 全部的播放排名；结果全文随下一条消息回传');/* v222-p */
  if(ai.like)L.push('<ws_music op="like"/> 红心当前曲　<ws_music op="unlike"/> 取消红心');
  if(ai.edit)L.push('<ws_music op="add" q="歌名" to="歌单名"/> 把歌加进用户的歌单（q 省略＝当前曲）　<ws_music op="remove" q="歌名" to="歌单名"/> 从歌单移除');
  if(ai.create)L.push('<ws_music op="create" q="歌单名" desc="简介"/> 在用户账号里新建歌单');
  if(ai.desc)L.push('<ws_music op="desc" q="歌单名" desc="新简介"/> 改歌单简介');
  L.push('<ws_music op="mode" q="loop|one|rand"/> 播放模式：列表循环 / 单曲循环 / 随机');return L}
window._ncmInstrM=function(){var L=aiLines();if(!L.length)return'';return '\n【网易云音乐】播放器已切到网易云模式，放的是用户自己账号里的歌。除上面的播放器指令外，还可用：\n'+L.join('\n')+'\n仍是每条回复最多 1 个播放器指令，执行结果会回传。红心 / 加歌 / 删歌 / 建歌单 / 改简介会真实改动用户的网易云账号，只在用户明确要求时做；用户的歌单名单会在聊到音乐时作为参考资料提供。'};
function fuzzy(list,key,q){q=String(q||'').trim().toLowerCase();if(!q)return -1;var i=list.findIndex(function(x){return String(x[key]||'').toLowerCase()===q});if(i<0)i=list.findIndex(function(x){return String(x[key]||'').toLowerCase().indexOf(q)>=0});if(i<0)i=list.findIndex(function(x){return q.indexOf(String(x[key]||'').toLowerCase())>=0&&String(x[key]||'').length>=2});return i}
function cur(){return (_pw.idx>=0&&_pw.list)?_pw.list[_pw.idx]:null}
async function findPl(q){var pls=await playlists();var i=fuzzy(pls,'name',q);if(i<0)throw new Error('用户的歌单里没有「'+q+'」。可用歌单：'+pls.slice(0,20).map(function(p){return p.name}).join(' / '));return pls[i]}
async function pickSong(q){if(!q){var c=cur();if(!c)throw new Error('没有正在播放的歌，也没有指定歌名');return c}var i=fuzzy(_pw.list||[],'title',q);if(i>=0)return _pw.list[i];var rs=await search(q,3);if(!rs.length)throw new Error('网易云搜不到「'+q+'」');return rs[0]}
async function exec(op,q,ext){ext=ext||{};var ai=S.ai||{};
  if(!logged())return{ok:false,label:'网易云',detail:'用户还没登录网易云'};
  try{
    if(op==='search'){if(!ai.search)return{ok:false,label:'点歌',detail:'用户未开放「点歌」'};var rs=await search(q,5);if(!rs.length)return{ok:false,label:'点歌',detail:'网易云搜不到「'+q+'」'};var r=rs[0];var j=S.q.findIndex(function(x){return x.nid===r.nid});if(j<0){var at=_pw.idx>=0?_pw.idx+1:S.q.length;S.q.splice(at,0,r);save();_pw.list=S.q;j=at}await _pwPlayIdx(j);return{ok:true,label:'点歌',detail:'《'+r.title+'》'+(r.artist?' · '+r.artist:'')+(r._trial?'（VIP 曲目，只有试听片段）':'')}}
    if(op==='playlist'){if(!ai.playlist)return{ok:false,label:'切歌单',detail:'用户未开放「切换歌单」'};var qq=String(q||'').replace(/\s+/g,'');
      if(/每日推荐|今日推荐|daily/i.test(qq)){var d=await daily();if(!d.length)return{ok:false,label:'每日推荐',detail:'今天没有推荐'};setQueue(d,{id:'daily',name:'每日推荐'});return{ok:true,label:'每日推荐',detail:d.length+' 首，已从第一首开始'}}
      if(/私人fm|私人电台|fm/i.test(qq)){var f=await fm();if(!f.length)return{ok:false,label:'私人 FM',detail:'FM 没有返回歌曲'};setQueue(f,{id:'fm',name:'私人 FM'});return{ok:true,label:'私人 FM',detail:f.map(function(x){return '《'+x.title+'》'}).join('')}}
      if(/排行|榜|record|top/i.test(qq)){var all=/全部|总|all/i.test(qq);var rc=await record(all);if(!rc.length)return{ok:false,label:'听歌排行',detail:'排行里还没有歌'};setQueue(rc,{id:all?'rec_all':'rec_week',name:all?'听歌排行 · 全部':'听歌排行 · 本周'});return{ok:true,label:'听歌排行',detail:(all?'全部 ':'本周 ')+rc.length+' 首，已从第一首开始'}}
      var p=await findPl(q);var t=await tracksOf(p.id);if(!t.list.length)return{ok:false,label:'切歌单',detail:'歌单「'+p.name+'」是空的'};setQueue(t.list,{id:p.id,name:p.name});return{ok:true,label:'切歌单',detail:'「'+p.name+'」'+t.list.length+' 首'+(t.total>t.list.length?'（歌单共 '+t.total+' 首，只载入前 '+t.list.length+' 首）':'')+'，已从第一首开始'}}
    if(op==='like'||op==='unlike'){if(!ai.like)return{ok:false,label:'红心',detail:'用户未开放「红心」'};var s=await pickSong(q);await like(s.nid,op==='like');S.plsAt=0;return{ok:true,label:op==='like'?'红心':'取消红心',detail:'《'+s.title+'》'}}
    if(op==='add'||op==='remove'){if(!ai.edit)return{ok:false,label:'歌单',detail:'用户未开放「加进 · 移出歌单」'};if(!ext.to)return{ok:false,label:'歌单',detail:'缺少 to="歌单名"'};var s2=await pickSong(q);var pl=await findPl(ext.to);await plOp(pl.id,s2.nid,op==='add'?'add':'del');S.plsAt=0;return{ok:true,label:op==='add'?'加进歌单':'移出歌单',detail:'《'+s2.title+'》→「'+pl.name+'」'}}
    if(op==='create'){if(!ai.create)return{ok:false,label:'新建歌单',detail:'用户未开放「新建歌单」'};if(!q)return{ok:false,label:'新建歌单',detail:'缺少歌单名'};var pid=await plCreate(String(q).slice(0,40),String(ext.desc||'').slice(0,300));return{ok:true,label:'新建歌单',detail:'「'+q+'」'+(pid?'（id '+pid+'）':'')+(ext.desc?'，简介已写':'')}}
    if(op==='desc'){if(!ai.desc)return{ok:false,label:'改简介',detail:'用户未开放「改歌单简介」'};var pl2=await findPl(q);await plDesc(pl2.id,String(ext.desc||'').slice(0,300));return{ok:true,label:'改简介',detail:'「'+pl2.name+'」的简介已更新'}}
    if(op==='view'){if(!ai.view)return{ok:false,label:'查看歌单',detail:'用户未开放「查看歌单」'};var qv=String(q||'').replace(/\s+/g,''),nv=parseInt(ext.n,10);nv=(isFinite(nv)&&nv>0)?Math.min(nv,200):0;var fmtL=function(x,i){return (i+1)+'. 《'+x.title+'》'+(x.artist?' · '+x.artist:'')+(x.plays?' · '+x.plays+' 次':'')};
      if(!qv||/歌单列表|全部歌单|我的歌单|列表|^lists?$/i.test(qv)){var pls=await playlists(true);return{ok:true,label:'歌单列表',detail:pls.length+' 个歌单',path:'网易云 · 歌单列表',response:'用户的网易云歌单（'+pls.length+' 个）：\n'+pls.map(function(p){return (p.liked?'♥ ':'')+'「'+p.name+'」'+p.n+' 首'+(p.mine?'':'（收藏的）')}).join('\n')}}
      if(/排行|榜|record|rank|top/i.test(qv)){var all=/全部|总|all/i.test(qv);var rc=await record(all);var take=nv||(all?50:30);return{ok:true,label:'听歌排行',detail:(all?'全部':'本周')+' · 列出 '+Math.min(rc.length,take)+' 首',path:'网易云 · 听歌排行（'+(all?'全部':'本周')+'）',response:'用户的听歌排行（'+(all?'全部':'本周')+'，共 '+rc.length+' 首，列出前 '+Math.min(rc.length,take)+' 首，按播放次数）：\n'+rc.slice(0,take).map(fmtL).join('\n')}}
      var pv=null;if(/红心|喜欢|like/i.test(qv)){pv=(await playlists()).filter(function(p){return p.liked})[0]||null}if(!pv)pv=await findPl(q);var tv=await tracksOf(pv.id,nv||500);var lst=nv?tv.list.slice(0,nv):tv.list;return{ok:true,label:'查看歌单',detail:'「'+pv.name+'」列出 '+lst.length+' 首',path:'网易云 · 歌单「'+pv.name+'」',response:'歌单「'+pv.name+'」（共 '+tv.total+' 首，列出 '+lst.length+' 首）：\n'+lst.map(fmtL).join('\n')}}
    if(op==='mode'){var m=String(q||'').toLowerCase();m=/one|单曲/.test(m)?'one':(/rand|随机|shuffle/.test(m)?'rand':'loop');_pw.mode=m;_pwPaint();try{await loadMP();_mp.ui=_mp.ui||{};_mp.ui.musicMode=m;await saveMP()}catch(e){}try{if(window._maRefreshMusicM)window._maRefreshMusicM()}catch(e){}return{ok:true,label:'播放模式',detail:m==='one'?'单曲循环':(m==='rand'?'随机播放':'列表循环')}}
  }catch(e){return{ok:false,label:'网易云',detail:String((e&&e.message)||e).slice(0,160)}}
  return null}
var NCM_OPS={search:1,playlist:1,like:1,unlike:1,add:1,remove:1,create:1,desc:1,mode:1,view:1};/* v222-p：+view 查看歌单 */
var _mtExec1=_mtExec;_mtExec=async function(op,q,ext){if(on()&&NCM_OPS[op]){var r=await exec(op,q,ext);if(r)return r}return _mtExec1(op,q)};
var _bmt1=buildMusicTail;buildMusicTail=function(userMsg,fid){var s=_bmt1(userMsg,fid)||'';try{var ma=(_mp&&_mp.musicAi)||{};if(on()&&logged()&&ma.ctl&&S.ai&&S.ai.playlist&&typeof _musicRelatedM==='function'&&_musicRelatedM(userMsg,cur())&&S.pls.length){s+=(s?'\n\n':'')+'【网易云歌单】'+(S.pl.name?'当前：「'+S.pl.name+'」；':'')+'用户的歌单：'+S.pls.slice(0,30).map(function(p){return '「'+p.name+'」'}).join(' ')}}catch(e){}return s};
/* ── UI：音源切换 sheet ── */
function paintSrc(){var a=$i('masrc-local'),b=$i('masrc-ncm');if(a)a.classList.toggle('on',S.mode!=='ncm'&&S.mode!=='qqm');if(b)b.classList.toggle('on',on());try{if(window._qqmPaintSrc)window._qqmPaintSrc()}catch(e){}var st=$i('masrc-ncm-s');if(st)st.textContent=logged()?(S.nick+(S.pl.name?' · '+S.pl.name:'')):'登录账号，听自己的歌单'}
function openSrc(){paintSrc();openSheet('sheet-masrc')}
window._ncmOpenSrc=openSrc;
/* ── UI：网易云 sheet ── */
var qrTmr=null,qrKey='';
function stopQr(){if(qrTmr){clearInterval(qrTmr);qrTmr=null}qrKey=''}
function vipName(v){v=+v||0;if(v>=11)return '黑胶 VIP';if(v>0)return 'VIP';return '普通账号'}
function openNcm(){paint();openSheet('sheet-ncm')}
window._ncmOpen=openNcm;
function paint(){var b=$i('ncm-body');if(!b)return;stopQr();
  if(!logged())return paintLogin(b);
  b.innerHTML='<div class="ncm-acc"><div class="ma-ava ncm-ava" id="ncm-ava"></div><div class="ncm-accm"><b>'+esc(S.nick||'—')+'</b><small>'+esc(vipName(S.vip))+(S.uid?' · '+S.uid:'')+'</small></div><button class="btn ncm-out" id="ncm-logout" type="button">退出</button></div>'
    +'<label class="spill ncm-spill"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="ncm-q" placeholder="搜歌 · 歌名 / 歌手" autocomplete="off" enterkeyhint="search"></label><div id="ncm-res"></div>'
    +'<div class="sec-label ncm-sl">歌单</div><div id="ncm-pls"><div class="empty" style="padding:14px">正在读取歌单…</div></div>'
    +'<div class="sec-label ncm-sl">播放</div><div class="f-group"><label>音质</label><div class="sel"><select id="ncm-lv"><option value="standard">标准</option><option value="higher">较高</option><option value="exhigh">极高</option><option value="lossless">无损</option></select></div></div>'
    +'<div class="sec-label ncm-sl">AI 控制</div><p class="hint" style="margin:0 0 4px">受 Presence「允许 AI 控制播放器」总开关约束；开着的项会写进 TA 的系统能力行，切换后 TA 的下一条消息重建一次提示缓存。</p>'
    +tog('search','点歌','按歌名或歌手搜索，把第一首匹配加进队列并播放。')+tog('playlist','切换歌单','切到你的某个歌单、每日推荐或私人 FM；聊到音乐时你的歌单名单会作为参考资料提供。')+tog('view','查看歌单','把你的歌单列表、某个歌单或红心歌单的曲目（全部或前 N 首）、本周 / 全部听歌排行列给 TA 看；只读，不改动账号。')+tog('like','红心','红心 / 取消红心当前曲或指定歌曲。')+tog('edit','加进 · 移出歌单','把歌加进你的歌单，或从歌单移除。')+tog('create','新建歌单','在你的账号里新建歌单，可带简介。')+tog('desc','改歌单简介','更新某个歌单的简介。');
  try{var av=$i('ncm-ava');if(S.ava){av.style.backgroundImage='url("'+S.ava+'")';av.style.backgroundSize='cover';av.textContent=''}else av.textContent=(S.nick||'?').slice(0,1)}catch(e){}
  $i('ncm-logout').addEventListener('click',async function(){if(!await confirmDlg('退出网易云账号？队列会清空。','退出'))return;S.cookie='';S.csrf='';S.uid=0;S.nick='';S.ava='';S.vip=0;S.pls=[];S.plsAt=0;S.q=[];S.pl={id:0,name:''};save();stopAudio();_pw.idx=-1;_pw.list=S.q;_pwPaint();_pwListDraw();paint();paintSrc()});
  var lv=$i('ncm-lv');lv.value=S.lv||'exhigh';lv.addEventListener('change',function(){S.lv=lv.value;save()});
  b.querySelectorAll('.sw2[data-ai]').forEach(function(el){var k=el.getAttribute('data-ai');sw2(el,!!(S.ai&&S.ai[k]));el.addEventListener('click',function(){S.ai=S.ai||{};S.ai[k]=!S.ai[k];save();sw2(el,!!S.ai[k])})});
  var qi=$i('ncm-q'),res=$i('ncm-res'),qt=null;
  async function doSearch(){var q=String(qi.value||'').trim();if(!q){res.innerHTML='';return}res.innerHTML='<div class="empty" style="padding:12px">搜索中…</div>';try{var rs=await search(q,12);if(String(qi.value||'').trim()!==q)return;if(!rs.length){res.innerHTML='<div class="empty" style="padding:12px">没有找到「'+esc(q)+'」</div>';return}res.innerHTML='';rs.forEach(function(r){var row=document.createElement('div');row.className='mate-row ncm-row';row.innerHTML='<div class="ma-ava ncm-cv"'+(r.cover?' style="background-image:url(&quot;'+esc(r.cover.replace('600y600','120y120'))+'&quot;)"':'')+'></div><div class="ncm-rm"><b>'+esc(r.title)+(r.fee===1?' <i class="ncm-vip">VIP</i>':'')+'</b><small>'+esc(r.artist||'')+(r.album?' · '+esc(r.album):'')+'</small></div><span class="pwl-d">'+fmtDur(r.dur)+'</span>';row.addEventListener('click',function(){var j=S.q.findIndex(function(x){return x.nid===r.nid});if(j<0){var at=_pw.idx>=0?_pw.idx+1:S.q.length;S.q.splice(at,0,r);save();_pw.list=S.q;j=at}closeSheets();_pwPlayIdx(j)});res.appendChild(row)})}catch(e){res.innerHTML='<div class="empty" style="padding:12px">'+esc(String((e&&e.message)||e))+'</div>'}}
  qi.addEventListener('input',function(){clearTimeout(qt);qt=setTimeout(doSearch,500)});qi.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();clearTimeout(qt);doSearch();try{qi.blur()}catch(x){}}});
  paintPls();
}
function tog(k,t,s){return '<div class="tog nb ncm-tog"><div class="tog-m"><div class="tog-t">'+t+'</div><div class="tog-s">'+s+'</div></div><div class="sw2" data-ai="'+k+'"></div></div>'}
async function paintPls(force){var box=$i('ncm-pls');if(!box)return;try{var pls=await playlists(force);if(!$i('ncm-pls'))return;box.innerHTML='';
    var extra=[{id:'daily',name:'每日推荐',n:30,pic:'',sys:true},{id:'fm',name:'私人 FM',n:0,pic:'',sys:true},{id:'rec_week',name:'听歌排行 · 本周',n:0,pic:'',sys:true},{id:'rec_all',name:'听歌排行 · 全部',n:0,pic:'',sys:true}];
    extra.concat(pls).forEach(function(p){var row=document.createElement('div');row.className='mate-row ncm-row'+(String(S.pl.id)===String(p.id)?' on':'');row.innerHTML='<div class="ma-ava ncm-cv'+(p.sys?' sys':'')+'"'+(p.pic?' style="background-image:url(&quot;'+esc(p.pic)+'&quot;)"':'')+'>'+(p.sys?({fm:'FM',daily:'日',rec_week:'周',rec_all:'总'}[p.id]||''):'')+'</div><div class="ncm-rm"><b>'+esc(p.name)+'</b><small>'+(p.sys?({fm:'算法给你挑的下一批',daily:'今天的 30 首',rec_week:'这一周听得最多的',rec_all:'一直以来听得最多的'}[p.id]||''):(p.n+' 首'+(p.liked?' · 红心':(p.mine?'':' · 收藏的'))))+'</small></div>';
      row.addEventListener('click',async function(){try{row.classList.add('busy');var t;if(p.id==='daily'){var d=await daily();t={name:'每日推荐',list:d,total:d.length}}else if(p.id==='fm'){var f=await fm();t={name:'私人 FM',list:f,total:f.length}}else if(p.id==='rec_week'||p.id==='rec_all'){var rc=await record(p.id==='rec_all');t={name:p.name,list:rc,total:rc.length}}else t=await tracksOf(p.id);if(!t.list.length){T('这个歌单是空的');row.classList.remove('busy');return}setQueue(t.list,{id:p.id,name:t.name||p.name});closeSheets();if(t.total>t.list.length)T('歌单共 '+t.total+' 首，载入前 '+t.list.length+' 首')}catch(e){row.classList.remove('busy');T(String((e&&e.message)||e))}});box.appendChild(row)});
    var rf=document.createElement('button');rf.type='button';rf.className='btn ncm-refresh';rf.textContent='刷新歌单';rf.addEventListener('click',function(){box.innerHTML='<div class="empty" style="padding:14px">正在读取歌单…</div>';paintPls(true)});box.appendChild(rf);
  }catch(e){box.innerHTML='<div class="empty" style="padding:14px">'+esc(String((e&&e.message)||e))+'</div>';if(e&&e.code===301){S.cookie='';S.csrf='';save();paint()}}}
function paintLogin(b){
  b.innerHTML='<div class="ncm-tabs"><button class="btn on" type="button" data-t="qr">扫码</button><button class="btn" type="button" data-t="phone">手机号</button><button class="btn" type="button" data-t="cookie">Cookie</button></div>'
    +'<div class="ncm-pane" data-p="qr"><div class="ncm-qr"><canvas id="ncm-qrc" width="200" height="200"></canvas></div><div class="ncm-st" id="ncm-qrst">正在生成二维码…</div><p class="hint" style="text-align:center">用另一台设备上的网易云音乐 App 扫码；二维码约 5 分钟内有效，过期点一下刷新。只有这一台手机时用「手机号」。</p></div>'
    +'<div class="ncm-pane" data-p="phone" hidden><div class="f-group"><label>手机号</label><input id="ncm-phone" inputmode="tel" autocomplete="off" placeholder="11 位手机号"></div><div class="f-group"><label>密码 <span class="lb-note">（留空则用下面的验证码登录）</span></label><input id="ncm-pw" type="password" autocomplete="off" placeholder="网易云密码"></div><div class="f-group"><label>短信验证码</label><div class="ncm-inl"><input id="ncm-code" inputmode="numeric" autocomplete="off" placeholder="收到的验证码"><button class="btn" type="button" id="ncm-sendcode">发送验证码</button></div></div><button class="btn primary" type="button" id="ncm-login-phone" style="width:100%">登录</button></div>'
    +'<div class="ncm-pane" data-p="cookie" hidden><div class="f-group"><label>MUSIC_U</label><textarea id="ncm-cookie" rows="3" placeholder="MUSIC_U=… 或整段 Cookie"></textarea></div><p class="hint">电脑浏览器登录 music.163.com → F12 → Application → Cookies 里复制 MUSIC_U；与网易云 MCP 用的是同一串。</p><button class="btn primary" type="button" id="ncm-login-cookie" style="width:100%">登录</button></div>'
    +(nat()?'':('<div class="f-group" style="margin-top:14px"><label>跨域中转 <span class="lb-note">（选填；留空沿用 DIY → MCP 卡填的那条）</span></label><input id="ncm-proxy" autocomplete="off" placeholder="https://你的名字.workers.dev/?u=" value="'+esc(S.proxy||'')+'"></div><p class="hint" style="margin:-4px 0 8px">要用 GUIDE → DIY 里的新版 Worker 代码；想让网易云和 MCP 各走一个 Worker，就在这里单独填一条。当前生效：'+(proxyFor('https://music.163.com/')?'已配置':'未配置')+'</p>'))
    +'<p class="hint" style="margin-top:12px">账号只存在本机，不进备份，不发给任何 AI；请求经你自己的跨域中转发往网易云，中转看得到 Cookie，务必只用自己部署的。VIP 曲目能不能完整播放取决于这个账号。</p>';
  b.querySelectorAll('.ncm-tabs .btn').forEach(function(bt){bt.addEventListener('click',function(){b.querySelectorAll('.ncm-tabs .btn').forEach(function(x){x.classList.toggle('on',x===bt)});var t=bt.getAttribute('data-t');b.querySelectorAll('.ncm-pane').forEach(function(p){p.hidden=p.getAttribute('data-p')!==t});if(t==='qr')startQr();else stopQr()})});
  var pxi=$i('ncm-proxy');if(pxi)pxi.addEventListener('change',function(){S.proxy=String(pxi.value||'').trim();save();T(S.proxy?'网易云中转已保存':'已清空，沿用 MCP 卡的中转');paint()});
  $i('ncm-login-cookie').addEventListener('click',async function(){var c=pickCookie($i('ncm-cookie').value);if(!c.u){T('没识别到 MUSIC_U');return}await finishLogin(c.u,c.c)});
  $i('ncm-sendcode').addEventListener('click',async function(){var ph=String($i('ncm-phone').value||'').trim();if(!/^\d{6,15}$/.test(ph)){T('先填手机号');return}var bt=this;bt.disabled=true;try{await wreq('/weapi/sms/captcha/sent',{cellphone:ph,ctcode:'86'});T('验证码已发送');var n=60;bt.textContent=n+'s';var tm=setInterval(function(){n--;if(n<=0){clearInterval(tm);bt.disabled=false;bt.textContent='发送验证码'}else bt.textContent=n+'s'},1000)}catch(e){bt.disabled=false;T(String((e&&e.message)||e))}});
  $i('ncm-login-phone').addEventListener('click',async function(){var ph=String($i('ncm-phone').value||'').trim(),pw=String($i('ncm-pw').value||''),code=String($i('ncm-code').value||'').trim();if(!/^\d{6,15}$/.test(ph)){T('先填手机号');return}if(!pw&&!code){T('填密码，或发验证码后填验证码');return}var bt=this;bt.disabled=true;
    try{var data=pw?{phone:ph,countrycode:'86',password:ibMd5(pw),rememberLogin:'true'}:{phone:ph,countrycode:'86',captcha:code,rememberLogin:'true'};var j=await wreq('/weapi/login/cellphone',data,{raw:true});
      if(j.code!==200){T({400:'手机号格式不对',501:'账号不存在',502:'密码错误',503:'验证码错误',509:'密码错误次数过多，先用其它方式登录'}[j.code]||msgOf(j));bt.disabled=false;return}
      var c=cookiesFrom(j);if(!c.u){T('登录成功但没拿到凭证，改用扫码或 Cookie');bt.disabled=false;return}await finishLogin(c.u,c.c)}catch(e){T(String((e&&e.message)||e));bt.disabled=false}});
  startQr();
}
async function startQr(){stopQr();var st=$i('ncm-qrst'),cv=$i('ncm-qrc');if(!st||!cv)return;if(!canGo()){st.textContent=NO_TRANSPORT;st.onclick=function(){startQr()};return}st.textContent='正在生成二维码…';
  try{var j=await wreq('/weapi/login/qrcode/unikey',{type:1});var key=j.unikey;if(!key)throw new Error('没拿到二维码 key');if(!$i('ncm-qrc'))return;qrKey=key;
    var dark=document.body.classList.contains('theme-infernal');IBQR.draw(cv,'https://music.163.com/login?codekey='+key,200,dark?'#e6eefb':'#1a2740',dark?'#111b30':'#ffffff');st.textContent='等待扫码';
    var since=Date.now();qrTmr=setInterval(async function(){if(qrKey!==key||!$i('ncm-qrc')){stopQr();return}if(Date.now()-since>330000){stopQr();st.textContent='二维码已过期，点击刷新';return}
      try{var r=await wreq('/weapi/login/qrcode/client/login',{key:key,type:1},{raw:true});var code=r.code|0;
        if(code===801)st.textContent='等待扫码';else if(code===802)st.textContent='已扫码，在网易云 App 里点确认'+(r.nickname?('（'+r.nickname+'）'):'');
        else if(code===800){stopQr();st.textContent='二维码已过期，点击刷新'}
        else if(code===803){stopQr();st.textContent='登录成功';var c=cookiesFrom(r);if(!c.u){st.textContent='登录成功但没拿到凭证，改用手机号或 Cookie';return}await finishLogin(c.u,c.c)}
      }catch(e){}},2500);
  }catch(e){st.textContent='二维码生成失败：'+String((e&&e.message)||e)+'，点击重试'}
  st.onclick=function(){if(!qrTmr)startQr()};
}
async function finishLogin(u,c){S.cookie=u;S.csrf=c||S.csrf||'';save();try{await account();S.plsAt=0;save();T('已登录：'+S.nick);if(S.mode!=='ncm'){await setMode('ncm')}paint();paintSrc()}catch(e){S.cookie='';S.csrf='';save();T('登录无效：'+String((e&&e.message)||e));paint()}}
/* ── 绑定 ── */
function bind(){
  var at=$i('ma-addtop');if(at)at.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();openSrc()},true);
  var a2=$i('pw-add2');if(a2){var n2=a2.cloneNode(true);a2.parentNode.replaceChild(n2,a2);n2.addEventListener('click',function(e){e.stopPropagation();if(on())openNcm();else if(window._pwPickFiles)window._pwPickFiles('audio')})}
  var ml=$i('masrc-local');if(ml)ml.addEventListener('click',async function(){if(S.mode&&S.mode!=='local'){await setMode('local');closeSheets();return}closeSheets();if(window._pwPickFiles)window._pwPickFiles('audio')});
  var mn=$i('masrc-ncm');if(mn)mn.addEventListener('click',async function(){if(!canGo())T(NO_TRANSPORT);if(!on())await setMode('ncm');openNcm()});
  var tl=$i('ncm-tolocal');if(tl)tl.addEventListener('click',async function(){await setMode('local');closeSheets()});
  paintSrc();
  if(on()){_pw.list=S.q;try{_pwPaint()}catch(e){}}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
