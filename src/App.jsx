import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Clock, RotateCcw, Shuffle, Lightbulb, User, ShoppingCart, Trophy, Sparkles, Eraser, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './styles.css'

const ROUND_TIME = 60
const TRAY_SIZE = 3
const MATCH_POINTS = 150
const COMBO_POINTS = 300
const COMBO_WINDOW_MS = 5000

const RANKING_KEY = 'uau-market-challenge-ranking-top5'

function getRanking() {
  try {
    return JSON.parse(localStorage.getItem(RANKING_KEY) || '[]')
  } catch {
    return []
  }
}

function saveRankingEntry(name, score) {
  const safeName = (name || 'Jogador').trim() || 'Jogador'
  const safeScore = Number.isFinite(Number(score)) ? Math.max(0, Math.round(Number(score))) : 0

  const current = getRanking()
  const updated = [...current, {
    name: safeName.slice(0, 40),
    score: safeScore,
    date: new Date().toISOString()
  }]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  localStorage.setItem(RANKING_KEY, JSON.stringify(updated))
  return updated
}


const PRODUCTS = [
  { type: 'amaciante', name: 'Amaciante', image: '/assets/products/amaciante.png' },
  { type: 'essencia', name: 'Essência', image: '/assets/products/essencia.png' },
  { type: 'lava', name: 'Lava-Roupas', image: '/assets/products/lava-roupas.png' },
  { type: 'pisos', name: 'Limpa Pisos', image: '/assets/products/limpa-pisos.png' },
]

// 27 produtos no total, todos em múltiplos de 3.
// 18 espaços visíveis: 3 prateleiras com 6 produtos cada.
// Alguns espaços têm camadas ocultas.
const PRODUCT_POOL = [
  ...Array(9).fill('amaciante'),
  ...Array(6).fill('essencia'),
  ...Array(6).fill('lava'),
  ...Array(6).fill('pisos'),
]

function productByType(type) {
  return PRODUCTS.find((product) => product.type === type)
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5)
}

function createBoard() {
  const mixed = shuffle(PRODUCT_POOL)
  const slots = []

  for (let i = 0; i < 18; i++) {
    const depth = i < 9 ? 2 : 1
    const layers = []

    for (let j = 0; j < depth; j++) {
      const type = mixed.pop()
      if (type) {
        layers.push({
          ...productByType(type),
          id: `${i}-${type}-${j}-${Math.random().toString(36).slice(2)}`
        })
      }
    }

    slots.push({ slotId: `slot-${i}`, layers })
  }

  return slots
}

function topItem(slot) {
  return slot.layers[slot.layers.length - 1] || null
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60)
  const sec = String(seconds % 60).padStart(2, '0')
  return `${String(min).padStart(2, '0')}:${sec}`
}

function playSound(kind) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioContext()

    if (kind === 'champion' || kind === 'combo') {
      const notes = kind === 'combo'
        ? [659.25, 783.99, 1046.5]
        : [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5]
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'triangle'
        osc.frequency.value = freq
        const start = ctx.currentTime + index * 0.13
        gain.gain.setValueAtTime(0.001, start)
        gain.gain.exponentialRampToValueAtTime(0.12, start + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
        osc.start(start)
        osc.stop(start + 0.24)
      })
      return
    }

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = kind === 'match' ? 'triangle' : 'sine'
    osc.frequency.value = kind === 'match' ? 1040 : kind === 'error' ? 160 : 560
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
    osc.start()
    osc.stop(ctx.currentTime + 0.24)
  } catch {}
}

function StartScreen({ name, setName, onStart }) {
  return (
    <main className="start-screen exact-image-start-screen">
      <img
        src="/assets/start-screen-layout.png"
        className="exact-layout-image"
        alt="UAU Market Challenge"
      />

      <section className="exact-layout-actions">
        <label className="exact-layout-input">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Digite seu nome para começar"
            maxLength={22}
            autoFocus
          />
        </label>

        <button className="exact-layout-start-button" onClick={onStart}>
          Começar
        </button>
      </section>
    </main>
  )
}

function TutorialPanel() {
  return (
    <aside className="tutorial">
      <img src="/assets/logo-uau.png" className="side-logo" />
      <div className="side-title">PACK<br/>CHÁ BRANCO</div>
      <div className="tip"><b>1</b><h3>Combine 3 iguais</h3><p>Arraste 3 itens para o organizador.</p></div>
      <div className="tip"><b>2</b><h3>Combo +300</h3><p>Faça 3 matchs em até 5 segundos.</p></div>
      <div className="tip"><b>3</b><h3>Limpe tudo</h3><p>Esvazie as prateleiras antes do tempo acabar.</p></div>
    </aside>
  )
}

function ProductImage({ item, dark = false, tray = false }) {
  return (
    <div className={`${dark ? 'product-image dark-product' : 'product-image'} ${tray ? 'tray-image' : ''}`}>
      <img src={item.image} />
    </div>
  )
}

function ShelfCell({ slot, onSelect, onDragStart }) {
  const front = topItem(slot)
  const hidden = slot.layers.slice(0, -1).slice(-2)

  if (!front) return <div className="shelf-cell empty-cell"></div>

  return (
    <div className="shelf-cell">
      <div className="hidden-products">
        {hidden.map((item, index) => (
          <div className="hidden-product" key={item.id} style={{ right: `${index * 10 + 6}px`, transform: `scale(${0.78 - index * 0.08})` }}>
            <ProductImage item={item} dark />
          </div>
        ))}
      </div>

      <motion.button
        className="front-product"
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData('text/plain', slot.slotId)
          onDragStart(slot.slotId)
        }}
        onClick={() => onSelect(slot.slotId)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.92 }}
      >
        <ProductImage item={front} />
      </motion.button>
    </div>
  )
}

function GameScreen({ board, tray, time, score, matchingIds, message, comboVisible, matchFeedback, finalCountdown, onSelect, onRestart, onClearTray }) {
  const [dragging, setDragging] = useState(null)
  const shelves = [board.slice(0, 6), board.slice(6, 12), board.slice(12, 18)]

  function drop(event) {
    event.preventDefault()
    const slotId = event.dataTransfer.getData('text/plain') || dragging
    if (slotId) onSelect(slotId)
    setDragging(null)
  }

  function touchDrop() {
    if (dragging) onSelect(dragging)
    setDragging(null)
  }

  return (
    <main className="game-screen">
      <div className="blurred-market-bg" />
      <AnimatePresence>
        {finalCountdown && (
          <motion.div
            className="countdown-alert"
            initial={{ opacity: 0, scale: 0.65 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
          >
            <strong>{time}</strong>
            <span>Tempo acabando!</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="center-alerts">
        <AnimatePresence>
          {matchFeedback && (
            <motion.div
              className="match-feedback"
              initial={{ opacity: 0, scale: 0.55, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -25 }}
            >
              <Sparkles />
              {matchFeedback}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {comboVisible && (
            <motion.div
              className="combo-badge combo-center"
              initial={{ opacity: 0, scale: 0.55, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -28 }}
            >
              <Sparkles />
              Combo +300
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <TutorialPanel />

      <section className="play-area">
        <header className="top-hud">
          
          <button className="restart-top" onClick={onRestart}>
            <RotateCcw />
            <span>Reiniciar</span>
          </button>
          <div className="time-card"><Clock /><strong>{formatTime(time)}</strong></div>
          <div className="points-card">
            <Trophy /><strong>{score}</strong>
          </div>
        </header>

        <section className="stock-row">
          <section className="tray-wrapper" onDrop={drop} onDragOver={(event) => event.preventDefault()}>
            <div className="tray-grid">
              {Array.from({ length: TRAY_SIZE }).map((_, index) => {
                const item = tray[index]
                const isMatch = item && matchingIds.includes(item.id)
                return (
                  <div className={isMatch ? 'tray-cell match' : 'tray-cell'} key={index}>
                    <AnimatePresence>
                      {item && (
                        <motion.div
                          className="tray-product"
                          key={item.id}
                          initial={{ opacity: 0, y: -22, scale: 0.4 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                        >
                          <ProductImage item={item} tray />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </section>
          <button className="stock-clean-button" onClick={onClearTray}>
            <Eraser />
            Limpar
          </button>
        </section>

        <section className="cabinet">
          {shelves.map((shelf, index) => (
            <div className="shelf-row" key={index}>
              <div className="cell-grid">
                {shelf.map(slot => (
                  <ShelfCell
                    key={slot.slotId}
                    slot={slot}
                    onSelect={onSelect}
                    onDragStart={setDragging}
                  />
                ))}
              </div>
              <div className="shelf-board" />
            </div>
          ))}
        </section>

        
      </section>
    </main>
  )
}

function EndScreen({ name, score, result, restart, ranking, backToStart }) {
  useEffect(() => {
    playSound('champion')
  }, [])

  const titleTop = result === 'win' ? 'VOCÊ' : 'GAME'
  const titleBottom = result === 'win' ? 'GANHOU!' : 'OVER'

  return (
    <main className="end-screen result-neon-screen">
      <div className="result-confetti" />
      <div className="result-side result-side-left" />
      <div className="result-side result-side-right" />

      <section className="result-panel">
        <img src="/assets/logo-uau.png" className="result-logo" alt="Prezunic" />

        <div className="result-brand-pill">
          <span>PREZUNIC</span>
          <strong>CHALLENGE</strong>
        </div>

        <div className="result-title-card">
          <strong>{titleTop}</strong>
          <span>{titleBottom}</span>
        </div>

        <div className="result-score-title">Sua pontuação</div>

        <section className="result-score-box">
          <strong>{score}</strong>
          <span>Pontos</span>
        </section>

        <div className="result-ranking-title">Ranking geral</div>

        <section className="result-ranking-box">
          <div className="result-ranking-list">
            {ranking.length === 0 ? (
              <p>Nenhum jogador ainda</p>
            ) : (
              ranking.map((player, index) => (
                <div className="result-ranking-row" key={`${player.name}-${index}`}>
                  <span className="result-ranking-position">{index + 1}</span>
                  <span className="result-ranking-name">{player.name}</span>
                  <span className="result-ranking-score">{player.score}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="result-actions">
          <button className="result-green-button" type="button" onClick={restart}>
            Jogar novamente
          </button>
          <button className="result-green-button" type="button" onClick={backToStart}>
            Voltar ao início
          </button>
        </section>
      </section>
    </main>
  )
}

function App() {
  const [screen, setScreen] = useState('start')
  const [name, setName] = useState('')
  const [board, setBoard] = useState(createBoard())
  const [tray, setTray] = useState([])
  const [time, setTime] = useState(ROUND_TIME)
  const [score, setScore] = useState(0)
  const [matchingIds, setMatchingIds] = useState([])
  const [message, setMessage] = useState('Arraste ou clique em um produto para levar ao organizador.')
  const [result, setResult] = useState('lose')
  const [ranking, setRanking] = useState(getRanking())
  const [comboVisible, setComboVisible] = useState(false)
  const [matchFeedback, setMatchFeedback] = useState(null)
  const timerRef = useRef(null)
  const matchTimesRef = useRef([])
  const comboTimeoutRef = useRef(null)
  const matchFeedbackTimeoutRef = useRef(null)

  function finishGame(finalResult, bonus = 0) {
    clearInterval(timerRef.current)
    setResult(finalResult)

    setScore((current) => {
      const finalScore = current + bonus
      const updatedRanking = saveRankingEntry(name, finalScore)
      setRanking(updatedRanking)
      return finalScore
    })

    setTimeout(() => setScreen('end'), 650)
  }

  function start() {
    if (!name.trim()) return
    clearInterval(timerRef.current)
    clearTimeout(comboTimeoutRef.current)
    matchTimesRef.current = []
    setBoard(createBoard())
    setTray([])
    setTime(ROUND_TIME)
    setScore(0)
    setMatchingIds([])
    setComboVisible(false)
    setMatchFeedback(null)
    clearTimeout(matchFeedbackTimeoutRef.current)
    setMessage('Arraste ou clique em um produto para levar ao organizador.')
    setResult('lose')
    setRanking(getRanking())
    setScreen('game')

    timerRef.current = setInterval(() => {
      setTime((current) => {
        if (current <= 1) {
          playSound('champion')
          finishGame('lose')
          return 0
        }
        if (current <= 10) {
          try {
            const AudioContext = window.AudioContext || window.webkitAudioContext
            const ctx = new AudioContext()

            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.type = 'square'
            osc.frequency.value = current <= 5 ? 980 : 720

            gain.gain.setValueAtTime(0.001, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.02)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)

            osc.start()
            osc.stop(ctx.currentTime + 0.3)
          } catch {}
        }
        return current - 1
      })
    }, 1000)
  }

  function registerMatch() {
    const now = Date.now()
    matchTimesRef.current = [...matchTimesRef.current, now].filter((timeStamp) => now - timeStamp <= COMBO_WINDOW_MS)

    if (matchTimesRef.current.length >= 3) {
      matchTimesRef.current = []
      setScore((current) => current + COMBO_POINTS)
      setComboVisible(true)
      playSound('combo')
      clearTimeout(comboTimeoutRef.current)
      comboTimeoutRef.current = setTimeout(() => setComboVisible(false), 1400)
      setMessage(`Combo ativado! +${COMBO_POINTS} pontos extras`)
    }
  }

  function selectSlot(slotId) {
    const selected = board.find((slot) => slot.slotId === slotId)
    const item = selected ? topItem(selected) : null
    if (!item) return

    if (tray.length >= TRAY_SIZE) {
      playSound('error')
      setMessage('Organizador cheio. Junte 3 iguais para liberar espaço.')
      return
    }

    const nextItem = { ...item, id: `${item.id}-tray`, originSlotId: slotId }
    const nextTray = [...tray, nextItem]
    const same = nextTray.filter((product) => product.type === item.type)

    setBoard((current) =>
      current.map((slot) =>
        slot.slotId === slotId
          ? { ...slot, layers: slot.layers.slice(0, -1) }
          : slot
      )
    )

    if (same.length >= 3) {
      const matched = same.slice(0, 3)
      const ids = matched.map((product) => product.id)
      setTray(nextTray)
      setMatchingIds(ids)
      const feedbackText = `Match 3! +${MATCH_POINTS}`
      setMessage(`Match 3: ${item.name}! +${MATCH_POINTS} pontos`)
      setMatchFeedback(feedbackText)
      clearTimeout(matchFeedbackTimeoutRef.current)
      matchFeedbackTimeoutRef.current = setTimeout(() => setMatchFeedback(null), 1200)
      setScore((current) => current + MATCH_POINTS)
      registerMatch()
      playSound('combo')

      setTimeout(() => {
        setTray((current) => current.filter((product) => !ids.includes(product.id)))
        setMatchingIds([])
      }, 740)
    } else {
      setTray(nextTray)
      setMessage(`${item.name} adicionado ao organizador. Junte 3 iguais para pontuar.`)
      playSound('click')
    }
  }


  function clearTray() {
    if (tray.length === 0) {
      playSound('error')
      setMessage('O organizador já está vazio.')
      return
    }

    setBoard((current) => {
      const restored = current.map((slot) => ({ ...slot, layers: [...slot.layers] }))

      tray.forEach((item) => {
        const targetIndex = restored.findIndex((slot) => slot.slotId === item.originSlotId)
        const cleanItem = {
          type: item.type,
          name: item.name,
          image: item.image,
          id: `${item.originSlotId}-${item.type}-restored-${Math.random().toString(36).slice(2)}`
        }

        if (targetIndex >= 0) {
          restored[targetIndex].layers.push(cleanItem)
        }
      })

      return restored
    })

    setTray([])
    setMatchingIds([])
    setMessage('Organizador limpo. Os produtos voltaram para as prateleiras.')
    playSound('combo')
  }

  useEffect(() => {
    if (screen !== 'game') return
    const remaining = board.reduce((total, slot) => total + slot.layers.length, 0)

    if (remaining === 0 && tray.length === 0) {
      finishGame('win', time * 5)
    }

    if (tray.length >= TRAY_SIZE) {
      const possible = PRODUCTS.some((product) => tray.filter((item) => item.type === product.type).length >= 3)
      if (!possible) {
        finishGame('lose')
      }
    }
  }, [board, tray, screen, time])

  function backToStart() {
    clearInterval(timerRef.current)
    clearTimeout(comboTimeoutRef.current)
    clearTimeout(matchFeedbackTimeoutRef.current)
    matchTimesRef.current = []
    setBoard(createBoard())
    setTray([])
    setTime(ROUND_TIME)
    setScore(0)
    setMatchingIds([])
    setComboVisible(false)
    setMatchFeedback(null)
    setMessage('Arraste ou clique em um produto para levar ao organizador.')
    setResult('lose')
    setRanking(getRanking())
    setName('')
    setScreen('start')
  }

  useEffect(() => () => {
    clearInterval(timerRef.current)
    clearTimeout(comboTimeoutRef.current)
    clearTimeout(matchFeedbackTimeoutRef.current)
  }, [])

  if (screen === 'start') return <StartScreen name={name} setName={setName} onStart={start} />
  if (screen === 'end') return <EndScreen name={name} score={score} result={result} restart={start} ranking={ranking} backToStart={backToStart} />

  return (
    <GameScreen
      board={board}
      tray={tray}
      time={time}
      score={score}
      matchingIds={matchingIds}
      message={message}
      comboVisible={comboVisible}
      matchFeedback={matchFeedback}
      finalCountdown={time <= 10 && time > 0}
      onSelect={selectSlot}
      onRestart={start}
      onClearTray={clearTray}
    />
  )
}

createRoot(document.getElementById('root')).render(<App />)