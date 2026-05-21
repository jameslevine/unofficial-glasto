import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('health endpoint', () => {
  it('responds with ok', async () => {
    const app = createApp();
    const server = app.listen(0);
    const { port } = server.address() as { port: number };
    try {
      const res = await fetch(`http://localhost:${port}/v1/health`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ success: true, data: { ok: true } });
    } finally {
      server.close();
    }
  });
});
