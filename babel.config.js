module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components',
            '@services': './services',
            '@store': './store',
            '@hooks': './hooks',
            '@utils': './utils',
            '@constants': './constants',
            '@assets': './assets',
            '@lib': './lib',
            '@providers': './providers',
            '@types': './types',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
