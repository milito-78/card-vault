import { useRouter } from 'expo-router';
import { addCard } from '@/services/cards';
import { CardForm } from '@/components/CardForm';

export default function AddCardScreen() {
  const router = useRouter();

  async function handleSubmit(data: Parameters<typeof addCard>[0]) {
    await addCard(data);
    router.back();
  }

  return <CardForm onSubmit={handleSubmit} />;
}
