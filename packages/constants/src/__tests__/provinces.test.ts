import { describe, it, expect } from 'vitest';
import { IRAN_PROVINCES } from '../provinces';

describe('Iran Provinces', () => {
  it('should have 31 provinces', () => {
    expect(IRAN_PROVINCES).toHaveLength(31);
  });
  it('should include Tehran', () => {
    expect(IRAN_PROVINCES).toContain('تهران');
  });
});
