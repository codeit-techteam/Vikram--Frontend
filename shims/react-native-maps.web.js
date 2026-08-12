/**
 * Web stub for react-native-maps (native-only).
 * Metro resolves this on web so bundling does not pull codegenNativeCommands.
 */
const React = require('react');
const { View, Text, StyleSheet } = require('react-native');

function MapView({ style, children, ...rest }, ref) {
  return React.createElement(
    View,
    {
      ref,
      style: [styles.fallback, style],
      accessibilityLabel: 'Map unavailable on web',
      ...rest,
    },
    React.createElement(
      Text,
      { style: styles.label },
      'Map preview is available in the iOS / Android app',
    ),
    children,
  );
}

const MapViewForward = React.forwardRef(MapView);
MapViewForward.displayName = 'MapView';

function Marker() {
  return null;
}

module.exports = {
  __esModule: true,
  default: MapViewForward,
  MapView: MapViewForward,
  Marker,
};

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EEF2',
  },
  label: {
    color: '#5B6B7A',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
