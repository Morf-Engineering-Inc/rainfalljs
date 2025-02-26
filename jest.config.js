// jest.config.js
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './.babelrc' }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@morf_engineering)/)'
  ],
  moduleFileExtensions: ['js', 'json', 'jsx', 'node']
};