import firebase from 'firebase/app';
import 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import 'firebase/storage';


// Initialize Firebase
const config = {
    apiKey: process.env.REACT_APP_API_FB_KEY,
    authDomain: process.env.REACT_APP_FB_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FB_DATABASE_URL,
    projectId: process.env.REACT_APP_FB_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FB_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FB_MESSAGING_SENDER_ID
};

firebase.initializeApp(config);

const firebaseStorage = firebase.storage();
const firebaseTeams = firebaseStorage.ref('Teams');
const firebasePlayers = firebaseStorage.ref('Players');

export {
    firebase,
    firebaseTeams,
    firebasePlayers,
    firebaseStorage
}
