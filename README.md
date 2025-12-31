# Portfolio Life Planner

A modern, local-first life planning application that combines **daily task management** with **journaling** and **goal tracking**. Built with Next.js, React, TypeScript, and IndexedDB for a fast, offline-first experience.

![Next.js](https://img.shields.io/badge/Next.js-15.4-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.1-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)

## Overview

Portfolio Life Planner helps you organize your life by connecting daily tasks to long-term goals across different life areas (Health, Family, Career, Learning, etc.). It's designed as a single-page-per-day experience where you can manage tasks and journal your thoughts, all while maintaining visibility into your broader life goals.

### Key Features

- **Calendar View**: Visual month calendar with task indicators, click any day to dive in
- **Daily Task Management**: Create, edit, complete tasks with priorities, due dates, and dependencies
- **Goal Breakdown**: Break down complex goals into actionable sub-tasks with scheduling
- **Daily Journaling**: Integrated journal editor with autosave functionality
- **Life Areas**: Organize tasks by life areas (Health, Family, Career, Learning, etc.)
- **Goal-Task Linking**: Connect tasks to goals for better context and progress tracking
- **Progress Tracking**: Visual progress indicators for goals and tasks
- **Dark Mode**: Built-in dark mode support
- **Local-First**: All data stored locally using IndexedDB (no backend required)
- **Fast & Responsive**: Optimized for performance with Next.js and React

## Live Demo

*[Add your Vercel deployment URL here after deploying]*

**Example:** `https://portfolio-life-planner.vercel.app`

## Tech Stack

### Frontend
- **Next.js 15.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling

### Data Layer
- **Dexie.js** - IndexedDB wrapper for local storage
- **IndexedDB** - Browser database for offline-first architecture

### Utilities
- **date-fns** - Date manipulation and formatting
- **UUID** - Unique identifier generation

## Installation

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Modern browser with IndexedDB support

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/portfolio-life-planner.git
   cd portfolio-life-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
portfolio-life-planner/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Calendar homepage
│   │   ├── day/[date]/        # Daily task & journal page
│   │   ├── goals/             # Goals management pages
│   │   └── life-areas/        # Life areas management
│   ├── components/            # React components
│   │   ├── CalendarMonth.tsx
│   │   ├── TaskList.tsx
│   │   ├── JournalEditor.tsx
│   │   ├── GoalTaskManager.tsx
│   │   └── TaskQuickAdd.tsx
│   ├── contexts/              # React contexts
│   │   └── GoalsContext.tsx
│   ├── lib/                   # Utility functions
│   │   ├── db.ts             # Database schema & CRUD operations
│   │   └── test-seed.ts      # Seed data
│   └── types/                # TypeScript type definitions
│       └── index.ts
├── docs/                      # Documentation
│   └── spec.md               # Product specification
└── public/                   # Static assets
```

## Core Concepts

### Life Areas
Organize your life into meaningful categories:
- Health & Wellness
- Friends & Family
- Career & Work
- Self-Development
- Community
- Play & Creativity

### Goals
Set long-term goals within life areas with:
- Target dates
- Status tracking (Active, Paused, Completed)
- Progress visualization
- Task breakdown

### Tasks
Individual actionable items that can be:
- Linked to goals and life areas
- Scheduled to specific dates
- Assigned priorities (Low, Medium, High)
- Set with due dates and dependencies
- Tracked for completion

### Daily Journal
Reflect on each day with:
- Rich text journal entries
- Auto-save functionality
- Date-specific entries

## Key Features in Detail

### Goal Task Breakdown
Break complex goals into manageable sub-tasks:
- Add multiple tasks with descriptions, priorities, and due dates
- Set task dependencies
- Schedule tasks to specific days
- Edit tasks before scheduling
- Visual progress tracking

### Smart Scheduling
- **Manual Scheduling**: Choose specific dates for tasks
- **Quick Scheduling**: Auto-assign dates based on due dates
- **Task Linking**: Tasks maintain connection to goals and life areas

### Data Persistence
- All data stored locally in browser IndexedDB
- No backend required
- Works completely offline
- Data persists across browser sessions

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Strict TypeScript configuration

## Roadmap

### Planned Features
- [ ] Data export/import (JSON)
- [ ] Cloud sync (Supabase/Firebase integration)
- [ ] Weekly balance view across life areas
- [ ] PWA support (installable, offline)
- [ ] Task templates
- [ ] Recurring tasks
- [ ] Task search and filtering
- [ ] Analytics and insights

### Future Enhancements
- Mobile app (React Native)
- Team collaboration features
- Integration with calendar apps
- Email reminders
- AI-powered task suggestions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI styling with [Tailwind CSS](https://tailwindcss.com/)
- Local storage powered by [Dexie.js](https://dexie.org/)
- Date handling with [date-fns](https://date-fns.org/)

---

Built with care for better life planning
