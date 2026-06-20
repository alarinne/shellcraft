# ShellCraft

ShellCraft is an interactive visual trainer for learning Linux commands.

It helps beginners practice command-line tasks in a safe simulated terminal. Users choose short labs, type commands, inspect output, and watch visual explanations of what changed in the filesystem or permissions model.

## What It Does

ShellCraft turns Linux practice into short hands-on labs:

* teaches basic shell navigation, files, and permissions
* shows simulated terminal output for each command
* visualizes command effects instead of only printing text
* tracks lab progress, XP, and badges
* keeps command execution inside a safe learning simulator

## Current MVP

The current frontend prototype has four connected screens:

* Landing Page
* Learning Path
* Lab Screen
* Lab Completed

Available now:

* Dark developer UI with blue, purple, orange, and terminal-green accents
* Angular Signals for screen navigation
* Simulated terminal command output
* Lab cards, progress stats, XP, and badge preview
* Permission-focused lab workbench
* Completion screen with learned commands recap

## Tech Stack

Current:

* Frontend: Angular 21
* State: Angular Signals
* Styling: SCSS
* Data: frontend mock data for the MVP

Planned:

* Backend: FastAPI
* Lab content: JSON files
* Packaging: Docker Compose
* CI: GitHub Actions

## How To Run

```bash
cd frontend
npm install
npm start
```

Open:

```text
http://localhost:4200
```

## Build And Test

```bash
cd frontend
npm run build
npm test -- --watch=false
```

Current verification:

* `npm run build` passes
* `npm test -- --watch=false` passes
* Local browser flow works across Landing, Learning Path, Lab Screen, and Lab Completed

## Project Structure

```text
shellcraft/
  frontend/        Angular application
  backend/         Planned FastAPI backend notes
  docs/            API contract, lab schema, and ADRs
  screenshots/     Future README screenshots and GIFs
  README.md        Main project documentation
```

## Safety Model

ShellCraft is a learning simulator. User-entered commands must not be executed directly on the host machine or server.

For the MVP, terminal behavior is mocked in the frontend. Later backend command validation should parse and evaluate commands against a controlled lab state instead of invoking a real shell.

## Planned Backend API

```text
GET  /api/health
GET  /api/labs
GET  /api/labs/{id}
POST /api/commands/check
```

More details are documented in `docs/api-contract.md` and `docs/lab-json-schema.md`.

## Roadmap

Next product steps:

* Extract large frontend sections into standalone presentational components
* Add a real Lab 01 step-by-step command flow
* Persist local progress in `localStorage`
* Add screenshots or a GIF to this README
* Implement the FastAPI lab API

## Git Workflow

Recommended branches:

* `main`: stable public branch
* `develop`: active integration branch
* `feature/<name>`: individual tasks


