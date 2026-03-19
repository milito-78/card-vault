import { AESEncryptionKey } from 'expo-crypto';
import { encryptData, decryptData } from './encryption';
import * as storage from './storage';
import { getDataKey } from './auth';
import { debugLog, debugLogError } from './debugLog';

export interface Card {
  id: string;
  bankName: string;
  cardNumber: string;
  cvv2: string;
  expDate: string;
  password: string;
  notes: string;
  createdAt: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function getCards(): Promise<Card[]> {
  const dataKey = getDataKey();
  debugLog('getCards: dataKey exists?', !!dataKey);
  if (!dataKey) {
    debugLog('getCards: no dataKey, returning []');
    return [];
  }

  const encrypted = await storage.getCardsEncrypted();
  debugLog('getCards: encrypted length', encrypted?.length ?? 0);
  if (!encrypted) {
    debugLog('getCards: no encrypted data, returning []');
    return [];
  }

  try {
    const json = await decryptData(encrypted, dataKey);
    const parsed = JSON.parse(json) as Card[];
    const cards = parsed.map((c) => ({ ...c, notes: c.notes ?? '' }));
    debugLog('getCards: decrypted', cards.length, 'cards');
    return cards;
  } catch (e) {
    debugLogError('getCards decrypt', e);
    return [];
  }
}

async function saveCards(cards: Card[]): Promise<void> {
  const dataKey = getDataKey();
  if (!dataKey) throw new Error('Not unlocked');

  const json = JSON.stringify(cards);
  const encrypted = await encryptData(json, dataKey);
  await storage.setCardsEncrypted(encrypted);
}

export async function addCard(card: Omit<Card, 'id' | 'createdAt'>): Promise<Card> {
  debugLog('addCard: start', card.bankName);
  const cards = await getCards();
  debugLog('addCard: existing cards count', cards.length);
  const newCard: Card = {
    ...card,
    id: generateId(),
    createdAt: Date.now(),
  };
  cards.push(newCard);
  debugLog('addCard: saving', cards.length, 'cards');
  await saveCards(cards);
  debugLog('addCard: save complete, verifying...');
  const verify = await storage.getCardsEncrypted();
  debugLog('addCard: verify read length', verify?.length ?? 0);
  return newCard;
}

export async function updateCard(id: string, updates: Partial<Card>): Promise<Card | null> {
  const cards = await getCards();
  const index = cards.findIndex((c) => c.id === id);
  if (index === -1) return null;

  cards[index] = { ...cards[index], ...updates };
  await saveCards(cards);
  return cards[index];
}

export async function deleteCard(id: string): Promise<boolean> {
  const cards = await getCards();
  const filtered = cards.filter((c) => c.id !== id);
  if (filtered.length === cards.length) return false;

  await saveCards(filtered);
  return true;
}

export function maskCardNumber(number: string): string {
  const cleaned = number.replace(/\D/g, '');
  if (cleaned.length < 4) return '••••';
  return `•••• •••• •••• ${cleaned.slice(-4)}`;
}
