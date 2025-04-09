// Tạo file riêng: global-player.js và thêm vào tất cả các trang

// Các biến toàn cục
let isPlayingStandalone = false;
let currentPlaylist = [];
let currentSongIndex = -1;
let globalAudio = null;
let isGlobalPlayerActive = false;
let playerInterval = null;
let currentPlaylistName = "";

// Khởi tạo player khi trang tải xong
document.addEventListener('DOMContentLoaded', function () {
    initializeGlobalPlayer();
});

// Khởi tạo Global Player
function initializeGlobalPlayer() {
    // Kiểm tra xem Global Player UI đã tồn tại chưa
    if (!document.getElementById('global-player')) {
        createGlobalPlayerUI();
    }

    // Lấy tham chiếu đến audio element
    globalAudio = document.getElementById('global-audio');

    // Khởi tạo các sự kiện cho player
    setupPlayerEvents();

    // Xây dựng playlist từ các bài hát trên trang hiện tại
    buildPagePlaylist();

    // Khôi phục trạng thái player từ localStorage
    restorePlayerState();

    // Gắn sự kiện cho các player cục bộ trên trang
    setupLocalPlayers();

    // Thiết lập interval để lưu trạng thái định kỳ
    if (playerInterval) {
        clearInterval(playerInterval);
    }
    playerInterval = setInterval(savePlayerState, 5000);
}

// Tạo UI cho Global Player nếu chưa tồn tại
function createGlobalPlayerUI() {
    // Kiểm tra nếu component đã được render từ server
    if (document.getElementById('global-player')) {
        return;
    }

    const playerHTML = `
    <div id="global-player" class="global-player" style="display: none;">
        <div class="player-container">
            <div class="album-container">
                <div class="album-rotating">
                    <img id="global-album-cover" src="~/img/default-album.jpg" alt="Album Cover">
                </div>
            </div>
            <div class="player-controls">
                <div class="song-info">
                    <div id="global-song-title">No song playing</div>
                    <div id="global-song-artist">Unknown Artist</div>
                    <div id="global-playlist-name" class="playlist-info">Not from playlist</div>
                </div>
                <div class="control-buttons">
                    <button id="btn-previous" title="Previous"><i class="fas fa-step-backward"></i></button>
                    <button id="btn-play-pause" title="Play/Pause"><i id="play-pause-icon" class="fas fa-play"></i></button>
                    <button id="btn-next" title="Next"><i class="fas fa-step-forward"></i></button>
                </div>
                <div class="progress-section">
                    <div id="current-time" class="time">0:00</div>
                    <div id="global-progress-container" class="progress-container">
                        <div id="global-progress-bar" class="progress-bar"></div>
                    </div>
                    <div id="total-time" class="time">0:00</div>
                </div>
                <div class="volume-section">
                    <i id="volume-icon" class="fas fa-volume-up volume-icon"></i>
                    <input type="range" id="global-volume-slider" class="volume-slider" min="0" max="1" step="0.01" value="1">
                    <button id="btn-close-player" class="close-button" title="Close Player">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <audio id="global-audio" style="display:none;"></audio>
    `;

    // Thêm vào cuối body
    const playerContainer = document.createElement('div');
    playerContainer.innerHTML = playerHTML;
    document.body.appendChild(playerContainer);
}
// Thiết lập các sự kiện cho player
function setupPlayerEvents() {
    if (!globalAudio) return;

    // Play/Pause button
    const playPauseBtn = document.getElementById('btn-play-pause');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }

    // Next button
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) {
        nextBtn.addEventListener('click', playNextSong);
    }

    // Previous button
    const prevBtn = document.getElementById('btn-previous');
    if (prevBtn) {
        prevBtn.addEventListener('click', playPreviousSong);
    }
    // Close button
    const closeBtn = document.getElementById('btn-close-player');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeGlobalPlayer);
    }
    // Progress bar
    const progressContainer = document.getElementById('global-progress-container');
    if (progressContainer) {
        progressContainer.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            if (globalAudio.duration) {
                globalAudio.currentTime = clickPos * globalAudio.duration;
            }
        });
    }

    // Volume slider
    const volumeSlider = document.getElementById('global-volume-slider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function () {
            if (globalAudio) {
                globalAudio.volume = this.value;
                updateVolumeIcon(this.value);
                savePlayerState();
            }
        });
    }

    // Volume icon (mute/unmute)
    const volumeIcon = document.getElementById('volume-icon');
    if (volumeIcon) {
        volumeIcon.addEventListener('click', toggleMute);
    }

    // Audio time update
    globalAudio.addEventListener('timeupdate', updateProgressBar);

    // Audio metadata loaded
    globalAudio.addEventListener('loadedmetadata', function () {
        document.getElementById('total-time').textContent = formatTime(globalAudio.duration);
    });

    // Audio ended
    globalAudio.addEventListener('ended', function () {
        // Nếu đang phát bài hát độc lập, không tiếp tục playlist
        if (isPlayingStandalone) {
            // Reset UI khi kết thúc bài hát độc lập
            const playPauseIcon = document.getElementById('play-pause-icon');
            if (playPauseIcon) {
                playPauseIcon.classList.remove('fa-pause');
                playPauseIcon.classList.add('fa-play');
            }

            const albumCover = document.querySelector('.album-rotating');
            if (albumCover) albumCover.classList.remove('playing');

            return; // Không thực hiện các bước tiếp theo
        }

        // Xử lý nếu đang phát playlist
        if (currentSongIndex < currentPlaylist.length - 1) {
            playNextSong();
        } else {
            // Nếu là bài cuối, dừng phát và không làm gì thêm
            // Reset UI
            const playPauseIcon = document.getElementById('play-pause-icon');
            if (playPauseIcon) {
                playPauseIcon.classList.remove('fa-pause');
                playPauseIcon.classList.add('fa-play');
            }

            const albumCover = document.querySelector('.album-rotating');
            if (albumCover) albumCover.classList.remove('playing');
        }
    });

    // Save state before page unload
    window.addEventListener('beforeunload', savePlayerState);
}

// Phát/Dừng bài hát hiện tại
function togglePlayPause() {
    if (!globalAudio) return;

    const playPauseIcon = document.getElementById('play-pause-icon');
    const albumCover = document.querySelector('.album-rotating');

    if (globalAudio.paused) {
        // Phát nhạc
        const playPromise = globalAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                playPauseIcon.classList.remove('fa-play');
                playPauseIcon.classList.add('fa-pause');
                if (albumCover) albumCover.classList.add('playing');

                // Cập nhật UI của local player nếu có
                updateLocalPlayerUI();

                // Lưu trạng thái
                savePlayerState();
            }).catch(error => {
                console.error('Không thể phát nhạc:', error);
            });
        }
    } else {
        // Dừng nhạc
        globalAudio.pause();
        playPauseIcon.classList.remove('fa-pause');
        playPauseIcon.classList.add('fa-play');
        if (albumCover) albumCover.classList.remove('playing');

        // Cập nhật UI của local player nếu có
        updateLocalPlayerUI();

        // Lưu trạng thái
        savePlayerState();
    }
}

// Phát bài hát tiếp theo
function playNextSong() {
    if (!globalAudio) return;

    // Load saved playlist nếu cần
    if (currentPlaylist.length === 0) {
        const savedPlaylist = localStorage.getItem('melofyCurrentPlaylist');
        if (savedPlaylist) {
            currentPlaylist = JSON.parse(savedPlaylist);
        }
        // Nếu vẫn không có, xây dựng từ trang hiện tại
        if (currentPlaylist.length === 0) {
            buildPagePlaylist();
        }
    }

    if (currentPlaylist.length > 0) {
        // Kiểm tra xem đã đến cuối danh sách chưa
        if (currentSongIndex < currentPlaylist.length - 1) {
            // Nếu chưa là bài cuối, phát bài tiếp theo
            currentSongIndex++;
            const nextSong = currentPlaylist[currentSongIndex];
            playWithGlobalPlayer(nextSong.url, nextSong);
        } else {
            // Nếu đã phát đến bài cuối cùng, dừng lại
            // Đặt lại trạng thái phát nhạc
            const playPauseIcon = document.getElementById('play-pause-icon');
            if (playPauseIcon) {
                playPauseIcon.classList.remove('fa-pause');
                playPauseIcon.classList.add('fa-play');
            }

            const albumCover = document.querySelector('.album-rotating');
            if (albumCover) albumCover.classList.remove('playing');

        }
    }
}

// Phát bài hát trước đó
function playPreviousSong() {
    if (!globalAudio) return;

    // Load saved playlist nếu cần
    if (currentPlaylist.length === 0) {
        const savedPlaylist = localStorage.getItem('melofyCurrentPlaylist');
        if (savedPlaylist) {
            currentPlaylist = JSON.parse(savedPlaylist);
        }
        // Nếu vẫn không có, xây dựng từ trang hiện tại
        if (currentPlaylist.length === 0) {
            buildPagePlaylist();
        }
    }

    if (currentPlaylist.length > 0) {
        currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
        const prevSong = currentPlaylist[currentSongIndex];
        playWithGlobalPlayer(prevSong.url, prevSong);
    }
}

// Xây dựng playlist từ trang hiện tại
function buildPagePlaylist() {
    const pagePlaylist = [];

    // Tìm tất cả các audio trên trang
    const songElements = document.querySelectorAll('.song-item');
    songElements.forEach((songElement, index) => {
        const audioElement = songElement.querySelector('audio');
        const customPlayer = songElement.querySelector('.custom-audio-player');

        if (audioElement && customPlayer) {
            const songUrl = customPlayer.getAttribute('data-song-url') ||
                audioElement.querySelector('source')?.src ||
                audioElement.src;

            const songTitle = songElement.querySelector('.song-info span')?.textContent.trim() ||
                `Song ${index + 1}`;

            const postElement = songElement.closest('.post');
            const artistName = postElement?.querySelector('.post-author')?.textContent ||
                'Unknown Artist';

            const imageUrl = postElement?.querySelector('.post-image')?.src || null;

            if (songUrl) {
                pagePlaylist.push({
                    url: songUrl,
                    title: songTitle,
                    artist: artistName,
                    imageUrl: imageUrl,
                    element: customPlayer
                });
            }
        }
    });

    // Nếu đã có playlist từ localStorage, hợp nhất và tránh trùng lặp
    const savedPlaylistJSON = localStorage.getItem('melofyCurrentPlaylist');
    if (savedPlaylistJSON) {
        const savedPlaylist = JSON.parse(savedPlaylistJSON);

        // Chỉ hợp nhất nếu trang hiện tại có bài hát
        if (pagePlaylist.length > 0) {
            // Hợp nhất danh sách mà không trùng lặp
            savedPlaylist.forEach(savedSong => {
                if (!pagePlaylist.some(pageSong => pageSong.url === savedSong.url)) {
                    pagePlaylist.push(savedSong);
                }
            });

            // Cập nhật playlist hiện tại
            currentPlaylist = pagePlaylist;
        } else {
            // Nếu trang không có bài hát, sử dụng playlist đã lưu
            currentPlaylist = savedPlaylist;
        }
    } else {
        // Nếu không có playlist đã lưu, sử dụng playlist trang hiện tại
        currentPlaylist = pagePlaylist;

        // Cập nhật tên playlist khi tự tạo từ trang
        if (pagePlaylist.length > 0) {
            currentPlaylistName = "NewFeed Playlist";
            updatePlaylistNameInPlayer(currentPlaylistName);

            // Lưu tên playlist vào localStorage
            localStorage.setItem('melofyCurrentPlaylistName', currentPlaylistName);
        }
    }

    return currentPlaylist;
}

// Phát bài hát với global player
function playWithGlobalPlayer(songUrl, songInfo, isStandalone = false) {
    if (!globalAudio || !songUrl) return;


    isPlayingStandalone = isStandalone;

    // Dừng tất cả các audio khác
    document.querySelectorAll('audio').forEach(audio => {
        if (audio !== globalAudio && !audio.paused) {
            audio.pause();
            const localPlayer = audio.closest('.custom-audio-player');
            if (localPlayer) {
                const playIcon = localPlayer.querySelector('.play-button i');
                if (playIcon) {
                    playIcon.classList.remove('fa-pause');
                    playIcon.classList.add('fa-play');
                }
            }
        }
    });

    // Cập nhật nguồn và phát nhạc
    globalAudio.src = songUrl;
    globalAudio.load();

    const playPromise = globalAudio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Cập nhật UI khi bắt đầu phát
            const playPauseIcon = document.getElementById('play-pause-icon');
            if (playPauseIcon) {
                playPauseIcon.classList.remove('fa-play');
                playPauseIcon.classList.add('fa-pause');
            }

            // Kích hoạt hiệu ứng quay của album
            const albumCover = document.querySelector('.album-rotating');
            if (albumCover) {
                albumCover.classList.add('playing');
            }

            // Cập nhật thông tin bài hát
            updateGlobalPlayerUI(songInfo);

            // Cập nhật UI của local player
            updateLocalPlayerUI();

            // Chỉ hiển thị tên playlist nếu không phải phát standalone
            if (isStandalone) {
                // Nếu phát độc lập, xóa tên playlist trên UI
                updatePlaylistNameInPlayer("");
            } else {
                // Hiển thị tên playlist hiện tại
                updatePlaylistNameInPlayer(currentPlaylistName);
            }

            // Lưu trạng thái
            savePlayerState();
        }).catch(error => {
            console.error('Không thể phát nhạc:', error);
        });
    }
}
// Cập nhật UI của global player
function updateGlobalPlayerUI(songInfo) {
    if (!songInfo) return;

    const titleElement = document.getElementById('global-song-title');
    const artistElement = document.getElementById('global-song-artist');
    const albumCover = document.getElementById('global-album-cover');
    const player = document.getElementById('global-player');

    if (titleElement) titleElement.textContent = songInfo.title || 'Unknown Title';
    if (artistElement) artistElement.textContent = songInfo.artist || 'Unknown Artist';

    // Cập nhật ảnh album nếu có
    if (albumCover && songInfo.imageUrl) {
        albumCover.src = songInfo.imageUrl;
    } else if (albumCover) {
        albumCover.src = '~/img/default-album.jpg'; // Ảnh mặc định
    }

    // Hiển thị player
    if (player) player.style.display = 'flex';
    isGlobalPlayerActive = true;
}

// Cập nhật UI của local player
function updateLocalPlayerUI() {
    if (!globalAudio || currentSongIndex < 0 || !currentPlaylist[currentSongIndex]) return;

    const currentSongUrl = currentPlaylist[currentSongIndex].url;

    // Cập nhật tất cả các local player
    document.querySelectorAll('.custom-audio-player').forEach(player => {
        const playerSongUrl = player.getAttribute('data-song-url');
        const playIcon = player.querySelector('.play-button i');

        if (playIcon) {
            if (playerSongUrl === currentSongUrl) {
                // Nếu đây là bài hát đang phát
                if (globalAudio.paused) {
                    playIcon.classList.remove('fa-pause');
                    playIcon.classList.add('fa-play');
                } else {
                    playIcon.classList.remove('fa-play');
                    playIcon.classList.add('fa-pause');
                }
            } else {
                // Nếu không phải bài hát đang phát
                playIcon.classList.remove('fa-pause');
                playIcon.classList.add('fa-play');
            }
        }
    });
}

// Cập nhật thanh tiến trình
function updateProgressBar() {
    if (!globalAudio) return;

    const progressBar = document.getElementById('global-progress-bar');
    const currentTimeDisplay = document.getElementById('current-time');

    if (progressBar && globalAudio.duration) {
        const progress = (globalAudio.currentTime / globalAudio.duration) * 100;
        progressBar.style.width = `${progress}%`;
    }

    if (currentTimeDisplay) {
        currentTimeDisplay.textContent = formatTime(globalAudio.currentTime);
    }
}

// Chuyển đổi giây thành định dạng MM:SS
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
}

// Bật/tắt tiếng
function toggleMute() {
    if (!globalAudio) return;

    const volumeIcon = document.getElementById('volume-icon');
    const volumeSlider = document.getElementById('global-volume-slider');

    if (globalAudio.volume > 0) {
        // Lưu âm lượng hiện tại và tắt tiếng
        globalAudio.dataset.lastVolume = globalAudio.volume;
        globalAudio.volume = 0;
        if (volumeSlider) volumeSlider.value = 0;
        if (volumeIcon) volumeIcon.className = 'fas fa-volume-mute volume-icon';
    } else {
        // Khôi phục âm lượng
        const lastVolume = parseFloat(globalAudio.dataset.lastVolume || 1);
        globalAudio.volume = lastVolume;
        if (volumeSlider) volumeSlider.value = lastVolume;
        updateVolumeIcon(lastVolume);
    }

    // Lưu trạng thái
    savePlayerState();
}

// Cập nhật biểu tượng âm lượng
function updateVolumeIcon(volume) {
    const volumeIcon = document.getElementById('volume-icon');
    if (!volumeIcon) return;

    if (volume === 0) {
        volumeIcon.className = 'fas fa-volume-mute volume-icon';
    } else if (volume < 0.5) {
        volumeIcon.className = 'fas fa-volume-down volume-icon';
    } else {
        volumeIcon.className = 'fas fa-volume-up volume-icon';
    }
}

// Lưu trạng thái player vào localStorage
function savePlayerState() {
    if (!globalAudio) return;

    if (currentPlaylist && currentPlaylist.length > 0) {
        // Tạo phiên bản đơn giản của playlist để lưu trữ
        const serializablePlaylist = currentPlaylist.map(song => ({
            url: song.url,
            title: song.title,
            artist: song.artist,
            imageUrl: song.imageUrl
        }));

        // Lưu trạng thái hiện tại
        localStorage.setItem('melofyCurrentPlaylist', JSON.stringify(serializablePlaylist));
        localStorage.setItem('melofyCurrentSongIndex', currentSongIndex);
        localStorage.setItem('melofyCurrentTime', globalAudio.currentTime);
        localStorage.setItem('melofyIsPlaying', !globalAudio.paused);
        localStorage.setItem('melofyVolume', globalAudio.volume);
        localStorage.setItem('melofyCurrentPlaylistName', currentPlaylistName);
    }
}

// Khôi phục trạng thái player từ localStorage
// Khôi phục trạng thái player từ localStorage
function restorePlayerState() {
    const savedPlaylist = localStorage.getItem('melofyCurrentPlaylist');
    const savedIndex = localStorage.getItem('melofyCurrentSongIndex');
    const savedTime = localStorage.getItem('melofyCurrentTime');
    const savedIsPlaying = localStorage.getItem('melofyIsPlaying');
    const savedVolume = localStorage.getItem('melofyVolume');
    const savedPlaylistName = localStorage.getItem('melofyCurrentPlaylistName');

    if (savedPlaylist && savedIndex) {
        try {
            // Khôi phục playlist
            const loadedPlaylist = JSON.parse(savedPlaylist);

            // Khôi phục tên playlist
            if (savedPlaylistName) {
                currentPlaylistName = savedPlaylistName;
                // Cập nhật UI
                updatePlaylistNameInPlayer(currentPlaylistName);
            }

            // Chỉ khôi phục nếu có bài hát
            if (loadedPlaylist && loadedPlaylist.length > 0) {
                // Gán playlist đã lưu
                currentPlaylist = loadedPlaylist;

                // Khôi phục index bài hát hiện tại
                currentSongIndex = parseInt(savedIndex);

                // Nếu index hợp lệ
                if (currentSongIndex >= 0 && currentSongIndex < currentPlaylist.length) {
                    const song = currentPlaylist[currentSongIndex];

                    // Cập nhật UI
                    updateGlobalPlayerUI(song);

                    // Đặt nguồn
                    if (globalAudio) {
                        globalAudio.src = song.url;

                        // Đặt âm lượng
                        if (savedVolume) {
                            const volume = parseFloat(savedVolume);
                            globalAudio.volume = volume;

                            const volumeSlider = document.getElementById('global-volume-slider');
                            if (volumeSlider) volumeSlider.value = volume;

                            updateVolumeIcon(volume);
                        }

                        // Đặt thời gian hiện tại (chỉ hoạt động sau khi đã tải)
                        globalAudio.addEventListener('loadedmetadata', function onceLoaded() {
                            if (savedTime) {
                                globalAudio.currentTime = parseFloat(savedTime);
                            }
                            globalAudio.removeEventListener('loadedmetadata', onceLoaded);

                            // Tự động phát nếu đang phát trước đó
                            if (savedIsPlaying === 'true') {
                                const playPromise = globalAudio.play();
                                if (playPromise !== undefined) {
                                    playPromise.then(() => {
                                        // Cập nhật biểu tượng nút phát
                                        const playPauseIcon = document.getElementById('play-pause-icon');
                                        if (playPauseIcon) {
                                            playPauseIcon.classList.remove('fa-play');
                                            playPauseIcon.classList.add('fa-pause');
                                        }

                                        const albumCover = document.querySelector('.album-rotating');
                                        if (albumCover) albumCover.classList.add('playing');

                                        // Cập nhật UI local player
                                        updateLocalPlayerUI();
                                    }).catch(error => {
                                        console.warn('Auto-play bị chặn:', error);
                                    });
                                }
                            }
                        });

                        globalAudio.load();
                        isGlobalPlayerActive = true;
                    }
                }
            } else {
                // Nếu không có bài hát trong playlist đã lưu, tạo mới từ trang
                buildPagePlaylist();
            }
        } catch (error) {
            console.error('Lỗi khi khôi phục trạng thái player:', error);
            // Trong trường hợp lỗi, tạo mới playlist từ trang
            buildPagePlaylist();
        }
    } else {
        // Nếu không có playlist được lưu, tạo mới từ trang
        buildPagePlaylist();
    }
}

// Sửa lại phần xử lý cho local player
function setupLocalPlayers() {
    document.querySelectorAll('.custom-audio-player').forEach((player, index) => {
        const playButton = player.querySelector('.play-button');
        const songUrl = player.getAttribute('data-song-url');

        if (playButton && songUrl) {
            // Tìm thông tin bài hát
            const songElement = player.closest('.song-item');
            const songTitle = songElement?.querySelector('.song-info span')?.textContent.trim() ||
                `Song ${index + 1}`;

            const postElement = songElement?.closest('.post');
            const artistName = postElement?.querySelector('.post-author')?.textContent ||
                'Unknown Artist';

            const imageUrl = postElement?.querySelector('.post-image')?.src || null;

            const songInfo = {
                title: songTitle,
                artist: artistName,
                imageUrl: imageUrl
            };

            // Gỡ bỏ sự kiện cũ để tránh duplicate
            playButton.replaceWith(playButton.cloneNode(true));
            const newPlayButton = player.querySelector('.play-button');

            // Thêm sự kiện mới
            newPlayButton.addEventListener('click', function (event) {
                event.stopPropagation(); // Ngăn bubbling

                // Nếu global player đang phát bài hát này
                if (isGlobalPlayerActive && globalAudio && globalAudio.src.includes(songUrl)) {
                    // Toggle play/pause
                    togglePlayPause();
                } else {
                    // Phát bài hát mới nhưng không thay đổi playlist
                    playWithGlobalPlayer(songUrl, songInfo, true); // true cho biết phát độc lập
                }
            });
        }
    });
}
// Thêm hàm cập nhật tên playlist trong UI
function updatePlaylistNameInPlayer(playlistName) {
    const playlistNameElement = document.getElementById('global-playlist-name');
    if (playlistNameElement) {
        if (playlistName && playlistName.trim() !== "") {
            playlistNameElement.textContent = `Playing from: ${playlistName}`;
            playlistNameElement.style.display = 'block';
        } else {
            playlistNameElement.textContent = 'Not from playlist';
            playlistNameElement.style.display = 'none';
        }
    }
}

// Thiết lập sự kiện cho local player


function closeGlobalPlayer() {
    const player = document.getElementById('global-player');

    if (player) {
        // Hide the player
        player.style.display = 'none';

        // Pause audio if playing
        if (globalAudio && !globalAudio.paused) {
            globalAudio.pause();

            // Reset play/pause icon
            const playPauseIcon = document.getElementById('play-pause-icon');
            if (playPauseIcon) {
                playPauseIcon.classList.remove('fa-pause');
                playPauseIcon.classList.add('fa-play');
            }

            // Stop album rotation animation
            const albumCover = document.querySelector('.album-rotating');
            if (albumCover) albumCover.classList.remove('playing');
        }

        // Update local player UI
        updateLocalPlayerUI();

        // Set flag indicating player is not active
        isGlobalPlayerActive = false;
    }
}
