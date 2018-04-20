'use strict';
exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost/tempBlogDb';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost/test-tempBlogDb';
exports.PORT = process.env.PORT || 8080;

//not sure about the "test" part on 'mongodb://localhost/test-tempBlogDb';

