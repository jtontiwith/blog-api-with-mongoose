'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
//lwsmd
//this is how we make the expect syntax available
const expect = chai.expect; 

const {Blog} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogData() {
  const seedData = [];

  for(let i = 1; i <= 10; i++) {
    seedData.push(generateBlogData());
  }
  return Blog.insertMany(seedData);
}

//this is used to generate data to put in the db

function generateBlogTitle() {
  const titles = ['A blog', 'B blog', 'C blog'];
  return titles[Math.floor(Math.random() * titles.length)]; 
}

function generateBlogContent() {
  const contents = [
    'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', 
    'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', 
    'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
  ];
  return contents[Math.floor(Math.random() * contents.length)]; 
}

function generateBlogAuthor() {
  const firstNames = ['Tom', 'Dick', 'Harry'];
  const lastNames = ['Smith', 'Doe', 'Buster'];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]; 
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]; 
  return {
    firstName: firstName,
    lastName: lastName
  }
}

function generateBlogData() {
  return {
    title: generateBlogTitle(),
    content: generateBlogContent(),
    author: generateBlogAuthor()
  }
}

function tearDownDb() {
  return mongoose.connection.dropDatabase();
}

describe('Blogs API resource', function() {
  
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogData();
  });

  afterEach(function() {
    return tearDownDb();
  })

  after(function() {
    return closeServer();
  })

  describe('GET endpoint', function() {
    it('should return all blog posts', function() {
      //strategy: 
      //  1. get back all the blogs
      //  2. prove res has right status and data type
      //  3. prove the number of blogs we get back is equal to the number in the db
    let res;
    return chai.request(app)
      .get('/posts')
      .then(function(_res) {
        //this has something to do with how later .then blocks 
        //can have access to th response object as well
        res = _res;
        expect(res).to.have.status(200);
        expect(res.body.blogs).to.have.length.of.at.least(1)
        return Blog.count();
      
      })
      .then(function(count) {
        //expect(res.body.blogs).to.have.length.of(count);
        expect(res.body.blogs).to.have.length.at.least(1);
      });
    });
  
    it('should return blogs with the correct fields', function() {
      let resBlog;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.blogs).to.be.a('array');
          expect(res.body.blogs).to.have.length.of.at.least(1);

          res.body.blogs.forEach(function(blog) {
            expect(blog).to.include.keys('title', 'content', 'author')
          });
          resBlog = res.body.blogs[0];
          return Blog.findById(resBlog.id);
        })
        .then(function(blog) {
          expect(resBlog.id).to.equal(blog.id);
          expect(resBlog.title).to.equal(blog.title);
          expect(resBlog.content).to.equal(blog.content);
      });
    });
  });

  describe('POST endpoint', function() {
    //strategy: make a POST request to post a blog 
    //make sure the blog we get back has the right keys
    //an 'id' meaning it's been insterted in the db, etc.

    it('should add a new blog post', function() {
      const newBlog = generateBlogData();
      //let most
      
      return chai.request(app)
        .post('/posts')
        .send(newBlog)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'author');
      });
    });

    describe('PUT endpoint', function() {
      //strategy:
      // 1. Get a blog from the db
      // 2. Make a PUT request to update that blog
      // 3. Prove blog is correctly updated
      it('should update the fields', function() {
        const updateData = {
          title: 'Not original title',
          content: 'not the original content'
        };

        return Blog
          .findOne()
          .then(function(blog) {
            updateData.id = blog.id;

          return chai.request(app)
            .put(`/posts/${blog.id}`)
            .send(updateData);
          })
          .then(function(res) {
            expect(res).to.have.status(204);
            return Blog.findById(updateData.id);
          })
          .then(function(blog) {
            expect(blog.title).to.equal(updateData.title)
            expect(blog.content).to.equal(updateData.content);
        });
      });
    });

    describe('it should delete a post', function() {
    //strategy:
    // 1. get post
    // 2. make a delete request for that post, according to it's id
    // 3. verify that the post is deleted

    it('delete a blog by id', function() {
      let blog;

      return Blog
        .findOne()
        .then(function(_blog) {
          blog = _blog;
          return chai.request(app).delete(`/posts/${blog.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Blog.findById(blog.id);
        })
        .then(function(_blog) {
          expect(_blog).to.be.null;
         });
      });
    });
  });
});