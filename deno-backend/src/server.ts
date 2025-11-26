// Minimal HTTP + IPC server (NDJSON over UDS/TCP)
const PORT = Number(Deno.env.get("PORT") || 3000);
const IPC_SOCKET_PATH = Deno.env.get("GITXAB_SOCKET_PATH") ||
  "/tmp/gitxab.sock";
const IPC_PORT = Number(Deno.env.get("GITXAB_PORT") || 8765);

// Simple in-memory mock projects (for prototype)
const MOCK_PROJECTS = [
  {
    id: 1,
    name: "gitxab",
    path: "gitxab",
    description: "Neovim GitLab plugin",
  },
  { id: 2, name: "example", path: "example", description: "Example project" },
];

function httpHandler(req: Request): Response {
  const url = new URL(req.url);
  if (url.pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  if (url.pathname === "/projects") {
    const q = url.searchParams.get("q") || "";
    const results = MOCK_PROJECTS.filter((p) =>
      p.name.includes(q) || p.description.includes(q)
    );
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(
    JSON.stringify({ message: "GitXab backend placeholder" }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

// Start HTTP server
import { serve } from "https://deno.land/std@0.179.0/http/server.ts";
console.log(`HTTP Listening on :${PORT}`);
serve(httpHandler, { port: PORT });

// IPC: helper to write NDJSON object
async function writeNdjson(writer: Deno.Writer & Deno.Closer, obj: unknown) {
  const s = JSON.stringify(obj) + "\n";
  const bytes = new TextEncoder().encode(s);
  await writer.write(bytes);
}

// Handle a single connection (Deno.Conn)
async function handleConn(conn: Deno.Conn) {
  try {
    const bufReader = conn.readable.getReader();
    const buf = new Uint8Array(4096);
    let partial = "";
    while (true) {
      const { value, done } = await bufReader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      partial += chunk;
      let idx;
      while ((idx = partial.indexOf("\n")) !== -1) {
        const line = partial.slice(0, idx).trim();
        partial = partial.slice(idx + 1);
        if (!line) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch (e) {
          await writeNdjson(conn, {
            id: null,
            error: { code: 1000, message: "invalid json" },
          });
          continue;
        }
        // handle methods
        if (msg.method === "list_projects") {
          const q = (msg.params && msg.params.q) ? String(msg.params.q) : "";
          const results = MOCK_PROJECTS.filter((p) =>
            p.name.includes(q) || p.description.includes(q)
          );
          await writeNdjson(conn, { id: msg.id || null, result: results });
        } else {
          await writeNdjson(conn, {
            id: msg.id || null,
            error: { code: 1001, message: "method not found" },
          });
        }
      }
    }
  } catch (e) {
    console.error("Connection handler error:", e);
  } finally {
    try {
      conn.close();
    } catch {}
  }
}

// Start UNIX domain socket listener if supported
try {
  // remove stale socket
  try {
    await Deno.remove(IPC_SOCKET_PATH);
  } catch {}
  // UDS is only available on unix-like platforms
  const udsListener = Deno.listen({ transport: "unix", path: IPC_SOCKET_PATH });
  (async () => {
    console.log(`IPC UDS listening at ${IPC_SOCKET_PATH}`);
    for await (const conn of udsListener) {
      handleConn(conn);
    }
  })();
} catch (e) {
  console.log(
    "UDS not available, will continue to TCP fallback: ",
    e.message || e,
  );
}

// TCP fallback listener on localhost
(async () => {
  const tcpListener = Deno.listen({ hostname: "127.0.0.1", port: IPC_PORT });
  console.log(`IPC TCP listening on 127.0.0.1:${IPC_PORT}`);
  for await (const conn of tcpListener) {
    handleConn(conn);
  }
})();
