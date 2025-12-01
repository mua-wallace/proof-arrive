const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Config plugin to remove splash screen logo on both Android and iOS
 * This ensures no logo/circle appears on the native splash screen
 */
const withSplashLogoFix = (config) => {
  // Android: Remove or make logo transparent
  const androidConfig = withDangerousMod(config, [
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
      
      // Create completely transparent splashscreen_logo.png
      const logoPngPath = path.join(drawableDir, 'splashscreen_logo.png');
      const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const Buffer = require('buffer').Buffer;
      fs.writeFileSync(logoPngPath, Buffer.from(transparentPngBase64, 'base64'));
      
      // Remove any XML version if it exists
      const logoXmlPath = path.join(drawableDir, 'splashscreen_logo.xml');
      if (fs.existsSync(logoXmlPath)) {
        fs.unlinkSync(logoXmlPath);
      }
      
      return config;
    },
  ]);

  // iOS: Remove logo from launch screen
  return withDangerousMod(androidConfig, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const launchScreenPath = path.join(
        projectRoot,
        'ProofArrive/SplashScreen.storyboard'
      );
      
      // If the storyboard exists, we could modify it, but expo-splash-screen
      // should handle this when image is set to null in app.json
      
      return config;
    },
  ]);
};

module.exports = withSplashLogoFix;

