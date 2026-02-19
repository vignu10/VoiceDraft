import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CircularTabBar } from "@/components/navigation/circular-tab-bar";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          // Hide the default tab bar - we use our custom circular one
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="draft/[id]"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Custom Circular Navigation Bar */}
      <View style={{ paddingBottom: insets.bottom }}>
        <CircularTabBar />
      </View>
    </>
  );
}
