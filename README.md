# Birth of Civilization — Free Autonomous Simulation v0.5

Free browser simulation with no paid APIs.

## v0.5 improvements

- Multi-turn local conversations
- Characters ask about food, stone, timber, plans, memories, opinions and technology
- Answers can come from the character's own stored memories
- Follow-up questions
- Knowledge transfer after conversations
- Conversation-created promises
- Different topic preferences by personality and role
- Mobile / Balanced / Desktop performance modes
- requestAnimationFrame rendering
- AI decisions run less often than movement/rendering
- UI refresh is throttled instead of rebuilding every simulation tick
- Local TTS audio cache
- Optional spoken lines toggle
- Conversation length is reduced automatically on Mobile mode

## GitHub Pages

Upload these at the root of the repository:

- index.html
- package.json
- vite.config.js
- README.md
- src/main.js
- .github/workflows/deploy.yml

Then use Settings → Pages → Source → GitHub Actions.
