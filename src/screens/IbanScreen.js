import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Clipboard, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwipeListView } from 'react-native-swipe-list-view';
import AsyncStorage from '@react-native-async-storage/async-storage';

function IbanScreen() {
  const [iban, setIban] = useState('');
  const [bankName, setBankName] = useState('');
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [personalBanks, setPersonalBanks] = useState([]); // Kişisel hesaplar
  const [businessBanks, setBusinessBanks] = useState([]); // İş hesapları

  useEffect(() => {
    loadSavedBanks();
  }, []);


  const loadSavedBanks = async () => {
    try {
      const personalBanksString = await AsyncStorage.getItem('personalBanks');
      const businessBanksString = await AsyncStorage.getItem('businessBanks');
      if (personalBanksString) {
        setPersonalBanks(JSON.parse(personalBanksString));
      }
      if (businessBanksString) {
        setBusinessBanks(JSON.parse(businessBanksString));
      }
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };

  const handleBankSearch = (text) => {

    setBankName(text);
    if (text.length > 0) {
      // Tüm bankaları birleştir
      const allBanks = [...personalBanks, ...businessBanks];
      // Arama yap
      const filtered = allBanks.filter((bank) =>
        bank.bankName.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredBanks(filtered);
    } else {
      setFilteredBanks([]);
    }
  };

  const selectBank = (bank) => {
    setSelectedBank(bank);
    setBankName(bank.bankName);
    setIban(bank.iban);
    setFilteredBanks([]);
  };
  const handleCopyIban = async (iban) => {
      await Clipboard.setString(iban);
      Alert.alert("Başarılı", "IBAN kopyalandı");
  };
const renderBankDetails = (data) => (
  <View style={[styles.bankDetails, styles.resultSection]}>
    <Text style={styles.bankDetailsTitle}>Sorgulama Sonucu</Text>
    <Text style={styles.bankDetailsText}>Hesap Adı: {data.item.accountName}</Text>
    <Text style={styles.bankDetailsText}>Banka Adı: {data.item.bankName}</Text>
    <View style={styles.ibanRow}>
      <Text style={styles.bankDetailsText}>IBAN: {data.item.iban}</Text>
      <TouchableOpacity
        style={styles.copyButton}
        onPress={() => handleCopyIban(data.item.iban)}
      >
        <Ionicons name="copy-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  </View>
);

  const renderHiddenItem = () => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => setSelectedBank(null)}
      >
        <Ionicons name="trash" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerText}>IBAN Sorgulama</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Banka Adı"
            placeholderTextColor="#666"
            value={bankName}
            onChangeText={handleBankSearch}
          />
        </View>

        {filteredBanks.length > 0 && (
          <View style={styles.bankList}>
            {filteredBanks.map((bank) => (
              <TouchableOpacity
                key={bank.iban}
                style={styles.bankItem}
                onPress={() => selectBank(bank)}
              >
                <Text style={styles.bankItemText}>{bank.bankName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}



        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Sorgula</Text>
        </TouchableOpacity>

        {selectedBank && (
          <SwipeListView
            data={[selectedBank]}
            renderItem={renderBankDetails}
            renderHiddenItem={renderHiddenItem}
            rightOpenValue={-75}
            previewRowKey={'0'}
            previewOpenValue={-40}
            previewOpenDelay={3000}
            style={styles.swipeList}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
 ibanRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 5,
},
copyButton: {
  padding: 5,
  borderRadius: 5,
  backgroundColor: '#007AFF',
},
  screen: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    fontSize: 16,
  },
  scanButton: {
    marginLeft: 10,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bankList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 200,
  },
  bankItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  bankItemText: {
    color: 'white',
    fontSize: 16,
  },
  bankDetails: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
  },
  bankDetailsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bankDetailsText: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 5,
  },
  ibanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  resultSection: {
    marginTop: 30,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
  },
  swipeList: {
    marginTop: 20,
  },
  rowBack: {
    alignItems: 'flex-end',
    backgroundColor: '#333',
    flex: 1,
    marginTop: 30,
    borderRadius: 15,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    width: 75,
    height: '100%',
    backgroundColor: '#FF3B30',
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    right: 0,
  },
});

export default IbanScreen;