'use strict';
// Documented by Google on 2026-10-02. A successful API refresh replaces this
// discovery snapshot with the complete paginated catalog for the supplied key.
const geminiSnapshot = [
 ['gemini-3.8-flash','Gemini 3.8 Flash','text'],
 ['gemini-3.7-flash','Gemini 3.7 Flash','text'],
 ['gemini-3.6-flash','Gemini 3.6 Flash','text'],
 ['gemini-3.5-flash','Gemini 3.5 Flash','text'],
 ['gemini-3.5-flash-lite','Gemini 3.5 Flash-Lite','text'],
 ['gemini-3.1-flash-lite','Gemini 3.1 Flash-Lite','text'],
 ['gemini-3.1-pro-preview','Gemini 3.1 Pro Preview','text'],
 ['gemini-3-flash-preview','Gemini 3 Flash Preview','text'],
 ['gemini-3.1-flash-image','Nano Banana 2','image'],
 ['gemini-3.1-flash-lite-image','Nano Banana 2 Lite','image'],
 ['gemini-3-pro-image','Nano Banana Pro','image'],
 ['gemini-3.8-flash-tts','Gemini 3.8 Flash TTS','audio'],
 ['gemini-3.8-flash-lite-tts','Gemini 3.8 Flash-Lite TTS','audio'],
 ['gemini-3.1-flash-tts-preview','Gemini 3.1 Flash TTS Preview','audio'],
 ['gemini-3.8-live','Gemini 3.8 Live','special'],
 ['gemini-3.8-live-extended-thinking','Gemini 3.8 Live · Extended Thinking','special'],
 ['gemini-3.5-live-translate-preview','Gemini 3.5 Live Translate Preview','special'],
 ['gemini-3.1-flash-live-preview','Gemini 3.1 Flash Live Preview','special'],
 ['gemini-omni-1.1-flash','Gemini Omni 1.1 Flash','special'],
 ['gemini-3.5-transcribe','Gemini 3.5 Transcribe','special'],
 ['gemini-3.5-transcribe-live','Gemini 3.5 Transcribe Live','special'],
 ['gemini-embedding-2','Gemini Embedding 2','embedding'],
 ['gemini-embedding-2-preview','Gemini Embedding 2 Preview','embedding'],
 ['gemini-embedding-001','Gemini Embedding 001','embedding'],
 ['gemini-robotics-er-2-preview','Gemini Robotics ER 2 Preview','text'],
 ['gemini-robotics-er-1.6-preview','Gemini Robotics ER 1.6 Preview','text'],
 ['deep-research-preview-04-2026','Gemini Deep Research','special'],
 ['deep-research-max-preview-04-2026','Gemini Deep Research Max','special'],
 ['gemini-2.5-flash','Gemini 2.5 Flash','text'],
 ['gemini-2.5-flash-lite','Gemini 2.5 Flash-Lite','text'],
 ['gemini-2.5-pro','Gemini 2.5 Pro','text'],
 ['gemini-2.5-flash-image','Nano Banana · Gemini 2.5','image'],
 ['gemini-2.5-flash-preview-tts','Gemini 2.5 Flash TTS','audio'],
 ['gemini-2.5-pro-preview-tts','Gemini 2.5 Pro TTS','audio'],
 ['gemini-2.5-flash-native-audio-preview-12-2025','Gemini 2.5 Native Audio','special']
].map(([id,name,task])=>({id,name,task,legacy:id.startsWith('gemini-2.5'),preview:id.includes('preview'),documented:true}));
const gemini = {key:'',models:geminiSnapshot.slice(),live:false,refreshing:false,selected:'gemini-3.1-flash-image',task:'image',filter:'all',response:'',audioURL:null};
const taskLabels = {text:'Text & reasoning',image:'Image generation',audio:'Speech generation',embedding:'Embeddings',special:'Dedicated interface'};
const googleAPI = 'https://generativelanguage.googleapis.com/v1beta/';
window.geminiProviderActive=()=>$('provider').value==='gemini';
const selectedGemini=()=>gemini.models.find(m=>m.id===gemini.selected);
function inferGeminiTask(m){
 const id=m.name.replace(/^models\//,'');
 const known=geminiSnapshot.find(x=>x.id===id);if(known)return known.task;
 if((m.supportedGenerationMethods||[]).includes('embedContent')||/embedding/.test(id))return 'embedding';
 if(/live|native-audio|omni|transcribe|research/.test(id))return 'special';
 if(/tts/.test(id))return 'audio';if(/image/.test(id))return 'image';
 if(m.supportedGenerationMethods?.length&&!m.supportedGenerationMethods.some(x=>/generateContent|interact/i.test(x)))return 'special';
 return 'text';
}
function geminiDocs(m=selectedGemini()){
 const id=m?.id||'';
 const page=/research/.test(id)?'deep-research':/transcribe/.test(id)?(id.endsWith('-live')?'live-api/live-transcribe':'transcribe'):/omni/.test(id)?'omni':m?.task==='special'?'live':m?.task==='image'?'image-generation':m?.task==='audio'?'speech-generation':m?.task==='embedding'?'embeddings':'text-generation';
 return 'https://ai.google.dev/gemini-api/docs/'+page;
}
function populateGeminiPicker(){
 const root=$('gemini-model');root.replaceChildren();
 for(const m of gemini.models){const o=document.createElement('option');o.value=m.id;o.textContent=`${m.name} · ${m.id}`;root.append(o);}
 if(!gemini.models.some(m=>m.id===gemini.selected)){gemini.selected=gemini.models[0]?.id||'';gemini.task=selectedGemini()?.task||'text';}
 root.value=gemini.selected;
}
function selectGeminiModel(id){
 if(state.busy){toast('Finish the current request first.');return;}
 const m=gemini.models.find(x=>x.id===id);if(!m)return;
 gemini.selected=id;gemini.task=m.task;$('gemini-model').value=id;$('provider').value='gemini';updateProvider();navigate('create');
 toast(`${m.name} selected.`);
}
function updateProvider(){
 const cloud=window.geminiProviderActive();document.body.classList.toggle('gemini-provider',cloud);
 $('gemini-fields').hidden=!cloud;$('nodes-view').disabled=cloud;
 if(cloud){setView(false);$('gemini-model-id').textContent=gemini.selected||'No Gemini models returned';$('gemini-task').value=gemini.task;
  const specialized=gemini.task==='special';
  $('gemini-task-note').replaceChildren();
  const note=document.createElement('span');note.textContent=specialized?'This model is selected. Its Live, video, transcription, or agent interface is outside this studio. ':'Text, image, speech, and embedding requests run here. Other tasks depend on the model’s capabilities. ';
  const a=document.createElement('a');a.href=geminiDocs();a.target='_blank';a.rel='noopener noreferrer';a.textContent='Model API guide';$('gemini-task-note').append(note,a);
  $('gemini-image-options').hidden=gemini.task!=='image';
  $('generate-label').textContent=state.busy?'Creating…':specialized?'Use dedicated interface':!gemini.key?'Connect Gemini to start':gemini.task==='image'?'Generate image':gemini.task==='audio'?'Generate speech':gemini.task==='embedding'?'Create embedding':'Run prompt';
  $('generate-button').disabled=state.busy||!gemini.selected;
  $('generate-note').textContent='Google cloud · your key · usage may be billed';
  $('gemini-connect').textContent=gemini.key?'Manage Gemini connection':'Connect Gemini';
  $('mode-badge').textContent=gemini.key?'Gemini cloud connected':'Gemini cloud';
  $('footer-connection').textContent=gemini.key?'Connected · Google Gemini API':'Gemini · API key needed';
  $('footer-status').textContent=state.busy?'Requesting Gemini':'Ready when you are';
  $('cancel-generation').textContent='Stop waiting';
 }else{updateConnectionUI();if(!$('gemini-output').hidden||$('image-stage').classList.contains('gemini-text-stage'))selectImage(state.selected);$('gemini-output').hidden=true;$('image-stage').classList.remove('gemini-text-stage');}
 $('provider').disabled=state.busy;$('gemini-disconnect').hidden=!gemini.key;
}
const originalUpdateGuide=window.updateGuideGenerationState;
window.updateGuideGenerationState=()=>{originalUpdateGuide();if(window.geminiProviderActive())updateProvider();};
const originalConnectionUI=updateConnectionUI;
updateConnectionUI=function(){originalConnectionUI();if(window.geminiProviderActive())updateProvider();};
// Ensure local model actions restore their own provider and never submit to Google.
const originalUseInstalled=useInstalledModel;
useInstalledModel=function(file){if(state.busy)return;$('provider').value='local';updateProvider();originalUseInstalled(file);};
const originalGuideGenerate=generateFirstImage;
generateFirstImage=async function(){if(state.busy)return;$('provider').value='local';updateProvider();return originalGuideGenerate();};
const originalSettings=readSettings;
readSettings=function(){return {...originalSettings(),provider:$('provider').value,geminiModel:gemini.selected,geminiTask:gemini.task};};
const originalApplySettings=applySettings;
applySettings=function(s){if(state.busy){toast('Finish the current request first.');return;}if(s.provider){$('provider').value=s.provider;if(s.geminiModel&&gemini.models.some(m=>m.id===s.geminiModel)){gemini.selected=s.geminiModel;gemini.task=s.geminiTask||selectedGemini().task;$('gemini-model').value=gemini.selected;}}else $('provider').value='local';originalApplySettings(s);updateProvider();};
const originalSelectImage=selectImage;
selectImage=function(id){$('gemini-output').hidden=true;$('image-stage').classList.remove('gemini-text-stage');originalSelectImage(id);};
$('provider').onchange=updateProvider;
$('gemini-model').onchange=e=>{gemini.selected=e.target.value;gemini.task=selectedGemini()?.task||'text';updateProvider();};
$('gemini-task').onchange=e=>{gemini.task=e.target.value;updateProvider();};
function openGeminiConnection(){if(state.busy||gemini.refreshing)return;$('gemini-connection-error').hidden=true;$('gemini-api-key').value='';$('gemini-api-key').required=!gemini.key;$('gemini-disconnect').hidden=!gemini.key;$('gemini-dialog').showModal();}
for(const id of ['gemini-connect','gemini-browser-connect','gemini-guide-connect'])$(id).onclick=openGeminiConnection;
$('gemini-dialog').addEventListener('close',()=>$('gemini-api-key').value='');
function safeGeminiError(error,key=gemini.key){let message=String(error?.message||error);if(key)message=message.split(key).join('[key]');return message.slice(0,500);}
async function googleRequest(path,body,signal,key=gemini.key){
 const response=await fetch(googleAPI+path,{method:body?'POST':'GET',headers:{'x-goog-api-key':key,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
 let data;try{data=await response.json();}catch{throw Error(`Google returned ${response.status} without a valid response.`);}
 if(!response.ok||data.error){const hint=response.status===429?' Quota or rate limit reached; check your Google project.':response.status===403?' Check this key’s permissions, billing, and regional access.':response.status===404?' This model may be retired or unavailable to your project. Refresh the catalog.':'';throw Error(safeGeminiError(data.error?.message||`Google returned ${response.status}.`,key)+hint);}
 return data;
}
async function refreshGeminiCatalog(key=gemini.key){
 if(state.busy||gemini.refreshing)return;if(!key){openGeminiConnection();return false;}
 gemini.refreshing=true;renderModelBrowser();$('gemini-connect-submit').disabled=true;
 try{
  const all=[];const seen=new Set();let token='';
  do{const query=new URLSearchParams({pageSize:'1000'});if(token)query.set('pageToken',token);const data=await googleRequest('models?'+query,null,AbortSignal.timeout(15000),key);if(!Array.isArray(data.models))throw Error('Google did not return a model catalog.');all.push(...data.models);token=data.nextPageToken||'';if(token&&seen.has(token))throw Error('Google repeated a catalog page. Try refreshing again.');seen.add(token);}while(token);
  const unique=new Map();
  for(const m of all){if(typeof m.name!=='string')continue;const id=m.name.replace(/^models\//,'');if(!/^gemini(?:-|$)/i.test(id)&&!/gemini/i.test(m.displayName||'')&&!geminiSnapshot.some(x=>x.id===id))continue;if(!/^[a-zA-Z0-9._-]+$/.test(id))continue;const documented=geminiSnapshot.find(x=>x.id===id);unique.set(id,{...documented,id,name:m.displayName||id,description:m.description||'',task:inferGeminiTask(m),methods:m.supportedGenerationMethods||[],inputTokens:m.inputTokenLimit,outputTokens:m.outputTokenLimit,live:true});}
  if(!unique.size)throw Error('This key returned no Gemini models. The documented catalog is still available.');
  gemini.key=key;gemini.models=[...unique.values()];gemini.live=true;populateGeminiPicker();updateProvider();$('gemini-dialog').close();toast(`${gemini.models.length} Gemini models loaded from Google.`);return true;
 }catch(error){const message=safeGeminiError(error,key);$('gemini-connection-error').textContent=message;$('gemini-connection-error').hidden=false;$('refresh-error').textContent='Gemini refresh failed. '+message+' Your previous catalog is still available.';$('refresh-error').hidden=false;return false;
 }finally{gemini.refreshing=false;$('gemini-connect-submit').disabled=false;$('gemini-api-key').value='';renderModelBrowser();}
}
$('gemini-connection-form').onsubmit=async e=>{e.preventDefault();const key=$('gemini-api-key').value.trim()||gemini.key;$('gemini-api-key').value='';$('refresh-error').hidden=true;await refreshGeminiCatalog(key);};
$('gemini-disconnect').onclick=()=>{if(state.busy||gemini.refreshing)return;gemini.key='';gemini.live=false;gemini.models=geminiSnapshot.slice();populateGeminiPicker();$('gemini-api-key').value='';$('gemini-dialog').close();updateProvider();renderModelBrowser();toast('Gemini disconnected. Key cleared from this tab.');};
function openGeminiBrowser(){setModelCollection('gemini');navigate('models');}
for(const id of ['gemini-browse','gemini-guide-browse'])$(id).onclick=openGeminiBrowser;
const originalRenderModelBrowser=renderModelBrowser;let lastGeminiCollection='';
renderModelBrowser=function(){
 const cloud=browserState.collection==='gemini';if(lastGeminiCollection!==browserState.collection){$('refresh-error').hidden=true;lastGeminiCollection=browserState.collection;}document.querySelector('#models-page .model-explainer').hidden=cloud;const banner=document.querySelector('#models-page .setup-banner');banner.querySelector('strong').textContent=cloud?'Your first Gemini result, one step at a time.':'Your first local model, one step at a time.';banner.querySelector('p').textContent=cloud?'Connect your key, choose a model, and run a prompt in Google’s cloud.':'Find a model, download the right file, and make your first image.';const connect=document.querySelector('#models-page .heading-actions .connect-trigger');connect.textContent=cloud?(gemini.key?'Manage API key':'Connect Gemini'):'Connect server';connect.onclick=cloud?openGeminiConnection:openConnection;$('models-tutorial').textContent=cloud?'Gemini setup guide':'Installation guide';$('gemini-browser-connect').textContent=gemini.key?'Manage API key':'Connect API key';$('gemini-tab').classList.toggle('active',cloud);$('gemini-tab').setAttribute('aria-selected',String(cloud));$('gemini-count').textContent=gemini.models.length;$('gemini-browser-tools').hidden=!cloud;$('model-family').closest('label').hidden=cloud;
 if(!cloud){originalRenderModelBrowser();return;}
 $('discover-tab').classList.remove('active');$('installed-tab').classList.remove('active');$('models-intro').textContent='Select any Gemini model. No download needed; requests run in Google’s cloud.';
 $('browser-status').textContent=gemini.live?'Live API catalog · access depends on your project':'Documented catalog · October 2, 2026';
 $('gemini-catalog-source').textContent=gemini.live?'All Gemini results returned by Google for your key. Catalog listing does not guarantee inference access.':'Google’s October 2026 documentation. Connect your key to verify the current catalog for your project.';
 $('refresh-models').disabled=state.busy||gemini.refreshing;$('refresh-models').innerHTML=icon('refresh')+(gemini.refreshing?'Loading catalog…':'Refresh Gemini');
 const query=browserState.query.trim().toLowerCase();const visible=gemini.models.filter(m=>(gemini.filter==='all'||m.task===gemini.filter)&&[m.id,m.name,m.description,taskLabels[m.task]].join(' ').toLowerCase().includes(query));
 $('model-result-count').textContent=`${visible.length} Gemini models`;
 const root=$('model-grid');root.replaceChildren();if(!visible.length){createBrowserEmpty('No Gemini models match.','Try another name or purpose.',()=>{browserState.query='';gemini.filter='all';$('model-search').value='';$('gemini-capability').value='all';renderModelBrowser();},'Clear filters');return;}
 for(const m of visible){const card=document.createElement('article');card.className='model-card catalog-card'+(gemini.selected===m.id?' model-selected':'');card.dataset.geminiId=m.id;
  const badge=m.live?'API catalog':m.legacy?'Legacy access':m.preview?'Preview · check access':'Documented · check access';
  card.innerHTML=`<div class="catalog-card-top"><span class="model-symbol">${icon('sparkles')}</span><span class="model-card-badge">${escapeHTML(badge)}</span></div><div class="model-family-tag">Google · ${escapeHTML(taskLabels[m.task])}</div><h2>${escapeHTML(m.name)}</h2><code class="gemini-card-id">${escapeHTML(m.id)}</code><p>${escapeHTML(m.description|| (m.legacy?'Google limits the 2.5 family to projects with prior use. Refresh to check your catalog.':m.task==='special'?'Select this model and open its dedicated API guide for Live, video, transcription, or agent use.':'Connect your Gemini key and run a prompt in the studio.'))}</p><div class="catalog-actions"><button class="button primary gemini-select">${gemini.selected===m.id?'Open in studio':'Select model'}</button><button class="button gemini-details">Details</button></div>`;
  card.querySelector('.gemini-select').disabled=state.busy;card.querySelector('.gemini-select').onclick=()=>selectGeminiModel(m.id);card.querySelector('.gemini-details').onclick=()=>openGeminiDetails(m);root.append(card);
 }
};
window.renderModelBrowser=renderModelBrowser;
$('gemini-tab').onclick=openGeminiBrowser;
$('gemini-capability').onchange=e=>{gemini.filter=e.target.value;renderModelBrowser();};
$('refresh-models').onclick=()=>browserState.collection==='gemini'?refreshGeminiCatalog():refreshInstalledModels();
function openGeminiDetails(m){
 $('model-detail-content').innerHTML=`<span class="model-family-tag">Google Gemini · ${escapeHTML(taskLabels[m.task])}</span><h2>${escapeHTML(m.name)}</h2><code class="gemini-card-id">${escapeHTML(m.id)}</code><p>${escapeHTML(m.description||'Cloud model served by Google. Availability and pricing depend on your project and region.')}</p><dl class="model-detail-facts"><div><dt>Catalog</dt><dd>${m.live?'Returned by the live API':'Google documentation · Oct 2, 2026'}</dd></div><div><dt>Methods</dt><dd>${escapeHTML(m.methods?.join(', ')||'Connect to read API methods')}</dd></div><div><dt>Token limits</dt><dd>${m.inputTokens?Number(m.inputTokens).toLocaleString()+' input / '+Number(m.outputTokens||0).toLocaleString()+' output':'Reported after connection'}</dd></div><div><dt>Access</dt><dd>${m.legacy?'Prior-use restriction for Gemini 2.5. ':''}A catalog entry does not guarantee inference access. Check Google billing, quotas, and model status.</dd></div></dl><div class="detail-actions"><button class="button primary" id="gemini-detail-select">Select model</button><a class="button" href="${geminiDocs(m)}" target="_blank" rel="noopener noreferrer">API guide</a><a class="button" href="https://ai.google.dev/gemini-api/docs/models" target="_blank" rel="noopener noreferrer">Google model catalog</a></div>`;
 $('gemini-detail-select').onclick=()=>{$('model-detail-dialog').close();selectGeminiModel(m.id);};$('model-detail-dialog').showModal();
}
function showGeminiGuide(cloud){document.querySelector('#tutorial-page .page-heading h1').textContent=cloud?'Your first Gemini creation.':'Your first local creation.';document.querySelector('#tutorial-page .page-heading .eyebrow').textContent=cloud?'FROM API KEY TO YOUR FIRST RESULT':'FROM DOWNLOAD TO YOUR FIRST IMAGE';document.querySelector('#tutorial-page .tutorial-troubleshooting').hidden=cloud;$('restart-guide').hidden=cloud;$('gemini-guide').hidden=!cloud;document.querySelector('.tutorial-layout').hidden=cloud;$('local-guide-tab').classList.toggle('active',!cloud);$('gemini-guide-tab').classList.toggle('active',cloud);}
$('local-guide-tab').onclick=()=>showGeminiGuide(false);$('gemini-guide-tab').onclick=()=>showGeminiGuide(true);
function startGeminiGuide(){showGeminiGuide(true);navigate('tutorial');}
$('gemini-setup').onclick=startGeminiGuide;
$('gemini-guide-start').onclick=()=>{$('provider').value='gemini';updateProvider();navigate('create');};
const originalStartTutorial=startTutorial;
startTutorial=function(...args){showGeminiGuide(false);return originalStartTutorial(...args);};
$('models-tutorial').onclick=()=>browserState.collection==='gemini'?startGeminiGuide():startTutorial();$('start-guide').onclick=$('models-tutorial').onclick;
function legacyAudioURL(data,mime){
 if(!/^audio\/(?:L16|pcm)/i.test(mime))return 'data:'+mime+';base64,'+data;
 const raw=Uint8Array.from(atob(data),c=>c.charCodeAt(0));const bytes=new Uint8Array(44+raw.length);const view=new DataView(bytes.buffer);const write=(at,s)=>[...s].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));write(0,'RIFF');view.setUint32(4,36+raw.length,true);write(8,'WAVE');write(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);const rate=Number(mime.match(/rate=(\d+)/)?.[1]||24000);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,raw.length,true);bytes.set(raw,44);return URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}));
}
async function generateGemini(){
 if(state.busy)return;const m=selectedGemini();if(!m)return;
 if(gemini.task==='special'){window.open(geminiDocs(m),'_blank','noopener,noreferrer');return;}
 if(!gemini.key){openGeminiConnection();return;}const prompt=$('prompt').value.trim();if(!prompt){$('prompt').focus();toast('Write a prompt first.');return;}
 $('image-stage').classList.remove('gemini-text-stage');generationController=new AbortController();activePromptId=null;const signal=AbortSignal.any([generationController.signal,AbortSignal.timeout(180000)]);setView(false);setBusy(true);$('progress-title').textContent='Creating with Gemini';$('progress-description').textContent='Google is processing your prompt. API usage may be billed.';const start=Date.now();
 try{
  let data;let parts=[];const task=gemini.task;
  if(task==='embedding'){data=await googleRequest('models/'+encodeURIComponent(m.id)+':embedContent',{model:'models/'+m.id,content:{parts:[{text:prompt}]}},signal);if(!data.embedding?.values)throw Error('Google returned no embedding.');parts=[{type:'text',text:JSON.stringify(data.embedding,null,2)}];}
  else if(m.id.startsWith('gemini-2.5')||(!m.documented&&m.methods?.includes('generateContent'))){const generationConfig={};if(task==='image'){generationConfig.responseModalities=['TEXT','IMAGE'];generationConfig.imageConfig={aspectRatio:$('gemini-ratio').value};}if(task==='audio'){generationConfig.responseModalities=['AUDIO'];generationConfig.speechConfig={voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}};}data=await googleRequest('models/'+encodeURIComponent(m.id)+':generateContent',{contents:[{role:'user',parts:[{text:prompt}]}],generationConfig},signal);parts=(data.candidates||[]).flatMap(c=>c.content?.parts||[]).filter(p=>!p.thought).map(p=>p.text?{type:'text',text:p.text}:p.inlineData?{type:p.inlineData.mimeType.startsWith('image/')?'image':'audio',data:p.inlineData.data,mime_type:p.inlineData.mimeType}:null).filter(Boolean);}
  else{const body={model:m.id,input:prompt,store:false};if(task==='image')body.response_format={type:'image',aspect_ratio:$('gemini-ratio').value};if(task==='audio'){body.response_format={type:'audio'};body.generation_config={speech_config:[{voice:'Kore'}]};}data=await googleRequest('interactions',body,signal);if(data.status&&data.status!=='completed')throw Error(`Google returned interaction status: ${data.status}.`);parts=(data.steps||[]).filter(s=>s.type==='model_output').flatMap(s=>s.content||[]);if(!parts.length){if(data.output_text)parts.push({type:'text',text:data.output_text});if(data.output_image)parts.push({type:'image',...data.output_image});if(data.output_audio)parts.push({type:'audio',...data.output_audio});}}
  const text=parts.filter(p=>p.type==='text').map(p=>p.text||'').join('\n\n');const artwork=parts.filter(p=>p.type==='image'&&p.data&&/^image\/(png|jpeg|webp)$/.test(p.mime_type||''));const audio=parts.find(p=>p.type==='audio'&&p.data&&/^audio\//.test(p.mime_type||''));
  if(!text&&!artwork.length&&!audio)throw Error('Google returned no displayable result. Check model capability and safety restrictions.');
  gemini.response=text;$('gemini-response-text').textContent=text;$('gemini-output-title').textContent=task==='embedding'?'Embedding vector':'Gemini response';$('gemini-copy-response').hidden=!text;
  if(gemini.audioURL?.startsWith('blob:'))URL.revokeObjectURL(gemini.audioURL);gemini.audioURL=null;$('gemini-response-audio').pause();$('gemini-response-audio').removeAttribute('src');$('gemini-response-audio').hidden=!audio;$('gemini-audio-download').hidden=!audio;
  if(audio){gemini.audioURL=legacyAudioURL(audio.data,audio.mime_type);$('gemini-response-audio').src=gemini.audioURL;$('gemini-audio-download').href=gemini.audioURL;}
  $('gemini-response-meta').textContent=`${m.id} · ${Math.round((Date.now()-start)/1000)}s · Google cloud${data.usage?.total_tokens?' · '+data.usage.total_tokens+' tokens':''}`;
  if(artwork.length){const results=artwork.map((p,i)=>({id:crypto.randomUUID(),src:`data:${p.mime_type};base64,${p.data}`,name:'Gemini creation '+(images.filter(im=>im.provider==='gemini').length+i+1),prompt,style:'Gemini',model:m.name,size:'Google image output',sample:false,favorite:false,provider:'gemini',seconds:Math.round((Date.now()-start)/1000)}));images.unshift(...results);selectImage(results[0].id);renderLibrary();}
  else{$('image-stage').classList.add('gemini-text-stage');$('output-name').textContent='Gemini result';$('output-badge').textContent='Cloud';$('output-model').textContent=m.name;$('output-size').textContent=taskLabels[task];$('output-style').textContent='';$('output-time').textContent='Google cloud';}
  $('gemini-output').hidden=!text&&!audio;toast('Gemini result is ready.');
 }catch(error){toast(error.name==='AbortError'?'Stopped waiting. Google may still finish and bill the request.':error.name==='TimeoutError'?'Google took too long. The request may still finish.':safeGeminiError(error));}
 finally{setBusy(false);updateProvider();}
}
window.generateGemini=generateGemini;
$('gemini-copy-response').onclick=()=>copyText(gemini.response);
window.addEventListener('pagehide',()=>{gemini.key='';$('gemini-api-key').value='';generationController?.abort();});
populateGeminiPicker();hydrateIcons();renderModelBrowser();updateProvider();
