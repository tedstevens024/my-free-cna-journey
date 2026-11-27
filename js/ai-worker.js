/* Help chat "smart search" model, run in a background thread (Web Worker) so the screen never freezes while the
 * on-device model loads or reads the lessons. js/helpbot.js starts it when the chat opens; everything stays on the phone
 * (no downloads: allowRemoteModels is off). Messages: {id, type:'init', base, modelPath} and {id, type:'embed', texts}. */
let fe = null;
const DIM = 384;

self.onmessage = async (ev) => {
  const m = ev.data || {};
  try {
    if (m.type === 'init') {
      if (!fe) {
        const T = await import(m.base + 'ai/transformers.min.js');
        const env = T.env;
        env.allowRemoteModels = false;               // never download anything
        env.allowLocalModels = true;
        env.localModelPath = m.modelPath;             // a path, not an http URL (library rule)
        env.useBrowserCache = false;
        env.useWasmCache = false;                     // avoids blob: imports, which the app's security policy blocks
        env.backends.onnx.wasm.wasmPaths = { mjs: m.base + 'ai/ort-wasm-simd-threaded.mjs', wasm: m.base + 'ai/ort-wasm-simd-threaded.wasm' };
        env.backends.onnx.wasm.numThreads = 1;
        env.backends.onnx.wasm.proxy = false;
        fe = await T.pipeline('feature-extraction', 'all-MiniLM-L6-v2', { dtype: 'q8', device: 'wasm' });
      }
      self.postMessage({ id: m.id, ok: true });
    } else if (m.type === 'embed') {
      const o = await fe(m.texts, { pooling: 'mean', normalize: true });
      const vecs = [];
      for (let j = 0; j < o.dims[0]; j++) vecs.push(o.data.slice(j * DIM, (j + 1) * DIM));
      self.postMessage({ id: m.id, ok: true, vecs }, vecs.map((v) => v.buffer));
    }
  } catch (e) {
    self.postMessage({ id: m.id, ok: false, error: String((e && e.message) || e) });
  }
};
