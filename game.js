import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { PointerLockControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/PointerLockControls.js";

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x87908b);
scene.fog=new THREE.FogExp2(0x69736e,.012);
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.05,900);
camera.position.set(0,2,12);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xb7c2c0,0x22251e,1.4));
const sun=new THREE.DirectionalLight(0xffead0,2.1); sun.position.set(-80,100,40); sun.castShadow=true; scene.add(sun);

const groundMat=new THREE.MeshStandardMaterial({color:0x50574c,roughness:1});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(500,500,40,40),groundMat); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

const matWall=new THREE.MeshStandardMaterial({color:0x55524a,roughness:1});
const matBurn=new THREE.MeshStandardMaterial({color:0x24221f,roughness:1});
function building(x,z,w,d,h){
 const g=new THREE.Group();
 const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),Math.random()>.5?matWall:matBurn); body.position.y=h/2; body.castShadow=true; g.add(body);
 for(let i=0;i<Math.floor(w/3);i++){const hole=new THREE.Mesh(new THREE.BoxGeometry(.8,.8,.12),new THREE.MeshBasicMaterial({color:0x0c0c0b}));hole.position.set(-w/2+1.3+i*3,h*.62,d/2+.07);g.add(hole)}
 g.position.set(x,0,z);scene.add(g);
}
for(let i=0;i<22;i++){const x=(Math.random()-.5)*150,z=(Math.random()-.5)*150;if(Math.hypot(x,z)>15)building(x,z,4+Math.random()*8,4+Math.random()*8,4+Math.random()*10)}

const rubbleMat=new THREE.MeshStandardMaterial({color:0x373633});
for(let i=0;i<180;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.2+Math.random()*1,.2+Math.random()*1,.2+Math.random()*1),rubbleMat);m.position.set((Math.random()-.5)*170,.15,(Math.random()-.5)*170);m.rotation.set(Math.random(),Math.random(),Math.random());scene.add(m)}

const smoke=new THREE.Group();scene.add(smoke);
for(let i=0;i<80;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.35+Math.random()*.8,8,8),new THREE.MeshBasicMaterial({color:0x464945,transparent:true,opacity:.16}));m.position.set((Math.random()-.5)*130,.5+Math.random()*18,(Math.random()-.5)*130);m.userData.v=.004+Math.random()*.012;smoke.add(m)}

const controls=new PointerLockControls(camera,document.body);
let started=false, keys={}, ammo=30, reserve=120, last=performance.now(), shots=[];
const menu=document.querySelector("#menu"),hud=document.querySelector("#hud"),loading=document.querySelector("#loading");
document.querySelector("#start").onclick=()=>{menu.classList.add("hidden");hud.classList.remove("hidden");started=true;controls.lock();};
document.querySelector("#how").onclick=()=>alert("WASD حركة | Mouse نظر | Click إطلاق | Shift ركض | R تلقيم");
addEventListener("keydown",e=>{keys[e.code]=true;if(e.code==="KeyR")reload()});addEventListener("keyup",e=>keys[e.code]=false);
addEventListener("mousedown",e=>{if(started&&e.button===0)shoot()});
function reload(){if(ammo<30&&reserve){const n=Math.min(30-ammo,reserve);ammo+=n;reserve-=n;updateAmmo()}}
function shoot(){if(!started||ammo<=0)return;ammo--;updateAmmo();const p=new THREE.Mesh(new THREE.SphereGeometry(.045,5,5),new THREE.MeshBasicMaterial({color:0xffd27a}));p.position.copy(camera.position);const v=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);p.userData.v=v.multiplyScalar(95);p.userData.life=2;scene.add(p);shots.push(p)}
function updateAmmo(){document.querySelector("#ammo").textContent=ammo+" / "+reserve}
const clock=new THREE.Clock();
function animate(t){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);
 if(started){
  const speed=keys.ShiftLeft?12:6;const dir=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));if(dir.length())dir.normalize();camera.translateX(dir.x*speed*dt);camera.translateZ(dir.z*speed*dt);camera.position.y=2;
  smoke.children.forEach(p=>{p.position.y+=p.userData.v*60*dt;if(p.position.y>22)p.position.y=.5});
  shots.forEach((p,i)=>{p.position.addScaledVector(p.userData.v,dt);p.userData.life-=dt;if(p.userData.life<0){scene.remove(p);shots.splice(i,1)}})
 }
 renderer.render(scene,camera);loading.style.display="none";document.querySelector("#fps").textContent=Math.round(1/dt)+" FPS";
}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
document.querySelector("#fire").onclick=shoot;document.querySelector("#reload").onclick=reload;
let sx=0,sy=0;document.querySelector("#stick").addEventListener("touchmove",e=>{const r=e.currentTarget.getBoundingClientRect(),t=e.touches[0];keys.KeyW=t.clientY<r.top+60;keys.KeyS=t.clientY>r.top+60;keys.KeyA=t.clientX<r.left+60;keys.KeyD=t.clientX>r.left+60},{passive:true});
animate();