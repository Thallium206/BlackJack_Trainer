import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 4173);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"]
]);

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const target = normalize(decoded === "/" ? "/index.html" : decoded);
  const fullPath = resolve(join(root, target));
  return fullPath.startsWith(root) ? fullPath : null;
}

const server = createServer(async (request, response) => {
  try {
    const filePath = safePath(request.url || "/");
    if (!filePath) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const candidate = existsSync(filePath) ? filePath : join(root, "index.html");
    const contentType = mimeTypes.get(extname(candidate)) || "application/octet-stream";

    if (request.method === "HEAD") {
      response.writeHead(200, { "content-type": contentType });
      response.end();
      return;
    }

    if (request.method !== "GET") {
      response.writeHead(405);
      response.end("Method not allowed");
      return;
    }

    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": contentType
    });
    createReadStream(candidate).pipe(response);
  } catch (error) {
    const body = await readFile(join(root, "index.html"), "utf8").catch(() => "");
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end(body ? `Server error\n${error.message}` : error.message);
  }
});

server.listen(port, () => {
  console.log(`BlackJack Trainer: http://localhost:${port}`);
});
