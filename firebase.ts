import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {

  apiKey: "AIzaSyANSgEsj9oMf5HrKlP222HdBU5pefuxm5o",

  authDomain: "academia-2dfe3.firebaseapp.com",

  projectId: "academia-2dfe3",

  storageBucket: "academia-2dfe3.firebasestorage.app",

  messagingSenderId: "827421670445",

  appId: "1:827421670445:web:049ad397a71947f4488ca4"

};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };