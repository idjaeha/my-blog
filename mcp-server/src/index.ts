import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { getPostTool } from "./tools/get-post.js";
import { listPostsTool } from "./tools/list-posts.js";
import { createPostTool } from "./tools/create-post.js";
import { editPostMetadataTool } from "./tools/edit-post-metadata.js";
import { publishPostTool } from "./tools/publish-post.js";
import { deletePostTool } from "./tools/delete-post.js";
import { listTagsTool } from "./tools/list-tags.js";
import { listCategoriesTool } from "./tools/list-categories.js";

const server = new McpServer({
  name: "blog-mcp",
  version: "0.1.0",
});

// Register all tools individually for proper type inference
server.tool(
  getPostTool.name,
  getPostTool.description,
  getPostTool.inputSchema.shape,
  getPostTool.handler,
);

server.tool(
  listPostsTool.name,
  listPostsTool.description,
  listPostsTool.inputSchema.shape,
  listPostsTool.handler,
);

server.tool(
  createPostTool.name,
  createPostTool.description,
  createPostTool.inputSchema.shape,
  createPostTool.handler,
);

server.tool(
  editPostMetadataTool.name,
  editPostMetadataTool.description,
  editPostMetadataTool.inputSchema.shape,
  editPostMetadataTool.handler,
);

server.tool(
  publishPostTool.name,
  publishPostTool.description,
  publishPostTool.inputSchema.shape,
  publishPostTool.handler,
);

server.tool(
  deletePostTool.name,
  deletePostTool.description,
  deletePostTool.inputSchema.shape,
  deletePostTool.handler,
);

server.tool(
  listTagsTool.name,
  listTagsTool.description,
  listTagsTool.inputSchema.shape,
  listTagsTool.handler,
);

server.tool(
  listCategoriesTool.name,
  listCategoriesTool.description,
  listCategoriesTool.inputSchema.shape,
  listCategoriesTool.handler,
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("blog-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
