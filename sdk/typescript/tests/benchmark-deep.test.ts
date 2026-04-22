/**
 * Deep Gateway Latency Benchmark
 *
 * Measures pure gateway overhead vs end-to-end latency to understand
 * where time is spent: gateway processing vs provider round-trip.
 *
 * Run with: npx vitest run tests/benchmark-deep.test.ts
 */
import { describe, it, expect } from "vitest";

const API_KEY = "sk-agentcc-e2e-test-key-001";
const BASE_URL = "http://localhost:8090";

const HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${API_KEY}`,
};

// ---------------------------------------------------------------------------
// Stats
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
  console.log(`  Requests:     ${s.count}`);
  console.log(`  Wall clock:   ${(durationMs / 1000).toFixed(2)}s`);
  console.log(
    `  Throughput:   ${(s.count / (durationMs / 1000)).toFixed(1)} req/s`,
  );
  console.log(`  Min:          ${s.min.toFixed(2)}ms`);
  console.log(`  Max:          ${s.max.toFixed(2)}ms`);
  console.log(`  Mean:         ${s.mean.toFixed(2)}ms`);
  console.log(`  Median (p50): ${s.median.toFixed(2)}ms`);
  console.log(`  p90:          ${s.p90.toFixed(2)}ms`);
  console.log(`  p95:          ${s.p95.toFixed(2)}ms`);
  console.log(`  p99:          ${s.p99.toFixed(2)}ms`);
  console.log(`  Stddev:       ${s.stddev.toFixed(2)}ms`);
}

// High-resolution timer
function now(): number {
  const [s, ns] = process.hrtime();
  return s * 1000 + ns / 1_000_000;
}

// ---------------------------------------------------------------------------
// 1. /healthz — absolute minimum path (no auth, no parsing)
// ---------------------------------------------------------------------------

describe("Deep Benchmark: /healthz overhead", () => {
  it("100 sequential /healthz calls", async () => {
    const N = 100;
    const latencies: number[] = [];

    // warmup
    for (let i = 0; i < 5; i++) await fetch(`${BASE_URL}/healthz`);

    const totalStart = now();
    for (let i = 0; i < N; i++) {
      const start = now();
      const resp = await fetch(`${BASE_URL}/healthz`);
      await resp.text();
      latencies.push(now() - start);
    }
    printStats("/healthz sequential", latencies, now() - totalStart);
    expect(latencies.length).toBe(N);
  }, 30000);

  it("200 concurrent /healthz calls (50 parallel)", async () => {
    const N = 200;
    const PARALLEL = 50;
    const latencies: number[] = [];

    const totalStart = now();
    for (let batch = 0; batch < N / PARALLEL; batch++) {
      const promises = Array.from({ length: PARALLEL }, async () => {
        const start = now();
        const resp = await fetch(`${BASE_URL}/healthz`);
        await resp.text();
        latencies.push(now() - start);
      });
      await Promise.all(promises);
    }
    printStats("/healthz concurrent (50 parallel)", latencies, now() - totalStart);
    expect(latencies.length).toBe(N);
  }, 30000);
});

// ---------------------------------------------------------------------------
// 2. /v1/models — auth + JSON response, no provider call
// ---------------------------------------------------------------------------

describe("Deep Benchmark: /v1/models overhead", () => {
  it("100 sequential /v1/models calls", async () => {
    const N = 100;
    const latencies: number[] = [];

    // warmup
    for (let i = 0; i < 5; i++) {
      await (await fetch(`${BASE_URL}/v1/models`, { headers: HEADERS })).text();
    }

    const totalStart = now();
    for (let i = 0; i < N; i++) {
      const start = now();
      const resp = await fetch(`${BASE_URL}/v1/models`, { headers: HEADERS });
      await resp.text();
      latencies.push(now() - start);
    }
    printStats("/v1/models sequential (auth + JSON)", latencies, now() - totalStart);
    expect(latencies.length).toBe(N);
  }, 30000);
});

// ---------------------------------------------------------------------------
// 3. Cache hit latency — full request pipeline but no provider call
// ---------------------------------------------------------------------------

describe("Deep Benchmark: Cache hit overhead (full pipeline)", () => {
  it("200 cached chat completions (sequential)", async () => {
    const N = 200;
    const latencies: number[] = [];
    const body = JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "What is 2+2?" }],
      max_tokens: 5,
      temperature: 0,
    });

    // warmup + seed cache
    for (let i = 0; i < 3; i++) {
      await (
        await fetch(`${BASE_URL}/v1/chat/completions`, {
          method: "POST",
          headers: HEADERS,
          body,
        })
      ).text();
    }

    // wait for cache to be warm
    await new Promise((r) => setTimeout(r, 100));

    const totalStart = now();
    for (let i = 0; i < N; i++) {
      const start = now();
      const resp = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: HEADERS,
        body,
      });
      await resp.text();
      latencies.push(now() - start);
    }
    printStats("Cache hit (full pipeline, sequential)", latencies, now() - totalStart);

    // Check that we're actually getting cache hits
    const resp = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: HEADERS,
      body,
    });
    const cacheStatus = resp.headers.get("x-agentcc-cache-status");
    console.log(`  Cache status: ${cacheStatus}`);
    await resp.text();

    expect(latencies.length).toBe(N);
  }, 60000);

  it("500 cached chat completions (50 parallel)", async () => {
    const N = 500;
    const PARALLEL = 50;
    const latencies: number[] = [];
    const body = JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "What is 2+2?" }],
      max_tokens: 5,
      temperature: 0,
    });

    // warmup
    await (
      await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: HEADERS,
        body,
      })
    ).text();
    await new Promise((r) => setTimeout(r, 50));

    const totalStart = now();
    for (let batch = 0; batch < N / PARALLEL; batch++) {
      const promises = Array.from({ length: PARALLEL }, async () => {
        const start = now();
        const resp = await fetch(`${BASE_URL}/v1/chat/completions`, {
          method: "POST",
          headers: HEADERS,
          body,
        });
        await resp.text();
        latencies.push(now() - start);
      });
      await Promise.all(promises);
    }
    printStats("Cache hit (full pipeline, 50 parallel)", latencies, now() - totalStart);
    expect(latencies.length).toBe(N);
  }, 60000);
});

// ---------------------------------------------------------------------------
// 4. Fresh requests — unique prompts, full provider round-trip
// ---------------------------------------------------------------------------

describe("Deep Benchmark: Fresh requests (provider round-trip)", () => {
  it("20 sequential fresh completions", async () => {
    const N = 20;
    const latencies: number[] = [];

    const totalStart = now();
    for (let i = 0; i < N; i++) {
      const body = JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Return exactly the number ${i + 1000}`,
          },
        ],
        max_tokens: 5,
        temperature: 0,
      });

      const start = now();
      const resp = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: HEADERS,
        body,
      });
      await resp.text();
      latencies.push(now() - start);
    }
    printStats("Fresh requests (sequential, gpt-4o-mini)", latencies, now() - totalStart);
    expect(latencies.length).toBe(N);
  }, 120000);

  it("50 concurrent fresh completions (10 parallel)", async () => {
    const N = 50;
    const PARALLEL = 10;
    const latencies: number[] = [];
    const errors: string[] = [];

    const totalStart = now();
    for (let batch = 0; batch < N / PARALLEL; batch++) {
      const promises = Array.from({ length: PARALLEL }, async (_, i) => {
        const idx = batch * PARALLEL + i;
        const body = JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `Return exactly the number ${idx + 2000}`,
            },
          ],
          max_tokens: 5,
          temperature: 0,
        });

        const start = now();
        try {
          const resp = await fetch(`${BASE_URL}/v1/chat/completions`, {
            method: "POST",
            headers: HEADERS,
            body,
          });
          await resp.text();
          latencies.push(now() - start);
          if (resp.status >= 400) errors.push(`HTTP ${resp.status}`);
        } catch (err: any) {
          latencies.push(now() - start);
          errors.push(err.message);
        }
      });
      await Promise.all(promises);
    }
    printStats("Fresh requests (10 parallel, gpt-4o-mini)", latencies, now() - totalStart);
    if (errors.length > 0) console.log(`  Errors: ${errors.length}`);
    expect(latencies.length).toBe(N);
  }, 120000);
});

// ---------------------------------------------------------------------------
// 5. Auth overhead — compare authed vs unauthed paths
// ---------------------------------------------------------------------------

describe("Deep Benchmark: Auth overhead isolation", () => {
  it("compares /healthz (no auth) vs /v1/models (auth required)", async () => {
    const N = 100;

    // /healthz — no auth
    const healthLatencies: number[] = [];
    for (let i = 0; i < 5; i++) await fetch(`${BASE_URL}/healthz`);
    const h1 = now();
    for (let i = 0; i < N; i++) {
      const s = now();
      await (await fetch(`${BASE_URL}/healthz`)).text();
      healthLatencies.push(now() - s);
    }
    const h1d = now() - h1;

    // /v1/models — auth required
    const modelsLatencies: number[] = [];
    for (let i = 0; i < 5; i++) {
      await (
        await fetch(`${BASE_URL}/v1/models`, { headers: HEADERS })
      ).text();
    }
    const m1 = now();
    for (let i = 0; i < N; i++) {
      const s = now();
      await (
        await fetch(`${BASE_URL}/v1/models`, { headers: HEADERS })
      ).text();
      modelsLatencies.push(now() - s);
    }
    const m1d = now() - m1;

    const hStats = stats(healthLatencies);
    const mStats = stats(modelsLatencies);

    console.log(`\n  ── Auth Overhead Comparison (${N} requests each) ──`);
    console.log(
      `  /healthz (no auth):   mean=${hStats.mean.toFixed(2)}ms  p50=${hStats.median.toFixed(2)}ms  p95=${hStats.p95.toFixed(2)}ms`,
    );
    console.log(
      `  /v1/models (auth):    mean=${mStats.mean.toFixed(2)}ms  p50=${mStats.median.toFixed(2)}ms  p95=${mStats.p95.toFixed(2)}ms`,
    );
    console.log(
      `  Auth overhead:        ~${(mStats.mean - hStats.mean).toFixed(2)}ms mean`,
    );

    expect(healthLatencies.length).toBe(N);
    expect(modelsLatencies.length).toBe(N);
  }, 30000);
});

// ---------------------------------------------------------------------------
// 6. Pipeline overhead — cache hit shows full plugin pipeline cost
// ---------------------------------------------------------------------------

describe("Deep Benchmark: Plugin pipeline overhead", () => {
  it("compares /v1/models vs cache hit (shows plugin pipeline cost)", async () => {
    const N = 100;

    // /v1/models — auth + simple handler
    const modelsLatencies: number[] = [];
    for (let i = 0; i < 5; i++) {
      await (
        await fetch(`${BASE_URL}/v1/models`, { headers: HEADERS })
      ).text();
    }
    for (let i = 0; i < N; i++) {
      const s = now();
      await (
        await fetch(`${BASE_URL}/v1/models`, { headers: HEADERS })
      ).text();
      modelsLatencies.push(now() - s);
    }

    // Cache hit — auth + full plugin pipeline + cache lookup + response
    const cacheBody = JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "What is 2+2?" }],
      max_tokens: 5,
      temperature: 0,
    });
    // seed cache
    for (let i = 0; i < 3; i++) {
      await (
        await fetch(`${BASE_URL}/v1/chat/completions`, {
          method: "POST",
          headers: HEADERS,
          body: cacheBody,
        })
      ).text();
    }
    await new Promise((r) => setTimeout(r, 50));

    const cacheLatencies: number[] = [];
    for (let i = 0; i < N; i++) {
      const s = now();
      await (
        await fetch(`${BASE_URL}/v1/chat/completions`, {
          method: "POST",
          headers: HEADERS,
          body: cacheBody,
        })
      ).text();
      cacheLatencies.push(now() - s);
    }

    const mStats = stats(modelsLatencies);
    const cStats = stats(cacheLatencies);

    console.log(`\n  ── Plugin Pipeline Overhead (${N} requests each) ──`);
    console.log(
      `  /v1/models (auth only):          mean=${mStats.mean.toFixed(2)}ms  p50=${mStats.median.toFixed(2)}ms  p95=${mStats.p95.toFixed(2)}ms`,
    );
    console.log(
      `  Cache hit (full pipeline):       mean=${cStats.mean.toFixed(2)}ms  p50=${cStats.median.toFixed(2)}ms  p95=${cStats.p95.toFixed(2)}ms`,
    );
    console.log(
      `  Pipeline overhead:               ~${(cStats.mean - mStats.mean).toFixed(2)}ms mean`,
    );
    console.log(
      `  Pipeline overhead (p95):         ~${(cStats.p95 - mStats.p95).toFixed(2)}ms`,
    );

    expect(modelsLatencies.length).toBe(N);
    expect(cacheLatencies.length).toBe(N);
  }, 60000);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

describe("Deep Benchmark: Full summary table", () => {
  it("prints a comparison summary", async () => {
    // Run all measurements in one test for a clean comparison
    const N = 50;

    // 1. /healthz
    const healthL: number[] = [];
    for (let i = 0; i < 5; i++) await fetch(`${BASE_URL}/healthz`);
    for (let i = 0; i < N; i++) {
      const s = now();
      await (await fetch(`${BASE_URL}/healthz`)).text();
      healthL.push(now() - s);
    }

    // 2. /v1/models
    const modelsL: number[] = [];
    for (let i = 0; i < 5; i++) {
      await (await fetch(`${BASE_URL}/v1/models`, { headers: HEADERS })).text();
    }
    for (let i = 0; i < N; i++) {
      const s = now();
      await (await fetch(`${BASE_URL}/v1/models`, { headers: HEADERS })).text();
      modelsL.push(now() - s);
    }

    // 3. Cache hit
    const cacheBody = JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "What is 2+2?" }],
      max_tokens: 5,
      temperature: 0,
    });
    for (let i = 0; i < 3; i++) {
      await (await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: "POST", headers: HEADERS, body: cacheBody,
      })).text();
    }
    await new Promise((r) => setTimeout(r, 50));

    const cacheL: number[] = [];
    for (let i = 0; i < N; i++) {
      const s = now();
      await (await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: "POST", headers: HEADERS, body: cacheBody,
      })).text();
      cacheL.push(now() - s);
    }

    // 4. Fresh request (just 5 to avoid cost)
    const freshL: number[] = [];
    for (let i = 0; i < 5; i++) {
      const body = JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `Unique benchmark request number ${Date.now()}-${i}` }],
        max_tokens: 3,
        temperature: 0,
      });
      const s = now();
      await (await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: "POST", headers: HEADERS, body,
      })).text();
      freshL.push(now() - s);
    }

    const h = stats(healthL);
    const m = stats(modelsL);
    const c = stats(cacheL);
    const f = stats(freshL);

    console.log(`\n  ╔══════════════════════════════════════════════════════════════════╗`);
    console.log(`  ║              AGENTCC GATEWAY LATENCY BREAKDOWN                  ║`);
    console.log(`  ╠══════════════════════════════════════════════════════════════════╣`);
    console.log(`  ║  Endpoint             │  Mean     │  p50      │  p95      │  N  ║`);
    console.log(`  ╟───────────────────────┼───────────┼───────────┼───────────┼─────╢`);
    console.log(`  ║  /healthz (bare)      │ ${h.mean.toFixed(2).padStart(7)}ms │ ${h.median.toFixed(2).padStart(7)}ms │ ${h.p95.toFixed(2).padStart(7)}ms │ ${String(h.count).padStart(3)} ║`);
    console.log(`  ║  /v1/models (auth)    │ ${m.mean.toFixed(2).padStart(7)}ms │ ${m.median.toFixed(2).padStart(7)}ms │ ${m.p95.toFixed(2).padStart(7)}ms │ ${String(m.count).padStart(3)} ║`);
    console.log(`  ║  Cache hit (pipeline) │ ${c.mean.toFixed(2).padStart(7)}ms │ ${c.median.toFixed(2).padStart(7)}ms │ ${c.p95.toFixed(2).padStart(7)}ms │ ${String(c.count).padStart(3)} ║`);
    console.log(`  ║  Fresh (provider RT)  │ ${f.mean.toFixed(2).padStart(7)}ms │ ${f.median.toFixed(2).padStart(7)}ms │ ${f.p95.toFixed(2).padStart(7)}ms │ ${String(f.count).padStart(3)} ║`);
    console.log(`  ╠══════════════════════════════════════════════════════════════════╣`);
    console.log(`  ║  OVERHEAD ANALYSIS                                              ║`);
    console.log(`  ╟──────────────────────────────────────────────────────────────────╢`);
    console.log(`  ║  Auth overhead:     ~${(m.mean - h.mean).toFixed(2).padStart(6)}ms  (models - healthz)             ║`);
    console.log(`  ║  Pipeline overhead: ~${(c.mean - m.mean).toFixed(2).padStart(6)}ms  (cache_hit - models)            ║`);
    console.log(`  ║  Total gw overhead: ~${c.mean.toFixed(2).padStart(6)}ms  (cache hit = pure gateway)        ║`);
    console.log(`  ║  Provider RT:       ~${(f.mean - c.mean).toFixed(2).padStart(6)}ms  (fresh - cache_hit)             ║`);
    console.log(`  ╟──────────────────────────────────────────────────────────────────╢`);
    console.log(`  ║  Bifrost target:       0.011ms (11μs at 5K RPS)                 ║`);
    console.log(`  ║  Our target:          <0.100ms (<100μs P95)                     ║`);
    console.log(`  ╚══════════════════════════════════════════════════════════════════╝`);

    expect(true).toBe(true);
  }, 120000);
});
