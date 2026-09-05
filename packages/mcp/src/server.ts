#!/usr/bin/env node
import * as process from 'node:process';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { McpMemoryService } from './mcp-service.js';

export function createMcpServer(projectRoot: string = process.cwd()): Server {
  const service = new McpMemoryService(projectRoot);

  const server = new Server(
    {
      name: 'emeory',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools according to ADR-016 (Narrow and typed tools)
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'get_project_context',
          description:
            'Retrieve high-level overview of the project: identity, detected tech stack, and components.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'search_project_memory',
          description:
            'Token-efficient search over project memory. Returns relevant facts, architecture context, and documentation.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The natural language question or topic to search.',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_architecture',
          description:
            'Get detailed architecture component structure, entrypoints, and dependencies.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_technical_decisions',
          description:
            'Retrieve list of accepted and proposed architectural decisions (ADRs).',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_project_conventions',
          description:
            'Retrieve coding conventions and architectural patterns detected for this project.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'record_technical_decision',
          description:
            'Record a new technical architectural decision (ADR) into the project persistent memory.',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Title of the architectural decision' },
              context: { type: 'string', description: 'Context and problem statement' },
              decision: { type: 'string', description: 'The decision that was made' },
              rationale: { type: 'string', description: 'Why this decision was chosen' },
              status: {
                type: 'string',
                enum: ['accepted', 'proposed'],
                description: 'Status of the decision',
              },
            },
            required: ['title', 'context', 'decision', 'rationale'],
          },
        },
      ],
    };
  });

  // Tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'get_project_context': {
          const result = service.getProjectContext();
          return { content: [{ type: 'text', text: result }] };
        }

        case 'search_project_memory': {
          const query = String(args?.['query'] || '');
          const result = service.searchProjectMemory(query);
          return { content: [{ type: 'text', text: result }] };
        }

        case 'get_architecture': {
          const result = service.getArchitecture();
          return { content: [{ type: 'text', text: result }] };
        }

        case 'get_technical_decisions': {
          const result = service.getTechnicalDecisions();
          return { content: [{ type: 'text', text: result }] };
        }

        case 'get_project_conventions': {
          const result = service.getProjectConventions();
          return { content: [{ type: 'text', text: result }] };
        }

        case 'record_technical_decision': {
          const title = String(args?.['title'] || '');
          const context = String(args?.['context'] || '');
          const decision = String(args?.['decision'] || '');
          const rationale = String(args?.['rationale'] || '');
          const status = (args?.['status'] as 'proposed' | 'accepted') || 'accepted';

          const result = service.recordTechnicalDecision(
            title,
            context,
            decision,
            rationale,
            status
          );
          return { content: [{ type: 'text', text: result }] };
        }

        default:
          return {
            isError: true,
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          };
      }
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error executing tool ${name}: ${err?.message || err}` }],
      };
    }
  });

  return server;
}

export async function runServer(): Promise<void> {
  const server = createMcpServer(process.cwd());
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[Project Memory MCP] Server running on stdio');
}

// Auto-start if invoked directly via CLI
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`) {
  runServer().catch((err) => {
    console.error('[Project Memory MCP] Fatal error:', err);
    process.exit(1);
  });
}
