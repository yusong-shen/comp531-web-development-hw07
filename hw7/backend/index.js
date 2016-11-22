const express = require('express')
const bodyParser = require('body-parser')
const logger = require('morgan')


const middlewareCORS = (req, res, next) => {
    // console.log('call middlewareCORS()')
    // console.log(req.headers)
    const origin = req.headers.origin
    if (origin) {
        res.set('Access-Control-Allow-Origin', origin)
    }
    res.set('Access-Control-Allow-Credentials', true)
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    if (req.method === 'OPTIONS') {
        res.send(200)
    } else {
        next()
    }
}

const app = express()
app.use(middlewareCORS)
app.use(bodyParser.json())
app.use(logger('default'))
require('./src/auth.js').auth(app)
const isLoggedIn = require('./src/auth.js').isLoggedIn
console.log('type of isLoggedIn')
console.log(typeof isLoggedIn)
app.use(isLoggedIn)

require('./src/following')(app)
require('./src/profile.js').profile(app)
require('./src/articles.js')(app)
require('./src/hello.js')(app)



// Get the port from the environment, i.e., Heroku sets it
const port = process.env.PORT || 3000
const server = app.listen(port, () => {
     const addr = server.address()
     console.log(`Server listening at http://${addr.address}:${addr.port}`)
})
