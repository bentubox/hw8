const md5 = require('md5')
const User = require('./model.js').User
const Profile = require('./model.js').Profile
const Following = require('./model.js').Following

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy

const frontendURL = "http://special-morning.surge.sh"
// const frontendURL = "http://localhost:8080"

if (!process.env.REDIS_URL) {
    process.env.REDIS_URL = 'redis://h:p55297af89603d755d81a1940390443dd54386ae7a7d5a3ac2342db1656d6acaa@ec2-34-206-162-178.compute-1.amazonaws.com:25989'
}

// Map of session IDs to usernames.
const sessionUser = require('redis').createClient(process.env.REDIS_URL)
const secret = "onemanflan"

// Cookie id for authentication.
const cooKey = 'sid'

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
    new User({ 
            username:"Ben",
            salt: 421,
            hash: md5(`lolwat421`)
        }).save()
}

// resetDefaultUsers()

const debug = (req, res) => {
    sessionUser.hgetall(req.cookies[cooKey], function(err, userObj) {
        res.send(userObj)
    })
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
            sessionUser.hmset(sessionKey, { username: requestedUser.username })
            res.cookie(cooKey, sessionKey, { maxAge: 3600*1000, httpOnly: true })
            res.send({result: "success", username: req.body.username})
        } else{
            res.status(404).send("Username not found!")
            return
        }
    })
}

const loginUserOAuth = (req, res) => {
    console.log('Payload received:', req.body)
    console.log('User received:', req.session.passport.user)
    if (req.session && req.session.passport && req.session.passport.user){
        if (req.cookies.sid){
            // Cookie exists, user is already logged in. Perform account linking or unlinking.
            const sid = req.cookies[cooKey]
            if(!sid){
                res.status(401)
            }
            sessionUser.hgetall(sid, (err, userObj) => {
                if (userObj){
                    User.findOne({username: userObj.username}, (err, user) => {
                        if (user){
                            const linkAuth = req.session.passport.user.auth
                            const compareAuth = (element) => {return (element.provider == linkAuth[0].provider && element.username == linkAuth[0].username)}
                            const newAuthArray = (user.auth.findIndex(compareAuth) != -1 ? user.auth.filter((element) => { return !compareAuth(element) }) : [...user.auth, ...linkAuth])
                            console.log(user.auth)
                            console.log(linkAuth[0])
                            console.log(newAuthArray)
                            User.findOneAndUpdate({username: userObj.username}, { auth: newAuthArray }, { new: true }, (err, newUser) => {
                                if (newUser){
                                    if(req.session.passport.user.username !== newUser.username){
                                        // Delete linked/unlinked third party record.
                                        User.remove({ username: req.session.passport.user.username }, (err) => {
                                            User.find({}, (err, users) => {
                                                console.log(users)
                                            })
                                        })
                                    }
                                }
                            })
                        } else{
                            res.status(404)
                        }
                    })
                } else {
                    res.cookie(cooKey, "", { httpOnly: true })
                    res.status(401)
                }
            })
        } else {
            // No existing cookie. Create cookie for login and redirect to frontend.
            const sessionKey = md5(secret + new Date().getTime() + req.session.passport.user.username) 
            sessionUser.hmset(sessionKey, { username: req.session.passport.user.username })
            res.cookie(cooKey, sessionKey, { maxAge: 3600*1000, httpOnly: true })
        }
        return res.redirect(frontendURL)
    } else {
        return res.status(404).redirect(frontendURL)
    }   
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
    sessionUser.hgetall(sid, (err, userObj) => {
        if (userObj){
            req.user = userObj.username
            next()
        } else {
            res.cookie(cooKey, "", { httpOnly: true })
            return res.status(401).send("Session has ended for user!")
        }
    })
}

const logoutUser = (req, res) => {
    console.log('Payload received:', req.body)
    sessionUser.del(req.cookies[cooKey])
    res.cookie(cooKey, "", { httpOnly: true })
    res.send("OK")
}

const registerUser = (req, res) => {
    console.log('Payload received:', req.body)
    const salt = Math.random() * 1000
    const hash = md5(`lol${req.body.password}${salt}`)
    User.findOne( {username: req.body.username}, (err, document) => {
        if (document){
            res.status(403).send("Username is already in use! Registration failed.")
        } else {
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

module.exports = (app, passport) => {
    passport.serializeUser( (user, done) => {
        console.log('Serializing User ', user)
        const provider = user.provider
        const providerUsername = `${provider}${user.id}`
        User.findOne({ $or: [{username: providerUsername}, {email: { $in: user.emails }}, {auth: { $elemMatch: { provider: provider, username: providerUsername }}}] }, (err, userObj) => {
            if (userObj) {
                // If user exists (by username, email, or linked account), load that user after sorting auth to facilitate delinking.
                User.findOneAndUpdate({ username: userObj.username }, { auth: userObj.auth.sort((x, y) => { return x.username == providerUsername ? -1 : y.username == providerUsername ? 1 : 0 })}, { new: true}, (err, document) => {
                    console.log('Loading User ', document)
                    done(null, document)
                })
            } else {
                // Create new user.
                var email, photo
                if (user.emails && user.emails.length > 0) {
                     email = user.emails[0].value
                }
                if (user.photos && user.photos.length > 0) {
                     photo = user.photos[0].value
                }
                new User({ 
                    username: providerUsername,
                    auth: [{ provider: provider, username: providerUsername }]
                }).save( (err, newUser) => {
                    new Profile({ 
                        username: providerUsername,
                        email: email,
                        avatar: photo,
                    }).save( () => {
                        new Following({
                            username: providerUsername,
                            following: []
                        }).save( () => {
                           console.log('Serialized user ', newUser)
                           done(null, newUser)
                        })
                    })
                })
            }
        })
    })

    passport.deserializeUser( (id, done) => {
        console.log('Deserializing User ', id)
        User.findOne({ username: id }, (err, document) => {
            if (err) {
                throw new Error(err)
            }
            done(null, document)
        })
    })

    passport.use( new GoogleStrategy({
        clientID: '982294091723-6ptpvau7cqudvitleg7kd60gmodogdib.apps.googleusercontent.com',
        clientSecret: 'Sn3vwzHtEspmCN_I76hiI8_s',
        callbackURL: 'https://warm-everglades-17804.herokuapp.com/auth/google/callback',
        // callbackURL: 'http://localhost:3000/auth/google/callback'

    }, (token, refreshToken, profile, done) => {
        process.nextTick( () => {
            return done(null, profile)
        })
    }))
    
    app.post('/login', loginUser)
    app.put('/logout', isLoggedIn, logoutUser)
    app.post('/register', registerUser)
    app.put('/password', isLoggedIn, updatePassword)
    app.get('/autologin', isLoggedIn, autoLoginUser)

    app.get('/auth/google', passport.authenticate('google', { scope: ['openid', 'profile', 'email'] }))
    
    app.use('/auth/google/callback', passport.authenticate('google'), loginUserOAuth)
}

module.exports.isLoggedIn = isLoggedIn