import { Transform, TransformFnParams } from 'class-transformer';

/**
 * Coerce a query-string value into a real boolean.
 *
 * `@Type(() => Boolean)` is wrong for query params: class-transformer calls
 * `Boolean(value)`, and every non-empty string — including `'false'` — is
 * truthy, so `?verified=false` silently became `verified: true`. Anything the
 * caller does not recognise as a boolean is passed through untouched so
 * `@IsBoolean()` still rejects it.
 */
export function ToBoolean(): PropertyDecorator {
  return Transform(({ obj, key }: TransformFnParams) => {
    // Read the *raw* query value rather than `value`: the global
    // ValidationPipe runs with `enableImplicitConversion`, which has already
    // turned `'false'` into `true` by the time a transform sees `value`.
    const raw: unknown = (obj as Record<string, unknown>)[key];
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'string') {
      const normalized = raw.trim().toLowerCase();
      if (['true', '1', 'yes'].includes(normalized)) return true;
      if (['false', '0', 'no'].includes(normalized)) return false;
    }
    return raw;
  });
}
