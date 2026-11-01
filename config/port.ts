import { createServer } from "node:net";

const applicationPort = 2000;

async function requireFreePort(): Promise<void> {
  await Promise.all(
    ["127.0.0.1", "::1"].map(
      (host) =>
        new Promise<void>((resolve, reject) => {
          const probe = createServer();
          probe.once("error", (error: NodeJS.ErrnoException) => {
            if (
              host === "::1" &&
              (error.code === "EAFNOSUPPORT" || error.code === "EADDRNOTAVAIL")
            ) {
              resolve();
            } else if (error.code === "EADDRINUSE") {
              reject(
                new Error(
                  "Port 2000 is already in use. Stop that server before starting or building sal to avoid mixed application versions.",
                  { cause: error },
                ),
              );
            } else {
              reject(error);
            }
          });
          probe.listen({ host, port: applicationPort, exclusive: true }, () => {
            probe.close((error) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            });
          });
        }),
    ),
  );
}

export { applicationPort, requireFreePort };
