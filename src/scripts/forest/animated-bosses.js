// Baked SVG frames follow game time, so pause and reduced motion remain coherent.
export const ANIMATED_BOSSES = {
  cow:{frames:36,duration:1.8},pelican:{frames:36,duration:1.65},
  'golden-cow':{frames:24,duration:2.4},'sunset-cows':{frames:24,duration:2.4},
  'round-pikachu':{frames:24,duration:2.4},ultraman:{frames:24,duration:2.4},gundam:{frames:24,duration:2.4},
  'garden-zombie':{frames:24,duration:2.4},'block-zombie':{frames:24,duration:2.4},
  'block-zombie-shuffle':{frames:24,duration:2.4},'garden-zombie-groove':{frames:24,duration:2.4},
};
export function bossFrameIndex(id,time,encounter,gentle){
  const spec=ANIMATED_BOSSES[id];
  return !spec||encounter||gentle?0:Math.floor(time/spec.duration*spec.frames)%spec.frames;
}
