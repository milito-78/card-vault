import { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { getCards, maskCardNumber, type Card } from '@/services/cards';
import { BankLogo } from '@/components/BankLogo';
import * as storage from '@/services/storage';
import { debugLog } from '@/services/debugLog';
import { useAuth } from '@/contexts/AuthContext';
import { useCardsRefresh } from '@/contexts/CardsRefreshContext';
import { useLocale } from '@/contexts/LocaleContext';

export default function CardListScreen() {
  const { t } = useLocale();
  const { refreshTrigger } = useCardsRefresh();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'bankName' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { lock } = useAuth();

  useFocusEffect(
    useCallback(() => {
      debugLog('CardList: useFocusEffect triggered');
      loadCards();
      loadSortPreference();
    }, [refreshTrigger])
  );

  async function loadCards() {
    debugLog('CardList: loadCards start');
    setLoading(true);
    const data = await getCards();
    debugLog('CardList: loadCards got', data.length, 'cards');
    setCards(data);
    setLoading(false);
  }

  async function loadSortPreference() {
    const pref = await storage.getSortPreference();
    setSortBy(pref.sortBy);
    setSortOrder(pref.sortOrder);
  }

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    const q = searchQuery.trim().toLowerCase();
    const digitQuery = searchQuery.replace(/\D/g, '');
    return cards.filter((c) => {
      const matchesBankName = c.bankName.toLowerCase().includes(q);
      const matchesLast4 =
        digitQuery.length > 0 && c.cardNumber.slice(-4).includes(digitQuery);
      return matchesBankName || matchesLast4;
    });
  }, [cards, searchQuery]);

  const sortedCards = useMemo(() => {
    return [...filteredCards].sort((a, b) => {
      if (sortBy === 'bankName') {
        const cmp = a.bankName.localeCompare(b.bankName);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      const cmp = a.createdAt - b.createdAt;
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredCards, sortBy, sortOrder]);

  function renderCard({ item }: { item: Card }) {
    return (
      <Link href={`/card/${item.id}`} asChild>
        <Pressable className="mb-3 flex-row items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-800 p-4 active:opacity-80">
          <BankLogo cardNumber={item.cardNumber} size={44} />
          <View className="flex-1">
          <Text className="text-lg font-semibold text-white">
            {item.bankName}
          </Text>
          <Text className="mt-1 font-mono text-neutral-400">
            {maskCardNumber(item.cardNumber)}
          </Text>
          <Text className="mt-1 text-sm text-neutral-500">
            {t('cards.exp')}: {item.expDate}
          </Text>
          </View>
        </Pressable>
      </Link>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-900">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-900">
      <View className="flex-row items-center justify-between border-b border-neutral-800 px-4 py-4">
        <Text className="text-xl font-bold text-white">{t('cards.myCards')}</Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => lock()}
            className="rounded-lg px-3 py-2 active:bg-neutral-800"
          >
            <SymbolView
              name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
              size={22}
              tintColor="#a3a3a3"
            />
          </Pressable>
          <Link href="/card/add" asChild>
            <Pressable className="rounded-lg bg-blue-600 px-4 py-2 active:bg-blue-700">
              <Text className="font-semibold text-white">{t('cards.add')}</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {cards.length > 0 ? (
        <View className="border-b border-neutral-800 px-4 pb-3">
          <TextInput
            className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-white"
            placeholder={t('cards.searchPlaceholder')}
            placeholderTextColor="#737373"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      ) : null}

      {cards.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <SymbolView
            name={{ ios: 'creditcard', android: 'credit_card', web: 'credit_card' }}
            size={64}
            tintColor="#525252"
          />
          <Text className="mt-4 text-center text-lg font-medium text-white">
            {t('cards.noCards')}
          </Text>
          <Text className="mt-2 text-center text-neutral-400">
            {t('cards.addFirstCard')}
          </Text>
          <Link href="/card/add" asChild>
            <Pressable className="mt-6 rounded-xl bg-blue-600 px-6 py-3 active:bg-blue-700">
              <Text className="font-semibold text-white">{t('cards.addCard')}</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <FlatList
          data={sortedCards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            searchQuery ? (
              <View className="py-8">
                <Text className="text-center text-neutral-400">
                  {t('cards.noMatch', { query: searchQuery })}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
