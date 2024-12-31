// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // Comente essa linha, caso não esteja usando analytics.
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_KgO3n6BzWejWFwDJs0wwreS18QB_z40",
  authDomain: "calhumorjano.firebaseapp.com",
  projectId: "calhumorjano",
  storageBucket: "calhumorjano.appspot.com",
  messagingSenderId: "920817014794",
  appId: "1:920817014794:web:cce90cfd082a022621e7f3",
  measurementId: "G-2GKTHK0RMP"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const analytics = getAnalytics(app);
const app = initializeApp(firebaseConfig);

