import { describe, expect } from "vitest";
import { client, itest, isGatewayGap } from "./_helpers.js";

describe("audio", () => {
  itest("tts → transcription round-trip", async (ctx) => {
    let audioBytes: ArrayBuffer;
    try {
      const tts = await client.audio.speech.create({
        model: "gemini-2.5-flash-preview-tts",
        voice: "alloy",
        input: "Testing one two three.",
      } as any);
      audioBytes = tts instanceof ArrayBuffer ? tts : await (tts as any).arrayBuffer();
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks tts: ${e}`);
      throw e;
    }
    try {
      const file = new File([audioBytes], "sample.mp3", { type: "audio/mpeg" });
      const r = await client.audio.transcriptions.create({
        model: "gemini-2.0-flash",
        file,
      } as any);
      expect(r.text).toBeTruthy();
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks whisper: ${e}`);
      throw e;
    }
  });
});
