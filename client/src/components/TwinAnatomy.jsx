export default function TwinAnatomy({ signal, selected, compact = false }) {
  const { pulseSeconds, oxygenStrength, stressStrength, motionStrength, lowOxygen, lowPulse, fall } = signal
  const style = {
    '--twin-beat': `${pulseSeconds ?? 1}s`,
    '--twin-motion': `${motionStrength * 7}px`,
    '--twin-oxygen': oxygenStrength,
    '--twin-stress': stressStrength,
    '--twin-oxygen-color': lowOxygen ? '#fb923c' : '#22d3ee',
    '--twin-heart-color': lowPulse ? '#fbbf24' : '#fb7185',
  }

  return (
    <div className={`twin-anatomy ${compact ? 'twin-anatomy-compact' : ''}`} style={style} aria-hidden="true">
      <div className={`twin-pose ${fall ? 'twin-fall' : ''}`}>
        <div className={`twin-body ${motionStrength > 0 && !fall ? 'twin-moving' : ''}`}>
          <img src="/human_digital_twin.png" alt="" draggable={false} />
          {pulseSeconds && <span className={`twin-heart ${selected === 'pulse' ? 'twin-highlight' : ''}`} />}
          {signal.oxygen != null && <>
            <span className={`twin-lung twin-lung-left ${selected === 'oxygen' ? 'twin-highlight' : ''}`} />
            <span className={`twin-lung twin-lung-right ${selected === 'oxygen' ? 'twin-highlight' : ''}`} />
          </>}
          {motionStrength > 0 && !fall && <span className={`twin-activity ${selected === 'activity' ? 'twin-highlight' : ''}`} />}
        </div>
      </div>
      {signal.stress != null && <span className={`twin-stress ${selected === 'stress' ? 'twin-highlight' : ''}`} />}
    </div>
  )
}
