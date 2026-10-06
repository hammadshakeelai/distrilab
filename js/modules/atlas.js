/**
 * Module: PDC Knowledge Atlas & Searchable Encyclopedia
 * Comprehensive reference covering everything in parallel and distributed computing.
 */

export class AtlasModule {
  constructor() {
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.items = [
      {
        id: 'cap-theorem',
        category: 'distributed',
        title: 'CAP Theorem (Brewer\'s Theorem)',
        tags: ['Distributed Systems', 'Trade-offs', 'Partition Tolerance'],
        summary: 'States that any distributed data store can simultaneously provide at most two out of three guarantees: Consistency (all nodes see the same data at the same time), Availability (every non-failing node returns a response), and Partition Tolerance (system continues operating despite arbitrary network dropped messages). Since network partitions are inevitable in physical networks, real-world systems must choose between CP (e.g. Raft, HBase) or AP (e.g. Cassandra, Dynamo).',
        formula: 'P is non-negotiable in real networks ⇒ Must choose C or A during partitions'
      },
      {
        id: 'pacelc',
        category: 'distributed',
        title: 'PACELC Theorem',
        tags: ['Distributed Systems', 'Latency', 'Consistency'],
        summary: 'An extension of the CAP theorem by Daniel Abadi. If there is a Partition (P), how does the system trade off Availability (A) and Consistency (C); Else (E), when the system runs normally, how does it trade off Latency (L) and Consistency (C)? Example: MongoDB is PC/EC; Cassandra is PA/EL.',
        formula: 'If (P) { A vs C } Else { L vs C }'
      },
      {
        id: 'raft-consensus',
        category: 'consensus',
        title: 'Raft Consensus Algorithm',
        tags: ['Consensus', 'Leader Election', 'Log Replication'],
        summary: 'A consensus algorithm designed by Ongaro & Ousterhout as an understandable alternative to Paxos. It decomposes consensus into Leader Election, Log Replication, and Safety. Nodes exist in one of three states: Follower, Candidate, or Leader. Commits require a majority quorum ⌊N/2⌋ + 1.',
        formula: 'Quorum = ⌊N/2⌋ + 1'
      },
      {
        id: 'paxos',
        category: 'consensus',
        title: 'Paxos Protocol',
        tags: ['Consensus', 'Fault Tolerance', 'Leslie Lamport'],
        summary: 'The foundational family of consensus protocols introduced by Leslie Lamport in 1998. Solves consensus in a network of unreliable processors using Proposers, Acceptors, and Learners across two phases: Phase 1 (Prepare / Promise) and Phase 2 (Accept / Accepted).',
        formula: 'Majority Quorum prevents dual conflicting values'
      },
      {
        id: 'amdahl-law',
        category: 'parallel',
        title: 'Amdahl\'s Law (Strong Scaling)',
        tags: ['Parallel Scaling', 'Performance', 'Limits'],
        summary: 'Models the theoretical maximum speedup achievable by parallelizing a task with fixed overall workload. Dictates that speedup is severely limited by the serial (non-parallelizable) fraction of the program. Even with infinite processors, speedup cannot exceed 1 / (1 - P).',
        formula: 'S(N) = 1 / ((1 - P) + P / N) | S_max = 1 / (1 - P)'
      },
      {
        id: 'gustafson-law',
        category: 'parallel',
        title: 'Gustafson-Barsis\'s Law (Weak Scaling)',
        tags: ['Parallel Scaling', 'Weak Scaling', 'HPC'],
        summary: 'Argues that in practice, as more computing power becomes available, scientists and engineers increase the problem size rather than keeping it constant. Under weak scaling, speedup grows linearly with processor count.',
        formula: 'S(N) = (1 - P) + P × N = N - (1 - P)(N - 1)'
      },
      {
        id: 'consistent-hashing',
        category: 'distributed',
        title: 'Consistent Hashing & Vnodes',
        tags: ['Distributed Storage', 'Dynamo', 'Load Balancing'],
        summary: 'A hashing technique where servers and keys are mapped to a circular keyspace (0 to 2³²-1). When servers are added or removed, only K/N keys are moved on average (avoiding the catastrophic 100% cache invalidation of naive modulo hashing). Virtual nodes (vnodes) evenly distribute load across heterogeneous physical hardware.',
        formula: 'Key reassignment fraction = 1 / N on node addition'
      },
      {
        id: 'byzantine-generals',
        category: 'consensus',
        title: 'Byzantine Fault Tolerance (BFT)',
        tags: ['Fault Tolerance', 'Security', 'Adversarial'],
        summary: 'Addresses consensus in the presence of arbitrary (Byzantine) failures, where nodes may lie, drop packets, or collude maliciously. Lamport, Shostak, and Pease proved that consensus requires at least 3f + 1 nodes to tolerate f Byzantine traitor nodes.',
        formula: 'N ≥ 3f + 1 total nodes required to tolerate f traitors'
      },
      {
        id: 'dining-philosophers',
        category: 'concurrency',
        title: 'Coffman Deadlock Conditions',
        tags: ['Concurrency', 'Operating Systems', 'Synchronization'],
        summary: 'Edward Coffman Jr. identified the four necessary and sufficient conditions for deadlock: 1) Mutual Exclusion (resources cannot be shared), 2) Hold and Wait (holding resources while requesting others), 3) No Preemption (resources cannot be forcibly taken), 4) Circular Wait (closed loop of processes waiting for each other). Eliminating any one condition prevents deadlock.',
        formula: 'Deadlock ⟺ Mutual Exclusion ∧ Hold & Wait ∧ No Preemption ∧ Circular Wait'
      },
      {
        id: 'crdt',
        category: 'distributed',
        title: 'CRDT (Conflict-free Replicated Data Types)',
        tags: ['Distributed Data', 'Eventual Consistency', 'Collaboration'],
        summary: 'Data structures that can be replicated across multiple nodes over an unreliable network, updated independently and concurrently without coordination, and guaranteed to mathematically converge to the same state via join-semilattice properties (associative, commutative, idempotent merge operations). Used in Figma, Apple Notes, and Riak.',
        formula: 'Merge operation ⊔ is Associative, Commutative, Idempotent'
      },
      {
        id: 'vector-clocks',
        category: 'distributed',
        title: 'Vector Clocks & Causality',
        tags: ['Logical Time', 'Event Ordering', 'Causality'],
        summary: 'An algorithm for generating a partial ordering of events in a distributed system and detecting causality violations. Unlike Lamport clocks which cannot distinguish concurrent events from causally dependent ones, Vector Clocks allow exact determination of whether event A happened before event B or if they are concurrent (A ∥ B).',
        formula: 'A → B ⟺ ∀k V(A)[k] ≤ V(B)[k] ∧ ∃k V(A)[k] < V(B)[k]'
      },
      {
        id: 'false-sharing',
        category: 'parallel',
        title: 'False Sharing & Cache Coherence',
        tags: ['Multi-threading', 'CPU Cache', 'Performance Pitfall'],
        summary: 'A performance degradation that occurs when multiple CPU cores modify independent variables that reside within the same hardware cache line (typically 64 bytes). The cache coherence protocol (e.g. MESI) forces repeated invalidation of the entire cache line across CPU sockets, causing silent bus thrashing.',
        formula: 'Prevent via memory padding / alignas(64)'
      },
      {
        id: 'lock-free-cas',
        category: 'concurrency',
        title: 'Lock-Free & Compare-And-Swap (CAS)',
        tags: ['Non-blocking', 'Hardware Primitives', 'Atomicity'],
        summary: 'Hardware-supported atomic operations (e.g. CMPXCHG on x86) that conditionally update a memory location only if it matches an expected value. Forms the foundation of lock-free stacks (Treiber stack), queues (Michael-Scott queue), and non-blocking algorithms that avoid thread contention and deadlock.',
        formula: 'CAS(ptr, expected, new_val) → bool (Atomic)'
      },
      {
        id: 'mapreduce-spark',
        category: 'bigdata',
        title: 'MapReduce & Spark DAG Execution',
        tags: ['Big Data', 'Distributed Compute', 'Fault Tolerance'],
        summary: 'Software frameworks for processing massive datasets across commodity clusters. MapReduce uses sequential Map -> Shuffle -> Reduce disk barriers. Apache Spark improves performance by 10-100x through in-memory Resilient Distributed Datasets (RDDs) and lazy Directed Acyclic Graph (DAG) query optimization.',
        formula: 'Transformation (Lazy DAG) → Action (Execution)'
      },
      {
        id: 'mpi-vs-openmp',
        category: 'parallel',
        title: 'MPI vs OpenMP (Hybrid HPC Model)',
        tags: ['High-Performance Computing', 'HPC', 'Supercomputing'],
        summary: 'OpenMP provides multi-threaded shared-memory parallelism using compiler directives on a single node. MPI (Message Passing Interface) provides distributed-memory communication across cluster nodes via explicit network messaging. Modern supercomputing uses hybrid MPI+OpenMP (MPI across nodes, OpenMP across socket cores).',
        formula: 'HPC Stack: MPI (Inter-node network) + OpenMP/CUDA (Intra-node accelerators)'
      },
      {
        id: 'two-phase-commit',
        category: 'distributed',
        title: 'Two-Phase Commit (2PC) Protocol',
        tags: ['Distributed Transactions', 'ACID', 'Atomicity'],
        summary: 'An atomic commitment protocol for distributed databases. A Coordinator coordinates Cohorts across Phase 1 (Prepare: can you commit?) and Phase 2 (Commit or Abort). A major limitation is that 2PC is a blocking protocol: if the coordinator crashes while holding locks, cohorts remain indefinitely blocked.',
        formula: 'Unanimous YES in Prepare ⟹ Global Commit; Else ⟹ Global Abort'
      }
    ];
  }

  init() {
    this.bindEvents();
    this.renderAtlas();
  }

  bindEvents() {
    const searchInput = document.getElementById('atlas-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderAtlas();
      });
    }

    document.querySelectorAll('.atlas-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.atlas-filter-btn').forEach(b => b.classList.remove('active', 'border-cyan-500', 'text-cyan-400', 'bg-cyan-950/40'));
        e.currentTarget.classList.add('active', 'border-cyan-500', 'text-cyan-400', 'bg-cyan-950/40');
        this.activeCategory = e.currentTarget.dataset.cat;
        this.renderAtlas();
      });
    });
  }

  renderAtlas() {
    const container = document.getElementById('atlas-cards-grid');
    if (!container) return;

    const filtered = this.items.filter(item => {
      const matchesCat = this.activeCategory === 'all' || item.category === this.activeCategory;
      const matchesQuery = !this.searchQuery ||
        item.title.toLowerCase().includes(this.searchQuery) ||
        item.summary.toLowerCase().includes(this.searchQuery) ||
        item.tags.some(t => t.toLowerCase().includes(this.searchQuery));
      return matchesCat && matchesQuery;
    });

    container.innerHTML = '';
    if (filtered.length === 0) {
      container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500 font-mono">No matching parallel or distributed concepts found for "${this.searchQuery}".</div>`;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'glass-panel p-5 flex flex-col justify-between hover:border-cyan-500/50 transition-all';
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-xs font-mono uppercase tracking-wider text-cyan-400">${item.category}</span>
            <div class="flex gap-1 flex-wrap">
              ${item.tags.map(t => `<span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">${t}</span>`).join('')}
            </div>
          </div>
          <h3 class="text-base font-bold text-slate-100 mb-2">${item.title}</h3>
          <p class="text-xs text-slate-300 leading-relaxed mb-4">${item.summary}</p>
        </div>
        ${item.formula ? `
          <div class="mt-2 p-2 rounded bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-amber-300">
            ${item.formula}
          </div>
        ` : ''}
      `;
      container.appendChild(card);
    });
  }
}
