// app/gamedetails.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Player {
  name: string;
  buyIn: string;
  cashOut: string;
}

interface Payment {
  from: string;
  to: string;
  amount: number;
}

interface Game {
  id: string;
  date: string;
  players: Player[];
  payments: Payment[];
}

export default function GameDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    loadGameDetails();
  }, []);

  const loadGameDetails = async () => {
    try {
      const gamesStr = await AsyncStorage.getItem('pokerGames');
      if (gamesStr) {
        const games: Game[] = JSON.parse(gamesStr);
        const foundGame = games.find(g => g.id === id);
        if (foundGame) {
          setGame(foundGame);
        }
      }
    } catch (error) {
      console.error('Error loading game details:', error);
    }
  };

  const deleteGame = async () => {
    Alert.alert(
      'Delete Game',
      'Are you sure you want to delete this game?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const gamesStr = await AsyncStorage.getItem('pokerGames');
              if (gamesStr) {
                const games: Game[] = JSON.parse(gamesStr);
                const updatedGames = games.filter(g => g.id !== id);
                await AsyncStorage.setItem('pokerGames', JSON.stringify(updatedGames));
                router.push('/');
              }
            } catch (error) {
              console.error('Error deleting game:', error);
              Alert.alert('Error', 'Failed to delete game');
            }
          }
        }
      ]
    );
  };

  const calculateProfit = (player: Player) => {
    return parseFloat(player.cashOut) - parseFloat(player.buyIn);
  };

  const sortedPlayers = game?.players.slice().sort((a, b) => 
    calculateProfit(b) - calculateProfit(a)
  ) || [];

  if (!game) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Game Details</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={deleteGame}
        >
          <Text style={styles.deleteButtonText}>Delete Game</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.date}>
        Date: {new Date(game.date).toLocaleDateString()}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Players Results</Text>
        {sortedPlayers.map((player, index) => {
          const profit = calculateProfit(player);
          return (
            <View key={index} style={styles.playerRow}>
              <Text style={styles.playerName}>{player.name}</Text>
              <View>
                <Text>Buy-in: ${player.buyIn}</Text>
                <Text>Cash-out: ${player.cashOut}</Text>
                <Text style={[
                  styles.profit,
                  { color: profit >= 0 ? 'green' : 'red' }
                ]}>
                  Profit: ${profit.toFixed(2)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payments to Settle</Text>
        {game.payments.map((payment, index) => (
          <View key={index} style={styles.paymentRow}>
            <Text>
              {payment.from} pays {payment.to}:
              <Text style={styles.paymentAmount}> ${payment.amount.toFixed(2)}</Text>
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 16,
    padding: 20,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profit: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  paymentRow: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  paymentAmount: {
    fontWeight: 'bold',
  },
});
