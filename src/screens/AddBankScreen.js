import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Text, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const AddBankScreen = ({ navigation, route }) => {
  // Ensure route is correctly passed as a prop
  const [iban, setIban] = useState(route.params?.iban || 'TR');
  const [bankName, setBankName] = useState(route.params?.bankName || '');
  const [accountName, setAccountName] = useState(route.params?.accountName || '');
  const activeTab = route.params?.activeTab || 'personal';

  useEffect(() => {
    // If editing, set the initial values from route params
    if (route.params?.iban) setIban(route.params.iban);
    if (route.params?.bankName) setBankName(route.params.bankName);
    if (route.params?.accountName) setAccountName(route.params.accountName);
  }, [route.params]);

  const isValidIban = (iban) => {
    const cleanIban = iban.replace(/\s/g, '');
    const ibanRegex = /^TR[0-9]{24}$/;
    return ibanRegex.test(cleanIban);
  };

  const handleSave = async () => {
    // Tüm alanların dolu olup olmadığını kontrol et
    if (!bankName || !iban || !accountName) {
      Alert.alert("Hata", "Tüm alanları doldurunuz.");
      return;
    }
    if (!isValidIban(iban)) {
      Alert.alert("Hata", "Geçersiz IBAN formatı. TR ile başlayan 26 karakterli bir IBAN giriniz.");
      return;
    }
  
    try {
      // AsyncStorage'dan mevcut banka verilerini çek
      const savedBanks = await AsyncStorage.getItem('banks');
      const banks = savedBanks ? JSON.parse(savedBanks) : {};
      const currentBanks = banks[activeTab] || [];
  
      // Düzenleme modunda mı kontrol et
      if (route.params?.editIndex !== undefined) {
        // Mevcut banka hesabını güncelle
        currentBanks[route.params.editIndex] = { bankName, iban, accountName };
      } else {
        // Yeni bir banka hesabı ekle
        currentBanks.push({ bankName, iban, accountName });
      }
  
      // Güncellenmiş verileri AsyncStorage'a kaydet
      banks[activeTab] = currentBanks;
      await AsyncStorage.setItem('banks', JSON.stringify(banks));
  
      // Kayıt sonrası geri bildirim fonksiyonunu çağır
      if (route.params?.onSaveComplete) {
        route.params.onSaveComplete();
      }
  
      // Önceki ekrana dön
      navigation.goBack();
    } catch (error) {
      console.error('Banka kaydetme hatası:', error);
      Alert.alert("Hata", "Bir hata oluştu. Lütfen tekrar deneyin.");
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