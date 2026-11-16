import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/environments/RoomEnvironment.js';
import { RGBELoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/RGBELoader.js';

const canvas=document.querySelector('#world'),hud=document.querySelector('#hud'),loading=document.querySelector('#loading');
const mapCanvas=document.querySelector('#minimap'),mapCtx=mapCanvas.getContext('2d');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x91aebe);scene.fog=new THREE.FogExp2(0x91aebe,.00165);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,1500);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
const pixelCap=innerWidth>1400?2:innerWidth>700?1.5:1.25;renderer.setPixelRatio(Math.min(devicePixelRatio,pixelCap));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
renderer.useLegacyLights=false;renderer.shadowMap.autoUpdate=true;renderer.info.autoReset=true;
const pmremGenerator=new THREE.PMREMGenerator(renderer);scene.environment=pmremGenerator.fromScene(new RoomEnvironment(),.04).texture;pmremGenerator.dispose();
const hdrGenerator=new THREE.PMREMGenerator(renderer);new RGBELoader().setDataType(THREE.HalfFloatType).load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/urban_street_01_1k.hdr',hdr=>{const env=hdrGenerator.fromEquirectangular(hdr).texture;scene.environment=env;hdr.dispose();hdrGenerator.dispose()},undefined,error=>{console.warn('Outdoor HDRI unavailable; studio reflections remain active.',error);hdrGenerator.dispose()});
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const hemi=new THREE.HemisphereLight(0xd9edff,0x53606a,2.15);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffdfbd,3.2);sun.position.set(-160,230,100);sun.castShadow=true;sun.shadow.mapSize.set(innerWidth>900?4096:2048,innerWidth>900?4096:2048);sun.shadow.camera.left=-85;sun.shadow.camera.right=85;sun.shadow.camera.top=85;sun.shadow.camera.bottom=-85;sun.shadow.camera.near=1;sun.shadow.camera.far=360;sun.shadow.bias=-.0002;scene.add(sun);
const mat=(c,r=.8,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const asphalt=mat(0x30383d,.96),curb=mat(0xaaa9a0),mark=mat(0xe4dfce),rubber=mat(0x101214),chrome=mat(0xaab8c1,.22,.85),sidewalkMat=mat(0x777b78,.98);
const asphaltCanvas=document.createElement('canvas');asphaltCanvas.width=asphaltCanvas.height=512;const asphaltCtx=asphaltCanvas.getContext('2d');asphaltCtx.fillStyle='#30383d';asphaltCtx.fillRect(0,0,512,512);for(let i=0;i<26000;i++){const n=75+Math.floor(Math.random()*95);asphaltCtx.fillStyle='rgba('+n+','+n+','+n+','+(Math.random()*.22)+')';asphaltCtx.fillRect(Math.random()*512,Math.random()*512,1+Math.random()*2,1+Math.random()*2)}const asphaltTexture=new THREE.CanvasTexture(asphaltCanvas);asphaltTexture.wrapS=asphaltTexture.wrapT=THREE.RepeatWrapping;asphaltTexture.repeat.set(8,8);asphaltTexture.colorSpace=THREE.SRGBColorSpace;asphaltTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());asphalt.map=asphaltTexture;asphalt.bumpMap=asphaltTexture;asphalt.bumpScale=.035;
const ground=new THREE.Mesh(new THREE.PlaneGeometry(1200,1200),mat(0x647363));ground.rotation.x=-Math.PI/2;ground.position.y=-.15;ground.receiveShadow=true;scene.add(ground);
// Road grid with lane dashes and pavements.
function road(x,z,w,d){
 const horizontal=w>d,plane=new THREE.Mesh(new THREE.PlaneGeometry(w,d),asphalt);
 plane.rotation.x=-Math.PI/2;plane.position.set(x,.01,z);plane.receiveShadow=true;scene.add(plane);
 const len=horizontal?w:d;
 for(let n=-Math.floor(len/14);n<Math.floor(len/14);n++){
  const dash=new THREE.Mesh(new THREE.PlaneGeometry(horizontal?5:.13,horizontal?.13:5),mark);
  dash.rotation.x=-Math.PI/2;dash.position.set(x+(horizontal?n*14:0),.035,z+(horizontal?0:n*14));scene.add(dash)
 }
 for(const side of [-1,1]){
  const sidewalk=new THREE.Mesh(new THREE.BoxGeometry(horizontal?w:5,.14,horizontal?5:d),sidewalkMat);
  sidewalk.position.set(x+(horizontal?0:side*(w/2+2.5)),.035,z+(horizontal?side*(d/2+2.5):0));sidewalk.receiveShadow=true;sidewalk.castShadow=true;scene.add(sidewalk);
  const edge=new THREE.Mesh(new THREE.BoxGeometry(horizontal?w:.35,.22,horizontal?.35:d),curb);
  edge.position.set(x+(horizontal?0:side*(w/2)),.1,z+(horizontal?side*(d/2):0));scene.add(edge);
 }
}
for(let i=-3;i<=3;i++){road(i*105,0,1200,34);road(0,i*105,34,1200)}
// PBR facade modules: varied heights, recessed window grids, roof plant and parapets.
const facades=[0x999a94,0x778187,0xb2a99a,0x59666e,0x9b8978,0x687b80].map(c=>mat(c,.86));
const windows=[0x203747,0x385464,0x182d3a].map(c=>new THREE.MeshPhysicalMaterial({color:c,roughness:.16,metalness:.5,clearcoat:1}));
let seed=817;const rand=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
const buildingCollision=[];
function facadeMap(base){
 const c=document.createElement('canvas');c.width=512;c.height=512;const x=c.getContext('2d');
 const hex='#'+base.toString(16).padStart(6,'0');x.fillStyle=hex;x.fillRect(0,0,512,512);
 for(let i=0;i<9000;i++){const v=Math.floor(rand()*45);x.fillStyle='rgba('+v+','+v+','+v+','+(rand()*.12)+')';x.fillRect(rand()*512,rand()*512,2+rand()*5,2+rand()*5)}
 for(let y=18;y<500;y+=48){for(let xx=18;xx<500;xx+=42){const ww=22+rand()*7,hh=25+rand()*8;x.fillStyle='#263b48';x.fillRect(xx, y, ww, hh);x.fillStyle='rgba(170,205,220,.35)';x.fillRect(xx+2,y+2,ww-4,2);x.fillStyle='rgba(7,15,20,.55)';x.fillRect(xx+ww*.48,y,2,hh);}}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;
}
const facadeTextures=[0x999a94,0x778187,0xb2a99a,0x59666e,0x9b8978,0x687b80].map(facadeMap);
function building(x,z,w,d,h){
 const group=new THREE.Group(),idx=Math.floor(rand()*facades.length);
 const surface=new THREE.MeshStandardMaterial({map:facadeTextures[idx],color:0xffffff,roughness:.9,metalness:.08});
 const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),surface);body.position.y=h/2;body.castShadow=true;body.receiveShadow=true;group.add(body);
 const floors=Math.max(2,Math.floor(h/3.5)),cols=Math.max(2,Math.floor(w/3));
 const frame=mat(0x303a40,.62,.35),balcony=mat(0x747b7e,.72,.25);
 for(let f=0;f<floors;f++){
  const y=1.2+f*(h-2)/floors;
  for(let c=0;c<cols;c++){
   const px=-w/2+(c+.5)*w/cols;
   for(const side of [-1,1]){
    const pane=new THREE.Mesh(new THREE.BoxGeometry(Math.min(1.65,w/cols*.65),Math.min(1.95,(h-2)/floors*.65),.075),windows[(f+c+idx)%3]);
    pane.position.set(px,y,side*(d/2+.05));group.add(pane);
    const sill=new THREE.Mesh(new THREE.BoxGeometry(Math.min(1.85,w/cols*.78),.09,.18),frame);sill.position.set(px,y-.98,side*(d/2+.08));group.add(sill);
    if(rand()>.76){const slab=new THREE.Mesh(new THREE.BoxGeometry(Math.min(2.5,w/cols*.9),.13,.85),balcony);slab.position.set(px,y-.9,side*(d/2+.42));group.add(slab);const rail=new THREE.Mesh(new THREE.BoxGeometry(Math.min(2.5,w/cols*.9),.52,.055),chrome);rail.position.set(px,y-.62,side*(d/2+.78));group.add(rail)}
   }
  }
 }
 const roof=new THREE.Mesh(new THREE.BoxGeometry(w*.9,.35,d*.9),mat(0x555c60));roof.position.y=h+.17;group.add(roof);
 for(let i=0;i<2+Math.floor(rand()*3);i++){const ac=new THREE.Mesh(new THREE.BoxGeometry(1.4,.85,1.1),mat(0x727b80,.65,.25));ac.position.set((rand()-.5)*w*.55,h+.72,(rand()-.5)*d*.45);group.add(ac)}
 const storefront=new THREE.Mesh(new THREE.BoxGeometry(w*.72,2.4,.12),new THREE.MeshPhysicalMaterial({color:0x17303b,roughness:.12,metalness:.45,transparent:true,opacity:.88,clearcoat:1}));storefront.position.set(0,1.35,d/2+.1);group.add(storefront);
 const awning=new THREE.Mesh(new THREE.BoxGeometry(w*.82,.16,1.1),mat([0x9a4336,0x345d72,0x9b8b66][idx%3],.7));awning.position.set(0,2.7,d/2+.55);group.add(awning);
 group.position.set(x,0,z);scene.add(group);buildingCollision.push({x,z,halfX:w/2+.35,halfZ:d/2+.35});
}
for(let gx=-3;gx<=3;gx++)for(let gz=-3;gz<=3;gz++){if(gx===0&&gz===0)continue;const cx=gx*105,cz=gz*105;for(let n=0;n<4;n++){const x=cx+(n%2?1:-1)*(21+rand()*14),z=cz+(n<2?-1:1)*(21+rand()*14);building(x,z,17+rand()*13,17+rand()*13,13+rand()*65)}}
const leafMats=[mat(0x294c38,1),mat(0x385c42,1),mat(0x466b49,1),mat(0x55774d,1)];
function tree(x,z,s=1){
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16*s,.27*s,2.8*s,12),mat(0x584333));trunk.position.set(x,1.4*s,z);trunk.castShadow=true;scene.add(trunk);
 for(let i=0;i<4;i++){const branch=new THREE.Mesh(new THREE.CylinderGeometry(.045*s,.08*s,1.1*s,7),mat(0x584333));branch.position.set(x+(i%2?-.45:.45)*s,2.35*s,z+(i<2?-.35:.35)*s);branch.rotation.z=(i%2?-.5:.5);branch.castShadow=true;scene.add(branch)}
 for(let i=0;i<6;i++){const radius=(.85+rand()*.48)*s,foliage=new THREE.Mesh(new THREE.SphereGeometry(radius,14,11),leafMats[i%leafMats.length]);foliage.position.set(x+(rand()-.5)*1.5*s,(3.05+rand()*1.5)*s,z+(rand()-.5)*1.5*s);foliage.scale.y=.82+rand()*.35;foliage.castShadow=true;scene.add(foliage)}
}
for(let x=-330;x<=330;x+=35)for(const z of [-27,27])tree(x,z,.85);for(let z=-330;z<=330;z+=35)for(const x of [-27,27])tree(x,z,.85);
function lamp(x,z){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.13,6,8),chrome);pole.position.set(x,3,z);scene.add(pole);const arm=new THREE.Mesh(new THREE.BoxGeometry(1.5,.1,.1),chrome);arm.position.set(x+.65,5.8,z);scene.add(arm);const bulb=new THREE.Mesh(new THREE.BoxGeometry(.5,.13,.35),new THREE.MeshStandardMaterial({color:0xffe5b3,emissive:0xffd18a,emissiveIntensity:.6}));bulb.position.set(x+1.3,5.72,z);scene.add(bulb)}
for(let x=-300;x<=300;x+=70){lamp(x,-20);lamp(x,20)}
// Articulated third-person character with animated limbs and layered clothing.
const player=new THREE.Group();scene.add(player);
const skin=mat(0x9b684d,.78),shirt=mat(0x202b36,.88),pants=mat(0x25282b,.9),shoe=mat(0x111315,.65),hair=mat(0x171719,.9);
const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.7,8,16),shirt);torso.position.y=1.42;torso.castShadow=true;player.add(torso);
const pelvis=new THREE.Mesh(new THREE.BoxGeometry(.5,.28,.3),pants);pelvis.position.y=.91;player.add(pelvis);
const neck=new THREE.Mesh(new THREE.CylinderGeometry(.095,.12,.18,12),skin);neck.position.y=1.91;player.add(neck);
const head=new THREE.Mesh(new THREE.SphereGeometry(.235,24,20),skin);head.position.y=2.16;head.castShadow=true;player.add(head);
const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.239,24,12,0,Math.PI*2,0,Math.PI*.52),hair);hairCap.position.y=2.19;player.add(hairCap);
const nose=new THREE.Mesh(new THREE.BoxGeometry(.055,.08,.09),skin);nose.position.set(0,2.13,-.22);player.add(nose);
const legs=[],arms=[];
for(const side of [-1,1]){
 const leg=new THREE.Group();leg.position.set(side*.15,.91,0);player.add(leg);
 const upper=new THREE.Mesh(new THREE.CapsuleGeometry(.115,.38,6,10),pants);upper.position.y=-.24;upper.castShadow=true;leg.add(upper);
 const knee=new THREE.Mesh(new THREE.SphereGeometry(.105,12,10),pants);knee.position.y=-.47;leg.add(knee);
 const lower=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.36,6,10),pants);lower.position.y=-.68;leg.add(lower);
 const foot=new THREE.Mesh(new THREE.BoxGeometry(.23,.14,.4),shoe);foot.position.set(0,-.9,-.09);leg.add(foot);legs.push(leg);
 const arm=new THREE.Group();arm.position.set(side*.4,1.7,0);arm.rotation.z=-side*.12;player.add(arm);
 const sleeve=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.38,6,10),shirt);sleeve.position.y=-.25;arm.add(sleeve);
 const forearm=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.35,6,10),skin);forearm.position.set(0,-.58,0);arm.add(forearm);
 const hand=new THREE.Mesh(new THREE.SphereGeometry(.085,12,10),skin);hand.position.y=-.8;arm.add(hand);arms.push(arm);
}
// Ambient pedestrians populate the sidewalks and make the city feel lived in.
const pedestrians=[];
for(let i=0;i<12;i++){
 const npc=player.clone(true);npc.position.set(-300+i*52,0,i%2?18.8:-18.8);npc.rotation.y=i%2?Math.PI:0;
 npc.userData.walkSpeed=(i%2?1:-1)*(1.05+(i%4)*.22);npc.userData.phase=i*.8;npc.userData.walkGroups=npc.children.filter(child=>child.isGroup);scene.add(npc);pedestrians.push(npc);
}
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
const traffic=[];for(let i=0;i<8;i++){const c=makeCar([0xeeeeea,0x777f85,0x872c2c,0x253b50][i%4]);c.scale.setScalar(.8);c.rotation.y=Math.PI/2;c.position.set(-360+i*90,0,10+(i%2)*9);c.userData.trafficSpeed=5+(i%4)*2;scene.add(c);traffic.push(c)}
const checkpointTargets=[new THREE.Vector3(0,0,-105),new THREE.Vector3(105,0,-210),new THREE.Vector3(-105,0,-315),new THREE.Vector3(0,0,0)];
let checkpointIndex=0,cash=2500,missionActive=false,missionTime=60,missionProgress=0;
const checkpoint=new THREE.Group(),checkpointRing=new THREE.Mesh(new THREE.TorusGeometry(3.5,.22,12,48),new THREE.MeshStandardMaterial({color:0x70dfff,emissive:0x22a8ff,emissiveIntensity:1.5,metalness:.3,roughness:.25}));
checkpointRing.rotation.x=Math.PI/2;checkpointRing.position.y=2.4;checkpoint.add(checkpointRing);
const checkpointBeam=new THREE.Mesh(new THREE.CylinderGeometry(.08,.5,7,12,1,true),new THREE.MeshBasicMaterial({color:0x51cfff,transparent:true,opacity:.14,side:THREE.DoubleSide}));
checkpointBeam.position.y=3.5;checkpoint.add(checkpointBeam);scene.add(checkpoint);
function setCheckpoint(){checkpoint.position.copy(checkpointTargets[checkpointIndex]);document.querySelector('#mission-sub').textContent=missionActive?'Time trial · '+missionProgress+'/4 checkpoints':'Drive through the blue marker · Reward $500';}
function finishMission(success){missionActive=false;document.querySelector('#mission-start').textContent='START MISSION';if(success){cash+=3000;document.querySelector('#cash-value').textContent=cash.toLocaleString('en-US');toast('Time trial complete · +$3,000')}else toast('Time trial failed · Try again');setCheckpoint()}
document.querySelector('#mission-start').addEventListener('click',()=>{missionActive=true;missionTime=60;missionProgress=0;checkpointIndex=0;setCheckpoint();document.querySelector('#mission-start').textContent='MISSION ACTIVE';toast('Time trial started · 60 seconds')});
setCheckpoint();
// Real, textured CC0 vehicle models. Each asset is loaded once, then cloned into the world.
const vehicleAssets=[
 {name:'Spectral GT RS',url:'https://raw.githubusercontent.com/JaronKBragg7337/spectral-gt-rs/main/spectral_gt_rs_game_ready.glb',targets:[mainCar,parked[0],parked[3],traffic[0],traffic[3],traffic[6]]},
 {name:'1990s JDM Coupe',url:'https://files.innerscene.com/library/generic-1990s-japanese-style-sports-coupe-ace64592/696200cf9cd0b540e6cd/generic-1990s-japanese-style-sports-coupe.glb',targets:[parked[1],parked[4],traffic[1],traffic[4],traffic[7]]},
 {name:'Mid-engine Supercar',url:'https://files.innerscene.com/library/generic-mid-engine-supercar-73f252c5/b41b620d8a8890b1b70a/generic-mid-engine-supercar.glb',targets:[parked[2],parked[5],traffic[2],traffic[5]]}
];
let carAssetReady=false,loadedVehicleAssets=0;
function finishVehicleLoading(){
 loadedVehicleAssets++;
 if(!carAssetReady){carAssetReady=true;document.querySelector('#load-progress').style.width='100%';loading.style.opacity='0';hud.style.opacity='1';setTimeout(()=>loading.remove(),850)}
}
function installVehicleModel(gltf,asset){
 const source=gltf.scene;
 source.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(source);
 const size=bounds.getSize(new THREE.Vector3());
 const center=bounds.getCenter(new THREE.Vector3());
 const length=Math.max(size.x,size.z)||4.5;
 const scale=4.5/length;
 source.scale.setScalar(scale);
 source.position.sub(center.multiplyScalar(scale));
 source.rotation.y=Math.PI/2;
 source.position.y+=.05;
 source.traverse(o=>{
  if(o.isMesh){
   o.castShadow=true;o.receiveShadow=true;
   if(Array.isArray(o.material))o.material=o.material.map(m=>m.clone());
   else if(o.material)o.material=o.material.clone();
   if(o.material){o.material.envMapIntensity=1.15;if(o.material.roughness!==undefined)o.material.roughness=Math.min(.82,Math.max(.16,o.material.roughness))}
  }
 });
 for(const group of asset.targets){
  if(!group)continue;
  group.clear();
  const instance=source.clone(true);
  group.add(instance);
  group.userData.wheels=[];
  group.userData.vehicleModel=asset.name;
  instance.traverse(o=>{if(o.isMesh&&/(wheel|tire|tyre)/i.test(o.name))group.userData.wheels.push(o)});
 }
 toast(asset.name+' loaded');
 finishVehicleLoading();
}
const assetLoader=new GLTFLoader();
assetLoader.setCrossOrigin('anonymous');
for(const asset of vehicleAssets){
 assetLoader.load(asset.url,gltf=>installVehicleModel(gltf,asset),event=>{
  if(event.total&&!carAssetReady)document.querySelector('#load-progress').style.width=Math.min(88,Math.round(event.loaded/event.total*25))+'%';
 },error=>{
  console.warn(asset.name+' unavailable; keeping detailed local fallback vehicles.',error);
  loadedVehicleAssets++;
  if(!carAssetReady&&loadedVehicleAssets===vehicleAssets.length){loading.style.opacity='0';hud.style.opacity='1';setTimeout(()=>loading.remove(),850)}
 });
}

const state={mode:'walk',speed:0,heading:0,steering:0},keys={},touch={};let activeCar=mainCar,last=performance.now(),elapsed=0,saveClock=0;
try{const saved=JSON.parse(localStorage.getItem('metro-city-save')||'null');if(saved){cash=Math.max(0,Number(saved.cash)||2500);if(saved.position)player.position.set(saved.position[0]||0,0,saved.position[1]||0);if(saved.car)mainCar.position.set(saved.car[0]||7,0,saved.car[1]||3);if(Array.isArray(saved.vehicles))saved.vehicles.forEach((p,i)=>{const car=[mainCar,...parked][i];if(car&&Array.isArray(p))car.position.set(Number(p[0])||0,0,Number(p[1])||0)});if(Number.isInteger(saved.activeCarIndex)&&saved.activeCarIndex>=0&&saved.activeCarIndex<1+parked.length)activeCar=[mainCar,...parked][saved.activeCarIndex];document.querySelector('#cash-value').textContent=cash.toLocaleString('en-US')}}catch(e){console.warn('Save data unavailable',e)}

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function resolveBuildingCollision(position,radius){for(const b of buildingCollision){const closestX=clamp(position.x,b.x-b.halfX,b.x+b.halfX),closestZ=clamp(position.z,b.z-b.halfZ,b.z+b.halfZ),dx=position.x-closestX,dz=position.z-closestZ,d2=dx*dx+dz*dz;if(d2<radius*radius){if(d2>.0001){const d=Math.sqrt(d2),push=(radius-d)/d;position.x+=dx*push;position.z+=dz*push}else{const px=b.halfX+radius-Math.abs(position.x-b.x),pz=b.halfZ+radius-Math.abs(position.z-b.z);if(px<pz)position.x+=(position.x<b.x?-1:1)*px;else position.z+=(position.z<b.z?-1:1)*pz}}}}
function vehicleBlocked(car){for(const other of [mainCar,...parked,...traffic]){if(other===car||!other.visible)continue;const dx=car.position.x-other.position.x,dz=car.position.z-other.position.z;if(dx*dx+dz*dz<3.7*3.7)return true}return false}
function toast(s){const t=document.querySelector('#toast');t.textContent=s;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2200)}
let networkPeer=null,networkConnection=null,remotePlayer=null,remoteCar=null,networkSendClock=0;
let cameraMode='chase';
document.querySelector('#camera-toggle').addEventListener('click',()=>{cameraMode=cameraMode==='chase'?'cockpit':'chase';toast(cameraMode==='cockpit'?'Cockpit camera':'Chase camera')});
function networkStatus(message){document.querySelector('#network-status').textContent=message}
function ensureRemote(){if(remotePlayer)return;remotePlayer=player.clone(true);remotePlayer.visible=false;scene.add(remotePlayer);remoteCar=mainCar.clone(true);remoteCar.visible=false;scene.add(remoteCar)}
function acceptNetworkConnection(connection){
 if(networkConnection&&networkConnection.open)networkConnection.close();
 networkConnection=connection;ensureRemote();
 connection.on('open',()=>networkStatus('Connected · '+connection.peer));
 connection.on('data',data=>{
  if(!data||!Array.isArray(data.position))return;
  const target=data.mode==='drive'?remoteCar:remotePlayer,other=data.mode==='drive'?remotePlayer:remoteCar;
  target.visible=true;other.visible=false;
  target.userData.netTarget ||= target.position.clone();
  target.userData.netTarget.set(clamp(Number(data.position[0])||0,-430,430),0,clamp(Number(data.position[1])||0,-430,430));
  target.userData.netYaw=Number.isFinite(Number(data.rotation))?Number(data.rotation):0;
 });
 connection.on('close',()=>{networkStatus('Peer disconnected');if(remotePlayer)remotePlayer.visible=false;if(remoteCar)remoteCar.visible=false});
 connection.on('error',e=>networkStatus('Connection error: '+e.type));
}
async function startMultiplayer(role){
 const codeInput=document.querySelector('#room-code');let code=codeInput.value.replace(/\D/g,'').slice(0,6);
 if(role==='host'&&!code){code=String(Math.floor(100000+Math.random()*900000));codeInput.value=code}
 if(code.length!==6){networkStatus('Enter a 6-digit room code');return}
 try{
  networkStatus('Connecting to room service…');
  if(networkPeer){networkPeer.destroy();networkPeer=null;networkConnection=null}
  const module=await import('https://esm.sh/peerjs@1.5.5?bundle');const Peer=module.default;
  if(role==='host'){
   networkPeer=new Peer('metrocity-'+code,{debug:1});
   networkPeer.on('open',()=>networkStatus('Room '+code+' · Waiting for player'));
   networkPeer.on('connection',acceptNetworkConnection);
  }else{
   networkPeer=new Peer(undefined,{debug:1});
   networkPeer.on('open',()=>{networkStatus('Joining room '+code+'…');acceptNetworkConnection(networkPeer.connect('metrocity-'+code,{reliable:true}))});
  }
  networkPeer.on('error',e=>networkStatus('Network: '+e.type));
 }catch(e){console.error(e);networkStatus('Multiplayer service unavailable')}
}
document.querySelector('#network-toggle').addEventListener('click',()=>document.querySelector('#network-panel').classList.toggle('open'));
document.querySelector('#host-room').addEventListener('click',()=>startMultiplayer('host'));
document.querySelector('#join-room').addEventListener('click',()=>startMultiplayer('join'));

function drawMinimap(){
 const ctx=mapCtx,w=mapCanvas.width,h=mapCanvas.height,cx=w/2,cy=h/2,scale=.62;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#101d25';ctx.fillRect(0,0,w,h);
 const focus=state.mode==='drive'?activeCar.position:player.position;
 ctx.save();ctx.translate(cx-focus.x*scale,cy-focus.z*scale);
 ctx.strokeStyle='#65737a';ctx.lineWidth=13*scale;
 for(let i=-5;i<=5;i++){const p=i*105;ctx.beginPath();ctx.moveTo(p,-650);ctx.lineTo(p,650);ctx.stroke();ctx.beginPath();ctx.moveTo(-650,p);ctx.lineTo(650,p);ctx.stroke()}
 ctx.strokeStyle='#e7d8a8';ctx.lineWidth=1.2*scale;ctx.setLineDash([8,9]);
 for(let i=-5;i<=5;i++){const p=i*105;ctx.beginPath();ctx.moveTo(p,-650);ctx.lineTo(p,650);ctx.stroke();ctx.beginPath();ctx.moveTo(-650,p);ctx.lineTo(650,p);ctx.stroke()}
 ctx.setLineDash([]);
 for(const car of [mainCar,...parked,...traffic]){ctx.fillStyle=car===activeCar&&state.mode==='drive'?'#8fe1ff':'#e8c27a';ctx.beginPath();ctx.arc(car.position.x*scale,car.position.z*scale,2.8,0,Math.PI*2);ctx.fill()}
 ctx.restore();
 const yaw=state.mode==='drive'?activeCar.rotation.y:player.rotation.y;
 ctx.save();ctx.translate(cx,cy);ctx.rotate(-yaw);ctx.fillStyle='#9de3ff';ctx.strokeStyle='#07131b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(0,4);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
function enterExit(){if(state.mode==='walk'){let found=null,dist=7;for(const c of [mainCar,...parked]){const d=player.position.distanceTo(c.position);if(d<dist){dist=d;found=c}}if(found){activeCar=found;state.mode='drive';player.visible=false;document.querySelector('#drive-pad').style.display='grid';document.querySelector('#camera-toggle').style.display='block';document.querySelector('.move-pad').style.display='none';document.querySelector('.action-pad').style.display='none';document.querySelector('#speed').style.display='block';toast('Vehicle entered · Drive safe')}else toast('Walk closer to a parked car')}else{state.mode='walk';state.speed=0;player.visible=true;player.position.copy(activeCar.position).add(new THREE.Vector3(2,0,0).applyAxisAngle(new THREE.Vector3(0,1,0),activeCar.rotation.y));document.querySelector('#drive-pad').style.display='none';document.querySelector('#camera-toggle').style.display='none';cameraMode='chase';document.querySelector('.move-pad').style.display='block';document.querySelector('.action-pad').style.display='flex';document.querySelector('#speed').style.display='none';toast('You left the vehicle')}}
document.querySelector('#enter').addEventListener('click',enterExit);document.querySelector('#run').addEventListener('pointerdown',()=>keys.ShiftLeft=true);for(const ev of ['pointerup','pointercancel','lostpointercapture'])document.querySelector('#run').addEventListener(ev,()=>keys.ShiftLeft=false);document.querySelector('#run').addEventListener('pointerdown',e=>{try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}});
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE')enterExit();if(e.code==='KeyC'&&state.mode==='drive'){cameraMode=cameraMode==='chase'?'cockpit':'chase';toast(cameraMode==='cockpit'?'Cockpit camera':'Chase camera')}});addEventListener('keyup',e=>keys[e.code]=false);
document.querySelectorAll('[data-move],[data-drive]').forEach(b=>{const k=b.dataset.move||b.dataset.drive;b.addEventListener('pointerdown',e=>{e.preventDefault();touch[k]=1;b.setPointerCapture(e.pointerId)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>touch[k]=0)});
function update(dt){elapsed+=dt;for(const remote of [remotePlayer,remoteCar])if(remote&&remote.visible&&remote.userData.netTarget){remote.position.lerp(remote.userData.netTarget,1-Math.exp(-12*dt));remote.rotation.y=THREE.MathUtils.damp(remote.rotation.y,remote.userData.netYaw||0,12,dt)}
for(const npc of pedestrians){npc.position.x+=npc.userData.walkSpeed*dt;if(npc.position.x>390)npc.position.x=-390;if(npc.position.x< -390)npc.position.x=390;npc.position.y=.025+Math.sin(elapsed*7+npc.userData.phase)*.035;npc.rotation.y=npc.userData.walkSpeed>0?Math.PI/2:-Math.PI/2;const swing=Math.sin(elapsed*7+npc.userData.phase)*.38;for(let i=0;i<2;i++)if(npc.userData.walkGroups[i])npc.userData.walkGroups[i].rotation.x=i===0?swing:-swing;for(let i=2;i<4;i++)if(npc.userData.walkGroups[i])npc.userData.walkGroups[i].rotation.x=i===2?-swing*.65:swing*.65}
for(const t of traffic){t.position.x+=t.userData.trafficSpeed*dt;if(t.position.x>390)t.position.x=-390}
checkpointRing.rotation.z+=dt*.55;checkpoint.position.y=.35+Math.sin(elapsed*2)*.18;
if(missionActive){missionTime-=dt;document.querySelector('#mission-sub').textContent='Time trial · '+missionProgress+'/4 · '+Math.max(0,Math.ceil(missionTime))+'s';if(missionTime<=0)finishMission(false)}
if(state.mode==='drive'&&activeCar.position.distanceTo(checkpoint.position)<6){
 if(missionActive){missionProgress++;checkpointIndex=(checkpointIndex+1)%checkpointTargets.length;if(missionProgress>=4)finishMission(true);else{setCheckpoint();toast('Checkpoint '+missionProgress+'/4 · '+Math.ceil(missionTime)+'s left')}}
 else{cash+=500;document.querySelector('#cash-value').textContent=cash.toLocaleString('en-US');checkpointIndex=(checkpointIndex+1)%checkpointTargets.length;setCheckpoint();toast('Checkpoint complete · +$500')}
}
if(state.mode==='walk'){const f=(keys.KeyW||keys.ArrowUp||touch.forward?1:0)-(keys.KeyS||keys.ArrowDown||touch.back?1:0),s=(keys.KeyD||keys.ArrowRight||touch.right?1:0)-(keys.KeyA||keys.ArrowLeft||touch.left?1:0);if(f||s){const angle=Math.atan2(s,-f);player.rotation.y=THREE.MathUtils.damp(player.rotation.y,angle,9,dt);const v=(keys.ShiftLeft||keys.ShiftRight?11:5.5);player.position.x+=Math.sin(angle)*v*dt;player.position.z-=Math.cos(angle)*v*dt;legs.forEach((l,i)=>l.rotation.x=Math.sin(elapsed*10+i*Math.PI)*.48);arms.forEach((a,i)=>a.rotation.x=Math.sin(elapsed*10+i*Math.PI+Math.PI)*.32)}else legs.forEach(l=>l.rotation.x=THREE.MathUtils.damp(l.rotation.x,0,8,dt));resolveBuildingCollision(player.position,.9);for(const c of [mainCar,...parked,...traffic]){const dx=player.position.x-c.position.x,dz=player.position.z-c.position.z,d=Math.hypot(dx,dz);if(d<2.5){player.position.x=c.position.x+(dx/(d||.001))*2.5;player.position.z=c.position.z+(dz/(d||.001))*2.5}}player.position.x=clamp(player.position.x,-430,430);player.position.z=clamp(player.position.z,-430,430)}
else{const gas=keys.KeyW||keys.ArrowUp||touch.gas,brake=keys.KeyS||keys.ArrowDown||touch.brake,left=keys.KeyA||keys.ArrowLeft||touch.left||keys.ArrowLeft,right=keys.KeyD||keys.ArrowRight||touch.right;
const steer=(left?1:0)-(right?1:0),oldX=activeCar.position.x,oldZ=activeCar.position.z;
if(gas)state.speed=Math.min(38,state.speed+19*dt);
else if(brake)state.speed=state.speed>0?Math.max(0,state.speed-28*dt):Math.max(-9,state.speed-8*dt);
else state.speed=THREE.MathUtils.damp(state.speed,0,1.15,dt);
state.steering=THREE.MathUtils.damp(state.steering,steer,5.5,dt);
if(Math.abs(state.speed)>.35)activeCar.rotation.y+=state.steering*dt*(.22+Math.min(1,Math.abs(state.speed)/18)*.72)*Math.sign(state.speed);
activeCar.position.x+=Math.sin(activeCar.rotation.y)*state.speed*dt;
activeCar.position.z-=Math.cos(activeCar.rotation.y)*state.speed*dt;
let hit=buildingCollision.some(b=>activeCar.position.x+1.15>b.x-b.halfX&&activeCar.position.x-1.15<b.x+b.halfX&&activeCar.position.z+2.35>b.z-b.halfZ&&activeCar.position.z-2.35<b.z+b.halfZ);
if(!hit)hit=vehicleBlocked(activeCar);
if(hit){activeCar.position.x=oldX;activeCar.position.z=oldZ;state.speed*=-.16;toast('Impact · Vehicle damaged')}
activeCar.userData.wheels.forEach(w=>w.rotation.x-=state.speed*dt*1.7);
activeCar.position.x=clamp(activeCar.position.x,-430,430);activeCar.position.z=clamp(activeCar.position.z,-430,430);document.querySelector('#speed').innerHTML=String(Math.round(Math.abs(state.speed)*3.6)).padStart(3,'0')+' <small>KM/H</small>'}
const target=state.mode==='drive'?activeCar.position:player.position,yaw=state.mode==='drive'?activeCar.rotation.y:player.rotation.y;
sun.position.set(target.x-95,target.y+155,target.z+75);sun.target.position.set(target.x,target.y,target.z);if(!sun.target.parent)scene.add(sun.target);sun.shadow.camera.updateProjectionMatrix();
if(state.mode==='drive'&&cameraMode==='cockpit'){
 const offset=new THREE.Vector3(-.48,1.28,-.18).applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
 camera.position.lerp(new THREE.Vector3(target.x+offset.x,target.y+offset.y,target.z+offset.z),1-Math.exp(-9*dt));
 camera.lookAt(target.x+Math.sin(yaw)*24,target.y+1.25,target.z-Math.cos(yaw)*24);
}else{
 const desired=new THREE.Vector3(target.x+Math.sin(yaw)*1.5,target.y+3.3,target.z+Math.cos(yaw)*1.5+8);
 camera.position.lerp(desired,1-Math.exp(-4*dt));camera.lookAt(target.x,target.y+1.15,target.z)
}}
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.04);last=now;update(dt);drawMinimap();renderer.render(scene,camera);saveClock+=dt;if(saveClock>5){saveClock=0;try{localStorage.setItem('metro-city-save',JSON.stringify({cash,position:[player.position.x,player.position.z],car:[mainCar.position.x,mainCar.position.z],vehicles:[mainCar,...parked].map(c=>[c.position.x,c.position.z]),activeCarIndex:[mainCar,...parked].indexOf(activeCar)}))}catch(e){}}
networkSendClock+=dt;if(networkConnection&&networkConnection.open&&networkSendClock>.1){networkSendClock=0;const p=state.mode==='drive'?activeCar.position:player.position;try{networkConnection.send({mode:state.mode,position:[p.x,p.z],rotation:state.mode==='drive'?activeCar.rotation.y:player.rotation.y,speed:state.speed})}catch(e){networkStatus('Sync interrupted')}}}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth>1400?2:innerWidth>700?1.5:1.25))});
for(let i=0;i<=10;i++)setTimeout(()=>document.querySelector('#load-progress').style.width=i*10+'%',i*110);
setTimeout(()=>{if(!carAssetReady&&loading.isConnected){loading.querySelector('.loading-sub').textContent='PREPARING CITY · VEHICLE DOWNLOAD';toast('Welcome to Metro City · Find a car')}},900);
setTimeout(()=>{if(loading.isConnected){loading.style.opacity='0';hud.style.opacity='1';setTimeout(()=>loading.remove(),850);if(!carAssetReady)toast('City ready · using local fallback vehicle')}},12000);
setInterval(()=>document.querySelector('#clock').textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false}),1000);
requestAnimationFrame(frame);