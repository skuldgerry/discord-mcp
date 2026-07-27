import { Client } from "discord.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export type ToolResponse = CallToolResult;

export interface ToolContext {
  client: Client;
}

export type ToolHandler<T = any> = (args: T, context: ToolContext) => Promise<ToolResponse>; 
