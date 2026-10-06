/**
 * Module: Raft Consensus & Network Partition Visualizer
 * Simulates leader elections, heartbeats, log replication quorums, and split-brain resolution.
 */

export class RaftModule {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    this.nodes = [];
    this.messages = []; // in-flight network RPC packets
    this.currentTerm = 1;
    this.partitionActive = false;
    this.partitionGroups = [[0, 1], [2, 3, 4]]; // Group A (minority 2), Group B (majority 3)
    this.logHistory = [];
    this.isRunning = true;
  }

  init() {
    this.canvas = document.getElementById('raft-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }

    this.initCluster();
    this.bindEvents();
    this.startLoop();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 750;
    this.canvas.height = 460;
  }

  initCluster() {
    this.nodes = [];
    this.messages = [];
    this.currentTerm = 1;
    this.partitionActive = false;

    const names = ['Node 1', 'Node 2', 'Node 3', 'Node 4', 'Node 5'];
    for (let i = 0; i < 5; i++) {
      this.nodes.push({
        id: i,
        name: names[i],
        role: i === 0 ? 'leader' : 'follower',
        term: 1,
        votedFor: null,
        votesReceived: 0,
        electionTimeout: Math.random() * 250 + 200, // ms
        electionTimer: 0,
        heartbeatTimer: 0,
        log: [{ term: 1, cmd: 'INIT', committed: true }],
        alive: true,
        partitionGroup: i < 2 ? 0 : 1
      });
    }

    this.updateUI();
  }

  bindEvents() {
    const replicateBtn = document.getElementById('raft-send-cmd');
    const cmdInput = document.getElementById('raft-cmd-input');
    if (replicateBtn) {
      replicateBtn.addEventListener('click', () => {
        const cmd = (cmdInput?.value || 'SET x = ' + Math.floor(Math.random() * 100)).trim();
        this.submitClientCommand(cmd);
      });
    }

    const partitionBtn = document.getElementById('raft-toggle-partition');
    if (partitionBtn) {
      partitionBtn.addEventListener('click', () => this.togglePartition());
    }

    const killLeaderBtn = document.getElementById('raft-kill-leader');
    if (killLeaderBtn) {
      killLeaderBtn.addEventListener('click', () => this.killCurrentLeader());
    }

    const reviveBtn = document.getElementById('raft-revive-nodes');
    if (reviveBtn) {
      reviveBtn.addEventListener('click', () => this.reviveAllNodes());
    }

    const resetBtn = document.getElementById('raft-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.initCluster());
    }
  }

  reviveAllNodes() {
    let count = 0;
    this.nodes.forEach(n => {
      if (!n.alive) {
        n.alive = true;
        n.role = 'follower';
        n.electionTimer = 0;
        count++;
      }
    });
    this.logEvent(`💚 Revived ${count} crashed node(s). Normal election cycles restored.`);
    this.updateUI();
  }

  submitClientCommand(cmd) {
    const leaders = this.nodes.filter(n => n.role === 'leader' && n.alive);
    if (leaders.length === 0) {
      this.logEvent('⚠️ Client write failed: No active leader in cluster! Waiting for leader election.');
      return;
    }

    // Submit to active leader(s) - in a partition, this tests both minority & majority groups
    leaders.forEach(leader => {
      const entry = { term: leader.term, cmd, committed: false, acks: [leader.id] };
      leader.log.push(entry);
      const grpTag = this.partitionActive ? (leader.partitionGroup === 0 ? ' [Minority Group A]' : ' [Majority Group B]') : '';
      this.logEvent(`Client write "${cmd}" sent to ${leader.name}${grpTag} (Term ${leader.term})`);

      // Broadcast AppendEntries to reachable followers
      this.broadcastAppendEntries(leader, entry);
    });
    this.updateUI();
  }

  broadcastAppendEntries(leader, entry) {
    this.nodes.forEach(peer => {
      if (peer.id === leader.id || !peer.alive) return;
      if (this.partitionActive && peer.partitionGroup !== leader.partitionGroup) {
        // Dropped due to network partition
        return;
      }

      this.messages.push({
        from: leader.id,
        to: peer.id,
        type: 'AppendEntries',
        term: leader.term,
        entry: entry,
        progress: 0,
        speed: 0.04
      });
    });
  }

  togglePartition() {
    this.partitionActive = !this.partitionActive;
    const btn = document.getElementById('raft-toggle-partition');
    const indicator = document.getElementById('raft-partition-status');

    if (this.partitionActive) {
      if (btn) btn.textContent = 'Heal Network Partition';
      if (indicator) {
        indicator.textContent = 'NETWORK PARTITIONED: Group A {N1,N2} vs Group B {N3,N4,N5}';
        indicator.className = 'text-amber-400 font-bold';
      }
      this.logEvent('⚠️ Network partition created: [Nodes 1,2] disconnected from [Nodes 3,4,5]!');
    } else {
      if (btn) btn.textContent = 'Split Network (Partition)';
      if (indicator) {
        indicator.textContent = 'Network Healthy (Fully Connected Quorum)';
        indicator.className = 'text-emerald-400 font-semibold';
      }
      this.logEvent('✅ Network healed! Resynchronizing logs to highest committed term...');
      this.reconcileLogs();
    }
    this.updateUI();
  }

  killCurrentLeader() {
    const leader = this.nodes.find(n => n.role === 'leader' && n.alive);
    if (leader) {
      leader.alive = false;
      this.logEvent(`💥 ${leader.name} was crashed/killed! Followers will trigger election.`);
      this.updateUI();
    }
  }

  reconcileLogs() {
    // Find leader with highest term
    const highestTermLeader = this.nodes.find(n => n.role === 'leader' && n.alive);
    if (!highestTermLeader) return;

    this.nodes.forEach(node => {
      if (node.role === 'leader' && node.id !== highestTermLeader.id) {
        node.role = 'follower';
        this.logEvent(`Stale leader ${node.name} stepped down to follower.`);
      }
      if (node.alive) {
        // Overwrite uncommitted entries with canonical leader log
        node.log = highestTermLeader.log.map(e => ({ ...e, committed: true }));
      }
    });
  }

  startLoop() {
    let lastTime = performance.now();
    const loop = (time) => {
      const dt = (time - lastTime);
      lastTime = time;

      if (this.isRunning) {
        this.updateCluster(dt);
      }
      this.draw();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  updateCluster(dt) {
    // Update RPC messages
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      msg.progress += msg.speed;

      if (msg.progress >= 1.0) {
        this.deliverMessage(msg);
        this.messages.splice(i, 1);
      }
    }

    // Node state transitions
    this.nodes.forEach(node => {
      if (!node.alive) return;

      if (node.role === 'leader') {
        node.heartbeatTimer += dt;
        if (node.heartbeatTimer >= 120) {
          node.heartbeatTimer = 0;
          this.sendHeartbeats(node);
        }
      } else {
        node.electionTimer += dt;
        if (node.electionTimer >= node.electionTimeout) {
          this.startElection(node);
        }
      }
    });
  }

  sendHeartbeats(leader) {
    this.nodes.forEach(peer => {
      if (peer.id === leader.id || !peer.alive) return;
      if (this.partitionActive && peer.partitionGroup !== leader.partitionGroup) return;

      this.messages.push({
        from: leader.id,
        to: peer.id,
        type: 'Heartbeat',
        term: leader.term,
        progress: 0,
        speed: 0.05
      });
    });
  }

  startElection(candidate) {
    candidate.role = 'candidate';
    candidate.term++;
    this.currentTerm = Math.max(this.currentTerm, candidate.term);
    candidate.votedFor = candidate.id;
    candidate.votesReceived = 1; // votes for self
    candidate.electionTimer = 0;
    candidate.electionTimeout = Math.random() * 250 + 200;

    this.logEvent(`🗳️ ${candidate.name} timed out. Starting Election for Term ${candidate.term}`);

    // Request votes from peers
    this.nodes.forEach(peer => {
      if (peer.id === candidate.id || !peer.alive) return;
      if (this.partitionActive && peer.partitionGroup !== candidate.partitionGroup) return;

      this.messages.push({
        from: candidate.id,
        to: peer.id,
        type: 'RequestVote',
        term: candidate.term,
        progress: 0,
        speed: 0.04
      });
    });
  }

  deliverMessage(msg) {
    const receiver = this.nodes[msg.to];
    const sender = this.nodes[msg.from];
    if (!receiver.alive) return;

    if (msg.type === 'Heartbeat') {
      if (msg.term >= receiver.term) {
        receiver.role = 'follower';
        receiver.term = msg.term;
        receiver.electionTimer = 0; // reset election timer
      }
    } else if (msg.type === 'RequestVote') {
      if (msg.term > receiver.term || (msg.term === receiver.term && receiver.votedFor === null)) {
        receiver.term = msg.term;
        receiver.votedFor = msg.from;
        receiver.electionTimer = 0;
        receiver.role = 'follower';

        // Grant vote
        this.messages.push({
          from: receiver.id,
          to: msg.from,
          type: 'VoteGranted',
          term: msg.term,
          progress: 0,
          speed: 0.04
        });
      }
    } else if (msg.type === 'VoteGranted') {
      if (receiver.role === 'candidate' && msg.term === receiver.term) {
        receiver.votesReceived++;
        // Check for Quorum (majority: 3 out of 5)
        if (receiver.votesReceived >= 3) {
          receiver.role = 'leader';
          this.logEvent(`👑 ${receiver.name} achieved majority quorum (${receiver.votesReceived}/5 votes)! Elected LEADER for Term ${receiver.term}`);
          this.updateUI();
        }
      }
    } else if (msg.type === 'AppendEntries') {
      if (msg.term >= receiver.term) {
        receiver.role = 'follower';
        receiver.term = msg.term;
        receiver.electionTimer = 0;

        // Append entry
        if (msg.entry) {
          const hasEntry = receiver.log.some(e => e.cmd === msg.entry.cmd && e.term === msg.entry.term);
          if (!hasEntry) {
            receiver.log.push({ ...msg.entry });
          }

          // Reply Ack
          this.messages.push({
            from: receiver.id,
            to: msg.from,
            type: 'AppendAck',
            term: msg.term,
            entryCmd: msg.entry.cmd,
            progress: 0,
            speed: 0.05
          });
        }
      }
    } else if (msg.type === 'AppendAck') {
      if (receiver.role === 'leader') {
        const logEntry = receiver.log.find(e => e.cmd === msg.entryCmd && e.term === msg.term);
        if (logEntry && !logEntry.committed) {
          if (!logEntry.acks.includes(msg.from)) {
            logEntry.acks.push(msg.from);
          }

          // Quorum check (>= 3 acks)
          if (logEntry.acks.length >= 3) {
            logEntry.committed = true;
            this.logEvent(`✅ Committing "${logEntry.cmd}"! Quorum of ${logEntry.acks.length}/5 nodes confirmed write.`);
            this.updateUI();
          }
        }
      }
    }
  }

  logEvent(text) {
    const container = document.getElementById('raft-event-log');
    if (!container) return;
    const item = document.createElement('div');
    item.className = 'text-[11px] font-mono text-slate-300 border-b border-slate-800/80 py-1';
    item.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    container.prepend(item);
    if (container.children.length > 25) {
      container.lastChild.remove();
    }
  }

  updateUI() {
    const leaderCount = this.nodes.filter(n => n.role === 'leader' && n.alive).length;
    const activeLeader = this.nodes.find(n => n.role === 'leader' && n.alive);
    const leaderBadge = document.getElementById('raft-current-leader');
    if (leaderBadge) {
      leaderBadge.textContent = activeLeader ? `${activeLeader.name} (Term ${activeLeader.term})` : 'NO LEADER';
      leaderBadge.className = activeLeader ? 'text-cyan-400 font-bold' : 'text-rose-400 font-bold';
    }

    const quorumBadge = document.getElementById('raft-quorum-status');
    if (quorumBadge) {
      quorumBadge.textContent = this.partitionActive ? 'Split: 2 Nodes vs 3 Nodes' : '3 / 5 Majority Quorum Healthy';
    }
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) * 0.38;

    ctx.clearRect(0, 0, w, h);

    // Draw partition barrier line if partitioned
    if (this.partitionActive) {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(centerX - 40, 20);
      ctx.lineTo(centerX - 40, h - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NETWORK PARTITION WALL (ISOLATION)', centerX - 40, 30);
    }

    // Node positions (Circle arrangement)
    const nodeCoords = [];
    for (let i = 0; i < 5; i++) {
      let x, y;
      if (this.partitionActive) {
        // Position visually separated: Nodes 0,1 on left; 2,3,4 on right
        if (i < 2) {
          x = w * 0.22;
          y = h * 0.35 + i * 140;
        } else {
          x = w * 0.75;
          y = h * 0.22 + (i - 2) * 110;
        }
      } else {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }
      nodeCoords.push({ x, y });
    }

    // Draw network links
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        if (this.partitionActive && this.nodes[i].partitionGroup !== this.nodes[j].partitionGroup) {
          continue; // severed connection
        }
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nodeCoords[i].x, nodeCoords[i].y);
        ctx.lineTo(nodeCoords[j].x, nodeCoords[j].y);
        ctx.stroke();
      }
    }

    // Draw in-flight network messages
    this.messages.forEach(msg => {
      const start = nodeCoords[msg.from];
      const end = nodeCoords[msg.to];
      const curX = start.x + (end.x - start.x) * msg.progress;
      const curY = start.y + (end.y - start.y) * msg.progress;

      let color = '#38bdf8';
      if (msg.type === 'Heartbeat') color = '#10b981';
      else if (msg.type === 'RequestVote') color = '#f59e0b';
      else if (msg.type === 'VoteGranted') color = '#a855f7';
      else if (msg.type === 'AppendEntries') color = '#06b6d4';

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(curX, curY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Nodes
    for (let i = 0; i < 5; i++) {
      const node = this.nodes[i];
      const pos = nodeCoords[i];

      let borderColor = '#64748b';
      let roleLabel = 'Follower';
      if (!node.alive) {
        borderColor = '#f43f5e';
        roleLabel = 'CRASHED';
      } else if (node.role === 'leader') {
        borderColor = '#06b6d4';
        roleLabel = 'LEADER 👑';
      } else if (node.role === 'candidate') {
        borderColor = '#f59e0b';
        roleLabel = 'CANDIDATE';
      }

      ctx.save();
      if (node.role === 'leader') {
        ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
        ctx.shadowBlur = 16;
      }

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 34, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = node.role === 'leader' ? 3.5 : 2;
      ctx.stroke();
      ctx.restore();

      // Node text
      ctx.fillStyle = node.alive ? '#f8fafc' : '#f43f5e';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, pos.x, pos.y - 8);

      ctx.fillStyle = borderColor;
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(roleLabel, pos.x, pos.y + 6);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(`Term ${node.term} | Log: ${node.log.length}`, pos.x, pos.y + 18);
    }
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
    this.pause();
  }
}
