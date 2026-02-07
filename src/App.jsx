import { useState, useEffect, useRef, useCallback } from "react";

/* ══════════════════════════════════════════════════════════
   TRACKIMED — 16:9 Wall-Mount OR Dashboard v3
   Camera PTZ + Video, Mic Monitor, Cloud Recording
   ══════════════════════════════════════════════════════════ */

const DK = {
  n:"dark",bg:"#080b14",panel:"#0f1725",card:"#131d2f",card2:"#1a2540",
  border:"#1e2f4f",text:"#f0f4fa",soft:"#a0b0cc",muted:"#5e7498",faint:"#2c3e60",
  teal:"#00C9B7",green:"#22D67E",red:"#F5425A",amber:"#F5A623",
  orange:"#F78A3C",purple:"#9B7AEA",cyan:"#00D4EE",blue:"#3A8FFF",
  amberBg:"#F5A6230f",shadow:"rgba(0,0,0,.4)",
};
const LT = {
  n:"light",bg:"#eef1f6",panel:"#ffffff",card:"#ffffff",card2:"#f3f5fa",
  border:"#dde2ec",text:"#0f1a2e",soft:"#4a5e7c",muted:"#8a9ab8",faint:"#c8d2e2",
  teal:"#00B5A3",green:"#18A85C",red:"#E63950",amber:"#D99000",
  orange:"#D97020",purple:"#7E5CD8",cyan:"#00B8D0",blue:"#2E7CE6",
  amberBg:"#D990000c",shadow:"rgba(0,0,0,.05)",
};
const MO=`'JetBrains Mono','SF Mono',monospace`;
const SA=`'DM Sans',-apple-system,sans-serif`;

const STATES=[
  {id:0,l:"System Ready",s:"SYS",ck:"teal",g:false},{id:1,l:"OR Setup",s:"SETUP",ck:"purple",g:false},
  {id:2,l:"Initial Count",s:"I·CNT",ck:"amber",g:true},{id:3,l:"Patient In",s:"PT·IN",ck:"cyan",g:false},
  {id:4,l:"Anesthesia",s:"ANES",ck:"purple",g:false},{id:5,l:"Time Out",s:"T·OUT",ck:"amber",g:true},
  {id:6,l:"Procedure",s:"PROC",ck:"green",g:false},{id:7,l:"Pre-Close Count",s:"P·CNT",ck:"red",g:true},
  {id:8,l:"Count Resolution",s:"RSLV",ck:"red",g:true},{id:9,l:"Surgeon Decision",s:"DECIDE",ck:"orange",g:false},
  {id:10,l:"Closure",s:"CLOSE",ck:"purple",g:false},{id:11,l:"Final Count",s:"F·CNT",ck:"amber",g:true},
  {id:12,l:"Emergence",s:"EMRG",ck:"cyan",g:false},{id:13,l:"Patient Out",s:"PT·OUT",ck:"green",g:false},
  {id:14,l:"Turnover",s:"TURN",ck:"teal",g:false},
];

const ITEMS=[
  {id:"SPG-001",n:"Lap Sponge 18×18",cat:"sponge",init:10,f:8,d:2,z:"sterile"},
  {id:"SPG-002",n:"4×4 Gauze Pad",cat:"sponge",init:20,f:17,d:3,z:"back_table"},
  {id:"SPG-003",n:"Raytec Sponge",cat:"sponge",init:5,f:4,d:1,z:"sterile"},
  {id:"SPG-004",n:"Cottonoid Patty",cat:"sponge",init:8,f:7,d:1,z:"sterile"},
  {id:"SPG-005",n:"Tonsil Sponge",cat:"sponge",init:6,f:5,d:1,z:"back_table"},
  {id:"NDL-001",n:"Suture Needle CT-1",cat:"needle",init:4,f:4,d:0,z:"mayo"},
  {id:"NDL-002",n:"Suture Needle SH",cat:"needle",init:3,f:2,d:1,z:"mayo"},
  {id:"NDL-003",n:"Keith Needle",cat:"needle",init:2,f:2,d:0,z:"back_table"},
  {id:"NDL-004",n:"Tapered RB-1",cat:"needle",init:3,f:3,d:0,z:"mayo"},
  {id:"SHP-001",n:"Blade #10",cat:"sharp",init:2,f:1,d:1,z:"mayo"},
  {id:"SHP-002",n:"Blade #15",cat:"sharp",init:1,f:1,d:0,z:"mayo"},
  {id:"SHP-003",n:"Blade #11",cat:"sharp",init:1,f:1,d:0,z:"back_table"},
  {id:"SHP-004",n:"Trocar 5mm",cat:"sharp",init:3,f:3,d:0,z:"mayo"},
  {id:"INS-001",n:"Hemostat Kelly",cat:"instrument",init:4,f:4,d:0,z:"mayo"},
  {id:"INS-002",n:"Metzenbaum Scissors",cat:"instrument",init:2,f:2,d:0,z:"mayo"},
  {id:"INS-003",n:"Retractor Balfour",cat:"instrument",init:1,f:1,d:0,z:"sterile"},
  {id:"INS-004",n:"Forceps DeBakey",cat:"instrument",init:3,f:3,d:0,z:"mayo"},
  {id:"INS-005",n:"Towel Clip",cat:"instrument",init:6,f:6,d:0,z:"back_table"},
  {id:"INS-006",n:"Needle Holder",cat:"instrument",init:2,f:2,d:0,z:"mayo"},
  {id:"INS-007",n:"Allis Clamp",cat:"instrument",init:2,f:2,d:0,z:"back_table"},
  {id:"INS-008",n:"Babcock Forceps",cat:"instrument",init:2,f:2,d:0,z:"sterile"},
  {id:"INS-009",n:"Suction Yankauer",cat:"instrument",init:1,f:1,d:0,z:"mayo"},
  {id:"INS-010",n:"Bovie Tip",cat:"instrument",init:2,f:2,d:0,z:"mayo"},
  {id:"PAK-001",n:"Cavity Pack",cat:"pack",init:2,f:2,d:0,z:"sterile"},
  {id:"PAK-002",n:"Lap Pack (5ct)",cat:"pack",init:2,f:1,d:1,z:"sterile"},
];

const CATS=[
  {key:"sponge",label:"Sponges",icon:"◼",ck:"teal"},
  {key:"needle",label:"Needles",icon:"▲",ck:"purple"},
  {key:"sharp",label:"Sharps",icon:"◆",ck:"amber"},
  {key:"instrument",label:"Instruments",icon:"◎",ck:"cyan"},
  {key:"pack",label:"Packs",icon:"▣",ck:"green"},
];

const EVT=[
  {t:"08:42",s:0,e:"System operational — 4 cameras",tp:"info"},
  {t:"08:43",s:1,e:"OR Setup — 4 staff, 5 trays",tp:"info"},
  {t:"08:47",s:2,e:"Initial Count — 68 items",tp:"gate"},
  {t:"08:51",s:2,e:"Count BALANCED ✓",tp:"ok"},
  {t:"08:53",s:3,e:"Patient In",tp:"info"},
  {t:"08:55",s:4,e:"Anesthesia Induction",tp:"info"},
  {t:"08:58",s:5,e:"Time Out — 4/4 confirmed",tp:"gate"},
  {t:"08:59",s:6,e:"Incision — procedure start",tp:"info"},
  {t:"09:12",s:6,e:"Lap Sponge → waste",tp:"info"},
  {t:"09:18",s:6,e:"3× Gauze → waste",tp:"info"},
  {t:"09:25",s:6,e:"⚠ Raytec drop — floor",tp:"warn"},
  {t:"09:25",s:6,e:"Raytec located ✓",tp:"info"},
  {t:"09:42",s:6,e:"⚠ Mid-case tray added",tp:"warn"},
  {t:"09:55",s:6,e:"Needle SH → sharps",tp:"info"},
  {t:"10:05",s:6,e:"Blade #10 → sharps",tp:"info"},
];

// —— Primitives ——
const P=({children,color,T,filled,small})=><span style={{
  display:"inline-flex",alignItems:"center",padding:small?"2px 8px":"3px 12px",borderRadius:99,
  fontSize:small?10:13,fontWeight:700,letterSpacing:.5,fontFamily:MO,textTransform:"uppercase",
  background:filled?color:color+"16",color:filled?(T.n==="dark"?"#080b14":"#fff"):color,
  border:`1px solid ${color}28`,whiteSpace:"nowrap",lineHeight:1.7,
}}>{children}</span>;

const Cd=({children,style,T,glow})=><div style={{
  background:T.card,border:`1px solid ${T.border}`,borderRadius:14,
  boxShadow:glow||`0 1px 3px ${T.shadow}`,display:"flex",flexDirection:"column",...style,
}}>{children}</div>;

const D=({color="#00C9B7",size=7,pulse=true})=><span style={{
  display:"inline-block",width:size,height:size,borderRadius:"50%",background:color,
  boxShadow:`0 0 ${size+3}px ${color}`,animation:pulse?"bl 2s infinite":"none",
}}/>;

const L=({children,T})=><div style={{
  fontSize:13,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:2.5,marginBottom:10,flexShrink:0,
}}>{children}</div>;

/* —— INVENTORY SCREEN ———————————————————————————— */
function InvScreen({T}) {
  const [counting,setCounting]=useState(false);
  const [vf,setVf]=useState(0);
  const tot=ITEMS.length;
  useEffect(()=>{if(!counting)return;setVf(0);const t=setInterval(()=>setVf(p=>{if(p>=tot){clearInterval(t);return tot;}return p+1;}),180);return()=>clearInterval(t);},[counting,tot]);
  const cT=CATS.map(c=>{const it=ITEMS.filter(i=>i.cat===c.key);return{...c,init:it.reduce((s,i)=>s+i.init,0),fld:it.reduce((s,i)=>s+i.f,0),dsp:it.reduce((s,i)=>s+i.d,0)};});
  const tI=ITEMS.reduce((s,i)=>s+i.init,0),tF=ITEMS.reduce((s,i)=>s+i.f,0),tD=ITEMS.reduce((s,i)=>s+i.d,0);
  return (
    <div style={{display:"grid",gridTemplateColumns:"280px 1fr 290px",gap:14,height:"100%",minHeight:0}}>
      <div style={{display:"flex",flexDirection:"column",gap:12,minHeight:0}}>
        {counting?(<Cd T={T} style={{padding:16,textAlign:"center",borderColor:vf>=tot?T.green+"33":T.amber+"33",flexShrink:0}}><div style={{fontSize:14,fontFamily:MO,color:vf>=tot?T.green:T.amber,textTransform:"uppercase",letterSpacing:3}}>◆ {vf>=tot?"BALANCED":"COUNTING"}</div><div style={{fontSize:26,fontWeight:800,color:T.text,fontFamily:SA,marginTop:4}}>Pre-Closure Count</div><div style={{marginTop:12,background:T.card2,borderRadius:6,height:10,overflow:"hidden"}}><div style={{height:"100%",borderRadius:6,transition:"width .2s",width:`${(vf/tot)*100}%`,background:vf>=tot?T.green:`linear-gradient(90deg,${T.teal},${T.amber})`}}/></div><div style={{fontSize:16,fontFamily:MO,color:T.muted,marginTop:6}}>{vf}/{tot} verified</div></Cd>):(<div style={{flexShrink:0,padding:"2px 0"}}><div style={{fontSize:14,fontFamily:MO,color:T.teal,textTransform:"uppercase",letterSpacing:2}}>ORKing© Vision</div><div style={{fontSize:24,fontWeight:800,color:T.text,fontFamily:SA}}>Item Inventory</div></div>)}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,flexShrink:0}}>
          {[{l:"Baseline",v:tI,c:T.teal},{l:"In Field",v:tF,c:T.green},{l:"Disposed",v:tD,c:T.amber}].map((m,i)=>(<Cd key={i} T={T} style={{textAlign:"center",padding:"12px 4px"}}><div style={{fontSize:36,fontWeight:800,fontFamily:MO,color:m.c,lineHeight:1}}>{m.v}</div><div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,marginTop:6}}>{m.l}</div></Cd>))}
        </div>
        <Cd T={T} style={{flex:1,padding:14,minHeight:0,overflow:"hidden"}}>
          <L T={T}>Categories</L>
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>
            {cT.map(ct=>{const col=T[ct.ck];const acc=ct.fld+ct.dsp;return(<div key={ct.key} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:17,fontWeight:700,color:T.text,fontFamily:SA}}><span style={{color:col,marginRight:5}}>{ct.icon}</span>{ct.label}</span><div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:15,fontFamily:MO,color:T.soft}}>{acc}/{ct.init}</span><P color={acc===ct.init?T.green:T.red} T={T} small>{acc===ct.init?"✓":"!"}</P></div></div><div style={{background:T.card2,borderRadius:5,height:8,overflow:"hidden",display:"flex"}}><div style={{width:`${(ct.fld/ct.init)*100}%`,background:col}}/><div style={{width:`${(ct.dsp/ct.init)*100}%`,background:T.amber}}/></div></div>);})}
            <div style={{marginTop:12}}><L T={T}>Zones</L></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[{z:"Mayo",n:ITEMS.filter(i=>i.z==="mayo").reduce((a,i)=>a+i.f,0),c:T.purple},{z:"Sterile",n:ITEMS.filter(i=>i.z==="sterile").reduce((a,i)=>a+i.f,0),c:T.teal},{z:"Back Tbl",n:ITEMS.filter(i=>i.z==="back_table").reduce((a,i)=>a+i.f,0),c:T.blue},{z:"Waste",n:tD,c:T.amber}].map((z,i)=>(<div key={i} style={{textAlign:"center",padding:"12px 4px",borderRadius:12,background:z.c+"0a",border:`1px solid ${z.c}15`}}><div style={{fontSize:30,fontWeight:800,fontFamily:MO,color:z.c}}>{z.n}</div><div style={{fontSize:12,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginTop:4}}>{z.z}</div></div>))}
            </div>
          </div>
        </Cd>
        {!counting&&<button onClick={()=>setCounting(true)} style={{background:T.teal,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:18,fontWeight:700,cursor:"pointer",fontFamily:SA,boxShadow:`0 3px 14px ${T.teal}33`,flexShrink:0}}>◆ Start Count</button>}
        {counting&&vf>=tot&&<button onClick={()=>setCounting(false)} style={{background:T.green,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:18,fontWeight:700,cursor:"pointer",fontFamily:SA,flexShrink:0}}>✓ Balanced — {tF+tD}/{tI}</button>}
      </div>
      <Cd T={T} style={{padding:14,minHeight:0,overflow:"hidden"}}>
        <L T={T}>Item Detail — {ITEMS.length} Items</L>
        <div style={{flex:1,overflowY:"auto",minHeight:0}}>
          <div style={{display:"grid",gridTemplateColumns:"80px 1fr 50px 50px 50px 80px 70px",gap:6,padding:"8px 0",borderBottom:`2px solid ${T.border}`,marginBottom:4,position:"sticky",top:0,background:T.card,zIndex:1}}>{["ID","Item","Init","Fld","Dsp","Zone","Status"].map(h=><span key={h} style={{fontSize:13,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1}}>{h}</span>)}</div>
          {ITEMS.map((it,i)=>{const b=it.f+it.d===it.init;const iv=counting&&i<vf;return(<div key={it.id} style={{display:"grid",gridTemplateColumns:"80px 1fr 50px 50px 50px 80px 70px",gap:6,padding:"8px 0",alignItems:"center",borderBottom:`1px solid ${T.border}`,opacity:counting&&!iv?.2:1}}><span style={{fontSize:14,fontFamily:MO,color:T.muted}}>{it.id}</span><span style={{fontSize:17,color:T.text,fontFamily:SA,fontWeight:500}}>{it.n}</span><span style={{fontSize:17,fontFamily:MO,color:T.soft,textAlign:"center"}}>{it.init}</span><span style={{fontSize:17,fontFamily:MO,color:T.teal,textAlign:"center",fontWeight:600}}>{it.f}</span><span style={{fontSize:17,fontFamily:MO,color:it.d>0?T.amber:T.faint,textAlign:"center"}}>{it.d}</span><span style={{fontSize:14,fontFamily:MO,color:T.soft,textTransform:"capitalize"}}>{it.z.replace("_"," ")}</span><P color={counting?(iv?T.green:T.muted):(b?T.green:T.amber)} T={T} small>{counting?(iv?"OK":"—"):(b?"OK":"Chk")}</P></div>);})}
        </div>
      </Cd>
      <div style={{display:"flex",flexDirection:"column",gap:12,minHeight:0}}>
        <Cd T={T} style={{padding:12,flexShrink:0}}>
          <L T={T}>OR Zone Map</L>
          <div style={{background:T.n==="dark"?"#060a12":"#e6eaf2",borderRadius:10,height:180,position:"relative",overflow:"hidden",border:`1px solid ${T.border}`}}>
            <div style={{position:"absolute",top:"8%",left:"8%",width:"55%",height:"72%",border:`1.5px dashed ${T.teal}33`,borderRadius:8}}><span style={{position:"absolute",top:-9,left:6,fontSize:11,fontFamily:MO,color:T.teal,background:T.n==="dark"?"#060a12":"#e6eaf2",padding:"0 5px",letterSpacing:1.5}}>STERILE</span></div>
            {[{l:"MAYO",x:"12%",y:"14%",w:"16%",h:"18%",c:T.purple},{l:"TABLE",x:"18%",y:"38%",w:"30%",h:"34%",c:T.cyan},{l:"BACK",x:"52%",y:"12%",w:"15%",h:"52%",c:T.blue},{l:"WASTE",x:"76%",y:"52%",w:"20%",h:"32%",c:T.red}].map((z,i)=>(<div key={i} style={{position:"absolute",left:z.x,top:z.y,width:z.w,height:z.h,border:`1px solid ${z.c}22`,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,fontFamily:MO,color:z.c+"77",letterSpacing:1.5}}>{z.l}</span></div>))}
            {[{x:28,y:38,r:"SRG"},{x:42,y:38,r:"AST"},{x:22,y:65,r:"SCR"},{x:82,y:36,r:"CIR"}].map((s,i)=>(<div key={i} style={{position:"absolute",left:`${s.x}%`,top:`${s.y}%`,transform:"translate(-50%,-50%)",width:22,height:22,borderRadius:"50%",background:T.cyan+"18",border:`1px solid ${T.cyan}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontFamily:MO,color:T.cyan,fontWeight:800}}>{s.r}</div>))}
            <div style={{position:"absolute",top:6,right:8,display:"flex",alignItems:"center",gap:4}}><D color={T.red} size={5}/><span style={{fontSize:12,fontFamily:MO,color:T.red,fontWeight:700}}>LIVE</span></div>
          </div>
        </Cd>
        <Cd T={T} style={{flex:1,padding:12,minHeight:0,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexShrink:0}}><L T={T}>Event Feed</L><P color={T.green} T={T} small>Live</P></div>
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>
            {EVT.slice().reverse().map((e,i)=>{const c=e.tp==="gate"?T.amber:e.tp==="warn"?T.orange:e.tp==="ok"?T.green:T.teal;return(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"7px 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:14,fontFamily:MO,color:T.muted,minWidth:44,paddingTop:2}}>{e.t}</span><div style={{width:8,height:8,borderRadius:"50%",background:c,marginTop:6,flexShrink:0}}/><span style={{fontSize:16,color:T.text,fontFamily:SA,flex:1,lineHeight:1.35}}>{e.e}</span></div>);})}
          </div>
        </Cd>
      </div>
    </div>
  );
}

/* —— TIMELINE SCREEN ———————————————————————————— */
function TlScreen({T,as=6}) {
  const durs=[null,8.7,4.4,2.0,8.75,3.0,76.4,null,null,null,null,null,null,null,null];
  return(
    <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:14,height:"100%",minHeight:0}}>
      <Cd T={T} style={{padding:14,minHeight:0,overflow:"hidden"}}><L T={T}>State Progression</L><div style={{flex:1,overflowY:"auto",minHeight:0}}>{STATES.map((st,i)=>{const c=T[st.ck];const past=i<as;const active=i===as;return(<div key={st.id} style={{display:"flex",alignItems:"center",gap:12,padding:"7px 0",position:"relative"}}>{i<STATES.length-1&&<div style={{position:"absolute",left:14,top:32,width:2,height:"calc(100% - 10px)",background:past?T.teal+"44":T.border}}/>}<div style={{width:30,height:30,borderRadius:active?8:15,flexShrink:0,zIndex:1,background:active?c:past?T.teal+"18":T.card2,border:`2px solid ${active?c:past?T.teal+"55":T.border}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:active?`0 0 14px ${c}33`:"none"}}>{past&&<span style={{fontSize:14,color:T.teal}}>✓</span>}{active&&<D color="#fff" size={6} pulse/>}{st.g&&!past&&!active&&<span style={{fontSize:11,color:T.muted}}>◆</span>}</div><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16,fontWeight:active?800:past?600:400,color:active?T.text:past?T.soft:T.muted,fontFamily:SA}}>{st.l}</span>{st.g&&<P color={active?c:past?T.teal:T.muted} T={T} small>Gate</P>}</div></div><span style={{fontSize:14,fontFamily:MO,color:active?c:past?T.soft:T.faint}}>{active?"LIVE":past&&durs[i]?durs[i].toFixed(1)+"m":""}</span></div>);})}</div></Cd>
      <div style={{display:"flex",flexDirection:"column",gap:14,minHeight:0}}>
        {(()=>{const st=STATES[as];const c=T[st.ck];return(<Cd T={T} style={{padding:"18px 24px",borderColor:c+"33",position:"relative",overflow:"hidden",flexShrink:0}} glow={`inset 0 0 30px ${c}08`}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${T.teal},${c},transparent)`}}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}><D color={c} size={9}/><span style={{fontSize:14,fontFamily:MO,color:c,textTransform:"uppercase",letterSpacing:2.5}}>Active State</span></div><div style={{fontSize:32,fontWeight:800,color:T.text,fontFamily:SA}}>{st.l}</div><div style={{fontSize:16,color:T.soft,marginTop:3}}>State {st.id}/14 · {st.g?"◆ Safety Gate":"Standard Phase"}</div></div><div style={{display:"flex",gap:32}}>{[{v:"01:16:22",l:"Elapsed",c:T.teal},{v:"83",l:"Items",c:T.green},{v:"4",l:"Staff",c:T.cyan},{v:"1",l:"Alerts",c:T.amber}].map((m,i)=>(<div key={i} style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,fontFamily:MO,color:m.c}}>{m.v}</div><div style={{fontSize:12,fontFamily:MO,color:T.muted,letterSpacing:1,marginTop:4}}>{m.l}</div></div>))}</div></div></Cd>);})()}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,flex:1,minHeight:0}}>
          <Cd T={T} style={{padding:14,minHeight:0,overflow:"hidden"}}><L T={T}>Event Log</L><div style={{flex:1,overflowY:"auto",minHeight:0}}>{EVT.filter(e=>e.s<=as).reverse().map((e,i)=>{const c=e.tp==="gate"?T.amber:e.tp==="warn"?T.orange:e.tp==="ok"?T.green:T.teal;return(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:14,fontFamily:MO,color:T.muted,minWidth:44,paddingTop:2}}>{e.t}</span><div style={{width:7,height:7,borderRadius:"50%",background:c,marginTop:6,flexShrink:0}}/><span style={{fontSize:16,color:T.text,fontFamily:SA,flex:1,lineHeight:1.35}}>{e.e}</span></div>);})}</div></Cd>
          <Cd T={T} style={{padding:14,minHeight:0,overflow:"hidden"}}><L T={T}>Phase Durations</L><div style={{flex:1,overflowY:"auto",minHeight:0}}>{[{p:"OR Setup",d:12.5,b:15,c:T.purple},{p:"Initial Count",d:4.4,b:8,c:T.amber},{p:"Pre-Procedure",d:6.0,b:10,c:T.cyan},{p:"Procedure",d:76.4,b:90,c:T.teal},{p:"Pre-Close",d:3.5,b:8,c:T.amber},{p:"Closure",d:26.0,b:30,c:T.purple},{p:"Final Count",d:4.0,b:8,c:T.amber},{p:"Emrg→Out",d:13.0,b:15,c:T.cyan}].map((p,i)=>(<div key={i} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:16,color:T.text,fontFamily:SA}}>{p.p}</span><span style={{fontSize:15,fontFamily:MO,color:T.soft}}>{p.d.toFixed(1)}m</span></div><div style={{background:T.card2,borderRadius:5,height:12,overflow:"hidden",position:"relative"}}><div style={{height:"100%",borderRadius:5,width:`${Math.min((p.d/p.b)*100,100)}%`,background:`linear-gradient(90deg,${p.c}88,${p.c})`}}/><div style={{position:"absolute",top:0,bottom:0,left:"80%",width:2,background:T.muted+"33"}}/></div></div>))}</div></Cd>
        </div>
      </div>
    </div>
  );
}

/* —— TURNOVER SCREEN ———————————————————————————— */
function TnScreen({T}) {
  return(
    <div style={{display:"grid",gridTemplateColumns:"260px 1fr 260px",gap:14,height:"100%",minHeight:0}}>
      <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,flexShrink:0}}>{[{l:"Case Time",v:"2:22:49",c:T.text},{l:"OR Util.",v:"1:29:49",c:T.teal},{l:"Turnover",v:"18:30",c:T.blue},{l:"Gates",v:"5/5 ✓",c:T.green}].map((m,i)=>(<Cd key={i} T={T} style={{textAlign:"center",padding:12}}><div style={{fontSize:22,fontWeight:800,fontFamily:MO,color:m.c,lineHeight:1.1}}>{m.v}</div><div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginTop:5}}>{m.l}</div></Cd>))}</div>
        <Cd T={T} style={{padding:12,flexShrink:0}}><L T={T}>Item Tracking</L><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[{l:"Tracked",v:"83",c:T.teal},{l:"Disposed",v:"10",c:T.amber},{l:"Added",v:"+1",c:T.orange}].map((m,i)=>(<div key={i} style={{textAlign:"center",padding:"10px 4px",borderRadius:12,background:m.c+"0a",border:`1px solid ${m.c}15`}}><div style={{fontSize:28,fontWeight:800,fontFamily:MO,color:m.c}}>{m.v}</div><div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginTop:3}}>{m.l}</div></div>))}</div></Cd>
        <Cd T={T} style={{padding:12,flexShrink:0}}><L T={T}>Count Results</L>{[{n:"Initial Count",t:"08:47–08:51",d:"4:22"},{n:"Pre-Closure",t:"10:15–10:18",d:"3:30"},{n:"Final Count",t:"10:48–10:52",d:"4:00"}].map((c,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:i<2?`1px solid ${T.border}`:"none"}}><span style={{fontSize:18,color:T.green}}>✓</span><div style={{flex:1}}><div style={{fontSize:16,fontWeight:600,color:T.text,fontFamily:SA}}>{c.n}</div><div style={{fontSize:13,fontFamily:MO,color:T.muted}}>{c.t}</div></div><span style={{fontSize:15,fontFamily:MO,color:T.soft}}>{c.d}</span></div>))}</Cd>
        <Cd T={T} style={{flex:1,padding:12,minHeight:0,overflow:"hidden"}}><L T={T}>Efficiency</L><div style={{flex:1,overflowY:"auto",minHeight:0}}>{[{l:"Staff",v:"4"},{l:"Idle Periods",v:"2 (8:40)"},{l:"Pref Card",v:"94%"},{l:"Documentation",v:"Auto ✓"},{l:"Turn Target",v:"<25 min"},{l:"Actual Turn",v:"18:30 ✓"},{l:"Est. Savings",v:"$5,850"},{l:"Time Saved",v:"~42 min"}].map((m,i)=>(<div key={i} style={{padding:"6px 0",borderBottom:`1px solid ${T.border}`}}><div style={{fontSize:12,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:.5}}>{m.l}</div><div style={{fontSize:20,fontWeight:700,fontFamily:MO,color:T.text,marginTop:3}}>{m.v}</div></div>))}</div></Cd>
      </div>
      <Cd T={T} style={{padding:16,minHeight:0,overflow:"hidden"}}><L T={T}>Phase Duration Breakdown</L><div style={{flex:1,overflowY:"auto",minHeight:0}}>{[{p:"OR Setup",d:12.5,b:15,c:T.purple},{p:"Initial Count",d:4.4,b:8,c:T.amber},{p:"Pre-Procedure",d:13.75,b:18,c:T.cyan},{p:"Procedure",d:76.4,b:90,c:T.teal},{p:"Pre-Closure Count",d:3.5,b:8,c:T.amber},{p:"Surgeon Decision + Closure",d:28.0,b:35,c:T.purple},{p:"Final Count",d:4.0,b:8,c:T.amber},{p:"Emergence → Patient Out",d:13.0,b:15,c:T.cyan},{p:"Turnover",d:18.5,b:25,c:T.blue}].map((p,i)=>(<div key={i} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:17,color:T.text,fontFamily:SA,fontWeight:500}}>{p.p}</span><span style={{fontSize:16,fontFamily:MO,color:T.soft}}>{p.d.toFixed(1)} min</span></div><div style={{background:T.card2,borderRadius:6,height:14,overflow:"hidden",position:"relative"}}><div style={{height:"100%",borderRadius:6,width:`${Math.min((p.d/p.b)*100,100)}%`,background:`linear-gradient(90deg,${p.c}88,${p.c})`}}/><div style={{position:"absolute",top:0,bottom:0,left:"80%",width:2,background:T.muted+"33"}}/></div></div>))}</div></Cd>
      <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
        <Cd T={T} style={{padding:12,flexShrink:0}}><L T={T}>Alerts</L>{[{t:"09:25",a:"Item drop — Raytec Sponge",r:"Located on floor ✓"},{t:"09:42",a:"Mid-case tray addition",r:"Inventory re-baselined ✓"}].map((a,i)=>(<div key={i} style={{padding:12,marginBottom:8,borderRadius:12,background:T.amberBg,border:`1px solid ${T.amber}18`}}><div style={{display:"flex",gap:8,marginBottom:5}}><span style={{fontSize:13,fontFamily:MO,color:T.muted}}>{a.t}</span><P color={T.amber} T={T} small>Warn</P></div><div style={{fontSize:16,fontWeight:600,color:T.text,fontFamily:SA}}>{a.a}</div><div style={{fontSize:15,color:T.green,marginTop:5}}>{a.r}</div></div>))}</Cd>
        <Cd T={T} style={{flex:1,padding:12,minHeight:0,overflow:"hidden"}}><L T={T}>Category Breakdown</L><div style={{flex:1,overflowY:"auto",minHeight:0}}>{CATS.map(ct=>{const it=ITEMS.filter(i=>i.cat===ct.key);const ini=it.reduce((s,i)=>s+i.init,0);const fld=it.reduce((s,i)=>s+i.f,0);const dsp=it.reduce((s,i)=>s+i.d,0);const col=T[ct.ck];return(<div key={ct.key} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:16,fontWeight:600,color:T.text,fontFamily:SA}}><span style={{color:col,marginRight:5}}>{ct.icon}</span>{ct.label}</span><span style={{fontSize:15,fontFamily:MO,color:T.soft}}>{fld+dsp}/{ini}</span></div><div style={{background:T.card2,borderRadius:5,height:10,overflow:"hidden",display:"flex"}}><div style={{width:`${(fld/ini)*100}%`,background:col}}/><div style={{width:`${(dsp/ini)*100}%`,background:T.amber}}/></div></div>);})}</div></Cd>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SIMULATED VIDEO FEED (Animated Canvas)
   ══════════════════════════════════════════════════════════ */
function VideoFeed({T, cam, isViewing}) {
  const ref = useRef(null);
  const frame = useRef(0);
  const seed = useRef(cam.id * 137);

  useEffect(() => {
    if (!isViewing || !ref.current) return;
    const ctx = ref.current.getContext("2d");
    const w = ref.current.width, h = ref.current.height;
    let raf;
    const rng=(s)=>((Math.sin(s)*9301+49297)%233280)/233280;

    const draw = () => {
      frame.current++;
      const f = frame.current;
      const bg = T.n==="dark" ? "#080e1a" : "#d8dce6";
      ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);

      // Grid
      ctx.strokeStyle = T.teal+"08"; ctx.lineWidth=0.5;
      for(let i=0;i<24;i++){ctx.beginPath();ctx.moveTo(0,i*h/24);ctx.lineTo(w,i*h/24);ctx.stroke();}
      for(let i=0;i<32;i++){ctx.beginPath();ctx.moveTo(i*w/32,0);ctx.lineTo(i*w/32,h);ctx.stroke();}

      // Zone-specific content
      if(cam.zone==="Full OR"){
        ctx.fillStyle=T.cyan+"10";ctx.fillRect(w*0.15,h*0.25,w*0.5,h*0.45);
        ctx.strokeStyle=T.cyan+"33";ctx.lineWidth=1;ctx.strokeRect(w*0.15,h*0.25,w*0.5,h*0.45);
        ctx.setLineDash([5,4]);ctx.strokeStyle=T.teal+"22";ctx.strokeRect(w*0.05,h*0.08,w*0.7,h*0.78);ctx.setLineDash([]);
        [{x:.3,y:.42,l:"SRG"},{x:.48,y:.4,l:"AST"},{x:.22,y:.62,l:"SCR"},{x:.82,y:.35,l:"CIR"}].forEach((s,j)=>{
          const ox=Math.sin(f*0.018+j*2)*0.015,oy=Math.cos(f*0.013+j*1.7)*0.012;
          const sx=(s.x+ox)*w,sy=(s.y+oy)*h;
          ctx.beginPath();ctx.arc(sx,sy,10,0,Math.PI*2);ctx.fillStyle=T.cyan+"22";ctx.fill();
          ctx.strokeStyle=T.cyan+"55";ctx.lineWidth=1.5;ctx.stroke();
          ctx.fillStyle=T.cyan;ctx.font=`bold 8px ${MO}`;ctx.textAlign="center";ctx.fillText(s.l,sx,sy+3);
        });
        for(let j=0;j<15;j++){
          const ix=w*(0.2+rng(seed.current+j)*0.4),iy=h*(0.3+rng(seed.current+j+50)*0.35);
          ctx.beginPath();ctx.arc(ix,iy,3,0,Math.PI*2);
          ctx.fillStyle=[T.teal,T.purple,T.amber,T.green][j%4]+"88";ctx.fill();
        }
      } else if(cam.zone==="Sterile"){
        ctx.fillStyle=T.teal+"08";ctx.fillRect(w*0.05,h*0.05,w*0.9,h*0.9);
        ctx.strokeStyle=T.teal+"33";ctx.strokeRect(w*0.05,h*0.05,w*0.9,h*0.9);
        for(let j=0;j<20;j++){
          const ix=w*(0.1+rng(seed.current+j*3)*0.75),iy=h*(0.1+rng(seed.current+j*3+1)*0.75);
          const sz=3+rng(seed.current+j)*4;
          ctx.beginPath();ctx.arc(ix,iy,sz,0,Math.PI*2);
          ctx.fillStyle=[T.teal,T.cyan,T.purple][j%3]+"66";ctx.fill();
          ctx.strokeStyle=[T.teal,T.cyan,T.purple][j%3]+"33";ctx.stroke();
        }
        [{x:.35,y:.55},{x:.65,y:.5}].forEach((h2,j)=>{
          const ox=Math.sin(f*0.025+j*3)*0.02;
          ctx.beginPath();ctx.arc((h2.x+ox)*w,h2.y*h,14,0,Math.PI*2);
          ctx.fillStyle=T.blue+"15";ctx.fill();ctx.strokeStyle=T.blue+"33";ctx.stroke();
        });
      } else if(cam.zone==="Back Table"){
        for(let r=0;r<3;r++){
          const ty=h*(0.15+r*0.28);
          ctx.fillStyle=T.blue+"0c";ctx.fillRect(w*0.08,ty,w*0.84,h*0.22);
          ctx.strokeStyle=T.blue+"22";ctx.strokeRect(w*0.08,ty,w*0.84,h*0.22);
          ctx.fillStyle=T.muted;ctx.font=`9px ${MO}`;ctx.textAlign="left";
          ctx.fillText(`TRAY ${r+1}`,w*0.1,ty+14);
          for(let j=0;j<8;j++){
            const ix=w*(0.12+j*0.1),iy=ty+h*0.1+Math.sin(j)*4;
            ctx.beginPath();ctx.arc(ix,iy,3,0,Math.PI*2);
            ctx.fillStyle=[T.teal,T.purple,T.amber][j%3]+"77";ctx.fill();
          }
        }
      } else {
        ctx.fillStyle=T.red+"08";ctx.fillRect(w*0.1,h*0.3,w*0.35,h*0.5);
        ctx.strokeStyle=T.red+"22";ctx.strokeRect(w*0.1,h*0.3,w*0.35,h*0.5);
        ctx.fillStyle=T.muted;ctx.font=`10px ${MO}`;ctx.textAlign="center";ctx.fillText("WASTE BIN",w*0.275,h*0.55);
        ctx.fillStyle=T.amber+"08";ctx.fillRect(w*0.65,h*0.05,w*0.3,h*0.9);
        ctx.strokeStyle=T.amber+"22";ctx.strokeRect(w*0.65,h*0.05,w*0.3,h*0.9);
        ctx.fillStyle=T.muted;ctx.font=`10px ${MO}`;ctx.fillText("DOOR",w*0.8,h*0.5);
      }

      // Scan line
      const scanY=(f*1.5)%h;
      ctx.fillStyle=T.teal+"06";ctx.fillRect(0,scanY,w,4);

      // Noise
      for(let i=0;i<30;i++){
        const nx=Math.random()*w,ny=Math.random()*h;
        ctx.fillStyle=T.text+(Math.random()>.5?"03":"01");
        ctx.fillRect(nx,ny,2,2);
      }

      // Overlay bar
      ctx.fillStyle=T.n==="dark"?"#000000cc":"#ffffffcc";ctx.fillRect(0,h-24,w,24);
      ctx.fillStyle=T.red;ctx.beginPath();ctx.arc(14,h-12,4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=T.text;ctx.font=`bold 10px ${MO}`;ctx.textAlign="left";
      const ts=new Date();
      ctx.fillText(`CAM-${cam.id} · ${cam.name} · ${cam.zone} · ${ts.toLocaleTimeString()}`,26,h-7);
      ctx.textAlign="right";ctx.fillStyle=T.green;ctx.fillText(`${cam.fps}fps`,w-8,h-7);

      raf=requestAnimationFrame(draw);
    };
    draw();
    return()=>cancelAnimationFrame(raf);
  },[isViewing,T,cam]);

  if(!isViewing) return(
    <div style={{width:"100%",height:"100%",background:T.n==="dark"?"#060a12":"#dde2ec",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${T.border}`}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:6,opacity:.5}}>📷</div><div style={{fontSize:14,fontFamily:MO,color:T.muted}}>Click View to Preview</div></div>
    </div>
  );
  return <canvas ref={ref} width={420} height={240} style={{width:"100%",height:"100%",borderRadius:8,border:`1px solid ${T.teal}33`,display:"block"}}/>;
}

/* PTZ Controls */
function PTZControl({T,onMove,hasPTZ}) {
  if(!hasPTZ) return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,opacity:.4}}>
      <div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1.5}}>PTZ</div>
      <div style={{fontSize:12,fontFamily:MO,color:T.faint}}>Fixed Cam</div>
    </div>
  );
  const B=({label,dir})=>(
    <div onClick={()=>onMove?.(dir)} style={{width:34,height:34,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:T.card2,border:`1px solid ${T.border}`,fontSize:15,color:T.soft,userSelect:"none",transition:"background .1s"}}
      onMouseDown={e=>{e.currentTarget.style.background=T.teal+"33";e.currentTarget.style.borderColor=T.teal+"55";}}
      onMouseUp={e=>{e.currentTarget.style.background=T.card2;e.currentTarget.style.borderColor=T.border;}}
      onMouseLeave={e=>{e.currentTarget.style.background=T.card2;e.currentTarget.style.borderColor=T.border;}}>{label}</div>
  );
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
      <div style={{fontSize:10,fontFamily:MO,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:4,fontWeight:700}}>PTZ</div>
      <B label="▲" dir="tilt-up"/>
      <div style={{display:"flex",gap:2}}>
        <B label="◀" dir="pan-left"/>
        <div style={{width:34,height:34,borderRadius:8,background:T.teal+"15",border:`1px solid ${T.teal}33`,display:"flex",alignItems:"center",justifyContent:"center"}}><D color={T.teal} size={6} pulse={false}/></div>
        <B label="▶" dir="pan-right"/>
      </div>
      <B label="▼" dir="tilt-down"/>
      <div style={{display:"flex",gap:4,marginTop:6}}>
        <div onClick={()=>onMove?.("zoom-in")} style={{padding:"5px 14px",borderRadius:6,background:T.card2,border:`1px solid ${T.border}`,cursor:"pointer",fontSize:16,fontWeight:700,color:T.soft,fontFamily:MO,userSelect:"none"}}>+</div>
        <div onClick={()=>onMove?.("zoom-out")} style={{padding:"5px 14px",borderRadius:6,background:T.card2,border:`1px solid ${T.border}`,cursor:"pointer",fontSize:16,fontWeight:700,color:T.soft,fontFamily:MO,userSelect:"none"}}>−</div>
      </div>
      <div style={{fontSize:9,fontFamily:MO,color:T.faint,marginTop:4}}>3 presets saved</div>
    </div>
  );
}

/* Audio Level Meter - vertical bars */
function AudioMeter({T, active}) {
  const [levels,setLevels]=useState(Array(16).fill(8));
  useEffect(()=>{
    if(!active){setLevels(Array(16).fill(8));return;}
    const t=setInterval(()=>setLevels(Array(16).fill(0).map(()=>10+Math.random()*80)),100);
    return()=>clearInterval(t);
  },[active]);
  return(
    <div style={{display:"flex",gap:2,alignItems:"flex-end",height:50}}>
      {levels.map((lv,i)=>(
        <div key={i} style={{width:5,borderRadius:2,transition:"height .1s",
          height:`${Math.max(active?lv:8,5)}%`,
          background:lv>75?T.red:lv>45?T.amber:T.green,
          opacity:active?1:0.15,
        }}/>
      ))}
    </div>
  );
}

/* Toggle */
function Toggle({on,onClick,color,T}) {
  return(
    <div onClick={onClick} style={{width:44,height:22,borderRadius:11,cursor:"pointer",position:"relative",
      background:on?color+"33":T.card2,border:`1px solid ${on?color+"55":T.border}`,transition:"all .15s"}}>
      <div style={{width:18,height:18,borderRadius:9,position:"absolute",top:1,left:on?23:1,background:on?color:T.muted,transition:"all .15s",boxShadow:on?`0 0 6px ${color}55`:"none"}}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SETTINGS SCREEN
   ══════════════════════════════════════════════════════════ */
function SettingsScreen({T}) {
  const [viewCam,setViewCam]=useState(null);
  const [listenMic,setListenMic]=useState(null);
  const [recVideo,setRecVideo]=useState(true);
  const [recAudio,setRecAudio]=useState(true);
  const [ptzLog,setPtzLog]=useState([]);
  const [cloudSync,setCloudSync]=useState(96.8);

  useEffect(()=>{
    const t=setInterval(()=>setCloudSync(p=>Math.min(p+0.1+Math.random()*0.15,99.9)),2000);
    return()=>clearInterval(t);
  },[]);

  const handlePTZ=useCallback((dir)=>{
    setPtzLog(p=>[{t:new Date().toLocaleTimeString(),cam:viewCam,dir},...p].slice(0,8));
  },[viewCam]);

  const cams=[
    {id:1,name:"Ceiling Main",ip:"192.168.1.101",res:"4K UHD",fps:30,zone:"Full OR",status:"online",angle:"Wide 120°",ptz:true},
    {id:2,name:"Sterile Field",ip:"192.168.1.102",res:"4K UHD",fps:30,zone:"Sterile",status:"online",angle:"Focused 65°",ptz:true},
    {id:3,name:"Back Table",ip:"192.168.1.103",res:"1080p",fps:30,zone:"Back Table",status:"online",angle:"Wide 90°",ptz:false},
    {id:4,name:"Waste & Door",ip:"192.168.1.104",res:"1080p",fps:24,zone:"Waste",status:"online",angle:"Wide 110°",ptz:false},
  ];
  const mics=[
    {id:1,name:"Ceiling Array",mode:"Ambient + Voice",nc:true,gain:"Auto",freq:"48 kHz"},
    {id:2,name:"Surgeon Lapel",mode:"Directional Voice",nc:true,gain:"+6 dB",freq:"48 kHz"},
  ];
  const streams=[
    {id:"VID-1",src:"CAM-1",type:"video",size:"2.4 GB",bitrate:"8 Mbps",dur:"01:18:30",fmt:"H.265"},
    {id:"VID-2",src:"CAM-2",type:"video",size:"2.1 GB",bitrate:"8 Mbps",dur:"01:18:30",fmt:"H.265"},
    {id:"VID-3",src:"CAM-3",type:"video",size:"1.2 GB",bitrate:"4 Mbps",dur:"01:18:30",fmt:"H.265"},
    {id:"VID-4",src:"CAM-4",type:"video",size:"0.9 GB",bitrate:"3 Mbps",dur:"01:18:30",fmt:"H.265"},
    {id:"AUD-1",src:"MIC-1",type:"audio",size:"142 MB",bitrate:"256 kbps",dur:"01:18:30",fmt:"FLAC"},
    {id:"AUD-2",src:"MIC-2",type:"audio",size:"138 MB",bitrate:"256 kbps",dur:"01:18:30",fmt:"FLAC"},
  ];
  const totalGB=streams.reduce((s,st)=>{const n=parseFloat(st.size);return s+(st.size.includes("GB")?n:n/1000);},0);

  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 310px",gap:14,height:"100%",minHeight:0}}>

      {/* ——— LEFT: CAMERAS ——— */}
      <div style={{display:"flex",flexDirection:"column",gap:8,minHeight:0,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <L T={T}>📷 Camera Configuration</L>
          <P color={T.green} T={T} small>4/4 Online</P>
        </div>
        <div style={{flex:1,overflowY:"auto",minHeight:0}}>
          {cams.map(cam=>{
            const viewing=viewCam===cam.id;
            return(
              <div key={cam.id} style={{padding:12,marginBottom:10,borderRadius:14,background:T.card,border:`1px solid ${viewing?T.teal+"55":T.border}`,boxShadow:viewing?`0 0 20px ${T.teal}11`:`0 1px 3px ${T.shadow}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:viewing?10:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <D color={T.green} size={7}/>
                    <div>
                      <div style={{fontSize:16,fontWeight:700,color:T.text,fontFamily:SA}}>{cam.name}</div>
                      <div style={{fontSize:12,fontFamily:MO,color:T.muted}}>CAM-{cam.id} · {cam.ip} · {cam.res}@{cam.fps}fps · {cam.angle}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    {cam.ptz&&<P color={T.teal} T={T} small>PTZ</P>}
                    <div onClick={()=>setViewCam(viewing?null:cam.id)}
                      style={{padding:"7px 16px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:MO,
                        background:viewing?T.red+"18":T.teal+"12",color:viewing?T.red:T.teal,
                        border:`1px solid ${viewing?T.red+"44":T.teal+"33"}`,transition:"all .12s"}}>
                      {viewing?"■ Close":"▶ View"}
                    </div>
                  </div>
                </div>
                {viewing&&(
                  <div style={{display:"flex",gap:12}}>
                    <div style={{flex:1,height:200,position:"relative",borderRadius:8,overflow:"hidden"}}>
                      <VideoFeed T={T} cam={cam} isViewing={true}/>
                      <div style={{position:"absolute",top:6,left:6,display:"flex",gap:4}}>
                        <P color={T.red} T={T} small filled>● REC</P>
                        <P color={T.teal} T={T} small>{cam.zone}</P>
                      </div>
                    </div>
                    <PTZControl T={T} onMove={handlePTZ} hasPTZ={cam.ptz}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {ptzLog.length>0&&(
          <Cd T={T} style={{padding:10,flexShrink:0,maxHeight:110,overflow:"hidden"}}>
            <L T={T}>PTZ Log</L>
            <div style={{flex:1,overflowY:"auto",minHeight:0}}>
              {ptzLog.map((p,i)=>(
                <div key={i} style={{display:"flex",gap:8,padding:"2px 0",fontSize:13,fontFamily:MO}}>
                  <span style={{color:T.muted,minWidth:70}}>{p.t}</span>
                  <span style={{color:T.teal}}>CAM-{p.cam}</span>
                  <span style={{color:T.soft,fontWeight:600}}>{p.dir}</span>
                </div>
              ))}
            </div>
          </Cd>
        )}
      </div>

      {/* ——— CENTER: MICS + ALERTS ——— */}
      <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:0,overflow:"hidden"}}>
        <Cd T={T} style={{padding:14,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <L T={T}>🎙 Microphone Configuration</L>
            <P color={T.green} T={T} small>2/2 Online</P>
          </div>
          {mics.map(mic=>{
            const listening=listenMic===mic.id;
            return(
              <div key={mic.id} style={{padding:14,marginBottom:10,borderRadius:12,background:T.card2,border:`1px solid ${listening?T.purple+"55":T.border}`,boxShadow:listening?`0 0 16px ${T.purple}11`:"none"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <D color={T.green} size={7}/>
                    <div>
                      <div style={{fontSize:17,fontWeight:700,color:T.text,fontFamily:SA}}>{mic.name}</div>
                      <div style={{fontSize:12,fontFamily:MO,color:T.muted}}>MIC-{mic.id} · {mic.mode}</div>
                    </div>
                  </div>
                  <div onClick={()=>setListenMic(listening?null:mic.id)}
                    style={{padding:"7px 16px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:MO,
                      background:listening?T.red+"18":T.purple+"12",color:listening?T.red:T.purple,
                      border:`1px solid ${listening?T.red+"44":T.purple+"33"}`,transition:"all .12s"}}>
                    {listening?"■ Mute":"🎧 Listen"}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:16}}>
                  <AudioMeter T={T} active={listening}/>
                  <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                    {[{l:"NC",v:mic.nc?"ON":"OFF",c:mic.nc?T.green:T.faint},{l:"Gain",v:mic.gain,c:T.soft},{l:"Freq",v:mic.freq,c:T.soft},{l:"Peak",v:listening?"-12 dB":"— dB",c:listening?T.amber:T.faint}].map((f,i)=>(
                      <div key={i}><div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:.8}}>{f.l}</div><div style={{fontSize:14,fontWeight:600,fontFamily:MO,color:f.c,marginTop:2}}>{f.v}</div></div>
                    ))}
                  </div>
                </div>
                {listening&&(
                  <div style={{marginTop:10,padding:"8px 10px",borderRadius:8,background:T.purple+"08",border:`1px solid ${T.purple}18`,display:"flex",alignItems:"center",gap:8}}>
                    <D color={T.purple} size={6}/>
                    <span style={{fontSize:13,fontFamily:MO,color:T.purple}}>Monitoring live audio · Latency: 45ms</span>
                  </div>
                )}
              </div>
            );
          })}
        </Cd>

        <Cd T={T} style={{flex:1,padding:14,minHeight:0,overflow:"hidden"}}>
          <L T={T}>Alert Configuration</L>
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>
            {[
              {name:"Item Drop Detection",sev:"critical",en:true},{name:"Count Mismatch",sev:"critical",en:true},
              {name:"Staff Zone Breach",sev:"high",en:true},{name:"Time Out Incomplete",sev:"critical",en:true},
              {name:"Mid-Case Tray",sev:"medium",en:true},{name:"Camera Occlusion",sev:"medium",en:true},
              {name:"Idle Time Warning",sev:"low",en:false},{name:"Turnover Exceeded",sev:"low",en:true},
            ].map((al,i)=>{
              const sc=al.sev==="critical"?T.red:al.sev==="high"?T.orange:al.sev==="medium"?T.amber:T.muted;
              return(<div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`,opacity:al.en?1:.4}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:4,background:al.en?sc:T.faint}}/><span style={{fontSize:15,fontFamily:SA,color:T.text,fontWeight:500}}>{al.name}</span></div>
                <P color={sc} T={T} small filled={al.en}>{al.sev}</P>
              </div>);
            })}
          </div>
          <div style={{flexShrink:0,marginTop:8,padding:"10px 0 0",borderTop:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[{l:"AI Engine",v:"ORKing© v3.2"},{l:"CV Model",v:"YOLO-Surgical v8"},{l:"NLU",v:"Tracki© v2.1"}].map((s,i)=>(
              <div key={i}><div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:.8}}>{s.l}</div><div style={{fontSize:14,fontWeight:600,fontFamily:MO,color:T.teal,marginTop:2}}>{s.v}</div></div>
            ))}
          </div>
        </Cd>
      </div>

      {/* ——— RIGHT: CLOUD RECORDING ——— */}
      <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:0,overflow:"hidden"}}>
        <Cd T={T} style={{padding:14,flexShrink:0}}>
          <L T={T}>☁ Cloud Recording</L>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{width:40,height:40,borderRadius:10,background:T.green+"12",border:`1px solid ${T.green}28`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:20}}>☁</span></div>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:T.green,fontFamily:SA}}>Connected</div>
              <div style={{fontSize:12,fontFamily:MO,color:T.muted}}>AWS S3 · eu-west-1</div>
            </div>
          </div>
          <div style={{padding:10,borderRadius:10,background:T.card2,border:`1px solid ${T.border}`,marginBottom:12}}>
            <div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1}}>S3 Bucket</div>
            <div style={{fontSize:13,fontFamily:MO,color:T.teal,marginTop:3,wordBreak:"break-all"}}>s3://trackimed-or1-sheba/recordings/2026-02-07/</div>
          </div>
          <div style={{display:"flex",gap:12}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:14,fontFamily:SA,color:T.text}}>📹 Video Rec</span>
                <Toggle on={recVideo} onClick={()=>setRecVideo(r=>!r)} color={T.red} T={T}/>
              </div>
              <div style={{fontSize:11,fontFamily:MO,color:recVideo?T.red:T.faint}}>{recVideo?"4 streams active":"Paused"}</div>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:14,fontFamily:SA,color:T.text}}>🎙 Audio Rec</span>
                <Toggle on={recAudio} onClick={()=>setRecAudio(r=>!r)} color={T.red} T={T}/>
              </div>
              <div style={{fontSize:11,fontFamily:MO,color:recAudio?T.red:T.faint}}>{recAudio?"2 streams active":"Paused"}</div>
            </div>
          </div>
        </Cd>

        <Cd T={T} style={{flex:1,padding:14,minHeight:0,overflow:"hidden"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexShrink:0}}>
            <L T={T}>Active Streams</L>
            <P color={T.red} T={T} small filled>● {streams.length} REC</P>
          </div>
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>
            {streams.map(st=>(
              <div key={st.id} style={{padding:10,marginBottom:8,borderRadius:10,background:T.card2,border:`1px solid ${T.border}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:14}}>{st.type==="video"?"📹":"🎙"}</span>
                    <span style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:SA}}>{st.src}</span>
                    <P color={T.muted} T={T} small>{st.fmt}</P>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><D color={T.red} size={5}/><span style={{fontSize:11,fontFamily:MO,color:T.red}}>REC</span></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
                  {[{l:"Size",v:st.size},{l:"Rate",v:st.bitrate},{l:"Dur",v:st.dur}].map((f,i)=>(
                    <div key={i}><div style={{fontSize:9,fontFamily:MO,color:T.muted,textTransform:"uppercase"}}>{f.l}</div><div style={{fontSize:13,fontFamily:MO,color:T.soft,marginTop:1}}>{f.v}</div></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Cd>

        <Cd T={T} style={{padding:14,flexShrink:0}}>
          <L T={T}>Upload Status</L>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
            {[{l:"Total",v:`${totalGB.toFixed(1)} GB`,c:T.teal},{l:"Upload",v:"48 Mbps",c:T.green},{l:"Latency",v:"12ms",c:T.cyan}].map((m,i)=>(
              <div key={i} style={{textAlign:"center",padding:"8px 4px",borderRadius:10,background:T.card2,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:20,fontWeight:800,fontFamily:MO,color:m.c}}>{m.v}</div>
                <div style={{fontSize:9,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:.8,marginTop:3}}>{m.l}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,fontFamily:MO,color:T.muted}}>Cloud Sync</span>
            <span style={{fontSize:12,fontFamily:MO,color:T.green}}>{cloudSync.toFixed(1)}% ↑</span>
          </div>
          <div style={{background:T.card2,borderRadius:5,height:10,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:5,width:`${cloudSync}%`,background:`linear-gradient(90deg,${T.teal}88,${T.green})`,transition:"width .5s"}}/>
          </div>
          <div style={{fontSize:11,fontFamily:MO,color:T.muted,marginTop:5}}>{((1-cloudSync/100)*totalGB*1000).toFixed(0)} MB pending · ETA ~{Math.max(1,Math.round((1-cloudSync/100)*120))}s</div>
          <div style={{marginTop:8,padding:"8px 10px",borderRadius:8,background:T.green+"08",border:`1px solid ${T.green}18`,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:13}}>🔒</span>
            <span style={{fontSize:12,fontFamily:MO,color:T.green}}>AES-256 encrypted · TLS 1.3 in transit</span>
          </div>
        </Cd>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT
   ══════════════════════════════════════════════════════════ */
export default function App() {
  const [theme,setTheme]=useState("dark");
  const [screen,setScreen]=useState("inventory");
  const [sec,setSec]=useState(0);
  const T=theme==="dark"?DK:LT;
  const as=6;
  useEffect(()=>{const t=setInterval(()=>setSec(p=>p+1),1000);return()=>clearInterval(t);},[]);
  const fmt=s=>`${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const tabs=[{k:"inventory",l:"Inventory",i:"▦"},{k:"timeline",l:"Timeline",i:"◉"},{k:"turnover",l:"Analytics",i:"⚡"},{k:"settings",l:"Settings",i:"⚙"}];

  return (
    <div style={{width:"100vw",height:"100vh",background:T.bg,color:T.text,fontFamily:SA,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes bl{0%,100%{opacity:1}50%{opacity:.2}}
        *{box-sizing:border-box;scrollbar-width:thin;scrollbar-color:${T.border} transparent;}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:${T.border};border-radius:5px;}
        html,body,#root{margin:0;padding:0;overflow:hidden;background:${T.bg};width:100%;height:100%;}
        button:active{transform:scale(.97);}
      `}</style>

      <div style={{background:T.panel,borderBottom:`1px solid ${T.border}`,padding:"10px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${T.teal},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff",fontFamily:MO,boxShadow:`0 2px 10px ${T.teal}33`}}>T</div>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:T.text,letterSpacing:-.3}}>Tracki<span style={{color:T.teal}}>Med</span><span style={{fontSize:14,fontFamily:MO,color:T.muted,marginLeft:12}}>ORKing© Live</span></div>
            <div style={{fontSize:14,fontFamily:MO,color:T.muted,letterSpacing:.5}}>OR-1 · Case #2026-0207-003 · Lap Cholecystectomy</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {tabs.map(t=>(<div key={t.k} onClick={()=>setScreen(t.k)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:12,cursor:"pointer",background:screen===t.k?T.teal+"12":"transparent",border:`1px solid ${screen===t.k?T.teal+"28":"transparent"}`,transition:"all .12s"}}><span style={{fontSize:16}}>{t.i}</span><span style={{fontSize:15,fontFamily:MO,fontWeight:screen===t.k?700:500,color:screen===t.k?T.teal:T.muted,letterSpacing:.3}}>{t.l}</span></div>))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <P color={T.red} T={T} small filled>● REC</P>
          <P color={T[STATES[as].ck]} filled T={T}>{STATES[as].l}</P>
          <div style={{display:"flex",alignItems:"center",gap:8}}><D color={T.green} size={7}/><span style={{fontSize:22,fontFamily:MO,fontWeight:700,color:T.text,letterSpacing:1.5}}>{fmt(sec+4620)}</span></div>
          <div onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} style={{padding:"6px 12px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,background:T.card2,color:T.soft,border:`1px solid ${T.border}`,fontFamily:MO}}>{theme==="dark"?"☀":"◑"}</div>
        </div>
      </div>

      <div style={{flex:1,padding:14,overflow:"hidden",minHeight:0}}>
        {screen==="inventory"&&<InvScreen T={T}/>}
        {screen==="timeline"&&<TlScreen T={T} as={as}/>}
        {screen==="turnover"&&<TnScreen T={T}/>}
        {screen==="settings"&&<SettingsScreen T={T}/>}
      </div>
    </div>
  );
}
