# ANDATRA: browser instrumental generation

Experimental ACE-Step 1.5 Turbo inference using FluidAudio's independent custom
WebGPU/WGSL and WASM runtime. No generation API, API key, installation, reference
song or stored beat library is used. Lyrics are empty, instrumental is true and
the semantic planner is disabled. Listen for possible unwanted vocal artifacts.

## Requirements and loading

Desktop Chrome/Edge on HTTPS, hardware WebGPU with shader-f16, OPFS and Web Locks.
The device probe does not download weights or establish available VRAM. First
use downloads 5,747,730,175 bytes of model payloads from Hugging Face. Bundled
client/worker code comes from this site's origin. Model files are verified by
pinned content hashes; prompts and audio are computed locally. Download hosts
still receive ordinary network metadata. Start with 10 seconds. Longer options
are conservatively limited by GPU buffer size and may still exhaust memory.

## Source and build

Upstream: https://github.com/FluidInference/fluidaudio-web
Revision: 8ff2a995d820981887b2c660f2e5b12a849ccc70.
The custom runtime is ace-step-1.5.wgsl by Narcotic Software, vendored upstream.
ACE source: 6d467e4b5081ccb0abf1ec1bf4fdf9051a2d34b0.
ACE model: 19671f406d603126926c1b7e2adc169acbcade22.

Build with esbuild 0.25.12, ES modules, browser ES2022, without minification.
Bundle upstream packages/acestep/src/index.ts and direct-only-backend.ts into
fluid/music.worker.js via installAceWorkerRuntime. Bundle AceStepMusicClient,
deleteAceModelCache, releaseAceAudioOutput and assertAceGenerationRequest into
fluid/client.js. Replace only the page client's Worker URL with music.worker.js;
use default production configuration and a no-referrer policy on worker fetches.
No inference kernels, precision choices, weights or scheduling were modified.
Licenses and attribution are in licenses/THIRD_PARTY_NOTICES.md.

## Integration and validation

The same-origin module Worker receives only text, tempo, duration, a fresh seed
and instrumental settings. Cancellation is forwarded during loading/generation.
Generated 48kHz stereo WAV is copied from temporary OPFS output before that output
is removed. The model-cache deletion API touches only its own namespace. Studio
transfer uses the existing andatra-audio-transfer IndexedDB beat import contract.

Node tests validate requests against the actual bundled runtime validator.
Interface tests use a mocked inference boundary to check lazy loading, new seeds,
cancellation, downloads, cache deletion and studio transfer. They do not establish
real GPU inference, performance, musical quality or AMD compatibility. A complete
model download, real generation and listening test remain required on the user's
GPU. The existing generator and studio are separate from this experimental page.
