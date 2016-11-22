/**
 * Created by yusong on 10/25/16.
 */

const Article = require('./model.js').Article
const Profile = require('./model.js').Profile
const multer = require('multer')
const stream = require('stream')
const cloudinary = require('cloudinary')
const md5 = require('md5')
const ObjectId = require('./model.js').ObjectId

const doUpload = (publicName, req, res, next) => {

    const uploadStream = cloudinary.uploader.upload_stream(result => {
        // capture the url and public_id and add to the request
        req.fileurl = result.url
        req.fileid = result.public_id
        next()
    }, { public_id: req.body[publicName]})

    // multer can save the file locally if we want
    // instead of saving locally, we keep the file in memory
    // multer provides req.files.image[0].buffer and within that is the byte buffer

    // we create a passthrough stream to pipe the buffer
    // to the uploadStream function for cloudinary.
    const s = new stream.PassThrough()
    s.end(req.files.image[0].buffer)
    s.pipe(uploadStream)
    s.on('end', uploadStream.end)
    // and the end of the buffer we tell cloudinary to end the upload.
}

const getTextAndImage = (req, res, next) => (
    multer().fields([
        { name : 'text', maxCount : 1} ,
        { name : 'image', maxCount : 1}
    ])(req, res, next)
)

const uploadTextAndImage = (publicName) => (req, res, next) => (
    getTextAndImage(req, res, () => {
        if (req.files.image) {
            console.log('contain image : ', req.files.image)
            doUpload(publicName, req, res, next)
        } else {
            console.log('only contain text!')
            next()
        }
    })
)

// POST /article should create a new article in mongo
// return the saved article with an id,
const addArticle = (req, res) => {
    console.log('Payload received', req.body)
    console.log('File received', req.fileid, req.fileurl)
    const imageUrl =  req.fileurl ?  req.fileurl : ""

    const username = req.username
    if (req.body.text) {
        new Article({
            author: username, img: imageUrl, date: new Date().getTime(),
            text: req.body.text}).save(function(err, doc) {
                if (err) {
                  res.send(err)
                } else {
                  console.log('articles save successfully! ', doc)
                  res.send({'articles' : [doc]})
                }
          })
    } else {
        res.send("error : payload should have a text field.")
    }

}

// GET /articles should retrieve all articles from mongo
// GET /articles/id should retrieve all articles with that id from mongo
const getArticles = (req, res) => {
    const id = req.params.id
    const query = {}
    if (id) {
        query._id = id
        // get one specific article with given id
        Article.find(query).exec()
            .then((articles) => {
                console.log('There are ' + articles.length + ' entries ')
                res.send({articles})
            })
            .catch((err) => {
                res.send(404, err)
            })
    } else {
        Profile.findOne({username : req.username}).exec()
            .then(profile => {
                const following = profile.following
                following.push(req.username)
                console.log(following)
                return Article.find({"author" : { "$in" : following} }).sort({ date : -1}).exec()
            })
            .then(articles => {
                console.log('There are ' + articles.length + ' entries ')
                res.send({articles})
            })
            .catch(err => {
                res.send(404, err)
            })

    }

}

// :id is a post id { text: message, commentId: optional }
// Update the article :id with a new text if commentId is not supplied. Forbidden if the user
// does not own the article. If commentId is supplied, then update the requested comment on
// the article, if owned. If commentId is -1, then a new comment is posted with the text message.
const updateArticle = (req, res) => {
    const user = req.username
    const curTime = new Date().getTime()
    let query = { _id : req.params.id, author : user}
    let update = { text : req.body.text, date: curTime}
    // update the content of article
    if (!req.body.commentId) {
        Article.findOneAndUpdate(query, update, {new : true}).exec((err, article) => {
            if (!err && article) {
                res.send({ articles : [article]})
            } else if (err) {
                res.send(404, err)
            } else {
                res.send(404, 'can\'t find given post id or unauthorized')
            }
        })
    }
    // post a new comment to the article
    else if (req.body.commentId === -1) {
        query = {_id : req.params.id}
        const _oid = new ObjectId()
        update = {"$push" : { comments : {
            commentId : _oid, author : user, text : req.body.text, date : curTime
        } }}
        // console.log(update)
        Article.findOneAndUpdate(query, update, {new : true}).exec((err, article) => {
            if (!err && article) {
                // console.log('post new comment : ', article)
                res.send({ articles : [article]})
            } else if (err) {
                res.send(404, err)
            } else {
                res.send(404, 'can\'t find given post id')
            }
        })
    }
    // edit the content of comment
    else {
        query = {_id : req.params.id,
            "comments.commentId" : req.body.commentId, "comments.author" : user}
        console.log(query)
        // user positional "$" operator variable to match subdocument
        update = {"$set" : {"comments.$" : {
            commentId : req.body.commentId, author : user, text : req.body.text, date : curTime
        }}}
        // console.log(update)
        Article.findOneAndUpdate(query, update, {new : true}).exec((err, article) => {
            if (!err && article) {
                // console.log('edit comment : ', article)
                res.send({ articles : [article]})
            } else if (err) {
                res.send(404, err)
            } else {
                res.send(404, 'can\'t find given comment id or unauthorized')
            }
        })
    }
}

module.exports = (app) => {
    app.post('/article', uploadTextAndImage('article'), addArticle)
    app.get('/articles/:id*?', getArticles)
    app.put('/articles/:id', updateArticle)
}