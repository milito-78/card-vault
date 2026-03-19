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
import { useAuth } from '@/contexts/AuthContext';

export default function CardListScreen() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { lock } = useAuth();

  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [])
  );

  async function loadCards() {
    setLoading(true);
    const data = await getCards();
    setCards(data);
    setLoading(false);
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

  function renderCard({ item }: { item: Card }) {
    return (
      <Link href={`/card/${item.id}`} asChild>
        <Pressable className="mb-3 rounded-xl border border-neutral-700 bg-neutral-800 p-4 active:opacity-80">
          <Text className="text-lg font-semibold text-white">
            {item.bankName}
          </Text>
          <Text className="mt-1 font-mono text-neutral-400">
            {maskCardNumber(item.cardNumber)}
          </Text>
          <Text className="mt-1 text-sm text-neutral-500">
            Exp: {item.expDate}
          </Text>
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
        <Text className="text-xl font-bold text-white">My Cards</Text>
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
              <Text className="font-semibold text-white">+ Add</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {cards.length > 0 ? (
        <View className="border-b border-neutral-800 px-4 pb-3">
          <TextInput
            className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-white"
            placeholder="Search by bank name or last 4 digits"
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
            No cards yet
          </Text>
          <Text className="mt-2 text-center text-neutral-400">
            Add your first card to get started
          </Text>
          <Link href="/card/add" asChild>
            <Pressable className="mt-6 rounded-xl bg-blue-600 px-6 py-3 active:bg-blue-700">
              <Text className="font-semibold text-white">Add Card</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <FlatList
          data={filteredCards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            searchQuery ? (
              <View className="py-8">
                <Text className="text-center text-neutral-400">
                  No cards match "{searchQuery}"
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
