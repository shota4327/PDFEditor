import { describe, it, expect } from 'vitest';
import { ensureFixturesExist } from '../e2e/helpers/fixtureGenerator';
import fs from 'fs';
import path from 'path';

describe('E2E Fixtures Generator', () => {
  it('generates sample PDF fixture files for E2E tests', async () => {
    await ensureFixturesExist();

    const fixturesDir = path.resolve(__dirname, '../e2e/fixtures');
    expect(fs.existsSync(path.join(fixturesDir, 'sample-1page.pdf'))).toBe(true);
    expect(fs.existsSync(path.join(fixturesDir, 'sample-2pages.pdf'))).toBe(true);
    expect(fs.existsSync(path.join(fixturesDir, 'sample-3pages.pdf'))).toBe(true);
  });
});
