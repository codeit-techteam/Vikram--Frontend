import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

interface BikeDeliveryMarkProps {
  width?: number;
  height?: number;
  color?: string;
}

/** Delivery-scooter mark for HOME_PROMO banners (box on the rear, speed lines). */
export function BikeDeliveryMark({
  width = 108,
  height = 56,
  color = '#111111',
}: BikeDeliveryMarkProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 140 72" fill="none">
      <Line
        x1="4"
        y1="28"
        x2="28"
        y2="28"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <Line
        x1="2"
        y1="36"
        x2="24"
        y2="36"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <Line
        x1="6"
        y1="44"
        x2="26"
        y2="44"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      <Circle cx="42" cy="54" r="11" stroke={color} strokeWidth="3.2" />
      <Circle cx="42" cy="54" r="4.2" fill={color} />
      <Circle cx="108" cy="54" r="11" stroke={color} strokeWidth="3.2" />
      <Circle cx="108" cy="54" r="4.2" fill={color} />

      <Path
        d="M42 54h16l9-18h18l7 12h14"
        stroke={color}
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path
        d="M67 36l-6-12h16"
        stroke={color}
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path
        d="M75 24h10l8 16"
        stroke={color}
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Rect
        x="98"
        y="10"
        width="28"
        height="22"
        rx="3"
        stroke={color}
        strokeWidth="3.2"
      />
      <Path
        d="M112 32v8"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
