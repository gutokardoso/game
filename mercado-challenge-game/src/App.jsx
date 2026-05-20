import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Timer, Star, RotateCcw, Play } from 'lucide-react'

const PRODUCTS = [
  { id: 1, emoji: '🧴', name: 'Detergente' },
  { id: 2, emoji: '🧼', name: 'Sabão' },
  { id: 3, emoji: '🥛', name: 'Leite' },
  { id: 4, emoji: '🍪', name: 'Biscoito' },
  { id: 5, emoji: '🥤', name: 'Refrigerante' },
  { id: 6, emoji: '🧽', name: 'Esponja' },
]

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5)
}

export default function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [timeLeft, setTimeLeft] = useState(45)
  const [score, setScore] = useState(0)
  const [target, setTarget] = useState(PRODUCTS[0])
  const [ranking, setRanking] = useState([])

  const shelves = useMemo(() => {
    return [shuffle(PRODUCTS), shuffle(PRODUCTS), shuffle(PRODUCTS)]
  }, [target])

  useEffect(() => {
    const savedRanking = JSON.parse(localStorage.getItem('ranking') || '[]')
    setRanking(savedRanking)
  }, [])

  useEffect(() => {
    if (!gameStarted || gameOver) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          finishGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, gameOver])

  function startGame() {
    setGameStarted(true)
    setGameOver(false)
    setTimeLeft(45)
    setScore(0)
    setTarget(PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)])
  }

  function finishGame() {
    setGameStarted(false)
    setGameOver(true)

    const newRanking = [...ranking, { name: 'Jogador', score }]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    localStorage.setItem('ranking', JSON.stringify(newRanking))
    setRanking(newRanking)
  }

  function handleClick(product) {
    if (!gameStarted) return

    if (product.id === target.id) {
      setScore((prev) => prev + 10)
      setTarget(PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)])
    } else {
      setScore((prev) => Math.max(0, prev - 5))
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-6xl text-yellow-400 font-bold text-center mb-8">
        Mercado Challenge
      </h1>

      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <div className="bg-zinc-900 rounded-2xl p-4 min-w-[180px] text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-400">
            <Timer />
            Tempo
          </div>
          <div className="text-4xl font-bold">{timeLeft}s</div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 min-w-[180px] text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-400">
            <Star />
            Pontos
          </div>
          <div className="text-4xl font-bold">{score}</div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 min-w-[220px] text-center">
          <div className="text-yellow-400 mb-2">Produto alvo</div>
          <div className="text-3xl">
            {target.emoji} {target.name}
          </div>
        </div>
      </div>

      <div className="relative h-[500px] overflow-hidden rounded-3xl bg-zinc-950 border border-yellow-500/20">
        {[0, 1, 2].map((row) => (
          <motion.div
            key={row}
            className={`absolute flex gap-6 ${
              row === 0 ? 'top-16' : row === 1 ? 'top-52' : 'bottom-16'
            }`}
            animate={{
              x: row % 2 === 0 ? ['-20%', '100%'] : ['100%', '-20%'],
            }}
            transition={{
              repeat: Infinity,
              duration: row === 0 ? 12 : row === 1 ? 15 : 10,
              ease: 'linear',
            }}
          >
            {shelves[row].map((product, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleClick(product)}
                className="w-28 h-28 bg-zinc-800 rounded-3xl text-6xl border border-yellow-500/20"
              >
                {product.emoji}
              </motion.button>
            ))}
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={startGame}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-4 rounded-2xl flex items-center gap-2"
        >
          <Play />
          Iniciar
        </button>

        <button
          onClick={startGame}
          className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2"
        >
          <RotateCcw />
          Reiniciar
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-10">
        <div className="bg-zinc-900 rounded-3xl p-6">
          <h2 className="text-3xl text-yellow-400 mb-4 flex items-center gap-2">
            <Trophy />
            Ranking
          </h2>

          <div className="space-y-3">
            {ranking.map((player, index) => (
              <div
                key={index}
                className="bg-black rounded-2xl p-4 flex justify-between"
              >
                <span>#{index + 1} {player.name}</span>
                <span className="text-yellow-400 font-bold">{player.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-400 text-black rounded-3xl p-6">
          <h2 className="text-4xl font-bold mb-4">Sistema de Vitória</h2>

          <p className="mb-3">🥇 300+ pontos → Mestre do Mercado</p>
          <p className="mb-3">🥈 200+ pontos → Especialista</p>
          <p>🥉 100+ pontos → Cliente Rápido</p>

          {gameOver && (
            <div className="bg-black text-white rounded-3xl p-6 mt-6">
              <h3 className="text-3xl font-bold mb-2">Fim de Jogo 🎉</h3>
              <div className="text-5xl text-yellow-400 font-black">{score}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}