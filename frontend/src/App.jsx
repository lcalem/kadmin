import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('...')

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage('Error fetching backend'))
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Fullstack Hello World</h1>
      <p>{message}</p>
    </div>
  )
}

export default App