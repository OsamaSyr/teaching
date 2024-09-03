const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const { addUser, updateUser, deleteUserDevice, getUserDevices, getUserWithPlaylists, assignPlaylistToUser, removePlaylistFromUser, getUser, deleteUser, getAllUsers, getPlaylist, updatePlaylist, addPlaylist, deletePlaylist, removePlaylist, getAllPlaylists, addVideoToPlaylist, removeVideoFromPlaylist, rearrangeVideosInPlaylist } = require('../controllers/adminController');

const router = express.Router();

router.post('/user', protect, admin, addUser);
router.delete('/user/:id', protect, admin, deleteUser);
router.get('/users', protect, admin, getAllUsers);
router.put('/user/:id', protect, admin, updateUser);
router.get('/user/:id', protect, admin, getUser);
router.get('/user/:id/playlists', protect, admin, getUserWithPlaylists);
router.post('/user/assign-playlist', protect, admin, assignPlaylistToUser);
router.post('/user/remove-playlist', protect, admin, removePlaylistFromUser);
router.get('/user/:id/devices', protect, admin, getUserDevices);
router.delete('/user/:id/devices/:device', protect, admin, deleteUserDevice);

router.post('/playlist', protect, admin, addPlaylist);
router.post('/playlist/remove', protect, admin, removePlaylist);
router.delete('/playlist/:id', protect, admin, deletePlaylist);

router.post('/playlist/video', protect, admin, addVideoToPlaylist);
router.post('/playlist/video/remove', protect, admin, removeVideoFromPlaylist);
router.post('/playlist/video/rearrange', protect, admin, rearrangeVideosInPlaylist);
router.get('/playlists', protect, admin, getAllPlaylists);
router.get('/playlist/:id', protect, admin, getPlaylist);
router.put('/playlist/:id', protect, admin, updatePlaylist);


module.exports = router;
