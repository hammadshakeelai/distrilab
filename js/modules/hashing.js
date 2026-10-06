/**
 * Module: Consistent Hashing Ring Visualizer
 * Simulates distributed key-value storage, virtual nodes (vnodes), and minimal key redistribution.
 */

export class ConsistentHashingModule {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.nodes = [];
    this.keys = [];
    this.vnodesPerNode = 3;
    this.ringPoints = []; // sorted list of { angle, nodeName, isVnode, color }
    this.colorPalette = ['#06b6d4', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#3b82f6'];
  }

  init() {
    this.canvas = document.getElementById('hashing-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }

    this.initDefaultCluster();
    this.bindEvents();
    this.rebuildRing();
    this.draw();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 560;
    this.canvas.height = 460;
    this.draw();
  }

  simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return (hash >>> 0);
  }

  initDefaultCluster() {
    this.nodes = [
      { id: 'node-A', name: 'Server A', color: this.colorPalette[0] },
      { id: 'node-B', name: 'Server B', color: this.colorPalette[1] },
      { id: 'node-C', name: 'Server C', color: this.colorPalette[2] }
    ];

    this.keys = [];
    const sampleKeys = ['session:user_101', 'cache:item_928', 'cart:usr_402', 'profile:avatar_12', 'token:jwt_auth', 'order:ord_882', 'doc:report_4', 'metric:cpu_load'];
    sampleKeys.forEach(k => {
      const angle = (this.simpleHash(k) % 360) * (Math.PI / 180);
      this.keys.push({ id: k, angle });
    });
  }

  bindEvents() {
    const addNodeBtn = document.getElementById('hash-add-node');
    if (addNodeBtn) {
      addNodeBtn.addEventListener('click', () => this.addNode());
    }

    const removeNodeBtn = document.getElementById('hash-remove-node');
    if (removeNodeBtn) {
      removeNodeBtn.addEventListener('click', () => this.removeNode());
    }

    const addKeyBtn = document.getElementById('hash-add-key');
    if (addKeyBtn) {
      addKeyBtn.addEventListener('click', () => {
        const keyName = `key_${Math.floor(Math.random() * 1000)}`;
        const angle = (this.simpleHash(keyName + Math.random()) % 360) * (Math.PI / 180);
        this.keys.push({ id: keyName, angle });
        this.rebuildRing();
        this.draw();
      });
    }

    const vnodesSlider = document.getElementById('hash-vnodes-slider');
    const vnodesVal = document.getElementById('hash-vnodes-val');
    if (vnodesSlider && vnodesVal) {
      vnodesSlider.addEventListener('input', (e) => {
        this.vnodesPerNode = parseInt(e.target.value, 10);
        vnodesVal.textContent = `${this.vnodesPerNode} Vnodes / Server`;
        this.rebuildRing();
        this.draw();
      });
    }
  }

  addNode() {
    if (this.nodes.length >= 6) return;
    const names = ['Server A', 'Server B', 'Server C', 'Server D', 'Server E', 'Server F'];
    const nextName = names[this.nodes.length];
    const color = this.colorPalette[this.nodes.length % this.colorPalette.length];
    this.nodes.push({ id: `node-${this.nodes.length}`, name: nextName, color });
    this.rebuildRing();
    this.draw();
  }

  removeNode() {
    if (this.nodes.length <= 2) return;
    this.nodes.pop();
    this.rebuildRing();
    this.draw();
  }

  rebuildRing() {
    this.ringPoints = [];

    this.nodes.forEach(node => {
      for (let v = 0; v < this.vnodesPerNode; v++) {
        const vKey = `${node.id}-vnode-${v}`;
        const hashVal = this.simpleHash(vKey);
        const angle = (hashVal % 360) * (Math.PI / 180);
        this.ringPoints.push({
          angle,
          nodeId: node.id,
          nodeName: node.name,
          color: node.color,
          isVnode: v > 0,
          label: v === 0 ? node.name : `${node.name}#${v}`
        });
      }
    });

    this.ringPoints.sort((a, b) => a.angle - b.angle);
    this.assignKeysToNodes();
  }

  assignKeysToNodes() {
    if (this.ringPoints.length === 0) return;

    this.keys.forEach(k => {
      // Find nearest clockwise node point
      let assigned = this.ringPoints.find(p => p.angle >= k.angle);
      if (!assigned) {
        assigned = this.ringPoints[0]; // wraps around 360 degrees
      }
      k.assignedNode = assigned.nodeName;
      k.color = assigned.color;
    });

    this.updateStatsUI();
  }

  updateStatsUI() {
    const listEl = document.getElementById('hash-node-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const counts = {};
    this.nodes.forEach(n => counts[n.name] = 0);
    this.keys.forEach(k => {
      if (counts[k.assignedNode] !== undefined) counts[k.assignedNode]++;
    });

    this.nodes.forEach(node => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 text-xs font-mono';
      row.innerHTML = `
        <span class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full" style="background-color: ${node.color}"></span>
          <span class="text-slate-200">${node.name}</span>
        </span>
        <span class="text-slate-400">${counts[node.name] || 0} keys (${this.keys.length > 0 ? ((counts[node.name] / this.keys.length) * 100).toFixed(0) : 0}%)</span>
      `;
      listEl.appendChild(row);
    });
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const ringRadius = Math.min(w, h) * 0.38;

    ctx.clearRect(0, 0, w, h);

    // Draw Hash Ring (Circle 0 to 2^32 - 1)
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Center info
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0 / 2³² - 1 RING', centerX, centerY - 10);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('Consistent Hashing', centerX, centerY + 10);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText(`${this.nodes.length} Nodes (${this.ringPoints.length} Vnodes)`, centerX, centerY + 24);

    // Draw Vnodes & Physical Nodes
    this.ringPoints.forEach(point => {
      const px = centerX + Math.cos(point.angle - Math.PI / 2) * ringRadius;
      const py = centerY + Math.sin(point.angle - Math.PI / 2) * ringRadius;

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, point.isVnode ? 5 : 8, 0, Math.PI * 2);
      ctx.fillStyle = point.color;
      ctx.shadowColor = point.color;
      ctx.shadowBlur = point.isVnode ? 6 : 12;
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      if (!point.isVnode) {
        const textX = centerX + Math.cos(point.angle - Math.PI / 2) * (ringRadius + 22);
        const textY = centerY + Math.sin(point.angle - Math.PI / 2) * (ringRadius + 22);
        ctx.fillStyle = point.color;
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(point.nodeName, textX, textY);
      }
    });

    // Draw Keys on the ring
    this.keys.forEach(k => {
      const kx = centerX + Math.cos(k.angle - Math.PI / 2) * (ringRadius * 0.82);
      const ky = centerY + Math.sin(k.angle - Math.PI / 2) * (ringRadius * 0.82);

      ctx.beginPath();
      ctx.arc(kx, ky, 4, 0, Math.PI * 2);
      ctx.fillStyle = k.color || '#e2e8f0';
      ctx.fill();

      // Line to center or ring
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(kx, ky);
      const targetX = centerX + Math.cos(k.angle - Math.PI / 2) * ringRadius;
      const targetY = centerY + Math.sin(k.angle - Math.PI / 2) * ringRadius;
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
    });
  }
}
