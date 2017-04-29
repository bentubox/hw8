const md5 = require('md5')
const User = require('./model.js').User
const Profile = require('./model.js').Profile
const Following = require('./model.js').Following

// Cookie id for authentication.
const cooKey = 'sid'

// Map of session IDs to usernames.
const sessionUser = {}
const secret = "onemanflan"

// Function that resets users to a set of default data.
const resetDefaultUsers = () => {
    // Clear documents.
    User.remove({}, (err) => {})

    new User({ 
            username:"Dummy",
            salt: 0,
            hash: md5(`lolpassword0`)
        }).save()
    new User({ 
            username: 'Jimmy',
            salt: 100,
            hash: md5(`lolhaha100`)
        }).save()
    new User({ 
            username: 'Timmy',
            salt: 32,
            hash: md5(`lolswordfish32`)
        }).save()
    new User({ 
            username: 'Kimmy',
            salt: 111,
            hash: md5(`lol1234111`)
        }).save()
    new User({ 
            username:"bnt1test",
            salt: 888,
            hash: md5(`lolat-repeat-ask888`)
        }).save()
}

// resetDefaultUsers()

const debug = (req, res) => {
    res.send(sessionUser)
}

const loginUser = (req, res) => {   
    console.log('Payload received:', req.body)
    if(!req.body.username || !req.body.password){
        res.status(400).send("Bad credentials, cannot log in!")
        return
    }

    User.findOne({ username: req.body.username }, (err, requestedUser) => {
        if (err) {
            throw new Error(err)
        }
        if (requestedUser && requestedUser.salt && requestedUser.hash){
            const hashedPassword = md5(`lol${req.body.password}${requestedUser.salt}`)
            if (hashedPassword !== requestedUser.hash){
                res.status(401).send("Incorrect Password!")
                return
            }
            const sessionKey = md5(secret + new Date().getTime() + requestedUser.username) 
            sessionUser[sessionKey] = requestedUser.username
            res.cookie(cooKey, sessionKey, { maxAge: 3600*1000, httpOnly: true })
            res.send({result: "success", username: req.body.username})
        } else{
            res.status(404).send("Username not found!")
            return
        }
    })
}

const autoLoginUser = (req, res) => {
    res.send({result: "success", username: req.user})
}

const isLoggedIn = (req, res, next) => {
    console.log('Payload received:', req.body)
    const sid = req.cookies[cooKey]
    if(!sid){
         return res.status(401).send("Not logged in!")
    }
    const username = sessionUser[sid]
    if (username){
        req.user = username
        next()
    } else {
        return res.status(401).send("Session has ended for user!")
    }
}

const logoutUser = (req, res) => {
    console.log('Payload received:', req.body)
    delete sessionUser[req.cookies[cooKey]]
    res.cookie(cooKey, "", { httpOnly: true })
    res.send("OK")
}

const registerUser = (req, res) => {
    console.log('Payload received:', req.body)
    const salt = Math.random() * 1000
    const hash = md5(`lol${req.body.password}${salt}`)
    new User({ 
        username: req.body.username,
        salt: salt,
        hash: hash
    }).save( () => {
         new Profile({ 
            username: req.body.username,
            email: req.body.email,
            dob: req.body.dob,
            zipcode: req.body.zipcode
        }).save( () => {
            new Following({
                username: req.body.username,
                following: []
            }).save( () => {
                 res.send({result: "success", username: req.body.username})
            })
        })
    })   
}

const updatePassword = (req, res) => {
    // Password changing is not supported. Return with denial message.
    const salt = Math.random() * 1000
    const hash = md5(`lol${req.body.password}${salt}`)
    User.findOneAndUpdate({ username: req.user }, { hash: hash, salt: salt }, { new: true }, (err, newUser) => {
        if (err) {
            throw new Error(err)
        }
        if (newUser){
            res.send({username: req.user, status: 'Password updated!'})
        } else {
            res.status(404).send("Password change failed!")
        }
    })    
}

module.exports = (app) => {
    app.post('/login', loginUser)
    app.put('/logout', isLoggedIn, logoutUser)
    app.post('/register', registerUser)
    app.put('/password', isLoggedIn, updatePassword)
    app.get('/autologin', isLoggedIn, autoLoginUser)
}

module.exports.isLoggedIn = isLoggedIn