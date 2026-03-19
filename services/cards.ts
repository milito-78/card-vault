import { AESEncryptionKey } from 'expo-crypto';
import { encryptData, decryptData } from './encryption';
import * as storage from './storage';
import { getDataKey } from './auth';

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
  if (!dataKey) return [];

  const encrypted = await storage.getCardsEncrypted();
  if (!encrypted) return [];

  try {
    const json = await decryptData(encrypted, dataKey);
    const parsed = JSON.parse(json) as Card[];
    return parsed.map((c) => ({ ...c, notes: c.notes ?? '' }));
  } catch {
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
  const cards = await getCards();
  const newCard: Card = {
    ...card,
    id: generateId(),
    createdAt: Date.now(),
  };
  cards.push(newCard);
  await saveCards(cards);
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
