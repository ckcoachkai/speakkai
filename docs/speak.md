# Filler Alarm at /speak/

An isolated Astro route using native browser SpeechRecognition and Web Audio. No API key, audio recording, backend, or session persistence. Browser speech services may process audio remotely and may require internet access. Desktop Chrome is the recommended first browser; API presence alone does not prove the provider is reachable.

## Behavior and limitations

- Detects selected words in interim and final English transcripts, with elongated spellings for um, uh, ah, ugh, erm, and er. Optional phrases count literally, without semantic classification.
- This is the first transcription-based prototype, not the proposed trained acoustic/semantic hybrid. Recognition may omit hesitation sounds. Real-voice detection accuracy and sub-second latency have not been established.
- Transcript revisions reconcile counts; provisional alerts cannot be undone. A per-segment high-water mark avoids duplicate alarms when interim text becomes final. It can suppress a later alert if an earlier interim filler was revised away. The counter still follows the latest transcript.
- One 1.1-second red hold and 0.86-second synthesized siren per two-second cooldown. All recognized fillers count during cooldown. Test alert does not affect the session.
- Stop, hidden tab, navigation, and recognition failures release microphone tracks. Pending microphone grants are cancelled safely. Automatic recognition restarts are bounded.
- Audio level visualization uses real microphone input. No sound classification is inferred from volume.

## Verification

Run `node --test scripts/check-speak.mjs` on Node 24+ for detector, streaming lifecycle, and audio scheduling checks. Run `pnpm build` and `pnpm check:schedule-privacy` for site checks.

Manual acceptance: open /speak/ in desktop Chrome, test the alert with headphones, start and grant microphone permission, say selected fillers and normal sentences, compare the transcript with alerts, stop, and confirm the browser microphone indicator turns off. Also check denied permission, provider/network failure, and mobile layout. Simulated recognition tests do not establish real speech accuracy or audible device output.

Optional WebMCP tools expose the summary and stop action when supported. No supported WebMCP validation context was available during implementation; registration and execution in that context are unverified. Neither tool starts microphone capture or returns transcript text.

## Deployment and rollback

Uses the existing `Deploy Astro site to GitHub Pages` workflow on main. Only the speak route, its scoped stylesheet/scripts, these checks, and this document belong to this change. Revert the filler-alarm commit to remove the route. The homepage, schedule data, and shared navigation are untouched by this change.
