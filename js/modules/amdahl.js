/**
 * Module: Amdahl's Law vs Gustafson's Law Scaling Visualizer
 * Analyzes strong scaling limits vs weak scaling expansion in parallel computing.
 */

export class AmdahlModule {
  constructor() {
    this.chart = null;
    this.parallelFraction = 0.90; // 90% parallel
    this.maxProcessors = 128;
    this.selectedN = 16;
  }

  init() {
    this.setupChart();
    this.bindEvents();
    this.updateCalculations();
  }

  bindEvents() {
    const fractionSlider = document.getElementById('amdahl-fraction-slider');
    const fractionNum = document.getElementById('amdahl-fraction-val');
    const nSlider = document.getElementById('amdahl-n-slider');
    const nVal = document.getElementById('amdahl-n-val');
    const rangeSelect = document.getElementById('amdahl-range-select');

    if (fractionSlider && fractionNum) {
      fractionSlider.addEventListener('input', (e) => {
        this.parallelFraction = parseFloat(e.target.value);
        fractionNum.textContent = `${(this.parallelFraction * 100).toFixed(1)}%`;
        this.updateCalculations();
      });
    }

    if (nSlider && nVal) {
      nSlider.addEventListener('input', (e) => {
        this.selectedN = parseInt(e.target.value, 10);
        nVal.textContent = `${this.selectedN} Cores`;
        this.updateCalculations();
      });
    }

    if (rangeSelect) {
      rangeSelect.addEventListener('change', (e) => {
        this.maxProcessors = parseInt(e.target.value, 10);
        if (nSlider) {
          nSlider.max = this.maxProcessors;
          if (this.selectedN > this.maxProcessors) {
            this.selectedN = this.maxProcessors;
            if (nVal) nVal.textContent = `${this.selectedN} Cores`;
          }
        }
        this.updateCalculations();
      });
    }

    // Quick presets
    document.querySelectorAll('.preset-p-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = parseFloat(e.target.dataset.value);
        this.parallelFraction = val;
        if (fractionSlider) fractionSlider.value = val;
        if (fractionNum) fractionNum.textContent = `${(val * 100).toFixed(1)}%`;
        this.updateCalculations();
      });
    });
  }

  setupChart() {
    const ctx = document.getElementById('amdahl-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: "Amdahl's Law (Strong Scaling)",
            data: [],
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.2,
            pointRadius: 0
          },
          {
            label: "Gustafson's Law (Weak Scaling)",
            data: [],
            borderColor: '#a855f7',
            borderWidth: 2.5,
            fill: false,
            tension: 0,
            pointRadius: 0
          },
          {
            label: 'Linear Ideal (S = N)',
            data: [],
            borderColor: '#10b981',
            borderDash: [4, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Amdahl Asymptotic Ceiling',
            data: [],
            borderColor: '#f43f5e',
            borderDash: [6, 6],
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            title: { display: true, text: 'Processors / Cores (N)', color: '#94a3b8' },
            grid: { color: 'rgba(51, 65, 85, 0.4)' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            title: { display: true, text: 'Speedup Factor S(N)', color: '#94a3b8' },
            grid: { color: 'rgba(51, 65, 85, 0.4)' },
            ticks: { color: '#94a3b8' },
            beginAtZero: true
          }
        },
        plugins: {
          legend: { labels: { color: '#cbd5e1' } },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#38bdf8',
            borderWidth: 1
          }
        }
      }
    });
  }

  updateCalculations() {
    const P = this.parallelFraction;
    const S_seq = 1 - P; // serial portion
    const N = this.selectedN;

    // Amdahl speedup at N: S = 1 / ((1 - P) + P / N)
    const amdahlAtN = 1 / (S_seq + P / N);

    // Amdahl theoretical ceiling as N -> infinity: 1 / (1 - P)
    const amdahlMax = S_seq > 0 ? (1 / S_seq) : 999999;

    // Gustafson speedup at N: S = (1 - P) + P * N = N - (1 - P) * (N - 1)
    const gustafsonAtN = S_seq + P * N;

    // Efficiency at N: E = S / N
    const amdahlEff = (amdahlAtN / N) * 100;
    const gustafsonEff = (gustafsonAtN / N) * 100;

    // Update UI Cards
    document.getElementById('amdahl-val-speedup').textContent = `${amdahlAtN.toFixed(2)}x`;
    document.getElementById('amdahl-val-max').textContent = S_seq > 0 ? `${amdahlMax.toFixed(2)}x` : '∞';
    document.getElementById('gustafson-val-speedup').textContent = `${gustafsonAtN.toFixed(2)}x`;
    document.getElementById('amdahl-val-efficiency').textContent = `${amdahlEff.toFixed(1)}%`;

    // Generate graph points
    const step = Math.max(1, Math.floor(this.maxProcessors / 60));
    const processorPoints = [];
    for (let p = 1; p <= this.maxProcessors; p += step) {
      processorPoints.push(p);
    }
    if (!processorPoints.includes(this.maxProcessors)) {
      processorPoints.push(this.maxProcessors);
    }

    const amdahlData = processorPoints.map(p => +(1 / (S_seq + P / p)).toFixed(2));
    const gustafsonData = processorPoints.map(p => +(S_seq + P * p).toFixed(2));
    const linearData = processorPoints.map(p => p);
    const ceilingData = processorPoints.map(() => +amdahlMax.toFixed(2));

    if (this.chart) {
      this.chart.data.labels = processorPoints;
      this.chart.data.datasets[0].data = amdahlData;
      this.chart.data.datasets[1].data = gustafsonData;
      this.chart.data.datasets[2].data = linearData;
      this.chart.data.datasets[3].data = ceilingData;
      this.chart.update('none');
    }
  }
}
