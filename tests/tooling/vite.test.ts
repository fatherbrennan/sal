import { expect, it, spyOn } from "bun:test";
import { Server } from "node:net";
import { requireFreePort } from "../../config/port.ts";
import { runVite } from "../../scripts/vite.ts";

it("rejects unsupported Vite tasks", async () => {
  await expect(runVite([])).rejects.toThrow("Use the dev, build or preview");
  await expect(runVite(["unrelated"])).rejects.toThrow("Use the dev, build or preview");
});

it("propagates Vite failure instead of reporting task success", async () => {
  expect(await runVite(["build", "--sal-invalid-option"])).not.toBe(0);
});

it.each(["127.0.0.1", "::1"])("refuses to build while %s serves port 2000", async (host) => {
  const occupant = Bun.serve({
    hostname: host,
    port: 2000,
    fetch: () => new Response("Existing server"),
  });
  try {
    await expect(runVite(["build"])).rejects.toThrow("Port 2000 is already in use");
    expect(await (await fetch(occupant.url)).text()).toBe("Existing server");
  } finally {
    await occupant.stop(true);
  }
});

it.each(["EAFNOSUPPORT", "EADDRNOTAVAIL"])(
  "permits IPv4 when the operating system cannot bind IPv6: %s",
  async (code) => {
    const { listen } = Server.prototype;
    const boundary = spyOn(Server.prototype, "listen").mockImplementation(function (
      this: Server,
      ...arguments_: unknown[]
    ) {
      const [options] = arguments_;
      if (
        typeof options === "object" &&
        options !== null &&
        "host" in options &&
        options.host === "::1"
      ) {
        queueMicrotask(() =>
          this.emit("error", Object.assign(new Error("IPv6 unavailable"), { code })),
        );
      } else {
        Reflect.apply(listen, this, arguments_);
      }
      return this;
    });
    try {
      await expect(requireFreePort()).resolves.toBeUndefined();
    } finally {
      boundary.mockRestore();
    }
  },
);
