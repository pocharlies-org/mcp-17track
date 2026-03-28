import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Track17Client, CARRIERS } from "./client.js";

export function createServer(token: string): { server: McpServer } {
  const server = new McpServer({
    name: "mcp-17track",
    version: "1.0.0",
  });

  const client = new Track17Client(token);

  // --- track: register + get info in one call ---
  server.registerTool(
    "track_package",
    {
      description:
        "Track a package by tracking number. Registers it with 17Track if needed, then returns tracking status and events. Supports UPS, Correos Express, DHL, FedEx, SEUR, MRW, GLS, DPD, Correos, and 2900+ other carriers.",
      inputSchema: {
        number: z.string().describe("Tracking number"),
        carrier: z
          .string()
          .optional()
          .describe(
            "Carrier name (optional, auto-detected). Values: ups, dhl, fedex, correos_express, correos, seur, mrw, gls_spain, dpd"
          ),
      },
    },
    async ({ number, carrier }) => {
      try {
        const carrierCode = carrier ? CARRIERS[carrier.toLowerCase()] : undefined;
        const trackParam = [{ number, ...(carrierCode ? { carrier: carrierCode } : {}) }];

        // Register first (idempotent - safe to call if already registered)
        await client.register(trackParam);

        // Then get tracking info
        const data = await client.getTrackInfo(trackParam);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed: ${(err as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // --- track_batch: track multiple packages ---
  server.registerTool(
    "track_batch",
    {
      description:
        "Track multiple packages at once (max 40). Registers and retrieves tracking info for all.",
      inputSchema: {
        packages: z
          .array(
            z.object({
              number: z.string().describe("Tracking number"),
              carrier: z
                .string()
                .optional()
                .describe("Carrier name (optional)"),
            })
          )
          .max(40)
          .describe("Array of packages to track"),
      },
    },
    async ({ packages }) => {
      try {
        const trackParams = packages.map((p) => ({
          number: p.number,
          ...(p.carrier && CARRIERS[p.carrier.toLowerCase()]
            ? { carrier: CARRIERS[p.carrier.toLowerCase()] }
            : {}),
        }));

        await client.register(trackParams);
        const data = await client.getTrackInfo(trackParams);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed: ${(err as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // --- list tracked packages ---
  server.registerTool(
    "list_tracked",
    {
      description:
        "List all packages currently being tracked. Filter by status: 0=all, 10=in transit, 20=expired, 30=pickup, 35=undelivered, 40=delivered, 50=alert",
      inputSchema: {
        page: z.number().optional().default(1).describe("Page number"),
        page_size: z.number().optional().default(20).describe("Items per page (max 40)"),
        status: z
          .number()
          .optional()
          .describe(
            "Filter by status: 0=all, 10=in transit, 20=expired, 30=pickup, 35=undelivered, 40=delivered, 50=alert"
          ),
      },
    },
    async ({ page, page_size, status }) => {
      try {
        const data = await client.getTrackList({
          page_no: page,
          page_size,
          track_status: status,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed: ${(err as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // --- stop tracking ---
  server.registerTool(
    "stop_tracking",
    {
      description: "Stop tracking a package (remove from 17Track)",
      inputSchema: {
        number: z.string().describe("Tracking number to stop tracking"),
      },
    },
    async ({ number }) => {
      try {
        const data = await client.deleteTrack([number]);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed: ${(err as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // --- list supported carriers ---
  server.registerTool(
    "list_carriers",
    {
      description: "List carrier shortcodes supported by this server for the 'carrier' parameter",
      inputSchema: {},
    },
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              Object.entries(CARRIERS).map(([name, code]) => ({ name, code })),
              null,
              2
            ),
          },
        ],
      };
    }
  );

  return { server };
}
