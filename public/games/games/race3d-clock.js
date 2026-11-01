/** Playback clocks only: vehicle/track units and fixed simulation steps stay unchanged. */
export const RACE_PLAYBACK_SPEED = 2;
export const FIXED_CLOCK_EPSILON = 1e-10;
export function raceFrameSeconds(seconds,phase){return phase==='running'||phase==='finishing'?seconds*RACE_PLAYBACK_SPEED:0;}
export function visualFrameSeconds(seconds,phase){return ['running','finishing','finished'].includes(phase)?seconds*RACE_PLAYBACK_SPEED:seconds;}
/** Avoid dt clamps in individual visual systems losing time on slower frames. */
export function forEachVisualStep(seconds,advance){
  const duration=Math.max(0,Number(seconds)||0),count=Math.max(1,Math.ceil(duration/.05));
  const step=duration/count;
  for(let i=0;i<count;i++)advance(step,1/count);
  return count;
}
