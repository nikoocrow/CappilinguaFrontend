import { useState } from 'react';
import { useScreenEnter, usePopIn } from '../anim/hooks.js';
import { useNavigate } from 'react-router-dom';
import { useAppState, formatWon } from '../state/AppState.jsx';
import { LESSON } from '../data/questions.js';
import Button from '../components/Button.jsx';
import { CloseIcon, StarIcon } from '../components/icons/Icons.jsx';
import { WonCoin, Gem } from '../components/icons/Currency.jsx';
import styles from './LessonScreen.module.css';

/* Tanda de 3 preguntas + pantalla de fin. El flujo es
   elegir → COMPROBAR → CONTINUAR, y la recompensa se otorga una sola vez
   (rewardGiven) al volver al mapa. */
export default function LessonScreen() {
  const navigate = useNavigate();
  const { claimMission, addReward, showToast } = useAppState();

  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const questions = LESSON.questions;
  const finished = step >= questions.length;
  const question = finished ? null : questions[step];
  const isLast = step === questions.length - 1;
  const gotItRight = checked && choice === question?.correct;

  // Cada pregunta vuelve a entrar: el encabezado (cerrar, progreso, puntaje)
  // se queda quieto y solo cambia el cuerpo, que es donde está la atención.
  const scope = useScreenEnter({ replayKey: step, stagger: 0.06 });

  const check = () => {
    if (choice === null) return;
    setChecked(true);
    if (choice === question.correct) setCorrectCount((n) => n + 1);
  };

  const advance = () => {
    setStep((n) => n + 1);
    setChoice(null);
    setChecked(false);
  };

  const finishAndReturn = () => {
    // La misión que abrió la lección hace de guardia: si ya fue reclamada,
    // claimMission devuelve false y no se paga dos veces.
    if (claimMission(LESSON.missionId)) {
      addReward(LESSON.reward);
      showToast(`🎉 +${LESSON.reward.xp} XP · +₩${formatWon(LESSON.reward.coins)}`);
    }
    navigate('/mapa');
  };

  return (
    <div ref={scope} className={styles.screen}>
      <header className={styles.header} data-anim="head">
        <button
          type="button"
          className={styles.close}
          aria-label="Salir de la lección"
          onClick={() => navigate('/mapa')}
        >
          <CloseIcon size={20} />
        </button>

        <div className={styles.segments}>
          {questions.map((_, index) => (
            <div
              key={index}
              className={`${styles.segment} ${index < step ? styles.segmentDone : ''}`}
            />
          ))}
        </div>

        <div className={styles.score}>
          <StarIcon size={18} filled />
          <span>{correctCount}</span>
        </div>
      </header>

      {finished ? (
        <CompletionPanel correct={correctCount} total={questions.length} onReturn={finishAndReturn} />
      ) : (
        <>
          <div className={styles.body}>
            <div className={styles.capySide} data-anim="item">
              <div className={styles.bubble} lang="ko">
                {question.bubble}
              </div>
              <img className={styles.capy} src="/ui/capy.png" alt="Capi, tu compañero capibara" />
            </div>

            <div className={styles.questionSide} data-anim="item">
              <div className={styles.stepLabel}>
                PREGUNTA {step + 1} DE {questions.length}
              </div>
              <h1 className={styles.prompt}>{question.prompt}</h1>

              <div className={styles.options}>
                {question.options.map((option, index) => (
                  <button
                    key={option.main}
                    type="button"
                    className={[
                      styles.option,
                      !checked && choice === index ? styles.optionSelected : '',
                      checked && index === question.correct ? styles.optionCorrect : '',
                      checked && choice === index && index !== question.correct
                        ? styles.optionWrong
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-pressed={choice === index}
                    disabled={checked}
                    onClick={() => setChoice(index)}
                  >
                    <span className={styles.optionMain}>{option.main}</span>
                    <span className={styles.optionSub}>{option.sub}</span>
                    {checked && index === question.correct && <span className={styles.mark}>✓</span>}
                    {checked && choice === index && index !== question.correct && (
                      <span className={styles.mark}>✕</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <footer className={styles.footer}>
            <div className={styles.footerInner}>
              {checked ? (
                <div
                  className={`${styles.feedback} ${gotItRight ? styles.feedbackOk : styles.feedbackBad}`}
                  role="status"
                  aria-live="polite"
                >
                  <span className={styles.feedbackEmoji}>{gotItRight ? '🎉' : '💪'}</span>
                  {gotItRight ? '¡Correcto! 잘했어요!' : 'Casi... la respuesta correcta está marcada.'}
                </div>
              ) : (
                <p className={styles.hint}>Selecciona una respuesta y comprueba.</p>
              )}

              {checked ? (
                <Button onClick={advance} style={{ minWidth: 200 }}>
                  {isLast ? 'Finalizar' : 'Continuar'}
                </Button>
              ) : (
                <Button onClick={check} disabled={choice === null} style={{ minWidth: 200 }}>
                  Comprobar
                </Button>
              )}
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

function CompletionPanel({ correct, total, onReturn }) {
  const ref = usePopIn({ y: 22, scale: 0.94 });

  return (
    <div ref={ref} className={styles.completion}>
      <div className={styles.checkCircle} aria-hidden="true">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </div>

      <h1 className={styles.completionTitle}>¡Misión completada!</h1>
      <p className={styles.completionSubtitle}>
        {LESSON.title} · {correct}/{total} aciertos
      </p>

      <div className={styles.rewardCards}>
        <div className={`${styles.rewardCard} ${styles.rewardXp}`}>
          <Gem size={22} />
          <span>+{LESSON.reward.xp} XP</span>
        </div>
        <div className={`${styles.rewardCard} ${styles.rewardWon}`}>
          <WonCoin size={22} />
          <span>+{formatWon(LESSON.reward.coins)} Wones</span>
        </div>
      </div>

      <Button onClick={onReturn} style={{ minWidth: 280 }}>
        Volver al mapa
      </Button>
    </div>
  );
}
