import dotenv from 'dotenv'
dotenv.config()
import morgan from 'morgan'
import express from 'express'
import * as userRoutes from './routes/user.routes.js'
const app = express()
app.use(morgan('dev'))  
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/users',userRoutes)

app.get('/', (req, res) => {
  res.send('API is running...')
})

export default app