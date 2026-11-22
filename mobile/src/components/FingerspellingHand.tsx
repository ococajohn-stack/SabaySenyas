import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import type { FingerspellingLetter } from '../data/fingerspelling';

const HAND_IMAGES: Record<string, ImageSourcePropType> = {
  A: require('../../assets/images/A.png'),
  B: require('../../assets/images/B.png'),
  C: require('../../assets/images/C.png'),
  D: require('../../assets/images/D.png'),
  E: require('../../assets/images/E.png'),
  F: require('../../assets/images/F.png'),
  G: require('../../assets/images/G.png'),
  H: require('../../assets/images/H.png'),
  I: require('../../assets/images/I.png'),
  J: require('../../assets/images/J.png'),
  K: require('../../assets/images/K.png'),
  L: require('../../assets/images/L.png'),
  M: require('../../assets/images/M.png'),
  N: require('../../assets/images/N.png'),
  O: require('../../assets/images/O.png'),
  P: require('../../assets/images/P.png'),
  Q: require('../../assets/images/Q.png'),
  R: require('../../assets/images/R.png'),
  S: require('../../assets/images/S.png'),
  T: require('../../assets/images/T.png'),
  U: require('../../assets/images/U.png'),
  V: require('../../assets/images/V.png'),
  W: require('../../assets/images/W.png'),
  X: require('../../assets/images/X.png'),
  Y: require('../../assets/images/Y.png'),
  Z: require('../../assets/images/Z.png'),
};

export default function FingerspellingHand({
  item,
  size = 136,
}: {
  item: FingerspellingLetter;
  size?: number;
}) {
  const image = HAND_IMAGES[item.letter];
  if (!image) {
    throw new Error(`No fingerspelling image is configured for letter ${item.letter}.`);
  }

  return (
    <View style={[styles.card, { width: size, height: size }]}>
      <Image
        accessibilityLabel={`Guhit ng kamay para sa letrang ${item.letter}`}
        resizeMode="contain"
        source={image}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  image: { width: '100%', height: '100%' },
});
