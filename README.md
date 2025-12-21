# Smart Idea Finder

A modern web application that helps you generate, organize, and develop business ideas using AI. Create pitch decks, roadmaps, and generate creative ideas all in one place.

![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Active-brightgreen)

## ✨ Features

- **AI-Powered Idea Generation** - Generate innovative business ideas with AI assistance
- **Pitch Deck Generator** - Create professional pitch decks automatically
- **Roadmap Generator** - Plan your project with AI-generated roadmaps
- **Idea Management** - Save, organize, and manage your ideas
- **User Authentication** - Secure login and signup system
- **PDF Export** - Download your ideas and plans as PDF
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Beautiful Green Theme** - Modern, clean, and professional UI

## 🛠️ Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- Lucide React Icons

### Backend

- Node.js
- Express.js
- MongoDB (Database)
- JWT Authentication
- IBM Watsonx.ai (LLM) via `ibm-cloud-sdk-core`

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/YOUR-USERNAME/smart-idea-finder.git
cd smart-idea-finder
```

2. **Install frontend dependencies:**

```bash
cd client
npm install
cd ..
```

3. **Install backend dependencies:**

```bash
cd server
npm install
cd ..
```

4. **Setup environment variables:**

Create `.env` in the `server` folder:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development

 # IBM Watsonx.ai (required for AI features)
 WATSON_API_KEY=your_ibm_watson_api_key
 WATSON_URL=https://api.us-east.ml.cloud.ibm.com
 WATSON_PROJECT_ID=your_watson_project_id
 # Optional: choose a model (defaults to ibm/granite-13b-chat-v2)
 WATSON_MODEL=ibm/granite-13b-chat-v2

 # RAG/Embeddings (optional; set true to skip seeding if quotas limited)
 RAG_SKIP_SEED=true
```

### Running Locally

**Terminal 1 - Backend:**

```bash
cd server
npm start
```

Server runs on `http://localhost:5000`

**Terminal 2 - Frontend:**

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173`

## 📱 How to Use

1. **Sign Up** - Create a new account or login
2. **Generate Ideas** - Use the AI Idea Generator to brainstorm
3. **Create Pitch Deck** - Generate a professional pitch deck
4. **Build Roadmap** - Create a project roadmap
5. **Save & Organize** - All ideas are automatically saved
6. **Export** - Download as PDF for sharing

## 🌐 Deployment

### Frontend (GitHub Pages)

1. **Install gh-pages:**

```bash
cd client
npm install --save-dev gh-pages
```

2. **Update `package.json`:**

```json
"homepage": "https://YOUR-USERNAME.github.io/smart-idea-finder",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

3. **Update `vite.config.js`:**

```javascript
export default {
  base: "/smart-idea-finder/",
  // ... rest of config
};
```

4. **Deploy:**

```bash
npm run deploy
```

Your site will be live at: `https://YOUR-USERNAME.github.io/smart-idea-finder`

### Backend (Render.com)

1. Go to [render.com](https://render.com) and sign up
2. Create new Web Service → Connect your GitHub repo
3. Set Build Command: `cd server && npm install`
4. Set Start Command: `cd server && npm start`
5. Add environment variables in settings
6. Deploy!

> Note: Include `WATSON_API_KEY`, `WATSON_URL`, `WATSON_PROJECT_ID`, and optional `WATSON_MODEL` in the service's environment variables so AI endpoints work in production.

### Connect Frontend to Backend

Create `client/.env.production`:

```
VITE_API_URL=https://your-backend-url.onrender.com
```

Update API calls to use this variable.

## 📁 Project Structure

```
smart-idea-finder/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── vite.config.js
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── models/        # Database models
│   │   ├── middleware/    # Auth middleware
│   │   └── index.js       # Server entry point
│   └── package.json
└── README.md
```

## 🔐 Authentication

The app uses JWT (JSON Web Tokens) for secure authentication. Tokens are stored in localStorage and sent with each API request.

## 💡 Features in Detail

### IBM Watsonx.ai Setup

- Create an IBM Cloud account and provision Watsonx.ai
- Retrieve your API key and service URL, then set `WATSON_API_KEY` and `WATSON_URL`
- (Optional) create a project and set `WATSON_PROJECT_ID`
- The server uses `watsonService.js` to call the model; default model is `ibm/granite-13b-chat-v2`
- If Watson credentials are missing, API calls will fail; ensure the env vars are configured

### AI Idea Generator

- Input a topic and get creative business ideas
- Multiple idea suggestions
- Save favorite ideas

### Pitch Deck Generator

- Create professional presentations
- Multiple slides (Problem, Solution, Market, etc.)
- Export as PDF

### Roadmap Generator

- Plan project phases
- Timeline and milestones
- Task breakdown

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

For issues, questions, or suggestions, please open an issue on GitHub.

## 🎯 Roadmap

- [ ] Team collaboration features
- [ ] Export to more formats (Docx, PPT)
- [ ] Advanced analytics
- [ ] Idea marketplace
- [ ] Mobile app
- [ ] Dark mode toggle

## 👨‍💻 Author

Created with ❤️ for innovators and entrepreneurs

---

**Ready to bring your ideas to life? Start building today!** 🚀
