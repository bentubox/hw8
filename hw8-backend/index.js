const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const passport = require('passport')

const app = express()

// Enable CORS.
const enableCORS = (req, res, next) => {
    res.set('Access-Control-Allow-Origin', req.headers.origin)
    res.set('Access-Control-Allow-Credentials', true)
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Authorization, Accept, Content-Type, Origin, X-Requested-With')
    if(req.method === 'OPTIONS'){
        res.status(200).send()
    }
    // console.log(req.headers.origin)
    // console.log(res._headers)
    next()
}
app.use(enableCORS)
app.use(bodyParser.json())
app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())

require('./src/auth')(app, passport)
require('./src/articles')(app)
require('./src/following')(app)
require('./src/profile')(app)

// Get the port from the environment, i.e., Heroku sets it
const port = process.env.PORT || 3000
const server = app.listen(port, () => {
     const addr = server.address()
     console.log(`Server listening at http://${addr.address}:${addr.port}`)
})