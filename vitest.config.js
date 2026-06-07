const { defineConfig } = require('vitest/config')

module.exports = defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.js']
    }
  }
})
