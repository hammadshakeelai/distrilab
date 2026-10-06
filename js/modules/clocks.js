/**
 * Module: Lamport Logical Clocks & Vector Clocks
 * Demonstrates distributed causality, happens-before relation, and concurrency detection.
 */

export class ClocksModule {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.processes = [
      { id: 0, name: 'Process 1 (P1)', vector: [0, 0, 0], lamport: 0 },
      { id: 1, name: 'Process 2 (P2)', vector: [0, 0, 0], lamport: 0 },
      { id: 2, name: 'Process 3 (P3)', vector: [0, 0, 0], lamport: 0 }
    ];
    this.events = []; // { id, procId, x, lamport, vector: [], label }
    this.messages = []; // { fromEventId, toEventId }
    this.selectedEventA = null;
    this.selectedEventB = null;
  }

  init() {
    this.canvas = document.getElementById('clocks-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());

      this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    this.bindEvents();
    this.resetDemo();
    this.draw();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 750;
    this.canvas.height = 360;
    this.draw();
  }

  resetDemo() {
    this.processes.forEach(p => {
      p.vector = [0, 0, 0];
      p.lamport = 0;
    });
    this.events = [];
    this.messages = [];
    this.selectedEventA = null;
    this.selectedEventB = null;

    // Build initial sequence
    this.addLocalEvent(0); // e1 on P1
    this.addLocalEvent(1); // e2 on P2
    this.sendMessage(0, 1); // P1 sends to P2
    this.addLocalEvent(2); // e4 on P3
    this.sendMessage(1, 2); // P2 sends to P3
    this.updateCausalityUI();
  }

  bindEvents() {
    document.querySelectorAll('.add-local-event-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const procId = parseInt(e.currentTarget.dataset.proc, 10);
        this.addLocalEvent(procId);
        this.draw();
      });
    });

    const sendP1P2 = document.getElementById('clock-send-p1-p2');
    if (sendP1P2) sendP1P2.addEventListener('click', () => { this.sendMessage(0, 1); this.draw(); });

    const sendP2P3 = document.getElementById('clock-send-p2-p3');
    if (sendP2P3) sendP2P3.addEventListener('click', () => { this.sendMessage(1, 2); this.draw(); });

    const sendP3P1 = document.getElementById('clock-send-p3-p1');
    if (sendP3P1) sendP3P1.addEventListener('click', () => { this.sendMessage(2, 0); this.draw(); });

    const resetBtn = document.getElementById('clocks-reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', () => { this.resetDemo(); this.draw(); });
  }

  getNextX() {
    const margin = 100;
    const lastX = this.events.length > 0 ? Math.max(...this.events.map(e => e.x)) : margin;
    return Math.min(this.canvas.width - 50, lastX + 65);
  }

  addLocalEvent(procId) {
    if (this.events.length >= 12) return;
    const p = this.processes[procId];
    p.lamport += 1;
    p.vector[procId] += 1;

    const event = {
      id: this.events.length + 1,
      procId,
      x: this.getNextX(),
      lamport: p.lamport,
      vector: [...p.vector],
      label: `e${this.events.length + 1}`
    };

    this.events.push(event);
  }

  sendMessage(fromProcId, toProcId) {
    if (this.events.length >= 11) return;
    const sender = this.processes[fromProcId];
    sender.lamport += 1;
    sender.vector[fromProcId] += 1;

    const sendEvent = {
      id: this.events.length + 1,
      procId: fromProcId,
      x: this.getNextX(),
      lamport: sender.lamport,
      vector: [...sender.vector],
      label: `send(${sendEventIdToLetter(fromProcId, toProcId)})`
    };
    this.events.push(sendEvent);

    // Receiver event
    const receiver = this.processes[toProcId];
    receiver.lamport = Math.max(receiver.lamport, sender.lamport) + 1;
    for (let k = 0; k < 3; k++) {
      receiver.vector[k] = Math.max(receiver.vector[k], sender.vector[k]);
    }
    receiver.vector[toProcId] += 1;

    const recvEvent = {
      id: this.events.length + 1,
      procId: toProcId,
      x: this.getNextX() + 45,
      lamport: receiver.lamport,
      vector: [...receiver.vector],
      label: `recv`
    };
    this.events.push(recvEvent);

    this.messages.push({
      fromId: sendEvent.id,
      toId: recvEvent.id
    });
  }

  handleCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicked near an event
    const found = this.events.find(ev => {
      const y = this.getYForProc(ev.procId);
      const dist = Math.hypot(clickX - ev.x, clickY - y);
      return dist <= 18;
    });

    if (found) {
      if (!this.selectedEventA) {
        this.selectedEventA = found;
      } else if (!this.selectedEventB && found.id !== this.selectedEventA.id) {
        this.selectedEventB = found;
      } else {
        this.selectedEventA = found;
        this.selectedEventB = null;
      }
      this.updateCausalityUI();
      this.draw();
    }
  }

  getYForProc(procId) {
    const h = this.canvas.height;
    return (procId + 1) * (h / 4);
  }

  compareVectorClocks(vA, vB) {
    let lessOrEqual = true;
    let strictlyLess = false;
    for (let i = 0; i < vA.length; i++) {
      if (vA[i] > vB[i]) lessOrEqual = false;
      if (vA[i] < vB[i]) strictlyLess = true;
    }
    return lessOrEqual && strictlyLess;
  }

  updateCausalityUI() {
    const detailEl = document.getElementById('clock-causality-detail');
    if (!detailEl) return;

    if (!this.selectedEventA || !this.selectedEventB) {
      detailEl.textContent = 'Click any two event dots on the timelines to evaluate their causal relationship (Happens-Before vs Concurrent).';
      return;
    }

    const A = this.selectedEventA;
    const B = this.selectedEventB;
    const aBeforeB = this.compareVectorClocks(A.vector, B.vector);
    const bBeforeA = this.compareVectorClocks(B.vector, A.vector);

    let result = '';
    if (aBeforeB) {
      result = `🟢 Event e${A.id} Happened-Before e${B.id} (e${A.id} → e${B.id}). There is a causal link from e${A.id} to e${B.id}.`;
    } else if (bBeforeA) {
      result = `🟢 Event e${B.id} Happened-Before e${A.id} (e${B.id} → e${A.id}). There is a causal link from e${B.id} to e${A.id}.`;
    } else {
      result = `⚡ CONCURRENT EVENTS (e${A.id} ∥ e${B.id})! Neither event could causally influence the other.`;
    }

    detailEl.innerHTML = `
      <div class="font-bold text-cyan-400 mb-1">Comparing Event e${A.id} and Event e${B.id}:</div>
      <div>e${A.id} Vector: <span class="text-amber-300 font-mono">[${A.vector.join(',')}]</span> (Lamport: ${A.lamport})</div>
      <div>e${B.id} Vector: <span class="text-amber-300 font-mono">[${B.vector.join(',')}]</span> (Lamport: ${B.lamport})</div>
      <div class="mt-2 text-sm">${result}</div>
    `;
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw horizontal timelines
    for (let i = 0; i < 3; i++) {
      const y = this.getYForProc(i);
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();

      // Process Label
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`P${i + 1}`, 20, y + 4);
    }

    // Draw message arrows
    this.messages.forEach(msg => {
      const eFrom = this.events.find(e => e.id === msg.fromId);
      const eTo = this.events.find(e => e.id === msg.toId);
      if (!eFrom || !eTo) return;

      const yFrom = this.getYForProc(eFrom.procId);
      const yTo = this.getYForProc(eTo.procId);

      ctx.save();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(eFrom.x, yFrom);
      ctx.lineTo(eTo.x, yTo);
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(yTo - yFrom, eTo.x - eFrom.x);
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(eTo.x, yTo);
      ctx.lineTo(eTo.x - 10 * Math.cos(angle - Math.PI / 6), eTo.y - 10 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(eTo.x - 10 * Math.cos(angle + Math.PI / 6), eTo.y - 10 * Math.sin(angle + Math.PI / 6));
      ctx.fill();
      ctx.restore();
    });

    // Draw events
    this.events.forEach(ev => {
      const y = this.getYForProc(ev.procId);
      const isA = this.selectedEventA && this.selectedEventA.id === ev.id;
      const isB = this.selectedEventB && this.selectedEventB.id === ev.id;

      let color = '#3b82f6';
      if (isA) color = '#f59e0b';
      if (isB) color = '#10b981';

      ctx.save();
      ctx.beginPath();
      ctx.arc(ev.x, y, 9, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = (isA || isB) ? 14 : 6;
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Labels: Vector & Lamport
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`e${ev.id}`, ev.x, y - 14);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`L:${ev.lamport}`, ev.x, y + 20);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(`[${ev.vector.join(',')}]`, ev.x, y + 31);
    });
  }
}

function sendEventIdToLetter(from, to) {
  return `P${from + 1}→P${to + 1}`;
}
