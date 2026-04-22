import { test as vitestTest } from "vitest";
import { AgentCC } from "@agentcc/client";

const API_KEY = process.env.AGENTCC_API_KEY;
const BASE_URL = process.env.AGENTCC_BASE_URL;
const MUTATING = process.env.MUTATING === "1";

export const HAS_KEY = !!(API_KEY && BASE_URL);
export const IS_MUTATING = MUTATING;

export const client = HAS_KEY
  ? new AgentCC({ apiKey: API_KEY!, baseUrl: BASE_URL! })
  : (null as unknown as AgentCC);

export const itest = HAS_KEY ? vitestTest : vitestTest.skip;
export const itestMutating = HAS_KEY && IS_MUTATING ? vitestTest : vitestTest.skip;

export const uniqName = () => `agentcc-itest-${Math.random().toString(36).slice(2, 10)}`;

export function isGatewayGap(e: any): boolean {
  const status = e?.status || e?.statusCode;
  const msg = String(e?.message || e);
  return (
    status === 404 ||
    status === 500 ||
    status === 501 ||
    status === 502 ||
    /Unknown endpoint|provider error|not configured|does not support/i.test(msg)
  );
}
