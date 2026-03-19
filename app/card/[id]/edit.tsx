import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CardForm } from '@/components/CardForm';
import { getCards, updateCard } from '@/services/cards';
import { useCardsRefresh } from '@/contexts/CardsRefreshContext';
import { useLocale } from '@/contexts/LocaleContext';
import type { Card } from '@/services/cards';

export default function EditCardScreen() {
  const { t } = useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { refreshCards } = useCardsRefresh();
  const [card, setCard] = useState<Card | null>(null);

  useEffect(() => {
    loadCard();
  }, [id]);

  async function loadCard() {
    if (!id) return;
    const cards = await getCards();
    const found = cards.find((c) => c.id === id);
    setCard(found || null);
  }

  async function handleSubmit(data: Omit<Card, 'id' | 'createdAt'>) {
    if (!id) return;
    await updateCard(id, data);
    refreshCards();
    router.back();
  }

  if (!id) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-900">
        <Text className="text-neutral-400">{t('common.invalidCard')}</Text>
      </View>
    );
  }

  if (card === null) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-900">
        <Text className="text-neutral-400">{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <CardForm
      initialCard={card}
      onSubmit={handleSubmit}
      submitLabel={t('cardForm.updateCard')}
    />
  );
}
