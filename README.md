🚀 Live Mentor-Student Coding Platform

A real-time collaborative coding platform where mentors and students can interact through live code editing, chat, and video calling.

---

🌐 Live Links

- 🔗 Frontend (Vercel): https://mentor-frontend-one.vercel.app
- 🔗 Backend (Render): https://mentor-backend-i17a.onrender.com

---

🎥 Demo Video

- ▶️ Watch Demo: https://drive.google.com/file/d/1t2vPtR2-87MDILP4YZW850hOSt3huHfQ/view?usp=drivesdk

---

📂 GitHub Repositories

- 💻 Frontend Repo: https://github.com/romasanyal05/mentor-frontend
- ⚙️ Backend Repo: https://github.com/romasanyal05/mentor-backend

---

🌟 Features

💻 Real-Time Code Editor

- Live code collaboration using CRDT (Y.js)
- Multiple users can edit simultaneously
- Changes reflect instantly across all users

💬 Chat System

- Session-based chat
- Messages include:
  - Username
  - Role (Mentor/Student)
  - Timestamp
- Color-coded messages:
  - 🔵 Mentor
  - 🔴 Student
- Clear chat option available

📹 Video Calling

- Peer-to-peer video call using WebRTC
- Signaling handled via Socket.IO
- Start Call / Answer Call functionality

👥 Role System

- Users select:
  - Mentor
  - Student
- Role-based UI styling applied

🔗 Session-Based Collaboration

- Create and share session link
- Multiple users can join the same classroom

---

🛠️ Tech Stack

Frontend

- Next.js (React)
- Monaco Editor
- Socket.IO Client
- Y.js (CRDT)
- Simple-Peer (WebRTC)

Backend

- Node.js
- Express.js
- Socket.IO

Other

- Supabase (Authentication)

---

⚙️ How It Works

1. User logs in and selects role (Mentor/Student)
2. Mentor creates a session
3. Session link is shared with others
4. Users join the session
5. Features available:
   - Live code editing
   - Real-time chat
   - Video calling

---

🔌 Installation (Local Setup)

Backend

cd backend
npm install
node server.js

Frontend

cd frontend
npm install
npm run dev

---

📌 Key Highlights

- Real-time collaboration using CRDT
- WebRTC-based video communication
- Multi-user session handling
- Clean and interactive UI

---

⚠️ Notes

- Video call works best on different devices (due to single camera limitation)
- Stable internet connection required

---



🙌 Conclusion

This project simulates a real-world live classroom environment, enabling seamless interaction between mentors and students through code, chat, and video.

---

👩‍💻 Author

Garima Bhushan
