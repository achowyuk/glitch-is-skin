# GLITCH IS SKIN

**Inspired by Legacy Russell's "Glitch Feminism"**

## Project Concept
GLITCH IS SKIN is a physical computing art project that explores digital "skins" as representational sites of potential and becoming. Inspired by the "Glitch is Skin" chapter of Legacy Russell's Glitch Feminism. The central avatar is a faceless, pointillist, angelic silhouette, caught between states of digital coherence and interference. The interface uses a physical joystick to simulate technological ruptures. In this framework, surface collisions and trailing gestures, or "glitches", caused by silhouette clones are not errors, but portals—passageways towards revealing new layers of a truer self. A joystick down-click activates a state of complete undoing, followed by reconstitution. 

## Main Interaction Features

### 1. Directional Glitch States
Moving the joystick in different directions triggers unique visual distortions on the main avatar:
- **UP**: Vertical Spiking and Slicing.
- **DOWN**: Melting and dripping effect.
- **LEFT**: Chromatic Tearing and horizontal shifts.
- **RIGHT**: Blocky digital jitter.
- **DIAGONALS**: Randomized combinations of the above.

### 2. Silhouette Swarm
- **Chain Formation**: Every time the joystick changes direction, a new 1/3 scale "mini-silhouette" is born.
- **Bird Flight Pattern**: The mini-clones follow each other in a fluid, sensual chain, trailing the user's joystick movements across the entire screen.
- **Ghostly Trails**: Clones leave behind spectral traces of their motion, creating a dreamy, layered atmosphere.
- **Stall Logic**: When the joystick is at rest, the swarm freezes in place, "stalling out" until movement resumes.

### 3. Swarm Assembly & Supernova Glow
- **Assembly**: Hold the joystick in any direction for 2 seconds to command the swarm to form a coherent shape around the center figure.
- **Collision**: Navigating the swarm directly through the main silhouette for 2 seconds triggers an intense glow.
- **Supernova Bloom**: During assembly or collision, the entire swarm and the main avatar emit an extreme, triple-layered pulsating aura of blue-white light.

### 4. Rupture and Reconstitution (SW Button)
- **Explosion**: Pressing the joystick button triggers a violent, screen-filling rupture (alternating between "Sand Dissolve" and "Confetti Burst").
- **Peak Glow**: At the height of the explosion, a blinding white flare occurs.
- **Eased Rebirth**: Following the rupture, the particles reconstitute back to the center silhouette with a "slow-to-fast" motion, resetting the swarm logic.

### 5. Dynamic Dreamscape Backgrounds
- **Rotation**: The background cycles through 40+ pixelated assets, changing with every new joystick adjustment.
- **Skin-to-JetBlack**: Using a custom heuristic, any "human skin" detected in the background images is forcibly turned to jet black, creating voids within the environment.
- **Atmosphere**: The edges of the screen feature a constant dreamy blue haze and "sparkle" dots.

## Hardware
- Arduino Uno R3
- Elegoo Joystick Module (VRx, VRy, SW)

## Setup
1. Upload the provided `.ino` or PlatformIO code to the Arduino.
2. Open `p5js/index.html` in Google Chrome.
3. Click "INITIATE CONNECTION" and select the Arduino port.

---
*Demo video available in `p5js/assets/skin-is-glitch screen record.mov`*
