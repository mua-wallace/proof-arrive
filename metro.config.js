// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;

// Configure watchFolders to include the project root
config.watchFolders = [projectRoot];

// Configure path alias resolution for @/ imports
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Handle @/ path aliases
    if (moduleName.startsWith('@/')) {
      const aliasPath = moduleName.replace('@/', '');
      const fullPath = path.resolve(projectRoot, aliasPath);
      
      // Try to resolve with extensions
      const fs = require('fs');
      const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.json'];
      for (const ext of extensions) {
        const testPath = fullPath + ext;
        if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
          return { type: 'sourceFile', filePath: testPath };
        }
      }
      
      // Try as directory with index file
      for (const ext of extensions) {
        const testPath = path.join(fullPath, 'index' + ext);
        if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
          return { type: 'sourceFile', filePath: testPath };
        }
      }
    }
    
    // Default resolution
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
