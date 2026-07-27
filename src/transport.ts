import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express, { Request, Response } from "express";
import type { Server as HttpServer } from "node:http";
import { error, info } from "./logger.js";

export type MCPServerFactory = () => Server;

export interface MCPTransport {
  start(serverFactory: MCPServerFactory): Promise<void>;
  stop(): Promise<void>;
}

export class StdioTransport implements MCPTransport {
  private transport: StdioServerTransport | null = null;
  private server: Server | null = null;

  async start(serverFactory: MCPServerFactory): Promise<void> {
    this.server = serverFactory();
    this.transport = new StdioServerTransport();
    await this.server.connect(this.transport);
  }

  async stop(): Promise<void> {
    await this.transport?.close();
    await this.server?.close();
    this.transport = null;
    this.server = null;
  }
}

export class StreamableHttpTransport implements MCPTransport {
  private readonly app = express();
  private httpServer: HttpServer | null = null;
  private serverFactory: MCPServerFactory | null = null;

  constructor(private readonly port = 8080) {
    this.app.use(express.json({ limit: "1mb" }));
    this.setupEndpoints();
  }

  private setupEndpoints(): void {
    this.app.get("/healthz", (_req: Request, res: Response) => {
      res.status(200).json({ status: "ok" });
    });

    this.app.post("/mcp", async (req: Request, res: Response) => {
      if (!this.serverFactory) {
        res.status(503).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Server not initialized" },
          id: req.body?.id ?? null,
        });
        return;
      }

      const server = this.serverFactory();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      res.on("close", () => {
        void transport.close();
        void server.close();
      });

      try {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      } catch (caught) {
        error(`Unhandled MCP HTTP error: ${String(caught)}`);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal server error" },
            id: req.body?.id ?? null,
          });
        }
      }
    });

    const methodNotAllowed = (_req: Request, res: Response) => {
      res.status(405).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed. Use POST." },
        id: null,
      });
    };

    this.app.get("/mcp", methodNotAllowed);
    this.app.delete("/mcp", methodNotAllowed);
  }

  async start(serverFactory: MCPServerFactory): Promise<void> {
    this.serverFactory = serverFactory;
    await new Promise<void>((resolve, reject) => {
      this.httpServer = this.app.listen(this.port, "0.0.0.0", () => {
        info(`Streamable HTTP MCP listening on 0.0.0.0:${this.port}/mcp`);
        resolve();
      });
      this.httpServer.once("error", reject);
    });
  }

  async stop(): Promise<void> {
    const server = this.httpServer;
    this.httpServer = null;
    this.serverFactory = null;

    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((caught) => caught ? reject(caught) : resolve());
      });
    }
  }
}
