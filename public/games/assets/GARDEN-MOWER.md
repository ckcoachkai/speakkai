# Connected lawnmower

`garden-mower.json` embeds eight unchanged original transparent PNG parts and 16 ordered first-frame transforms from [LawnMower.reanim](https://github.com/FregD156/PvZ_Assets/blob/8ba94e95cfe7d0de5682f8258d3b932dbdac885c/reanim/LawnMower.reanim), pinned to source commit `8ba94e95cfe7d0de5682f8258d3b932dbdac885c`. Each embedded image records its original source, dimensions and Git blob SHA. All image bytes were verified against those hashes. The complete manifest is 33,656 bytes and needs no external image requests after loading.

The frame, handle, wheels and engine remain connected using the original transforms. Wheel rotation and engine vibration are custom runtime motion. The source-space visible bounds are `[-2.2, 2.6, 80.6, 70.4]`, with a centered foot origin at `[39.2, 70.4]`. The standalone game embeds the same manifest.

The corresponding original [lawnmower.ogg](https://github.com/FregD156/PvZ_Assets/blob/8ba94e95cfe7d0de5682f8258d3b932dbdac885c/sounds/lawnmower.ogg) is preserved unchanged: 56,925 bytes; Git blob SHA `c03440559796168d8b4242be09fde35ab13b5aa7`; SHA-256 `6ebe3285d8d44e0b7b7309803876224abe2b8ee2c9daa870224b31fe27fe67e7`. It plays on activation when sound is enabled, and follows normal mute/reset/destroy cleanup.

Each lane gets one automatic mower per round. It activates on the first undefended breach, clears zombies through continuous collision checks along its actual path, and then remains spent. Mower kills bypass plant loot credit because the mower made the final hit. A new round restores one mower per remaining student. These selection rules are custom game behavior.
