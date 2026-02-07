import { useState, useEffect, useRef, useCallback } from "react";

/* ══════════════════════════════════════════════════════════
   TRACKIMED — 16:9 Wall-Mount OR Dashboard v4
   5 Tabs: Inventory, Timeline, Analytics, Settings, Archive
   ══════════════════════════════════════════════════════════ */

const DK={n:"dark",bg:"#080b14",panel:"#0f1725",card:"#131d2f",card2:"#1a2540",border:"#1e2f4f",text:"#f0f4fa",soft:"#a0b0cc",muted:"#5e7498",faint:"#2c3e60",teal:"#00C9B7",green:"#22D67E",red:"#F5425A",amber:"#F5A623",orange:"#F78A3C",purple:"#9B7AEA",cyan:"#00D4EE",blue:"#3A8FFF",amberBg:"#F5A6230f",shadow:"rgba(0,0,0,.4)"};
const LT={n:"light",bg:"#eef1f6",panel:"#ffffff",card:"#ffffff",card2:"#f3f5fa",border:"#dde2ec",text:"#0f1a2e",soft:"#4a5e7c",muted:"#8a9ab8",faint:"#c8d2e2",teal:"#00B5A3",green:"#18A85C",red:"#E63950",amber:"#D99000",orange:"#D97020",purple:"#7E5CD8",cyan:"#00B8D0",blue:"#2E7CE6",amberBg:"#D990000c",shadow:"rgba(0,0,0,.05)"};
const MO=`'JetBrains Mono','SF Mono',monospace`;
const SA=`'DM Sans',-apple-system,sans-serif`;

const STATES=[{id:0,l:"System Ready",s:"SYS",ck:"teal",g:false},{id:1,l:"OR Setup",s:"SETUP",ck:"purple",g:false},{id:2,l:"Initial Count",s:"I·CNT",ck:"amber",g:true},{id:3,l:"Patient In",s:"PT·IN",ck:"cyan",g:false},{id:4,l:"Anesthesia",s:"ANES",ck:"purple",g:false},{id:5,l:"Time Out",s:"T·OUT",ck:"amber",g:true},{id:6,l:"Procedure",s:"PROC",ck:"green",g:false},{id:7,l:"Pre-Close Count",s:"P·CNT",ck:"red",g:true},{id:8,l:"Count Resolution",s:"RSLV",ck:"red",g:true},{id:9,l:"Surgeon Decision",s:"DECIDE",ck:"orange",g:false},{id:10,l:"Closure",s:"CLOSE",ck:"purple",g:false},{id:11,l:"Final Count",s:"F·CNT",ck:"amber",g:true},{id:12,l:"Emergence",s:"EMRG",ck:"cyan",g:false},{id:13,l:"Patient Out",s:"PT·OUT",ck:"green",g:false},{id:14,l:"Turnover",s:"TURN",ck:"teal",g:false}];

const ITEMS=[{id:"SPG-001",n:"Lap Sponge 18×18",cat:"sponge",init:10,f:8,d:2,z:"sterile"},{id:"SPG-002",n:"4×4 Gauze Pad",cat:"sponge",init:20,f:17,d:3,z:"back_table"},{id:"SPG-003",n:"Raytec Sponge",cat:"sponge",init:5,f:4,d:1,z:"sterile"},{id:"SPG-004",n:"Cottonoid Patty",cat:"sponge",init:8,f:7,d:1,z:"sterile"},{id:"SPG-005",n:"Tonsil Sponge",cat:"sponge",init:6,f:5,d:1,z:"back_table"},{id:"NDL-001",n:"Suture Needle CT-1",cat:"needle",init:4,f:4,d:0,z:"mayo"},{id:"NDL-002",n:"Suture Needle SH",cat:"needle",init:3,f:2,d:1,z:"mayo"},{id:"NDL-003",n:"Keith Needle",cat:"needle",init:2,f:2,d:0,z:"back_table"},{id:"NDL-004",n:"Tapered RB-1",cat:"needle",init:3,f:3,d:0,z:"mayo"},{id:"SHP-001",n:"Blade #10",cat:"sharp",init:2,f:1,d:1,z:"mayo"},{id:"SHP-002",n:"Blade #15",cat:"sharp",init:1,f:1,d:0,z:"mayo"},{id:"SHP-003",n:"Blade #11",cat:"sharp",init:1,f:1,d:0,z:"back_table"},{id:"SHP-004",n:"Trocar 5mm",cat:"sharp",init:3,f:3,d:0,z:"mayo"},{id:"INS-001",n:"Hemostat Kelly",cat:"instrument",init:4,f:4,d:0,z:"mayo"},{id:"INS-002",n:"Metzenbaum Scissors",cat:"instrument",init:2,f:2,d:0,z:"mayo"},{id:"INS-003",n:"Retractor Balfour",cat:"instrument",init:1,f:1,d:0,z:"sterile"},{id:"INS-004",n:"Forceps DeBakey",cat:"instrument",init:3,f:3,d:0,z:"mayo"},{id:"INS-005",n:"Towel Clip",cat:"instrument",init:6,f:6,d:0,z:"back_table"},{id:"INS-006",n:"Needle Holder",cat:"instrument",init:2,f:2,d:0,z:"mayo"},{id:"INS-007",n:"Allis Clamp",cat:"instrument",init:2,f:2,d:0,z:"back_table"},{id:"INS-008",n:"Babcock Forceps",cat:"instrument",init:2,f:2,d:0,z:"sterile"},{id:"INS-009",n:"Suction Yankauer",cat:"instrument",init:1,f:1,d:0,z:"mayo"},{id:"INS-010",n:"Bovie Tip",cat:"instrument",init:2,f:2,d:0,z:"mayo"},{id:"PAK-001",n:"Cavity Pack",cat:"pack",init:2,f:2,d:0,z:"sterile"},{id:"PAK-002",n:"Lap Pack (5ct)",cat:"pack",init:2,f:1,d:1,z:"sterile"}];

const CATS=[{key:"sponge",label:"Sponges",icon:"◼",ck:"teal"},{key:"needle",label:"Needles",icon:"▲",ck:"purple"},{key:"sharp",label:"Sharps",icon:"◆",ck:"amber"},{key:"instrument",label:"Instruments",icon:"◎",ck:"cyan"},{key:"pack",label:"Packs",icon:"▣",ck:"green"}];

const EVT=[{t:"08:42",s:0,e:"System operational — 4 cameras",tp:"info"},{t:"08:43",s:1,e:"OR Setup — 4 staff, 5 trays",tp:"info"},{t:"08:47",s:2,e:"Initial Count — 68 items",tp:"gate"},{t:"08:51",s:2,e:"Count BALANCED ✓",tp:"ok"},{t:"08:53",s:3,e:"Patient In",tp:"info"},{t:"08:55",s:4,e:"Anesthesia Induction",tp:"info"},{t:"08:58",s:5,e:"Time Out — 4/4 confirmed",tp:"gate"},{t:"08:59",s:6,e:"Incision — procedure start",tp:"info"},{t:"09:12",s:6,e:"Lap Sponge → waste",tp:"info"},{t:"09:18",s:6,e:"3× Gauze → waste",tp:"info"},{t:"09:25",s:6,e:"⚠ Raytec drop — floor",tp:"warn"},{t:"09:25",s:6,e:"Raytec located ✓",tp:"info"},{t:"09:42",s:6,e:"⚠ Mid-case tray added",tp:"warn"},{t:"09:55",s:6,e:"Needle SH → sharps",tp:"info"},{t:"10:05",s:6,e:"Blade #10 → sharps",tp:"info"}];

// ── Primitives ──
const P=({children,color,T,filled,small})=><span style={{display:"inline-flex",alignItems:"center",padding:small?"2px 8px":"3px 12px",borderRadius:99,fontSize:small?10:13,fontWeight:700,letterSpacing:.5,fontFamily:MO,textTransform:"uppercase",background:filled?color:color+"16",color:filled?(T.n==="dark"?"#080b14":"#fff"):color,border:`1px solid ${color}28`,whiteSpace:"nowrap",lineHeight:1.7}}>{children}</span>;
const Cd=({children,style,T,glow})=><div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,boxShadow:glow||`0 1px 3px ${T.shadow}`,display:"flex",flexDirection:"column",...style}}>{children}</div>;
const Dot=({color="#00C9B7",size=7,pulse=true})=><span style={{display:"inline-block",width:size,height:size,borderRadius:"50%",background:color,boxShadow:`0 0 ${size+3}px ${color}`,animation:pulse?"bl 2s infinite":"none"}}/>;
const Lb=({children,T})=><div style={{fontSize:13,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:2.5,marginBottom:10,flexShrink:0}}>{children}</div>;
const Toggle=({on,onClick,color,T})=>(<div onClick={onClick} style={{width:44,height:22,borderRadius:11,cursor:"pointer",position:"relative",background:on?color+"33":T.card2,border:`1px solid ${on?color+"55":T.border}`,transition:"all .15s"}}><div style={{width:18,height:18,borderRadius:9,position:"absolute",top:1,left:on?23:1,background:on?color:T.muted,transition:"all .15s",boxShadow:on?`0 0 6px ${color}55`:"none"}}/></div>);

/* ══════════════════════════════════════════════════════════
   INVENTORY SCREEN
   ══════════════════════════════════════════════════════════ */
function InvScreen({T}) {
  const [counting,setCounting]=useState(false);const [vf,setVf]=useState(0);const tot=ITEMS.length;
  useEffect(()=>{if(!counting)return;setVf(0);const t=setInterval(()=>setVf(p=>{if(p>=tot){clearInterval(t);return tot;}return p+1;}),180);return()=>clearInterval(t);},[counting,tot]);
  const cT=CATS.map(c=>{const it=ITEMS.filter(i=>i.cat===c.key);return{...c,init:it.reduce((s,i)=>s+i.init,0),fld:it.reduce((s,i)=>s+i.f,0),dsp:it.reduce((s,i)=>s+i.d,0)};});
  const tI=ITEMS.reduce((s,i)=>s+i.init,0),tF=ITEMS.reduce((s,i)=>s+i.f,0),tD=ITEMS.reduce((s,i)=>s+i.d,0);
  return(
    <div style={{display:"grid",gridTemplateColumns:"280px 1fr 290px",gap:14,height:"100%",minHeight:0}}>
      <div style={{display:"flex",flexDirection:"column",gap:12,minHeight:0}}>
        {counting?(<Cd T={T} style={{padding:16,textAlign:"center",borderColor:vf>=tot?T.green+"33":T.amber+"33",flexShrink:0}}><div style={{fontSize:14,fontFamily:MO,color:vf>=tot?T.green:T.amber,textTransform:"uppercase",letterSpacing:3}}>◆ {vf>=tot?"BALANCED":"COUNTING"}</div><div style={{fontSize:26,fontWeight:800,color:T.text,fontFamily:SA,marginTop:4}}>Pre-Closure Count</div><div style={{marginTop:12,background:T.card2,borderRadius:6,height:10,overflow:"hidden"}}><div style={{height:"100%",borderRadius:6,transition:"width .2s",width:`${(vf/tot)*100}%`,background:vf>=tot?T.green:`linear-gradient(90deg,${T.teal},${T.amber})`}}/></div><div style={{fontSize:16,fontFamily:MO,color:T.muted,marginTop:6}}>{vf}/{tot}</div></Cd>):(<div style={{flexShrink:0}}><div style={{fontSize:14,fontFamily:MO,color:T.teal,textTransform:"uppercase",letterSpacing:2}}>ORKing© Vision</div><div style={{fontSize:24,fontWeight:800,color:T.text,fontFamily:SA}}>Item Inventory</div></div>)}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,flexShrink:0}}>{[{l:"Baseline",v:tI,c:T.teal},{l:"In Field",v:tF,c:T.green},{l:"Disposed",v:tD,c:T.amber}].map((m,i)=>(<Cd key={i} T={T} style={{textAlign:"center",padding:"12px 4px"}}><div style={{fontSize:36,fontWeight:800,fontFamily:MO,color:m.c,lineHeight:1}}>{m.v}</div><div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,marginTop:6}}>{m.l}</div></Cd>))}</div>
        <Cd T={T} style={{flex:1,padding:14,minHeight:0,overflow:"hidden"}}><Lb T={T}>Categories</Lb><div style={{flex:1,overflowY:"auto",minHeight:0}}>{cT.map(ct=>{const col=T[ct.ck];const acc=ct.fld+ct.dsp;return(<div key={ct.key} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:17,fontWeight:700,color:T.text,fontFamily:SA}}><span style={{color:col,marginRight:5}}>{ct.icon}</span>{ct.label}</span><span style={{fontSize:15,fontFamily:MO,color:T.soft}}>{acc}/{ct.init}</span></div><div style={{background:T.card2,borderRadius:5,height:8,overflow:"hidden",display:"flex"}}><div style={{width:`${(ct.fld/ct.init)*100}%`,background:col}}/><div style={{width:`${(ct.dsp/ct.init)*100}%`,background:T.amber}}/></div></div>);})}
          <div style={{marginTop:12}}><Lb T={T}>Zones</Lb></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[{z:"Mayo",n:ITEMS.filter(i=>i.z==="mayo").reduce((a,i)=>a+i.f,0),c:T.purple},{z:"Sterile",n:ITEMS.filter(i=>i.z==="sterile").reduce((a,i)=>a+i.f,0),c:T.teal},{z:"Back Tbl",n:ITEMS.filter(i=>i.z==="back_table").reduce((a,i)=>a+i.f,0),c:T.blue},{z:"Waste",n:tD,c:T.amber}].map((z,i)=>(<div key={i} style={{textAlign:"center",padding:"12px 4px",borderRadius:12,background:z.c+"0a",border:`1px solid ${z.c}15`}}><div style={{fontSize:30,fontWeight:800,fontFamily:MO,color:z.c}}>{z.n}</div><div style={{fontSize:12,fontFamily:MO,color:T.muted,textTransform:"uppercase",marginTop:4}}>{z.z}</div></div>))}</div></div></Cd>
        {!counting&&<button onClick={()=>setCounting(true)} style={{background:T.teal,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:18,fontWeight:700,cursor:"pointer",fontFamily:SA,flexShrink:0}}>◆ Start Count</button>}
        {counting&&vf>=tot&&<button onClick={()=>setCounting(false)} style={{background:T.green,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:18,fontWeight:700,cursor:"pointer",fontFamily:SA,flexShrink:0}}>✓ Balanced — {tF+tD}/{tI}</button>}
      </div>
      <Cd T={T} style={{padding:14,minHeight:0,overflow:"hidden"}}><Lb T={T}>Item Detail — {ITEMS.length} Items</Lb><div style={{flex:1,overflowY:"auto",minHeight:0}}><div style={{display:"grid",gridTemplateColumns:"80px 1fr 50px 50px 50px 80px 70px",gap:6,padding:"8px 0",borderBottom:`2px solid ${T.border}`,marginBottom:4,position:"sticky",top:0,background:T.card,zIndex:1}}>{["ID","Item","Init","Fld","Dsp","Zone","Status"].map(h=><span key={h} style={{fontSize:13,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1}}>{h}</span>)}</div>{ITEMS.map((it,i)=>{const b=it.f+it.d===it.init;const iv=counting&&i<vf;return(<div key={it.id} style={{display:"grid",gridTemplateColumns:"80px 1fr 50px 50px 50px 80px 70px",gap:6,padding:"8px 0",alignItems:"center",borderBottom:`1px solid ${T.border}`,opacity:counting&&!iv?.2:1}}><span style={{fontSize:14,fontFamily:MO,color:T.muted}}>{it.id}</span><span style={{fontSize:17,color:T.text,fontFamily:SA,fontWeight:500}}>{it.n}</span><span style={{fontSize:17,fontFamily:MO,color:T.soft,textAlign:"center"}}>{it.init}</span><span style={{fontSize:17,fontFamily:MO,color:T.teal,textAlign:"center",fontWeight:600}}>{it.f}</span><span style={{fontSize:17,fontFamily:MO,color:it.d>0?T.amber:T.faint,textAlign:"center"}}>{it.d}</span><span style={{fontSize:14,fontFamily:MO,color:T.soft,textTransform:"capitalize"}}>{it.z.replace("_"," ")}</span><P color={counting?(iv?T.green:T.muted):(b?T.green:T.amber)} T={T} small>{counting?(iv?"OK":"—"):(b?"OK":"Chk")}</P></div>);})}</div></Cd>
      <div style={{display:"flex",flexDirection:"column",gap:12,minHeight:0}}>
        <Cd T={T} style={{padding:12,flexShrink:0}}><Lb T={T}>OR Zone Map</Lb><div style={{background:T.n==="dark"?"#060a12":"#e6eaf2",borderRadius:10,height:180,position:"relative",overflow:"hidden",border:`1px solid ${T.border}`}}><div style={{position:"absolute",top:"8%",left:"8%",width:"55%",height:"72%",border:`1.5px dashed ${T.teal}33`,borderRadius:8}}><span style={{position:"absolute",top:-9,left:6,fontSize:11,fontFamily:MO,color:T.teal,background:T.n==="dark"?"#060a12":"#e6eaf2",padding:"0 5px"}}>STERILE</span></div>{[{l:"MAYO",x:"12%",y:"14%",w:"16%",h:"18%",c:T.purple},{l:"TABLE",x:"18%",y:"38%",w:"30%",h:"34%",c:T.cyan},{l:"BACK",x:"52%",y:"12%",w:"15%",h:"52%",c:T.blue},{l:"WASTE",x:"76%",y:"52%",w:"20%",h:"32%",c:T.red}].map((z,i)=>(<div key={i} style={{position:"absolute",left:z.x,top:z.y,width:z.w,height:z.h,border:`1px solid ${z.c}22`,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,fontFamily:MO,color:z.c+"77"}}>{z.l}</span></div>))}{[{x:28,y:38,r:"SRG"},{x:42,y:38,r:"AST"},{x:22,y:65,r:"SCR"},{x:82,y:36,r:"CIR"}].map((s,i)=>(<div key={i} style={{position:"absolute",left:`${s.x}%`,top:`${s.y}%`,transform:"translate(-50%,-50%)",width:22,height:22,borderRadius:"50%",background:T.cyan+"18",border:`1px solid ${T.cyan}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontFamily:MO,color:T.cyan,fontWeight:800}}>{s.r}</div>))}<div style={{position:"absolute",top:6,right:8,display:"flex",alignItems:"center",gap:4}}><Dot color={T.red} size={5}/><span style={{fontSize:12,fontFamily:MO,color:T.red,fontWeight:700}}>LIVE</span></div></div></Cd>
        <Cd T={T} style={{flex:1,padding:12,minHeight:0,overflow:"hidden"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexShrink:0}}><Lb T={T}>Event Feed</Lb><P color={T.green} T={T} small>Live</P></div><div style={{flex:1,overflowY:"auto",minHeight:0}}>{EVT.slice().reverse().map((e,i)=>{const c=e.tp==="gate"?T.amber:e.tp==="warn"?T.orange:e.tp==="ok"?T.green:T.teal;return(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"7px 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:14,fontFamily:MO,color:T.muted,minWidth:44,paddingTop:2}}>{e.t}</span><div style={{width:8,height:8,borderRadius:"50%",background:c,marginTop:6,flexShrink:0}}/><span style={{fontSize:16,color:T.text,fontFamily:SA,flex:1,lineHeight:1.35}}>{e.e}</span></div>);})}</div></Cd>
      </div>
    </div>
  );
}

/* ── TIMELINE SCREEN ───────────────────────────────── */
function TlScreen({T,as=6}) {
  const durs=[null,8.7,4.4,2.0,8.75,3.0,76.4,null,null,null,null,null,null,null,null];
  return(<div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:14,height:"100%",minHeight:0}}>
    <Cd T={T} style={{padding:14,minHeight:0,overflow:"hidden"}}><Lb T={T}>State Progression</Lb><div style={{flex:1,overflowY:"auto",minHeight:0}}>{STATES.map((st,i)=>{const c=T[st.ck];const past=i<as;const active=i===as;return(<div key={st.id} style={{display:"flex",alignItems:"center",gap:12,padding:"7px 0",position:"relative"}}>{i<STATES.length-1&&<div style={{position:"absolute",left:14,top:32,width:2,height:"calc(100% - 10px)",background:past?T.teal+"44":T.border}}/>}<div style={{width:30,height:30,borderRadius:active?8:15,flexShrink:0,zIndex:1,background:active?c:past?T.teal+"18":T.card2,border:`2px solid ${active?c:past?T.teal+"55":T.border}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:active?`0 0 14px ${c}33`:"none"}}>{past&&<span style={{fontSize:14,color:T.teal}}>✓</span>}{active&&<Dot color="#fff" size={6} pulse/>}{st.g&&!past&&!active&&<span style={{fontSize:11,color:T.muted}}>◆</span>}</div><div style={{flex:1}}><span style={{fontSize:16,fontWeight:active?800:past?600:400,color:active?T.text:past?T.soft:T.muted,fontFamily:SA}}>{st.l}</span>{st.g&&<span style={{marginLeft:6}}><P color={active?c:past?T.teal:T.muted} T={T} small>Gate</P></span>}</div><span style={{fontSize:14,fontFamily:MO,color:active?c:past?T.soft:T.faint}}>{active?"LIVE":past&&durs[i]?durs[i].toFixed(1)+"m":""}</span></div>);})}</div></Cd>
    <div style={{display:"flex",flexDirection:"column",gap:14,minHeight:0}}>
      {(()=>{const st=STATES[as];const c=T[st.ck];return(<Cd T={T} style={{padding:"18px 24px",borderColor:c+"33",position:"relative",overflow:"hidden",flexShrink:0}} glow={`inset 0 0 30px ${c}08`}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${T.teal},${c},transparent)`}}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}><Dot color={c} size={9}/><span style={{fontSize:14,fontFamily:MO,color:c,textTransform:"uppercase",letterSpacing:2.5}}>Active State</span></div><div style={{fontSize:32,fontWeight:800,color:T.text,fontFamily:SA}}>{st.l}</div><div style={{fontSize:16,color:T.soft,marginTop:3}}>State {st.id}/14 · {st.g?"◆ Safety Gate":"Standard Phase"}</div></div><div style={{display:"flex",gap:32}}>{[{v:"01:16:22",l:"Elapsed",c:T.teal},{v:"83",l:"Items",c:T.green},{v:"4",l:"Staff",c:T.cyan},{v:"1",l:"Alerts",c:T.amber}].map((m,i)=>(<div key={i} style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,fontFamily:MO,color:m.c}}>{m.v}</div><div style={{fontSize:12,fontFamily:MO,color:T.muted,marginTop:4}}>{m.l}</div></div>))}</div></div></Cd>);})()}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,flex:1,minHeight:0}}>
        <Cd T={T} style={{padding:14,minHeight:0,overflow:"hidden"}}><Lb T={T}>Event Log</Lb><div style={{flex:1,overflowY:"auto",minHeight:0}}>{EVT.filter(e=>e.s<=as).reverse().map((e,i)=>{const c=e.tp==="gate"?T.amber:e.tp==="warn"?T.orange:e.tp==="ok"?T.green:T.teal;return(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:14,fontFamily:MO,color:T.muted,minWidth:44}}>{e.t}</span><div style={{width:7,height:7,borderRadius:"50%",background:c,marginTop:6,flexShrink:0}}/><span style={{fontSize:16,color:T.text,fontFamily:SA,flex:1,lineHeight:1.35}}>{e.e}</span></div>);})}</div></Cd>
        <Cd T={T} style={{padding:14,minHeight:0,overflow:"hidden"}}><Lb T={T}>Phase Durations</Lb><div style={{flex:1,overflowY:"auto",minHeight:0}}>{[{p:"OR Setup",d:12.5,b:15,c:T.purple},{p:"Initial Count",d:4.4,b:8,c:T.amber},{p:"Pre-Procedure",d:6.0,b:10,c:T.cyan},{p:"Procedure",d:76.4,b:90,c:T.teal},{p:"Pre-Close",d:3.5,b:8,c:T.amber},{p:"Closure",d:26.0,b:30,c:T.purple},{p:"Final Count",d:4.0,b:8,c:T.amber},{p:"Emrg→Out",d:13.0,b:15,c:T.cyan}].map((p,i)=>(<div key={i} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:16,color:T.text,fontFamily:SA}}>{p.p}</span><span style={{fontSize:15,fontFamily:MO,color:T.soft}}>{p.d.toFixed(1)}m</span></div><div style={{background:T.card2,borderRadius:5,height:12,overflow:"hidden",position:"relative"}}><div style={{height:"100%",borderRadius:5,width:`${Math.min((p.d/p.b)*100,100)}%`,background:`linear-gradient(90deg,${p.c}88,${p.c})`}}/><div style={{position:"absolute",top:0,bottom:0,left:"80%",width:2,background:T.muted+"33"}}/></div></div>))}</div></Cd>
      </div>
    </div>
  </div>);
}

/* ── TURNOVER SCREEN ───────────────────────────────── */
function TnScreen({T}) {
  return(<div style={{display:"grid",gridTemplateColumns:"260px 1fr 260px",gap:14,height:"100%",minHeight:0}}>
    <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,flexShrink:0}}>{[{l:"Case Time",v:"2:22:49",c:T.text},{l:"OR Util.",v:"1:29:49",c:T.teal},{l:"Turnover",v:"18:30",c:T.blue},{l:"Gates",v:"5/5 ✓",c:T.green}].map((m,i)=>(<Cd key={i} T={T} style={{textAlign:"center",padding:12}}><div style={{fontSize:22,fontWeight:800,fontFamily:MO,color:m.c}}>{m.v}</div><div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",marginTop:5}}>{m.l}</div></Cd>))}</div>
      <Cd T={T} style={{padding:12,flexShrink:0}}><Lb T={T}>Item Tracking</Lb><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[{l:"Tracked",v:"83",c:T.teal},{l:"Disposed",v:"10",c:T.amber},{l:"Added",v:"+1",c:T.orange}].map((m,i)=>(<div key={i} style={{textAlign:"center",padding:"10px 4px",borderRadius:12,background:m.c+"0a"}}><div style={{fontSize:28,fontWeight:800,fontFamily:MO,color:m.c}}>{m.v}</div><div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase",marginTop:3}}>{m.l}</div></div>))}</div></Cd>
      <Cd T={T} style={{flex:1,padding:12,minHeight:0,overflow:"hidden"}}><Lb T={T}>Efficiency</Lb><div style={{flex:1,overflowY:"auto",minHeight:0}}>{[{l:"Staff",v:"4"},{l:"Pref Card",v:"94%"},{l:"Documentation",v:"Auto ✓"},{l:"Actual Turn",v:"18:30 ✓"},{l:"Est. Savings",v:"$5,850"},{l:"Time Saved",v:"~42 min"}].map((m,i)=>(<div key={i} style={{padding:"6px 0",borderBottom:`1px solid ${T.border}`}}><div style={{fontSize:12,fontFamily:MO,color:T.muted,textTransform:"uppercase"}}>{m.l}</div><div style={{fontSize:20,fontWeight:700,fontFamily:MO,color:T.text,marginTop:3}}>{m.v}</div></div>))}</div></Cd>
    </div>
    <Cd T={T} style={{padding:16,minHeight:0,overflow:"hidden"}}><Lb T={T}>Phase Duration Breakdown</Lb><div style={{flex:1,overflowY:"auto",minHeight:0}}>{[{p:"OR Setup",d:12.5,b:15,c:T.purple},{p:"Initial Count",d:4.4,b:8,c:T.amber},{p:"Pre-Procedure",d:13.75,b:18,c:T.cyan},{p:"Procedure",d:76.4,b:90,c:T.teal},{p:"Pre-Closure Count",d:3.5,b:8,c:T.amber},{p:"Closure",d:28.0,b:35,c:T.purple},{p:"Final Count",d:4.0,b:8,c:T.amber},{p:"Emergence → Out",d:13.0,b:15,c:T.cyan},{p:"Turnover",d:18.5,b:25,c:T.blue}].map((p,i)=>(<div key={i} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:17,color:T.text,fontFamily:SA}}>{p.p}</span><span style={{fontSize:16,fontFamily:MO,color:T.soft}}>{p.d.toFixed(1)} min</span></div><div style={{background:T.card2,borderRadius:6,height:14,overflow:"hidden",position:"relative"}}><div style={{height:"100%",borderRadius:6,width:`${Math.min((p.d/p.b)*100,100)}%`,background:`linear-gradient(90deg,${p.c}88,${p.c})`}}/><div style={{position:"absolute",top:0,bottom:0,left:"80%",width:2,background:T.muted+"33"}}/></div></div>))}</div></Cd>
    <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
      <Cd T={T} style={{padding:12,flexShrink:0}}><Lb T={T}>Alerts</Lb>{[{t:"09:25",a:"Item drop — Raytec",r:"Located ✓"},{t:"09:42",a:"Mid-case tray added",r:"Re-baselined ✓"}].map((a,i)=>(<div key={i} style={{padding:12,marginBottom:8,borderRadius:12,background:T.amberBg,border:`1px solid ${T.amber}18`}}><div style={{display:"flex",gap:8,marginBottom:5}}><span style={{fontSize:13,fontFamily:MO,color:T.muted}}>{a.t}</span><P color={T.amber} T={T} small>Warn</P></div><div style={{fontSize:16,fontWeight:600,color:T.text,fontFamily:SA}}>{a.a}</div><div style={{fontSize:15,color:T.green,marginTop:5}}>{a.r}</div></div>))}</Cd>
      <Cd T={T} style={{flex:1,padding:12,minHeight:0,overflow:"hidden"}}><Lb T={T}>Category Breakdown</Lb><div style={{flex:1,overflowY:"auto",minHeight:0}}>{CATS.map(ct=>{const it=ITEMS.filter(i=>i.cat===ct.key);const ini=it.reduce((s,i)=>s+i.init,0);const fld=it.reduce((s,i)=>s+i.f,0);const dsp=it.reduce((s,i)=>s+i.d,0);const col=T[ct.ck];return(<div key={ct.key} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:16,fontWeight:600,color:T.text,fontFamily:SA}}><span style={{color:col,marginRight:5}}>{ct.icon}</span>{ct.label}</span><span style={{fontSize:15,fontFamily:MO,color:T.soft}}>{fld+dsp}/{ini}</span></div><div style={{background:T.card2,borderRadius:5,height:10,overflow:"hidden",display:"flex"}}><div style={{width:`${(fld/ini)*100}%`,background:col}}/><div style={{width:`${(dsp/ini)*100}%`,background:T.amber}}/></div></div>);})}</div></Cd>
    </div>
  </div>);
}

/* ══════════════════════════════════════════════════════════
   SETTINGS SCREEN (Camera PTZ, Mic Listen, Cloud Rec)
   ══════════════════════════════════════════════════════════ */
function VideoFeed({T,cam,isViewing}){const ref=useRef(null);const frame=useRef(0);const seed=cam.id*137;
  useEffect(()=>{if(!isViewing||!ref.current)return;const ctx=ref.current.getContext("2d");const w=ref.current.width,h=ref.current.height;let raf;const rng=(s)=>((Math.sin(s)*9301+49297)%233280)/233280;
    const draw=()=>{frame.current++;const f=frame.current;ctx.fillStyle=T.n==="dark"?"#080e1a":"#d8dce6";ctx.fillRect(0,0,w,h);ctx.strokeStyle=T.teal+"08";ctx.lineWidth=0.5;for(let i=0;i<24;i++){ctx.beginPath();ctx.moveTo(0,i*h/24);ctx.lineTo(w,i*h/24);ctx.stroke();}for(let i=0;i<32;i++){ctx.beginPath();ctx.moveTo(i*w/32,0);ctx.lineTo(i*w/32,h);ctx.stroke();}
      if(cam.zone==="Full OR"){ctx.fillStyle=T.cyan+"10";ctx.fillRect(w*.15,h*.25,w*.5,h*.45);ctx.strokeStyle=T.cyan+"33";ctx.strokeRect(w*.15,h*.25,w*.5,h*.45);ctx.setLineDash([5,4]);ctx.strokeStyle=T.teal+"22";ctx.strokeRect(w*.05,h*.08,w*.7,h*.78);ctx.setLineDash([]);[{x:.3,y:.42,l:"SRG"},{x:.48,y:.4,l:"AST"},{x:.22,y:.62,l:"SCR"},{x:.82,y:.35,l:"CIR"}].forEach((s,j)=>{const ox=Math.sin(f*.018+j*2)*.015,oy=Math.cos(f*.013+j*1.7)*.012;const sx=(s.x+ox)*w,sy=(s.y+oy)*h;ctx.beginPath();ctx.arc(sx,sy,10,0,Math.PI*2);ctx.fillStyle=T.cyan+"22";ctx.fill();ctx.strokeStyle=T.cyan+"55";ctx.stroke();ctx.fillStyle=T.cyan;ctx.font=`bold 8px ${MO}`;ctx.textAlign="center";ctx.fillText(s.l,sx,sy+3);});}
      else if(cam.zone==="Sterile"){ctx.fillStyle=T.teal+"08";ctx.fillRect(w*.05,h*.05,w*.9,h*.9);for(let j=0;j<20;j++){const ix=w*(.1+rng(seed+j*3)*.75),iy=h*(.1+rng(seed+j*3+1)*.75);ctx.beginPath();ctx.arc(ix,iy,3+rng(seed+j)*4,0,Math.PI*2);ctx.fillStyle=[T.teal,T.cyan,T.purple][j%3]+"66";ctx.fill();}}
      else if(cam.zone==="Back Table"){for(let r=0;r<3;r++){const ty=h*(.15+r*.28);ctx.fillStyle=T.blue+"0c";ctx.fillRect(w*.08,ty,w*.84,h*.22);ctx.strokeStyle=T.blue+"22";ctx.strokeRect(w*.08,ty,w*.84,h*.22);for(let j=0;j<8;j++){ctx.beginPath();ctx.arc(w*(.12+j*.1),ty+h*.1,3,0,Math.PI*2);ctx.fillStyle=[T.teal,T.purple,T.amber][j%3]+"77";ctx.fill();}}}
      else{ctx.fillStyle=T.red+"08";ctx.fillRect(w*.1,h*.3,w*.35,h*.5);ctx.fillStyle=T.amber+"08";ctx.fillRect(w*.65,h*.05,w*.3,h*.9);}
      const scanY=(f*1.5)%h;ctx.fillStyle=T.teal+"06";ctx.fillRect(0,scanY,w,4);
      ctx.fillStyle=T.n==="dark"?"#000000cc":"#ffffffcc";ctx.fillRect(0,h-24,w,24);ctx.fillStyle=T.red;ctx.beginPath();ctx.arc(14,h-12,4,0,Math.PI*2);ctx.fill();ctx.fillStyle=T.text;ctx.font=`bold 10px ${MO}`;ctx.textAlign="left";ctx.fillText(`CAM-${cam.id} · ${cam.name} · ${new Date().toLocaleTimeString()}`,26,h-7);ctx.textAlign="right";ctx.fillStyle=T.green;ctx.fillText(`${cam.fps}fps`,w-8,h-7);
      raf=requestAnimationFrame(draw);};draw();return()=>cancelAnimationFrame(raf);},[isViewing,T,cam]);
  if(!isViewing)return(<div style={{width:"100%",height:"100%",background:T.n==="dark"?"#060a12":"#dde2ec",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${T.border}`}}><div style={{textAlign:"center"}}><div style={{fontSize:32,opacity:.5}}>📷</div><div style={{fontSize:14,fontFamily:MO,color:T.muted}}>Click View</div></div></div>);
  return <canvas ref={ref} width={420} height={240} style={{width:"100%",height:"100%",borderRadius:8,border:`1px solid ${T.teal}33`,display:"block"}}/>;
}

function PTZControl({T,onMove,hasPTZ}){if(!hasPTZ)return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",opacity:.4}}><div style={{fontSize:11,fontFamily:MO,color:T.muted}}>FIXED CAM</div></div>);
  const B=({label,dir})=>(<div onClick={()=>onMove?.(dir)} style={{width:34,height:34,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:T.card2,border:`1px solid ${T.border}`,fontSize:15,color:T.soft,userSelect:"none"}}>{label}</div>);
  return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><div style={{fontSize:10,fontFamily:MO,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:4,fontWeight:700}}>PTZ</div><B label="▲" dir="up"/><div style={{display:"flex",gap:2}}><B label="◀" dir="left"/><div style={{width:34,height:34,borderRadius:8,background:T.teal+"15",border:`1px solid ${T.teal}33`,display:"flex",alignItems:"center",justifyContent:"center"}}><Dot color={T.teal} size={6} pulse={false}/></div><B label="▶" dir="right"/></div><B label="▼" dir="down"/><div style={{display:"flex",gap:4,marginTop:6}}><div onClick={()=>onMove?.("zoom+")} style={{padding:"5px 14px",borderRadius:6,background:T.card2,border:`1px solid ${T.border}`,cursor:"pointer",fontSize:16,fontWeight:700,color:T.soft,fontFamily:MO}}>+</div><div onClick={()=>onMove?.("zoom-")} style={{padding:"5px 14px",borderRadius:6,background:T.card2,border:`1px solid ${T.border}`,cursor:"pointer",fontSize:16,fontWeight:700,color:T.soft,fontFamily:MO}}>−</div></div></div>);
}

function AudioMeter({T,active}){const [levels,setLevels]=useState(Array(16).fill(8));useEffect(()=>{if(!active){setLevels(Array(16).fill(8));return;}const t=setInterval(()=>setLevels(Array(16).fill(0).map(()=>10+Math.random()*80)),100);return()=>clearInterval(t);},[active]);
  return(<div style={{display:"flex",gap:2,alignItems:"flex-end",height:50}}>{levels.map((lv,i)=>(<div key={i} style={{width:5,borderRadius:2,transition:"height .1s",height:`${Math.max(active?lv:8,5)}%`,background:lv>75?T.red:lv>45?T.amber:T.green,opacity:active?1:.15}}/>))}</div>);
}

function SettingsScreen({T}){
  const [viewCam,setViewCam]=useState(null);const [listenMic,setListenMic]=useState(null);const [recV,setRecV]=useState(true);const [recA,setRecA]=useState(true);const [ptzLog,setPtzLog]=useState([]);const [sync,setSync]=useState(96.8);
  useEffect(()=>{const t=setInterval(()=>setSync(p=>Math.min(p+.1+Math.random()*.15,99.9)),2000);return()=>clearInterval(t);},[]);
  const handlePTZ=useCallback((dir)=>{setPtzLog(p=>[{t:new Date().toLocaleTimeString(),cam:viewCam,dir},...p].slice(0,8));},[viewCam]);
  const cams=[{id:1,name:"Ceiling Main",ip:"192.168.1.101",res:"4K",fps:30,zone:"Full OR",ptz:true},{id:2,name:"Sterile Field",ip:"192.168.1.102",res:"4K",fps:30,zone:"Sterile",ptz:true},{id:3,name:"Back Table",ip:"192.168.1.103",res:"1080p",fps:30,zone:"Back Table",ptz:false},{id:4,name:"Waste & Door",ip:"192.168.1.104",res:"1080p",fps:24,zone:"Waste",ptz:false}];
  const mics=[{id:1,name:"Ceiling Array",mode:"Ambient+Voice"},{id:2,name:"Surgeon Lapel",mode:"Directional"}];

  return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 310px",gap:14,height:"100%",minHeight:0}}>
    <div style={{display:"flex",flexDirection:"column",gap:8,minHeight:0,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}><Lb T={T}>📷 Cameras</Lb><P color={T.green} T={T} small>4/4</P></div>
      <div style={{flex:1,overflowY:"auto",minHeight:0}}>{cams.map(cam=>{const v=viewCam===cam.id;return(<div key={cam.id} style={{padding:12,marginBottom:10,borderRadius:14,background:T.card,border:`1px solid ${v?T.teal+"55":T.border}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:v?10:0}}><div style={{display:"flex",alignItems:"center",gap:10}}><Dot color={T.green} size={7}/><div><div style={{fontSize:16,fontWeight:700,color:T.text,fontFamily:SA}}>{cam.name}</div><div style={{fontSize:12,fontFamily:MO,color:T.muted}}>CAM-{cam.id} · {cam.ip} · {cam.res}@{cam.fps}fps</div></div></div>
          <div style={{display:"flex",gap:6}}>{cam.ptz&&<P color={T.teal} T={T} small>PTZ</P>}<div onClick={()=>setViewCam(v?null:cam.id)} style={{padding:"7px 16px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:MO,background:v?T.red+"18":T.teal+"12",color:v?T.red:T.teal,border:`1px solid ${v?T.red+"44":T.teal+"33"}`}}>{v?"■ Close":"▶ View"}</div></div></div>
        {v&&<div style={{display:"flex",gap:12}}><div style={{flex:1,height:200,borderRadius:8,overflow:"hidden"}}><VideoFeed T={T} cam={cam} isViewing={true}/></div><PTZControl T={T} onMove={handlePTZ} hasPTZ={cam.ptz}/></div>}
      </div>);})}</div>
      {ptzLog.length>0&&<Cd T={T} style={{padding:10,flexShrink:0,maxHeight:100,overflow:"hidden"}}><Lb T={T}>PTZ Log</Lb><div style={{flex:1,overflowY:"auto",minHeight:0}}>{ptzLog.map((p,i)=>(<div key={i} style={{display:"flex",gap:8,padding:"2px 0",fontSize:13,fontFamily:MO}}><span style={{color:T.muted}}>{p.t}</span><span style={{color:T.teal}}>CAM-{p.cam}</span><span style={{color:T.soft,fontWeight:600}}>{p.dir}</span></div>))}</div></Cd>}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:0,overflow:"hidden"}}>
      <Cd T={T} style={{padding:14,flexShrink:0}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><Lb T={T}>🎙 Microphones</Lb><P color={T.green} T={T} small>2/2</P></div>
        {mics.map(mic=>{const li=listenMic===mic.id;return(<div key={mic.id} style={{padding:14,marginBottom:10,borderRadius:12,background:T.card2,border:`1px solid ${li?T.purple+"55":T.border}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:10}}><Dot color={T.green} size={7}/><div><div style={{fontSize:17,fontWeight:700,color:T.text,fontFamily:SA}}>{mic.name}</div><div style={{fontSize:12,fontFamily:MO,color:T.muted}}>MIC-{mic.id} · {mic.mode}</div></div></div>
            <div onClick={()=>setListenMic(li?null:mic.id)} style={{padding:"7px 16px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:MO,background:li?T.red+"18":T.purple+"12",color:li?T.red:T.purple,border:`1px solid ${li?T.red+"44":T.purple+"33"}`}}>{li?"■ Mute":"🎧 Listen"}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:16}}><AudioMeter T={T} active={li}/><div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[{l:"NC",v:"ON",c:T.green},{l:"Gain",v:"Auto",c:T.soft},{l:"Peak",v:li?"-12 dB":"—",c:li?T.amber:T.faint}].map((f,i)=>(<div key={i}><div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase"}}>{f.l}</div><div style={{fontSize:14,fontWeight:600,fontFamily:MO,color:f.c,marginTop:2}}>{f.v}</div></div>))}</div></div>
          {li&&<div style={{marginTop:10,padding:"8px 10px",borderRadius:8,background:T.purple+"08",border:`1px solid ${T.purple}18`,display:"flex",alignItems:"center",gap:8}}><Dot color={T.purple} size={6}/><span style={{fontSize:13,fontFamily:MO,color:T.purple}}>Monitoring · 45ms latency</span></div>}
        </div>);})}
      </Cd>
      <Cd T={T} style={{flex:1,padding:14,minHeight:0,overflow:"hidden"}}><Lb T={T}>Alerts</Lb><div style={{flex:1,overflowY:"auto",minHeight:0}}>{[{name:"Item Drop Detection",sev:"critical",en:true},{name:"Count Mismatch",sev:"critical",en:true},{name:"Staff Zone Breach",sev:"high",en:true},{name:"Time Out Incomplete",sev:"critical",en:true},{name:"Mid-Case Tray",sev:"medium",en:true},{name:"Camera Occlusion",sev:"medium",en:true},{name:"Idle Warning",sev:"low",en:false},{name:"Turnover Exceeded",sev:"low",en:true}].map((al,i)=>{const sc=al.sev==="critical"?T.red:al.sev==="high"?T.orange:al.sev==="medium"?T.amber:T.muted;return(<div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`,opacity:al.en?1:.4}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:4,background:al.en?sc:T.faint}}/><span style={{fontSize:15,fontFamily:SA,color:T.text}}>{al.name}</span></div><P color={sc} T={T} small filled={al.en}>{al.sev}</P></div>);})}</div>
        <div style={{flexShrink:0,marginTop:8,paddingTop:10,borderTop:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[{l:"AI",v:"ORKing© v3.2"},{l:"CV",v:"YOLO-Surg v8"},{l:"NLU",v:"Tracki© v2.1"}].map((s,i)=>(<div key={i}><div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase"}}>{s.l}</div><div style={{fontSize:14,fontWeight:600,fontFamily:MO,color:T.teal,marginTop:2}}>{s.v}</div></div>))}</div>
      </Cd>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:0,overflow:"hidden"}}>
      <Cd T={T} style={{padding:14,flexShrink:0}}><Lb T={T}>☁ Cloud Recording</Lb><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><div style={{width:40,height:40,borderRadius:10,background:T.green+"12",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:20}}>☁</span></div><div><div style={{fontSize:16,fontWeight:700,color:T.green}}>Connected</div><div style={{fontSize:12,fontFamily:MO,color:T.muted}}>AWS S3 · eu-west-1</div></div></div>
        <div style={{padding:10,borderRadius:10,background:T.card2,border:`1px solid ${T.border}`,marginBottom:12}}><div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase"}}>Bucket</div><div style={{fontSize:13,fontFamily:MO,color:T.teal,marginTop:3,wordBreak:"break-all"}}>s3://trackimed-or1-sheba/</div></div>
        <div style={{display:"flex",gap:12}}><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:14,fontFamily:SA,color:T.text}}>📹 Video</span><Toggle on={recV} onClick={()=>setRecV(r=>!r)} color={T.red} T={T}/></div></div><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:14,fontFamily:SA,color:T.text}}>🎙 Audio</span><Toggle on={recA} onClick={()=>setRecA(r=>!r)} color={T.red} T={T}/></div></div></div>
      </Cd>
      <Cd T={T} style={{flex:1,padding:14,minHeight:0,overflow:"hidden"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10,flexShrink:0}}><Lb T={T}>Streams</Lb><P color={T.red} T={T} small filled>● 6 REC</P></div>
        <div style={{flex:1,overflowY:"auto",minHeight:0}}>{[{s:"CAM-1",t:"video",sz:"2.4 GB",br:"8 Mbps"},{s:"CAM-2",t:"video",sz:"2.1 GB",br:"8 Mbps"},{s:"CAM-3",t:"video",sz:"1.2 GB",br:"4 Mbps"},{s:"CAM-4",t:"video",sz:"0.9 GB",br:"3 Mbps"},{s:"MIC-1",t:"audio",sz:"142 MB",br:"256k"},{s:"MIC-2",t:"audio",sz:"138 MB",br:"256k"}].map((st,i)=>(<div key={i} style={{padding:8,marginBottom:6,borderRadius:10,background:T.card2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:13}}>{st.t==="video"?"📹":"🎙"}</span><span style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:SA}}>{st.s}</span></div><div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:12,fontFamily:MO,color:T.soft}}>{st.sz}</span><span style={{fontSize:12,fontFamily:MO,color:T.muted}}>{st.br}</span><Dot color={T.red} size={5}/></div></div>))}</div>
      </Cd>
      <Cd T={T} style={{padding:14,flexShrink:0}}><Lb T={T}>Upload</Lb><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>{[{l:"Total",v:"6.9 GB",c:T.teal},{l:"Rate",v:"48 Mbps",c:T.green},{l:"Latency",v:"12ms",c:T.cyan}].map((m,i)=>(<div key={i} style={{textAlign:"center",padding:"6px 4px",borderRadius:10,background:T.card2}}><div style={{fontSize:18,fontWeight:800,fontFamily:MO,color:m.c}}>{m.v}</div><div style={{fontSize:9,fontFamily:MO,color:T.muted,textTransform:"uppercase",marginTop:2}}>{m.l}</div></div>))}</div>
        <div style={{background:T.card2,borderRadius:5,height:8,overflow:"hidden"}}><div style={{height:"100%",borderRadius:5,width:`${sync}%`,background:`linear-gradient(90deg,${T.teal}88,${T.green})`,transition:"width .5s"}}/></div>
        <div style={{fontSize:11,fontFamily:MO,color:T.muted,marginTop:4}}>{sync.toFixed(1)}% synced · 🔒 AES-256 + TLS 1.3</div>
      </Cd>
    </div>
  </div>);
}

/* ══════════════════════════════════════════════════════════
   ARCHIVE SCREEN — Completed Operations Browser
   ══════════════════════════════════════════════════════════ */

const ARCHIVE_OPS = [
  {id:"2026-0207-002",date:"2026-02-07",time:"05:30",proc:"Right Hemicolectomy",surgeon:"Dr. Y. Shapira",team:["Dr. A. Levi","N. Cohen RN","S. Mizrahi ST"],patient:"M/67",or:"OR-1",duration:"3:14:22",items:72,alerts:1,counts:3,countResults:["Balanced","Balanced","Balanced"],outcome:"complete",
    stateLog:[{s:0,t:"05:30:00",dur:null},{s:1,t:"05:30:45",dur:"8:15"},{s:2,t:"05:39:00",dur:"5:22",count:{base:72,field:72,disp:0,status:"Balanced"}},{s:3,t:"05:44:22",dur:"2:10"},{s:4,t:"05:46:32",dur:"9:45"},{s:5,t:"05:56:17",dur:"2:50",verbal:"4/4 ✓"},{s:6,t:"05:59:07",dur:"96:30"},{s:7,t:"07:35:37",dur:"4:15",count:{base:72,field:58,disp:14,status:"Balanced"}},{s:8,t:"07:39:52",dur:"0:00"},{s:9,t:"07:39:52",dur:"1:20"},{s:10,t:"07:41:12",dur:"28:40"},{s:11,t:"08:09:52",dur:"3:50",count:{base:72,field:55,disp:17,status:"Balanced"}},{s:12,t:"08:13:42",dur:"12:10"},{s:13,t:"08:25:52",dur:"2:30"},{s:14,t:"08:28:22",dur:"16:00"}],
    events:[{t:"05:30:00",e:"System boot — 4 cams OK",tp:"info"},{t:"05:39:00",e:"Initial Count: 72 items baselined",tp:"gate"},{t:"05:44:22",e:"Count BALANCED ✓",tp:"ok"},{t:"05:56:17",e:"Time Out: 4/4 verbal confirms",tp:"gate"},{t:"06:22:10",e:"⚠ Lap sponge drop detected — floor zone",tp:"warn"},{t:"06:22:18",e:"Sponge located and recovered ✓",tp:"ok"},{t:"07:35:37",e:"Pre-Closure Count: 72 = 58 field + 14 disposed",tp:"gate"},{t:"07:36:00",e:"Count BALANCED ✓",tp:"ok"},{t:"08:09:52",e:"Final Count: 72 = 55 field + 17 disposed",tp:"gate"},{t:"08:10:12",e:"Count BALANCED ✓",tp:"ok"},{t:"08:25:52",e:"Patient out — case complete",tp:"info"}],
    recordings:[{src:"CAM-1",dur:"2:58:22",size:"5.8 GB",fmt:"H.265"},{src:"CAM-2",dur:"2:58:22",size:"5.1 GB",fmt:"H.265"},{src:"CAM-3",dur:"2:58:22",size:"2.9 GB",fmt:"H.265"},{src:"CAM-4",dur:"2:58:22",size:"2.2 GB",fmt:"H.265"},{src:"MIC-1",dur:"2:58:22",size:"310 MB",fmt:"FLAC"},{src:"MIC-2",dur:"2:58:22",size:"298 MB",fmt:"FLAC"}]},
  {id:"2026-0207-001",date:"2026-02-07",time:"02:15",proc:"Appendectomy (Laparoscopic)",surgeon:"Dr. R. Ben-David",team:["Dr. T. Katz","L. Amar RN","D. Peretz ST"],patient:"F/34",or:"OR-1",duration:"1:42:10",items:48,alerts:0,counts:3,countResults:["Balanced","Balanced","Balanced"],outcome:"complete",
    stateLog:[{s:0,t:"02:15:00",dur:null},{s:1,t:"02:15:30",dur:"6:00"},{s:2,t:"02:21:30",dur:"3:45",count:{base:48,field:48,disp:0,status:"Balanced"}},{s:3,t:"02:25:15",dur:"1:50"},{s:4,t:"02:27:05",dur:"7:20"},{s:5,t:"02:34:25",dur:"2:15",verbal:"4/4 ✓"},{s:6,t:"02:36:40",dur:"48:10"},{s:7,t:"03:24:50",dur:"3:00",count:{base:48,field:39,disp:9,status:"Balanced"}},{s:8,t:"03:27:50",dur:"0:00"},{s:9,t:"03:27:50",dur:"0:45"},{s:10,t:"03:28:35",dur:"18:20"},{s:11,t:"03:46:55",dur:"3:15",count:{base:48,field:37,disp:11,status:"Balanced"}},{s:12,t:"03:50:10",dur:"5:00"},{s:13,t:"03:55:10",dur:"2:00"},{s:14,t:"03:57:10",dur:"12:00"}],
    events:[{t:"02:15:00",e:"System boot — all OK",tp:"info"},{t:"02:21:30",e:"Initial Count: 48 items",tp:"gate"},{t:"02:25:15",e:"Count BALANCED ✓",tp:"ok"},{t:"02:34:25",e:"Time Out: 4/4 confirmed",tp:"gate"},{t:"03:24:50",e:"Pre-Closure Count: 48 = 39+9",tp:"gate"},{t:"03:25:10",e:"Count BALANCED ✓",tp:"ok"},{t:"03:46:55",e:"Final Count: 48 = 37+11",tp:"gate"},{t:"03:47:10",e:"Count BALANCED ✓",tp:"ok"},{t:"03:55:10",e:"Patient out",tp:"info"}],
    recordings:[{src:"CAM-1",dur:"1:42:10",size:"3.2 GB",fmt:"H.265"},{src:"CAM-2",dur:"1:42:10",size:"2.8 GB",fmt:"H.265"},{src:"CAM-3",dur:"1:42:10",size:"1.6 GB",fmt:"H.265"},{src:"CAM-4",dur:"1:42:10",size:"1.2 GB",fmt:"H.265"},{src:"MIC-1",dur:"1:42:10",size:"178 MB",fmt:"FLAC"},{src:"MIC-2",dur:"1:42:10",size:"172 MB",fmt:"FLAC"}]},
  {id:"2026-0206-004",date:"2026-02-06",time:"14:00",proc:"Cholecystectomy (Lap)",surgeon:"Dr. M. Oren",team:["Dr. N. Goldberg","R. Dahan RN","Y. Levy ST"],patient:"M/52",or:"OR-1",duration:"1:28:40",items:56,alerts:2,counts:3,countResults:["Balanced","Mismatch → Resolved","Balanced"],outcome:"complete",
    stateLog:[{s:0,t:"14:00:00",dur:null},{s:1,t:"14:00:30",dur:"7:00"},{s:2,t:"14:07:30",dur:"4:10",count:{base:56,field:56,disp:0,status:"Balanced"}},{s:3,t:"14:11:40",dur:"2:00"},{s:4,t:"14:13:40",dur:"8:00"},{s:5,t:"14:21:40",dur:"2:30",verbal:"4/4 ✓"},{s:6,t:"14:24:10",dur:"38:20"},{s:7,t:"15:02:30",dur:"6:45",count:{base:56,field:43,disp:12,status:"Mismatch -1"}},{s:8,t:"15:09:15",dur:"3:20",count:{base:57,field:43,disp:13,status:"Resolved +1 tray"}},{s:9,t:"15:12:35",dur:"1:00"},{s:10,t:"15:13:35",dur:"22:00"},{s:11,t:"15:35:35",dur:"3:25",count:{base:57,field:41,disp:16,status:"Balanced"}},{s:12,t:"15:39:00",dur:"8:10"},{s:13,t:"15:47:10",dur:"2:00"},{s:14,t:"15:49:10",dur:"14:30"}],
    events:[{t:"14:00:00",e:"System boot",tp:"info"},{t:"14:07:30",e:"Initial Count: 56 items",tp:"gate"},{t:"14:11:40",e:"Count BALANCED ✓",tp:"ok"},{t:"14:21:40",e:"Time Out: 4/4",tp:"gate"},{t:"14:45:00",e:"⚠ Blade drop — sharps zone",tp:"warn"},{t:"14:45:08",e:"Blade recovered ✓",tp:"ok"},{t:"15:02:30",e:"Pre-Closure Count: MISMATCH -1 needle",tp:"warn"},{t:"15:05:00",e:"Mid-case tray identified (+1 suture set)",tp:"info"},{t:"15:09:15",e:"Count RESOLVED: 57 = 43+13+1 tray add ✓",tp:"ok"},{t:"15:35:35",e:"Final Count: 57 = 41+16 BALANCED ✓",tp:"gate"},{t:"15:47:10",e:"Patient out",tp:"info"}],
    recordings:[{src:"CAM-1",dur:"1:49:10",size:"3.4 GB",fmt:"H.265"},{src:"CAM-2",dur:"1:49:10",size:"3.0 GB",fmt:"H.265"},{src:"CAM-3",dur:"1:49:10",size:"1.7 GB",fmt:"H.265"},{src:"CAM-4",dur:"1:49:10",size:"1.3 GB",fmt:"H.265"},{src:"MIC-1",dur:"1:49:10",size:"192 MB",fmt:"FLAC"},{src:"MIC-2",dur:"1:49:10",size:"186 MB",fmt:"FLAC"}]},
  {id:"2026-0206-003",date:"2026-02-06",time:"10:30",proc:"Hernia Repair (Inguinal)",surgeon:"Dr. Y. Shapira",team:["Dr. A. Levi","N. Cohen RN","S. Mizrahi ST"],patient:"M/45",or:"OR-1",duration:"1:52:15",items:44,alerts:0,counts:3,countResults:["Balanced","Balanced","Balanced"],outcome:"complete",stateLog:[],events:[],recordings:[]},
  {id:"2026-0206-002",date:"2026-02-06",time:"07:00",proc:"Thyroidectomy (Partial)",surgeon:"Dr. L. Avraham",team:["Dr. S. Reiss","K. Mor RN","B. Tal ST"],patient:"F/38",or:"OR-1",duration:"2:08:30",items:62,alerts:1,counts:3,countResults:["Balanced","Balanced","Balanced"],outcome:"complete",stateLog:[],events:[],recordings:[]},
  {id:"2026-0205-003",date:"2026-02-05",time:"13:15",proc:"Mastectomy (Modified Radical)",surgeon:"Dr. R. Ben-David",team:["Dr. T. Katz","L. Amar RN","D. Peretz ST"],patient:"F/55",or:"OR-1",duration:"2:44:50",items:78,alerts:0,counts:3,countResults:["Balanced","Balanced","Balanced"],outcome:"complete",stateLog:[],events:[],recordings:[]},
];

// Video playback simulation for archive
function ArchiveVideoPlayer({T, cam, playing, onSeek, position}) {
  const ref=useRef(null);const frame=useRef(0);
  useEffect(()=>{if(!ref.current)return;const ctx=ref.current.getContext("2d");const w=ref.current.width,h=ref.current.height;let raf;
    const draw=()=>{frame.current+=playing?1:0;const f=frame.current+position*100;
      ctx.fillStyle=T.n==="dark"?"#080e1a":"#d8dce6";ctx.fillRect(0,0,w,h);
      ctx.strokeStyle=T.teal+"08";ctx.lineWidth=.5;for(let i=0;i<16;i++){ctx.beginPath();ctx.moveTo(0,i*h/16);ctx.lineTo(w,i*h/16);ctx.stroke();}
      ctx.fillStyle=T.cyan+"10";ctx.fillRect(w*.15,h*.2,w*.5,h*.5);ctx.strokeStyle=T.cyan+"33";ctx.strokeRect(w*.15,h*.2,w*.5,h*.5);
      [{x:.3,y:.4,l:"SRG"},{x:.48,y:.38,l:"AST"},{x:.2,y:.6,l:"SCR"}].forEach((s,j)=>{
        const ox=Math.sin(f*.015+j*2)*.02,oy=Math.cos(f*.01+j*1.7)*.015;
        const sx=(s.x+ox)*w,sy=(s.y+oy)*h;ctx.beginPath();ctx.arc(sx,sy,8,0,Math.PI*2);ctx.fillStyle=T.cyan+"22";ctx.fill();ctx.strokeStyle=T.cyan+"55";ctx.stroke();
        ctx.fillStyle=T.cyan;ctx.font=`bold 7px ${MO}`;ctx.textAlign="center";ctx.fillText(s.l,sx,sy+3);});
      for(let j=0;j<10;j++){const ix=w*(.2+Math.sin(j*.8)*.12),iy=h*(.3+Math.cos(j*1.1)*.15);ctx.beginPath();ctx.arc(ix,iy,3,0,Math.PI*2);ctx.fillStyle=[T.teal,T.purple,T.amber][j%3]+"88";ctx.fill();}
      ctx.fillStyle=T.n==="dark"?"#000000cc":"#ffffffcc";ctx.fillRect(0,h-20,w,20);
      if(!playing){ctx.fillStyle=T.amber;ctx.font=`bold 10px ${MO}`;ctx.textAlign="center";ctx.fillText("▶ PAUSED",w/2,h-7);}else{ctx.fillStyle=T.red;ctx.beginPath();ctx.arc(12,h-10,4,0,Math.PI*2);ctx.fill();ctx.fillStyle=T.text;ctx.font=`bold 9px ${MO}`;ctx.textAlign="left";ctx.fillText(`${cam} · PLAYBACK`,24,h-6);}
      raf=requestAnimationFrame(draw);};draw();return()=>cancelAnimationFrame(raf);},[T,cam,playing,position]);
  return <canvas ref={ref} width={380} height={200} style={{width:"100%",height:"100%",borderRadius:8,border:`1px solid ${T.teal}22`,display:"block"}}/>;
}

function ArchiveScreen({T}) {
  const [selOp, setSelOp] = useState(null);
  const [selState, setSelState] = useState(null);
  const [playback, setPlayback] = useState({playing:false,cam:"CAM-1",position:0});
  const [audioPlay, setAudioPlay] = useState(null);

  const op = ARCHIVE_OPS.find(o=>o.id===selOp);

  // Playback position animation
  useEffect(()=>{
    if(!playback.playing)return;
    const t=setInterval(()=>setPlayback(p=>({...p,position:Math.min(p.position+0.002,1)})),100);
    return()=>clearInterval(t);
  },[playback.playing]);

  // Operation List (no op selected)
  if(!op) return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexShrink:0}}>
        <div><div style={{fontSize:14,fontFamily:MO,color:T.teal,textTransform:"uppercase",letterSpacing:2}}>ORKing© Archive</div><div style={{fontSize:24,fontWeight:800,color:T.text,fontFamily:SA}}>Completed Operations</div></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <P color={T.green} T={T}>{ARCHIVE_OPS.length} operations</P>
          <P color={T.teal} T={T}>OR-1</P>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",minHeight:0}}>
        <div style={{display:"grid",gridTemplateColumns:"100px 1fr 140px 120px 70px 60px 80px 80px 80px",gap:8,padding:"10px 14px",borderBottom:`2px solid ${T.border}`,position:"sticky",top:0,background:T.bg,zIndex:1}}>
          {["Date","Procedure","Surgeon","Patient","Items","Alerts","Counts","Duration",""].map(h=><span key={h} style={{fontSize:12,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1}}>{h}</span>)}
        </div>
        {ARCHIVE_OPS.map(o=>(
          <div key={o.id} style={{display:"grid",gridTemplateColumns:"100px 1fr 140px 120px 70px 60px 80px 80px 80px",gap:8,padding:"14px",alignItems:"center",borderBottom:`1px solid ${T.border}`,cursor:"pointer",transition:"background .1s",background:"transparent"}}
            onMouseEnter={e=>e.currentTarget.style.background=T.teal+"08"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            onClick={()=>{setSelOp(o.id);setSelState(null);}}>
            <div><div style={{fontSize:15,fontWeight:600,color:T.text,fontFamily:MO}}>{o.date.slice(5)}</div><div style={{fontSize:12,fontFamily:MO,color:T.muted}}>{o.time}</div></div>
            <div style={{fontSize:16,fontWeight:600,color:T.text,fontFamily:SA}}>{o.proc}</div>
            <div style={{fontSize:14,color:T.soft,fontFamily:SA}}>{o.surgeon}</div>
            <div style={{fontSize:14,fontFamily:MO,color:T.soft}}>{o.patient}</div>
            <div style={{fontSize:16,fontFamily:MO,color:T.teal,fontWeight:600}}>{o.items}</div>
            <div style={{fontSize:16,fontFamily:MO,color:o.alerts>0?T.amber:T.green,fontWeight:600}}>{o.alerts}</div>
            <div>{o.countResults.map((cr,j)=><div key={j} style={{fontSize:11,fontFamily:MO,color:cr==="Balanced"?T.green:T.amber,lineHeight:1.6}}>{cr==="Balanced"?"✓":cr.length>10?cr.slice(0,8)+"…":cr}</div>)}</div>
            <div style={{fontSize:15,fontFamily:MO,color:T.text,fontWeight:600}}>{o.duration}</div>
            <div style={{textAlign:"right"}}><P color={T.teal} T={T} small>View →</P></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Operation Detail View
  const hasDetail = op.stateLog.length > 0;
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div onClick={()=>{setSelOp(null);setPlayback({playing:false,cam:"CAM-1",position:0});}} style={{padding:"8px 16px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:MO,background:T.card2,color:T.soft,border:`1px solid ${T.border}`}}>← Back</div>
          <div><div style={{fontSize:22,fontWeight:800,color:T.text,fontFamily:SA}}>{op.proc}</div><div style={{fontSize:14,fontFamily:MO,color:T.muted}}>{op.id} · {op.date} {op.time} · {op.surgeon} · {op.patient} · {op.or}</div></div>
        </div>
        <div style={{display:"flex",gap:8}}>{[{l:"Duration",v:op.duration,c:T.text},{l:"Items",v:op.items,c:T.teal},{l:"Alerts",v:op.alerts,c:op.alerts>0?T.amber:T.green},{l:"Counts",v:op.counts+"×",c:T.green}].map((m,i)=>(<div key={i} style={{textAlign:"center",padding:"4px 16px"}}><div style={{fontSize:20,fontWeight:800,fontFamily:MO,color:m.c}}>{m.v}</div><div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase"}}>{m.l}</div></div>))}</div>
      </div>

      {hasDetail ? (
        <div style={{display:"grid",gridTemplateColumns:"300px 1fr 320px",gap:14,flex:1,minHeight:0}}>
          {/* LEFT: State Timeline */}
          <Cd T={T} style={{padding:14,minHeight:0,overflow:"hidden"}}>
            <Lb T={T}>Operation Timeline</Lb>
            <div style={{flex:1,overflowY:"auto",minHeight:0}}>
              {op.stateLog.map((sl,i)=>{const st=STATES[sl.s];const c=T[st.ck];const isSel=selState===i;return(
                <div key={i} onClick={()=>setSelState(isSel?null:i)} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 6px",cursor:"pointer",borderRadius:10,background:isSel?c+"12":"transparent",border:`1px solid ${isSel?c+"33":"transparent"}`,marginBottom:2,position:"relative",transition:"all .1s"}}>
                  {i<op.stateLog.length-1&&<div style={{position:"absolute",left:18,top:34,width:2,height:"calc(100% - 10px)",background:T.teal+"33"}}/>}
                  <div style={{width:28,height:28,borderRadius:st.g?6:14,flexShrink:0,zIndex:1,background:c+"18",border:`2px solid ${c}55`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:12,color:c}}>✓</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:15,fontWeight:700,color:T.text,fontFamily:SA}}>{st.l}</span>
                      {st.g&&<P color={c} T={T} small>Gate</P>}
                    </div>
                    <div style={{fontSize:12,fontFamily:MO,color:T.muted,marginTop:2}}>{sl.t}{sl.dur?` · ${sl.dur}`:""}</div>
                    {sl.count&&(
                      <div style={{marginTop:6,padding:"6px 8px",borderRadius:8,background:sl.count.status==="Balanced"?T.green+"0c":T.amber+"0c",border:`1px solid ${sl.count.status==="Balanced"?T.green:T.amber}18`}}>
                        <div style={{fontSize:13,fontWeight:700,color:sl.count.status==="Balanced"?T.green:T.amber,fontFamily:MO}}>{sl.count.status==="Balanced"?"✓ BALANCED":sl.count.status}</div>
                        <div style={{fontSize:11,fontFamily:MO,color:T.soft,marginTop:2}}>{sl.count.base} = {sl.count.field} field + {sl.count.disp} disposed</div>
                      </div>
                    )}
                    {sl.verbal&&<div style={{fontSize:12,fontFamily:MO,color:T.green,marginTop:4}}>Verbal: {sl.verbal}</div>}
                  </div>
                </div>
              );})}
            </div>
          </Cd>

          {/* CENTER: Video/Audio Playback */}
          <div style={{display:"flex",flexDirection:"column",gap:12,minHeight:0}}>
            {/* Video Player */}
            <Cd T={T} style={{flex:1,padding:14,minHeight:0,overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexShrink:0}}>
                <Lb T={T}>📹 Video Playback</Lb>
                <div style={{display:"flex",gap:4}}>{["CAM-1","CAM-2","CAM-3","CAM-4"].map(c=>(<div key={c} onClick={()=>setPlayback(p=>({...p,cam:c}))} style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:12,fontFamily:MO,fontWeight:700,background:playback.cam===c?T.teal+"22":"transparent",color:playback.cam===c?T.teal:T.muted,border:`1px solid ${playback.cam===c?T.teal+"33":"transparent"}`}}>{c}</div>))}</div>
              </div>
              <div style={{flex:1,minHeight:0,borderRadius:10,overflow:"hidden",position:"relative"}}>
                <ArchiveVideoPlayer T={T} cam={playback.cam} playing={playback.playing} position={playback.position}/>
              </div>
              {/* Transport Controls */}
              <div style={{marginTop:10,flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <div onClick={()=>setPlayback(p=>({...p,position:Math.max(p.position-.05,0)}))} style={{width:32,height:32,borderRadius:8,background:T.card2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:T.soft}}>⏮</div>
                  <div onClick={()=>setPlayback(p=>({...p,playing:!p.playing}))} style={{width:40,height:32,borderRadius:8,background:playback.playing?T.red+"18":T.teal+"18",border:`1px solid ${playback.playing?T.red+"33":T.teal+"33"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,color:playback.playing?T.red:T.teal,fontWeight:700}}>{playback.playing?"❚❚":"▶"}</div>
                  <div onClick={()=>setPlayback(p=>({...p,position:Math.min(p.position+.05,1)}))} style={{width:32,height:32,borderRadius:8,background:T.card2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:T.soft}}>⏭</div>
                  <div style={{flex:1,height:10,background:T.card2,borderRadius:5,cursor:"pointer",position:"relative"}} onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();setPlayback(p=>({...p,position:(e.clientX-rect.left)/rect.width}));}}>
                    <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${playback.position*100}%`,borderRadius:5,background:`linear-gradient(90deg,${T.teal},${T.green})`}}/>
                    {/* Event markers on timeline */}
                    {op.events.filter(e=>e.tp==="warn"||e.tp==="gate").map((e,i)=>(<div key={i} style={{position:"absolute",top:-2,height:14,width:3,borderRadius:2,background:e.tp==="warn"?T.amber:T.teal,left:`${(i/(op.events.length-1))*100}%`,opacity:.6}}/>))}
                    <div style={{position:"absolute",top:-3,left:`${playback.position*100}%`,transform:"translateX(-50%)",width:14,height:14,borderRadius:7,background:T.teal,border:`2px solid ${T.text}`,boxShadow:`0 0 8px ${T.teal}55`}}/>
                  </div>
                  <span style={{fontSize:13,fontFamily:MO,color:T.soft,minWidth:52}}>{Math.floor(playback.position*100)}%</span>
                </div>
              </div>
            </Cd>
            {/* Audio Player */}
            <Cd T={T} style={{padding:12,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <Lb T={T}>🎙 Audio Playback</Lb>
                <div style={{display:"flex",gap:4}}>{["MIC-1","MIC-2"].map(m=>(<div key={m} onClick={()=>setAudioPlay(audioPlay===m?null:m)} style={{padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:MO,fontWeight:700,background:audioPlay===m?T.purple+"22":"transparent",color:audioPlay===m?T.purple:T.muted,border:`1px solid ${audioPlay===m?T.purple+"33":"transparent"}`}}>{audioPlay===m?"■ Stop":`▶ ${m}`}</div>))}</div>
              </div>
              {audioPlay&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:10}}><AudioMeter T={T} active={true}/><div style={{flex:1}}><div style={{height:6,background:T.card2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${playback.position*100}%`,borderRadius:3,background:T.purple,transition:"width .3s"}}/></div></div><span style={{fontSize:12,fontFamily:MO,color:T.purple}}>Playing</span></div>}
            </Cd>
          </div>

          {/* RIGHT: Events + Recordings */}
          <div style={{display:"flex",flexDirection:"column",gap:12,minHeight:0}}>
            <Cd T={T} style={{flex:1,padding:14,minHeight:0,overflow:"hidden"}}>
              <Lb T={T}>Event Log</Lb>
              <div style={{flex:1,overflowY:"auto",minHeight:0}}>
                {op.events.map((e,i)=>{const c=e.tp==="gate"?T.amber:e.tp==="warn"?T.orange:e.tp==="ok"?T.green:T.teal;return(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"7px 0",borderBottom:`1px solid ${T.border}`,cursor:"pointer"}} onClick={()=>setPlayback(p=>({...p,position:i/(op.events.length-1)}))}>
                    <span style={{fontSize:13,fontFamily:MO,color:T.muted,minWidth:64}}>{e.t.slice(0,8)}</span>
                    <div style={{width:8,height:8,borderRadius:"50%",background:c,marginTop:5,flexShrink:0}}/>
                    <span style={{fontSize:15,color:T.text,fontFamily:SA,flex:1,lineHeight:1.35}}>{e.e}</span>
                  </div>
                );})}
              </div>
            </Cd>
            <Cd T={T} style={{padding:14,flexShrink:0}}>
              <Lb T={T}>Recordings (Cloud)</Lb>
              {op.recordings.map((r,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:i<op.recordings.length-1?`1px solid ${T.border}`:"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:13}}>{r.src.startsWith("CAM")?"📹":"🎙"}</span>
                    <span style={{fontSize:14,fontWeight:600,color:T.text,fontFamily:SA}}>{r.src}</span>
                  </div>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:12,fontFamily:MO,color:T.soft}}>{r.dur}</span>
                    <span style={{fontSize:12,fontFamily:MO,color:T.muted}}>{r.size}</span>
                    <P color={T.teal} T={T} small>{r.fmt}</P>
                    <div style={{padding:"4px 10px",borderRadius:6,background:T.blue+"12",border:`1px solid ${T.blue}22`,cursor:"pointer",fontSize:11,fontFamily:MO,color:T.blue,fontWeight:700}}>⬇</div>
                  </div>
                </div>
              ))}
            </Cd>
          </div>
        </div>
      ) : (
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{textAlign:"center",opacity:.5}}><div style={{fontSize:48,marginBottom:12}}>📋</div><div style={{fontSize:18,fontFamily:SA,color:T.muted}}>Detailed timeline not available for this operation</div><div style={{fontSize:14,fontFamily:MO,color:T.faint,marginTop:8}}>Select a recent operation for full playback</div></div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT
   ══════════════════════════════════════════════════════════ */
export default function App() {
  const [theme,setTheme]=useState("dark");const [screen,setScreen]=useState("inventory");const [sec,setSec]=useState(0);
  const T=theme==="dark"?DK:LT;const as=6;
  useEffect(()=>{const t=setInterval(()=>setSec(p=>p+1),1000);return()=>clearInterval(t);},[]);
  const fmt=s=>`${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const tabs=[{k:"inventory",l:"Inventory",i:"▦"},{k:"timeline",l:"Timeline",i:"◉"},{k:"turnover",l:"Analytics",i:"⚡"},{k:"settings",l:"Settings",i:"⚙"},{k:"archive",l:"Archive",i:"📋"}];

  return(
    <div style={{width:"100vw",height:"100vh",background:T.bg,color:T.text,fontFamily:SA,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');@keyframes bl{0%,100%{opacity:1}50%{opacity:.2}}*{box-sizing:border-box;scrollbar-width:thin;scrollbar-color:${T.border} transparent;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:${T.border};border-radius:5px;}html,body,#root{margin:0;padding:0;overflow:hidden;background:${T.bg};width:100%;height:100%;}button:active{transform:scale(.97);}`}</style>
      <div style={{background:T.panel,borderBottom:`1px solid ${T.border}`,padding:"10px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${T.teal},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff",fontFamily:MO}}>T</div>
          <div><div style={{fontSize:22,fontWeight:800,color:T.text}}>Tracki<span style={{color:T.teal}}>Med</span><span style={{fontSize:14,fontFamily:MO,color:T.muted,marginLeft:12}}>ORKing© Live</span></div><div style={{fontSize:14,fontFamily:MO,color:T.muted}}>OR-1 · Case #2026-0207-003 · Lap Cholecystectomy</div></div>
        </div>
        <div style={{display:"flex",gap:4}}>{tabs.map(t=>(<div key={t.k} onClick={()=>setScreen(t.k)} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:12,cursor:"pointer",background:screen===t.k?T.teal+"12":"transparent",border:`1px solid ${screen===t.k?T.teal+"28":"transparent"}`,transition:"all .12s"}}><span style={{fontSize:15}}>{t.i}</span><span style={{fontSize:14,fontFamily:MO,fontWeight:screen===t.k?700:500,color:screen===t.k?T.teal:T.muted}}>{t.l}</span></div>))}</div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <P color={T.red} T={T} small filled>● REC</P>
          <P color={T[STATES[as].ck]} filled T={T}>{STATES[as].l}</P>
          <div style={{display:"flex",alignItems:"center",gap:8}}><Dot color={T.green} size={7}/><span style={{fontSize:22,fontFamily:MO,fontWeight:700,color:T.text,letterSpacing:1.5}}>{fmt(sec+4620)}</span></div>
          <div onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} style={{padding:"6px 12px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,background:T.card2,color:T.soft,border:`1px solid ${T.border}`,fontFamily:MO}}>{theme==="dark"?"☀":"◑"}</div>
        </div>
      </div>
      <div style={{flex:1,padding:14,overflow:"hidden",minHeight:0}}>
        {screen==="inventory"&&<InvScreen T={T}/>}
        {screen==="timeline"&&<TlScreen T={T} as={as}/>}
        {screen==="turnover"&&<TnScreen T={T}/>}
        {screen==="settings"&&<SettingsScreen T={T}/>}
        {screen==="archive"&&<ArchiveScreen T={T}/>}
      </div>
    </div>
  );
}
