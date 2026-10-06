/**
 * Module: Flynn's Taxonomy Interactive Architecture Visualizer
 * Animates SISD, SIMD, MISD, and MIMD hardware instruction & data pipelines.
 */

export class FlynnModule {
  constructor() {
    this.currentMode = 'simd';
    this.animationId = null;
    this.clock = 0;
    this.speed = 1.0;
    this.canvas = null;
    this.ctx = null;
  }

  init() {
    this.canvas = document.getElementById('flynn-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }

    this.bindEvents();
    this.setMode('simd');
    this.startAnimation();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 800;
    this.canvas.height = 420;
  }

  bindEvents() {
    const tabs = document.querySelectorAll('.flynn-type-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.setMode(mode);
      });
    });

    const speedSlider = document.getElementById('flynn-speed-slider');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        this.speed = parseFloat(e.target.value);
      });
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll('.flynn-type-btn').forEach(btn => {
      if (btn.dataset.mode === mode) {
        btn.classList.add('active', 'border-cyan-500', 'bg-cyan-950/40', 'text-cyan-400');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('active', 'border-cyan-500', 'bg-cyan-950/40', 'text-cyan-400');
        btn.classList.add('text-slate-400');
      }
    });

    const infoMap = {
      sisd: {
        title: 'SISD — Single Instruction, Single Data',
        desc: 'A single control unit fetches instructions that operate sequentially on a single data stream. Found in classic uniprocessor architectures.',
        example: 'Intel 8086, PDP-11, single-core deterministic microcontroller'
      },
      simd: {
        title: 'SIMD — Single Instruction, Multiple Data',
        desc: 'A single instruction is broadcast simultaneously across multiple processing elements (ALUs), each operating on distinct data slices. Highly efficient for vector arithmetic and graphics.',
        example: 'NVIDIA GPU Streaming Multiprocessors, Intel AVX-512, ARM Neon'
      },
      misd: {
        title: 'MISD — Multiple Instruction, Single Data',
        desc: 'Multiple autonomous processing elements execute distinct instruction streams on the exact same single data stream. Used for redundancy, voting, and pipelined verification.',
        example: 'Space Shuttle flight control computer voting, systolic neural inference arrays'
      },
      mimd: {
        title: 'MIMD — Multiple Instruction, Multiple Data',
        desc: 'Multiple independent processors each fetch distinct instructions and operate on independent data streams. The foundational paradigm of modern multi-core computing and distributed clusters.',
        example: 'Multi-core CPUs (AMD EPYC, Apple Silicon M-series), HPC MPI Clusters'
      }
    };

    const info = infoMap[mode] || infoMap.simd;
    document.getElementById('flynn-info-title').textContent = info.title;
    document.getElementById('flynn-info-desc').textContent = info.desc;
    document.getElementById('flynn-info-example').textContent = `Real-World Exemplars: ${info.example}`;
  }

  startAnimation() {
    const render = () => {
      this.clock += 0.025 * this.speed;
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    this.animationId = requestAnimationFrame(render);
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Grid backdrop
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (this.currentMode === 'sisd') {
      this.drawSISD(ctx, w, h);
    } else if (this.currentMode === 'simd') {
      this.drawSIMD(ctx, w, h);
    } else if (this.currentMode === 'misd') {
      this.drawMISD(ctx, w, h);
    } else if (this.currentMode === 'mimd') {
      this.drawMIMD(ctx, w, h);
    }
  }

  drawBox(ctx, x, y, width, height, title, subtitle, color = '#38bdf8') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + width / 2, y + height / 2 - 2);

    if (subtitle) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(subtitle, x + width / 2, y + height / 2 + 14);
    }
  }

  drawAnimatedPacket(ctx, x1, y1, x2, y2, progress, label, color = '#06b6d4') {
    const curX = x1 + (x2 - x1) * (progress % 1);
    const curY = y1 + (y2 - y1) * (progress % 1);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing packet
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(curX, curY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (label) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, curX, curY - 9);
    }
  }

  drawSISD(ctx, w, h) {
    const cuX = w * 0.2, cuY = h * 0.3;
    const peX = w * 0.5, peY = h * 0.5;
    const memX = w * 0.2, memY = h * 0.7;
    const outX = w * 0.8, outY = h * 0.5;

    this.drawBox(ctx, cuX - 60, cuY - 25, 120, 50, 'Control Unit', 'IS (Single)', '#38bdf8');
    this.drawBox(ctx, memX - 60, memY - 25, 120, 50, 'Memory Pool', 'DS (Single)', '#a855f7');
    this.drawBox(ctx, peX - 60, peY - 30, 120, 60, 'Processing Elem', 'ALU / Core', '#10b981');
    this.drawBox(ctx, outX - 50, outY - 25, 100, 50, 'Output', 'Register/Store', '#f59e0b');

    // Streams
    this.drawAnimatedPacket(ctx, cuX + 60, cuY, peX - 60, peY - 10, this.clock, 'Inst [i]', '#38bdf8');
    this.drawAnimatedPacket(ctx, memX + 60, memY, peX - 60, peY + 10, this.clock + 0.3, 'Data [d]', '#a855f7');
    this.drawAnimatedPacket(ctx, peX + 60, peY, outX - 50, outY, this.clock + 0.6, 'Result', '#10b981');
  }

  drawSIMD(ctx, w, h) {
    const cuX = w * 0.15, cuY = h * 0.5;
    const numPE = 4;
    const peX = w * 0.55;
    const peSpacing = h / (numPE + 1);

    this.drawBox(ctx, cuX - 60, cuY - 40, 120, 80, 'Broadcast CU', 'Single Inst', '#38bdf8');

    for (let i = 0; i < numPE; i++) {
      const pY = (i + 1) * peSpacing;
      this.drawBox(ctx, peX - 55, pY - 20, 110, 40, `PE #${i}`, `Data D[${i}]`, '#10b981');
      this.drawBox(ctx, w * 0.85 - 35, pY - 18, 70, 36, `Out ${i}`, '', '#f59e0b');

      // Shared instruction broadcast line
      this.drawAnimatedPacket(ctx, cuX + 60, cuY, peX - 55, pY, this.clock, 'Inst: VADD', '#38bdf8');
      // Data out
      this.drawAnimatedPacket(ctx, peX + 55, pY, w * 0.85 - 35, pY, this.clock + 0.4 + i * 0.05, `R[${i}]`, '#10b981');
    }
  }

  drawMISD(ctx, w, h) {
    const numCU = 3;
    const spacing = h / (numCU + 1);
    const dataX = w * 0.15, dataY = h * 0.5;

    this.drawBox(ctx, dataX - 60, dataY - 40, 120, 80, 'Single Data', 'Sensor / Feed', '#a855f7');
    const voterX = w * 0.82;

    for (let i = 0; i < numCU; i++) {
      const y = (i + 1) * spacing;
      this.drawBox(ctx, w * 0.48 - 65, y - 24, 130, 48, `CU + PE #${i}`, `Algorithm ${i + 1}`, '#38bdf8');

      // Broadcast same data to different algorithms
      this.drawAnimatedPacket(ctx, dataX + 60, dataY, w * 0.48 - 65, y, this.clock + i * 0.1, 'Telemetry', '#a855f7');
      // Feed to Voter
      this.drawAnimatedPacket(ctx, w * 0.48 + 65, y, voterX - 45, h * 0.5, this.clock + 0.5 + i * 0.1, `Vote ${i}`, '#10b981');
    }

    this.drawBox(ctx, voterX - 45, h * 0.5 - 35, 90, 70, 'Voter / Arbiter', 'Fault Tol.', '#f43f5e');
  }

  drawMIMD(ctx, w, h) {
    const numNodes = 4;
    const spacing = h / (numNodes + 1);

    for (let i = 0; i < numNodes; i++) {
      const y = (i + 1) * spacing;
      const cuX = w * 0.15;
      const peX = w * 0.5;
      const memX = w * 0.85;

      this.drawBox(ctx, cuX - 45, y - 18, 90, 36, `CU ${i}`, `Inst ${i}`, '#38bdf8');
      this.drawBox(ctx, peX - 50, y - 20, 100, 40, `Core ${i}`, 'Independent', '#10b981');
      this.drawBox(ctx, memX - 45, y - 18, 90, 36, `Mem ${i}`, `Data ${i}`, '#a855f7');

      this.drawAnimatedPacket(ctx, cuX + 45, y, peX - 50, y, this.clock + i * 0.2, `I_${i}`, '#38bdf8');
      this.drawAnimatedPacket(ctx, memX - 45, y, peX + 50, y, this.clock + 0.3 + i * 0.15, `D_${i}`, '#a855f7');
    }
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
