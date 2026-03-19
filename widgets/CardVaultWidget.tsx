import { Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

type CardVaultWidgetProps = {
  message?: string;
};

const CardVaultWidget = (props: WidgetBase<CardVaultWidgetProps>) => {
  'widget';
  return (
    <VStack modifiers={[padding({ all: 12 })]}>
      <Image
        systemName="lock.fill"
        color="#3b82f6"
        modifiers={[padding({ bottom: 8 })]}
      />
      <Text modifiers={[font({ weight: 'bold', size: 14 }), foregroundStyle('#ffffff')]}>
        Card Vault
      </Text>
      <Text modifiers={[font({ size: 12 }), foregroundStyle('#a3a3a3')]}>
        {props.message ?? 'Tap to unlock'}
      </Text>
    </VStack>
  );
};

const Widget = createWidget('CardVaultWidget', CardVaultWidget);
export default Widget;
