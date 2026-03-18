const PACKAGE = require("./package.json");

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
      bundleIdentifier: " ",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      package: "com.voined.vicedraft",
      versionCode: 5,
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    privacy: "https://voice-draft.vercel.app/privacy",
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
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
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-sqlite",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
      productionUrl: "https://voice-draft.vercel.app",
      eas: {
        projectId: "6e4438e3-58b0-4528-b2b6-29520f988122",
      },
    },
  },
};
