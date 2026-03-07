const PACKAGE = require('./package.json');

export default {
  expo: {
    name: "VoiceDraft",
    slug: "voicedraft",
    version: PACKAGE.version,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "voicedraft",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.voined.vicedraft",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      package: "com.voined.vicedraft",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ],
      "expo-sqlite"
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
      productionUrl: 'https://voice-draft.vercel.app',
    },
  }
};
