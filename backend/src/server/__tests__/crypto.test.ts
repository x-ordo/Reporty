import { describe, it, expect } from 'vitest';
import { makePartnerKeyHash, comparePartnerKey } from '../crypto';

describe('Partner Key Hashing', () => {
  it('should generate a hash from a key', async () => {
    const key = 'my-secret-key';
    const hash = await makePartnerKeyHash(key);
    expect(hash).toBeDefined();
    expect(hash).not.toEqual(key);
  });

  it('should be able to compare a key with a hash', async () => {
    const key = 'my-secret-key';
    const hash = await makePartnerKeyHash(key);
    const result = await comparePartnerKey(key, hash);
    expect(result).toBe(true);
  });

  it('should return false for a wrong key', async () => {
    const key = 'my-secret-key';
    const wrongKey = 'my-wrong-key';
    const hash = await makePartnerKeyHash(key);
    const result = await comparePartnerKey(wrongKey, hash);
    expect(result).toBe(false);
  });
});
