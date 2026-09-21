export function createMusicPlayer(){
  let context,gain,loading,source=null,track='adventure',offset=0,started=0;
  const buffers={};
  function stop(){if(!source)return;offset+=(context.currentTime-started);source.stop();source.disconnect();source=null;}
  return {
    async load(audio,destination){
      context=audio;gain=destination;
      if(!loading)loading=Promise.all(['adventure','victory','chocolate-cake'].map(async name=>{
        const r=await fetch(`/forest/music/${name}.mp3`);if(!r.ok)throw new Error('Music download failed');
        buffers[name]=await context.decodeAudioData(await r.arrayBuffer());
      })).catch(error=>{loading=null;throw error;});
      await loading;
    },
    update(next,playing){
      if(next!==track){stop();track=next;offset=0;}
      if(!playing){stop();return;}
      if(source||!buffers[track]||context.state!=='running')return;
      source=context.createBufferSource();source.buffer=buffers[track];source.loop=true;
      source.connect(gain);started=context.currentTime;source.start(0,offset%source.buffer.duration);
    },
    getState(){return {track,playing:!!source,loaded:Object.keys(buffers)};}
  };
}
