// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const sourceExts = config.resolver.sourceExts || ['.ts', '.tsx', '.js', '.jsx', '.json'];

// Performance optimization: Cache resolved paths to avoid repeated file system calls
const pathCache = new Map();

// Store the original resolveRequest
const { resolveRequest, ...resolver } = config.resolver;

// Configure path alias resolution for @/ imports with caching
config.resolver = {
  ...resolver,
  resolveRequest: (context, realModuleName, platform, moduleName) => {
    // Handle @/ path aliases
    if (realModuleName.startsWith('@/')) {
      // Check cache first
      const cacheKey = `${realModuleName}:${platform || 'default'}`;
      if (pathCache.has(cacheKey)) {
        const cached = pathCache.get(cacheKey);
        if (fs.existsSync(cached)) {
          return {
            type: 'sourceFile',
            filePath: cached,
          };
        }
        // Cache miss, remove from cache
        pathCache.delete(cacheKey);
      }

      const aliasPath = realModuleName.replace('@/', '');
      const fullPath = path.resolve(projectRoot, aliasPath);
      
      // Try with extensions
      for (const ext of sourceExts) {
        const testPath = fullPath + ext;
        try {
          if (fs.existsSync(testPath)) {
            const stat = fs.statSync(testPath);
            if (stat.isFile()) {
              // Cache the result
              pathCache.set(cacheKey, testPath);
              return {
                type: 'sourceFile',
                filePath: testPath,
              };
            }
          }
        } catch (e) {
          // Continue to next extension
        }
      }
      
      // Try as directory with index file
      try {
        if (fs.existsSync(fullPath)) {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            for (const ext of sourceExts) {
              const testPath = path.join(fullPath, 'index' + ext);
              try {
                if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
                  // Cache the result
                  pathCache.set(cacheKey, testPath);
                  return {
                    type: 'sourceFile',
                    filePath: testPath,
                  };
                }
              } catch (e) {
                // Continue to next extension
              }
            }
          }
        }
      } catch (e) {
        // Not found, continue to default resolution
      }
    }
    
    // Default resolution - delegate to original resolver
    if (resolveRequest) {
      return resolveRequest(context, realModuleName, platform, moduleName);
    }
    // Fallback to default Metro resolution
    return context.resolveRequest(context, realModuleName, platform);
  },
};

// Performance optimizations for Metro
// Increase max workers for faster bundling (use 50% of CPUs to avoid overload)
config.maxWorkers = Math.max(2, Math.floor(require('os').cpus().length * 0.5));

// Optimize resolver for faster module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
