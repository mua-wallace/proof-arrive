const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Config plugin to use transparent PNG for splashscreen_logo
 * This ensures the transparent.png exists in the drawable directory
 * so Android build doesn't fail when looking for splashscreen_logo
 */
const withSplashLogoFix = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const drawableDir = path.join(
        projectRoot,
        'app/src/main/res/drawable'
      );
      
      // Ensure drawable directory exists
      if (!fs.existsSync(drawableDir)) {
        fs.mkdirSync(drawableDir, { recursive: true });
      }
      
      // Create splashscreen_logo.png in drawable directory using transparent PNG
      // This is a 1x1 transparent PNG in base64 (always available, no file path issues)
      const logoPngPath = path.join(drawableDir, 'splashscreen_logo.png');
      const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const Buffer = require('buffer').Buffer;
      fs.writeFileSync(logoPngPath, Buffer.from(transparentPngBase64, 'base64'));
      
      // Also remove any XML version if it exists (expo-splash-screen might create it)
      const logoXmlPath = path.join(drawableDir, 'splashscreen_logo.xml');
      if (fs.existsSync(logoXmlPath)) {
        fs.unlinkSync(logoXmlPath);
      }
      
      return config;
    },
  ]);
};

module.exports = withSplashLogoFix;

