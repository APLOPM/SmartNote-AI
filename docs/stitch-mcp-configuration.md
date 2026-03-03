# Stitch MCP Server Configuration

Use the following Codex MCP configuration to register the Stitch server:

```toml
[mcp_servers.stitch]
url = "https://stitch.googleapis.com/mcp"

[mcp_servers.stitch.http_headers]
"X-Goog-Api-Key" = "AQ.Ab8RN6JXynlOCsyzMtPo18u6O_zTsGdoLkNm5miLCaYU3ujJBQ"
```

## Recommended secure alternative

To avoid committing API keys directly in config, prefer an environment variable:

```toml
[mcp_servers.stitch]
url = "https://stitch.googleapis.com/mcp"

[mcp_servers.stitch.http_headers]
"X-Goog-Api-Key" = "${STITCH_API_KEY}"
```

Then export the key before starting Codex:

```bash
export STITCH_API_KEY="your-api-key"
```
