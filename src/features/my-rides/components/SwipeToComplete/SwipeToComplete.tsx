import React, { useCallback, useEffect } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { styles } from './SwipeToComplete.styles';
import type { SwipeToCompleteProps } from './SwipeToComplete.types';
import { AppText as Text } from '@/shared/components';

const HANDLE_SIZE = 56;
const TRACK_PADDING = 4;

export const SwipeToComplete = ({
  label,
  completedLabel,
  completed,
  onComplete,
  threshold,
  onThresholdReach,
  holdAtThreshold = false,
}: SwipeToCompleteProps) => {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const maxX = useSharedValue(0);
  const finished = useSharedValue(false);
  const thresholdHit = useSharedValue(false);
  const useThresholdGate = useSharedValue(Boolean(onThresholdReach));
  const thresholdRatio = useSharedValue(
    typeof threshold === 'number' ? Math.min(1, Math.max(0, threshold)) : 1,
  );

  useEffect(() => {
    useThresholdGate.value = Boolean(onThresholdReach);
    thresholdRatio.value =
      typeof threshold === 'number' ? Math.min(1, Math.max(0, threshold)) : 1;
  }, [onThresholdReach, threshold, thresholdRatio, useThresholdGate]);

  useEffect(() => {
    if (completed) {
      finished.value = true;
      thresholdHit.value = true;
      translateX.value = withSpring(maxX.value);
      return;
    }
    if (holdAtThreshold && thresholdHit.value && maxX.value > 0) {
      translateX.value = withSpring(maxX.value * thresholdRatio.value);
    }
  }, [
    completed,
    finished,
    holdAtThreshold,
    maxX,
    thresholdHit,
    thresholdRatio,
    translateX,
  ]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      const nextMax = Math.max(0, width - HANDLE_SIZE - TRACK_PADDING * 2);
      maxX.value = nextMax;
      if (completed || finished.value) {
        translateX.value = nextMax;
        return;
      }
      if (holdAtThreshold && thresholdHit.value) {
        translateX.value = nextMax * thresholdRatio.value;
      }
    },
    [completed, finished, holdAtThreshold, maxX, thresholdHit, thresholdRatio, translateX],
  );

  const triggerComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const triggerThreshold = useCallback(() => {
    onThresholdReach?.();
  }, [onThresholdReach]);

  const pan = Gesture.Pan()
    .enabled(!completed)
    .onBegin(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      if (finished.value) {
        return;
      }
      const next = Math.max(0, Math.min(startX.value + event.translationX, maxX.value));
      translateX.value = next;

      const ratio = maxX.value > 0 ? next / maxX.value : 0;
      if (
        useThresholdGate.value &&
        !thresholdHit.value &&
        thresholdRatio.value < 1 &&
        ratio >= thresholdRatio.value
      ) {
        thresholdHit.value = true;
        runOnJS(triggerThreshold)();
      }
    })
    .onEnd(() => {
      if (finished.value) {
        return;
      }

      const ratio = maxX.value > 0 ? translateX.value / maxX.value : 0;

      if (useThresholdGate.value && thresholdRatio.value < 1) {
        if (ratio >= thresholdRatio.value || thresholdHit.value) {
          if (!thresholdHit.value) {
            thresholdHit.value = true;
            runOnJS(triggerThreshold)();
          }
          translateX.value = withSpring(maxX.value * thresholdRatio.value);
          return;
        }
        thresholdHit.value = false;
        translateX.value = withSpring(0);
        return;
      }

      if (translateX.value >= maxX.value - 8) {
        finished.value = true;
        translateX.value = withSpring(maxX.value);
        runOnJS(triggerComplete)();
        return;
      }
      translateX.value = withSpring(0);
    });

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const labelStyle = useAnimatedStyle(() => {
    const progress = maxX.value > 0 ? translateX.value / maxX.value : 0;
    return {
      opacity: finished.value ? 1 : Math.max(0, 1 - progress),
    };
  });

  return (
    <View style={styles.track} onLayout={handleLayout}>
      <Animated.View style={[styles.labelWrap, labelStyle]} pointerEvents="none">
        <Text style={[styles.label, completed && styles.labelCompleted]}>
          {completed ? completedLabel : label}
        </Text>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[styles.handle, completed && styles.handleCompleted, handleStyle]}
        >
          <Ionicons
            name={completed ? 'checkmark' : 'chevron-forward'}
            size={22}
            color="#FFFFFF"
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};
