import { StyleSheet, View, Text } from 'react-native';
import { useColorScheme } from 'react-native';

export function CustomSplashScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#151718' : '#0a7ea4',
        },
      ]}>
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: isDark ? '#ECEDEE' : '#FFFFFF',
            },
          ]}>
          ProofArrive
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: isDark ? '#9BA1A6' : '#E3F2FD',
            },
          ]}>
          Track vehicle arrivals{'\n'}with precision
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '400',
  },
});

