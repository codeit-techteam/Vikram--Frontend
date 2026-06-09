import { Text, type TextProps } from 'react-native';

import { highlightMatch } from '@utils/searchUtils';

interface HighlightedTextProps extends TextProps {
  text: string;
  query: string;
  matchColor?: string;
}

export function HighlightedText({
  text,
  query,
  style,
  matchColor = '#FEB623',
  ...rest
}: HighlightedTextProps) {
  const segments = highlightMatch(text, query);

  return (
    <Text style={style} {...rest}>
      {segments.map((segment, index) => (
        <Text
          key={`${index}-${segment.text}`}
          style={
            segment.isMatch
              ? { fontWeight: '700', color: matchColor }
              : { fontWeight: '400', color: '#1A1A1A' }
          }>
          {segment.text}
        </Text>
      ))}
    </Text>
  );
}
