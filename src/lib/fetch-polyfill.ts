/**
 * Global fetch polyfill for Node.js compatibility on Vercel.
 * Adds duplex: 'half' option to all fetch requests with body.
 */

if (
  typeof globalThis !== "undefined" &&
  typeof globalThis.fetch !== "undefined"
) {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (init && init.body) {
      return originalFetch(input, {
        ...init,
        duplex: "half",
      } as RequestInit & { duplex: "half" });
    }
    return originalFetch(input, init);
  } as typeof fetch;
}

export {};
