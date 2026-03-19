import { View } from 'react-native';
import { getBankFromCardNumber } from '@/services/bankDetection';

// Iran bank logos - require each for static resolution
const IRAN_LOGOS: Record<string, React.ComponentType<{ width?: number; height?: number }>> = {
  ansar: require('@/assets/images/banks/iran/ansar.svg'),
  ayande: require('@/assets/images/banks/iran/ayande.svg'),
  blu: require('@/assets/images/banks/iran/blu.svg'),
  day: require('@/assets/images/banks/iran/day.svg'),
  eghtesad: require('@/assets/images/banks/iran/eghtesad.svg'),
  gardeshgari: require('@/assets/images/banks/iran/gardeshgari.svg'),
  ghavvamin: require('@/assets/images/banks/iran/ghavvamin.svg'),
  hekmat: require('@/assets/images/banks/iran/hekmat.svg'),
  iranzamin: require('@/assets/images/banks/iran/iranzamin.svg'),
  karafarin: require('@/assets/images/banks/iran/karafarin.svg'),
  keshavarzi: require('@/assets/images/banks/iran/keshavarzi.svg'),
  khavarmianeh: require('@/assets/images/banks/iran/khavarmianeh.svg'),
  maskan: require('@/assets/images/banks/iran/maskan.svg'),
  mehreghtesad: require('@/assets/images/banks/iran/mehreghtesad.svg'),
  mehriran: require('@/assets/images/banks/iran/mehriran.svg'),
  mellat: require('@/assets/images/banks/iran/mellat.svg'),
  melli: require('@/assets/images/banks/iran/melli.svg'),
  parsian: require('@/assets/images/banks/iran/parsian.svg'),
  pasargad: require('@/assets/images/banks/iran/pasargad.svg'),
  post: require('@/assets/images/banks/iran/post.svg'),
  refahkargaran: require('@/assets/images/banks/iran/refahkargaran.svg'),
  resalat: require('@/assets/images/banks/iran/resalat.svg'),
  saderat: require('@/assets/images/banks/iran/saderat.svg'),
  saman: require('@/assets/images/banks/iran/saman.svg'),
  sanatmadan: require('@/assets/images/banks/iran/sanatmadan.svg'),
  sarmaye: require('@/assets/images/banks/iran/sarmaye.svg'),
  sepah: require('@/assets/images/banks/iran/sepah.svg'),
  shahr: require('@/assets/images/banks/iran/shahr.svg'),
  sina: require('@/assets/images/banks/iran/sina.svg'),
  tejarat: require('@/assets/images/banks/iran/tejarat.svg'),
  tosesaderat: require('@/assets/images/banks/iran/tosesaderat.svg'),
  tosetaavon: require('@/assets/images/banks/iran/tosetaavon.svg'),
};

const GLOBAL_LOGOS: Record<string, React.ComponentType<{ width?: number; height?: number }>> = {
  visa: require('@/assets/images/banks/global/visa.svg'),
  mastercard: require('@/assets/images/banks/global/mastercard.svg'),
  amex: require('@/assets/images/banks/global/amex.svg'),
  discover: require('@/assets/images/banks/global/discover.svg'),
};

const UnknownLogo = require('@/assets/images/banks/unknown.svg');

export type BankLogoProps = {
  cardNumber: string;
  size?: number;
  className?: string;
};

export function BankLogo({ cardNumber, size = 40, className }: BankLogoProps) {
  const { bankId } = getBankFromCardNumber(cardNumber);

  const Logo = IRAN_LOGOS[bankId] ?? GLOBAL_LOGOS[bankId] ?? UnknownLogo;
  const LogoComponent = Logo?.default ?? Logo;

  return (
    <View
      className={`items-center justify-center overflow-hidden rounded-lg bg-neutral-800 ${className ?? ''}`}
      style={{ width: size, height: size * 0.65 }}
    >
      <LogoComponent width={size} height={size * 0.65} />
    </View>
  );
}
