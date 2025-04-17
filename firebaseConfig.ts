import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBeiJZqXjwBULewWKY4U1AqKxt9bEAOcNI",
    authDomain: "fitnessapp-340e5.firebaseapp.com",
    projectId: "fitnessapp-340e5",
    storageBucket: "fitnessapp-340e5.firebasestorage.app",
    messagingSenderId: "602719973492",
    appId: "1:602719973492:web:cb74d76cd2367467406121",
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});
const firestore = getFirestore(app);
firestore;
const storage = getStorage(app);

export { app, auth, firestore, storage };
