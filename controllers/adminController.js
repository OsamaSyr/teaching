const User = require("../models/User");
const Playlist = require("../models/Playlist");

exports.addUser = async (req, res) => {
  const { userId, password, role, maxComputers } = req.body;

  try {
    const newUser = new User({ userId, password, role, maxComputers });
    await newUser.save();
    res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params; // This should be the MongoDB ObjectId
  const { password, role, maxComputers } = req.body;

  try {
    const user = await User.findById(id); // Look up by MongoDB ObjectId
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only the fields that are allowed to change
    user.role = role || user.role;
    user.maxComputers = maxComputers || user.maxComputers;

    if (password) {
      user.password = password; // Ensure this is hashed before saving
    }

    await user.save();
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("Error updating user:", err); // Log the error
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserDevices = async (req, res) => {
  const { id } = req.params; // Assuming `id` is the user ID

  try {
    const user = await User.findById(id).select("devices");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ success: true, devices: user.devices });
  } catch (err) {
    console.error("Error fetching user devices:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUserDevice = async (req, res) => {
  const { id, device } = req.params;
  const decodedDevice = decodeURIComponent(device);

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.devices = user.devices.filter((d) => d.fingerprint !== decodedDevice);

    await user.save();

    res.status(200).json({ success: true, devices: user.devices });
  } catch (err) {
    console.error("Error deleting user device:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignPlaylistToUser = async (req, res) => {
  const { userId, playlistId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if playlist is already assigned
    if (!user.playlists.includes(playlistId)) {
      user.playlists.push(playlistId);
      await user.save();
    }

    res.status(200).json({ success: true, playlists: user.playlists });
  } catch (err) {
    console.error("Error assigning playlist:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.removePlaylistFromUser = async (req, res) => {
  const { userId, playlistId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.playlists = user.playlists.filter(
      (id) => id.toString() !== playlistId
    );
    await user.save();

    res.status(200).json({ success: true, playlists: user.playlists });
  } catch (err) {
    console.error("Error removing playlist:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserWithPlaylists = async (req, res) => {
  const { id } = req.params; // Assuming this is the MongoDB ObjectId

  try {
    const user = await User.findById(id).populate("playlists"); // Populate the playlists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("Error fetching user playlists:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await User.findByIdAndDelete(id);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find();
    res.status(200).json({ success: true, playlists });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.addPlaylist = async (req, res) => {
  const { title, videos } = req.body;

  try {
    // Input validation
    if (!title || !Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({
        message:
          "Title and videos are required, and videos must be a non-empty array",
      });
    }

    // Create new playlist
    const newPlaylist = new Playlist({ title, videos });
    await newPlaylist.save();

    // Respond with success
    res.status(201).json({ success: true, playlist: newPlaylist });
  } catch (err) {
    // Log the error to the console for debugging
    console.error("Error creating playlist:", err);

    // Respond with a server error and the error message
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updatePlaylist = async (req, res) => {
  const { id } = req.params;
  const { title, videos } = req.body;

  try {
    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Update playlist fields
    playlist.title = title || playlist.title;
    playlist.videos = videos || playlist.videos;

    await playlist.save();
    res.status(200).json({ success: true, playlist });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignPlaylist = async (req, res) => {
  const { userId, playlistId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.playlists.push(playlistId);
    await user.save();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.removePlaylist = async (req, res) => {
  const { userId, playlistId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.playlists = user.playlists.filter(
      (id) => id.toString() !== playlistId
    );
    await user.save();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPlaylist = async (req, res) => {
  const { id } = req.params;
  try {
    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }
    res.status(200).json({ success: true, playlist });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deletePlaylist = async (req, res) => {
  const { id } = req.params;

  try {
    const playlist = await Playlist.findByIdAndDelete(id);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    res.status(200).json({ success: true, message: "Playlist deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.addVideoToPlaylist = async (req, res) => {
  const { playlistId, video } = req.body; // video contains title and URL

  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    playlist.videos.push(video);
    await playlist.save();
    res.status(200).json({ success: true, playlist });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.removeVideoFromPlaylist = async (req, res) => {
  const { playlistId, videoIndex } = req.body;

  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (videoIndex < 0 || videoIndex >= playlist.videos.length) {
      return res.status(400).json({ message: "Invalid video index" });
    }

    playlist.videos.splice(videoIndex, 1);
    await playlist.save();
    res.status(200).json({ success: true, playlist });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.rearrangeVideosInPlaylist = async (req, res) => {
  const { playlistId, fromIndex, toIndex } = req.body;

  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (
      fromIndex < 0 ||
      fromIndex >= playlist.videos.length ||
      toIndex < 0 ||
      toIndex >= playlist.videos.length
    ) {
      return res.status(400).json({ message: "Invalid video index" });
    }

    const [video] = playlist.videos.splice(fromIndex, 1);
    playlist.videos.splice(toIndex, 0, video);

    await playlist.save();
    res.status(200).json({ success: true, playlist });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
