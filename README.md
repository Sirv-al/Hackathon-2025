# Endless Dungeon & Dragons 

## Inspiration
As beginners to Dungeons & Dragons, we wanted to blend the creativity of tabletop storytelling with the immersion of modern AI and 3D visualization. Our goal was to create an experience where both new players could dive into an evolving story guided by an AI Dungeon Master that reacts dynamically to their actions, dice rolls, and imagination.
## What it does
- Endless DnD is an AI-driven interactive storytelling platform that brings Dungeons & Dragons adventures to life in real time.

- The AI Dungeon Master narrates scenes, describes enemies, and adapts the story to player decisions.

- A 3D helps visualize the environment and combat encounters.

- Players can roll dice, declare their actions, and receive AI responses that move the story forward — blending the charm of classic tabletop play with digital immersion.

## How we built it
We combined several technologies to bring this world to life:

- AI storytelling engine powered by large language models for narrative generation and adaptive dialogue.

- 3D environment built using Three.js to visualize the player’s surroundings and encounters.

- Backend integration for handling dice rolls, player input, and AI responses in real-time. Done by using node.js and vite.

## Challenges we ran into
Managing context and memory so the AI could remember past events, NPCs, and player choices.
Implementing 3D models with decent performance and light rendering.
Having different areas the user could view meant designing a system that would swap out scenes and create containers for 3D renders, this took a decent amount of trial and error. 
Everything 3D tbh.
Designing a user-friendly interface that feels magical but stays functional for gameplay.

## Accomplishments that we're proud of
- Creating a fully interactive AI Dungeon Master that can narrate, adapt, and respond naturally.

- Building a 3D map system that enhances the story.

- Crafting a seamless flow between player input, dice rolls, and AI storytelling.

- Turning a traditional tabletop concept into an immersive, visual, and interactive adventure.
## What we learned
- How to structure AI prompts and memory for long-term narrative coherence.
- The importance of designing around player creativity, not limiting it.
- How to use Three.js
## What's next for Team 47 - Endless DnD
- Add multiplayer support so friends can join the same campaign online.

- Integrate voice recognition and narration, allowing players to speak to the AI Dungeon Master.

- Expand the AI’s world-building capabilities, generating new quests, NPCs, and maps procedurally.

- Build a campaign editor so creators can script their own adventures.

## How to Install and run
- `npm install`
- To run: `npm run dev`

## Contributers 
- Sirvan 
- Lukas
- Fisayo 
