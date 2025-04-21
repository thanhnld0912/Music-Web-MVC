// Thêm sự kiện cho nút play lớn ở đầu playlist
document.addEventListener('DOMContentLoaded', function () {
    const playButtonLarge = document.querySelector('.play-button-large');
    if (playButtonLarge) {
        playButtonLarge.addEventListener('click', function () {
            playPlaylistSongs();
        });
    }
});

// Phát danh sách bài hát từ playlist (có tùy chọn phát ngẫu nhiên)
function playPlaylistSongs() {
    // Lấy tên playlist từ phần tử DOM
    const playlistTitle = document.querySelector('.playlist-title')?.textContent || "Unknown Playlist";

    // Get playlist image URL
    const playlistCoverImg = document.querySelector('.playlist-cover img');
    const playlistImageUrl = playlistCoverImg ? playlistCoverImg.src : null;

    // Thu thập tất cả các bài hát từ playlist hiện tại
    const songItems = document.querySelectorAll('.song-item');

    if (!songItems || songItems.length === 0) {
        showNotification('Không có bài hát nào trong playlist này', 'warning');
        return;
    }

    // Tạo mảng chứa thông tin về các bài hát
    const playlistSongs = [];

    songItems.forEach(item => {
        // Lấy thông tin bài hát
        const songName = item.querySelector('.song-name')?.textContent || 'Unknown Title';
        const artistName = item.querySelector('.song-artist')?.textContent || 'Unknown Artist';

        // Luôn sử dụng playlist image thay vì song image
        const imageUrl = playlistImageUrl;

        // Trích xuất URL bài hát từ thuộc tính data-song-url hoặc data-song-id
        let songUrl = null;
        if (item.hasAttribute('data-song-url')) {
            songUrl = item.getAttribute('data-song-url');
        } else {
            // Lấy ID bài hát để gọi API
            const songId = item.getAttribute('data-song-id');
            if (songId) {
                // Đặt URL tạm thời cho demo
                songUrl = `/Song/GetSongUrl?id=${songId}`;
            }
        }

        if (songUrl) {
            playlistSongs.push({
                url: songUrl,
                title: songName,
                artist: artistName,
                imageUrl: imageUrl
            });
        }
    });

    if (playlistSongs.length === 0) {
        showNotification('Không thể phát nhạc từ playlist này', 'error');
        return;
    }

    // Xáo trộn ngẫu nhiên danh sách bài hát (mặc định)
    shuffleArray(playlistSongs);
    showNotification(`Đang phát playlist ngẫu nhiên: ${playlistTitle}`, 'success');

    // Cập nhật global playlist và phát bài hát đầu tiên
    if (typeof currentPlaylist !== 'undefined') {
        // Thay thế playlist hiện tại bằng playlist mới
        currentPlaylist = playlistSongs;
        currentSongIndex = 0;

        // Lưu tên playlist hiện tại
        currentPlaylistName = playlistTitle;

        // Lưu tên playlist vào localStorage
        localStorage.setItem('melofyCurrentPlaylistName', currentPlaylistName);

        // Phát bài hát đầu tiên
        if (playlistSongs.length > 0) {
            const firstSong = playlistSongs[0];
            playWithGlobalPlayer(firstSong.url, firstSong);
            updatePlaylistNameInPlayer(currentPlaylistName);
        }
    } else {
        showNotification('Global player chưa được khởi tạo', 'error');
    }
}

// Hàm xáo trộn mảng (Fisher-Yates shuffle algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Hàm cập nhật tên playlist trong UI của player
function updatePlaylistNameInPlayer(playlistName) {
    const playlistNameElement = document.getElementById('global-playlist-name');
    if (playlistNameElement) {
        playlistNameElement.textContent = `Playing from: ${playlistName}`;
    }
}


function toggleSidebar(event) {
    event.stopPropagation();
    document.getElementById('sidebar').classList.toggle('collapsed');
}

function toggleChatBox(event, boxId) {
    event.stopPropagation();
    closeAll();
    document.getElementById(boxId).style.display = 'block';
}

function togglePostMenu(event, element) {
    event.stopPropagation();
    const menu = element.nextElementSibling;
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function closeAll(event) {
    if (event && (event.target.closest('.chat-box') || event.target.closest('.sidebar-button') || event.target.closest('.post-options'))) return;
    document.querySelectorAll('.chat-box, .post-menu').forEach(el => el.style.display = 'none');
}

function showContent(type) {
    document.getElementById('status').style.display = type === 'status' ? 'block' : 'none';
    document.getElementById('song').style.display = type === 'song' ? 'block' : 'none';

    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// When the user clicks anywhere outside of the modal content, close it
window.onclick = function (event) {
    const modals = document.getElementsByClassName('modal');
    for (let i = 0; i < modals.length; i++) {
        if (event.target === modals[i]) {
            modals[i].style.display = 'none';
        }
    }
}

// Edit playlist details function
function editPlaylistDetails() {
    openModal('editPlaylistModal');
}

// Update playlist name using XHR
function updatePlaylistName(playlistId) {
    const newName = document.getElementById('editPlaylistName').value;

    if (!newName || newName.trim() === '') {
        showNotification('Tên playlist không được để trống', 'error');
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/Playlist/UpdatePlaylistName', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    // Update the playlist name in the UI
                    document.querySelector('.playlist-title').textContent = newName;
                    showNotification('Cập nhật tên playlist thành công', 'success');
                } else {
                    showNotification(response.message || 'Có lỗi xảy ra khi cập nhật tên playlist', 'error');
                }
            } else {
                showNotification('Có lỗi xảy ra khi kết nối đến server', 'error');
            }
        }
    };

    xhr.send('playlistId=' + playlistId + '&newName=' + encodeURIComponent(newName));
}

// Remove song from playlist using XHR
function removeSongFromPlaylist(playlistId, songId) {
    if (!confirm('Bạn có chắc muốn xóa bài hát này khỏi playlist?')) {
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/Playlist/RemoveSong', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    // Remove song from UI
                    const songItems = document.querySelectorAll('.edit-song-item');
                    for (let i = 0; i < songItems.length; i++) {
                        if (songItems[i].querySelector('.remove-song-btn').getAttribute('onclick').includes(songId)) {
                            songItems[i].remove();
                            break;
                        }
                    }

                    // Also remove from main song list if present
                    const mainSongItems = document.querySelectorAll('.song-item');
                    for (let i = 0; i < mainSongItems.length; i++) {
                        if (mainSongItems[i].getAttribute('data-song-id') == songId) {
                            mainSongItems[i].remove();
                            break;
                        }
                    }

                    showNotification('Đã xóa bài hát khỏi playlist', 'success');

                    // If no songs left, show the no songs message
                    if (document.querySelectorAll('.edit-song-item').length === 0) {
                        const noSongsMsg = document.createElement('p');
                        noSongsMsg.className = 'no-songs';
                        noSongsMsg.textContent = 'No songs in this playlist';
                        document.querySelector('.edit-song-list').appendChild(noSongsMsg);

                        // Update main song list as well
                        const emptySongList = document.createElement('div');
                        emptySongList.className = 'empty-playlist';
                        emptySongList.innerHTML = '<p>No songs in this playlist yet.</p>';
                        document.querySelector('.song-list').innerHTML = '';
                        document.querySelector('.song-list').appendChild(emptySongList);
                    }
                } else {
                    showNotification(response.message || 'Có lỗi xảy ra khi xóa bài hát', 'error');
                }
            } else {
                showNotification('Có lỗi xảy ra khi kết nối đến server', 'error');
            }
        }
    };

    xhr.send('playlistId=' + playlistId + '&songId=' + songId);
}

// Delete playlist function
function removePlaylist() {
    openModal('deletePlaylistModal');
}

// Delete playlist using XHR
function deletePlaylist(playlistId) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/Playlist/DeletePlaylist', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    showNotification('Đã xóa playlist thành công', 'success');
                    // Redirect to home or playlists page
                    window.location.href = '/Home';
                } else {
                    showNotification(response.message || 'Có lỗi xảy ra khi xóa playlist', 'error');
                }
            } else {
                showNotification('Có lỗi xảy ra khi kết nối đến server', 'error');
            }
        }
    };

    xhr.send('playlistId=' + playlistId);
}

// Share playlist function
function sharePlaylist() {
    openModal('sharePlaylistModal');
}

// Copy share link to clipboard
function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    document.execCommand('copy');

    // Show copied message with notification
    showNotification('Link copied to clipboard!', 'success');
}

// Update the song list to include data-song-id
document.addEventListener('DOMContentLoaded', function () {
    // Create notification container
    createNotificationModal();

    const songItems = document.querySelectorAll('.song-item');
    songItems.forEach(function (item) {
        const href = item.getAttribute('onclick');
        if (href) {
            const songIdMatch = href.match(/postId=(\d+)/);
            if (songIdMatch && songIdMatch[1]) {
                item.setAttribute('data-song-id', songIdMatch[1]);
            }
        }
    });
});

function toggleDropdownMenu(event, element) {
    event.stopPropagation();
    const dropdown = document.getElementById('playlist-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function editPlaylistDetails() {
    // Hide dropdown and open edit modal
    document.getElementById('playlist-dropdown').style.display = 'none';
    openModal('editPlaylistModal');
}

function removePlaylist() {
    // Hide dropdown and open delete confirmation modal
    document.getElementById('playlist-dropdown').style.display = 'none';
    openModal('deletePlaylistModal');
}

function sharePlaylist() {
    // Hide dropdown and open share modal
    document.getElementById('playlist-dropdown').style.display = 'none';
    openModal('sharePlaylistModal');
}

// Update to the existing closeAll function to include dropdowns and not modals
function closeAll(event) {
    if (event && (event.target.closest('.chat-box') ||
        event.target.closest('.sidebar-button') ||
        event.target.closest('.post-options') ||
        event.target.closest('.more-options-btn') ||
        event.target.closest('.modal-content'))) return;

    document.querySelectorAll('.chat-box, .post-menu, .dropdown-menu').forEach(el => {
        el.style.display = 'none';
    });
}

/*NOTIFICATION */
function createNotificationModal() {
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);

    // Add CSS for notification
    const style = document.createElement('style');
    style.textContent = `
        .notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        }

        .notification {
            margin-bottom: 10px;
            padding: 15px 25px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 250px;
            max-width: 350px;
            animation: slideIn 0.5s, fadeOut 0.5s 3.5s forwards;
            cursor: pointer;
        }

        .notification-success {
            background-color: #4CAF50;
        }

        .notification-error {
            background-color: #f44336;
        }

        .notification-warning {
            background-color: #ff9800;
        }

        .notification-info {
            background-color: #2196F3;
        }

        .notification i {
            margin-right: 10px;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) {
        createNotificationModal();
    }

    const notificationContainer = document.getElementById('notification-container');

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-times-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
            icon = '<i class="fas fa-info-circle"></i>';
            break;
    }

    notification.innerHTML = `${icon}<span>${message}</span>`;

    notification.addEventListener('click', function () {
        notificationContainer.removeChild(notification);
    });

    notificationContainer.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode === notificationContainer) {
            notificationContainer.removeChild(notification);
        }
    }, 4000);
}


function updatePlaylistImage(playlistId) {
    const fileInput = document.getElementById('playlistImageUpload');

    if (!fileInput.files || fileInput.files.length === 0) {
        showNotification('Bạn chưa chọn ảnh', 'error');
        return;
    }

    const file = fileInput.files[0];

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif)', 'error');
        return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        showNotification('Kích thước file không được vượt quá 5MB', 'error');
        return;
    }

    // Show loading indicator
    showNotification('Đang tải ảnh lên...', 'info');

    const formData = new FormData();
    formData.append('playlistId', playlistId);
    formData.append('image', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/Playlist/UpdatePlaylistImage', true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    // Update playlist image in UI
                    updatePlaylistImageUI(response.imageUrl);
                    showNotification('Cập nhật ảnh playlist thành công', 'success');
                } else {
                    showNotification(response.message || 'Có lỗi xảy ra khi cập nhật ảnh playlist', 'error');
                }
            } else {
                showNotification('Có lỗi xảy ra khi kết nối đến server', 'error');
            }
        }
    };

    xhr.send(formData);
}

// Update playlist image in the UI
function updatePlaylistImageUI(imageUrl) {
    // Update in edit modal
    const currentImageDiv = document.querySelector('.current-image');
    if (currentImageDiv) {
        currentImageDiv.innerHTML = `<img src="${imageUrl}" alt="Playlist Cover" />`;
    }

    // Update in playlist header
    const playlistCover = document.querySelector('.playlist-cover');
    if (playlistCover) {
        playlistCover.innerHTML = `<img src="${imageUrl}" alt="Playlist Cover" />`;
    }
}

// Add event listener to show preview before upload
document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('playlistImageUpload');
    if (fileInput) {
        fileInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const reader = new FileReader();

                reader.onload = function (e) {
                    const currentImageDiv = document.querySelector('.current-image');
                    if (currentImageDiv) {
                        currentImageDiv.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
                    }
                };

                reader.readAsDataURL(this.files[0]);
            }
        });
    }
});