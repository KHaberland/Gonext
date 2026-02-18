import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Appbar, Button, Text } from 'react-native-paper';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="GoNext" />
      </Appbar.Header>

      <View style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>
          Главное меню
        </Text>
        <View style={styles.buttons}>
          <Button
            mode="contained"
            onPress={() => router.push('/places')}
            style={styles.button}
          >
            Места
          </Button>
          <Button
            mode="contained"
            onPress={() => router.push('/trips')}
            style={styles.button}
          >
            Поездки
          </Button>
          <Button
            mode="contained"
            onPress={() => router.push('/next-place')}
            style={styles.button}
          >
            Следующее место
          </Button>
          <Button
            mode="contained"
            onPress={() => router.push('/settings')}
            style={styles.button}
          >
            Настройки
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
