import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function ScoutAvatar({ size = 44, idle = false }) {
  const eyeShift = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!idle) return;
    let cancelled = false;
    const doIdleMove = () => {
      if (cancelled) return;
      const delay = 3000 + Math.random() * 4000;
      setTimeout(() => {
        if (cancelled) return;
        const moveEyes = Math.random() > 0.5;
        const target = (Math.random() - 0.5) * 3;
        Animated.sequence([
          Animated.timing(moveEyes ? eyeShift : tilt, { toValue: target, duration: 400, useNativeDriver: true }),
          Animated.delay(800),
          Animated.timing(moveEyes ? eyeShift : tilt, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
        doIdleMove();
      }, delay);
    };
    doIdleMove();
    return () => { cancelled = true; };
  }, [idle]);

  return (
    <Animated.View style={[styles.avatar, { width: size, height: size, transform: [{ rotate: tilt.interpolate({ inputRange: [-3, 3], outputRange: ['-3deg', '3deg'] }) }] }]}>
      <View style={styles.face}>
        {/* Eyes */}
        <View style={styles.eyes}>
          <Animated.View style={[styles.eye, { transform: [{ translateX: eyeShift }] }]} />
          <Animated.View style={[styles.eye, { transform: [{ translateX: eyeShift }] }]} />
        </View>
        {/* Smile */}
        <View style={styles.smile} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 999,
    backgroundColor: colors.purpleDim,
    borderWidth: 2,
    borderColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  face: { alignItems: 'center', gap: 4 },
  eyes: { flexDirection: 'row', gap: 5 },
  eye: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.cream },
  smile: {
    width: 10, height: 5,
    borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5,
    borderColor: colors.cream,
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
  },
});
