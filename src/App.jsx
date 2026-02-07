import { useState, useEffect } from "react";

/* ══════════════════════════════════════════════════════════
   TRACKIMED — 16:9 Wall-Mount OR Dashboard
   EXTRA LARGE FONTS for wall-mounted readability
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

// ── Primitives EXTRA LARGE ──
const P=({children,color,T,filled})=><span style={{
  display:"inline-flex",alignItems:"center",padding:"3px 12px",borderRadius:99,
  fontSize:13,fontWeight:700,letterSpacing:.5,fontFamily:MO,textTransform:"uppercase",
  background:filled?color:color+"16",color:filled?(T.n==="dark"?"#080b14":"#fff"):color,
  border:`1px solid ${color}28`,whiteSpace:"nowrap",lineHeight:1.7,
}}>{children}</span>;

const C=({children,style,T,glow})=><div style={{
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

/* ── INVENTORY SCREEN ──────────────────────────────────── */
function InvScreen({T}) {
  const [counting,setCounting]=useState(false);
  const [vf,setVf]=useState(0);
  const tot=ITEMS.length;
  useEffect(()=>{
    if(!counting)return; setVf(0);
    const t=setInterval(()=>setVf(p=>{if(p>=tot){clearInterval(t);return tot;}return p+1;}),180);
    return()=>clearInterval(t);
  },[counting,tot]);

  const cT=CATS.map(c=>{const it=ITEMS.filter(i=>i.cat===c.key);
    return{...c,init:it.reduce((s,i)=>s+i.init,0),fld:it.reduce((s,i)=>s+i.f,0),dsp:it.reduce((s,i)=>s+i.d,0)};});
  const tI=ITEMS.reduce((s,i)=>s+i.init,0),tF=ITEMS.reduce((s,i)=>s+i.f,0),tD=ITEMS.reduce((s,i)=>s+i.d,0);

  return (
    <div style={{display:"grid",gridTemplateColumns:"280px 1fr 290px",gap:14,height:"100%",minHeight:0}}>
      {/* LEFT */}
      <div style={{display:"flex",flexDirection:"column",gap:12,minHeight:0}}>
        {counting?(
          <C T={T} style={{padding:16,textAlign:"center",borderColor:vf>=tot?T.green+"33":T.amber+"33",flexShrink:0}}>
            <div style={{fontSize:14,fontFamily:MO,color:vf>=tot?T.green:T.amber,textTransform:"uppercase",letterSpacing:3}}>◆ {vf>=tot?"BALANCED":"COUNTING"}</div>
            <div style={{fontSize:26,fontWeight:800,color:T.text,fontFamily:SA,marginTop:4}}>Pre-Closure Count</div>
            <div style={{marginTop:12,background:T.card2,borderRadius:6,height:10,overflow:"hidden"}}><div style={{height:"100%",borderRadius:6,transition:"width .2s",width:`${(vf/tot)*100}%`,background:vf>=tot?T.green:`linear-gradient(90deg,${T.teal},${T.amber})`}}/></div>
            <div style={{fontSize:16,fontFamily:MO,color:T.muted,marginTop:6}}>{vf}/{tot} verified</div>
          </C>
        ):(
          <div style={{flexShrink:0,padding:"2px 0"}}><div style={{fontSize:14,fontFamily:MO,color:T.teal,textTransform:"uppercase",letterSpacing:2}}>ORKing© Vision</div>
          <div style={{fontSize:24,fontWeight:800,color:T.text,fontFamily:SA}}>Item Inventory</div></div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,flexShrink:0}}>
          {[{l:"Baseline",v:tI,c:T.teal},{l:"In Field",v:tF,c:T.green},{l:"Disposed",v:tD,c:T.amber}].map((m,i)=>(
            <C key={i} T={T} style={{textAlign:"center",padding:"12px 4px"}}>
              <div style={{fontSize:36,fontWeight:800,fontFamily:MO,color:m.c,lineHeight:1}}>{m.v}</div>
              <div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,marginTop:6}}>{m.l}</div>
            </C>
          ))}
        </div>
        <C T={T} style={{flex:1,padding:14,minHeight:0,overflow:"hidden"}}>
          <L T={T}>Categories</L>
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>
            {cT.map(ct=>{const col=T[ct.ck];const acc=ct.fld+ct.dsp;return(
              <div key={ct.key} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:17,fontWeight:700,color:T.text,fontFamily:SA}}><span style={{color:col,marginRight:5}}>{ct.icon}</span>{ct.label}</span>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:15,fontFamily:MO,color:T.soft}}>{acc}/{ct.init}</span><P color={acc===ct.init?T.green:T.red} T={T}>{acc===ct.init?"✓":"!"}</P></div>
                </div>
                <div style={{background:T.card2,borderRadius:5,height:8,overflow:"hidden",display:"flex"}}>
                  <div style={{width:`${(ct.fld/ct.init)*100}%`,background:col}}/><div style={{width:`${(ct.dsp/ct.init)*100}%`,background:T.amber}}/>
                </div>
              </div>
            );})}
            <div style={{marginTop:12}}><L T={T}>Zones</L></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[{z:"Mayo",n:ITEMS.filter(i=>i.z==="mayo").reduce((a,i)=>a+i.f,0),c:T.purple},
                {z:"Sterile",n:ITEMS.filter(i=>i.z==="sterile").reduce((a,i)=>a+i.f,0),c:T.teal},
                {z:"Back Tbl",n:ITEMS.filter(i=>i.z==="back_table").reduce((a,i)=>a+i.f,0),c:T.blue},
                {z:"Waste",n:tD,c:T.amber}].map((z,i)=>(
                <div key={i} style={{textAlign:"center",padding:"12px 4px",borderRadius:12,background:z.c+"0a",border:`1px solid ${z.c}15`}}>
                  <div style={{fontSize:30,fontWeight:800,fontFamily:MO,color:z.c}}>{z.n}</div>
                  <div style={{fontSize:12,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginTop:4}}>{z.z}</div>
                </div>
              ))}
            </div>
          </div>
        </C>
        {!counting&&<button onClick={()=>setCounting(true)} style={{background:T.teal,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:18,fontWeight:700,cursor:"pointer",fontFamily:SA,boxShadow:`0 3px 14px ${T.teal}33`,flexShrink:0}}>◆ Start Count</button>}
        {counting&&vf>=tot&&<button onClick={()=>setCounting(false)} style={{background:T.green,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:18,fontWeight:700,cursor:"pointer",fontFamily:SA,flexShrink:0}}>✓ Balanced — {tF+tD}/{tI}</button>}
      </div>

      {/* CENTER: Table */}
      <C T={T} style={{padding:14,minHeight:0,overflow:"hidden"}}>
        <L T={T}>Item Detail — {ITEMS.length} Items</L>
        <div style={{flex:1,overflowY:"auto",minHeight:0}}>
          <div style={{display:"grid",gridTemplateColumns:"80px 1fr 50px 50px 50px 80px 70px",gap:6,padding:"8px 0",borderBottom:`2px solid ${T.border}`,marginBottom:4,position:"sticky",top:0,background:T.card,zIndex:1}}>
            {["ID","Item","Init","Fld","Dsp","Zone","Status"].map(h=><span key={h} style={{fontSize:13,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1}}>{h}</span>)}
          </div>
          {ITEMS.map((it,i)=>{const b=it.f+it.d===it.init;const iv=counting&&i<vf;return(
            <div key={it.id} style={{display:"grid",gridTemplateColumns:"80px 1fr 50px 50px 50px 80px 70px",gap:6,padding:"8px 0",alignItems:"center",borderBottom:`1px solid ${T.border}`,opacity:counting&&!iv?.2:1,transition:"opacity .15s"}}>
              <span style={{fontSize:14,fontFamily:MO,color:T.muted}}>{it.id}</span>
              <span style={{fontSize:17,color:T.text,fontFamily:SA,fontWeight:500}}>{it.n}</span>
              <span style={{fontSize:17,fontFamily:MO,color:T.soft,textAlign:"center"}}>{it.init}</span>
              <span style={{fontSize:17,fontFamily:MO,color:T.teal,textAlign:"center",fontWeight:600}}>{it.f}</span>
              <span style={{fontSize:17,fontFamily:MO,color:it.d>0?T.amber:T.faint,textAlign:"center"}}>{it.d}</span>
              <span style={{fontSize:14,fontFamily:MO,color:T.soft,textTransform:"capitalize"}}>{it.z.replace("_"," ")}</span>
              <P color={counting?(iv?T.green:T.muted):(b?T.green:T.amber)} T={T}>{counting?(iv?"OK":"—"):(b?"OK":"Chk")}</P>
            </div>
          );})}
        </div>
      </C>

      {/* RIGHT */}
      <div style={{display:"flex",flexDirection:"column",gap:12,minHeight:0}}>
        <C T={T} style={{padding:12,flexShrink:0}}>
          <L T={T}>OR Zone Map</L>
          <div style={{background:T.n==="dark"?"#060a12":"#e6eaf2",borderRadius:10,height:180,position:"relative",overflow:"hidden",border:`1px solid ${T.border}`}}>
            <div style={{position:"absolute",top:"8%",left:"8%",width:"55%",height:"72%",border:`1.5px dashed ${T.teal}33`,borderRadius:8}}>
              <span style={{position:"absolute",top:-9,left:6,fontSize:11,fontFamily:MO,color:T.teal,background:T.n==="dark"?"#060a12":"#e6eaf2",padding:"0 5px",letterSpacing:1.5}}>STERILE</span>
            </div>
            {[{l:"MAYO",x:"12%",y:"14%",w:"16%",h:"18%",c:T.purple},{l:"TABLE",x:"18%",y:"38%",w:"30%",h:"34%",c:T.cyan},{l:"BACK",x:"52%",y:"12%",w:"15%",h:"52%",c:T.blue},{l:"WASTE",x:"76%",y:"52%",w:"20%",h:"32%",c:T.red}].map((z,i)=>(
              <div key={i} style={{position:"absolute",left:z.x,top:z.y,width:z.w,height:z.h,border:`1px solid ${z.c}22`,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,fontFamily:MO,color:z.c+"77",letterSpacing:1.5}}>{z.l}</span></div>
            ))}
            {[{x:28,y:38,r:"SRG"},{x:42,y:38,r:"AST"},{x:22,y:65,r:"SCR"},{x:82,y:36,r:"CIR"}].map((s,i)=>(
              <div key={i} style={{position:"absolute",left:`${s.x}%`,top:`${s.y}%`,transform:"translate(-50%,-50%)",width:22,height:22,borderRadius:"50%",background:T.cyan+"18",border:`1px solid ${T.cyan}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontFamily:MO,color:T.cyan,fontWeight:800}}>{s.r}</div>
            ))}
            <div style={{position:"absolute",top:6,right:8,display:"flex",alignItems:"center",gap:4}}><D color={T.red} size={5}/><span style={{fontSize:12,fontFamily:MO,color:T.red,fontWeight:700}}>LIVE</span></div>
          </div>
        </C>
        <C T={T} style={{flex:1,padding:12,minHeight:0,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexShrink:0}}>
            <L T={T}>Event Feed</L><P color={T.green} T={T}>Live</P>
          </div>
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>
            {EVT.slice().reverse().map((e,i)=>{const c=e.tp==="gate"?T.amber:e.tp==="warn"?T.orange:e.tp==="ok"?T.green:T.teal;return(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:14,fontFamily:MO,color:T.muted,minWidth:44,paddingTop:2}}>{e.t}</span>
                <div style={{width:8,height:8,borderRadius:"50%",background:c,marginTop:6,flexShrink:0}}/>
                <span style={{fontSize:16,color:T.text,fontFamily:SA,flex:1,lineHeight:1.35}}>{e.e}</span>
              </div>
            );})}
          </div>
        </C>
      </div>
    </div>
  );
}

/* ── TIMELINE SCREEN ──────────────────────────────────── */
function TlScreen({T,as=6}) {
  const durs=[null,8.7,4.4,2.0,8.75,3.0,76.4,null,null,null,null,null,null,null,null];
  return(
    <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:14,height:"100%",minHeight:0}}>
      <C T={T} style={{padding:14,minHeight:0,overflow:"hidden"}}>
        <L T={T}>State Progression</L>
        <div style={{flex:1,overflowY:"auto",minHeight:0}}>
          {STATES.map((st,i)=>{const c=T[st.ck];const past=i<as;const active=i===as;return(
            <div key={st.id} style={{display:"flex",alignItems:"center",gap:12,padding:"7px 0",position:"relative"}}>
              {i<STATES.length-1&&<div style={{position:"absolute",left:14,top:32,width:2,height:"calc(100% - 10px)",background:past?T.teal+"44":T.border}}/>}
              <div style={{width:30,height:30,borderRadius:active?8:15,flexShrink:0,zIndex:1,background:active?c:past?T.teal+"18":T.card2,border:`2px solid ${active?c:past?T.teal+"55":T.border}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:active?`0 0 14px ${c}33`:"none"}}>
                {past&&<span style={{fontSize:14,color:T.teal}}>✓</span>}
                {active&&<D color="#fff" size={6} pulse/>}
                {st.g&&!past&&!active&&<span style={{fontSize:11,color:T.muted}}>◆</span>}
              </div>
              <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16,fontWeight:active?800:past?600:400,color:active?T.text:past?T.soft:T.muted,fontFamily:SA}}>{st.l}</span>{st.g&&<P color={active?c:past?T.teal:T.muted} T={T}>Gate</P>}</div></div>
              <span style={{fontSize:14,fontFamily:MO,color:active?c:past?T.soft:T.faint}}>{active?"LIVE":past&&durs[i]?durs[i].toFixed(1)+"m":""}</span>
            </div>
          );})}
        </div>
      </C>
      <div style={{display:"flex",flexDirection:"column",gap:14,minHeight:0}}>
        {(()=>{const st=STATES[as];const c=T[st.ck];return(
          <C T={T} style={{padding:"18px 24px",borderColor:c+"33",position:"relative",overflow:"hidden",flexShrink:0}} glow={`inset 0 0 30px ${c}08`}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${T.teal},${c},transparent)`}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}><D color={c} size={9}/><span style={{fontSize:14,fontFamily:MO,color:c,textTransform:"uppercase",letterSpacing:2.5}}>Active State</span></div>
                <div style={{fontSize:32,fontWeight:800,color:T.text,fontFamily:SA}}>{st.l}</div>
                <div style={{fontSize:16,color:T.soft,marginTop:3}}>State {st.id}/14 · {st.g?"◆ Safety Gate":"Standard Phase"}</div></div>
              <div style={{display:"flex",gap:32}}>
                {[{v:"01:16:22",l:"Elapsed",c:T.teal},{v:"83",l:"Items",c:T.green},{v:"4",l:"Staff",c:T.cyan},{v:"1",l:"Alerts",c:T.amber}].map((m,i)=>(
                  <div key={i} style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,fontFamily:MO,color:m.c}}>{m.v}</div><div style={{fontSize:12,fontFamily:MO,color:T.muted,letterSpacing:1,marginTop:4}}>{m.l}</div></div>
                ))}
              </div>
            </div>
          </C>
        );})()}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,flex:1,minHeight:0}}>
          <C T={T} style={{padding:14,minHeight:0,overflow:"hidden"}}>
            <L T={T}>Event Log</L>
            <div style={{flex:1,overflowY:"auto",minHeight:0}}>{EVT.filter(e=>e.s<=as).reverse().map((e,i)=>{const c=e.tp==="gate"?T.amber:e.tp==="warn"?T.orange:e.tp==="ok"?T.green:T.teal;return(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:14,fontFamily:MO,color:T.muted,minWidth:44,paddingTop:2}}>{e.t}</span>
                <div style={{width:7,height:7,borderRadius:"50%",background:c,marginTop:6,flexShrink:0}}/>
                <span style={{fontSize:16,color:T.text,fontFamily:SA,flex:1,lineHeight:1.35}}>{e.e}</span>
              </div>
            );})}</div>
          </C>
          <C T={T} style={{padding:14,minHeight:0,overflow:"hidden"}}>
            <L T={T}>Phase Durations</L>
            <div style={{flex:1,overflowY:"auto",minHeight:0}}>
              {[{p:"OR Setup",d:12.5,b:15,c:T.purple},{p:"Initial Count",d:4.4,b:8,c:T.amber},{p:"Pre-Procedure",d:6.0,b:10,c:T.cyan},{p:"Procedure",d:76.4,b:90,c:T.teal},{p:"Pre-Close",d:3.5,b:8,c:T.amber},{p:"Closure",d:26.0,b:30,c:T.purple},{p:"Final Count",d:4.0,b:8,c:T.amber},{p:"Emrg→Out",d:13.0,b:15,c:T.cyan}].map((p,i)=>(
                <div key={i} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:16,color:T.text,fontFamily:SA}}>{p.p}</span><span style={{fontSize:15,fontFamily:MO,color:T.soft}}>{p.d.toFixed(1)}m</span></div>
                  <div style={{background:T.card2,borderRadius:5,height:12,overflow:"hidden",position:"relative"}}><div style={{height:"100%",borderRadius:5,width:`${Math.min((p.d/p.b)*100,100)}%`,background:`linear-gradient(90deg,${p.c}88,${p.c})`}}/><div style={{position:"absolute",top:0,bottom:0,left:"80%",width:2,background:T.muted+"33"}}/></div>
                </div>
              ))}
            </div>
          </C>
        </div>
      </div>
    </div>
  );
}

/* ── TURNOVER SCREEN ──────────────────────────────────── */
function TnScreen({T}) {
  return(
    <div style={{display:"grid",gridTemplateColumns:"260px 1fr 260px",gap:14,height:"100%",minHeight:0}}>
      <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,flexShrink:0}}>
          {[{l:"Case Time",v:"2:22:49",c:T.text},{l:"OR Util.",v:"1:29:49",c:T.teal},{l:"Turnover",v:"18:30",c:T.blue},{l:"Gates",v:"5/5 ✓",c:T.green}].map((m,i)=>(
            <C key={i} T={T} style={{textAlign:"center",padding:12}}><div style={{fontSize:22,fontWeight:800,fontFamily:MO,color:m.c,lineHeight:1.1}}>{m.v}</div><div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginTop:5}}>{m.l}</div></C>
          ))}
        </div>
        <C T={T} style={{padding:12,flexShrink:0}}>
          <L T={T}>Item Tracking</L>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[{l:"Tracked",v:"83",c:T.teal},{l:"Disposed",v:"10",c:T.amber},{l:"Added",v:"+1",c:T.orange}].map((m,i)=>(
              <div key={i} style={{textAlign:"center",padding:"10px 4px",borderRadius:12,background:m.c+"0a",border:`1px solid ${m.c}15`}}>
                <div style={{fontSize:28,fontWeight:800,fontFamily:MO,color:m.c}}>{m.v}</div>
                <div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginTop:3}}>{m.l}</div>
              </div>
            ))}
          </div>
        </C>
        <C T={T} style={{padding:12,flexShrink:0}}>
          <L T={T}>Count Results</L>
          {[{n:"Initial Count",t:"08:47–08:51",d:"4:22"},{n:"Pre-Closure",t:"10:15–10:18",d:"3:30"},{n:"Final Count",t:"10:48–10:52",d:"4:00"}].map((c,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:i<2?`1px solid ${T.border}`:"none"}}>
              <span style={{fontSize:18,color:T.green}}>✓</span>
              <div style={{flex:1}}><div style={{fontSize:16,fontWeight:600,color:T.text,fontFamily:SA}}>{c.n}</div><div style={{fontSize:13,fontFamily:MO,color:T.muted}}>{c.t}</div></div>
              <span style={{fontSize:15,fontFamily:MO,color:T.soft}}>{c.d}</span>
            </div>
          ))}
        </C>
        <C T={T} style={{flex:1,padding:12,minHeight:0,overflow:"hidden"}}>
          <L T={T}>Efficiency</L>
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>
            {[{l:"Staff",v:"4"},{l:"Idle Periods",v:"2 (8:40)"},{l:"Pref Card",v:"94%"},{l:"Documentation",v:"Auto ✓"},{l:"Turn Target",v:"<25 min"},{l:"Actual Turn",v:"18:30 ✓"},{l:"Est. Savings",v:"$5,850"},{l:"Time Saved",v:"~42 min"}].map((m,i)=>(
              <div key={i} style={{padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
                <div style={{fontSize:12,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:.5}}>{m.l}</div>
                <div style={{fontSize:20,fontWeight:700,fontFamily:MO,color:T.text,marginTop:3}}>{m.v}</div>
              </div>
            ))}
          </div>
        </C>
      </div>
      <C T={T} style={{padding:16,minHeight:0,overflow:"hidden"}}>
        <L T={T}>Phase Duration Breakdown</L>
        <div style={{flex:1,overflowY:"auto",minHeight:0}}>
          {[{p:"OR Setup",d:12.5,b:15,c:T.purple},{p:"Initial Count",d:4.4,b:8,c:T.amber},{p:"Pre-Procedure",d:13.75,b:18,c:T.cyan},{p:"Procedure",d:76.4,b:90,c:T.teal},{p:"Pre-Closure Count",d:3.5,b:8,c:T.amber},{p:"Surgeon Decision + Closure",d:28.0,b:35,c:T.purple},{p:"Final Count",d:4.0,b:8,c:T.amber},{p:"Emergence → Patient Out",d:13.0,b:15,c:T.cyan},{p:"Turnover",d:18.5,b:25,c:T.blue}].map((p,i)=>(
            <div key={i} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:17,color:T.text,fontFamily:SA,fontWeight:500}}>{p.p}</span><span style={{fontSize:16,fontFamily:MO,color:T.soft}}>{p.d.toFixed(1)} min</span></div>
              <div style={{background:T.card2,borderRadius:6,height:14,overflow:"hidden",position:"relative"}}><div style={{height:"100%",borderRadius:6,width:`${Math.min((p.d/p.b)*100,100)}%`,background:`linear-gradient(90deg,${p.c}88,${p.c})`}}/><div style={{position:"absolute",top:0,bottom:0,left:"80%",width:2,background:T.muted+"33"}}/></div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6,flexShrink:0}}><div style={{width:16,height:2,background:T.muted+"44"}}/><span style={{fontSize:13,fontFamily:MO,color:T.muted}}>80th percentile benchmark</span></div>
      </C>
      <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
        <C T={T} style={{padding:12,flexShrink:0}}>
          <L T={T}>Alerts & Deviations</L>
          {[{t:"09:25",a:"Item drop — Raytec Sponge",r:"Located on floor ✓"},{t:"09:42",a:"Mid-case tray addition",r:"Inventory re-baselined ✓"}].map((a,i)=>(
            <div key={i} style={{padding:12,marginBottom:8,borderRadius:12,background:T.amberBg,border:`1px solid ${T.amber}18`}}>
              <div style={{display:"flex",gap:8,marginBottom:5}}><span style={{fontSize:13,fontFamily:MO,color:T.muted}}>{a.t}</span><P color={T.amber} T={T}>Warn</P></div>
              <div style={{fontSize:16,fontWeight:600,color:T.text,fontFamily:SA}}>{a.a}</div>
              <div style={{fontSize:15,color:T.green,marginTop:5}}>{a.r}</div>
            </div>
          ))}
        </C>
        <C T={T} style={{flex:1,padding:12,minHeight:0,overflow:"hidden"}}>
          <L T={T}>Category Breakdown</L>
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>
            {CATS.map(ct=>{const it=ITEMS.filter(i=>i.cat===ct.key);const ini=it.reduce((s,i)=>s+i.init,0);const fld=it.reduce((s,i)=>s+i.f,0);const dsp=it.reduce((s,i)=>s+i.d,0);const col=T[ct.ck];return(
              <div key={ct.key} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:16,fontWeight:600,color:T.text,fontFamily:SA}}><span style={{color:col,marginRight:5}}>{ct.icon}</span>{ct.label}</span>
                  <span style={{fontSize:15,fontFamily:MO,color:T.soft}}>{fld+dsp}/{ini}</span>
                </div>
                <div style={{background:T.card2,borderRadius:5,height:10,overflow:"hidden",display:"flex"}}>
                  <div style={{width:`${(fld/ini)*100}%`,background:col}}/><div style={{width:`${(dsp/ini)*100}%`,background:T.amber}}/>
                </div>
                <div style={{display:"flex",gap:12,marginTop:4}}>
                  <span style={{fontSize:13,fontFamily:MO,color:T.muted}}>Field: {fld}</span>
                  <span style={{fontSize:13,fontFamily:MO,color:T.amber}}>Disp: {dsp}</span>
                </div>
              </div>
            );})}
          </div>
        </C>
      </div>
    </div>
  );
}

/* ── SETTINGS SCREEN ──────────────────────────────────── */
function SettingsScreen({T}) {
  const [alerts, setAlerts] = useState([
    {id:"ALR-01",name:"Item Drop Detection",desc:"Alert when item leaves tracked zone unexpectedly",enabled:true,sev:"critical",sound:true,visual:true},
    {id:"ALR-02",name:"Count Mismatch",desc:"Field+disposed ≠ baseline during count",enabled:true,sev:"critical",sound:true,visual:true},
    {id:"ALR-03",name:"Mid-Case Tray Addition",desc:"New tray detected after initial count",enabled:true,sev:"medium",sound:true,visual:true},
    {id:"ALR-04",name:"Staff Zone Breach",desc:"Non-scrubbed person enters sterile boundary",enabled:true,sev:"high",sound:true,visual:true},
    {id:"ALR-05",name:"Time Out Incomplete",desc:"Verbal confirmation threshold not met",enabled:true,sev:"critical",sound:true,visual:true},
    {id:"ALR-06",name:"Idle Time Warning",desc:"No activity for configurable duration",enabled:false,sev:"low",sound:false,visual:true},
    {id:"ALR-07",name:"Camera Occlusion",desc:"Camera view blocked >5 seconds",enabled:true,sev:"medium",sound:false,visual:true},
    {id:"ALR-08",name:"Turnover Target Exceeded",desc:"Turnover time exceeds configured target",enabled:true,sev:"low",sound:false,visual:true},
  ]);
  const toggleAlert=(id)=>setAlerts(a=>a.map(al=>al.id===id?{...al,enabled:!al.enabled}:al));
  const toggleSound=(id)=>setAlerts(a=>a.map(al=>al.id===id?{...al,sound:!al.sound}:al));
  const toggleVisual=(id)=>setAlerts(a=>a.map(al=>al.id===id?{...al,visual:!al.visual}:al));
  const sevColor=(s)=>s==="critical"?T.red:s==="high"?T.orange:s==="medium"?T.amber:T.muted;
  const Toggle=({on,onClick,color})=>(
    <div onClick={onClick} style={{width:42,height:22,borderRadius:11,cursor:"pointer",position:"relative",
      background:on?color+"33":T.card2,border:`1px solid ${on?color+"55":T.border}`,transition:"all .15s"}}>
      <div style={{width:18,height:18,borderRadius:9,position:"absolute",top:1,left:on?21:1,background:on?color:T.muted,transition:"all .15s",boxShadow:on?`0 0 6px ${color}55`:"none"}}/>
    </div>
  );

  const cams=[
    {id:"CAM-1",name:"Ceiling Main",ip:"192.168.1.101",res:"4K UHD",fps:30,zone:"Full OR",status:"online",angle:"Wide 120°"},
    {id:"CAM-2",name:"Sterile Field",ip:"192.168.1.102",res:"4K UHD",fps:30,zone:"Sterile",status:"online",angle:"Focused 65°"},
    {id:"CAM-3",name:"Back Table",ip:"192.168.1.103",res:"1080p",fps:30,zone:"Back Table",status:"online",angle:"Wide 90°"},
    {id:"CAM-4",name:"Waste & Door",ip:"192.168.1.104",res:"1080p",fps:24,zone:"Waste",status:"online",angle:"Wide 110°"},
  ];
  const mics=[
    {id:"MIC-1",name:"Ceiling Array",status:"online",mode:"Ambient + Voice",nc:true},
    {id:"MIC-2",name:"Surgeon Lapel",status:"online",mode:"Directional Voice",nc:true},
  ];

  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,height:"100%",minHeight:0}}>
      {/* LEFT */}
      <div style={{display:"flex",flexDirection:"column",gap:12,minHeight:0}}>
        <C T={T} style={{flex:3,padding:16,minHeight:0,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexShrink:0}}>
            <L T={T}>Camera Configuration</L>
            <P color={T.green} T={T}>{cams.filter(c=>c.status==="online").length}/{cams.length} Online</P>
          </div>
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>
            {cams.map(cam=>(
              <div key={cam.id} style={{padding:16,marginBottom:12,borderRadius:14,background:T.card2,border:`1px solid ${T.border}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:44,height:44,borderRadius:12,background:T.teal+"12",border:`1px solid ${T.teal}28`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:22}}>📷</span></div>
                    <div><div style={{fontSize:18,fontWeight:700,color:T.text,fontFamily:SA}}>{cam.name}</div><div style={{fontSize:14,fontFamily:MO,color:T.muted}}>{cam.id} · {cam.ip}</div></div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><D color={T.green} size={7}/><P color={T.green} T={T}>{cam.status}</P></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
                  {[{l:"Resolution",v:cam.res},{l:"FPS",v:cam.fps},{l:"Zone",v:cam.zone},{l:"Angle",v:cam.angle}].map((f,i)=>(
                    <div key={i}><div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1}}>{f.l}</div><div style={{fontSize:15,fontWeight:600,fontFamily:MO,color:T.soft,marginTop:3}}>{f.v}</div></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </C>
        <C T={T} style={{flex:2,padding:16,minHeight:0,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexShrink:0}}>
            <L T={T}>Microphone Configuration</L>
            <P color={T.green} T={T}>{mics.length}/{mics.length} Online</P>
          </div>
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>
            {mics.map(mic=>(
              <div key={mic.id} style={{padding:16,marginBottom:12,borderRadius:14,background:T.card2,border:`1px solid ${T.border}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:44,height:44,borderRadius:12,background:T.purple+"12",border:`1px solid ${T.purple}28`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:22}}>🎙</span></div>
                    <div><div style={{fontSize:18,fontWeight:700,color:T.text,fontFamily:SA}}>{mic.name}</div><div style={{fontSize:14,fontFamily:MO,color:T.muted}}>{mic.id}</div></div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><D color={T.green} size={7}/><P color={T.green} T={T}>{mic.status}</P></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1}}>Mode</div><div style={{fontSize:15,fontWeight:600,fontFamily:MO,color:T.soft,marginTop:3}}>{mic.mode}</div></div>
                  <div><div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1}}>Noise Cancel</div><div style={{fontSize:15,fontWeight:600,fontFamily:MO,color:mic.nc?T.green:T.muted,marginTop:3}}>{mic.nc?"Enabled":"Disabled"}</div></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{flexShrink:0,marginTop:10,padding:"12px 0 0",borderTop:`1px solid ${T.border}`}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[{l:"AI Engine",v:"ORKing© v3.2"},{l:"Model",v:"YOLO-Surgical v8"},{l:"Tracki©",v:"NLU v2.1"}].map((s,i)=>(
                <div key={i}><div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1}}>{s.l}</div><div style={{fontSize:15,fontWeight:600,fontFamily:MO,color:T.teal,marginTop:3}}>{s.v}</div></div>
              ))}
            </div>
          </div>
        </C>
      </div>

      {/* RIGHT: Alerts */}
      <C T={T} style={{padding:16,minHeight:0,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexShrink:0}}>
          <L T={T}>Alert Configuration</L>
          <div style={{display:"flex",gap:8}}>
            <P color={T.red} T={T}>{alerts.filter(a=>a.sev==="critical"&&a.enabled).length} Crit</P>
            <P color={T.orange} T={T}>{alerts.filter(a=>a.sev==="high"&&a.enabled).length} High</P>
            <P color={T.amber} T={T}>{alerts.filter(a=>a.sev==="medium"&&a.enabled).length} Med</P>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",minHeight:0}}>
          {alerts.map(al=>{const sc=sevColor(al.sev);return(
            <div key={al.id} style={{padding:16,marginBottom:12,borderRadius:14,background:al.enabled?sc+"08":T.card2,border:`1px solid ${al.enabled?sc+"22":T.border}`,opacity:al.enabled?1:.5,transition:"all .15s"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <Toggle on={al.enabled} onClick={()=>toggleAlert(al.id)} color={sc}/>
                  <div><div style={{fontSize:17,fontWeight:700,color:T.text,fontFamily:SA}}>{al.name}</div><div style={{fontSize:13,fontFamily:MO,color:T.muted}}>{al.id}</div></div>
                </div>
                <P color={sc} T={T} filled={al.enabled}>{al.sev}</P>
              </div>
              <div style={{fontSize:15,color:T.soft,fontFamily:SA,lineHeight:1.4,marginBottom:12}}>{al.desc}</div>
              <div style={{display:"flex",gap:24}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:14,fontFamily:MO,color:T.muted}}>🔊 Sound</span><Toggle on={al.sound} onClick={()=>toggleSound(al.id)} color={T.teal}/></div>
                <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:14,fontFamily:MO,color:T.muted}}>📺 Visual</span><Toggle on={al.visual} onClick={()=>toggleVisual(al.id)} color={T.teal}/></div>
              </div>
            </div>
          );})}
        </div>
        <div style={{flexShrink:0,marginTop:10,padding:"14px 0 0",borderTop:`1px solid ${T.border}`}}>
          <L T={T}>Global Thresholds</L>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            {[{l:"Idle Timeout",v:"5 min",d:"Before idle warning"},{l:"Turnover Target",v:"25 min",d:"Max turnover time"},{l:"Occlusion Limit",v:"5 sec",d:"Before cam alert"}].map((th,i)=>(
              <div key={i} style={{padding:12,borderRadius:12,background:T.card2,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1}}>{th.l}</div>
                <div style={{fontSize:24,fontWeight:800,fontFamily:MO,color:T.teal,marginTop:5}}>{th.v}</div>
                <div style={{fontSize:12,fontFamily:MO,color:T.faint,marginTop:4}}>{th.d}</div>
              </div>
            ))}
          </div>
        </div>
      </C>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT — FULL VIEWPORT
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

      {/* TOP BAR */}
      <div style={{background:T.panel,borderBottom:`1px solid ${T.border}`,padding:"10px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${T.teal},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff",fontFamily:MO,boxShadow:`0 2px 10px ${T.teal}33`}}>T</div>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:T.text,letterSpacing:-.3}}>Tracki<span style={{color:T.teal}}>Med</span><span style={{fontSize:14,fontFamily:MO,color:T.muted,marginLeft:12}}>ORKing© Live</span></div>
            <div style={{fontSize:14,fontFamily:MO,color:T.muted,letterSpacing:.5}}>OR-1 · Case #2026-0207-003 · Lap Cholecystectomy</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {tabs.map(t=>(
            <div key={t.k} onClick={()=>setScreen(t.k)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:12,cursor:"pointer",background:screen===t.k?T.teal+"12":"transparent",border:`1px solid ${screen===t.k?T.teal+"28":"transparent"}`,transition:"all .12s"}}>
              <span style={{fontSize:16}}>{t.i}</span>
              <span style={{fontSize:15,fontFamily:MO,fontWeight:screen===t.k?700:500,color:screen===t.k?T.teal:T.muted,letterSpacing:.3}}>{t.l}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <P color={T[STATES[as].ck]} filled T={T}>{STATES[as].l}</P>
          <div style={{display:"flex",alignItems:"center",gap:8}}><D color={T.green} size={7}/><span style={{fontSize:22,fontFamily:MO,fontWeight:700,color:T.text,letterSpacing:1.5}}>{fmt(sec+4620)}</span></div>
          <div onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} style={{padding:"6px 12px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,background:T.card2,color:T.soft,border:`1px solid ${T.border}`,fontFamily:MO}}>{theme==="dark"?"☀":"◑"}</div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,padding:14,overflow:"hidden",minHeight:0}}>
        {screen==="inventory"&&<InvScreen T={T}/>}
        {screen==="timeline"&&<TlScreen T={T} as={as}/>}
        {screen==="turnover"&&<TnScreen T={T}/>}
        {screen==="settings"&&<SettingsScreen T={T}/>}
      </div>
    </div>
  );
}
