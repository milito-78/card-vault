import { useRouter } from 'expo-router';
import { addCard } from '@/services/cards';
import { CardForm } from '@/components/CardForm';
import { useCardsRefresh } from '@/contexts/CardsRefreshContext';

export default function AddCardScreen() {
  const router = useRouter();
  const { refreshCards } = useCardsRefresh();

  async function handleSubmit(data: Parameters<typeof addCard>[0]) {
    await addCard(data);
    refreshCards(); // Ensure list reloads when we return
    router.back();
  }

  return <CardForm onSubmit={handleSubmit} />;
}
