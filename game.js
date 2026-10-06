import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { PointerLockControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/PointerLockControls.js";

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x6f7975);
scene.fog=new THREE.FogExp2(0x58625f,.0105);
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.05,900);
camera.position.set(0,2,12);

const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=false;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xb8c5c5,0x25261f,1.45));
const sun=new THREE.DirectionalLight(0xffdfba,1.65);
sun.position.set(-80,100,40);
scene.add(sun);

const groundMat=new THREE.MeshStandardMaterial({color:0x4d554b,roughness:1});
const groundGeo=new THREE.PlaneGeometry(500,500,64,64);
const pos=groundGeo.attributes.position;
for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getY(i);pos.setZ(i,Math.sin(x*.045)*.9+Math.cos(z*.052)*.8+Math.sin((x+z)*.018)*1.3)}
groundGeo.computeVertexNormals();
const ground=new THREE.Mesh(groundGeo,groundMat);
ground.rotation.x=-Math.PI/2;
scene.add(ground);

const roadMat=new THREE.MeshStandardMaterial({color:0x333733,roughness:1});
for(const [x,z,rx,rz] of [[0,0,10,230],[-70,30,70,8],[80,-80,8,80]]){
 const road=new THREE.Mesh(new THREE.PlaneGeometry(rx,rz),roadMat);
 road.rotation.x=-Math.PI/2; road.position.set(x,.025,z); scene.add(road);
}

const matWall=new THREE.MeshStandardMaterial({color:0x514e47,roughness:1});
const matBurn=new THREE.MeshStandardMaterial({color:0x232320,roughness:1});
const black=new THREE.MeshBasicMaterial({color:0x090a09});
function building(x,z,w,d,h){
 const g=new THREE.Group();
 const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),Math.random()>.42?matWall:matBurn);
 body.position.y=h/2; g.add(body);
 const broken=Math.max(2,Math.floor(w/2.2));
 for(let i=0;i<broken;i++){
  const hole=new THREE.Mesh(new THREE.BoxGeometry(.75,.9,.1),black);
  hole.position.set(-w/2+1+i*(w-2)/Math.max(1,broken-1),h*.58,d/2+.07);
  g.add(hole);
 }
 if(Math.random()<.7){
  const roof=new THREE.Mesh(new THREE.BoxGeometry(w*.55,.7,d*.35),matBurn);
  roof.position.set((Math.random()-.5)*w*.3,h+.35,(Math.random()-.5)*d*.2);
  roof.rotation.z=(Math.random()-.5)*.35; g.add(roof);
 }
 g.position.set(x,0,z); scene.add(g);
}
for(let i=0;i<30;i++){
 const x=(Math.random()-.5)*190,z=(Math.random()-.5)*190;
 if(Math.hypot(x,z)>18)building(x,z,4+Math.random()*9,4+Math.random()*9,4+Math.random()*11);
}

const rubbleMat=new THREE.MeshStandardMaterial({color:0x353633,roughness:1});
for(let i=0;i<230;i++){
 const m=new THREE.Mesh(new THREE.BoxGeometry(.2+Math.random()*1.2,.15+Math.random()*.9,.2+Math.random()*1.2),rubbleMat);
 m.position.set((Math.random()-.5)*190,.15,(Math.random()-.5)*190);
 m.rotation.set(Math.random()*2,Math.random()*3,Math.random()*2); scene.add(m);
}

const smoke=new THREE.Group(); scene.add(smoke);
for(let i=0;i<65;i++){
 const m=new THREE.Mesh(new THREE.SphereGeometry(.35+Math.random()*1,7,7),new THREE.MeshBasicMaterial({color:0x444845,transparent:true,opacity:.13}));
 m.position.set((Math.random()-.5)*160,.5+Math.random()*16,(Math.random()-.5)*160);
 m.userData.v=.015+Math.random()*.025; smoke.add(m);
}

const fireMat=new THREE.MeshBasicMaterial({color:0xff6b24,transparent:true,opacity:.75});
for(let i=0;i<18;i++){
 const f=new THREE.Mesh(new THREE.SphereGeometry(.12+Math.random()*.22,6,6),fireMat);
 f.position.set((Math.random()-.5)*150,.4+Math.random()*3,(Math.random()-.5)*150); f.userData.phase=Math.random()*6; scene.add(f);
}

const controls=new PointerLockControls(camera,document.body);
let started=false,keys={},ammo=30,reserve=120,lastStep=0;
const shots=[],planes=[],explosions=[],audio={ctx:null};
const menu=document.querySelector("#menu"),hud=document.querySelector("#hud"),loading=document.querySelector("#loading");
const ammoEl=document.querySelector("#ammo"),fpsEl=document.querySelector("#fps");

function startAudio(){
 if(audio.ctx)return;
 try{audio.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}
}
function tone(freq,dur,type="sine",gain=.025){
 if(!audio.ctx)return;
 const o=audio.ctx.createOscillator(),g=audio.ctx.createGain();
 o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,audio.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.ctx.currentTime+dur);
 o.connect(g).connect(audio.ctx.destination);o.start();o.stop(audio.ctx.currentTime+dur);
}
function gunSound(){tone(95,.07,"sawtooth",.08);tone(520,.045,"square",.035)}
function stepSound(){tone(75,.035,"triangle",.018)}
function planeSound(){tone(55,.9,"sawtooth",.018)}

async function enterFullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen()}catch(e){}}
document.querySelector("#fullscreen").onclick=()=>enterFullscreen();
document.querySelector("#start").onclick=async()=>{startAudio();await enterFullscreen();menu.classList.add("hidden");hud.classList.remove("hidden");started=true;controls.lock();};
document.querySelector("#how").onclick=()=>alert("WASD حركة | Mouse نظر | Click إطلاق | Shift ركض | R تلقيم | الهاتف: عصا للحركة + سحب يمين الشاشة للنظر");

addEventListener("keydown",e=>{keys[e.code]=true;if(e.code==="KeyR")reload()});
addEventListener("keyup",e=>keys[e.code]=false);
addEventListener("mousedown",e=>{if(started&&e.button===0)shoot()});

function updateAmmo(){ammoEl.textContent=ammo+" / "+reserve}
function reload(){if(ammo<30&&reserve){const n=Math.min(30-ammo,reserve);ammo+=n;reserve-=n;updateAmmo();tone(180,.16,"square",.025)}}
function shoot(){
 if(!started||ammo<=0)return;
 ammo--;updateAmmo();gunSound();
 const p=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.7,5),new THREE.MeshBasicMaterial({color:0xffd07a}));
 p.rotation.copy(camera.rotation);p.position.copy(camera.position);
 p.translateZ(-.5);
 const v=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
 p.userData.v=v.multiplyScalar(150);p.userData.life=1.2;scene.add(p);shots.push(p);
}

function makePlane(){
 const g=new THREE.Group();
 const body=new THREE.Mesh(new THREE.BoxGeometry(5,.65,1),new THREE.MeshStandardMaterial({color:0x343a38,roughness:1}));
 const nose=new THREE.Mesh(new THREE.ConeGeometry(.48,1.8,6),body.material);nose.rotation.z=-Math.PI/2;nose.position.x=3.1;g.add(body,nose);
 const wing=new THREE.Mesh(new THREE.BoxGeometry(.9,.12,7),body.material);g.add(wing);
 const tail=new THREE.Mesh(new THREE.BoxGeometry(1,.5,2.2),body.material);tail.position.x=-2;g.add(tail);
 g.position.set(camera.position.x+(Math.random()>.5?90:-90),35+Math.random()*20,camera.position.z-180-Math.random()*90);
 g.rotation.y=Math.atan2(camera.position.x-g.position.x,camera.position.z-g.position.z);
 g.userData.speed=45+Math.random()*30;g.userData.life=12;
 scene.add(g);planes.push(g);planeSound();
}
let planeTimer=5;

function explosion(x,y,z){
 const ring=new THREE.Mesh(new THREE.SphereGeometry(.5,8,8),new THREE.MeshBasicMaterial({color:0xff8b35,transparent:true,opacity:.8}));
 ring.position.set(x,y,z);ring.userData.life=.5;ring.userData.max=.5;scene.add(ring);explosions.push(ring);tone(45,.35,"sawtooth",.08);
 for(let i=0;i<8;i++){
  const d=new THREE.Mesh(new THREE.SphereGeometry(.08,5,5),new THREE.MeshBasicMaterial({color:0x8d6b4a}));
  d.position.copy(ring.position);d.userData.v=new THREE.Vector3(Math.random()-.5,Math.random()*.8,Math.random()-.5).normalize().multiplyScalar(7+Math.random()*8);d.userData.life=.7;scene.add(d);explosions.push(d);
 }
}

const clock=new THREE.Clock();
let mobileLook=false,lx=0,ly=0;
const lookZone=document.querySelector("#lookZone");
if(lookZone){
 lookZone.addEventListener("touchstart",e=>{const t=e.touches[0];lx=t.clientX;ly=t.clientY;mobileLook=true},{passive:true});
 lookZone.addEventListener("touchmove",e=>{
  if(!mobileLook||!started)return;const t=e.touches[0];const dx=t.clientX-lx,dy=t.clientY-ly;lx=t.clientX;ly=t.clientY;
  camera.rotation.y-=dx*.004;camera.rotation.x-=dy*.003;camera.rotation.x=Math.max(-1.45,Math.min(1.45,camera.rotation.x));
 },{passive:true});
 lookZone.addEventListener("touchend",()=>mobileLook=false,{passive:true});
}
const stick=document.querySelector("#stick");
if(stick)stick.addEventListener("touchmove",e=>{
 const r=stick.getBoundingClientRect(),t=e.touches[0];const x=(t.clientX-(r.left+r.width/2))/(r.width/2),y=(t.clientY-(r.top+r.height/2))/(r.height/2);
 keys.KeyA=x<-.25;keys.KeyD=x>.25;keys.KeyW=y<-.25;keys.KeyS=y>.25;
},{passive:true});
if(stick)stick.addEventListener("touchend",()=>{keys.KeyA=keys.KeyD=keys.KeyW=keys.KeyS=false},{passive:true});

function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.05),t=performance.now()*.001;
 if(started){
  const speed=keys.ShiftLeft||keys.ShiftRight?12:6;
  const dir=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));
  if(dir.length())dir.normalize();
  camera.translateX(dir.x*speed*dt);camera.translateZ(dir.z*speed*dt);camera.position.y=2;
  if(dir.length()&&t-lastStep>(speed>6?.27:.42)){stepSound();lastStep=t}
  smoke.children.forEach(p=>{p.position.y+=p.userData.v*60*dt;if(p.position.y>22)p.position.y=.5});
  scene.traverse(o=>{if(o.userData?.phase!==undefined)o.scale.y=.75+Math.sin(t*8+o.userData.phase)*.35});
  for(let i=shots.length-1;i>=0;i--){const p=shots[i];p.position.addScaledVector(p.userData.v,dt);p.userData.life-=dt;if(p.userData.life<0){scene.remove(p);shots.splice(i,1)}}
  planeTimer-=dt;if(planeTimer<=0){if(Math.random()<.8)makePlane();planeTimer=5+Math.random()*9}
  for(let i=planes.length-1;i>=0;i--){const p=planes[i];const target=new THREE.Vector3(camera.position.x,25,camera.position.z);p.position.lerp(target,dt*p.userData.speed/120);p.userData.life-=dt;if(Math.random()<dt*.06)explosion(p.position.x,p.position.y-3,p.position.z);if(p.userData.life<0){scene.remove(p);planes.splice(i,1)}}
  for(let i=explosions.length-1;i>=0;i--){const e=explosions[i];e.userData.life-=dt;if(e.userData.v)e.position.addScaledVector(e.userData.v,dt);if(e.userData.max)e.scale.setScalar(1+(e.userData.max-e.userData.life)*4);if(e.userData.life<=0){scene.remove(e);explosions.splice(i,1)}}
 }
 renderer.render(scene,camera);loading.style.display="none";fpsEl.textContent=Math.round(1/Math.max(dt,.001))+" FPS";
}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
document.querySelector("#fire").onclick=()=>{startAudio();shoot()};
document.querySelector("#reload").onclick=()=>{startAudio();reload()};
animate();