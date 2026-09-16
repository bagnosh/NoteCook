import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

const CHEF_DURATION = 1200;
const CHEF_DELAY = 300;
const WIPE_DURATION = 700;
const WIPE_DELAY = 200; // minimal delay after chef lands
const HOLD_DURATION = 500;
const EXIT_DURATION = 800;
const DOT_INTERVAL = 350;

type Props = { onFinish: () => void };

export default function SplashAnimation({ onFinish }: Props) {
  const chefY = useRef(new Animated.Value(-350)).current;
  const wipeWidth = useRef(new Animated.Value(0)).current;
  const exitY = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const [dots, setDots] = useState(0);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const totalIntroTime = CHEF_DELAY + CHEF_DURATION + WIPE_DELAY + WIPE_DURATION + HOLD_DURATION;

    // Step 1: Chef floats in
    Animated.sequence([
      Animated.delay(CHEF_DELAY),
      Animated.spring(chefY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Step 2: Logo wipes in shortly after chef lands
    const wipeTimer = setTimeout(() => {
      Animated.timing(wipeWidth, {
        toValue: 1,
        duration: WIPE_DURATION,
        useNativeDriver: false,
      }).start();
    }, CHEF_DELAY + CHEF_DURATION + WIPE_DELAY);

    // Step 3: After hold, exit animation — float up + wipe out + bg fade in
    const exitTimer = setTimeout(() => {
      // Reverse wipe (logo disappears right to left)
      Animated.timing(wipeWidth, {
        toValue: 0,
        duration: EXIT_DURATION,
        useNativeDriver: false,
      }).start();

      // Chef + logo float upward and fade
      Animated.parallel([
        Animated.timing(exitY, {
          toValue: -500,
          duration: EXIT_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(exitOpacity, {
          toValue: 0,
          duration: EXIT_DURATION * 0.8,
          useNativeDriver: true,
        }),
      ]).start();

      // Background fades in
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: EXIT_DURATION,
        useNativeDriver: true,
      }).start();

      // Show loading text
      setShowLoading(true);

      // Dot animation
      let dotCount = 0;
      const dotInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        setDots(dotCount);
      }, DOT_INTERVAL);

      // Finish after exit completes
      setTimeout(() => {
        clearInterval(dotInterval);
        onFinish();
      }, EXIT_DURATION + 400);

    }, totalIntroTime);

    return () => {
      clearTimeout(wipeTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  const logoReveal = wipeWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const dotsText = '.'.repeat(dots);

  return (
    <View style={styles.container}>

      {/* Paper background fades in during exit */}
      <Animated.Image
        source={require('../../assets/images/paper.png')}
        style={[styles.bgImage, { opacity: bgOpacity }]}
        resizeMode="cover"
      />

      {/* Chef + logo — float out together */}
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            transform: [{ translateY: exitY }],
            opacity: exitOpacity,
          }
        ]}
      >
        {/* Chef */}
        <Animated.View style={{ transform: [{ translateY: chefY }] }}>
          <Image
            source={require('../../assets/images/chef.png')}
            style={styles.chef}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Wipe-in logo */}
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/images/notecook_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Animated.View
            style={[styles.logoMask, { left: logoReveal }]}
          />
        </View>
      </Animated.View>

      {/* Loading text — appears at logo position during exit */}
      {showLoading && (
        <Animated.View style={[styles.loadingWrapper, { opacity: bgOpacity }]}>
          <Text style={styles.loadingText}>
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
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  contentWrapper: {
    alignItems: 'center',
    gap: 16,
  },
  chef: {
    width: 220,
    height: 220,
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
    bottom: 180,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: theme.colors.text,
    fontStyle: 'italic',
    opacity: 0.6,
  },
  dots: {
    color: theme.colors.buttonSecondary,
  },
});