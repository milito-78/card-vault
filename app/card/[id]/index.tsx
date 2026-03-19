import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { getCards, deleteCard, maskCardNumber } from '@/services/cards';
import { BankLogo } from '@/components/BankLogo';
import type { Card } from '@/services/cards';
import { useCopyWithClear } from '@/hooks/useCopyWithClear';
import { useLocale } from '@/contexts/LocaleContext';

export default function CardDetailScreen() {
  const { t } = useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { copyWithClear } = useCopyWithClear();
  const [card, setCard] = useState<Card | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCard();
  }, [id]);

  async function loadCard() {
    if (!id) return;
    const cards = await getCards();
    const found = cards.find((c) => c.id === id);
    setCard(found || null);
  }

  function toggleReveal(field: string) {
    setRevealed((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  async function handleCopy(value: string, label = 'Value') {
    await copyWithClear(value, label);
  }

  async function handleDelete() {
    if (!card) return;
    const message = `Are you sure you want to delete ${card.bankName}?`;
    const confirmed =
      Platform.OS === 'web'
        ? window.confirm(message)
        : await new Promise<boolean>((resolve) => {
            Alert.alert('Delete Card', message, [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => resolve(true),
              },
            ]);
          });
    if (confirmed) {
      await deleteCard(card.id);
      router.back();
    }
  }

  if (!card) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-900">
        <Text className="text-neutral-400">{t('cardDetail.cardNotFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-neutral-900">
      <View className="flex-row items-center justify-between border-b border-neutral-800 px-4 py-4">
        <View className="flex-row items-center gap-3">
          <BankLogo cardNumber={card.cardNumber} size={48} />
          <Text className="text-xl font-bold text-white">{card.bankName}</Text>
        </View>
        <Pressable
          onPress={() => router.push(`/card/${id}/edit`)}
          className="rounded-lg px-3 py-2 active:bg-neutral-700"
        >
          <SymbolView
            name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
            size={22}
            tintColor="#a3a3a3"
          />
        </Pressable>
      </View>

      <View className="p-4">
        <View className="mb-4">
          <Text className="mb-2 text-sm text-neutral-400">{t('cardDetail.cardNumber')}</Text>
          <View className="flex-row items-center justify-between rounded-xl border border-neutral-700 bg-neutral-800 p-4">
            <Text className="font-mono text-lg text-white">
              {revealed.cardNumber
                ? card.cardNumber.replace(/(.{4})/g, '$1 ').trim()
                : maskCardNumber(card.cardNumber)}
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => toggleReveal('cardNumber')}
                className="rounded-lg px-3 py-2 active:bg-neutral-700"
              >
                <SymbolView
                  name={{
                    ios: revealed.cardNumber ? 'eye.slash' : 'eye',
                    android: revealed.cardNumber ? 'visibility_off' : 'visibility',
                    web: 'eye',
                  }}
                  size={22}
                  tintColor="#a3a3a3"
                />
              </Pressable>
              <Pressable
                onPress={() => handleCopy(card.cardNumber, 'Card number')}
                className="rounded-lg px-3 py-2 active:bg-neutral-700"
              >
                <SymbolView
                  name={{ ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }}
                  size={22}
                  tintColor="#a3a3a3"
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm text-neutral-400">{t('cardDetail.cvv2')}</Text>
          <View className="flex-row items-center justify-between rounded-xl border border-neutral-700 bg-neutral-800 p-4">
            <Text className="font-mono text-lg text-white">
              {revealed.cvv2 ? card.cvv2 : '•••'}
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => toggleReveal('cvv2')}
                className="rounded-lg px-3 py-2 active:bg-neutral-700"
              >
                <SymbolView
                  name={{
                    ios: revealed.cvv2 ? 'eye.slash' : 'eye',
                    android: revealed.cvv2 ? 'visibility_off' : 'visibility',
                    web: 'eye',
                  }}
                  size={22}
                  tintColor="#a3a3a3"
                />
              </Pressable>
              <Pressable
                onPress={() => handleCopy(card.cvv2, 'CVV')}
                className="rounded-lg px-3 py-2 active:bg-neutral-700"
              >
                <SymbolView
                  name={{ ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }}
                  size={22}
                  tintColor="#a3a3a3"
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm text-neutral-400">{t('cardDetail.expiryDate')}</Text>
          <View className="rounded-xl border border-neutral-700 bg-neutral-800 p-4">
            <Text className="font-mono text-lg text-white">{card.expDate}</Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm text-neutral-400">{t('cardDetail.atmPassword')}</Text>
          <View className="flex-row items-center justify-between rounded-xl border border-neutral-700 bg-neutral-800 p-4">
            <Text className="font-mono text-lg text-white">
              {card.password
                ? revealed.password
                  ? card.password
                  : '••••••••'
                : t('cardDetail.notSet')}
            </Text>
            <View className="flex-row gap-2">
              {card.password ? (
                <>
                  <Pressable
                    onPress={() => toggleReveal('password')}
                    className="rounded-lg px-3 py-2 active:bg-neutral-700"
                  >
                    <SymbolView
                      name={{
                        ios: revealed.password ? 'eye.slash' : 'eye',
                        android: revealed.password ? 'visibility_off' : 'visibility',
                        web: 'eye',
                      }}
                      size={22}
                      tintColor="#a3a3a3"
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => handleCopy(card.password, 'Password')}
                    className="rounded-lg px-3 py-2 active:bg-neutral-700"
                  >
                    <SymbolView
                      name={{ ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }}
                      size={22}
                      tintColor="#a3a3a3"
                    />
                  </Pressable>
                </>
              ) : null}
            </View>
          </View>
        </View>

        {card.notes ? (
          <View className="mb-4">
            <Text className="mb-2 text-sm text-neutral-400">{t('cardDetail.notes')}</Text>
            <View className="flex-row items-start justify-between rounded-xl border border-neutral-700 bg-neutral-800 p-4">
              <Text className="flex-1 text-white">{card.notes}</Text>
              <Pressable
                onPress={() => handleCopy(card.notes, 'Notes')}
                className="rounded-lg px-3 py-2 active:bg-neutral-700"
              >
                <SymbolView
                  name={{ ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }}
                  size={22}
                  tintColor="#a3a3a3"
                />
              </Pressable>
            </View>
          </View>
        ) : null}

        <Pressable
          onPress={handleDelete}
          className="mt-4 rounded-xl border border-red-900/50 bg-red-950/30 py-4 active:bg-red-950/50"
        >
          <Text className="text-center font-semibold text-red-500">
            {t('cardDetail.deleteCard')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
