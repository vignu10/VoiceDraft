// Use Expo's recommended config
module.exports = {
  extends: ['expo'],
  settings: {
    'import/resolver': {
      alias: {
        map: [['@', './']],
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      },
    },
  },
};
