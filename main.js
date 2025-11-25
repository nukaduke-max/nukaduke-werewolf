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

// ★ この部屋のパスワード（ここを好きに変えてOK）
const ROOM_PASSWORD = "werewolf123";

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
const passwordInput = document.getElementById("passwordInput");
const joinBtn = document.getElementById("joinBtn");
const statusEl = document.getElementById("status");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const chatEl = document.getElementById("chat");
const playersListEl = document.getElementById("playersList");

let currentName = null;
let unsubscribeChat = null;
let unsubscribePlayers = null;

// 前回の名前を復元
const savedName = localStorage.getItem("name");
if (savedName) nameInput.value = savedName;

// ===== プレイヤー一覧 =====
function startPlayersListener() {
  const playersRef = collection(db, "rooms", ROOM_ID, "players");
  const q = query(playersRef, orderBy("joinedAt", "asc"));

  unsubscribePlayers = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        playersListEl.textContent = "まだ誰もいません。";
        return;
      }
      playersListEl.innerHTML = "";
      snapshot.forEach((doc) => {
        const data = doc.data();
        const div = document.createElement("div");
        div.className = "player";
        div.textContent = data.name || "？";
        playersListEl.appendChild(div);
      });
    },
    (error) => {
      console.error(error);
      playersListEl.textContent = "プレイヤー一覧の取得でエラーが発生しました。";
    }
  );
}

// ===== チャット一覧 =====
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

// ===== 部屋に入る =====
joinBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const pwd = passwordInput.value.trim();

  if (!name) {
    alert("名前を入力してください");
    return;
  }
  if (!pwd) {
    alert("パスワードを入力してください");
    return;
  }
  if (pwd !== ROOM_PASSWORD) {
    alert("パスワードが違います");
    return;
  }

  currentName = name;
  localStorage.setItem("name", name);

  statusEl.textContent = `部屋「${ROOM_ID}」に ${name} として入っています`;
  sendBtn.disabled = false;

  // プレイヤー一覧へ自分を追加（シンプルに毎回1行追加する方式）
  try {
    const playersRef = collection(db, "rooms", ROOM_ID, "players");
    await addDoc(playersRef, {
      name: currentName,
      joinedAt: serverTimestamp()
    });
  } catch (e) {
    console.error(e);
    // 失敗しても致命的じゃないので画面には出さない
  }

  // リスナー開始（まだなら）
  if (!unsubscribeChat) startChatListener();
  if (!unsubscribePlayers) startPlayersListener();
});

// ===== メッセージ送信 =====
sendBtn.addEventListener("click", async () => {
  if (!currentName) {
    alert("先に部屋に入ってください");
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

// ページを開いた時点で一覧リスナーだけ開始（部屋はロックされてる）
startChatListener();
startPlayersListener();
