'use strict';
// Auto colorer: paints an untextured GLB mesh with the colors of the image it was made from.
// It finds the view that best matches the image outline, projects the image through the mesh,
// and stores the result as vertex colors (COLOR_0), so any GLB viewer shows it.
(function(root){
const GLB_MAGIC=0x46546C67,CHUNK_JSON=0x4E4F534A,CHUNK_BIN=0x004E4942,FLOAT=5126;
const SIZES={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
const COMPONENT={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};

function parseGlb(buffer){
 const view=new DataView(buffer);if(buffer.byteLength<20||view.getUint32(0,true)!==GLB_MAGIC)throw Error('The mesh is not a GLB file.');
 let offset=12,json=null,bin=null;
 while(offset+8<=buffer.byteLength){const length=view.getUint32(offset,true),type=view.getUint32(offset+4,true),start=offset+8;
  if(type===CHUNK_JSON)json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,start,length)));else if(type===CHUNK_BIN&&!bin)bin=new Uint8Array(buffer,start,length);
  offset=start+length;}
 if(!json||!bin)throw Error('The GLB has no mesh data.');
 if(json.extensionsRequired?.length)throw Error('This GLB uses compression the auto colorer cannot read.');
 return {json,bin};
}
function readAccessor(gltf,index){
 const a=gltf.json.accessors[index],bv=gltf.json.bufferViews[a.bufferView],Type=COMPONENT[a.componentType],n=SIZES[a.type];
 if(!Type||!n||a.sparse)throw Error('Unsupported mesh data.');
 const out=new Type(a.count*n),stride=bv.byteStride||Type.BYTES_PER_ELEMENT*n,base=gltf.bin.byteOffset+(bv.byteOffset||0)+(a.byteOffset||0);
 const view=new DataView(gltf.bin.buffer),get={5120:'getInt8',5121:'getUint8',5122:'getInt16',5123:'getUint16',5125:'getUint32',5126:'getFloat32'}[a.componentType];
 for(let i=0;i<a.count;i++)for(let k=0;k<n;k++)out[i*n+k]=view[get](base+i*stride+k*Type.BYTES_PER_ELEMENT,true);
 return out;
}
function writeGlb(json,bin){
 const enc=new TextEncoder();const text=enc.encode(JSON.stringify(json));const jsonLen=Math.ceil(text.length/4)*4,binLen=Math.ceil(bin.length/4)*4;
 const out=new Uint8Array(12+8+jsonLen+8+binLen),view=new DataView(out.buffer);
 view.setUint32(0,GLB_MAGIC,true);view.setUint32(4,2,true);view.setUint32(8,out.length,true);
 view.setUint32(12,jsonLen,true);view.setUint32(16,CHUNK_JSON,true);out.set(text,20);out.fill(0x20,20+text.length,20+jsonLen);
 view.setUint32(20+jsonLen,binLen,true);view.setUint32(24+jsonLen,CHUNK_BIN,true);out.set(bin,28+jsonLen);
 return out.buffer;
}

// Which pixels show the object: transparent PNGs use alpha, others are compared with the border color.
function objectMask(img){
 const {width:w,height:h,data}=img,mask=new Uint8Array(w*h);let transparent=0;
 for(let i=0;i<w*h;i++)if(data[i*4+3]<128)transparent++;
 if(transparent>w*h*0.02){for(let i=0;i<w*h;i++)mask[i]=data[i*4+3]>=128;}
 else{const border=[];for(let x=0;x<w;x++)border.push(x,(h-1)*w+x);for(let y=0;y<h;y++)border.push(y*w,y*w+w-1);
  const median=c=>{const v=border.map(i=>data[i*4+c]).sort((a,b)=>a-b);return v[v.length>>1];},bg=[median(0),median(1),median(2)];
  for(let i=0;i<w*h;i++){const dr=data[i*4]-bg[0],dg=data[i*4+1]-bg[1],db=data[i*4+2]-bg[2];mask[i]=dr*dr+dg*dg+db*db>40*40;}}
 let count=0,x0=w,y0=h,x1=-1,y1=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x]){count++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 // Busy or empty backgrounds: treat the whole image as the object.
 if(count<w*h*0.01||count>w*h*0.97){mask.fill(1);x0=0;y0=0;x1=w-1;y1=h-1;}
 return {mask,box:[x0,y0,x1+1,y1+1]};
}
// Push object colors outward over the background, so mesh edges never pick up the backdrop.
function fillBackground(img,mask){
 const {width:w,height:h}=img,rgb=new Float32Array(w*h*3),known=Uint8Array.from(mask);
 for(let i=0;i<w*h;i++)for(let c=0;c<3;c++)rgb[i*3+c]=img.data[i*4+c];
 let frontier=[];for(let i=0;i<w*h;i++)if(!known[i])frontier.push(i);
 while(frontier.length){const next=[],ready=[];
  for(const i of frontier){const x=i%w,y=(i/w)|0;let r=0,g=0,b=0,n=0;
   for(const j of [x>0?i-1:-1,x<w-1?i+1:-1,y>0?i-w:-1,y<h-1?i+w:-1])if(j>=0&&known[j]){r+=rgb[j*3];g+=rgb[j*3+1];b+=rgb[j*3+2];n++;}
   if(n){rgb[i*3]=r/n;rgb[i*3+1]=g/n;rgb[i*3+2]=b/n;ready.push(i);}else next.push(i);}
  if(!ready.length)break;for(const i of ready)known[i]=1;frontier=next;}
 return rgb;
}
function blur(rgb,w,h,radius){
 let src=rgb;for(const [dx,dy,len,lines] of [[1,w,w,h],[w,1,h,w]]){const out=new Float32Array(src.length);
  for(let line=0;line<lines;line++)for(let c=0;c<3;c++){const at=k=>(line*dy+Math.min(len-1,Math.max(0,k))*dx)*3+c;let sum=0;
   for(let k=-radius;k<=radius;k++)sum+=src[at(k)];
   for(let k=0;k<len;k++){out[(line*dy+k*dx)*3+c]=sum/(2*radius+1);sum+=src[at(k+radius+1)]-src[at(k-radius)];}}
  src=out;}
 return src;
}
function sample(rgb,w,h,x,y,out){
 x=Math.min(w-1,Math.max(0,x));y=Math.min(h-1,Math.max(0,y));const x0=x|0,y0=y|0,x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=x-x0,fy=y-y0;
 for(let c=0;c<3;c++)out[c]=(rgb[(y0*w+x0)*3+c]*(1-fx)+rgb[(y0*w+x1)*3+c]*fx)*(1-fy)+(rgb[(y1*w+x0)*3+c]*(1-fx)+rgb[(y1*w+x1)*3+c]*fx)*fy;
}

// Try every upright view of the mesh (3 up axes × 2 signs × 24 turns) and keep the one whose outline matches the image best.
function findView(positions,image){
 const G=48,step=Math.max(1,Math.floor(positions.length/3/30000)),count=Math.floor(positions.length/3/step);
 const [bx0,by0,bx1,by1]=image.box,imgAspect=(bx1-bx0)/(by1-by0),target=new Uint8Array(G*G);
 for(let gy=0;gy<G;gy++)for(let gx=0;gx<G;gx++){const x=Math.floor(bx0+(gx+0.5)/G*(bx1-bx0)),y=Math.floor(by0+(gy+0.5)/G*(by1-by0));target[gy*G+gx]=image.mask[y*image.width+x];}
 const hs=new Float32Array(count),vs=new Float32Array(count),grid=new Uint8Array(G*G),closed=new Uint8Array(G*G);let best=null;
 for(let up=0;up<3;up++)for(const sign of [1,-1]){const a=(up+1)%3,b=(up+2)%3;
  for(let turn=0;turn<24;turn++){const t=turn*Math.PI/12,ca=Math.cos(t),sa=Math.sin(t);let h0=Infinity,h1=-Infinity,v0=Infinity,v1=-Infinity;
   for(let i=0;i<count;i++){const p=i*step*3,h=ca*positions[p+a]+sa*positions[p+b],v=sign*positions[p+up];hs[i]=h;vs[i]=v;if(h<h0)h0=h;if(h>h1)h1=h;if(v<v0)v0=v;if(v>v1)v1=v;}
   if(!(h1>h0&&v1>v0))continue;grid.fill(0);
   for(let i=0;i<count;i++){const gx=Math.min(G-1,Math.floor((hs[i]-h0)/(h1-h0)*G)),gy=Math.min(G-1,Math.floor((v1-vs[i])/(v1-v0)*G));grid[gy*G+gx]=1;}
   // Close small gaps between projected vertices.
   for(let y=0;y<G;y++)for(let x=0;x<G;x++){let on=grid[y*G+x];for(let k=-1;k<=1&&!on;k++)for(let j=-1;j<=1&&!on;j++){const yy=y+k,xx=x+j;if(yy>=0&&yy<G&&xx>=0&&xx<G&&grid[yy*G+xx])on=1;}closed[y*G+x]=on;}
   let both=0,either=0;for(let i=0;i<G*G;i++){both+=closed[i]&target[i];either+=closed[i]|target[i];}
   const score=both/either-0.5*Math.abs(Math.log((h1-h0)/(v1-v0)/imgAspect))+(up===1&&sign===1?0.01:0)+(turn===0?0.005:0);
   if(!best||score>best.score)best={score,up,sign,a,b,ca,sa,h0,h1,v0,v1};}}
 if(!best)throw Error('The mesh is empty.');
 return best;
}
function vertexNormals(positions,indices){
 const normals=new Float32Array(positions.length),count=positions.length/3,tri=indices||Uint32Array.from({length:count},(_,i)=>i);
 for(let t=0;t+2<tri.length;t+=3){const i=tri[t]*3,j=tri[t+1]*3,k=tri[t+2]*3;
  const ux=positions[j]-positions[i],uy=positions[j+1]-positions[i+1],uz=positions[j+2]-positions[i+2],vx=positions[k]-positions[i],vy=positions[k+1]-positions[i+1],vz=positions[k+2]-positions[i+2];
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;for(const v of [i,j,k]){normals[v]+=nx;normals[v+1]+=ny;normals[v+2]+=nz;}}
 for(let i=0;i<normals.length;i+=3){const l=Math.hypot(normals[i],normals[i+1],normals[i+2])||1;normals[i]/=l;normals[i+1]/=l;normals[i+2]/=l;}
 return normals;
}
const toLinear=c=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);};

// glbBuffer: ArrayBuffer of the mesh. image: {width,height,data} RGBA pixels of the source image.
function colorizeGlb(glbBuffer,image){
 const gltf=parseGlb(glbBuffer),json=gltf.json,prims=[];
 for(const mesh of json.meshes||[])for(const prim of mesh.primitives||[])if(prim.attributes?.POSITION!==undefined&&(prim.mode===undefined||prim.mode===4))prims.push(prim);
 if(!prims.length)throw Error('The GLB has no triangle mesh to color.');
 const parts=prims.map(prim=>({prim,positions:Float32Array.from(readAccessor(gltf,prim.attributes.POSITION)),indices:prim.indices!==undefined?readAccessor(gltf,prim.indices):null}));
 const all=new Float32Array(parts.reduce((n,p)=>n+p.positions.length,0));let at=0;for(const p of parts){all.set(p.positions,at);at+=p.positions.length;}
 const {mask,box}=objectMask(image),{width:w,height:h}=image,view=findView(all,{mask,box,width:w,height:h});
 const sharp=fillBackground(image,mask),soft=blur(sharp,w,h,Math.max(2,Math.round(Math.max(w,h)*0.03)));
 // The projection direction: perpendicular to both the image's right and up directions.
 const right=[0,0,0],upDir=[0,0,0],dir=[0,0,0];right[view.a]=view.ca;right[view.b]=view.sa;upDir[view.up]=view.sign;
 dir[0]=right[1]*upDir[2]-right[2]*upDir[1];dir[1]=right[2]*upDir[0]-right[0]*upDir[2];dir[2]=right[0]*upDir[1]-right[1]*upDir[0];
 const extra=[],a=[0,0,0],b=[0,0,0];let binLength=gltf.bin.length;
 const addView=array=>{const pad=(4-binLength%4)%4;binLength+=pad;extra.push({pad,bytes:new Uint8Array(array.buffer,array.byteOffset,array.byteLength)});json.bufferViews.push({buffer:0,byteOffset:binLength,byteLength:array.byteLength,target:34962});binLength+=array.byteLength;return json.bufferViews.length-1;};
 const addAccessor=array=>{json.accessors.push({bufferView:addView(array),componentType:FLOAT,count:array.length/3,type:'VEC3'});return json.accessors.length-1;};
 json.materials=json.materials||[];json.materials.push({name:'ComfyStudio auto color',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:0,roughnessFactor:0.85}});const material=json.materials.length-1;
 for(const {prim,positions,indices} of parts){const count=positions.length/3,colors=new Float32Array(count*3);
  const normals=prim.attributes.NORMAL!==undefined?readAccessor(gltf,prim.attributes.NORMAL):vertexNormals(positions,indices);
  for(let i=0;i<count;i++){const p=i*3,hv=view.ca*positions[p+view.a]+view.sa*positions[p+view.b],vv=view.sign*positions[p+view.up];
   const x=box[0]+(hv-view.h0)/(view.h1-view.h0)*(box[2]-box[0])-0.5,y=box[1]+(view.v1-vv)/(view.v1-view.v0)*(box[3]-box[1])-0.5;
   sample(sharp,w,h,x,y,a);sample(soft,w,h,x,y,b);
   // Surfaces facing the image get its detail; sides it only grazes get softened color instead of streaks.
   const facing=Math.abs(normals[p]*dir[0]+normals[p+1]*dir[1]+normals[p+2]*dir[2]),k=Math.min(1,Math.max(0,(facing-0.15)/0.45)),mix=k*k*(3-2*k);
   for(let c=0;c<3;c++)colors[p+c]=toLinear(a[c]*mix+b[c]*(1-mix));}
  prim.attributes.COLOR_0=addAccessor(colors);
  if(prim.attributes.NORMAL===undefined)prim.attributes.NORMAL=addAccessor(normals);
  prim.material=material;}
 const bin=new Uint8Array(Math.ceil(binLength/4)*4);bin.set(gltf.bin);let offset=gltf.bin.length;
 for(const e of extra){offset+=e.pad;bin.set(e.bytes,offset);offset+=e.bytes.length;}
 json.buffers[0].byteLength=bin.length;delete json.buffers[0].uri;
 return writeGlb(json,bin);
}
// Browser helper: turn an image Blob or URL into RGBA pixels (at most 384 px on the long side).
async function loadImagePixels(source,signal){
 const blob=source instanceof Blob?source:await (await fetch(source,{signal})).blob();const bitmap=await createImageBitmap(blob);
 const scale=Math.min(1,384/Math.max(bitmap.width,bitmap.height)),w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0,w,h);bitmap.close?.();
 return ctx.getImageData(0,0,w,h);
}
const api={colorizeGlb,loadImagePixels};
if(typeof module==='object'&&module.exports)module.exports=api;else root.autoColor=api;
})(typeof window!=='undefined'?window:globalThis);
