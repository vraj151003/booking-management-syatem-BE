module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',           // Exclude all DTO files
    '!src/**/*.module.ts',         // Exclude all module files  
    '!src/**/*.entity.ts',        // Exclude all entity files
    '!src/main.ts',               // Exclude main entry point
    '!src/app.module.ts',         // Exclude app module
    '!src/common/config/**',      // Exclude config files
    '!src/database/migrations/**', // Exclude migration files
    '!src/database/seeds/**',      // Exclude seed files
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
