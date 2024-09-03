function getDeviceFingerprint() {
  let fingerprint = getCookie("deviceFingerprint");
  if (!fingerprint) {
    fingerprint = generateUUID();
    setCookie("deviceFingerprint", fingerprint, 180);
  }

  const deviceSpecs = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    colorDepth: window.screen.colorDepth,
    language: navigator.language,
  };

  return { fingerprint, deviceSpecs };
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  let nameEQ = name + "=";
  let ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

$("#loginForm").on("submit", function (e) {
  e.preventDefault();

  const userId = $("#userId").val();
  const password = $("#password").val();
  const { fingerprint, deviceSpecs } = getDeviceFingerprint();

  $.ajax({
    url: "/api/auth/login",
    method: "POST",
    data: JSON.stringify({
      userId,
      password,
      deviceFingerprint: fingerprint,
      deviceSpecs,
    }),
    contentType: "application/json",
    success: function (response) {
      window.location.href = response.redirectTo;
    },
    error: function (err) {
      alert("Login failed: " + (err.responseJSON.message || "Unknown error"));
    },
  });
});

// Load student playlists
if (window.location.pathname === "/student.html") {
  function loadPlaylists() {
    $.ajax({
      url: "/api/student/playlists",
      method: "GET",
      success: function (response) {
        const playlists = response.playlists;
        let content = "";
        playlists.forEach((playlist) => {
          content += `
                    <div class="col-md-4">
                        <div class="card mb-4">
                            <div class="card-body">
                                <h5 class="card-title">${playlist.title}</h5>
                                <button class="btn btn-primary view-playlist-btn" data-id="${playlist._id}">الدخول الى المادة</button>
                            </div>
                        </div>
                    </div>`;
        });
        $("#playlistContainer").html(content);
      },
      error: function () {
        alert("Failed to load playlists");
      },
    });
  }

  loadPlaylists();

  $(document).on("click", ".view-playlist-btn", function () {
    const playlistId = $(this).data("id");
    window.location.href = `playlist.html?playlistId=${playlistId}`;
  });

  // Logout functionality
  $("#logoutBtn").on("click", function () {
    $.ajax({
      url: "/api/auth/logout",
      method: "POST",
      xhrFields: {
        withCredentials: true,
      },
      success: function () {
        window.location.href = "index.html";
      },
      error: function (xhr, status, error) {
        console.error("Logout failed:", error);
        alert("Failed to logout. Please try again.");
      },
    });
  });
}

// Function to handle session expiration
function handleSessionExpiration(error) {
  if (error.status === 401) {
    alert("انتهت صلاحية الجلسة، قم بتسجيل الدخول مرة أخرى");
    window.location.href = "index.html";
  }
}

// Update all AJAX calls to include error handling for session expiration
$(document).ajaxError(function (event, jqXHR, ajaxSettings, thrownError) {
  handleSessionExpiration(jqXHR);
});

// Load the playlist and videos on playlist.html
if (window.location.pathname === "/playlist.html") {
  const urlParams = new URLSearchParams(window.location.search);
  const playlistId = urlParams.get("playlistId");

  function loadPlaylist() {
    $.ajax({
      url: `/api/student/playlists/${playlistId}`,
      method: "GET",
      success: function (response) {
        const playlist = response.playlist;
        $("#playlistTitle").text(playlist.title);
        const videoList = $("#videoList");
        videoList.empty();

        playlist.videos.forEach((video, index) => {
          videoList.append(`
                        <li class="list-group-item video-item" data-video-id="${video._id}">
                            ${video.title}
                        </li>
                    `);
        });

        // Load the first video by default
        if (playlist.videos.length > 0) {
          loadVideo(playlistId, playlist.videos[0]._id); // Load the first video
        }
      },
      error: function () {
        alert("Failed to load playlist details");
      },
    });
  }

  // Function to load a video into the player
  function loadVideo(playlistId, videoId) {
    $.ajax({
      url: `/api/student/playlists/${playlistId}/videos/${videoId}`,
      method: "GET",
      success: function (response) {
        const videoUrl = response.video.url;

        // Ensure the URL is an absolute URL
        const absoluteVideoUrl = videoUrl.startsWith("http")
          ? videoUrl
          : `https://player.vimeo.com/video/${videoUrl}`;

        const videoPlayerContainer = $("#videoPlayerContainer");
        videoPlayerContainer.empty();

        // Embed the video using the valid URL
        const vimeoPlayer = `<iframe src="${absoluteVideoUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        videoPlayerContainer.html(vimeoPlayer);
      },
      error: function () {
        alert("Failed to load video details");
      },
    });
  }

  $(document).on("click", ".video-item", function () {
    const videoId = $(this).data("video-id"); // Extract the video ID correctly
    loadVideo(playlistId, videoId); // Load the video using the correct API
  });

  $("#backBtn").on("click", function () {
    window.location.href = "student.html";
  });

  loadPlaylist(); // Load the playlist when the page is ready
}

// Load users and playlists for admin
if (window.location.pathname === "/admin.html") {
  // Load users
  function loadUsers() {
    $.ajax({
      url: "/api/admin/users",
      method: "GET",
      success: function (response) {
        const users = response.users;
        let content = "";
        users.forEach((user) => {
          content += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${user.userId} (${user.role})
                    <div>
                        <button class="btn btn-sm btn-info view-devices-btn" data-id="${user._id}">View Devices</button>
                        <button class="btn btn-sm btn-warning edit-user-btn" data-id="${user._id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user._id}">Delete</button>
                        <button class="btn btn-sm btn-primary assign-playlist-btn" data-id="${user._id}">Assign Playlists</button>
                    </div>
                </li>`;
        });
        $("#userList").html(content);
      },
      error: function () {
        alert("Failed to load users");
      },
    });
  }

  // Load playlists
  function loadPlaylists() {
    $.ajax({
      url: "/api/admin/playlists",
      method: "GET",
      success: function (response) {
        const playlists = response.playlists;
        let content = "";
        playlists.forEach((playlist) => {
          content += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${playlist.title}
                        <div>
                            <button class="btn btn-sm btn-warning edit-playlist-btn" data-id="${playlist._id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-playlist-btn" data-id="${playlist._id}">Delete</button>
                        </div>
                    </li>`;
        });
        $("#playlistList").html(content);
      },
      error: function () {
        alert("Failed to load playlists");
      },
    });
  }

  function loadUserDevices(userId) {
    $.ajax({
      url: `/api/admin/user/${userId}/devices`,
      method: "GET",
      success: function (response) {
        const devicesList = $("#devicesList");
        devicesList.empty();

        response.devices.forEach((device) => {
          const specs = device.specs;
          devicesList.append(`
            <li class="list-group-item">
              <div><strong>Fingerprint:</strong> ${device.fingerprint}</div>
              <div><strong>User Agent:</strong> ${specs.userAgent}</div>
              <div><strong>Platform:</strong> ${specs.platform}</div>
              <div><strong>Screen Resolution:</strong> ${specs.screenResolution}</div>
              <div><strong>Color Depth:</strong> ${specs.colorDepth}</div>
              <div><strong>Language:</strong> ${specs.language}</div>
              <button class="btn btn-sm btn-danger delete-device-btn" data-id="${userId}" data-device="${device.fingerprint}">Delete</button>
            </li>
          `);
        });

        $("#manageDevicesModal").modal("show");
      },
      error: function () {
        alert("Failed to load devices");
      },
    });
  }

  function deleteDevice(userId, device) {
    const encodedDevice = encodeURIComponent(device); // Encode the device string
    if (confirm("Are you sure you want to delete this device?")) {
      $.ajax({
        url: `/api/admin/user/${userId}/devices/${encodedDevice}`,
        method: "DELETE",
        success: function () {
          console.log("Device deleted successfully"); // Add this for debugging
          loadUserDevices(userId); // Reload the devices list
        },
        error: function (err) {
          console.error("Failed to delete device:", err); // Log error details
          alert("Failed to delete device");
        },
      });
    }
  }

  loadUsers();
  loadPlaylists();

  // Add User Functionality
  $("#addUserBtn").on("click", function () {
    $("#addUserForm").trigger("reset");
    $("#addUserModal").modal("show");

    $("#addUserForm")
      .off("submit")
      .on("submit", function (e) {
        e.preventDefault();
        const userId = $("#newUserId").val();
        const password = $("#newUserPassword").val();
        const role = $("#newUserRole").val();
        const maxComputers = $("#newMaxComputers").val();

        $.ajax({
          url: "/api/admin/user",
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify({ userId, password, role, maxComputers }),
          success: function () {
            $("#addUserModal").modal("hide");
            loadUsers();
          },
          error: function () {
            alert("Failed to add user");
          },
        });
      });
  });

  // Edit User Functionality
  $(document).on("click", ".edit-user-btn", function () {
    const userId = $(this).data("id");
    $.ajax({
      url: `/api/admin/user/${userId}`,
      method: "GET",
      success: function (response) {
        const user = response.user;
        $("#editUserId").val(user.userId).prop("readonly", true);
        $("#editUserRole").val(user.role);
        $("#editMaxComputers").val(user.maxComputers);
        $("#editUserPassword").val(""); // Clear the password field for security reasons

        $("#editUserModal").modal("show");

        $("#editUserForm")
          .off("submit")
          .on("submit", function (e) {
            e.preventDefault();
            const role = $("#editUserRole").val();
            const maxComputers = $("#editMaxComputers").val();
            const password = $("#editUserPassword").val();
            const data = { role, maxComputers };
            if (password) data.password = password;

            $.ajax({
              url: `/api/admin/user/${userId}`,
              method: "PUT",
              contentType: "application/json",
              data: JSON.stringify(data),
              success: function () {
                $("#editUserModal").modal("hide");
                loadUsers();
              },
              error: function () {
                alert("Failed to update user");
              },
            });
          });
      },
      error: function () {
        alert("Failed to load user details");
      },
    });
  });

  // Delete User Functionality
  $(document).on("click", ".delete-user-btn", function () {
    const userId = $(this).data("id");
    if (confirm("Are you sure you want to delete this user?")) {
      $.ajax({
        url: `/api/admin/user/${userId}`,
        method: "DELETE",
        success: function () {
          loadUsers();
        },
        error: function () {
          alert("Failed to delete user");
        },
      });
    }
  });

  // Load User Devices on Button Click
  $(document).on("click", ".view-devices-btn", function () {
    const userId = $(this).data("id");
    loadUserDevices(userId);
  });

  // Delete Device Functionality
  $(document).on("click", ".delete-device-btn", function () {
    const userId = $(this).data("id");
    const device = $(this).data("device");
    deleteDevice(userId, device);
  });

  // Assign Playlist to User Functionality
  $(document).on("click", ".assign-playlist-btn", function () {
    const userId = $(this).data("id");
    $.ajax({
      url: `/api/admin/user/${userId}/playlists`,
      method: "GET",
      success: function (response) {
        const user = response.user;
        const assignedPlaylistsContainer = $("#assignedPlaylistsContainer");
        assignedPlaylistsContainer.empty();

        user.playlists.forEach((playlist) => {
          assignedPlaylistsContainer.append(`
                        <div class="playlist-item" data-id="${playlist._id}">
                            <span>${playlist.title}</span>
                            <button type="button" class="btn btn-danger btn-sm remove-playlist-btn">Remove</button>
                        </div>
                    `);
        });

        $("#assignPlaylistModal").modal("show");

        $.ajax({
          url: `/api/admin/playlists`,
          method: "GET",
          success: function (response) {
            const availablePlaylists = response.playlists;
            const availablePlaylistsDropdown = $("#availablePlaylists");
            availablePlaylistsDropdown.empty();

            availablePlaylists.forEach((playlist) => {
              availablePlaylistsDropdown.append(`
                                <option value="${playlist._id}">${playlist.title}</option>
                            `);
            });
          },
          error: function () {
            alert("Failed to load available playlists");
          },
        });
      },
      error: function () {
        alert("Failed to load user details");
      },
    });

    // Handle assigning a new playlist
    $("#assignPlaylistBtn")
      .off("click")
      .on("click", function () {
        const playlistId = $("#availablePlaylists").val();
        $.ajax({
          url: `/api/admin/user/assign-playlist`,
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify({ userId, playlistId }),
          success: function () {
            $("#assignPlaylistModal").modal("hide");
            loadUsers();
          },
          error: function () {
            alert("Failed to assign playlist");
          },
        });
      });

    // Handle removing a playlist
    $("#assignedPlaylistsContainer")
      .off("click", ".remove-playlist-btn")
      .on("click", ".remove-playlist-btn", function () {
        const playlistId = $(this).closest(".playlist-item").data("id");
        $.ajax({
          url: `/api/admin/user/remove-playlist`,
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify({ userId, playlistId }),
          success: function () {
            $("#assignPlaylistModal").modal("hide");
            loadUsers();
          },
          error: function () {
            alert("Failed to remove playlist");
          },
        });
      });
  });

  // Add Playlist Functionality
  $("#addPlaylistBtn").on("click", function () {
    $("#addPlaylistForm").trigger("reset");
    $("#addVideoInputsContainer").empty(); // Clear any video input fields
    $("#addPlaylistModal").modal("show");

    $("#addNewVideoField")
      .off("click")
      .on("click", function () {
        const index = $("#addVideoInputsContainer .video-input-group").length;
        $("#addVideoInputsContainer").append(`
                <div class="form-group video-input-group" data-index="${index}">
                    <label for="videoTitle_${index}">Video Title</label>
                    <input type="text" id="videoTitle_${index}" class="form-control" required>
                    <label for="videoUrl_${index}">Video URL</label>
                    <input type="text" id="videoUrl_${index}" class="form-control" required>
                    <button type="button" class="btn btn-danger remove-video-btn">Delete Video</button>
                </div>
            `);
      });

    $("#addVideoInputsContainer")
      .off("click", ".remove-video-btn")
      .on("click", ".remove-video-btn", function () {
        $(this).closest(".video-input-group").remove();
      });

    $("#addPlaylistForm")
      .off("submit")
      .on("submit", function (e) {
        e.preventDefault();
        const title = $("#newPlaylistTitle").val();
        const videos = [];

        $("#addVideoInputsContainer .video-input-group").each(function () {
          const videoTitle = $(this).find('input[id^="videoTitle_"]').val();
          const videoUrl = $(this).find('input[id^="videoUrl_"]').val();
          if (videoTitle && videoUrl) {
            videos.push({ title: videoTitle, url: videoUrl });
          }
        });

        if (videos.length === 0) {
          alert("Please add at least one video.");
          return;
        }

        $.ajax({
          url: "/api/admin/playlist",
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify({ title, videos }),
          success: function () {
            $("#addPlaylistModal").modal("hide");
            loadPlaylists(); // Reload playlists after a successful addition
          },
          error: function (xhr) {
            alert(
              `Failed to add playlist: ${
                xhr.responseJSON.message || xhr.statusText
              }`
            );
          },
        });
      });
  });

  // Edit Playlist Functionality
  $(document).on("click", ".edit-playlist-btn", function () {
    const playlistId = $(this).data("id");
    $.ajax({
      url: `/api/admin/playlist/${playlistId}`,
      method: "GET",
      success: function (response) {
        const playlist = response.playlist;
        $("#editPlaylistTitle").val(playlist.title);
        const videoInputsContainer = $("#editVideoInputsContainer");
        videoInputsContainer.empty();

        playlist.videos.forEach((video, index) => {
          videoInputsContainer.append(`
                        <div class="form-group video-input-group" data-index="${index}">
                            <label for="videoTitle_${index}">Video Title</label>
                            <input type="text" id="videoTitle_${index}" class="form-control" value="${video.title}" required>
                            <label for="videoUrl_${index}">Video URL</label>
                            <input type="text" id="videoUrl_${index}" class="form-control" value="${video.url}" required>
                            <button type="button" class="btn btn-danger remove-video-btn">Delete Video</button>
                        </div>
                    `);
        });

        $("#editPlaylistModal").modal("show");
      },
      error: function () {
        alert("Failed to load playlist details");
      },
    });

    $("#addEditVideoField")
      .off("click")
      .on("click", function () {
        const index = $("#editVideoInputsContainer .video-input-group").length;
        $("#editVideoInputsContainer").append(`
                <div class="form-group video-input-group" data-index="${index}">
                    <label for="videoTitle_${index}">Video Title</label>
                    <input type="text" id="videoTitle_${index}" class="form-control" required>
                    <label for="videoUrl_${index}">Video URL</label>
                    <input type="text" id="videoUrl_${index}" class="form-control" required>
                    <button type="button" class="btn btn-danger remove-video-btn">Delete Video</button>
                </div>
            `);
      });

    $("#editVideoInputsContainer")
      .off("click", ".remove-video-btn")
      .on("click", ".remove-video-btn", function () {
        $(this).closest(".video-input-group").remove();
      });

    $("#editPlaylistForm")
      .off("submit")
      .on("submit", function (e) {
        e.preventDefault();
        const title = $("#editPlaylistTitle").val();
        const videos = [];

        $("#editVideoInputsContainer .video-input-group").each(function () {
          const videoTitle = $(this).find('input[id^="videoTitle_"]').val();
          const videoUrl = $(this).find('input[id^="videoUrl_"]').val();
          if (videoTitle && videoUrl) {
            videos.push({ title: videoTitle, url: videoUrl });
          }
        });

        if (videos.length === 0) {
          alert("Please add at least one video.");
          return;
        }

        $.ajax({
          url: `/api/admin/playlist/${playlistId}`,
          method: "PUT",
          contentType: "application/json",
          data: JSON.stringify({ title, videos }),
          success: function () {
            $("#editPlaylistModal").modal("hide");
            loadPlaylists();
          },
          error: function () {
            alert("Failed to update playlist");
          },
        });
      });
  });

  // Delete Playlist Functionality
  $(document).on("click", ".delete-playlist-btn", function () {
    const playlistId = $(this).data("id");
    if (confirm("Are you sure you want to delete this playlist?")) {
      $.ajax({
        url: `/api/admin/playlist/${playlistId}`,
        method: "DELETE",
        success: function () {
          loadPlaylists();
        },
        error: function () {
          alert("Failed to delete playlist");
        },
      });
    }
  });
}

// Logout functionality
$("#logoutBtn").on("click", function () {
  $.ajax({
    url: "/api/auth/logout",
    method: "POST",
    success: function () {
      window.location.href = "index.html";
    },
    error: function () {
      alert("Failed to logout");
    },
  });
});
