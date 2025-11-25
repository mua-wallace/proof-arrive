import { ReactNode } from 'react';
import { View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface SwipeableTabProps {
  children: ReactNode;
  currentTab: string;
  tabs: string[];
}

export function SwipeableTab({ children, currentTab, tabs }: SwipeableTabProps) {
  const currentIndex = tabs.indexOf(currentTab);
  
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .minDistance(20)
    .onEnd((event) => {
      const { translationX, velocityX } = event;
      const swipeThreshold = 80;
      const velocityThreshold = 400;

      // Swipe right (go to previous tab)
      if (translationX > swipeThreshold || velocityX > velocityThreshold) {
        if (currentIndex > 0) {
          const previousTab = tabs[currentIndex - 1];
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/(tabs)/${previousTab}` as any);
        }
      }
      // Swipe left (go to next tab)
      else if (translationX < -swipeThreshold || velocityX < -velocityThreshold) {
        if (currentIndex < tabs.length - 1) {
          const nextTab = tabs[currentIndex + 1];
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/(tabs)/${nextTab}` as any);
        }
      }
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={{ flex: 1 }}>{children}</View>
    </GestureDetector>
  );
}

