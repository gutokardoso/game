import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Clock, Trophy, User, RotateCcw, Sparkles, PackageCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './styles.css'

const ROUND_TIME = 90
const TRAY_SIZE = 7

const PRODUCTS = [
  { type: 'amaciante', name: 'Amaciante', image: '/assets/products/amaciante.png' },
  { type: 'essencia', name: 'Essência', image: '/assets/products/essencia.png' },
  { type: 'lava', name: 'Lava-Roupas', image: '/assets/products/lava-roupas.png' },
  { type: 'pisos', name: 'Limpa Pisos', image: '/assets/products/limpa-pisos.png' },
]

function createBoard() {
  const pool = []
  PRODUCTS.forEach((product) => {
    for (let i = 0; i < 6; i++) {
      pool.push({
        ...product,
        id: `${product.type}-${i}-${Math.random().toString(36).slice(2)}`,
        cleared: false,
      })
    }
  })

  return pool.sort(() => Math.random() - 0.5)
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
          Junte 3 produtos iguais no organizador para fazê-los sumir.
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
          <div><Clock /> 90 segundos</div>
          <div><Trophy /> Libere tudo</div>
        </div>
      </section>
    </main>
  )
}

function ProductCard({ item, onClick }) {
  if (!item || item.cleared) {
    return <div className="slot empty"><span>livre</span></div>
  }

  return (
    <motion.button
      className="slot product"
      onClick={() => onClick(item)}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.04 }}
      layout
    >
      <img src={item.image} />
      <b>{item.name}</b>
    </motion.button>
  )
}

function GameScreen({ playerName, board, tray, score, time, moves, message, selectItem, restart }) {
  const shelves = [board.slice(0, 8), board.slice(8, 16), board.slice(16, 24)]

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
        <strong>Missão: junte 3 produtos idênticos no organizador para liberar espaço.</strong>
        <span>Movimentos: {moves}</span>
      </div>

      <section className="cabinet">
        {shelves.map((shelf, shelfIndex) => (
          <div className="shelf" key={shelfIndex}>
            <div className="products-grid">
              {shelf.map((item) => (
                <ProductCard key={item.id} item={item} onClick={selectItem} />
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
        <h1>{result === 'win' ? 'Prateleiras organizadas!' : 'Fim de jogo!'}</h1>
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
  const [message, setMessage] = useState('Toque em um produto da prateleira.')
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
    setMessage('Combine 3 produtos iguais.')
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

  function selectItem(item) {
    if (screen !== 'game') return
    if (tray.length >= TRAY_SIZE) {
      playTone('error')
      setMessage('Organizador cheio! Faça uma combinação de 3.')
      return
    }

    const nextTray = [...tray, item]
    const same = nextTray.filter((trayItem) => trayItem.type === item.type)

    setBoard((current) =>
      current.map((product) =>
        product.id === item.id ? { ...product, cleared: true } : product
      )
    )

    setMoves((current) => current + 1)

    if (same.length >= 3) {
      playTone('match')
      const idsToRemove = same.slice(0, 3).map((trayItem) => trayItem.id)
      const cleanedTray = nextTray.filter((trayItem) => !idsToRemove.includes(trayItem.id))
      setTray(cleanedTray)
      setScore((current) => current + 100)
      setMessage(`Match 3: ${item.name}! +100 pontos`)
    } else {
      playTone('click')
      setTray(nextTray)
      setScore((current) => current + 10)
      setMessage(`${item.name} movido para o organizador.`)
    }
  }

  useEffect(() => {
    if (screen !== 'game') return

    const remaining = board.filter((item) => !item.cleared).length

    if (remaining === 0) {
      clearInterval(timerRef.current)
      setScore((current) => current + time * 5)
      setResult('win')
      setTimeout(() => setScreen('end'), 450)
    }

    if (tray.length >= TRAY_SIZE) {
      const hasPossibleMatch = PRODUCTS.some((product) =>
        tray.filter((item) => item.type === product.type).length >= 3
      )
      if (!hasPossibleMatch) {
        clearInterval(timerRef.current)
        setResult('lose')
        setTimeout(() => setScreen('end'), 450)
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
      selectItem={selectItem}
      restart={startGame}
    />
  )
}

createRoot(document.getElementById('root')).render(<App />)