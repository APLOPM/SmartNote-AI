# 🧠 SmartNote AI

> Your intelligent second brain, supercharged by AI agents.

SmartNote AI is a next-generation, cross-platform note-taking application designed to solve the problem of scattered information and ideas. By leveraging powerful AI, it enhances your ability to capture, connect, and create information intelligently.

---

## ✨ Core Features

-   **🤖 AI Agent Workflows:** Go beyond simple text generation. Automate multi-step tasks right from your notes—from creating reports and presentations to searching the web and managing your calendar.
-   **✍️ Intelligent Writing Assistant:** Summarize long documents, expand on your ideas, translate languages, and fix grammar with a single click.
-   **🎙️ Multi-Modal Notes:** Capture your thoughts in any format: rich text, voice recordings, images, sketches, or even scanned documents with OCR.
-   **🔎 Semantic Search:** Find notes based on meaning and context, not just keywords. It understands what you're looking for.
-   **🕸️ Mind Map View:** Automatically visualize the connections between your notes, helping you see the bigger picture.
-   **🔄 Real-time & Offline Sync:** Your notes are always available and seamlessly synced across all your devices (iOS, Android, and Web).

## 🚀 Tech Stack

Our platform is built on a modern, scalable microservices architecture.

-   **Frontend:** React (Web), SwiftUI (iOS), Jetpack Compose (Android)
-   **Backend:** Go (High-Performance Services), Node.js (User Service), Python/FastAPI (AI Orchestration)
-   **Database:** PostgreSQL with `pgvector` for embeddings, MongoDB for flexible note content, and Redis for caching and session management.
-   **AI/ML:** MiniMax-M2.5, OpenAI API (GPT-4), Whisper (Speech-to-Text), Tesseract (OCR).
-   **Infrastructure:** Docker, Kubernetes, GitLab CI/CD for automated deployment and scaling.

## 🏗️ Architecture Overview

We use a Microservices Architecture to ensure scalability and maintainability. Clients interact with a central API Gateway, which routes requests to the appropriate backend service.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client Layer  │────▶│   API Gateway    │────▶│  Microservices  │
│ - iOS, Android  │     │ - Authentication │     │ - Note Service  │
│ - Web App       │     │ - Routing        │     │ - AI Service    │
└─────────────────┘     └──────────────────┘     │ - Sync Service  │
                                                    └────────┬────────┘
                                                             │
                                                    ┌────────▼────────┐
                                                    │   Data Layer    │
                                                    │ - PostgreSQL    │
                                                    │ - MongoDB/Redis │
                                                    └─────────────────┘
```

The core of our intelligence lies in the **AI Agent**, which is powered by a robust **Agent Memory Layer**. This allows the agent to perform complex, multi-step tasks, resume workflows, and learn from past interactions. For more details, see the [Agent Memory Layer ERD](docs/agent-memory-layer-er.md).

## 🛠️ Getting Started (Development)

Follow these steps to set up your local development environment.

```bash
# 1. Clone the repository
git clone https://github.com/APLOPM/SmartNote-AI.git
cd SmartNote-AI

# 2. Run backend services (databases, message queue, etc.)
cd backend
docker-compose up -d

# 3. Set up the database schema
# (Assuming you have Prisma CLI installed)
cd ..
npx prisma migrate dev --name init

# 4. Run the web frontend
cd frontend/web
npm install
npm run dev
```

## 📁 Project Structure

The codebase is organized into the following main directories:

```
/
├── backend/          # All backend microservices (Go, Node.js, Python)
├── frontend/         # Client applications (Web, iOS, Android)
├── prisma/           # Prisma schema for database modeling and migrations
├── docs/             # Technical specifications, diagrams, and documentation
└── docker-compose.yml # Docker configuration for local development
```

## 🎨 Design and UX

Our design is guided by principles of **Clarity, Efficiency, and Control**. We aim for a consistent, bilingual (Thai/English) user experience to ensure accessibility for a diverse user base.

For detailed guidelines on UI components and interaction patterns, see our [AI UX Design System](docs/ai-ux-design-system-th.md).

## 🙌 Contributing

We welcome contributions from the community! To contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes and commit them with a descriptive message.
4.  Push your changes to the branch (`git push origin feature/your-feature-name`).
5.  Open a Pull Request, and we'll review it as soon as possible.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
