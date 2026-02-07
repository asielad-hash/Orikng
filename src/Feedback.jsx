import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "./firebase";
import { ref, onValue, push, update } from "firebase/database";

/* ── Shared primitives (duplicated from App.jsx) ── */
const MO=`'JetBrains Mono','SF Mono',monospace`;
const SA=`'DM Sans',-apple-system,sans-serif`;
const P=({children,color,T,filled,small})=><span style={{display:"inline-flex",alignItems:"center",padding:small?"2px 8px":"3px 12px",borderRadius:99,fontSize:small?10:13,fontWeight:700,letterSpacing:.5,fontFamily:MO,textTransform:"uppercase",background:filled?color:color+"16",color:filled?(T.n==="dark"?"#080b14":"#fff"):color,border:`1px solid ${color}28`,whiteSpace:"nowrap",lineHeight:1.7}}>{children}</span>;
const Cd=({children,style,T})=><div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,boxShadow:`0 1px 3px ${T.shadow}`,display:"flex",flexDirection:"column",...style}}>{children}</div>;
const Lb=({children,T})=><div style={{fontSize:13,fontFamily:MO,color:T.muted,textTransform:"uppercase",letterSpacing:2.5,marginBottom:10,flexShrink:0}}>{children}</div>;

/* ── Constants ── */
const PRIORITIES=[
  {key:"critical",label:"Critical",ck:"red"},
  {key:"high",label:"High",ck:"orange"},
  {key:"medium",label:"Medium",ck:"amber"},
  {key:"low",label:"Low",ck:"teal"}
];
const CATEGORIES=[
  {key:"ux",label:"UX"},
  {key:"bug",label:"Bug"},
  {key:"feature",label:"Feature"},
  {key:"content",label:"Content"},
  {key:"general",label:"General"}
];
const SCREEN_LABELS={inventory:"Inventory",timeline:"Timeline",turnover:"Analytics",settings:"Settings",archive:"Archive"};

/* ── AI enhance helper ── */
async function enhanceText(text,screen,category,priority){
  try{
    const res=await fetch("/api/enhance",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,screen,category,priority})});
    if(!res.ok)throw new Error("API error");
    const data=await res.json();
    return data.enhanced||text;
  }catch(e){console.error("Enhance failed:",e);return null;}
}

/* ── Helpers ── */
function timeAgo(ts){
  const d=Date.now()-ts;
  if(d<60000)return "just now";
  if(d<3600000)return `${Math.floor(d/60000)}m ago`;
  if(d<86400000)return `${Math.floor(d/3600000)}h ago`;
  return `${Math.floor(d/86400000)}d ago`;
}

/* ══════════════════════════════════════════════════════════
   AUTHOR PROMPT
   ══════════════════════════════════════════════════════════ */
function AuthorPrompt({T,onSave}){
  const [name,setName]=useState("");
  return(
    <div style={{position:"fixed",inset:0,zIndex:10001,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:SA}}>
      <Cd T={T} style={{padding:32,width:380,gap:16,alignItems:"center"}}>
        <div style={{fontSize:20,fontWeight:700,color:T.text}}>Welcome to Feedback</div>
        <div style={{fontSize:14,color:T.soft,textAlign:"center"}}>Enter your name to start leaving comments and pins on the mockup.</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name..."
          onKeyDown={e=>{if(e.key==="Enter"&&name.trim())onSave(name.trim());}}
          style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.card2,color:T.text,fontSize:15,fontFamily:SA,outline:"none"}}/>
        <button onClick={()=>{if(name.trim())onSave(name.trim());}}
          style={{padding:"10px 28px",borderRadius:10,border:"none",background:T.teal,color:"#fff",fontWeight:700,fontSize:14,fontFamily:SA,cursor:"pointer",opacity:name.trim()?1:.4}}>
          Start Reviewing
        </button>
      </Cd>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMMENT ITEM
   ══════════════════════════════════════════════════════════ */
function CommentItem({item,T,type,onResolve,onGoTo}){
  const prio=PRIORITIES.find(p=>p.key===item.priority)||PRIORITIES[2];
  const isPin=type==="pin";
  return(
    <div style={{padding:12,borderRadius:12,background:T.card2,border:`1px solid ${T.border}`,opacity:item.resolved?.6:1,transition:"opacity .15s"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:13,fontWeight:700,color:T.teal,fontFamily:SA}}>{item.author}</span>
          <span style={{fontSize:11,color:T.muted,fontFamily:MO}}>{timeAgo(item.timestamp)}</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {isPin&&<span style={{fontSize:10,color:T.purple,fontFamily:MO}}>PIN</span>}
          <P color={T[prio.ck]} T={T} small>{prio.label}</P>
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        <P color={T.cyan} T={T} small>{SCREEN_LABELS[item.screen]||item.screen}</P>
        {item.category&&<P color={T.muted} T={T} small>{item.category}</P>}
      </div>
      <div style={{fontSize:14,color:item.resolved?T.muted:T.text,fontFamily:SA,lineHeight:1.5,textDecoration:item.resolved?"line-through":"none"}}>{item.text}</div>
      {item.resolved&&<div style={{fontSize:11,color:T.muted,fontFamily:MO,marginTop:6}}>Resolved by {item.resolvedBy} · {timeAgo(item.resolvedAt)}</div>}
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <button onClick={()=>onResolve(item)} style={{padding:"4px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:item.resolved?T.card2:T.green+"22",color:item.resolved?T.muted:T.green,fontSize:12,fontWeight:600,fontFamily:SA,cursor:"pointer"}}>
          {item.resolved?"Reopen":"Resolve"}
        </button>
        {onGoTo&&<button onClick={()=>onGoTo(item)} style={{padding:"4px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.soft,fontSize:12,fontWeight:600,fontFamily:SA,cursor:"pointer"}}>
          Go to
        </button>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMMENT FORM
   ══════════════════════════════════════════════════════════ */
function CommentForm({T,author,screen,onSubmit}){
  const [text,setText]=useState("");
  const [priority,setPriority]=useState("medium");
  const [category,setCategory]=useState("general");
  const [enhancing,setEnhancing]=useState(false);
  const submit=()=>{
    if(!text.trim())return;
    onSubmit({author,text:text.trim(),screen,priority,category,timestamp:Date.now(),resolved:false,resolvedBy:null,resolvedAt:null});
    setText("");
  };
  const enhance=async()=>{
    if(!text.trim()||enhancing)return;
    setEnhancing(true);
    const result=await enhanceText(text,screen,category,priority);
    if(result)setText(result);
    setEnhancing(false);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10,flexShrink:0}}>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Leave feedback (brief is fine — use AI to expand)..."
        onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey)submit();}}
        style={{width:"100%",padding:10,borderRadius:10,border:`1px solid ${T.border}`,background:T.card2,color:T.text,fontSize:14,fontFamily:SA,resize:"vertical",minHeight:60,outline:"none"}}/>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {PRIORITIES.map(p=>(
          <div key={p.key} onClick={()=>setPriority(p.key)}
            style={{padding:"3px 10px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:MO,textTransform:"uppercase",
              background:priority===p.key?T[p.ck]+"28":"transparent",color:priority===p.key?T[p.ck]:T.muted,border:`1px solid ${priority===p.key?T[p.ck]+"44":T.border}`}}>
            {p.label}
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {CATEGORIES.map(c=>(
          <div key={c.key} onClick={()=>setCategory(c.key)}
            style={{padding:"3px 10px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:SA,
              background:category===c.key?T.teal+"22":"transparent",color:category===c.key?T.teal:T.muted,border:`1px solid ${category===c.key?T.teal+"33":T.border}`}}>
            {c.label}
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={enhance} disabled={!text.trim()||enhancing}
          style={{padding:"8px 16px",borderRadius:10,border:`1px solid ${T.purple}44`,background:T.purple+"18",color:enhancing?T.muted:T.purple,fontWeight:700,fontSize:12,fontFamily:SA,cursor:enhancing?"wait":"pointer",opacity:text.trim()?1:.4}}>
          {enhancing?"Enhancing...":"Enhance with AI"}
        </button>
        <button onClick={submit} style={{padding:"8px 20px",borderRadius:10,border:"none",background:T.teal,color:"#fff",fontWeight:700,fontSize:13,fontFamily:SA,cursor:"pointer",opacity:text.trim()?1:.4}}>
          Submit (Ctrl+Enter)
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PIN POPOVER (input form after dropping a pin)
   ══════════════════════════════════════════════════════════ */
function PinPopover({T,x,y,author,screen,onSubmit,onCancel}){
  const [text,setText]=useState("");
  const [priority,setPriority]=useState("medium");
  const [category,setCategory]=useState("ux");
  const [enhancing,setEnhancing]=useState(false);
  const ref_=useRef(null);
  useEffect(()=>{ref_.current?.focus();},[]);
  const submit=()=>{
    if(!text.trim())return;
    onSubmit({author,text:text.trim(),screen,xPct:x,yPct:y,priority,category,timestamp:Date.now(),resolved:false,resolvedBy:null,resolvedAt:null});
  };
  const enhance=async()=>{
    if(!text.trim()||enhancing)return;
    setEnhancing(true);
    const result=await enhanceText(text,screen,category,priority);
    if(result)setText(result);
    setEnhancing(false);
  };
  // Position popover so it stays on screen
  const style={position:"absolute",left:`${Math.min(x,70)}%`,top:`${Math.min(y,60)}%`,zIndex:9995,width:300};
  return(
    <Cd T={T} style={{...style,padding:14,gap:10}}>
      <div style={{fontSize:13,fontWeight:700,color:T.teal,fontFamily:MO}}>NEW PIN</div>
      <textarea ref={ref_} value={text} onChange={e=>setText(e.target.value)} placeholder="Describe the issue..."
        onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey)submit();if(e.key==="Escape")onCancel();}}
        style={{width:"100%",padding:8,borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.text,fontSize:13,fontFamily:SA,resize:"none",minHeight:50,outline:"none"}}/>
      <div style={{display:"flex",gap:4}}>
        {PRIORITIES.map(p=>(
          <div key={p.key} onClick={()=>setPriority(p.key)}
            style={{padding:"2px 8px",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:MO,textTransform:"uppercase",
              background:priority===p.key?T[p.ck]+"28":"transparent",color:priority===p.key?T[p.ck]:T.muted,border:`1px solid ${priority===p.key?T[p.ck]+"44":T.border}`}}>
            {p.label}
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:4}}>
        {CATEGORIES.map(c=>(
          <div key={c.key} onClick={()=>setCategory(c.key)}
            style={{padding:"2px 8px",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600,fontFamily:SA,
              background:category===c.key?T.teal+"22":"transparent",color:category===c.key?T.teal:T.muted,border:`1px solid ${category===c.key?T.teal+"33":T.border}`}}>
            {c.label}
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{padding:"5px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.muted,fontSize:12,fontWeight:600,fontFamily:SA,cursor:"pointer"}}>Cancel</button>
        <button onClick={enhance} disabled={!text.trim()||enhancing}
          style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${T.purple}44`,background:T.purple+"18",color:enhancing?T.muted:T.purple,fontSize:11,fontWeight:700,fontFamily:SA,cursor:enhancing?"wait":"pointer",opacity:text.trim()?1:.4}}>
          {enhancing?"...":"AI"}
        </button>
        <button onClick={submit} style={{padding:"5px 14px",borderRadius:8,border:"none",background:T.teal,color:"#fff",fontSize:12,fontWeight:700,fontFamily:SA,cursor:"pointer",opacity:text.trim()?1:.4}}>Pin it</button>
      </div>
    </Cd>
  );
}

/* ══════════════════════════════════════════════════════════
   PIN MARKER (displayed on screen)
   ══════════════════════════════════════════════════════════ */
function PinMarker({pin,T,index,author,onResolve}){
  const [expanded,setExpanded]=useState(false);
  const [hovered,setHovered]=useState(false);
  const prio=PRIORITIES.find(p=>p.key===pin.priority)||PRIORITIES[2];
  const color=T[prio.ck];
  return(
    <div style={{position:"absolute",left:`${pin.xPct}%`,top:`${pin.yPct}%`,transform:"translate(-50%,-50%)",zIndex:9991,pointerEvents:"auto"}}>
      {/* Pin dot */}
      <div onClick={(e)=>{e.stopPropagation();setExpanded(!expanded);}}
        onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
        style={{width:pin.resolved?20:24,height:pin.resolved?20:24,borderRadius:"50%",background:pin.resolved?"transparent":color,border:`2px solid ${color}`,
          display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
          fontSize:11,fontWeight:800,color:pin.resolved?color:"#fff",fontFamily:MO,
          boxShadow:pin.resolved?"none":`0 0 10px ${color}55`,opacity:pin.resolved?.5:1,transition:"all .15s"}}>
        {index+1}
      </div>
      {/* Hover tooltip */}
      {hovered&&!expanded&&(
        <div style={{position:"absolute",left:28,top:-4,background:T.panel,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 10px",
          whiteSpace:"nowrap",maxWidth:250,overflow:"hidden",textOverflow:"ellipsis",fontSize:12,color:T.text,fontFamily:SA,boxShadow:`0 4px 12px ${T.shadow}`,zIndex:9992}}>
          <span style={{fontWeight:700,color:T.teal}}>{pin.author}:</span> {pin.text.slice(0,60)}{pin.text.length>60?"...":""}
        </div>
      )}
      {/* Expanded popover */}
      {expanded&&(
        <Cd T={T} style={{position:"absolute",left:28,top:-4,width:280,padding:12,gap:8,zIndex:9993}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,fontWeight:700,color:T.teal}}>{pin.author}</span>
            <span style={{fontSize:11,color:T.muted,fontFamily:MO}}>{timeAgo(pin.timestamp)}</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            <P color={T[prio.ck]} T={T} small>{prio.label}</P>
            <P color={T.cyan} T={T} small>{SCREEN_LABELS[pin.screen]}</P>
            {pin.category&&<P color={T.muted} T={T} small>{pin.category}</P>}
          </div>
          <div style={{fontSize:13,color:pin.resolved?T.muted:T.text,fontFamily:SA,lineHeight:1.5,textDecoration:pin.resolved?"line-through":"none"}}>{pin.text}</div>
          {pin.resolved&&<div style={{fontSize:11,color:T.muted,fontFamily:MO}}>Resolved by {pin.resolvedBy}</div>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={(e)=>{e.stopPropagation();onResolve(pin);setExpanded(false);}}
              style={{padding:"4px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:pin.resolved?T.card2:T.green+"22",color:pin.resolved?T.muted:T.green,fontSize:11,fontWeight:600,fontFamily:SA,cursor:"pointer"}}>
              {pin.resolved?"Reopen":"Resolve"}
            </button>
            <button onClick={(e)=>{e.stopPropagation();setExpanded(false);}}
              style={{padding:"4px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.muted,fontSize:11,fontWeight:600,fontFamily:SA,cursor:"pointer"}}>
              Close
            </button>
          </div>
        </Cd>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MODIFICATIONS LOG (full-screen modal)
   ══════════════════════════════════════════════════════════ */
function ModificationsLog({T,comments,pins,author,onResolve,onGoTo,onClose}){
  const [filterScreen,setFilterScreen]=useState("all");
  const [filterStatus,setFilterStatus]=useState("all");
  const [filterPriority,setFilterPriority]=useState("all");
  const [copied,setCopied]=useState(false);

  // Merge comments and pins into unified list
  const all=[
    ...comments.map(c=>({...c,_type:"comment"})),
    ...pins.map(p=>({...p,_type:"pin"}))
  ].sort((a,b)=>b.timestamp-a.timestamp);

  const filtered=all.filter(item=>{
    if(filterScreen!=="all"&&item.screen!==filterScreen)return false;
    if(filterStatus==="open"&&item.resolved)return false;
    if(filterStatus==="resolved"&&!item.resolved)return false;
    if(filterPriority!=="all"&&item.priority!==filterPriority)return false;
    return true;
  });

  const openCount=all.filter(i=>!i.resolved).length;
  const resolvedCount=all.filter(i=>i.resolved).length;

  const copyMarkdown=()=>{
    const open=all.filter(i=>!i.resolved);
    const md=`# TrackiMed ORKing — Feedback Log\n\n**${open.length} open items** (${resolvedCount} resolved)\n\n`+
      open.map((item,i)=>{
        const prio=PRIORITIES.find(p=>p.key===item.priority);
        return `- [ ] **[${prio?.label||"Medium"}]** [${SCREEN_LABELS[item.screen]}] ${item.text} — _${item.author}_${item._type==="pin"?" (pin)":""}`;
      }).join("\n");
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(()=>setCopied(false),2000);
  };

  const FilterPill=({label,active,onClick})=>(
    <div onClick={onClick} style={{padding:"4px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:active?700:500,fontFamily:SA,
      background:active?T.teal+"22":"transparent",color:active?T.teal:T.muted,border:`1px solid ${active?T.teal+"33":T.border}`,transition:"all .12s"}}>
      {label}
    </div>
  );

  return(
    <div style={{position:"fixed",inset:0,zIndex:10000,background:T.bg+"f5",display:"flex",flexDirection:"column",fontFamily:SA,overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"16px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:20,fontWeight:800,color:T.text}}>Modifications Log</div>
          <P color={T.teal} T={T} small>{all.length} total</P>
          <P color={T.amber} T={T} small>{openCount} open</P>
          <P color={T.green} T={T} small>{resolvedCount} resolved</P>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={copyMarkdown}
            style={{padding:"8px 16px",borderRadius:10,border:`1px solid ${T.border}`,background:copied?T.green+"22":T.card2,color:copied?T.green:T.soft,fontSize:13,fontWeight:600,fontFamily:SA,cursor:"pointer"}}>
            {copied?"Copied!":"Copy as Markdown"}
          </button>
          <button onClick={onClose}
            style={{padding:"8px 16px",borderRadius:10,border:`1px solid ${T.border}`,background:T.card2,color:T.soft,fontSize:13,fontWeight:600,fontFamily:SA,cursor:"pointer"}}>
            Close
          </button>
        </div>
      </div>
      {/* Filters */}
      <div style={{padding:"10px 28px",display:"flex",gap:20,alignItems:"center",borderBottom:`1px solid ${T.border}`,flexShrink:0,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <span style={{fontSize:11,color:T.muted,fontFamily:MO,marginRight:6}}>SCREEN</span>
          <FilterPill label="All" active={filterScreen==="all"} onClick={()=>setFilterScreen("all")}/>
          {Object.entries(SCREEN_LABELS).map(([k,v])=><FilterPill key={k} label={v} active={filterScreen===k} onClick={()=>setFilterScreen(k)}/>)}
        </div>
        <div style={{width:1,height:20,background:T.border}}/>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <span style={{fontSize:11,color:T.muted,fontFamily:MO,marginRight:6}}>STATUS</span>
          <FilterPill label="All" active={filterStatus==="all"} onClick={()=>setFilterStatus("all")}/>
          <FilterPill label="Open" active={filterStatus==="open"} onClick={()=>setFilterStatus("open")}/>
          <FilterPill label="Resolved" active={filterStatus==="resolved"} onClick={()=>setFilterStatus("resolved")}/>
        </div>
        <div style={{width:1,height:20,background:T.border}}/>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <span style={{fontSize:11,color:T.muted,fontFamily:MO,marginRight:6}}>PRIORITY</span>
          <FilterPill label="All" active={filterPriority==="all"} onClick={()=>setFilterPriority("all")}/>
          {PRIORITIES.map(p=><FilterPill key={p.key} label={p.label} active={filterPriority===p.key} onClick={()=>setFilterPriority(p.key)}/>)}
        </div>
      </div>
      {/* Table */}
      <div style={{flex:1,overflowY:"auto",padding:"0 28px"}}>
        {/* Table header */}
        <div style={{display:"grid",gridTemplateColumns:"40px 60px 100px 100px 1fr 90px 80px 80px 120px",gap:8,padding:"12px 0",borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,background:T.bg,zIndex:1}}>
          {["#","Type","Screen","Author","Feedback","Priority","Category","Status","Actions"].map(h=>(
            <span key={h} style={{fontSize:11,fontWeight:700,color:T.muted,fontFamily:MO,textTransform:"uppercase",letterSpacing:1}}>{h}</span>
          ))}
        </div>
        {/* Table rows */}
        {filtered.length===0&&(
          <div style={{padding:40,textAlign:"center",color:T.muted,fontSize:14}}>No feedback matches the current filters.</div>
        )}
        {filtered.map((item,i)=>{
          const prio=PRIORITIES.find(p=>p.key===item.priority)||PRIORITIES[2];
          return(
            <div key={item.id} style={{display:"grid",gridTemplateColumns:"40px 60px 100px 100px 1fr 90px 80px 80px 120px",gap:8,padding:"10px 0",borderBottom:`1px solid ${T.border}11`,alignItems:"center",opacity:item.resolved?.5:1}}>
              <span style={{fontSize:13,color:T.muted,fontFamily:MO}}>{i+1}</span>
              <span style={{fontSize:11,color:item._type==="pin"?T.purple:T.cyan,fontFamily:MO,fontWeight:700}}>{item._type==="pin"?"PIN":"MSG"}</span>
              <P color={T.cyan} T={T} small>{SCREEN_LABELS[item.screen]}</P>
              <span style={{fontSize:13,color:T.teal,fontWeight:600,fontFamily:SA}}>{item.author}</span>
              <span style={{fontSize:13,color:item.resolved?T.muted:T.text,fontFamily:SA,textDecoration:item.resolved?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.text}</span>
              <P color={T[prio.ck]} T={T} small>{prio.label}</P>
              <span style={{fontSize:11,color:T.muted,fontFamily:SA}}>{item.category||"—"}</span>
              <P color={item.resolved?T.green:T.amber} T={T} small>{item.resolved?"Done":"Open"}</P>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>onResolve(item)}
                  style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:item.resolved?T.card2:T.green+"22",color:item.resolved?T.muted:T.green,fontSize:11,fontWeight:600,fontFamily:SA,cursor:"pointer"}}>
                  {item.resolved?"Reopen":"Resolve"}
                </button>
                <button onClick={()=>{onGoTo(item);onClose();}}
                  style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.card2,color:T.soft,fontSize:11,fontWeight:600,fontFamily:SA,cursor:"pointer"}}>
                  Go to
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN FEEDBACK OVERLAY
   ══════════════════════════════════════════════════════════ */
export default function FeedbackOverlay({T,screen,onScreenChange}){
  const [author,setAuthor]=useState(()=>localStorage.getItem("feedback-author"));
  const [panelOpen,setPanelOpen]=useState(false);
  const [pinMode,setPinMode]=useState(false);
  const [pendingPin,setPendingPin]=useState(null);
  const [comments,setComments]=useState([]);
  const [pins,setPins]=useState([]);
  const [logOpen,setLogOpen]=useState(false);
  const [fabMenuOpen,setFabMenuOpen]=useState(false);

  // Firebase real-time listeners
  useEffect(()=>{
    const unsub1=onValue(ref(db,"comments"),(snap)=>{
      const data=snap.val();
      const list=data?Object.entries(data).map(([id,v])=>({id,...v})):[];
      setComments(list.sort((a,b)=>b.timestamp-a.timestamp));
    });
    const unsub2=onValue(ref(db,"pins"),(snap)=>{
      const data=snap.val();
      const list=data?Object.entries(data).map(([id,v])=>({id,...v})):[];
      setPins(list.sort((a,b)=>a.timestamp-b.timestamp));
    });
    return()=>{unsub1();unsub2();};
  },[]);

  // ESC key handler
  useEffect(()=>{
    const handler=(e)=>{
      if(e.key==="Escape"){
        if(pendingPin)setPendingPin(null);
        else if(pinMode)setPinMode(false);
        else if(panelOpen)setPanelOpen(false);
        else if(logOpen)setLogOpen(false);
      }
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[pendingPin,pinMode,panelOpen,logOpen]);

  const saveAuthor=(name)=>{localStorage.setItem("feedback-author",name);setAuthor(name);};

  const addComment=(data)=>push(ref(db,"comments"),data);
  const addPin=(data)=>{push(ref(db,"pins"),data);setPendingPin(null);};

  const resolveItem=(item)=>{
    const path=item._type==="pin"||item.xPct!==undefined?"pins":"comments";
    const updates=item.resolved
      ?{resolved:false,resolvedBy:null,resolvedAt:null}
      :{resolved:true,resolvedBy:author,resolvedAt:Date.now()};
    update(ref(db,`${path}/${item.id}`),updates);
  };

  const goToItem=(item)=>{
    onScreenChange(item.screen);
    setPanelOpen(false);
    setLogOpen(false);
  };

  const handlePinClick=(e)=>{
    if(!pinMode||pendingPin)return;
    const rect=e.currentTarget.getBoundingClientRect();
    const xPct=((e.clientX-rect.left)/rect.width)*100;
    const yPct=((e.clientY-rect.top)/rect.height)*100;
    setPendingPin({xPct,yPct});
    setPinMode(false);
  };

  // Filter pins for current screen
  const screenPins=pins.filter(p=>p.screen===screen);
  const unresolvedCount=[...comments,...pins].filter(i=>!i.resolved).length;
  const screenComments=comments.filter(c=>c.screen===screen);

  // Show author prompt if not set
  if(!author)return <AuthorPrompt T={T} onSave={saveAuthor}/>;

  return(
    <>
      {/* ── Pin Layer (transparent overlay for clicking + displaying pins) ── */}
      <div onClick={handlePinClick}
        style={{position:"fixed",top:60,left:0,right:0,bottom:0,zIndex:9990,
          pointerEvents:pinMode?"auto":"none",
          cursor:pinMode?"crosshair":"default"}}>
        {/* Existing pin markers (always visible) */}
        {screenPins.map((pin,i)=>(
          <PinMarker key={pin.id} pin={pin} T={T} index={i} author={author} onResolve={resolveItem}/>
        ))}
        {/* Pending pin form */}
        {pendingPin&&(
          <PinPopover T={T} x={pendingPin.xPct} y={pendingPin.yPct} author={author} screen={screen}
            onSubmit={addPin} onCancel={()=>setPendingPin(null)}/>
        )}
      </div>

      {/* ── Pin Mode Banner ── */}
      {pinMode&&(
        <div style={{position:"fixed",top:60,left:0,right:0,zIndex:9996,
          background:T.amber+"22",borderBottom:`1px solid ${T.amber}44`,
          padding:"8px 24px",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
          <span style={{fontSize:14,fontWeight:700,color:T.amber,fontFamily:SA}}>PIN MODE</span>
          <span style={{fontSize:13,color:T.text,fontFamily:SA}}>Click anywhere on the screen to drop a pin</span>
          <button onClick={()=>setPinMode(false)}
            style={{padding:"4px 14px",borderRadius:8,border:`1px solid ${T.amber}44`,background:T.card2,color:T.amber,fontSize:12,fontWeight:600,fontFamily:SA,cursor:"pointer",marginLeft:12}}>
            ESC to Cancel
          </button>
        </div>
      )}

      {/* ── Side Panel ── */}
      <div style={{position:"fixed",top:0,right:0,width:380,height:"100vh",zIndex:9998,
        background:T.panel,borderLeft:`1px solid ${T.border}`,boxShadow:`-4px 0 20px ${T.shadow}`,
        transform:`translateX(${panelOpen?0:380}px)`,transition:"transform .25s ease",
        display:"flex",flexDirection:"column",fontFamily:SA}}>
        {/* Panel header */}
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:16,fontWeight:800,color:T.text}}>Feedback</span>
            <P color={T.cyan} T={T} small>{SCREEN_LABELS[screen]}</P>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setLogOpen(true);setPanelOpen(false);}}
              style={{padding:"4px 10px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.soft,fontSize:11,fontWeight:600,fontFamily:SA,cursor:"pointer"}}>
              View Log
            </button>
            <button onClick={()=>setPanelOpen(false)}
              style={{width:28,height:28,borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.muted,fontSize:16,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              ×
            </button>
          </div>
        </div>
        {/* Comment form */}
        <div style={{padding:14,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          <CommentForm T={T} author={author} screen={screen} onSubmit={addComment}/>
        </div>
        {/* Comments list */}
        <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>
          <Lb T={T}>Comments on {SCREEN_LABELS[screen]} ({screenComments.length})</Lb>
          {screenComments.length===0&&(
            <div style={{padding:20,textAlign:"center",color:T.muted,fontSize:13}}>No comments on this screen yet.</div>
          )}
          {screenComments.map(c=>(
            <CommentItem key={c.id} item={c} T={T} type="comment" onResolve={resolveItem} onGoTo={goToItem}/>
          ))}
        </div>
        {/* Panel footer */}
        <div style={{padding:"10px 16px",borderTop:`1px solid ${T.border}`,flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:T.muted,fontFamily:SA}}>Logged in as <span style={{color:T.teal,fontWeight:700}}>{author}</span></span>
          <button onClick={()=>{localStorage.removeItem("feedback-author");setAuthor(null);}}
            style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,fontSize:11,fontFamily:SA,cursor:"pointer"}}>
            Switch user
          </button>
        </div>
      </div>

      {/* ── FAB (Floating Action Button) ── */}
      <div style={{position:"fixed",bottom:24,right:24,zIndex:9999}}>
        {/* FAB menu */}
        {fabMenuOpen&&(
          <div style={{position:"absolute",bottom:64,right:0,display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
            {[
              {label:"Comment Panel",icon:"💬",action:()=>{setPanelOpen(true);setFabMenuOpen(false);}},
              {label:"Pin Mode",icon:"📌",action:()=>{setPinMode(true);setFabMenuOpen(false);}},
              {label:"Modifications Log",icon:"📋",action:()=>{setLogOpen(true);setFabMenuOpen(false);}}
            ].map(item=>(
              <div key={item.label} onClick={item.action}
                style={{display:"flex",alignItems:"center",gap:10,padding:"8px 16px",borderRadius:12,background:T.panel,border:`1px solid ${T.border}`,
                  cursor:"pointer",boxShadow:`0 4px 12px ${T.shadow}`,whiteSpace:"nowrap",transition:"all .12s"}}>
                <span style={{fontSize:16}}>{item.icon}</span>
                <span style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:SA}}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
        {/* FAB button */}
        <div onClick={()=>setFabMenuOpen(!fabMenuOpen)}
          style={{width:56,height:56,borderRadius:"50%",
            background:`linear-gradient(135deg,${T.teal},${T.purple})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            cursor:"pointer",boxShadow:`0 4px 20px ${T.shadow}`,
            fontSize:24,color:"#fff",transition:"transform .15s",
            transform:fabMenuOpen?"rotate(45deg)":"none"}}>
          {fabMenuOpen?"✕":"💬"}
        </div>
        {/* Unresolved badge */}
        {unresolvedCount>0&&!fabMenuOpen&&(
          <div style={{position:"absolute",top:-4,right:-4,minWidth:22,height:22,borderRadius:11,
            background:T.red,color:"#fff",fontSize:11,fontWeight:800,fontFamily:MO,
            display:"flex",alignItems:"center",justifyContent:"center",padding:"0 5px"}}>
            {unresolvedCount}
          </div>
        )}
      </div>

      {/* ── Modifications Log Modal ── */}
      {logOpen&&(
        <ModificationsLog T={T} comments={comments} pins={pins} author={author}
          onResolve={resolveItem} onGoTo={goToItem} onClose={()=>setLogOpen(false)}/>
      )}
    </>
  );
}
