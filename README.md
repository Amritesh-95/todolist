# Task Manager

A focused, responsive to-do app built with Next.js and React. It greets you by name, shows a fresh quote and background image on every visit, and includes a built-in focus timer, all wrapped in a glass/blur interface.

**Live demo:** [todolist-me-cdd1.vercel.app](https://todolist-me-cdd1.vercel.app)

## Features

- **Task management**: add tasks with a title and description, mark them complete, and delete them
- **Live task counter** in the sidebar showing how many tasks are left
- **Focus timer**: stopwatch-style timer with 5, 15, and 25 minute presets, a draggable dial to set custom minutes, and Start/Reset controls
- **Fresh quote and background image on every reload**
- **Personalised welcome** greeting
- **Glassmorphism UI** with blurred cards and sidebar over a full-screen background
- Responsive layout

## Tech Stack

| Purpose    | Technology           |
| ---------- | -------------------- |
| Framework  | Next.js (App Router) |
| UI library | React                |
| Styling    | Tailwind CSS         |
| Deployment | Vercel               |

## Project Structure

```
.
├── app/           # Pages and layouts (Next.js App Router)
├── components/    # Reusable UI components
├── public/        # Static assets
└── package.json
```

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/Amritesh-95/todolist.git
   cd todolist
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## What I Learned

- Building an interactive app with the Next.js App Router and reusable React components
- Managing task and timer state in React
- Building a draggable dial control for the focus timer
- Creating a glassmorphism UI with Tailwind CSS
- Deploying a Next.js app on Vercel

## Author

**Amritesh Kumar**
[GitHub](https://github.com/Amritesh-95)
