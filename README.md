# 🎓 ScholarSync

**ScholarSync** is a comprehensive platform designed for researchers and academics to manage their professional profiles, generate intelligent project suggestions, and enhance academic visibility.

---

## 🚀 Features

### 📄 Resume Parsing
- Upload resumes in PDF or DOCX format
- Automatically extract key information
- Display data in a structured format
- Supports multiple resume formats

### 🔗 Google Scholar Integration
- Connect your Google Scholar profile
- Import research publications, citations & metrics
- Keep academic profiles up-to-date

### 💡 AI-Powered Project Suggestions
- Personalized project ideas based on your resume and publications
- Smart suggestions using Gemini AI
- Save, manage, export or share suggestions

### 🧑‍🎓 Profile Management
- Centralized academic dashboard
- Edit and update professional data
- Track academic progress
- Export full profile in one click

---

## 📋 Prerequisites

Ensure the following tools/services are available on your system:

- **Node.js** (v18.x or higher)
- **npm** or **yarn**
- **Google Scholar** profile link
- **Gemini API Key** (from Google Generative AI)

---

## 🛠️ Installation

### 1. Clone the Repository
```bash
git https://github.com/bhanu1232/scholarsync-resume-integration-bhanuprakash
cd scholorsync
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file in the root directory:

```env
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Start the Development Server
```bash
npm run dev
```

Access the app at: [http://localhost:3000](http://localhost:3000)

---

## 📖 Usage Guide

### ✅ Resume Upload
1. Go to the Dashboard
2. Click **Upload Resume**
3. Select your file (PDF/DOCX, max 10MB)
4. Wait for parsing
5. Review and save extracted data

### ✅ Google Scholar Integration
1. Navigate to **Scholar Profile**
2. Enter your Google Scholar URL  
   (Format: `https://scholar.google.com/citations?user=YOUR_ID`)
3. Click **Fetch Profile**
4. Review and save imported data

### ✅ Project Suggestions
1. Ensure resume is uploaded & Scholar is connected
2. Go to **Project Suggestions**
3. Click **Generate Suggestions**
4. Save/export interesting ideas

---

## 🔧 Development Guide

### 📁 Project Structure
```
scholorsync/
├── app/
│   ├── api/         # API routes
│   ├── components/  # Reusable components
│   ├── store/       # Redux store & slices
│   └── styles/      # Global styles
├── public/          # Static assets
└── types/           # TypeScript type definitions
```

### 📜 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint your code
npm run lint

# Type checking
npm run type-check
```

---

## 🆘 Support

### 📚 Documentation
- [Docs](docs/)
- [FAQ](docs/FAQ.md)

### 🐛 Report Issues
- Search existing issues
- Create a new one with:
  - Description
  - Steps to reproduce
  - Expected vs actual behavior

### ✉️ Contact Maintainers
- Email: support@scholorsync.com
- GitHub Discussions

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Google Generative AI](https://ai.google.dev/)

---

## 🔗 Useful Links

- [Documentation](https://docs.scholorsync.com)
- [API Reference](https://api.scholorsync.com)
- [Community Forum](https://community.scholorsync.com)
- [Blog](https://blog.scholorsync.com)

---

## 🚀 Deployment

Deploy your Next.js app with [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Refer to the [Next.js Deployment Docs](https://nextjs.org/docs/app/building-your-application/deploying) for more info.

---

## 🧠 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Interactive Next.js Tutorial](https://nextjs.org/learn)
- [Next.js GitHub Repository](https://github.com/vercel/next.js)
