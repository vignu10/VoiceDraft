// ESLint config for web (Next.js) project
module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript'],
  settings: {
    'import/resolver': {
      alias: {
        map: [['@', './src']],
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      },
    },
  },
};
