// Plain CommonJS tests over plain CommonJS sources — no transform needed.
// The babel pipeline left with the React runtime in 0.3.0.
module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'node'],
};
