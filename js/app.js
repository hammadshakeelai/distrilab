/**
 * DistriLab - Main Application Entrypoint & State Router
 */

import { BenchmarkModule } from './modules/benchmarks.js';
import { AmdahlModule } from './modules/amdahl.js';
import { FlynnModule } from './modules/flynn.js';
import { PhilosophersModule } from './modules/philosophers.js';
import { RaftModule } from './modules/raft.js';
import { ConsistentHashingModule } from './modules/hashing.js';
import { GossipModule } from './modules/gossip.js';
import { ClocksModule } from './modules/clocks.js';
import { MapReduceModule } from './modules/mapreduce.js';
import { AtlasModule } from './modules/atlas.js';

class App {
  constructor() {
    this.modules = {};
    this.activeTab = 'benchmarks';
  }

  init() {
    this.detectHardware();
    this.initModules();
    this.bindNavigation();
    this.handleInitialRoute();
  }

  detectHardware() {
    const cores = navigator.hardwareConcurrency || 'Unknown';
    const hwBadge = document.getElementById('hw-concurrency-badge');
    if (hwBadge) {
      hwBadge.textContent = `${cores} Hardware Threads`;
    }

    const archBadge = document.getElementById('device-arch-badge');
    if (archBadge) {
      archBadge.textContent = navigator.userAgentData?.platform || navigator.platform || 'Client Host';
    }
  }

  initModules() {
    this.modules.benchmarks = new BenchmarkModule();
    this.modules.amdahl = new AmdahlModule();
    this.modules.flynn = new FlynnModule();
    this.modules.philosophers = new PhilosophersModule();
    this.modules.raft = new RaftModule();
    this.modules.hashing = new ConsistentHashingModule();
    this.modules.gossip = new GossipModule();
    this.modules.clocks = new ClocksModule();
    this.modules.mapreduce = new MapReduceModule();
    this.modules.atlas = new AtlasModule();

    // Initialize all modules
    Object.values(this.modules).forEach(m => {
      if (typeof m.init === 'function') {
        try {
          m.init();
        } catch (e) {
          console.error('Error initializing module:', e);
        }
      }
    });
  }

  bindNavigation() {
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
        window.location.hash = tab;
      });
    });

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== this.activeTab) {
        this.switchTab(hash);
      }
    });
  }

  handleInitialRoute() {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`tab-${hash}`)) {
      this.switchTab(hash);
    } else {
      this.switchTab('benchmarks');
    }
  }

  switchTab(tabId) {
    if (!document.getElementById(`tab-${tabId}`)) return;
    this.activeTab = tabId;

    // Update nav buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update section visibility
    document.querySelectorAll('.module-section').forEach(sec => {
      if (sec.id === `tab-${tabId}`) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    // Trigger canvas resize & chart redraw if necessary
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.distriLabApp = app;
});
