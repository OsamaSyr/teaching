const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videos: [{ 
    title: String, 
    url: String 
  }]
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
