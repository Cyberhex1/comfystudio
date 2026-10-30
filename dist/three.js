'use strict';
const threeCatalog={id:'hunyuan3d-v2',name:'Hunyuan3D 2.0 · Single image',creator:'Tencent · Comfy-Org repack',family:'3D',file:'hunyuan3d-dit-v2_fp16.safetensors',gb:'4.93 GB',repo:'Comfy-Org/hunyuan3D_2.0_repackaged',downloadPath:'split_files/hunyuan3d-dit-v2_fp16.safetensors',description:'Convert an object image into an untextured GLB mesh. Text-to-3D first creates an object image with an installed SDXL or SD 1.5 model.',best:'Image to 3D and text to 3D',license:'Tencent Hunyuan community license · see model card',memory:'See the official ComfyUI Hunyuan3D hardware guide',compatible:false};
modelCatalog.push(threeCatalog);
const three={server:null,info:null,models:[],checking:false,results:[],selected:null,checkError:'',autoColor:true};
// Auto color: paint each untextured mesh with the colors of the image it was made from (see autocolor.js).
try{three.autoColor=localStorage.getItem('comfyStudio.autoColor')!=='off';}catch{}
const threeRequired=['ImageOnlyCheckpointLoader','CLIPVisionEncode','Hunyuan3Dv2Conditioning','EmptyLatentHunyuan3Dv2','ModelSamplingAuraFlow','KSampler','VAEDecodeHunyuan3D','VoxelToMesh','SaveGLB','LoadImage'];
window.isThreeMode=()=>['image3d','text3d'].includes(state.mode);
// Hunyuan3D checkpoints share the checkpoints folder, but cannot run the SD graph.
const classifyBeforeThree=classifyInstalledModel;
classifyInstalledModel=function(file){if(/hunyuan3d/i.test(file))return {...threeCatalog,file,installedFile:file,installed:true,compatible:false};return classifyBeforeThree(file);};
window.classifyInstalledModel=classifyInstalledModel;
// The official repack keeps its checkpoint in split_files, not the repo root.
// Render the correct split_files URL after the catalog creates its cards.
function threeDownload(){return 'https://huggingface.co/'+threeCatalog.repo+'/resolve/main/split_files/'+threeCatalog.file+'?download=true';}
function openThreeGuide(){$('three-guide-dialog').showModal();}
function openHuggingFace(family='all'){
 browserState.query='';browserState.family=family;$('model-search').value='';$('model-family').value=family;setModelCollection('discover');navigate('models');
}
$('browse-models').onclick=()=>openHuggingFace();$('three-browse').onclick=()=>openHuggingFace('3D');
$('discover-tab').onclick=()=>openHuggingFace();
document.querySelector('[data-page="models"]').addEventListener('click',()=>{if(!window.geminiProviderActive())openHuggingFace();},{capture:true});
const renderBeforeThree=renderModelBrowser;
renderModelBrowser=function(){
 renderBeforeThree();$('discover-count').textContent=modelCatalog.length;
 if(browserState.collection==='gemini')return;
 if(browserState.collection==='discover'){$('models-intro').textContent='Download compatible image and 3D models from Hugging Face, then run them locally.';$('browser-status').textContent='Hugging Face · exact checkpoint downloads';}
 for(const card of document.querySelectorAll('[data-model-id="hunyuan3d-v2"]')){
  card.querySelector('.model-card-badge').textContent='3D workflow';const download=card.querySelector('.catalog-download');if(download)download.href=threeDownload();
  const action=card.querySelector('.model-main-action');action.disabled=state.busy;action.textContent=state.connected?'Use for image to 3D':'3D setup guide';action.onclick=()=>{if(state.connected){setMode('image3d');navigate('create');refreshThreeSetup();}else openThreeGuide();};
  card.querySelector('.model-details-button').onclick=openThreeGuide;
 }
};
window.renderModelBrowser=renderModelBrowser;
const tutorialBeforeThree=startTutorial;
startTutorial=function(id,...args){if(id===threeCatalog.id){openThreeGuide();return;}return tutorialBeforeThree(id,...args);};
function updateThreeUI(){
 const active=window.isThreeMode()&&!window.geminiProviderActive();document.body.classList.toggle('three-mode',active);document.body.classList.toggle('three-image-mode',active&&state.mode==='image3d');
 $('three-fields').hidden=!active;$('three-panel').hidden=!active;
 if(!active){$('prompt').required=true;if(!state.nodeView)document.querySelector('.output-panel').hidden=false;return;}
 document.querySelector('.output-panel').hidden=true;$('node-panel').hidden=true;$('nodes-view').disabled=true;
 $('reference-field').hidden=state.mode!=='image3d';$('prompt').required=state.mode==='text3d';
 $('three-pipeline-note').textContent=state.mode==='text3d'?'Two local stages: your image model creates an isolated object image, then Hunyuan3D reconstructs its shape.':'Use one centered object with a clean background. The model infers unseen surfaces.';
 $('generate-button').disabled=state.busy;$('generate-label').textContent=state.busy?'Creating 3D…':'Generate 3D model';$('generate-note').textContent=three.autoColor?'Local Hunyuan3D · GLB mesh, auto-colored from your image':'Local Hunyuan3D · untextured GLB mesh';
 $('three-progress').hidden=!state.busy;$('three-model').disabled=state.busy||three.checking;$('three-refresh').disabled=state.busy||three.checking;
 $('three-refresh').textContent=three.checking?'Checking…':'Check 3D setup';$('three-status').textContent=three.checkError||(!state.connected?'Connect your local ComfyUI server to detect 3D support.':three.checking?'Checking required nodes and checkpoints…':three.info?three.models.length?'3D nodes detected · '+three.models.length+' compatible single-image checkpoint'+(three.models.length===1?'':'s'):'3D nodes detected. Add the Hunyuan3D single-image checkpoint, restart, and check again.':'Check your server for Hunyuan3D support.');
 document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=state.busy);
}
const modeBeforeThree=setMode;
setMode=function(mode){if(state.busy)return;if(['image3d','text3d'].includes(mode)){$('provider').value='local';if(!window.isThreeMode()&&(!$('prompt').value.trim()||$('prompt').value===defaultPrompt)){$('prompt').value='A small ceramic teapot, rounded body, curved spout and handle, simple solid form';}modeBeforeThree(mode);setView(false);updateProvider();updateThreeUI();if(state.connected&&three.server!==state.server)refreshThreeSetup();}else{modeBeforeThree(mode);$('nodes-view').disabled=window.geminiProviderActive();updateThreeUI();}};
const providerBeforeThree=updateProvider;
updateProvider=function(){if(window.geminiProviderActive()&&window.isThreeMode()){modeBeforeThree('text');state.mode='text';}providerBeforeThree();updateThreeUI();};
$('provider').onchange=updateProvider;
const guideUpdateBeforeThree=window.updateGuideGenerationState;
window.updateGuideGenerationState=()=>{guideUpdateBeforeThree();updateThreeUI();};
const serverStateBeforeThree=window.onServerStateChange;
window.onServerStateChange=()=>{serverStateBeforeThree();if(!state.connected){three.server=null;three.info=null;three.models=[];three.checkError='';populateThreePicker();}updateThreeUI();};
const selectImageBeforeThree=selectImage;
selectImage=function(id){if(window.isThreeMode())setMode('text');selectImageBeforeThree(id);};
const settingsBeforeThree=readSettings;
readSettings=function(){return {...settingsBeforeThree(),threeModel:$('three-model').value,threeSteps:Number($('three-steps').value)};};
const applyBeforeThree=applySettings;
applySettings=function(s){applyBeforeThree(s);if(!state.busy){if(s.threeModel&&three.models.includes(s.threeModel))$('three-model').value=s.threeModel;if(s.threeSteps)$('three-steps').value=s.threeSteps;updateThreeUI();}};
function populateThreePicker(){const previous=$('three-model').value;$('three-model').replaceChildren();for(const file of three.models){const option=document.createElement('option');option.value=file;option.textContent=file;$('three-model').append(option);}if(!three.models.length){const option=document.createElement('option');option.value='';option.textContent=state.connected?'No compatible Hunyuan3D checkpoint':'Connect to discover Hunyuan3D';$('three-model').append(option);}else $('three-model').value=three.models.includes(previous)?previous:three.models[0];}
async function refreshThreeSetup(signal){
 if(!state.connected){openConnection();return false;}if(three.checking)return false;const server=state.server;three.checking=true;three.checkError='';updateThreeUI();
 try{const response=await fetch(server+'/object_info',{signal:signal||AbortSignal.timeout(15000),cache:'no-store'});if(!response.ok)throw Error('Server returned '+response.status+'.');const info=await response.json();if(server!==state.server)return false;const missing=threeRequired.filter(name=>!info[name]);if(missing.length)throw Error('This server is missing 3D nodes: '+missing.join(', ')+'. Update ComfyUI and follow the 3D setup guide.');const files=info.ImageOnlyCheckpointLoader?.input?.required?.ckpt_name?.[0];if(!Array.isArray(files))throw Error('The server did not report its 3D checkpoint list.');three.info=info;three.server=server;three.models=files.filter(file=>filename(file)===threeCatalog.file);populateThreePicker();return true;
 }catch(error){three.info=null;three.server=null;three.models=[];populateThreePicker();three.checkError=error.name==='AbortError'?'Setup check stopped.':error.name==='TimeoutError'?'The setup check timed out. Check your server connection.':error.message;return false;}
 finally{three.checking=false;updateThreeUI();}
}
$('three-guide-tab').onclick=openThreeGuide;
$('three-refresh').onclick=()=>refreshThreeSetup();$('three-guide-open').onclick=openThreeGuide;$('three-guide-connect').onclick=()=>{$('three-guide-dialog').close();openConnection();};
function buildThreeWorkflow(s,referenceName){
 const graph=s.mode==='text3d'?buildWorkflow({...s,mode:'text',batch:1,ratio:'1:1',style:'None',prompt:s.prompt+', single centered object, three-quarter view, isolated on a plain white background, no scenery, entire object visible',negative:'background scenery, multiple objects, text, watermark, cropped object'},null):{};
 if(s.mode==='text3d')graph['7']={class_type:'PreviewImage',inputs:{images:['6',0]}};else graph['90']={class_type:'LoadImage',inputs:{image:referenceName}};
 Object.assign(graph,{
  '100':{class_type:'ImageOnlyCheckpointLoader',inputs:{ckpt_name:s.threeModel}},
  '101':{class_type:'CLIPVisionEncode',inputs:{clip_vision:['100',1],image:s.mode==='text3d'?['6',0]:['90',0],crop:'none'}},
  '102':{class_type:'Hunyuan3Dv2Conditioning',inputs:{clip_vision_output:['101',0]}},
  '103':{class_type:'EmptyLatentHunyuan3Dv2',inputs:{resolution:3072,batch_size:1}},
  '104':{class_type:'ModelSamplingAuraFlow',inputs:{model:['100',0],shift:1}},
  '105':{class_type:'KSampler',inputs:{model:['104',0],positive:['102',0],negative:['102',1],latent_image:['103',0],seed:s.seed,steps:s.threeSteps,cfg:6,sampler_name:'euler',scheduler:'normal',denoise:1}},
  '106':{class_type:'VAEDecodeHunyuan3D',inputs:{samples:['105',0],vae:['100',2],num_chunks:8000,octree_resolution:192}},
  '107':{class_type:'VoxelToMesh',inputs:{voxel:['106',0],algorithm:'surface net',threshold:0.6}},
  '108':{class_type:'SaveGLB',inputs:{mesh:['107',0],filename_prefix:'3d/ComfyStudio'}}
 });return graph;
}
function threeProgress(title,description){$('three-progress-title').textContent=title;$('three-progress-description').textContent=description;}
async function generateThree(){
 if(state.busy)return;if(!state.connected){openConnection();toast('Connect ComfyUI to create a real 3D model.');return;}
 let s=readSettings();if(s.mode==='image3d'&&!state.reference){toast('Upload a clear object image first.');$('reference-upload').click();return;}
 if(s.mode==='text3d'&&!s.prompt){toast('Describe the object you want to create.');$('prompt').focus();return;}
 if(s.mode==='text3d'&&(!s.model||classifyInstalledModel(s.model).compatible===false)){toast('Choose an installed SDXL or SD 1.5 image model for the first stage.');return;}
 if(!Number.isInteger(s.seed)||s.seed<0||s.seed>4294967295){toast('Choose a valid seed in Advanced settings.');return;}
 if(!Number.isInteger(s.threeSteps)||s.threeSteps<10||s.threeSteps>60){toast('Choose 10–60 3D sampling steps.');return;}
 generationController=new AbortController();const signal=AbortSignal.any([generationController.signal,AbortSignal.timeout(600000)]);activePromptId=null;setBusy(true);updateThreeUI();const start=Date.now();
 try{
  threeProgress('Checking your 3D setup','Checking native nodes and the single-image checkpoint.');if(!await refreshThreeSetup(signal))throw Error(three.checkError||'Your 3D server setup could not be verified.');s={...s,threeModel:$('three-model').value};if(!s.threeModel)throw Error('Download the Hunyuan3D single-image checkpoint in the 3D setup guide.');
  let referenceName;if(s.mode==='image3d'){threeProgress('Uploading your object image','Sending the image only to your connected local server.');const form=new FormData();form.append('image',state.reference.file);form.append('overwrite','false');const response=await fetch(state.server+'/upload/image',{method:'POST',body:form,signal});if(!response.ok)throw Error('The object image could not be uploaded.');const uploaded=await response.json();if(!uploaded.name)throw Error('The server did not return the uploaded filename.');referenceName=(uploaded.subfolder?uploaded.subfolder+'/':'')+uploaded.name;}
  threeProgress(s.mode==='text3d'?'Creating image and mesh':'Reconstructing your object','Your first 3D generation may take several minutes.');const response=await fetch(state.server+'/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:buildThreeWorkflow(s,referenceName),client_id:crypto.randomUUID()}),signal});const queued=await response.json();if(!response.ok||queued.error)throw Error(queued.error?.message||'ComfyUI rejected the 3D workflow. Check its console and model setup.');if(!queued.prompt_id)throw Error('ComfyUI did not return a job ID.');activePromptId=queued.prompt_id;
  while(Date.now()-start<600000){await wait(1200,signal);const r=await fetch(state.server+'/history/'+encodeURIComponent(activePromptId),{signal});if(!r.ok)throw Error('Lost contact with ComfyUI. The job may still finish on your server.');const history=await r.json();const job=history[activePromptId];if(job?.status?.status_str==='error')throw Error(job.status.messages?.find(m=>m[0]==='execution_error')?.[1]?.exception_message||'3D generation failed. Check model dependencies and GPU memory.');
   const outputs=Object.values(job?.outputs||{}),meshes=outputs.flatMap(o=>o['3d']||[]).filter(file=>typeof file.filename==='string'&&/\.glb$/i.test(file.filename));if(meshes.length){const preview=outputs.flatMap(o=>o.images||[])[0],source=s.mode==='image3d'?state.reference.file:preview&&state.server+'/view?'+new URLSearchParams({filename:preview.filename,subfolder:preview.subfolder||'',type:preview.type||'temp'});const results=meshes.map(file=>({id:crypto.randomUUID(),file,server:state.server,name:file.filename,mode:s.mode,prompt:s.prompt,source,seconds:Math.round((Date.now()-start)/1000),url:state.server+'/view?'+new URLSearchParams({filename:file.filename,subfolder:file.subfolder||'',type:file.type||'output'})}));three.results.unshift(...results);showThreeResult(results[0].id);toast('Your 3D mesh is ready. Rotate it or download the GLB.');return;}
   if(job?.status?.completed)throw Error('The workflow finished without a GLB mesh. Check ComfyUI’s output.');threeProgress(s.mode==='text3d'?'Creating image and mesh':'Reconstructing your object','Waiting for ComfyUI · '+Math.round((Date.now()-start)/1000)+' seconds');
  }throw Error('Still waiting after ten minutes. Check ComfyUI’s queue; the job may still finish.');
 }catch(error){toast(error.name==='AbortError'?'Stopped waiting. A running ComfyUI job may still finish.':error.name==='TimeoutError'?'3D generation timed out. Check ComfyUI’s queue.':error.message);}
 finally{setBusy(false);activePromptId=null;updateThreeUI();}
}
window.generateThree=generateThree;
function threeViewUrl(result){return three.autoColor&&result.colored?result.colored:result.url;}
function threeColorLabel(result){if(!three.autoColor)return 'Untextured GLB';if(result.colored)return 'Auto-colored GLB';if(result.colorError)return 'Untextured GLB · '+result.colorError;return 'Coloring from your image…';}
function showThreeResult(id){const result=three.results.find(r=>r.id===id);if(!result)return;three.selected=id;if($('three-viewer').src!==threeViewUrl(result))$('three-viewer').src=threeViewUrl(result);$('three-viewer').alt=result.mode==='text3d'?result.prompt:'3D mesh generated from your object image';$('three-viewer').hidden=false;$('three-empty').hidden=true;$('three-download').disabled=false;$('three-result-meta').textContent=`${result.name} · ${result.seconds}s · Local · ${threeColorLabel(result)}`;renderThreeHistory();if(three.autoColor&&!result.colored&&!result.colorError)colorThreeResult(result);}
async function colorThreeResult(result){
 if(result.coloring)return;result.coloring=true;
 try{if(!result.source)throw Error('no source image was found');const signal=AbortSignal.timeout(60000);
  const [mesh,pixels]=await Promise.all([fetch(result.url,{signal}).then(r=>{if(!r.ok)throw Error('the mesh could not be loaded');return r.arrayBuffer();}),autoColor.loadImagePixels(result.source,signal)]);
  await new Promise(requestAnimationFrame);result.colored=URL.createObjectURL(new Blob([autoColor.colorizeGlb(mesh,pixels)],{type:'model/gltf-binary'}));
 }catch(error){result.colorError=error.name==='TimeoutError'?'coloring timed out':'could not color: '+error.message;}
 finally{result.coloring=false;if(three.selected===result.id)showThreeResult(result.id);}
}
function updateAutoColorButton(){$('three-autocolor').setAttribute('aria-pressed',String(three.autoColor));$('three-autocolor-label').textContent=three.autoColor?'Auto color: on':'Auto color: off';}
$('three-autocolor').onclick=()=>{three.autoColor=!three.autoColor;try{localStorage.setItem('comfyStudio.autoColor',three.autoColor?'on':'off');}catch{}updateAutoColorButton();updateThreeUI();if(three.selected)showThreeResult(three.selected);};
function renderThreeHistory(){$('three-history').replaceChildren();for(const result of three.results){const button=document.createElement('button');button.className='button'+(result.id===three.selected?' active':'');button.textContent=result.name;button.onclick=()=>showThreeResult(result.id);$('three-history').append(button);}}
$('three-download').onclick=async()=>{const result=three.results.find(r=>r.id===three.selected);if(!result)return;const colored=three.autoColor&&result.colored;try{const response=await fetch(threeViewUrl(result),{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error();const url=URL.createObjectURL(await response.blob());const a=document.createElement('a');a.href=url;a.download=colored?result.name.replace(/\.glb$/i,'')+'_colored.glb':result.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}catch{toast('Could not download the mesh. Check that its local server is still running.');}};
$('three-cancel').onclick=()=>$('cancel-generation').click();
$('three-viewer').addEventListener('error',()=>{$('three-result-meta').textContent='Preview could not load. Download the GLB, or check your server’s connection and browser permissions.';});
// Restore 2D mode when choosing a 2D checkpoint from the browser.
const useBeforeThree=useInstalledModel;
useInstalledModel=function(file){if(state.busy)return;if(/hunyuan3d/i.test(file)){setMode('image3d');navigate('create');refreshThreeSetup();return;}if(window.isThreeMode())setMode('text');return useBeforeThree(file);};
hydrateIcons();renderModelBrowser();updateAutoColorButton();updateThreeUI();
