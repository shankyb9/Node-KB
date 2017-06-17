const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const cookieSession = require('cookie-session'); // as with express-session, memory leak warning was coming
// search about cookie-session usage if problem is to be removed

const config = require('./config/database');
const passport = require('passport');

mongoose.Promise = global.Promise

// mongoose.connect('mongodb://localhost/nodekb');
mongoose.connect(config.database);
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

// Passport config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// for global user variable
app.get('*', function(req, res, next){
  res.locals.user = req.user || null;
  next();
});

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

// Route Files
let articles = require ('./routes/articles');
app.use('/articles',articles);
let users = require ('./routes/users');
app.use('/users',users);

app.listen('3000',function(){
  console.log('Listening to port 3000');
});
