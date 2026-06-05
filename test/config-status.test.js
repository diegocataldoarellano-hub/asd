import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getConfigStatus } from "../src/config-status.js";

describe("config-status", () => {
  it("expone flags de configuración", () => {
    const status = getConfigStatus();
    assert.equal(typeof status.twilio, "boolean");
    assert.equal(typeof status.githubToken, "boolean");
    assert.equal(typeof status.readyForWhatsApp, "boolean");
  });
});
