const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const projectRoutes    = require('./routes/projects')
const actionItemRoutes = require('./routes/actionItems')

app.use('/api/projects',     projectRoutes)
app.use('/api/action-items', actionItemRoutes)

app.get('/', (req, res) => {
  res.send('Liberty PC Tool API is running')
})

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch(err => console.error('MongoDB connection error:', err))
