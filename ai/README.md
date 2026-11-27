# On-device "smart search" for the help chat

Loaded only when the help chat is opened (see `app/js/helpbot.js`, `loadSemantic`). Never contacts any server:
`env.allowRemoteModels = false`. If it cannot load, the chat uses the word matcher only.

| File | From | License |
|---|---|---|
| `transformers.min.js` | npm `@huggingface/transformers@4.3.2` (dist/) | Apache-2.0 |
| `ort-wasm-simd-threaded.mjs`, `.wasm` | npm `onnxruntime-web@1.31.0-dev.20260914-8d85527a0` (the version Transformers.js 4.3.2 pins) | MIT |
| `models/all-MiniLM-L6-v2/` (config, tokenizer, `onnx/model_quantized.onnx`) | huggingface.co/Xenova/all-MiniLM-L6-v2 (ONNX export of sentence-transformers/all-MiniLM-L6-v2) | Apache-2.0 |

Total about 37 MB. Tested 2026-11-23: see thresholds and notes at the top of `app/js/helpbot.js`.
