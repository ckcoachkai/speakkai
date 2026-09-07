# Filler Alarm 1.0

Release date: 2026-09-07. Route: https://speakkai.com/speak/.

## Product contract

Free English hesitation practice, with microphone selection, visible input level,
adjustable siren, independent red-screen alert, session statistics and local
recording checks. The model detects acoustic hesitation sounds; it does not
transcribe speech or count lexical fillers such as "like" and "so". Sound labels
and model scores are estimates, not calibrated accuracy measurements.

Start prepares the model before requesting the microphone. Stop immediately
releases microphone tracks, finishes the last recognition window without an
alarm, and disposes the worker. Leaving or hiding the tab cancels processing.
No recording, transcript, or inference result is uploaded or persisted. A file
selected for checking remains a local object URL until cleared or navigation.
All inference assets are served from the same site; the native vendor SDK is
not included. First start downloads about 71 MB including the runtime.

WebGPU is preferred; WebAssembly CPU fallback and explicit CPU mode are included.
Each worker has a three-minute preparation deadline and 15-second inference
deadline. Progress, microphone failures and low input are visible and retryable.
On slower devices, inference runs as quickly as the device allows and feedback
can be delayed. Current Chrome/Edge is the primary tested browser environment;
Safari, Firefox and physical mobile devices remain unverified.

## Model provenance and adaptation

Uhm by Desert Ant Labs, pinned Hugging Face revision:
`9b172658b2a20a21ad8ea44092f4d4b3ff2c69a4` of
https://huggingface.co/desert-ant-labs/uhm.

Original `uhm-web-fp16.onnx` SHA256:
`c266faf7db4cdced6f18aa9119ff2800a20707d7159be645d487ec191a9d79ff`.

SpeakKai derivative `public/speech-v1/uhm-6s-v1.onnx`, 47,047,128 bytes, SHA256:
`f12b53b0fc652bd82bf77bfdd715af0b743cfa7e37d8d666b3f5aded1b39063e`.

Reproduce using `python scripts/prepare-speak-model.py ORIGINAL.onnx OUTPUT.onnx`
with onnx 1.22.0 and numpy. The script verifies the original checksum, changes
input length from 480000 to 96000 samples, output frames from 1499 to 299,
and six integer attention reshape constants from 1499 to 299. Trained weights
are unchanged. The graph passes the ONNX checker. The shorter context is a
latency tradeoff and can change predictions.

The model emits six classes: not_filler, uh, um, hmm, and, other. Upstream
labels.json incorrectly lists five; the model card and actual tensor determine
the adapter schema. The "and" class is not selectable. Actual audio is
mean/std normalized before padding, following the vendor Detector.swift
feature extractor. Detection uses 1 - p(not_filler), contiguous frames above
0.5 for at least 120 ms, then mean-score thresholds: Balanced 0.70, Catch more
0.55, Fewer false alarms 0.80. Six-second rolling windows use a target 400 ms
hop and 200 ms of right context. Overlapping events are deduplicated.

Runtime assets are vendored from onnxruntime-web 1.26.0. MIT text is in
`public/speech-v1/ONNX-LICENSE.txt`. Vendor license and third-party notices are
in that same directory, with visible Desert Ant Labs attribution on the page.
The model is source-available, free below 100,000 monthly active devices per
platform; usage above that requires a vendor commercial license. It is not an
unrestricted open-source model. No competing-model training is permitted.

## Validation and limitations

- 9 DSP/event regression tests and 5 worker lifecycle tests pass. Lifecycle
  coverage includes cancel/restart, stale callbacks, download error, request
  matching and bounded timeouts. These 14 tests run in deployment CI on Node 20.
- Existing 18 speech-session/audio regression tests pass locally; they cover
  shared audio and the old controller and are not proof of the new UI flow.
- Astro typecheck/build and public-schedule privacy check pass.
- Browser microphone startup, moving input meter, stop, finalization and restart
  verified in the Codex Chromium browser. No deliberate live speech accuracy
  trial by the user has been completed for this release.
- Browser file check of AMI test row 21 ("OH UM I DON'T KNOW") produces one
  estimated "um", score 86%, on both GPU and CPU. Latest passes observed at
  roughly 294 ms GPU and 1137 ms browser CPU on this machine. AMI test row 100
  (no transcript-labelled hesitation) produces zero events on GPU.
- A second 12-clip regression sample at release thresholds detects at least one
  event in 3 of 6 clips containing transcript-labelled fillers, and zero events
  in 6 clips without labelled fillers. Some clips have multiple fillers that
  are missed. This is a small debugging sample, not an accuracy estimate. AMI
  also appears in the vendor's training data, so it is not independent evidence
  of generalization. Short standalone sounds and some embedded hesitations are
  missed. "Catch more" may recover weaker events but can increase false alarms.

Public regression audio source: Edinburgh CSTR AMI Meeting Corpus (CC BY 4.0),
https://huggingface.co/datasets/edinburghcstr/ami, ihm/test, revision
`46f28f2503e2ec48f8867a84eef356c70476beab`.
Second sample positive row IDs: 132,136,140,151,152,192;
negative IDs: 100,103,107,109,110,112. Recordings are not shipped to the site.

## Release and rollback

Stage production v1 files explicitly. `.speak-work/`, old lab scripts and
`public/speak-lab-assets/` are local experiments and must not be staged or
deployed. `/speak-lab/` redirects to `/speak/`. Existing Vosk files are retained
for rollback. Deploy through the repository's GitHub Pages workflow, then
verify the live title, model checksum/assets, microphone flow and a local
recording check. Revert the release commit with a normal commit to roll back
without disturbing unrelated website changes. Original speech implementation
baseline: `ae6969f`.
