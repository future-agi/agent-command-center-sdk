/**
 * Gateway Latency Benchmark
 *
 * Sends many requests through the AgentCC gateway and measures latency stats:
 * min, max, mean, median, p90, p95, p99, stddev, throughput.
 *
 * Run with: npx vitest run tests/benchmark-latency.test.ts
 */
import { describe, it, expect } from "vitest";
import { AgentCC } from "../src/index.js";

const API_KEY = "sk-agentcc-e2e-test-key-001";
const BASE_URL = "http://localhost:8090";

function makeClient(): AgentCC {
  return new AgentCC({ apiKey: API_KEY, baseUrl: BASE_URL, maxRetries: 0 });
}

// ---------------------------------------------------------------------------
// Stats helpers
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function stats(latencies: number[]) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / sorted.length;
  const variance =
    sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / sorted.length;
  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: Math.round(mean * 100) / 100,
    median: percentile(sorted, 50),
    p90: percentile(sorted, 90),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    stddev: Math.round(Math.sqrt(variance) * 100) / 100,
  };
}

function printStats(label: string, latencies: number[], durationMs: number) {
  const s = stats(latencies);
  console.log(`\n  ── ${label} ──`);
  console.log(`  Requests:    ${s.count}`);
  console.log(`  Total time:  ${(durationMs / 1000).toFixed(2)}s`);
  console.log(
    `  Throughput:  ${(s.count / (durationMs / 1000)).toFixed(1)} req/s`,
  );
  console.log(`  Min:         ${s.min}ms`);
  console.log(`  Max:         ${s.max}ms`);
  console.log(`  Mean:        ${s.mean}ms`);
  console.log(`  Median:      ${s.median}ms`);
  console.log(`  p90:         ${s.p90}ms`);
  console.log(`  p95:         ${s.p95}ms`);
  console.log(`  p99:         ${s.p99}ms`);
  console.log(`  Stddev:      ${s.stddev}ms`);
}

// ---------------------------------------------------------------------------
// Sequential latency — one request at a time
// ---------------------------------------------------------------------------

describe("Benchmark: Sequential Latency", () => {
  it("sends 20 sequential chat completions", async () => {
    const client = makeClient();
    const latencies: number[] = [];
    const N = 20;

    const totalStart = Date.now();
    for (let i = 0; i < N; i++) {
      const start = Date.now();
      await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `Ping ${i}` }],
        max_tokens: 3,
        temperature: 0,
      });
      latencies.push(Date.now() - start);
    }
    const totalDuration = Date.now() - totalStart;

    printStats(`Sequential (${N} requests, gpt-4o-mini)`, latencies, totalDuration);
    expect(latencies.length).toBe(N);
  }, 120000);
});

// ---------------------------------------------------------------------------
// Concurrent latency — parallel requests
// ---------------------------------------------------------------------------

describe("Benchmark: Concurrent Latency", () => {
  it("sends 30 concurrent chat completions (batches of 10)", async () => {
    const client = makeClient();
    const latencies: number[] = [];
    const BATCH_SIZE = 10;
    const BATCHES = 3;

    const totalStart = Date.now();
    for (let b = 0; b < BATCHES; b++) {
      const promises = Array.from({ length: BATCH_SIZE }, (_, i) => {
        const idx = b * BATCH_SIZE + i;
        const start = Date.now();
        return client.chat.completions
          .create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: `Concurrent ${idx}` }],
            max_tokens: 3,
            temperature: 0,
          })
          .then(() => {
            latencies.push(Date.now() - start);
          });
      });
      await Promise.all(promises);
    }
    const totalDuration = Date.now() - totalStart;

    printStats(
      `Concurrent (${BATCHES * BATCH_SIZE} requests, ${BATCH_SIZE} parallel)`,
      latencies,
      totalDuration,
    );
    expect(latencies.length).toBe(BATCHES * BATCH_SIZE);
  }, 120000);
});

// ---------------------------------------------------------------------------
// Streaming latency — time-to-first-token and total
// ---------------------------------------------------------------------------

describe("Benchmark: Streaming Latency", () => {
  it("measures time-to-first-token and total streaming time (10 requests)", async () => {
    const client = makeClient();
    const ttftLatencies: number[] = [];
    const totalLatencies: number[] = [];
    const N = 10;

    const overallStart = Date.now();
    for (let i = 0; i < N; i++) {
      const start = Date.now();
      let firstTokenTime: number | null = null;

      const stream = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: `Count to 5, request ${i}` },
        ],
        max_tokens: 30,
        stream: true,
      });

      for await (const chunk of stream) {
        if (firstTokenTime === null && chunk.choices?.[0]?.delta?.content) {
          firstTokenTime = Date.now() - start;
        }
      }
      const totalTime = Date.now() - start;

      if (firstTokenTime !== null) ttftLatencies.push(firstTokenTime);
      totalLatencies.push(totalTime);
    }
    const overallDuration = Date.now() - overallStart;

    printStats(
      `Streaming TTFT (${ttftLatencies.length} requests)`,
      ttftLatencies,
      overallDuration,
    );
    printStats(
      `Streaming Total (${totalLatencies.length} requests)`,
      totalLatencies,
      overallDuration,
    );
    expect(totalLatencies.length).toBe(N);
  }, 120000);
});

// ---------------------------------------------------------------------------
// Gateway overhead — compare cached vs non-cached
// ---------------------------------------------------------------------------

describe("Benchmark: Gateway Overhead (cached responses)", () => {
  it("measures overhead on cache hits (50 identical requests)", async () => {
    const client = makeClient();
    const latencies: number[] = [];
    const N = 50;

    // Warm up the cache with one request
    await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "What is 2+2?" }],
      max_tokens: 5,
      temperature: 0,
    });

    // Now send identical requests — should all be cache hits
    const totalStart = Date.now();
    for (let i = 0; i < N; i++) {
      const start = Date.now();
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "What is 2+2?" }],
        max_tokens: 5,
        temperature: 0,
      });
      latencies.push(Date.now() - start);
    }
    const totalDuration = Date.now() - totalStart;

    printStats(`Cache Hits (${N} identical requests)`, latencies, totalDuration);
    expect(latencies.length).toBe(N);
  }, 60000);
});

// ---------------------------------------------------------------------------
// Models list — lightweight endpoint
// ---------------------------------------------------------------------------

describe("Benchmark: Models List Latency", () => {
  it("measures /v1/models latency (20 requests)", async () => {
    const client = makeClient();
    const latencies: number[] = [];
    const N = 20;

    const totalStart = Date.now();
    for (let i = 0; i < N; i++) {
      const start = Date.now();
      await client.models.list();
      latencies.push(Date.now() - start);
    }
    const totalDuration = Date.now() - totalStart;

    printStats(`/v1/models (${N} requests)`, latencies, totalDuration);
    expect(latencies.length).toBe(N);
  }, 30000);
});

// ---------------------------------------------------------------------------
// Burst test — high concurrency
// ---------------------------------------------------------------------------

describe("Benchmark: Burst Test", () => {
  it("fires 50 requests at once", async () => {
    const client = makeClient();
    const latencies: number[] = [];
    const N = 50;

    const totalStart = Date.now();
    const promises = Array.from({ length: N }, (_, i) => {
      const start = Date.now();
      return client.chat.completions
        .create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Burst ${i}` }],
          max_tokens: 3,
          temperature: 0,
        })
        .then(() => {
          latencies.push(Date.now() - start);
        })
        .catch((err) => {
          latencies.push(Date.now() - start);
          console.log(`  Request ${i} failed: ${err.message}`);
        });
    });
    await Promise.all(promises);
    const totalDuration = Date.now() - totalStart;

    printStats(`Burst (${N} concurrent)`, latencies, totalDuration);
    expect(latencies.length).toBe(N);
  }, 120000);
});
