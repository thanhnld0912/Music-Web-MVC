// Create notification container on document load
document.addEventListener('DOMContentLoaded', function () {
    // Create the notification container
    createNotificationModal();

    // Filter chips handling
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', function () {
            const filterType = this.parentElement.getAttribute('data-filter-type');

            // Handle "All" selection
            if (this.getAttribute('data-value') === 'All') {
                this.parentElement.querySelectorAll('.filter-chip').forEach(c => {
                    c.classList.remove('active');
                });
                this.classList.add('active');
            } else {
                // Deselect "All"
                this.parentElement.querySelector('[data-value="All"]').classList.remove('active');
                // Toggle active state for current chip
                this.classList.toggle('active');
            }

            // Submit form after filter selection
            updateForm();
        });
    });

    // Sort dropdown handler
    document.getElementById('sortDropdown').addEventListener('change', function () {
        document.getElementById('sortInput').value = this.value;
        document.getElementById('searchForm').submit();
    });

    // Update form before submit
    function updateForm() {
        // Clear old hidden inputs
        document.getElementById('genreInputs').innerHTML = '';
        document.getElementById('eraInputs').innerHTML = '';
        document.getElementById('typeInputs').innerHTML = '';

        // Create hidden inputs for genre
        document.querySelectorAll('.filter-options[data-filter-type="genre"] .filter-chip.active').forEach(chip => {
            createHiddenInput('genre', chip.getAttribute('data-value'));
        });

        // Create hidden inputs for era
        document.querySelectorAll('.filter-options[data-filter-type="era"] .filter-chip.active').forEach(chip => {
            createHiddenInput('era', chip.getAttribute('data-value'));
        });

        // Create hidden inputs for type
        document.querySelectorAll('.filter-options[data-filter-type="type"] .filter-chip.active').forEach(chip => {
            createHiddenInput('type', chip.getAttribute('data-value'));
        });

        // Submit form
        document.getElementById('searchForm').submit();
    }

    // Function to create hidden input
    function createHiddenInput(name, value) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        document.getElementById(name + 'Inputs').appendChild(input);
    }
});

// Notification System Functions
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

                /* Additional modal styling */
                .modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                }

                .modal-content {
                    background-color: #fff;
                    margin: 10% auto;
                    padding: 0;
                    border-radius: 8px;
                    width: 400px;
                    max-width: 90%;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    animation: modalFadeIn 0.3s;
                }

                .modal-header {
                    padding: 15px 20px;
                    background-color: #f8f8f8;
                    border-bottom: 1px solid #eee;
                    border-radius: 8px 8px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 18px;
                    color: #333;
                }

                .close-modal {
                    color: #aaa;
                    font-size: 24px;
                    font-weight: bold;
                    cursor: pointer;
                }

                .close-modal:hover {
                    color: #333;
                }

                .modal-body {
                    padding: 20px;
                }

                .playlist-list {
                    max-height: 300px;
                    overflow-y: auto;
                    margin-bottom: 20px;
                }

                .playlist-item {
                    display: flex;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }

                .playlist-icon {
                    font-size: 20px;
                    margin-right: 10px;
                }

                .playlist-name {
                    flex-grow: 1;
                }

                .add-to-playlist-btn {
                    background-color: #1DB954;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 5px 10px;
                    cursor: pointer;
                }

                .create-playlist {
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                }

                .create-playlist input {
                    flex-grow: 1;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }

                .create-playlist-btn {
                    padding: 10px;
                    background-color: #1DB954;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

        @keyframes modalFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
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
    if (!container) return;

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
        container.removeChild(notification);
    });

    container.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode === container) {
            container.removeChild(notification);
        }
    }, 4000);
}

// Music menu toggle
function toggleMenu(event, menuId) {
    event.stopPropagation(); // Prevent click from propagating to document

    // Close all menus first
    document.querySelectorAll('.music-menu').forEach(menu => {
        if (menu.id !== menuId) {
            menu.classList.remove('active');
        }
    });

    // Toggle the clicked menu
    const menu = document.getElementById(menuId);
    menu.classList.toggle('active');
}

// Close menus when clicking elsewhere
document.addEventListener('click', function (event) {
    if (!event.target.closest('.music-menu') && !event.target.closest('.music-menu-button')) {
        document.querySelectorAll('.music-menu').forEach(menu => {
            menu.classList.remove('active');
        });
    }
});

// Playlist Management
let currentSongId = null;

function showAddToPlaylistModal(songId) {
    currentSongId = songId;
    document.getElementById('addToPlaylistModal').style.display = 'block';
    showNotification('Select a playlist to add this song', 'info');
}

function closeAddToPlaylistModal() {
    document.getElementById('addToPlaylistModal').style.display = 'none';
}

function createPlaylist() {
    const playlistNameInput = document.getElementById('new-playlist-name');
    if (!playlistNameInput) {
        console.error('Playlist name input not found');
        showNotification('Error: Could not find playlist name input', "error");
        return;
    }

    const playlistName = playlistNameInput.value.trim();
    if (!playlistName) {
        showNotification('Please enter a playlist name', "warning");
        return;
    }

    // Check if user is logged in
    const isAuthenticated = @(isAuthenticated.ToString().ToLower());
    if (!isAuthenticated) {
        showNotification('Please log in to create playlists', "warning");
        return;
    }

    // Send AJAX request to create playlist
    fetch('/Playlist/CreatePlaylist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `playlistName=${encodeURIComponent(playlistName)}`
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to create playlist');
        })
        .then(data => {
            if (data.success) {
                // Clear the input
                playlistNameInput.value = '';

                // Add the new playlist to the UI
                appendNewPlaylist({
                    id: data.playlistId,
                    name: playlistName
                });

                showNotification(`Playlist "${playlistName}" created successfully`, "success");
            } else {
                showNotification(data.message || 'Failed to create playlist', "error");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error creating playlist. Please try again.', "error");
        });
}

function appendNewPlaylist(playlist) {
    const playlistContainer = document.getElementById('playlist-container');
    const noPlaylistsMessage = document.getElementById('no-playlists-message');

    if (!playlistContainer) {
        console.error('Playlist container not found');
        return;
    }

    // Hide the "no playlists" message if it exists
    if (noPlaylistsMessage) {
        noPlaylistsMessage.style.display = 'none';
    }

    // Create a new playlist item element
    const playlistItem = document.createElement('div');
    playlistItem.className = 'playlist-item';
    playlistItem.innerHTML = `
                <div class="playlist-icon">🎵</div>
                <div class="playlist-name">${playlist.name}</div>
                <button class="add-to-playlist-btn" onclick="addSongToPlaylist('${playlist.id}')">
                    Add
                </button>
            `;

    // Add the new playlist to the container
    playlistContainer.appendChild(playlistItem);
}

function addSongToPlaylist(playlistId) {
    if (!currentSongId) {
        showNotification('No song selected', 'error');
        return;
    }

    // Send AJAX request to add song to playlist
    fetch(`/Playlist/AddSong?playlistId=${playlistId}&songId=${currentSongId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to add song to playlist');
        })
        .then(data => {
            showNotification('Song added to playlist successfully!', 'success');
            closeAddToPlaylistModal();
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Failed to add song to playlist. Please try again.', 'error');
        });
}

// Artist search functionality
const artistSearchInput = document.getElementById('artistSearchInput');
const artistSearchBtn = document.getElementById('artistSearchBtn');
const artistList = document.getElementById('artistList');
const artistsLoading = document.getElementById('artistsLoading');
const noArtistsFound = document.getElementById('noArtistsFound');

// Search artists function
function searchArtists() {
    const searchTerm = artistSearchInput.value.trim();

    if (!searchTerm) {
        showNotification('Please enter an artist name to search', 'warning');
        return;
    }

    // Show loading indicator
    artistsLoading.style.display = 'block';
    noArtistsFound.style.display = 'none';
    artistList.innerHTML = '';

    // Send AJAX request to search for artists
    fetch(`/Home/SearchArtists?searchTerm=${encodeURIComponent(searchTerm)}`)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to search artists');
        })
        .then(artists => {
            artistsLoading.style.display = 'none';

            if (artists.length === 0) {
                noArtistsFound.style.display = 'block';
                showNotification('No artists found matching your search', 'info');
                return;
            }

            // Create artist cards
            artists.forEach(artist => {
                const artistCard = document.createElement('div');
                artistCard.className = 'artist-card';
                artistCard.onclick = function () {
                    window.location.href = `/Home/ProfileUser/${artist.id}`;
                };

                artistCard.innerHTML = `
                            <div class="artist-avatar">
                                <img src="${artist.avatarUrl || '/api/placeholder/80/80'}" alt="${artist.username}">
                            </div>
                            <div class="artist-name">${artist.username}</div>
                        `;

                artistList.appendChild(artistCard);
            });

            showNotification(`Found ${artists.length} artists`, 'success');
        })
        .catch(error => {
            console.error('Error:', error);
            artistsLoading.style.display = 'none';
            noArtistsFound.style.display = 'block';
            showNotification('Error searching for artists', 'error');
        });
}

// Event listeners for artist search
artistSearchBtn.addEventListener('click', searchArtists);
artistSearchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        searchArtists();
        e.preventDefault();
    }
});
function getAudioDuration(audioUrl) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();

        // Handle successful metadata loading
        audio.addEventListener('loadedmetadata', () => {
            // Format the duration as MM:SS
            const duration = formatDuration(audio.duration);
            resolve(duration);
        });

        // Handle errors
        audio.addEventListener('error', (e) => {
            reject(`Error loading audio: ${e.message}`);
        });

        // Set the source and load the audio
        audio.src = audioUrl;
        audio.load();
    });
}

// Format seconds to MM:SS
function formatDuration(seconds) {
    if (isNaN(seconds)) return "00:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Pad with leading zeros if needed
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}
function getAudioDuration(audioUrl) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();

        // Handle successful metadata loading
        audio.addEventListener('loadedmetadata', () => {
            // Format the duration as MM:SS
            const duration = formatDuration(audio.duration);
            resolve(duration);
        });

        // Handle errors
        audio.addEventListener('error', (e) => {
            reject(`Error loading audio: ${e.message}`);
        });

        // Set a timeout in case the file doesn't load
        const timeout = setTimeout(() => {
            reject('Timeout: Audio file took too long to load');
        }, 10000); // 10 seconds timeout

        // Clear timeout when metadata is loaded
        audio.addEventListener('loadedmetadata', () => {
            clearTimeout(timeout);
        });

        // Set the source and load the audio
        audio.src = audioUrl;
        audio.load();
    });
}

// Format seconds to MM:SS
function formatDuration(seconds) {
    if (isNaN(seconds)) return "00:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Pad with leading zeros if needed
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

// Process all music cards to calculate durations
document.addEventListener('DOMContentLoaded', function () {
    const musicCards = document.querySelectorAll('.music-card');

    // Create a cache object to store durations
    const durationCache = JSON.parse(localStorage.getItem('songDurations') || '{}');

    // Process each music card
    musicCards.forEach(card => {
        const songId = card.querySelector('.music-menu').id.replace('menu-', '');
        const durationElement = card.querySelector('.music-duration');

        // If we have the card in our local cache, use that value
        if (durationCache[songId]) {
            durationElement.textContent = durationCache[songId];
            return;
        }

        // Get the audio URL from the card's data attribute
        const audioUrl = card.getAttribute('data-audio-url');

        if (audioUrl) {
            // Show loading spinner
            durationElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            // Calculate duration
            getAudioDuration(audioUrl)
                .then(duration => {
                    // Update the display
                    durationElement.textContent = duration;

                    // Save to local storage cache
                    durationCache[songId] = duration;
                    localStorage.setItem('songDurations', JSON.stringify(durationCache));
                })
                .catch(error => {
                    console.error('Error calculating duration:', error);
                    durationElement.textContent = '00:00'; // Default on error
                });
        }
    });
});
// Add this to your searchpage.js or within a script tag at the bottom of SearchPage.cshtml
function playSongFromSearch(element) {
    // Get the parent music-card element
    const musicCard = element.closest('.music-card');
    if (!musicCard) return;

    // Get song URL from data attribute
    const audioUrl = musicCard.getAttribute('data-audio-url');
    if (!audioUrl) return;

    // Get song title and artist
    const songTitle = musicCard.querySelector('.music-title').textContent || 'Unknown Title';
    const songArtist = musicCard.querySelector('.music-artist').textContent || 'Unknown Artist';

    // Get image URL if available
    let imageUrl = null;
    const coverImage = musicCard.querySelector('.music-image img');
    if (coverImage) {
        imageUrl = coverImage.src;
    }

    // Create song info object
    const songInfo = {
        title: songTitle,
        artist: songArtist,
        imageUrl: imageUrl,
        url: audioUrl
    };

    // Call the global player function with the standalone flag set to true
    playWithGlobalPlayer(audioUrl, songInfo, true);
}