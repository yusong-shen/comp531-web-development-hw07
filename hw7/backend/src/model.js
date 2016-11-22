// this is model.js 
const mongoose = require('mongoose')
require('./db.js')
mongoose.Promise = global.Promise
// console.log(mongoose.Promise)
exports.ObjectId = mongoose.Types.ObjectId

const commentSchema = new mongoose.Schema({
	commentId: String, author: String, date: Date, text: String
})
const articleSchema = new mongoose.Schema({
	author: String, img: String, date: Date, text: String,
	comments: [ commentSchema ]
})


exports.Article = mongoose.model('article', articleSchema)


const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    dob: Date,
    zipcode: String,
    salt: String,
    hash: String
})

exports.User = mongoose.model('user', userSchema)

const profileSchema = new mongoose.Schema({
    username: String,
    headline: String,
    email: String,
    dob: Date,
    zipcode: String,
    avatar: String,
    following: [String]
})

exports.Profile = mongoose.model('profile', profileSchema)
