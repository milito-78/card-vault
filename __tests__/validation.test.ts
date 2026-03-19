/**
 * TC-CARD-002: Add Card validation logic tests
 * Based on V1-TESTCASES.md
 */

function formatCardNumber(value: string) {
  const cleaned = value.replace(/\D/g, '').slice(0, 19);
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').trim();
}

function formatExpDate(value: string) {
  const cleaned = value.replace(/\D/g, '').slice(0, 4);
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  }
  return cleaned;
}

function validateCardForm(data: {
  bankName: string;
  cardNumber: string;
  cvv2: string;
  expDate: string;
}): string | null {
  if (!data.bankName.trim()) return 'Bank name is required';
  const cleanedNumber = data.cardNumber.replace(/\D/g, '');
  if (cleanedNumber.length < 13) return 'Card number is invalid';
  if (!data.cvv2.trim()) return 'CVV is required';
  if (data.expDate.replace(/\D/g, '').length !== 4) return 'Expiry date must be MM/YY';
  return null;
}

describe('Card form validation', () => {
  it('TC-CARD-002: rejects empty bank name', () => {
    expect(
      validateCardForm({
        bankName: '',
        cardNumber: '4111111111111111',
        cvv2: '123',
        expDate: '12/28',
      })
    ).toBe('Bank name is required');
  });

  it('TC-CARD-002: rejects invalid card number (too short)', () => {
    expect(
      validateCardForm({
        bankName: 'Test Bank',
        cardNumber: '1234',
        cvv2: '123',
        expDate: '12/28',
      })
    ).toBe('Card number is invalid');
  });

  it('TC-CARD-002: rejects empty CVV', () => {
    expect(
      validateCardForm({
        bankName: 'Test Bank',
        cardNumber: '4111111111111111',
        cvv2: '',
        expDate: '12/28',
      })
    ).toBe('CVV is required');
  });

  it('TC-CARD-002: rejects invalid expiry (incomplete)', () => {
    expect(
      validateCardForm({
        bankName: 'Test Bank',
        cardNumber: '4111111111111111',
        cvv2: '123',
        expDate: '1',
      })
    ).toBe('Expiry date must be MM/YY');
  });

  it('accepts valid form data', () => {
    expect(
      validateCardForm({
        bankName: 'Test Bank',
        cardNumber: '4111111111111111',
        cvv2: '123',
        expDate: '12/28',
      })
    ).toBeNull();
  });
});

describe('formatCardNumber', () => {
  it('formats card number with spaces', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
  });

  it('strips non-digits', () => {
    expect(formatCardNumber('4111-1111-1111-1111')).toBe('4111 1111 1111 1111');
  });
});

describe('formatExpDate', () => {
  it('formats expiry as MM/YY', () => {
    expect(formatExpDate('1228')).toBe('12/28');
  });

  it('handles partial input', () => {
    expect(formatExpDate('12')).toBe('12/');
  });
});
