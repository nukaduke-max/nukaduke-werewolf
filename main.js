// main.js
// Firebase と Firestore をCDNから読み込む
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ★ 部屋は1つだけ：固定ID
const ROOM_ID = "main"; // 好きな文字列に変えてOK

// あなたの firebaseConfig
const firebaseConfig = {
  apiKey: "AIzaSyCZZlMXREYtPTFXMTrjtATsa1xShWmZIZI",
  authDomain: "werewolf-756e4.firebaseapp.com",
  projectId: "werewolf-756e4",
  storageBucket: "werewolf-756e4.firebasestorage.app",
  messagingSenderId: "935198400486",
  appId: "1:935198400486:web:4ad43bbc49adac97a6c027",
  measurementId: "G-Q7LBVYBN3Z"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM取得
const nameInput = document.getElementById("nameInput");
const joinBtn = document.getElementById("joinBtn");
const statusEl = document.getElementById("status");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const chatEl = document.getElementById("chat");

let currentName = null;
let unsubscribeChat = null;

// 前回の名前を復元
const savedName = localStorage.getItem("name");
if (savedName) nameInput.value = savedName;

// チャットのリスナーだけ、最初から張っておく
function startChatListener() {
  const msgsRef = collection(db, "rooms", ROOM_ID, "messages");
  const q = query(msgsRef, orderBy("createdAt", "asc"));

  unsubscribeChat = onSnapshot(
    q,
    (snapshot) => {
      chatEl.innerHTML = "";
      snapshot.forEach((doc) => {
        const data = doc.data();
        const msgEl = document.createElement("div");
        msgEl.className = "msg";

        const nameSpan = document.createElement("span");
        nameSpan.className = "name";
        nameSpan.textContent = data.name || "？";

        const textSpan = document.createElement("span");
        textSpan.textContent = data.text || "";

        const timeSpan = document.createElement("span");
        timeSpan.className = "time";
        if (data.createdAt?.toDate) {
          const d = data.createdAt.toDate();
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");
          timeSpan.textContent = `(${hh}:${mm})`;
        }

        msgEl.appendChild(nameSpan);
        msgEl.appendChild(textSpan);
        msgEl.appendChild(timeSpan);

        chatEl.appendChild(msgEl);
        chatEl.scrollTop = chatEl.scrollHeight;
      });
    },
    (error) => {
      console.error(error);
      statusEl.textContent = "チャットの読み込みでエラーが発生しました。";
    }
  );
}

// 名前を設定してチャット開始
joinBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (!name) {
    alert("名前を入力してください");
    return;
  }

  currentName = name;
  localStorage.setItem("name", name);

  statusEl.textContent = `「${ROOM_ID}」部屋で ${name} としてチャット中`;
  sendBtn.disabled = false;

  if (!unsubscribeChat) {
    startChatListener();
  }
});

// メッセージ送信
sendBtn.addEventListener("click", async () => {
  if (!currentName) {
    alert("先に名前を設定してください");
    return;
  }

  const text = messageInput.value.trim();
  if (!text) return;

  sendBtn.disabled = true;

  try {
    const msgsRef = collection(db, "rooms", ROOM_ID, "messages");
    await addDoc(msgsRef, {
      name: currentName,
      text,
      createdAt: serverTimestamp()
    });
    messageInput.value = "";
  } catch (e) {
    console.error(e);
    alert("メッセージの送信に失敗しました");
  } finally {
    sendBtn.disabled = false;
  }
});

// ページを開いた時点で一応リスナー開始（まだ名前だけ未設定状態）
startChatListener();
