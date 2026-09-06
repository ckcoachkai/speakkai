# Filler Alarm at /speak/

An isolated Astro route with on-device Vosk recognition as the default, plus optional native browser SpeechRecognition. No API key, audio recording, backend, or session persistence. The English model (about 40 MB) and runtime are hosted on SpeakKai. After loading, on-device recognition processes audio in a Web Worker without an external speech service. The browser library can cache model files in IndexedDB. Optional browser-service mode may process audio remotely and can fail in embedded browsers or restricted networks.

## Behavior and limitations

- Detects selected words in interim and final English transcripts, with elongated spellings for um, uh, ah, ugh, erm, and er. Optional phrases count literally, without semantic classification.
- This is the first transcription-based prototype, not the proposed trained acoustic/semantic hybrid. Recognition may omit hesitation sounds. Real-voice detection accuracy and sub-second latency have not been established.
- Transcript revisions reconcile counts; provisional alerts cannot be undone. A per-segment high-water mark avoids duplicate alarms when interim text becomes final. It can suppress a later alert if an earlier interim filler was revised away. The counter still follows the latest transcript.
- One 1.1-second red hold and 0.86-second synthesized siren per two-second cooldown. All recognized fillers count during cooldown. Test alert does not affect the session.
- Stop, hidden tab, navigation, and recognition failures release microphone tracks. Pending microphone grants and model preparation are cancelled safely. Automatic browser-service recognition restarts are bounded.
- The local decoder uses the existing tested session counter and transcript pipeline. A muted Web Audio processing node forwards PCM to the worker; it does not play microphone audio back through the speakers.
- Audio level visualization uses real microphone input. No sound classification is inferred from volume.

## Verification

Run `node --test scripts/check-speak.mjs` on Node 24+ for detector, streaming lifecycle, and audio scheduling checks. Run `pnpm build` and `pnpm check:schedule-privacy` for site checks.

Manual acceptance: open /speak/ in desktop Chrome, test the alert with headphones, start and grant microphone permission, say selected fillers and normal sentences, compare the transcript with alerts, stop, and confirm the browser microphone indicator turns off. Also check denied permission, provider/network failure, and mobile layout. Simulated recognition tests do not establish real speech accuracy or audible device output.

Optional WebMCP tools expose the summary and stop action when supported. The live browser advertised both tools; execution is not part of this fix's validation. Neither tool starts microphone capture or returns transcript text.

### On-device fix verification

- 18 focused tests cover transcript matching, session lifecycle, model preparation cancellation/failure, and the local decoder adapter.
- An actual Codex embedded-browser test loaded the bundled Vosk WebAssembly model and passed generated speech through the same AudioEngine PCM bridge, LocalRecognition adapter, and Session counter. It produced a transcript containing `this is a speaking test` and counted `I mean`, `actually`, and `you know`, with three alert callbacks.
- The generated `um` sounds were misrecognized. This confirms the connection-independent pipeline, not reliable hesitation-sound accuracy across real voices. No real user microphone audio was captured during this verification.
- The test fixture remains outside the production assets and is not deployed. The model/license files are deployed under `/speech-model/`.

## Deployment and rollback

Uses the existing `Deploy Astro site to GitHub Pages` workflow on main. Only the speak route, its scoped stylesheet/scripts, these checks, and this document belong to this change. Revert the filler-alarm commit to remove the route. The homepage, schedule data, and shared navigation are untouched by this change.
