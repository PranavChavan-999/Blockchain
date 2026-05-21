import { STEPS } from "../config/constants";

export default function Stepper({ step }) {
  return (
    <div className="steps">
      {STEPS.map((s, i) => {
        const state = step > s.id ? "done" : step === s.id ? "active" : "inactive";
        return (
          <div key={s.id} className="step-item">
            <div className={`step-num ${state}`}>{state === "done" ? "✓" : s.id}</div>
            <span className={`step-label ${state}`}>{s.label}</span>
            {i < STEPS.length - 1 && (
              <div className={`step-line ${step > s.id ? "done" : "inactive"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
