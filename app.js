import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>⚡ NEXUS</Text>
      <Text style={styles.sub}>Personal AI Hub</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0D13',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4E7CF6',
  },
  sub: {
    fontSize: 14,
    color: '#6B7390',
    marginTop: 8,
  },
});
