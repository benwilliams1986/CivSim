# Birth of Civilization — Free Autonomous Simulation v0.4

This version expands the prototype without adding any paid services.

## New systems

- Long-term character memories
- Trust scores between every pair of characters
- Promises and promise keeping/breaking
- Knowledge transfer and teaching
- Disagreements based on personality/opinions
- Skill growth
- Discovery of resource locations
- Crafting experiments
- Technology progression
- Fibre and clay resources
- Stone Tools, Cordage, Clay Working, Food Storage and Improved Shelter
- Local Kokoro TTS, no paid API

## Zero-cost design

The game simulation, dialogue logic, memories, trust, learning and technology systems all run in JavaScript locally.
Speech uses Kokoro locally in the browser via WebAssembly.
There are no API keys and no usage fees.

## Run

1. Install Node.js
2. In this folder:
   npm install
3. Start:
   npm run dev
4. Open the local URL shown by Vite
5. Click Load Free Voices if you want speech
6. Click Start

## Notes

The free TTS model is heavy for mobile devices. The game still works without loading voices.

The current conversational intelligence is emergent but rule/utility driven, not a cloud LLM. That is deliberate to keep the game free.
