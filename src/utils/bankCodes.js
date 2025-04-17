export const bankCodes = {
'0010': { name: 'Ziraat Bankası', logo: require('../../assets/banks/0010.png') },
 '0013': { name: 'Denizbank', logo: require('../../assets/banks/0013.png') },
 '0064': { name: 'İş Bankası', logo: require('../../assets/banks/0064.png') },
// '0046': { name: 'Akbank', logo: require('../../assets/banks/0046.png') },
// '0059': { name: 'Şekerbank', logo: require('../../assets/banks/0059.jpg') },
// '0205': { name: 'KuveytTürk', logo: require('../../assets/banks/0205.png ') },
// '0133': { name: 'IngBank', logo: require('../../assets/banks/0133.jpg') },
// '0210': { name: 'Vakıf Katılım', logo: require('../../assets/banks/0210.png') },
};

export const getBankFromIban = (iban) => {
  if (!iban || iban.length < 8) return null;
  const bankCode = iban.replace(/\s/g, '').substring(4, 8);
  return bankCodes[bankCode] || null;
};