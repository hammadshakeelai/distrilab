/**
 * Module: MapReduce Distributed Data Pipeline Simulator
 * Visualizes Input Split -> Map Workers -> Shuffle & Sort -> Reduce Workers -> Consolidated Output.
 */

export class MapReduceModule {
  constructor() {
    this.stage = 0; // 0: Input, 1: Map, 2: Shuffle, 3: Reduce, 4: Done
    this.inputText = 'deer bear river car car river deer deer';
    this.numMappers = 2;
    this.numReducers = 2;

    this.splits = [];
    this.mapOutputs = [];
    this.shufflePartitions = [];
    this.reduceOutputs = [];
  }

  init() {
    this.bindEvents();
    this.computePipeline();
    this.render();
  }

  bindEvents() {
    const stepBtn = document.getElementById('mr-step-btn');
    if (stepBtn) {
      stepBtn.addEventListener('click', () => {
        this.stage = (this.stage + 1) % 5;
        this.render();
      });
    }

    const resetBtn = document.getElementById('mr-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.stage = 0;
        this.computePipeline();
        this.render();
      });
    }

    const mappersSelect = document.getElementById('mr-mappers-select');
    if (mappersSelect) {
      mappersSelect.addEventListener('change', (e) => {
        this.numMappers = parseInt(e.target.value, 10);
        this.stage = 0;
        this.computePipeline();
        this.render();
      });
    }

    const reducersSelect = document.getElementById('mr-reducers-select');
    if (reducersSelect) {
      reducersSelect.addEventListener('change', (e) => {
        this.numReducers = parseInt(e.target.value, 10);
        this.stage = 0;
        this.computePipeline();
        this.render();
      });
    }

    const inputField = document.getElementById('mr-input-text');
    if (inputField) {
      inputField.addEventListener('input', (e) => {
        this.inputText = e.target.value.trim() || 'data cloud node cluster';
        this.computePipeline();
        this.render();
      });
    }
  }

  computePipeline() {
    const words = this.inputText.toLowerCase().match(/\b\w+\b/g) || ['empty'];

    // Stage 1: Splits
    this.splits = [];
    const chunkSize = Math.ceil(words.length / this.numMappers);
    for (let i = 0; i < this.numMappers; i++) {
      const slice = words.slice(i * chunkSize, (i + 1) * chunkSize);
      this.splits.push(slice);
    }

    // Stage 2: Map phase (emit word -> 1)
    this.mapOutputs = this.splits.map(chunk => {
      return chunk.map(w => ({ key: w, val: 1 }));
    });

    // Stage 3: Shuffle & Sort (Group by hash of key into Reducer partitions)
    this.shufflePartitions = Array.from({ length: this.numReducers }, () => ({}));
    this.mapOutputs.flat().forEach(pair => {
      // Simple hash to determine reducer
      const hash = pair.key.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const reducerId = hash % this.numReducers;
      if (!this.shufflePartitions[reducerId][pair.key]) {
        this.shufflePartitions[reducerId][pair.key] = [];
      }
      this.shufflePartitions[reducerId][pair.key].push(1);
    });

    // Stage 4: Reduce phase (Sum values per key)
    this.reduceOutputs = this.shufflePartitions.map(partition => {
      const result = {};
      Object.keys(partition).forEach(key => {
        result[key] = partition[key].reduce((a, b) => a + b, 0);
      });
      return result;
    });
  }

  render() {
    const stageNames = ['1. Input Data Split', '2. Map Workers Emit Pairs', '3. Shuffle & Sort Partitioning', '4. Reduce Workers Aggregate', '5. Final Output'];
    const stageLabel = document.getElementById('mr-stage-label');
    if (stageLabel) stageLabel.textContent = `Current Stage: ${stageNames[this.stage]}`;

    const container = document.getElementById('mr-visualizer-container');
    if (!container) return;
    container.innerHTML = '';

    if (this.stage === 0) {
      // Show input split
      const card = document.createElement('div');
      card.className = 'glass-panel p-4 w-full';
      card.innerHTML = `
        <div class="text-xs font-mono text-cyan-400 mb-2 uppercase tracking-wide">Input Corpus Split into Partitions</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${this.splits.map((s, idx) => `
            <div class="p-3 bg-slate-900/80 rounded border border-slate-700">
              <div class="text-xs text-slate-400 font-mono mb-1">Split #${idx + 1} (${s.length} words)</div>
              <div class="text-sm font-mono text-emerald-300">"${s.join(' ')}"</div>
            </div>
          `).join('')}
        </div>
      `;
      container.appendChild(card);
    } else if (this.stage === 1) {
      // Map Workers
      const card = document.createElement('div');
      card.className = 'glass-panel p-4 w-full';
      card.innerHTML = `
        <div class="text-xs font-mono text-cyan-400 mb-2 uppercase tracking-wide">Map Phase: Parallel Tokenization to (k, v) Pairs</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${this.mapOutputs.map((pairs, idx) => `
            <div class="p-3 bg-slate-900/80 rounded border border-cyan-800/60">
              <div class="text-xs text-cyan-300 font-mono mb-2 flex items-center justify-between">
                <span>Mapper Worker #${idx + 1}</span>
                <span class="text-[10px] text-slate-400">${pairs.length} intermediate pairs</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                ${pairs.map(p => `
                  <span class="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-cyan-200 border border-slate-700">
                    &lt;${p.key}, ${p.val}&gt;
                  </span>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
      container.appendChild(card);
    } else if (this.stage === 2) {
      // Shuffle & Sort
      const card = document.createElement('div');
      card.className = 'glass-panel p-4 w-full';
      card.innerHTML = `
        <div class="text-xs font-mono text-purple-400 mb-2 uppercase tracking-wide">Shuffle & Sort: Network Redistribution by Hash(Key)</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${this.shufflePartitions.map((part, idx) => `
            <div class="p-3 bg-slate-900/80 rounded border border-purple-800/60">
              <div class="text-xs text-purple-300 font-mono mb-2">Partition #${idx + 1} (Bound to Reducer #${idx + 1})</div>
              <div class="space-y-1">
                ${Object.keys(part).map(k => `
                  <div class="flex items-center justify-between text-xs font-mono bg-slate-800/90 px-2 py-1 rounded">
                    <span class="text-slate-300">${k}</span>
                    <span class="text-purple-300">[${part[k].join(', ')}]</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
      container.appendChild(card);
    } else if (this.stage === 3) {
      // Reduce
      const card = document.createElement('div');
      card.className = 'glass-panel p-4 w-full';
      card.innerHTML = `
        <div class="text-xs font-mono text-emerald-400 mb-2 uppercase tracking-wide">Reduce Phase: Parallel Aggregation</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${this.reduceOutputs.map((res, idx) => `
            <div class="p-3 bg-slate-900/80 rounded border border-emerald-800/60">
              <div class="text-xs text-emerald-300 font-mono mb-2">Reducer Worker #${idx + 1} Output</div>
              <div class="space-y-1">
                ${Object.entries(res).map(([k, v]) => `
                  <div class="flex items-center justify-between text-xs font-mono bg-slate-800/90 px-2 py-1 rounded">
                    <span class="text-slate-200 font-semibold">${k}</span>
                    <span class="text-emerald-400 font-bold">${v}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
      container.appendChild(card);
    } else if (this.stage === 4) {
      // Final Output
      const merged = {};
      this.reduceOutputs.forEach(r => Object.assign(merged, r));
      const card = document.createElement('div');
      card.className = 'glass-panel p-4 w-full';
      card.innerHTML = `
        <div class="text-xs font-mono text-amber-400 mb-2 uppercase tracking-wide">Consolidated Global Output</div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          ${Object.entries(merged).map(([k, v]) => `
            <div class="p-2.5 rounded bg-slate-900/90 border border-amber-500/30 flex flex-col items-center">
              <span class="text-xs text-slate-300 font-mono">${k}</span>
              <span class="text-lg font-bold text-amber-400 font-mono">${v}</span>
            </div>
          `).join('')}
        </div>
        <div class="mt-4 text-center">
          <button id="mr-restart-btn" class="btn-primary text-xs">Run Pipeline Again</button>
        </div>
      `;
      container.appendChild(card);
      document.getElementById('mr-restart-btn')?.addEventListener('click', () => {
        this.stage = 0;
        this.render();
      });
    }
  }
}
