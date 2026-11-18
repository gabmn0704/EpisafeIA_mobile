const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  { ignores: ['dist/*', '.expo/*', 'node_modules/*'] },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Reanimated muta sharedValue.value por diseno; la regla del React Compiler no lo entiende.
      'react-hooks/immutability': 'off',
    },
  },
];
