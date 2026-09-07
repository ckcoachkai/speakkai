import { useEffect, useRef, useState } from "react";
import "../styles/practice-guide.css";

type Step = { title: string; minutes: number; detail: string };
type Props = { title: string; steps: Step[] };

export default function PracticeGuide({ title, steps }: Props) {
  const [step, setStep] = useState(-1);
  const [ready, setReady] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const interacted = useRef(false);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (interacted.current) heading.current?.focus();
  }, [step]);
  function go(next: number) {
    interacted.current = true;
    setStep(next);
  }
  const complete = step === steps.length;
  return (
    <section className={`practice-guide no-print${step < 0 ? " guide-intro" : ""}`} aria-label={`Guided practice: ${title}`} hidden={!ready}>
      <p className="guide-kicker">One step at a time</p>
      <p className="guide-progress" role="status" aria-live="polite">
        {step < 0 ? `${steps.length} steps · go at your own pace` : complete ? "Practice finished" : `Step ${step + 1} of ${steps.length} · about ${steps[step].minutes} min`}
      </p>
      <h2 ref={heading} tabIndex={-1} className={step < 0 ? "guide-intro-heading" : undefined}>
        {step < 0 ? "One step at a time." : complete ? "Choose one thing for next time." : steps[step].title}
      </h2>
      {step >= 0 && <p className="guide-detail">
        {complete ? "Tell your listener one thing that felt clearer and one thing you want to practise again. There is no score to chase." : steps[step].detail}
      </p>}
      <div className="guide-controls">
        {step < 0 ? <button type="button" className="button" onClick={() => go(0)}>Start guided practice</button> : complete ? <>
          <button type="button" className="button" onClick={() => go(0)}>Practise again</button>
          <button type="button" className="guide-back" onClick={() => go(steps.length - 1)}>Back to last step</button>
        </> : <>
          <button type="button" className="guide-back" onClick={() => go(step - 1)}>{step === 0 ? "Back to introduction" : "Previous step"}</button>
          <button type="button" className="button" onClick={() => go(step + 1)}>{step === steps.length - 1 ? "Finish practice" : "Next step"}</button>
        </>}
        <a href="#practice-steps">Read the full sheet</a>
      </div>
      <p className="guide-note">No recording or saved progress. Start again whenever you like.</p>
    </section>
  );
}
