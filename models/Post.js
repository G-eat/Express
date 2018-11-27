const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create post model
const PostSchema = new Schema({
  title : {
    type : String,
    required : true
  },
  body : {
    type : String,
    required : true
  },
  photo : {
    type : String,
    required : true
  },
  user_name : {
    type : String,
    required : true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = Post = mongoose.model('post',PostSchema);
