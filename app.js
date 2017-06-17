const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');

mongoose.Promise = global.Promise

mongoose.connect('mongodb://localhost/nodekb');
let db = mongoose.connection;

//Check connection
db.once('open',function(){
  console.log('Connected to MongoDB');
});

// Check for db errors
db.on('error',function(err){
  console.log(err);
});

// Init app
const app = express();

// bring in models
let Article = require('./models/article');

// Load View Engine
app.set('views',path.join(__dirname,'views'));
app.set('view engine','pug');

// Body Parser Middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
 // parse application/json
app.use(bodyParser.json());

// Set Public Folder
app.use(express.static(path.join(__dirname,'public')));

//Express SessonMiddleWare
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  //cookie: { secure: true }
}));

//Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//Express Validator Middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Home Route
app.get('/',(req,res) => {

  Article.find({},function(err, articles){
    if(err)
      console.log(err);
    else{
      res.render('index',{
        title:'Articles',
        articles: articles
      });
    }
  });

});

// Get Single Article
app.get('/article/:id',function(req, res){
  Article.findById(req.params.id, function(err, article){
    // console.log(article);
    // return;
    res.render('article',{
      article: article
    });
  });
});

app.get('/articles/add',(req,res)=>{
  res.render('add_article',{
    title:'Add Article'
  });
});

// Add Submit POST Route
app.post('/articles/add',(req,res)=>{

req.checkBody('title','Title is required').notEmpty();
req.checkBody('author','Author is required').notEmpty();
req.checkBody('body','Body is required').notEmpty();

// Get errors
let errors = req.validationErrors();

if(errors){
  res.render('add_article',{
    title: 'Add Article',
    errors: errors
  });
}else {
  let article = new Article();
  article.title = req.body.title;
  article.author = req.body.author;
  article.body = req.body.body;

  article.save(function(err){
    if(err){
      console.log(err);
      return
    }
    else{
      //console.log('Article saved');
      req.flash('success','Article Added');
      res.redirect('/');
    }
  });

}

});

// Load Edit form
app.get('/articles/edit/:id',function(req, res){
  Article.findById(req.params.id, function(err, article){
    res.render('edit_article',{
      title: 'Edit Article',
      article: article
    });
  });
});

// Update Submit POST Route
app.post('/articles/edit/:id',(req,res)=>{
  let article = {};
  article.title = req.body.title;
  article.author = req.body.author;
  article.body = req.body.body;

  let query = {_id:req.params.id}

  Article.update(query, article, function(err){
    if(err){
      console.log(err);
      return
    }
    else{
      req.flash('success','Article Updated');
      res.redirect('/');
    }
  });
});

// Delete Article
app.delete('/article/:id',function(req,res){
  let query = {_id:req.params.id};

  Article.remove(query, function(err){
    if(err) console.log(err);

    res.send('Success');

  });
});


app.listen('3000',function(){
  console.log('Listening to port 3000');
});
