import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

export type ProductUnitVariant = 'label' | 'price' | 'qty' | 'inline';

interface ProductUnitProps {
  unit: string;
  quantity?: number;
  variant?: ProductUnitVariant;
  style?: StyleProp<TextStyle>;
}

const PLURAL_MAP: Record<string, string> = {
  Bag: 'Bags',
  Bags: 'Bags',
  Bucket: 'Buckets',
  Ton: 'Tons',
  Tons: 'Tons',
  MT: 'MT',
  Piece: 'Pieces',
  Pieces: 'Pieces',
  Litre: 'Litres',
  L: 'L',
  Box: 'Boxes',
  CFT: 'CFT',
  Cum: 'Cum',
  'Cubic Meter': 'Cubic Meters',
  'Cubic Metre': 'Cubic Metres',
};

/** Pluralize a base unit for display with quantity. */
export function pluralizeUnit(unit: string, quantity: number): string {
  if (quantity === 1) return unit;
  return PLURAL_MAP[unit] ?? unit;
}

/** Format unit with optional quantity — e.g. "10 Bags", "2 Tons". */
export function formatProductUnit(unit: string, quantity?: number): string {
  if (quantity === undefined) return unit;
  return `${quantity} ${pluralizeUnit(unit, quantity)}`;
}

export function ProductUnit({
  unit,
  quantity,
  variant = 'label',
  style,
}: ProductUnitProps) {
  let text = unit;

  if (variant === 'price') {
    text = `/ ${unit}`;
  } else if (variant === 'qty' && quantity !== undefined) {
    text = formatProductUnit(unit, quantity);
  } else if (variant === 'inline' && quantity !== undefined) {
    text = `${formatProductUnit(unit, quantity)}`;
  }

  return <Text style={[styles.base, styles[variant], style]}>{text}</Text>;
}

const styles = StyleSheet.create({
  base: {
    color: '#888888',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888888',
  },
  price: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888888',
  },
  qty: {
    fontSize: 13,
    color: '#888888',
  },
  inline: {
    fontSize: 12,
    color: '#888888',
  },
});
