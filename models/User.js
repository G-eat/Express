const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create post model
const UserSchema = new Schema({
  email : {
    type : String,
    required : true
  },
  username : {
    type : String,
    required : true
  },
  password : {
    type : String,
    required : true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = User = mongoose.model('user',UserSchema);
