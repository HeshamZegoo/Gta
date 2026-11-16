import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const canvas=document.querySelector('#world'),hud=document.querySelector('#hud'),loading=document.querySelector('#loading');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x91aebe);scene.fog=new THREE.FogExp2(0x91aebe,.00165);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,1500);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
const pixelCap=innerWidth>1500?2:1.5;renderer.setPixelRatio(Math.min(devicePixelRatio,pixelCap));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const hemi=new THREE.HemisphereLight(0xd9edff,0x53606a,2.15);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffdfbd,3.2);sun.position.set(-160,230,100);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-180;sun.shadow.camera.right=180;sun.shadow.camera.top=180;sun.shadow.camera.bottom=-180;sun.shadow.bias=-.0002;scene.add(sun);
const mat=(c,r=.8,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const asphalt=mat(0x30383d,.96),curb=mat(0xaaa9a0),mark=mat(0xe4dfce),rubber=mat(0x101214),chrome=mat(0xaab8c1,.22,.85);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(1200,1200),mat(0x647363));ground.rotation.x=-Math.PI/2;ground.position.y=-.15;ground.receiveShadow=true;scene.add(ground);
// Road grid with lane dashes and pavements.
function road(x,z,w,d){const h=w>d,plane=new THREE.Mesh(new THREE.PlaneGeometry(w,d),asphalt);plane.rotation.x=-Math.PI/2;plane.position.set(x,.01,z);plane.receiveShadow=true;scene.add(plane);const len=h?w:d;for(let n=-Math.floor(len/14);n<Math.floor(len/14);n++){const dash=new THREE.Mesh(new THREE.PlaneGeometry(h?5:.13,h?.13:5),mark);dash.rotation.x=-Math.PI/2;dash.position.set(x+(h?n*14:0),.035,z+(h?0:n*14));scene.add(dash)}for(const s of [-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(h?w:3,.2,h?3:d),curb);p.position.set(x,.02,z+(h?s*(d/2+1):0)+(h?0:s*(d/2+1)));p.receiveShadow=true;scene.add(p)}}
for(let i=-3;i<=3;i++){road(i*105,0,1200,34);road(0,i*105,34,1200)}
// PBR facade modules: varied heights, recessed window grids, roof plant and parapets.
const facades=[0x999a94,0x778187,0xb2a99a,0x59666e,0x9b8978,0x687b80].map(c=>mat(c,.86));
const windows=[0x203747,0x385464,0x182d3a].map(c=>new THREE.MeshPhysicalMaterial({color:c,roughness:.18,metalness:.42,clearcoat:.9}));
let seed=817;const rand=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
function building(x,z,w,d,h){const group=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),facades[Math.floor(rand()*facades.length)]);body.position.y=h/2;body.castShadow=true;body.receiveShadow=true;group.add(body);const floors=Math.max(2,Math.floor(h/3.5)),cols=Math.max(2,Math.floor(w/3));for(let f=0;f<floors;f++){const y=1.2+f*(h-2)/floors;for(let c=0;c<cols;c++){const px=-w/2+(c+.5)*w/cols;for(const side of [-1,1]){const pane=new THREE.Mesh(new THREE.BoxGeometry(Math.min(1.65,w/cols*.65),Math.min(1.95,(h-2)/floors*.65),.06),windows[(f+c)%3]);pane.position.set(px,y,side*(d/2+.035));group.add(pane)}}}const roof=new THREE.Mesh(new THREE.BoxGeometry(w*.72,.45,d*.7),mat(0x555c60));roof.position.y=h+.22;group.add(roof);for(let i=0;i<2;i++){const ac=new THREE.Mesh(new THREE.BoxGeometry(1.4,.85,1.1),mat(0x727b80,.65,.25));ac.position.set((i-.5)*w*.27,h+.85,0);group.add(ac)}group.position.set(x,0,z);scene.add(group)}
for(let gx=-3;gx<=3;gx++)for(let gz=-3;gz<=3;gz++){if(gx===0&&gz===0)continue;const cx=gx*105,cz=gz*105;for(let n=0;n<4;n++){const x=cx+(n%2?1:-1)*(21+rand()*14),z=cz+(n<2?-1:1)*(21+rand()*14);building(x,z,17+rand()*13,17+rand()*13,13+rand()*65)}}
function tree(x,z,s=1){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16*s,.27*s,2.8*s,9),mat(0x584333));trunk.position.set(x,1.4*s,z);trunk.castShadow=true;scene.add(trunk);for(let i=0;i<3;i++){const crown=new THREE.Mesh(new THREE.IcosahedronGeometry((1.45-i*.16)*s,2),mat([0x385b45,0x466c4e,0x587a52][i],1));crown.position.set(x+(i-1)*.25*s,(3.1+i*.7)*s,z);crown.castShadow=true;scene.add(crown)}}
for(let x=-330;x<=330;x+=35)for(const z of [-27,27])tree(x,z,.85);for(let z=-330;z<=330;z+=35)for(const x of [-27,27])tree(x,z,.85);
function lamp(x,z){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.13,6,8),chrome);pole.position.set(x,3,z);scene.add(pole);const arm=new THREE.Mesh(new THREE.BoxGeometry(1.5,.1,.1),chrome);arm.position.set(x+.65,5.8,z);scene.add(arm);const bulb=new THREE.Mesh(new THREE.BoxGeometry(.5,.13,.35),new THREE.MeshStandardMaterial({color:0xffe5b3,emissive:0xffd18a,emissiveIntensity:.6}));bulb.position.set(x+1.3,5.72,z);scene.add(bulb)}
for(let x=-300;x<=300;x+=70){lamp(x,-20);lamp(x,20)}
// Character controller. Replaceable with a rigged GLB character in the asset pass.
const player=new THREE.Group();scene.add(player);const skin=mat(0xb98262),shirt=mat(0x202b36),pants=mat(0x25282b),shoe=mat(0x111315);
const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.7,6,12),shirt);torso.position.y=1.42;torso.castShadow=true;player.add(torso);
const head=new THREE.Mesh(new THREE.SphereGeometry(.235,20,16),skin);head.position.y=2.16;head.castShadow=true;player.add(head);
const legs=[];for(const x of [-.15,.15]){const l=new THREE.Mesh(new THREE.CapsuleGeometry(.115,.62,4,8),pants);l.position.set(x,.64,0);l.castShadow=true;player.add(l);legs.push(l);const f=new THREE.Mesh(new THREE.BoxGeometry(.22,.13,.38),shoe);f.position.set(x,.17,-.06);player.add(f)}
for(const x of [-.43,.43]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.58,4,8),shirt);arm.position.set(x,1.38,0);arm.rotation.z=-x*.5;player.add(arm)}
// Detailed game-ready placeholder coupe; asset loader pass will replace this with licensed GLB.
function makeCar(color=0x1d526e){const car=new THREE.Group(),paint=new THREE.MeshPhysicalMaterial({color,metalness:.78,roughness:.23,clearcoat:1,clearcoatRoughness:.12}),glass=new THREE.MeshPhysicalMaterial({color:0x142b3a,roughness:.14,metalness:.48,clearcoat:1,transparent:true,opacity:.9});
const body=new THREE.Mesh(new THREE.BoxGeometry(2.05,.48,4.5),paint);body.position.y=.68;body.castShadow=true;car.add(body);
const hood=new THREE.Mesh(new THREE.BoxGeometry(1.96,.22,1.35),paint);hood.position.set(0,.99,-1.45);car.add(hood);
const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.68,.76,2.05),paint);cabin.position.set(0,1.2,.12);cabin.castShadow=true;car.add(cabin);
const wind=new THREE.Mesh(new THREE.BoxGeometry(1.55,.57,.045),glass);wind.position.set(0,1.29,-.91);wind.rotation.x=-.2;car.add(wind);
const rear=new THREE.Mesh(new THREE.BoxGeometry(1.55,.54,.045),glass);rear.position.set(0,1.3,1.17);rear.rotation.x=.2;car.add(rear);
for(const side of [-1,1]){const win=new THREE.Mesh(new THREE.BoxGeometry(.045,.47,1.52),glass);win.position.set(side*.85,1.3,.12);car.add(win);const mirror=new THREE.Mesh(new THREE.BoxGeometry(.22,.12,.2),paint);mirror.position.set(side*1.08,1.25,-.62);car.add(mirror)}
const wheels=[];for(const x of [-.99,.99])for(const z of [-1.48,1.48]){const pivot=new THREE.Group();pivot.position.set(x,.48,z);const tire=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.26,28),rubber);tire.rotation.z=Math.PI/2;tire.castShadow=true;pivot.add(tire);const rim=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.275,20),chrome);rim.rotation.z=Math.PI/2;pivot.add(rim);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.29,12),mat(0x252b30,.25,.9));hub.rotation.z=Math.PI/2;pivot.add(hub);car.add(pivot);wheels.push(pivot)}
for(const x of [-.68,.68]){const headlight=new THREE.Mesh(new THREE.BoxGeometry(.42,.14,.06),new THREE.MeshStandardMaterial({color:0xeaf5ff,emissive:0x9ecbff,emissiveIntensity:1.2}));headlight.position.set(x,.83,-2.27);car.add(headlight);const tail=new THREE.Mesh(new THREE.BoxGeometry(.38,.12,.06),new THREE.MeshStandardMaterial({color:0x9d1820,emissive:0x8c0710,emissiveIntensity:.8}));tail.position.set(x,.83,2.27);car.add(tail)}
car.userData.wheels=wheels;return car}
const mainCar=makeCar();mainCar.position.set(7,0,3);scene.add(mainCar);
const parked=[];for(let i=0;i<6;i++){const c=makeCar([0x9c252b,0xc5c8c8,0x202326,0x9c783f,0x315d49,0xeeeeea][i]);c.position.set(-14+(i%2)*5,0,-42-Math.floor(i/2)*12);c.rotation.y=Math.PI;scene.add(c);parked.push(c)}
const traffic=[];for(let i=0;i<8;i++){const c=makeCar([0xeeeeea,0x777f85,0x872c2c,0x253b50][i%4]);c.scale.setScalar(.8);c.position.set(-360+i*90,0,10+(i%2)*9);c.userData.trafficSpeed=5+(i%4)*2;scene.add(c);traffic.push(c)}
// Load a verified CC0 vehicle model and replace the temporary geometry cars.
const carAssetUrl='https://raw.githubusercontent.com/JaronKBragg7337/spectral-gt-rs/main/spectral_gt_rs_game_ready.glb';
const assetLoader=new GLTFLoader();
let carAssetReady=false;
const vehicleGroups=[mainCar,...parked,...traffic];
assetLoader.load(carAssetUrl,(gltf)=>{
  const source=gltf.scene;
  const bounds=new THREE.Box3().setFromObject(source);
  const size=bounds.getSize(new THREE.Vector3());
  const center=bounds.getCenter(new THREE.Vector3());
  const scale=4.5/Math.max(size.x,size.z);
  source.scale.setScalar(scale);
  source.position.sub(center.multiplyScalar(scale));
  source.rotation.y=Math.PI/2; // Source vehicle faces +X; game vehicles face -Z.
  source.position.y+=0.05;
  source.traverse((o)=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material=o.material.clone();}}});
  for(const group of vehicleGroups){
    group.clear();
    const instance=source.clone(true);
    group.add(instance);
    group.userData.wheels=[];
    instance.traverse(o=>{if(o.isMesh&&/wheel|tire/i.test(o.name))group.userData.wheels.push(o)});
  }
  carAssetReady=true;
  toast('CC0 Spectral GT loaded · Find your car');
  document.querySelector('#load-progress').style.width='100%';
  loading.style.opacity='0';hud.style.opacity='1';setTimeout(()=>loading.remove(),850);
},(event)=>{
  if(event.total)document.querySelector('#load-progress').style.width=Math.round(event.loaded/event.total*90)+'%';
},(error)=>{
  console.warn('Vehicle asset failed; keeping procedural fallback.',error);
  toast('Vehicle asset unavailable · Offline fallback active');
  loading.style.opacity='0';hud.style.opacity='1';setTimeout(()=>loading.remove(),850);
});

const state={mode:'walk',speed:0,heading:0},keys={},touch={};let activeCar=mainCar,last=performance.now(),elapsed=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function toast(s){const t=document.querySelector('#toast');t.textContent=s;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2200)}
function enterExit(){if(state.mode==='walk'){let found=null,dist=7;for(const c of [mainCar,...parked]){const d=player.position.distanceTo(c.position);if(d<dist){dist=d;found=c}}if(found){activeCar=found;state.mode='drive';player.visible=false;document.querySelector('#drive-pad').style.display='grid';document.querySelector('.move-pad').style.display='none';document.querySelector('.action-pad').style.display='none';document.querySelector('#speed').style.display='block';toast('Vehicle entered · Drive safe')}else toast('Walk closer to a parked car')}else{state.mode='walk';state.speed=0;player.visible=true;player.position.copy(activeCar.position).add(new THREE.Vector3(2,0,0));document.querySelector('#drive-pad').style.display='none';document.querySelector('.move-pad').style.display='block';document.querySelector('.action-pad').style.display='flex';document.querySelector('#speed').style.display='none';toast('You left the vehicle')}}
document.querySelector('#enter').addEventListener('click',enterExit);document.querySelector('#run').addEventListener('pointerdown',()=>keys.ShiftLeft=true);for(const ev of ['pointerup','pointercancel'])document.querySelector('#run').addEventListener(ev,()=>keys.ShiftLeft=false);
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE')enterExit()});addEventListener('keyup',e=>keys[e.code]=false);
document.querySelectorAll('[data-move],[data-drive]').forEach(b=>{const k=b.dataset.move||b.dataset.drive;b.addEventListener('pointerdown',e=>{e.preventDefault();touch[k]=1;b.setPointerCapture(e.pointerId)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>touch[k]=0)});
function update(dt){elapsed+=dt;for(const t of traffic){t.position.x+=t.userData.trafficSpeed*dt;if(t.position.x>390)t.position.x=-390}
if(state.mode==='walk'){const f=(keys.KeyW||keys.ArrowUp||touch.forward?1:0)-(keys.KeyS||keys.ArrowDown||touch.back?1:0),s=(keys.KeyD||keys.ArrowRight||touch.right?1:0)-(keys.KeyA||keys.ArrowLeft||touch.left?1:0);if(f||s){const angle=Math.atan2(s,-f);player.rotation.y=THREE.MathUtils.damp(player.rotation.y,angle,9,dt);const v=(keys.ShiftLeft||keys.ShiftRight?11:5.5);player.position.x+=Math.sin(angle)*v*dt;player.position.z-=Math.cos(angle)*v*dt;legs.forEach((l,i)=>l.rotation.x=Math.sin(elapsed*10+i*Math.PI)*.48)}else legs.forEach(l=>l.rotation.x=THREE.MathUtils.damp(l.rotation.x,0,8,dt));player.position.x=clamp(player.position.x,-430,430);player.position.z=clamp(player.position.z,-430,430)}
else{const gas=keys.KeyW||keys.ArrowUp||touch.gas,brake=keys.KeyS||keys.ArrowDown||touch.brake,left=keys.KeyA||keys.ArrowLeft||touch.left,right=keys.KeyD||keys.ArrowRight||touch.right;state.speed=THREE.MathUtils.damp(state.speed,gas?31:brake?-10:0,gas||brake?1.8:1.1,dt);if(Math.abs(state.speed)>.4)activeCar.rotation.y+=((left?1:0)-(right?1:0))*dt*(.85+Math.abs(state.speed)*.025)*Math.sign(state.speed);activeCar.position.x+=Math.sin(activeCar.rotation.y)*state.speed*dt;activeCar.position.z-=Math.cos(activeCar.rotation.y)*state.speed*dt;activeCar.userData.wheels.forEach(w=>w.rotation.x-=state.speed*dt*1.7);activeCar.position.x=clamp(activeCar.position.x,-430,430);activeCar.position.z=clamp(activeCar.position.z,-430,430);document.querySelector('#speed').innerHTML=String(Math.round(Math.abs(state.speed)*3.6)).padStart(3,'0')+' <small>KM/H</small>'}
const target=state.mode==='drive'?activeCar.position:player.position,yaw=state.mode==='drive'?activeCar.rotation.y:player.rotation.y;const desired=new THREE.Vector3(target.x+Math.sin(yaw)*1.5,target.y+3.3,target.z+Math.cos(yaw)*1.5+8);camera.position.lerp(desired,1-Math.exp(-4*dt));camera.lookAt(target.x,target.y+1.15,target.z)}
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.04);last=now;update(dt);renderer.render(scene,camera)}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth>1500?2:1.5))});
for(let i=0;i<=10;i++)setTimeout(()=>document.querySelector('#load-progress').style.width=i*10+'%',i*110);
setTimeout(()=>{if(!carAssetReady&&loading.isConnected){loading.querySelector('.loading-sub').textContent='PREPARING CITY · VEHICLE DOWNLOAD';toast('Welcome to Metro City · Find a car')}},900);
setInterval(()=>document.querySelector('#clock').textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false}),1000);
requestAnimationFrame(frame);