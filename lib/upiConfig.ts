export const UPI_CONFIG = {
  upiId: 'YOUR_UPI_ID@upi',        // ← Rahul fills this
  name: 'Victarc',
  plans: {
    basic: {
      amount: 49,
      label: 'A-Rank Hunter — Lifetime Access',
      upiDeeplink: (upiId: string) => 
        `upi://pay?pa=${upiId}&pn=Victarc&am=49&cu=INR&tn=Victarc+A-Rank+Lifetime`
    },
    premium: {
      amount: 99,
      label: 'S-Rank Hunter — Lifetime Access',
      upiDeeplink: (upiId: string) =>
        `upi://pay?pa=${upiId}&pn=Victarc&am=99&cu=INR&tn=Victarc+S-Rank+Lifetime`
    }
  },
  adminEmail: 'YOUR_EMAIL@gmail.com', // ← Rahul fills this
  supportMessage: 'After payment, upload your screenshot below. Access granted within 2 hours.'
}

export const COIN_UPI_CONFIG = {
  packages: [
    { id: 'coins_100', coins: 100, amount: 19, 
      label: '100 Victarc Coins',
      note: 'Victarc+100+Coins' },
    { id: 'coins_500', coins: 500, amount: 99,
      label: '500 Victarc Coins', tag: 'POPULAR',
      note: 'Victarc+500+Coins' },
    { id: 'coins_1000', coins: 1000, amount: 199,
      label: '1,000 Victarc Coins',
      note: 'Victarc+1000+Coins' },
    { id: 'coins_10000', coins: 10000, amount: 599,
      label: '10,000 Victarc Coins', tag: 'BEST VALUE',
      note: 'Victarc+10000+Coins' },
    { id: 'coins_20000', coins: 20000, amount: 999,
      label: '20,000 Victarc Coins', tag: 'SHADOW MONARCH',
      note: 'Victarc+20000+Coins' },
  ],
  upiDeeplink: (upiId: string, amount: number, note: string) =>
    `upi://pay?pa=${upiId}&pn=Victarc&am=${amount}&cu=INR&tn=${note}`
}
