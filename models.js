'use strict';

const mongoose = require('mongoose');

//here is the schema to represent a restaurant
const blogSchema = mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String, required: true},
  author: {
      firstName: String,
      lastName: String
  }

});

blogSchema.virtual('authorString').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`;
});


blogSchema.methods.serialize = function() {
  return {
    id: this.id,
    title: this.title,
    content: this.content,
    author: this.authorString
  }

}

const Blog = mongoose.model('Blog', blogSchema);

module.exports = {Blog};