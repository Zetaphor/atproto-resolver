import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";
import { DidResolver, HandleResolver } from "npm:@atproto/identity";

async function getServiceEndpoint(handle: string): Promise<string> {
  const hdlres = new HandleResolver();
  const didres = new DidResolver({});

  const did = await hdlres.resolve(handle);
  if (!did) {
    throw new Error(`Could not resolve handle: ${handle}`);
  }

  const doc = await didres.resolve(did);
  if (!doc) {
    throw new Error(`Could not resolve DID document for: ${did}`);
  }

  const serviceEndpoint = doc.service?.find(s => s.type === "AtprotoPersonalDataServer")?.serviceEndpoint;
  if (!serviceEndpoint) {
    throw new Error(`Service endpoint not found for handle: ${handle}`);
  }

  return serviceEndpoint as string;
}

async function resolveHandleWithPds(handle: string): Promise<{ did: string, pdsUrl: string, bskyPds: boolean }> {
  try {
    const serviceEndpoint = await getServiceEndpoint(handle);
    const RESOLVE_HANDLE_URL = `${serviceEndpoint}/xrpc/com.atproto.identity.resolveHandle`;

    const response = await axiod.get(RESOLVE_HANDLE_URL, {
      params: { handle }
    });
    return {
      did: response.data.did,
      pdsUrl: serviceEndpoint,
      bskyPds: serviceEndpoint.endsWith("bsky.network")
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to resolve handle: ${error.message}`);
    }
    throw new Error("Failed to resolve handle: Unknown error");
  }
}

// Add CORS headers to all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Add helper function to create consistent responses
function createResponse(body: unknown, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...additionalHeaders,
    },
  });
}

async function handleRequest(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // GET request - handle comes from query parameter
    if (request.method === "GET") {
      const handle = url.searchParams.get("handle");
      if (!handle) {
        return createResponse({ error: "Handle parameter is required" }, 400);
      }

      const result = await resolveHandleWithPds(handle);
      return createResponse({ handle, ...result });
    }

    // POST request - handle comes from request body
    if (request.method === "POST") {
      const { handle } = await request.json();
      if (!handle) {
        return createResponse({ error: "Handle is required in request body" }, 400);
      }

      const result = await resolveHandleWithPds(handle);
      return createResponse({ handle, ...result });
    }

    return createResponse({ error: "Method not allowed" }, 405);
  } catch (error) {
    console.error("Error processing request:", error);
    return createResponse({
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
}

const PORT = 9000;
const HOSTNAME = "0.0.0.0";

console.log(`Server running on http://${HOSTNAME}:${PORT}`);
Deno.serve({ port: PORT, hostname: HOSTNAME }, handleRequest);
