const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const expressSession = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');

//multer- photo
const storage = multer.diskStorage({
  destination: './public/post_photo/',
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
})

var upload = multer({ storage: storage }).single('post_photo');

//models
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const User = require('./models/User');

// express
const app = express();

//view engine
app.set('view engine','ejs');
app.set('views',path.join(__dirname , 'views'));

// Public Folder
app.use(express.static('./public'));

//middlewere
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressSession({secret:'loggin',resave: false,saveUninitialized: false}));

//connct to database
const db = 'mongodb://<dbuser>:<dbpassword>@ds249623.mlab.com:49623/express';

mongoose.connect(db,{ useNewUrlParser: true })
        .then(()=>console.log('Database connected'))
        .catch(err => console.log(err));

//ROUTE

//register page
app.get('/',(req,res)=>{
  if (req.session.success) {
    res.redirect('/posts');
  }else{
    res.render('register',{
      title:'Register',
      success: req.session.success,
      message : req.session.message,
      alert : req.session.alert,
      page_name: 'register'
    });
    req.session.success = null;
    req.session.message = null;
    req.session.alert = null;
  }
});

//submit register
app.post('/register',(req,res)=>{
  if (!(req.body.password === req.body.confirmpassword) || req.body.password.length < 8 || (req.body.username.length < 4 || req.body.username.length > 40)) {
    if (!(req.body.password === req.body.confirmpassword)) {
      req.session.message = 'Not same password.';
    }
    if (req.body.password.length < 8){
      req.session.message = 'Password need to have at least 8 characters.';
    }
    if (req.body.username.length < 4 || req.body.username.length > 20){
      req.session.message = 'Username need to have 4-20 characters.';
    }

    req.session.alert = false;
    res.redirect('/');
  }else{
    User.findOne({username:req.body.username})
        .then((user)=>{
          if (user == null){
            const password = bcrypt.hashSync(req.body.password, 10);
            const newUser = new User({
              email : req.body.email,
              username : req.body.username,
              password : password
            });

            newUser.save().then(()=>console.log('You register successfully.'));
            req.session.message = 'You register successfully.Now you can login.';
            req.session.alert = true;
            res.redirect('/');
          }else{
            req.session.message = 'This user is not avalaible.';
            req.session.alert = false;
            res.redirect('/');
          }
        });
  }
});

//loggin
app.post('/loggin',(req,res)=>{
  User.findOne({username: req.body.userName})
      .then((user)=> {
        if (bcrypt.compareSync(req.body.passWord, user.password)) {
          req.session.message = 'You logged in.';
          req.session.user_name = req.body.userName;
          req.session.alert = true;
          req.session.success = true;
          res.redirect('/posts');
        } else{
          req.session.message = 'Your username and password don\'t match.';
          req.session.success = false;
          req.session.alert = false;
          res.redirect('/');
        }
      }
      );
});

//logout
app.get('/logout',(req,res)=>{
  req.session.success = false;
  req.session.message = 'You logged out.';
  req.session.alert = false;
  res.redirect('/');
});

//create post
app.get('/createPost',(req,res)=>{
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  res.render('index',{
    page_name: 'index',
    success: req.session.success
  });
});

//create post
app.post('/',(req,res)=>{
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  upload(req,res,(err)=>{
    if (err) {
      console.log(err);
    } else {
      const newPost = new Post({
        title : req.body.title,
        body : req.body.body,
        user_name : req.session.user_name,
        photo : `post_photo/${req.file.filename}`
      });

      newPost.save().then(()=>console.log('done'));
    }
  });

  res.redirect('/posts');
});

// all posts
app.get('/posts',(req,res)=>{
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  Post.find()
      .sort({created_at: -1})
      .then((post)=>{
        res.render('posts',{
         title:'All Posts',
         success: req.session.success,
         posts : post,
         page_name: 'posts'
        });
      });
});

//individualPost
app.get('/post/:id',(req,res)=>{
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  const postId = req.params.id;
  Post.findById({_id:req.params.id})
      .then((post)=>{
        Comment.find({postID:postId})
               .sort({created_at: -1})
               .limit(10)
               .then((comment)=>{
                  res.render('individualPost',{
                  post : post,
                  success: req.session.success,
                  comments : comment,
                  page_name: 'individualPost'
                  })
               });
      });
});

//delete posts
app.get('/delete/:id',(req,res)=>{
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  Post.findById(req.params.id)
      .then((post)=>post.remove().then(()=> res.redirect('/posts')))
      .catch(err => console.log(err));

  Comment.find({postID:req.params.id})
          .then((comments) => comments.forEach(comment=>{ comment.remove().then(()=>console.log('all comments removed'))}))
          .catch(err => console.log(err));
});

//delete comments
app.get('/deletecommment/:id/:post_id',(req,res)=>{
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  Comment.findById(req.params.id)
          .then((comment)=>comment.remove().then(() => res.redirect(`/post/${req.params.post_id}`)))
          .catch(err => console.log(err));
});

//Comments
app.post('/comments',(req,res)=>{
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  if (req.body.comment.length <= 100 && req.body.comment.length >= 1) {
    const postId = req.body.postID;
    const newComment = new Comment({
      comment : req.body.comment,
      user_name : req.session.user_name,
      postID :req.body.postID
    });

    newComment.save().then(()=>{console.log('New comment')});

  }
  const postId = req.body.postID;
  res.redirect(`/post/${postId}`);
});


//port started
let port = 3000;
app.listen(port,()=>{
  console.log('App started at port '+port+' ...')
});
