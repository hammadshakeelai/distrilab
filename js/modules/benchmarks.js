/**
 * Module: Real Multi-Core Web Worker Benchmark
 * Demonstrates real hardware parallelism, speedup, and efficiency in the browser.
 */

export class BenchmarkModule {
  constructor() {
    this.activeWorkers = [];
    this.maxHardwareThreads = navigator.hardwareConcurrency || 4;
    this.chart = null;
    this.isRunning = false;
    this.sweepCancelled = false;
    this.benchmarkData = [];
  }

  init() {
    this.setupUI();
    this.setupChart();
    this.bindEvents();
    this.renderCoresDisplay(this.maxHardwareThreads);
  }

  setupUI() {
    const threadSelect = document.getElementById('bench-threads');
    if (threadSelect) {
      threadSelect.innerHTML = '';
      const options = [1, 2, 4, 8, 16].filter(n => n <= Math.max(16, this.maxHardwareThreads * 2));
      options.forEach(count => {
        const opt = document.createElement('option');
        opt.value = count;
        opt.textContent = `${count} Thread${count > 1 ? 's' : ''} ${count === this.maxHardwareThreads ? '(Your CPU Native)' : ''}`;
        if (count === Math.min(4, this.maxHardwareThreads)) opt.selected = true;
        threadSelect.appendChild(opt);
      });
    }

    const hwBadge = document.getElementById('hw-concurrency-badge');
    if (hwBadge) {
      hwBadge.textContent = `${this.maxHardwareThreads} Hardware Threads`;
    }
  }

  renderCoresDisplay(count) {
    const container = document.getElementById('core-activity-grid');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const coreCard = document.createElement('div');
      coreCard.id = `core-badge-${i}`;
      coreCard.className = 'glass-panel p-3 flex flex-col items-center justify-center text-center transition-all duration-300';
      coreCard.innerHTML = `
        <div class="text-xs font-mono text-slate-400 mb-1">Worker #${i + 1}</div>
        <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center mb-1 status-circle">
          <span class="text-xs font-mono text-slate-400">IDLE</span>
        </div>
        <div class="text-[11px] font-mono text-slate-500 core-task-info">Waiting</div>
      `;
      container.appendChild(coreCard);
    }
  }

  updateCoreStatus(coreIndex, status, info = '') {
    const card = document.getElementById(`core-badge-${coreIndex}`);
    if (!card) return;
    const circle = card.querySelector('.status-circle');
    const label = circle?.querySelector('span');
    const taskInfo = card.querySelector('.core-task-info');
    if (!circle || !label || !taskInfo) return;

    if (status === 'active') {
      card.style.borderColor = '#06b6d4';
      circle.style.borderColor = '#06b6d4';
      circle.style.backgroundColor = 'rgba(6, 182, 212, 0.2)';
      label.textContent = 'RUN';
      label.className = 'text-xs font-mono text-cyan-300 animate-pulse';
      taskInfo.textContent = info || 'Processing';
      taskInfo.className = 'text-[11px] font-mono text-cyan-400';
    } else if (status === 'done') {
      card.style.borderColor = '#10b981';
      circle.style.borderColor = '#10b981';
      circle.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
      label.textContent = 'OK';
      label.className = 'text-xs font-mono text-emerald-300';
      taskInfo.textContent = info || 'Finished';
      taskInfo.className = 'text-[11px] font-mono text-emerald-400';
    } else {
      card.style.borderColor = 'rgba(51, 65, 85, 0.6)';
      circle.style.borderColor = 'rgba(71, 85, 105, 0.8)';
      circle.style.backgroundColor = '#1e293b';
      label.textContent = 'IDLE';
      label.className = 'text-xs font-mono text-slate-400';
      taskInfo.textContent = 'Idle';
      taskInfo.className = 'text-[11px] font-mono text-slate-500';
    }
  }

  bindEvents() {
    const runBtn = document.getElementById('bench-run-single');
    if (runBtn) {
      runBtn.addEventListener('click', () => {
        const threads = parseInt(document.getElementById('bench-threads').value, 10);
        this.runBenchmark(threads);
      });
    }

    const runSweepBtn = document.getElementById('bench-run-sweep');
    if (runSweepBtn) {
      runSweepBtn.addEventListener('click', () => this.runScalingSweep());
    }

    const resetBtn = document.getElementById('bench-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetBenchmark());
    }
  }

  setupChart() {
    const ctx = document.getElementById('benchmark-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Actual Speedup S(p)',
            data: [],
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.2)',
            borderWidth: 3,
            tension: 0.15,
            pointRadius: 6,
            pointHoverRadius: 8,
            yAxisID: 'y'
          },
          {
            label: 'Ideal Linear Speedup (S = p)',
            data: [],
            borderColor: '#10b981',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            yAxisID: 'y'
          },
          {
            label: 'Execution Time (ms)',
            data: [],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 2,
            borderDash: [2, 2],
            tension: 0.1,
            pointRadius: 5,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            title: { display: true, text: 'Worker Threads (p)', color: '#94a3b8' },
            grid: { color: 'rgba(51, 65, 85, 0.4)' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Speedup Factor (x)', color: '#06b6d4' },
            grid: { color: 'rgba(51, 65, 85, 0.4)' },
            ticks: { color: '#06b6d4' },
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Duration (ms)', color: '#f59e0b' },
            grid: { drawOnChartArea: false },
            ticks: { color: '#f59e0b' },
            beginAtZero: true
          }
        },
        plugins: {
          legend: { labels: { color: '#cbd5e1' } },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#38bdf8',
            borderWidth: 1,
            titleColor: '#38bdf8'
          }
        }
      }
    });
  }

  async runBenchmark(threads) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.toggleButtons(false);
    this.renderCoresDisplay(threads);

    const workload = document.getElementById('bench-workload').value;
    const progressEl = document.getElementById('bench-status');
    if (progressEl) progressEl.textContent = `Running ${workload} on ${threads} thread(s)...`;

    const startTime = performance.now();
    let result = null;

    try {
      if (workload === 'pi') {
        const samples = parseInt(document.getElementById('bench-intensity').value, 10) * 5_000_000;
        result = await this.runParallelPi(threads, samples);
      } else if (workload === 'mandelbrot') {
        const iter = parseInt(document.getElementById('bench-intensity').value, 10) * 400;
        result = await this.runParallelMandelbrot(threads, 720, 480, iter);
      } else if (workload === 'matrix') {
        const size = 300 + parseInt(document.getElementById('bench-intensity').value, 10) * 100;
        result = await this.runParallelMatrix(threads, size);
      }

      const totalTime = performance.now() - startTime;
      this.updateMetricsUI(threads, totalTime, result);
      this.recordDataPoint(threads, totalTime);
    } catch (err) {
      console.error('Benchmark execution error:', err);
      if (progressEl) progressEl.textContent = `Error: ${err.message}`;
    } finally {
      this.isRunning = false;
      this.toggleButtons(true);
    }
  }

  async runScalingSweep() {
    if (this.isRunning) return;
    this.sweepCancelled = false;
    const sweepThreadCounts = [1, 2, 4, 8].filter(n => n <= Math.max(8, this.maxHardwareThreads));
    if (!sweepThreadCounts.includes(this.maxHardwareThreads) && this.maxHardwareThreads <= 16) {
      sweepThreadCounts.push(this.maxHardwareThreads);
      sweepThreadCounts.sort((a, b) => a - b);
    }

    this.benchmarkData = [];
    if (this.chart) {
      this.chart.data.labels = [];
      this.chart.data.datasets.forEach(ds => (ds.data = []));
      this.chart.update();
    }

    for (const threads of sweepThreadCounts) {
      if (this.sweepCancelled) break;
      await this.runBenchmark(threads);
      if (this.sweepCancelled) break;
      await new Promise(r => setTimeout(r, 400));
    }

    const progressEl = document.getElementById('bench-status');
    if (progressEl && !this.sweepCancelled) {
      progressEl.textContent = `Sweep Complete across ${sweepThreadCounts.join(', ')} threads!`;
    }
  }

  cleanupWorkers(workers) {
    workers.forEach(w => {
      try { w.terminate(); } catch (e) {}
      const idx = this.activeWorkers.indexOf(w);
      if (idx !== -1) this.activeWorkers.splice(idx, 1);
    });
  }

  runParallelPi(threads, totalSamples) {
    return new Promise((resolve, reject) => {
      const samplesPerThread = Math.floor(totalSamples / threads);
      let completed = 0;
      let totalInside = 0;
      const workers = [];

      for (let i = 0; i < threads; i++) {
        this.updateCoreStatus(i, 'active', `${Math.round(samplesPerThread / 1000)}k pts`);
        const worker = new Worker('js/workers/benchmark-worker.js');
        workers.push(worker);
        this.activeWorkers.push(worker);

        worker.onmessage = (e) => {
          const { duration, result } = e.data;
          totalInside += result.insideCircle;
          completed++;
          this.updateCoreStatus(i, 'done', `${duration.toFixed(0)} ms`);

          if (completed === threads) {
            this.cleanupWorkers(workers);
            const piEstimate = (4 * totalInside) / totalSamples;
            resolve({
              type: 'pi',
              estimate: piEstimate,
              error: Math.abs(piEstimate - Math.PI)
            });
          }
        };

        worker.onerror = (err) => {
          this.cleanupWorkers(workers);
          reject(err);
        };

        worker.postMessage({
          type: 'monte-carlo-pi',
          taskId: i,
          payload: { samples: samplesPerThread }
        });
      }
    });
  }

  runParallelMandelbrot(threads, width, height, maxIter) {
    return new Promise((resolve, reject) => {
      const canvas = document.getElementById('mandelbrot-canvas');
      const ctx = canvas ? canvas.getContext('2d') : null;
      if (canvas && (canvas.width !== width || canvas.height !== height)) {
        canvas.width = width;
        canvas.height = height;
      }

      const rowsPerWorker = Math.floor(height / threads);
      let completed = 0;
      const workers = [];

      for (let i = 0; i < threads; i++) {
        const startRow = i * rowsPerWorker;
        const endRow = (i === threads - 1) ? height : (i + 1) * rowsPerWorker;

        this.updateCoreStatus(i, 'active', `Rows ${startRow}-${endRow}`);
        const worker = new Worker('js/workers/benchmark-worker.js');
        workers.push(worker);
        this.activeWorkers.push(worker);

        worker.onmessage = (e) => {
          const { duration, result } = e.data;
          const { buffer, startRow: sRow, endRow: eRow } = result;
          const imgData = new ImageData(new Uint8ClampedArray(buffer), width, eRow - sRow);

          if (ctx) {
            ctx.putImageData(imgData, 0, sRow);
          }

          completed++;
          this.updateCoreStatus(i, 'done', `${duration.toFixed(0)} ms`);

          if (completed === threads) {
            this.cleanupWorkers(workers);
            resolve({ type: 'mandelbrot', resolution: `${width}x${height}` });
          }
        };

        worker.onerror = (err) => {
          this.cleanupWorkers(workers);
          reject(err);
        };

        worker.postMessage({
          type: 'mandelbrot',
          taskId: i,
          payload: {
            width,
            height,
            startRow,
            endRow,
            maxIter,
            xMin: -2.0,
            xMax: 0.6,
            yMin: -1.2,
            yMax: 1.2
          }
        });
      }
    });
  }

  runParallelMatrix(threads, n) {
    return new Promise((resolve, reject) => {
      const a = new Float64Array(n * n);
      const b = new Float64Array(n * n);
      for (let i = 0; i < n * n; i++) {
        a[i] = Math.random();
        b[i] = Math.random();
      }

      const rowsPerWorker = Math.floor(n / threads);
      let completed = 0;
      const workers = [];

      for (let i = 0; i < threads; i++) {
        const startRow = i * rowsPerWorker;
        const endRow = (i === threads - 1) ? n : (i + 1) * rowsPerWorker;

        this.updateCoreStatus(i, 'active', `Rows ${startRow}-${endRow}`);
        const worker = new Worker('js/workers/benchmark-worker.js');
        workers.push(worker);
        this.activeWorkers.push(worker);

        worker.onmessage = (e) => {
          const { duration } = e.data;
          completed++;
          this.updateCoreStatus(i, 'done', `${duration.toFixed(0)} ms`);

          if (completed === threads) {
            this.cleanupWorkers(workers);
            resolve({ type: 'matrix', size: `${n}x${n}` });
          }
        };

        worker.onerror = (err) => {
          this.cleanupWorkers(workers);
          reject(err);
        };

        worker.postMessage({
          type: 'matrix-multiply',
          taskId: i,
          payload: {
            n,
            startRow,
            endRow,
            matrixA: a.buffer,
            matrixB: b.buffer
          }
        });
      }
    });
  }

  updateMetricsUI(threads, duration, result) {
    const timeEl = document.getElementById('metric-time');
    const speedupEl = document.getElementById('metric-speedup');
    const effEl = document.getElementById('metric-efficiency');
    const detailEl = document.getElementById('metric-result-detail');

    if (timeEl) timeEl.textContent = `${duration.toFixed(1)} ms`;

    const t1 = this.benchmarkData.find(d => d.threads === 1)?.time || (threads === 1 ? duration : null);
    let speedup = 1.0;
    let efficiency = 100.0;

    if (t1 && threads > 1) {
      speedup = t1 / duration;
      efficiency = (speedup / threads) * 100;
    }

    if (speedupEl) speedupEl.textContent = `${speedup.toFixed(2)}x`;
    if (effEl) effEl.textContent = `${efficiency.toFixed(1)}%`;

    if (detailEl && result) {
      if (result.type === 'pi') {
        detailEl.textContent = `π ≈ ${result.estimate.toFixed(7)} (Error: ${(result.error * 100).toFixed(4)}%)`;
      } else if (result.type === 'mandelbrot') {
        detailEl.textContent = `Rendered ${result.resolution} fractal slice canvas`;
      } else if (result.type === 'matrix') {
        detailEl.textContent = `Multiplied dense ${result.size} matrices`;
      }
    }
  }

  recordDataPoint(threads, duration) {
    const existingIdx = this.benchmarkData.findIndex(d => d.threads === threads);
    if (existingIdx >= 0) {
      this.benchmarkData[existingIdx].time = duration;
    } else {
      this.benchmarkData.push({ threads, time: duration });
    }
    this.benchmarkData.sort((a, b) => a.threads - b.threads);

    const t1 = this.benchmarkData[0].time;
    const labels = this.benchmarkData.map(d => `${d.threads}T`);
    const actualSpeedups = this.benchmarkData.map(d => +(t1 / d.time).toFixed(2));
    const idealSpeedups = this.benchmarkData.map(d => d.threads);
    const times = this.benchmarkData.map(d => +d.time.toFixed(1));

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = actualSpeedups;
      this.chart.data.datasets[1].data = idealSpeedups;
      this.chart.data.datasets[2].data = times;
      this.chart.update();
    }
  }

  resetBenchmark() {
    this.sweepCancelled = true;
    this.isRunning = false;
    this.activeWorkers.forEach(w => {
      try { w.terminate(); } catch (e) {}
    });
    this.activeWorkers = [];

    this.benchmarkData = [];
    if (this.chart) {
      this.chart.data.labels = [];
      this.chart.data.datasets.forEach(ds => (ds.data = []));
      this.chart.update();
    }
    this.renderCoresDisplay(parseInt(document.getElementById('bench-threads')?.value || '4', 10));
    document.getElementById('metric-time').textContent = '-- ms';
    document.getElementById('metric-speedup').textContent = '--';
    document.getElementById('metric-efficiency').textContent = '--';
    document.getElementById('metric-result-detail').textContent = 'Ready to launch';
    document.getElementById('bench-status').textContent = 'Ready';
    this.toggleButtons(true);
  }

  toggleButtons(enable) {
    ['bench-run-single', 'bench-run-sweep', 'bench-reset'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = !enable;
    });
  }
}
