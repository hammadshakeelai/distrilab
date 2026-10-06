/**
 * Web Worker for DistriLab Parallel Benchmarks
 * Handles real parallel multi-threaded computations directly on client hardware.
 */

self.onmessage = function (e) {
  const { type, taskId, payload } = e.data;
  const startTime = performance.now();

  if (type === 'monte-carlo-pi') {
    const { samples } = payload;
    let insideCircle = 0;
    for (let i = 0; i < samples; i++) {
      const x = Math.random();
      const y = Math.random();
      if (x * x + y * y <= 1) {
        insideCircle++;
      }
    }
    const duration = performance.now() - startTime;
    self.postMessage({
      type: 'done',
      taskId,
      duration,
      result: { insideCircle, samples }
    });
  } else if (type === 'mandelbrot') {
    const { width, height, startRow, endRow, maxIter, xMin, xMax, yMin, yMax } = payload;
    const rowCount = endRow - startRow;
    const buffer = new Uint8ClampedArray(rowCount * width * 4);

    let idx = 0;
    for (let py = startRow; py < endRow; py++) {
      const y0 = yMin + (py / height) * (yMax - yMin);
      for (let px = 0; px < width; px++) {
        const x0 = xMin + (px / width) * (xMax - xMin);
        let x = 0;
        let y = 0;
        let iter = 0;
        while (x * x + y * y <= 4 && iter < maxIter) {
          const xTemp = x * x - y * y + x0;
          y = 2 * x * y + y0;
          x = xTemp;
          iter++;
        }

        if (iter === maxIter) {
          buffer[idx] = 10;     // R
          buffer[idx + 1] = 15; // G
          buffer[idx + 2] = 30; // B
          buffer[idx + 3] = 255;// A
        } else {
          // Color ramp based on iteration count
          const norm = iter / maxIter;
          buffer[idx] = Math.floor(Math.sin(norm * Math.PI) * 200 + 40);
          buffer[idx + 1] = Math.floor(Math.sin(norm * Math.PI * 2) * 180 + 70);
          buffer[idx + 2] = Math.floor(255 * (1 - norm));
          buffer[idx + 3] = 255;
        }
        idx += 4;
      }
    }
    const duration = performance.now() - startTime;
    self.postMessage(
      {
        type: 'done',
        taskId,
        duration,
        result: { startRow, endRow, buffer: buffer.buffer }
      },
      [buffer.buffer]
    );
  } else if (type === 'matrix-multiply') {
    const { n, startRow, endRow, matrixA, matrixB } = payload;
    const a = new Float64Array(matrixA);
    const b = new Float64Array(matrixB);
    const rowCount = endRow - startRow;
    const resultRows = new Float64Array(rowCount * n);

    for (let i = startRow; i < endRow; i++) {
      const localI = i - startRow;
      for (let j = 0; j < n; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += a[i * n + k] * b[k * n + j];
        }
        resultRows[localI * n + j] = sum;
      }
    }

    const duration = performance.now() - startTime;
    self.postMessage(
      {
        type: 'done',
        taskId,
        duration,
        result: { startRow, endRow, rows: resultRows.buffer }
      },
      [resultRows.buffer]
    );
  }
};
