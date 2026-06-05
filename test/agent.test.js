import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { handleIncomingMessage } from "../src/agent.js";

describe("agent", () => {
  it("responde ayuda", async () => {
    const reply = await handleIncomingMessage("ayuda");
    assert.match(reply, /proyectos/i);
    assert.match(reply, /estado/i);
  });

  it("lista proyectos", async () => {
    const reply = await handleIncomingMessage("proyectos");
    assert.match(reply, /asd/i);
  });
});
