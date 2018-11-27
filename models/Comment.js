const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    comment:{
      type : String,
      required : true
    },
    postID:{
      type: String,
      required: true
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

module.exports = Comment = mongoose.model('comment',CommentSchema);
