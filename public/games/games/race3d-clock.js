/** Playback clocks only: vehicle/track units and fixed simulation steps stay unchanged. */
export const RACE_PLAYBACK_SPEED = 2;
export const PLAYBACK_SPEEDS = Object.freeze([1,2,3,4,5]);
export function resolvePlaybackSpeed(value){const speed=Number(value);return PLAYBACK_SPEEDS.includes(speed)?speed:RACE_PLAYBACK_SPEED;}
export const FIXED_CLOCK_EPSILON = 1e-10;
export function raceFrameSeconds(seconds,phase,speed=RACE_PLAYBACK_SPEED){return phase==='running'||phase==='finishing'?seconds*resolvePlaybackSpeed(speed):0;}
export function visualFrameSeconds(seconds,phase,speed=RACE_PLAYBACK_SPEED){return ['running','finishing','finished'].includes(phase)?seconds*resolvePlaybackSpeed(speed):seconds;}
/** Avoid dt clamps in individual visual systems losing time on slower frames. */
export function forEachVisualStep(seconds,advance){
  const duration=Math.max(0,Number(seconds)||0),count=Math.max(1,Math.ceil(duration/.05));
  const step=duration/count;
  for(let i=0;i<count;i++)advance(step,1/count);
  return count;
}
