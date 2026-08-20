import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const querySnapshot = await getDocs(collection(db, "events"));
    console.log("Size:", querySnapshot.size);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
