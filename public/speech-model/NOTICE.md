# On-device speech recognition assets

- Vosk Browser 0.0.8, Copyright Ciaran O'Reilly and contributors. Apache-2.0. Source: https://github.com/ccoreilly/vosk-browser . Unmodified `dist/vosk.js` from https://registry.npmjs.org/vosk-browser/-/vosk-browser-0.0.8.tgz . Includes its bundled Vosk/Kaldi WebAssembly runtime and third-party components; original notices are retained in the bundle.
- English model `vosk-model-small-en-us-0.15`, Alpha Cephei. Apache-2.0 per https://alphacephei.com/vosk/models . Original: https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip . Files are unchanged, repackaged as tar.gz for the browser library.
- License: [Apache License 2.0](LICENSE-2.0.txt).

These files are served from SpeakKai so the app does not need to connect to an external speech service in on-device mode. Recognition runs in a Web Worker. Model files can be cached locally; microphone audio and session transcripts are not persisted by the app.
