import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const SIZES = {
  sm: { icon: 28, text: 'text-base' },
  md: { icon: 36, text: 'text-lg' },
  lg: { icon: 72, text: 'text-2xl' },
};

export function LogoIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M14 8C14 6.89543 14.8954 6 16 6H28C33.5228 6 38 10.4772 38 16C38 21.5228 33.5228 26 28 26H22V38C22 40.2091 20.2091 42 18 42C15.7909 42 14 40.2091 14 38V8Z"
        fill="#1A73E8"
      />
      <Path
        d="M22 26H28C30.2091 26 32 24.2091 32 22C32 19.7909 30.2091 18 28 18H22V26Z"
        fill="#1A73E8"
      />
      <Path d="M30 30L36 22L42 30H30Z" fill="#FF6B00" />
    </Svg>
  );
}

export function BrandLogo({ size = 'md', showText = true }: BrandLogoProps) {
  const config = SIZES[size];

  if (size === 'lg') {
    return (
      <View className="items-center">
        <View
          className="mb-4 items-center justify-center rounded-full bg-logo shadow-sm"
          style={{ width: 120, height: 120 }}>
          <LogoIcon size={config.icon} />
        </View>
        {showText && (
          <Text className={`${config.text} font-bold text-primary`}>BuildQuick India</Text>
        )}
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-2">
      <LogoIcon size={config.icon} />
      {showText && (
        <Text className={`${config.text} font-bold text-primary`}>BuildQuick India</Text>
      )}
    </View>
  );
}
