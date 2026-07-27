import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import { error, info } from "./logger.js";
export class StdioTransport {
    transport = null;
    server = null;
    async start(serverFactory) {
        this.server = serverFactory();
        this.transport = new StdioServerTransport();
        await this.server.connect(this.transport);
    }
    async stop() {
        await this.transport?.close();
        await this.server?.close();
        this.transport = null;
        this.server = null;
    }
}
export class StreamableHttpTransport {
    port;
    app = express();
    httpServer = null;
    serverFactory = null;
    constructor(port = 8080) {
        this.port = port;
        this.app.use(express.json({ limit: "1mb" }));
        this.setupEndpoints();
    }
    setupEndpoints() {
        this.app.get("/healthz", (_req, res) => {
            res.status(200).json({ status: "ok" });
        });
        this.app.post("/mcp", async (req, res) => {
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
            }
            catch (caught) {
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
        const methodNotAllowed = (_req, res) => {
            res.status(405).json({
                jsonrpc: "2.0",
                error: { code: -32000, message: "Method not allowed. Use POST." },
                id: null,
            });
        };
        this.app.get("/mcp", methodNotAllowed);
        this.app.delete("/mcp", methodNotAllowed);
    }
    async start(serverFactory) {
        this.serverFactory = serverFactory;
        await new Promise((resolve, reject) => {
            this.httpServer = this.app.listen(this.port, "0.0.0.0", () => {
                info(`Streamable HTTP MCP listening on 0.0.0.0:${this.port}/mcp`);
                resolve();
            });
            this.httpServer.once("error", reject);
        });
    }
    async stop() {
        const server = this.httpServer;
        this.httpServer = null;
        this.serverFactory = null;
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((caught) => caught ? reject(caught) : resolve());
            });
        }
    }
}
