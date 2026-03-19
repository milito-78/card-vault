/**
 * TC-CARD: Card Management tests
 * Based on V1-TESTCASES.md
 */

import * as cards from '@/services/cards';
import * as auth from '@/services/auth';
import * as storage from '@/services/storage';
import * as encryption from '@/services/encryption';

const mockDataKey = { _mock: true };

jest.mock('@/services/auth', () => ({
  getDataKey: jest.fn(),
}));

jest.mock('@/services/storage', () => ({
  getCardsEncrypted: jest.fn(),
  setCardsEncrypted: jest.fn(),
}));

jest.mock('@/services/encryption', () => ({
  encryptData: jest.fn(),
  decryptData: jest.fn(),
}));

describe('maskCardNumber', () => {
  it('TC-CARD-003: masks full card number, shows last 4 digits', () => {
    expect(cards.maskCardNumber('4111111111111111')).toBe('•••• •••• •••• 1111');
    expect(cards.maskCardNumber('1234567890123456')).toBe('•••• •••• •••• 3456');
  });

  it('returns •••• for very short input', () => {
    expect(cards.maskCardNumber('123')).toBe('••••');
  });

  it('handles card number with spaces', () => {
    expect(cards.maskCardNumber('4111 1111 1111 1111')).toBe('•••• •••• •••• 1111');
  });
});

describe('getCards', () => {
  beforeEach(() => {
    jest.mocked(auth.getDataKey).mockReturnValue(mockDataKey as any);
  });

  it('returns empty array when not unlocked', async () => {
    jest.mocked(auth.getDataKey).mockReturnValue(null);
    const result = await cards.getCards();
    expect(result).toEqual([]);
  });

  it('returns empty array when no encrypted data', async () => {
    jest.mocked(storage.getCardsEncrypted).mockResolvedValue(null);
    const result = await cards.getCards();
    expect(result).toEqual([]);
  });

  it('returns parsed cards when data exists', async () => {
    const cardsData = [
      { id: '1', bankName: 'Test', cardNumber: '4111111111111111', cvv2: '123', expDate: '12/28', password: '', notes: '', createdAt: 1 },
    ];
    jest.mocked(storage.getCardsEncrypted).mockResolvedValue('encrypted');
    jest.mocked(encryption.decryptData).mockResolvedValue(JSON.stringify(cardsData));
    const result = await cards.getCards();
    expect(result).toHaveLength(1);
    expect(result[0].bankName).toBe('Test');
    expect(result[0].notes).toBe('');
  });

  it('adds empty notes to cards without notes', async () => {
    const cardsData = [
      { id: '1', bankName: 'Test', cardNumber: '4111111111111111', cvv2: '123', expDate: '12/28', password: '', createdAt: 1 },
    ];
    jest.mocked(storage.getCardsEncrypted).mockResolvedValue('encrypted');
    jest.mocked(encryption.decryptData).mockResolvedValue(JSON.stringify(cardsData));
    const result = await cards.getCards();
    expect(result[0].notes).toBe('');
  });

  it('returns empty array on decrypt error', async () => {
    jest.mocked(storage.getCardsEncrypted).mockResolvedValue('encrypted');
    jest.mocked(encryption.decryptData).mockRejectedValue(new Error('decrypt failed'));
    const result = await cards.getCards();
    expect(result).toEqual([]);
  });
});

describe('addCard', () => {
  beforeEach(() => {
    jest.mocked(auth.getDataKey).mockReturnValue(mockDataKey as any);
    jest.mocked(storage.getCardsEncrypted).mockResolvedValue(null);
    jest.mocked(encryption.decryptData).mockResolvedValue('[]');
    jest.mocked(encryption.encryptData).mockResolvedValue('encrypted');
  });

  it('adds new card and saves', async () => {
    const cardData = {
      bankName: 'Test Bank',
      cardNumber: '4111111111111111',
      cvv2: '123',
      expDate: '12/28',
      password: '',
      notes: '',
    };
    const result = await cards.addCard(cardData);
    expect(result.bankName).toBe('Test Bank');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(storage.setCardsEncrypted).toHaveBeenCalled();
  });
});

describe('updateCard', () => {
  beforeEach(() => {
    jest.mocked(auth.getDataKey).mockReturnValue(mockDataKey as any);
    jest.mocked(encryption.encryptData).mockResolvedValue('encrypted');
  });

  it('returns null when card not found', async () => {
    jest.mocked(storage.getCardsEncrypted).mockResolvedValue('encrypted');
    jest.mocked(encryption.decryptData).mockResolvedValue(JSON.stringify([]));
    const result = await cards.updateCard('nonexistent', { bankName: 'New' });
    expect(result).toBeNull();
  });

  it('updates card when found', async () => {
    const existing = [
      { id: '1', bankName: 'Old', cardNumber: '4111111111111111', cvv2: '123', expDate: '12/28', password: '', notes: '', createdAt: 1 },
    ];
    jest.mocked(storage.getCardsEncrypted).mockResolvedValue('encrypted');
    jest.mocked(encryption.decryptData).mockResolvedValue(JSON.stringify(existing));
    const result = await cards.updateCard('1', { bankName: 'Updated Bank' });
    expect(result?.bankName).toBe('Updated Bank');
    expect(storage.setCardsEncrypted).toHaveBeenCalled();
  });
});

describe('deleteCard', () => {
  beforeEach(() => {
    jest.mocked(auth.getDataKey).mockReturnValue(mockDataKey as any);
    jest.mocked(encryption.encryptData).mockResolvedValue('encrypted');
  });

  it('returns false when card not found', async () => {
    jest.mocked(storage.getCardsEncrypted).mockResolvedValue('encrypted');
    jest.mocked(encryption.decryptData).mockResolvedValue(JSON.stringify([]));
    const result = await cards.deleteCard('nonexistent');
    expect(result).toBe(false);
  });

  it('deletes card when found', async () => {
    const existing = [
      { id: '1', bankName: 'Test', cardNumber: '4111111111111111', cvv2: '123', expDate: '12/28', password: '', notes: '', createdAt: 1 },
    ];
    jest.mocked(storage.getCardsEncrypted).mockResolvedValue('encrypted');
    jest.mocked(encryption.decryptData).mockResolvedValue(JSON.stringify(existing));
    const result = await cards.deleteCard('1');
    expect(result).toBe(true);
    expect(storage.setCardsEncrypted).toHaveBeenCalled();
  });
});
