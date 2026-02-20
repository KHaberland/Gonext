import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Appbar, Button, Text } from 'react-native-paper';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="GoNext" />
      </Appbar.Header>

      <View style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>
          {t('home.title')}
        </Text>
        <View style={styles.buttons}>
          <Button
            mode="contained"
            onPress={() => router.push('/places')}
            style={styles.button}
          >
            {t('home.places')}
          </Button>
          <Button
            mode="contained"
            onPress={() => router.push('/trips')}
            style={styles.button}
          >
            {t('home.trips')}
          </Button>
          <Button
            mode="contained"
            onPress={() => router.push('/next-place')}
            style={styles.button}
          >
            {t('home.nextPlace')}
          </Button>
          <Button
            mode="contained"
            icon="image-multiple"
            onPress={() => router.push('/all-photos')}
            style={styles.button}
          >
            {t('home.allPhotos')}
          </Button>
          <Button
            mode="contained"
            onPress={() => router.push('/settings')}
            style={styles.button}
          >
            {t('home.settings')}
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 32,
    textAlign: 'center',
  },
  buttons: {
    gap: 16,
    width: '100%',
    maxWidth: 280,
  },
  button: {
    minWidth: 200,
  },
});
