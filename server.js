'use strict';

//this just imports the libraries we are gonna need
const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

//this makes mongoose use ES6 Promises
mongoose.Promise = global.Promise;

//config.js is where constants for the app are controlled
//like PORT and DATABASE_URL

const { PORT, DATABASE_URL } = require('./config');
const { Blog } = require('./models');

const app = express();
app.use(bodyParser.json());

//get blogs
app.get('/posts', (req, res) => {
  Blog
    .find() //in mongoose this returns a promise, that's why you have .then
    .then(blogs => {
      res.json({
        blogs: blogs.map(
        (blog) => blog.serialize())
      });
    }) //there is no semicolon here because you are attaching .catch
  .catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal Server Error'});
  });  
});

app.get('/posts/:id', (req, res) => {
  Blog
    .findById(req.params.id) //remember that mongoose always returns a promise, hence the .then()
    .then(blog => res.json(blog.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }); 
  });

  app.post('/posts', (req, res) => {
    const requiredFields = ['title', 'content', 'author']
    let filter = {};
    for(let i = 0; requiredFields < i; i++) {
      const field = requiredFields[i];
      if(!(field in req.body)) {
        const message = `Missing required field ${field}`;
        console.error(message);
        return res.status(400).send(message);
      }
    }
    
    Blog
      .create({
        title: req.body.title,
        content: req.body.content,
        author: req.body.author
      })
      .then(blog => res.status(201).json(blog.serialize()))
      .catch(err => {
        console.error(err);
        res.status(501).json({ message: 'Internal server error' });
      });
  });

app.put('/posts/:id', (req, res) => {
  if(!(req.params.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id ` + `(${req.body.id})
      must match`);
      console.error(message);
      return res.status(400).json({ message: message });
  }

  app.delete('/posts/:id', (req, res) => {
    Blog
    .findById(req.params.id)  
    //.findByIdAndRemove(req.params.id)
      .then(() => {
        res.status(204).json({ message: 'success' });
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'something went terribly wrong' });
      });
  }); 


  //we only support a subset of fields being updateable.
  // if the user sent over any of the updatableFields, we udpate those values
  // in document
  const toUpdate = {};
  const updateableFields = ['title', 'content', 'author'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Blog
    // all key/value pairs in toUpdate will be updated -- that's what `$set` does
    .findByIdAndUpdate(req.params.id, { $set: toUpdate })
    .then(blog => res.status(204).end())
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

let server;


function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => { //<-this is for testing, to make sure the server is running  
    mongoose.connect(databaseUrl, err => { //err is iherent to mongoose
      if(err) {
        return reject(err);
      }
      server = app.listen(port, () => { //everything connects through ports
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) { //this should only be run in a node.js env on the server side
  runServer(DATABASE_URL).catch(err => console.error(err));
}

//

module.exports = { app, runServer, closeServer }; //this makes this functionality a
//available in other files like test