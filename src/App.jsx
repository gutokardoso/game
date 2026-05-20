import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Clock, Pause, RotateCcw, Shuffle, Lightbulb, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './styles.css'

const ROUND_TIME = 275
const TRAY_SIZE = 7

const PRODUCTS = [
  { type: 'amaciante', name: 'Amaciante', image: '/assets/products/amaciante.png' },
  { type: 'essencia', name: 'Essência', image: '/assets/products/essencia.png' },
  { type: 'lava', name: 'Lava-Roupas', image: '/assets/products/lava-roupas.png' },
  { type: 'pisos', name: 'Limpa Pisos', image: '/assets/products/limpa-pisos.png' },
]

const LAYOUT = [
  ['amaciante','lava','essencia'], ['amaciante','pisos','essencia'], ['essencia','lava','amaciante'], ['pisos','essencia','lava'], ['lava','pisos','amaciante'], ['pisos','lava','amaciante'], ['essencia','amaciante','pisos'], ['lava','essencia','pisos'],
  ['essencia','pisos','lava'], ['pisos','amaciante','lava'], ['lava','essencia','amaciante'], ['amaciante','pisos','essencia'], ['pisos','lava','essencia'], ['essencia','amaciante','pisos'], ['lava','pisos','amaciante'], ['amaciante','essencia','lava'],
  ['lava','amaciante','pisos'], ['pisos','essencia','amaciante'], ['essencia','lava','pisos'], ['amaciante','pisos','lava'], ['lava','essencia','amaciante'], ['pisos','lava','essencia'], ['essencia','amaciante','pisos'], ['amaciante','lava','pisos'],
]

function productByType(type) {
  return PRODUCTS.find((product) => product.type === type)
}

function createBoard() {
  return LAYOUT.map((stack, index) => ({
    slotId: `slot-${index}`,
    layers: stack.map((type, layer) => ({
      ...productByType(type),
      id: `${index}-${type}-${layer}-${Math.random().toString(36).slice(2)}`
    }))
  }))
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
    <main className="start-screen">
      <div className="start-panel">
        <img src="/assets/logo-uau.png" className="start-logo" />
        <div className="start-title">
          <span>GOODS</span>
          <strong>SORT</strong>
        </div>
        <p>Organize, combine e vença!</p>
        <label className="name-field">
          <User />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Digite seu nome" />
        </label>
        <button className="gold-button" onClick={onStart}>Começar</button>
      </div>
    </main>
  )
}

function ProductImage({ item, dark = false }) {
  return (
    <div className={dark ? 'product-image product-dark' : 'product-image'}>
      <img src={item.image} />
    </div>
  )
}

function ShelfCell({ slot, onDragStart }) {
  const front = topItem(slot)
  const hidden = slot.layers.slice(0, -1).slice(-2)

  if (!front) return <div className="shelf-cell empty-cell"></div>

  return (
    <div className="shelf-cell">
      <div className="hidden-products">
        {hidden.map((item, index) => (
          <div className="hidden-product" key={item.id} style={{ right: `${index * 10 + 5}px`, transform: `scale(${0.78 - index * 0.08})` }}>
            <ProductImage item={item} dark />
          </div>
        ))}
      </div>

      <motion.div
        className="front-product"
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData('text/plain', slot.slotId)
          onDragStart(slot.slotId)
        }}
        onTouchStart={() => onDragStart(slot.slotId)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
      >
        <ProductImage item={front} />
      </motion.div>
    </div>
  )
}

function GameScreen({ name, board, tray, time, score, matchingIds, message, onSelect, onRestart }) {
  const [dragging, setDragging] = useState(null)
  const shelves = [board.slice(0, 8), board.slice(8, 16), board.slice(16, 24)]

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
      <img src="/assets/uau-goods-sort-bg.png" className="reference-bg" />

      <section className="left-tutorial" aria-hidden="true" />
      <section className="top-hud">
        <div className="small-card"><span>Nível</span><strong>12</strong></div>
        <div className="small-card"><span>Estrelas</span><strong>⭐ 2</strong></div>
        <div className="time-card"><Clock /><strong>{formatTime(time)}</strong><i /></div>
        <button className="pause"><Pause /></button>
      </section>

      <section className="play-board">
        {shelves.map((shelf, index) => (
          <div className="shelf-row" key={index}>
            <div className="cell-grid">
              {shelf.map((slot) => (
                <ShelfCell key={slot.slotId} slot={slot} onDragStart={setDragging} />
              ))}
            </div>
          </div>
        ))}
      </section>

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
                      initial={{ opacity: 0, y: -30, scale: 0.4 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                    >
                      <img src={item.image} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </section>

      <button className="touch-drop" onClick={touchDrop}>Soltar no organizador</button>

      <section className="powerups">
        <button><Lightbulb /><em>3</em></button>
        <button onClick={onRestart}><RotateCcw /><em>2</em></button>
        <button><Shuffle /><em>2</em></button>
      </section>

      <footer className="slogan">
        <strong>ORGANIZE, <span>COMBINE E VENÇA!</span></strong>
        <p>{message}</p>
      </footer>
    </main>
  )
}

function EndScreen({ name, score, result, restart }) {
  return (
    <main className="end-screen">
      <div className="end-panel">
        <img src="/assets/logo-uau.png" />
        <h1>{result === 'win' ? 'Você venceu!' : 'Fim de jogo!'}</h1>
        <p>{name}, você fez</p>
        <div>{score}</div>
        <span>pontos</span>
        <button className="gold-button" onClick={restart}>Jogar novamente</button>
      </div>
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
  const [message, setMessage] = useState('Arraste um produto da frente para o organizador.')
  const [result, setResult] = useState('lose')
  const timerRef = useRef(null)

  function start() {
    if (!name.trim()) return
    clearInterval(timerRef.current)
    setBoard(createBoard())
    setTray([])
    setTime(ROUND_TIME)
    setScore(0)
    setMatchingIds([])
    setMessage('Arraste um produto da frente para o organizador.')
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
    const selected = board.find((slot) => slot.slotId === slotId)
    const item = selected ? topItem(selected) : null
    if (!item) return

    if (tray.length >= TRAY_SIZE) {
      playSound('error')
      setMessage('Organizador cheio. Junte 3 iguais para liberar espaço.')
      return
    }

    const nextItem = { ...item, id: `${item.id}-tray` }
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
      setMessage(`Brilho ativado: 3 ${item.name}!`)
      setScore((current) => current + 150)
      playSound('match')

      setTimeout(() => {
        setTray((current) => current.filter((product) => !ids.includes(product.id)))
        setMatchingIds([])
      }, 820)
    } else {
      setTray(nextTray)
      setScore((current) => current + 10)
      setMessage(`${item.name} adicionado ao organizador.`)
      playSound('click')
    }
  }

  useEffect(() => {
    if (screen !== 'game') return

    const remaining = board.reduce((total, slot) => total + slot.layers.length, 0)

    if (remaining === 0 && tray.length === 0) {
      clearInterval(timerRef.current)
      setScore((current) => current + time * 5)
      setResult('win')
      setTimeout(() => setScreen('end'), 650)
    }

    if (tray.length >= TRAY_SIZE) {
      const possible = PRODUCTS.some((product) => tray.filter((item) => item.type === product.type).length >= 3)
      if (!possible) {
        clearInterval(timerRef.current)
        setResult('lose')
        setTimeout(() => setScreen('end'), 650)
      }
    }
  }, [board, tray, screen, time])

  useEffect(() => () => clearInterval(timerRef.current), [])

  if (screen === 'start') return <StartScreen name={name} setName={setName} onStart={start} />
  if (screen === 'end') return <EndScreen name={name} score={score} result={result} restart={start} />

  return (
    <GameScreen
      name={name}
      board={board}
      tray={tray}
      time={time}
      score={score}
      matchingIds={matchingIds}
      message={message}
      onSelect={selectSlot}
      onRestart={start}
    />
  )
}

createRoot(document.getElementById('root')).render(<App />)