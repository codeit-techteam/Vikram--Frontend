import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { getInitials } from '@utils/getInitials';

interface InitialsAvatarProps {
  name: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function InitialsAvatar({ name, size = 64, style }: InitialsAvatarProps) {
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.36);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FEB623',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <Text
        style={{
          fontSize,
          fontWeight: '800',
          color: '#1A1A1A',
          letterSpacing: 0.5,
        }}>
        {initials}
      </Text>
    </View>
  );
}
