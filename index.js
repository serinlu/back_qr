const express = require('express')
const fileUpload = require('express-fileupload')
const photosRoutes = require('./photos.routes')
const cors = require('cors')

const app = express()

app.use(cors({
    origin: 'http://localhost:5173'
}))

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.use(fileUpload({
    useTempFiles: false,
}))

app.use(photosRoutes)

app.use(express.static('files'))

app.listen(3000)