import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";

export const PointExampleCheck: React.FC<{chinese:boolean}> = ({chinese}) => {
  const frame = useCurrentFrame();
  const beat = Math.min(2, Math.floor(frame / 180));
  const localFrame = frame % 180;
  const labels = chinese ? ["重点", "例子", "确认"] : ["Point", "Example", "Check"];
  const quotes = chinese
    ? ["我们去图书馆见面吧。", "昨天午饭后，\n那里很安静。", "这个安排适合你吗？"]
    : ["Let’s meet in the library.", "Yesterday, it was quiet after lunch.", "Would that work for you?"];
  return <AbsoluteFill style={{backgroundColor:"#102348",color:"#ffffff",fontFamily:chinese ? 'Microsoft YaHei, sans-serif':'Arial, sans-serif',padding:90}}>
    <Interactive.Div name="Brand" style={{fontSize:32,letterSpacing:5,color:"#cedbf5"}}>SPEAKKAI</Interactive.Div>
    <Interactive.Div name="Step" style={{marginTop:94,fontSize:108,fontWeight:700,lineHeight:1.05,color:"#ffdc38"}}>{labels[beat]}.</Interactive.Div>
    <Interactive.Div name="Example sentence" style={{marginTop:62,fontSize:chinese?76:80,fontWeight:500,lineHeight:1.35,whiteSpace:"pre-line",opacity:interpolate(localFrame,[0,15],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"})}}>{quotes[beat]}</Interactive.Div>
    <div style={{position:"absolute",left:90,right:90,bottom:155,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      {labels.map((label,index)=><div key={label} style={{display:"flex",flexDirection:"column",gap:24,alignItems:"center",width:240}}>
        <div style={{height:70,width:70,borderRadius:35,backgroundColor:index<=beat?"#ffdc38":"#344563",color:index<=beat?"#102348":"#ffffff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,fontWeight:700}}>{index+1}</div>
        <div style={{fontSize:36,color:index===beat?"#ffdc38":"#cedbf5"}}>{label}</div>
      </div>)}
    </div>
    <Interactive.Div name="Practice context" style={{position:"absolute",bottom:65,left:90,fontSize:26,color:"#cedbf5"}}>{chinese ? "虚构练习示例 · 用你自己的话表达" : "Fictional practice example · Use your own words"}</Interactive.Div>
  </AbsoluteFill>;
};
