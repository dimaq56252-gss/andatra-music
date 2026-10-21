// qa/fluid-audio/packages/acestep/src/runtime/seed.ts
var ACE_SEED_CONTRACT = Object.freeze({
  version: "ace-seed-v1",
  authority: "browser-defined",
  syntax: "uint64-lowercase-hex-16",
  generator: "philox4x32-10",
  counterOrder: "little-endian-word-index",
  streams: ["diffusion-noise", "planner-sampling"],
  gaussianMapping: "probit-acklam-binary64-f32-v1",
  categoricalMapping: "u32-midpoint-binary64-cdf-v1",
  transformLocation: "dedicated-worker-cpu",
  referenceInterop: "capture-or-inject-browser-random-inputs"
});
var MAX_UINT64 = 0xffffffffffffffffn;
var MAX_PHILOX_WORD_INDEX = MAX_UINT64 << 2n | 3n;
var CANONICAL_SEED = /^[0-9a-f]{16}$/;
function isAceSeed(value) {
  return typeof value === "string" && CANONICAL_SEED.test(value);
}
var RANDOM_STREAM_DOMAINS = Object.freeze({
  "diffusion-noise": [1145652806, 1313818963],
  "planner-sampling": [1347174734, 1396788560]
});
var UINT32_MIDPOINT_SCALE = 1 / 4294967296;
var ACKLAM_LOW_TAIL = 0.02425;
var ACKLAM_HIGH_TAIL = 1 - ACKLAM_LOW_TAIL;
var ACKLAM_A = Object.freeze([
  -39.69683028665376,
  220.9460984245205,
  -275.9285104469687,
  138.357751867269,
  -30.66479806614716,
  2.506628277459239
]);
var ACKLAM_B = Object.freeze([
  -54.47609879822406,
  161.5858368580409,
  -155.6989798598866,
  66.80131188771972,
  -13.28068155288572
]);
var ACKLAM_C = Object.freeze([
  -0.007784894002430293,
  -0.3223964580411365,
  -2.400758277161838,
  -2.549732539343734,
  4.374664141464968,
  2.938163982698783
]);
var ACKLAM_D = Object.freeze([
  0.007784695709041462,
  0.3224671290700398,
  2.445134137142996,
  3.754408661907416
]);

// qa/fluid-audio/packages/acestep/src/webgpu/capabilities.ts
var ACE_REFERENCE_PORTABLE_PROFILE = Object.freeze({
  id: "reference-bf16-portable",
  modelProfile: "reference-bf16",
  weightStorage: "packed-bf16-u32",
  matrixArithmetic: "float32",
  sensitiveReductions: "float32",
  vaeArithmetic: "float32",
  kernelBackend: "portable",
  requiredFeatures: []
});
var ACE_REFERENCE_SUBGROUP_PROFILE = Object.freeze({
  ...ACE_REFERENCE_PORTABLE_PROFILE,
  id: "reference-bf16-subgroups",
  kernelBackend: "subgroups",
  requiredFeatures: ["subgroups"]
});
var ACE_FP16_PORTABLE_PROFILE = Object.freeze({
  id: "raw-fp16-portable",
  modelProfile: "raw-fp16",
  weightStorage: "float16",
  matrixArithmetic: "float16",
  sensitiveReductions: "float32",
  vaeArithmetic: "float32",
  kernelBackend: "portable",
  requiredFeatures: ["shader-f16"]
});
var ACE_STOCK_WEBGPU_FEATURES = [
  "shader-f16",
  "subgroups",
  "timestamp-query"
];
var ACE_WEBGPU_LIMIT_NAMES = [
  "maxBufferSize",
  "maxStorageBufferBindingSize",
  "maxUniformBufferBindingSize",
  "maxBindGroups",
  "maxBindingsPerBindGroup",
  "maxStorageBuffersPerShaderStage",
  "maxUniformBuffersPerShaderStage",
  "maxDynamicStorageBuffersPerPipelineLayout",
  "maxDynamicUniformBuffersPerPipelineLayout",
  "maxComputeWorkgroupStorageSize",
  "maxComputeInvocationsPerWorkgroup",
  "maxComputeWorkgroupSizeX",
  "maxComputeWorkgroupSizeY",
  "maxComputeWorkgroupSizeZ",
  "maxComputeWorkgroupsPerDimension",
  "minStorageBufferOffsetAlignment",
  "minUniformBufferOffsetAlignment"
];
var ACE_REQUIRED_WEBGPU_LIMITS = Object.freeze({
  // The pinned 256-frame / 64-overlap FP32 VAE correctness graph reaches
  // 62,914,560 activation elements (240 MiB) after its fourth upsample. Ask
  // for the next power-of-two capacity, matching the audited M3 device.
  // A 128 MiB device would require a smaller, separately audited VAE chunk
  // oracle; Stage 1 fails closed instead of silently changing seam geometry.
  maxBufferSize: 256 * 1024 * 1024,
  maxStorageBufferBindingSize: 256 * 1024 * 1024,
  maxStorageBuffersPerShaderStage: 8,
  maxComputeWorkgroupStorageSize: 16 * 1024,
  maxComputeInvocationsPerWorkgroup: 256,
  minStorageBufferOffsetAlignment: 256,
  minUniformBufferOffsetAlignment: 256
});

// qa/fluid-audio/packages/acestep/src/api.ts
var ACE_SAMPLE_RATE_HZ = 48e3;
var ACE_CHANNEL_COUNT = 2;
var ACE_TURBO_DENOISING_EVALUATIONS = 8;
var ACE_MIN_DURATION_SECONDS = 10;
var ACE_MAX_DURATION_SECONDS = 240;
var ACE_DIRECT_DCW_CONFIGURATION = Object.freeze({
  enabled: true,
  mode: "double",
  wavelet: "haar",
  lowBandScale: 0.05,
  highBandScale: 0.02
});
var ACE_THINKING_DCW_CONFIGURATION = Object.freeze({
  enabled: true,
  mode: "double",
  wavelet: "haar",
  lowBandScale: 0.02,
  highBandScale: 0.06
});
var ACE_TURBO_V1_CORRECTNESS_PROFILE = Object.freeze({
  id: "ace-turbo-v1-correctness",
  inferenceMethod: "ode",
  sampler: "euler",
  denoisingEvaluations: ACE_TURBO_DENOISING_EVALUATIONS,
  diffusionGuidanceScale: 1,
  // The generic GenerationParams dataclass says 1.0, but the pinned Turbo
  // model, Gradio product path, and release API all resolve to shift 3.0.
  shift: 3,
  schedulerTimesteps: Object.freeze([
    1,
    0.9545454545454546,
    0.9,
    0.8333333333333334,
    0.75,
    0.6428571428571429,
    0.5,
    0.3
  ]),
  // Pinned Turbo materializes the resolved list with
  // `dtype=context_latents.dtype` before calling `.item()` for the model,
  // Euler update, and DCW. The accepted native oracle is BF16, so these are
  // the actual sampler coefficients; both browser profiles preserve them.
  effectiveSamplerTimestepsBfloat16: Object.freeze([
    1,
    0.953125,
    0.8984375,
    0.83203125,
    0.75,
    0.64453125,
    0.5,
    0.30078125
  ]),
  customTimesteps: null,
  adaptiveDualGuidance: false,
  velocityNormThreshold: 0,
  velocityEmaFactor: 0,
  latentShift: 0,
  latentRescale: 1,
  dynamicConditionalWeighting: Object.freeze({
    resolution: "planner-mode",
    direct: ACE_DIRECT_DCW_CONFIGURATION,
    thinking: ACE_THINKING_DCW_CONFIGURATION
  }),
  outputNormalization: Object.freeze({
    mode: "global-peak",
    targetDbfs: -1,
    silenceThreshold: 1e-6
  }),
  sampleRateHz: ACE_SAMPLE_RATE_HZ,
  channelCount: ACE_CHANNEL_COUNT
});
var PLANNER_CONFIGURATION_KEYS = [
  "mode",
  "temperature",
  "guidanceScale",
  "topK",
  "topP",
  "constrainedDecoding",
  "generateSemanticCodes",
  "negativePrompt",
  "thinking"
];
var GENERATION_REQUEST_KEYS = [
  "generationProfile",
  "prompt",
  "lyrics",
  "instrumental",
  "durationSeconds",
  "seed",
  "planner",
  "metadata"
];
var PLANNER_THINKING_KEYS = [
  "enabled",
  "useCotCaption",
  "useCotLanguage",
  "useCotMissingMetadata"
];
var MUSIC_METADATA_KEYS = [
  "bpm",
  "keyScale",
  "timeSignature",
  "vocalLanguage"
];
var DEFAULT_ACE_PLANNER_CONFIGURATION = Object.freeze({
  mode: "enabled",
  temperature: 0.85,
  guidanceScale: 2,
  topK: 0,
  topP: 0.9,
  constrainedDecoding: true,
  generateSemanticCodes: true,
  negativePrompt: "NO USER INPUT",
  thinking: Object.freeze({
    enabled: true,
    useCotCaption: true,
    useCotLanguage: true,
    useCotMissingMetadata: true
  })
});
function assertAceGenerationRequest(request) {
  if (!isRecord(request)) {
    throw new TypeError("ACE generation request must be an object");
  }
  assertOnlyKeys(request, GENERATION_REQUEST_KEYS, "ACE generation request");
  if (request.generationProfile !== ACE_TURBO_V1_CORRECTNESS_PROFILE.id) {
    throw new TypeError(`Unknown ACE generation profile ${String(request.generationProfile)}`);
  }
  if (typeof request.prompt !== "string" || request.prompt.trim().length === 0) {
    throw new TypeError("ACE generation requires a non-empty prompt");
  }
  if (request.prompt.length > 512) {
    throw new RangeError("ACE prompt cannot exceed 512 characters");
  }
  if (request.lyrics !== void 0 && typeof request.lyrics !== "string") {
    throw new TypeError("ACE lyrics must be a string when supplied");
  }
  if (request.lyrics !== void 0 && request.lyrics.length > 4096) {
    throw new RangeError("ACE lyrics cannot exceed 4096 characters");
  }
  if (typeof request.instrumental !== "boolean") {
    throw new TypeError("ACE instrumental must be explicitly true or false");
  }
  if (!Number.isInteger(request.durationSeconds) || request.durationSeconds < ACE_MIN_DURATION_SECONDS || request.durationSeconds > ACE_MAX_DURATION_SECONDS) {
    throw new RangeError(
      `ACE durationSeconds must be an integer from ${ACE_MIN_DURATION_SECONDS} through ${ACE_MAX_DURATION_SECONDS}`
    );
  }
  if (!isAceSeed(request.seed)) {
    throw new TypeError("ACE generation requires a canonical 64-bit seed");
  }
  assertPlannerConfiguration(request.planner);
  if (request.metadata !== void 0) assertMusicMetadata(request.metadata);
}
function assertPlannerConfiguration(planner) {
  if (!isRecord(planner)) {
    throw new TypeError("ACE planner configuration is missing");
  }
  if (planner.mode === "disabled") {
    if (Object.keys(planner).some((key) => key !== "mode")) {
      throw new TypeError("Disabled planner configuration cannot contain hidden controls");
    }
    return;
  }
  if (planner.mode !== "enabled") {
    throw new TypeError("ACE planner mode must be enabled or disabled");
  }
  const allowed = new Set(PLANNER_CONFIGURATION_KEYS);
  if (Object.keys(planner).some((key) => !allowed.has(key))) {
    throw new TypeError("Enabled planner configuration contains unknown controls");
  }
  if (!isPositiveFinite(planner.temperature)) {
    throw new RangeError("Planner temperature must be positive and finite");
  }
  if (!isPositiveFinite(planner.guidanceScale) || planner.guidanceScale < 1) {
    throw new RangeError("Planner guidanceScale must be at least one");
  }
  if (!Number.isSafeInteger(planner.topK) || planner.topK < 0) {
    throw new RangeError("Planner topK must be a non-negative integer");
  }
  if (!isPositiveFinite(planner.topP) || planner.topP > 1) {
    throw new RangeError("Planner topP must be in the interval (0, 1]");
  }
  if (planner.constrainedDecoding !== true || planner.generateSemanticCodes !== true || planner.negativePrompt !== "NO USER INPUT") {
    throw new TypeError("Planner constrained decoding contract is invalid");
  }
  if (!isRecord(planner.thinking) || planner.thinking.enabled !== true || typeof planner.thinking.useCotCaption !== "boolean" || typeof planner.thinking.useCotLanguage !== "boolean" || typeof planner.thinking.useCotMissingMetadata !== "boolean") {
    throw new TypeError("Planner thinking configuration must be fully resolved");
  }
  assertOnlyKeys(planner.thinking, PLANNER_THINKING_KEYS, "Planner thinking configuration");
}
function assertMusicMetadata(metadata) {
  if (!isRecord(metadata)) {
    throw new TypeError("ACE metadata must be an object");
  }
  assertOnlyKeys(metadata, MUSIC_METADATA_KEYS, "ACE metadata");
  const bpm = metadata.bpm;
  if (bpm !== void 0 && (typeof bpm !== "number" || !Number.isSafeInteger(bpm) || bpm < 30 || bpm > 300)) {
    throw new RangeError(
      "ACE metadata bpm must be an integer in the interval [30, 300]"
    );
  }
  for (const [label, value] of [
    ["keyScale", metadata.keyScale],
    ["timeSignature", metadata.timeSignature],
    ["vocalLanguage", metadata.vocalLanguage]
  ]) {
    if (value !== void 0 && typeof value !== "string") {
      throw new TypeError(`ACE metadata ${label} must be a string`);
    }
  }
}
function isPositiveFinite(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function assertOnlyKeys(value, allowedKeys, label) {
  const allowed = new Set(allowedKeys);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new TypeError(`${label} contains unknown controls`);
  }
}

// qa/fluid-audio/packages/acestep/src/runtime/diagnostics.ts
var ACE_SOURCE_REVISION = "6d467e4b5081ccb0abf1ec1bf4fdf9051a2d34b0";
var ACE_PLANNER_SOURCE_REVISION = "148d8ea0225bdab342ee1ae3a354275ccd60ca80";
var PARAKEET_REFERENCE_REVISION = "7ee112738262a6f5a0efd2f150748a4087432fbb";

// qa/fluid-audio/packages/acestep/src/model/graph-contract.ts
var ACE_LATENT_RATE_HZ = 25;
var ACE_SEMANTIC_RATE_HZ = 5;
var ACE_VAE_TEMPORAL_STRIDE = 1920;
var ACE_DIT_PATCH_SIZE = 2;
var ACE_AUDIO_ACOUSTIC_CHANNELS = 64;
var ACE_CONTEXT_CHANNELS = 128;
var ACE_DIT_INPUT_CHANNELS = 192;
var ACE_DIT_LAYER_TYPES = Object.freeze(
  Array.from(
    { length: 24 },
    (_, index) => index % 2 === 0 ? "sliding_attention" : "full_attention"
  )
);
var ACE_GRAPH_CONTRACT = Object.freeze({
  id: "ace-step-1.5-turbo-graph-v1",
  source: Object.freeze({
    aceRepositoryRevision: ACE_SOURCE_REVISION,
    plannerModelRevision: ACE_PLANNER_SOURCE_REVISION
  }),
  timing: Object.freeze({
    sampleRateHz: ACE_SAMPLE_RATE_HZ,
    latentRateHz: ACE_LATENT_RATE_HZ,
    semanticRateHz: ACE_SEMANTIC_RATE_HZ,
    vaeTemporalStride: ACE_VAE_TEMPORAL_STRIDE
  }),
  dit: Object.freeze({
    hiddenSize: 2048,
    intermediateSize: 6144,
    layerCount: 24,
    attentionHeads: 16,
    keyValueHeads: 8,
    headDimension: 128,
    queryHeadsPerKeyValueHead: 2,
    rmsNormEpsilon: 1e-6,
    attentionBias: false,
    inputChannels: ACE_DIT_INPUT_CHANNELS,
    audioChannels: ACE_AUDIO_ACOUSTIC_CHANNELS,
    contextChannels: ACE_CONTEXT_CHANNELS,
    patchSize: ACE_DIT_PATCH_SIZE,
    slidingWindowRadius: 128,
    maximumSlidingKeys: 257,
    ropeTheta: 1e6,
    maximumPositionEmbeddings: 32768,
    layerTypes: ACE_DIT_LAYER_TYPES,
    denoisingEvaluations: 8
  }),
  conditioner: Object.freeze({
    hiddenSize: 2048,
    intermediateSize: 6144,
    textInputSize: 1024,
    timbreInputSize: 64,
    lyricLayerCount: 8,
    timbreLayerCount: 4,
    poolerLayerCount: 2,
    poolWindowSize: 5,
    fsqDimension: 2048,
    fsqLevels: Object.freeze([8, 8, 8, 5, 5, 5]),
    fsqQuantizerCount: 1
  }),
  textEncoder: Object.freeze({
    hiddenSize: 1024,
    intermediateSize: 3072,
    layerCount: 28,
    attentionHeads: 16,
    keyValueHeads: 8,
    headDimension: 128,
    vocabularySize: 151669,
    maximumPositionEmbeddings: 32768,
    ropeTheta: 1e6
  }),
  planner: Object.freeze({
    hiddenSize: 1024,
    intermediateSize: 3072,
    layerCount: 28,
    attentionHeads: 16,
    keyValueHeads: 8,
    headDimension: 128,
    vocabularySize: 217204,
    maximumPositionEmbeddings: 40960,
    ropeTheta: 1e6
  }),
  vae: Object.freeze({
    audioChannels: 2,
    decoderInputChannels: 64,
    decoderChannels: 128,
    channelMultiples: Object.freeze([1, 2, 4, 8, 16]),
    downsamplingRatios: Object.freeze([2, 4, 4, 6, 10]),
    samplingRateHz: ACE_SAMPLE_RATE_HZ
  }),
  tensorPayloadBytes: Object.freeze({
    planner: 1325768704,
    textEncoder: 1191553024,
    conditionEncoder: 1216735232,
    semanticDetokenizer: 210023552,
    fsqOutputProjection: 28672,
    dit: 3150917760,
    vae: 337583104,
    silenceLatent: 384e4,
    total: 7436450048
  })
});
function deriveAceDurationGraphShape(durationSeconds) {
  if (!Number.isSafeInteger(durationSeconds) || durationSeconds < ACE_MIN_DURATION_SECONDS || durationSeconds > ACE_MAX_DURATION_SECONDS) {
    throw new RangeError(
      `ACE duration must be an integer from ${ACE_MIN_DURATION_SECONDS} through ${ACE_MAX_DURATION_SECONDS} seconds`
    );
  }
  const latentFrames = durationSeconds * ACE_LATENT_RATE_HZ;
  const latentPaddingFrames = latentFrames % ACE_DIT_PATCH_SIZE;
  const paddedLatentFrames = latentFrames + latentPaddingFrames;
  const audioFramesPerChannel = latentFrames * ACE_VAE_TEMPORAL_STRIDE;
  return Object.freeze({
    durationSeconds,
    latentFrames,
    paddedLatentFrames,
    latentPaddingFrames,
    ditTokens: paddedLatentFrames / ACE_DIT_PATCH_SIZE,
    semanticCodes: durationSeconds * ACE_SEMANTIC_RATE_HZ,
    audioFramesPerChannel,
    audioFloat32Bytes: audioFramesPerChannel * 2 * Float32Array.BYTES_PER_ELEMENT
  });
}

// qa/fluid-audio/packages/acestep/src/runtime/stages.ts
var ACE_INITIALIZATION_STAGES = [
  "webgpu",
  "storage",
  "manifest",
  "weights",
  "tokenizers",
  "wasm",
  "ready"
];
var ACE_GENERATION_STAGES = [
  "prepare",
  "semantic-planner",
  "text-encoder",
  "semantic-detokenizer",
  "condition-encoder",
  "release-conditioning",
  "dit-load",
  "dit-denoise",
  "release-dit",
  "vae-load",
  "vae-decode",
  "wav-encode",
  "cleanup",
  "done"
];
var PLANNER_DISABLED_STAGES = ACE_GENERATION_STAGES.filter(
  (stage) => stage !== "semantic-planner"
);
function isAceInitializationStage(value) {
  return typeof value === "string" && ACE_INITIALIZATION_STAGES.includes(value);
}
function isAceGenerationStage(value) {
  return typeof value === "string" && ACE_GENERATION_STAGES.includes(value);
}
function isAceProgressUnit(value) {
  return value === "bytes" || value === "items" || value === "tokens" || value === "planner-steps" || value === "transformer-blocks" || value === "denoising-evaluations" || value === "vae-chunks" || value === "audio-frames";
}
function isAceGenerationProgress(value) {
  if (!isRecord2(value) || !hasOnlyKeys(value, [
    "stage",
    "completedUnits",
    "totalUnits",
    "unit",
    "overallFraction",
    "elapsedMs",
    "message",
    "stageIndex",
    "stageCount"
  ])) {
    return false;
  }
  try {
    assertProgressNumbers(
      value.completedUnits,
      value.totalUnits,
      value.overallFraction,
      value.elapsedMs
    );
  } catch {
    return false;
  }
  return isAceGenerationStage(value.stage) && isAceProgressUnit(value.unit) && isNonNegativeInteger(value.stageIndex) && isNonNegativeInteger(value.stageCount) && value.stageCount > 0 && value.stageIndex < value.stageCount && (value.message === void 0 || typeof value.message === "string");
}
function isAceInitializationProgress(value) {
  if (!isRecord2(value) || !hasOnlyKeys(value, [
    "stage",
    "completedUnits",
    "totalUnits",
    "unit",
    "overallFraction",
    "elapsedMs",
    "message"
  ])) {
    return false;
  }
  try {
    assertProgressNumbers(
      value.completedUnits,
      value.totalUnits,
      value.overallFraction,
      value.elapsedMs
    );
  } catch {
    return false;
  }
  return isAceInitializationStage(value.stage) && isAceProgressUnit(value.unit) && (value.message === void 0 || typeof value.message === "string");
}
function assertProgressNumbers(completedUnits, totalUnits, overallFraction, elapsedMs) {
  if (!isNonNegativeFinite(completedUnits) || !isNonNegativeFinite(totalUnits) || completedUnits > totalUnits || !isUnitFraction(overallFraction) || !isNonNegativeFinite(elapsedMs)) {
    throw new RangeError("Progress contains invalid numeric fields");
  }
}
function isUnitFraction(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}
function isNonNegativeFinite(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
function isNonNegativeInteger(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasOnlyKeys(value, allowed) {
  const keySet = new Set(allowed);
  return Object.keys(value).every((key) => keySet.has(key));
}

// qa/fluid-audio/packages/acestep/src/model/manifest.ts
var ACE_PORTABLE_STORAGE_BINDING_BYTES = 128 * 1024 * 1024;
var ACE_MAX_WEIGHT_SHARD_BYTES = 120 * 1024 * 1024;
var ACE_PACKAGE_CONVERTER_REVISION = 4;
var ACE_EXPERIMENTAL_VAE_PACKAGE_CONVERTER_REVISION = 6;
var ACE_OPT_0054_EXPERIMENTAL_VAE_PACKAGE_CONVERTER_REVISION = 7;
var ACE_EXPERIMENTAL_VAE_LOGICAL_TENSOR_COUNT = 145;
var ACE_DIT_GEMM_TILE_LAYOUT = "dit-gemm-n128-k32-tile-major-v1";
var ACE_DIT_GEMM_PACKED_BF16_TRANSFORMATION = "preserve-bf16-bits-dit-gemm-n128-k32-tile-major-v1";
var ACE_DIT_GEMM_FP16_TRANSFORMATION = "bf16-to-ieee-fp16-dit-gemm-n128-k32-tile-major-v1";
var ACE_DIT_DENSE_FP16_TILE_LAYOUT = "dit-gemm-n256-k32-tile-major-v1";
var ACE_DIT_DENSE_FP16_TRANSFORMATION = "bf16-to-ieee-fp16-dit-gemm-n256-k32-tile-major-v1";
var ACE_DIT_DENSE_INT8_TILE_LAYOUT = "dit-gemm-n256-k32-int8-fp16-scale-tile-major-v1";
var ACE_DIT_DENSE_INT8_TRANSFORMATION = "bf16-to-symmetric-int8-fp16-scale-n256-k32-tile-major-v1";
var ACE_DIT_DENSE_K4_FP16_LAYOUT = "dit-gemm-n128-k4-output4-lane32-k4-v1";
var ACE_DIT_DENSE_K4_FP16_TRANSFORMATION = "bf16-to-ieee-fp16-dit-gemm-n128-k4-output4-lane32-k4-v1";
var ACE_VAE_CONV1D_LAYOUT = "conv1d-output-kernel-input-f32-v1";
var ACE_VAE_CONV_TRANSPOSE1D_LAYOUT = "conv-transpose1d-output-kernel-input-f32-v1";
var ACE_VAE_CHANNEL_VECTOR_LAYOUT = "channel-vector-f32-v1";
var ACE_VAE_CONV1D_FP16_LAYOUT = "conv1d-output-kernel-input-f16-v1";
var ACE_VAE_CONV_TRANSPOSE1D_FP16_LAYOUT = "conv-transpose1d-output-kernel-input-f16-v1";
var ACE_VAE_K1_FP16_TILE_LAYOUT = "conv1d-k1-cout128-cin32-tile-major-f16-v1";
var ACE_VAE_CONV_TRANSPOSE1D_FP16_POLYPHASE_LAYOUT = "conv-transpose1d-phase-tap-input-output-f16-v1";
var ACE_VAE_K7_ROW_REUSE_FP16_LAYOUT = "k7-cin4-cout-band64-lane32-output2-cin-element4";
var ACE_VAE_CONV_TRANSPOSE1D_K4_FP16_LAYOUT = "ace-opt-0048-phase-tap-cin4-cout-tile-lane-output-k4-f16-v1";
var ACE_VAE_CHANNEL_VECTOR_FP16_LAYOUT = "channel-vector-f16-v1";
var ACE_VAE_CONV1D_TRANSFORMATION = "weightnorm-fused-fp32-pairwise-oik-to-oki-v1";
var ACE_VAE_CONV_TRANSPOSE1D_TRANSFORMATION = "weightnorm-fused-fp32-pairwise-iok-to-oki-v1";
var ACE_VAE_CHANNEL_VECTOR_TRANSFORMATION = "bf16-to-fp32-flatten-1-c-1-to-c-v1";
var ACE_VAE_CONV1D_FP16_TRANSFORMATION = "weightnorm-fused-fp32-pairwise-oik-to-oki-ieee-fp16-v1";
var ACE_VAE_CONV_TRANSPOSE1D_FP16_TRANSFORMATION = "weightnorm-fused-fp32-pairwise-iok-to-oki-ieee-fp16-v1";
var ACE_VAE_K1_FP16_TILE_TRANSFORMATION = "weightnorm-fused-fp32-pairwise-oik-to-k1-cout128-cin32-tile-major-ieee-fp16-v1";
var ACE_VAE_CONV_TRANSPOSE1D_FP16_POLYPHASE_TRANSFORMATION = "weightnorm-fused-fp32-pairwise-iok-to-phase-tap-input-output-ieee-fp16-v1";
var ACE_VAE_K7_ROW_REUSE_FP16_TRANSFORMATION = "weightnorm-fused-fp32-pairwise-oik-to-k7-cin4-cout-band64-lane32-output2-cin-element4-ieee-fp16-v1";
var ACE_VAE_CONV_TRANSPOSE1D_K4_FP16_TRANSFORMATION = "weightnorm-fused-fp32-pairwise-iok-to-phase-tap-cin4-cout-tile-lane-output-k4-ieee-fp16-v1";
var ACE_VAE_CHANNEL_VECTOR_FP16_TRANSFORMATION = "bf16-to-fp32-flatten-1-c-1-to-c-ieee-fp16-v1";
var ACE_VAE_REVISION7_K7_ROW_REUSE_CONTRACTS = Object.freeze([
  { operationLabel: "block-0-res-1-conv1", tensor: "vae.decoder.block.0.res_unit1.conv1.weight", channels: 1024, dilation: 1 },
  { operationLabel: "block-0-res-2-conv1", tensor: "vae.decoder.block.0.res_unit2.conv1.weight", channels: 1024, dilation: 3 },
  { operationLabel: "block-0-res-3-conv1", tensor: "vae.decoder.block.0.res_unit3.conv1.weight", channels: 1024, dilation: 9 },
  { operationLabel: "block-1-res-1-conv1", tensor: "vae.decoder.block.1.res_unit1.conv1.weight", channels: 512, dilation: 1 },
  { operationLabel: "block-1-res-2-conv1", tensor: "vae.decoder.block.1.res_unit2.conv1.weight", channels: 512, dilation: 3 },
  { operationLabel: "block-1-res-3-conv1", tensor: "vae.decoder.block.1.res_unit3.conv1.weight", channels: 512, dilation: 9 },
  { operationLabel: "block-3-res-1-conv1", tensor: "vae.decoder.block.3.res_unit1.conv1.weight", channels: 128, dilation: 1 },
  { operationLabel: "block-3-res-2-conv1", tensor: "vae.decoder.block.3.res_unit2.conv1.weight", channels: 128, dilation: 3 },
  { operationLabel: "block-3-res-3-conv1", tensor: "vae.decoder.block.3.res_unit3.conv1.weight", channels: 128, dilation: 9 },
  { operationLabel: "block-4-res-1-conv1", tensor: "vae.decoder.block.4.res_unit1.conv1.weight", channels: 128, dilation: 1 },
  { operationLabel: "block-4-res-2-conv1", tensor: "vae.decoder.block.4.res_unit2.conv1.weight", channels: 128, dilation: 3 },
  { operationLabel: "block-4-res-3-conv1", tensor: "vae.decoder.block.4.res_unit3.conv1.weight", channels: 128, dilation: 9 }
]);
var ACE_VAE_REVISION7_TRANSPOSE_K4_CONTRACTS = Object.freeze([
  { operationLabel: "block-1-conv-t1", tensor: "vae.decoder.block.1.conv_t1.weight", inputChannels: 1024, outputChannels: 512, stride: 6, reuseAxis: "channel" },
  { operationLabel: "block-2-conv-t1", tensor: "vae.decoder.block.2.conv_t1.weight", inputChannels: 512, outputChannels: 256, stride: 4, reuseAxis: "channel" },
  { operationLabel: "block-3-conv-t1", tensor: "vae.decoder.block.3.conv_t1.weight", inputChannels: 256, outputChannels: 128, stride: 4, reuseAxis: "row" },
  { operationLabel: "block-4-conv-t1", tensor: "vae.decoder.block.4.conv_t1.weight", inputChannels: 128, outputChannels: 128, stride: 2, reuseAxis: "row" }
]);
var SOURCE_BASE_KEYS = [
  "key",
  "component",
  "repository",
  "revision",
  "path",
  "byteLength",
  "sha256"
];
var SOURCE_TENSOR_KEYS = [
  ...SOURCE_BASE_KEYS,
  "tensorCount",
  "parameterCount",
  "headerLength",
  "headerSha256",
  "inventorySha256"
];
var TENSOR_PHASES = /* @__PURE__ */ new Set([
  "planner",
  "text",
  "conditioner",
  "semantic",
  "dit",
  "vae",
  "constants"
]);
var TENSOR_LIFETIMES = /* @__PURE__ */ new Set([
  ...TENSOR_PHASES,
  "initial-latent"
]);
var NATIVE_LAYOUT_BY_TRANSFORMATION = {
  [ACE_DIT_GEMM_PACKED_BF16_TRANSFORMATION]: ACE_DIT_GEMM_TILE_LAYOUT,
  [ACE_DIT_GEMM_FP16_TRANSFORMATION]: ACE_DIT_GEMM_TILE_LAYOUT,
  [ACE_DIT_DENSE_FP16_TRANSFORMATION]: ACE_DIT_DENSE_FP16_TILE_LAYOUT,
  [ACE_DIT_DENSE_INT8_TRANSFORMATION]: ACE_DIT_DENSE_INT8_TILE_LAYOUT,
  [ACE_DIT_DENSE_K4_FP16_TRANSFORMATION]: ACE_DIT_DENSE_K4_FP16_LAYOUT,
  [ACE_VAE_CONV1D_TRANSFORMATION]: ACE_VAE_CONV1D_LAYOUT,
  [ACE_VAE_CONV_TRANSPOSE1D_TRANSFORMATION]: ACE_VAE_CONV_TRANSPOSE1D_LAYOUT,
  [ACE_VAE_CHANNEL_VECTOR_TRANSFORMATION]: ACE_VAE_CHANNEL_VECTOR_LAYOUT,
  [ACE_VAE_CONV1D_FP16_TRANSFORMATION]: ACE_VAE_CONV1D_FP16_LAYOUT,
  [ACE_VAE_CONV_TRANSPOSE1D_FP16_TRANSFORMATION]: ACE_VAE_CONV_TRANSPOSE1D_FP16_LAYOUT,
  [ACE_VAE_K1_FP16_TILE_TRANSFORMATION]: ACE_VAE_K1_FP16_TILE_LAYOUT,
  [ACE_VAE_CONV_TRANSPOSE1D_FP16_POLYPHASE_TRANSFORMATION]: ACE_VAE_CONV_TRANSPOSE1D_FP16_POLYPHASE_LAYOUT,
  [ACE_VAE_K7_ROW_REUSE_FP16_TRANSFORMATION]: ACE_VAE_K7_ROW_REUSE_FP16_LAYOUT,
  [ACE_VAE_CONV_TRANSPOSE1D_K4_FP16_TRANSFORMATION]: ACE_VAE_CONV_TRANSPOSE1D_K4_FP16_LAYOUT,
  [ACE_VAE_CHANNEL_VECTOR_FP16_TRANSFORMATION]: ACE_VAE_CHANNEL_VECTOR_FP16_LAYOUT
};
function buildRevision7VaeRuntimeShapes() {
  const shapes = /* @__PURE__ */ new Map();
  const blockChannels = [1024, 512, 256, 128, 128];
  const blockInputs = [2048, 1024, 512, 256, 128];
  const transposeKernels = [20, 12, 8, 8, 4];
  shapes.set("vae-weights:decoder.conv1.weight_v", [2048, 7, 64]);
  shapes.set("vae-weights:decoder.conv2.weight_v", [2, 7, 128]);
  shapes.set("vae-weights:decoder.conv1.bias", [2048]);
  for (let block = 0; block < blockChannels.length; block += 1) {
    const channels = blockChannels[block];
    shapes.set(
      `vae-weights:decoder.block.${block}.conv_t1.weight_v`,
      [channels, transposeKernels[block], blockInputs[block]]
    );
    shapes.set(`vae-weights:decoder.block.${block}.conv_t1.bias`, [channels]);
    for (let residual = 1; residual <= 3; residual += 1) {
      shapes.set(
        `vae-weights:decoder.block.${block}.res_unit${residual}.conv1.weight_v`,
        [channels, 7, channels]
      );
      shapes.set(
        `vae-weights:decoder.block.${block}.res_unit${residual}.conv2.weight_v`,
        [channels, 1, channels]
      );
      for (const convolution of [1, 2]) {
        shapes.set(
          `vae-weights:decoder.block.${block}.res_unit${residual}.conv${convolution}.bias`,
          [channels]
        );
      }
      for (const snake of [1, 2]) {
        for (const parameter of ["alpha", "beta"]) {
          shapes.set(
            `vae-weights:decoder.block.${block}.res_unit${residual}.snake${snake}.${parameter}`,
            [channels]
          );
        }
      }
    }
    for (const parameter of ["alpha", "beta"]) {
      shapes.set(
        `vae-weights:decoder.block.${block}.snake1.${parameter}`,
        [blockInputs[block]]
      );
    }
  }
  for (const parameter of ["alpha", "beta"]) {
    shapes.set(`vae-weights:decoder.snake1.${parameter}`, [128]);
  }
  if (shapes.size !== ACE_EXPERIMENTAL_VAE_LOGICAL_TENSOR_COUNT) {
    throw new Error(`revision-7 VAE contract has ${shapes.size} tensors`);
  }
  return shapes;
}
var VAE_REVISION7_RUNTIME_SHAPES_BY_SOURCE = buildRevision7VaeRuntimeShapes();
var VAE_REVISION7_ROW_REUSE_TENSORS = new Set(
  ACE_VAE_REVISION7_K7_ROW_REUSE_CONTRACTS.map((contract) => contract.tensor)
);
var VAE_REVISION7_TRANSPOSE_K4_TENSORS = new Map(
  ACE_VAE_REVISION7_TRANSPOSE_K4_CONTRACTS.map((contract) => [
    contract.tensor,
    contract.reuseAxis
  ])
);

// qa/fluid-audio/packages/acestep/src/model/sha256.ts
var INITIAL_STATE = new Uint32Array([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);
var ROUND_CONSTANTS = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var BLOCK_BYTES = 64;
var AceIncrementalSha256 = class {
  state = INITIAL_STATE.slice();
  pending = new Uint8Array(BLOCK_BYTES);
  schedule = new Uint32Array(64);
  pendingBytes = 0;
  totalBytes = 0;
  finalized = false;
  update(data) {
    if (this.finalized) throw new Error("SHA-256 digest is already finalized");
    if (data.byteLength === 0) return this;
    this.totalBytes += data.byteLength;
    if (!Number.isSafeInteger(this.totalBytes)) {
      throw new RangeError("SHA-256 input exceeds the safe integer range");
    }
    let offset = 0;
    if (this.pendingBytes > 0) {
      const copied = Math.min(BLOCK_BYTES - this.pendingBytes, data.byteLength);
      this.pending.set(data.subarray(0, copied), this.pendingBytes);
      this.pendingBytes += copied;
      offset += copied;
      if (this.pendingBytes === BLOCK_BYTES) {
        this.compress(this.pending, 0);
        this.pendingBytes = 0;
      }
    }
    while (offset + BLOCK_BYTES <= data.byteLength) {
      this.compress(data, offset);
      offset += BLOCK_BYTES;
    }
    if (offset < data.byteLength) {
      const trailing = data.subarray(offset);
      this.pending.set(trailing);
      this.pendingBytes = trailing.byteLength;
    }
    return this;
  }
  digestHex() {
    if (this.finalized) throw new Error("SHA-256 digest is already finalized");
    this.finalized = true;
    this.pending[this.pendingBytes] = 128;
    this.pending.fill(0, this.pendingBytes + 1);
    if (this.pendingBytes >= 56) {
      this.compress(this.pending, 0);
      this.pending.fill(0);
    }
    const bitLength = this.totalBytes * 8;
    const view = new DataView(this.pending.buffer);
    view.setUint32(56, Math.floor(bitLength / 4294967296), false);
    view.setUint32(60, bitLength >>> 0, false);
    this.compress(this.pending, 0);
    let result = "";
    for (const word of this.state) {
      result += word.toString(16).padStart(8, "0");
    }
    return result;
  }
  compress(bytes, offset) {
    const words = this.schedule;
    for (let index = 0; index < 16; index += 1) {
      const start = offset + index * 4;
      words[index] = (bytes[start] << 24 | bytes[start + 1] << 16 | bytes[start + 2] << 8 | bytes[start + 3]) >>> 0;
    }
    for (let index = 16; index < 64; index += 1) {
      const x = words[index - 15];
      const y = words[index - 2];
      const sigma0 = rotateRight(x, 7) ^ rotateRight(x, 18) ^ x >>> 3;
      const sigma1 = rotateRight(y, 17) ^ rotateRight(y, 19) ^ y >>> 10;
      words[index] = words[index - 16] + sigma0 + words[index - 7] + sigma1 >>> 0;
    }
    let a = this.state[0];
    let b = this.state[1];
    let c = this.state[2];
    let d = this.state[3];
    let e = this.state[4];
    let f = this.state[5];
    let g = this.state[6];
    let h = this.state[7];
    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = e & f ^ ~e & g;
      const first = h + sum1 + choice + ROUND_CONSTANTS[index] + words[index] >>> 0;
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = a & b ^ a & c ^ b & c;
      const second = sum0 + majority >>> 0;
      h = g;
      g = f;
      f = e;
      e = d + first >>> 0;
      d = c;
      c = b;
      b = a;
      a = first + second >>> 0;
    }
    this.state[0] = this.state[0] + a >>> 0;
    this.state[1] = this.state[1] + b >>> 0;
    this.state[2] = this.state[2] + c >>> 0;
    this.state[3] = this.state[3] + d >>> 0;
    this.state[4] = this.state[4] + e >>> 0;
    this.state[5] = this.state[5] + f >>> 0;
    this.state[6] = this.state[6] + g >>> 0;
    this.state[7] = this.state[7] + h >>> 0;
  }
};
function aceSha256Hex(bytes) {
  return new AceIncrementalSha256().update(bytes).digestHex();
}
function rotateRight(value, bits) {
  return (value >>> bits | value << 32 - bits) >>> 0;
}

// qa/fluid-audio/packages/acestep/src/model/package.ts
var ACE_MAX_MANIFEST_BYTES = 2 * 1024 * 1024;
var ACE_MODEL_TRANSPORT_CHUNK_BYTES = 4 * 1024 * 1024;
var ACE_REFERENCE_MANIFEST_SHA256 = "18f36c6420976475af65ecd833ca56c6119706322ce54120389d4915d8e80db6";
var ACE_OPT_0054_VAE_REVISION7_MANIFEST_SHA256 = "36a54d79777d6826088095ba6ebc028fb4bea546368c0f0a29cd0eee8d656da7";
var ACE_OPT_0054_VAE_REVISION7_MANIFEST_BYTES = 716185;

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/correctness-utils.ts
var ACE_CORRECTNESS_WORKGROUP_SIZE = 256;
var ACE_MAX_DISPATCH_DIMENSION = 65535;
function planAceLinearDispatch(elements, operation) {
  requirePositiveSafeInteger(elements, `${operation} elements`);
  if (elements > 4294967295) {
    throw new RangeError(`${operation} exceeds WGSL's u32 indexing domain`);
  }
  const totalWorkgroups = Math.ceil(elements / ACE_CORRECTNESS_WORKGROUP_SIZE);
  const workgroupsX = Math.min(totalWorkgroups, ACE_MAX_DISPATCH_DIMENSION);
  const workgroupsY = Math.ceil(totalWorkgroups / workgroupsX);
  if (workgroupsY > ACE_MAX_DISPATCH_DIMENSION) {
    throw new RangeError(`${operation} exceeds the portable 2D dispatch domain`);
  }
  return Object.freeze({ elements, workgroupsX, workgroupsY });
}
function checkedAceProduct(values, label) {
  let result = 1;
  for (const value of values) {
    requirePositiveSafeInteger(value, label);
    result *= value;
    if (!Number.isSafeInteger(result)) {
      throw new RangeError(`${label} element count is not a safe integer`);
    }
  }
  return result;
}
function requirePositiveSafeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive safe integer`);
  }
}
function requireNonNegativeSafeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer`);
  }
}
function requireAceU32(value, label) {
  requireNonNegativeSafeInteger(value, label);
  if (value > 4294967295) {
    throw new RangeError(`${label} exceeds WGSL's u32 domain`);
  }
}

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/vae-primitives.ts
var FLOAT32_BYTES = Float32Array.BYTES_PER_ELEMENT;
function planAceVaeConv1d(shape) {
  validateConvShape(shape, "Conv1d");
  const effectiveKernel = shape.dilation * (shape.kernelSize - 1) + 1;
  const numerator = shape.inputFrames + 2 * shape.padding - effectiveKernel;
  if (numerator < 0) {
    throw new RangeError("ACE VAE Conv1d kernel exceeds its padded input");
  }
  const outputFrames = Math.floor(numerator / shape.stride) + 1;
  return makeConvPlan(shape, outputFrames, 0);
}
function planAceVaeConvTranspose1d(shape) {
  validateConvShape(shape, "ConvTranspose1d");
  if (!Number.isSafeInteger(shape.outputPadding) || shape.outputPadding < 0 || shape.outputPadding >= shape.stride) {
    throw new RangeError(
      "ACE VAE ConvTranspose1d output padding must be an integer below stride"
    );
  }
  const outputFrames = (shape.inputFrames - 1) * shape.stride - 2 * shape.padding + shape.dilation * (shape.kernelSize - 1) + shape.outputPadding + 1;
  if (!Number.isSafeInteger(outputFrames) || outputFrames <= 0) {
    throw new RangeError("ACE VAE ConvTranspose1d has no output frames");
  }
  return makeConvPlan(shape, outputFrames, shape.outputPadding);
}
function makeConvPlan(shape, outputFrames, outputPadding) {
  const inputElements = checkedAceProduct(
    [shape.batch, shape.inputFrames, shape.inputChannels],
    "ACE VAE convolution input"
  );
  const weightElements = checkedAceProduct(
    [shape.outputChannels, shape.kernelSize, shape.inputChannels],
    "ACE VAE convolution weight"
  );
  const outputElements = checkedAceProduct(
    [shape.batch, outputFrames, shape.outputChannels],
    "ACE VAE convolution output"
  );
  const dispatch = planAceLinearDispatch(
    outputElements,
    "ACE VAE convolution"
  );
  return Object.freeze({
    ...shape,
    outputFrames,
    outputPadding,
    inputElements,
    weightElements,
    outputElements,
    workgroupsX: dispatch.workgroupsX,
    workgroupsY: dispatch.workgroupsY
  });
}
function validateConvShape(shape, operation) {
  for (const [name, value] of Object.entries({
    batch: shape.batch,
    inputFrames: shape.inputFrames,
    inputChannels: shape.inputChannels,
    outputChannels: shape.outputChannels,
    kernelSize: shape.kernelSize,
    stride: shape.stride,
    dilation: shape.dilation
  })) {
    requirePositiveSafeInteger(value, `ACE VAE ${operation} ${name}`);
  }
  if (!Number.isSafeInteger(shape.padding) || shape.padding < 0) {
    throw new RangeError(
      `ACE VAE ${operation} padding must be a non-negative safe integer`
    );
  }
}

// qa/fluid-audio/packages/acestep/src/webgpu/vae-decoder.ts
var FLOAT32_BYTES2 = Float32Array.BYTES_PER_ELEMENT;
var WORKSPACE_COUNT = 3;
var ACE_VAE_DEFAULT_QUANTUM_WORK_POLICY = Object.freeze({
  maximumConvolutionMultiplyAccumulates: 234881024,
  maximumOutputElements: 1048576
});
var ACE_OOBLECK_DECODER_CONFIG = Object.freeze({
  id: "ace-step-1.5-oobleck-decoder-v1",
  decoderInputChannels: 64,
  decoderChannels: 128,
  audioChannels: 2,
  channelMultiples: Object.freeze([1, 2, 4, 8, 16]),
  downsamplingRatios: Object.freeze([2, 4, 4, 6, 10]),
  sampleRateHz: 48e3
});
function planAceVaeDecoderQuanta(plan, transposeParts = {}, requestedPolicy = ACE_VAE_DEFAULT_QUANTUM_WORK_POLICY) {
  const quantumWorkPolicy = snapshotAceVaeDecoderQuantumWorkPolicy(
    requestedPolicy
  );
  requirePositiveSafeInteger(
    quantumWorkPolicy.maximumOutputElements,
    "ACE VAE quantum maximum output elements"
  );
  if (quantumWorkPolicy.maximumOutputElements > 4294967295) {
    throw new RangeError(
      "ACE VAE quantum maximum output elements exceed WGSL's u32 domain"
    );
  }
  const transposeNames = new Set(
    plan.operations.filter((operation) => operation.kind === "conv-transpose1d").map((operation) => operation.weight)
  );
  const unexpectedParts = Object.keys(transposeParts).filter((name) => !transposeNames.has(name));
  if (unexpectedParts.length > 0) {
    throw new Error(
      `ACE VAE quantum plan has parts for non-transpose tensors: ${unexpectedParts.sort().join(", ")}`
    );
  }
  const quanta = [];
  let controlRecordIndex = 0;
  for (const [operationIndex, operation] of plan.operations.entries()) {
    const outputElements = decoderOperationOutputElements(operation);
    let operationQuantumIndex = 0;
    if (operation.kind === "conv-transpose1d") {
      const outputChannels2 = operation.shape.outputChannels;
      const maximumTapsPerOutput = maximumCongruentTransposeTaps(
        operation.shape
      );
      const maximumMacsPerOutput2 = checkedAceProduct(
        [maximumTapsPerOutput, operation.shape.inputChannels],
        `${operation.label} maximum MACs per output`
      );
      const maximumMacsPerRow = checkedAceProduct(
        [outputChannels2, maximumMacsPerOutput2],
        `${operation.label} maximum MACs per output row`
      );
      const rowsPerQuantum = Math.min(
        Math.floor(
          quantumWorkPolicy.maximumOutputElements / outputChannels2
        ),
        Math.floor(
          quantumWorkPolicy.maximumConvolutionMultiplyAccumulates / maximumMacsPerRow
        )
      );
      if (rowsPerQuantum < 1) {
        throw new RangeError(
          `ACE VAE quantum work policy cannot hold one complete ${operation.label} output row (${outputChannels2} elements, ${maximumMacsPerRow} maximum multiply-accumulates)`
        );
      }
      const parts = validateQuantumPartGeometry(
        operation.weight,
        transposeParts[operation.weight] ?? [{
          partStart: 0,
          partEnd: outputChannels2
        }],
        outputChannels2
      );
      const outputRows = checkedAceProduct(
        [operation.shape.batch, planAceVaeConvTranspose1d(operation.shape).outputFrames],
        `${operation.label} output rows`
      );
      for (let rowBase = 0; rowBase < outputRows; rowBase += rowsPerQuantum) {
        const rowCount = Math.min(rowsPerQuantum, outputRows - rowBase);
        const primitives = parts.map((part, physicalPartIndex) => {
          const partChannels = part.partEnd - part.partStart;
          return Object.freeze({
            controlRecordIndex: controlRecordIndex++,
            physicalPartIndex,
            firstOutputChannel: part.partStart,
            outputChannels: partChannels,
            outputBase: rowBase * partChannels,
            outputCount: rowCount * partChannels
          });
        });
        const logicalOutputBase = rowBase * outputChannels2;
        const logicalOutputCount = rowCount * outputChannels2;
        const estimatedMaximumMultiplyAccumulates = checkedAceProduct(
          [logicalOutputCount, maximumMacsPerOutput2],
          `${operation.label} quantum maximum MACs`
        );
        quanta.push(Object.freeze({
          index: quanta.length,
          id: vaeQuantumId(operationIndex, operation.label, operationQuantumIndex++),
          operationIndex,
          operationLabel: operation.label,
          operationKind: operation.kind,
          logicalOutputBase,
          logicalOutputCount,
          estimatedMaximumMultiplyAccumulates,
          primitives: Object.freeze(primitives)
        }));
      }
      continue;
    }
    const outputChannels = operation.kind === "conv1d" ? operation.shape.outputChannels : operation.shape.channels;
    const maximumMacsPerOutput = operation.kind === "conv1d" ? checkedAceProduct(
      [operation.shape.kernelSize, operation.shape.inputChannels],
      `${operation.label} maximum MACs per output`
    ) : 0;
    const outputElementsPerQuantum = operation.kind === "conv1d" ? Math.min(
      quantumWorkPolicy.maximumOutputElements,
      Math.floor(
        quantumWorkPolicy.maximumConvolutionMultiplyAccumulates / maximumMacsPerOutput
      )
    ) : quantumWorkPolicy.maximumOutputElements;
    if (outputElementsPerQuantum < 1) {
      throw new RangeError(
        `ACE VAE quantum work policy cannot hold one ${operation.label} output requiring ${maximumMacsPerOutput} maximum multiply-accumulates`
      );
    }
    for (let outputBase = 0; outputBase < outputElements; outputBase += outputElementsPerQuantum) {
      const outputCount = Math.min(
        outputElementsPerQuantum,
        outputElements - outputBase
      );
      const primitive = Object.freeze({
        controlRecordIndex: controlRecordIndex++,
        firstOutputChannel: 0,
        outputChannels,
        outputBase,
        outputCount
      });
      quanta.push(Object.freeze({
        index: quanta.length,
        id: vaeQuantumId(operationIndex, operation.label, operationQuantumIndex++),
        operationIndex,
        operationLabel: operation.label,
        operationKind: operation.kind,
        logicalOutputBase: outputBase,
        logicalOutputCount: outputCount,
        estimatedMaximumMultiplyAccumulates: operation.kind === "conv1d" ? checkedAceProduct(
          [outputCount, maximumMacsPerOutput],
          `${operation.label} quantum maximum MACs`
        ) : 0,
        primitives: Object.freeze([primitive])
      }));
    }
  }
  validatePlannedQuantumWork(quanta, quantumWorkPolicy);
  return Object.freeze({
    quantumWorkPolicy,
    quantumCount: quanta.length,
    primitiveDispatchCount: controlRecordIndex,
    quanta: Object.freeze(quanta)
  });
}
function snapshotAceVaeDecoderQuantumWorkPolicy(policy = ACE_VAE_DEFAULT_QUANTUM_WORK_POLICY) {
  const maximumConvolutionMultiplyAccumulates = policy.maximumConvolutionMultiplyAccumulates;
  const maximumOutputElements = policy.maximumOutputElements;
  requirePositiveSafeInteger(
    maximumConvolutionMultiplyAccumulates,
    "ACE VAE quantum maximum convolution multiply-accumulates"
  );
  requirePositiveSafeInteger(
    maximumOutputElements,
    "ACE VAE quantum maximum output elements"
  );
  return Object.freeze({
    maximumConvolutionMultiplyAccumulates,
    maximumOutputElements
  });
}
function validatePlannedQuantumWork(quanta, policy) {
  for (const quantum of quanta) {
    requirePositiveSafeInteger(
      quantum.logicalOutputCount,
      `${quantum.id} logical output count`
    );
    requireAceU32(quantum.logicalOutputBase, `${quantum.id} logical output base`);
    requireAceU32(
      quantum.logicalOutputBase + quantum.logicalOutputCount,
      `${quantum.id} logical output end`
    );
    if (quantum.logicalOutputCount > policy.maximumOutputElements) {
      throw new Error(`${quantum.id} exceeds its output-element work budget`);
    }
    if (!Number.isSafeInteger(quantum.estimatedMaximumMultiplyAccumulates) || quantum.estimatedMaximumMultiplyAccumulates < 0) {
      throw new Error(`${quantum.id} has an invalid convolution work estimate`);
    }
    if (quantum.estimatedMaximumMultiplyAccumulates > policy.maximumConvolutionMultiplyAccumulates) {
      throw new Error(`${quantum.id} exceeds its convolution-MAC work budget`);
    }
    for (const primitive of quantum.primitives) {
      requireAceU32(primitive.outputBase, `${quantum.id} primitive output base`);
      requirePositiveSafeInteger(
        primitive.outputCount,
        `${quantum.id} primitive output count`
      );
      requireAceU32(
        primitive.outputBase + primitive.outputCount,
        `${quantum.id} primitive output end`
      );
    }
  }
}
function maximumCongruentTransposeTaps(shape) {
  const outputFrames = planAceVaeConvTranspose1d(shape).outputFrames;
  const maximumKernelTime = (shape.kernelSize - 1) * shape.dilation;
  const maximumPaddedOutputTime = outputFrames - 1 + shape.padding;
  if (!isU32(shape.kernelSize) || !isU32(shape.stride) || !isU32(shape.dilation) || !isU32(shape.padding) || !isU32(shape.inputFrames) || !isU32(outputFrames) || !isU32(maximumKernelTime) || !isU32(maximumPaddedOutputTime)) {
    return shape.kernelSize;
  }
  const congruencePeriod = shape.stride / greatestCommonDivisor(
    shape.stride,
    shape.dilation
  );
  return Math.ceil(shape.kernelSize / congruencePeriod);
}
function isU32(value) {
  return Number.isSafeInteger(value) && value >= 0 && value <= 4294967295;
}
function greatestCommonDivisor(left, right) {
  let remainderLeft = left;
  let remainderRight = right;
  while (remainderRight !== 0) {
    const next = remainderLeft % remainderRight;
    remainderLeft = remainderRight;
    remainderRight = next;
  }
  return remainderLeft;
}
function decoderOperationOutputElements(operation) {
  switch (operation.kind) {
    case "conv1d":
      return planAceVaeConv1d(operation.shape).outputElements;
    case "conv-transpose1d":
      return planAceVaeConvTranspose1d(operation.shape).outputElements;
    case "snake":
    case "add":
      return checkedAceProduct(
        [operation.shape.batch, operation.shape.frames, operation.shape.channels],
        `${operation.label} output`
      );
  }
}
function validateQuantumPartGeometry(name, parts, logicalRows) {
  if (parts.length === 0) {
    throw new Error(`ACE VAE quantum tensor ${name} has no physical parts`);
  }
  let cursor = 0;
  const stable = [];
  for (const part of parts) {
    if (!Number.isSafeInteger(part.partStart) || !Number.isSafeInteger(part.partEnd) || part.partStart !== cursor || part.partEnd <= part.partStart || part.partEnd > logicalRows) {
      throw new RangeError(
        `ACE VAE quantum tensor ${name} parts must cover output channels contiguously in source order`
      );
    }
    stable.push(Object.freeze({ ...part }));
    cursor = part.partEnd;
  }
  if (cursor !== logicalRows) {
    throw new RangeError(
      `ACE VAE quantum tensor ${name} parts end at ${cursor}, expected ${logicalRows}`
    );
  }
  return Object.freeze(stable);
}
function vaeQuantumId(operationIndex, operationLabel, operationQuantumIndex) {
  return `operation-${operationIndex}-${operationLabel}-quantum-${operationQuantumIndex}`;
}
function planAceVaeDecoder(inputFrames, config = ACE_OOBLECK_DECODER_CONFIG, batch = 1) {
  validateDecoderConfig(config);
  requirePositiveSafeInteger(inputFrames, "ACE VAE decoder input frames");
  requirePositiveSafeInteger(batch, "ACE VAE decoder batch");
  const operations = [];
  const requiredTensors = /* @__PURE__ */ new Set();
  const workspaceSlots = [
    "workspace-0",
    "workspace-1",
    "workspace-2"
  ];
  let active = "input";
  let frames = inputFrames;
  let channels = config.decoderInputChannels;
  let maximumActivationElements = 0;
  let parameterElements = 0;
  const chooseWorkspace = (excluded) => {
    const selected = workspaceSlots.find((slot) => !excluded.has(slot));
    if (selected === void 0) {
      throw new Error("ACE VAE decoder liveness requires more than three workspaces");
    }
    return selected;
  };
  const recordOutput = (slot, elements) => {
    if (slot.startsWith("workspace-")) {
      maximumActivationElements = Math.max(maximumActivationElements, elements);
    }
  };
  const recordTensor = (name, elements) => {
    if (requiredTensors.has(name)) {
      throw new Error(`ACE VAE decoder tensor ${name} is consumed more than once`);
    }
    requiredTensors.add(name);
    parameterElements += elements;
    return name;
  };
  const appendConv = (operationLabel, prefix, inputSlot, outputSlot, shape, hasBias) => {
    const convPlan = planAceVaeConv1d(shape);
    const weight = recordTensor(
      `vae.${prefix}.weight`,
      convPlan.weightElements
    );
    const bias = hasBias ? recordTensor(`vae.${prefix}.bias`, shape.outputChannels) : void 0;
    operations.push(Object.freeze({
      kind: "conv1d",
      label: operationLabel,
      input: inputSlot,
      output: outputSlot,
      shape: Object.freeze({ ...shape }),
      weight,
      ...bias === void 0 ? {} : { bias }
    }));
    recordOutput(outputSlot, convPlan.outputElements);
  };
  const appendSnake = (operationLabel, prefix, inputSlot, outputSlot, pointwiseShape) => {
    const alpha = recordTensor(
      `vae.${prefix}.alpha`,
      pointwiseShape.channels
    );
    const beta = recordTensor(
      `vae.${prefix}.beta`,
      pointwiseShape.channels
    );
    operations.push(Object.freeze({
      kind: "snake",
      label: operationLabel,
      input: inputSlot,
      output: outputSlot,
      shape: Object.freeze({ ...pointwiseShape }),
      alpha,
      beta
    }));
    recordOutput(
      outputSlot,
      checkedAceProduct(
        [pointwiseShape.batch, pointwiseShape.frames, pointwiseShape.channels],
        `${operationLabel} output`
      )
    );
  };
  const firstChannels = config.decoderChannels * config.channelMultiples.at(-1);
  let next = chooseWorkspace(/* @__PURE__ */ new Set([active]));
  appendConv(
    "conv1",
    "decoder.conv1",
    active,
    next,
    {
      batch,
      inputFrames: frames,
      inputChannels: channels,
      outputChannels: firstChannels,
      kernelSize: 7,
      stride: 1,
      dilation: 1,
      padding: 3
    },
    true
  );
  active = next;
  channels = firstChannels;
  const upsamplingRatios = [...config.downsamplingRatios].reverse();
  const channelMultiples = [1, ...config.channelMultiples];
  for (let block = 0; block < upsamplingRatios.length; block += 1) {
    const stride = upsamplingRatios[block];
    const outputChannels = config.decoderChannels * channelMultiples[upsamplingRatios.length - block - 1];
    const blockPrefix = `decoder.block.${block}`;
    next = chooseWorkspace(/* @__PURE__ */ new Set([active]));
    appendSnake(
      `block-${block}-snake1`,
      `${blockPrefix}.snake1`,
      active,
      next,
      { batch, frames, channels }
    );
    active = next;
    next = chooseWorkspace(/* @__PURE__ */ new Set([active]));
    const transposeShape = {
      batch,
      inputFrames: frames,
      inputChannels: channels,
      outputChannels,
      kernelSize: 2 * stride,
      stride,
      dilation: 1,
      padding: Math.ceil(stride / 2),
      outputPadding: 0
    };
    const transposePlan = planAceVaeConvTranspose1d(transposeShape);
    const transposeWeight = recordTensor(
      `vae.${blockPrefix}.conv_t1.weight`,
      transposePlan.weightElements
    );
    const transposeBias = recordTensor(
      `vae.${blockPrefix}.conv_t1.bias`,
      outputChannels
    );
    operations.push(Object.freeze({
      kind: "conv-transpose1d",
      label: `block-${block}-conv-t1`,
      input: active,
      output: next,
      shape: Object.freeze(transposeShape),
      weight: transposeWeight,
      bias: transposeBias
    }));
    recordOutput(next, transposePlan.outputElements);
    active = next;
    frames = transposePlan.outputFrames;
    channels = outputChannels;
    for (const [residualIndex, dilation] of [1, 3, 9].entries()) {
      const residual = residualIndex + 1;
      const residualPrefix = `${blockPrefix}.res_unit${residual}`;
      const skip = active;
      const snake1Output = chooseWorkspace(/* @__PURE__ */ new Set([skip]));
      appendSnake(
        `block-${block}-res-${residual}-snake1`,
        `${residualPrefix}.snake1`,
        skip,
        snake1Output,
        { batch, frames, channels }
      );
      const conv1Output = chooseWorkspace(/* @__PURE__ */ new Set([skip, snake1Output]));
      appendConv(
        `block-${block}-res-${residual}-conv1`,
        `${residualPrefix}.conv1`,
        snake1Output,
        conv1Output,
        {
          batch,
          inputFrames: frames,
          inputChannels: channels,
          outputChannels: channels,
          kernelSize: 7,
          stride: 1,
          dilation,
          padding: 3 * dilation
        },
        true
      );
      appendSnake(
        `block-${block}-res-${residual}-snake2`,
        `${residualPrefix}.snake2`,
        conv1Output,
        snake1Output,
        { batch, frames, channels }
      );
      appendConv(
        `block-${block}-res-${residual}-conv2`,
        `${residualPrefix}.conv2`,
        snake1Output,
        conv1Output,
        {
          batch,
          inputFrames: frames,
          inputChannels: channels,
          outputChannels: channels,
          kernelSize: 1,
          stride: 1,
          dilation: 1,
          padding: 0
        },
        true
      );
      operations.push(Object.freeze({
        kind: "add",
        label: `block-${block}-res-${residual}-add`,
        input: skip,
        right: conv1Output,
        output: snake1Output,
        shape: Object.freeze({ batch, frames, channels })
      }));
      recordOutput(
        snake1Output,
        checkedAceProduct(
          [batch, frames, channels],
          `block ${block} residual ${residual} add`
        )
      );
      active = snake1Output;
    }
  }
  next = chooseWorkspace(/* @__PURE__ */ new Set([active]));
  appendSnake(
    "snake1",
    "decoder.snake1",
    active,
    next,
    { batch, frames, channels }
  );
  active = next;
  appendConv(
    "conv2",
    "decoder.conv2",
    active,
    "output",
    {
      batch,
      inputFrames: frames,
      inputChannels: channels,
      outputChannels: config.audioChannels,
      kernelSize: 7,
      stride: 1,
      dilation: 1,
      padding: 3
    },
    false
  );
  const hopLength = config.downsamplingRatios.reduce(
    (product, ratio) => product * ratio,
    1
  );
  if (frames !== inputFrames * hopLength) {
    throw new Error(
      "ACE VAE decoder transposed-convolution geometry does not equal its hop length"
    );
  }
  const inputElements = checkedAceProduct(
    [batch, inputFrames, config.decoderInputChannels],
    "ACE VAE decoder input"
  );
  const outputElements = checkedAceProduct(
    [batch, frames, config.audioChannels],
    "ACE VAE decoder output"
  );
  const workspaceBytes = maximumActivationElements * FLOAT32_BYTES2;
  return Object.freeze({
    config: freezeConfig(config),
    batch,
    inputFrames,
    outputFrames: frames,
    hopLength,
    inputElements,
    outputElements,
    maximumActivationElements,
    workspaceBytes,
    allWorkspaceBytes: workspaceBytes * WORKSPACE_COUNT,
    parameterElements,
    parameterBytes: parameterElements * FLOAT32_BYTES2,
    primitiveCount: operations.length,
    operations: Object.freeze(operations),
    requiredTensorNames: Object.freeze([...requiredTensors])
  });
}
function validateDecoderConfig(config) {
  if (typeof config.id !== "string" || config.id.length === 0) {
    throw new TypeError("ACE VAE decoder config id must be non-empty");
  }
  for (const [name, value] of Object.entries({
    decoderInputChannels: config.decoderInputChannels,
    decoderChannels: config.decoderChannels,
    audioChannels: config.audioChannels,
    sampleRateHz: config.sampleRateHz
  })) {
    requirePositiveSafeInteger(value, `ACE VAE decoder ${name}`);
  }
  if (config.channelMultiples.length === 0 || config.channelMultiples.length !== config.downsamplingRatios.length) {
    throw new RangeError(
      "ACE VAE decoder requires one channel multiple per temporal ratio"
    );
  }
  for (const [index, multiple] of config.channelMultiples.entries()) {
    requirePositiveSafeInteger(multiple, `ACE VAE channel multiple ${index}`);
  }
  for (const [index, ratio] of config.downsamplingRatios.entries()) {
    requirePositiveSafeInteger(ratio, `ACE VAE temporal ratio ${index}`);
    if (ratio % 2 !== 0) {
      throw new RangeError(
        "ACE VAE Stage 1 decoder requires even ratios for exact length multiplication"
      );
    }
  }
}
function freezeConfig(config) {
  return Object.freeze({
    ...config,
    channelMultiples: Object.freeze([...config.channelMultiples]),
    downsamplingRatios: Object.freeze([...config.downsamplingRatios])
  });
}

// qa/fluid-audio/packages/acestep/src/webgpu/vae-fp16-profile.ts
var ACE_VAE_RUNTIME_PROFILE_IDS = Object.freeze([
  "fp32-oracle",
  "opt-0011-mixed-fp16-portable-v1",
  "opt-0028-mixed-fp16-portable-exact-packed-v1",
  "opt-0011-mixed-fp16-fixed32-k7-hybrid-v1",
  "opt-0015-mixed-fp16-fixed32-k7-congruent-transpose-v1",
  "opt-0028-mixed-fp16-fixed32-exact-packed-v1",
  "opt-0040-mixed-fp16-fixed32-exact-packed-shape-selected-v1",
  "opt-0054-mixed-fp16-fixed32-revision7-v1",
  "opt-0066-mixed-fp16-fixed32-dual-k4-quality-v1",
  "opt-0088-mixed-fp16-portable-dual-k4-v1"
]);
var ACE_OPT_0011_VAE_FP16_PORTABLE_KERNEL_SET_ID = "opt-0011-vae-fp16-portable-kernel-set-v1";
var ACE_OPT_0028_VAE_FP16_PORTABLE_EXACT_PACKED_KERNEL_SET_ID = "opt-0028-vae-fp16-portable-exact-packed-kernel-set-v1";
var ACE_OPT_0011_VAE_FP16_FIXED32_K7_HYBRID_KERNEL_SET_ID = "opt-0011-vae-fp16-fixed32-k7-hybrid-kernel-set-v1";
var ACE_OPT_0015_VAE_FP16_FIXED32_K7_CONGRUENT_TRANSPOSE_KERNEL_SET_ID = "opt-0015-vae-fp16-fixed32-k7-congruent-transpose-kernel-set-v1";
var ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_KERNEL_SET_ID = "opt-0028-vae-fp16-fixed32-exact-packed-kernel-set-v1";
var ACE_OPT_0040_VAE_FP16_FIXED32_SHAPE_SELECTED_KERNEL_SET_ID = "opt-0040-vae-fp16-fixed32-exact-packed-shape-selected-kernel-set-v1";
var ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_KERNEL_SET_ID = "opt-0054-vae-fp16-fixed32-revision7-k4-shape-selected-kernel-set-v1";
var ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_KERNEL_SET_ID = "opt-0066-vae-fp16-fixed32-dual-k4-quality-kernel-set-v1";
var ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_KERNEL_SET_ID = "opt-0088-vae-fp16-portable-dual-k4-kernel-set-v1";
var ACE_OPT_0011_VAE_FP16_FIXED_SUBGROUP_SIZE = 32;
var ACE_OPT_0011_VAE_FP16_MANIFEST_SHA256 = "5644bcca87678b4f654b9541459355a73ef136c6bb601aa783b6f50fe2f6dba3";
var ACE_OPT_0011_VAE_FP16_MANIFEST_BYTES = 714687;
var ACE_OPT_0028_VAE_FP16_MANIFEST_SHA256 = "94a1ae61354f7481facbb9787d003488ab1bc351a137fd2bd7ff69dd99aef949";
var ACE_OPT_0028_VAE_FP16_MANIFEST_BYTES = 715301;
var ACE_OPT_0011_VAE_WINDOW_FRAMES = 256;
var ACE_VAE_FP32_ORACLE_MANIFEST_SHA256 = "18f36c6420976475af65ecd833ca56c6119706322ce54120389d4915d8e80db6";
var ACE_VAE_FP32_ORACLE_MANIFEST_BYTES = 759692;
var ACE_OPT_0011_CANONICAL_DECODER_PLAN = planAceVaeDecoder(
  ACE_OPT_0011_VAE_WINDOW_FRAMES
);
var ACE_OPT_0054_K7_K4_OPERATION_LABELS = new Set(ACE_VAE_REVISION7_K7_ROW_REUSE_CONTRACTS.map(
  ({ operationLabel }) => operationLabel
));
var ACE_OPT_0054_TRANSPOSE_K4_OPERATION_LABELS = new Set(ACE_VAE_REVISION7_TRANSPOSE_K4_CONTRACTS.map(
  ({ operationLabel }) => operationLabel
));
var ACE_OPT_0011_VAE_FP16_PRECISION_MAP = createAceOpt0011VaeFp16PrecisionMap(
  ACE_OPT_0011_CANONICAL_DECODER_PLAN,
  "opt-0011-mixed-fp16-portable-v1",
  ACE_OPT_0011_VAE_FP16_PORTABLE_KERNEL_SET_ID
);
var ACE_OPT_0011_VAE_FP16_PRECISION_MAP_CANONICAL_JSON = JSON.stringify(ACE_OPT_0011_VAE_FP16_PRECISION_MAP);
var ACE_OPT_0011_VAE_FP16_PRECISION_MAP_SHA256 = "465d40d9150912abc7ddfaa3ccf2b80c7639fd304722a495cdd37c16119d64ee";
var ACE_OPT_0028_VAE_FP16_PORTABLE_EXACT_PACKED_PRECISION_MAP = createAceOpt0011VaeFp16PrecisionMap(
  ACE_OPT_0011_CANONICAL_DECODER_PLAN,
  "opt-0028-mixed-fp16-portable-exact-packed-v1",
  ACE_OPT_0028_VAE_FP16_PORTABLE_EXACT_PACKED_KERNEL_SET_ID
);
var ACE_OPT_0028_VAE_FP16_PORTABLE_EXACT_PACKED_PRECISION_MAP_CANONICAL_JSON = JSON.stringify(ACE_OPT_0028_VAE_FP16_PORTABLE_EXACT_PACKED_PRECISION_MAP);
var ACE_OPT_0028_VAE_FP16_PORTABLE_EXACT_PACKED_PRECISION_MAP_SHA256 = "6e65d765f1ee5dbab79afb040689cc41cbd7dbd5f1a84ab8807c3f28b48fefe6";
var ACE_OPT_0011_VAE_FP16_FIXED32_K7_HYBRID_PRECISION_MAP = createAceOpt0011VaeFp16PrecisionMap(
  ACE_OPT_0011_CANONICAL_DECODER_PLAN,
  "opt-0011-mixed-fp16-fixed32-k7-hybrid-v1",
  ACE_OPT_0011_VAE_FP16_FIXED32_K7_HYBRID_KERNEL_SET_ID
);
var ACE_OPT_0011_VAE_FP16_FIXED32_K7_HYBRID_PRECISION_MAP_CANONICAL_JSON = JSON.stringify(ACE_OPT_0011_VAE_FP16_FIXED32_K7_HYBRID_PRECISION_MAP);
var ACE_OPT_0011_VAE_FP16_FIXED32_K7_HYBRID_PRECISION_MAP_SHA256 = "d247c0035b6ac33e8bbd33bdae5f4bf64c583e23665734a8a2ea3066fcd999ae";
var ACE_OPT_0015_VAE_FP16_FIXED32_K7_CONGRUENT_TRANSPOSE_PRECISION_MAP = createAceOpt0011VaeFp16PrecisionMap(
  ACE_OPT_0011_CANONICAL_DECODER_PLAN,
  "opt-0015-mixed-fp16-fixed32-k7-congruent-transpose-v1",
  ACE_OPT_0015_VAE_FP16_FIXED32_K7_CONGRUENT_TRANSPOSE_KERNEL_SET_ID
);
var ACE_OPT_0015_VAE_FP16_FIXED32_K7_CONGRUENT_TRANSPOSE_PRECISION_MAP_CANONICAL_JSON = JSON.stringify(
  ACE_OPT_0015_VAE_FP16_FIXED32_K7_CONGRUENT_TRANSPOSE_PRECISION_MAP
);
var ACE_OPT_0015_VAE_FP16_FIXED32_K7_CONGRUENT_TRANSPOSE_PRECISION_MAP_SHA256 = "4bd14663b0504e3b890f781e4d01dff62c8dcdc7f87a285a578e35779cd6bc85";
var ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_PRECISION_MAP = createAceOpt0011VaeFp16PrecisionMap(
  ACE_OPT_0011_CANONICAL_DECODER_PLAN,
  "opt-0028-mixed-fp16-fixed32-exact-packed-v1",
  ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_KERNEL_SET_ID
);
var ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_PRECISION_MAP_CANONICAL_JSON = JSON.stringify(ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_PRECISION_MAP);
var ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_PRECISION_MAP_SHA256 = "5ad25bc038b67771535f08b37579ff47c6741352e26906381f046549bf067973";
var ACE_OPT_0040_VAE_FP16_FIXED32_SHAPE_SELECTED_PRECISION_MAP = createAceOpt0011VaeFp16PrecisionMap(
  ACE_OPT_0011_CANONICAL_DECODER_PLAN,
  "opt-0040-mixed-fp16-fixed32-exact-packed-shape-selected-v1",
  ACE_OPT_0040_VAE_FP16_FIXED32_SHAPE_SELECTED_KERNEL_SET_ID
);
var ACE_OPT_0040_VAE_FP16_FIXED32_SHAPE_SELECTED_PRECISION_MAP_CANONICAL_JSON = JSON.stringify(ACE_OPT_0040_VAE_FP16_FIXED32_SHAPE_SELECTED_PRECISION_MAP);
var ACE_OPT_0040_VAE_FP16_FIXED32_SHAPE_SELECTED_PRECISION_MAP_SHA256 = "d3d001bde01243708d43b923fe23ec25731a4d202cf6c7c2aa7ff214bfcebe06";
var ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_PRECISION_MAP = createAceOpt0011VaeFp16PrecisionMap(
  ACE_OPT_0011_CANONICAL_DECODER_PLAN,
  "opt-0054-mixed-fp16-fixed32-revision7-v1",
  ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_KERNEL_SET_ID,
  true
);
var ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_PRECISION_MAP_CANONICAL_JSON = JSON.stringify(ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_PRECISION_MAP);
var ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_PRECISION_MAP_SHA256 = "0875d2609f22e128ec7f768baa65c7e29109607d52c66d012a205a83dea23a40";
var ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PRECISION_MAP = createAceOpt0011VaeFp16PrecisionMap(
  ACE_OPT_0011_CANONICAL_DECODER_PLAN,
  "opt-0066-mixed-fp16-fixed32-dual-k4-quality-v1",
  ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_KERNEL_SET_ID,
  true
);
var ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PRECISION_MAP_CANONICAL_JSON = JSON.stringify(ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PRECISION_MAP);
var ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PRECISION_MAP_SHA256 = "4815ec86311e401a9bf8cec3f4474d479ef3ac28c925f4824fed4c9ae3b8bc60";
var ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PRECISION_MAP = createAceOpt0011VaeFp16PrecisionMap(
  ACE_OPT_0011_CANONICAL_DECODER_PLAN,
  "opt-0088-mixed-fp16-portable-dual-k4-v1",
  ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_KERNEL_SET_ID,
  true
);
var ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PRECISION_MAP_CANONICAL_JSON = JSON.stringify(ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PRECISION_MAP);
var ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PRECISION_MAP_SHA256 = "ca41cbf328c35fd217f7546375340350a0cf1af6c5262071d806b30a3ae49092";
function hashAceVaePrecisionMap(map) {
  return aceSha256Hex(new TextEncoder().encode(JSON.stringify(map)));
}
var ACE_VAE_FP32_ORACLE_PROFILE = Object.freeze({
  id: "fp32-oracle",
  packageProfile: "reference",
  packageConverterRevision: ACE_PACKAGE_CONVERTER_REVISION,
  manifestSha256: ACE_VAE_FP32_ORACLE_MANIFEST_SHA256,
  manifestByteLength: ACE_VAE_FP32_ORACLE_MANIFEST_BYTES,
  windowFrames: ACE_OPT_0011_VAE_WINDOW_FRAMES,
  batch: 1,
  kernelBackend: "portable-workgroup",
  kernelSetId: "ace-vae-fp32-correctness-kernel-set-v1",
  requiredFeatures: Object.freeze([]),
  requiredSubgroupSize: null,
  requiredLimits: Object.freeze({
    maxBufferSize: 251658240,
    maxStorageBufferBindingSize: 251658240,
    maxComputeWorkgroupStorageSize: 16 * 1024,
    maxComputeInvocationsPerWorkgroup: 256
  }),
  storage: Object.freeze({
    parameters: "float32",
    decoderInput: "float32",
    internalWorkspaces: "float32",
    accumulation: "float32",
    nonlinear: "float32",
    finalOutput: "float32",
    internalStoreRounding: "none"
  }),
  precisionMapSha256: null
});
var ACE_OPT_0011_VAE_FP16_PORTABLE_PROFILE = Object.freeze({
  id: "opt-0011-mixed-fp16-portable-v1",
  packageProfile: "fp16-vae-experimental",
  packageConverterRevision: 5,
  manifestSha256: ACE_OPT_0011_VAE_FP16_MANIFEST_SHA256,
  manifestByteLength: ACE_OPT_0011_VAE_FP16_MANIFEST_BYTES,
  windowFrames: ACE_OPT_0011_VAE_WINDOW_FRAMES,
  batch: 1,
  kernelBackend: "portable-workgroup",
  kernelSetId: ACE_OPT_0011_VAE_FP16_PORTABLE_KERNEL_SET_ID,
  requiredFeatures: Object.freeze(["shader-f16"]),
  requiredSubgroupSize: null,
  requiredLimits: Object.freeze({
    // Exact B-256 largest resource is one 62,914,560-element FP16 workspace.
    maxBufferSize: 125829120,
    maxStorageBufferBindingSize: 125829120,
    // Audited portable-kernel envelope. Every later kernel admitted to this
    // kernel-set ID must fit these already-selected device capabilities.
    maxComputeWorkgroupStorageSize: 16 * 1024,
    maxComputeInvocationsPerWorkgroup: 256
  }),
  storage: Object.freeze({
    parameters: "float16",
    decoderInput: "float16",
    internalWorkspaces: "float16",
    accumulation: "float32",
    nonlinear: "float32",
    finalOutput: "float32",
    internalStoreRounding: "ieee-binary16-round-to-nearest-ties-to-even"
  }),
  precisionMapSha256: ACE_OPT_0011_VAE_FP16_PRECISION_MAP_SHA256
});
var ACE_OPT_0028_VAE_FP16_PORTABLE_EXACT_PACKED_PROFILE = Object.freeze({
  id: "opt-0028-mixed-fp16-portable-exact-packed-v1",
  packageProfile: "fp16-vae-experimental",
  packageConverterRevision: ACE_EXPERIMENTAL_VAE_PACKAGE_CONVERTER_REVISION,
  manifestSha256: ACE_OPT_0028_VAE_FP16_MANIFEST_SHA256,
  manifestByteLength: ACE_OPT_0028_VAE_FP16_MANIFEST_BYTES,
  windowFrames: ACE_OPT_0011_VAE_WINDOW_FRAMES,
  batch: 1,
  kernelBackend: "portable-workgroup-exact-packed",
  kernelSetId: ACE_OPT_0028_VAE_FP16_PORTABLE_EXACT_PACKED_KERNEL_SET_ID,
  requiredFeatures: Object.freeze(["shader-f16"]),
  requiredSubgroupSize: null,
  requiredLimits: Object.freeze({
    maxBufferSize: 251658240,
    maxStorageBufferBindingSize: 251658240,
    maxComputeWorkgroupStorageSize: 16 * 1024,
    maxComputeInvocationsPerWorkgroup: 256
  }),
  storage: Object.freeze({
    parameters: "float16",
    decoderInput: "float16",
    internalWorkspaces: "float16",
    accumulation: "float32",
    nonlinear: "float32",
    finalOutput: "float32",
    internalStoreRounding: "ieee-binary16-round-to-nearest-ties-to-even"
  }),
  precisionMapSha256: ACE_OPT_0028_VAE_FP16_PORTABLE_EXACT_PACKED_PRECISION_MAP_SHA256
});
var ACE_OPT_0011_VAE_FP16_FIXED32_K7_HYBRID_PROFILE = Object.freeze({
  id: "opt-0011-mixed-fp16-fixed32-k7-hybrid-v1",
  packageProfile: "fp16-vae-experimental",
  packageConverterRevision: 5,
  manifestSha256: ACE_OPT_0011_VAE_FP16_MANIFEST_SHA256,
  manifestByteLength: ACE_OPT_0011_VAE_FP16_MANIFEST_BYTES,
  windowFrames: ACE_OPT_0011_VAE_WINDOW_FRAMES,
  batch: 1,
  kernelBackend: "fixed32-subgroup-k7-hybrid",
  kernelSetId: ACE_OPT_0011_VAE_FP16_FIXED32_K7_HYBRID_KERNEL_SET_ID,
  requiredFeatures: Object.freeze(["shader-f16", "subgroups"]),
  requiredSubgroupSize: ACE_OPT_0011_VAE_FP16_FIXED_SUBGROUP_SIZE,
  requiredLimits: Object.freeze({
    maxBufferSize: 125829120,
    maxStorageBufferBindingSize: 125829120,
    maxComputeWorkgroupStorageSize: 16 * 1024,
    maxComputeInvocationsPerWorkgroup: 256
  }),
  storage: Object.freeze({
    parameters: "float16",
    decoderInput: "float16",
    internalWorkspaces: "float16",
    accumulation: "float32",
    nonlinear: "float32",
    finalOutput: "float32",
    internalStoreRounding: "ieee-binary16-round-to-nearest-ties-to-even"
  }),
  precisionMapSha256: ACE_OPT_0011_VAE_FP16_FIXED32_K7_HYBRID_PRECISION_MAP_SHA256
});
var ACE_OPT_0015_VAE_FP16_FIXED32_K7_CONGRUENT_TRANSPOSE_PROFILE = Object.freeze({
  id: "opt-0015-mixed-fp16-fixed32-k7-congruent-transpose-v1",
  packageProfile: "fp16-vae-experimental",
  packageConverterRevision: 5,
  manifestSha256: ACE_OPT_0011_VAE_FP16_MANIFEST_SHA256,
  manifestByteLength: ACE_OPT_0011_VAE_FP16_MANIFEST_BYTES,
  windowFrames: ACE_OPT_0011_VAE_WINDOW_FRAMES,
  batch: 1,
  kernelBackend: "fixed32-subgroup-k7-congruent-transpose-hybrid",
  kernelSetId: ACE_OPT_0015_VAE_FP16_FIXED32_K7_CONGRUENT_TRANSPOSE_KERNEL_SET_ID,
  requiredFeatures: Object.freeze(["shader-f16", "subgroups"]),
  requiredSubgroupSize: ACE_OPT_0011_VAE_FP16_FIXED_SUBGROUP_SIZE,
  requiredLimits: Object.freeze({
    maxBufferSize: 125829120,
    maxStorageBufferBindingSize: 125829120,
    maxComputeWorkgroupStorageSize: 16 * 1024,
    maxComputeInvocationsPerWorkgroup: 256
  }),
  storage: Object.freeze({
    parameters: "float16",
    decoderInput: "float16",
    internalWorkspaces: "float16",
    accumulation: "float32",
    nonlinear: "float32",
    finalOutput: "float32",
    internalStoreRounding: "ieee-binary16-round-to-nearest-ties-to-even"
  }),
  precisionMapSha256: ACE_OPT_0015_VAE_FP16_FIXED32_K7_CONGRUENT_TRANSPOSE_PRECISION_MAP_SHA256
});
var ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_PROFILE = Object.freeze({
  id: "opt-0028-mixed-fp16-fixed32-exact-packed-v1",
  packageProfile: "fp16-vae-experimental",
  packageConverterRevision: ACE_EXPERIMENTAL_VAE_PACKAGE_CONVERTER_REVISION,
  manifestSha256: ACE_OPT_0028_VAE_FP16_MANIFEST_SHA256,
  manifestByteLength: ACE_OPT_0028_VAE_FP16_MANIFEST_BYTES,
  windowFrames: ACE_OPT_0011_VAE_WINDOW_FRAMES,
  batch: 1,
  kernelBackend: "fixed32-subgroup-exact-packed",
  kernelSetId: ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_KERNEL_SET_ID,
  requiredFeatures: Object.freeze(["shader-f16", "subgroups"]),
  requiredSubgroupSize: ACE_OPT_0011_VAE_FP16_FIXED_SUBGROUP_SIZE,
  requiredLimits: Object.freeze({
    maxBufferSize: 251658240,
    maxStorageBufferBindingSize: 251658240,
    maxComputeWorkgroupStorageSize: 16 * 1024,
    maxComputeInvocationsPerWorkgroup: 256
  }),
  storage: Object.freeze({
    parameters: "float16",
    decoderInput: "float16",
    internalWorkspaces: "float16",
    accumulation: "float32",
    nonlinear: "float32",
    finalOutput: "float32",
    internalStoreRounding: "ieee-binary16-round-to-nearest-ties-to-even"
  }),
  precisionMapSha256: ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_PRECISION_MAP_SHA256
});
var ACE_OPT_0040_VAE_FP16_FIXED32_SHAPE_SELECTED_PROFILE = Object.freeze({
  id: "opt-0040-mixed-fp16-fixed32-exact-packed-shape-selected-v1",
  packageProfile: "fp16-vae-experimental",
  packageConverterRevision: ACE_EXPERIMENTAL_VAE_PACKAGE_CONVERTER_REVISION,
  manifestSha256: ACE_OPT_0028_VAE_FP16_MANIFEST_SHA256,
  manifestByteLength: ACE_OPT_0028_VAE_FP16_MANIFEST_BYTES,
  windowFrames: ACE_OPT_0011_VAE_WINDOW_FRAMES,
  batch: 1,
  kernelBackend: "fixed32-subgroup-exact-packed-shape-selected",
  kernelSetId: ACE_OPT_0040_VAE_FP16_FIXED32_SHAPE_SELECTED_KERNEL_SET_ID,
  requiredFeatures: Object.freeze(["shader-f16", "subgroups"]),
  requiredSubgroupSize: ACE_OPT_0011_VAE_FP16_FIXED_SUBGROUP_SIZE,
  requiredLimits: Object.freeze({
    maxBufferSize: 251658240,
    maxStorageBufferBindingSize: 251658240,
    maxComputeWorkgroupStorageSize: 16 * 1024,
    maxComputeInvocationsPerWorkgroup: 256
  }),
  storage: Object.freeze({
    parameters: "float16",
    decoderInput: "float16",
    internalWorkspaces: "float16",
    accumulation: "float32",
    nonlinear: "float32",
    finalOutput: "float32",
    internalStoreRounding: "ieee-binary16-round-to-nearest-ties-to-even"
  }),
  precisionMapSha256: ACE_OPT_0040_VAE_FP16_FIXED32_SHAPE_SELECTED_PRECISION_MAP_SHA256
});
var ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_PROFILE = Object.freeze({
  id: "opt-0054-mixed-fp16-fixed32-revision7-v1",
  packageProfile: "fp16-vae-experimental",
  packageConverterRevision: ACE_OPT_0054_EXPERIMENTAL_VAE_PACKAGE_CONVERTER_REVISION,
  manifestSha256: ACE_OPT_0054_VAE_REVISION7_MANIFEST_SHA256,
  manifestByteLength: ACE_OPT_0054_VAE_REVISION7_MANIFEST_BYTES,
  windowFrames: ACE_OPT_0011_VAE_WINDOW_FRAMES,
  batch: 1,
  kernelBackend: "fixed32-subgroup-revision7-k4-shape-selected",
  kernelSetId: ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_KERNEL_SET_ID,
  requiredFeatures: Object.freeze(["shader-f16", "subgroups"]),
  requiredSubgroupSize: ACE_OPT_0011_VAE_FP16_FIXED_SUBGROUP_SIZE,
  requiredLimits: Object.freeze({
    maxBufferSize: 251658240,
    maxStorageBufferBindingSize: 251658240,
    maxComputeWorkgroupStorageSize: 16 * 1024,
    maxComputeInvocationsPerWorkgroup: 256
  }),
  storage: Object.freeze({
    parameters: "float16",
    decoderInput: "float16",
    internalWorkspaces: "float16",
    accumulation: "float32",
    nonlinear: "float32",
    finalOutput: "float32",
    internalStoreRounding: "ieee-binary16-round-to-nearest-ties-to-even"
  }),
  precisionMapSha256: ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_PRECISION_MAP_SHA256
});
var ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PROFILE = Object.freeze({
  id: "opt-0066-mixed-fp16-fixed32-dual-k4-quality-v1",
  packageProfile: "fp16-vae-experimental",
  packageConverterRevision: ACE_OPT_0054_EXPERIMENTAL_VAE_PACKAGE_CONVERTER_REVISION,
  manifestSha256: ACE_OPT_0054_VAE_REVISION7_MANIFEST_SHA256,
  manifestByteLength: ACE_OPT_0054_VAE_REVISION7_MANIFEST_BYTES,
  windowFrames: ACE_OPT_0011_VAE_WINDOW_FRAMES,
  batch: 1,
  kernelBackend: "fixed32-subgroup-dual-k4-quality",
  kernelSetId: ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_KERNEL_SET_ID,
  requiredFeatures: Object.freeze(["shader-f16", "subgroups"]),
  requiredSubgroupSize: ACE_OPT_0011_VAE_FP16_FIXED_SUBGROUP_SIZE,
  requiredLimits: Object.freeze({
    maxBufferSize: 251658240,
    maxStorageBufferBindingSize: 251658240,
    maxComputeWorkgroupStorageSize: 16 * 1024,
    maxComputeInvocationsPerWorkgroup: 256
  }),
  storage: Object.freeze({
    parameters: "float16",
    decoderInput: "float16",
    internalWorkspaces: "float16",
    accumulation: "float32",
    nonlinear: "float32",
    finalOutput: "float32",
    internalStoreRounding: "ieee-binary16-round-to-nearest-ties-to-even"
  }),
  precisionMapSha256: ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PRECISION_MAP_SHA256
});
var ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PROFILE = Object.freeze({
  id: "opt-0088-mixed-fp16-portable-dual-k4-v1",
  packageProfile: "fp16-vae-experimental",
  packageConverterRevision: ACE_OPT_0054_EXPERIMENTAL_VAE_PACKAGE_CONVERTER_REVISION,
  manifestSha256: ACE_OPT_0054_VAE_REVISION7_MANIFEST_SHA256,
  manifestByteLength: ACE_OPT_0054_VAE_REVISION7_MANIFEST_BYTES,
  windowFrames: ACE_OPT_0011_VAE_WINDOW_FRAMES,
  batch: 1,
  kernelBackend: "portable-workgroup-dual-k4",
  kernelSetId: ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_KERNEL_SET_ID,
  requiredFeatures: Object.freeze(["shader-f16"]),
  requiredSubgroupSize: null,
  requiredLimits: Object.freeze({
    maxBufferSize: 251658240,
    maxStorageBufferBindingSize: 251658240,
    maxComputeWorkgroupStorageSize: 16 * 1024,
    maxComputeInvocationsPerWorkgroup: 256
  }),
  storage: Object.freeze({
    parameters: "float16",
    decoderInput: "float16",
    internalWorkspaces: "float16",
    accumulation: "float32",
    nonlinear: "float32",
    finalOutput: "float32",
    internalStoreRounding: "ieee-binary16-round-to-nearest-ties-to-even"
  }),
  precisionMapSha256: ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PRECISION_MAP_SHA256
});
var ACE_OPT_0072_VAE_FP16_FIXED32_DUAL_K4_PRODUCTION_RUNTIME_PROFILE = "opt-0072-mixed-fp16-fixed32-dual-k4-production-v1";
var ACE_OPT_0072_VAE_FP16_FIXED32_DUAL_K4_PRODUCTION_PROFILE_CONTRACT = Object.freeze({
  id: ACE_OPT_0072_VAE_FP16_FIXED32_DUAL_K4_PRODUCTION_RUNTIME_PROFILE,
  physicalRuntimeProfileId: ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PROFILE.id,
  manifestSha256: ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PROFILE.manifestSha256,
  manifestByteLength: ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PROFILE.manifestByteLength,
  kernelSetId: ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PROFILE.kernelSetId,
  precisionMapSha256: ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PROFILE.precisionMapSha256
});
var ACE_OPT_0088_VAE_PORTABLE_PRODUCTION_PROFILE_CONTRACT = Object.freeze({
  id: ACE_OPT_0072_VAE_FP16_FIXED32_DUAL_K4_PRODUCTION_RUNTIME_PROFILE,
  physicalRuntimeProfileId: ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PROFILE.id,
  manifestSha256: ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PROFILE.manifestSha256,
  manifestByteLength: ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PROFILE.manifestByteLength,
  kernelSetId: ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PROFILE.kernelSetId,
  precisionMapSha256: ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PROFILE.precisionMapSha256
});
var AceVaeRuntimeProfileError = class extends Error {
  code = "INVALID_VAE_RUNTIME_PROFILE";
  constructor(message) {
    super(message);
    this.name = "AceVaeRuntimeProfileError";
  }
};
function requireAceOpt0011VaeDecoderGeometry(plan) {
  if (JSON.stringify(plan) !== JSON.stringify(ACE_OPT_0011_CANONICAL_DECODER_PLAN)) {
    throw new AceVaeRuntimeProfileError(
      "OPT-0011 VAE profile requires the exact batch-1 256-frame decoder graph"
    );
  }
}
function createAceOpt0011VaeFp16PrecisionMap(plan, profileId, kernelSetId, revision7K4 = false) {
  if (plan.operations.length !== 88) {
    throw new Error(
      `OPT-0011 FP16 VAE precision map expected 88 operations, received ${plan.operations.length}`
    );
  }
  const entries = [Object.freeze({
    sequenceIndex: 0,
    graphOperationIndex: null,
    label: "f32-latent-to-f16-decoder-input",
    kind: "ingress-cast",
    kernelFamily: "f32-to-f16-cast",
    inputs: Object.freeze([Object.freeze({
      role: "input",
      slot: "ingress-staging",
      storage: "float32"
    })]),
    parameters: Object.freeze([]),
    registerArithmetic: "float32",
    accumulation: "none",
    nonlinearArithmetic: "none",
    reductionOrder: "none",
    contraction: "none",
    transcendentals: Object.freeze([]),
    output: Object.freeze({
      slot: "input",
      storage: "float16",
      rounding: "ieee-binary16-round-to-nearest-ties-to-even"
    })
  })];
  for (let index = 0; index < plan.operations.length; index += 1) {
    entries.push(precisionEntryForOperation(
      plan.operations[index],
      index,
      revision7K4
    ));
  }
  return Object.freeze({
    schema: "ace-opt-0011-vae-precision-map-v1",
    profileId,
    kernelSetId,
    decoderConfigId: ACE_OOBLECK_DECODER_CONFIG.id,
    batch: 1,
    inputFrames: ACE_OPT_0011_VAE_WINDOW_FRAMES,
    graphOperationCount: 88,
    entries: Object.freeze(entries)
  });
}
function precisionEntryForOperation(operation, graphOperationIndex, revision7K4) {
  const base = {
    sequenceIndex: graphOperationIndex + 1,
    graphOperationIndex,
    label: operation.label,
    kind: operation.kind,
    inputs: Object.freeze([
      Object.freeze({
        role: "input",
        slot: operation.input,
        storage: "float16"
      }),
      ...operation.kind === "add" ? [Object.freeze({
        role: "right",
        slot: operation.right,
        storage: "float16"
      })] : []
    ]),
    registerArithmetic: "float32",
    output: Object.freeze({
      slot: operation.output,
      storage: operation.output === "output" ? "float32" : "float16",
      rounding: operation.output === "output" ? "none" : "ieee-binary16-round-to-nearest-ties-to-even"
    })
  };
  switch (operation.kind) {
    case "conv1d": {
      if (operation.shape.kernelSize !== 1 && operation.shape.kernelSize !== 7) {
        throw new Error(
          `OPT-0011 precision map has undeclared Conv1D K${operation.shape.kernelSize}`
        );
      }
      const k4 = revision7K4 && operation.shape.kernelSize === 7 && ACE_OPT_0054_K7_K4_OPERATION_LABELS.has(operation.label);
      return Object.freeze({
        ...base,
        kernelFamily: operation.shape.kernelSize === 1 ? "conv1d-k1" : "conv1d-k7",
        parameters: Object.freeze([
          precisionParameter("weight", operation.weight),
          ...operation.bias === void 0 ? [] : [precisionParameter("bias", operation.bias)]
        ]),
        registerArithmetic: k4 ? "float16-dot4-partials-then-float32-running-state" : "float32",
        accumulation: "float32",
        nonlinearArithmetic: "none",
        reductionOrder: k4 ? "kernel-ascending-then-input-channel-groups-of-four-ascending" : "kernel-ascending-then-input-channel-ascending",
        contraction: k4 ? "wgsl-f16-dot4-partials-then-f32-add" : "wgsl-multiply-add-contraction-permitted",
        transcendentals: Object.freeze([])
      });
    }
    case "conv-transpose1d": {
      const k4 = revision7K4 && ACE_OPT_0054_TRANSPOSE_K4_OPERATION_LABELS.has(operation.label);
      return Object.freeze({
        ...base,
        kernelFamily: "conv-transpose1d",
        parameters: Object.freeze([
          precisionParameter("weight", operation.weight),
          precisionParameter("bias", operation.bias)
        ]),
        registerArithmetic: k4 ? "float16-dot4-partials-then-float32-running-state" : "float32",
        accumulation: "float32",
        nonlinearArithmetic: "none",
        reductionOrder: k4 ? "tap-ascending-then-input-channel-groups-of-four-ascending" : "kernel-ascending-then-input-channel-ascending",
        contraction: k4 ? "wgsl-f16-dot4-partials-then-f32-add" : "wgsl-multiply-add-contraction-permitted",
        transcendentals: Object.freeze([])
      });
    }
    case "snake":
      return Object.freeze({
        ...base,
        kernelFamily: "snake",
        parameters: Object.freeze([
          precisionParameter("alpha", operation.alpha),
          precisionParameter("beta", operation.beta)
        ]),
        accumulation: "none",
        nonlinearArithmetic: "float32",
        reductionOrder: "none",
        contraction: "wgsl-multiply-add-contraction-permitted",
        transcendentals: Object.freeze([
          "exp-alpha",
          "exp-beta",
          "sin-alpha-times-input"
        ])
      });
    case "add":
      return Object.freeze({
        ...base,
        kernelFamily: "add",
        parameters: Object.freeze([]),
        accumulation: "none",
        nonlinearArithmetic: "none",
        reductionOrder: "none",
        contraction: "none",
        transcendentals: Object.freeze([])
      });
  }
}
function precisionParameter(role, logicalTensor) {
  return Object.freeze({ role, logicalTensor, storage: "float16" });
}

// qa/fluid-audio/packages/acestep/src/webgpu/dit-fp16-package.ts
var ACE_OPT_0009_DIT_DENSE_MANIFEST_SHA256 = "d3fc0020efcf60702db411da2fd4b93e9bb84f1437ed310aef01c892727e452f";
var ACE_OPT_0009_DIT_DENSE_MANIFEST_BYTES = 254357;
var ACE_OPT_0009_DIT_DENSE_RUNTIME_PROFILE = "opt-0009-fp16-fp32-dense-v1";
var ACE_OPT_0009_DIT_DENSE_KERNEL_SET_ID = "opt-0009-n256-k32-fp16-fp32-v1";
var ACE_OPT_0009_DIT_MIXED_LAYER_BYTES = 3020808192;
var ACE_OPT_0009_DIT_MIXED_RESIDENT_WEIGHT_BYTES = 3150917888;
var ACE_OPT_0009_DIT_DENSE_WEIGHT_FILES = Object.freeze(
  Array.from({ length: 24 }, (_, layer) => [
    `weights/dit/layer-${String(layer).padStart(2, "0")}-00.bin`,
    `weights/dit/layer-${String(layer).padStart(2, "0")}-01.bin`
  ]).flat()
);
var ACE_OPT_0089_DIT_FAKE_QUANT_MANIFEST_SHA256 = "ef8355b9cffff466b018b51275923982b071234933fe8a32897915eeeb01fa36";
var ACE_OPT_0091_DIT_INT8_MANIFEST_SHA256 = "a3233c9f97bc151b5ffa2a6cd8c9ecaee4e555497ee6fda20b70becaf7d55da1";
var ACE_OPT_0091_DIT_INT8_MANIFEST_BYTES = 262613;
var ACE_OPT_0091_DIT_INT8_RUNTIME_PROFILE = "opt-0091-int8-weight-only-v1";
var ACE_OPT_0091_DIT_INT8_KERNEL_SET_ID = "opt-0091-int8-weight-only-fixed32-v1";
var ACE_OPT_0091_DIT_INT8_PORTABLE_KERNEL_SET_ID = "opt-0091-int8-weight-only-portable-v1";
var ACE_OPT_0091_DIT_INT8_LAYER_BYTES = 1699602432;
var ACE_OPT_0091_DIT_INT8_RESIDENT_WEIGHT_BYTES = 1829712128;
var ACE_OPT_0091_DIT_INT8_WEIGHT_FILES = Object.freeze([
  ...ACE_OPT_0009_DIT_DENSE_WEIGHT_FILES
]);
var ACE_OPT_0037_DIT_K4_MANIFEST_SHA256 = "a2f70c123fb7c4dbc3b51be68b4b494107c13b575ad2bed68c639791c93574d1";
var ACE_OPT_0037_DIT_K4_MANIFEST_BYTES = 257789;
var ACE_OPT_0037_DIT_K4_RUNTIME_PROFILE = "opt-0037-k4-fp16-partials-v1";
var ACE_OPT_0037_DIT_K4_KERNEL_SET_ID = "opt-0037-opt-0032-k4-partials-fixed32-v1";
var ACE_OPT_0056_DIT_SELECTIVE_K4_RUNTIME_PROFILE = "opt-0056-selective-k4-exact-down-v1";
var ACE_OPT_0056_DIT_SELECTIVE_K4_KERNEL_SET_ID = "opt-0056-opt0032-k4-plus-exact-down-fixed32-v1";
var ACE_OPT_0037_DIT_K4_LAYER_BYTES = 3020808192;
var ACE_OPT_0037_DIT_K4_RESIDENT_WEIGHT_BYTES = 3150917888;
var ACE_OPT_0037_DIT_K4_WEIGHT_FILES = Object.freeze(
  [...ACE_OPT_0009_DIT_DENSE_WEIGHT_FILES]
);
var ACE_OPT_0088_DIT_DENSE_PORTABLE_KERNEL_SET_ID = "opt-0088-dense-fp16-fp32-portable-v1";

// qa/fluid-audio/packages/acestep/src/webgpu/dit-attention-profile.ts
var ACE_DIT_QUERY8_ATTENTION_RUNTIME_PROFILE = "ace-dit-fixed32-query8-v1";
var ACE_OPT_0062_DIT_QUAD_QUERY_ATTENTION_RUNTIME_PROFILE = "opt-0062-fixed32-quad-query32-full-self-v1";
var ACE_OPT_0070_DIT_QUAD_QUERY_ATTENTION_RUNTIME_PROFILE = "opt-0070-fixed32-quad-query32-full-self-production-v1";
var ACE_DIT_QUERY8_ATTENTION_KERNEL_SET_ID = "fixed32-subgroup-query8";
var ACE_OPT_0088_DIT_PORTABLE_ATTENTION_KERNEL_SET_ID = "opt-0088-portable-attention-oracle-v1";
var ACE_OPT_0062_DIT_QUAD_QUERY_ATTENTION_KERNEL_SET_ID = "opt-0062-query8-plus-quad-query32-full-self-v1";
var ACE_OPT_0070_DIT_QUAD_QUERY_ATTENTION_KERNEL_SET_ID = "opt-0070-opt0062-query8-plus-quad-query32-full-self-production-v1";
var ACE_OPT_0070_DIT_ATTENTION_SHAPE_POLICY = Object.freeze({
  schema: "ace-opt-0070-attention-shape-policy-v1",
  exactQuadQueryTokens: 2250,
  exactQuadKeyValueTokens: 2250,
  exactM2250FullSelfOwner: "opt-0062-fixed32-quad-query32",
  otherFullSelfOwner: "fixed32-subgroup-query8",
  slidingSelfAttentionOwner: "fixed32-subgroup-query8",
  crossAttentionOwner: "fixed32-subgroup-query8"
});
var ACE_DIT_QUERY8_ATTENTION_PROFILE_CONTRACT = Object.freeze({
  id: ACE_DIT_QUERY8_ATTENTION_RUNTIME_PROFILE,
  kernelSetId: ACE_DIT_QUERY8_ATTENTION_KERNEL_SET_ID,
  fullSelfAttentionOwner: "fixed32-subgroup-query8",
  slidingSelfAttentionOwner: "fixed32-subgroup-query8",
  crossAttentionOwner: "fixed32-subgroup-query8"
});
var ACE_OPT_0062_DIT_QUAD_QUERY_ATTENTION_PROFILE_CONTRACT = Object.freeze({
  id: ACE_OPT_0062_DIT_QUAD_QUERY_ATTENTION_RUNTIME_PROFILE,
  kernelSetId: ACE_OPT_0062_DIT_QUAD_QUERY_ATTENTION_KERNEL_SET_ID,
  fullSelfAttentionOwner: "opt-0062-fixed32-quad-query32",
  slidingSelfAttentionOwner: "fixed32-subgroup-query8",
  crossAttentionOwner: "fixed32-subgroup-query8"
});
var ACE_OPT_0070_DIT_QUAD_QUERY_ATTENTION_PROFILE_CONTRACT = Object.freeze({
  id: ACE_OPT_0070_DIT_QUAD_QUERY_ATTENTION_RUNTIME_PROFILE,
  kernelSetId: ACE_OPT_0070_DIT_QUAD_QUERY_ATTENTION_KERNEL_SET_ID,
  fullSelfAttentionOwner: "opt-0062-fixed32-quad-query32",
  slidingSelfAttentionOwner: "fixed32-subgroup-query8",
  crossAttentionOwner: "fixed32-subgroup-query8"
});

// qa/fluid-audio/packages/acestep/src/webgpu/vae-window-profile.ts
var ACE_VAE_C512_WINDOW_RUNTIME_PROFILE = "ace-vae-c512-overlap64-v1";
var ACE_OPT_0070_VAE_C2378_WINDOW_RUNTIME_PROFILE = "opt-0070-c2378-overlap64-production-v1";
var ACE_OPT_0070_VAE_C2378_MAXIMUM_WINDOW_FRAMES = 2378;
var ACE_OPT_0070_VAE_C2378_REQUIRED_WORKSPACE_BYTES = 1168834560;
var ACE_VAE_CAPPED_C2176_WINDOW_RUNTIME_PROFILE = "ace-vae-c2176-overlap64-capped-v1";
var ACE_VAE_CAPPED_C2176_MAXIMUM_WINDOW_FRAMES = 2176;
var ACE_VAE_CAPPED_C2176_REQUIRED_WORKSPACE_BYTES = 1069547520;
var ACE_VAE_ONE_GIB_CAPPED_ADAPTER_LIMIT_BYTES = 1073741824;
var ACE_VAE_C512_REQUIRED_WORKSPACE_BYTES = 251658240;
var ACE_VAE_C512_WINDOW_RUNTIME_PROFILE_CONTRACT = Object.freeze({
  id: ACE_VAE_C512_WINDOW_RUNTIME_PROFILE,
  maximumWindowFrames: 512,
  overlapFrames: 64,
  requiredWorkspaceBytes: ACE_VAE_C512_REQUIRED_WORKSPACE_BYTES
});
var ACE_OPT_0070_VAE_C2378_WINDOW_RUNTIME_PROFILE_CONTRACT = Object.freeze({
  id: ACE_OPT_0070_VAE_C2378_WINDOW_RUNTIME_PROFILE,
  maximumWindowFrames: ACE_OPT_0070_VAE_C2378_MAXIMUM_WINDOW_FRAMES,
  overlapFrames: 64,
  requiredWorkspaceBytes: ACE_OPT_0070_VAE_C2378_REQUIRED_WORKSPACE_BYTES
});
var ACE_VAE_CAPPED_C2176_WINDOW_RUNTIME_PROFILE_CONTRACT = Object.freeze({
  id: ACE_VAE_CAPPED_C2176_WINDOW_RUNTIME_PROFILE,
  maximumWindowFrames: ACE_VAE_CAPPED_C2176_MAXIMUM_WINDOW_FRAMES,
  overlapFrames: 64,
  requiredWorkspaceBytes: ACE_VAE_CAPPED_C2176_REQUIRED_WORKSPACE_BYTES
});
function requireAceVaeWindowRuntimeProfile(profile, maximumWindowFrames) {
  if ((profile === void 0 || profile === ACE_VAE_C512_WINDOW_RUNTIME_PROFILE) && maximumWindowFrames === 512) {
    return ACE_VAE_C512_WINDOW_RUNTIME_PROFILE_CONTRACT;
  }
  if (profile === ACE_OPT_0070_VAE_C2378_WINDOW_RUNTIME_PROFILE && maximumWindowFrames === ACE_OPT_0070_VAE_C2378_MAXIMUM_WINDOW_FRAMES) {
    return ACE_OPT_0070_VAE_C2378_WINDOW_RUNTIME_PROFILE_CONTRACT;
  }
  if (profile === ACE_VAE_CAPPED_C2176_WINDOW_RUNTIME_PROFILE && maximumWindowFrames === ACE_VAE_CAPPED_C2176_MAXIMUM_WINDOW_FRAMES) {
    return ACE_VAE_CAPPED_C2176_WINDOW_RUNTIME_PROFILE_CONTRACT;
  }
  throw new Error("ACE VAE window runtime profile is not authenticated");
}
function selectAceVaeWindowRuntimeProfileForLimits(configured, limits) {
  const available = Math.min(
    requireLimitValue(limits.maxBufferSize, "maxBufferSize"),
    requireLimitValue(
      limits.maxStorageBufferBindingSize,
      "maxStorageBufferBindingSize"
    )
  );
  if (available >= configured.requiredWorkspaceBytes) return configured;
  if (configured.id === ACE_OPT_0070_VAE_C2378_WINDOW_RUNTIME_PROFILE) {
    if (available <= ACE_VAE_ONE_GIB_CAPPED_ADAPTER_LIMIT_BYTES && available >= ACE_VAE_C512_REQUIRED_WORKSPACE_BYTES) {
      return ACE_VAE_C512_WINDOW_RUNTIME_PROFILE_CONTRACT;
    }
    if (available >= ACE_VAE_CAPPED_C2176_REQUIRED_WORKSPACE_BYTES) {
      return ACE_VAE_CAPPED_C2176_WINDOW_RUNTIME_PROFILE_CONTRACT;
    }
  }
  return configured;
}
function requireLimitValue(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(
      `ACE VAE window selection requires a positive integer ${name}`
    );
  }
  return value;
}

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/vae-conv1d-fp16.ts
var ACE_FP16_VAE_CONV1D_K7_SUPPORTED_DILATIONS = Object.freeze([1, 3, 9]);
var ACE_FP16_VAE_CONV1D_PORTABLE_KERNEL_ID = "ace-vae-fp16-portable-conv1d-v1";
var FLOAT32_BYTES3 = Float32Array.BYTES_PER_ELEMENT;

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/vae-conv1d-fp16-subgroup.ts
var ACE_FP16_VAE_CONV1D_SUBGROUP_KERNEL_ID = "ace-vae-fp16-fixed32-subgroup-k7-conv1d-v1";

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/vae-k1-fp16-subgroup-gemm.ts
var ACE_OPT_0025_VAE_K1_SUBGROUP_GEMM_KERNEL_ID = "opt-0025-vae-k1-fp16-fixed32-subgroup-gemm-v1";
var ACE_OPT_0025_VAE_K1_SUBGROUP_SIZE = 32;
var ACE_OPT_0025_VAE_K1_TILE_ROWS = 32;
var ACE_OPT_0025_VAE_K1_TILE_COLUMNS = 128;
var ACE_OPT_0025_VAE_K1_WORKGROUP_SIZE = 128;
var SUBGROUPS_PER_WORKGROUP = ACE_OPT_0025_VAE_K1_WORKGROUP_SIZE / ACE_OPT_0025_VAE_K1_SUBGROUP_SIZE;
var ROWS_PER_SUBGROUP = ACE_OPT_0025_VAE_K1_TILE_ROWS / SUBGROUPS_PER_WORKGROUP;
var COLUMNS_PER_LANE = ACE_OPT_0025_VAE_K1_TILE_COLUMNS / ACE_OPT_0025_VAE_K1_SUBGROUP_SIZE;

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/vae-k1-fp16-portable-packed.ts
var ACE_OPT_0028_VAE_K1_PORTABLE_PACKED_KERNEL_ID = "ace-vae-fp16-portable-packed-k1-conv1d-v1";

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/vae-conv-transpose1d-fp16.ts
var ACE_FP16_VAE_CONV_TRANSPOSE1D_SUPPORTED_STRIDES = Object.freeze([2, 4, 6, 10]);
var ACE_FP16_VAE_CONV_TRANSPOSE1D_PORTABLE_KERNEL_ID = "ace-vae-fp16-portable-conv-transpose1d-v1";
var ACE_FP16_VAE_CONV_TRANSPOSE1D_CONGRUENT_KERNEL_ID = "ace-vae-fp16-congruent-two-tap-conv-transpose1d-v1";

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/vae-conv-transpose1d-fp16-multi-output-subgroup.ts
var ACE_OPT_0026_VAE_CONV_TRANSPOSE1D_KERNEL_ID = "ace-vae-fp16-fixed32-subgroup-4row-128channel-conv-transpose1d-v1";

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/vae-conv-transpose1d-fp16-portable-packed.ts
var ACE_OPT_0028_VAE_CONV_TRANSPOSE1D_PORTABLE_PACKED_KERNEL_ID = "ace-vae-fp16-portable-packed-polyphase-conv-transpose1d-v1";

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/vae-conv-transpose1d-fp16-reuse-axis-subgroup.ts
var ACE_OPT_0036_VAE_CONV_TRANSPOSE1D_R8C4_KERNEL_ID = "ace-vae-fp16-fixed32-subgroup-32row-128channel-conv-transpose1d-v1";
var ACE_OPT_0036_VAE_CONV_TRANSPOSE1D_R4C8_KERNEL_ID = "ace-vae-fp16-fixed32-subgroup-16row-256channel-conv-transpose1d-v1";
var R8C4 = Object.freeze({
  kernelId: ACE_OPT_0036_VAE_CONV_TRANSPOSE1D_R8C4_KERNEL_ID,
  rowsPerSubgroup: 8,
  rowsPerWorkgroup: 32,
  channelsPerLane: 4,
  channelsPerWorkgroup: 128
});
var R4C8 = Object.freeze({
  kernelId: ACE_OPT_0036_VAE_CONV_TRANSPOSE1D_R4C8_KERNEL_ID,
  rowsPerSubgroup: 4,
  rowsPerWorkgroup: 16,
  channelsPerLane: 8,
  channelsPerWorkgroup: 256
});

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/vae-conv-transpose1d-fp16-shape-selector.ts
var ACE_OPT_0040_VAE_CONV_TRANSPOSE1D_SHAPE_SELECTOR_KERNEL_ID = "ace-vae-fp16-fixed32-subgroup-shape-selected-conv-transpose1d-v1";
var ACE_OPT_0040_VAE_CONV_TRANSPOSE1D_ROUTES = Object.freeze([
  route("block-0-conv-t1", "channel", 2048, 1024, 10),
  route("block-1-conv-t1", "channel", 1024, 512, 6),
  route("block-2-conv-t1", "channel", 512, 256, 4),
  route("block-3-conv-t1", "row", 256, 128, 4),
  route("block-4-conv-t1", "row", 128, 128, 2)
]);
function route(operationLabel, reuseAxis, inputChannels, outputChannels, stride) {
  return Object.freeze({
    operationLabel,
    reuseAxis,
    kernelId: reuseAxis === "channel" ? ACE_OPT_0036_VAE_CONV_TRANSPOSE1D_R4C8_KERNEL_ID : ACE_OPT_0036_VAE_CONV_TRANSPOSE1D_R8C4_KERNEL_ID,
    inputChannels,
    outputChannels,
    stride
  });
}

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/vae-conv-transpose1d-fp16-k4-shape-selector.ts
var ACE_OPT_0052_VAE_CONV_TRANSPOSE1D_K4_SHAPE_SELECTOR_KERNEL_ID = "ace-opt-0052-vae-convtranspose-exact-k4-shape-selector-v1";
var ACE_OPT_0088_VAE_CONV_TRANSPOSE1D_K4_PORTABLE_SHAPE_SELECTOR_KERNEL_ID = "opt-0088-vae-conv-transpose1d-k4-portable-shape-selector-v1";

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/vae-conv1d-fp16-k4-row-reuse-shape-selector.ts
var ACE_OPT_0057_VAE_K7_SHAPE_SELECTOR_KERNEL_ID = "ace-opt-0057-vae-k7-row-reuse-shape-selector-v1";
var ACE_OPT_0088_VAE_K7_PORTABLE_SHAPE_SELECTOR_KERNEL_ID = "opt-0088-vae-k7-portable-shape-selector-v1";
var ROW_REUSE_ROUTES = ACE_VAE_REVISION7_K7_ROW_REUSE_CONTRACTS.map(
  (contract) => Object.freeze({
    operationLabel: contract.operationLabel,
    owner: "row-reuse-k4",
    inputChannels: contract.channels,
    outputChannels: contract.channels,
    dilation: contract.dilation,
    hasBias: true,
    outputStorage: "float16"
  })
);
var NATIVE_ROUTES = Object.freeze([
  nativeRoute("conv1", 64, 2048, 1, true, "float16"),
  nativeRoute("block-2-res-1-conv1", 256, 256, 1, true, "float16"),
  nativeRoute("block-2-res-2-conv1", 256, 256, 3, true, "float16"),
  nativeRoute("block-2-res-3-conv1", 256, 256, 9, true, "float16"),
  nativeRoute("conv2", 128, 2, 1, false, "float32")
]);
var ACE_OPT_0057_VAE_K7_ROUTES = Object.freeze([
  ...ROW_REUSE_ROUTES,
  ...NATIVE_ROUTES
]);
function nativeRoute(operationLabel, inputChannels, outputChannels, dilation, hasBias, outputStorage) {
  return Object.freeze({
    operationLabel,
    owner: "native-scalar-fp32",
    inputChannels,
    outputChannels,
    dilation,
    hasBias,
    outputStorage
  });
}

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/vae-pointwise-fp16.ts
var ACE_FP16_VAE_INGRESS_PORTABLE_KERNEL_ID = "ace-vae-fp16-portable-ingress-v1";
var ACE_FP16_VAE_ADD_PORTABLE_KERNEL_ID = "ace-vae-fp16-portable-add-v1";
var FLOAT32_BYTES4 = Float32Array.BYTES_PER_ELEMENT;

// qa/fluid-audio/packages/acestep/src/webgpu/kernels/vae-snake-fp16.ts
var ACE_FP16_VAE_SNAKE_PORTABLE_KERNEL_ID = "ace-vae-fp16-portable-snake-v1";

// qa/fluid-audio/packages/acestep/src/webgpu/vae-chunks.ts
var ACE_VAE_DEFAULT_CHUNK_FRAMES = 256;
var ACE_VAE_DEFAULT_OVERLAP_FRAMES = 64;
function planAceVaeChunkedDecode(latentFrames, options = {}) {
  requirePositiveSafeInteger(latentFrames, "ACE VAE chunk latent frames");
  const chunkFrames = options.chunkFrames ?? ACE_VAE_DEFAULT_CHUNK_FRAMES;
  const overlapFrames = options.overlapFrames ?? ACE_VAE_DEFAULT_OVERLAP_FRAMES;
  const config = options.config ?? ACE_OOBLECK_DECODER_CONFIG;
  requirePositiveSafeInteger(chunkFrames, "ACE VAE chunk size");
  if (!Number.isSafeInteger(overlapFrames) || overlapFrames < 0) {
    throw new RangeError(
      "ACE VAE overlap must be a non-negative safe integer"
    );
  }
  const strideFrames = chunkFrames - 2 * overlapFrames;
  if (strideFrames <= 0) {
    throw new RangeError(
      "ACE VAE chunk size must exceed twice the overlap"
    );
  }
  const hopLength = config.downsamplingRatios.reduce(
    (product, ratio) => product * ratio,
    1
  );
  requirePositiveSafeInteger(hopLength, "ACE VAE hop length");
  const direct = latentFrames <= chunkFrames;
  const steps = direct ? 1 : Math.ceil(latentFrames / strideFrames);
  const windows = [];
  for (let index = 0; index < steps; index += 1) {
    const coreStartLatentFrame = direct ? 0 : index * strideFrames;
    const coreEndLatentFrame = direct ? latentFrames : Math.min(coreStartLatentFrame + strideFrames, latentFrames);
    if (coreStartLatentFrame >= coreEndLatentFrame) {
      throw new Error("ACE VAE chunk planner produced an empty core");
    }
    const windowStartLatentFrame = direct ? 0 : Math.max(0, coreStartLatentFrame - overlapFrames);
    const windowEndLatentFrame = direct ? latentFrames : Math.min(latentFrames, coreEndLatentFrame + overlapFrames);
    const latentWindowFrames = windowEndLatentFrame - windowStartLatentFrame;
    const discardPrefixLatentFrames = coreStartLatentFrame - windowStartLatentFrame;
    const discardSuffixLatentFrames = windowEndLatentFrame - coreEndLatentFrame;
    windows.push(Object.freeze({
      index,
      coreStartLatentFrame,
      coreEndLatentFrame,
      windowStartLatentFrame,
      windowEndLatentFrame,
      latentWindowFrames,
      discardPrefixLatentFrames,
      discardSuffixLatentFrames,
      discardPrefixAudioFrames: discardPrefixLatentFrames * hopLength,
      discardSuffixAudioFrames: discardSuffixLatentFrames * hopLength,
      outputStartAudioFrame: coreStartLatentFrame * hopLength,
      outputAudioFrames: (coreEndLatentFrame - coreStartLatentFrame) * hopLength,
      decodedAudioFrames: latentWindowFrames * hopLength
    }));
  }
  const maximumWindowFrames = Math.max(
    ...windows.map((window) => window.latentWindowFrames)
  );
  const outputAudioFrames = latentFrames * hopLength;
  const outputInterleavedElements = checkedAceProduct(
    [outputAudioFrames, config.audioChannels],
    "ACE VAE output samples"
  );
  const maximumDecodedInterleavedElements = checkedAceProduct(
    [maximumWindowFrames, hopLength, config.audioChannels],
    "ACE VAE maximum decoded window"
  );
  const plannedOutputFrames = windows.reduce(
    (total, window) => total + window.outputAudioFrames,
    0
  );
  if (plannedOutputFrames !== outputAudioFrames) {
    throw new Error("ACE VAE chunk cores do not cover the output exactly once");
  }
  return Object.freeze({
    batch: 1,
    latentFrames,
    chunkFrames,
    overlapFrames,
    strideFrames,
    hopLength,
    sampleRateHz: config.sampleRateHz,
    audioChannels: config.audioChannels,
    outputAudioFrames,
    outputInterleavedElements,
    outputFloat32Bytes: outputInterleavedElements * Float32Array.BYTES_PER_ELEMENT,
    maximumWindowFrames,
    maximumDecodedInterleavedElements,
    maximumDecodedFloat32Bytes: maximumDecodedInterleavedElements * Float32Array.BYTES_PER_ELEMENT,
    direct,
    windows: Object.freeze(windows),
    decoderWorkspacePlan: planAceVaeDecoder(maximumWindowFrames, config)
  });
}

// qa/fluid-audio/packages/acestep/src/webgpu/vae-fp16-decoder.ts
var FLOAT16_BYTES = 2;
var FLOAT32_BYTES5 = Float32Array.BYTES_PER_ELEMENT;
var MAX_WGSL_DYNAMIC_OFFSET = 4294967295;
var ACE_OPT_0011_VAE_FP16_DECODER_OPERATION_COUNT = 88;
var ACE_OPT_0011_VAE_FP16_DECODER_GRAPH_QUANTUM_COUNT = 3942;
var ACE_OPT_0011_VAE_FP16_DECODER_SEQUENCE_QUANTUM_COUNT = 3943;
var ACE_OPT_0011_VAE_FP16_DECODER_CONTROL_RECORD_BYTES = 16;
var ACE_OPT_0011_VAE_FP16_WINDOW_QUANTA_PER_COMMAND_BUFFER = 8;
var ACE_OPT_0011_VAE_FP16_C512_GRAPH_QUANTUM_COUNT = 7854;
var ACE_OPT_0011_VAE_FP16_C512_SEQUENCE_QUANTUM_COUNT = 7855;
var ACE_OPT_0011_VAE_FP16_C512_WORKSPACE_BYTES = 251658240;
var ACE_OPT_0011_VAE_FP16_C512_CONTROL_BYTES = 2010640;
var ACE_OPT_0011_VAE_FP16_C512_COMMAND_BUFFER_COUNT_AT_BATCH8 = 983;
var ACE_OPT_0035_VAE_FP16_C2378_MAXIMUM_WINDOW_FRAMES = 2378;
var ACE_CAPPED_VAE_FP16_C2176_MAXIMUM_WINDOW_FRAMES = 2176;
var ACE_OPT_0011_VAE_FP16_PORTABLE_KERNEL_TOPOLOGY = Object.freeze({
  id: ACE_OPT_0011_VAE_FP16_PORTABLE_KERNEL_SET_ID,
  backend: "portable-workgroup",
  ingress: ACE_FP16_VAE_INGRESS_PORTABLE_KERNEL_ID,
  conv1dK1: ACE_FP16_VAE_CONV1D_PORTABLE_KERNEL_ID,
  conv1dK7: ACE_FP16_VAE_CONV1D_PORTABLE_KERNEL_ID,
  convTranspose1d: ACE_FP16_VAE_CONV_TRANSPOSE1D_PORTABLE_KERNEL_ID,
  snake: ACE_FP16_VAE_SNAKE_PORTABLE_KERNEL_ID,
  add: ACE_FP16_VAE_ADD_PORTABLE_KERNEL_ID
});
var ACE_OPT_0011_VAE_FP16_FIXED32_K7_HYBRID_KERNEL_TOPOLOGY = Object.freeze({
  id: ACE_OPT_0011_VAE_FP16_FIXED32_K7_HYBRID_KERNEL_SET_ID,
  backend: "fixed32-subgroup-k7-hybrid",
  ingress: ACE_FP16_VAE_INGRESS_PORTABLE_KERNEL_ID,
  conv1dK1: ACE_FP16_VAE_CONV1D_PORTABLE_KERNEL_ID,
  conv1dK7: ACE_FP16_VAE_CONV1D_SUBGROUP_KERNEL_ID,
  convTranspose1d: ACE_FP16_VAE_CONV_TRANSPOSE1D_PORTABLE_KERNEL_ID,
  snake: ACE_FP16_VAE_SNAKE_PORTABLE_KERNEL_ID,
  add: ACE_FP16_VAE_ADD_PORTABLE_KERNEL_ID
});
var ACE_OPT_0028_VAE_FP16_PORTABLE_EXACT_PACKED_KERNEL_TOPOLOGY = Object.freeze({
  id: ACE_OPT_0028_VAE_FP16_PORTABLE_EXACT_PACKED_KERNEL_SET_ID,
  backend: "portable-workgroup-exact-packed",
  ingress: ACE_FP16_VAE_INGRESS_PORTABLE_KERNEL_ID,
  conv1dK1: ACE_OPT_0028_VAE_K1_PORTABLE_PACKED_KERNEL_ID,
  conv1dK7: ACE_FP16_VAE_CONV1D_PORTABLE_KERNEL_ID,
  convTranspose1d: ACE_OPT_0028_VAE_CONV_TRANSPOSE1D_PORTABLE_PACKED_KERNEL_ID,
  snake: ACE_FP16_VAE_SNAKE_PORTABLE_KERNEL_ID,
  add: ACE_FP16_VAE_ADD_PORTABLE_KERNEL_ID
});
var ACE_OPT_0015_VAE_FP16_FIXED32_K7_CONGRUENT_TRANSPOSE_KERNEL_TOPOLOGY = Object.freeze({
  id: ACE_OPT_0015_VAE_FP16_FIXED32_K7_CONGRUENT_TRANSPOSE_KERNEL_SET_ID,
  backend: "fixed32-subgroup-k7-congruent-transpose-hybrid",
  ingress: ACE_FP16_VAE_INGRESS_PORTABLE_KERNEL_ID,
  conv1dK1: ACE_FP16_VAE_CONV1D_PORTABLE_KERNEL_ID,
  conv1dK7: ACE_FP16_VAE_CONV1D_SUBGROUP_KERNEL_ID,
  convTranspose1d: ACE_FP16_VAE_CONV_TRANSPOSE1D_CONGRUENT_KERNEL_ID,
  snake: ACE_FP16_VAE_SNAKE_PORTABLE_KERNEL_ID,
  add: ACE_FP16_VAE_ADD_PORTABLE_KERNEL_ID
});
var ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_KERNEL_TOPOLOGY = Object.freeze({
  id: ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_KERNEL_SET_ID,
  backend: "fixed32-subgroup-exact-packed",
  ingress: ACE_FP16_VAE_INGRESS_PORTABLE_KERNEL_ID,
  conv1dK1: ACE_OPT_0025_VAE_K1_SUBGROUP_GEMM_KERNEL_ID,
  conv1dK7: ACE_FP16_VAE_CONV1D_SUBGROUP_KERNEL_ID,
  convTranspose1d: ACE_OPT_0026_VAE_CONV_TRANSPOSE1D_KERNEL_ID,
  snake: ACE_FP16_VAE_SNAKE_PORTABLE_KERNEL_ID,
  add: ACE_FP16_VAE_ADD_PORTABLE_KERNEL_ID
});
var ACE_OPT_0040_VAE_FP16_FIXED32_SHAPE_SELECTED_KERNEL_TOPOLOGY = Object.freeze({
  id: ACE_OPT_0040_VAE_FP16_FIXED32_SHAPE_SELECTED_KERNEL_SET_ID,
  backend: "fixed32-subgroup-exact-packed-shape-selected",
  ingress: ACE_FP16_VAE_INGRESS_PORTABLE_KERNEL_ID,
  conv1dK1: ACE_OPT_0025_VAE_K1_SUBGROUP_GEMM_KERNEL_ID,
  conv1dK7: ACE_FP16_VAE_CONV1D_SUBGROUP_KERNEL_ID,
  convTranspose1d: ACE_OPT_0040_VAE_CONV_TRANSPOSE1D_SHAPE_SELECTOR_KERNEL_ID,
  snake: ACE_FP16_VAE_SNAKE_PORTABLE_KERNEL_ID,
  add: ACE_FP16_VAE_ADD_PORTABLE_KERNEL_ID
});
var ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_KERNEL_TOPOLOGY = Object.freeze({
  id: ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_KERNEL_SET_ID,
  backend: "fixed32-subgroup-revision7-k4-shape-selected",
  ingress: ACE_FP16_VAE_INGRESS_PORTABLE_KERNEL_ID,
  conv1dK1: ACE_OPT_0025_VAE_K1_SUBGROUP_GEMM_KERNEL_ID,
  conv1dK7: ACE_OPT_0057_VAE_K7_SHAPE_SELECTOR_KERNEL_ID,
  convTranspose1d: ACE_OPT_0052_VAE_CONV_TRANSPOSE1D_K4_SHAPE_SELECTOR_KERNEL_ID,
  snake: ACE_FP16_VAE_SNAKE_PORTABLE_KERNEL_ID,
  add: ACE_FP16_VAE_ADD_PORTABLE_KERNEL_ID
});
var ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_KERNEL_TOPOLOGY = Object.freeze({
  id: ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_KERNEL_SET_ID,
  backend: "fixed32-subgroup-dual-k4-quality",
  ingress: ACE_FP16_VAE_INGRESS_PORTABLE_KERNEL_ID,
  conv1dK1: ACE_OPT_0025_VAE_K1_SUBGROUP_GEMM_KERNEL_ID,
  conv1dK7: ACE_OPT_0057_VAE_K7_SHAPE_SELECTOR_KERNEL_ID,
  convTranspose1d: ACE_OPT_0052_VAE_CONV_TRANSPOSE1D_K4_SHAPE_SELECTOR_KERNEL_ID,
  snake: ACE_FP16_VAE_SNAKE_PORTABLE_KERNEL_ID,
  add: ACE_FP16_VAE_ADD_PORTABLE_KERNEL_ID
});
var ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_KERNEL_TOPOLOGY = Object.freeze({
  id: ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_KERNEL_SET_ID,
  backend: "portable-workgroup-dual-k4",
  ingress: ACE_FP16_VAE_INGRESS_PORTABLE_KERNEL_ID,
  conv1dK1: ACE_OPT_0028_VAE_K1_PORTABLE_PACKED_KERNEL_ID,
  conv1dK7: ACE_OPT_0088_VAE_K7_PORTABLE_SHAPE_SELECTOR_KERNEL_ID,
  convTranspose1d: ACE_OPT_0088_VAE_CONV_TRANSPOSE1D_K4_PORTABLE_SHAPE_SELECTOR_KERNEL_ID,
  snake: ACE_FP16_VAE_SNAKE_PORTABLE_KERNEL_ID,
  add: ACE_FP16_VAE_ADD_PORTABLE_KERNEL_ID
});
var AceOpt0011Fp16VaeDecoderContractError = class extends Error {
  code = "INVALID_OPT_0011_FP16_VAE_DECODER";
  constructor(message) {
    super(message);
    this.name = "AceOpt0011Fp16VaeDecoderContractError";
  }
};
var CANONICAL_PLAN = planAceVaeDecoder(ACE_OPT_0011_VAE_WINDOW_FRAMES);
var CANONICAL_COOPERATIVE_PLAN = planAceVaeDecoderQuanta(CANONICAL_PLAN);
var REVISION7_TRANSPOSE_K4_REUSE_BY_TENSOR = new Map(ACE_VAE_REVISION7_TRANSPOSE_K4_CONTRACTS.map(
  ({ tensor, reuseAxis }) => [tensor, reuseAxis]
));
function planAceOpt0011Fp16VaeChunkDispatches(latentFrames, maximumWindowFramesProfile, recordAlignment) {
  requireCanonicalContract();
  if (maximumWindowFramesProfile !== 256 && maximumWindowFramesProfile !== 512 && maximumWindowFramesProfile !== ACE_CAPPED_VAE_FP16_C2176_MAXIMUM_WINDOW_FRAMES && maximumWindowFramesProfile !== ACE_OPT_0035_VAE_FP16_C2378_MAXIMUM_WINDOW_FRAMES) {
    throw contractError(
      "chunk runtime supports only 256-, 512-, capped 2176-, or OPT-0035 2378-frame profiles"
    );
  }
  const chunkPlan = planAceVaeChunkedDecode(latentFrames, {
    chunkFrames: maximumWindowFramesProfile,
    overlapFrames: ACE_VAE_DEFAULT_OVERLAP_FRAMES
  });
  const uniqueWindowFrames = Object.freeze(
    [...new Set(chunkPlan.windows.map((window) => window.latentWindowFrames))].sort((left, right) => left - right)
  );
  if (uniqueWindowFrames.length === 0 || uniqueWindowFrames.at(-1) !== chunkPlan.maximumWindowFrames || uniqueWindowFrames.some(
    (frames) => !Number.isSafeInteger(frames) || frames <= 0 || frames > maximumWindowFramesProfile
  )) {
    throw contractError("chunk planner produced an invalid exact-shape inventory");
  }
  const topologies = Object.freeze(uniqueWindowFrames.map((inputFrames) => {
    const plan = planAceVaeDecoder(inputFrames);
    const cooperative = planAceVaeDecoderQuanta(plan);
    return planWindowTopology(plan, cooperative, recordAlignment);
  }));
  const maximumTopology = topologies.at(-1);
  if (maximumTopology === void 0 || JSON.stringify(maximumTopology.plan) !== JSON.stringify(chunkPlan.decoderWorkspacePlan)) {
    throw contractError(
      "exact-shape inventory diverged from the chunk planner workspace graph"
    );
  }
  const topologyIndexByFrames = new Map(
    uniqueWindowFrames.map((frames, index) => [frames, index])
  );
  const windowTopologyIndices = Object.freeze(chunkPlan.windows.map((window) => {
    const index = topologyIndexByFrames.get(window.latentWindowFrames);
    if (index === void 0) {
      throw contractError(`window ${window.index} lost its exact topology`);
    }
    return index;
  }));
  if (new Set(windowTopologyIndices).size !== topologies.length || windowTopologyIndices.some(
    (topologyIndex, windowIndex) => topologies[topologyIndex]?.inputFrames !== chunkPlan.windows[windowIndex]?.latentWindowFrames
  )) {
    throw contractError("chunk windows do not cover every exact topology");
  }
  let uniqueDynamicControlBytes = 0;
  let aggregateGraphQuantumCount = 0;
  let aggregateSequenceQuantumCount = 0;
  let aggregateCommandBufferCountAtBatch8 = 0;
  for (const topology of topologies) {
    uniqueDynamicControlBytes = checkedSum(
      uniqueDynamicControlBytes,
      topology.dynamicControls.byteLength,
      "unique dynamic-control bytes"
    );
  }
  for (const topologyIndex of windowTopologyIndices) {
    const topology = topologies[topologyIndex];
    aggregateGraphQuantumCount = checkedSum(
      aggregateGraphQuantumCount,
      topology.graphQuantumCount,
      "aggregate graph quanta"
    );
    aggregateSequenceQuantumCount = checkedSum(
      aggregateSequenceQuantumCount,
      topology.sequenceQuantumCount,
      "aggregate sequence quanta"
    );
    aggregateCommandBufferCountAtBatch8 = checkedSum(
      aggregateCommandBufferCountAtBatch8,
      topology.commandBufferCountAtBatch8,
      "aggregate batch-8 command buffers"
    );
  }
  return Object.freeze({
    maximumWindowFramesProfile,
    chunkPlan,
    uniqueWindowFrames,
    topologies,
    windowTopologyIndices,
    maximumFp16WorkspaceBytes: Math.max(
      ...topologies.map((topology) => topology.fp16WorkspaceBytes)
    ),
    uniqueDynamicControlBytes,
    aggregateGraphQuantumCount,
    aggregateSequenceQuantumCount,
    aggregateCommandBufferCountAtBatch8
  });
}
function planWindowTopology(plan, cooperativePlan, recordAlignment) {
  requireGeometryNeutralPlan(plan, cooperativePlan);
  const dynamicControls = planDynamicControls(
    plan,
    cooperativePlan,
    recordAlignment
  );
  const sequenceQuantumCount = checkedSum(
    cooperativePlan.quantumCount,
    1,
    "window sequence quanta"
  );
  if (dynamicControls.recordCount !== sequenceQuantumCount) {
    throw contractError("window controls do not cover ingress plus graph");
  }
  const decoderCommandBufferCountAtBatch8 = Math.ceil(
    sequenceQuantumCount / ACE_OPT_0011_VAE_FP16_WINDOW_QUANTA_PER_COMMAND_BUFFER
  );
  const topology = Object.freeze({
    inputFrames: plan.inputFrames,
    plan,
    cooperativePlan,
    dynamicControls,
    operationCount: ACE_OPT_0011_VAE_FP16_DECODER_OPERATION_COUNT,
    graphQuantumCount: cooperativePlan.quantumCount,
    sequenceQuantumCount,
    quantumFamilyCounts: freezeKindCounts(countKinds(cooperativePlan.quanta)),
    activeStagingInputBytes: checkedProduct(
      plan.inputElements,
      FLOAT32_BYTES5,
      "active staging-input bytes"
    ),
    activeDecoderInputBytes: checkedProduct(
      plan.inputElements,
      FLOAT16_BYTES,
      "active decoder-input bytes"
    ),
    activeOutputBytes: checkedProduct(
      plan.outputElements,
      FLOAT32_BYTES5,
      "active output bytes"
    ),
    fp16WorkspaceBytes: checkedProduct(
      plan.maximumActivationElements,
      FLOAT16_BYTES,
      "FP16 workspace bytes"
    ),
    decoderCommandBufferCountAtBatch8,
    commandBufferCountAtBatch8: checkedSum(
      decoderCommandBufferCountAtBatch8,
      1,
      "window command buffers"
    )
  });
  requirePinnedWindowTopology(topology);
  return topology;
}
function planDynamicControls(plan, cooperativePlan, recordAlignment) {
  if (!isValidGpuAlignment(recordAlignment)) {
    throw contractError("dynamic controls require a valid uniform alignment");
  }
  const ingress = freezeControlRecord({
    recordIndex: 0,
    sequenceIndex: 0,
    graphQuantumIndex: null,
    operationIndex: null,
    operationLabel: "f32-latent-to-f16-decoder-input",
    operationKind: "ingress-cast",
    outputBase: 0,
    outputCount: plan.inputElements,
    byteOffset: 0
  });
  const records = [ingress];
  for (const quantum of cooperativePlan.quanta) {
    const primitive = quantum.primitives[0];
    const recordIndex = quantum.index + 1;
    const byteOffset = checkedProduct(
      recordIndex,
      recordAlignment,
      "dynamic-control byte offset"
    );
    if (byteOffset > MAX_WGSL_DYNAMIC_OFFSET) {
      throw contractError("dynamic-control offset exceeds WGSL's u32 domain");
    }
    records.push(freezeControlRecord({
      recordIndex,
      sequenceIndex: recordIndex,
      graphQuantumIndex: quantum.index,
      operationIndex: quantum.operationIndex,
      operationLabel: quantum.operationLabel,
      operationKind: quantum.operationKind,
      outputBase: primitive.outputBase,
      outputCount: primitive.outputCount,
      byteOffset
    }));
  }
  if (records.length !== cooperativePlan.quantumCount + 1 || records.some(
    (record2, index) => record2.recordIndex !== index || record2.sequenceIndex !== index || record2.byteOffset !== index * recordAlignment
  )) {
    throw contractError("dynamic-control records are not complete and dense");
  }
  const byteLength = checkedSum(
    records.at(-1).byteOffset,
    ACE_OPT_0011_VAE_FP16_DECODER_CONTROL_RECORD_BYTES,
    "dynamic-control byte length"
  );
  return Object.freeze({
    recordBytes: ACE_OPT_0011_VAE_FP16_DECODER_CONTROL_RECORD_BYTES,
    recordAlignment,
    recordCount: records.length,
    byteLength,
    records: Object.freeze(records)
  });
}
function requireGeometryNeutralPlan(plan, cooperativePlan) {
  if (!Number.isSafeInteger(plan.inputFrames) || plan.inputFrames <= 0 || plan.inputFrames > ACE_OPT_0035_VAE_FP16_C2378_MAXIMUM_WINDOW_FRAMES || plan.batch !== 1 || JSON.stringify(plan.config) !== JSON.stringify(CANONICAL_PLAN.config) || plan.operations.length !== ACE_OPT_0011_VAE_FP16_DECODER_OPERATION_COUNT || plan.primitiveCount !== ACE_OPT_0011_VAE_FP16_DECODER_OPERATION_COUNT || plan.requiredTensorNames.length !== ACE_EXPERIMENTAL_VAE_LOGICAL_TENSOR_COUNT || plan.requiredTensorNames.some(
    (name, index) => name !== CANONICAL_PLAN.requiredTensorNames[index]
  ) || plan.parameterElements !== CANONICAL_PLAN.parameterElements || plan.parameterBytes !== CANONICAL_PLAN.parameterBytes || plan.outputFrames * CANONICAL_PLAN.inputFrames !== CANONICAL_PLAN.outputFrames * plan.inputFrames) {
    throw contractError(
      `${plan.inputFrames}-frame graph lost the geometry-neutral 88-op/145-tensor skeleton`
    );
  }
  for (let index = 0; index < plan.operations.length; index += 1) {
    requireGeometryNeutralOperation(
      plan.operations[index],
      CANONICAL_PLAN.operations[index],
      plan.inputFrames,
      index
    );
    requirePrecisionEntry(
      plan.operations[index],
      index,
      ACE_OPT_0011_VAE_FP16_PRECISION_MAP.entries[index + 1]
    );
  }
  if (cooperativePlan.quantumCount !== cooperativePlan.quanta.length || cooperativePlan.primitiveDispatchCount !== cooperativePlan.quantumCount || cooperativePlan.quanta.some((quantum, index) => {
    const operation = plan.operations[quantum.operationIndex];
    const primitive = quantum.primitives[0];
    if (quantum.index !== index || operation === void 0 || quantum.operationLabel !== operation.label || quantum.operationKind !== operation.kind || quantum.primitives.length !== 1 || primitive === void 0 || primitive.controlRecordIndex !== quantum.index) return true;
    return operation.kind === "conv-transpose1d" ? primitive.physicalPartIndex !== 0 || primitive.firstOutputChannel !== 0 || primitive.outputChannels !== operation.shape.outputChannels : primitive.physicalPartIndex !== void 0;
  })) {
    throw contractError(
      `${plan.inputFrames}-frame graph lost the one-primitive FIFO topology`
    );
  }
}
function requireGeometryNeutralOperation(operation, canonical, inputFrames, operationIndex) {
  if (operation.kind !== canonical.kind || operation.label !== canonical.label || operation.input !== canonical.input || operation.output !== canonical.output) {
    throw contractError(`operation ${operationIndex} changed its graph skeleton`);
  }
  switch (operation.kind) {
    case "conv1d":
      if (canonical.kind !== "conv1d" || operation.weight !== canonical.weight || operation.bias !== canonical.bias || operation.shape.batch !== canonical.shape.batch || operation.shape.inputChannels !== canonical.shape.inputChannels || operation.shape.outputChannels !== canonical.shape.outputChannels || operation.shape.kernelSize !== canonical.shape.kernelSize || operation.shape.stride !== canonical.shape.stride || operation.shape.dilation !== canonical.shape.dilation || operation.shape.padding !== canonical.shape.padding || operation.shape.inputFrames * CANONICAL_PLAN.inputFrames !== canonical.shape.inputFrames * inputFrames) {
        throw contractError(
          `operation ${operationIndex} changed its geometry-neutral Conv1D contract`
        );
      }
      return;
    case "conv-transpose1d":
      if (canonical.kind !== "conv-transpose1d" || operation.weight !== canonical.weight || operation.bias !== canonical.bias || operation.shape.batch !== canonical.shape.batch || operation.shape.inputChannels !== canonical.shape.inputChannels || operation.shape.outputChannels !== canonical.shape.outputChannels || operation.shape.kernelSize !== canonical.shape.kernelSize || operation.shape.stride !== canonical.shape.stride || operation.shape.dilation !== canonical.shape.dilation || operation.shape.padding !== canonical.shape.padding || operation.shape.outputPadding !== canonical.shape.outputPadding || operation.shape.inputFrames * CANONICAL_PLAN.inputFrames !== canonical.shape.inputFrames * inputFrames) {
        throw contractError(
          `operation ${operationIndex} changed its geometry-neutral transpose contract`
        );
      }
      return;
    case "snake":
      if (canonical.kind !== "snake" || operation.alpha !== canonical.alpha || operation.beta !== canonical.beta || operation.shape.batch !== canonical.shape.batch || operation.shape.channels !== canonical.shape.channels || operation.shape.frames * CANONICAL_PLAN.inputFrames !== canonical.shape.frames * inputFrames) {
        throw contractError(
          `operation ${operationIndex} changed its geometry-neutral Snake contract`
        );
      }
      return;
    case "add":
      if (canonical.kind !== "add" || operation.right !== canonical.right || operation.shape.batch !== canonical.shape.batch || operation.shape.channels !== canonical.shape.channels || operation.shape.frames * CANONICAL_PLAN.inputFrames !== canonical.shape.frames * inputFrames) {
        throw contractError(
          `operation ${operationIndex} changed its geometry-neutral Add contract`
        );
      }
  }
}
function requirePinnedWindowTopology(topology) {
  const counts = topology.quantumFamilyCounts;
  if (topology.inputFrames === 256) {
    if (topology.graphQuantumCount !== ACE_OPT_0011_VAE_FP16_DECODER_GRAPH_QUANTUM_COUNT || topology.sequenceQuantumCount !== ACE_OPT_0011_VAE_FP16_DECODER_SEQUENCE_QUANTUM_COUNT || counts.conv1d !== 2459 || counts["conv-transpose1d"] !== 322 || counts.snake !== 813 || counts.add !== 348 || topology.fp16WorkspaceBytes !== 125829120 || topology.commandBufferCountAtBatch8 !== 494 || topology.dynamicControls.recordAlignment === 256 && topology.dynamicControls.byteLength !== 1009168) {
      throw contractError("canonical B-256 window topology changed");
    }
  }
  if (topology.inputFrames === 512) {
    if (topology.graphQuantumCount !== ACE_OPT_0011_VAE_FP16_C512_GRAPH_QUANTUM_COUNT || topology.sequenceQuantumCount !== ACE_OPT_0011_VAE_FP16_C512_SEQUENCE_QUANTUM_COUNT || counts.conv1d !== 4909 || counts["conv-transpose1d"] !== 644 || counts.snake !== 1611 || counts.add !== 690 || topology.fp16WorkspaceBytes !== ACE_OPT_0011_VAE_FP16_C512_WORKSPACE_BYTES || topology.commandBufferCountAtBatch8 !== ACE_OPT_0011_VAE_FP16_C512_COMMAND_BUFFER_COUNT_AT_BATCH8 || topology.dynamicControls.recordAlignment === 256 && topology.dynamicControls.byteLength !== ACE_OPT_0011_VAE_FP16_C512_CONTROL_BYTES) {
      throw contractError("canonical C-512 window topology changed");
    }
  }
}
function requireCanonicalContract() {
  requireAceOpt0011VaeDecoderGeometry(CANONICAL_PLAN);
  requireGeometryNeutralPlan(CANONICAL_PLAN, CANONICAL_COOPERATIVE_PLAN);
  if (CANONICAL_PLAN.operations.length !== ACE_OPT_0011_VAE_FP16_DECODER_OPERATION_COUNT || CANONICAL_PLAN.primitiveCount !== ACE_OPT_0011_VAE_FP16_DECODER_OPERATION_COUNT || CANONICAL_COOPERATIVE_PLAN.quantumCount !== ACE_OPT_0011_VAE_FP16_DECODER_GRAPH_QUANTUM_COUNT || CANONICAL_COOPERATIVE_PLAN.primitiveDispatchCount !== ACE_OPT_0011_VAE_FP16_DECODER_GRAPH_QUANTUM_COUNT || CANONICAL_COOPERATIVE_PLAN.quanta.some((quantum) => {
    const primitive = quantum.primitives[0];
    const operation = CANONICAL_PLAN.operations[quantum.operationIndex];
    if (primitive === void 0 || quantum.primitives.length !== 1 || primitive.controlRecordIndex !== quantum.index || operation === void 0) return true;
    return operation.kind === "conv-transpose1d" ? primitive.physicalPartIndex !== 0 || primitive.firstOutputChannel !== 0 || primitive.outputChannels !== operation.shape.outputChannels : primitive.physicalPartIndex !== void 0;
  })) {
    throw contractError("canonical B-256 graph topology changed");
  }
  const kindCounts = countKinds(CANONICAL_COOPERATIVE_PLAN.quanta);
  if (kindCounts.conv1d !== 2459 || kindCounts["conv-transpose1d"] !== 322 || kindCounts.snake !== 813 || kindCounts.add !== 348) {
    throw contractError("canonical B-256 quantum-family counts changed");
  }
  const precision = ACE_OPT_0011_VAE_FP16_PRECISION_MAP;
  if (precision.entries.length !== ACE_OPT_0011_VAE_FP16_DECODER_OPERATION_COUNT + 1 || hashAceVaePrecisionMap(precision) !== ACE_OPT_0011_VAE_FP16_PRECISION_MAP_SHA256) {
    throw contractError("the 89-entry precision-map identity changed");
  }
  const ingress = precision.entries[0];
  if (ingress.sequenceIndex !== 0 || ingress.graphOperationIndex !== null || ingress.label !== "f32-latent-to-f16-decoder-input" || ingress.kind !== "ingress-cast" || ingress.output.storage !== "float16") {
    throw contractError("the decoder ingress precision contract changed");
  }
  for (const [operationIndex, operation] of CANONICAL_PLAN.operations.entries()) {
    requirePrecisionEntry(operation, operationIndex, precision.entries[operationIndex + 1]);
  }
}
function requirePrecisionEntry(operation, operationIndex, precision) {
  const expectedFamily = operation.kind === "conv1d" ? operation.shape.kernelSize === 1 ? "conv1d-k1" : operation.shape.kernelSize === 7 ? "conv1d-k7" : void 0 : operation.kind;
  const isFinal = operationIndex === ACE_OPT_0011_VAE_FP16_DECODER_OPERATION_COUNT - 1;
  if (precision.sequenceIndex !== operationIndex + 1 || precision.graphOperationIndex !== operationIndex || precision.label !== operation.label || precision.kind !== operation.kind || precision.kernelFamily !== expectedFamily || precision.inputs.some((input) => input.storage !== "float16") || precision.parameters.some(
    (parameter) => parameter.storage !== "float16"
  ) || precision.registerArithmetic !== "float32" || precision.output.slot !== operation.output || precision.output.storage !== (isFinal ? "float32" : "float16") || precision.output.rounding !== (isFinal ? "none" : "ieee-binary16-round-to-nearest-ties-to-even")) {
    throw contractError(`operation ${operationIndex} precision contract changed`);
  }
  if (isFinal && (operation.kind !== "conv1d" || operation.shape.kernelSize !== 7 || operation.bias !== void 0 || operation.output !== "output")) {
    throw contractError("final FP32 boundary is not no-bias K7 Conv1D");
  }
  if (!isFinal && operation.output === "output") {
    throw contractError("an intermediate operation targets the FP32 output");
  }
}
function freezeControlRecord(record2) {
  return Object.freeze(record2);
}
function countKinds(quanta) {
  const counts = {
    conv1d: 0,
    "conv-transpose1d": 0,
    snake: 0,
    add: 0
  };
  for (const quantum of quanta) counts[quantum.operationKind] += 1;
  return counts;
}
function freezeKindCounts(counts) {
  return Object.freeze({ ...counts });
}
function checkedProduct(left, right, label) {
  const product = left * right;
  if (!Number.isSafeInteger(product) || product < 0) {
    throw contractError(`${label} is not a safe integer`);
  }
  return product;
}
function checkedSum(left, right, label) {
  const sum = left + right;
  if (!Number.isSafeInteger(sum) || sum < 0) {
    throw contractError(`${label} is not a safe integer`);
  }
  return sum;
}
function isValidGpuAlignment(value) {
  return Number.isSafeInteger(value) && value >= 4 && Number.isInteger(Math.log2(value));
}
function contractError(message) {
  return new AceOpt0011Fp16VaeDecoderContractError(`OPT-0011 ${message}`);
}

// qa/fluid-audio/packages/acestep/src/runtime/protocol.ts
var ACE_FATAL_GPU_ERROR_CODES = [
  "WEBGPU_DEVICE_LOST",
  "WEBGPU_UNCAPTURED_ERROR"
];
function isAceFatalGpuErrorCode(value) {
  return typeof value === "string" && ACE_FATAL_GPU_ERROR_CODES.includes(value);
}
function isAceWorkerMessage(value) {
  if (!isRecord3(value) || typeof value.type !== "string") return false;
  switch (value.type) {
    case "initialization-progress":
      return hasOnlyKeys2(value, ["type", "requestId", "progress"]) && isRequestId(value.requestId) && isAceInitializationProgress(value.progress);
    case "ready":
      return hasOnlyKeys2(value, ["type", "requestId", "diagnostics"]) && isRequestId(value.requestId) && isAceRuntimeDiagnosticsValue(value.diagnostics);
    case "initialization-cancelled":
      return hasOnlyKeys2(value, ["type", "requestId"]) && isRequestId(value.requestId);
    case "generation-progress":
      return hasOnlyKeys2(value, ["type", "jobId", "progress"]) && isRequestId(value.jobId) && isAceGenerationProgress(value.progress);
    case "diagnostic":
      return hasOnlyKeys2(value, [
        "type",
        "requestId",
        "jobId",
        "diagnostic"
      ]) && (value.requestId === void 0 || isRequestId(value.requestId)) && (value.jobId === void 0 || isRequestId(value.jobId)) && isAceDiagnostic(value.diagnostic);
    case "result":
      return hasOnlyKeys2(value, ["type", "jobId", "result"]) && isRequestId(value.jobId) && isAceGenerationResultValue(value.result);
    case "cancelled":
      return hasOnlyKeys2(value, ["type", "jobId"]) && isRequestId(value.jobId);
    case "disposed":
      return hasOnlyKeys2(value, ["type", "requestId"]) && isRequestId(value.requestId);
    case "error":
      return hasOnlyKeys2(value, ["type", "requestId", "jobId", "error"]) && (value.requestId === void 0 || isRequestId(value.requestId)) && (value.jobId === void 0 || isRequestId(value.jobId)) && isSerializedWorkerError(value.error);
    default:
      return false;
  }
}
function isAceGenerationResultValue(value) {
  return isRecord3(value) && hasOnlyKeys2(value, [
    "audio",
    "audioStorageId",
    "mimeType",
    "sampleRateHz",
    "channelCount",
    "frameCount",
    "durationSeconds",
    "seed",
    "generationProfile",
    "modelManifestId",
    "modelManifestSha256",
    "diagnostics",
    "metrics"
  ]) && value.audio instanceof Blob && value.audio.type === "audio/wav" && typeof value.audioStorageId === "string" && /^(?!\.{1,2}$)[A-Za-z0-9._-]{1,96}$/.test(value.audioStorageId) && value.mimeType === "audio/wav" && value.sampleRateHz === ACE_SAMPLE_RATE_HZ && value.channelCount === ACE_CHANNEL_COUNT && isPositiveSafeInteger(value.frameCount) && isNonNegativeFinite2(value.durationSeconds) && value.durationSeconds === value.frameCount / ACE_SAMPLE_RATE_HZ && isAceSeed(value.seed) && value.generationProfile === "ace-turbo-v1-correctness" && isNonEmptyString(value.modelManifestId) && isSha256(value.modelManifestSha256) && isAceRuntimeDiagnosticsValue(value.diagnostics) && value.diagnostics.modelManifestId === value.modelManifestId && value.diagnostics.modelManifestSha256 === value.modelManifestSha256 && isGenerationMetrics(
    value.metrics,
    value.frameCount,
    value.durationSeconds,
    value.diagnostics
  );
}
function isAceDiagnostic(value) {
  return isRecord3(value) && hasOnlyKeys2(value, [
    "severity",
    "code",
    "message",
    "elapsedMs",
    "stage",
    "details"
  ]) && (value.severity === "info" || value.severity === "warning" || value.severity === "error") && isNonEmptyString(value.code) && isNonEmptyString(value.message) && isNonNegativeFinite2(value.elapsedMs) && (value.stage === void 0 || isAceGenerationStage(value.stage)) && (value.details === void 0 || isDiagnosticDetails(value.details));
}
function isSerializedWorkerError(value) {
  return isRecord3(value) && hasOnlyKeys2(value, ["name", "message", "code", "stack", "context"]) && isNonEmptyString(value.name) && typeof value.message === "string" && isNonEmptyString(value.code) && (value.stack === void 0 || typeof value.stack === "string") && (value.context === void 0 || isFailureContext(value.context));
}
function isFailureContext(value) {
  if (!isRecord3(value)) return false;
  return hasOnlyKeys2(value, [
    "stage",
    "operation",
    "resourceLabel",
    "requestedBytes",
    "modelManifestId",
    "executionProfileId"
  ]) && (value.stage === void 0 || isAceGenerationStage(value.stage)) && (value.operation === void 0 || typeof value.operation === "string") && (value.resourceLabel === void 0 || typeof value.resourceLabel === "string") && (value.requestedBytes === void 0 || isRequestId(value.requestedBytes)) && (value.modelManifestId === void 0 || typeof value.modelManifestId === "string") && (value.executionProfileId === void 0 || typeof value.executionProfileId === "string");
}
function isAceRuntimeDiagnosticsValue(value) {
  const ditAttentionIdentityValid = isRecord3(value) && (value.ditAttentionRuntimeProfile === void 0 && value.ditAttentionKernelSetId === void 0 || value.ditAttentionRuntimeProfile === ACE_OPT_0062_DIT_QUAD_QUERY_ATTENTION_RUNTIME_PROFILE && value.ditAttentionKernelSetId === ACE_OPT_0062_DIT_QUAD_QUERY_ATTENTION_KERNEL_SET_ID || value.ditAttentionRuntimeProfile === ACE_OPT_0070_DIT_QUAD_QUERY_ATTENTION_RUNTIME_PROFILE && (value.ditAttentionKernelSetId === ACE_OPT_0070_DIT_QUAD_QUERY_ATTENTION_KERNEL_SET_ID || value.ditAttentionKernelSetId === ACE_OPT_0088_DIT_PORTABLE_ATTENTION_KERNEL_SET_ID));
  const vaeWindowIdentityValid = isRecord3(value) && (value.vaeWindowRuntimeProfile === ACE_VAE_C512_WINDOW_RUNTIME_PROFILE && value.vaeMaxWindowFrames === 512 || value.vaeWindowRuntimeProfile === ACE_OPT_0070_VAE_C2378_WINDOW_RUNTIME_PROFILE && value.vaeMaxWindowFrames === ACE_OPT_0070_VAE_C2378_MAXIMUM_WINDOW_FRAMES);
  const ditDenseIdentityValid = isRecord3(value) && (value.ditDenseManifestSha256 === ACE_OPT_0091_DIT_INT8_MANIFEST_SHA256 && value.ditDenseManifestByteLength === ACE_OPT_0091_DIT_INT8_MANIFEST_BYTES && value.ditDenseRuntimeProfile === ACE_OPT_0091_DIT_INT8_RUNTIME_PROFILE && (value.ditDenseKernelSetId === ACE_OPT_0091_DIT_INT8_KERNEL_SET_ID || value.ditDenseKernelSetId === ACE_OPT_0091_DIT_INT8_PORTABLE_KERNEL_SET_ID) && value.ditDenseLayerBytes === ACE_OPT_0091_DIT_INT8_LAYER_BYTES && value.ditResidentWeightBytes === ACE_OPT_0091_DIT_INT8_RESIDENT_WEIGHT_BYTES || (value.ditDenseManifestSha256 === ACE_OPT_0009_DIT_DENSE_MANIFEST_SHA256 || value.ditDenseManifestSha256 === ACE_OPT_0089_DIT_FAKE_QUANT_MANIFEST_SHA256) && value.ditDenseManifestByteLength === ACE_OPT_0009_DIT_DENSE_MANIFEST_BYTES && value.ditDenseRuntimeProfile === ACE_OPT_0009_DIT_DENSE_RUNTIME_PROFILE && (value.ditDenseKernelSetId === ACE_OPT_0009_DIT_DENSE_KERNEL_SET_ID || value.ditDenseKernelSetId === ACE_OPT_0088_DIT_DENSE_PORTABLE_KERNEL_SET_ID) && value.ditDenseLayerBytes === ACE_OPT_0009_DIT_MIXED_LAYER_BYTES && value.ditResidentWeightBytes === ACE_OPT_0009_DIT_MIXED_RESIDENT_WEIGHT_BYTES || value.ditDenseManifestSha256 === ACE_OPT_0037_DIT_K4_MANIFEST_SHA256 && value.ditDenseManifestByteLength === ACE_OPT_0037_DIT_K4_MANIFEST_BYTES && (value.ditDenseRuntimeProfile === ACE_OPT_0037_DIT_K4_RUNTIME_PROFILE && value.ditDenseKernelSetId === ACE_OPT_0037_DIT_K4_KERNEL_SET_ID || value.ditDenseRuntimeProfile === ACE_OPT_0056_DIT_SELECTIVE_K4_RUNTIME_PROFILE && value.ditDenseKernelSetId === ACE_OPT_0056_DIT_SELECTIVE_K4_KERNEL_SET_ID) && value.ditDenseLayerBytes === ACE_OPT_0037_DIT_K4_LAYER_BYTES && value.ditResidentWeightBytes === ACE_OPT_0037_DIT_K4_RESIDENT_WEIGHT_BYTES);
  const vaeIdentityValid = isRecord3(value) && (value.vaeManifestSha256 === ACE_OPT_0028_VAE_FP16_MANIFEST_SHA256 && value.vaeManifestByteLength === ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_PROFILE.manifestByteLength && (value.vaeRuntimeProfile === ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_PROFILE.id && value.vaeKernelSetId === ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_PROFILE.kernelSetId && value.vaePrecisionMapSha256 === ACE_OPT_0028_VAE_FP16_FIXED32_EXACT_PACKED_PROFILE.precisionMapSha256 || value.vaeRuntimeProfile === ACE_OPT_0040_VAE_FP16_FIXED32_SHAPE_SELECTED_PROFILE.id && value.vaeKernelSetId === ACE_OPT_0040_VAE_FP16_FIXED32_SHAPE_SELECTED_PROFILE.kernelSetId && value.vaePrecisionMapSha256 === ACE_OPT_0040_VAE_FP16_FIXED32_SHAPE_SELECTED_PROFILE.precisionMapSha256) || value.vaeManifestSha256 === ACE_OPT_0054_VAE_REVISION7_MANIFEST_SHA256 && value.vaeManifestByteLength === ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_PROFILE.manifestByteLength && (value.vaeRuntimeProfile === ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_PROFILE.id && value.vaeKernelSetId === ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_PROFILE.kernelSetId && value.vaePrecisionMapSha256 === ACE_OPT_0054_VAE_FP16_FIXED32_REVISION7_PROFILE.precisionMapSha256 || value.vaeRuntimeProfile === ACE_OPT_0072_VAE_FP16_FIXED32_DUAL_K4_PRODUCTION_RUNTIME_PROFILE && (value.vaeKernelSetId === ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PROFILE.kernelSetId && value.vaePrecisionMapSha256 === ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PROFILE.precisionMapSha256 || value.vaeKernelSetId === ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PROFILE.kernelSetId && value.vaePrecisionMapSha256 === ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PROFILE.precisionMapSha256)));
  const portableExecutionProfile = isRecord3(value) && isRecord3(value.executionProfile) && value.executionProfile.id === ACE_REFERENCE_PORTABLE_PROFILE.id;
  const portableKernelIdentityCoherent = isRecord3(value) && (portableExecutionProfile ? (value.ditDenseRuntimeProfile === ACE_OPT_0091_DIT_INT8_RUNTIME_PROFILE && value.ditDenseKernelSetId === ACE_OPT_0091_DIT_INT8_PORTABLE_KERNEL_SET_ID || value.ditDenseRuntimeProfile === ACE_OPT_0009_DIT_DENSE_RUNTIME_PROFILE && value.ditDenseKernelSetId === ACE_OPT_0088_DIT_DENSE_PORTABLE_KERNEL_SET_ID) && (value.ditAttentionKernelSetId === void 0 || value.ditAttentionKernelSetId === ACE_OPT_0088_DIT_PORTABLE_ATTENTION_KERNEL_SET_ID) && value.vaeKernelSetId === ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PROFILE.kernelSetId : value.ditDenseKernelSetId !== ACE_OPT_0088_DIT_DENSE_PORTABLE_KERNEL_SET_ID && value.ditDenseKernelSetId !== ACE_OPT_0091_DIT_INT8_PORTABLE_KERNEL_SET_ID && value.ditAttentionKernelSetId !== ACE_OPT_0088_DIT_PORTABLE_ATTENTION_KERNEL_SET_ID && value.vaeKernelSetId !== ACE_OPT_0088_VAE_FP16_PORTABLE_DUAL_K4_PROFILE.kernelSetId);
  if (!isRecord3(value) || !hasOnlyKeys2(value, [
    "backend",
    "modelManifestId",
    "modelManifestUrl",
    "modelManifestSha256",
    "ditDenseManifestId",
    "ditDenseManifestUrl",
    "ditDenseManifestSha256",
    "ditDenseManifestByteLength",
    "ditDenseRuntimeProfile",
    "ditDenseKernelSetId",
    "ditAttentionRuntimeProfile",
    "ditAttentionKernelSetId",
    "ditDenseLayerBytes",
    "ditResidentWeightBytes",
    "vaeManifestId",
    "vaeManifestUrl",
    "vaeManifestSha256",
    "vaeManifestByteLength",
    "vaeRuntimeProfile",
    "vaeKernelSetId",
    "vaePrecisionMapSha256",
    "vaeWindowRuntimeProfile",
    "vaeMaxWindowFrames",
    "executionProfile",
    "schedulingProfile",
    "capabilities",
    "aceSourceRevision",
    "plannerSourceRevision",
    "parakeetReferenceRevision"
  ]) || value.backend !== "custom-webgpu-wgsl-and-wasm" || !isNonEmptyString(value.modelManifestId) || !isNonEmptyString(value.modelManifestUrl) || !isSha256(value.modelManifestSha256) || !isNonEmptyString(value.ditDenseManifestId) || !isNonEmptyString(value.ditDenseManifestUrl) || !ditDenseIdentityValid || !ditAttentionIdentityValid || value.ditAttentionRuntimeProfile !== void 0 && value.ditDenseRuntimeProfile !== ACE_OPT_0009_DIT_DENSE_RUNTIME_PROFILE && value.ditDenseRuntimeProfile !== ACE_OPT_0091_DIT_INT8_RUNTIME_PROFILE || !isNonEmptyString(value.vaeManifestId) || !isNonEmptyString(value.vaeManifestUrl) || !vaeIdentityValid || !vaeWindowIdentityValid || !portableKernelIdentityCoherent || value.ditAttentionRuntimeProfile === ACE_OPT_0070_DIT_QUAD_QUERY_ATTENTION_RUNTIME_PROFILE !== (value.vaeWindowRuntimeProfile === ACE_OPT_0070_VAE_C2378_WINDOW_RUNTIME_PROFILE) || value.vaeRuntimeProfile === ACE_OPT_0072_VAE_FP16_FIXED32_DUAL_K4_PRODUCTION_RUNTIME_PROFILE !== (value.vaeWindowRuntimeProfile === ACE_OPT_0070_VAE_C2378_WINDOW_RUNTIME_PROFILE) || !isExecutionProfile(value.executionProfile) || !isSchedulingProfile(value.schedulingProfile) || !isWebGpuCapabilityReport(value.capabilities) || value.aceSourceRevision !== ACE_SOURCE_REVISION || value.plannerSourceRevision !== ACE_PLANNER_SOURCE_REVISION || value.parakeetReferenceRevision !== PARAKEET_REFERENCE_REVISION) {
    return false;
  }
  return value.capabilities.executionProfile.id === value.executionProfile.id && value.capabilities.schedulingProfile === value.schedulingProfile;
}
var EXECUTION_PROFILES = [
  ACE_REFERENCE_PORTABLE_PROFILE,
  ACE_REFERENCE_SUBGROUP_PROFILE,
  ACE_FP16_PORTABLE_PROFILE
];
function isExecutionProfile(value) {
  if (!isRecord3(value) || !hasExactKeys(value, [
    "id",
    "modelProfile",
    "weightStorage",
    "matrixArithmetic",
    "sensitiveReductions",
    "vaeArithmetic",
    "kernelBackend",
    "requiredFeatures"
  ]) || !Array.isArray(value.requiredFeatures)) {
    return false;
  }
  return EXECUTION_PROFILES.some(
    (profile) => value.id === profile.id && value.modelProfile === profile.modelProfile && value.weightStorage === profile.weightStorage && value.matrixArithmetic === profile.matrixArithmetic && value.sensitiveReductions === profile.sensitiveReductions && value.vaeArithmetic === profile.vaeArithmetic && value.kernelBackend === profile.kernelBackend && arraysEqual(
      value.requiredFeatures,
      profile.requiredFeatures
    )
  );
}
function isWebGpuCapabilityReport(value) {
  if (!isRecord3(value) || !hasExactKeys(value, [
    "executionProfile",
    "schedulingProfile",
    "adapterInfo",
    "adapterFeatures",
    "deviceFeatures",
    "stockFeatures",
    "requiredFeatures",
    "requestedOptionalFeatures",
    "adapterLimits",
    "deviceLimits",
    "requestedLimits"
  ]) || !isExecutionProfile(value.executionProfile) || !isSchedulingProfile(value.schedulingProfile) || !isAdapterInfo(value.adapterInfo) || !isStringArray(value.adapterFeatures) || !isStringArray(value.deviceFeatures) || !isStockFeatureReport(value.stockFeatures) || !isRequiredFeatureArray(value.requiredFeatures) || !isRequestedOptionalFeatureArray(value.requestedOptionalFeatures) || !isWebGpuLimits(value.adapterLimits) || !isWebGpuLimits(value.deviceLimits) || !isRequestedWebGpuLimits(value.requestedLimits)) {
    return false;
  }
  const report = value;
  return report.executionProfile.requiredFeatures.every(
    (feature) => report.requiredFeatures.includes(feature)
  ) && ACE_STOCK_WEBGPU_FEATURES.every((feature) => {
    const status = report.stockFeatures[feature];
    const adapterSupported = report.adapterFeatures.includes(feature);
    const deviceEnabled = report.deviceFeatures.includes(feature);
    const required = feature !== "timestamp-query" && report.requiredFeatures.includes(feature);
    const requested = required || feature === "timestamp-query" && report.requestedOptionalFeatures.includes(feature);
    return status.adapterSupported === adapterSupported && status.deviceEnabled === deviceEnabled && status.required === required && status.requested === requested && (!required || adapterSupported && deviceEnabled);
  });
}
function isAdapterInfo(value) {
  return isRecord3(value) && hasOnlyKeys2(value, [
    "vendor",
    "architecture",
    "device",
    "description",
    "subgroupMinSize",
    "subgroupMaxSize",
    "isFallbackAdapter"
  ]) && typeof value.vendor === "string" && typeof value.architecture === "string" && typeof value.device === "string" && typeof value.description === "string" && (value.subgroupMinSize === void 0 || isPositiveSafeInteger(value.subgroupMinSize)) && (value.subgroupMaxSize === void 0 || isPositiveSafeInteger(value.subgroupMaxSize)) && (value.isFallbackAdapter === void 0 || typeof value.isFallbackAdapter === "boolean");
}
function isStockFeatureReport(value) {
  return isRecord3(value) && hasExactKeys(value, ACE_STOCK_WEBGPU_FEATURES) && ACE_STOCK_WEBGPU_FEATURES.every(
    (feature) => isFeatureStatus(value[feature])
  );
}
function isFeatureStatus(value) {
  return isRecord3(value) && hasExactKeys(value, [
    "adapterSupported",
    "deviceEnabled",
    "required",
    "requested"
  ]) && typeof value.adapterSupported === "boolean" && typeof value.deviceEnabled === "boolean" && typeof value.required === "boolean" && typeof value.requested === "boolean";
}
function isRequiredFeatureArray(value) {
  return Array.isArray(value) && value.every((feature) => feature === "shader-f16" || feature === "subgroups") && new Set(value).size === value.length;
}
function isRequestedOptionalFeatureArray(value) {
  return Array.isArray(value) && value.every((feature) => feature === "timestamp-query") && new Set(value).size === value.length;
}
function isWebGpuLimits(value) {
  return isRecord3(value) && hasExactKeys(value, ACE_WEBGPU_LIMIT_NAMES) && ACE_WEBGPU_LIMIT_NAMES.every((name) => isRequestId(value[name]));
}
function isRequestedWebGpuLimits(value) {
  return isRecord3(value) && hasOnlyKeys2(value, ACE_WEBGPU_LIMIT_NAMES) && Object.values(value).every(isRequestId);
}
function isGenerationMetrics(value, frameCount, durationSeconds, diagnostics) {
  if (!isRecord3(value) || !hasOnlyKeys2(value, [
    "totalMs",
    "stageTimings",
    "peakTrackedGpuBytes",
    "cooperativeGpuQueueDrains",
    "cooperativeIdleMs",
    "vaeScheduling"
  ]) || !isNonNegativeFinite2(value.totalMs) || !Array.isArray(value.stageTimings) || !value.stageTimings.every(isStageTiming) || value.peakTrackedGpuBytes !== null && !isRequestId(value.peakTrackedGpuBytes) || !isRequestId(value.cooperativeGpuQueueDrains) || !isNonNegativeFinite2(value.cooperativeIdleMs)) return false;
  return value.vaeScheduling === void 0 || isVaeSchedulingReceipt(
    value.vaeScheduling,
    frameCount,
    durationSeconds,
    diagnostics,
    value.cooperativeGpuQueueDrains,
    value.cooperativeIdleMs
  );
}
function isVaeSchedulingReceipt(value, frameCount, durationSeconds, diagnostics, aggregateQueueDrains, aggregateCooperativeIdleMs) {
  if (!isRecord3(value) || !hasExactKeys(value, [
    "schema",
    "selectedProductionPolicy",
    "benchmarkPolicyOverride",
    "windows"
  ]) || value.schema !== "ace-vae-window-scheduling-receipt-v1" || value.selectedProductionPolicy !== null && value.selectedProductionPolicy !== "opt-0080-c2314-depth2-phase-epoch4" || value.benchmarkPolicyOverride !== null || !Array.isArray(value.windows) || value.windows.length === 0) return false;
  if (value.selectedProductionPolicy !== null && !isOpt0080ProductionVaeSchedulingDiagnostics(diagnostics)) return false;
  let expectedDispatchPlan;
  try {
    const shape = deriveAceDurationGraphShape(durationSeconds);
    if (shape.audioFramesPerChannel !== frameCount) return false;
    const effective = selectAceVaeWindowRuntimeProfileForLimits(
      requireAceVaeWindowRuntimeProfile(
        diagnostics.vaeWindowRuntimeProfile,
        diagnostics.vaeMaxWindowFrames
      ),
      diagnostics.capabilities.adapterLimits
    );
    expectedDispatchPlan = planAceOpt0011Fp16VaeChunkDispatches(
      shape.latentFrames,
      effective.maximumWindowFrames,
      256
    );
  } catch {
    return false;
  }
  const expectedPlan = expectedDispatchPlan.chunkPlan;
  if (value.windows.length !== expectedPlan.windows.length || !value.windows.every((window, index) => {
    const topologyIndex = expectedDispatchPlan.windowTopologyIndices[index];
    const topology = topologyIndex === void 0 ? void 0 : expectedDispatchPlan.topologies[topologyIndex];
    const plannedWindow = expectedPlan.windows[index];
    return topology !== void 0 && plannedWindow !== void 0 && isVaeWindowSchedulingReceipt(
      window,
      index,
      plannedWindow.latentWindowFrames,
      topology.sequenceQuantumCount,
      value.selectedProductionPolicy
    );
  })) return false;
  const receiptWindows = value.windows;
  const receiptQueueDrains = receiptWindows.reduce(
    (total, window) => total + window.queueDrains,
    0
  );
  const receiptCooperativeIdleTurns = receiptWindows.reduce(
    (total, window) => total + window.cooperativeIdleTurns,
    0
  );
  return Number.isSafeInteger(receiptQueueDrains) && Number.isSafeInteger(receiptCooperativeIdleTurns) && aggregateQueueDrains >= receiptQueueDrains && aggregateCooperativeIdleMs >= receiptCooperativeIdleTurns;
}
function isVaeWindowSchedulingReceipt(value, expectedIndex, expectedLatentWindowFrames, expectedDecoderQuantumCount, productionPolicy) {
  if (!isRecord3(value) || !hasExactKeys(value, [
    "windowIndex",
    "latentWindowFrames",
    "selection",
    "schedulingProfile",
    "decoderQuantumCount",
    "quantaPerCommandBuffer",
    "decoderCommandBufferCount",
    "readbackCommandBufferCount",
    "totalCommandBufferCount",
    "commandBuffersSubmitted",
    "queueDrains",
    "cooperativeIdleTurns",
    "maximumOutstandingCommandBuffers"
  ]) || value.windowIndex !== expectedIndex || value.latentWindowFrames !== expectedLatentWindowFrames || value.decoderQuantumCount !== expectedDecoderQuantumCount || value.quantaPerCommandBuffer !== 64 || !isPositiveSafeInteger(value.decoderCommandBufferCount) || value.readbackCommandBufferCount !== 1 || value.totalCommandBufferCount !== value.decoderCommandBufferCount + 1 || value.commandBuffersSubmitted !== value.totalCommandBufferCount || !isPositiveSafeInteger(value.queueDrains) || !isRequestId(value.cooperativeIdleTurns) || value.maximumOutstandingCommandBuffers !== 1 && value.maximumOutstandingCommandBuffers !== 2) return false;
  const expectedSelection = productionPolicy !== null ? "production" : "depth1-default";
  const candidatePolicy = productionPolicy === "opt-0080-c2314-depth2-phase-epoch4";
  const expectedProfile = candidatePolicy && value.latentWindowFrames === 2314 ? "depth2-phase-epoch4" : "depth1-epoch1";
  if (value.selection !== expectedSelection || value.schedulingProfile !== expectedProfile) return false;
  if (expectedProfile === "depth2-phase-epoch4") {
    return value.decoderQuantumCount === 35498 && value.decoderCommandBufferCount === 555 && value.totalCommandBufferCount === 556 && value.queueDrains === 139 && value.cooperativeIdleTurns === 138 && value.maximumOutstandingCommandBuffers === 2;
  }
  return value.decoderCommandBufferCount === Math.ceil(value.decoderQuantumCount / 64) && value.queueDrains === value.totalCommandBufferCount && value.cooperativeIdleTurns === value.totalCommandBufferCount - 1 && value.maximumOutstandingCommandBuffers === 1;
}
function isOpt0080ProductionVaeSchedulingDiagnostics(value) {
  const shader = value.capabilities.stockFeatures["shader-f16"];
  const subgroups = value.capabilities.stockFeatures.subgroups;
  return value.modelManifestSha256 === ACE_REFERENCE_MANIFEST_SHA256 && value.ditDenseManifestSha256 === ACE_OPT_0009_DIT_DENSE_MANIFEST_SHA256 && value.ditDenseRuntimeProfile === ACE_OPT_0009_DIT_DENSE_RUNTIME_PROFILE && value.ditAttentionRuntimeProfile === ACE_OPT_0070_DIT_QUAD_QUERY_ATTENTION_RUNTIME_PROFILE && value.ditAttentionKernelSetId === ACE_OPT_0070_DIT_QUAD_QUERY_ATTENTION_KERNEL_SET_ID && value.vaeManifestSha256 === ACE_OPT_0054_VAE_REVISION7_MANIFEST_SHA256 && value.vaeRuntimeProfile === ACE_OPT_0072_VAE_FP16_FIXED32_DUAL_K4_PRODUCTION_RUNTIME_PROFILE && value.vaeKernelSetId === ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PROFILE.kernelSetId && value.vaePrecisionMapSha256 === ACE_OPT_0066_VAE_FP16_FIXED32_DUAL_K4_QUALITY_PROFILE.precisionMapSha256 && value.vaeWindowRuntimeProfile === ACE_OPT_0070_VAE_C2378_WINDOW_RUNTIME_PROFILE && value.vaeMaxWindowFrames === ACE_OPT_0070_VAE_C2378_MAXIMUM_WINDOW_FRAMES && value.executionProfile.id === ACE_REFERENCE_SUBGROUP_PROFILE.id && value.schedulingProfile === "cooperative" && value.capabilities.adapterInfo.subgroupMinSize === 32 && value.capabilities.adapterInfo.subgroupMaxSize === 32 && value.capabilities.requiredFeatures.includes("shader-f16") && value.capabilities.requiredFeatures.includes("subgroups") && value.capabilities.adapterFeatures.includes("shader-f16") && value.capabilities.adapterFeatures.includes("subgroups") && value.capabilities.deviceFeatures.includes("shader-f16") && value.capabilities.deviceFeatures.includes("subgroups") && shader.adapterSupported && shader.deviceEnabled && shader.required && shader.requested && subgroups.adapterSupported && subgroups.deviceEnabled && subgroups.required && subgroups.requested;
}
function isStageTiming(value) {
  return isRecord3(value) && hasOnlyKeys2(value, [
    "stage",
    "wallMs",
    "submittedGpuMs",
    "cooperativeIdleMs"
  ]) && isAceGenerationStage(value.stage) && isNonNegativeFinite2(value.wallMs) && (value.submittedGpuMs === void 0 || isNonNegativeFinite2(value.submittedGpuMs)) && (value.cooperativeIdleMs === void 0 || isNonNegativeFinite2(value.cooperativeIdleMs));
}
function isDiagnosticDetails(value) {
  return isRecord3(value) && Object.values(value).every((detail) => {
    if (isDiagnosticScalar(detail)) return true;
    return Array.isArray(detail) && detail.every(isDiagnosticScalar);
  });
}
function isDiagnosticScalar(value) {
  return value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value);
}
function isSchedulingProfile(value) {
  return value === "cooperative" || value === "benchmark";
}
function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function arraysEqual(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}
function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}
function isSha256(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}
function hasOnlyKeys2(value, allowed) {
  const keySet = new Set(allowed);
  return Object.keys(value).every((key) => keySet.has(key));
}
function hasExactKeys(value, expected) {
  return Object.keys(value).length === expected.length && hasOnlyKeys2(value, expected);
}
function isRequestId(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function isPositiveSafeInteger(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
function isNonNegativeFinite2(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
function isRecord3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// qa/fluid-audio/packages/acestep/src/model/cache.ts
var CACHE_DIRECTORY = "ace-step-1.5.wgsl-model-cache-v1";
var CACHE_READ_CHUNK_BYTES = 4 * 1024 * 1024;
async function deleteAceModelCache(storage = globalThis.navigator?.storage) {
  if (storage === void 0 || typeof storage.getDirectory !== "function") {
    return false;
  }
  const opfsRoot = await storage.getDirectory();
  try {
    await opfsRoot.removeEntry(CACHE_DIRECTORY, { recursive: true });
    return true;
  } catch (error) {
    if (isNotFound(error)) return false;
    throw error;
  }
}
function isNotFound(error) {
  return error instanceof DOMException && error.name === "NotFoundError";
}

// qa/fluid-audio/packages/acestep/src/runtime/audio-output.ts
var AUDIO_DIRECTORY = "ace-step-1.5.wgsl-audio-v1";
var TRANSACTION_ID = /^(?!\.{1,2}$)[A-Za-z0-9._-]{1,96}$/;
var DEFAULT_STALE_INCOMPLETE_AGE_MS = 24 * 60 * 60 * 1e3;
async function releaseAceAudioOutput(transactionId, storage = navigator.storage) {
  assertTransactionId(transactionId);
  const opfsRoot = await storage.getDirectory();
  let audioRoot;
  try {
    audioRoot = await opfsRoot.getDirectoryHandle(AUDIO_DIRECTORY);
  } catch (error) {
    if (isNotFound2(error)) return;
    throw error;
  }
  await removeEntryIfPresent(audioRoot, transactionId, true);
}
function assertTransactionId(transactionId) {
  if (!TRANSACTION_ID.test(transactionId)) {
    throw new TypeError(
      "ACE audio transaction ID must contain 1-96 safe filename characters"
    );
  }
}
async function removeEntryIfPresent(directory, name, recursive) {
  try {
    await directory.removeEntry(name, { recursive });
  } catch (error) {
    if (!isNotFound2(error)) {
      throw error;
    }
  }
}
function isNotFound2(error) {
  return error instanceof DOMException && error.name === "NotFoundError";
}

// qa/fluid-audio/src/engines/musicgen-acestep/config.ts
var ACE_DEFAULT_MODEL_ORIGIN = "https://huggingface.co/FluidInference/ace-step-webgpu-models/resolve/main";
var ACE_MODEL_ORIGIN = ACE_DEFAULT_MODEL_ORIGIN;
var REFERENCE_PAYLOAD_PREFIX_SHA256 = "18f36c6420976475af65ecd833ca56c6119706322ce54120389d4915d8e80db6";
var DIRECT_REFERENCE_MANIFEST_SHA256 = "b44a3d157009d035a8f20aa752db4ceef2fac5bd140eff13be8f7488bc978089";
var DIRECT_REFERENCE_MANIFEST_REMOTE_NAME = `direct-manifest-${DIRECT_REFERENCE_MANIFEST_SHA256}.json`;
var DIT_MANIFEST_SHA256 = "d3fc0020efcf60702db411da2fd4b93e9bb84f1437ed310aef01c892727e452f";
var INT8_QUALITY_PREVIEW_DIT_MANIFEST_SHA256 = "a3233c9f97bc151b5ffa2a6cd8c9ecaee4e555497ee6fda20b70becaf7d55da1";
var VAE_MANIFEST_SHA256 = "36a54d79777d6826088095ba6ebc028fb4bea546368c0f0a29cd0eee8d656da7";
function productionManifestUrl(localDirectory, productionPackage, payloadPrefixSha256, manifestRemoteName = "manifest.json") {
  if (ACE_MODEL_ORIGIN.startsWith("/")) {
    return new URL(`${ACE_MODEL_ORIGIN}/${localDirectory}/${manifestRemoteName}`, location.href).href;
  }
  return `${ACE_MODEL_ORIGIN}/v1/${productionPackage}/${payloadPrefixSha256}/${manifestRemoteName}`;
}
function aceProductionWorkerConfiguration() {
  return aceDemoWorkerConfiguration("production");
}
function aceDemoWorkerConfiguration(variant) {
  const ditManifestSha256 = variant === "int8-quality-preview" ? INT8_QUALITY_PREVIEW_DIT_MANIFEST_SHA256 : DIT_MANIFEST_SHA256;
  const ditPackage = variant === "int8-quality-preview" ? "dit-int8-packed" : "dit-revision7";
  const localDitDirectory = variant === "int8-quality-preview" ? `files-int8-dit-rev9/${INT8_QUALITY_PREVIEW_DIT_MANIFEST_SHA256}` : "files-fp16-dit-rev7-oracle";
  return {
    manifestUrl: productionManifestUrl("files-reference", "reference", REFERENCE_PAYLOAD_PREFIX_SHA256, DIRECT_REFERENCE_MANIFEST_REMOTE_NAME),
    manifestSha256: DIRECT_REFERENCE_MANIFEST_SHA256,
    modelProfile: "reference-bf16",
    schedulingProfile: "cooperative",
    ditDensePackage: {
      manifestUrl: productionManifestUrl(localDitDirectory, ditPackage, ditManifestSha256),
      manifestSha256: ditManifestSha256,
      runtimeProfile: variant === "int8-quality-preview" ? "opt-0091-int8-weight-only-v1" : "opt-0009-fp16-fp32-dense-v1"
    },
    ditAttentionRuntimeProfile: "opt-0070-fixed32-quad-query32-full-self-production-v1",
    vaePackage: {
      manifestUrl: productionManifestUrl("files-fp16-vae-revision7-experimental", "vae-revision7", VAE_MANIFEST_SHA256),
      manifestSha256: VAE_MANIFEST_SHA256,
      runtimeProfile: "opt-0072-mixed-fp16-fixed32-dual-k4-production-v1",
      windowRuntimeProfile: "opt-0070-c2378-overlap64-production-v1",
      maxWindowFrames: 2378
    }
  };
}

// qa/fluid-audio/src/engines/musicgen-acestep/worker-name.ts
function aceInferenceWorkerName() {
  const search = new URLSearchParams(location.search);
  const flags = new URLSearchParams();
  const rawCap = search.get("aceTestMaxGpuBufferBytes");
  if (rawCap !== null) {
    const value = Number(rawCap);
    if (Number.isSafeInteger(value) && value > 0) {
      flags.set("testMaxGpuBufferBytes", String(value));
    }
  }
  if (search.get("aceTestDisableSubgroups") === "1") {
    flags.set("testDisableSubgroups", "1");
  }
  const query = flags.toString();
  return query === "" ? "ace-step-inference" : `ace-step-inference?${query}`;
}

// qa/fluid-audio/src/engines/musicgen-acestep/cache-lease.ts
function acquireCacheLease(locks, name, signal) {
  return new Promise((resolve, reject) => {
    const released = locks.request(name, { mode: "shared", ...signal === void 0 ? {} : { signal } }, async () => {
      await new Promise((releaseLock) => {
        let releasePromise;
        resolve(async () => {
          if (releasePromise === void 0) {
            releaseLock();
            releasePromise = released.then(() => void 0);
          }
          await releasePromise;
        });
      });
    });
    void released.catch(reject);
  });
}

// qa/fluid-audio/src/engines/musicgen-acestep/model-cache-migration.ts
var ACE_DEMO_MODEL_CACHE_GENERATION = "direct-b44a3d157009d035-d3fc0020efcf6070-36a54d79777d6826-v1";
var ACE_MODEL_CACHE_LIFECYCLE_LOCK = "ace-step-1.5.wgsl-demo-model-cache-migration";
var MIGRATION_LOCK_NAME = ACE_MODEL_CACHE_LIFECYCLE_LOCK;
var METADATA_DIRECTORY = "ace-step-1.5.wgsl-demo-metadata-v1";
var GENERATION_MARKER_FILE = "model-cache-generation.txt";
var MAX_GENERATION_MARKER_BYTES = 256;
var localReleasePromises = /* @__PURE__ */ new Set();
async function ensureCurrentAceDemoModelCache(options = {}) {
  const storage = Object.hasOwn(options, "storage") ? options.storage : browserStorage();
  if (storage === void 0 || typeof storage.getDirectory !== "function") {
    return Object.freeze({
      supported: false,
      migrated: false,
      previousGeneration: null
    });
  }
  const locks = Object.hasOwn(options, "locks") ? options.locks : browserLocks();
  if (locks === void 0 || typeof locks.request !== "function") {
    throw new Error("Web Locks are required to migrate the ACE demo model cache safely");
  }
  const deleteModelCache = options.deleteModelCache ?? deleteAceModelCache;
  return locks.request(MIGRATION_LOCK_NAME, { mode: "exclusive", ...options.signal === void 0 ? {} : { signal: options.signal } }, async () => {
    const root = await storage.getDirectory();
    const metadata = await root.getDirectoryHandle(METADATA_DIRECTORY, {
      create: true
    });
    const previousGeneration = await readGenerationMarker(metadata);
    if (previousGeneration === ACE_DEMO_MODEL_CACHE_GENERATION) {
      return Object.freeze({
        supported: true,
        migrated: false,
        previousGeneration
      });
    }
    await deleteModelCache(storage);
    await writeGenerationMarker(metadata, ACE_DEMO_MODEL_CACHE_GENERATION);
    return Object.freeze({
      supported: true,
      migrated: true,
      previousGeneration
    });
  });
}
async function acquireAceDemoModelCache(signal) {
  const locks = globalThis.navigator?.locks;
  const storage = browserStorage();
  if (locks === void 0 || storage === void 0) throw new Error("Browser storage and Web Locks are required");
  for (; ; ) {
    signal?.throwIfAborted();
    const release = await acquireCacheLease(locks, MIGRATION_LOCK_NAME, signal);
    try {
      signal?.throwIfAborted();
      const root = await storage.getDirectory();
      const metadata = await root.getDirectoryHandle(METADATA_DIRECTORY, { create: true });
      const generation = await readGenerationMarker(metadata);
      signal?.throwIfAborted();
      if (generation === ACE_DEMO_MODEL_CACHE_GENERATION) return trackLocalRelease(release);
    } catch (error) {
      await release();
      throw error;
    }
    await release();
    await ensureCurrentAceDemoModelCache({ signal });
  }
}
async function deleteAceDemoModelCache() {
  await Promise.allSettled([...localReleasePromises]);
  const locks = globalThis.navigator?.locks;
  if (locks === void 0) throw new Error("Web Locks are required to delete the model cache safely");
  return locks.request(MIGRATION_LOCK_NAME, { mode: "exclusive", ifAvailable: true }, async (lock) => {
    if (lock === null) throw new Error("Model is in use in another tab. Close that tab and retry.");
    return deleteAceModelCache();
  });
}
function trackLocalRelease(release) {
  let pending;
  return () => {
    if (pending !== void 0) return pending;
    pending = release();
    localReleasePromises.add(pending);
    void pending.then(
      () => localReleasePromises.delete(pending),
      () => localReleasePromises.delete(pending)
    );
    return pending;
  };
}
async function readGenerationMarker(metadata) {
  try {
    const handle = await metadata.getFileHandle(GENERATION_MARKER_FILE);
    const file = await handle.getFile();
    if (file.size > MAX_GENERATION_MARKER_BYTES) return null;
    return await file.text();
  } catch (error) {
    if (isNotFound3(error)) return null;
    throw error;
  }
}
function writeMarkerViaWorker(generation) {
  const source = `self.onmessage = async (event) => {
    const { dir, file, content } = event.data;
    try {
      const root = await navigator.storage.getDirectory();
      const directory = await root.getDirectoryHandle(dir, { create: true });
      const handle = await directory.getFileHandle(file, { create: true });
      const access = await handle.createSyncAccessHandle();
      try {
        access.truncate(0);
        access.write(new TextEncoder().encode(content), { at: 0 });
        access.flush();
      } finally {
        access.close();
      }
      self.postMessage({ ok: true });
    } catch (error) {
      self.postMessage({ ok: false, error: String(error) });
    }
  };`;
  const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
  const worker = new Worker(url);
  return new Promise((resolve, reject) => {
    const finish = (outcome) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      outcome();
    };
    const timer = setTimeout(() => finish(() => reject(new Error("ACE cache marker write timed out"))), 1e4);
    worker.onmessage = (event) => {
      const data = event.data;
      finish(() => data.ok ? resolve() : reject(new Error(data.error ?? "marker write failed")));
    };
    worker.onerror = (event) => finish(() => reject(new Error(event.message || "marker worker failed")));
    worker.postMessage({ dir: METADATA_DIRECTORY, file: GENERATION_MARKER_FILE, content: generation });
  });
}
async function writeGenerationMarker(metadata, generation) {
  if (typeof metadata.getFileHandle === "function" && typeof Worker !== "undefined") {
    const probe = await metadata.getFileHandle(GENERATION_MARKER_FILE, { create: true });
    if (typeof probe.createWritable !== "function") {
      await writeMarkerViaWorker(generation);
      return;
    }
  }
  const handle = await metadata.getFileHandle(GENERATION_MARKER_FILE, {
    create: true
  });
  const writable = await handle.createWritable();
  try {
    await writable.write(generation);
    await writable.close();
  } catch (error) {
    try {
      await writable.abort(error);
    } catch {
    }
    throw error;
  }
}
function browserStorage() {
  return globalThis.navigator?.storage;
}
function browserLocks() {
  return globalThis.navigator?.locks;
}
function isNotFound3(error) {
  return error instanceof DOMException && error.name === "NotFoundError";
}

// qa/fluid-audio/src/engines/musicgen-acestep/model-download-progress.ts
var INITIALIZATION_WEIGHTS_LOGICAL_BYTES = 5578938623;
var DEFERRED_VAE_CACHE_PHYSICAL_BYTES = 168791552;
var MODEL_DOWNLOAD_TOTAL_BYTES = 5747730175;
var INT8_MODEL_DOWNLOAD_TOTAL_BYTES = 4426524415;
var INITIAL_MODEL_DOWNLOAD_PROGRESS = createProgress(0);
function updateModelDownloadProgress(current, event) {
  const candidate = physicalCompletedBytes(event, current.total);
  if (candidate === void 0 || candidate <= current.completed) return current;
  return createProgress(candidate, current.total);
}
function physicalCompletedBytes(event, totalBytes) {
  const outer = record(event);
  if (outer === void 0) return void 0;
  const progress = record(outer.progress) ?? outer;
  if (progress.stage === "weights") {
    return initializationPhysicalBytes(progress);
  }
  if (progress.stage === "vae-load") {
    return deferredVaePhysicalBytes(progress.message, totalBytes);
  }
  return void 0;
}
function initializationPhysicalBytes(progress) {
  if (progress.unit !== "bytes" || progress.totalUnits !== INITIALIZATION_WEIGHTS_LOGICAL_BYTES && progress.totalUnits !== INT8_MODEL_DOWNLOAD_TOTAL_BYTES - DEFERRED_VAE_CACHE_PHYSICAL_BYTES) {
    return void 0;
  }
  const logicalCompleted = clampedByteCount(progress.completedUnits, progress.totalUnits);
  if (logicalCompleted === void 0) return void 0;
  return logicalCompleted;
}
function deferredVaePhysicalBytes(message, totalBytes) {
  if (typeof message !== "string") return void 0;
  const match = /(?:^|\s)([0-9]+)\/([0-9]+) bytes$/u.exec(message.trim());
  if (match === null) return void 0;
  const completed = Number(match[1]);
  const total = Number(match[2]);
  if (total !== DEFERRED_VAE_CACHE_PHYSICAL_BYTES) return void 0;
  const vaeCompleted = clampedByteCount(completed, DEFERRED_VAE_CACHE_PHYSICAL_BYTES);
  if (vaeCompleted === void 0) return void 0;
  return totalBytes - DEFERRED_VAE_CACHE_PHYSICAL_BYTES + vaeCompleted;
}
function createProgress(completed, total = MODEL_DOWNLOAD_TOTAL_BYTES) {
  const safeCompleted = Math.min(total, safeNonnegativeInteger(completed));
  const fraction = safeCompleted / total;
  return Object.freeze({
    fraction,
    percentage: fraction * 100,
    completed: safeCompleted,
    total
  });
}
function clampedByteCount(value, total) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || !Number.isFinite(value)) {
    return void 0;
  }
  return Math.min(total, Math.max(0, value));
}
function safeNonnegativeInteger(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value));
}
function record(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}

// qa/fluid-audio/src/engines/musicgen-acestep/worker-disposal.ts
var ACE_WORKER_DISPOSAL_TIMEOUT_MS = 3e4;
function waitForWorkerDisposal(requestId, start, timeoutMs = ACE_WORKER_DISPOSAL_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer;
    const finish = (outcome) => {
      if (settled) return;
      settled = true;
      if (timer !== void 0) clearTimeout(timer);
      outcome();
    };
    const pending = {
      requestId,
      resolve: () => finish(resolve),
      reject: (reason) => finish(() => reject(reason))
    };
    timer = setTimeout(() => pending.reject(new Error(`ACE worker disposal timed out after ${timeoutMs} ms`)), timeoutMs);
    try {
      start(pending);
    } catch (error) {
      pending.reject(error);
    }
  });
}

// qa/fluid-audio/src/engines/musicgen-acestep/index.ts
var AceStepMusicClient = class {
  worker;
  cacheAcquisition;
  workerReady = false;
  nextRequestId = 1;
  nextJobId = 1;
  active;
  disposal;
  disposePromise;
  fatalGpuDiagnostic = false;
  /** Releases the shared model-cache lifecycle lock held while the worker is alive. */
  releaseRuntimeLock;
  downloadProgress = INITIAL_MODEL_DOWNLOAD_PROGRESS;
  /** Diagnostics reported by the worker's ready message, when initialized. */
  runtimeDiagnostics;
  get busy() {
    return this.active !== void 0;
  }
  get initialized() {
    return this.workerReady;
  }
  /**
   * Generate one song. Initializes the worker (downloading/loading model
   * packages) on first use. Only one generation may be in flight.
   */
  async generate(request, handlers = {}) {
    if (this.active !== void 0 || this.disposePromise !== void 0) {
      throw new Error("A generation is already in progress");
    }
    this.downloadProgress = INITIAL_MODEL_DOWNLOAD_PROGRESS;
    return await new Promise((resolve, reject) => {
      this.active = {
        resolve,
        reject,
        handlers,
        initializationRequestId: void 0,
        jobId: void 0,
        request,
        cancelRequested: false
      };
      if (this.workerReady && this.worker !== void 0) {
        this.startGeneration();
      } else {
        void this.startInitialization();
      }
    });
  }
  /** Cancel the in-flight initialization or generation, if any. */
  cancel() {
    const active = this.active;
    if (active === void 0) return;
    if (this.cacheAcquisition !== void 0) {
      this.resetWorker(new DOMException("Initialization cancelled", "AbortError"));
      return;
    }
    if (this.worker === void 0) return;
    if (active.initializationRequestId !== void 0) {
      active.cancelRequested = true;
      this.worker.postMessage({
        type: "cancel-initialization",
        requestId: active.initializationRequestId
      });
    } else if (active.jobId !== void 0) {
      this.worker.postMessage({ type: "cancel", jobId: active.jobId });
    }
  }
  /** Release the worker's GPU/runtime resources and terminate it. */
  dispose() {
    if (this.disposePromise !== void 0) return this.disposePromise;
    this.disposePromise = this.disposeInner().finally(() => {
      this.disposePromise = void 0;
    });
    return this.disposePromise;
  }
  async disposeInner() {
    this.cacheAcquisition?.abort();
    this.cacheAcquisition = void 0;
    const active = this.active;
    if (active !== void 0) {
      this.active = void 0;
      active.reject(new DOMException("Client disposed during generation", "AbortError"));
    }
    const current = this.worker;
    if (current === void 0) return;
    if (!this.workerReady) {
      this.resetWorker(new DOMException("Client disposed", "AbortError"));
      return;
    }
    const requestId = this.nextRequestId++;
    try {
      await waitForWorkerDisposal(requestId, (pending) => {
        this.disposal = pending;
        current.postMessage({ type: "dispose", requestId });
      });
    } finally {
      if (this.disposal?.requestId === requestId) this.disposal = void 0;
      if (this.worker === current) {
        current.terminate();
        this.worker = void 0;
        this.workerReady = false;
        this.runtimeDiagnostics = void 0;
        const release = this.releaseRuntimeLock;
        this.releaseRuntimeLock = void 0;
        await release?.();
      }
    }
  }
  /** Terminate immediately without an orderly runtime dispose. */
  terminate() {
    this.resetWorker(new DOMException("Client terminated", "AbortError"));
  }
  async startInitialization() {
    const active = this.active;
    if (active === void 0) return;
    const acquisition = new AbortController();
    this.cacheAcquisition = acquisition;
    try {
      const release = await acquireAceDemoModelCache(acquisition.signal);
      if (this.active !== active || acquisition.signal.aborted) {
        await release();
        return;
      }
      this.cacheAcquisition = void 0;
      this.releaseRuntimeLock = release;
      this.startInitializationInner(active);
    } catch (error) {
      if (this.active !== active || acquisition.signal.aborted) return;
      this.fail(new Error(`Could not prepare model storage: ${String(error)}`), true);
    }
  }
  startInitializationInner(active) {
    this.worker?.terminate();
    this.workerReady = false;
    this.fatalGpuDiagnostic = false;
    this.downloadProgress = INITIAL_MODEL_DOWNLOAD_PROGRESS;
    this.worker = new Worker(new URL("./music.worker.js", import.meta.url), {
      type: "module",
      name: aceInferenceWorkerName()
    });
    this.worker.addEventListener("message", (event) => this.onMessage(event));
    this.worker.addEventListener("error", (event) => {
      this.fail(new Error(`Inference worker error: ${event.message}`), true);
    });
    active.initializationRequestId = this.nextRequestId++;
    this.worker.postMessage({
      type: "initialize",
      requestId: active.initializationRequestId,
      configuration: aceProductionWorkerConfiguration(),
      modelSource: "cache-or-network",
      reportProgress: true,
      reportDiagnostics: true
    });
  }
  startGeneration() {
    const active = this.active;
    if (active === void 0 || this.worker === void 0) return;
    const request = active.request;
    if (request === void 0) return;
    active.request = void 0;
    active.jobId = this.nextJobId++;
    this.worker.postMessage({
      type: "generate",
      jobId: active.jobId,
      request,
      reportProgress: true,
      reportDiagnostics: true
    });
  }
  onMessage(event) {
    if (!isAceWorkerMessage(event.data)) {
      this.fail(new Error("The inference worker emitted an invalid message"), true);
      return;
    }
    const message = event.data;
    const active = this.active;
    switch (message.type) {
      case "initialization-progress": {
        if (message.requestId !== active?.initializationRequestId) return;
        const updated = updateModelDownloadProgress(this.downloadProgress, message);
        if (updated !== this.downloadProgress) {
          this.downloadProgress = updated;
          active.handlers.onDownloadProgress?.(updated);
        } else {
          active.handlers.onInitializationProgress?.(message.progress);
        }
        return;
      }
      case "ready":
        if (message.requestId !== active?.initializationRequestId) return;
        active.initializationRequestId = void 0;
        this.workerReady = true;
        this.runtimeDiagnostics = message.diagnostics;
        if (active.cancelRequested) {
          this.active = void 0;
          active.reject(new DOMException("Initialization cancelled", "AbortError"));
          return;
        }
        this.startGeneration();
        return;
      case "initialization-cancelled":
        if (message.requestId !== active?.initializationRequestId) return;
        this.resetWorker(new DOMException("Initialization cancelled", "AbortError"));
        return;
      case "generation-progress": {
        if (message.jobId !== active?.jobId) return;
        const updated = updateModelDownloadProgress(this.downloadProgress, message);
        if (updated !== this.downloadProgress) {
          this.downloadProgress = updated;
          active.handlers.onDownloadProgress?.(updated);
        } else {
          active.handlers.onGenerationProgress?.(message.progress);
        }
        return;
      }
      case "diagnostic":
        if (message.diagnostic.code === "WEBGPU_DEVICE_LOST" || message.diagnostic.code === "WEBGPU_UNCAPTURED_ERROR") {
          this.fatalGpuDiagnostic = true;
        }
        active?.handlers.onDiagnostic?.(message.diagnostic);
        return;
      case "result":
        if (message.jobId !== active?.jobId) return;
        this.active = void 0;
        active.resolve(message.result);
        return;
      case "cancelled":
        if (message.jobId !== active?.jobId) return;
        this.active = void 0;
        active.reject(new DOMException("Generation cancelled", "AbortError"));
        return;
      case "disposed":
        if (this.disposal?.requestId !== message.requestId) return;
        this.disposal.resolve();
        this.disposal = void 0;
        this.workerReady = false;
        return;
      case "error": {
        if (this.disposal !== void 0 && message.requestId === this.disposal.requestId) {
          this.disposal.reject(new Error(message.error.message));
          this.disposal = void 0;
          return;
        }
        const fatal = this.fatalGpuDiagnostic || isAceFatalGpuErrorCode(message.error.code);
        this.fail(new Error(`${message.error.code}: ${message.error.message}`), fatal || !this.workerReady);
        return;
      }
    }
  }
  fail(reason, resetWorker) {
    if (this.disposal !== void 0) {
      this.disposal.reject(reason);
      this.disposal = void 0;
    }
    const active = this.active;
    this.active = void 0;
    if (resetWorker) {
      this.cacheAcquisition?.abort();
      this.cacheAcquisition = void 0;
      this.worker?.terminate();
      this.worker = void 0;
      this.workerReady = false;
      this.runtimeDiagnostics = void 0;
      void this.releaseRuntimeLock?.();
      this.releaseRuntimeLock = void 0;
    }
    active?.reject(reason);
  }
  resetWorker(reason) {
    this.cacheAcquisition?.abort();
    this.cacheAcquisition = void 0;
    if (this.disposal !== void 0) {
      this.disposal.reject(reason instanceof Error ? reason : new Error(String(reason)));
      this.disposal = void 0;
    }
    const active = this.active;
    this.active = void 0;
    this.worker?.terminate();
    this.worker = void 0;
    this.workerReady = false;
    this.runtimeDiagnostics = void 0;
    void this.releaseRuntimeLock?.();
    this.releaseRuntimeLock = void 0;
    if (active !== void 0) active.reject(reason);
  }
};
export {
  AceStepMusicClient,
  assertAceGenerationRequest,
  deleteAceDemoModelCache as deleteAceModelCache,
  releaseAceAudioOutput
};
