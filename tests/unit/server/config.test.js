import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { loadConfig } = require('../../../server/config');

describe('server configuration', () => {
  it('uses safe defaults and treats a blank optional API key as unset', () => {
    expect(loadConfig({ TMDB_API_KEY: '   ' })).toEqual({
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 3000,
      TMDB_API_KEY: undefined,
      isProduction: false,
    });
  });

  it('rejects an invalid port with a clear configuration error', () => {
    expect(() => loadConfig({ PORT: '70000' })).toThrow('Invalid server configuration: PORT');
  });
});
