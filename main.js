
import { KokoroTTS } from "kokoro-js";

const app = document.querySelector("#app");
app.innerHTML = `
<style>
.wrap{max-width:1220px;margin:auto;padding:10px}
.toolbar,.panel{background:#172033;border:1px solid #33405a;border-radius:15px}
.toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px;margin-bottom:10px}
button,select{min-height:44px;border:1px solid #3b4862;border-radius:10px;padding:9px 13px;background:#24304a;color:#f7f8fb}
button.primary{background:#1e6fb3}
button:disabled{opacity:.5}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:10px}
.panel{padding:10px}.side{display:grid;gap:10px}
canvas{display:block;width:100%;height:auto;border-radius:11px;background:#6c8055}
.small{font-size:13px;color:#b8c3d8;line-height:1.45}
.tiny{font-size:12px;color:#9eabc1;line-height:1.4}
.statgrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;font-size:14px}
.agent{width:100%;text-align:left;margin:4px 0;background:#1f293d}
.agent.sel{outline:2px solid #67b7ff}
#log{max-height:270px;overflow:auto}
.logline{font-size:13px;color:#b8c3d8;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.subtitle{margin-top:8px;background:#0e1422;border:1px solid #33405a;border-radius:10px;padding:10px;min-height:44px;text-align:center}
.badge{font-size:12px;border:1px solid #3b4862;border-radius:999px;padding:6px 9px;color:#c5cee0}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.tab{min-height:38px;padding:7px 10px}
.tab.active{outline:2px solid #67b7ff}
.kv{display:grid;grid-template-columns:auto 1fr;gap:4px 8px}
.progress{height:7px;background:#26324a;border-radius:999px;overflow:hidden}
.progress>span{display:block;height:100%;background:#79a9d8}
.promise{padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)}
@media(max-width:860px){.layout{grid-template-columns:1fr}.wrap{padding:8px}}
</style>

<div class="wrap">
  <div class="toolbar">
    <button id="loadVoice" class="primary">🔊 Load Free Voices</button>
    <button id="start">▶ Start</button>
    <button id="pause">⏸ Pause</button>
    <button id="talk">💬 Force Conversation</button>
    <button id="reset">↻ New World</button>
    <label class="small">Speed <select id="speed"><option>1</option><option>2</option><option>5</option><option>10</option><option>25</option></select>×</label>
    <label class="small">Performance <select id="perf"><option value="mobile">Mobile</option><option value="balanced" selected>Balanced</option><option value="desktop">Desktop</option></select></label>
    <label class="small"><input id="voiceToggle" type="checkbox" checked> Speak important lines</label>
    <span id="ttsState" class="badge">TTS not loaded</span>
    <span id="runState" class="badge">Ready</span>
  </div>

  <div class="layout">
    <div class="panel">
      <canvas id="world" width="850" height="540" aria-label="Autonomous civilisation simulation"></canvas>
      <div id="subtitle" class="subtitle">v0.5: smoother simulation plus questions, follow-ups, memory recall and knowledge sharing.</div>
    </div>

    <div class="side">
      <div class="panel">
        <h3>Settlement</h3>
        <div class="statgrid">
          <div>Day <b id="day">1</b></div><div>Time <b id="time">08:00</b></div>
          <div>🪵 Wood <b id="wood">0</b></div><div>🪨 Stone <b id="stone">0</b></div>
          <div>🍓 Food <b id="food">0</b></div><div>🧵 Fibre <b id="fibre">0</b></div>
          <div>🧱 Clay <b id="clay">0</b></div><div>Stage <b id="stage">Wilderness</b></div>
        </div>
        <div class="small" style="margin-top:8px"><b>Technology:</b> <span id="tech">None</span></div>
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
        <h3>Current conversation</h3>
        <div id="conversation" class="small">Nobody is speaking.</div>
      </div>
    </div>
  </div>

  <div class="panel" style="margin-top:10px">
    <h3>Promises & Social Commitments</h3>
    <div id="promises" class="small">No active promises.</div>
  </div>

  <div class="panel" style="margin-top:10px">
    <h3>Event Log</h3>
    <div id="log"></div>
  </div>
</div>
`;

const $ = id => document.getElementById(id);
const canvas=$("world"),ctx=canvas.getContext("2d",{alpha:false}),W=canvas.width,H=canvas.height;
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const chance=p=>Math.random()<p;
const pick=a=>a[Math.floor(Math.random()*a.length)];

let running=false,speed=1,selected=0,activeTab="overview",talkBusy=false,tts=null,ttsLoading=false,currentAudio=null;
let voiceEnabled=true,perfMode="balanced",audioCache=new Map(),lastFrame=performance.now(),simAcc=0,uiAcc=0;
let world;
const PERF={mobile:{simHz:7,uiHz:3,decisionTicks:85,talkTicks:420,resourceScale:.65,maxTurns:3},balanced:{simHz:11,uiHz:5,decisionTicks:60,talkTicks:320,resourceScale:.85,maxTurns:4},desktop:{simHz:16,uiHz:8,decisionTicks:42,talkTicks:240,resourceScale:1,maxTurns:5}};

const CHARACTERS=[
  {name:"Alex",role:"Builder",color:"#f0b84b",voice:"bm_george",traits:{practical:.9,curious:.45,social:.5,cautious:.6,stubborn:.55}},
  {name:"Sarah",role:"Gatherer",color:"#ef7894",voice:"bf_emma",traits:{practical:.75,curious:.55,social:.65,cautious:.75,stubborn:.35}},
  {name:"James",role:"Explorer",color:"#69aef8",voice:"bm_fable",traits:{practical:.5,curious:.95,social:.55,cautious:.25,stubborn:.45}},
  {name:"Michael",role:"Organiser",color:"#7ecb91",voice:"bm_lewis",traits:{practical:.7,curious:.5,social:.95,cautious:.65,stubborn:.4}}
];

const TECHS={
  "Firemaking":{needs:["fire"],desc:"Reliable campfire use"},
  "Stone Tools":{needs:["stone","wood"],desc:"Basic cutting and hammering tools"},
  "Cordage":{needs:["fibre"],desc:"Rope and bindings"},
  "Improved Shelter":{needs:["Stone Tools","Cordage"],desc:"Stronger framed shelter"},
  "Clay Working":{needs:["clay","fire"],desc:"Simple fired containers"},
  "Food Storage":{needs:["Clay Working"],desc:"Longer lasting stored food"},
  "Farming":{needs:["Food Storage"],desc:"Basic cultivation"}
};

function log(text){
  const d=document.createElement("div");d.className="logline";d.textContent=text;$("log").prepend(d);
  while($("log").children.length>90)$("log").lastChild.remove();
}
function remember(a,type,text,importance=1,data=null){
  a.memories.push({day:world.day,time:world.time,type,text,importance,data});
  if(a.memories.length>70)a.memories.shift();
}
function know(a,key,source="self"){
  if(!a.knowledge.has(key)){
    a.knowledge.add(key);remember(a,"knowledge","Learned: "+key+" ("+source+")",2);return true;
  }
  return false;
}
function addPromise(from,to,kind,detail){
  const p={id:world.nextPromise++,from:from.name,to:to.name,kind,detail,created:world.tick,status:"active",deadline:world.tick+1600};
  world.promises.push(p);
  remember(from,"promise","Promised "+to.name+": "+detail,3);
  remember(to,"promise",from.name+" promised: "+detail,3);
  log("🤝 "+from.name+" promised "+to.name+": "+detail);
  return p;
}
function fulfilPromise(a,kind){
  const p=world.promises.find(p=>p.status==="active"&&p.from===a.name&&p.kind===kind);
  if(!p)return;
  p.status="fulfilled";
  const other=world.agents.find(x=>x.name===p.to);
  if(other){other.trust[a.name]=clamp(other.trust[a.name]+8,0,100);remember(other,"social",a.name+" kept a promise",3);}
  remember(a,"social","Kept promise to "+p.to,3);
  log("✅ "+a.name+" kept a promise to "+p.to+".");
}
function breakExpiredPromises(){
  for(const p of world.promises){
    if(p.status==="active"&&world.tick>p.deadline){
      p.status="broken";
      const to=world.agents.find(x=>x.name===p.to),from=world.agents.find(x=>x.name===p.from);
      if(to&&from){to.trust[from.name]=clamp(to.trust[from.name]-10,0,100);remember(to,"social",from.name+" failed to keep a promise",3);}
      log("⚠️ "+p.from+" failed to keep a promise to "+p.to+".");
    }
  }
}
async function loadTTS(){
  if(tts||ttsLoading)return;
  ttsLoading=true;$("loadVoice").disabled=true;$("ttsState").textContent="Downloading local voice model…";
  try{
    tts=await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX",{dtype:"q8",device:"wasm"});
    $("ttsState").textContent="Local TTS ready";$("loadVoice").textContent="🔊 Free Voices Ready";log("🔊 Local Kokoro voices loaded.");
  }catch(e){
    console.error(e);$("ttsState").textContent="TTS load failed";$("loadVoice").disabled=false;log("⚠️ Local voice model could not load.");
  }finally{ttsLoading=false;}
}
async function speak(name,text){
  $("conversation").textContent=`${name}: “${text}”`;$("subtitle").textContent=`${name}: ${text}`;log(`💬 ${name}: “${text}”`);
  if(!tts||!voiceEnabled)return;
  const person=CHARACTERS.find(x=>x.name===name),key=name+"|"+text;
  try{
    $("ttsState").textContent=`Generating ${name} locally…`;
    let blob=audioCache.get(key);
    if(!blob){const audio=await tts.generate(text,{voice:person.voice,speed:1});blob=audio.toBlob?audio.toBlob():null;if(blob&&audioCache.size<36)audioCache.set(key,blob);}
    if(!blob)return;
    const url=URL.createObjectURL(blob);currentAudio=new Audio(url);
    await new Promise((resolve,reject)=>{currentAudio.onended=()=>{URL.revokeObjectURL(url);resolve();};currentAudio.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("playback failed"));};currentAudio.play().catch(reject);});
    currentAudio=null;$("ttsState").textContent="Local TTS ready";
  }catch(e){console.error(e);$("ttsState").textContent="Voice playback failed";}
}
async function conversation(lines,onDone){
  if(talkBusy)return;talkBusy=true;
  for(const [n,t] of lines.slice(0,PERF[perfMode].maxTurns)){await speak(n,t);await new Promise(r=>setTimeout(r,80));}
  talkBusy=false;$("conversation").textContent="Conversation finished.";if(onDone)onDone();
}

function newWorld(){
  const resources=[];const rs=PERF[perfMode].resourceScale;
  for(let i=0;i<Math.floor(86*rs);i++)resources.push({type:"tree",x:rnd(25,W-25),y:rnd(25,H-25),amount:4});
  for(let i=0;i<Math.floor(26*rs);i++)resources.push({type:"stone",x:rnd(25,W-25),y:rnd(25,H-25),amount:3});
  for(let i=0;i<Math.floor(34*rs);i++)resources.push({type:"food",x:rnd(25,W-25),y:rnd(25,H-25),amount:2});
  for(let i=0;i<Math.floor(25*rs);i++)resources.push({type:"fibre",x:rnd(25,W-25),y:rnd(25,H-25),amount:2});
  for(let i=0;i<Math.floor(16*rs);i++)resources.push({type:"clay",x:rnd(25,W-25),y:rnd(25,H-25),amount:2});

  const agents=CHARACTERS.map((c,i)=>{
    const trust={};CHARACTERS.forEach(o=>trust[o.name]=o.name===c.name?100:50+rnd(-5,5));
    return {...c,x:W*.22+i*27,y:H*.59+i*10,hunger:rnd(74,90),thirst:rnd(74,90),energy:rnd(78,95),warmth:rnd(72,91),social:rnd(55,82),
      wood:0,stone:0,food:0,fibre:0,clay:0,goal:"Observe surroundings",action:"Thinking",target:null,memories:[],
      knowledge:new Set(["trees provide wood","river provides water","berries provide food"]),trust,
      opinions:{exploration:rnd(35,80),risk:rnd(25,70),sharing:rnd(55,90)},skills:{gather:1,build:1,explore:1,social:1,craft:1},
      wander:{x:rnd(30,W-30),y:rnd(30,H-30)},lastDiscovery:0,lastExperiment:0,lastDecision:0,lastTalk:-999};
  });

  world={resources,agents,river:{x:W*.58,w:60},time:8,day:1,tick:0,wood:0,stone:0,food:0,fibre:0,clay:0,fire:null,shelter:null,storage:null,
    stage:"Wilderness",seed:Math.floor(Math.random()*999999),tech:new Set(),promises:[],nextPromise:1,discoveries:[],experiments:[]};
  $("log").innerHTML="";log("🌍 New wilderness generated. Seed "+world.seed+".");log("👥 Four autonomous settlers entered the world.");render();
}
function nearest(a,type){let best=null,bd=Infinity;for(const r of world.resources){if(r.type!==type||r.amount<=0)continue;const d=dist(a,r);if(d<bd){bd=d;best=r;}}return best;}
function move(a,t,s=1.25){if(!t)return false;const dx=t.x-a.x,dy=t.y-a.y,d=Math.hypot(dx,dy);if(d<5)return true;a.x+=dx/d*s*a.skills.explore;a.y+=dy/d*s*a.skills.explore;return false;}

function discover(a){
  if(world.tick-a.lastDiscovery<150)return;
  const nearby=world.resources.filter(r=>r.amount>0&&dist(a,r)<70);
  if(!nearby.length)return;
  const r=pick(nearby);
  const key=`${r.type} patch at ${Math.round(r.x/50)},${Math.round(r.y/50)}`;
  if(know(a,key,"exploration")){
    a.lastDiscovery=world.tick;world.discoveries.push({who:a.name,key,type:r.type,x:r.x,y:r.y,tick:world.tick});
    remember(a,"discovery","Found "+key,3,{resource:r.type,x:r.x,y:r.y});
    log("🔎 "+a.name+" discovered "+key+".");
  }
}
function teach(a,b){
  const diff=[...a.knowledge].filter(k=>!b.knowledge.has(k));
  if(!diff.length)return false;
  const k=pick(diff);know(b,k,a.name);a.skills.social+=.01;b.skills.social+=.005;
  remember(a,"teaching","Taught "+b.name+": "+k,2);remember(b,"learning",a.name+" taught: "+k,2);log("🧠 "+a.name+" taught "+b.name+" about "+k+".");
  return true;
}
function experiment(a){
  if(world.tick-a.lastExperiment<500)return false;
  if(a.energy<35||a.hunger<35)return false;
  const candidates=[];
  if(a.wood>0&&a.stone>0&&!world.tech.has("Stone Tools"))candidates.push("Stone Tools");
  if(a.fibre>1&&!world.tech.has("Cordage"))candidates.push("Cordage");
  if(a.clay>1&&world.fire&&!world.tech.has("Clay Working"))candidates.push("Clay Working");
  if(!candidates.length)return false;
  a.lastExperiment=world.tick;
  const tech=pick(candidates),base=.35+a.traits.curiosity*.25+a.skills.craft*.08;
  const success=chance(clamp(base,.2,.85));
  world.experiments.push({who:a.name,tech,success,tick:world.tick});
  if(success){
    world.tech.add(tech);know(a,tech,"experiment");a.skills.craft+=.12;remember(a,"discovery","Successfully discovered "+tech,4);log("🛠️ "+a.name+" discovered "+tech+" through experimentation!");
  }else{
    a.skills.craft+=.04;remember(a,"experiment","Failed experiment toward "+tech,2);log("🧪 "+a.name+" experimented with "+tech+" but failed.");
  }
  return true;
}
function maybeAdvanceTech(){
  if(world.fire&&!world.tech.has("Firemaking"))world.tech.add("Firemaking");
  if(world.tech.has("Stone Tools")&&world.tech.has("Cordage")&&world.shelter&&!world.tech.has("Improved Shelter")&&world.wood>12&&world.fibre>4){
    world.wood-=12;world.fibre-=4;world.tech.add("Improved Shelter");world.stage="Improved Camp";log("🏕️ The settlers developed an improved shelter using tools and cordage.");
  }
  if(world.tech.has("Clay Working")&&world.food>15&&!world.tech.has("Food Storage")){
    world.tech.add("Food Storage");log("🏺 The group learned to store food more effectively.");
  }
}
function decide(a,i){
  const night=world.time>=18||world.time<6;
  const scores={drink:100-a.thirst,eat:100-a.hunger,rest:100-a.energy,warm:(100-a.warmth)+(night?24:0),
    food:Math.max(0,58-a.food*7),wood:Math.max(0,50-a.wood*5),stone:Math.max(0,28-a.stone*5),fibre:22-a.fibre*3,clay:15-a.clay*3,
    social:100-a.social,explore:18*a.skills.explore,experiment:8+a.traits.curiosity*20};
  if(!world.fire)scores.wood+=28;if(world.fire&&!world.shelter)scores.wood+=18;
  if(a.role==="Gatherer"){scores.food+=13;scores.fibre+=7;}if(a.role==="Builder"){scores.wood+=10;scores.stone+=6;scores.experiment+=5;}
  if(a.role==="Explorer")scores.explore+=16;if(a.role==="Organiser")scores.social+=14;
  const activePromise=world.promises.find(p=>p.status==="active"&&p.from===a.name);
  if(activePromise){if(activePromise.kind==="wood")scores.wood+=35;if(activePromise.kind==="food")scores.food+=35;if(activePromise.kind==="fibre")scores.fibre+=35;}
  const pickAct=Object.entries(scores).sort((x,y)=>y[1]-x[1])[0][0];
  if(pickAct==="drink"){a.goal="Find water";a.action="Walking to river";a.target={x:world.river.x,y:a.y};}
  if(pickAct==="eat"){if(a.food>0){a.food--;a.hunger=clamp(a.hunger+45,0,100);a.goal="Eat";a.action="Eating";}else{a.goal="Find food";a.action="Gathering food";a.target=nearest(a,"food");}}
  if(pickAct==="rest"){a.goal="Recover energy";a.action="Resting";a.target=world.shelter||a;}
  if(pickAct==="warm"){if(world.fire){a.goal="Get warm";a.action="Walking to campfire";a.target=world.fire;}else{a.goal="Create warmth";a.action="Gathering wood";a.target=nearest(a,"tree");}}
  if(["food","wood","stone","fibre","clay"].includes(pickAct)){
    const map={food:"food",wood:"tree",stone:"stone",fibre:"fibre",clay:"clay"};a.goal="Gather "+pickAct;a.action="Gathering "+pickAct;a.target=nearest(a,map[pickAct]);
  }
  if(pickAct==="social"){const o=world.agents[(i+1)%4];a.goal="Coordinate with "+o.name;a.action="Talking";a.target=o;}
  if(pickAct==="explore"){a.goal="Explore unknown area";a.action="Exploring";if(dist(a,a.wander)<15)a.wander={x:rnd(30,W-30),y:rnd(30,H-30)};a.target=a.wander;}
  if(pickAct==="experiment"){if(!experiment(a)){a.goal="Explore possibilities";a.action="Exploring";a.target=a.wander;}}
}
function disagreement(a,b){
  const issue=pick(["exploration","risk","sharing"]);
  const delta=Math.abs(a.opinions[issue]-b.opinions[issue]);
  if(delta<28)return false;
  const stubborn=(a.traits.stubborn+b.traits.stubborn)/2;
  const trust=(a.trust[b.name]+b.trust[a.name])/2;
  if(!chance(.15+stubborn*.15))return false;
  a.trust[b.name]=clamp(a.trust[b.name]-3,0,100);b.trust[a.name]=clamp(b.trust[a.name]-3,0,100);
  remember(a,"conflict","Disagreed with "+b.name+" about "+issue,3);remember(b,"conflict","Disagreed with "+a.name+" about "+issue,3);
  log("⚡ "+a.name+" and "+b.name+" disagreed about "+issue+".");
  if(trust>60){a.opinions[issue]=(a.opinions[issue]*.8+b.opinions[issue]*.2);b.opinions[issue]=(b.opinions[issue]*.8+a.opinions[issue]*.2);}
  return true;
}
function memoryAnswer(b,topic){
  if(["food","stone","wood"].includes(topic)){
    const type=topic==="wood"?"tree":topic;
    const m=[...b.memories].reverse().find(x=>x.data?.resource===type);
    if(m)return `Yes. I remember ${topic} near grid ${Math.round(m.data.x/50)},${Math.round(m.data.y/50)}.`;
    return `I haven't marked a reliable ${topic} location yet.`;
  }
  if(topic==="plans")return `Right now I'm focused on ${b.goal.toLowerCase()}.`;
  if(topic==="technology")return b.knowledge.size>3?`I've learned about ${[...b.knowledge].slice(-1)[0]}.`:"Nothing advanced yet, but I'm still experimenting.";
  if(topic==="memory"){const x=[...b.memories].reverse().find(x=>x.importance>=3);return x?`What stands out most is this: ${x.text}.`:"Nothing major stands out yet.";}
  return b.opinions.risk>60?"I think we should take a few more risks to make progress.":"I think keeping the camp safe should come first.";
}
function chooseTopic(a){
  const t=[];
  if(a.role==="Explorer"||a.traits.curiosity>.6)t.push("food","stone","wood","technology");
  if(a.role==="Organiser"||a.traits.social>.6)t.push("plans","memory","opinion");
  if(a.role==="Builder")t.push("stone","wood","technology");
  if(a.role==="Gatherer")t.push("food","wood","plans");
  return pick(t.length?t:["plans"]);
}
async function contextualTalk(a,b){
  if(talkBusy)return;
  const topic=chooseTopic(a),lines=[];
  if(topic==="food")lines.push([a.name,`${b.name}, have you seen any food away from camp?`],[b.name,memoryAnswer(b,"food")],[a.name,"Was there much there?"],[b.name,"Enough to be useful if we can find it again."]);
  else if(topic==="stone")lines.push([a.name,`Have you found much stone, ${b.name}?`],[b.name,memoryAnswer(b,"stone")],[a.name,"Do you think it's worth gathering soon?"],[b.name,"Yes, especially if we want better tools and stronger building."]);
  else if(topic==="wood")lines.push([a.name,`Where have you seen the best timber, ${b.name}?`],[b.name,memoryAnswer(b,"wood")],[a.name,"Good. I'll remember that."]);
  else if(topic==="plans")lines.push([a.name,`What are you planning to do next, ${b.name}?`],[b.name,memoryAnswer(b,"plans")],[a.name,"Do you need any help with that?"],[b.name,b.goal.includes("Gather")?"Yes. Extra resources would help.":"Not yet, but I'll ask if that changes."]);
  else if(topic==="memory")lines.push([a.name,`What's been on your mind lately, ${b.name}?`],[b.name,memoryAnswer(b,"memory")],[a.name,"I hadn't thought about it that way."]);
  else if(topic==="technology")lines.push([a.name,`Have you figured out anything new, ${b.name}?`],[b.name,memoryAnswer(b,"technology")],[a.name,"Can you show me later?"],[b.name,"Yes. If I understand it well enough, I'll teach you."]);
  else lines.push([a.name,"What do you think we should focus on next?"],[b.name,memoryAnswer(b,"opinion")],[a.name,a.opinions.risk>60?"I can see the sense in pushing forward.":"I'd rather make sure we're safe first."]);
  await conversation(lines,()=>{
    a.social=clamp(a.social+12,0,100);b.social=clamp(b.social+12,0,100);
    remember(a,"conversation",`Asked ${b.name} about ${topic}`,2);remember(b,"conversation",`Talked with ${a.name} about ${topic}`,2);
    const diff=[...b.knowledge].filter(k=>!a.knowledge.has(k));if(diff.length&&["food","stone","wood","technology"].includes(topic)){const k=pick(diff);know(a,k,b.name);log("🧠 "+a.name+" learned from "+b.name+": "+k+".");}
    if(topic==="plans"&&b.goal.includes("Gather")&&chance(.3))addPromise(a,b,b.goal.includes("food")?"food":"wood","help with "+b.goal.toLowerCase());
  });
}
function act(a,i){
  a.hunger-=.018;a.thirst-=.026;a.energy-=.014;a.social-=.006;a.warmth-=(world.time>=18||world.time<6)?.035:.006;
  if(world.fire&&dist(a,world.fire)<62)a.warmth=clamp(a.warmth+.10,0,100);
  if(world.tick-(a.lastDecision||0)>PERF[perfMode].decisionTicks+i*3){a.lastDecision=world.tick;decide(a,i);}
  if(a.action==="Eating"||a.action==="Thinking")return;
  if(a.action==="Walking to river"){if(move(a,a.target)){a.thirst=100;a.action="Drinking";remember(a,"need","Drank from the river",1);}}
  else if(a.action==="Resting"){if(move(a,a.target)){a.energy=clamp(a.energy+.2,0,100);if(a.energy>90)decide(a,i);}}
  else if(a.action==="Walking to campfire"){if(move(a,a.target))a.warmth=clamp(a.warmth+.18,0,100);}
  else if(a.action.startsWith("Gathering")){
    if(!a.target||a.target.amount<=0){decide(a,i);return;}
    if(move(a,a.target)&&world.tick%20===0){
      a.target.amount--;a.skills.gather+=.002;
      const t=a.target.type;
      if(t==="tree"){a.wood++;world.wood++;if(a.wood>=3)fulfilPromise(a,"wood");}
      if(t==="stone"){a.stone++;world.stone++;}
      if(t==="food"){a.food++;world.food++;if(a.food>=2)fulfilPromise(a,"food");}
      if(t==="fibre"){a.fibre++;world.fibre++;if(a.fibre>=2)fulfilPromise(a,"fibre");}
      if(t==="clay"){a.clay++;world.clay++;}
      if(chance(.08))log("🧺 "+a.name+" gathered "+(t==="tree"?"wood":t)+".");
      if(a.target.amount<=0)decide(a,i);
    }
  }else if(a.action==="Talking"){
    if(move(a,a.target)&&world.tick-a.lastTalk>PERF[perfMode].talkTicks&&!talkBusy){a.lastTalk=world.tick;contextualTalk(a,a.target);}
  }else{
    move(a,a.target);if(a.action==="Exploring")discover(a);
  }
  if(chance(.0015))experiment(a);
}
function buildCheck(){
  if(!world.fire&&world.wood>=10){world.wood-=10;world.fire={x:W*.34,y:H*.52};world.stage="Camp";log("🔥 First campfire constructed.");world.agents.forEach(a=>{know(a,"fire","shared experience");remember(a,"milestone","We built our first fire",4);});}
  if(world.fire&&!world.shelter&&world.wood>=18&&world.stone>=4){world.wood-=18;world.stone-=4;world.shelter={x:W*.39,y:H*.46};world.stage="Permanent Camp";log("⛺ First shelter completed.");world.agents.forEach(a=>{know(a,"shelter","shared experience");remember(a,"milestone","We completed our first shelter",4);a.skills.build+=.05;});}
  if(world.shelter&&!world.storage&&world.wood>=14){world.wood-=14;world.storage={x:W*.31,y:H*.46};world.stage="Settlement";log("📦 Shared storage constructed.");}
}
function step(){
  if(!running)return;
  for(let n=0;n<speed;n++){
    world.tick++;world.time+=.0035;if(world.time>=24){world.time-=24;world.day++;log("🌅 Day "+world.day+" begins.");}
    world.agents.forEach(act);buildCheck();maybeAdvanceTech();
    if(world.tick%200===0)breakExpiredPromises();
  }
}
function draw(){
  ctx.clearRect(0,0,W,H);ctx.fillStyle="#687f52";ctx.fillRect(0,0,W,H);ctx.fillStyle="#4d8baa";ctx.fillRect(world.river.x-world.river.w/2,0,world.river.w,H);
  for(const r of world.resources){if(r.amount<=0)continue;ctx.font=r.type==="tree"?"22px sans-serif":"16px sans-serif";const ic={tree:"🌲",stone:"🪨",food:"🍓",fibre:"🌾",clay:"🟤"}[r.type];ctx.fillText(ic,r.x-9,r.y+6);}
  if(world.storage){ctx.font="28px sans-serif";ctx.fillText("📦",world.storage.x-14,world.storage.y+9);}
  if(world.shelter){ctx.font="38px sans-serif";ctx.fillText("⛺",world.shelter.x-20,world.shelter.y+12);}
  if(world.fire){ctx.font="30px sans-serif";ctx.fillText("🔥",world.fire.x-15,world.fire.y+10);}
  world.agents.forEach((a,i)=>{ctx.beginPath();ctx.arc(a.x,a.y,i===selected?11:9,0,Math.PI*2);ctx.fillStyle=a.color;ctx.fill();ctx.lineWidth=i===selected?3:1;ctx.strokeStyle=i===selected?"#fff":"rgba(0,0,0,.45)";ctx.stroke();ctx.fillStyle="#fff";ctx.font="11px sans-serif";ctx.fillText(a.name,a.x-16,a.y-14);});
  if(world.time>=18||world.time<6){ctx.fillStyle="rgba(17,24,50,.3)";ctx.fillRect(0,0,W,H);}
}
function renderSelected(){
  const a=world.agents[selected];let html="";
  if(activeTab==="overview"){
    html=`<h3>${a.name} — ${a.role}</h3><div class="small"><b>Goal:</b> ${a.goal}<br><b>Action:</b> ${a.action}<br>Hunger ${Math.round(clamp(a.hunger,0,100))}% · Thirst ${Math.round(clamp(a.thirst,0,100))}%<br>Energy ${Math.round(clamp(a.energy,0,100))}% · Warmth ${Math.round(clamp(a.warmth,0,100))}%<br>Inventory: 🪵 ${a.wood} · 🪨 ${a.stone} · 🍓 ${a.food} · 🌾 ${a.fibre} · 🟤 ${a.clay}<br><b>Known concepts:</b> ${a.knowledge.size}</div>`;
  } else if(activeTab==="memory"){
    const mem=[...a.memories].slice(-8).reverse();
    html=`<h3>${a.name} — Recent Memory</h3><div class="tiny">${mem.length?mem.map(m=>`<div class="promise"><b>${m.type}</b> · Day ${m.day}: ${m.text}</div>`).join(""):"No memories yet."}</div>`;
  } else if(activeTab==="relations"){
    html=`<h3>${a.name} — Trust</h3><div class="small">${world.agents.filter(o=>o!==a).map(o=>`<div style="margin:7px 0">${o.name}: ${Math.round(a.trust[o.name])}<div class="progress"><span style="width:${a.trust[o.name]}%"></span></div></div>`).join("")}</div>`;
  } else if(activeTab==="skills"){
    html=`<h3>${a.name} — Skills</h3><div class="small">${Object.entries(a.skills).map(([k,v])=>`<div style="margin:7px 0">${k}: ${v.toFixed(2)}<div class="progress"><span style="width:${Math.min(100,v*55)}%"></span></div></div>`).join("")}</div>`;
  }
  $("selectedPanel").innerHTML=html;
}
function render(){
  $("day").textContent=world.day;$("time").textContent=String(Math.floor(world.time)).padStart(2,"0")+":"+String(Math.floor((world.time%1)*60)).padStart(2,"0");
  $("wood").textContent=world.wood;$("stone").textContent=world.stone;$("food").textContent=world.food;$("fibre").textContent=world.fibre;$("clay").textContent=world.clay;$("stage").textContent=world.stage;
  $("tech").textContent=[...world.tech].join(", ")||"None";
  $("agents").innerHTML="";world.agents.forEach((a,i)=>{const b=document.createElement("button");b.className="agent "+(i===selected?"sel":"");b.textContent=a.name+" — "+a.role+" · "+a.action;b.addEventListener("click",()=>{selected=i;render();});$("agents").appendChild(b);});
  renderSelected();
  const active=world.promises.filter(p=>p.status==="active");
  $("promises").innerHTML=active.length?active.map(p=>`<div class="promise">🤝 <b>${p.from}</b> → ${p.to}: ${p.detail}</div>`).join(""):"No active promises.";
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");activeTab=b.dataset.tab;renderSelected();}));
$("loadVoice").addEventListener("click",loadTTS);
$("start").addEventListener("click",()=>{running=true;$("runState").textContent="Running";});
$("pause").addEventListener("click",()=>{running=false;$("runState").textContent="Paused";if(currentAudio){currentAudio.pause();currentAudio=null;}});
$("talk").addEventListener("click",()=>{const a=world.agents[selected],b=world.agents[(selected+1)%world.agents.length];contextualTalk(a,b);});
$("reset").addEventListener("click",()=>{running=false;newWorld();$("runState").textContent="Ready";});
$("speed").addEventListener("change",e=>speed=clamp(parseInt(e.target.value)||1,1,25));
$("perf").addEventListener("change",e=>{perfMode=e.target.value;log("⚙️ Performance mode: "+perfMode+". Start a New World to change resource density.");});
$("voiceToggle").addEventListener("change",e=>voiceEnabled=e.target.checked);
canvas.addEventListener("pointerdown",e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;let bi=selected,bd=28;world.agents.forEach((a,i)=>{const d=Math.hypot(a.x-x,a.y-y);if(d<bd){bd=d;bi=i;}});selected=bi;render();});
newWorld();
function frame(t){
  const elapsed=Math.min(.12,(t-lastFrame)/1000);lastFrame=t;
  if(running){
    simAcc+=elapsed;uiAcc+=elapsed;
    const interval=1/PERF[perfMode].simHz;
    while(simAcc>=interval){step();simAcc-=interval;}
    if(uiAcc>=1/PERF[perfMode].uiHz){render();uiAcc=0;}
  }
  draw();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
