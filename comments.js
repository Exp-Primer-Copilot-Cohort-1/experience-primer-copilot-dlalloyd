// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

// Create app
const app = express();

// Use middlewares
app.use(bodyParser.json());
app.use(cors());

// Create comments object
const commentsByPostId = {};

// Create event handlers
const handleEvent = (type, data) => {
  if (type === 'CommentCreated') {
    const { id, content, postId, status } = data;
    commentsByPostId[postId] = [
      ...(commentsByPostId[postId] || []),
      { id, content, status },
    ];
  }

  if (type === 'CommentUpdated') {
    const { id, content, postId, status } = data;
    const comment = commentsByPostId[postId].find(
      (comment) => comment.id === id
    );
    comment.status = status;
    comment.content = content;
  }
};

// Create routes
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

// Create route for event bus
app.post('/events', (req, res) => {
  const { type, data } = req.body;

  // Call event handler
  handleEvent(type, data);

  res.send({});
});

// Listen port
app.listen(4001, async () => {
  console.log('Listening on 4001');

  // Get events from event bus
  const res = await axios.get('http://event-bus-srv:4005/events');

  // Call event handlers
  for (let event of res.data) {
    console.log('Processing event:', event.type);
    handleEvent(event.type, event.data);
  }
});