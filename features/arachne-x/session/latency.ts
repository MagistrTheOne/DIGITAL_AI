export function normalizeEventTimestamp(at: number, nowMs = Date.now()) {
  // Ensures we always return a non-negative offset.
  return Math.max(0, nowMs - at);
}

export type EventJitterSmoother = {
  pushSample(sampleMs: number): number;
  getSmoothed(): number;
};

export function createExponentialJitterSmoother(alpha = 0.2): EventJitterSmoother {
  let smoothed = 0;
  let initialized = false;

  return {
    pushSample(sampleMs: number) {
      if (!initialized) {
        smoothed = sampleMs;
        initialized = true;
        return smoothed;
      }
      smoothed = alpha * sampleMs + (1 - alpha) * smoothed;
      return smoothed;
    },
    getSmoothed() {
      return smoothed;
    },
  };
}

