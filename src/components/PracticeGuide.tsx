import { useEffect, useRef, useState } from "react";
import "../styles/practice-guide.css";
import { practiceLabels, type PracticeLanguage } from "../data/practiceLanguage";

type Step = { title: string; minutes: number; detail: string };
type Props = { title: string; steps: Step[]; language?: PracticeLanguage };

export default function PracticeGuide({ title, steps, language = "en" }: Props) {
  const copy = practiceLabels[language];
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
    <section className={`practice-guide no-print${step < 0 ? " guide-intro" : ""}`} aria-label={`${copy.guided} ${title}`} hidden={!ready}>
      <p className="guide-kicker">{copy.oneStep}</p>
      <p className="guide-progress" role="status" aria-live="polite">
        {step < 0 ? copy.progressIntro(steps.length) : complete ? copy.finished : copy.progress(step + 1, steps.length, steps[step].minutes)}
      </p>
      <h2 ref={heading} tabIndex={-1} className={step < 0 ? "guide-intro-heading" : undefined}>
        {step < 0 ? copy.oneStep : complete ? copy.nextTime : steps[step].title}
      </h2>
      {step >= 0 && <p className="guide-detail">
        {complete ? copy.complete : steps[step].detail}
      </p>}
      <div className="guide-controls">
        {step < 0 ? <button type="button" className="button" onClick={() => go(0)}>{copy.start}</button> : complete ? <>
          <button type="button" className="button" onClick={() => go(0)}>{copy.again}</button>
          <button type="button" className="guide-back" onClick={() => go(steps.length - 1)}>{copy.last}</button>
        </> : <>
          <button type="button" className="guide-back" onClick={() => go(step - 1)}>{step === 0 ? copy.intro : copy.previous}</button>
          <button type="button" className="button" onClick={() => go(step + 1)}>{step === steps.length - 1 ? copy.finish : copy.next}</button>
        </>}
        <a href="#practice-steps">{copy.fullSheet}</a>
      </div>
      <p className="guide-note">{copy.privacy}</p>
    </section>
  );
}
