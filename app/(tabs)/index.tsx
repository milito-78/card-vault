import { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { getCards, maskCardNumber, type Card } from '@/services/cards';
import { useAuth } from '@/contexts/AuthContext';

export default function CardListScreen() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const { lock } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    setLoading(true);
    const data = await getCards();
    setCards(data);
    setLoading(false);
  }

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
          data={cards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}
