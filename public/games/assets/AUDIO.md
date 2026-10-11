# Garden intro and selection cues

The added short original Plants vs. Zombies cues come from the public [PvZ_Assets sound directory](https://github.com/FregD156/PvZ_Assets/tree/main/sounds): [readysetplant.ogg](https://github.com/FregD156/PvZ_Assets/blob/main/sounds/readysetplant.ogg) supplies the 5.255-second introduction; [winmusic.ogg](https://github.com/FregD156/PvZ_Assets/blob/main/sounds/winmusic.ogg) supplies the 4.421-second musical outro; and [floop.ogg](https://github.com/FregD156/PvZ_Assets/blob/main/sounds/floop.ogg) supplies the 0.120-second selection plop. The existing `groan.ogg` can accompany selection. Only these short cues were added; no full-length music track was downloaded.

All three Ogg Vorbis files were read through GitHub's base64 file endpoint. Their Ogg page structure, sample rate, duration, byte length, and Git blob SHA were verified against the source.

| File | Bytes | Git blob SHA |
| --- | ---: | --- |
| readysetplant.ogg | 90,706 | bb2b882b0391ee79aa0a56bb13b5c460908f747c |
| winmusic.ogg | 69,403 | edfafa766d0f6494b07257fe9df03c5fccce31c8 |
| floop.ogg | 3,387 | 30fb0e7a7419cf563298f344b26c95e1fe7ed098 |
