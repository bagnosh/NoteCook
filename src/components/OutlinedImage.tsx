import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

// Approximates an outline/stroke around a transparent PNG by stacking
// several white-tinted (solid silhouette) copies of the image, offset in a
// circle behind the original -- there's no native "outline" filter for an
// arbitrary alpha shape in React Native, so this is the standard trick.
const OUTLINE_ANGLE_COUNT = 16;
const OUTLINE_ANGLES = Array.from(
  { length: OUTLINE_ANGLE_COUNT },
  (_, i) => (i * 360) / OUTLINE_ANGLE_COUNT
);

export default function OutlinedImage({
  source,
  width,
  height,
  strokeWidth = 40,
  strokeColor = '#FFFFFF',
}: {
  source: ImageSourcePropType;
  width: number;
  height: number;
  strokeWidth?: number;
  strokeColor?: string;
}) {
  return (
    <View style={{ width: width + strokeWidth * 2, height: height + strokeWidth * 2 }}>
      {OUTLINE_ANGLES.map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const dx = Math.cos(rad) * strokeWidth;
        const dy = Math.sin(rad) * strokeWidth;
        return (
          <Image
            key={angle}
            source={source}
            resizeMode="contain"
            tintColor={strokeColor}
            style={[styles.layer, { width, height, left: strokeWidth + dx, top: strokeWidth + dy }]}
          />
        );
      })}
      <Image
        source={source}
        resizeMode="contain"
        style={[styles.layer, { width, height, left: strokeWidth, top: strokeWidth }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
  },
});
