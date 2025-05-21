module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
     '^(\.{1,2}/.*)\.js$': '$1',
  },
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
};
