const { z } = require('zod');

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().trim().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  TMDB_API_KEY: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().min(1).optional(),
  ),
});

function loadConfig(environment = process.env) {
  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid server configuration: ${details}`);
  }

  return {
    ...parsed.data,
    isProduction: parsed.data.NODE_ENV === 'production',
  };
}

module.exports = { loadConfig };
