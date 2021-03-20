import firebase from 'firebase';
const config = {
  apiKey: "AIzaSyBg7axSnSalAYPAU7I7BNQS7DwUvQieFWk",
  authDomain: "basketball-stat-app.firebaseapp.com",
  databaseURL: "https://basketball-stat-app.firebaseio.com",
  projectId: "basketball-stat-app",
  storageBucket: "basketball-stat-app.appspot.com",
  messagingSenderId: "451849286184"
};
firebase.initializeApp(config);
export default firebase;
