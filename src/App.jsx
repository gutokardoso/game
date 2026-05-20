import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Clock, Trophy, User, RotateCcw, Sparkles, PackageCheck, Layers } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './styles.css'

const ROUND_TIME = 120
const TRAY_SIZE = 7

const PRODUCTS = [
  { type: 'amaciante', name: 'Amaciante', image: '/assets/products/amaciante.png' },
  { type: 'essencia', name: 'Essência', image: '/assets/products/essencia.png' },
  { type: 'lava', name: 'Lava-Roupas', image: '/assets/products/lava-roupas.png' },
  { type: 'pisos', name: 'Limpa Pisos', image: '/assets/products/limpa-pisos.png' },
]

const LAYER_TEMPLATE = [
  ['lava', 'amaciante', 'essencia'],
  ['pisos', 'lava', 'amaciante'],
  ['essencia', 'pisos', 'lava'],
  ['amaciante', 'essencia', 'pisos'],
  ['lava', 'pisos', 'amaciante'],
  ['essencia', 'amaciante', 'lava'],
  ['pisos', 'essencia', 'amaciante'],
  ['lava', 'amaciante', 'pisos'],
  ['essencia', 'pisos', 'lava'],
  ['amaciante', 'lava', 'essencia'],
  ['pisos', 'amaciante', 'essencia'],
  ['lava', 'pisos', 'amaciante'],
]

function productByType(type) {
  return PRODUCTS.find((product) => product.type === type)
}

function createBoard() {
  return LAYER_TEMPLATE.map((stack, slotIndex) => ({
    slotId: `slot-${slotIndex}`,
    layers: stack.map((type, layerIndex) => ({
      ...productByType(type),
      id: `slot-${slotIndex}-${type}-${layerIndex}-${Math.random().toString(36).slice(2)}`,
    })),
  }))
}

function getTopItem(slot) {
  if (!slot.layers.length) return null
  return slot.layers[slot.layers.length - 1]
}

function playTone(kind) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = kind === 'match' ? 'triangle' : 'sine'
    osc.frequency.value = kind === 'match' ? 980 : kind === 'error' ? 150 : 520
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
    osc.start()
    osc.stop(ctx.currentTime + 0.24)
  } catch {}
}

function StartScreen({ playerName, setPlayerName, startGame }) {
  return (
    <main className="screen start-screen">
      <div className="market-bg" />
      <section className="hero-card">
        <img src="/assets/logo-uau.png" className="logo" />
        <div className="game-title">
          <span>GOODS SORT</span>
          <strong>CHALLENGE</strong>
        </div>

        <p className="subtitle">
          Remova os produtos da frente, revele as camadas ocultas e combine 3 iguais.
        </p>

        <label className="input-box">
          <User />
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Digite seu nome"
            maxLength={22}
          />
        </label>

        <button className="primary" onClick={startGame}>Começar</button>

        <div className="rule-grid">
          <div><PackageCheck /> Combine 3 iguais</div>
          <div><Layers /> Camadas ocultas</div>
          <div><Trophy /> Limpe tudo</div>
        </div>
      </section>
    </main>
  )
}

function ShelfSlot({ slot, onSelect }) {
  const top = getTopItem(slot)
  const hiddenCount = Math.max(0, slot.layers.length - 1)

  if (!top) {
    return <div className="slot empty"><span>livre</span></div>
  }

  return (
    <motion.button
      className="slot product"
      onClick={() => onSelect(slot.slotId)}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.04 }}
      layout
    >
      <div className="hidden-stack">
        {slot.layers.slice(0, -1).map((layer, index) => (
          <img
            key={layer.id}
            src={layer.image}
            style={{ transform: `translate(${index * 4}px, ${index * -4}px) scale(${0.78 + index * 0.04})` }}
          />
        ))}
      </div>

      <motion.div
        key={top.id}
        initial={{ scale: 0.65, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.1, opacity: 0 }}
        className="front-product"
      >
        <img src={top.image} />
        <b>{top.name}</b>
      </motion.div>

      {hiddenCount > 0 && (
        <div className="layer-badge">
          +{hiddenCount}
        </div>
      )}
    </motion.button>
  )
}

function GameScreen({ playerName, board, tray, score, time, moves, message, selectSlot, restart }) {
  const shelves = [board.slice(0, 4), board.slice(4, 8), board.slice(8, 12)]

  return (
    <main className="screen game-screen">
      <header className="topbar">
        <img src="/assets/logo-uau.png" />
        <div className="timer"><Clock /> {time}s</div>
        <div className="score">Pontos <strong>{score}</strong></div>
        <button className="secondary" onClick={restart}><RotateCcw /> Reiniciar</button>
      </header>

      <div className="mission">
        <span>Jogador: <b>{playerName}</b></span>
        <strong>Missão: toque no produto da frente, revele os ocultos e combine 3 iguais.</strong>
        <span>Movimentos: {moves}</span>
      </div>

      <section className="cabinet">
        {shelves.map((shelf, shelfIndex) => (
          <div className="shelf" key={shelfIndex}>
            <div className="products-grid">
              {shelf.map((slot) => (
                <ShelfSlot key={slot.slotId} slot={slot} onSelect={selectSlot} />
              ))}
            </div>
            <div className="wood-line" />
          </div>
        ))}
      </section>

      <section className="organizer">
        <h2>Organizador</h2>
        <div className="tray">
          {Array.from({ length: TRAY_SIZE }).map((_, index) => {
            const item = tray[index]
            return (
              <div className={`tray-slot ${item ? 'filled' : ''}`} key={index}>
                <AnimatePresence>
                  {item && (
                    <motion.div
                      initial={{ scale: 0.3, opacity: 0, y: -25 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <img src={item.image} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
        <p className="message">{message}</p>
      </section>
    </main>
  )
}

function EndScreen({ playerName, score, result, restart }) {
  return (
    <main className="screen end-screen">
      <section className="end-card">
        <img src="/assets/logo-uau.png" />
        <h1>{result === 'win' ? 'Prateleiras limpas!' : 'Fim de jogo!'}</h1>
        <p>{playerName}, você fez</p>
        <div className="big-score">{score}</div>
        <strong>pontos</strong>
        <button className="primary" onClick={restart}>Jogar novamente</button>
      </section>
    </main>
  )
}

function App() {
  const [screen, setScreen] = useState('start')
  const [playerName, setPlayerName] = useState('')
  const [board, setBoard] = useState(createBoard())
  const [tray, setTray] = useState([])
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(ROUND_TIME)
  const [moves, setMoves] = useState(0)
  const [message, setMessage] = useState('Toque nos produtos da frente para revelar os ocultos.')
  const [result, setResult] = useState('lose')
  const timerRef = useRef(null)

  function startGame() {
    if (!playerName.trim()) return
    clearInterval(timerRef.current)
    setBoard(createBoard())
    setTray([])
    setScore(0)
    setTime(ROUND_TIME)
    setMoves(0)
    setMessage('Combine 3 produtos iguais no organizador.')
    setResult('lose')
    setScreen('game')

    timerRef.current = setInterval(() => {
      setTime((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current)
          setResult('lose')
          setScreen('end')
          return 0
        }
        return current - 1
      })
    }, 1000)
  }

  function selectSlot(slotId) {
    if (screen !== 'game') return

    if (tray.length >= TRAY_SIZE) {
      playTone('error')
      setMessage('Organizador cheio! Combine 3 iguais antes de continuar.')
      return
    }

    const selectedSlot = board.find((slot) => slot.slotId === slotId)
    const topItem = getTopItem(selectedSlot)

    if (!topItem) return

    const nextTray = [...tray, topItem]
    const same = nextTray.filter((item) => item.type === topItem.type)

    setBoard((current) =>
      current.map((slot) =>
        slot.slotId === slotId
          ? { ...slot, layers: slot.layers.slice(0, -1) }
          : slot
      )
    )

    setMoves((current) => current + 1)

    if (same.length >= 3) {
      const idsToRemove = same.slice(0, 3).map((item) => item.id)
      const cleanedTray = nextTray.filter((item) => !idsToRemove.includes(item.id))
      playTone('match')
      setTray(cleanedTray)
      setScore((current) => current + 150)
      setMessage(`Combinação tripla: ${topItem.name}! +150 pontos`)
    } else {
      playTone('click')
      setTray(nextTray)
      setScore((current) => current + 10)
      setMessage(`${topItem.name} movido. ${selectedSlot.layers.length - 1} camada(s) oculta(s) restante(s).`)
    }
  }

  useEffect(() => {
    if (screen !== 'game') return

    const remaining = board.reduce((total, slot) => total + slot.layers.length, 0)

    if (remaining === 0) {
      clearInterval(timerRef.current)
      setScore((current) => current + time * 5)
      setResult('win')
      setTimeout(() => setScreen('end'), 550)
    }

    if (tray.length >= TRAY_SIZE) {
      const hasMatch = PRODUCTS.some((product) =>
        tray.filter((item) => item.type === product.type).length >= 3
      )

      if (!hasMatch) {
        clearInterval(timerRef.current)
        setResult('lose')
        setMessage('Organizador cheio. Fim de jogo.')
        setTimeout(() => setScreen('end'), 550)
      }
    }
  }, [board, tray, screen, time])

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  if (screen === 'start') {
    return <StartScreen playerName={playerName} setPlayerName={setPlayerName} startGame={startGame} />
  }

  if (screen === 'end') {
    return <EndScreen playerName={playerName} score={score} result={result} restart={startGame} />
  }

  return (
    <GameScreen
      playerName={playerName}
      board={board}
      tray={tray}
      score={score}
      time={time}
      moves={moves}
      message={message}
      selectSlot={selectSlot}
      restart={startGame}
    />
  )
}

createRoot(document.getElementById('root')).render(<App />)