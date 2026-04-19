// Firebase конфигурация (ваши ключи)
const firebaseConfig = {
  apiKey: "AIzaSyDW7OHdTFV5dmvxf2RM3PWcg12bl1Qyx9s",
  authDomain: "wedding-invite-94b2d.firebaseapp.com",
  projectId: "wedding-invite-94b2d",
  storageBucket: "wedding-invite-94b2d.firebasestorage.app",
  messagingSenderId: "286753624552",
  appId: "1:286753624552:web:662d809beb5b0ed016945d",
  measurementId: "G-JT43B3CXZW"
};

// Инициализация Firebase (совместимо с подключенными SDK)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();