import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsBoolean, IsOptional } from 'class-validator';
import { ToBoolean } from './to-boolean.decorator';

class QueryFixture {
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  verified?: boolean;
}

/**
 * The pipe options here mirror the global ValidationPipe in main.ts —
 * `enableImplicitConversion` is what previously turned `'false'` into `true`.
 */
function parse(query: Record<string, unknown>) {
  return plainToInstance(QueryFixture, query, {
    enableImplicitConversion: true,
  });
}

describe('ToBoolean', () => {
  it.each([
    ['true', true],
    ['TRUE', true],
    ['1', true],
    ['yes', true],
    ['false', false],
    ['False', false],
    ['0', false],
    ['no', false],
  ])('coerces %s to %s', (input, expected) => {
    expect(parse({ verified: input }).verified).toBe(expected);
  });

  it('passes real booleans through', () => {
    expect(parse({ verified: true }).verified).toBe(true);
    expect(parse({ verified: false }).verified).toBe(false);
  });

  it('leaves the property undefined when absent', () => {
    const dto = parse({});
    expect(dto.verified).toBeUndefined();
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects values that are not boolean-ish', () => {
    const dto = parse({ verified: 'maybe' });
    expect(validateSync(dto)).not.toHaveLength(0);
  });
});
