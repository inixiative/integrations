import { describe, expect, it } from 'bun:test';
import { familyProducts } from '../src/familyProducts';
import { findProvider, providerSchema } from '../src/index';
import { isFamilyManaged } from '../src/isFamilyManaged';

describe('Google family catalog', () => {
  it('declares google as a consent family with endpoints and no operations', () => {
    const google = findProvider('google');
    expect(google?.operations).toEqual([]);
    expect(google?.authMethods).toEqual(['oauth2']);
    expect(google?.oauth).toEqual({
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
    });
    expect(providerSchema.options).toContain('google');
    expect(providerSchema.options).toContain('gmail');
  });
  it('places Gmail and Drive under google with consent scopes', () => {
    expect(familyProducts('google').map((item) => item.key)).toEqual(['gmail', 'drive']);
    expect(findProvider('gmail')).toMatchObject({
      family: 'google',
      oauthScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      operations: [{ key: 'messages.read', resourceKind: 'label' }],
    });
    expect(findProvider('drive')).toMatchObject({
      family: 'google',
      oauthScopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
      operations: [{ key: 'files.read', resourceKind: 'file' }],
    });
  });
  it('marks families and their products as consent-managed only', () => {
    expect(
      ['google', 'gmail', 'drive'].map((key) => isFamilyManaged(providerSchema.parse(key))),
    ).toEqual([true, true, true]);
    expect(isFamilyManaged('slack')).toBe(false);
    expect(isFamilyManaged(null)).toBe(false);
  });
});
