
import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import app from './app.js'
import connect from './db/db.js' 

connect()

const server = http.createServer(app)
const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})