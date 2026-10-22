/* SMART 생산일보 공통: 날짜 · 공휴일 · 공정 · 사유 코드 · 서버 연결 (PC 화면과 업체 모바일 화면이 같이 씀) */
const TODAY = (()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})();
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dd=(a,b)=>Math.round((Date.parse(a)-Date.parse(b))/864e5);
const addDays=(d,n)=>{const t=new Date(d+'T00:00:00');t.setDate(t.getDate()+n);return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`};
/* 공휴일 (대체공휴일 포함) · 회사 휴무일은 COMPANY_OFF에 추가 */
const HOLIDAYS={
 '2025-01-01':'신정','2025-01-27':'임시공휴일','2025-01-28':'설날','2025-01-29':'설날','2025-01-30':'설날','2025-03-01':'삼일절','2025-03-03':'대체공휴일','2025-05-05':'어린이날·부처님오신날','2025-05-06':'대체공휴일','2025-06-03':'대통령선거','2025-06-06':'현충일','2025-08-15':'광복절','2025-10-03':'개천절','2025-10-05':'추석','2025-10-06':'추석','2025-10-07':'추석','2025-10-08':'대체공휴일','2025-10-09':'한글날','2025-12-25':'성탄절',
 '2026-01-01':'신정','2026-02-16':'설날','2026-02-17':'설날','2026-02-18':'설날','2026-03-01':'삼일절','2026-03-02':'대체공휴일','2026-05-05':'어린이날','2026-05-24':'부처님오신날','2026-05-25':'대체공휴일','2026-06-03':'지방선거','2026-06-06':'현충일','2026-08-15':'광복절','2026-08-17':'대체공휴일','2026-09-24':'추석','2026-09-25':'추석','2026-09-26':'추석','2026-10-03':'개천절','2026-10-05':'대체공휴일','2026-10-09':'한글날','2026-12-25':'성탄절',
 '2027-01-01':'신정','2027-02-06':'설날','2027-02-07':'설날','2027-02-08':'설날','2027-02-09':'대체공휴일','2027-03-01':'삼일절','2027-05-05':'어린이날','2027-05-13':'부처님오신날','2027-06-06':'현충일','2027-08-15':'광복절','2027-08-16':'대체공휴일','2027-09-14':'추석','2027-09-15':'추석','2027-09-16':'추석','2027-10-03':'개천절','2027-10-04':'대체공휴일','2027-10-09':'한글날','2027-10-11':'대체공휴일','2027-12-25':'성탄절','2027-12-27':'대체공휴일'};
const COMPANY_OFF={}; // 예: {'2026-08-03':'하계휴가'}
const offName=d=>HOLIDAYS[d]||COMPANY_OFF[d]||'';
const isWork=d=>{ const w=new Date(d+'T00:00:00').getDay(); return w!==0&&w!==6&&!offName(d); };
function wdDiff(a,b){ if(a===b) return 0; const sg=b>a?1:-1; let n=0, d=a; while(d!==b){ d=addDays(d,sg); if(isWork(d)) n+=sg; } return n; }
function addWD(d,n){ const sg=n>0?1:-1; let k=Math.abs(n); while(k>0){ d=addDays(d,sg); if(isWork(d)) k--; } return d; }
const md=d=>d?d.slice(5).replace('-','/'):'';
const ymd=d=>d?d.slice(2).replace(/-/g,'.'):'';
function toast(m){const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),3200)}

/* 공정 (업무지침 5장 순서 · 키는 저장 형식 유지를 위해 그대로) */
const STEPS={m1:{l:'자재 입고'},fin:{l:'Frame 입고'},fwire:{l:'Frame 배선'},mod:{l:'Module 작업'},io:{l:'I/O CHECK'},lvl:{l:'1차 LEVEL'},dry:{l:'1차검수(DRY)'}};
const DR_KEYS=['m1','fin','fwire','mod','io','lvl','dry'];
const DR_W0={m1:5,fin:5,fwire:25,mod:30,io:15,lvl:10,dry:10}; /* 계약 별지 2 기성비율 (해지 정산용 · 화면 공정률 표시에만 사용) */
const TK_SITES=['시노드','동오정밀'];
const DR_SC={'시노드':'SND','동오정밀':'DOJ'};
const DR_WD=['월','화','수','목','금','토','일'];
/* 미달 사유 코드 (업무지침 6장) */
const RS=[
  {c:'C01',l:'자재 미입고·자재 불량',g:'회사'},{c:'C02',l:'선행공정 지연',g:'회사'},{c:'C03',l:'설계 변경',g:'회사'},{c:'C04',l:'설비 이상 (회사 설비)',g:'회사'},
  {c:'A01',l:'작업 미숙·재작업',g:'업체'},{c:'A02',l:'인력 부족',g:'업체'},{c:'A03',l:'인수검사 불합격',g:'업체'},
  {c:'E01',l:'고객 사정·기타',g:'기타'}];
const rsOf=c=>RS.find(x=>x.c===c);
const rsLabel=c=>{ if(!c) return ''; const r=rsOf(c); return r?`${r.c} ${r.l}`:c; };
const rsOpts=(sel,ph)=>`<option value="">${ph||'사유 선택'}</option>`+['회사','업체','기타'].map(g=>`<optgroup label="${g} 사유">${RS.filter(x=>x.g===g).map(x=>`<option value="${x.c}" ${sel===x.c?'selected':''}>${x.c} ${esc(x.l)}</option>`).join('')}</optgroup>`).join('');
/* 줄 결과: done(완료) · ng(미완료) · null(미입력). 예전 % 실적도 읽음 */
const rowRes=r=>r.res||(r.act==null||r.act===''?null:(+r.act>=(r.to??100)?'done':'ng'));
/* 회사 사유를 일보 날짜보다 늦게 입력했는지 (업무지침: 발생한 날 회신한 것만 인정) */
const lateRs=(r,date)=>!!(r.rs&&/^C/.test(r.rs)&&r.rat&&r.rat.slice(0,10)>date);
const hm=iso=>{ if(!iso) return ''; const d=new Date(iso); return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };

/* ================= 서버 연결 (Google Apps Script) =================
   config.js 의 SDR_API_URL = Apps Script 웹 앱 주소. 실시간은 8초마다 바뀐 것만 받아 옴 */
const SDR={
  url:(window.SDR_API_URL||'').trim(),
  tok:(()=>{try{return localStorage.getItem('sdr.tok')||''}catch(e){return ''}})(),
  me:null, cols:{}, subs:[], now:0, pt:null, busyPoll:false, onLogout:null, status:()=>{},
  setTok(t){ this.tok=t||''; try{ t?localStorage.setItem('sdr.tok',t):localStorage.removeItem('sdr.tok'); }catch(e){} },
  async api(a,params={}){
    if(!this.url||/여기에/.test(this.url)){ const e=new Error('config.js에 서버 주소(SDR_API_URL)가 없습니다. 설치 설명서 4단계를 확인해 주세요.'); e.status=0; throw e; }
    let r; const ac=new AbortController(), tm=setTimeout(()=>ac.abort(),30000);
    try{ r=await fetch(this.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({a,t:this.tok,...params}),redirect:'follow',signal:ac.signal}); }
    catch(x){ const e=new Error(x&&x.name==='AbortError'?'서버가 30초 동안 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요.':'서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.'); e.status=0; this.lastErr=e.message; throw e; }
    finally{ clearTimeout(tm); }
    let j=null; try{ j=await r.json(); }catch(x){}
    if(!j){ const e=new Error('서버 응답을 읽지 못했습니다 ('+r.status+').'); e.status=r.status||500; throw e; }
    if(j.error){ if(j.status===401&&a!=='login'){ this.setTok(''); if(this.onLogout) this.onLogout(); } const e=new Error(j.error); e.status=j.status; throw e; }
    return j;
  },
  async login(code,name){ const j=await this.api('login',{code,name,ua:navigator.userAgent}); this.setTok(j.token); this.me=j; return j; },
  async logout(){ try{ await this.api('logout'); }catch(e){} this.setTok(''); clearInterval(this.pt); location.reload(); },
  async start(){ this.me=await this.api('me'); const j=await this.api('data'); this.cols=j.cols; this.now=j.now; this.listen(); return this.me; },
  apply(col,id,doc){ const old=(this.cols[col]||{})[id]; this.cols[col]=this.cols[col]||{}; if(doc==null) delete this.cols[col][id]; else this.cols[col][id]=doc;
    if(JSON.stringify(old)!==JSON.stringify(doc??undefined)) this.emit(col,id,doc??null,old); },
  async poll(){ if(this.busyPoll||!this.tok) return; this.busyPoll=true;
    try{ const j=await this.api('changes',{since:this.now}); for(const m of j.ch) this.apply(m.col,m.id,m.doc); if(j.now>this.now) this.now=j.now; this.status('live'); }
    catch(e){ this.status('off'); } finally{ this.busyPoll=false; } },
  listen(){ clearInterval(this.pt); this.status('live');
    this.pt=setInterval(()=>{ if(!document.hidden) this.poll(); },8000);
    document.addEventListener('visibilitychange',()=>{ if(!document.hidden) this.poll(); }); },
  emit(col,id,doc,old){ for(const s of this.subs) if(s.col===col) try{ s.cb(col,id,doc,old); }catch(e){ console.error(e); } },
  on(col,cb){ this.subs.push({col,cb}); },
  async put(col,id,doc){ const j=await this.api('put',{col,id,doc}); this.apply(col,id,j.doc); return j; },
  async del(col,id){ const j=await this.api('del',{col,id}); this.apply(col,id,null); return j; },
  async report(o){ const j=await this.api('report',o); const d=(this.cols.drd||{})[o.id]; if(d&&d.rows){ const nd=JSON.parse(JSON.stringify(d)); nd.rows[o.rk]=j.row; this.apply('drd',o.id,nd); } return j; },
};

/* PC 화면용: 예전 claude 저장소와 같은 모양(collection/doc/onSnapshot)으로 감싼 것 */
function sdrClaudeShim(){
  const snap=(col,list)=>({docChanges:()=>list.map(([type,id,doc])=>({type,doc:{id,data:()=>JSON.parse(JSON.stringify(doc))}}))});
  const docRef=(col,id)=>({
    id,
    async get(){ const d=(SDR.cols[col]||{})[id]; return {exists:d!=null,data:()=>d==null?null:JSON.parse(JSON.stringify(d))}; },
    async set(body){ const j=await SDR.put(col,id,body); return j; },
    async delete(){ await SDR.del(col,id); },
  });
  const db={
    collection(col){ return {
      doc:id=>docRef(col,id),
      onSnapshot(cb,err){ const all=Object.entries(SDR.cols[col]||{}).map(([id,d])=>['added',id,d]); setTimeout(()=>cb(snap(col,all)),0);
        SDR.on(col,(c,id,doc,old)=>cb(snap(col,[[doc==null?'removed':(old==null?'added':'modified'),id,doc||{}]]))); return ()=>{}; } }; },
    doc(p){ const i=p.indexOf('/'); return docRef(p.slice(0,i),p.slice(i+1)); },
  };
  return { use:async n=>n==='db'?db:n==='user'?{me:async()=>({name:SDR.me&&SDR.me.name||''})}:null };
}

/* 로그인 화면 (PC · 모바일 공통) */
function loginView(el,{title,sub,onDone}){
  el.innerHTML=`<div class="login"><form class="lcard" id="lform" autocomplete="on">
    <h1>${esc(title)}</h1><p class="lsub">${esc(sub||'')}</p>
    <label>입장 코드<input id="lcode" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" placeholder="숫자 8자리" required></label>
    <label>이름<input id="lname" autocomplete="name" placeholder="예: 홍길동" maxlength="20" required></label>
    <div id="lerr" class="lerr" role="alert"></div>
    <button class="btn pri big" type="submit">들어가기</button>
    <p class="lsub">입장 코드는 생산관리팀에서 받습니다. 입력한 이름은 실적 기록에 남습니다.</p></form></div>`;
  try{ const n=localStorage.getItem('sdr.name'); if(n) el.querySelector('#lname').value=n; }catch(e){}
  el.querySelector('#lform').addEventListener('submit',async e=>{ e.preventDefault(); const code=el.querySelector('#lcode').value, name=el.querySelector('#lname').value.trim(), er=el.querySelector('#lerr');
    er.textContent=''; try{ const j=await SDR.login(code,name); try{ localStorage.setItem('sdr.name',name); }catch(_){} onDone(j); }catch(x){ er.textContent=x.message; } });
}

/* ---- '불러오는 중'에서 멈췄을 때: 원인과 해결 버튼을 화면에 보여 줌 ---- */
window.addEventListener('error',e=>{ SDR.lastErr=(e.message||'오류')+(e.filename?` (${e.filename.split('/').pop()}:${e.lineno})`:''); });
window.addEventListener('unhandledrejection',e=>{ SDR.lastErr=String((e.reason&&e.reason.message)||e.reason); });
async function sdrReset(logout){ try{ if(logout) localStorage.removeItem('sdr.tok'); }catch(_){}
  try{ for(const k of await caches.keys()) await caches.delete(k); }catch(_){}
  try{ for(const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); }catch(_){}
  try{ await fetch('config.js',{cache:'reload'}); await fetch('common.js',{cache:'reload'}); }catch(_){}
  location.reload(); }
setTimeout(()=>{ const main=document.querySelector('#main'), app=document.querySelector('#app');
  const stuck=(main&&/불러오는 중/.test(main.innerText)&&!document.querySelector('.login'))||(app&&!app.innerHTML.trim());
  if(!stuck||document.querySelector('.sdr-stuck')) return;
  const box=document.createElement('div'); box.className='sdr-stuck';
  box.style.cssText='position:fixed;left:50%;top:90px;transform:translateX(-50%);z-index:60;width:min(460px,calc(100vw - 32px));background:var(--panel,#fff);color:var(--ink,#1a2220);border:2px solid var(--warn,#a05f00);border-radius:12px;padding:16px;box-shadow:0 10px 32px rgba(0,0,0,.2);font-size:14px;line-height:1.5';
  const url=SDR.url&&!/여기에/.test(SDR.url);
  box.innerHTML=`<b style="font-size:16px">화면이 열리지 않고 있습니다</b><div style="margin:8px 0;color:var(--ink2,#56625e)">${!url?'config.js에 서버 주소가 없습니다(예전 파일일 수 있음). [다시 불러오기]를 눌러 주세요.':SDR.lastErr?'원인: '+esc(SDR.lastErr):'서버 응답을 기다리는 중입니다. 계속 이러면 아래 버튼을 눌러 주세요.'}</div>
   <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn pri" id="sdrR1">다시 불러오기</button><button type="button" class="btn" id="sdrR2">처음부터 다시 로그인</button></div>`;
  document.body.appendChild(box);
  box.querySelector('#sdrR1').onclick=()=>sdrReset(false); box.querySelector('#sdrR2').onclick=()=>sdrReset(true);
},15000);
