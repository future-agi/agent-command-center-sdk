import { describe, expect } from "vitest";
import { client, itest, isGatewayGap } from "./_helpers.js";

async function getAudio(): Promise<ArrayBuffer | null> {
  try {
    const tts = await client.audio.speech.create({
      model: "gemini-2.5-flash-preview-tts",
      voice: "alloy",
      input: "Hello world.",
    } as any);
    return tts instanceof ArrayBuffer ? tts : await (tts as any).arrayBuffer();
  } catch {
    return null;
  }
}

describe("audio.transcriptions + translations", () => {
  itest("transcriptions.create standalone", async (ctx) => {
    const bytes = await getAudio();
    if (!bytes) return ctx.skip("no TTS available on gateway");
    try {
      const file = new File([bytes], "sample.mp3", { type: "audio/mpeg" });
      const r = await client.audio.transcriptions.create({
        model: "gemini-2.0-flash",
        file,
      } as any);
      expect(r.text).toBeTruthy();
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks transcriptions: ${e}`);
      throw e;
    }
  });

  itest("translations.create standalone", async (ctx) => {
    const bytes = await getAudio();
    if (!bytes) return ctx.skip("no TTS available on gateway");
    try {
      const file = new File([bytes], "sample.mp3", { type: "audio/mpeg" });
      const r = await client.audio.translations.create({
        model: "gemini-2.0-flash",
        file,
      } as any);
      expect((r as any).text).toBeDefined();
    } catch (e) {
      if (isGatewayGap(e)) return ctx.skip(`gateway lacks translations: ${e}`);
      throw e;
    }
  });
});
