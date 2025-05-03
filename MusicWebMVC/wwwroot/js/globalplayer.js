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

    // Check if user is VIP and add sleep timer if they are
    //checkUserVIP().then(isVIP => {
    //    if (isVIP) {
    createSleepTimerUI();
    //    }
    //});

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
                    <img id="global-album-cover" src="" alt="Album Cover">
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
    const replayBtn = document.getElementById('btn-replay');
    if (replayBtn) {
        replayBtn.addEventListener('click', replaySong);
    }


    // Function to replay the current song
    function replaySong() {
        if (!globalAudio) return;

        // Check if there is a current song
        if (currentSongIndex >= 0 && currentPlaylist.length > 0) {
            const currentSong = currentPlaylist[currentSongIndex];

            // Reset audio to beginning
            globalAudio.currentTime = 0;

            // If the audio is paused, start playing
            if (globalAudio.paused) {
                const playPromise = globalAudio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        // Update play/pause icon
                        const playPauseIcon = document.getElementById('play-pause-icon');
                        if (playPauseIcon) {
                            playPauseIcon.classList.remove('fa-play');
                            playPauseIcon.classList.add('fa-pause');
                        }

                        // Start album rotation animation
                        const albumCover = document.querySelector('.album-rotating');
                        if (albumCover) albumCover.classList.add('playing');

                        // Update local player UI
                        updateLocalPlayerUI();
                    }).catch(error => {
                        console.error('Cannot play audio:', error);
                    });
                }
            }
        } else if (isPlayingStandalone && globalAudio.src) {
            // Handle standalone replay
            globalAudio.currentTime = 0;

            // If the audio is paused, start playing
            if (globalAudio.paused) {
                const playPromise = globalAudio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        // Update play/pause icon
                        const playPauseIcon = document.getElementById('play-pause-icon');
                        if (playPauseIcon) {
                            playPauseIcon.classList.remove('fa-play');
                            playPauseIcon.classList.add('fa-pause');
                        }

                        // Start album rotation animation
                        const albumCover = document.querySelector('.album-rotating');
                        if (albumCover) albumCover.classList.add('playing');

                        // Update local player UI
                        updateLocalPlayerUI();
                    }).catch(error => {
                        console.error('Cannot play audio:', error);
                    });
                }
            }
        }
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



// Phát bài hát với global player

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

            // Lưu bài hát vào RecentPlays của người dùng hiện tại
            saveRecentPlay(songInfo);
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

    // Use playlist image instead of song image
    if (albumCover) {
        // Try to get the playlist image from the document
        const playlistCoverImg = document.querySelector('.playlist-cover img');
        if (playlistCoverImg && playlistCoverImg.src) {
            albumCover.src = playlistCoverImg.src;
        } else if (songInfo.imageUrl) {
            // Fallback to song image if playlist image is not available
            albumCover.src = songInfo.imageUrl;
        } else {
            // Default image if neither is available
            albumCover.src = '~/img/default-album.jpg';
        }
    }

    // Hiển thị player
    if (player) player.style.display = 'flex';
    isGlobalPlayerActive = true;
}
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

            // Try to get current playlist image
            const playlistCoverImg = document.querySelector('.playlist-cover img');
            const playlistImageUrl = playlistCoverImg ? playlistCoverImg.src : null;

            // Chỉ khôi phục nếu có bài hát
            if (loadedPlaylist && loadedPlaylist.length > 0) {
                // Update image URLs to use playlist image if available
                if (playlistImageUrl) {
                    loadedPlaylist.forEach(song => {
                        song.imageUrl = playlistImageUrl;
                    });
                }

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

function buildPagePlaylist() {
    // Check for songs on the current page
    const songElements = document.querySelectorAll('.song-item');
    if (songElements.length === 0) return;

    // Get playlist information
    const playlistTitle = document.querySelector('.playlist-title')?.textContent || "Unknown Playlist";
    const playlistCoverImg = document.querySelector('.playlist-cover img');
    const playlistImageUrl = playlistCoverImg ? playlistCoverImg.src : null;

    // Build playlist from page songs
    const pagePlaylist = [];
    songElements.forEach((songElement, index) => {
        // Get song data
        const songName = songElement.querySelector('.song-name')?.textContent || `Song ${index + 1}`;
        const artistName = songElement.querySelector('.song-artist')?.textContent || 'Unknown Artist';

        // Always use playlist image
        const imageUrl = playlistImageUrl;

        // Get song URL
        let songUrl = null;
        if (songElement.hasAttribute('data-song-url')) {
            songUrl = songElement.getAttribute('data-song-url');
        } else {
            const songId = songElement.getAttribute('data-song-id');
            if (songId) {
                songUrl = `/Song/GetSongUrl?id=${songId}`;
            }
        }

        if (songUrl) {
            pagePlaylist.push({
                url: songUrl,
                title: songName,
                artist: artistName,
                imageUrl: imageUrl
            });
        }
    });

    if (pagePlaylist.length > 0) {
        currentPlaylist = pagePlaylist;
        currentPlaylistName = playlistTitle;
    }
}


// Sửa lại phần xử lý cho local player
function setupLocalPlayers() {
    // Get playlist image if available
    const playlistCoverImg = document.querySelector('.playlist-cover img');
    const playlistImageUrl = playlistCoverImg ? playlistCoverImg.src : null;

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

            // Use playlist image instead of post image
            const imageUrl = playlistImageUrl || postElement?.querySelector('.post-image')?.src || null;

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
// Add these variables to the global variables section at the top of global-player.js
let sleepTimerEnabled = false;
let sleepTimerEnd = null;
let sleepTimerInterval = null;

// Add this function to create the sleep timer UI
function createSleepTimerUI() {
    // Create sleep timer container if it doesn't exist
    if (!document.getElementById('sleep-timer-container')) {
        const timerContainer = document.createElement('div');
        timerContainer.id = 'sleep-timer-container';
        timerContainer.className = 'sleep-timer-container';
        timerContainer.innerHTML = `
            <div class="sleep-timer-badge">
                <i class="fas fa-crown premium-icon"></i>
                <span>VIP</span>
            </div>
            <div class="sleep-timer-controls">
                <button id="sleep-timer-toggle" class="sleep-timer-btn">
                    <i class="fas fa-clock"></i> Sleep Timer
                </button>
                <div id="sleep-timer-options" class="sleep-timer-options" style="display: none;">
                    <button data-time="5" class="timer-option">5m</button>
                    <button data-time="15" class="timer-option">15m</button>
                    <button data-time="30" class="timer-option">30m</button>
                    <button data-time="60" class="timer-option">1h</button>
                    <button data-time="custom" class="timer-option">Custom</button>
                    <button id="cancel-timer" class="timer-option cancel-timer" style="display: none;">Cancel</button>
                </div>
                <div id="custom-timer-input" class="custom-timer-input" style="display: none;">
                    <input type="number" id="custom-minutes" min="1" max="180" placeholder="Min">
                    <button id="set-custom-timer" class="set-custom-btn">Set</button>
                    <button id="cancel-custom-timer" class="cancel-custom-btn">Cancel</button>
                </div>
                <div id="timer-countdown" class="timer-countdown" style="display: none;">
                    <span id="timer-remaining"></span>
                </div>
            </div>
        `;

        // Add timer to player right section
        const playerRight = document.querySelector('.player-right');
        if (playerRight) {
            playerRight.insertBefore(timerContainer, playerRight.firstChild);
        }

        // Setup event listeners for sleep timer
        setupSleepTimerEvents();
    }
}

// Add this function to set up sleep timer events
function setupSleepTimerEvents() {
    // Toggle timer options
    const timerToggle = document.getElementById('sleep-timer-toggle');
    const timerOptions = document.getElementById('sleep-timer-options');

    if (!timerToggle || !timerOptions) {
        console.error('Sleep timer UI elements not found');
        return;
    }

    timerToggle.addEventListener('click', function () {
        checkUserVIP().then(isVIP => {
            if (isVIP) {
                if (timerOptions.style.display === 'none') {
                    timerOptions.style.display = 'flex';
                } else {
                    timerOptions.style.display = 'none';
                }

                const customInput = document.getElementById('custom-timer-input');
                if (customInput) {
                    customInput.style.display = 'none';
                }
            }
            else {
                showNotification("You need register VIP to use this function", "warning")
                return;
            }
        });

    });

    // Time option buttons
    document.querySelectorAll('.timer-option').forEach(button => {
        button.addEventListener('click', function () {
            const time = this.getAttribute('data-time');

            if (time === 'custom') {
                // Show custom time input
                document.getElementById('custom-timer-input').style.display = 'flex';
                timerOptions.style.display = 'none';
            } else {
                // Set timer for preset time
                setSleepTimer(parseInt(time));
                timerOptions.style.display = 'none';
            }
        });
    });

    // Custom timer buttons
    const setCustomBtn = document.getElementById('set-custom-timer');
    if (setCustomBtn) {
        setCustomBtn.addEventListener('click', function () {
            const minutes = parseInt(document.getElementById('custom-minutes').value);
            if (!isNaN(minutes) && minutes > 0 && minutes <= 180) {
                setSleepTimer(minutes);
                document.getElementById('custom-timer-input').style.display = 'none';
            } else {
                alert('Please enter a valid time between 1 and 180 minutes.');
            }
        });
    }

    const cancelCustomBtn = document.getElementById('cancel-custom-timer');
    if (cancelCustomBtn) {
        cancelCustomBtn.addEventListener('click', function () {
            document.getElementById('custom-timer-input').style.display = 'none';
        });
    }

    // Cancel timer button
    const cancelTimer = document.getElementById('cancel-timer');
    if (cancelTimer) {
        cancelTimer.addEventListener('click', function () {
            cancelSleepTimer();
            timerOptions.style.display = 'none';
        });
    }
}

// Function to set sleep timer
function setSleepTimer(minutes) {
    // Clear any existing timer
    if (sleepTimerInterval) {
        clearInterval(sleepTimerInterval);
    }

    // Set end time
    sleepTimerEnabled = true;
    sleepTimerEnd = new Date(new Date().getTime() + minutes * 60000);

    // Show timer countdown
    document.getElementById('timer-countdown').style.display = 'flex';
    document.getElementById('cancel-timer').style.display = 'block';

    // Update countdown display
    updateTimerDisplay();

    // Set interval to update countdown
    sleepTimerInterval = setInterval(function () {
        updateTimerDisplay();

        // Check if timer is finished
        if (new Date() >= sleepTimerEnd) {
            if (!globalAudio.paused) {
                globalAudio.pause();

                // Update UI
                const playPauseIcon = document.getElementById('play-pause-icon');
                if (playPauseIcon) {
                    playPauseIcon.classList.remove('fa-pause');
                    playPauseIcon.classList.add('fa-play');
                }

                const albumCover = document.querySelector('.album-rotating');
                if (albumCover) albumCover.classList.remove('playing');

                // Update local player UI
                updateLocalPlayerUI();
            }

            // Cancel timer
            cancelSleepTimer();
        }
    }, 1000);
}

// Function to update timer display
function updateTimerDisplay() {
    if (!sleepTimerEnabled || !sleepTimerEnd) return;

    const now = new Date();
    const remaining = sleepTimerEnd - now;

    if (remaining <= 0) {
        document.getElementById('timer-remaining').textContent = "0:00";
        return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    document.getElementById('timer-remaining').textContent =
        `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

// Function to cancel sleep timer
function cancelSleepTimer() {
    sleepTimerEnabled = false;
    sleepTimerEnd = null;

    if (sleepTimerInterval) {
        clearInterval(sleepTimerInterval);
        sleepTimerInterval = null;
    }

    document.getElementById('timer-countdown').style.display = 'none';
    document.getElementById('cancel-timer').style.display = 'none';
}

// Add this function to check if user is VIP
async function checkUserVIP() {
    try {
        const response = await fetch('/User/CheckVipStatus');
        const data = await response.json();
        return data.isVIP;
    } catch (error) {
        console.error('Error checking VIP status:', error);
        return false; // Default to non-VIP in case of error
    }
}
function saveRecentPlay(songInfo) {
    let songId = null;
    // Extract song ID from songInfo object or URL
    if (songInfo.id) {
        songId = parseInt(songInfo.id);
    }
    console.log('song id:', songId);
    // If no songId is available, we can't save the play
    if (!songId) {
        console.log('Could not determine song ID for recent play:', songInfo);
        return;
    }

    // Use XMLHttpRequest
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/SaveRecentPlay', true);

    // Set the correct content type for JSON
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function () {
        if (xhr.status === 401) {
            // Silently ignore 401 Unauthorized errors
            return;
        } else if (xhr.status >= 200 && xhr.status < 300) {
            console.log('Saved recent play successfully');
        } else {
            console.log('Could not save recent play, status:', xhr.status);
        }
    };

    xhr.onerror = function () {
        console.log('Error in saving recent play:', xhr.statusText);
    };

    // Send the request with song ID as a JSON object
    xhr.send(JSON.stringify({ songId: songId }));
}