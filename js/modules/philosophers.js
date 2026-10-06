/**
 * Module: Dining Philosophers & Deadlock Detection
 * Simulates concurrency, mutex locks, Coffman conditions, and Resource Allocation Graphs (RAG).
 */

export class PhilosophersModule {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.numPhilosophers = 5;
    this.philosophers = [];
    this.forks = [];
    this.strategy = 'naive'; // 'naive', 'hierarchy', 'arbitrator'
    this.isRunning = true;
    this.speed = 1.0;
    this.animationId = null;
    this.isDeadlocked = false;
    this.arbitratorSlots = 4; // max concurrent eaters allowed in arbitrator mode

    this.names = ['Aristotle', 'Plato', 'Socrates', 'Descartes', 'Kant'];
  }

  init() {
    this.canvas = document.getElementById('philosophers-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }

    this.resetSimulation();
    this.bindEvents();
    this.startLoop();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 600;
    this.canvas.height = 440;
  }

  resetSimulation() {
    this.isDeadlocked = false;
    this.forks = [];
    for (let i = 0; i < this.numPhilosophers; i++) {
      this.forks.push({ id: i, heldBy: null });
    }

    this.philosophers = [];
    for (let i = 0; i < this.numPhilosophers; i++) {
      this.philosophers.push({
        id: i,
        name: this.names[i],
        state: 'thinking', // thinking, hungry, holding_one, eating
        heldForks: [],
        timer: Math.random() * 80 + 40,
        eatCount: 0,
        waitingForFork: null
      });
    }

    this.updateStatusBanner();
  }

  bindEvents() {
    const stratSelect = document.getElementById('philo-strategy');
    if (stratSelect) {
      stratSelect.addEventListener('change', (e) => {
        this.strategy = e.target.value;
        this.resetSimulation();
      });
    }

    const forceDeadlockBtn = document.getElementById('philo-force-deadlock');
    if (forceDeadlockBtn) {
      forceDeadlockBtn.addEventListener('click', () => this.forceSimultaneousHunger());
    }

    const resetBtn = document.getElementById('philo-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetSimulation());
    }

    const playPauseBtn = document.getElementById('philo-toggle-play');
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        this.isRunning = !this.isRunning;
        playPauseBtn.textContent = this.isRunning ? 'Pause' : 'Resume';
      });
    }
  }

  forceSimultaneousHunger() {
    this.strategy = 'naive';
    const stratSelect = document.getElementById('philo-strategy');
    if (stratSelect) stratSelect.value = 'naive';

    // Release all forks first
    this.forks.forEach(f => f.heldBy = null);

    // Make all hungry at the exact same moment
    this.philosophers.forEach(p => {
      p.state = 'hungry';
      p.heldForks = [];
      p.waitingForFork = null;
      p.timer = 1;
    });

    this.isDeadlocked = false;
    this.updateStatusBanner();
  }

  startLoop() {
    let lastTime = performance.now();
    const step = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (this.isRunning) {
        this.update(dt * this.speed);
      }
      this.draw();
      this.animationId = requestAnimationFrame(step);
    };
    this.animationId = requestAnimationFrame(step);
  }

  update(dt) {
    if (this.isDeadlocked) return;

    // Check circular wait deadlock condition
    const holdingCount = this.philosophers.filter(p => p.heldForks.length === 1).length;
    if (holdingCount === this.numPhilosophers) {
      this.isDeadlocked = true;
      this.philosophers.forEach(p => p.state = 'deadlocked');
      this.updateStatusBanner();
      return;
    }

    for (let p of this.philosophers) {
      p.timer -= dt * 60;
      const leftForkIdx = p.id;
      const rightForkIdx = (p.id + 1) % this.numPhilosophers;

      if (p.state === 'thinking' && p.timer <= 0) {
        p.state = 'hungry';
        p.timer = 0;
      } else if (p.state === 'hungry') {
        this.tryAcquireForks(p, leftForkIdx, rightForkIdx);
      } else if (p.state === 'eating') {
        if (p.timer <= 0) {
          // Finished eating, release both forks
          p.heldForks.forEach(fId => {
            this.forks[fId].heldBy = null;
          });
          p.heldForks = [];
          p.waitingForFork = null;
          p.state = 'thinking';
          p.timer = Math.random() * 90 + 50;
        }
      }
    }
  }

  tryAcquireForks(p, leftIdx, rightIdx) {
    if (this.strategy === 'naive') {
      // Pick left first, then right
      if (p.heldForks.length === 0) {
        if (this.forks[leftIdx].heldBy === null) {
          this.forks[leftIdx].heldBy = p.id;
          p.heldForks.push(leftIdx);
          p.waitingForFork = rightIdx;
        } else {
          p.waitingForFork = leftIdx;
        }
      } else if (p.heldForks.length === 1) {
        if (this.forks[rightIdx].heldBy === null) {
          this.forks[rightIdx].heldBy = p.id;
          p.heldForks.push(rightIdx);
          p.waitingForFork = null;
          p.state = 'eating';
          p.timer = Math.random() * 80 + 50;
          p.eatCount++;
        } else {
          p.waitingForFork = rightIdx;
        }
      }
    } else if (this.strategy === 'hierarchy') {
      // Dijkstra's Resource Hierarchy: Lower index fork first, except last philosopher
      const first = Math.min(leftIdx, rightIdx);
      const second = Math.max(leftIdx, rightIdx);

      if (p.heldForks.length === 0) {
        if (this.forks[first].heldBy === null) {
          this.forks[first].heldBy = p.id;
          p.heldForks.push(first);
          p.waitingForFork = second;
        } else {
          p.waitingForFork = first;
        }
      } else if (p.heldForks.length === 1) {
        if (this.forks[second].heldBy === null) {
          this.forks[second].heldBy = p.id;
          p.heldForks.push(second);
          p.waitingForFork = null;
          p.state = 'eating';
          p.timer = Math.random() * 80 + 50;
          p.eatCount++;
        } else {
          p.waitingForFork = second;
        }
      }
    } else if (this.strategy === 'arbitrator') {
      // Arbitrator: Only allow at most (N-1) philosophers to hold forks
      const currentClaimants = this.philosophers.filter(ph => ph.heldForks.length > 0).length;
      if (currentClaimants < this.arbitratorSlots || p.heldForks.length > 0) {
        if (this.forks[leftIdx].heldBy === null && this.forks[rightIdx].heldBy === null) {
          this.forks[leftIdx].heldBy = p.id;
          this.forks[rightIdx].heldBy = p.id;
          p.heldForks = [leftIdx, rightIdx];
          p.waitingForFork = null;
          p.state = 'eating';
          p.timer = Math.random() * 80 + 50;
          p.eatCount++;
        }
      }
    }
  }

  updateStatusBanner() {
    const banner = document.getElementById('philo-status-banner');
    const ragCycle = document.getElementById('rag-cycle-detected');
    if (!banner) return;

    if (this.isDeadlocked) {
      banner.textContent = 'CRITICAL DEADLOCK DETECTED! Circular Wait P0 -> F1 -> P1 -> F2 -> P2 -> F3 -> P3 -> F4 -> P4 -> F0';
      banner.className = 'p-3 rounded-lg bg-rose-950/60 border border-rose-500/60 text-rose-300 font-mono text-xs font-semibold animate-pulse';
      if (ragCycle) ragCycle.textContent = 'CYCLE DETECTED (System Frozen)';
      if (ragCycle) ragCycle.className = 'text-rose-400 font-bold';
    } else {
      banner.textContent = `Active Strategy: ${this.strategy.toUpperCase()} | No Deadlock. System Progressing smoothly.`;
      banner.className = 'p-3 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-300 font-mono text-xs';
      if (ragCycle) ragCycle.textContent = 'No Cycles Detected';
      if (ragCycle) ragCycle.className = 'text-emerald-400 font-semibold';
    }
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const tableRadius = Math.min(w, h) * 0.35;

    ctx.clearRect(0, 0, w, h);

    // Draw Dining Table
    ctx.beginPath();
    ctx.arc(centerX, centerY, tableRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fill();
    ctx.strokeStyle = this.isDeadlocked ? 'rgba(244, 63, 94, 0.6)' : 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Table center label
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SHARED RESOURCE POOL', centerX, centerY - 6);
    ctx.fillStyle = this.isDeadlocked ? '#f43f5e' : '#38bdf8';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(this.isDeadlocked ? 'DEADLOCKED ⚠️' : 'Active Mutexes', centerX, centerY + 12);

    // Positions for philosophers & forks
    const n = this.numPhilosophers;

    // Draw Forks (placed midway between philosophers)
    for (let i = 0; i < n; i++) {
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2 + Math.PI / n;
      const forkRadius = tableRadius * 0.62;
      const fx = centerX + Math.cos(angle) * forkRadius;
      const fy = centerY + Math.sin(angle) * forkRadius;
      const fork = this.forks[i];

      // Draw fork
      ctx.beginPath();
      ctx.arc(fx, fy, 14, 0, Math.PI * 2);
      ctx.fillStyle = fork.heldBy !== null ? 'rgba(245, 158, 11, 0.25)' : 'rgba(30, 41, 59, 0.9)';
      ctx.strokeStyle = fork.heldBy !== null ? '#f59e0b' : '#64748b';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = fork.heldBy !== null ? '#fbbf24' : '#94a3b8';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(`F${i}`, fx, fy + 3);

      // Directed edges in Resource Allocation Graph (RAG)
      if (fork.heldBy !== null) {
        // Edge: Fork -> Holding Philosopher (Allocated)
        const pAngle = (fork.heldBy * 2 * Math.PI) / n - Math.PI / 2;
        const px = centerX + Math.cos(pAngle) * (tableRadius * 1.05);
        const py = centerY + Math.sin(pAngle) * (tableRadius * 1.05);

        ctx.strokeStyle = this.isDeadlocked ? '#f43f5e' : '#38bdf8';
        ctx.lineWidth = this.isDeadlocked ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
    }

    // Draw Philosophers
    for (let i = 0; i < n; i++) {
      const p = this.philosophers[i];
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
      const px = centerX + Math.cos(angle) * (tableRadius * 1.05);
      const py = centerY + Math.sin(angle) * (tableRadius * 1.05);

      // Color scheme based on state
      let color = '#38bdf8';
      let stateBadge = 'Thinking';
      if (p.state === 'hungry') {
        color = '#fbbf24';
        stateBadge = 'Hungry';
      } else if (p.state === 'eating') {
        color = '#10b981';
        stateBadge = 'Eating';
      } else if (p.state === 'deadlocked') {
        color = '#f43f5e';
        stateBadge = 'Blocked';
      }

      // Waiting directed edge: Philosopher -> Fork (Request edge)
      if (p.waitingForFork !== null) {
        const forkAngle = (p.waitingForFork * 2 * Math.PI) / n - Math.PI / 2 + Math.PI / n;
        const fx = centerX + Math.cos(forkAngle) * (tableRadius * 0.62);
        const fy = centerY + Math.sin(forkAngle) * (tableRadius * 0.62);

        ctx.strokeStyle = this.isDeadlocked ? '#f43f5e' : '#f59e0b';
        ctx.lineWidth = this.isDeadlocked ? 2.5 : 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(fx, fy);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Philosopher Node
      ctx.beginPath();
      ctx.arc(px, py, 26, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();

      // Philosopher name & state
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(p.name, px, py - 4);

      ctx.fillStyle = color;
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(stateBadge, px, py + 9);

      // Meals count
      ctx.fillStyle = '#64748b';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(`${p.eatCount} meals`, px, py + 19);
    }
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
