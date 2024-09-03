const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getPlaylists, getPlaylistById, getVideoInfo } = require('../controllers/studentController');

const router = express.Router();

// Route to get all playlists assigned to the logged-in student
router.get('/playlists', protect, getPlaylists); // Matches with `getStudentPlaylists` in studentController

// Route to get a specific playlist by its ID
router.get('/playlists/:playlistId', protect, getPlaylistById); // Matches with `getPlaylistById` in studentController

// Route to get specific video info from a playlist
router.get('/playlists/:playlistId/videos/:videoId', protect, getVideoInfo); // Matches with `getVideoInfo` in studentController

module.exports = router;
