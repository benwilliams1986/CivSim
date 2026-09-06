
import { KokoroTTS } from "kokoro-js";

const app = document.querySelector("#app");
app.innerHTML = `
<style>
:root{
  --bg:#09111a;--panel:#121c29;--panel2:#172334;--line:#2b3b50;
  --text:#f4f7fb;--muted:#a9b6c8;--accent:#56a9ef;--good:#6fcf86;
}
body{overflow-x:hidden}
.wrap{max-width:1480px;margin:auto;padding:10px}
.toolbar,.panel{background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.2)}
.toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px;margin-bottom:10px;position:sticky;top:0;z-index:20}
button,select{min-height:42px;border:1px solid #3b4c62;border-radius:10px;padding:8px 12px;background:#223147;color:var(--text)}
button:hover{filter:brightness(1.08)}
button.primary{background:#1f6fae}
button:disabled{opacity:.5}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:10px;align-items:start}
.side{display:grid;gap:10px;position:sticky;top:74px}
.panel{padding:10px}
h3{margin:4px 0 9px;font-size:16px}
canvas{display:block;width:100%;height:auto;border-radius:11px;background:#6d845c;touch-action:none}
.small{font-size:13px;color:var(--muted);line-height:1.45}
.tiny{font-size:12px;color:#98a7bb;line-height:1.4}
.statgrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;font-size:13px}
.agent{width:100%;text-align:left;margin:4px 0;background:#1d2a3d}
.agent.sel{outline:2px solid var(--accent)}
.badge{font-size:12px;border:1px solid #3b4c62;border-radius:999px;padding:5px 8px;color:#c7d0de;background:#182436}
.subtitle{margin-top:8px;background:#0e1722;border:1px solid var(--line);border-radius:10px;padding:10px;min-height:44px;text-align:center}
.tabs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px}
.tab{min-height:34px;padding:6px 8px;font-size:12px}
.tab.active{outline:2px solid var(--accent)}
.progress{height:7px;background:#26364b;border-radius:999px;overflow:hidden}
.progress>span{display:block;height:100%;background:#7caed8}
.promise{padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)}
.row{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
.toggle{display:flex;gap:6px;align-items:center}
.chatHead{display:flex;justify-content:space-between;align-items:center;gap:8px}
#chatLog{height:270px;overflow:auto;background:#0d1621;border:1px solid #29394d;border-radius:10px;padding:8px;scrollbar-width:thin}
.chatline{padding:7px 8px;border-radius:8px;margin-bottom:6px;background:#152131;border:1px solid rgba(255,255,255,.03)}
.chatline.dialogue{background:#18283a}
.chatline.event{opacity:.9}
.chatname{font-weight:700;color:#d9e8f7}
.chattime{float:right;font-size:11px;color:#73839a}
.chattext{font-size:13px;color:#bec9d7;margin-top:2px}
.chatfilters{display:flex;gap:5px}
.chatfilter.active{outline:2px solid var(--accent)}
.legend{display:flex;gap:8px;flex-wrap:wrap;margin-top:7px}
.legend span{font-size:11px;color:#93a5ba}
.kpi{display:inline-flex;align-items:center;gap:5px}
@media(max-width:980px){
  .layout{grid-template-columns:1fr}
  .side{position:static}
  #chatPanel{order:-5}
  #chatLog{height:220px}
}
@media(max-width:580px){
  .wrap{padding:6px}.toolbar{top:0;padding:7px}.panel{padding:8px}
  button,select{min-height:40px;padding:7px 9px}
}
</style>

<div class="wrap">
  <div class="toolbar">
    <button id="start" class="primary">▶ Start</button>
    <button id="pause">⏸ Pause</button>
    <button id="talk">💬 Force Chat</button>
    <button id="reset">↻ New World</button>
    <label class="small">Speed
      <select id="speed"><option>1</option><option>2</option><option>5</option><option>10</option><option>25</option></select>×
    </label>
    <label class="small">Performance
      <select id="perf">
        <option value="mobile">Mobile</option>
        <option value="balanced" selected>Balanced</option>
        <option value="desktop">Desktop</option>
      </select>
    </label>
    <button id="loadVoice">🔊 Load Voices</button>
    <label class="toggle small"><input id="voiceToggle" type="checkbox"> Voice</label>
    <span id="ttsState" class="badge">Voice off</span>
    <span id="runState" class="badge">Ready</span>
  </div>

  <div class="layout">
    <div>
      <div class="panel">
        <canvas id="world" width="980" height="620"></canvas>
        <div id="subtitle" class="subtitle">The simulation is ready.</div>
        <div class="legend">
          <span>🌲 Timber</span><span>🪨 Stone</span><span>🍓 Food</span><span>🌾 Fibre</span><span>🟤 Clay</span>
        </div>
      </div>
    </div>

    <div class="side">
      <div class="panel" id="chatPanel">
        <div class="chatHead">
          <h3>Conversation & Event History</h3>
          <div class="chatfilters">
            <button class="tab chatfilter active" data-filter="all">All</button>
            <button class="tab chatfilter" data-filter="dialogue">Chat</button>
          </div>
        </div>
        <div id="chatLog"></div>
      </div>

      <div class="panel">
        <h3>Settlement</h3>
        <div class="statgrid">
          <div>Day <b id="day">1</b></div><div>Time <b id="time">08:00</b></div>
          <div>🪵 Wood <b id="wood">0</b></div><div>🪨 Stone <b id="stone">0</b></div>
          <div>🍓 Food <b id="food">0</b></div><div>🧵 Fibre <b id="fibre">0</b></div>
          <div>🧱 Clay <b id="clay">0</b></div><div>Stage <b id="stage">Wilderness</b></div>
        </div>
        <div class="small" style="margin-top:8px"><b>Technology:</b> <span id="tech">None</span></div>
        <div class="small"><b>Weather:</b> <span id="weather">Clear</span></div>
      </div>

      <div class="panel">
        <h3>AI Characters</h3>
        <div id="agents"></div>
      </div>

      <div class="panel">
        <div class="tabs">
          <button class="tab active" data-tab="overview">Overview</button>
          <button class="tab" data-tab="memory">Memory</button>
          <button class="tab" data-tab="relations">Relations</button>
          <button class="tab" data-tab="skills">Skills</button>
        </div>
        <div id="selectedPanel"></div>
      </div>

      <div class="panel">
        <h3>Current Conversation</h3>
        <div id="conversation" class="small">Nobody is speaking.</div>
      </div>

      <div class="panel">
        <h3>Promises</h3>
        <div id="promises" class="small">No active promises.</div>
      </div>
    </div>
  </div>
</div>
`;

const $ = id => document.getElementById(id);
const canvas = $("world");
const ctx = canvas.getContext("2d", {alpha:false});
const W=canvas.width,H=canvas.height;

const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const chance=p=>Math.random()<p;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const lerp=(a,b,t)=>a+(b-a)*t;

let running=false, speed=1, selected=0, activeTab="overview", chatFilter="all";
let tts=null, ttsLoading=false, voiceEnabled=false, ttsBusy=false;
let currentAudio=null, audioCache=new Map(), pendingSpeech=null;
let world, lastFrame=performance.now(), simAccumulator=0, uiAccumulator=0;
let conversationQueue=[], conversationRunning=false;

const PERF={
  mobile:{simHz:8,uiHz:4,aiInterval:1000,resourceScale:.60,maxSpokenTurns:0,maxRain:60},
  balanced:{simHz:12,uiHz:6,aiInterval:700,resourceScale:.85,maxSpokenTurns:1,maxRain:100},
  desktop:{simHz:18,uiHz:8,aiInterval:500,resourceScale:1,maxSpokenTurns:2,maxRain:160}
};
let perfMode="balanced";

const CHARACTERS=[
  {name:"Alex",role:"Builder",color:"#f3b546",voice:"bm_george",traits:{practical:.9,curious:.45,social:.5,cautious:.6}},
  {name:"Sarah",role:"Gatherer",color:"#ef7a98",voice:"bf_emma",traits:{practical:.75,curious:.6,social:.68,cautious:.75}},
  {name:"James",role:"Explorer",color:"#69aef8",voice:"bm_fable",traits:{practical:.5,curious:.96,social:.58,cautious:.25}},
  {name:"Michael",role:"Organiser",color:"#79cf91",voice:"bm_lewis",traits:{practical:.72,curious:.55,social:.95,cautious:.65}}
];

const eventHistory=[];

function addHistory(type, speaker, text){
  eventHistory.push({type,speaker,text,day:world?.day||1,time:world?.time||8});
  if(eventHistory.length>120) eventHistory.shift();
  renderChat();
}

function log(text){ addHistory("event","World",text); }

function renderChat(){
  const box=$("chatLog");
  const items = eventHistory.filter(e=>chatFilter==="all" || e.type==="dialogue");
  box.innerHTML=items.map(e=>{
    const hh=String(Math.floor(e.time)).padStart(2,"0");
    const mm=String(Math.floor((e.time%1)*60)).padStart(2,"0");
    return `<div class="chatline ${e.type}">
      <span class="chatname">${e.speaker}</span>
      <span class="chattime">D${e.day} ${hh}:${mm}</span>
      <div class="chattext">${e.text}</div>
    </div>`;
  }).join("");
  box.scrollTop=box.scrollHeight;
}

function remember(a,type,text,importance=1,data=null){
  a.memories.push({day:world.day,time:world.time,type,text,importance,data});
  if(a.memories.length>90)a.memories.shift();
}
function know(a,key,source="self"){
  if(!a.knowledge.has(key)){a.knowledge.add(key);remember(a,"knowledge","Learned: "+key+" ("+source+")",2);return true;}
  return false;
}

async function loadTTS(){
  if(tts||ttsLoading)return;
  ttsLoading=true;$("loadVoice").disabled=true;$("ttsState").textContent="Loading local voices…";
  try{
    tts=await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX",{dtype:"q8",device:"wasm"});
    $("ttsState").textContent="Voice ready";
    $("loadVoice").textContent="🔊 Voices Ready";
    log("Local voices loaded.");
  }catch(e){
    console.error(e);$("ttsState").textContent="Voice load failed";$("loadVoice").disabled=false;
    log("Voice system could not load.");
  }finally{ttsLoading=false;}
}

async function generateAndPlay(name,text){
  if(!tts||!voiceEnabled||ttsBusy)return;
  ttsBusy=true;$("ttsState").textContent="Speaking…";
  try{
    const key=name+"|"+text;
    let blob=audioCache.get(key);
    if(!blob){
      const person=CHARACTERS.find(x=>x.name===name);
      const audio=await tts.generate(text,{voice:person.voice,speed:1.05});
      blob=audio.toBlob?audio.toBlob():null;
      if(blob && audioCache.size<50) audioCache.set(key,blob);
    }
    if(blob && voiceEnabled){
      const url=URL.createObjectURL(blob);
      currentAudio=new Audio(url);
      await new Promise((resolve,reject)=>{
        currentAudio.onended=()=>{URL.revokeObjectURL(url);resolve();};
        currentAudio.onerror=()=>{URL.revokeObjectURL(url);resolve();};
        currentAudio.play().catch(()=>resolve());
      });
      currentAudio=null;
    }
  }catch(e){console.error(e);}
  finally{ttsBusy=false;$("ttsState").textContent=voiceEnabled?"Voice ready":"Voice off";}
}

function speakLine(name,text,important=true){
  $("conversation").textContent=`${name}: “${text}”`;
  $("subtitle").textContent=`${name}: ${text}`;
  addHistory("dialogue",name,text);

  // Never block gameplay. Voice is fire-and-forget and skipped if the engine is already busy.
  if(important && voiceEnabled && tts && !ttsBusy){
    generateAndPlay(name,text);
  }
}

function queueConversation(plan){
  if(conversationQueue.length>2)return;
  conversationQueue.push(plan);
  if(!conversationRunning) runConversationQueue();
}
async function runConversationQueue(){
  conversationRunning=true;
  while(conversationQueue.length){
    const plan=conversationQueue.shift();
    for(const turn of plan.turns){
      speakLine(turn.name,turn.text,turn.important!==false);
      await new Promise(r=>setTimeout(r,650));
    }
    plan.onDone?.();
  }
  conversationRunning=false;
}

function terrainNoise(x,y){
  return Math.sin(x*.035)*.45+Math.cos(y*.027)*.35+Math.sin((x+y)*.016)*.2;
}
function generateWorldDecor(){
  const patches=[];
  for(let i=0;i<110;i++){
    patches.push({x:rnd(0,W),y:rnd(0,H),r:rnd(6,24),a:rnd(.03,.09)});
  }
  const flowers=[];
  for(let i=0;i<80;i++) flowers.push({x:rnd(0,W),y:rnd(0,H),s:rnd(1,2.2)});
  const rain=[];
  for(let i=0;i<160;i++) rain.push({x:rnd(0,W),y:rnd(0,H),l:rnd(8,18),v:rnd(4,9)});
  return {patches,flowers,rain};
}
function generateResources(scale){
  const arr=[];
  const add=(type,count,amount)=>{
    for(let i=0;i<Math.floor(count*scale);i++){
      let x=rnd(30,W-30),y=rnd(30,H-30);
      if(Math.abs(x-W*.58)<65)x+=chance(.5)?90:-90;
      arr.push({type,x,y,amount,phase:rnd(0,Math.PI*2),size:rnd(.85,1.25)});
    }
  };
  add("tree",110,4);add("stone",34,3);add("food",42,2);add("fibre",32,2);add("clay",22,2);
  return arr;
}

function newWorld(){
  const agents=CHARACTERS.map((c,i)=>{
    const trust={};CHARACTERS.forEach(o=>trust[o.name]=o.name===c.name?100:rnd(45,56));
    return {...c,
      x:W*.23+i*30,y:H*.60+i*12,hunger:rnd(76,91),thirst:rnd(76,91),energy:rnd(80,96),warmth:rnd(75,92),social:rnd(56,82),
      wood:0,stone:0,food:0,fibre:0,clay:0,goal:"Observe surroundings",action:"Thinking",target:null,
      memories:[],knowledge:new Set(["trees provide wood","river provides water","berries provide food"]),
      trust,opinions:{exploration:rnd(35,80),risk:rnd(25,70),sharing:rnd(55,90)},
      skills:{gather:1,build:1,explore:1,social:1,craft:1},
      wander:{x:rnd(40,W-40),y:rnd(40,H-40)},trail:[]
    };
  });
  world={
    resources:generateResources(PERF[perfMode].resourceScale),agents,river:{x:W*.58,w:72},
    time:8,day:1,tick:0,wood:0,stone:0,food:0,fibre:0,clay:0,
    fire:null,shelter:null,storage:null,stage:"Wilderness",tech:new Set(),
    weather:"Clear",weatherTimer:0,wind:.2,decor:generateWorldDecor(),paths:[],particles:[],
    discoveries:[]
  };
  eventHistory.length=0;
  log("A new wilderness has been generated.");
  log("Four autonomous settlers entered the world.");
  renderUI(true);
}

function nearest(a,type){
  let best=null,bd=Infinity;
  for(const r of world.resources){
    if(r.type!==type||r.amount<=0)continue;
    const d=dist(a,r);if(d<bd){bd=d;best=r;}
  }
  return best;
}
function move(a,t,s){
  if(!t)return false;
  const dx=t.x-a.x,dy=t.y-a.y,d=Math.hypot(dx,dy);
  if(d<5)return true;
  const ox=a.x,oy=a.y;
  a.x+=dx/d*s;a.y+=dy/d*s;
  if(world.tick%12===0){
    a.trail.push({x:a.x,y:a.y});if(a.trail.length>25)a.trail.shift();
    if(chance(.16))world.paths.push({x:a.x,y:a.y,a:.035});
    if(world.paths.length>800)world.paths.splice(0,100);
  }
  return false;
}

function discover(a){
  const r=world.resources.find(r=>r.amount>0&&dist(a,r)<55&&chance(.025));
  if(!r)return;
  const key=`${r.type} patch near ${Math.round(r.x/50)},${Math.round(r.y/50)}`;
  if(know(a,key,"exploration")){
    remember(a,"discovery","Found "+key,3,{resource:r.type,x:r.x,y:r.y});
    log(`${a.name} discovered ${key}.`);
  }
}
function decide(a,i){
  const night=world.time>=18||world.time<6;
  const scores={
    drink:100-a.thirst,eat:100-a.hunger,rest:100-a.energy,warm:(100-a.warmth)+(night?22:0),
    food:Math.max(0,58-a.food*7),wood:Math.max(0,52-a.wood*5),stone:Math.max(0,30-a.stone*5),
    fibre:24-a.fibre*3,clay:16-a.clay*3,social:100-a.social,explore:18*a.skills.explore
  };
  if(!world.fire)scores.wood+=25;if(world.fire&&!world.shelter)scores.wood+=16;
  if(a.role==="Gatherer"){scores.food+=12;scores.fibre+=7}
  if(a.role==="Builder"){scores.wood+=10;scores.stone+=6}
  if(a.role==="Explorer")scores.explore+=18;if(a.role==="Organiser")scores.social+=15;

  const action=Object.entries(scores).sort((x,y)=>y[1]-x[1])[0][0];
  if(action==="drink"){a.goal="Find water";a.action="Walking to river";a.target={x:world.river.x,y:a.y};}
  else if(action==="eat"){
    if(a.food>0){a.food--;a.hunger=clamp(a.hunger+45,0,100);a.action="Eating";a.goal="Eat";}
    else{a.goal="Find food";a.action="Gathering food";a.target=nearest(a,"food");}
  }else if(action==="rest"){a.goal="Recover energy";a.action="Resting";a.target=world.shelter||a;}
  else if(action==="warm"){a.goal="Get warm";a.action=world.fire?"Walking to campfire":"Gathering wood";a.target=world.fire||nearest(a,"tree");}
  else if(["food","wood","stone","fibre","clay"].includes(action)){
    const map={food:"food",wood:"tree",stone:"stone",fibre:"fibre",clay:"clay"};
    a.goal="Gather "+action;a.action="Gathering "+action;a.target=nearest(a,map[action]);
  }else if(action==="social"){
    const o=pick(world.agents.filter(x=>x!==a));
    a.goal="Talk with "+o.name;a.action="Talking";a.target=o;
  }else{
    if(dist(a,a.wander)<20)a.wander={x:rnd(35,W-35),y:rnd(35,H-35)};
    a.goal="Explore";a.action="Exploring";a.target=a.wander;
  }
}
function memoryAnswer(a,topic){
  if(topic==="food"){
    const m=[...a.memories].reverse().find(m=>m.data?.resource==="food");
    return m?`I remember food near grid ${Math.round(m.data.x/50)},${Math.round(m.data.y/50)}.`:"I haven't found a dependable food patch yet.";
  }
  if(topic==="stone"){
    const m=[...a.memories].reverse().find(m=>m.data?.resource==="stone");
    return m?`There is stone near grid ${Math.round(m.data.x/50)},${Math.round(m.data.y/50)}.`:"I haven't marked a strong stone source yet.";
  }
  if(topic==="plans")return `I'm concentrating on ${a.goal.toLowerCase()}.`;
  if(topic==="weather")return a.traits.cautious>.6?"I don't like the look of changing weather. We should keep supplies close.":"I think we can keep working unless it gets much worse.";
  if(topic==="memory"){
    const m=[...a.memories].reverse().find(m=>m.importance>=2);
    return m?`I keep thinking about when ${m.text.toLowerCase()}.`:"Nothing important stands out yet.";
  }
  return "I'm still figuring that out.";
}
function makeConversationPlan(a,b){
  const topics=["plans","food","stone","weather","memory"];
  if(a.role==="Explorer")topics.push("food","stone");
  if(a.role==="Organiser")topics.push("plans","weather");
  const topic=pick(topics);
  const turns=[];
  if(topic==="plans"){
    turns.push({name:a.name,text:`What are you planning next, ${b.name}?`});
    turns.push({name:b.name,text:memoryAnswer(b,"plans")});
    turns.push({name:a.name,text:"Do you need help with that?"});
    turns.push({name:b.name,text:b.goal.includes("Gather")?"Yes, extra gathering would help.":"Not yet, but I'll say if that changes."});
  }else if(topic==="food"){
    turns.push({name:a.name,text:`Have you seen much food away from camp, ${b.name}?`});
    turns.push({name:b.name,text:memoryAnswer(b,"food")});
    turns.push({name:a.name,text:"Alright. I'll keep that in mind."});
  }else if(topic==="stone"){
    turns.push({name:a.name,text:`Do you know where we can find good stone?`});
    turns.push({name:b.name,text:memoryAnswer(b,"stone")});
    turns.push({name:a.name,text:"That could help with stronger tools and buildings."});
  }else if(topic==="weather"){
    turns.push({name:a.name,text:"What do you make of the weather?"});
    turns.push({name:b.name,text:memoryAnswer(b,"weather")});
    turns.push({name:a.name,text:"We should keep watching it."});
  }else{
    turns.push({name:a.name,text:`What's been on your mind, ${b.name}?`});
    turns.push({name:b.name,text:memoryAnswer(b,"memory")});
    turns.push({name:a.name,text:"I hadn't thought about that."});
  }
  return {turns,onDone:()=>{
    a.social=clamp(a.social+12,0,100);b.social=clamp(b.social+12,0,100);
    remember(a,"conversation",`Talked with ${b.name} about ${topic}`,2);
    remember(b,"conversation",`Talked with ${a.name} about ${topic}`,2);
    const diff=[...b.knowledge].filter(k=>!a.knowledge.has(k));
    if(diff.length&&chance(.55)){const learned=pick(diff);know(a,learned,b.name);log(`${a.name} learned from ${b.name}: ${learned}.`);}
  }};
}

function act(a,i,dt){
  const s=dt*12;
  a.hunger-=.018*s;a.thirst-=.026*s;a.energy-=.014*s;a.social-=.006*s;
  a.warmth-=((world.time>=18||world.time<6)?.035:.006)*s;
  if(world.fire&&dist(a,world.fire)<70)a.warmth=clamp(a.warmth+.1*s,0,100);
  if(performance.now()-a.lastDecision>PERF[perfMode].aiInterval){
    a.lastDecision=performance.now()+i*25;decide(a,i);
  }
  if(a.action==="Walking to river"){
    if(move(a,a.target,1.35*s)){a.thirst=100;a.action="Drinking";}
  }else if(a.action==="Resting"){
    if(move(a,a.target,1.0*s)){a.energy=clamp(a.energy+.2*s,0,100);}
  }else if(a.action==="Walking to campfire"){
    if(move(a,a.target,1.0*s))a.warmth=clamp(a.warmth+.2*s,0,100);
  }else if(a.action.startsWith("Gathering")){
    if(!a.target||a.target.amount<=0){decide(a,i);return;}
    if(move(a,a.target,1.2*s) && world.tick%18===0){
      a.target.amount--;
      const t=a.target.type;
      if(t==="tree"){a.wood++;world.wood++;}
      if(t==="stone"){a.stone++;world.stone++;}
      if(t==="food"){a.food++;world.food++;}
      if(t==="fibre"){a.fibre++;world.fibre++;}
      if(t==="clay"){a.clay++;world.clay++;}
      if(chance(.04))log(`${a.name} gathered ${t==="tree"?"wood":t}.`);
    }
  }else if(a.action==="Talking"){
    if(move(a,a.target,1.0*s) && !conversationRunning && chance(.08))queueConversation(makeConversationPlan(a,a.target));
  }else if(a.action==="Exploring"){
    move(a,a.target,1.25*s);discover(a);
  }
}
function buildCheck(){
  if(!world.fire&&world.wood>=10){
    world.wood-=10;world.fire={x:W*.34,y:H*.52};world.stage="Camp";world.tech.add("Firemaking");
    log("The settlers built their first campfire.");
  }
  if(world.fire&&!world.shelter&&world.wood>=18&&world.stone>=4){
    world.wood-=18;world.stone-=4;world.shelter={x:W*.40,y:H*.45};world.stage="Permanent Camp";
    log("The first shelter was completed.");
  }
  if(world.shelter&&!world.storage&&world.wood>=14){
    world.wood-=14;world.storage={x:W*.31,y:H*.45};world.stage="Settlement";
    log("Shared storage was constructed.");
  }
}
function updateWeather(dt){
  world.weatherTimer-=dt;
  if(world.weatherTimer<=0){
    const r=Math.random();
    world.weather=r<.14?"Rain":r<.22?"Cloudy":"Clear";
    world.weatherTimer=rnd(18,45);
    if(chance(.5))log(`Weather changed to ${world.weather.toLowerCase()}.`);
  }
}
function simStep(dt){
  world.tick++;
  world.time+=.0035*dt*12*speed;
  if(world.time>=24){world.time-=24;world.day++;log(`Day ${world.day} begins.`);}
  for(let n=0;n<speed;n++)world.agents.forEach((a,i)=>act(a,i,dt));
  buildCheck();updateWeather(dt);
}

function roundedRect(x,y,w,h,r){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
}
function drawGround(t){
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#789263");g.addColorStop(1,"#5f784f");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(const p of world.decor.patches){
    ctx.fillStyle=`rgba(49,77,41,${p.a})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
  }
  for(const f of world.decor.flowers){
    if(Math.abs(f.x-world.river.x)<55)continue;
    ctx.fillStyle=chance(.5)?"rgba(247,226,139,.45)":"rgba(220,233,255,.35)";
    ctx.fillRect(f.x,f.y,f.s,f.s);
  }
  // worn footpaths
  for(const p of world.paths){
    ctx.fillStyle=`rgba(127,105,73,${p.a})`;ctx.beginPath();ctx.arc(p.x,p.y,6,0,Math.PI*2);ctx.fill();
  }
}
function drawRiver(t){
  const x=world.river.x-world.river.w/2,w=world.river.w;
  ctx.fillStyle="#3a7899";ctx.fillRect(x,0,w,H);
  ctx.fillStyle="rgba(220,235,216,.20)";ctx.fillRect(x-6,0,6,H);ctx.fillRect(x+w,0,6,H);
  ctx.strokeStyle="rgba(220,245,255,.30)";ctx.lineWidth=2;
  for(let y=10;y<H;y+=24){
    const off=Math.sin(t*.002+y*.05)*8;
    ctx.beginPath();ctx.moveTo(x+10+off,y);ctx.quadraticCurveTo(x+w*.5,y-4,x+w-10-off,y);ctx.stroke();
  }
}
function drawTree(r,t){
  const sway=Math.sin(t*.002+r.phase)*1.8*r.size;
  ctx.save();ctx.translate(r.x,r.y);ctx.scale(r.size,r.size);
  ctx.fillStyle="rgba(0,0,0,.18)";ctx.beginPath();ctx.ellipse(3,12,15,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#6e4e2e";ctx.fillRect(-3,2,6,16);
  const grd=ctx.createRadialGradient(-4,-10,4,0,-8,22);
  grd.addColorStop(0,"#4f8143");grd.addColorStop(1,"#27582f");
  ctx.fillStyle=grd;
  [[-10+sway,-7,12],[10+sway,-8,11],[sway,-18,14],[sway,-3,15]].forEach(([x,y,rad])=>{ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill();});
  ctx.restore();
}
function drawStone(r){
  ctx.save();ctx.translate(r.x,r.y);ctx.scale(r.size,r.size);
  ctx.fillStyle="rgba(0,0,0,.18)";ctx.beginPath();ctx.ellipse(2,7,11,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#81888e";ctx.beginPath();ctx.moveTo(-11,4);ctx.lineTo(-5,-8);ctx.lineTo(7,-10);ctx.lineTo(13,1);ctx.lineTo(7,9);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,.18)";ctx.stroke();
  ctx.restore();
}
function drawResource(r,t){
  if(r.type==="tree")return drawTree(r,t);
  if(r.type==="stone")return drawStone(r);
  ctx.save();ctx.translate(r.x,r.y);ctx.scale(r.size,r.size);
  ctx.fillStyle="rgba(0,0,0,.12)";ctx.beginPath();ctx.ellipse(0,6,8,4,0,0,Math.PI*2);ctx.fill();
  if(r.type==="food"){
    ctx.fillStyle="#3e763f";ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#d95056";[[-4,-2],[3,-4],[1,3]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();});
  }else if(r.type==="fibre"){
    ctx.strokeStyle="#d8c77f";ctx.lineWidth=2;
    for(let x=-5;x<=5;x+=5){ctx.beginPath();ctx.moveTo(x,7);ctx.lineTo(x+Math.sin(t*.002+r.phase)*2,-9);ctx.stroke();}
  }else if(r.type==="clay"){
    ctx.fillStyle="#9b674d";ctx.beginPath();ctx.ellipse(0,1,9,6,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
function drawBuildings(t){
  if(world.storage){
    const s=world.storage;ctx.fillStyle="rgba(0,0,0,.2)";ctx.fillRect(s.x-15,s.y+9,32,9);
    ctx.fillStyle="#725337";ctx.fillRect(s.x-13,s.y-10,26,22);
    ctx.strokeStyle="#a77a4c";ctx.strokeRect(s.x-13,s.y-10,26,22);
    ctx.fillStyle="#a77a4c";ctx.fillRect(s.x-13,s.y-3,26,3);
  }
  if(world.shelter){
    const s=world.shelter;
    ctx.fillStyle="rgba(0,0,0,.2)";ctx.beginPath();ctx.ellipse(s.x,s.y+18,28,9,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#9a7f59";ctx.beginPath();ctx.moveTo(s.x-26,s.y+14);ctx.lineTo(s.x,s.y-24);ctx.lineTo(s.x+28,s.y+14);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#c3aa79";ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle="#493b2f";ctx.fillRect(s.x-5,s.y+2,10,12);
  }
  if(world.fire){
    const f=world.fire, pulse=1+Math.sin(t*.012)*.08;
    const glow=ctx.createRadialGradient(f.x,f.y,2,f.x,f.y,48);
    glow.addColorStop(0,"rgba(255,181,70,.45)");glow.addColorStop(1,"rgba(255,138,40,0)");
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(f.x,f.y,48,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(f.x,f.y);ctx.scale(pulse,pulse);
    ctx.fillStyle="#ff8a38";ctx.beginPath();ctx.moveTo(0,-18);ctx.quadraticCurveTo(13,-3,4,13);ctx.quadraticCurveTo(-13,4,0,-18);ctx.fill();
    ctx.fillStyle="#ffd15c";ctx.beginPath();ctx.moveTo(0,-10);ctx.quadraticCurveTo(7,0,2,9);ctx.quadraticCurveTo(-6,3,0,-10);ctx.fill();ctx.restore();
  }
}
function drawAgent(a,i,t){
  ctx.save();ctx.translate(a.x,a.y);
  ctx.fillStyle="rgba(0,0,0,.22)";ctx.beginPath();ctx.ellipse(2,10,10,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=a.color;roundedRect(-7,-8,14,19,5);ctx.fill();
  ctx.fillStyle="#e5c6a8";ctx.beginPath();ctx.arc(0,-13,6,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#263646";ctx.fillRect(-5,-6,10,3);
  if(i===selected){ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-1,13,0,Math.PI*2);ctx.stroke();}
  ctx.fillStyle="rgba(10,17,26,.72)";roundedRect(-22,-32,44,13,5);ctx.fill();
  ctx.fillStyle="#fff";ctx.font="10px sans-serif";ctx.textAlign="center";ctx.fillText(a.name,0,-22);
  ctx.restore();
}
function drawWeather(t){
  if(world.weather==="Cloudy"){
    ctx.fillStyle="rgba(85,100,118,.11)";ctx.fillRect(0,0,W,H);
  }else if(world.weather==="Rain"){
    ctx.fillStyle="rgba(63,83,105,.18)";ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="rgba(205,225,245,.45)";ctx.lineWidth=1;
    const n=PERF[perfMode].maxRain;
    for(let i=0;i<n;i++){
      const d=world.decor.rain[i];
      d.y+=d.v;if(d.y>H){d.y=-20;d.x=rnd(0,W);}
      ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-3,d.y+d.l);ctx.stroke();
    }
  }
}
function drawLighting(t){
  const hour=world.time;
  let alpha=0;
  if(hour<6)alpha=.48*(1-hour/6);
  else if(hour>18)alpha=.48*((hour-18)/6);
  if(alpha>0){
    const grd=ctx.createLinearGradient(0,0,0,H);
    grd.addColorStop(0,`rgba(18,30,62,${alpha})`);grd.addColorStop(1,`rgba(12,18,40,${alpha*.9})`);
    ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
  }
}
function draw(t){
  drawGround(t);drawRiver(t);
  const sorted=world.resources.filter(r=>r.amount>0).sort((a,b)=>a.y-b.y);
  for(const r of sorted)drawResource(r,t);
  drawBuildings(t);
  const agents=[...world.agents].sort((a,b)=>a.y-b.y);
  agents.forEach(a=>drawAgent(a,world.agents.indexOf(a),t));
  drawWeather(t);drawLighting(t);
}

function renderSelected(){
  const a=world.agents[selected];let html="";
  if(activeTab==="overview"){
    html=`<h3>${a.name} — ${a.role}</h3><div class="small">
      <b>Goal:</b> ${a.goal}<br><b>Action:</b> ${a.action}<br>
      Hunger ${Math.round(clamp(a.hunger,0,100))}% · Thirst ${Math.round(clamp(a.thirst,0,100))}%<br>
      Energy ${Math.round(clamp(a.energy,0,100))}% · Warmth ${Math.round(clamp(a.warmth,0,100))}%<br>
      Inventory: 🪵 ${a.wood} · 🪨 ${a.stone} · 🍓 ${a.food} · 🌾 ${a.fibre} · 🟤 ${a.clay}</div>`;
  }else if(activeTab==="memory"){
    html=`<h3>${a.name} — Memory</h3><div class="tiny">${[...a.memories].slice(-8).reverse().map(m=>`<div class="promise"><b>${m.type}</b>: ${m.text}</div>`).join("")||"No memories yet."}</div>`;
  }else if(activeTab==="relations"){
    html=`<h3>${a.name} — Trust</h3><div class="small">${world.agents.filter(o=>o!==a).map(o=>`<div style="margin:7px 0">${o.name}: ${Math.round(a.trust[o.name])}<div class="progress"><span style="width:${a.trust[o.name]}%"></span></div></div>`).join("")}</div>`;
  }else{
    html=`<h3>${a.name} — Skills</h3><div class="small">${Object.entries(a.skills).map(([k,v])=>`<div style="margin:7px 0">${k}: ${v.toFixed(2)}<div class="progress"><span style="width:${Math.min(100,v*55)}%"></span></div></div>`).join("")}</div>`;
  }
  $("selectedPanel").innerHTML=html;
}
function renderUI(){
  $("day").textContent=world.day;
  $("time").textContent=String(Math.floor(world.time)).padStart(2,"0")+":"+String(Math.floor((world.time%1)*60)).padStart(2,"0");
  ["wood","stone","food","fibre","clay"].forEach(k=>$(k).textContent=world[k]);
  $("stage").textContent=world.stage;$("tech").textContent=[...world.tech].join(", ")||"None";$("weather").textContent=world.weather;
  $("agents").innerHTML="";
  world.agents.forEach((a,i)=>{
    const b=document.createElement("button");b.className="agent "+(i===selected?"sel":"");
    b.textContent=`${a.name} — ${a.role} · ${a.action}`;
    b.onclick=()=>{selected=i;renderUI();};$("agents").appendChild(b);
  });
  renderSelected();
  $("promises").textContent="Promises will appear here as social behaviour develops.";
}
function frame(t){
  const elapsed=Math.min(.1,(t-lastFrame)/1000);lastFrame=t;
  if(running){
    simAccumulator+=elapsed;uiAccumulator+=elapsed;
    const step=1/PERF[perfMode].simHz;
    while(simAccumulator>=step){simStep(step);simAccumulator-=step;}
    if(uiAccumulator>=1/PERF[perfMode].uiHz){renderUI();uiAccumulator=0;}
  }
  draw(t);requestAnimationFrame(frame);
}

document.querySelectorAll(".tab[data-tab]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".tab[data-tab]").forEach(x=>x.classList.remove("active"));b.classList.add("active");activeTab=b.dataset.tab;renderSelected();
});
document.querySelectorAll(".chatfilter").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".chatfilter").forEach(x=>x.classList.remove("active"));b.classList.add("active");chatFilter=b.dataset.filter;renderChat();
});
$("start").onclick=()=>{running=true;$("runState").textContent="Running";};
$("pause").onclick=()=>{running=false;$("runState").textContent="Paused";};
$("talk").onclick=()=>{const a=world.agents[selected],b=world.agents[(selected+1)%world.agents.length];queueConversation(makeConversationPlan(a,b));};
$("reset").onclick=()=>{running=false;newWorld();$("runState").textContent="Ready";};
$("speed").onchange=e=>speed=clamp(parseInt(e.target.value)||1,1,25);
$("perf").onchange=e=>{perfMode=e.target.value;log(`Performance mode changed to ${perfMode}.`);};
$("loadVoice").onclick=loadTTS;
$("voiceToggle").onchange=e=>{voiceEnabled=e.target.checked;$("ttsState").textContent=voiceEnabled?(tts?"Voice ready":"Load voices first"):"Voice off";};
canvas.addEventListener("pointerdown",e=>{
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
  let bi=selected,bd=30;world.agents.forEach((a,i)=>{const d=Math.hypot(a.x-x,a.y-y);if(d<bd){bd=d;bi=i;}});
  selected=bi;renderUI();
});

newWorld();requestAnimationFrame(frame);
