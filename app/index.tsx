import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Appbar,
  Button,
  Snackbar,
  Text,
} from 'react-native-paper';

export default function HomeScreen() {
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const showSnackbar = () => setSnackbarVisible(true);
  const hideSnackbar = () => setSnackbarVisible(false);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="GoNext" />
      </Appbar.Header>

      <View style={styles.content}>
        <Text variant="titleLarge" style={styles.text}>
          Привет, React Native Paper!
        </Text>
        <Button mode="contained" onPress={showSnackbar} style={styles.button}>
          Нажми меня
        </Button>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={hideSnackbar}
        duration={3000}
        action={{
          label: 'OK',
          onPress: hideSnackbar,
        }}
      >
        Кнопка нажата
      </Snackbar>
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
  text: {
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    minWidth: 160,
  },
});
