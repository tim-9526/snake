import { useState, useRef, useCallback } from 'react'

export function useHistory(initial = []) {
  const hist = useRef([JSON.parse(JSON.stringify(initial))])
  const idx = useRef(0)
  const [shapes, setShapes] = useState(initial)

  const push = useCallback((next) => {
    const copy = JSON.parse(JSON.stringify(next))
    hist.current = hist.current.slice(0, idx.current + 1)
    hist.current.push(copy)
    idx.current = hist.current.length - 1
    setShapes(copy)
  }, [])

  const undo = useCallback(() => {
    if (idx.current > 0) {
      idx.current--
      setShapes(JSON.parse(JSON.stringify(hist.current[idx.current])))
    }
  }, [])

  const reset = useCallback((next) => {
    const copy = JSON.parse(JSON.stringify(next))
    hist.current = [copy]
    idx.current = 0
    setShapes(copy)
  }, [])

  return { shapes, push, undo, reset }
}
