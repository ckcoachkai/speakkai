/** Keep the public game handle stable while replacing every course-owned resource. */
export function createCourseSessionController(createSession, options = {}, storage) {
  let courseMode='downhill', sound=options.sound??true, session, destroyed=false, generation=0;
  try { if(storage===undefined)storage=globalThis.localStorage; if(storage?.getItem('race3d-course')==='alpine')courseMode='alpine'; } catch {}
  function mount() {
    const current=++generation;
    session=createSession({...options,sound,courseMode,
      onPick:(...args)=>{if(!destroyed&&generation===current)options.onPick?.(...args);},
      onCourse:value=>{
        if(destroyed||generation!==current||!['downhill','alpine'].includes(value))return false;
        if(value===courseMode)return true;
        // Invalidate asynchronous asset/finish callbacks before disposing the old scene.
        generation++;session?.destroy();courseMode=value;
        try{storage?.setItem('race3d-course',value);}catch{}
        mount();return true;
      }
    });
  }
  mount();
  return {
    start(...args){if(!destroyed)return session?.start(...args);return false;},
    reset(...args){if(!destroyed)return session?.reset(...args);},
    setSound(value){sound=!!value;if(!destroyed)session?.setSound(sound);},
    destroy(){if(destroyed)return;destroyed=true;generation++;session?.destroy();session=null;}
  };
}
