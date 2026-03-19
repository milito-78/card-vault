import iranBanks from '@/data/iranBanks.json';

export type BankId =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'unknown'
  | (typeof iranBanks)[number]['logo'];

export type BankInfo = {
  bankId: BankId;
  source: 'iran' | 'global' | 'unknown';
};

const GLOBAL_PATTERNS: { pattern: RegExp; id: BankId }[] = [
  { pattern: /^4/, id: 'visa' },
  { pattern: /^(51|52|53|54|55)/, id: 'mastercard' },
  { pattern: /^(222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/, id: 'mastercard' },
  { pattern: /^(34|37)/, id: 'amex' },
  { pattern: /^6011/, id: 'discover' },
  { pattern: /^65/, id: 'discover' },
  { pattern: /^64[4-9]/, id: 'discover' },
  { pattern: /^622(1[2-6]|[2-8]\d|9[0-2][0-5])/, id: 'discover' },
];

/**
 * Detect bank/card network from card number.
 * Iran banks first, then global (Visa, Mastercard, etc.), else unknown.
 */
export function getBankFromCardNumber(cardNumber: string): BankInfo {
  const digits = String(cardNumber).replace(/\D/g, '');
  if (!digits.length) return { bankId: 'unknown', source: 'unknown' };

  // 1. Check Iran banks (Shetab)
  for (const bank of iranBanks as { card_regex: string; logo: string }[]) {
    try {
      if (new RegExp(bank.card_regex).test(digits)) {
        return { bankId: bank.logo as BankId, source: 'iran' };
      }
    } catch {
      // skip invalid regex
    }
  }

  // 2. Check global card networks
  for (const { pattern, id } of GLOBAL_PATTERNS) {
    if (pattern.test(digits)) {
      return { bankId: id, source: 'global' };
    }
  }

  return { bankId: 'unknown', source: 'unknown' };
}
