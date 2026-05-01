import React, { useState, useEffect, useRef, useCallback, useMemo, Fragment } from "react";
import FeedbackOverlay from "./Feedback";
import Login from "./Login";
import {
  PROCEDURE,
  PHASES,
  ACTIVE_PHASE,
  CATEGORIES,
  ITEMS as ITEMS_DB,
  ITEM_EVENTS as ITEM_EVENTS_DB,
  SYSTEM_EVENTS,
  LIVE_EVENTS as LIVE_EVENTS_DB,
  TRANSCRIPTION,
  COMPLIANCE,
  CAMERAS,
  getTimeFormatter,
} from "./procedureDB";
import { ARCHIVE_CASES } from "./archiveDB";
import { adaptArchiveCase } from "./archiveAdapter";
import { eventBus, EVT as EVT_TYPES } from "./eventAPI";
import { MockAlgorithm } from "./mockAlgorithm";
import { fetchKitsFromAPI } from "./kitCatalog";

/* ── useEventStream hook: subscribe to EventBus events ── */
function useEventStream(eventType) {
  const [events, setEvents] = useState([]);
  const initRef = useRef(false);
  useEffect(() => {
    // On mount, load historical events already in the bus
    const history = eventBus.query(eventType);
    setEvents(history);
    initRef.current = true;
    // Subscribe to new (non-historical) events
    const handler = (evt) => {
      if (!evt._historical) {
        setEvents(prev => [evt, ...prev]);
      }
    };
    eventBus.on(eventType, handler);
    return () => eventBus.off(eventType, handler);
  }, [eventType]);
  return events;
}

/* ══════════════════════════════════════════════════════════
   TRACKIMED — 16:9 Wall-Mount OR Dashboard v4
   5 Tabs: Inventory, Timeline, Analytics, Settings, Archive
   ══════════════════════════════════════════════════════════ */

// TrackiMed — Clinical-grade palette
const DK={n:"dark",bg:"#1a1a1a",panel:"#242424",card:"#2a2a2a",card2:"#303030",border:"#404040",text:"#e0e0e0",soft:"#b0b0b0",muted:"#808080",faint:"#505050",teal:"#00AB8E",green:"#2e8b57",red:"#cc3333",amber:"#cc8800",orange:"#cc6600",purple:"#6a5acd",cyan:"#008080",blue:"#336699",amberBg:"#cc88000a",shadow:"none",indigo:"#4b5dbd",olive:"#6b8e23",rose:"#cd5c5c",slate:"#5f7a8a",lime:"#5da84e",plum:"#8b5a8b",steel:"#4682b4",coral:"#cd6045",sage:"#5a8a6e"};
const LT={n:"light",bg:"#e8e8e8",panel:"#f0f0f0",card:"#ffffff",card2:"#f5f5f5",border:"#cccccc",text:"#1a1a1a",soft:"#444444",muted:"#888888",faint:"#bbbbbb",teal:"#00AB8E",green:"#2e8b57",red:"#cc3333",amber:"#cc8800",orange:"#cc6600",purple:"#6a5acd",cyan:"#008080",blue:"#336699",amberBg:"#cc88000a",shadow:"none",indigo:"#4b5dbd",olive:"#6b8e23",rose:"#cd5c5c",slate:"#5f7a8a",lime:"#5a9e45",plum:"#8b5a8b",steel:"#4682b4",coral:"#cd6045",sage:"#5a8a6e"};
const MO=`'Consolas','Courier New',monospace`;
const SA=`'Segoe UI','Helvetica Neue',Arial,sans-serif`;

const STATES=PHASES.map(p=>({id:p.id,l:p.label,s:p.short,ck:p.colorKey,g:p.gate}));

const ITEMS=ITEMS_DB.map(i=>({id:i.id,n:i.name,cat:i.cat,init:i.init,loc:i.loc,z:i.zone}));

const CATS=CATEGORIES.map(c=>({key:c.key,label:c.label,icon:c.icon,ck:c.colorKey}));
const fmtSec=s=>`${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(Math.floor(s%60)).padStart(2,"0")}`;

// Time helpers — must be defined before ITEM_EVENTS which uses them
// Default: start at Procedure phase (offset 0) so items are already baselined and visible
let _procStartMs=parseInt(localStorage.getItem("orking_ps3"))||Date.now();
const realTime=(offsetSec)=>{const d=new Date(_procStartMs+offsetSec*1000);const h=d.getHours(),m=d.getMinutes();return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;};
const realTimeFull=(offsetSec)=>{const d=new Date(_procStartMs+offsetSec*1000);return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;};
const PHASE_OFFSETS={
  prevPatientOut:-2071, orSetup:-2071+0, initialCount:-2071+972, patientIn:-2071+972+264,
  anesthesia:-2071+972+264+120, timeOut:-2071+972+264+120+525, procedure:0
};

// Derived ITEM_EVENTS — keep `at` offset for time-gating
const ITEM_EVENTS=(()=>{const mapped={};for(const[id,evts]of Object.entries(ITEM_EVENTS_DB)){mapped[id]=evts.map(ev=>({at:ev.at,t:realTime(ev.at),type:ev.type,note:ev.note,frame:ev.frame}));}return mapped;})();

// Live events — convert DB format
const LIVE_EVENTS=LIVE_EVENTS_DB.map(ev=>({at:ev.at,e:ev.text,tp:ev.type,...(ev.itemId?{itemId:ev.itemId}:{})}));

const liveEvtTime=(at)=>realTime(at);

// System events — keep `at` offset for time-gating
const EVT=SYSTEM_EVENTS.map(ev=>({at:ev.at,t:realTime(ev.at),s:ev.phase,e:ev.text,tp:ev.type}));

// Filter events by elapsed time — only show events that have happened
const filterByElapsed=(events,elapsed)=>events.filter(e=>e.at<=elapsed);
const filterItemEventsByElapsed=(itemId,elapsed)=>(ITEM_EVENTS[itemId]||[]).filter(e=>e.at<=elapsed);

/* ── useInventoryState: compute item locations from events up to elapsed ── */
function useInventoryState(elapsed, itemsOverride = null, itemEventsOverride = null) {
  const bucket = Math.floor(elapsed / 5); // recompute every 5s
  const srcItems = itemsOverride || ITEMS;
  const srcItemEvents = itemEventsOverride || ITEM_EVENTS;
  return useMemo(() => {
    const items = srcItems.map(item => {
      const events = (srcItemEvents[item.id] || []).filter(e => e.at <= elapsed);
      if (events.length === 0) {
        // For archive synthetic items that already have loc, show them directly
        if (itemsOverride && item.loc && (item.loc.m + item.loc.b + item.loc.p + item.loc.d) > 0) {
          return { ...item, visible: true };
        }
        return { ...item, visible: false, loc: { m: 0, b: 0, p: 0, d: 0 } };
      }
      const baseline = events.find(e => e.type === 'baseline');
      if (!baseline) {
        if (itemsOverride && item.loc && (item.loc.m + item.loc.b + item.loc.p + item.loc.d) > 0) {
          return { ...item, visible: true };
        }
        return { ...item, visible: false, loc: { m: 0, b: 0, p: 0, d: 0 } };
      }
      // Initialize from baseline — items start in their declared zone
      const loc = { m: 0, b: 0, p: 0, d: 0 };
      if (item.z === 'back_table') loc.b = item.init;
      else loc.m = item.init; // mayo or default
      // Apply subsequent events chronologically
      for (const evt of events) {
        if (evt.type === 'baseline') continue;
        if (evt.type === 'to_patient') { if (loc.m > 0) { loc.m -= 1; } else if (loc.b > 0) { loc.b -= 1; } loc.p += 1; }
        if (evt.type === 'to_mayo') { if (loc.p > 0) { loc.p -= 1; loc.m += 1; } else if (loc.b > 0) { loc.b -= 1; loc.m += 1; } }
        if (evt.type === 'to_back') { if (loc.m > 0) { loc.m -= 1; } else if (loc.p > 0) { loc.p -= 1; } loc.b += 1; }
        if (evt.type === 'disposed') { if (loc.m > 0) { loc.m -= 1; } else if (loc.p > 0) { loc.p -= 1; } else if (loc.b > 0) { loc.b -= 1; } loc.d += 1; }
        // 'opened', 'alert', 'resolved' — no location change
      }
      return { ...item, visible: true, loc };
    });
    // Count alerts and collect alert details
    const alertDetails = [];
    for (const [id, evts] of Object.entries(srcItemEvents)) {
      const item = items.find(i => i.id === id);
      for (const e of evts) {
        if (e.at <= elapsed && e.type === 'alert') {
          const resolved = evts.some(r => r.type === 'resolved' && r.at <= elapsed && r.at >= e.at);
          alertDetails.push({ id, name: item?.n || id, note: e.note, t: e.t || realTime(e.at), resolved });
        }
      }
    }
    const alertCount = alertDetails.filter(a => !a.resolved).length;
    const visibleItems = items.filter(i => i.visible);
    const totalTracked = visibleItems.reduce((s, i) => s + i.init, 0);
    return { items, visibleItems, alertCount, alertDetails, totalTracked };
  }, [bucket, srcItems, srcItemEvents]);
}

// ── Primitives ──
const P=({children,color,T,filled,small})=><span style={{display:"inline-flex",alignItems:"center",padding:small?"2px 8px":"3px 10px",borderRadius:2,fontSize:small?12:13,fontWeight:600,letterSpacing:.3,fontFamily:MO,textTransform:"uppercase",background:filled?color:color+"18",color:filled?"#fff":color,border:`1px solid ${color}44`,whiteSpace:"nowrap",lineHeight:1.6}}>{children}</span>;
const Cd=({children,style,T,glow})=><div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:3,display:"flex",flexDirection:"column",...style}}>{children}</div>;
const Dot=({color="#00AB8E",size=8,pulse=true})=><span style={{display:"inline-block",width:size,height:size,borderRadius:"50%",background:color,animation:pulse?"bl 2s infinite":"none"}}/>;
const Lb=({children,T})=><div style={{fontSize:15,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10,flexShrink:0,fontWeight:600,borderBottom:`1px solid ${T.border}`,paddingBottom:6}}>{children}</div>;
const Toggle=({on,onClick,color,T})=>(<div onClick={onClick} style={{width:44,height:22,borderRadius:3,cursor:"pointer",position:"relative",background:on?color+"33":T.card2,border:`1px solid ${on?color+"55":T.border}`,transition:"all .15s"}}><div style={{width:18,height:18,borderRadius:9,position:"absolute",top:1,left:on?23:1,background:on?color:T.muted,transition:"all .15s",boxShadow:on?`0 0 6px ${color}55`:"none"}}/></div>);

// ── Floating Panel system: drag, resize, minimize ──
function useFloatingPanels(storageKey, defaults) {
  const [panels,setPanels]=useState(()=>{try{const s=localStorage.getItem(storageKey);if(s){const p=JSON.parse(s);return defaults.map(d=>({...d,...(p.find(x=>x.id===d.id)||{})}));}}catch{}return defaults;});
  const [gridVisible,setGridVisible]=useState(false);
  useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(panels));}catch{}},[panels,storageKey]);
  const update=(id,patch)=>setPanels(ps=>ps.map(p=>p.id===id?{...p,...patch}:p));
  const bringToFront=id=>setPanels(ps=>{const mz=Math.max(...ps.map(p=>p.z||1));return ps.map(p=>p.id===id?{...p,z:mz+1}:p);});
  const reset=()=>{localStorage.removeItem(storageKey);setPanels(defaults);};
  const showGrid=()=>setGridVisible(true);
  const hideGrid=()=>setGridVisible(false);
  return {panels,update,bringToFront,reset,gridVisible,showGrid,hideGrid};
}

// Grid overlay — light blue dashed lines, only shown during drag/resize
function GridOverlay({visible}) {
  if(!visible)return null;
  const COLOR="rgba(59,130,246,0.14)"; // light blue, faint
  return(<div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:9998,
    backgroundImage:`linear-gradient(to right, ${COLOR} 1px, transparent 1px), linear-gradient(to bottom, ${COLOR} 1px, transparent 1px)`,
    backgroundSize:`${GRID_SIZE*5}px ${GRID_SIZE*5}px`,
    boxShadow:"inset 0 0 0 0 rgba(0,0,0,0)"
  }}>
    {/* finer grid every 10px on top */}
    <div style={{position:"absolute",inset:0,
      backgroundImage:`linear-gradient(to right, rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.06) 1px, transparent 1px)`,
      backgroundSize:`${GRID_SIZE}px ${GRID_SIZE}px`,
    }}/>
  </div>);
}

// Global grid configuration for window snapping
const GRID_SIZE=10; // pixel grid (snap unit)
const snap=v=>Math.round(v/GRID_SIZE)*GRID_SIZE;

function FloatingPanel({panel,update,bringToFront,T,children,headerColor,onInteractStart,onInteractEnd}) {
  const dragRef=useRef(null);
  const onDragStart=e=>{
    bringToFront(panel.id);
    if(onInteractStart)onInteractStart();
    const isTouch=!!e.touches;
    const startX=isTouch?e.touches[0].clientX:e.clientX;
    const startY=isTouch?e.touches[0].clientY:e.clientY;
    const startLeft=panel.x;const startTop=panel.y;
    const move=ev=>{const cx=ev.touches?ev.touches[0].clientX:ev.clientX;const cy=ev.touches?ev.touches[0].clientY:ev.clientY;update(panel.id,{x:Math.max(0,snap(startLeft+cx-startX)),y:Math.max(0,snap(startTop+cy-startY))});if(ev.touches)ev.preventDefault();};
    const up=()=>{document.removeEventListener("mousemove",move);document.removeEventListener("mouseup",up);document.removeEventListener("touchmove",move);document.removeEventListener("touchend",up);if(onInteractEnd)onInteractEnd();};
    document.addEventListener("mousemove",move);document.addEventListener("mouseup",up);
    document.addEventListener("touchmove",move,{passive:false});document.addEventListener("touchend",up);
  };
  // edge: 'n','s','e','w','ne','nw','se','sw'
  const onResizeStart=(edge)=>(e)=>{
    e.stopPropagation();bringToFront(panel.id);
    if(onInteractStart)onInteractStart();
    const isTouch=!!e.touches;
    const startX=isTouch?e.touches[0].clientX:e.clientX;
    const startY=isTouch?e.touches[0].clientY:e.clientY;
    const startW=panel.w;const startH=panel.h;const startL=panel.x;const startT=panel.y;
    const move=ev=>{
      const cx=ev.touches?ev.touches[0].clientX:ev.clientX;
      const cy=ev.touches?ev.touches[0].clientY:ev.clientY;
      const dx=cx-startX, dy=cy-startY;
      let nw=startW, nh=startH, nx=startL, ny=startT;
      if(edge.includes("e"))nw=Math.max(220,snap(startW+dx));
      if(edge.includes("w")){const newW=Math.max(220,snap(startW-dx));nx=startL+(startW-newW);nw=newW;}
      if(edge.includes("s"))nh=Math.max(150,snap(startH+dy));
      if(edge.includes("n")){const newH=Math.max(150,snap(startH-dy));ny=startT+(startH-newH);nh=newH;}
      update(panel.id,{w:nw,h:nh,x:Math.max(0,nx),y:Math.max(0,ny)});
      if(ev.touches)ev.preventDefault();
    };
    const up=()=>{document.removeEventListener("mousemove",move);document.removeEventListener("mouseup",up);document.removeEventListener("touchmove",move);document.removeEventListener("touchend",up);if(onInteractEnd)onInteractEnd();};
    document.addEventListener("mousemove",move);document.addEventListener("mouseup",up);
    document.addEventListener("touchmove",move,{passive:false});document.addEventListener("touchend",up);
  };
  if(panel.minimized)return null;
  const hc=headerColor||T.teal;
  const HG=8; // handle grip thickness for edges
  const CS=14; // corner size
  // helper to attach mouse + touch handler
  const handle=(edge,style,extra={})=>{const fn=onResizeStart(edge);return{onMouseDown:fn,onTouchStart:fn,style:{position:"absolute",touchAction:"none",zIndex:3,...style,...extra}};};
  return(<div style={{position:"absolute",left:panel.x,top:panel.y,width:panel.w,height:panel.h,zIndex:panel.z||1,background:T.card,border:`1px solid ${T.border}`,borderRadius:4,boxShadow:"0 4px 16px rgba(0,0,0,0.18)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
    <div ref={dragRef} onMouseDown={onDragStart} onTouchStart={onDragStart} onMouseEnter={()=>bringToFront(panel.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:T.card2,borderBottom:`2px solid ${hc}`,cursor:"grab",userSelect:"none",touchAction:"none",flexShrink:0}}>
      <span style={{fontSize:11,fontFamily:MO,color:T.muted,letterSpacing:1}}>⋮⋮</span>
      <span style={{flex:1,fontSize:13,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{panel.title}</span>
      <button onClick={e=>{e.stopPropagation();update(panel.id,{minimized:true});}} title="Minimize" style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,padding:"2px 6px",lineHeight:1}}>—</button>
    </div>
    <div style={{flex:1,minHeight:0,overflow:"hidden",position:"relative"}}>{children}</div>
    {/* edges */}
    <div {...handle("n",{top:0,left:CS,right:CS,height:HG,cursor:"ns-resize"})} title="Resize"/>
    <div {...handle("s",{bottom:0,left:CS,right:CS,height:HG,cursor:"ns-resize"})} title="Resize"/>
    <div {...handle("e",{top:CS,bottom:CS,right:0,width:HG,cursor:"ew-resize"})} title="Resize"/>
    <div {...handle("w",{top:CS,bottom:CS,left:0,width:HG,cursor:"ew-resize"})} title="Resize"/>
    {/* corners */}
    <div {...handle("nw",{top:0,left:0,width:CS,height:CS,cursor:"nwse-resize"})} title="Resize"/>
    <div {...handle("ne",{top:0,right:0,width:CS,height:CS,cursor:"nesw-resize"})} title="Resize"/>
    <div {...handle("sw",{bottom:0,left:0,width:18,height:18,cursor:"nesw-resize"})} title="Resize">
      <svg width="18" height="18" viewBox="0 0 18 18" style={{pointerEvents:"none"}}><path d="M2 16 L2 10 M2 16 L8 16 M2 16 L14 16 M2 16 L2 4" stroke={T.muted} strokeWidth="1.5" fill="none"/></svg>
    </div>
    <div {...handle("se",{bottom:0,right:0,width:18,height:18,cursor:"nwse-resize"})} title="Resize">
      <svg width="18" height="18" viewBox="0 0 18 18" style={{pointerEvents:"none"}}><path d="M16 16 L16 10 M16 16 L10 16 M16 16 L4 16 M16 16 L16 4" stroke={T.muted} strokeWidth="1.5" fill="none"/></svg>
    </div>
  </div>);
}

function MinimizedTray({panels,update,T}) {
  const mins=panels.filter(p=>p.minimized);
  if(mins.length===0)return null;
  return(<div style={{position:"absolute",left:8,bottom:8,display:"flex",gap:6,zIndex:9999,flexWrap:"wrap"}}>
    {mins.map(p=><button key={p.id} onClick={()=>update(p.id,{minimized:false})} title={`Restore ${p.title}`} style={{padding:"6px 12px",background:T.card,border:`1px solid ${T.border}`,borderTop:`2px solid ${T.teal}`,borderRadius:3,color:T.text,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",fontFamily:SA,boxShadow:"0 2px 6px rgba(0,0,0,0.15)"}}>▢ {p.title}</button>)}
  </div>);
}

// ── OR Zone Map with floating tooltip ──
function ORZoneMap({T,items,height=180}) {
  const [hover,setHover]=useState(null);
  const [expanded,setExpanded]=useState(false);
  const mapRef=useRef(null);
  const bM=items.filter(i=>i.z==="mayo").reduce((s,i)=>s+i.init,0),bB=items.filter(i=>i.z==="back_table").reduce((s,i)=>s+i.init,0);
  // Origin tracking: how many from each home zone are in each current zone
  const mOnM=items.filter(i=>i.z==="mayo").reduce((s,i)=>s+i.loc.m,0);           // mayo-origin on mayo
  const mOnB=items.filter(i=>i.z==="mayo").reduce((s,i)=>s+i.loc.b,0);           // mayo-origin on back table
  const mOnP=items.filter(i=>i.z==="mayo").reduce((s,i)=>s+i.loc.p,0);           // mayo-origin on patient
  const mOnD=items.filter(i=>i.z==="mayo").reduce((s,i)=>s+i.loc.d,0);           // mayo-origin disposed
  const bOnM=items.filter(i=>i.z==="back_table").reduce((s,i)=>s+i.loc.m,0);     // back-origin on mayo
  const bOnB=items.filter(i=>i.z==="back_table").reduce((s,i)=>s+i.loc.b,0);     // back-origin on back table
  const bOnP=items.filter(i=>i.z==="back_table").reduce((s,i)=>s+i.loc.p,0);     // back-origin on patient
  const bOnD=items.filter(i=>i.z==="back_table").reduce((s,i)=>s+i.loc.d,0);     // back-origin disposed
  const MC=T.green, BC=T.blue; // Mayo=green, BackTable=blue
  // Origin-colored count display: shows each origin's count in its color
  const originCount=(mayoN,backN,fs=22)=>{const parts=[];if(mayoN>0)parts.push(<span key="m" style={{color:MC,fontWeight:800}}>{mayoN}</span>);if(backN>0)parts.push(<span key="b" style={{color:BC,fontWeight:800}}>{backN}</span>);if(!parts.length)return <span style={{fontWeight:800,opacity:0.4}}>0</span>;return <span style={{fontSize:fs,fontFamily:MO,display:"inline-flex",alignItems:"baseline",gap:4}}>{parts.reduce((a,c,i)=>i===0?[c]:[...a,<span key={`d${i}`} style={{color:T.muted,fontSize:fs*0.6,fontWeight:400}}>+</span>,c],[])}</span>;};
  const zoneKey={m:"mayo",b:"back_table"};
  const tipData=(zk)=>{
    const cats=[{l:"Sponges",k:"sponge",i:"◼",c:T.teal},{l:"Needles",k:"needle",i:"▲",c:T.purple},{l:"Sharps",k:"sharp",i:"◆",c:T.amber},{l:"Disposables",k:"pack",i:"▣",c:T.green},{l:"Instruments",k:"instrument",i:"◎",c:T.cyan}];
    const isHomeZone=(zk==="m"||zk==="b");
    if(isHomeZone){
      // For mayo/back_table: show only what's MISSING (moved away)
      return cats.map(c=>{
        const missing=items.filter(i=>i.cat===c.k&&i.z===zoneKey[zk]&&(i.loc.p>0||i.loc.d>0||(zk==="b"&&i.loc.m>0)));
        if(!missing.length)return null;
        const totalMissing=missing.reduce((s,i)=>s+i.loc.p+i.loc.d+(zk==="b"?i.loc.m:0),0);
        return{...c,totalMissing,items:[],
          missing:missing.map(i=>{const parts=[];if(i.loc.p>0)parts.push({count:i.loc.p,where:"patient",color:T.purple});if(i.loc.d>0)parts.push({count:i.loc.d,where:"disposed",color:T.amber});if(zk==="b"&&i.loc.m>0)parts.push({count:i.loc.m,where:"mayo",color:T.teal});return{n:i.n,parts};})
        };
      }).filter(Boolean);
    }
    // For patient/disposed: show what's there
    return cats.map(c=>{
      const its=items.filter(i=>i.cat===c.k&&i.loc[zk]>0);
      if(!its.length)return null;
      return{...c,items:its.map(i=>({n:i.n,count:i.loc[zk]})),missing:[]};
    }).filter(Boolean);
  };
  const zoneNames={m:"Mayo Stand",b:"Back Table",p:"Patient",d:"Disposed"};
  const zoneColors={m:MC,b:BC,p:T.purple,d:T.amber};
  const onZoneEnter=(zk)=>{setHover(zk);};
  const zoneDiv=(zk,pos,label,count,color,extra)=>(<div onMouseEnter={()=>onZoneEnter(zk)} onMouseLeave={()=>setHover(null)} style={{position:"absolute",...pos,border:`2px solid ${color}44`,borderRadius:3,background:hover===zk?color+"22":color+"08",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:2,transition:"background .15s"}}><span style={{fontSize:11,fontFamily:MO,color,fontWeight:700,textTransform:"uppercase",letterSpacing:1,pointerEvents:"none"}}>{label}</span><span style={{fontSize:22,fontFamily:MO,fontWeight:800,pointerEvents:"none"}}>{count}</span>{extra}</div>);
  const tipD=hover?tipData(hover):[];
  const isFlex=height==="100%";
  return(<div ref={mapRef} style={{position:"relative",height:isFlex?"100%":undefined,display:isFlex?"flex":undefined,flexDirection:isFlex?"column":undefined}}>
    <div style={{background:T.n==="dark"?"#0a0f14":"#e2e8f0",borderRadius:3,height:isFlex?"100%":height,flex:isFlex?1:undefined,minHeight:isFlex?0:undefined,position:"relative",overflow:"hidden",border:`1px solid ${T.border}`}}>
      {zoneDiv("p",{left:"20%",top:"20%",width:"40%",height:"55%"},"PATIENT",originCount(mOnP,bOnP),T.purple,<span style={{fontSize:8,fontFamily:MO,color:T.purple+"88",pointerEvents:"none"}}>pieces</span>)}
      {zoneDiv("m",{left:"4%",top:"5%",width:"14%",height:"35%"},"MAYO",originCount(mOnM,bOnM),MC,bM>0?<span style={{fontSize:10,fontFamily:MO,color:T.muted,pointerEvents:"none"}}>baseline <span style={{color:MC,fontWeight:700}}>{bM}</span></span>:null)}
      {zoneDiv("b",{left:"65%",top:"8%",width:"30%",height:"55%"},"BACK TABLE",originCount(mOnB,bOnB),BC,bB>0?<span style={{fontSize:10,fontFamily:MO,color:T.muted,pointerEvents:"none"}}>baseline <span style={{color:BC,fontWeight:700}}>{bB}</span></span>:null)}
      {zoneDiv("d",{left:"70%",top:"68%",width:"22%",height:"26%"},"DISPOSED",originCount(mOnD,bOnD),T.amber)}
      {[{x:32,y:28,r:"SRG"},{x:48,y:28,r:"AST"},{x:25,y:68,r:"SCR"},{x:62,y:50,r:"CIR"}].map((s,i)=>(<div key={i} style={{position:"absolute",left:`${s.x}%`,top:`${s.y}%`,transform:"translate(-50%,-50%)",width:20,height:20,borderRadius:"50%",background:T.cyan+"18",border:`1px solid ${T.cyan}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontFamily:MO,color:T.cyan,fontWeight:800,pointerEvents:"none"}}>{s.r}</div>))}
      <div style={{position:"absolute",left:"3%",top:"3%",width:"60%",height:"92%",border:`1px dashed ${T.teal}33`,borderRadius:3,pointerEvents:"none"}}><span style={{position:"absolute",top:-1,left:6,fontSize:8,fontFamily:MO,color:T.teal,background:T.n==="dark"?"#0a0f14":"#e2e8f0",padding:"0 3px"}}>STERILE FIELD</span></div>
    </div>
    {/* Floating tooltip popup */}
    {hover&&tipD.length>0&&<div onMouseEnter={()=>setHover(hover)} onMouseLeave={()=>setHover(null)} style={{position:"absolute",zIndex:100,background:T.card,border:`2px solid ${zoneColors[hover]}`,borderRadius:4,padding:"8px 10px",overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.25)",...(isFlex?{left:8,bottom:8,maxWidth:"calc(100% - 16px)",width:"max-content",minWidth:200,maxHeight:"60%"}:{left:0,top:height+4,minWidth:220,maxWidth:350,maxHeight:"50vh"})}}>
      <div style={{fontSize:11,fontFamily:MO,fontWeight:700,color:zoneColors[hover],marginBottom:4,letterSpacing:1,borderBottom:`1px solid ${T.border}`,paddingBottom:3}}>{zoneNames[hover]?.toUpperCase()}</div>
      {tipD.map((cat,ci)=>{const hasMissing=cat.missing&&cat.missing.length>0;const hasItems=cat.items&&cat.items.length>0;return(<div key={ci} style={{marginBottom:ci<tipD.length-1?6:0}}>
        <div style={{fontSize:10,fontFamily:MO,color:cat.c,fontWeight:600,marginBottom:2}}><span style={{marginRight:3}}>{cat.i}</span>{cat.l}{cat.totalMissing?` — ${cat.totalMissing} missing`:hasItems?` (${cat.items.reduce((s,i)=>s+i.count,0)})`:""}</div>
        {hasItems&&cat.items.map((item,ii)=>(<div key={ii} style={{fontSize:11,fontFamily:SA,color:T.soft,paddingLeft:14,lineHeight:1.4}}>{item.count}× {item.n.length>40?item.n.substring(0,40)+"…":item.n}</div>))}
        {hasMissing&&cat.missing.map((m,mi)=>(<div key={mi} style={{fontSize:11,fontFamily:SA,paddingLeft:14,lineHeight:1.5}}>
          <span style={{color:T.text}}>{m.n.length>35?m.n.substring(0,35)+"…":m.n}</span>
          <span style={{marginLeft:6}}>{m.parts.map((p,pi)=>(<span key={pi} style={{fontSize:10,fontFamily:MO,color:p.color,marginLeft:pi?4:0}}>{p.count}→{p.where}</span>))}</span>
        </div>))}
      </div>);})}
    </div>}
  </div>);
}

/* ══════════════════════════════════════════════════════════
   INVENTORY SCREEN
   ══════════════════════════════════════════════════════════ */
function InvScreen({T,pendingItem,onPendingClear,elapsed=0,itemsOverride=null,itemEventsOverride=null,evtsData=null,phasesData=null,isArchive=false,kitName=null}) {
  const _EVT_INV=evtsData||EVT;const _PH_INV=phasesData||PHASES;
  const [activeCat,setActiveCat]=useState("sponge");
  const [activeZone,setActiveZone]=useState("mayo");
  const [selItem,setSelItem]=useState(null);

  // Event-driven inventory state
  const { items: INV, visibleItems: VIS } = useInventoryState(elapsed,itemsOverride,itemEventsOverride);

  // Handle incoming item from Timeline alerts
  useEffect(()=>{
    if(pendingItem){
      const it=INV.find(i=>i.id===pendingItem);
      if(it){
        setActiveCat(it.cat);
        const isM=it.z==="mayo"||it.loc.m>0;
        setActiveZone(isM||it.cat!=="instrument"?"mayo":"back");
        setSelItem(pendingItem);
      }
      onPendingClear&&onPendingClear();
    }
  },[pendingItem]);
  const [leftW,setLeftW_]=useState(()=>parseInt(localStorage.getItem("inv_leftW"))||320);
  const setLeftW=v=>{setLeftW_(v);localStorage.setItem("inv_leftW",v);};
  // Floating panels for Inventory screen
  const invPanels=useFloatingPanels("inv_panels_v1",[
    {id:"categories",title:"Categories",x:8,y:8,w:300,h:560,minimized:false,z:1},
    {id:"content",title:"Content",x:316,y:8,w:560,h:560,minimized:false,z:2},
    {id:"location",title:"Surgical Item — Real Time Location",x:884,y:8,w:380,h:280,minimized:false,z:3},
    {id:"counts",title:"Counts",x:884,y:296,w:380,h:140,minimized:false,z:4},
    {id:"feed",title:"Event Feed",x:884,y:444,w:380,h:124,minimized:false,z:5},
  ]);
  const [rightW,setRightW_]=useState(()=>parseInt(localStorage.getItem("inv_rightW"))||300);
  const setRightW=v=>{setRightW_(v);localStorage.setItem("inv_rightW",v);};
  const [lightbox,setLightbox]=useState(null); // {src, time, note}
  const feedRef=useRef(null);
  const tot=VIS.length;
  const cT=CATS.map(c=>{const it=VIS.filter(i=>i.cat===c.key);return{...c,init:it.reduce((s,i)=>s+i.init,0),onMayo:it.reduce((s,i)=>s+i.loc.m,0),onBack:it.reduce((s,i)=>s+i.loc.b,0),onPatient:it.reduce((s,i)=>s+i.loc.p,0),dsp:it.reduce((s,i)=>s+i.loc.d,0)};});
  const tI=VIS.reduce((s,i)=>s+i.init,0),tM=VIS.reduce((s,i)=>s+i.loc.m,0),tB=VIS.reduce((s,i)=>s+i.loc.b,0),tP=VIS.reduce((s,i)=>s+i.loc.p,0),tD=VIS.reduce((s,i)=>s+i.loc.d,0);
  const catItems=activeCat?VIS.filter(it=>it.cat===activeCat):[];
  const isTimeline=activeCat&&activeCat!=="instrument";
  const activeCatData=activeCat?CATS.find(c=>c.key===activeCat):null;

  // Zone grouping: Mayo = all non-instrument categories + mayo instruments, Back Table = remaining instruments
  const ZONES=[{key:"mayo",label:"Mayo Stand"},{key:"back",label:"Back Table"}];
  const activeZoneData=ZONES.find(z=>z.key===activeZone);
  const zoneItems=activeZone==="mayo"
    ? VIS.filter(it=>it.cat!=="instrument"||it.z==="mayo"||it.loc.m>0)
    : VIS.filter(it=>it.cat==="instrument"&&it.z!=="mayo");
  const zoneCats=CATS.map(c=>{const it=zoneItems.filter(i=>i.cat===c.key);return{...c,count:it.length,init:it.reduce((s,i)=>s+i.init,0),onMayo:it.reduce((s,i)=>s+i.loc.m,0),onBack:it.reduce((s,i)=>s+i.loc.b,0),onPatient:it.reduce((s,i)=>s+i.loc.p,0),dsp:it.reduce((s,i)=>s+i.loc.d,0)};}).filter(c=>c.count>0);

  return(
    <div style={{position:"relative",height:"100%",minHeight:0,overflow:"hidden"}}>
      {/* CATEGORIES panel */}
      <FloatingPanel panel={invPanels.panels.find(p=>p.id==="categories")} update={invPanels.update} bringToFront={invPanels.bringToFront} onInteractStart={invPanels.showGrid} onInteractEnd={invPanels.hideGrid} T={T} headerColor={T.teal}><div style={{height:"100%",display:"flex",flexDirection:"column",gap:8,minHeight:0,padding:10,overflow:"auto"}}>
        <div style={{flexShrink:0}}>
          <div style={{fontSize:16,fontWeight:700,color:T.teal,fontFamily:SA,cursor:"pointer",textDecoration:"underline"}} onClick={()=>{import("./kitCatalog").then(m=>window.open(m.getKitPdf(kitName||"Masectomy Tray"),"_blank"));}}>{kitName||"Masectomy Tray"}</div>
          <div style={{fontSize:12,fontFamily:MO,color:T.muted}}>{VIS.length} types · {tI} pieces</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:4,flexShrink:0}}>{[{l:"Total",v:tI,c:T.text},{l:"Mayo",v:tM,c:T.teal},{l:"Back Tbl",v:tB,c:T.blue},{l:"Patient",v:tP,c:T.purple},{l:"Disposed",v:tD,c:T.amber}].map((m,i)=>(<Cd key={i} T={T} style={{textAlign:"center",padding:"8px 4px"}}><div style={{fontSize:24,fontWeight:800,fontFamily:MO,color:m.c,lineHeight:1}}>{m.v}</div><div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginTop:3}}>{m.l}</div></Cd>))}</div>

        {/* Mayo Stand — all categories */}
        {(()=>{const mayoItems=VIS.filter(it=>it.cat!=="instrument"||it.z==="mayo"||it.loc.m>0);const mayoCats=CATS.map(c=>{const it=mayoItems.filter(i=>i.cat===c.key);return{...c,count:it.length,init:it.reduce((s,i)=>s+i.init,0),onMayo:it.reduce((s,i)=>s+i.loc.m,0),onBack:it.reduce((s,i)=>s+i.loc.b,0),onPatient:it.reduce((s,i)=>s+i.loc.p,0),dsp:it.reduce((s,i)=>s+i.loc.d,0)};}).filter(c=>c.count>0);return(
        <Cd T={T} style={{flexShrink:0,overflow:"hidden"}}>
          <div style={{padding:"6px 10px",background:T.card2,borderBottom:`2px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,fontWeight:700,fontFamily:MO,color:T.teal}}>MAYO STAND</span>
            <span style={{fontSize:11,fontFamily:MO,color:T.muted}}>{mayoItems.length} types · {mayoItems.reduce((s,i)=>s+i.init,0)} pcs</span>
          </div>
          <div>
            {mayoCats.map(ct=>{const col=T[ct.ck];const active=activeCat===ct.key&&activeZone==="mayo";
              if(ct.key==="instrument"){
                const mayoInst=mayoItems.filter(it=>it.cat==="instrument");
                const subTypes=[{key:"Retractor",label:"Retractors",icon:"⊏"},{key:"Forceps",label:"Forceps",icon:"⊣"},{key:"Handle",label:"Knife Handles",icon:"⊤"},{key:"Clamp|Towel Clip|Sponge Stick",label:"Clamps",icon:"⊂"},{key:"Needleholder",label:"Needle Holders",icon:"⊥"},{key:"Scissors",label:"Scissors",icon:"✂"}];
                return(<div key="instrument">
                  <div style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,background:active?col+"08":"transparent"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:13,fontWeight:600,color:T.soft,fontFamily:SA}}><span style={{color:col,marginRight:5}}>◎</span>Instruments</span>
                    </div>
                    <div style={{display:"flex",gap:6,marginTop:4,fontSize:11,fontFamily:MO,flexWrap:"wrap"}}>
                      <span style={{color:T.muted}}>{mayoInst.length} types</span>
                      <span style={{color:T.teal}}>Mayo:{mayoInst.reduce((s,i)=>s+i.loc.m,0)}</span>
                      {mayoInst.reduce((s,i)=>s+i.loc.p,0)>0&&<span style={{color:T.purple}}>Patient:{mayoInst.reduce((s,i)=>s+i.loc.p,0)}</span>}
                    </div>
                  </div>
                  {subTypes.map(st=>{const items=mayoInst.filter(it=>new RegExp(st.key).test(it.n));if(!items.length)return null;const stPatient=items.reduce((s,i)=>s+i.loc.p,0);return(
                    <div key={st.label} onClick={()=>{setActiveZone("mayo");setActiveCat("instrument");setSelItem(null);}} style={{padding:"6px 10px 6px 24px",cursor:"pointer",borderBottom:`1px solid ${T.border}`,borderLeft:active?`4px solid ${col}`:"4px solid transparent",background:active?col+"06":"transparent"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:12,color:T.soft,fontFamily:SA}}>{st.icon} {st.label}</span>
                        <span style={{fontSize:11,fontFamily:MO,color:T.muted}}>{items.length} · {items.reduce((s,i)=>s+i.init,0)} pcs{stPatient>0?` · `:""}</span>
                      </div>
                      {stPatient>0&&<div style={{fontSize:11,fontFamily:MO,color:T.purple,marginTop:2,paddingLeft:16}}>Patient:{stPatient}</div>}
                    </div>
                  );}).filter(Boolean)}
                </div>);
              }
              return(
              <div key={ct.key} onClick={()=>{setActiveZone("mayo");setActiveCat(ct.key);setSelItem(null);}} style={{padding:"8px 10px",cursor:"pointer",borderBottom:`1px solid ${T.border}`,borderLeft:active?`4px solid ${col}`:"4px solid transparent",background:active?col+"12":"transparent"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:active?700:500,color:active?T.text:T.soft,fontFamily:SA}}><span style={{color:col,marginRight:5}}>{ct.icon}</span>{ct.label}</span>
                </div>
                <div style={{fontSize:11,fontFamily:MO,color:T.muted,marginTop:3}}>{ct.count} types · {ct.init} pieces</div>
                {ct.dsp>0&&<div style={{fontSize:11,fontFamily:MO,color:T.amber,marginTop:2}}>{ct.dsp} disposed</div>}
              </div>
            );})}
          </div>
        </Cd>);})()}

        {/* Back Table — instruments only */}
        {(()=>{const btItems=VIS.filter(it=>it.cat==="instrument"&&it.z!=="mayo");return(
        <Cd T={T} style={{flex:1,minHeight:0,overflow:"hidden"}}>
          <div style={{padding:"6px 10px",background:T.card2,borderBottom:`2px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,fontWeight:700,fontFamily:MO,color:T.blue}}>BACK TABLE</span>
            <span style={{fontSize:11,fontFamily:MO,color:T.muted}}>{btItems.length} types · {btItems.reduce((s,i)=>s+i.init,0)} pcs</span>
          </div>
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>
            {(()=>{const subTypes=[{key:"Retractor",label:"Retractors",icon:"⊏"},{key:"Forceps",label:"Forceps",icon:"⊣"},{key:"Handle",label:"Knife Handles",icon:"⊤"},{key:"Clamp|Towel Clip|Sponge Stick",label:"Clamps",icon:"⊂"},{key:"Needleholder",label:"Needle Holders",icon:"⊥"},{key:"Scissors",label:"Scissors",icon:"✂"},{key:"Marker",label:"Cookie Cutters",icon:"◎"}];return subTypes.map(st=>{const items=btItems.filter(it=>new RegExp(st.key).test(it.n));if(!items.length)return null;const active=activeCat==="instrument"&&activeZone==="back";return(
              <div key={st.label} onClick={()=>{setActiveZone("back");setActiveCat("instrument");setSelItem(null);}} style={{padding:"8px 10px",cursor:"pointer",borderBottom:`1px solid ${T.border}`,borderLeft:active?`4px solid ${T.cyan}`:"4px solid transparent",background:active?T.cyan+"06":"transparent"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:500,color:T.soft,fontFamily:SA}}>{st.icon} {st.label}</span>
                  <span style={{fontSize:11,fontFamily:MO,color:T.muted}}>{items.length} types · {items.reduce((s,i)=>s+i.init,0)} pcs</span>
                </div>
              </div>
            );}).filter(Boolean)})()}
          </div>
        </Cd>);})()}

      </div></FloatingPanel>

      {/* CONTENT panel */}
      <FloatingPanel panel={invPanels.panels.find(p=>p.id==="content")} update={invPanels.update} bringToFront={invPanels.bringToFront} onInteractStart={invPanels.showGrid} onInteractEnd={invPanels.hideGrid} T={T} headerColor={T.purple}><div style={{height:"100%",display:"flex",flexDirection:"column"}}>
        {activeCat?(<>
        {(()=>{const zi=zoneItems.filter(it=>it.cat===activeCat);const zM=zi.reduce((s,i)=>s+i.loc.m,0);const zP=zi.reduce((s,i)=>s+i.loc.p,0);const zD=zi.reduce((s,i)=>s+i.loc.d,0);const zOpened=activeCat==="pack"?zi.reduce((s,i)=>((itemEventsOverride||ITEM_EVENTS)[i.id]||[]).filter(e=>e.type==="opened"&&e.at<=elapsed).length+s,0):0;return(
        <div style={{padding:"8px 12px",borderBottom:`2px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.card2}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:SA}}><span style={{color:T[activeCatData.ck],marginRight:6}}>{activeCatData.icon}</span>{activeCatData.label}</span>
            <span style={{fontSize:12,fontFamily:MO,color:T.muted}}>{activeZone==="mayo"?"Mayo Stand":"Back Table"} · {zi.length} types · {zi.reduce((s,i)=>s+i.init,0)} pcs</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,fontFamily:MO}}>
            {zM>0&&<span style={{color:T.teal}}>Mayo:{zM}</span>}
            {zP>0&&<span style={{color:T.purple}}>Patient:{zP}</span>}
            {zOpened>0&&<span style={{color:T.cyan}}>Opened:{zOpened}</span>}
            {zD>0&&<span style={{color:T.amber}}>Disposed:{zD}</span>}
          </div>
        </div>);})()}
        <div style={{flex:1,overflowY:"auto",minHeight:0}}>
          {activeCat==="instrument"?(
            /* Instruments: zone-specific table */
            activeZone==="mayo"?(
            /* Mayo instruments: clickable rows with expandable events */
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:15,fontFamily:SA}}><thead><tr style={{background:T.card2,position:"sticky",top:0,zIndex:1}}>{["#","ID","Instrument","Count","On Mayo","On Patient","Status",""].map(h=><th key={h} style={{padding:"7px 8px",textAlign:(h==="#"||h==="Count"||h==="On Mayo"||h==="On Patient"||h==="Status"||h==="")?"center":"left",fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:.5,borderBottom:`2px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontWeight:600,width:h==="#"?36:h===""?30:h==="Count"||h==="On Mayo"||h==="On Patient"||h==="Status"?80:undefined}}>{h}</th>)}</tr></thead><tbody>{zoneItems.filter(it=>it.cat==="instrument").map((it,i)=>{const ok=it.loc.m+it.loc.p===it.init;const evts=((itemEventsOverride||ITEM_EVENTS)[it.id]||[]).filter(e=>e.at<=elapsed);const expanded=selItem===it.id;const hasEvents=evts.length>0;return(<React.Fragment key={it.id}><tr style={{background:expanded?T.teal+"08":i%2===0?T.card:T.card2,cursor:hasEvents?"pointer":"default"}} onClick={()=>hasEvents&&setSelItem(expanded?null:it.id)}><td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:12,color:T.muted,textAlign:"center"}}>{i+1}</td><td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:12,color:T.muted}}>{it.id}</td><td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontWeight:500,fontSize:14}}>{it.n}</td><td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,textAlign:"center",fontFamily:MO,fontSize:14,fontWeight:700}}>{it.init}</td><td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,textAlign:"center",fontFamily:MO,fontSize:14,color:T.teal,fontWeight:600}}>{it.loc.m}</td><td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,textAlign:"center",fontFamily:MO,fontSize:14,color:it.loc.p>0?T.purple:T.faint,fontWeight:600}}>{it.loc.p||"—"}</td><td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,textAlign:"center"}}>{ok?<P color={T.green} T={T} small>OK</P>:<P color={T.amber} T={T} small filled>OK</P>}</td><td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,textAlign:"center",color:hasEvents?T.muted:T.faint,fontSize:12}}>{hasEvents?(expanded?"▼":"▶"):"—"}</td></tr>
{expanded&&<tr><td colSpan={8} style={{padding:0,background:T.card2,borderBottom:`2px solid ${T.teal}33`}}>
<table style={{width:"100%",borderCollapse:"collapse",fontSize:13,fontFamily:SA,margin:0}}><thead><tr style={{background:T.card2}}>{["Time","Event","Type",""].map(h=><th key={h} style={{padding:"5px 10px",textAlign:"left",fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontWeight:600,width:h==="Time"?60:h==="Type"?90:h===""?100:undefined}}>{h}</th>)}</tr></thead><tbody>{evts.map((ev,ei)=>{const ec=ev.type==="baseline"?T.teal:ev.type==="to_patient"?T.purple:ev.type==="to_mayo"?T.teal:ev.type==="alert"?T.red:T.green;const label=ev.type==="baseline"?"BASELINE":ev.type==="to_patient"?"→ PATIENT":ev.type==="to_mayo"?"← MAYO":ev.type==="alert"?"ALERT":"RESOLVED";return(<tr key={ei} style={{background:ei%2===0?T.card:T.card2}}><td style={{padding:"5px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:12,color:T.muted}}>{ev.t}</td><td style={{padding:"5px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontSize:13}}>{ev.note}</td><td style={{padding:"5px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,textAlign:"center"}}><P color={ec} T={T} small filled>{label}</P></td><td style={{padding:"5px 10px",borderBottom:`1px solid ${T.border}`}}>{ev.frame?<div onClick={e2=>{e2.stopPropagation();setLightbox({src:ev.frame.split("#")[0],time:parseFloat((ev.frame.split("t=")[1])||"0"),note:ev.note});}} style={{width:80,height:45,borderRadius:2,overflow:"hidden",border:`1px solid ${T.border}`,cursor:"pointer"}}><video src={ev.frame.split("#")[0]} muted style={{width:"100%",height:"100%",objectFit:"cover"}} onLoadedData={e=>{const t=parseFloat((ev.frame.split("t=")[1])||"0");e.target.currentTime=t;}}/></div>:<span style={{fontSize:11,color:T.muted}}>—</span>}</td></tr>);})}</tbody></table>
</td></tr>}
</React.Fragment>);})}</tbody></table>
            ):(
            /* Back table instruments: clickable with expandable events */
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:15,fontFamily:SA}}><thead><tr style={{background:T.card2,position:"sticky",top:0,zIndex:1}}>{(isArchive?["#","ID","Instrument","Count","On Table","To Mayo","Disposed","Status"]:["#","ID","Instrument","Count","On Table","To Mayo","Status",""]).map(h=><th key={h} style={{padding:"7px 8px",textAlign:(h==="#"||h==="Count"||h==="On Table"||h==="To Mayo"||h==="Disposed"||h==="Status"||h==="")?"center":"left",fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:.5,borderBottom:`2px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontWeight:600,width:h==="#"?36:h===""?30:h==="Count"||h==="On Table"||h==="To Mayo"||h==="Disposed"||h==="Status"?70:undefined}}>{h}</th>)}</tr></thead><tbody>{zoneItems.filter(it=>it.cat==="instrument").map((it,i)=>{const evts=((itemEventsOverride||ITEM_EVENTS)[it.id]||[]).filter(e=>e.at<=elapsed);const expanded=selItem===it.id;const hasEvents=evts.length>0;return(<React.Fragment key={it.id}><tr style={{background:expanded?T.blue+"08":i%2===0?T.card:T.card2,cursor:hasEvents?"pointer":"default"}} onClick={()=>hasEvents&&setSelItem(expanded?null:it.id)}><td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:12,color:T.muted,textAlign:"center"}}>{i+1}</td><td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:12,color:T.muted}}>{it.id}</td><td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontWeight:500,fontSize:14}}>{it.n}</td><td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,textAlign:"center",fontFamily:MO,fontSize:14,fontWeight:700}}>{it.init}</td><td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,textAlign:"center",fontFamily:MO,fontSize:14,color:T.blue,fontWeight:600}}>{it.loc.b}</td><td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,textAlign:"center",fontFamily:MO,fontSize:14,color:it.loc.m>0?T.teal:T.faint,fontWeight:600}}>{it.loc.m||"—"}</td>{isArchive?<td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,textAlign:"center",fontFamily:MO,fontSize:14,color:it.loc.d>0?T.amber:T.faint,fontWeight:600}}>{it.loc.d||"—"}</td>:null}<td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:isArchive?"none":`1px solid ${T.border}`,textAlign:"center"}}><P color={it.loc.m>0?T.teal:it.loc.d>0?T.amber:T.green} T={T} small>{it.loc.m>0?"MOVED":it.loc.d>0?"DISPOSED":"ON TBL"}</P></td>{!isArchive&&<td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,textAlign:"center",color:hasEvents?T.muted:T.faint,fontSize:12}}>{hasEvents?(expanded?"▼":"▶"):"—"}</td>}</tr>
{expanded&&<tr><td colSpan={8} style={{padding:0,background:T.card2,borderBottom:`2px solid ${T.blue}33`}}>
<table style={{width:"100%",borderCollapse:"collapse",fontSize:13,fontFamily:SA}}><thead><tr style={{background:T.card2}}>{["Time","Event","Type",""].map(h=><th key={h} style={{padding:"5px 10px",textAlign:"left",fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontWeight:600,width:h==="Time"?60:h==="Type"?90:h===""?100:undefined}}>{h}</th>)}</tr></thead><tbody>{evts.map((ev,ei)=>{const ec=ev.type==="baseline"?T.blue:ev.type==="to_patient"?T.purple:ev.type==="to_mayo"?T.teal:ev.type==="to_back"?T.blue:ev.type==="disposed"?T.amber:ev.type==="alert"?T.red:T.green;const label=ev.type==="baseline"?"BASELINE":ev.type==="to_patient"?"→ PATIENT":ev.type==="to_mayo"?"→ MAYO":ev.type==="to_back"?"→ BACK TBL":ev.type==="disposed"?"DISPOSED":ev.type==="alert"?"ALERT":"RESOLVED";return(<tr key={ei} style={{background:ei%2===0?T.card:T.card2}}><td style={{padding:"5px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:12,color:T.muted}}>{ev.t}</td><td style={{padding:"5px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontSize:13}}>{ev.note}</td><td style={{padding:"5px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,textAlign:"center"}}><P color={ec} T={T} small filled>{label}</P></td><td style={{padding:"5px 10px",borderBottom:`1px solid ${T.border}`}}>{ev.frame?<div onClick={e2=>{e2.stopPropagation();setLightbox({src:ev.frame.split("#")[0],time:parseFloat((ev.frame.split("t=")[1])||"0"),note:ev.note});}} style={{width:80,height:45,borderRadius:2,overflow:"hidden",border:`1px solid ${T.border}`,cursor:"pointer"}}><video src={ev.frame.split("#")[0]} muted style={{width:"100%",height:"100%",objectFit:"cover"}} onLoadedData={e=>{const t=parseFloat((ev.frame.split("t=")[1])||"0");e.target.currentTime=t;}}/></div>:<span style={{fontSize:11,color:T.muted}}>—</span>}</td></tr>);})}</tbody></table>
</td></tr>}
</React.Fragment>);})}</tbody></table>
            )
          ):(
            /* Sponges/Needles/Sharps/Disposables: timeline with captures */
            <div style={{padding:12}}>
              {zoneItems.filter(it=>it.cat===activeCat).map((it,idx)=>{const evts=((itemEventsOverride||ITEM_EVENTS)[it.id]||[]).filter(e=>e.at<=elapsed);const col=T[activeCatData.ck];const isSel=selItem===it.id;return(
                <div key={it.id} style={{marginBottom:12,border:`1px solid ${isSel?col:T.border}`,borderRadius:3,background:isSel?col+"08":T.card}}>
                  {/* Item header row */}
                  <div onClick={()=>setSelItem(isSel?null:it.id)} style={{padding:"10px 12px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:isSel?`1px solid ${T.border}`:"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:13,fontFamily:MO,color:T.muted,minWidth:24}}>{idx+1}</span>
                      <span style={{fontSize:15,fontWeight:600,color:T.text}}>{it.n}</span>
                      <span style={{fontSize:12,fontFamily:MO,color:T.muted}}>{it.id}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:12,fontFamily:MO}}>Total:<b>{it.init}</b></span>
                      <span style={{fontSize:12,fontFamily:MO,color:T.teal}}>Mayo:{it.loc.m}</span>
                      {it.loc.p>0&&<span style={{fontSize:12,fontFamily:MO,color:T.purple}}>Patient:{it.loc.p}</span>}
                      {it.loc.d>0&&<span style={{fontSize:12,fontFamily:MO,color:T.amber}}>Disposed:{it.loc.d}</span>}
                      {it.loc.m+it.loc.p+it.loc.d===it.init?<P color={T.green} T={T} small>OK</P>:<P color={T.amber} T={T} small filled>OK</P>}
                      <span style={{fontSize:14,color:T.muted}}>{isSel?"▼":"▶"}</span>
                    </div>
                  </div>
                  {/* Expanded timeline */}
                  {isSel&&evts.length>0&&(
                    <div style={{padding:"8px 12px 12px"}}>
                      {evts.map((ev,ei)=>{
                        const ec=ev.type==="baseline"?T.teal:ev.type==="disposed"?T.amber:ev.type==="alert"?T.red:ev.type==="to_patient"?T.purple:ev.type==="to_mayo"?T.teal:ev.type==="to_back"?T.blue:ev.type==="opened"?T.cyan:T.green;
                        const label=ev.type==="baseline"?"BASELINE":ev.type==="disposed"?"DISPOSED":ev.type==="alert"?"ALERT":ev.type==="to_patient"?"→ PATIENT":ev.type==="to_mayo"?"→ MAYO":ev.type==="to_back"?"→ BACK TBL":ev.type==="opened"?"OPENED":"RESOLVED";
                        return(
                          <div key={ei} style={{display:"flex",gap:10,marginBottom:8,position:"relative"}}>
                            {/* Timeline connector */}
                            {ei<evts.length-1&&<div style={{position:"absolute",left:15,top:28,width:2,height:"calc(100% - 6px)",background:T.border}}/>}
                            {/* Timeline dot */}
                            <div style={{width:32,height:32,borderRadius:2,flexShrink:0,zIndex:1,background:ec+"18",border:`2px solid ${ec}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <span style={{fontSize:12,color:ec,fontWeight:700}}>{ev.type==="baseline"?"▣":ev.type==="disposed"?"↗":ev.type==="alert"?"⚠":ev.type==="to_patient"?"→":ev.type==="to_mayo"?"←":ev.type==="to_back"?"↩":ev.type==="opened"?"◫":"✓"}</span>
                            </div>
                            {/* Event detail */}
                            <div style={{flex:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                <span style={{fontSize:13,fontFamily:MO,color:T.muted}}>{ev.t}</span>
                                <P color={ec} T={T} small filled>{label}</P>
                              </div>
                              <div style={{fontSize:14,color:T.text,lineHeight:1.4}}>{ev.note}</div>
                            </div>
                            {/* Video frame capture — click to enlarge */}
                            {ev.frame?<div onClick={e=>{e.stopPropagation();setLightbox({src:ev.frame.split("#")[0],time:parseFloat((ev.frame.split("t=")[1])||"0"),note:ev.note});}} style={{width:140,height:80,borderRadius:2,overflow:"hidden",border:`1px solid ${T.border}`,flexShrink:0,background:T.card2,cursor:"pointer"}}>
                              <video src={ev.frame.split("#")[0]} muted style={{width:"100%",height:"100%",objectFit:"cover"}} onLoadedData={e=>{const t=parseFloat((ev.frame.split("t=")[1])||"0");e.target.currentTime=t;}}/>
                            </div>:<div style={{width:140,height:80,borderRadius:2,border:`1px solid ${T.border}`,flexShrink:0,background:T.card2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:11,color:T.muted}}>—</span></div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isSel&&evts.length===0&&<div style={{padding:"12px",fontSize:13,color:T.muted,fontFamily:MO}}>No capture events recorded</div>}
                </div>
              );})}
            </div>
          )}
        </div>
        </>):(<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center",color:T.muted,fontFamily:MO}}><div style={{fontSize:16,marginBottom:8}}>Select a category from {activeZoneData.label}</div><div style={{fontSize:13}}>{zoneItems.length} types · {zoneItems.reduce((s,i)=>s+i.init,0)} pieces in this zone</div></div></div>)}
      </div></FloatingPanel>

      {/* LOCATION panel — Real Time Location */}
      <FloatingPanel panel={invPanels.panels.find(p=>p.id==="location")} update={invPanels.update} bringToFront={invPanels.bringToFront} onInteractStart={invPanels.showGrid} onInteractEnd={invPanels.hideGrid} T={T} headerColor={T.cyan}>
        <div style={{padding:10,height:"100%",display:"flex",flexDirection:"column",minHeight:0,boxSizing:"border-box"}}>
          <ORZoneMap T={T} items={VIS} height="100%"/>
        </div>
      </FloatingPanel>

      {/* COUNTS panel */}
      <FloatingPanel panel={invPanels.panels.find(p=>p.id==="counts")} update={invPanels.update} bringToFront={invPanels.bringToFront} onInteractStart={invPanels.showGrid} onInteractEnd={invPanels.hideGrid} T={T} headerColor={T.amber}>
        <div style={{padding:10,height:"100%",overflow:"auto"}}>
          {(()=>{
            const countPhases=_PH_INV.map((p,i)=>({...p,idx:i})).filter(p=>p.gate);
            const countEvents=_EVT_INV.filter(e=>e.tp==="gate"||e.tp==="ok");
            return(<div style={{display:"flex",flexDirection:"column",gap:2,marginTop:6}}>
              {countPhases.map(cp=>{
                const reached=elapsed>=cp.offsetStart;
                const nextOff=cp.idx+1<_PH_INV.length?_PH_INV[cp.idx+1].offsetStart:Infinity;
                const phEvents=countEvents.filter(e=>e.at>=cp.offsetStart&&(nextOff>cp.offsetStart?e.at<nextOff:e.at<=cp.offsetStart)&&e.at<=elapsed);
                const result=phEvents.find(e=>e.tp==="ok"&&(e.e.includes("BALANCED")||e.e.includes("balanced")));
                const col=T[cp.colorKey];
                return(<div key={cp.id} style={{padding:"5px 8px",borderRadius:3,background:reached?col+"0a":"transparent",border:`1px solid ${reached?col+"33":T.border}`,opacity:reached?1:0.4,display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:8,height:8,borderRadius:cp.gate?2:"50%",background:reached?(result?T.green:col):T.faint,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontFamily:MO,fontWeight:700,color:reached?col:T.muted}}>{cp.label}</div>
                    {reached&&phEvents.length>0?
                      <div style={{fontSize:11,fontFamily:SA,color:result?T.green:T.soft,marginTop:1}}>{result?result.e:phEvents[phEvents.length-1].e}</div>
                      :reached?<div style={{fontSize:11,fontFamily:MO,color:T.amber,marginTop:1}}>In progress...</div>
                      :<div style={{fontSize:11,fontFamily:MO,color:T.faint,marginTop:1}}>Pending</div>}
                  </div>
                  {reached&&result&&<span style={{fontSize:14,color:T.green,flexShrink:0}}>✓</span>}
                  {reached&&!result&&elapsed>=cp.offsetStart&&<span style={{fontSize:12,color:T.amber,flexShrink:0,animation:"bl 1s infinite"}}>●</span>}
                </div>);
              })}
            </div>);
          })()}
        </div></FloatingPanel>

      {/* EVENT FEED panel */}
      <FloatingPanel panel={invPanels.panels.find(p=>p.id==="feed")} update={invPanels.update} bringToFront={invPanels.bringToFront} onInteractStart={invPanels.showGrid} onInteractEnd={invPanels.hideGrid} T={T} headerColor={T.green}>
        {(()=>{
          // Merge EVT + all ITEM_EVENTS into unified chronological feed
          const catIcons={sponge:"◼",needle:"▲",sharp:"◆",pack:"▣",instrument:"◎"};
          const invPS=_PH_INV.map(p=>p.offsetStart);
          const invPhaseFor=(at)=>{for(let i=invPS.length-1;i>=0;i--){if(at>=invPS[i])return i;}return 0;};
          const _srcItemEvts=itemEventsOverride||ITEM_EVENTS;
          const itemEvts=Object.entries(_srcItemEvts).flatMap(([id,evts])=>{const it=VIS.find(i=>i.id===id);if(!it)return[];const icon=catIcons[it.cat]||"";return evts.filter(e=>e.type!=="baseline"&&e.at<=elapsed).map(e=>{const c=e.type==="disposed"?"warn":e.type==="alert"?"warn":e.type==="to_patient"?"info":e.type==="to_mayo"?"ok":e.type==="to_back"?"info":e.type==="opened"?"info":"info";const catData=CATS.find(ct=>ct.key===it.cat);return{t:e.t||realTime(e.at),at:e.at,s:6,e:e.note,tp:c,src:"item",itemId:id,icon,catColor:catData?catData.ck:"teal",itemName:it.n};});});
          const sysEvts=_EVT_INV.filter(e=>e.at<=elapsed).map(e=>({...e,src:"sys"}));
          const liveEvts=isArchive?[]:LIVE_EVENTS.filter(le=>le.at<=elapsed).map(le=>{const it=le.itemId?VIS.find(i=>i.id===le.itemId):null;const catData=it?CATS.find(c=>c.key===it.cat):null;return{t:liveEvtTime(le.at),at:le.at,s:6,e:le.e,tp:le.tp,src:"item",itemId:le.itemId||null,icon:it?catIcons[it.cat]||"":"",catColor:catData?catData.ck:"teal"};});
          const allEvts=[...sysEvts,...itemEvts,...liveEvts].sort((a,b)=>(a.t||"").localeCompare(b.t||""));
          return(
          <div style={{flex:1,padding:10,minHeight:0,overflow:"hidden",height:"100%",display:"flex",flexDirection:"column",boxSizing:"border-box"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexShrink:0}}>
              <Lb T={T}>Event Feed</Lb>
              <div style={{display:"flex",gap:4}}><P color={isArchive?T.muted:T.green} T={T} small>{isArchive?"Archived":"Live"}</P><span style={{fontSize:11,fontFamily:MO,color:T.muted}}>{allEvts.length}</span></div>
            </div>
            <div style={{flex:1,overflowY:"auto",minHeight:0}}>
              {allEvts.slice().reverse().map((e,i)=>{const c=e.tp==="gate"?T.amber:e.tp==="warn"?T.orange:e.tp==="ok"?T.green:T.teal;const hi=selItem&&e.itemId===selItem;const evtPh=e.at!=null?invPhaseFor(e.at):(e.s||0);const phC=T[STATES[evtPh]?.ck]||T.muted;return(
                <div key={i} data-hi={hi?"1":undefined} onClick={()=>{if(e.itemId){const it=VIS.find(x=>x.id===e.itemId);if(it){const cat=it.cat;const isM=it.z==="mayo"||it.loc.m>0;setActiveZone(isM||cat!=="instrument"?"mayo":"back");setActiveCat(cat);setSelItem(e.itemId);}}}} style={{display:"flex",alignItems:"flex-start",gap:6,padding:"4px 2px",borderBottom:`1px solid ${T.border}`,background:hi?T.teal+"15":phC+"18",borderLeft:hi?`3px solid ${T.teal}`:`3px solid ${phC}88`,opacity:selItem?(hi?1:0.35):1,cursor:e.itemId?"pointer":"default"}}>
                  <span style={{fontSize:12,fontFamily:MO,color:hi?T.text:T.muted,minWidth:38,paddingTop:2,fontWeight:hi?700:400}}>{e.t}</span>
                  {e.icon?<span style={{fontSize:12,color:T[e.catColor],minWidth:14,textAlign:"center",marginTop:2}}>{e.icon}</span>:<span style={{fontSize:10,color:c,minWidth:14,textAlign:"center",marginTop:2,fontWeight:700}}>SYS</span>}
                  <span style={{fontSize:13,color:hi?T.text:e.src==="sys"?T.text:T.soft,fontFamily:e.src==="sys"?MO:SA,flex:1,lineHeight:1.3,fontWeight:hi?600:e.src==="sys"?600:400,fontStyle:e.src==="sys"?"normal":"normal",borderLeft:e.src==="sys"?`2px solid ${c}`:"none",paddingLeft:e.src==="sys"?6:0}}>{e.e}</span>
                </div>
              );})}
            </div>
          </div>);
        })()}
      </FloatingPanel>

      <GridOverlay visible={invPanels.gridVisible}/>
      <MinimizedTray panels={invPanels.panels} update={invPanels.update} T={T}/>
      {/* Lightbox modal */}
      {lightbox&&<div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
        <div onClick={e=>e.stopPropagation()} style={{position:"relative",maxWidth:"80vw",maxHeight:"80vh",background:T.card,border:`2px solid ${T.border}`,borderRadius:3,overflow:"hidden",cursor:"default"}}>
          <video src={lightbox.src} muted controls autoPlay style={{display:"block",maxWidth:"80vw",maxHeight:"70vh",objectFit:"contain"}} onLoadedData={e=>{e.target.currentTime=lightbox.time;}}/>
          <div style={{padding:"10px 14px",borderTop:`1px solid ${T.border}`,background:T.card2}}>
            <div style={{fontSize:14,color:T.text,fontFamily:SA}}>{lightbox.note}</div>
          </div>
          <div onClick={()=>setLightbox(null)} style={{position:"absolute",top:8,right:8,width:30,height:30,borderRadius:3,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,color:"#fff",fontWeight:700}}>✕</div>
        </div>
      </div>}
    </div>
  );
}

/* ── TIMELINE SCREEN ───────────────────────────────── */
// Benchmark color: <80% = dark green, 80-100% = light green→orange, 100-120% = orange, >120% = red
const bmColor=(d,b)=>{if(!d||!b)return"#888";const pct=d/b;if(pct<=0.5)return"#1a7a3a";if(pct<=0.65)return"#2e8b57";if(pct<=0.8)return"#4caf50";if(pct<=0.9)return"#8bc34a";if(pct<=1.0)return"#cddc39";if(pct<=1.1)return"#ff9800";if(pct<=1.2)return"#f57c00";return"#d32f2f";};

function TlScreen({T,as=5,onScreenChange,elapsed=0,phasesData=null,evtsData=null,liveEvtsData=null,transcriptData=null,itemsOverride=null,itemEventsOverride=null,isArchive=false}) {
  const _PH=phasesData||PHASES;const _EVT=evtsData||EVT;const _LE=liveEvtsData||LIVE_EVENTS;const _TR=transcriptData||TRANSCRIPTION;
  const fmt=s=>`${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const { visibleItems: tlVIS, alertDetails: tlAlertDetails, totalTracked: tlTracked } = useInventoryState(elapsed,itemsOverride,itemEventsOverride);
  const [tlLeftW,setTlLeftW_]=useState(()=>parseInt(localStorage.getItem("tl_leftW"))||240);
  const setTlLeftW=v=>{setTlLeftW_(v);localStorage.setItem("tl_leftW",v);};
  const [tlRightW,setTlRightW_]=useState(()=>parseInt(localStorage.getItem("tl_rightW"))||380);
  const setTlRightW=v=>{setTlRightW_(v);localStorage.setItem("tl_rightW",v);};
  // Floating panels for Timeline screen
  const tlPanels=useFloatingPanels("tl_panels_v2",[
    {id:"phases",title:"Phase Durations",x:8,y:8,w:340,h:540,minimized:false,z:1},
    {id:"audio",title:"Audio Transcription / Media",x:360,y:8,w:520,h:540,minimized:false,z:2},
    {id:"location",title:"Surgical Item — Real Time Location",x:892,y:8,w:420,h:280,minimized:false,z:3},
    {id:"events",title:"Event Log",x:892,y:296,w:420,h:252,minimized:false,z:4},
  ]);
  const [midTab,setMidTab]=useState("media"); // "transcript" | "media"
  // Dynamic durations based on elapsed time
  const PS=_PH.map(p=>p.offsetStart);
  const benchmarks=_PH.map(p=>p.benchmark);
  const durs=_PH.map((p,i)=>{
    if(i>as)return null; // not reached yet
    if(i===as)return Math.max(0,(elapsed-PS[i])/60); // active phase: live duration
    // completed phase: use stored duration from DB, or compute from offsets
    if(p.duration!=null)return p.duration;
    if(i+1<PS.length)return (PS[i+1]-PS[i])/60;
    return null;
  });
  const st=STATES[as];const c=T[st.ck];
  const phases=STATES.map((s,i)=>({p:s.l,d:durs[i],b:benchmarks[i],done:i<as,active:i===as,gate:s.g}));

  // Live simulation — scripted events that appear at specific elapsed times
  const liveTranscript=_TR.live||[];
  const liveEvents=_LE;
  const [shownTranscript,setShownTranscript]=useState([]);
  const [shownEvents,setShownEvents]=useState([]);
  const [showInvEvents,setShowInvEvents]=useState(false);
  const transcriptRef=useRef(null);
  const evtFeedRef=useRef(null);
  useEffect(()=>{
    const newT=liveTranscript.filter(t=>t.at<=elapsed);
    if(newT.length!==shownTranscript.length){setShownTranscript(newT);if(transcriptRef.current)transcriptRef.current.scrollTo({top:0,behavior:"smooth"});}
    const newE=liveEvents.filter(e=>e.at<=elapsed);
    if(newE.length!==shownEvents.length){setShownEvents(newE);if(evtFeedRef.current)evtFeedRef.current.scrollTo({top:0,behavior:"smooth"});}
  },[elapsed]);

  // Helper: get phase index for a given offset
  const phaseForOffset=(at)=>{for(let i=PS.length-1;i>=0;i--){if(at>=PS[i])return i;}return 0;};

  // Merge static EVT + live events for the event log
  const _allTlEvts=[..._EVT.filter(e=>e.at<=elapsed),...shownEvents.map(e=>({at:e.at,t:isArchive?e.t||"":liveEvtTime(e.at),s:6,e:e.e,tp:e.tp}))];
  const isInvEvt=(e)=>/^(SPG|NDL|SHP|INS|PAK)-\d+/.test(e.e)||e.tp==="inv";
  const allTimelineEvents=showInvEvents?_allTlEvts:_allTlEvts.filter(e=>!isInvEvt(e));

  // Static + live transcription
  const staticTranscript=(_TR.static||[]).filter(t=>t.at<=elapsed).map(t=>({t:realTime(t.at),speaker:t.speaker,text:t.text,type:t.type}));
  const allTranscript=[...staticTranscript,...shownTranscript.map(t=>({t:liveEvtTime(t.at),speaker:t.speaker,text:t.text,type:t.speaker==="System"?"sys":"speech"}))];

  return(<div style={{display:"flex",flexDirection:"column",gap:8,height:"100%",minHeight:0}}>
    {/* TOP: Horizontal state progression — visual pipeline */}
    <Cd T={T} style={{flexShrink:0,padding:"10px 12px"}}>
      <div style={{display:"flex",alignItems:"center",gap:0}}>
        {STATES.map((s,i)=>{const sc=T[s.ck];const past=i<as;const active=i===as;const bc=past&&durs[i]&&benchmarks[i]?bmColor(durs[i],benchmarks[i]):sc;const activeDurMin=active?Math.max(0,(elapsed-PS[i])/60):0;const activeOverBench=active&&benchmarks[i]&&activeDurMin>benchmarks[i];const ac=activeOverBench?T.red:sc;
          return(<React.Fragment key={s.id}>
            {/* State node */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:active?80:50,position:"relative"}}>
              {/* Circle/diamond */}
              <div style={{width:active?36:past?28:24,height:active?36:past?28:24,borderRadius:s.g&&!past?4:"50%",background:active?ac:past?bc:T.card2,border:`2px solid ${active?ac:past?bc:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1,...(activeOverBench?{animation:"bl 1s infinite"}:{})}}>
                {past&&<span style={{fontSize:14,color:"#fff",fontWeight:700}}>✓</span>}
                {active&&<span style={{fontSize:12,color:"#fff",fontWeight:700}}>●</span>}
                {!past&&!active&&s.g&&<span style={{fontSize:10,color:T.muted}}>◆</span>}
              </div>
              {/* Label */}
              <div style={{marginTop:4,textAlign:"center"}}>
                <div style={{fontSize:active?12:10,fontFamily:MO,fontWeight:active?700:past?600:400,color:active?ac:past?bc:T.muted,lineHeight:1.2}}>{s.l}</div>
                {past&&durs[i]&&<div style={{fontSize:10,fontFamily:MO,color:bc,marginTop:1,fontWeight:600}}>{durs[i].toFixed(1)} min</div>}
                {active&&<div style={{fontSize:10,fontFamily:MO,color:ac,marginTop:1,fontWeight:700}}>{activeDurMin.toFixed(1)} min{activeOverBench?" ⚠":""}</div>}
                {!past&&!active&&s.g&&<div style={{fontSize:9,fontFamily:MO,color:T.amber,marginTop:1}}>GATE</div>}
              </div>
            </div>
            {/* Connector line */}
            {i<STATES.length-1&&<div style={{flex:1,height:3,minWidth:8,background:past&&i<as-1?bc:active||i===as-1?sc+"66":T.border,marginBottom:20}}/>}
          </React.Fragment>);
        })}
      </div>
    </Cd>

    {/* MIDDLE: Active state banner — single row */}
    {(() => {
      const _PS=_PH.map(p=>p.offsetStart);const activeDurMin=(elapsed-_PS[as])/60;const bm=_PH[as].benchmark;const phaseOver=bm&&bm>0&&activeDurMin>bm;
      const alerts=[];
      tlAlertDetails.filter(a=>!a.resolved).forEach(a=>alerts.push({type:"inventory",icon:"◆",msg:`${a.name}: ${a.note}`}));
      if(phaseOver)alerts.push({type:"phase",icon:"⏱",msg:`${STATES[as].l} exceeded benchmark`});
      const totalAlerts=alerts.length;const alertColor=totalAlerts>0?T.red:T.amber;
      const alertTip=alerts.length?alerts.map(a=>`${a.icon} [${a.type.toUpperCase()}] ${a.msg}`).join("\n\n"):"No alerts";
      return (
      <div style={{display:"flex",alignItems:"center",gap:14,flexShrink:0,padding:"8px 16px",background:T.card,border:`1px solid ${T.border}`,borderLeft:`4px solid ${c}`,borderRadius:6,whiteSpace:"nowrap"}}>
        <span style={{fontSize:11,fontFamily:MO,color:c,textTransform:"uppercase",letterSpacing:2,fontWeight:700}}>State {st.id}/14</span>
        <span style={{fontSize:18,fontWeight:800,color:T.text,fontFamily:SA}}>{st.l}</span>
        {st.g && <span style={{fontSize:11,fontFamily:MO,color:T.amber,padding:"3px 10px",background:`${T.amber}22`,borderRadius:4,fontWeight:700,letterSpacing:1}}>⚠ SAFETY GATE</span>}
        <span style={{fontSize:12,color:T.soft}}>{st.g?"Requires confirmation":"Standard Phase"}</span>
        <span style={{flex:1}}/>
        <span style={{display:"inline-flex",alignItems:"baseline",gap:4}}><span style={{fontSize:18,fontWeight:800,fontFamily:MO,color:T.teal}}>{fmt(elapsed+2071)}</span><span style={{fontSize:11,fontFamily:MO,color:T.muted}}>Elapsed</span></span>
        <span style={{display:"inline-flex",alignItems:"baseline",gap:4}}><span style={{fontSize:18,fontWeight:800,fontFamily:MO,color:T.green}}>{tlTracked}</span><span style={{fontSize:11,fontFamily:MO,color:T.muted}}>Tracked</span></span>
        <span style={{display:"inline-flex",alignItems:"baseline",gap:4}}><span style={{fontSize:18,fontWeight:800,fontFamily:MO,color:T.cyan}}>4</span><span style={{fontSize:11,fontFamily:MO,color:T.muted}}>Staff</span></span>
        <span title={alertTip} style={{display:"inline-flex",alignItems:"baseline",gap:4,cursor:"help"}}><span style={{fontSize:18,fontWeight:800,fontFamily:MO,color:alertColor}}>{totalAlerts}</span><span style={{fontSize:11,fontFamily:MO,color:T.muted}}>Alerts</span></span>
      </div>
      );
    })()}

    {/* BOTTOM: Floating panels — drag, resize, minimize freely */}
    <div style={{position:"relative",flex:1,minHeight:0,overflow:"hidden"}}>
      <FloatingPanel panel={tlPanels.panels.find(p=>p.id==="phases")} update={tlPanels.update} bringToFront={tlPanels.bringToFront} onInteractStart={tlPanels.showGrid} onInteractEnd={tlPanels.hideGrid} T={T} headerColor={T.teal}><div style={{height:"100%",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"8px 12px",borderBottom:`2px solid ${T.border}`,background:T.card2}}>
          <span style={{fontSize:13,fontWeight:700,color:T.text}}>Phase Durations</span>
        </div>
        <div style={{flex:1,overflowY:"auto",minHeight:0}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:14,fontFamily:SA}}>
            <thead><tr style={{background:T.card2,position:"sticky",top:0,zIndex:1}}>
              {["#","Phase","Duration","","Benchmark"].map(h=><th key={h} style={{padding:"6px 10px",textAlign:h==="#"||h==="Duration"||h==="Benchmark"||h===""?"center":"left",fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",borderBottom:`2px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontWeight:600,width:h==="#"?30:undefined}}>{h}</th>)}
            </tr></thead>
            <tbody>{phases.map((p,i)=>{const pc=p.done&&p.d&&p.b?bmColor(p.d,p.b):T.muted;const phaseColor=T[STATES[i]?.ck]||T.muted;return(
              <tr key={i} style={{background:p.active?phaseColor+"12":p.done?phaseColor+"06":i%2===0?T.card:T.card2}}>
                <td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:11,color:T.muted,textAlign:"center"}}>{i}</td>
                <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontWeight:p.active?700:500,color:p.done?T.text:p.active?phaseColor:T.muted,fontSize:13}}><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:phaseColor,marginRight:6,verticalAlign:"middle"}}/>{p.p}</td>
                <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:13,fontWeight:600,textAlign:"center",color:p.done&&p.d?pc:p.active?T.teal:T.faint}}>{p.done&&p.d?p.d.toFixed(1)+" min":p.active&&p.d!=null?<span style={{display:"inline-flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:"50%",background:T.teal,animation:"bl 2s infinite"}}/>{p.d.toFixed(1)} min</span>:"—"}</td>
                <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,width:80}}>
                  {p.done&&p.d&&p.b?<div style={{background:T.card2,borderRadius:2,height:8,overflow:"hidden",position:"relative"}}>
                    <div style={{height:"100%",width:`${Math.min((p.d/p.b)*100,100)}%`,background:pc}}/>
                    <div style={{position:"absolute",top:0,bottom:0,left:"80%",width:1,background:T.muted+"55"}}/>
                  </div>:p.active?<div style={{background:T.card2,borderRadius:2,height:8,overflow:"hidden",position:"relative"}}><div style={{height:"100%",width:`${Math.min((elapsed/60/p.b)*100,100)}%`,background:bmColor(elapsed/60,p.b)}}/><div style={{position:"absolute",top:0,bottom:0,left:"80%",width:1,background:T.muted+"55"}}/></div>:<div style={{background:T.card2,borderRadius:2,height:8}}/>}
                </td>
                <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border}`,fontFamily:MO,fontSize:12,color:T.muted,textAlign:"center"}}>{p.b?p.b+" min":"—"}</td>
              </tr>
            );})}</tbody>
          </table>
        </div>
      </div></FloatingPanel>

      {/* AUDIO/MEDIA panel */}
      <FloatingPanel panel={tlPanels.panels.find(p=>p.id==="audio")} update={tlPanels.update} bringToFront={tlPanels.bringToFront} onInteractStart={tlPanels.showGrid} onInteractEnd={tlPanels.hideGrid} T={T} headerColor={T.purple}><div style={{height:"100%",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",borderBottom:`2px solid ${T.border}`,background:T.card2,flexShrink:0}}>
          <div onClick={()=>setMidTab("transcript")} style={{padding:"8px 16px",cursor:"pointer",fontSize:12,fontFamily:MO,fontWeight:700,color:midTab==="transcript"?T.text:T.muted,borderBottom:midTab==="transcript"?`2px solid ${T.teal}`:"2px solid transparent",marginBottom:-2}}>Audio Transcription</div>
          <div onClick={()=>setMidTab("media")} style={{padding:"8px 16px",cursor:"pointer",fontSize:12,fontFamily:MO,fontWeight:700,color:midTab==="media"?T.text:T.muted,borderBottom:midTab==="media"?`2px solid ${T.purple}`:"2px solid transparent",marginBottom:-2}}>Media</div>
          <div style={{flex:1}}/>
          {midTab==="transcript"&&!isArchive&&<div style={{display:"flex",gap:4,alignItems:"center",paddingRight:12}}><span style={{width:6,height:6,borderRadius:"50%",background:T.green,animation:"bl 2s infinite"}}/><span style={{fontSize:11,fontFamily:MO,color:T.green}}>LISTENING</span></div>}
          {midTab==="transcript"&&isArchive&&<span style={{fontSize:11,fontFamily:MO,color:T.muted,paddingRight:12,alignSelf:"center"}}>ARCHIVED</span>}
        </div>
        {midTab==="transcript"&&<div ref={transcriptRef} style={{flex:1,overflowY:"auto",minHeight:0,padding:12}}>
          {allTranscript.slice().reverse().map((t,i)=>{const isNew=i<shownTranscript.length;return(
            <div key={i} style={{marginBottom:8,padding:"6px 10px",borderRadius:3,background:t.type==="alert"?T.red+"0c":t.type==="sys"?T.card2:isNew?T.teal+"06":"transparent",borderLeft:t.type==="alert"?`3px solid ${T.red}`:t.speaker==="Physician A"?`3px solid ${T.teal}`:t.speaker==="Anesthesia"?`3px solid ${T.purple}`:t.speaker==="Scrub Tech"?`3px solid ${T.cyan}`:t.speaker==="Circulator"?`3px solid ${T.blue}`:`3px solid ${T.muted}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                <span style={{fontSize:12,fontWeight:700,color:t.speaker==="Physician A"?T.teal:t.speaker==="Anesthesia"?T.purple:t.speaker==="Scrub Tech"?T.cyan:t.speaker==="Circulator"?T.blue:T.muted,fontFamily:MO}}>{t.speaker}</span>
                <span style={{fontSize:11,fontFamily:MO,color:T.muted}}>{t.t}</span>
              </div>
              <div style={{fontSize:14,color:t.type==="alert"?T.red:T.text,lineHeight:1.4,fontStyle:t.type==="sys"?"italic":"normal"}}>{t.text}</div>
            </div>
          );})}
        </div>}
        {midTab==="media"&&<div style={{flex:1,display:"flex",flexDirection:"column",gap:8,padding:10,minHeight:0,overflow:"auto"}}>
          {/* 2x1 Video feeds — Mayo + Back Table */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,flex:1,minHeight:0}}>
            {[{label:"Mayo Stand",cam:1,c:T.teal},{label:"Back Table",cam:2,c:T.blue}].map(feed=>(
              <div key={feed.cam} style={{position:"relative",borderRadius:3,overflow:"hidden",border:`1px solid ${feed.c}33`,background:T.card2,minHeight:120}}>
                <video src={CAM_VIDEOS[feed.cam]} muted loop playsInline autoPlay style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                <div style={{position:"absolute",bottom:0,left:0,right:0,height:22,background:T.n==="dark"?"rgba(0,0,0,0.75)":"rgba(255,255,255,0.8)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 8px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:isArchive?T.muted:T.red,animation:isArchive?"none":"bl 2s infinite"}}/>
                    <span style={{fontSize:10,fontFamily:MO,color:feed.c,fontWeight:700}}>{feed.label}</span>
                  </div>
                  <span style={{fontSize:10,fontFamily:MO,color:T.muted}}>CAM-{feed.cam}</span>
                </div>
              </div>
            ))}
          </div>
          {/* 2x1 Mic feeds */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,flexShrink:0}}>
            {[{label:"MIC-1 (Room)",c:T.green},{label:"MIC-2 (Field)",c:T.purple}].map(mic=>(
              <div key={mic.label} style={{padding:"8px 10px",borderRadius:3,border:`1px solid ${mic.c}22`,background:mic.c+"08"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:12,fontFamily:MO,fontWeight:700,color:mic.c}}>{mic.label}</span>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:isArchive?T.muted:T.green,animation:isArchive?"none":"bl 2s infinite"}}/>
                    <span style={{fontSize:10,fontFamily:MO,color:isArchive?T.muted:T.green}}>{isArchive?"RECORDED":"LIVE"}</span>
                  </div>
                </div>
                <AudioMeter T={T} active={!isArchive}/>
              </div>
            ))}
          </div>
        </div>}
      </div></FloatingPanel>

      {/* LOCATION panel — OR Zone Map */}
      <FloatingPanel panel={tlPanels.panels.find(p=>p.id==="location")} update={tlPanels.update} bringToFront={tlPanels.bringToFront} onInteractStart={tlPanels.showGrid} onInteractEnd={tlPanels.hideGrid} T={T} headerColor={T.cyan}>
        <div style={{padding:10,height:"100%",display:"flex",flexDirection:"column",minHeight:0,boxSizing:"border-box"}}>
          <ORZoneMap T={T} items={tlVIS} height="100%"/>
        </div>
      </FloatingPanel>

      {/* EVENTS panel — Event Log only */}
      <FloatingPanel panel={tlPanels.panels.find(p=>p.id==="events")} update={tlPanels.update} bringToFront={tlPanels.bringToFront} onInteractStart={tlPanels.showGrid} onInteractEnd={tlPanels.hideGrid} T={T} headerColor={T.amber}>
        <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"8px 12px",borderBottom:`2px solid ${T.border}`,background:T.card2,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <span style={{fontSize:12,fontFamily:MO,color:T.muted,letterSpacing:1.5}}>FILTER</span>
            <label style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",fontSize:11,fontFamily:MO,color:T.muted}}>
              <input type="checkbox" checked={showInvEvents} onChange={e=>setShowInvEvents(e.target.checked)} style={{cursor:"pointer"}}/>
              Inventory
            </label>
          </div>
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>
            {allTimelineEvents.slice().sort((a,b)=>a.t.localeCompare(b.t)).reverse().map((e,i)=>{const isPhase=e.tp==="phase";const evtPhase=phaseForOffset(e.at);const phColor=T[STATES[evtPhase]?.ck]||T.teal;const ec=isPhase?phColor:e.tp==="gate"?T.amber:e.tp==="warn"?T.orange:e.tp==="ok"?T.green:T.teal;const itemMatch=e.e.match(/^(SPG|NDL|SHP|INS|PAK)-\d+/);const clickable=!!itemMatch;return(
              <div key={i} onClick={()=>{if(clickable&&onScreenChange){const id=e.e.match(/(SPG|NDL|SHP|INS|PAK)-\d+/)[0];onScreenChange("inventory",id);}}} style={{display:"flex",alignItems:"flex-start",gap:6,padding:"4px 8px",borderBottom:`1px solid ${T.border}`,background:phColor+"18",borderLeft:`3px solid ${phColor}88`,cursor:clickable?"pointer":"default"}}>
                <span style={{fontSize:12,fontFamily:MO,color:isPhase?phColor:T.muted,minWidth:38,paddingTop:2,fontWeight:isPhase?700:400}}>{e.t}</span>
                {isPhase?<span style={{fontSize:10,color:phColor,marginTop:2}}>◉</span>:<div style={{width:7,height:7,borderRadius:"50%",background:ec,marginTop:5,flexShrink:0}}/>}
                <span style={{fontSize:13,color:isPhase?phColor:clickable?T.teal:T.text,fontFamily:isPhase?MO:SA,flex:1,lineHeight:1.3,fontWeight:isPhase?700:400,textDecoration:clickable?"underline":"none"}}>{e.e}</span>
              </div>
            );})}
          </div>
        </div>
      </FloatingPanel>

      <GridOverlay visible={tlPanels.gridVisible}/>
      <MinimizedTray panels={tlPanels.panels} update={tlPanels.update} T={T}/>
    </div>
  </div>);
}

/* ── TURNOVER SCREEN ───────────────────────────────── */
function TnScreen({T,elapsed=0,phasesData=null,itemsOverride=null,itemEventsOverride=null,complianceData=null,kitName=null,isArchive=false,archiveOp=null}) {
  const _PH=phasesData||PHASES;const _IE=itemEventsOverride||ITEM_EVENTS;const _COMP=complianceData||COMPLIANCE;
  const { items: _computedItems } = useInventoryState(elapsed, itemsOverride, itemEventsOverride);
  const _IT=_computedItems.map(it=>({...it,loc:it.loc||{m:0,b:0,p:0,d:0}}));
  const tI=_IT.reduce((s,i)=>s+i.init,0),tM=_IT.reduce((s,i)=>s+(i.loc?.m||0),0),tB=_IT.reduce((s,i)=>s+(i.loc?.b||0),0),tP=_IT.reduce((s,i)=>s+(i.loc?.p||0),0),tD=_IT.reduce((s,i)=>s+(i.loc?.d||0),0);

  // Build phase stats from phases data (archive: from stateLog via adapted phases, live: hardcoded completed)
  const completedPhases=isArchive&&archiveOp?(()=>{
    const durToMin=(d)=>{if(!d)return 0;const p=d.split(":").map(Number);return p.length===2?p[0]+p[1]/60:p[0];};
    return archiveOp.stateLog.map(sl=>({p:STATES[sl.s]?.l||`Phase ${sl.s}`,d:durToMin(sl.dur),b:sl.b||0,s:sl.s,ck:STATES[sl.s]?.ck,gate:STATES[sl.s]?.g,count:sl.count,verbal:sl.verbal}));
  })():[{p:"OR Setup",d:16.2,b:15},{p:"Initial Count",d:4.4,b:8},{p:"Patient In",d:2.0,b:3},{p:"Anesthesia",d:8.75,b:10},{p:"Time Out",d:3.0,b:5}];
  const totalCompleted=completedPhases.reduce((s,p)=>s+p.d,0);
  const totalBench=completedPhases.reduce((s,p)=>s+p.b,0);

  // Kit usage stats
  const mayoInst=_IT.filter(it=>it.cat==="instrument"&&(it.z==="mayo"||(it.loc?.m||0)>0));
  const btInst=_IT.filter(it=>it.cat==="instrument"&&it.z!=="mayo");
  const mayoUsed=mayoInst.filter(it=>(it.loc?.p||0)>0||(_IE[it.id]||[]).some(e=>e.type==="to_patient")).length;
  const btMoved=btInst.filter(it=>(it.loc?.m||0)>0).length;
  const sponges=_IT.filter(it=>it.cat==="sponge");const needles=_IT.filter(it=>it.cat==="needle");const sharps=_IT.filter(it=>it.cat==="sharp");const packs=_IT.filter(it=>it.cat==="pack");

  const tnPanels=useFloatingPanels("tn_panels_v1",[
    {id:"phase",title:"Phase Performance",x:8,y:8,w:680,h:400,minimized:false,z:1},
    {id:"compliance",title:"Compliance & Safety",x:696,y:8,w:680,h:400,minimized:false,z:2},
    {id:"kit",title:`Kit Utilization — ${kitName||"Masectomy Tray"}`,x:8,y:416,w:680,h:380,minimized:false,z:3},
    {id:"consumables",title:"Consumables",x:696,y:416,w:680,h:380,minimized:false,z:4},
  ]);

  return(
    <div style={{position:"relative",height:"100%",minHeight:0,overflow:"hidden"}}>
      {/* PHASE STATS panel */}
      <FloatingPanel panel={tnPanels.panels.find(p=>p.id==="phase")} update={tnPanels.update} bringToFront={tnPanels.bringToFront} onInteractStart={tnPanels.showGrid} onInteractEnd={tnPanels.hideGrid} T={T} headerColor={T.teal}>
        <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,fontFamily:SA}}>
              <thead><tr style={{background:T.card2}}>
                {["Phase","Actual","Benchmark","Variance",""].map(h=><th key={h} style={{padding:"6px 8px",textAlign:h==="Phase"?"left":"center",fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase",borderBottom:`2px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontWeight:600,width:h===""?80:undefined}}>{h}</th>)}
              </tr></thead>
              <tbody>{completedPhases.map((p,i)=>{const pc=bmColor(p.d,p.b||1);const v=p.b?(p.d-p.b):0;const phC=p.ck?T[p.ck]:T.muted;return(
                <tr key={i} style={{background:i%2===0?T.card:T.card2}}>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontWeight:600,fontSize:12}}>{isArchive&&phC?<span style={{display:"inline-block",width:6,height:6,borderRadius:p.gate?1:3,background:phC,marginRight:5,verticalAlign:"middle"}}/>:null}{p.p}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontWeight:700,textAlign:"center",color:pc,fontSize:12}}>{p.d.toFixed(1)}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,textAlign:"center",color:T.muted,fontSize:12}}>{p.b||"—"}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontWeight:600,textAlign:"center",color:p.b?(v>0?T.red:T.green):T.muted,fontSize:12}}>{p.b?(v>0?"+":"")+v.toFixed(1):"—"}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border}`,width:80}}>
                    {p.b?<div style={{background:T.card2,borderRadius:2,height:7,overflow:"hidden",position:"relative"}}>
                      <div style={{height:"100%",width:`${Math.min((p.d/p.b)*100,100)}%`,background:pc}}/>
                      <div style={{position:"absolute",top:0,bottom:0,left:"80%",width:1,background:T.muted+"55"}}/>
                    </div>:<div style={{background:T.card2,borderRadius:2,height:7}}/>}
                  </td>
                </tr>);})}
                {!isArchive&&<tr style={{background:T.card2}}>
                  <td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,fontWeight:700}}>Procedure (live)</td>
                  <td style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,fontFamily:MO,fontWeight:700,textAlign:"center",color:T.teal}} colSpan={4}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:"50%",background:T.teal,animation:"bl 2s infinite"}}/>{(elapsed/60).toFixed(1)} min / 90 min</span>
                  </td>
                </tr>}
                <tr style={{background:T.card2,borderTop:`2px solid ${T.border}`}}>
                  <td style={{padding:"8px 8px",fontWeight:700,fontSize:13}}>Total</td>
                  <td style={{padding:"8px 8px",fontFamily:MO,fontWeight:700,textAlign:"center",color:bmColor(isArchive?totalCompleted:totalCompleted+elapsed/60,totalBench),fontSize:13}} colSpan={2}>{(isArchive?totalCompleted:totalCompleted+elapsed/60).toFixed(1)} min</td>
                  <td style={{padding:"8px 8px",fontFamily:MO,textAlign:"center",color:T.muted,fontSize:12}} colSpan={2}>/ {totalBench} min bench</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </FloatingPanel>

      {/* COMPLIANCE panel */}
      <FloatingPanel panel={tnPanels.panels.find(p=>p.id==="compliance")} update={tnPanels.update} bringToFront={tnPanels.bringToFront} onInteractStart={tnPanels.showGrid} onInteractEnd={tnPanels.hideGrid} T={T} headerColor={T.amber}>
        <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:1,overflowY:"auto",minHeight:0,padding:12}}>
            {isArchive&&archiveOp?(()=>{
              const warnEvts=archiveOp.events.filter(e=>e.tp==="warn");
              return(<>
                <div style={{fontSize:12,fontFamily:MO,color:T.muted,textTransform:"uppercase",marginBottom:6}}>Count Results ({archiveOp.counts}×)</div>
                {completedPhases.filter(p=>p.count).map((p,i)=>(
                  <div key={i} style={{marginBottom:6,padding:"6px 8px",borderRadius:3,background:p.count.status==="Balanced"?T.green+"0c":T.amber+"0c",border:`1px solid ${(p.count.status==="Balanced"?T.green:T.amber)+"18"}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:13,fontWeight:700,color:p.count.status==="Balanced"?T.green:T.amber,fontFamily:MO}}>{p.count.status==="Balanced"?"✓ BALANCED":"⚠ "+p.count.status}</span>
                      <span style={{fontSize:11,fontFamily:MO,color:T.muted}}>{p.p}</span>
                    </div>
                    <div style={{fontSize:11,fontFamily:MO,color:T.soft,marginTop:2}}>{p.count.base} baseline = {p.count.field} field + {p.count.disp} disposed</div>
                  </div>
                ))}
                {completedPhases.filter(p=>p.verbal).map((p,i)=>(
                  <div key={i} style={{marginTop:6,padding:"6px 8px",borderRadius:3,background:T.teal+"0c",border:`1px solid ${T.teal}18`}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.teal,fontFamily:MO}}>Time Out Verbal: {p.verbal}</div>
                  </div>
                ))}
                <div style={{marginTop:12,fontSize:12,fontFamily:MO,color:T.muted,textTransform:"uppercase",marginBottom:6}}>Alerts ({archiveOp.alerts})</div>
                {warnEvts.length>0?warnEvts.map((a,i)=>(
                  <div key={i} style={{padding:"6px 8px",marginBottom:4,borderLeft:`3px solid ${T.amber}`,background:T.amber+"08"}}>
                    <span style={{fontSize:12,fontFamily:MO,color:T.amber}}>{a.t.slice(0,5)}</span>
                    <div style={{fontSize:13,color:T.text}}>{a.e}</div>
                  </div>
                )):<div style={{fontSize:13,color:T.green,fontFamily:MO}}>✓ No alerts — clean case</div>}
                <div style={{marginTop:12,padding:"8px 10px",borderRadius:3,background:archiveOp.outcome==="complete"?T.green+"0c":T.amber+"0c",border:`1px solid ${(archiveOp.outcome==="complete"?T.green:T.amber)+"22"}`,textAlign:"center"}}>
                  <span style={{fontSize:14,fontWeight:700,fontFamily:MO,color:archiveOp.outcome==="complete"?T.green:T.amber}}>{archiveOp.outcome==="complete"?"✓ CASE COMPLETE":"⚠ "+archiveOp.outcome.toUpperCase()}</span>
                </div>
              </>);
            })():<>
              {_COMP.map(ci=>({l:ci.label,v:ci.value,c:ci.color?T[ci.color]||ci.color:bmColor(parseInt(ci.value)||0,100)})).map((m,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontSize:13,color:T.text}}>{m.l}</span>
                  <span style={{fontSize:13,fontFamily:MO,fontWeight:600,color:m.c}}>{m.v}</span>
                </div>
              ))}
              <div style={{marginTop:12,fontSize:12,fontFamily:MO,color:T.muted,textTransform:"uppercase",marginBottom:6}}>Alerts (2)</div>
              {[{t:"09:25",d:"Raytec drop — floor",r:"Recovered ✓"},{t:"09:42",d:"Mid-case tray added",r:"Re-baselined ✓"}].map((a,i)=>(
                <div key={i} style={{padding:"6px 8px",marginBottom:4,borderLeft:`3px solid ${T.amber}`,background:T.amber+"08"}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,fontFamily:MO,color:T.amber}}>{a.t}</span><span style={{fontSize:11,color:T.green}}>{a.r}</span></div>
                  <div style={{fontSize:13,color:T.text}}>{a.d}</div>
                </div>
              ))}
            </>}
          </div>
        </div>
      </FloatingPanel>

      {/* KIT STATS panel */}
      <FloatingPanel panel={tnPanels.panels.find(p=>p.id==="kit")} update={tnPanels.update} bringToFront={tnPanels.bringToFront} onInteractStart={tnPanels.showGrid} onInteractEnd={tnPanels.hideGrid} T={T} headerColor={T.purple}>
        <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:1,overflowY:"auto",minHeight:0,padding:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              <div style={{textAlign:"center",padding:10,background:T.teal+"0a",border:`1px solid ${T.teal}22`,borderRadius:3}}>
                <div style={{fontSize:24,fontWeight:800,fontFamily:MO,color:T.teal}}>{mayoUsed}/{mayoInst.length}</div>
                <div style={{fontSize:11,fontFamily:MO,color:T.muted,marginTop:2}}>MAYO INSTRUMENTS USED</div>
                <div style={{fontSize:13,fontFamily:MO,color:T.teal,fontWeight:600}}>{(mayoUsed/mayoInst.length*100).toFixed(0)}%</div>
              </div>
              <div style={{textAlign:"center",padding:10,background:T.blue+"0a",border:`1px solid ${T.blue}22`,borderRadius:3}}>
                <div style={{fontSize:24,fontWeight:800,fontFamily:MO,color:T.blue}}>{btMoved}/{btInst.length}</div>
                <div style={{fontSize:11,fontFamily:MO,color:T.muted,marginTop:2}}>BACK TABLE → MAYO</div>
                <div style={{fontSize:13,fontFamily:MO,color:T.blue,fontWeight:600}}>{(btMoved/btInst.length*100).toFixed(0)}%</div>
              </div>
            </div>
            <div style={{fontSize:12,fontFamily:MO,color:T.muted,textTransform:"uppercase",marginBottom:6}}>By Instrument Type</div>
            {[{key:"Retractor",label:"Retractors"},{key:"Forceps",label:"Forceps"},{key:"Handle",label:"Knife Handles"},{key:"Clamp|Towel",label:"Clamps"},{key:"Needleholder",label:"Needle Holders"},{key:"Scissors",label:"Scissors"},{key:"Marker",label:"Cookie Cutters"}].map(st=>{const items=_IT.filter(it=>it.cat==="instrument"&&new RegExp(st.key).test(it.n));if(!items.length)return null;const total=items.length;const used=items.filter(it=>(it.loc?.p||0)>0||(it.loc?.m||0)>0&&it.z!=="mayo"||(_IE[it.id]||[]).some(e=>e.type==="to_patient")).length;const pct=(used/total*100).toFixed(0);return(
              <div key={st.label} style={{marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:13,color:T.text}}>{st.label}</span>
                  <span style={{fontSize:12,fontFamily:MO,color:T.muted}}>{used}/{total} ({pct}%)</span>
                </div>
                <div style={{background:T.card2,borderRadius:2,height:6,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:bmColor(parseInt(pct),80)}}/>
                </div>
              </div>
            );})}
          </div>
        </div>
      </FloatingPanel>

      {/* CONSUMABLES STATS panel */}
      <FloatingPanel panel={tnPanels.panels.find(p=>p.id==="consumables")} update={tnPanels.update} bringToFront={tnPanels.bringToFront} onInteractStart={tnPanels.showGrid} onInteractEnd={tnPanels.hideGrid} T={T} headerColor={T.green}>
        <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:1,overflowY:"auto",minHeight:0,padding:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[{label:"Sponges",icon:"◼",items:sponges,c:T.teal},{label:"Needles",icon:"▲",items:needles,c:T.purple},{label:"Sharps",icon:"◆",items:sharps,c:T.amber},{label:"Disposables",icon:"▣",items:packs,c:T.green}].map(cat=>{const ini=cat.items.reduce((s,i)=>s+i.init,0);const mayo=cat.items.reduce((s,i)=>s+(i.loc?.m||0),0);const patient=cat.items.reduce((s,i)=>s+(i.loc?.p||0),0);const disp=cat.items.reduce((s,i)=>s+(i.loc?.d||0),0);const opened=cat.label==="Disposables"?cat.items.reduce((s,i)=>(_IE[i.id]||[]).filter(e=>e.type==="opened").length+s,0):0;return(
              <div key={cat.label} style={{padding:"8px 10px",border:`1px solid ${T.border}`,borderRadius:3}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:14,fontWeight:700,color:T.text}}><span style={{color:cat.c,marginRight:4}}>{cat.icon}</span>{cat.label}</span>
                  <span style={{fontSize:13,fontFamily:MO,color:T.muted}}>{ini} pieces · {cat.items.length} types</span>
                </div>
                {/* Distribution bar */}
                <div style={{background:T.card2,borderRadius:2,height:12,overflow:"hidden",display:"flex",marginBottom:6}}>
                  <div style={{width:`${(mayo/ini)*100}%`,background:T.teal}} title={`Mayo: ${mayo}`}/>
                  <div style={{width:`${(patient/ini)*100}%`,background:T.purple}} title={`Patient: ${patient}`}/>
                  <div style={{width:`${(disp/ini)*100}%`,background:T.amber}} title={`Disposed: ${disp}`}/>
                </div>
                <div style={{display:"flex",gap:12,fontSize:12,fontFamily:MO}}>
                  <span style={{color:T.teal}}>Mayo: {mayo}</span>
                  {patient>0&&<span style={{color:T.purple}}>Patient: {patient}</span>}
                  {disp>0&&<span style={{color:T.amber}}>Disposed: {disp}</span>}
                  {opened>0&&<span style={{color:T.cyan}}>Opened: {opened}</span>}
                </div>
                {/* Per-item breakdown */}
                <div style={{marginTop:6}}>
                  {cat.items.map(it=>(
                    <div key={it.id} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:12,borderBottom:`1px solid ${T.border}`}}>
                      <span style={{color:T.soft}}>{it.n}</span>
                      <div style={{display:"flex",gap:6,fontFamily:MO,fontSize:11}}>
                        <span style={{color:T.teal}}>{it.loc.m}</span>
                        {it.loc.p>0&&<span style={{color:T.purple}}>{it.loc.p}</span>}
                        {it.loc.d>0&&<span style={{color:T.amber}}>{it.loc.d}</span>}
                        <span style={{color:T.muted}}>/{it.init}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );})}
          </div>
        </div>
      </FloatingPanel>

      <GridOverlay visible={tnPanels.gridVisible}/>
      <MinimizedTray panels={tnPanels.panels} update={tnPanels.update} T={T}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SETTINGS SCREEN (Camera PTZ, Mic Listen, Cloud Rec)
   ══════════════════════════════════════════════════════════ */
const CAM_VIDEOS = Object.fromEntries(CAMERAS.map(c=>[c.id,c.video]));

function VideoFeed({T,cam,isViewing}){
  const videoRef=useRef(null);
  useEffect(()=>{
    if(isViewing&&videoRef.current){videoRef.current.play().catch(()=>{});}
    if(!isViewing&&videoRef.current){videoRef.current.pause();}
  },[isViewing]);

  if(!isViewing)return(<div style={{width:"100%",height:"100%",background:T.n==="dark"?"#0a0f14":"#e2e8f0",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${T.border}`}}><div style={{textAlign:"center"}}><div style={{fontSize:32,opacity:.5}}>📷</div><div style={{fontSize:14,fontFamily:MO,color:T.muted}}>Click View</div></div></div>);

  return(
    <div style={{width:"100%",height:"100%",position:"relative",borderRadius:3,overflow:"hidden",border:`1px solid ${T.teal}33`}}>
      <video ref={videoRef} src={CAM_VIDEOS[cam.id]} muted loop playsInline style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
      {/* HUD overlay */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:24,background:T.n==="dark"?"rgba(0,0,0,0.8)":"rgba(255,255,255,0.8)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 10px"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:T.red,animation:"bl 2s infinite"}}/>
          <span style={{fontSize:10,fontFamily:MO,color:T.text,fontWeight:700}}>CAM-{cam.id} · {cam.name}</span>
        </div>
        <span style={{fontSize:10,fontFamily:MO,color:T.green,fontWeight:600}}>{cam.fps}fps · LIVE</span>
      </div>
    </div>
  );
}

function PTZControl({T,onMove,hasPTZ}){if(!hasPTZ)return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",opacity:.4}}><div style={{fontSize:11,fontFamily:MO,color:T.muted}}>FIXED CAM</div></div>);
  const B=({label,dir})=>(<div onClick={()=>onMove?.(dir)} style={{width:34,height:34,borderRadius:3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:T.card2,border:`1px solid ${T.border}`,fontSize:15,color:T.soft,userSelect:"none"}}>{label}</div>);
  return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><div style={{fontSize:10,fontFamily:MO,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:4,fontWeight:700}}>PTZ</div><B label="▲" dir="up"/><div style={{display:"flex",gap:2}}><B label="◀" dir="left"/><div style={{width:34,height:34,borderRadius:3,background:T.teal+"15",border:`1px solid ${T.teal}33`,display:"flex",alignItems:"center",justifyContent:"center"}}><Dot color={T.teal} size={6} pulse={false}/></div><B label="▶" dir="right"/></div><B label="▼" dir="down"/><div style={{display:"flex",gap:4,marginTop:6}}><div onClick={()=>onMove?.("zoom+")} style={{padding:"5px 14px",borderRadius:2,background:T.card2,border:`1px solid ${T.border}`,cursor:"pointer",fontSize:16,fontWeight:700,color:T.soft,fontFamily:MO}}>+</div><div onClick={()=>onMove?.("zoom-")} style={{padding:"5px 14px",borderRadius:2,background:T.card2,border:`1px solid ${T.border}`,cursor:"pointer",fontSize:16,fontWeight:700,color:T.soft,fontFamily:MO}}>−</div></div></div>);
}

function AudioMeter({T,active}){const [levels,setLevels]=useState(Array(16).fill(8));useEffect(()=>{if(!active){setLevels(Array(16).fill(8));return;}const t=setInterval(()=>setLevels(Array(16).fill(0).map(()=>10+Math.random()*80)),100);return()=>clearInterval(t);},[active]);
  return(<div style={{display:"flex",gap:2,alignItems:"flex-end",height:50}}>{levels.map((lv,i)=>(<div key={i} style={{width:5,borderRadius:2,transition:"height .1s",height:`${Math.max(active?lv:8,5)}%`,background:lv>75?T.red:lv>45?T.amber:T.green,opacity:active?1:.15}}/>))}</div>);
}

function SettingsScreen({T}){
  const [viewCam,setViewCam]=useState(null);const [listenMic,setListenMic]=useState(null);const [recV,setRecV]=useState(true);const [recA,setRecA]=useState(true);const [ptzLog,setPtzLog]=useState([]);const [sync,setSync]=useState(96.8);
  useEffect(()=>{const t=setInterval(()=>setSync(p=>Math.min(p+.1+Math.random()*.15,99.9)),2000);return()=>clearInterval(t);},[]);
  const handlePTZ=useCallback((dir)=>{setPtzLog(p=>[{t:new Date().toLocaleTimeString(),cam:viewCam,dir},...p].slice(0,8));},[viewCam]);
  const cams=CAMERAS.map(c=>({id:c.id,name:c.name,ip:`192.168.1.${100+c.id}`,res:c.res,fps:c.fps,zone:c.zone,ptz:c.ptz}));
  const mics=[{id:1,name:"Ceiling Array",mode:"Ambient+Voice"},{id:2,name:"Surgeon Lapel",mode:"Directional"}];

  return(<div style={{display:"flex",flexDirection:"column",gap:14,height:"100%",minHeight:0}}>
    <div style={{display:"flex",flexDirection:"column",gap:8,minHeight:0,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}><Lb T={T}>📷 Cameras</Lb><P color={T.green} T={T} small>4/4</P></div>
      <div style={{flex:1,overflowY:"auto",minHeight:0}}>{cams.map(cam=>{const v=viewCam===cam.id;return(<div key={cam.id} style={{padding:12,marginBottom:10,borderRadius:3,background:T.card,border:`1px solid ${v?T.teal+"55":T.border}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:v?10:0}}><div style={{display:"flex",alignItems:"center",gap:10}}><Dot color={T.green} size={7}/><div><div style={{fontSize:16,fontWeight:700,color:T.text,fontFamily:SA}}>{cam.name}</div><div style={{fontSize:12,fontFamily:MO,color:T.muted}}>CAM-{cam.id} · {cam.ip} · {cam.res}@{cam.fps}fps</div></div></div>
          <div style={{display:"flex",gap:6}}>{cam.ptz&&<P color={T.teal} T={T} small>PTZ</P>}<div onClick={()=>setViewCam(v?null:cam.id)} style={{padding:"7px 16px",borderRadius:3,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:MO,background:v?T.red+"18":T.teal+"12",color:v?T.red:T.teal,border:`1px solid ${v?T.red+"44":T.teal+"33"}`}}>{v?"■ Close":"▶ View"}</div></div></div>
        {v&&<div style={{display:"flex",gap:12}}><div style={{flex:1,height:200,borderRadius:3,overflow:"hidden"}}><VideoFeed T={T} cam={cam} isViewing={true}/></div><PTZControl T={T} onMove={handlePTZ} hasPTZ={cam.ptz}/></div>}
      </div>);})}</div>
      {ptzLog.length>0&&<Cd T={T} style={{padding:10,flexShrink:0,maxHeight:100,overflow:"hidden"}}><Lb T={T}>PTZ Log</Lb><div style={{flex:1,overflowY:"auto",minHeight:0}}>{ptzLog.map((p,i)=>(<div key={i} style={{display:"flex",gap:8,padding:"2px 0",fontSize:13,fontFamily:MO}}><span style={{color:T.muted}}>{p.t}</span><span style={{color:T.teal}}>CAM-{p.cam}</span><span style={{color:T.soft,fontWeight:600}}>{p.dir}</span></div>))}</div></Cd>}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:0,overflow:"hidden"}}>
      <Cd T={T} style={{padding:14,flexShrink:0}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><Lb T={T}>🎙 Microphones</Lb><P color={T.green} T={T} small>2/2</P></div>
        {mics.map(mic=>{const li=listenMic===mic.id;return(<div key={mic.id} style={{padding:14,marginBottom:10,borderRadius:3,background:T.card2,border:`1px solid ${li?T.purple+"55":T.border}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:10}}><Dot color={T.green} size={7}/><div><div style={{fontSize:17,fontWeight:700,color:T.text,fontFamily:SA}}>{mic.name}</div><div style={{fontSize:12,fontFamily:MO,color:T.muted}}>MIC-{mic.id} · {mic.mode}</div></div></div>
            <div onClick={()=>setListenMic(li?null:mic.id)} style={{padding:"7px 16px",borderRadius:3,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:MO,background:li?T.red+"18":T.purple+"12",color:li?T.red:T.purple,border:`1px solid ${li?T.red+"44":T.purple+"33"}`}}>{li?"■ Mute":"🎧 Listen"}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:16}}><AudioMeter T={T} active={li}/><div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[{l:"NC",v:"ON",c:T.green},{l:"Gain",v:"Auto",c:T.soft},{l:"Peak",v:li?"-12 dB":"—",c:li?T.amber:T.faint}].map((f,i)=>(<div key={i}><div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase"}}>{f.l}</div><div style={{fontSize:14,fontWeight:600,fontFamily:MO,color:f.c,marginTop:2}}>{f.v}</div></div>))}</div></div>
          {li&&<div style={{marginTop:10,padding:"8px 10px",borderRadius:3,background:T.purple+"08",border:`1px solid ${T.purple}18`,display:"flex",alignItems:"center",gap:8}}><Dot color={T.purple} size={6}/><span style={{fontSize:13,fontFamily:MO,color:T.purple}}>Monitoring · 45ms latency</span></div>}
        </div>);})}
      </Cd>
      <Cd T={T} style={{flex:1,padding:14,minHeight:0,overflow:"hidden"}}><Lb T={T}>Alerts</Lb><div style={{flex:1,overflowY:"auto",minHeight:0}}>{[{name:"Item Drop Detection",sev:"critical",en:true},{name:"Count Mismatch",sev:"critical",en:true},{name:"Staff Zone Breach",sev:"high",en:true},{name:"Time Out Incomplete",sev:"critical",en:true},{name:"Mid-Case Tray",sev:"medium",en:true},{name:"Camera Occlusion",sev:"medium",en:true},{name:"Idle Warning",sev:"low",en:false},{name:"Turnover Exceeded",sev:"low",en:true}].map((al,i)=>{const sc=al.sev==="critical"?T.red:al.sev==="high"?T.orange:al.sev==="medium"?T.amber:T.muted;return(<div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`,opacity:al.en?1:.4}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:4,background:al.en?sc:T.faint}}/><span style={{fontSize:15,fontFamily:SA,color:T.text}}>{al.name}</span></div><P color={sc} T={T} small filled={al.en}>{al.sev}</P></div>);})}</div>
        <div style={{flexShrink:0,marginTop:8,paddingTop:10,borderTop:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[{l:"AI",v:"ORKing© v3.2"},{l:"CV",v:"YOLO-Surg v8"},{l:"NLU",v:"Tracki© v2.1"}].map((s,i)=>(<div key={i}><div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase"}}>{s.l}</div><div style={{fontSize:14,fontWeight:600,fontFamily:MO,color:T.teal,marginTop:2}}>{s.v}</div></div>))}</div>
      </Cd>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:0,overflow:"hidden"}}>
      <Cd T={T} style={{padding:14,flexShrink:0}}><Lb T={T}>☁ Cloud Recording</Lb><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><div style={{width:40,height:40,borderRadius:3,background:T.green+"12",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:20}}>☁</span></div><div><div style={{fontSize:16,fontWeight:700,color:T.green}}>Connected</div><div style={{fontSize:12,fontFamily:MO,color:T.muted}}>AWS S3 · eu-west-1</div></div></div>
        <div style={{padding:10,borderRadius:3,background:T.card2,border:`1px solid ${T.border}`,marginBottom:12}}><div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase"}}>Bucket</div><div style={{fontSize:13,fontFamily:MO,color:T.teal,marginTop:3,wordBreak:"break-all"}}>s3://trackimed-or1-sheba/</div></div>
        <div style={{display:"flex",gap:12}}><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:14,fontFamily:SA,color:T.text}}>📹 Video</span><Toggle on={recV} onClick={()=>setRecV(r=>!r)} color={T.red} T={T}/></div></div><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:14,fontFamily:SA,color:T.text}}>🎙 Audio</span><Toggle on={recA} onClick={()=>setRecA(r=>!r)} color={T.red} T={T}/></div></div></div>
      </Cd>
      <Cd T={T} style={{flex:1,padding:14,minHeight:0,overflow:"hidden"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10,flexShrink:0}}><Lb T={T}>Streams</Lb><P color={T.red} T={T} small filled>● 6 REC</P></div>
        <div style={{flex:1,overflowY:"auto",minHeight:0}}>{[{s:"CAM-1",t:"video",sz:"2.4 GB",br:"8 Mbps"},{s:"CAM-2",t:"video",sz:"2.1 GB",br:"8 Mbps"},{s:"CAM-3",t:"video",sz:"1.2 GB",br:"4 Mbps"},{s:"CAM-4",t:"video",sz:"0.9 GB",br:"3 Mbps"},{s:"MIC-1",t:"audio",sz:"142 MB",br:"256k"},{s:"MIC-2",t:"audio",sz:"138 MB",br:"256k"}].map((st,i)=>(<div key={i} style={{padding:8,marginBottom:6,borderRadius:3,background:T.card2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:13}}>{st.t==="video"?"📹":"🎙"}</span><span style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:SA}}>{st.s}</span></div><div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:12,fontFamily:MO,color:T.soft}}>{st.sz}</span><span style={{fontSize:12,fontFamily:MO,color:T.muted}}>{st.br}</span><Dot color={T.red} size={5}/></div></div>))}</div>
      </Cd>
      <Cd T={T} style={{padding:14,flexShrink:0}}><Lb T={T}>Upload</Lb><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>{[{l:"Total",v:"6.9 GB",c:T.teal},{l:"Rate",v:"48 Mbps",c:T.green},{l:"Latency",v:"12ms",c:T.cyan}].map((m,i)=>(<div key={i} style={{textAlign:"center",padding:"6px 4px",borderRadius:3,background:T.card2}}><div style={{fontSize:18,fontWeight:800,fontFamily:MO,color:m.c}}>{m.v}</div><div style={{fontSize:9,fontFamily:MO,color:T.muted,textTransform:"uppercase",marginTop:2}}>{m.l}</div></div>))}</div>
        <div style={{background:T.card2,borderRadius:2,height:8,overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,width:`${sync}%`,background:T.teal,transition:"width .5s"}}/></div>
        <div style={{fontSize:11,fontFamily:MO,color:T.muted,marginTop:4}}>{sync.toFixed(1)}% synced · 🔒 AES-256 + TLS 1.3</div>
      </Cd>
    </div>
  </div>);
}

/* ══════════════════════════════════════════════════════════
   ARCHIVE SCREEN — Completed Operations Browser
   ══════════════════════════════════════════════════════════ */

// Archive data imported from archiveDB.js
const ARCHIVE_OPS = ARCHIVE_CASES;

const ARCHIVE_CAM_MAP = { "CAM-1": 1, "CAM-2": 2, "CAM-3": 3, "CAM-4": 4 };

function ArchiveVideoPlayer({T, cam, playing, onSeek, position}) {
  const videoRef=useRef(null);
  useEffect(()=>{
    if(!videoRef.current) return;
    if(playing) videoRef.current.play().catch(()=>{});
    else videoRef.current.pause();
  },[playing]);
  useEffect(()=>{
    if(videoRef.current && videoRef.current.duration){
      videoRef.current.currentTime = position * videoRef.current.duration;
    }
  },[cam]);

  const camId = ARCHIVE_CAM_MAP[cam] || 1;
  return(
    <div style={{width:"100%",height:"100%",position:"relative",borderRadius:3,overflow:"hidden",border:`1px solid ${T.teal}22`}}>
      <video ref={videoRef} src={CAM_VIDEOS[camId]} muted loop playsInline style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:20,background:T.n==="dark"?"rgba(0,0,0,0.8)":"rgba(255,255,255,0.8)",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        {!playing&&<span style={{fontSize:10,fontFamily:MO,color:T.amber,fontWeight:700}}>PAUSED</span>}
        {playing&&<><div style={{width:6,height:6,borderRadius:"50%",background:T.red,animation:"bl 2s infinite"}}/><span style={{fontSize:10,fontFamily:MO,color:T.text,fontWeight:700}}>{cam} · PLAYBACK</span></>}
      </div>
    </div>
  );
}

function ArchiveScreen({T}) {
  const [selOp, setSelOp] = useState(null);
  const [playback, setPlayback] = useState({playing:false,cam:"CAM-1",position:0});
  const [audioPlay, setAudioPlay] = useState(null);
  const [archiveMode, setArchiveMode] = useState("summary"); // "summary" | "replay"
  const [replayElapsed, setReplayElapsed] = useState(0); // seconds into replay
  const replayRef = useRef(null);
  const [archiveTab, setArchiveTab] = useState("timeline"); // "timeline" | "inventory" | "media"

  const op = ARCHIVE_OPS.find(o=>o.id===selOp);
  const adapted = useMemo(() => op ? adaptArchiveCase(op) : null, [op]);
  const archiveElapsed = adapted ? (archiveMode === "summary" ? adapted.totalElapsed : replayElapsed) : 0; // replay_paused also uses replayElapsed
  const archivePhase = useMemo(() => {
    if (!adapted) return 0;
    const ps = adapted.phases.map(p => p.offsetStart);
    for (let i = ps.length - 1; i >= 0; i--) { if (archiveElapsed >= ps[i]) return i; }
    return 0;
  }, [archiveElapsed, adapted]);

  // Playback position animation
  useEffect(()=>{
    if(!playback.playing)return;
    const t=setInterval(()=>setPlayback(p=>({...p,position:Math.min(p.position+0.002,1)})),100);
    return()=>clearInterval(t);
  },[playback.playing]);

  // Replay timer — ticks elapsed seconds when in replay mode
  useEffect(()=>{
    if(archiveMode!=="replay"){if(replayRef.current){clearInterval(replayRef.current);replayRef.current=null;}return;}
    replayRef.current=setInterval(()=>setReplayElapsed(s=>{const max=adapted?.totalElapsed;if(max!=null&&s>=max)return s;return s+1;}),1000);
    return()=>{if(replayRef.current)clearInterval(replayRef.current);};
  },[archiveMode,adapted]);


  // Operation List (no op selected)
  if(!op) return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexShrink:0}}>
        <div style={{fontSize:14,fontWeight:700,color:T.text}}>Completed Operations — OR-1</div>
        <span style={{fontSize:12,fontFamily:MO,color:T.muted}}>{ARCHIVE_OPS.length} records</span>
      </div>
      <div style={{flex:1,overflowY:"auto",minHeight:0,border:`1px solid ${T.border}`}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:15,fontFamily:SA}}>
        <thead><tr style={{background:T.card2,position:"sticky",top:0,zIndex:1}}>
          {["Date","Procedure","Kit","Surgeon","Patient","Pieces","Kit Util","Alerts","Counts","Duration",""].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:12,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1,borderBottom:`2px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontWeight:600}}>{h}</th>)}
        </tr></thead>
        <tbody>{ARCHIVE_OPS.map((o,idx)=>(
          <tr key={o.id} style={{cursor:"pointer",background:idx%2===0?T.card:T.card2}}
            onMouseEnter={e=>e.currentTarget.style.background=T.teal+"15"}
            onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?T.card:T.card2}
            onClick={()=>{setSelOp(o.id);setArchiveTab("timeline");}}>
            <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:14}}>{o.date.slice(5)}<br/><span style={{color:T.muted,fontSize:13}}>{o.time}</span></td>
            <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontWeight:600,fontSize:15}}>{o.proc}</td>
            <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontSize:13,fontFamily:MO,color:T.soft}}>{o.kit}</td>
            <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,color:T.soft,fontSize:14}}>{o.surgeon}</td>
            <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:14}}>{typeof o.patient==="object"?o.patient.display:o.patient}</td>
            <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:15,color:T.teal,fontWeight:600,textAlign:"center"}}>{o.pieces}</td>
            <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:14,fontWeight:600,textAlign:"center"}}><span style={{color:o.kitUtil>=75?"#4caf50":o.kitUtil>=60?"#ff9800":"#d32f2f"}}>{o.kitUtil}%</span></td>
            <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:15,color:o.alerts>0?T.amber:T.green,fontWeight:600,textAlign:"center"}}>{o.alerts}</td>
            <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:13}}>{o.countResults.map((cr,j)=><div key={j} style={{color:cr==="Balanced"?T.green:T.amber}}>{cr==="Balanced"?"Balanced":cr}</div>)}</td>
            <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,fontFamily:MO,fontSize:15,fontWeight:600}}>{o.duration}</td>
            <td style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,textAlign:"center"}}><span style={{color:T.teal,fontFamily:MO,fontSize:13,cursor:"pointer"}}>VIEW</span></td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  );

  // Operation Detail View — uses the same TlScreen/InvScreen as live dashboard
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div onClick={()=>{setSelOp(null);setArchiveMode("summary");setReplayElapsed(0);setArchiveTab("timeline");setPlayback({playing:false,cam:"CAM-1",position:0});}} style={{padding:"8px 16px",borderRadius:3,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:MO,background:T.card2,color:T.soft,border:`1px solid ${T.border}`}}>← Back</div>
          <div><div style={{fontSize:22,fontWeight:800,color:T.text,fontFamily:SA}}>{op.proc}</div><div style={{fontSize:14,fontFamily:MO,color:T.muted}}>{op.id} · {op.date} {op.time} · {op.surgeon} · {typeof op.patient==="object"?op.patient.display:op.patient} · {op.or} · {op.kit}</div></div>
          {/* Replay / Summary mode toggle */}
          <div style={{display:"flex",gap:0,marginLeft:20,border:`1px solid ${T.border}`,borderRadius:3,overflow:"hidden"}}>
            <div onClick={()=>{setArchiveMode("summary");setReplayElapsed(0);}} style={{padding:"6px 16px",cursor:"pointer",fontSize:12,fontFamily:MO,fontWeight:700,letterSpacing:1,background:archiveMode==="summary"?T.teal:"transparent",color:archiveMode==="summary"?"#fff":T.muted}}>SUMMARY</div>
            <div onClick={()=>{setArchiveMode("replay");setReplayElapsed(0);}} style={{padding:"6px 16px",cursor:"pointer",fontSize:12,fontFamily:MO,fontWeight:700,letterSpacing:1,background:(archiveMode==="replay"||archiveMode==="replay_paused")?T.amber:"transparent",color:(archiveMode==="replay"||archiveMode==="replay_paused")?"#fff":T.muted}}>REPLAY</div>
          </div>
          {archiveMode==="replay"&&<div style={{display:"flex",alignItems:"center",gap:8,marginLeft:12}}>
            <span style={{fontSize:18,fontFamily:MO,fontWeight:700,color:T.amber,animation:"bl 1s infinite"}}>{(()=>{const h=Math.floor(replayElapsed/3600),m=Math.floor((replayElapsed%3600)/60),s=replayElapsed%60;return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;})()}</span>
            <span style={{fontSize:11,fontFamily:MO,color:T.muted}}>/ {op.duration}</span>
            {/* Pause / Play */}
            <div onClick={()=>{if(replayRef.current){clearInterval(replayRef.current);replayRef.current=null;setArchiveMode("replay_paused");}}} style={{padding:"4px 10px",borderRadius:2,cursor:"pointer",fontSize:11,fontFamily:MO,fontWeight:700,background:T.amber+"22",color:T.amber,border:`1px solid ${T.amber}33`}}>❚❚</div>
          </div>}
          {archiveMode==="replay_paused"&&<div style={{display:"flex",alignItems:"center",gap:8,marginLeft:12}}>
            <span style={{fontSize:18,fontFamily:MO,fontWeight:700,color:T.muted}}>{(()=>{const h=Math.floor(replayElapsed/3600),m=Math.floor((replayElapsed%3600)/60),s=replayElapsed%60;return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;})()}</span>
            <span style={{fontSize:11,fontFamily:MO,color:T.muted}}>/ {op.duration}</span>
            <div onClick={()=>setArchiveMode("replay")} style={{padding:"4px 10px",borderRadius:2,cursor:"pointer",fontSize:11,fontFamily:MO,fontWeight:700,background:T.teal+"22",color:T.teal,border:`1px solid ${T.teal}33`}}>▶</div>
          </div>}
        </div>
        <div style={{display:"flex",gap:8}}>{[{l:"Duration",v:op.duration,c:T.text},{l:"Pieces",v:op.pieces,c:T.teal},{l:"Kit Util",v:op.kitUtil+"%",c:op.kitUtil>=75?"#4caf50":op.kitUtil>=60?"#ff9800":"#d32f2f"},{l:"Alerts",v:op.alerts,c:op.alerts>0?T.amber:T.green},{l:"Counts",v:op.counts+"×",c:T.green}].map((m,i)=>(<div key={i} style={{textAlign:"center",padding:"4px 16px"}}><div style={{fontSize:20,fontWeight:800,fontFamily:MO,color:m.c}}>{m.v}</div><div style={{fontSize:10,fontFamily:MO,color:T.muted,textTransform:"uppercase"}}>{m.l}</div></div>))}</div>
      </div>

      {/* Phase jump bar (replay mode) */}
      {(archiveMode==="replay"||archiveMode==="replay_paused")&&adapted&&<div style={{display:"flex",alignItems:"center",gap:0,flexShrink:0,marginBottom:6}}>
        {adapted.phases.map((p,i)=>{const sl=op.stateLog.find(s=>s.s===i);if(!sl)return null;const phC=T[STATES[i]?.ck]||T.muted;const isActive=i===archivePhase;const offset=p.offsetStart;return(
          <div key={i} onClick={()=>{setReplayElapsed(offset);setArchiveMode("replay_paused");}} style={{padding:"3px 8px",cursor:"pointer",fontSize:10,fontFamily:MO,fontWeight:700,background:isActive?phC+"22":"transparent",color:isActive?phC:T.muted,border:`1px solid ${isActive?phC+"44":T.border}`,borderRight:"none",whiteSpace:"nowrap"}} title={`Jump to ${STATES[i]?.l} (${fmtSec(offset)})`}>{STATES[i]?.l?.slice(0,8)||i}</div>
        );})}
        <div style={{flex:1,marginLeft:8,display:"flex",alignItems:"center",gap:6}}>
          <input type="range" min={0} max={Math.ceil(adapted.totalElapsed)} value={replayElapsed} onChange={e=>{setReplayElapsed(parseInt(e.target.value));setArchiveMode("replay_paused");}} style={{flex:1,cursor:"pointer",accentColor:T.amber,height:6}}/>
        </div>
      </div>}

      {/* Sub-tabs: Timeline | Inventory | Stats | Media */}
      <div style={{display:"flex",gap:0,flexShrink:0,marginBottom:8,border:`1px solid ${T.border}`,borderRadius:3,overflow:"hidden",alignSelf:"flex-start"}}>
        {[{k:"timeline",l:"Timeline",c:T.teal},{k:"inventory",l:"Inventory",c:T.green},{k:"stats",l:"Stats",c:T.amber},{k:"media",l:"Media",c:T.purple}].map(tab=>(
          <div key={tab.k} onClick={()=>setArchiveTab(tab.k)} style={{padding:"6px 20px",cursor:"pointer",fontSize:12,fontFamily:MO,fontWeight:700,letterSpacing:1,background:archiveTab===tab.k?tab.c:"transparent",color:archiveTab===tab.k?"#fff":T.muted}}>{tab.l.toUpperCase()}</div>
        ))}
      </div>

      {/* Tab content */}
      <div style={{flex:1,minHeight:0,overflow:"hidden"}}>
        {archiveTab==="timeline"&&<TlScreen T={T} as={archivePhase} elapsed={archiveElapsed} phasesData={adapted.phases} evtsData={adapted.systemEvents} liveEvtsData={[]} transcriptData={{static:[],live:[]}} itemsOverride={adapted.items} itemEventsOverride={adapted.itemEvents} isArchive={true}/>}
        {archiveTab==="inventory"&&<InvScreen T={T} elapsed={archiveElapsed} itemsOverride={adapted.items} itemEventsOverride={adapted.itemEvents} evtsData={adapted.systemEvents} phasesData={adapted.phases} isArchive={true} kitName={op.kit}/>}
        {archiveTab==="stats"&&<TnScreen T={T} elapsed={archiveElapsed} phasesData={adapted.phases} itemsOverride={adapted.items} itemEventsOverride={adapted.itemEvents} kitName={op.kit} isArchive={true} archiveOp={op}/>}
        {archiveTab==="media"&&(
          <div style={{display:"flex",gap:8,height:"100%",minHeight:0}}>
            {/* Video/Audio */}
            <div style={{display:"flex",flexDirection:"column",gap:12,minHeight:0,flex:1}}>
              <Cd T={T} style={{flex:1,padding:14,minHeight:0,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexShrink:0}}>
                  <Lb T={T}>Video Playback</Lb>
                  <div style={{display:"flex",gap:4}}>{["CAM-1","CAM-2","CAM-3","CAM-4"].map(c=>(<div key={c} onClick={()=>setPlayback(p=>({...p,cam:c}))} style={{padding:"4px 10px",borderRadius:2,cursor:"pointer",fontSize:12,fontFamily:MO,fontWeight:700,background:playback.cam===c?T.teal+"22":"transparent",color:playback.cam===c?T.teal:T.muted,border:`1px solid ${playback.cam===c?T.teal+"33":"transparent"}`}}>{c}</div>))}</div>
                </div>
                <div style={{flex:1,minHeight:0,borderRadius:3,overflow:"hidden",position:"relative"}}>
                  <ArchiveVideoPlayer T={T} cam={playback.cam} playing={playback.playing} position={playback.position}/>
                </div>
                <div style={{marginTop:10,flexShrink:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <div onClick={()=>setPlayback(p=>({...p,position:Math.max(p.position-.05,0)}))} style={{width:32,height:32,borderRadius:3,background:T.card2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:T.soft}}>⏮</div>
                    <div onClick={()=>setPlayback(p=>({...p,playing:!p.playing}))} style={{width:40,height:32,borderRadius:3,background:playback.playing?T.red+"18":T.teal+"18",border:`1px solid ${playback.playing?T.red+"33":T.teal+"33"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,color:playback.playing?T.red:T.teal,fontWeight:700}}>{playback.playing?"❚❚":"▶"}</div>
                    <div onClick={()=>setPlayback(p=>({...p,position:Math.min(p.position+.05,1)}))} style={{width:32,height:32,borderRadius:3,background:T.card2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:T.soft}}>⏭</div>
                    <div style={{flex:1,height:10,background:T.card2,borderRadius:2,cursor:"pointer",position:"relative"}} onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();setPlayback(p=>({...p,position:(e.clientX-rect.left)/rect.width}));}}>
                      <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${playback.position*100}%`,borderRadius:2,background:T.teal}}/>
                      {op.events.filter(e=>e.tp==="warn"||e.tp==="gate").map((e,i)=>(<div key={i} style={{position:"absolute",top:-2,height:14,width:3,borderRadius:2,background:e.tp==="warn"?T.amber:T.teal,left:`${(i/(op.events.length-1))*100}%`,opacity:.6}}/>))}
                      <div style={{position:"absolute",top:-3,left:`${playback.position*100}%`,transform:"translateX(-50%)",width:14,height:14,borderRadius:7,background:T.teal,border:`2px solid ${T.text}`,boxShadow:`0 0 8px ${T.teal}55`}}/>
                    </div>
                    <span style={{fontSize:13,fontFamily:MO,color:T.soft,minWidth:52}}>{Math.floor(playback.position*100)}%</span>
                  </div>
                </div>
              </Cd>
              <Cd T={T} style={{padding:12,flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <Lb T={T}>Audio Playback</Lb>
                  <div style={{display:"flex",gap:4}}>{["MIC-1","MIC-2"].map(m=>(<div key={m} onClick={()=>setAudioPlay(audioPlay===m?null:m)} style={{padding:"6px 14px",borderRadius:3,cursor:"pointer",fontSize:13,fontFamily:MO,fontWeight:700,background:audioPlay===m?T.purple+"22":"transparent",color:audioPlay===m?T.purple:T.muted,border:`1px solid ${audioPlay===m?T.purple+"33":"transparent"}`}}>{audioPlay===m?"■ Stop":`▶ ${m}`}</div>))}</div>
                </div>
                {audioPlay&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:10}}><AudioMeter T={T} active={true}/><div style={{flex:1}}><div style={{height:6,background:T.card2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${playback.position*100}%`,borderRadius:3,background:T.purple,transition:"width .3s"}}/></div></div><span style={{fontSize:12,fontFamily:MO,color:T.purple}}>Playing</span></div>}
              </Cd>
            </div>
            {/* Recordings + Zone Distribution */}
            <div style={{display:"flex",flexDirection:"column",gap:12,minHeight:0,width:320,flexShrink:0}}>
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
                    </div>
                  </div>
                ))}
              </Cd>
              {op.zMayo!=null&&<Cd T={T} style={{padding:14,flexShrink:0}}>
                <Lb T={T}>Zone Distribution (End of Case)</Lb>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
                  {[{l:"Mayo Stand",v:op.zMayo,c:T.teal},{l:"Back Table",v:op.zBack,c:T.blue},{l:"Patient",v:op.zPatient,c:T.purple},{l:"Disposed",v:op.zDisposed,c:T.amber}].map((z,i)=>(
                    <div key={i} style={{padding:"10px 12px",borderRadius:3,background:z.c+"0c",border:`1px solid ${z.c}18`}}>
                      <div style={{fontSize:22,fontWeight:800,fontFamily:MO,color:z.c}}>{z.v}</div>
                      <div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",marginTop:2}}>{z.l}</div>
                      <div style={{marginTop:4,height:4,borderRadius:2,background:T.card2,overflow:"hidden"}}><div style={{height:"100%",width:`${(z.v/op.pieces)*100}%`,borderRadius:2,background:z.c}}/></div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:8,fontSize:12,fontFamily:MO,color:T.muted,textAlign:"center"}}>Total: {op.pieces} pieces · Kit: {op.kit} · Utilization: {op.kitUtil}%</div>
              </Cd>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT
   ══════════════════════════════════════════════════════════ */
export default function App() {
  const [user,setUser]=useState(()=>{try{const s=localStorage.getItem("orking_user");return s?JSON.parse(s):null;}catch{return null;}});
  const [theme,setTheme]=useState("light");const [screen,setScreen]=useState("timeline");
  // Procedure started 35 min ago — persisted so refresh resumes from same point
  // Default: start from OR Setup (offset -2071s from procedure start)
  const [procStart]=useState(()=>{let s=localStorage.getItem("orking_ps3");if(!s){s=Date.now()+2071*1000;localStorage.setItem("orking_ps3",s);["orking_proc_start","orking_ps3"].forEach(k=>localStorage.removeItem(k));}return parseInt(s);});
  const [sec,setSec]=useState(()=>Math.floor((Date.now()-procStart)/1000));
  const [pendingItem,setPendingItem]=useState(null);
  const [showSettings,setShowSettings]=useState(false);
  const [showReset,setShowReset]=useState(false);
  const [resetPhase,setResetPhase]=useState(1);
  const [resetMin,setResetMin]=useState(0);
  const T=theme==="dark"?DK:LT;
  // ── Event-driven active phase ──
  // Phase is driven by phase.start events from the EventBus (MockAlgorithm or real backend via WebSocket).
  // Initialize from elapsed time so we start at the correct phase on load.
  const PHASE_STARTS=PHASES.map(p=>p.offsetStart);
  const initPhase=useCallback(()=>{const el=Math.floor((Date.now()-procStart)/1000);for(let i=PHASE_STARTS.length-1;i>=0;i--){if(el>=PHASE_STARTS[i])return i;}return 0;},[procStart]);
  const [as,setAs]=useState(initPhase);
  useEffect(()=>{const t=setInterval(()=>setSec(Math.floor((Date.now()-procStart)/1000)),1000);return()=>clearInterval(t);},[procStart]);
  // Fetch kits from SurgicalInstruments API on startup
  useEffect(()=>{fetchKitsFromAPI();},[]);
  // Subscribe to phase.start events — update active phase when algo/backend emits
  useEffect(()=>{
    const handler=(evt)=>{
      if(evt._historical)return; // skip historical replay, already handled by initPhase
      const idx=evt.data?.phaseIndex;
      if(idx!=null&&idx>=0&&idx<PHASES.length){setAs(idx);}
    };
    eventBus.on(EVT_TYPES.PHASE_START,handler);
    return()=>eventBus.off(EVT_TYPES.PHASE_START,handler);
  },[]);
  // Start MockAlgorithm — emits events on the EventBus at real-time pace
  useEffect(()=>{
    eventBus.clearHistory();
    const mock=new MockAlgorithm(eventBus);
    mock.start(procStart);
    return()=>mock.stop();
  },[procStart]);
  // Primary tabs = active surgery
  const surgeryTabs=[{k:"timeline",l:"Timeline",i:"→"},{k:"inventory",l:"Inventory",i:"▦"},{k:"turnover",l:"Case Analytics",i:"⚡"}];
  // Secondary = not part of running surgery
  const isSurgeryTab = surgeryTabs.some(t=>t.k===screen);

  const handleLogin=(u)=>{setUser(u);localStorage.setItem("orking_user",JSON.stringify(u));};
  const handleLogout=()=>{setUser(null);localStorage.removeItem("orking_user");};

  if(!user)return(<><style>{`@keyframes bl{0%,100%{opacity:1}50%{opacity:.3}}*{box-sizing:border-box;}html,body,#root{margin:0;padding:0;overflow:hidden;width:100%;height:100%;}`}</style><Login onLogin={handleLogin}/></>);

  return(
    <div style={{width:"100vw",height:"100vh",background:T.bg,color:T.text,fontFamily:SA,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`@keyframes bl{0%,100%{opacity:1}50%{opacity:.3}}*{box-sizing:border-box;}html,body,#root{margin:0;padding:0;overflow:hidden;background:${T.bg};width:100%;height:100%;font-family:${SA};}scrollbar-width:thin;`}</style>
      <div style={{background:T.panel,borderBottom:`2px solid ${T.border}`,padding:"6px 16px",display:"flex",alignItems:"center",flexShrink:0,gap:0}}>
        {/* LEFT: Logo + Case info */}
        <img src={T.n==="dark"?"/assets/trackimed-logo-white.png":"/assets/trackimed-logo.png"} alt="TrackiMed" style={{height:28}} onError={(e)=>{e.target.style.display="none";}}/>
        <div style={{borderLeft:`2px solid ${T.border}`,paddingLeft:10,marginLeft:10,marginRight:12}}>
          <div style={{fontSize:15,fontWeight:700,color:T.text,fontFamily:SA}}>ORKing <span style={{color:T.teal,fontWeight:400,fontSize:10,fontFamily:MO}}>v2.0.0</span> <span style={{color:T.muted,fontWeight:400,fontSize:12,fontFamily:MO}}>{user.or} · {(()=>{const d=new Date(procStart-2071*1000);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;})()}</span></div>
          <div style={{fontSize:11,fontFamily:MO,color:T.muted}}>Case #2026-0207-003 · Mastectomy / Reconstruction</div>
        </div>

        {/* Room State + Phase — left side after case info */}
        {(()=>{const isIdle=as>=STATES.length-1;const idleSec=isIdle?Math.max(0,sec-PHASES[PHASES.length-1].offsetStart):0;const idleMin=Math.floor(idleSec/60);const idleAlert=isIdle&&idleMin>=15;const roomColor=isIdle?(idleAlert?T.red:T.teal):T.green;const roomLabel=isIdle?"AVAILABLE":"IN SURGERY";const phaseColor=isIdle?(idleAlert?T.red:T[STATES[as].ck]):T[STATES[as].ck];return(
        <div style={{display:"flex",alignItems:"center",gap:10,marginRight:12,padding:"4px 12px",borderRadius:3,border:`1px solid ${roomColor}33`,background:roomColor+"0a"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:roomColor,...(isIdle&&!idleAlert?{}:{animation:"bl 1.5s infinite"})}}/>
            <div>
              <div style={{fontSize:9,fontFamily:MO,color:T.muted,letterSpacing:1,lineHeight:1}}>ROOM</div>
              <div style={{fontSize:12,fontFamily:MO,fontWeight:700,color:roomColor,letterSpacing:.5}}>{roomLabel}</div>
            </div>
          </div>
          {isIdle&&<div style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:1,height:22,background:T.border}}/>
            <div>
              <div style={{fontSize:9,fontFamily:MO,color:T.muted,letterSpacing:1,lineHeight:1}}>IDLE</div>
              <div style={{fontSize:12,fontFamily:MO,fontWeight:700,color:idleAlert?T.red:T.teal,letterSpacing:.5}}>{idleMin} min</div>
            </div>
            {idleAlert&&<div style={{fontSize:10,fontFamily:MO,color:T.red,fontWeight:700,background:T.red+"18",padding:"2px 6px",borderRadius:2,animation:"bl 1s infinite"}}>⚠ ALERT</div>}
          </div>}
          {!isIdle&&<><div style={{width:1,height:22,background:T.border}}/>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:7,height:7,borderRadius:2,background:phaseColor,animation:"bl 1s infinite"}}/>
            <div>
              <div style={{fontSize:9,fontFamily:MO,color:T.muted,letterSpacing:1,lineHeight:1}}>PHASE {as+1}/{STATES.length}</div>
              <div style={{fontSize:12,fontFamily:MO,fontWeight:700,color:phaseColor,letterSpacing:.5}}>{STATES[as].l.toUpperCase()}</div>
            </div>
          </div></>}
        </div>);})()}

        {/* LIVE surgery tabs — centered */}
        <div style={{display:"flex",alignItems:"stretch",gap:0,height:42,flex:1,justifyContent:"center"}}>
          {surgeryTabs.map(t=>(<div key={t.k} onClick={()=>setScreen(t.k)} style={{display:"flex",alignItems:"center",gap:4,padding:"0 16px",cursor:"pointer",background:screen===t.k?T.card:"transparent",borderBottom:screen===t.k?`3px solid ${T.teal}`:"3px solid transparent",borderTop:screen===t.k?`3px solid ${T.teal}`:"3px solid transparent",fontFamily:MO,fontSize:13,fontWeight:screen===t.k?700:500,color:screen===t.k?T.teal:T.muted,textTransform:"uppercase",letterSpacing:.5}}>{t.l}</div>))}
        </div>

        {/* NON-LIVE tabs — right side */}
        <div style={{display:"flex",alignItems:"stretch",gap:0,height:42,marginRight:8}}>
          <div onClick={()=>setScreen("archive")} style={{display:"flex",alignItems:"center",padding:"0 14px",cursor:"pointer",background:screen==="archive"?T.card:"transparent",borderBottom:screen==="archive"?`3px solid ${T.purple}`:"3px solid transparent",borderTop:screen==="archive"?`3px solid ${T.purple}`:"3px solid transparent",fontFamily:MO,fontSize:13,fontWeight:screen==="archive"?700:500,color:screen==="archive"?T.purple:T.muted,textTransform:"uppercase",letterSpacing:.5}}>Archive</div>
          <div onClick={()=>setScreen("or_analytics")} style={{display:"flex",alignItems:"center",padding:"0 14px",cursor:"pointer",background:screen==="or_analytics"?T.card:"transparent",borderBottom:screen==="or_analytics"?`3px solid ${T.blue}`:"3px solid transparent",borderTop:screen==="or_analytics"?`3px solid ${T.blue}`:"3px solid transparent",fontFamily:MO,fontSize:13,fontWeight:screen==="or_analytics"?700:500,color:screen==="or_analytics"?T.blue:T.muted,textTransform:"uppercase",letterSpacing:.5}}>OR Stats</div>
        </div>

        {/* RIGHT: Quick links + Icon buttons */}
        <div style={{display:"flex",alignItems:"center",gap:3}}>
          <a href="https://surgicalinstruments.onrender.com/dashboard" target="_blank" rel="noopener" title="Surgical Instruments Dashboard" style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:T.card2,border:`1px solid ${T.border}`,borderRadius:2,fontSize:14,color:T.muted,textDecoration:"none"}}>🔬</a>
          <a href="https://surgicalinstruments.onrender.com/" target="_blank" rel="noopener" title="Instrument Capture App" style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:T.card2,border:`1px solid ${T.border}`,borderRadius:2,fontSize:14,color:T.muted,textDecoration:"none"}}>📷</a>
          <div style={{width:1,height:20,background:T.border,margin:"0 2px"}}/>
          <div onClick={()=>setShowSettings(!showSettings)} title="Settings" style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:showSettings?T.teal:T.card2,border:`1px solid ${T.border}`,borderRadius:2,fontSize:16,color:showSettings?"#fff":T.muted}}>⚙</div>
          <div onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} title={theme==="dark"?"Light mode":"Dark mode"} style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:T.card2,border:`1px solid ${T.border}`,borderRadius:2,fontSize:14,color:T.muted}}>{theme==="dark"?"☀":"◐"}</div>
          <div onClick={()=>setShowReset(!showReset)} title="Reset to phase" style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:showReset?T.amber:T.card2,border:`1px solid ${T.border}`,borderRadius:2,fontSize:14,color:showReset?"#fff":T.amber}}>↺</div>
          <div onClick={handleLogout} title="Exit" style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:T.card2,border:`1px solid ${T.border}`,borderRadius:2,fontSize:14,color:T.red}}>⏻</div>
        </div>
      </div>

      {/* Content area */}
      <div style={{flex:1,padding:8,overflow:"hidden",minHeight:0,position:"relative"}}>
        {screen==="inventory"&&<InvScreen T={T} pendingItem={pendingItem} onPendingClear={()=>setPendingItem(null)} elapsed={sec}/>}
        {screen==="timeline"&&<TlScreen T={T} as={as} elapsed={sec} onScreenChange={(scr,itemId)=>{setPendingItem(itemId);setScreen(scr);}}/>}
        {screen==="turnover"&&<TnScreen T={T} elapsed={sec}/>}
        {screen==="archive"&&<ArchiveScreen T={T}/>}
        {screen==="or_analytics"&&<ORAnalyticsScreen T={T}/>}

        {/* Reset phase picker panel */}
        {showReset&&<div style={{position:"absolute",top:0,right:0,bottom:0,width:360,background:T.panel,borderLeft:`2px solid ${T.border}`,zIndex:55,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"8px 12px",borderBottom:`2px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:T.card2}}>
            <span style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:MO,textTransform:"uppercase",letterSpacing:1}}>Reset Procedure</span>
            <div onClick={()=>setShowReset(false)} style={{padding:"2px 8px",cursor:"pointer",background:T.card,border:`1px solid ${T.border}`,borderRadius:2,fontSize:11,fontFamily:MO,color:T.muted}}>CLOSE</div>
          </div>
          <div style={{flex:1,overflow:"auto",padding:14,minHeight:0}}>
            <div style={{fontSize:11,fontFamily:MO,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>Select Phase</div>
            {PHASES.map((p,i)=>{if(i===0)return null;const isSel=resetPhase===i;const pc=T[STATES[i]?.ck]||T.teal;const dur=p.duration||0;return(
              <div key={i} onClick={()=>{setResetPhase(i);setResetMin(0);}} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",marginBottom:2,cursor:"pointer",borderRadius:3,background:isSel?pc+"15":"transparent",border:`1px solid ${isSel?pc+"44":"transparent"}`}}>
                <div style={{width:24,height:24,borderRadius:p.gate?4:12,background:isSel?pc:pc+"33",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:10,fontWeight:700,color:isSel?"#fff":pc,fontFamily:MO}}>{i}</span>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:isSel?700:400,color:isSel?pc:T.text,fontFamily:SA}}>{p.label}</div>
                  <div style={{fontSize:10,fontFamily:MO,color:T.muted}}>{dur>0?`${dur} min`:""}{p.gate?" · Safety Gate":""}</div>
                </div>
                {isSel&&<span style={{fontSize:12,color:pc}}>●</span>}
              </div>
            );})}

            {/* Minutes slider */}
            <div style={{marginTop:16,padding:"12px 10px",background:T.card2,borderRadius:3,border:`1px solid ${T.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1}}>Minutes into phase</span>
                <span style={{fontSize:16,fontFamily:MO,fontWeight:700,color:T[STATES[resetPhase]?.ck]||T.teal}}>{resetMin} min</span>
              </div>
              <input type="range" min={0} max={Math.max(1,Math.ceil(PHASES[resetPhase]?.duration||1))} value={resetMin} onChange={e=>setResetMin(parseInt(e.target.value))} style={{width:"100%",cursor:"pointer",accentColor:T[STATES[resetPhase]?.ck]||T.teal}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,fontFamily:MO,color:T.muted,marginTop:2}}>
                <span>0</span>
                <span>{Math.ceil(PHASES[resetPhase]?.duration||1)} min</span>
              </div>
            </div>

            {/* Apply button */}
            <div onClick={()=>{const offset=PHASES[resetPhase].offsetStart+resetMin*60;const ms=Date.now()-offset*1000;localStorage.setItem("orking_ps3",ms);location.reload();}} style={{marginTop:16,padding:"10px 0",textAlign:"center",cursor:"pointer",background:T.amber,borderRadius:3,fontSize:13,fontFamily:MO,fontWeight:700,color:"#fff",letterSpacing:1}}>
              RESET TO {PHASES[resetPhase]?.label?.toUpperCase()} + {resetMin} MIN
            </div>
          </div>
        </div>}

        {/* Settings slide-over panel */}
        {showSettings&&<div style={{position:"absolute",top:0,right:0,bottom:0,width:400,background:T.panel,borderLeft:`2px solid ${T.border}`,zIndex:50,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"8px 12px",borderBottom:`2px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:T.card2}}>
            <span style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:MO,textTransform:"uppercase",letterSpacing:1}}>System Settings</span>
            <div onClick={()=>setShowSettings(false)} style={{padding:"2px 8px",cursor:"pointer",background:T.card,border:`1px solid ${T.border}`,borderRadius:2,fontSize:11,fontFamily:MO,color:T.muted}}>CLOSE</div>
          </div>
          <div style={{flex:1,overflow:"auto",padding:14,minHeight:0}}><SettingsScreen T={T}/></div>
        </div>}
      </div>
      <FeedbackOverlay T={T} screen={screen} onScreenChange={setScreen}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   OR ANALYTICS SCREEN — Cross-case metrics per OR
   ══════════════════════════════════════════════════════════ */
function ORAnalyticsScreen({T}) {
  const orData = [
    {period:"This Week",cases:12,avgDur:"2:18",turnover:"22m",util:"68%",alerts:4,countAcc:"99.2%"},
    {period:"Last Week",cases:15,avgDur:"2:05",turnover:"19m",util:"72%",alerts:2,countAcc:"99.8%"},
    {period:"This Month",cases:48,avgDur:"2:12",turnover:"21m",util:"70%",alerts:11,countAcc:"99.4%"},
  ];
  const procTypes = [
    {proc:"Mastectomy / Reconstruction",cases:14,avgDur:"1:28",c:T.teal},
    {proc:"Appendectomy (Lap)",cases:10,avgDur:"1:42",c:T.green},
    {proc:"Hemicolectomy",cases:8,avgDur:"3:14",c:T.purple},
    {proc:"Hernia Repair",cases:7,avgDur:"1:52",c:T.cyan},
    {proc:"Thyroidectomy",cases:5,avgDur:"2:08",c:T.amber},
    {proc:"Mastectomy",cases:4,avgDur:"2:44",c:T.orange},
  ];
  const anPanels=useFloatingPanels("an_panels_v1",[
    {id:"overview",title:"OR-1 Overview & Metrics",x:8,y:8,w:560,h:280,minimized:false,z:1},
    {id:"trend",title:"Trend by Period",x:8,y:296,w:560,h:280,minimized:false,z:2},
    {id:"procedures",title:"By Procedure Type",x:576,y:8,w:480,h:568,minimized:false,z:3},
    {id:"stats",title:"Quick Stats",x:1064,y:8,w:340,h:568,minimized:false,z:4},
  ]);
  return(
    <div style={{position:"relative",height:"100%",minHeight:0,overflow:"hidden"}}>
      {/* OVERVIEW panel */}
      <FloatingPanel panel={anPanels.panels.find(p=>p.id==="overview")} update={anPanels.update} bringToFront={anPanels.bringToFront} onInteractStart={anPanels.showGrid} onInteractEnd={anPanels.hideGrid} T={T} headerColor={T.blue}><div style={{height:"100%",display:"flex",flexDirection:"column",gap:12,padding:12,overflow:"auto",boxSizing:"border-box"}}>
        <div><div style={{fontSize:14,fontFamily:MO,color:T.blue,textTransform:"uppercase",letterSpacing:2}}>OR Performance</div><div style={{fontSize:24,fontWeight:800,color:T.text,fontFamily:SA}}>OR-1 Overview</div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[{l:"Cases (Month)",v:"48",c:T.teal},{l:"Avg Duration",v:"2:12",c:T.text},{l:"OR Utilization",v:"70%",c:T.green},{l:"Avg Turnover",v:"21m",c:T.blue},{l:"Count Accuracy",v:"99.4%",c:T.green},{l:"Total Alerts",v:"11",c:T.amber}].map((m,i)=>(
            <Cd key={i} T={T} style={{textAlign:"center",padding:14}}>
              <div style={{fontSize:28,fontWeight:800,fontFamily:MO,color:m.c,lineHeight:1}}>{m.v}</div>
              <div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginTop:6}}>{m.l}</div>
            </Cd>
          ))}
        </div>
      </div></FloatingPanel>

      {/* TREND panel */}
      <FloatingPanel panel={anPanels.panels.find(p=>p.id==="trend")} update={anPanels.update} bringToFront={anPanels.bringToFront} onInteractStart={anPanels.showGrid} onInteractEnd={anPanels.hideGrid} T={T} headerColor={T.teal}>
        <div style={{flex:1,padding:14,minHeight:0,overflow:"hidden",height:"100%",display:"flex",flexDirection:"column",boxSizing:"border-box"}}>
          <Lb T={T}>Trend by Period</Lb>
          <div style={{flex:1,overflowY:"auto",minHeight:0}}>
            <div style={{display:"grid",gridTemplateColumns:"100px 60px 70px 70px 60px 60px 70px",gap:6,padding:"8px 0",borderBottom:`2px solid ${T.border}`,position:"sticky",top:0,background:T.card,zIndex:1}}>
              {["Period","Cases","Avg Dur","Turn","Util","Alerts","Counts"].map(h=><span key={h} style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase"}}>{h}</span>)}
            </div>
            {orData.map((r,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"100px 60px 70px 70px 60px 60px 70px",gap:6,padding:"10px 0",borderBottom:`1px solid ${T.border}`,alignItems:"center"}}>
                <span style={{fontSize:14,fontWeight:600,color:T.text,fontFamily:SA}}>{r.period}</span>
                <span style={{fontSize:16,fontFamily:MO,color:T.teal,fontWeight:700}}>{r.cases}</span>
                <span style={{fontSize:14,fontFamily:MO,color:T.soft}}>{r.avgDur}</span>
                <span style={{fontSize:14,fontFamily:MO,color:T.soft}}>{r.turnover}</span>
                <span style={{fontSize:14,fontFamily:MO,color:T.green,fontWeight:600}}>{r.util}</span>
                <span style={{fontSize:14,fontFamily:MO,color:parseInt(r.alerts)>3?T.amber:T.green}}>{r.alerts}</span>
                <span style={{fontSize:14,fontFamily:MO,color:T.green}}>{r.countAcc}</span>
              </div>
            ))}
          </div>
        </div>
      </FloatingPanel>

      {/* BY PROCEDURE panel */}
      <FloatingPanel panel={anPanels.panels.find(p=>p.id==="procedures")} update={anPanels.update} bringToFront={anPanels.bringToFront} onInteractStart={anPanels.showGrid} onInteractEnd={anPanels.hideGrid} T={T} headerColor={T.purple}>
        <div style={{padding:14,minHeight:0,overflow:"hidden",height:"100%",display:"flex",flexDirection:"column",boxSizing:"border-box"}}>
        <Lb T={T}>By Procedure Type</Lb>
        <div style={{flex:1,overflowY:"auto",minHeight:0}}>
          {procTypes.map((p,i)=>{const maxCases=14;return(
            <div key={i} style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:16,fontWeight:600,color:T.text,fontFamily:SA}}>{p.proc}</span>
                <div style={{display:"flex",gap:12}}>
                  <span style={{fontSize:14,fontFamily:MO,color:p.c,fontWeight:700}}>{p.cases} cases</span>
                  <span style={{fontSize:14,fontFamily:MO,color:T.soft}}>avg {p.avgDur}</span>
                </div>
              </div>
              <div style={{background:T.card2,borderRadius:2,height:14,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:2,width:`${(p.cases/maxCases)*100}%`,background:p.c}}/>
              </div>
            </div>
          );})}
        </div>
        </div>
      </FloatingPanel>

      {/* QUICK STATS panel */}
      <FloatingPanel panel={anPanels.panels.find(p=>p.id==="stats")} update={anPanels.update} bringToFront={anPanels.bringToFront} onInteractStart={anPanels.showGrid} onInteractEnd={anPanels.hideGrid} T={T} headerColor={T.green}>
        <div style={{display:"flex",flexDirection:"column",gap:12,minHeight:0,height:"100%",padding:12,overflow:"auto",boxSizing:"border-box"}}>
        <div style={{flexShrink:0}}>
          <Lb T={T}>Efficiency Gains</Lb>
          {[{l:"Time Saved / Case",v:"~42 min",c:T.green},{l:"Monthly Savings",v:"$280K",c:T.teal},{l:"Retained Items",v:"0",c:T.green},{l:"Auto-Doc Rate",v:"97%",c:T.cyan}].map((m,i)=>(
            <div key={i} style={{padding:"8px 0",borderBottom:i<3?`1px solid ${T.border}`:"none"}}>
              <div style={{fontSize:11,fontFamily:MO,color:T.muted,textTransform:"uppercase"}}>{m.l}</div>
              <div style={{fontSize:22,fontWeight:700,fontFamily:MO,color:m.c,marginTop:3}}>{m.v}</div>
            </div>
          ))}
        </div>
        <div style={{flexShrink:0,paddingTop:6,borderTop:`1px solid ${T.border}`}}>
          <Lb T={T}>Staff Leaderboard</Lb>
          {[{name:"Physician A",cases:18,eff:"94%"},{name:"Physician C",cases:14,eff:"91%"},{name:"Physician D",cases:10,eff:"88%"},{name:"Physician E",cases:6,eff:"92%"}].map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:i<3?`1px solid ${T.border}`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:24,height:24,borderRadius:2,background:T.teal+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:T.teal,fontFamily:MO}}>{i+1}</div>
                <span style={{fontSize:14,fontWeight:600,color:T.text,fontFamily:SA}}>{s.name}</span>
              </div>
              <div style={{display:"flex",gap:12}}>
                <span style={{fontSize:13,fontFamily:MO,color:T.soft}}>{s.cases}c</span>
                <span style={{fontSize:13,fontFamily:MO,color:T.green,fontWeight:600}}>{s.eff}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{flex:1,minHeight:0,overflow:"hidden",paddingTop:6,borderTop:`1px solid ${T.border}`}}>
          <Lb T={T}>Alert Distribution</Lb>
          <div style={{overflowY:"auto"}}>
            {[{type:"Item Drop",count:5,c:T.orange},{type:"Count Mismatch",count:3,c:T.red},{type:"Mid-Case Tray",count:2,c:T.amber},{type:"Camera Occlusion",count:1,c:T.muted}].map((a,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:10,height:10,borderRadius:3,background:a.c}}/>
                  <span style={{fontSize:14,color:T.text,fontFamily:SA}}>{a.type}</span>
                </div>
                <span style={{fontSize:16,fontFamily:MO,fontWeight:700,color:a.c}}>{a.count}</span>
              </div>
            ))}
          </div>
        </div>
        </div>
      </FloatingPanel>

      <GridOverlay visible={anPanels.gridVisible}/>
      <MinimizedTray panels={anPanels.panels} update={anPanels.update} T={T}/>
    </div>
  );
}
