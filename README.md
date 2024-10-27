# AT Protocol Handle Resolver

A simple Deno-based HTTP service that resolves AT Protocol handles (Bluesky usernames) to their DID and PDS (Personal Data Server) endpoints.

A live version of this service is hosted at https://resolver.atdev.pro

## Features

- Resolves handles to DIDs and PDS endpoints
- Identifies if the PDS is the official Bluesky PDS
- Supports both GET and POST requests
- CORS-enabled for browser usage

## Prerequisites

- [Deno](https://deno.com/) 1.37 or later

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/atproto-handle-resolver.git
cd atproto-handle-resolver
```

## Usage

### Starting the Server

Run the server using Deno:
```bash
deno task start
# or
deno run --allow-net --allow-env --allow-read main.ts
```

### API Endpoints

#### GET /resolve/:handle

Resolve a handle using a GET request:

```bash
curl http://localhost:8000/resolve/alice.bsky.social
```
Example Response:

```json
{
  "handle": "zetaphor.com",
  "did": "did:plc:m6yjzpsxvue6uugpmzr7wosf",
  "pdsUrl": "https://pds.zetaphor.com",
  "bskyPds": true // true if the user is not on a self-hosted PDS aka bsky.social
}
```

#### POST /resolve

Resolve a handle using a POST request:

```bash
curl -X POST http://localhost:8000/resolve -H "Content-Type: application/json" -d '{"handle": "alice.bsky.social"}'
```

Response format is the same as the GET endpoint.