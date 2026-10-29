import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText as Text } from '@/shared/components';
import { triggerLightHaptic, triggerSuccessHaptic } from '@/shared/utils';
import { colors } from '@/theme';
import { CELL_GAP, CELL_SIZE, OTP_ANIM, styles } from './MorphingOTPInput.styles';
import type { MorphingOTPInputProps } from './MorphingOTPInput.types';

export { MORPHING_OTP_TIMING } from './MorphingOTPInput.styles';

const LARGE_RADIUS = 78;
const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN_OUT = Easing.inOut(Easing.cubic);

type VisualPhase = 'input' | 'orbiting' | 'success' | 'reduced-success';

interface OrbitDigitProps {
  index: number;
  digit: string;
  cellCount: number;
  layout: SharedValue<number>;
  angle: SharedValue<number>;
  radius: SharedValue<number>;
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
  selfRotate: SharedValue<number>;
}

const OrbitDigit = ({
  index,
  digit,
  cellCount,
  layout,
  angle,
  radius,
  opacity,
  scale,
  selfRotate,
}: OrbitDigitProps) => {
  const rowWidth = cellCount * CELL_SIZE + (cellCount - 1) * CELL_GAP;
  const startX = index * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2 - rowWidth / 2;

  const animatedStyle = useAnimatedStyle(() => {
    const base = (index / cellCount) * Math.PI * 2;
    const a = angle.value + base;
    const orbitX = Math.sin(a) * radius.value;
    const orbitY = -Math.cos(a) * radius.value;
    const t = layout.value;
    const x = startX + (orbitX - startX) * t;
    const y = orbitY * t;

    return {
      opacity: opacity.value,
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${selfRotate.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View style={[styles.orbitDigit, animatedStyle]} pointerEvents="none">
      <Text style={styles.orbitDigitText}>{digit}</Text>
    </Animated.View>
  );
};

export const MorphingOTPInput = ({
  value,
  onChange,
  onComplete,
  cellCount = 4,
  error,
  status = 'idle',
  editable = true,
  accessibilityLabel = 'One-time password input',
}: MorphingOTPInputProps) => {
  const inputRef = useRef<TextInput>(null);
  const completedRef = useRef(false);
  const reduceMotionRef = useRef(false);
  const finaleStartedRef = useRef(false);
  const [focused, setFocused] = useState(false);
  const [visualPhase, setVisualPhase] = useState<VisualPhase>('input');
  const [frozenDigits, setFrozenDigits] = useState<string[]>([]);

  const angle = useSharedValue(0);
  const layout = useSharedValue(0);
  const radius = useSharedValue(LARGE_RADIUS);
  const digitOpacity = useSharedValue(1);
  const digitScale = useSharedValue(1);
  const selfRotate = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0.55);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  const digits = useMemo(() => {
    const padded = value.padEnd(cellCount, ' ');
    return Array.from({ length: cellCount }, (_, i) => {
      const char = padded[i];
      return char === ' ' ? '' : char;
    });
  }, [cellCount, value]);

  const activeIndex = Math.min(value.length, cellCount - 1);
  const canEdit =
    editable && visualPhase === 'input' && status !== 'verifying' && status !== 'success';
  const showOrbit = visualPhase === 'orbiting' || visualPhase === 'success';
  const orbitDigits = frozenDigits.length === cellCount ? frozenDigits : digits;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotionRef.current = enabled;
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      reduceMotionRef.current = enabled;
    });
    return () => {
      sub.remove();
    };
  }, []);

  const resetMotion = useCallback(() => {
    cancelAnimation(angle);
    cancelAnimation(layout);
    cancelAnimation(radius);
    cancelAnimation(digitOpacity);
    cancelAnimation(digitScale);
    cancelAnimation(selfRotate);
    cancelAnimation(checkOpacity);
    cancelAnimation(checkScale);
    cancelAnimation(pulseScale);
    cancelAnimation(pulseOpacity);
    angle.value = 0;
    layout.value = 0;
    radius.value = LARGE_RADIUS;
    digitOpacity.value = 1;
    digitScale.value = 1;
    selfRotate.value = 0;
    checkOpacity.value = 0;
    checkScale.value = 0.55;
    pulseScale.value = 1;
    pulseOpacity.value = 0;
  }, [
    angle,
    checkOpacity,
    checkScale,
    digitOpacity,
    digitScale,
    layout,
    pulseOpacity,
    pulseScale,
    radius,
    selfRotate,
  ]);

  const startOrbit = useCallback(
    (captured: string[]) => {
      finaleStartedRef.current = false;
      setFrozenDigits(captured);
      setVisualPhase('orbiting');
      resetMotion();

      layout.value = withTiming(1, {
        duration: OTP_ANIM.setupMs,
        easing: EASE_OUT,
      });
      radius.value = LARGE_RADIUS;
      angle.value = withDelay(
        OTP_ANIM.setupMs,
        withRepeat(
          withTiming(Math.PI * 2, {
            duration: 1600,
            easing: Easing.linear,
          }),
          -1,
          false,
        ),
      );
      // Subtle continuous clockwise spin so digits stay readable.
      selfRotate.value = withDelay(
        OTP_ANIM.setupMs,
        withRepeat(
          withTiming(360, {
            duration: 4800,
            easing: Easing.linear,
          }),
          -1,
          false,
        ),
      );
    },
    [angle, layout, radius, resetMotion, selfRotate],
  );

  const playReducedSuccess = useCallback(() => {
    if (finaleStartedRef.current) {
      return;
    }
    finaleStartedRef.current = true;
    setVisualPhase('reduced-success');
    cancelAnimation(angle);
    cancelAnimation(layout);
    cancelAnimation(radius);
    cancelAnimation(digitOpacity);
    cancelAnimation(digitScale);
    cancelAnimation(selfRotate);
    digitOpacity.value = withTiming(0, { duration: 160, easing: EASE_OUT });
    checkOpacity.value = withDelay(120, withTiming(1, { duration: 180, easing: EASE_OUT }));
    checkScale.value = withDelay(
      120,
      withSpring(1, { damping: 12, stiffness: 180 }, (finished) => {
        if (finished) {
          runOnJS(triggerSuccessHaptic)();
        }
      }),
    );
  }, [
    angle,
    checkOpacity,
    checkScale,
    digitOpacity,
    digitScale,
    layout,
    radius,
    selfRotate,
  ]);

  const playSuccessFinale = useCallback(() => {
    if (finaleStartedRef.current) {
      return;
    }
    finaleStartedRef.current = true;
    setVisualPhase('success');
    cancelAnimation(angle);
    cancelAnimation(selfRotate);

    radius.value = withTiming(0, {
      duration: OTP_ANIM.convergeMs,
      easing: EASE_IN_OUT,
    });
    digitScale.value = withSequence(
      withTiming(0.78, {
        duration: OTP_ANIM.convergeMs,
        easing: EASE_IN_OUT,
      }),
      withTiming(0.35, {
        duration: OTP_ANIM.vanishMs,
        easing: EASE_OUT,
      }),
    );
    digitOpacity.value = withSequence(
      withTiming(1, { duration: OTP_ANIM.convergeMs }),
      withTiming(0, {
        duration: OTP_ANIM.vanishMs,
        easing: EASE_OUT,
      }),
    );

    const checkDelay = OTP_ANIM.convergeMs + OTP_ANIM.vanishMs;
    checkOpacity.value = withDelay(
      checkDelay,
      withTiming(1, { duration: Math.round(OTP_ANIM.checkMs * 0.55), easing: EASE_OUT }),
    );
    checkScale.value = withDelay(
      checkDelay,
      withSpring(1, { damping: 11, stiffness: 170 }, (finished) => {
        if (finished) {
          runOnJS(triggerSuccessHaptic)();
        }
      }),
    );
    pulseOpacity.value = withDelay(
      checkDelay + Math.round(OTP_ANIM.checkMs * 0.4),
      withSequence(
        withTiming(0.4, { duration: 120 }),
        withTiming(0, { duration: OTP_ANIM.pulseMs }),
      ),
    );
    pulseScale.value = withDelay(
      checkDelay + Math.round(OTP_ANIM.checkMs * 0.4),
      withSequence(
        withTiming(1.28, { duration: OTP_ANIM.pulseMs, easing: EASE_OUT }),
        withTiming(1, { duration: 1 }),
      ),
    );
  }, [
    angle,
    checkOpacity,
    checkScale,
    digitOpacity,
    digitScale,
    pulseOpacity,
    pulseScale,
    radius,
    selfRotate,
  ]);

  const resetToInput = useCallback(() => {
    completedRef.current = false;
    finaleStartedRef.current = false;
    setFrozenDigits([]);
    setVisualPhase('input');
    resetMotion();
  }, [resetMotion]);

  useEffect(() => {
    if (status === 'verifying' && visualPhase === 'input') {
      const captured = digits.map((d) => d || '0').slice(0, cellCount);
      if (reduceMotionRef.current) {
        // Keep the normal OTP UI until success; then short fade → check.
        setFrozenDigits(captured);
        return;
      }
      startOrbit(captured);
      return;
    }

    if (status === 'success') {
      if (reduceMotionRef.current) {
        playReducedSuccess();
        return;
      }
      if (visualPhase === 'input') {
        const captured = digits.map((d) => d || '0').slice(0, cellCount);
        startOrbit(captured);
        return;
      }
      if (visualPhase === 'orbiting') {
        playSuccessFinale();
      }
      return;
    }

    if (status === 'error') {
      resetToInput();
      return;
    }

    if (status === 'idle' && visualPhase !== 'input') {
      resetToInput();
    }
  }, [
    cellCount,
    digits,
    playReducedSuccess,
    playSuccessFinale,
    resetToInput,
    startOrbit,
    status,
    visualPhase,
  ]);

  useEffect(() => {
    if (value.length < cellCount) {
      completedRef.current = false;
    }
    if (value.length === cellCount && !completedRef.current && status === 'idle') {
      completedRef.current = true;
      triggerLightHaptic();
      onComplete?.(value);
    }
  }, [cellCount, onComplete, status, value]);

  const handleChange = useCallback(
    (text: string) => {
      if (!canEdit) {
        return;
      }
      onChange(text.replace(/\D/g, '').slice(0, cellCount));
    },
    [canEdit, cellCount, onChange],
  );

  const handleKeyPress = useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (event.nativeEvent.key === 'Backspace' && value.length > 0 && canEdit) {
        onChange(value.slice(0, -1));
      }
    },
    [canEdit, onChange, value],
  );

  const focusInput = useCallback(() => {
    if (canEdit) {
      inputRef.current?.focus();
    }
  }, [canEdit]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const statusLabel =
    visualPhase === 'orbiting' && status === 'verifying'
      ? 'Verifying…'
      : visualPhase === 'success' ||
          visualPhase === 'reduced-success' ||
          status === 'success'
        ? 'Verified'
        : '';

  return (
    <View style={styles.root}>
      <Pressable style={styles.stage} onPress={focusInput} accessibilityRole="none">
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.hiddenInput}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
          maxLength={cellCount}
          caretHidden
          editable={canEdit}
          accessibilityLabel={accessibilityLabel}
        />

        {visualPhase === 'input' ? (
          <View style={styles.row} pointerEvents="none">
            {digits.map((digit, index) => {
              const isFocused = focused && activeIndex === index;
              return (
                <View
                  key={`otp-cell-${index}`}
                  style={[styles.cell, isFocused ? styles.cellFocused : null]}
                >
                  <Text style={styles.cellText}>{digit}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {showOrbit ? (
          <View style={styles.orbitLayer} pointerEvents="none">
            {orbitDigits.map((digit, index) => (
              <OrbitDigit
                key={`orbit-${index}`}
                index={index}
                digit={digit}
                cellCount={cellCount}
                layout={layout}
                angle={angle}
                radius={radius}
                opacity={digitOpacity}
                scale={digitScale}
                selfRotate={selfRotate}
              />
            ))}
          </View>
        ) : null}

        <Animated.View style={[styles.successWrap, checkStyle]} pointerEvents="none">
          <Animated.View style={[styles.successPulse, pulseStyle]} />
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={36} color={colors.white} />
          </View>
        </Animated.View>
      </Pressable>

      <Text style={styles.statusLabel}>{statusLabel || ' '}</Text>

      {error && visualPhase === 'input' ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
};
