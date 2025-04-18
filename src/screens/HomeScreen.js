import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, TextInput, Text, Pressable, Clipboard, Alert, ScrollView, Image, Share, StatusBar, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SwipeListView } from 'react-native-swipe-list-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBankFromIban } from '../utils/bankCodes';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [iban, setIban] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [personalBanks, setPersonalBanks] = useState([]);
  const [businessBanks, setBusinessBanks] = useState([]);
  const [banks, setBanks] = useState({}); 
  const listViewRef = useRef(null);
  const [editIndex, setEditIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('Tümü');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState(['Tümü']);
  const [filteredBanks, setFilteredBanks] = useState(null);

  // Load Saved Banks on Component Mount
  useEffect(() => {
    loadSavedBanks();
    loadCategories();
  }, []);

  // Load Saved Banks from AsyncStorage
  const loadSavedBanks = async () => {
    try {
      const savedBanks = await AsyncStorage.getItem('banks');
      if (savedBanks) setBanks(JSON.parse(savedBanks));
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };
  
  const handleEditCategory = () => {
    if (!activeTab || activeTab.toLowerCase() === 'tümü') {
      Alert.alert("Uyarı", "Bu kategori düzenlenemez.");
      return;
    }
    setNewCategory(activeTab);
    setCategoryModalVisible(true);
  };



  const handleSaveCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      // Check if category already exists
      if (categories.includes(newCategory.toLowerCase())) {
        Alert.alert("Hata", "Bu kategori zaten mevcut.");
        return;
      }

      // Add new category to the list
      const updatedCategories = [...categories, newCategory.toLowerCase()];
      await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
      setCategories(updatedCategories);

      // Initialize empty array for new category in banks object
      const updatedBanks = { ...banks };
      updatedBanks[newCategory.toLowerCase()] = [];
      setBanks(updatedBanks);
      await AsyncStorage.setItem('banks', JSON.stringify(updatedBanks));

      // Switch to the newly created category
      setActiveTab(newCategory.toLowerCase());

      // Clear new category input and close modal
      setNewCategory('');
      setCategoryModalVisible(false);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  // Load Categories from AsyncStorage
  const loadCategories = async () => {
    try {
      const savedCategories = await AsyncStorage.getItem('categories');
      if (savedCategories) setCategories(JSON.parse(savedCategories));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // IBAN Validation Function
  const isValidIban = (iban) => {
    const cleanIban = iban.replace(/\s/g, '');
    const ibanRegex = /^TR[0-9]{24}$/;
    return ibanRegex.test(cleanIban);
  };

  // Handle Copying an IBAN
  const handleCopyIban = async (iban) => {
    await Clipboard.setString(iban);
    Alert.alert("Kopyalandı");
  };
  
  const handleShare = async (bankInfo) => {
    try {
      await Share.share({
        message: `${bankInfo.accountName}\nBanka: ${bankInfo.bankName}\nIBAN: ${bankInfo.iban}`,
      });
    } catch (error) {
      Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu');
    }
  };
  
  // Handle Deleting a Bank Account
  const handleDeleteBank = async (index) => {
    try {
      const updatedBanks = { ...banks }; // Copy current banks
      const currentBanks = updatedBanks[activeTab] || []; // Get banks for active tab
      const newBanks = currentBanks.filter((_, i) => i !== index); // Filter out the one to delete
      updatedBanks[activeTab] = newBanks; // Update the banks list

      setBanks(updatedBanks); // Update state
      await AsyncStorage.setItem('banks', JSON.stringify(updatedBanks)); // Save to storage
      
      // Safely close rows if ref exists
      if (listViewRef.current && listViewRef.current.closeAllRows) {
        listViewRef.current.closeAllRows();
      }
    } catch (error) {
      console.error('Error deleting bank:', error);
    }
  };
  
  // Render List Items
  const renderItem = (data) => {
    const bankInfo = getBankFromIban(data.item.iban);
    return (
      <View style={styles.card}>
        <View style={styles.bankLabel}>
          <Text style={styles.bankLabelText}>{bankInfo?.name || data.item.bankName}</Text>
        </View>
        <View style={styles.cardHeader}>
          <View style={styles.nameContainer}>
            {bankInfo?.logo && (
              <View style={styles.bankLogo}>
                <Image 
                  source={bankInfo.logo} 
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'contain'
                  }}
                />
              </View>
            )}
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{data.item.accountName}</Text>
              <Text style={styles.iban}>{data.item.iban}</Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleCopyIban(data.item.iban)}
            >
              <Ionicons name="copy-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleShare(data.item)}
            >
              <Ionicons name="share-social-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render Hidden Actions for Swipe
  const renderHiddenItem = (data) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() =>
          Alert.alert(
            "İşlemler",
            "Yapmak istediğiniz işlemi seçin",
            [
              {
                text: "Düzenle",
                onPress: () => {
                  // Navigate to AddBankScreen with pre-filled data
                  navigation.navigate('AddBank', {
                    accountName: data.item.accountName,
                    bankName: data.item.bankName,
                    iban: data.item.iban,
                    editIndex: data.index,
                    activeTab,
                    onSaveComplete: loadSavedBanks
                  });
                },
              },
              {
                text: "Sil",
                onPress: () => handleDeleteBank(data.index),
                style: 'destructive',
              },
              { text: "İptal", style: 'cancel' },
            ]
          )
        }
      >
        <Ionicons name="ellipsis-vertical" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteBank(data.index)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  const handleDeleteCategory = async () => {
    if (activeTab.toLowerCase() === 'tümü') {
      Alert.alert("Uyarı", "Bu kategori silinemez.");
      return;
    }
  
    if (categories.length <= 1) { // Changed from 1 to 2 because we always need "Tümü" + at least one category
      Alert.alert("Hata", "En az bir kategori bulunmalıdır.");
      return;
    }
  
    Alert.alert(
      "Kategori Sil",
      `"${activeTab}" kategorisini silmek istediğinize emin misiniz?`,
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedCategories = categories.filter(cat => cat !== activeTab);
              await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
              setCategories(updatedCategories);
              setActiveTab('tümü'); // Switch to "Tümü" category after deletion
              setIsMenuVisible(false);
            } catch (error) {
              console.error('Error deleting category:', error);
            }
          }
        }
      ]
    );
  };

  const handleBankSearch = (text) => {
    setBankName(text);
    if (text.length > 0) {
      // Tüm kategorilerdeki bankaları birleştir
      const allBanks = Object.keys(banks).flatMap((category) =>
        banks[category].map((bank) => ({ ...bank, category }))
      );

      // Arama yap
      const filtered = allBanks.filter((bank) =>
        bank.bankName.toLowerCase().includes(text.toLowerCase())
      );

      // Filtrelenmiş bankaları kategorilere göre grupla
      const groupedFilteredBanks = filtered.reduce((acc, bank) => {
        if (!acc[bank.category]) {
          acc[bank.category] = [];
        }
        acc[bank.category].push(bank);
        return acc;
      }, {});

      setFilteredBanks(groupedFilteredBanks);
    } else {
      setFilteredBanks(null); // Arama metni boşsa filtreyi temizle
    }
  };

  const renderBankList = (data, category) => (
    <View key={category}>
      <Text style={styles.categoryTitle}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
      {data.map((item, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.accountName}>{item.accountName}</Text>
              <Text style={styles.separator}>|</Text>
              <Text style={styles.bankName}>{item.bankName}</Text>
            </View>
            <TouchableOpacity onPress={() => handleCopyIban(item.iban)}>
              <Ionicons name="copy-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.iban}>{item.iban}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Banka Hesapları</Text>
        <TouchableOpacity
          style={styles.editButtton}
          onPress={() => setIsMenuVisible(!isMenuVisible)}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar - Moved above tabs */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Ara..."
          placeholderTextColor="#666"
          value={bankName}
          onChangeText={handleBankSearch}
        />
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabsScrollView}
        contentContainerStyle={styles.tabsContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category} // Ensure each category is a unique string
            style={[styles.tabButton, activeTab === category && styles.activeTab]}
            onPress={() => setActiveTab(category)}
          >
            <Text style={[styles.tabText, activeTab === category && styles.activeTabText]}>
              {typeof category === 'string' ? category.charAt(0).toUpperCase() + category.slice(1) : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Swipe List */}
      {filteredBanks ? (
        <ScrollView style={styles.scrollView}>
          {Object.keys(filteredBanks).map((category) =>
            renderBankList(filteredBanks[category], category)
          )}
        </ScrollView>
      ) : (
        <SwipeListView
          ref={listViewRef}
          data={activeTab === 'tümü' 
            ? Object.values(banks).flat() 
            : banks[activeTab] || []}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          leftOpenValue={75}
          rightOpenValue={-75}
          style={styles.scrollView}
          closeOnRowPress={true}
          disableRightSwipe={false}
          closeOnRowBeginSwipe={true}
          swipeToOpenPercent={30}
        />
      )}

      {/* Floating Action Button Menu */}
      {isMenuVisible && (
        <TouchableWithoutFeedback onPress={() => setIsMenuVisible(false)}>
          <View style={StyleSheet.absoluteFillObject}>
            <View style={menuStyles.fabMenu}>
              <TouchableOpacity
                style={menuStyles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  setNewCategory('');
                  setCategoryModalVisible(true);
                }}
              >
                <Ionicons name="folder-outline" size={24} color="white" />
                <Text style={menuStyles.menuText}>Kategori Ekle</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={menuStyles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  handleEditCategory();
                }}
              >
                <Ionicons name="create-outline" size={24} color="white" />
                <Text style={menuStyles.menuText}>Kategori Düzenle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={menuStyles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  handleDeleteCategory();
                }}
              >
                <Ionicons name="trash-outline" size={24} color="white" />
                <Text style={menuStyles.menuText}>Kategori Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddBank', { 
          activeTab,
          onSaveComplete: loadSavedBanks 
        })}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Copy All Button */}
      <TouchableOpacity
        style={styles.copyAllButton}
        onPress={async () => {
          // await AsyncStorage.clear();

          const currentBanks = activeTab === 'tümü'
            ? Object.values(banks).flat()
            : banks[activeTab] || [];

          if (currentBanks.length > 0) {
            const allIbans = currentBanks.map((bank) => 
              `${bank.accountName}\nBanka: ${bank.bankName}\nIBAN: ${bank.iban}`
            ).join('\n\n');
            await Clipboard.setString(allIbans);
            Alert.alert("Kopyalandı", "Tüm hesaplar kopyalandı");
          } else {
            Alert.alert("Uyarı", "Kopyalanacak hesap bulunamadı");
          }
        }}
      >
        <Ionicons name="copy" size={24} color="white" />
      </TouchableOpacity>

      {/* Add Category Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={categoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)} 
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{activeTab === newCategory ? 'Kategori Düzenle' : 'Kategori Ekle'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Kategori Adı"
              placeholderTextColor="#666"
              value={newCategory}
              onChangeText={setNewCategory}
            />
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.buttonSave]}
                onPress={handleSaveCategory} // Ensure this is the correct function
              >
                <Text style={styles.textStyle}>Kaydet</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setCategoryModalVisible(false)}
              >
                <Text style={styles.textStyle}>İptal</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles
const menuStyles = StyleSheet.create({
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fabMenu: {
    position: 'absolute',
    right: 20,
    top: 95,
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  menuText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
});

// Update these styles in the StyleSheet
const styles = StyleSheet.create({
  categoryTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  separator: {
    color: '#ccc',
    marginHorizontal: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
  },
  bankLabel: {
    position: 'absolute',
    top: -15,
    left: 20,
    backgroundColor: '#4287f5',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
  bankLabelText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bankLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#444',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4287f5',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  accountName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bankName: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  iban: {
    color: '#ccc',
    fontSize: 14,
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    margin: 15,
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: 'white',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 70,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  editButtton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    textAlignVertical: 'center',
    marginBottom: 5,
    paddingTop: 5,
  },
  tabsScrollView: {
    maxHeight: 60,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    marginHorizontal: 8,
    backgroundColor: '#222',
  },
  tabText: {
    color: '#ccc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeTab: {
    backgroundColor: '#FF3B30',
  },
  activeTabText: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    position: 'relative',
    marginTop: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingRight: 5,
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 30,
    bottom: 100,
    backgroundColor: '#FF3B30',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  copyAllButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    left: 30,
    bottom: 100,
    backgroundColor: '#FF3B30',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: '#333',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 40,
    backgroundColor: '#444',
    color: 'white',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    minWidth: 100,
  },
  buttonSave: {
    backgroundColor: '#2196F3',
  },
  buttonCancel: {
    backgroundColor: '#FF3B30',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rowBack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#333',
    marginBottom: 15,
    borderRadius: 15,
    marginTop: 15,
    height: 85,
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: -1,
  },
  moreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    width: 75,
    height: '100%',
    backgroundColor: '#2196F3',
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    right: 0,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    width: 75,
    height: '100%',
    backgroundColor: '#FF3B30',
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    left: 0,
  },
});

export default HomeScreen;