import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Text, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const AddBankScreen = ({ navigation, route }) => {
  const [iban, setIban] = useState('TR');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const activeTab = route.params?.activeTab || 'personal';

  const isValidIban = (iban) => {
    const cleanIban = iban.replace(/\s/g, '');
    const ibanRegex = /^TR[0-9]{24}$/;
    return ibanRegex.test(cleanIban);
  };

  const handleSave = async () => {
    if (!bankName || !iban || !accountName) {
      Alert.alert("Hata", "Tüm alanları doldurunuz.");
      return;
    }
    if (!isValidIban(iban)) {
      Alert.alert("Hata", "Geçersiz IBAN formatı. TR ile başlayan 26 karakterli bir IBAN giriniz.");
      return;
    }

    try {
      const savedBanks = await AsyncStorage.getItem('banks');
      const banks = savedBanks ? JSON.parse(savedBanks) : {};
      const currentBanks = banks[activeTab] || [];
      
      currentBanks.push({ bankName, iban, accountName });
      banks[activeTab] = currentBanks;
      
      await AsyncStorage.setItem('banks', JSON.stringify(banks));
      
      // Call the refresh callback before navigating back
      if (route.params?.onSaveComplete) {
        route.params.onSaveComplete();
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving bank:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.title}>Yeni Hesap</Text>
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="Hesap Adı"
        placeholderTextColor="#666"
        value={accountName}
        onChangeText={setAccountName}
      />
      <TextInput
        style={styles.input}
        placeholder="Banka Adı"
        placeholderTextColor="#666"
        value={bankName}
        onChangeText={setBankName}
      />
      <TextInput
        style={styles.input}
        placeholder="IBAN"
        placeholderTextColor="#666"
        value={iban}
        onChangeText={(text) => {
          let cleanText = text.replace(/[^A-Z0-9]/g, '');
          if (cleanText.length >= 2 && cleanText.substring(0, 2) !== 'TR') {
            cleanText = 'TR' + cleanText.substring(2);
          }
          let formattedIban = cleanText.replace(/(.{4})/g, '$1 ').trim();
          setIban(formattedIban);
        }}
        maxLength={32}
        autoCapitalize="characters"
      />
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Kaydet</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#333',
    color: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddBankScreen;