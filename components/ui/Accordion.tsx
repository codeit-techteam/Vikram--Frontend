import { type ReactNode, useEffect } from 'react';
import { LayoutAnimation, Platform, Text, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ScaledPressable } from '@components/ScaledPressable';
import { colors } from '@constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACCORDION_DURATION = 250;

function configureAccordionAnimation() {
  LayoutAnimation.configureNext({
    duration: ACCORDION_DURATION,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}

export interface AccordionItemProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** Optional leading icon (Ionicons name) */
  icon?: keyof typeof Ionicons.glyphMap;
}

export function AccordionItem({
  title,
  expanded,
  onToggle,
  children,
  icon,
}: AccordionItemProps) {
  const rotation = useSharedValue(expanded ? 1 : 0);
  const contentOpacity = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 1 : 0, {
      duration: ACCORDION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
    contentOpacity.value = withTiming(expanded ? 1 : 0, {
      duration: ACCORDION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [contentOpacity, expanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handlePress = () => {
    configureAccordionAnimation();
    onToggle();
  };

  return (
    <View className="mb-3 overflow-hidden rounded-card border border-border bg-surface">
      <ScaledPressable
        scaleTo={0.99}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="flex-row items-center px-4 py-4">
        {icon ? (
          <Ionicons name={icon} size={18} color={colors.primary} style={{ marginRight: 10 }} />
        ) : null}
        <Text className="flex-1 text-[15px] font-bold text-text" numberOfLines={2}>
          {title}
        </Text>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </Animated.View>
      </ScaledPressable>

      {expanded ? (
        <Animated.View style={bodyStyle} className="border-t border-border px-4 pb-4 pt-3">
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}

export interface AccordionProps {
  /** Currently expanded item id, or null when all collapsed */
  openId: string | null;
  onChange: (id: string | null) => void;
  items: {
    id: string;
    title: string;
    icon?: keyof typeof Ionicons.glyphMap;
    content: ReactNode;
  }[];
}

export function Accordion({ openId, onChange, items }: AccordionProps) {
  return (
    <View>
      {items.map((item) => {
        const expanded = openId === item.id;
        return (
          <AccordionItem
            key={item.id}
            title={item.title}
            icon={item.icon}
            expanded={expanded}
            onToggle={() => {
              onChange(expanded ? null : item.id);
            }}>
            {item.content}
          </AccordionItem>
        );
      })}
    </View>
  );
}
