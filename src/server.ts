import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Client } from "discord.js";
import { z } from "zod";
import { toolList } from "./toolList.js";
import { error, info } from "./logger.js";
import type { MCPTransport } from "./transport.js";
import {
  createToolContext,
  getToolHandler,
} from "./tools/tools.js";

export class DiscordMCPServer {
  private readonly toolContext;

  constructor(
    private readonly client: Client,
    private readonly transport: MCPTransport,
  ) {
    this.toolContext = createToolContext(client);
  }

  private createServer(): Server {
    const server = new Server(
      {
        name: "MCP-Discord",
        version: "1.4.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

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
      } catch (caught) {
        if (caught instanceof z.ZodError) {
          return {
            content: [{
              type: "text",
              text: `Invalid arguments: ${caught.errors
                .map((issue: z.ZodIssue) => `${issue.path.join(".")}: ${issue.message}`)
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

  async start(): Promise<void> {
    info(`Discord client ready: ${this.client.isReady()}`);
    await this.transport.start(() => this.createServer());
  }

  async stop(): Promise<void> {
    await this.transport.stop();
  }
}
