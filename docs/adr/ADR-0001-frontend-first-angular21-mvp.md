# ADR-0001: Frontend-First Angular 21 MVP

Date: 2026-06-19

## Status

Accepted

## Context

ShellCraft is a hackathon project intended to teach Linux through an interactive and visually polished trainer. The current repository has an Angular 21 frontend skeleton and a planned-but-empty backend folder. The hackathon rewards a working MVP, interactivity, visual style, and clean code.

## Decision

Build the first MVP frontend-first in Angular 21 using standalone components, signals, and modern template control flow. Keep backend implementation out of the first step and use mock/static lab data plus localStorage progress where needed.

## Consequences

Positive:
- Faster path to a visible demo.
- Lower integration risk for a two-person hackathon team.
- Clear fit with the existing Angular 21 project.
- Avoids premature backend complexity.

Tradeoffs:
- Command validation is initially simulated in the frontend.
- Backend API remains a documented future boundary.
- Later migration to a real API must preserve the lab data contract.

## Security Notes

The MVP must simulate Linux commands rather than execute user-entered commands. Lesson content and command output should be rendered through Angular bindings, not unsafe HTML injection.
