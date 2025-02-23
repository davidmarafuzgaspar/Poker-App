// app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

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

export default function HomeScreen() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadGames();
    }, [])
  );

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const savedGames = await AsyncStorage.getItem('pokerGames');
      if (savedGames) {
        setGames(JSON.parse(savedGames));
      } else {
        setGames([]);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Game }) => {
    if (!item) return null;

    const gameDate = new Date(item.date).toLocaleDateString();
    const totalPlayers = item.players?.length || 0;
    const totalMoney = item.players?.reduce((sum, player) => 
      sum + (parseFloat(player.buyIn) || 0), 0
    ) || 0;
    
    return (
      <TouchableOpacity
        style={styles.gameItem}
        onPress={() => router.push(`/gamedetails?id=${item.id}`)}
      >
        <Text style={styles.gameText}>Game on {gameDate}</Text>
        <Text style={styles.playerCount}>
          {totalPlayers} players • ${totalMoney.toFixed(2)} total
        </Text>
        <Text style={styles.paymentCount}>
          {item.payments?.length || 0} payments to settle
        </Text>
      </TouchableOpacity>
    );
  };

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No poker games have been played yet.</Text>
      <Text style={styles.emptySubText}>Add your first game to get started!</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={games}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={EmptyListComponent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Poker Games</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/newgame')}
            >
              <Text style={styles.addButtonText}>Add New Game</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f0f0f0",
    paddingBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f0f0f0"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold" 
  },
  addButton: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
  },
  addButtonText: { 
    color: "white", 
    fontWeight: "bold" 
  },
  gameItem: {
    backgroundColor: "white",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 5,
  },
  gameText: { 
    fontSize: 16,
    marginBottom: 4
  },
  playerCount: {
    fontSize: 14,
    color: '#666'
  },
  paymentCount: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic'
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 50
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  emptySubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  }
});
