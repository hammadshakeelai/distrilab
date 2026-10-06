# 🚀 DistriLab — Interactive Parallel & Distributed Computing Playground

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-06b6d4?style=for-the-badge&logo=github)](https://hammadshakeelai.github.io/distrilab/)
[![Deploy to GitHub Pages](https://github.com/hammadshakeelai/distrilab/actions/workflows/deploy.yml/badge.svg)](https://github.com/hammadshakeelai/distrilab/actions/workflows/deploy.yml)
[![Zero Backend](https://img.shields.io/badge/Architecture-100%25%20Client--Side-emerald.svg)](#)
[![Web Workers](https://img.shields.io/badge/Multi--Threading-Web%20Workers-cyan.svg)](#)

> **DistriLab** is an interactive, browser-based visual laboratory and sandbox covering the foundational principles of **Parallel and Distributed Computing**. From real client-side multi-core benchmarking and Amdahl's Law scaling to Raft consensus, Byzantine quorums, Dining Philosophers deadlocks, Consistent Hashing, and Vector Clocks — all running natively with zero build steps and live on **GitHub Pages**: **[https://hammadshakeelai.github.io/distrilab/](https://hammadshakeelai.github.io/distrilab/)**.

---

## 🌟 Interactive Modules Overview

| Module | Category | Key Concepts Covered |
| :--- | :--- | :--- |
| **⚡ Real Multi-Core Benchmark** | Parallel Computing | Web Workers, Monte Carlo $\pi$, Mandelbrot slicing, Dense Matrix Multiplication, Speedup $S_p = T_1 / T_p$, Parallel Efficiency |
| **📐 Amdahl vs Gustafson Law** | Theoretical Limits | Strong Scaling vs Weak Scaling, serial bottleneck asymptote $1 / (1-P)$, Karp-Flatt metric |
| **🏛️ Flynn's Taxonomy** | Computer Architecture | SISD, SIMD (GPUs/Vectors), MISD (Voting arrays), MIMD (Multicore/Clusters) animated pipelines |
| **🍝 Dining Philosophers & Deadlock** | Concurrency & Mutex | Edsger Dijkstra problem, Coffman 4 Conditions, live Resource Allocation Graph (RAG) circular-wait cycle detection |
| **🗳️ Raft Consensus Simulator** | Distributed Consensus | Leader Election, Heartbeats, AppendEntries RPC, Quorums $\lfloor N/2 \rfloor + 1$, Network Partition & Split-Brain healing |
| **🌐 Consistent Hashing Ring** | Distributed Storage | $0$ to $2^{32}-1$ ring, Virtual Nodes (vnodes), Dynamo/Cassandra replication, minimal key migration vs naive modulo |
| **📡 Gossip / Epidemic Protocol** | P2P Communication | Decentralized rumor spreading, Fanout $k$, packet loss tolerance, $O(\log N)$ logarithmic convergence S-curve |
| **⏱️ Lamport & Vector Clocks** | Logical Time & Ordering | Physical clock drift, Happens-Before ($\rightarrow$) partial order, interactive causality comparison ($A \rightarrow B$ vs $A \parallel B$) |
| **🏭 MapReduce Compute Pipeline** | Distributed Big Data | Dean & Ghemawat model: Input Splits $\to$ Map Workers $\to$ Hash Shuffle & Sort $\to$ Reduce Workers $\to$ Global Output |
| **📖 PDC Knowledge Atlas** | Encyclopedia & Reference | Comprehensive searchable glossary covering PACELC, CRDTs, False Sharing, 2PC, CAS lock-free, Cache Coherence |

---

## ⚡ Live Hardware Multi-Threading via Web Workers

Unlike toy mockups, **DistriLab executes real parallel threads** on your actual machine:
- Detects native physical/logical CPU threads via `navigator.hardwareConcurrency`.
- Dispatches independent computational chunks across dedicated `Worker` instances.
- Visualizes real load balancing and memory cache pressure:
  - **Monte Carlo $\pi$**: Embarrassingly parallel compute.
  - **Mandelbrot Fractal**: Demonstrates non-uniform computational density across pixel scanlines.
  - **Matrix Multiplication**: Demonstrates memory bus contention and cache access patterns.
- Automatically generates empirical Speedup ($S_p$) and Efficiency ($E_p$) curves compared against theoretical linear speedup ($S = p$).

---

## 🛠️ Instant Local Development

DistriLab is written with modern ES Modules and zero external compile dependencies. You can run it immediately with any static server:

### Option 1: Python HTTP Server (Built-in)
```bash
python -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 2: Node.js (npx serve)
```bash
npx serve .
```

### Option 3: VS Code Live Server
Simply right-click `index.html` and select **"Open with Live Server"**.

*(Note: Web Workers require an HTTP/HTTPS origin such as `localhost`, so running through a local static server is recommended over `file://` protocol due to browser CORS policies for workers).*

---

## 🚀 How to Deploy on GitHub Pages

Deploying DistriLab to GitHub Pages takes under 2 minutes:

### Method A: Automated GitHub Actions (Recommended)
1. Create a new repository on GitHub (e.g., `distrilab`).
2. Add your GitHub remote and push the code:
   ```bash
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   git branch -M master
   git push -u origin master
   ```
3. In your GitHub repository:
   - Navigate to **Settings** $\to$ **Pages**.
   - Under **Build and deployment** $\to$ **Source**, select **GitHub Actions**.
4. The included `.github/workflows/deploy.yml` workflow will automatically trigger, build the artifact, and publish your live site at `https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`!

### Method B: Deploy from Branch
1. Navigate to **Settings** $\to$ **Pages** in your GitHub repository.
2. Under **Build and deployment** $\to$ **Source**, select **Deploy from a branch**.
3. Choose branch **`master`** (or `main`) and folder **`/ (root)`**.
4. Click **Save**. Your site will be live within seconds!

---

## 📂 Project Structure

```text
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated GitHub Pages CI/CD workflow
├── css/
│   └── styles.css              # Dark laboratory theme & animations
├── js/
│   ├── app.js                  # Main coordinator & tab hash router
│   ├── workers/
│   │   └── benchmark-worker.js # Multi-threaded background Web Worker
│   └── modules/
│       ├── benchmarks.js       # Live CPU benchmark & speedup charts
│       ├── amdahl.js           # Amdahl vs Gustafson scaling models
│       ├── flynn.js            # Flynn's Taxonomy pipeline animator
│       ├── philosophers.js     # Dining Philosophers & RAG deadlock
│       ├── raft.js             # Raft consensus & network partition
│       ├── hashing.js          # Consistent hashing ring & vnodes
│       ├── gossip.js           # Gossip epidemic dissemination
│       ├── clocks.js           # Lamport & Vector Clocks evaluator
│       ├── mapreduce.js        # MapReduce interactive pipeline
│       └── atlas.js            # PDC searchable encyclopedia
├── index.html                  # Single-page application UI
├── .gitignore
└── README.md
```

---

## 📜 Theoretical Foundations Covered

- **Flynn's Taxonomy (1966)**: Classification of computer hardware according to instructions and data streams (SISD, SIMD, MISD, MIMD).
- **Amdahl's Law (1967)**: Speedup limitation on fixed problem sizes under strong scaling: $S(N) = \frac{1}{(1-P) + P/N}$.
- **Gustafson-Barsis's Law (1988)**: Scaled speedup on expanding problem sizes under weak scaling: $S(N) = N - (1-P)(N-1)$.
- **Coffman Conditions (1971)**: The 4 invariants required for deadlock: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.
- **Raft Consensus (2014)**: Diego Ongaro & John Ousterhout's understandable replicated state machine protocol with randomized election timers and $\lfloor N/2 \rfloor + 1$ majority quorum.
- **Consistent Hashing (1997)**: Karger et al. distributed hashing ensuring smooth $O(1/N)$ key redistribution across cache reconfigurations.
- **Lamport Timestamps & Vector Clocks (1978, 1988)**: Causal ordering in distributed systems without synchronized physical clocks.

---

## 📄 License

MIT License © 2026 DistriLab Contributors. Free and open source for educational and research use.
