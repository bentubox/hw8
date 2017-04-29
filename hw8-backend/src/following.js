const isLoggedIn = require('./auth').isLoggedIn
const Following = require('./model.js').Following
const Profile = require('./model.js').Profile

// Function that resets following arrays to a set of default data.
const resetDefaultFollowing = () => {
    // Clear documents.
    Following.remove({}, (err) => {})

    new Following({ 
            username: 'Dummy',
            following: [
            'Jimmy',
            'Timmy',
            'Kimmy'
            ]
        }).save()
    new Following({ 
            username: 'Jimmy',
            following: [
                'Dummy',
                'Timmy',
                'Kimmy'
            ]
        }).save()
    new Following({ 
            username: 'Timmy',
            following: [
                'Kimmy'
            ]
        }).save()
    new Following({ 
            username: 'Kimmy',
            following: [
                'Jimmy',
                'Timmy'
            ]
        }).save()
    new Following({ 
        username:"bnt1test",
        following: [
                'Dummy',
                "Timmy",
                'Kimmy'
            ]
        }).save() 
}

// resetDefaultFollowing()

// Function that queries users by username, then runs a callback function on the results.
const findOneByUsername = (username, callback) => {
    console.log('Find one by username: ', username)
    Following.findOne({ username: username }).exec((err, document) => {
		if (err){
            throw new Error(err)
        }
        callback(document)
	})
}

// Function that updates a document based on username.
const updateByUsername = (username, newField, callback) => {
    console.log('Update by username: ', username)
    Following.findOneAndUpdate({ username: username }, newField, { new: true }, (err, doc) => {  
        if (err){
            throw new Error(err)
        }
        callback(doc)
    })
}

const getFollowing = (req, res) => {
    console.log('Payload received:', req.body)
    console.log('Parameters received:', req.params)
    
    // Requested user.
    const requestedUser = req.params.user ? req.params.user : req.user
    
    findOneByUsername(requestedUser, (result) => {
        if (result) {
            res.send({ username: result.username, following: result.following })
        } else{
            res.status(404).send("Could not find user!")
        }
    })
}

const addFollowing = (req, res) => {
    console.log('Payload received:', req.body)
    console.log('Parameters received:', req.params)

    Profile.findOne({ username: req.params.user }).exec((err, document) => {
		if (err){
            throw new Error(err)
        }

        findOneByUsername(req.user, (result) => {
            if (document){
                // Username is in database.
                result.following.push(req.params.user)
                updateByUsername(req.user, { following: result.following }, (newDocument) => {
                    res.send({ username: newDocument.username, following: newDocument.following })
                })
            } else {
                // Username not in database.
                res.status(404).send({ username: result.username, following: result.following })
            } 
        })
	})
}

const removeFollowing = (req, res) => {
    console.log('Payload received:', req.body)
    console.log('Parameters received:', req.params)
    
    findOneByUsername(req.user, (result) => {
        updateByUsername(req.user, { following: result.following.filter((element) => {
            return element !== req.params.user
        })}, (document) => {
            res.send({ username: document.username, following: document.following })
        })
    })
}

module.exports = (app) => {
    app.get('/following/:user?', isLoggedIn, getFollowing)
    app.put('/following/:user', isLoggedIn, addFollowing)
    app.delete('/following/:user', isLoggedIn, removeFollowing)
}