const Playlist = require("../models/Playlist");
const User = require("../models/User");

// Controller to get playlist by ID
exports.getPlaylistById = async (req, res) => {
  const { playlistId } = req.params;
  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: "لم يتم العثور على القائمة" });
    }
    res.status(200).json({ playlist });
  } catch (error) {
    console.error("خطأ في الخادم", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to get video info by video ID within a playlist
exports.getVideoInfo = async (req, res) => {
  const { playlistId, videoId } = req.params;
  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    const video = playlist.videos.find((v) => v._id.toString() === videoId);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    res.status(200).json({ video });
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Additional controller to get all playlists for a student
exports.getPlaylists = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Fetch the student with their playlists populated
    const student = await User.findById(studentId).populate("playlists");

    if (!student || student.playlists.length === 0) {
      return res.status(404).json({ message: "لايوجد قوائم لهذا المستخدم" });
    }

    res.status(200).json({ playlists: student.playlists });
  } catch (error) {
    console.error("خطأ في جلب القوائم:", error);
    res.status(500).json({ message: "Failed to fetch playlists" });
  }
};
