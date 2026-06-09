import { Image, Text, View } from 'react-native';

import { Logo, theme } from '@constants/theme';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const SIZES = {
  sm: { icon: 28, text: 'text-base' },
  md: { icon: 36, text: 'text-lg' },
  lg: { icon: 180, text: 'text-2xl' },
};

export function LogoIcon({ size }: { size: number }) {
  return (
    <Image
      source={Logo}
      style={{ width: size, height: size, borderRadius: size > 40 ? 0 : 6 }}
      resizeMode="contain"
    />
  );
}

export function BrandLogo({ size = 'md', showText = true }: BrandLogoProps) {
  const config = SIZES[size];

  if (size === 'lg') {
    return (
      <View className="items-center">
        <LogoIcon size={config.icon} />
        {showText && (
          <>
            <Text
              className="mt-6 text-[28px] font-black tracking-[3px] text-text"
              style={{ textTransform: 'uppercase' }}>
              {theme.appName.toUpperCase()}
            </Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-2">
      <LogoIcon size={config.icon} />
      {showText && (
        <Text className={`${config.text} font-extrabold text-text`} style={{ letterSpacing: -0.3 }}>
          {theme.appName}
        </Text>
      )}
    </View>
  );
}
