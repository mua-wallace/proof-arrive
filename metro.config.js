// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;

// Configure watchFolders to include the project root
config.watchFolders = [projectRoot];

// Configure path alias resolution for @/ imports
// Store the original resolveRequest if it exists
const originalResolveRequest = config.resolver.resolveRequest;

// Override resolveRequest while preserving all other resolver properties
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @/ path aliases
  if (moduleName.startsWith('@/')) {
    const aliasPath = moduleName.replace('@/', '');
    const fullPath = path.resolve(projectRoot, aliasPath);
    
    // Try to resolve with extensions
    const fs = require('fs');
    const extensions = config.resolver.sourceExts || ['.ts', '.tsx', '.js', '.jsx', '.json'];
    
    // Try with extensions
    for (const ext of extensions) {
      const testPath = fullPath + ext;
      try {
        if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
          return { type: 'sourceFile', filePath: testPath };
        }
      } catch (e) {
        // Continue to next extension
      }
    }
    
    // Try as directory with index file
    for (const ext of extensions) {
      const testPath = path.join(fullPath, 'index' + ext);
      try {
        if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
          return { type: 'sourceFile', filePath: testPath };
        }
      } catch (e) {
        // Continue to next extension
      }
    }
  }
  
  // Default resolution - use original resolver
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  // Fallback to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
