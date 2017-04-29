const isLoggedIn = require('./auth').isLoggedIn
const Article = require('./model.js').Article
const Comment = require('./model.js').Comment
const Profile = require('./model.js').Profile
const ObjectId = require('mongoose').Types.ObjectId

// Function that resets articles to a set of default data.
const resetDefaultArticles = () => {
    // Clear documents.
    Article.remove({}, (err) => {})
    Comment.remove({}, (err) => {})

    new Article({ 
        author: "Ben",
        img: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Danburite-34745.jpg",
        date: new Date(2016, 11, 23),
        text: 'lol here is some text',
        comments: []
    }).save()
    new Article({
        author: "Ben",
        img: "https://upload.wikimedia.org/wikipedia/commons/6/62/8-Foot_Transonic_Pressure_Tunnel_%289443013735%29.jpg",
        date: new Date(2016, 12, 11),
        text: 'another article',
        comments: []
    }).save()
    new Article({
        author: "Ben",
        img: "https://upload.wikimedia.org/wikipedia/commons/0/06/Quartiere_Chepabbash_%28Rodi_Garganico%295.jpg",
        date: new Date(2016, 8, 8),
        text: 'what am i doing',
        comments: []
    }).save()
    new Article({
        author: "Dummy",
        img: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Coding_da_Vinci_Kick_Off_%2825_%26_26-04-2015%29_089.jpg",
        date: new Date(2017, 2, 11),
        text: 'Dumb Article',
        comments: []
    }).save()
    new Article({
        author: "Timmy",
        img: "https://upload.wikimedia.org/wikipedia/commons/6/6b/John_Gruden.jpg",
        date: new Date(2015, 3, 23),
        text: 'Hey this is Timmy',
        comments: []
    }).save()
    new Article({ 
        author: "bnt1test",
        img: "https://upload.wikimedia.org/wikipedia/commons/2/29/Two_outlines_of_faces_expressing_admiration_%28left%29_and_aston_Wellcome_V0009376.jpg",
        date: new Date(2016, 8, 12),
        text: 'TEST ARTICLE',
        comments: []
    }).save()    
    new Article({ 
        author: "Dummy",
        img: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Ovcharov_Karp.JPG",
        date: new Date(2017, 3, 15),
        text: 'five days no food or water',
        comments: []
    }).save( (err, document) => {
        new Comment({
            author: "bnt1test",
            date: new Date(2017, 4, 17),
            text: "hold on i'll send you some. what address?"
            }).save( (err, comment0) => {
                document.comments.push(comment0)
                new Comment({
                    author: "Timmy",
                    date: new Date(2017, 4, 18),
                    text: "lol sux"
                }).save( (err, comment1) => {
                    document.comments.push(comment1)
                    Article.findByIdAndUpdate(document._id, { comments: document.comments }, { new: true}, (err, newDocument) => {})
                })
            })
    })
    new Article({ 
        author: "bnt1test",
        img: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Jan_Baptist_van_der_Hulst_-_Koning_Willem_II_en_familie.jpg",
        date: new Date(2016, 3, 1),
        text: 'Hey',
        comments: []
    }).save()
    new Article({ 
        author: "Jimmy",
        img: "https://upload.wikimedia.org/wikipedia/commons/4/47/Rudge_Multi_1914.jpg",
        date: new Date(2017, 2, 5),
        text: 'Trapped in garage',
        comments: []
    }).save( (err, document) => {
        new Comment({
                author: "Timmy",
                date: new Date(2017, 2, 20),
                text: "good"
            }).save( (err, comment) => {
                document.comments.push(comment)
                Article.findByIdAndUpdate(document._id, { comments: document.comments }, {new: true}, (err, newDocument) => {})
            })
    })
    new Article({ 
        author: "Kimmy",
        img: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Vowel_chart_of_the_Canadian_Old_Colony_vowels.svg",
        date: new Date(2017, 3, 19),
        text: 'Someone put glue on my pillow and now im stuck pls help',
        comments: []
    }).save()
}

// resetDefaultArticles()

// Function that finds an article based on id.
const findById = (id, callback) => {
    console.log('Find article by id: ', id)
    Article.findById(id, (err, doc) => {  
        if (err){
            throw new Error(err)
        }
        callback(doc)
    })
}

// Function that queries articles based on either author or id.
const findByIdsOrUsernames = (queries, callback) => {
    console.log('Find article by author/Id: ', queries)
    const articles = []
    // Try to find by author.
    Article.find({ author: {$in: queries} }).exec((err, itemsByAuthor) => {
        if (err){
            throw new Error(err)
        }
        articles.push(...itemsByAuthor)
        // Try to find by _id.
        Article.find({ _id: {$in: queries.filter((query) => { return ObjectId.isValid(query)})} }).exec((err, itemsById) => {
            if (err){
                throw new Error(err)
            }
            articles.push(...itemsById)
            callback(articles)
        })
	})
}

// Function that updates an article based on id.
const updateById = (id, newText, callback) => {
    console.log('Update article by id: ', id)
    Article.findByIdAndUpdate(id, { text: newText }, { new: true }, (err, doc) => {  
        if (err){
            throw new Error(err)
        }
        callback(doc)
    })
}

// Function that updates an article's comment based on id.
const updateCommentById = (id, commentId, newText, res, callback) => {
    console.log('Update comment by id: ', id, commentId)
    Article.findById(id, (err, document) => {
        if (err){
            throw new Error(err)
        }
        Comment.findById(commentId, (err, comment) => {
            if (err){
                throw new Error(err)
            }
            if (comment){
                if (document.comments.some( (comment) => { return comment._id == commentId })){
                    Comment.findByIdAndUpdate(commentId, { text: newText }, { new: true }, (err, newComment) => {
                        if (err){
                            throw new Error(err)
                        }
                        const newComments = document.comments.map( (comment) => { return (comment._id == newComment._id ? newComment : comment) })
                        Article.findByIdAndUpdate(id, { comments: newComment }, { new: true }, (err, newDocument) => {
                            callback(newDocument)
                        })
                    })
                } else {
                    res.status(404).send("Comment not found in Article!")
                }
            } else {
                res.status(404).send("Comment not found!")
            }
        })
    })
}

// Function that adds a comment to an article based on id.
const addCommentById = (id, author, newText, res, callback) => {
    console.log('Add comment by id: ', id)
    findById(id, (article) => {
        if (article){
            new Comment({
                author: author,
                date: new Date(),
                text: newText
            }).save( (err, newComment) => {
                if (err){
                    throw new Error(err)
                }
                article.comments.push(newComment)
                Article.findByIdAndUpdate(id, { comments: article.comments }, { new: true }, (err, newArticle) => {
                    callback(newArticle)
                })
            })
        } else{
            res.status(404).send("Article not found!")
        }
    })
}

const getArticles = (req, res) => {
    console.log('Payload received:', req.body)
    console.log('Parameters received:', req.params)
    if (!req.params.id){
        // No id specified. Send all articles in database.
        Article.find({}, (err, articles) => {
            res.send({ articles: articles })
        })
    } else {
        const ids = req.params.id.split(',')
        // Populate article list with articles that match on ids or author.
        findByIdsOrUsernames(ids, (articles) => {
            res.send({ articles: articles })
        })
    }
}

const updateArticles = (req, res) => {
    console.log('Payload received:', req.body)
    console.log('Parameters received:', req.params)

    if (req.body.hasOwnProperty("commentId")){
        // Update or post comment.
        if (req.body.commentId != -1) {
            Comment.findById(req.body.commentId, (err, comment) => {
                if (comment && comment.author == req.user){
                    updateCommentById(req.params.id, req.body.commentId, req.body.text, res, (newArticle) => {
                        if (newArticle){
                            res.send({ articles: [newArticle] })
                        } else {
                            res.status(404).send("Article or Comment not found!")
                        }
                    })
                } else{
                    res.status(401).send("Unauthorized!")
                }
            })
        } else {
            addCommentById(req.params.id, req.user, req.body.text, res, (newArticle) => {
                if (newArticle){
                    res.send({ articles: [newArticle] })
                } else {
                    res.status(404).send("Article not found!")
                }
            })
        }
    } else {
        // Update article.
        findById(req.params.id, (document) => {
            if (document.author == req.user){
                updateById(req.params.id, req.body.text, (newArticle) => {
                    if (newArticle){
                        res.send({ articles: [newArticle] })
                    } else{
                        res.status(404).send("Article not found!")
                    }
                })
            } else{
                res.status(401).send("Unauthorized!")
            }
        })
    }
}

const postArticle = (req, res) => {
    console.log('Payload received:', req.body)
    console.log('Parameters received:', req.params)
    new Article({
        author: req.user,
        date: new Date(),
        text: req.body.text,
        comments: []
    }).save( (err, newArticle) => {
        findById(newArticle._id, (articles) => {
            res.send({ articles: articles})
        })
    })
}

module.exports = (app) => {
    app.get('/articles/:id*?', isLoggedIn, getArticles)
    app.put('/articles/:id', isLoggedIn, updateArticles)
    app.post('/article', isLoggedIn, postArticle)
}