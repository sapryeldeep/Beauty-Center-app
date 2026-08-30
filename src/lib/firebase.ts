import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDYAt4D7h8EGJlP9aL8r11mTtOcFXBKVx8",
  authDomain: "beauty-center-40ee0.firebaseapp.com",
  databaseURL: "https://beauty-center-40ee0-default-rtdb.firebaseio.com",
  projectId: "beauty-center-40ee0",
  storageBucket: "beauty-center-40ee0.firebasestorage.app",
  messagingSenderId: "1036559035207",
  appId: "1:1036559035207:web:c423550e1de8bd952dba62",
  measurementId: "G-VHZ4F6MN1F"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
