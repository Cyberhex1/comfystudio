<p align="center"><img src="icon.png" width="128" alt="Comfy Studio icon"></p>

# Comfy Studio

A friendlier way to make AI images and 3D models on your own PC. Comfy Studio is a web app that runs on top of ComfyUI and replaces its node graph with a guided studio: pick a style, write a prompt, and generate. It can also turn an image into a 3D model and color it automatically.

**[Download the latest release](https://github.com/Cyberhex1/comfystudio/releases/latest)**

An interactive design prototype for a friendlier ComfyUI frontend. It uses a guided studio, optional workflow preview, reusable presets, and a session gallery. This is a new frontend prototype, not a modified distribution of the ComfyUI repository.

## Run locally

```sh
python -m http.server 5173 --directory dist
```

Open http://localhost:5173. To generate real images, run ComfyUI with a browser origin allowed:

```sh
python main.py --enable-cors-header http://localhost:5173
```

Select **Connect local server** and enter the ComfyUI address (usually http://127.0.0.1:8188). Standard Stable Diffusion and SDXL checkpoint workflows are supported. Models using separate text encoders, such as FLUX, need a dedicated workflow adapter and are not supported by this prototype.

## Behavior

- Demo mode previews three original sample images; prompts are not sent to an inference service.
- Connected mode discovers local checkpoints, submits a ComfyUI API workflow, and polls for output images.
- Text-to-image supports aspect ratio, style, batch size, seed, sampling steps, guidance, and sampler. Recognized SD 1.5 checkpoints use a 512-pixel starting size; SDXL uses 1024 pixels.
- Image-to-image uploads a reference image directly to the connected server and encodes its existing dimensions. The size chooser applies to text-to-image only.
- The Nodes tab is a readable settings preview, not a free-form node editor. JSON export produces a text-to-image ComfyUI API workflow, not the frontend graph format.
- Saved workflows and favorites last for the current browser session only. Refreshing resets them.
- Stopping a generation removes it from the pending queue when possible and stops waiting; an already running job may finish. It never globally interrupts other jobs.
- A hosted HTTPS preview may require local-network permission or an HTTPS endpoint. Running the frontend locally is recommended for local ComfyUI.

## Finding and installing models

Open **Getting started** for the five-step tutorial: choose a checkpoint, download its exact file, move it into the right folder, start and connect ComfyUI, then generate your first image. Windows portable, Windows manual, and macOS/Linux manual instructions are included. The tutorial also offers this frontend as a downloadable local ZIP.

The **Models** browser has curated discovery, text search, family filters, detail panels, source/license links, and an installed-model list refreshed directly from ComfyUI. Downloads open on Hugging Face and must be moved into `ComfyUI/models/checkpoints` by the user. This website does not write to the local model directory or download model weights on the server.

Curated checkpoints include SDXL Base 1.0, SD 1.5, DreamShaper 8, the non-Turbo DreamShaper XL 1.0 Alpha 2 checkpoint, RealVisXL V4.0, and Juggernaut XL v9. Each discovery card links directly to the exact Hugging Face checkpoint download and its installation guide. File existence and decimal GB sizes were verified against Hugging Face metadata on October 2, 2026. GPU-memory suggestions are estimates, not measured requirements.

Installed files matching the catalog are recognized by filename. Other model-family labels are inferred from filenames and do not inspect model weights. Unknown files are explicitly unverified. Filenames suggesting FLUX, SD3, LoRA, ControlNet, refiner, inpainting, Turbo, or LCM workflows are disabled in this standard workflow picker.

A connected server with an empty model folder is allowed so users can refresh after adding a checkpoint. First-image generation requires an installed usable checkpoint. Tutorial download/folder completion is acknowledged manually; server detection verifies only that a checkpoint is listed, and inference is the actual loading check.

## Verification

Browser interaction checks cover the original studio, model search/filtering, source links, OS-specific setup instructions, local app ZIP download, empty model folders, installed-model refresh, unsupported and unknown labels, refresh failure recovery, SD 1.5 resolution defaults, and a tutorial-to-first-image mocked ComfyUI round trip. All five tutorial steps were checked for overflow on mobile, tablet, and laptop widths. GPU inference is not verified without a running ComfyUI server.

Browser WebMCP hooks are included when supported. Native WebMCP validation was unavailable in the verification browser.

## Gemini cloud models

Choose **Cloud · Gemini** in the studio, or open **Models → Gemini**. The browser includes 35 endpoints documented by Google as of October 2, 2026: Gemini 3.8/3.7/3.6/3.5 text models, Nano Banana image models, speech, Live, transcription, Omni, embeddings, robotics, Deep Research, and legacy 2.5 models. Retired 2.0 and shut-down preview endpoints are excluded from the documented snapshot. Gemini 2.5 has prior-use restrictions; the app does not imply that every documented endpoint is available to every user.

Connect a personal Gemini API key to replace the snapshot with the complete paginated `models.list` response. Newly returned Gemini IDs are accepted without a fixed allowlist. Google model IDs, display names, descriptions, token limits, and supported generation methods are shown where provided. The catalog is scoped to the supplied key and does not guarantee inference access: quotas, billing, region, preview restrictions, and retirement still apply. Use **Refresh Gemini** to check for additions throughout October and beyond.

Text, image, speech, and embedding requests run in the studio. Current documented models use Google's Interactions API (`store: false`); legacy Gemini 2.5 and newly discovered models advertising `generateContent` use that endpoint. Embeddings use `embedContent`. Speech output includes playback/download; legacy PCM audio is wrapped in WAV. Live, transcription, Omni/video, and agent endpoints are selectable but use dedicated APIs that this frontend does not implement; their specific Google guides are linked. No Gemini weights are downloaded, and no local image reference is sent to Google by this adapter. Cloud prompts are sent to Google and can incur API charges.

**Getting started → Gemini setup** explains how to create a key, connect, refresh the model catalog, and make a first request. Keys stay only in tab memory, are sent in `x-goog-api-key` headers directly to Google, and are cleared on reload/disconnect. They are never put in URLs, local/session storage, saved workflows, the downloadable ZIP, or source. This is a personal-key frontend; a production app using a shared service key should put that key behind an authenticated backend proxy.

Sources: [Google model catalog](https://ai.google.dev/gemini-api/docs/models), [Models API](https://ai.google.dev/api/models), [Interactions API](https://ai.google.dev/api/interactions), [image generation](https://ai.google.dev/gemini-api/docs/image-generation), [speech](https://ai.google.dev/gemini-api/docs/speech-generation), [embeddings](https://ai.google.dev/gemini-api/docs/embeddings), and [API key setup](https://ai.google.dev/gemini-api/docs/api-key). Embedding 2's stable ID is documented in the embeddings guide in addition to the preview ID in the model overview.

Gemini browser verification uses mocked Google responses to check catalog pagination, a previously unknown model ID, text/image/audio/embedding results, safe text rendering, error recovery, key redaction, disconnection, saved settings, and responsive layouts. Actual Google inference requires the user's API key and has not been verified with live credentials.

## Local image-to-3D and text-to-3D

The studio has **Image to 3D** and **Text to 3D** modes under the local ComfyUI provider. Image-to-3D uploads a user-provided object image and submits the native ComfyUI Hunyuan3D 2.0 single-image graph. Text-to-3D submits one combined graph: an installed standard SDXL or SD 1.5 checkpoint produces an isolated object image, and Hunyuan3D reconstructs its geometry. Neither mode creates a pretend mesh when no server is connected.

The **Hugging Face** browser includes the official Comfy-Org repack at `Comfy-Org/hunyuan3D_2.0_repackaged/split_files/hunyuan3d-dit-v2_fp16.safetensors` (4,928,151,562 bytes; 4.93 decimal GB). It belongs in `ComfyUI/models/checkpoints`. Multiview and Turbo variants are excluded from this single-image adapter. Hunyuan3D checkpoints are disabled in the SD image picker and offered in a separate 3D picker. **Check 3D setup** inspects `/object_info` for required native nodes and reads the ImageOnlyCheckpointLoader model list. Downloads, license, official installation instructions, and hardware guidance are available in **3D setup** in the studio, model details, and Getting started.

The graph matches Comfy-Org's [native Hunyuan3D image workflow](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/3d_hunyuan3d_image_to_model.json): ImageOnlyCheckpointLoader, CLIPVisionEncode, Hunyuan3Dv2Conditioning, EmptyLatentHunyuan3Dv2, ModelSamplingAuraFlow, KSampler, VAEDecodeHunyuan3D, VoxelToMesh, and SaveGLB. Successful history results use the native `3d` output key. Meshes can be rotated/zoomed and downloaded as GLB, with session history. Output is untextured geometry; this adapter does not implement texture generation or direct text-conditioned 3D inference.

**Auto color** (on by default, toggled next to Download GLB) paints the untextured mesh in the browser with the colors of the image it was made from: the uploaded object image, or in Text to 3D the object image the first stage made (kept as a temporary `PreviewImage` output). `dist/autocolor.js` tries upright views of the mesh, keeps the one whose outline best matches the image, projects the image through the mesh, and writes the result as vertex colors (`COLOR_0`) into a new GLB. Downloads save that colored file as `*_colored.glb`. Surfaces the image could not see (the back, hidden sides) get colors carried through from the front, so it is a quick color pass, not real texture generation.

The 3D preview uses a vendored Google model-viewer 4.1.0 bundle and license under `dist/vendor`; it is served from the app, not a third-party CDN at runtime. Local server connection and browser/CORS requirements still apply to the mesh preview and downloads. Stopping removes a queued job where possible and stops waiting without globally interrupting the server. Inference can wait up to ten minutes.

The local **Hugging Face models** button and Models navigation now explicitly select the Hugging Face collection and reset stale filters, so a previous Gemini visit cannot hide the downloads. The download helper supports repository subfolders.

Browser checks verify both native 3D graphs, image upload, an actual valid GLB test fixture in the viewer, download, saved settings, missing nodes, server GPU errors, cancellation, and responsive layouts. Google/local image flows are regression checked. These checks use mocked inference responses; generation with real Hunyuan3D weights requires a running ComfyUI server and GPU and has not been performed in this workspace.

## License

MIT. See [LICENSE](LICENSE). The bundled model-viewer library keeps its own license in `dist/vendor`.
