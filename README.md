# SHADOWSEEK 3D — First-Person Multiplayer Hide & Seek

**SHADOWSEEK 3D** is a real-time multiplayer 3D first-person hide-and-seek web game built with **Three.js, React 19, TypeScript, Tailwind CSS, and Web Audio API**.

Players join a room as **Hider** and **Seeker** in immersive 3D sectors:
- **Hider**: Has a 30-second head-start to sprint through the map, duck into shadowed alcoves, vents, or behind containers, crouch to maximize camouflage, and kill their flashlight.
- **Seeker**: Released into the sector with a tactical flashlight and proximity sonar scanner. Tag the hider within 4 meters before time expires!
- **4 Rich 3D Maps**:
  1. **Neon Sector 7**: Cyberpunk industrial alleyway with stacked shipping containers, glowing holographic signs, and transformers.
  2. **Ruins of Solaria**: Ancient jungle temple with towering stone pillars, stepped altars, sarcophagi, and fire braziers.
  3. **Sub-Zero Station**: Deep-space cryo-lab with glowing stasis pods, humming server racks, and blast doors.
  4. **Canyon Citadel**: Desert fortress with sandstone ramparts, timber watchtowers, and supply tents.

---

## 🎮 Controls

- **W, A, S, D** / Arrow Keys: Move & Strafe
- **Mouse**: Look around (Click viewport to lock mouse cursor)
- **Shift**: Sprint (increased speed with dynamic head bob)
- **C** / Ctrl: Crouch (lowers eye level to fit into hide crevices & boosts stealth rating)
- **Space**: Jump
- **F**: Toggle Tactical Flashlight
- **E** / Left-Click:
  - **Seeker**: Sonar Radar Scan (sweeps the area and reports distance in meters with pitch-shifted audio chime) / Tag Operative (when in close range)
  - **Hider**: Proximity check

---

## 🚀 Features

- **Procedural 3D Environments**: Zero external model or texture downloads; all PBR materials, textures, and lighting are generated procedurally in Three.js.
- **Procedural Web Audio Synthesizer**: Custom audio effects for footstep thuds, jump takeoff/landing, tactical switch clicks, heartbeats when opponents are near, sonar radar chirps, and victory fanfares.
- **Real-Time Multiplayer**: Instant cross-tab & cross-device real-time sync with 6-character room codes and shareable links.
- **Solo Mode vs AI**: Play anytime as Hider or Seeker against the Cyber Sentinel AI bot!
- **Professional Tactical HUD**: Reticle with lock-on brackets, mission clock, stealth camouflage meter, and proximity sensor.
