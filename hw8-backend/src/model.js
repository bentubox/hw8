// this is model.js 
const mongoose = require('mongoose')
require('./db.js')

const commentSchema = new mongoose.Schema({
	author: String, date: Date, text: String
})
const articleSchema = new mongoose.Schema({
	author: String, img: String, date: Date, text: String,
	comments: [ commentSchema ]
})

const profileSchema = new mongoose.Schema({
	username: String,
    headline: String,
    email: String,
    dob: Date,
    zipcode: Number,
    avatar: String
})

const userSchema = new mongoose.Schema({
	username: String,
    salt: Number,
	hash: String
})

const followingSchema = new mongoose.Schema({
	username: String,
    following: Array
})

exports.Article = mongoose.model('article', articleSchema)
exports.Comment = mongoose.model('comment', commentSchema)
exports.Profile = mongoose.model('profile', profileSchema)
exports.User = mongoose.model('user', userSchema)
exports.Following = mongoose.model('following', followingSchema)