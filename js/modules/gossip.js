/**
 * Module: Gossip / Epidemic Protocol Simulator
 * Simulates decentralized peer-to-peer rumor spreading, fault tolerance, and O(log N) dissemination.
 */

export class GossipModule {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.chart = null;
    this.nodes = [];
    this.packets = [];
    this.round = 0;
    this.fanout = 2; // k random peers per round
    this.packetLoss = 0.05; // 5% packet loss
    this.isRunning = false;
    this.animationId = null;
    this.historyData = [];
  }

  init() {
    this.canvas = document.getElementById('gossip-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }

    this.setupChart();
    this.resetSimulation();
    this.bindEvents();
    this.startLoop();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 600;
    this.canvas.height = 420;
    this.layoutNodes();
  }

  setupChart() {
    const ctx = document.getElementById('gossip-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: '% Cluster Infected',
          data: [],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          fill: true,
          tension: 0.3,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'Gossip Rounds', color: '#94a3b8' },
            grid: { color: 'rgba(51, 65, 85, 0.4)' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            title: { display: true, text: '% Nodes Reached', color: '#94a3b8' },
            min: 0,
            max: 100,
            grid: { color: 'rgba(51, 65, 85, 0.4)' },
            ticks: { color: '#94a3b8' }
          }
        },
        plugins: {
          legend: { labels: { color: '#cbd5e1' } }
        }
      }
    });
  }

  resetSimulation() {
    this.round = 0;
    this.packets = [];
    this.historyData = [];
    this.nodes = [];

    const totalNodes = 36;
    for (let i = 0; i < totalNodes; i++) {
      this.nodes.push({
        id: i,
        x: 0,
        y: 0,
        infected: i === 0, // Node 0 starts with rumor
        roundInfected: i === 0 ? 0 : null,
        alive: true
      });
    }

    this.layoutNodes();

    if (this.chart) {
      this.chart.data.labels = [0];
      this.chart.data.datasets[0].data = [(1 / totalNodes) * 100];
      this.chart.update();
    }

    this.updateStatsUI();
  }

  layoutNodes() {
    if (!this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const total = this.nodes.length;
    const cols = 6;
    const rows = 6;
    const paddingX = w * 0.12;
    const paddingY = h * 0.12;
    const stepX = (w - 2 * paddingX) / (cols - 1);
    const stepY = (h - 2 * paddingY) / (rows - 1);

    this.nodes.forEach((n, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      // Small jitter for organic look
      const jitterX = Math.sin(idx * 7) * 8;
      const jitterY = Math.cos(idx * 5) * 8;
      n.x = paddingX + c * stepX + jitterX;
      n.y = paddingY + r * stepY + jitterY;
    });
  }

  bindEvents() {
    const stepBtn = document.getElementById('gossip-step-btn');
    if (stepBtn) {
      stepBtn.addEventListener('click', () => this.runOneRound());
    }

    const autoBtn = document.getElementById('gossip-auto-btn');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => this.toggleAutoGossip());
    }

    const resetBtn = document.getElementById('gossip-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.stopAutoGossip();
        this.resetSimulation();
      });
    }

    const fanoutSlider = document.getElementById('gossip-fanout-slider');
    const fanoutVal = document.getElementById('gossip-fanout-val');
    if (fanoutSlider && fanoutVal) {
      fanoutSlider.addEventListener('input', (e) => {
        this.fanout = parseInt(e.target.value, 10);
        fanoutVal.textContent = `Fanout: ${this.fanout} peers`;
      });
    }

    const lossSlider = document.getElementById('gossip-loss-slider');
    const lossVal = document.getElementById('gossip-loss-val');
    if (lossSlider && lossVal) {
      lossSlider.addEventListener('input', (e) => {
        this.packetLoss = parseFloat(e.target.value) / 100;
        lossVal.textContent = `Packet Loss: ${e.target.value}%`;
      });
    }
  }

  toggleAutoGossip() {
    const btn = document.getElementById('gossip-auto-btn');
    if (this.autoTimer) {
      this.stopAutoGossip();
    } else {
      if (btn) btn.textContent = 'Pause Auto';
      this.autoTimer = setInterval(() => {
        const aliveNodes = this.nodes.filter(n => n.alive);
        const infectedCount = this.nodes.filter(n => n.infected && n.alive).length;
        if (infectedCount >= aliveNodes.length) {
          this.stopAutoGossip();
          return;
        }
        this.runOneRound();
      }, 700);
    }
  }

  stopAutoGossip() {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
    const btn = document.getElementById('gossip-auto-btn');
    if (btn) btn.textContent = 'Auto Disseminate';
  }

  runOneRound() {
    const infectedNodes = this.nodes.filter(n => n.infected && n.alive);
    if (infectedNodes.length === 0 || infectedNodes.length === this.nodes.filter(n => n.alive).length) {
      return;
    }

    this.round++;

    // Each infected node picks 'k' random peers
    infectedNodes.forEach(source => {
      const peers = this.nodes.filter(p => p.id !== source.id && p.alive);
      // Shuffle & pick k peers
      const chosen = peers.sort(() => 0.5 - Math.random()).slice(0, this.fanout);

      chosen.forEach(target => {
        // Check for simulated packet loss
        const dropped = Math.random() < this.packetLoss;
        this.packets.push({
          from: source.id,
          to: target.id,
          progress: 0,
          speed: 0.04,
          dropped
        });
      });
    });

    this.updateStatsUI();
  }

  updateStatsUI() {
    const aliveNodes = this.nodes.filter(n => n.alive);
    const infectedCount = this.nodes.filter(n => n.infected && n.alive).length;
    const pct = ((infectedCount / aliveNodes.length) * 100).toFixed(1);

    const roundEl = document.getElementById('gossip-round-val');
    const pctEl = document.getElementById('gossip-infected-val');
    if (roundEl) roundEl.textContent = `Round ${this.round}`;
    if (pctEl) pctEl.textContent = `${pct}% (${infectedCount}/${aliveNodes.length})`;

    if (this.chart && !this.chart.data.labels.includes(this.round)) {
      this.chart.data.labels.push(this.round);
      this.chart.data.datasets[0].data.push(parseFloat(pct));
      this.chart.update();
    }
  }

  startLoop() {
    const step = () => {
      // Update in-flight packets
      for (let i = this.packets.length - 1; i >= 0; i--) {
        const p = this.packets[i];
        p.progress += p.speed;

        if (p.progress >= 1.0) {
          if (!p.dropped) {
            const target = this.nodes[p.to];
            if (!target.infected && target.alive) {
              target.infected = true;
              target.roundInfected = this.round;
            }
          }
          this.packets.splice(i, 1);
        }
      }

      this.draw();
      this.animationId = requestAnimationFrame(step);
    };
    this.animationId = requestAnimationFrame(step);
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw packets
    this.packets.forEach(p => {
      const src = this.nodes[p.from];
      const tgt = this.nodes[p.to];
      const curX = src.x + (tgt.x - src.x) * p.progress;
      const curY = src.y + (tgt.y - src.y) * p.progress;

      ctx.save();
      ctx.strokeStyle = p.dropped ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.stroke();

      ctx.fillStyle = p.dropped ? '#f43f5e' : '#10b981';
      ctx.shadowColor = p.dropped ? '#f43f5e' : '#10b981';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(curX, curY, p.dropped ? 3 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw nodes
    this.nodes.forEach(n => {
      ctx.save();
      let color = '#475569';
      if (!n.alive) color = '#f43f5e';
      else if (n.infected) color = '#10b981';

      if (n.infected) {
        ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
        ctx.shadowBlur = 10;
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = n.infected ? '#059669' : '#1e293b';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#f8fafc';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(n.id, n.x, n.y + 3);
    });
  }

  pause() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resume() {
    if (!this.animationId) {
      this.startLoop();
    }
  }

  destroy() {
    this.stopAutoGossip();
    this.pause();
  }
}
