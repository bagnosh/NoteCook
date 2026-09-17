import { useFonts } from 'expo-font';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import OutlinedImage from './OutlinedImage';
import { theme } from '../constants/theme';

// Chef slide-in + logo reveal both start together after this delay.
const INTRO_DELAY = 300;
// Animated.spring has no fixed duration -- this is an estimate of how long
// it takes to settle, used only to time the hold/exit that follows.
const CHEF_SETTLE_ESTIMATE = 1200;
const WIPE_DURATION = 700;
const HOLD_DURATION = 300;
const EXIT_FADE_DURATION = 800;
const DOT_INTERVAL = 350;
const DOT_STEPS = 3;
const FINISH_HOLD = 350;

const CHEF_SIZE = 220;
const CHEF_STROKE_WIDTH = 10;

type Props = { onFinish: () => void };

export default function SplashAnimation({ onFinish }: Props) {
  const chefY = useRef(new Animated.Value(-350)).current;
  const wipeWidth = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const [dots, setDots] = useState(0);
  const [showLoading, setShowLoading] = useState(false);
  const [fontsLoaded] = useFonts({
    Fredoka: require('../../assets/fonts/Fredoka-Variable.ttf'),
  });

  useEffect(() => {
    let dotInterval: ReturnType<typeof setInterval> | null = null;
    let finishTimer: ReturnType<typeof setTimeout> | null = null;

    // Chef slide-in and logo reveal start at the same time.
    const startTimer = setTimeout(() => {
      Animated.spring(chefY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      Animated.timing(wipeWidth, {
        toValue: 1,
        duration: WIPE_DURATION,
        useNativeDriver: false,
      }).start();
    }, INTRO_DELAY);

    // Hold both in place, then fade everything out into the paper background.
    const exitStart = INTRO_DELAY + CHEF_SETTLE_ESTIMATE + HOLD_DURATION;
    const exitTimer = setTimeout(() => {
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: EXIT_FADE_DURATION,
        useNativeDriver: true,
      }).start();

      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: EXIT_FADE_DURATION,
        useNativeDriver: true,
      }).start();

      setShowLoading(true);
      Animated.sequence([
        // Let the chef + logo fade most of the way out first, so the
        // loading text (positioned higher up, near the chef) doesn't
        // visibly double-expose with it mid-crossfade.
        Animated.delay(EXIT_FADE_DURATION * 0.5),
        Animated.timing(loadingOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      let dotCount = 0;
      dotInterval = setInterval(() => {
        dotCount += 1;
        setDots(dotCount);
        if (dotCount >= DOT_STEPS) {
          clearInterval(dotInterval!);
          finishTimer = setTimeout(onFinish, FINISH_HOLD);
        }
      }, DOT_INTERVAL);
    }, exitStart);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(exitTimer);
      if (dotInterval) clearInterval(dotInterval);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, []);

  const logoReveal = wipeWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const dotsText = '.'.repeat(dots);

  return (
    <View style={styles.container}>

      {/* Paper background fades in as the chef + logo fade out */}
      <View style={styles.bgWrap} pointerEvents="none">
        <Animated.Image
          source={require('../../assets/images/paper.png')}
          style={[styles.bgImage, { opacity: bgOpacity }]}
          resizeMode="cover"
        />
      </View>

      {/* Chef + logo -- fade out together, no more float/wipe-out */}
      <Animated.View style={[styles.contentWrapper, { opacity: exitOpacity }]}>
        {/* Chef, outlined in white */}
        <Animated.View style={{ transform: [{ translateY: chefY }] }}>
          <OutlinedImage
            source={require('../../assets/images/Logo-image.png')}
            width={CHEF_SIZE}
            height={CHEF_SIZE}
            strokeWidth={CHEF_STROKE_WIDTH}
            strokeColor="#FFFFFF"
          />
        </Animated.View>

        {/* Wipe-in logo */}
        <View style={styles.logoWrapper}>
          <Animated.Image
            source={require('../../assets/images/notecook_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Animated.View
            style={[styles.logoMask, { left: logoReveal }]}
          />
        </View>
      </Animated.View>

      {/* Loading text -- appears immediately once the exit fade starts */}
      {showLoading && (
        <Animated.View style={[styles.loadingWrapper, { opacity: loadingOpacity }]}>
          <Text style={[styles.loadingText, fontsLoaded && { fontFamily: 'Fredoka' }]}>
            loading<Text style={styles.dots}>{dotsText}</Text>
          </Text>
        </Animated.View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 180,
  },
  bgWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  bgImage: {
    position: 'absolute',
    top: '-15%',
    left: '-2.5%',
    width: '130%',
    height: '130%',
  },
  contentWrapper: {
    alignItems: 'center',
    gap: 16,
  },
  logoWrapper: {
    width: 280,
    height: 80,
    overflow: 'hidden',
    position: 'relative',
  },
  logo: {
    width: 280,
    height: 80,
  },
  logoMask: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
  },
  loadingWrapper: {
    position: 'absolute',
    top: '33%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    opacity: 0.85,
  },
  dots: {
    color: theme.colors.buttonSecondary,
  },
});
