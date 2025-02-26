// __tests__/basic.test.js
const path = require('path');
const fs = require('fs');

describe('RainfallJS Package', () => {
  // Test that package files exist
  it('should have compiled distribution files', () => {
    const distDir = path.join(__dirname, '../dist');
    expect(fs.existsSync(distDir)).toBe(true);
    
    const indexFile = path.join(distDir, 'index.js');
    expect(fs.existsSync(indexFile)).toBe(true);
  });
  
  // Test that package exports exist
  it('should have all required exports in package.json', () => {
    // Use dynamic import to load the package
    const pkg = require('../package.json');
    
    // Check that the package has the expected structure
    expect(pkg.name).toBe('@morf_engineering/rainfalljs');
    expect(pkg.main).toBe('dist/index.js');
    
    // Check that the package has the critical files referenced
    expect(pkg.files).toContain('dist');
    expect(pkg.files).toContain('README.md');
  });

});