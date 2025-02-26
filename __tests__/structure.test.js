// __tests__/structure.test.js
const fs = require('fs');
const path = require('path');

describe('Package structure', () => {
  it('has all required files', () => {
    const distDir = path.join(__dirname, '../dist');
    expect(fs.existsSync(distDir)).toBe(true);
    
    const mainFile = path.join(distDir, 'index.js');
    expect(fs.existsSync(mainFile)).toBe(true);
    
    // Check that the file content contains expected exports
    const content = fs.readFileSync(mainFile, 'utf8');
    expect(content).toContain('DataProvider');
    expect(content).toContain('useData');
    expect(content).toContain('withData');
    expect(content).toContain('NextDataProvider');
    expect(content).toContain('withServerSideData');
    expect(content).toContain('createApiRoute');
    expect(content).toContain('registerComponentLibrary');
  });
});