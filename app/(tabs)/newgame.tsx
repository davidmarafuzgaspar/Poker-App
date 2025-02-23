// app/newgame.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

interface Payment {
  from: string;
  to: string;
  amount: number;
}

interface Player {
  name: string;
  buyIn: string;
  cashOut: string;
}

interface GameWithPayments {
  id: string;
  date: string;
  players: Player[];
  payments: Payment[];
}

export default function NewGameScreen() {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [players, setPlayers] = useState<Player[]>([
    { name: '', buyIn: '', cashOut: '' },
    { name: '', buyIn: '', cashOut: '' },
  ]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [totalBuyIn, setTotalBuyIn] = useState(0);
  const [totalCashOut, setTotalCashOut] = useState(0);

  const addPlayer = () => {
    setPlayers([...players, { name: '', buyIn: '', cashOut: '' }]);
  };

  const updatePlayer = (index: number, field: keyof Player, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setPlayers(newPlayers);
  };

  const hasDuplicateNames = () => {
    const names = players.map(player => player.name.toLowerCase().trim());
    return new Set(names).size !== names.length;
  };

  const checkTotalBalance = () => {
    const buyInTotal = players.reduce((sum, player) => 
      sum + (parseFloat(player.buyIn) || 0), 0
    );
    const cashOutTotal = players.reduce((sum, player) => 
      sum + (parseFloat(player.cashOut) || 0), 0
    );
    
    setTotalBuyIn(buyInTotal);
    setTotalCashOut(cashOutTotal);
    
    // Using toFixed(2) to handle floating point precision issues
    return Number(buyInTotal.toFixed(2)) === Number(cashOutTotal.toFixed(2));
  };

  const calculatePayments = (): Payment[] => {
    // Convert player results to net amounts
    const playerBalances = players.map(player => ({
      name: player.name,
      balance: parseFloat(player.cashOut) - parseFloat(player.buyIn)
    }));

    // Separate winners and losers
    const winners = playerBalances.filter(p => p.balance > 0)
      .sort((a, b) => b.balance - a.balance);
    const losers = playerBalances.filter(p => p.balance < 0)
      .sort((a, b) => a.balance - b.balance);

    const payments: Payment[] = [];

    // For each loser, calculate payments to winners
    losers.forEach(loser => {
      let remainingDebt = Math.abs(loser.balance);
      let winnerIndex = 0;

      while (remainingDebt > 0.01 && winnerIndex < winners.length) {
        const winner = winners[winnerIndex];
        const payment = Math.min(remainingDebt, winner.balance);

        if (payment > 0) {
          payments.push({
            from: loser.name,
            to: winner.name,
            amount: Number(payment.toFixed(2))
          });

          remainingDebt -= payment;
          winners[winnerIndex] = {
            ...winner,
            balance: winner.balance - payment
          };
        }

        winnerIndex++;
      }
    });

    return payments;
  };

  const saveGame = async () => {
    // Check for duplicate names
    if (hasDuplicateNames()) {
      setShowDuplicateModal(true);
      return;
    }

    // Validate all fields are filled
    const isValid = players.every(player => 
      player.name.trim() !== '' && 
      player.buyIn.trim() !== '' && 
      player.cashOut.trim() !== ''
    );

    if (!isValid) {
      Alert.alert('Error', 'Please fill in all player information');
      return;
    }

    // Check if total buy-in equals total cash-out
    if (!checkTotalBalance()) {
      setShowBalanceModal(true);
      return;
    }

    try {
      const existingGamesStr = await AsyncStorage.getItem('pokerGames');
      const existingGames = existingGamesStr ? JSON.parse(existingGamesStr) : [];

      // Calculate payments before saving
      const payments = calculatePayments();

      // Add new game with payments
      const newGame: GameWithPayments = {
        id: Date.now().toString(),
        date: date.toISOString(),
        players,
        payments
      };

      const updatedGames = [...existingGames, newGame];
      await AsyncStorage.setItem('pokerGames', JSON.stringify(updatedGames));
      
      router.push('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to save game');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Game</Text>
      
      <View style={styles.dateContainer}>
        <Text style={styles.label}>Game Date:</Text>
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(event, selectedDate) => {
            setDate(selectedDate || date);
          }}
        />
      </View>

      {players.map((player, index) => (
        <View key={index} style={styles.playerContainer}>
          <Text style={styles.playerTitle}>Player {index + 1}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Player Name"
            value={player.name}
            onChangeText={(value) => updatePlayer(index, 'name', value)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Buy-in Amount"
            keyboardType="numeric"
            value={player.buyIn}
            onChangeText={(value) => updatePlayer(index, 'buyIn', value)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Cash-out Amount"
            keyboardType="numeric"
            value={player.cashOut}
            onChangeText={(value) => updatePlayer(index, 'cashOut', value)}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
        <Text style={styles.addButtonText}>Add Player</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={saveGame}>
        <Text style={styles.saveButtonText}>Save Game</Text>
      </TouchableOpacity>

      <Modal
        visible={showDuplicateModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              There are duplicate player names. Please make sure all players have unique names.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowDuplicateModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showBalanceModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Balance Error</Text>
            <Text style={styles.modalText}>
              The total amounts don't match:
            </Text>
            <Text style={styles.modalAmount}>
              Total Buy-in: ${totalBuyIn.toFixed(2)}
            </Text>
            <Text style={styles.modalAmount}>
              Total Cash-out: ${totalCashOut.toFixed(2)}
            </Text>
            <Text style={styles.modalText}>
              Please check the numbers and try again.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowBalanceModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginBottom: 40,
    backgroundColor: "#fff"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20
  },
  dateContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    marginBottom: 5
  },
  playerContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15
  },
  playerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10
  },
  addButton: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 5,
    width: 100,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
