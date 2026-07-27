import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { toolList } from "./toolList.js";
import { error, info } from "./logger.js";
import { createToolContext, getToolHandler, } from "./tools/tools.js";
export class DiscordMCPServer {
    client;
    transport;
    toolContext;
    constructor(client, transport) {
        this.client = client;
        this.transport = transport;
        this.toolContext = createToolContext(client);
    }
    createServer() {
        const server = new Server({
            name: "MCP-Discord",
            version: "1.4.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: toolList,
        }));
        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                const handler = getToolHandler(name);
                if (!handler) {
                    throw new Error(`Unknown tool: ${name}`);
                }
                return await handler(args, this.toolContext);
            }
            catch (caught) {
                if (caught instanceof z.ZodError) {
                    return {
                        content: [{
                                type: "text",
                                text: `Invalid arguments: ${caught.errors
                                    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
                                    .join(", ")}`,
                            }],
                        isError: true,
                    };
                }
                const message = caught instanceof Error ? caught.message : "Unknown error";
                error(`Error executing ${name}: ${message}`);
                return {
                    content: [{ type: "text", text: `Error executing tool: ${message}` }],
                    isError: true,
                };
            }
        });
        return server;
    }
    async start() {
        info(`Discord client ready: ${this.client.isReady()}`);
        await this.transport.start(() => this.createServer());
    }
    async stop() {
        await this.transport.stop();
    }
}
