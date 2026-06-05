import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultHost = "127.0.0.1";
const defaultPort = 4173;

type ViewerServerOptions = {
  host?: string;
  port?: number;
  webRoot?: string;
};

type ContentType = "html" | "js" | "css" | "json" | "svg" | "plain";

const contentTypes: Record<ContentType, string> = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml; charset=utf-8",
  plain: "text/plain; charset=utf-8"
};

function defaultWebRoot(): string {
  const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(moduleDirectory, "../../..", "apps/web/dist");
}

function contentTypeFor(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".html") {
    return contentTypes.html;
  }

  if (extension === ".js" || extension === ".mjs") {
    return contentTypes.js;
  }

  if (extension === ".css") {
    return contentTypes.css;
  }

  if (extension === ".json") {
    return contentTypes.json;
  }

  if (extension === ".svg") {
    return contentTypes.svg;
  }

  return contentTypes.plain;
}

function isPathInside(root: string, candidate: string): boolean {
  const relativePath = path.relative(root, candidate);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function staticFilePath(webRoot: string, requestPath: string): string | undefined {
  const pathname = requestPath === "/" ? "/index.html" : requestPath;
  let decodedPathname: string;

  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }

  const candidate = path.resolve(webRoot, `.${decodedPathname}`);
  return isPathInside(webRoot, candidate) ? candidate : undefined;
}

function writeResponse(response: ServerResponse, statusCode: number, message: string): void {
  response.writeHead(statusCode, { "content-type": contentTypes.plain });
  response.end(message);
}

async function serveFile(response: ServerResponse, filePath: string, contentType: string): Promise<void> {
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      writeResponse(response, 404, "Not found");
      return;
    }

    response.writeHead(200, { "content-type": contentType });
    createReadStream(filePath)
      .on("error", () => {
        if (!response.headersSent) {
          writeResponse(response, 500, "Unable to read file");
          return;
        }

        response.destroy();
      })
      .pipe(response);
  } catch {
    writeResponse(response, 404, "Not found");
  }
}

export async function startViewerServer(
  traceFile: string,
  options: ViewerServerOptions = {}
): Promise<string> {
  const host = options.host ?? defaultHost;
  const port = options.port ?? defaultPort;
  const tracePath = path.resolve(traceFile);
  const webRoot = path.resolve(options.webRoot ?? defaultWebRoot());

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", `http://${host}:${port}`);

    if (url.pathname === "/trace") {
      await serveFile(response, tracePath, "application/x-ndjson; charset=utf-8");
      return;
    }

    const filePath = staticFilePath(webRoot, url.pathname);
    if (!filePath) {
      writeResponse(response, 403, "Forbidden");
      return;
    }

    await serveFile(response, filePath, contentTypeFor(filePath));
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  return `http://${host}:${port}`;
}
