// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

// Filter Tabs
document.addEventListener("DOMContentLoaded", function () {
    // Create notification container
    createNotificationModal();

    // KHAI BÁO CÁC PHẦN TỬ DOM

    // Phần tử liên quan đến file
    const uploadTrigger = document.getElementById('uploadTrigger');
    const dropZone = document.getElementById('dropZone');
    const songFile = document.getElementById('songFile');
    const fileDetails = document.getElementById('fileDetails');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileDuration = document.getElementById('fileDuration');
    const clearUpload = document.getElementById('clearUpload');

    // Phần tử liên quan đến trình phát nhạc
    const audioPreview = document.getElementById('audioPreview');
    const playButton = document.getElementById('playButton');
    const progressBar = document.getElementById('progressBar');
    const currentTimeDisplay = document.getElementById('currentTime');
    const durationDisplay = document.getElementById('duration');

    // Phần tử liên quan đến form và upload
    const uploadForm = document.getElementById('uploadForm');
    const songTitle = document.getElementById('songTitle');
    const postContent = document.getElementById('postContent');
    const submitUpload = document.getElementById('submitUpload');
    const uploadStatus = document.getElementById('uploadStatus');
    const uploadProgressBar = document.getElementById('uploadProgressBar');
    const uploadMessage = document.getElementById('uploadMessage');

    // Phần tử liên quan đến modal
    const modal = document.getElementById("shareModal");
    const shareBtn = document.getElementById("shareButton");
    const closeBtn = document.querySelector(".close-modal");
    const cancelBtn = document.querySelector(".cancel-btn");
    const shareNowBtn = document.querySelector(".share-btn");

    // Biến lưu trữ đối tượng Audio
    let audio = null;

    // Biến lưu trữ thông tin metadata từ modal - ensure this is defined globally in the context
    // Declare globally to fix ReferenceError
    window.songMetadata = {
        genre: 'other', // giá trị mặc định
        type: 'cover',  // giá trị mặc định
        era: '20s'      // giá trị mặc định
    };

    // === PHẦN XỬ LÝ FILE NHẠC ===

    // Khi click vào icon upload
    if (uploadTrigger) {
        uploadTrigger.addEventListener('click', () => {
            songFile.click();
        });
    }

    // Hỗ trợ kéo thả file (drag & drop)
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');

            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    // Khi chọn file qua input
    if (songFile) {
        songFile.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
    }

    // Xử lý file được chọn
    function handleFile(file) {
        // Kiểm tra loại file
        const fileType = file.type;
        if (fileType !== 'audio/mpeg' && fileType !== 'audio/mp4') {
            showNotification('Vui lòng chọn file MP3 hoặc M4A hợp lệ', 'error');
            return;
        }

        // Kiểm tra kích thước file (tối đa 20MB)
        if (file.size > 20 * 1024 * 1024) {
            showNotification('Kích thước file vượt quá giới hạn 20MB', 'error');
            return;
        }

        // Hiển thị thông tin file
        fileName.textContent = `File: ${file.name}`;
        fileSize.textContent = `Size: ${formatFileSize(file.size)}`;
        fileDetails.style.display = 'block';

        // Tạo bản nghe thử
        if (audio) {
            audio.pause();
            audio = null;
        }

        audio = new Audio();
        audio.src = URL.createObjectURL(file);

        audio.addEventListener('loadedmetadata', () => {
            // Kiểm tra thời lượng (tối đa 10 phút)
            if (audio.duration > 600) {
                showNotification('Thời lượng audio vượt quá giới hạn 10 phút', 'error');
                clearFileSelection();
                return;
            }

            fileDuration.textContent = `Duration: ${formatTime(audio.duration)}`;
            durationDisplay.textContent = formatTime(audio.duration);
            audioPreview.style.display = 'flex';
        });

        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = `${progress}%`;
            currentTimeDisplay.textContent = formatTime(audio.currentTime);
        });

        audio.addEventListener('ended', () => {
            playButton.textContent = '▶';
            progressBar.style.width = '0%';
            currentTimeDisplay.textContent = '0:00';
        });
    }

    // Xử lý nút play/pause
    if (playButton) {
        playButton.addEventListener('click', () => {
            if (!audio) return;

            if (audio.paused) {
                audio.play();
                playButton.textContent = '❚❚';
            } else {
                audio.pause();
                playButton.textContent = '▶';
            }
        });
    }

    // Xóa file đã chọn
    if (clearUpload) {
        clearUpload.addEventListener('click', clearFileSelection);
    }

    function clearFileSelection() {
        if (songFile) songFile.value = '';
        if (fileDetails) fileDetails.style.display = 'none';
        if (audioPreview) audioPreview.style.display = 'none';

        if (audio) {
            audio.pause();
            audio = null;
        }
    }

    // === PHẦN XỬ LÝ MODAL ===

    // Mở modal
    if (shareBtn) {
        shareBtn.addEventListener("click", function () {
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
        });
    }

    // Đóng modal
    function closeModal() {
        if (modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", closeModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", closeModal);
    }

    // Đóng modal khi click bên ngoài
    window.addEventListener("click", function (event) {
        if (modal && event.target == modal) {
            closeModal();
        }
    });

    // Xử lý nút Share Now trong modal
    if (shareNowBtn) {
        shareNowBtn.addEventListener("click", function () {
            // Lấy thông tin từ modal
            const genre = document.getElementById("song-genre");
            const typeRadios = document.querySelector('input[name="song-type"]:checked');
            const era = document.getElementById("song-era");

            const genreValue = genre ? genre.value : 'other';
            const typeValue = typeRadios ? typeRadios.value : 'cover';
            const eraValue = era ? era.value : '20s';

            // Kiểm tra thông tin bắt buộc
            if (!genreValue || !eraValue) {
                showNotification("Vui lòng điền đầy đủ thông tin về thể loại và thời kỳ", "warning");
                return;
            }

            // Lưu thông tin vào biến metadata toàn cục
            window.songMetadata = {
                genre: genreValue,
                type: typeValue,
                era: eraValue
            };

            closeModal();
            showNotification("Đã lưu thông tin bài hát! Nhấn nút Upload Song để hoàn tất quá trình tải lên.", "success");
        });
    }
    // Giới hạn ký tự cho Title và Content
    const songTitleInput = document.getElementById('songTitle');
    const postContentTextarea = document.getElementById('postContent');

    // Kiểm tra và hiển thị thông báo khi người dùng vượt quá giới hạn ký tự
    songTitleInput.addEventListener('input', () => {
        const titleLength = songTitleInput.value.length;
        const titleLimit = 50;
        const titleLimitMessage = document.getElementById('songTitleLimit');
        if (titleLength >= titleLimit) {
            titleLimitMessage.style.color = 'red';
            titleLimitMessage.textContent = 'You have exceeded the max limit of 50 characters!';
        } else {
            titleLimitMessage.style.color = 'green';
            titleLimitMessage.textContent = `Max ${titleLimit - titleLength} characters left`;
        }
    });

    postContentTextarea.addEventListener('input', () => {
        const contentLength = postContentTextarea.value.length;
        const contentLimit = 300;
        const contentLimitMessage = document.getElementById('postContentLimit');
        if (contentLength >= contentLimit) {
            contentLimitMessage.style.color = 'red';
            contentLimitMessage.textContent = 'You have exceeded the max limit of 300 characters!';
        } else {
            contentLimitMessage.style.color = 'green';
            contentLimitMessage.textContent = `Max ${contentLimit - contentLength} characters left`;
        }
    });


    /*================Hàm xử lý upload ảnh ================== */

    // Image upload functionality
    const imageFile = document.getElementById('imageFile');
    const imageUploadTrigger = document.getElementById('imageUploadTrigger');
    const imageDropZone = document.getElementById('imageDropZone');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const imageFileName = document.getElementById('imageFileName');
    const imageFileSize = document.getElementById('imageFileSize');
    const clearImageUpload = document.getElementById('clearImageUpload');

    // Handle image upload button click
    if (imageUploadTrigger) {
        imageUploadTrigger.addEventListener('click', () => {
            if (imageFile) {
                imageFile.click();
            }
        });
    }

    // Handle selected image file
    if (imageFile) {
        imageFile.addEventListener('change', () => {
            if (imageFile.files.length > 0) {
                const file = imageFile.files[0];

                // Check file type
                const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
                if (!validImageTypes.includes(file.type)) {
                    showNotification('Please select a valid image file (.jpg, .jpeg, .png, .gif)', 'warning');
                    return;
                }

                // Check file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    showNotification('Image size must be less than 5MB', 'warning');
                    return;
                }

                // Update preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    imageFileName.textContent = file.name;
                    imageFileSize.textContent = formatFileSize(file.size);
                    imagePreview.style.display = 'flex';
                };
                reader.readAsDataURL(file);

                // Update UI
                imageDropZone.classList.add('has-file');
            }
        });
    }

    // Clear image selection
    if (clearImageUpload) {
        clearImageUpload.addEventListener('click', (e) => {
            e.stopPropagation();
            clearImageSelection();
        });
    }

    /*================Hàm xử lý upload ảnh song ================== */

    if (coverImageUploadTrigger) {
        coverImageUploadTrigger.addEventListener('click', () => {
            if (coverImageFile) coverImageFile.click();
        });
    }

    // Clear cover image selection
    function clearCoverImageSelection() {
        if (coverImageFile) coverImageFile.value = '';
        if (coverImagePreview) coverImagePreview.style.display = 'none';
        if (previewCoverImg) previewCoverImg.src = '';
        if (coverImageFileName) coverImageFileName.textContent = '';
        if (coverImageFileSize) coverImageFileSize.textContent = '';
    }

    // Handle cover image selection
    if (coverImageFile) {
        coverImageFile.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];

                // Check file type
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                if (!validTypes.includes(file.type)) {
                    showNotification('Please select a valid image file (JPG, JPEG, PNG, or GIF)', 'warning');
                    clearCoverImageSelection();
                    return;
                }

                // Check file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    showNotification('Image size must be less than 5MB', 'warning');
                    clearCoverImageSelection();
                    return;
                }

                // Update preview
                const reader = new FileReader();
                reader.onload = function (event) {
                    if (previewCoverImg) previewCoverImg.src = event.target.result;
                    if (coverImagePreview) coverImagePreview.style.display = 'flex';
                    if (coverImageFileName) coverImageFileName.textContent = file.name;
                    if (coverImageFileSize) coverImageFileSize.textContent = formatFileSize(file.size);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Handle clear button for cover image
    if (clearCoverImageUpload) {
        clearCoverImageUpload.addEventListener('click', (e) => {
            e.stopPropagation();
            clearCoverImageSelection();
        });
    }

    // === PHẦN XỬ LÝ UPLOAD ===

    // Variable for YouTube integration
    let youtubeConnected = false;
    let youtubeAccessToken = null;
    let youtubeUserInfo = null;

    // Xử lý khi nhấn nút Upload Song
    if (submitUpload) {
        submitUpload.addEventListener('click', async () => {
            // Các kiểm tra ban đầu
            if (!songFile || !songFile.files.length) {
                showNotification('Vui lòng chọn một file để tải lên', 'warning');
                return;
            }

            if (!songTitle || !songTitle.value) {
                showNotification('Vui lòng nhập tiêu đề cho bài hát', 'warning');
                return;
            }
            // Kiểm tra và giới hạn title
            if (songTitle.value.length > 50) {
                showNotification('Tiêu đề bài hát không được vượt quá 50 ký tự', 'warning');
                return;
            }

            if (!window.songMetadata || !window.songMetadata.genre || !window.songMetadata.era || !window.songMetadata.type) {
                showNotification("Vui lòng nhấn nút Share để nhập đầy đủ thông tin thể loại, era và type", "warning");
                return;
            }
            if (!coverImageFile || !coverImageFile.files.length) {
                showNotification("Vui lòng thêm cover image cho song", "warning");
                return;
            }

            // Kiểm tra xem có cần upload lên YouTube không
            // In your submitUpload event listener
            const uploadToYoutube = document.getElementById('upload-to-youtube').checked;
            if (uploadToYoutube && !youtubeConnected) {
                showNotification('Vui lòng kết nối với YouTube trước khi upload', 'warning');
                return;
            }

            // Lấy nội dung bài viết từ textarea
            const content = postContent ? (postContent.value || 'Đã tải lên bài hát: ' + songTitle.value) : 'Đã tải lên bài hát: ' + songTitle.value;
            if (content.length > 300) {
                showNotification('Nội dung bài viết không được vượt quá 300 ký tự', 'warning');
                return;
            }
            // Tạo FormData để gửi lên server
            const formData = new FormData();
            // Add this line to FormData
            formData.append('convertToMp4', uploadToYoutube ? 'true' : 'false');
            formData.append('file', songFile.files[0]);
            if (imageFile && imageFile.files && imageFile.files.length > 0) {
                formData.append('imageFile', imageFile.files[0]);
                console.log("Image appended:", imageFile.files[0].name);
            } else {
                console.log("No image selected");
            }
            if (coverImageFile && coverImageFile.files && coverImageFile.files.length > 0) {
                formData.append('coverImageFile', coverImageFile.files[0]);
                console.log("Cover image appended:", coverImageFile.files[0].name);
            } else {
                console.log("No cover image selected");
            }
            formData.append('title', songTitle.value);

            // Safely get artistId
            const artistIdElement = document.getElementById('artistId');
            formData.append('artistId', artistIdElement ? (artistIdElement.value || '1') : '1');

            formData.append('content', content);
            formData.append('genre', window.songMetadata.genre || 'other');
            formData.append('era', window.songMetadata.era || '20s');
            formData.append('type', window.songMetadata.type || 'cover');
          


            // Hiển thị trạng thái upload
            if (uploadStatus) uploadStatus.style.display = 'block';
            if (uploadMessage) uploadMessage.textContent = 'Đang tải bài hát lên...';
            if (uploadProgressBar) uploadProgressBar.style.width = '0%';

            try {
                // Xử lý upload lên YouTube nếu được yêu cầu
                let youtubeVideoInfo = null;
                if (uploadToYoutube && youtubeConnected) {
                    if (uploadMessage) uploadMessage.textContent = 'Đang tải lên YouTube...';

                    // Lấy metadata cho YouTube
                    const descriptionElement = document.getElementById('youtube-description');
                    const tagsElement = document.getElementById('youtube-tags');
                    const privacyRadio = document.querySelector('input[name="youtube-privacy"]:checked');

                    const ytMetadata = {
                        title: songTitle.value,
                        description: descriptionElement ? (descriptionElement.value || content) : content,
                        tags: tagsElement ? tagsElement.value : '',
                        privacy: privacyRadio ? privacyRadio.value : 'public'
                    };

                    // Upload to YouTube (if implemented)
                    try {
                        youtubeVideoInfo = await uploadToYouTube(songFile.files[0], ytMetadata);
                    } catch (ytError) {
                        console.error("YouTube upload failed:", ytError);
                        showNotification("YouTube upload failed: " + ytError.message, "error");
                    }

                    // If YouTube upload successful, save info in DB
                    if (youtubeVideoInfo) {
                        formData.append('youtubeUrl', youtubeVideoInfo.url);
                        formData.append('youtubeVideoId', youtubeVideoInfo.id);
                    }
                }

                // Continue with server upload
                if (uploadMessage) uploadMessage.textContent = 'Đang tải lên server...';

                // Create AJAX request
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/Song/Upload', true);

                // Handle upload progress
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable && uploadProgressBar) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        uploadProgressBar.style.width = percentComplete + '%';
                    }
                };

                // Handle request completion
                xhr.onload = function () {
                    if (xhr.status === 200) {
                        const response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            if (uploadMessage) uploadMessage.textContent = response.message;
                            if (uploadProgressBar) uploadProgressBar.style.width = '100%';

                            // Show success message
                            let successMessage = "Upload thành công!";
                            if (uploadToYoutube && youtubeVideoInfo) {
                                successMessage += " Bài hát cũng đã được tải lên YouTube.";
                            }
                            showNotification(successMessage, 'success');

                            // Reset form after successful upload
                            setTimeout(() => {
                                clearFileSelection();
                                if (songTitle) songTitle.value = '';
                                if (postContent) postContent.value = '';
                                window.songMetadata = {
                                    genre: '',
                                    type: 'cover',
                                    era: ''
                                };
                                if (uploadStatus) uploadStatus.style.display = 'none';

                                // Reset YouTube fields if present
                                const ytDescription = document.getElementById('youtube-description');
                                if (ytDescription) ytDescription.value = '';

                                const ytTags = document.getElementById('youtube-tags');
                                if (ytTags) ytTags.value = '';
                            }, 3000);
                        } else {
                            if (uploadMessage) uploadMessage.textContent = 'Upload thất bại: ' + response.message;
                            showNotification('Upload thất bại: ' + response.message, 'error');
                        }
                    } else {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (uploadMessage) uploadMessage.textContent = 'Upload thất bại: ' + response.message;
                            showNotification('Upload thất bại: ' + response.message, 'error');
                        } catch (e) {
                            if (uploadMessage) uploadMessage.textContent = 'Upload thất bại. Vui lòng thử lại.';
                            showNotification('Upload thất bại. Vui lòng thử lại.', 'error');
                        }
                    }
                };

                // Handle network errorsF
                xhr.onerror = function () {
                    if (uploadMessage) uploadMessage.textContent = 'Lỗi kết nối mạng. Vui lòng thử lại.';
                    showNotification('Lỗi kết nối mạng. Vui lòng thử lại.', 'error');
                };

                // Send request
                xhr.send(formData);
            } catch (error) {
                if (uploadMessage) uploadMessage.textContent = 'Lỗi: ' + error.message;
                showNotification('Lỗi: ' + error.message, 'error');
            }
        });
    }

    // === CÁC HÀM TIỆN ÍCH ===

    // Định dạng kích thước file
    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + ' bytes';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        } else {
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }
    }

    // Định dạng thời gian
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
});
function clearImageSelection() {
    if (imageFile) {
        imageFile.value = '';
    }
    if (imagePreview) {
        imagePreview.style.display = 'none';
    }
    if (imageDropZone) {
        imageDropZone.classList.remove('has-file');
    }
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

// Replace SoundCloud OAuth and API Integration with YouTube
let youtubeConnected = false;
let youtubeAccessToken = null;
let youtubeUserInfo = null;

const YOUTUBE_CLIENT_ID = '852976140693-oduglh7jqqvherl72khh8f3aouep2hlp.apps.googleusercontent.com';
const YOUTUBE_REDIRECT_URI = "https://localhost:7047/youtube-callback";
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';
// Add access_type=offline to get a refresh token
const YOUTUBE_SCOPES = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';


document.addEventListener('DOMContentLoaded', function () {
    // Add events for YouTube elements
    const uploadToYoutubeCheckbox = document.getElementById('upload-to-youtube');
    const connectYoutubeBtn = document.getElementById('connect-youtube');
    const disconnectYoutubeBtn = document.getElementById('disconnect-youtube');


    // Check if already authenticated with YouTube
    checkYouTubeAuth();

    // Event listeners
    if (uploadToYoutubeCheckbox) {
        uploadToYoutubeCheckbox.addEventListener('change', function () {
            const connectContainer = document.getElementById('connect-youtube-container');
            const youtubeInfo = document.getElementById('youtube-info');

            if (this.checked) {
                if (!youtubeConnected) {
                    if (connectContainer) connectContainer.style.display = 'block';
                } else {
                    if (youtubeInfo) youtubeInfo.style.display = 'block';
                }
            } else {
                if (youtubeInfo) youtubeInfo.style.display = 'none';
                if (connectContainer) connectContainer.style.display = 'none';
            }
        });
    }

    if (connectYoutubeBtn) {
        connectYoutubeBtn.addEventListener('click', initiateYouTubeAuth);
    }

    if (disconnectYoutubeBtn) {
        disconnectYoutubeBtn.addEventListener('click', disconnectYouTube);
    }

    // Check for callback from YouTube OAuth
    if (window.location.hash.includes('access_token')) {
        handleYouTubeCallback();
    }
});

// Check if token exists and is valid
function checkYouTubeAuth() {
    const token = localStorage.getItem('youtube_access_token');
    const expiry = localStorage.getItem('youtube_token_expiry');
    const refreshToken = localStorage.getItem('youtube_refresh_token');

    if (token && expiry) {
        // Check if token is still valid or needs refreshing
        if (new Date().getTime() < parseInt(expiry)) {
            // Token still valid
            youtubeAccessToken = token;
            youtubeConnected = true;
            fetchYouTubeUserInfo();

            // Display connected UI if checkbox is checked
            updateYoutubeUI(true);
        } else if (refreshToken) {
            // Token expired but we have a refresh token - attempt to refresh
            refreshYouTubeToken(refreshToken);
        } else {
            // Clear expired token with no refresh token
            clearYouTubeTokens();
        }
    }
}
async function getValidAccessToken() {
    const expiresAt = parseInt(localStorage.getItem("youtube_token_expiry"));
    const now = Date.now();

    if (now >= expiresAt) {
        console.log("Access token expired, refreshing...");
        const refreshToken = localStorage.getItem("youtube_refresh_token");

        if (!refreshToken) {
            console.error("No refresh token available");
            throw new Error("No refresh token available to refresh the access token");
        }

        try {
            const response = await fetch("/api/refresh-youtube-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Token refresh failed:", errorText);
                throw new Error(`Token refresh failed with status ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                localStorage.setItem("youtube_access_token", data.accessToken);
                localStorage.setItem("youtube_token_expiry", data.expiresAt);
                if (data.refreshToken) {
                    localStorage.setItem("youtube_refresh_token", data.refreshToken);
                }
                return data.accessToken;
            } else {
                throw new Error(data.message || "Refresh token failed");
            }
        } catch (error) {
            console.error("Token refresh error:", error);
            throw error;
        }
    }

    return localStorage.getItem("youtube_access_token");
}
function updateYoutubeUI(connected) {
    const checkbox = document.getElementById('upload-to-youtube');
    const youtubeInfo = document.getElementById('youtube-info');
    const connectContainer = document.getElementById('connect-youtube-container');

    if (connected) {
        if (checkbox && checkbox.checked && youtubeInfo && connectContainer) {
            youtubeInfo.style.display = 'block';
            connectContainer.style.display = 'none';
        }
    } else {
        if (youtubeInfo) youtubeInfo.style.display = 'none';
        if (connectContainer) connectContainer.style.display = 'block';
        if (youtubeInfo) {
            const youtubeAvatar = document.getElementById('youtube-avatar');
            const youtubeUsername = document.getElementById('youtube-username');
            const youtubeQuotaInfo = document.getElementById('youtube-quota-info');

            if (youtubeAvatar) youtubeAvatar.src = '';
            if (youtubeUsername) youtubeUsername.innerText = 'Not connected';
            if (youtubeQuotaInfo) youtubeQuotaInfo.innerText = 'Upload quota: N/A';
        }
    }
}
function clearYouTubeTokens() {
    localStorage.removeItem('youtube_access_token');
    localStorage.removeItem('youtube_refresh_token');
    localStorage.removeItem('youtube_token_expiry');
    youtubeAccessToken = null;
    youtubeConnected = false;
    youtubeUserInfo = null;
}

async function refreshYouTubeToken(refreshToken) {
    try {
        console.log("Attempting to refresh token...");

        const response = await fetch('/api/refresh-youtube-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        });

        const responseText = await response.text();
        let data;

        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse refresh token response:", responseText);
            throw new Error(`Invalid response from token refresh API: ${responseText.substring(0, 100)}...`);
        }

        if (!response.ok) {
            console.error("Token refresh failed with status:", response.status, data);
            throw new Error(data.message || "Token refresh failed");
        }

        if (data.success) {
            console.log("Token refreshed successfully");

            // Update tokens in memory and storage
            youtubeAccessToken = data.accessToken;
            youtubeConnected = true;

            localStorage.setItem('youtube_access_token', data.accessToken);
            localStorage.setItem('youtube_token_expiry', data.expiry);
            if (data.refreshToken) {
                localStorage.setItem('youtube_refresh_token', data.refreshToken);
            }

            // Update UI and fetch user info
            await fetchYouTubeUserInfo();
            updateYoutubeUI(true);

            return true;
        } else {
            throw new Error(data.message || "Token refresh failed without specific error");
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        clearYouTubeTokens();
        updateYoutubeUI(false);
        showNotification('YouTube authentication expired. Please reconnect.', 'warning');
        return false;
    }
}

// Initiate OAuth process with YouTube
function initiateYouTubeAuth() {
    try {
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth` +
            `?client_id=${YOUTUBE_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT_URI)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(YOUTUBE_SCOPES)}` +
            `&access_type=offline` +
            `&prompt=consent`;

        console.log("Opening OAuth window with URL:", authUrl);

        // Open popup for login
        const width = 600;
        const height = 800;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        const authWindow = window.open(
            authUrl,
            'YouTube Authorization',
            `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
        );

        if (!authWindow) {
            showNotification('Popup blocked. Please allow popups for this site to connect with YouTube.', 'error');
            return;
        }

        // Set up message listener for communication from popup
        const messageHandler = function (event) {
            if (event.data && event.data.type === 'youtube_auth_success') {
                console.log("Received successful auth message from popup");

                // Remove event listener to prevent memory leaks
                window.removeEventListener('message', messageHandler);

                // Store tokens and expiry
                youtubeAccessToken = event.data.accessToken;
                youtubeConnected = true;

                // Save tokens to localStorage
                localStorage.setItem('youtube_access_token', event.data.accessToken);
                localStorage.setItem('youtube_refresh_token', event.data.refreshToken);
                localStorage.setItem('youtube_token_expiry', event.data.expiresAt);

                // Get user info
                fetchYouTubeUserInfo();

                // Update UI
                const checkbox = document.getElementById('upload-to-youtube');
                if (checkbox) checkbox.checked = true;

                showNotification('Đã kết nối với YouTube thành công', 'success');
            } else if (event.data && event.data.type === 'youtube_auth_error') {
                window.removeEventListener('message', messageHandler);
                showNotification('YouTube authentication failed: ' + event.data.error, 'error');
            }
        };

        window.addEventListener('message', messageHandler, false);

        // Set a timeout to detect if the popup was closed without authentication
        setTimeout(() => {
            if (authWindow.closed && !youtubeConnected) {
                window.removeEventListener('message', messageHandler);
                showNotification('YouTube authentication was canceled or failed', 'warning');
            }
        }, 1000 * 60); // 1 minute timeout
    } catch (error) {
        console.error("Error initiating YouTube auth:", error);
        showNotification('Failed to start YouTube authentication: ' + error.message, 'error');
    }
}
// Handle callback from YouTube after login
function handleYouTubeCallback() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');

    if (accessToken) {
        youtubeAccessToken = accessToken;
        youtubeConnected = true;

        // Save token to localStorage with expiry (1 hour)
        const expiry = new Date().getTime() + 3600000;
        localStorage.setItem('youtube_access_token', accessToken);
        localStorage.setItem('youtube_token_expiry', expiry.toString());

        // Get user info
        fetchYouTubeUserInfo();

        // Remove hash from URL
        history.replaceState(null, document.title, window.location.pathname);
    }
}
function handleYouTubeCallbackInPopup() {
    // Get the authorization code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');

    if (authCode) {
        // Exchange code for tokens
        document.body.innerHTML = '<p>Authenticating with YouTube...</p>';

        fetch('/api/exchange-youtube-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: authCode, redirectUri: YOUTUBE_REDIRECT_URI })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Send tokens back to parent window
                    window.opener.postMessage({
                        type: 'youtube_auth_success',
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken,
                        expiresAt: data.expiresAt
                    }, window.location.origin);

                    setTimeout(() => window.close(), 500);
                } else {
                    document.body.innerHTML = '<p>Authentication failed. Please try again.</p>';
                }
            })
            .catch(error => {
                console.error('Error exchanging code for tokens:', error);
                document.body.innerHTML = '<p>Authentication error. Please try again.</p>';
            });
    } else {
        document.body.innerHTML = '<p>Authentication failed. No authorization code received.</p>';
    }
}
// Disconnect from YouTube
function disconnectYouTube() {
    localStorage.removeItem('youtube_access_token');
    localStorage.removeItem('youtube_token_expiry');

    youtubeAccessToken = null;
    youtubeConnected = false;
    youtubeUserInfo = null;

    const youtubeInfo = document.getElementById('youtube-info');
    const connectContainer = document.getElementById('connect-youtube-container');
    const youtubeAvatar = document.getElementById('youtube-avatar');
    const youtubeUsername = document.getElementById('youtube-username');
    const youtubeQuotaInfo = document.getElementById('youtube-quota-info');

    if (youtubeInfo) youtubeInfo.style.display = 'none';
    if (connectContainer) connectContainer.style.display = 'block';
    if (youtubeAvatar) youtubeAvatar.src = '';
    if (youtubeUsername) youtubeUsername.innerText = 'Not connected';
    if (youtubeQuotaInfo) youtubeQuotaInfo.innerText = 'Upload quota: N/A';

    clearYouTubeTokens();
    updateYoutubeUI(false);
    showNotification('Đã ngắt kết nối với YouTube', 'info');
}

// Get YouTube user info
async function fetchYouTubeUserInfo() {
    if (!youtubeAccessToken) return;

    try {
        const response = await fetch(`${YOUTUBE_API_URL}/channels?part=snippet&mine=true&access_token=${youtubeAccessToken}`);

        if (response.ok) {
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                youtubeUserInfo = data.items[0];
                const channelInfo = data.items[0].snippet;

                // Display user info
                const youtubeUsername = document.getElementById('youtube-username');
                const youtubeAvatar = document.getElementById('youtube-avatar');

                if (youtubeUsername) youtubeUsername.innerText = channelInfo.title;
                if (youtubeAvatar) youtubeAvatar.src = channelInfo.thumbnails.default.url || '/img/default-youtube.png';

                // Check upload limits
                checkYouTubeQuota();

                // Show successful connection UI
                const youtubeInfo = document.getElementById('youtube-info');
                const connectContainer = document.getElementById('connect-youtube-container');

                if (youtubeInfo) youtubeInfo.style.display = 'block';
                if (connectContainer) connectContainer.style.display = 'none';

                showNotification('Đã kết nối với YouTube thành công', 'success');
            }
        } else {
            throw new Error('Failed to fetch user data');
        }
    } catch (error) {
        console.error('Error fetching YouTube user data:', error);
        showNotification('Không thể lấy thông tin YouTube. Vui lòng kết nối lại.', 'error');
        disconnectYouTube();
    }
}

// Check YouTube upload quota
async function checkYouTubeQuota() {
    if (!youtubeAccessToken || !youtubeUserInfo) return;

    try {
        // Get quota information (this endpoint is hypothetical - actual implementation depends on YouTube's API structure)
        const response = await fetch(`${YOUTUBE_API_URL}/channels?part=statistics&mine=true&access_token=${youtubeAccessToken}`);

        if (response.ok) {
            const data = await response.json();

            // Display quota info (YouTube has daily upload limits)
            const quotaInfo = document.getElementById('youtube-quota-info');
            if (quotaInfo) {
                quotaInfo.innerText = `Quota status: Available for uploads`;
            }
        } else {
            const quotaInfo = document.getElementById('youtube-quota-info');
            if (quotaInfo) {
                quotaInfo.innerText = `Couldn't retrieve quota information`;
            }
        }
    } catch (error) {
        console.error('Error checking quota:', error);
        const quotaInfo = document.getElementById('youtube-quota-info');
        if (quotaInfo) {
            quotaInfo.innerText = `Couldn't retrieve quota information`;
        }
    }
}

// Function to convert MP3 to MP4 (client-side conversion)
// Hàm chuyển đổi MP3 sang MP4 (phía client)
async function convertMP3ToMP4(mp3File) {
    try {
        showNotification('Đang chuyển đổi từ MP3 sang MP4 thông qua API...', 'info');
        console.log(`Đang chuyển đổi file: ${mp3File.name}, Kích thước: ${mp3File.size} bytes`);

        // Tạo FormData object
        const formData = new FormData();
        formData.append('audioFile', mp3File);

        // Gửi đến endpoint máy chủ sử dụng API
        const response = await fetch('/api/convert-to-mp4', {
            method: 'POST',
            body: formData
        });

        const responseText = await response.text();
        let result;

        try {
            // Cố gắng phân tích kết quả dưới dạng JSON
            result = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('Không thể phân tích response JSON:', responseText);
            throw new Error(`API trả về dữ liệu không hợp lệ: ${responseText.substring(0, 100)}...`);
        }

        if (!response.ok) {
            throw new Error(`Lỗi API (${response.status}): ${result.message || responseText}`);
        }

        if (result.success) {
            showNotification('Chuyển đổi sang MP4 thành công', 'success');
            console.log(`MP4 URL: ${result.mp4Url}, Kích thước: ${result.fileSize || 'không xác định'} bytes`);
            return result.mp4Url;
        } else {
            throw new Error(result.message || 'Chuyển đổi thất bại');
        }
    } catch (error) {
        console.error('Lỗi khi chuyển đổi MP3 sang MP4:', error);
        showNotification(`Lỗi chuyển đổi: ${error.message}`, 'error');
        return null;
    }
}
// Upload to YouTube
async function uploadToYouTube(file, metadata) {
    if (!youtubeConnected) {
        showNotification('Cannot upload to YouTube. Please check your connection.', 'error');
        return null;
    }

    try {
        // Get a valid access token (will refresh if needed)
        let validAccessToken;
        try {
            validAccessToken = await getValidAccessToken();
        } catch (tokenError) {
            console.error("Failed to get valid access token:", tokenError);
            showNotification('YouTube authentication expired. Please reconnect.', 'error');
            clearYouTubeTokens();
            updateYoutubeUI(false);
            return null;
        }

        // Verify we have a valid token before proceeding
        if (!validAccessToken) {
            showNotification('YouTube authentication failed. Please reconnect.', 'error');
            clearYouTubeTokens();
            updateYoutubeUI(false);
            return null;
        }

        // Check if file is audio and needs conversion
        let uploadFile = file;
        let mp4Url = null;

        if (file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3') ||
            file.type === 'audio/x-m4a' || file.name.toLowerCase().endsWith('.m4a') ||
            file.type === 'audio/wav' || file.name.toLowerCase().endsWith('.wav') ||
            file.type === 'audio/aac' || file.name.toLowerCase().endsWith('.aac')) {

            showNotification('Converting audio file to video format...', 'info');
            mp4Url = await convertMP3ToMP4(file);

            if (!mp4Url) {
                showNotification("Converting audio to MP4 failed. Cannot proceed with YouTube upload.", "error");
                return null;
            }

            uploadFile = mp4Url;
        }

        // Create metadata for YouTube upload
        const videoMetadata = {
            snippet: {
                title: metadata.title,
                description: metadata.description || '',
                tags: metadata.tags ? metadata.tags.split(',').map(tag => tag.trim()) : [],
                categoryId: '10' // Music category
            },
            status: {
                privacyStatus: metadata.privacy || 'public',
                license: 'youtube'
            }
        };

        // Upload to YouTube
        showNotification('Uploading to YouTube...', 'info');

        const formData = new FormData();

        // If we have a URL instead of a file object (from successful conversion)
        if (typeof uploadFile === 'string' && uploadFile.startsWith('/')) {
            // Load file from server
            console.log(`Loading converted file from: ${uploadFile}`);
            const fileResponse = await fetch(uploadFile);

            if (!fileResponse.ok) {
                throw new Error(`Cannot load converted file: ${fileResponse.status} ${fileResponse.statusText}`);
            }

            const fileBlob = await fileResponse.blob();
            const fileName = mp4Url.split('/').pop() || 'video.mp4';

            console.log(`Loaded blob file, size: ${fileBlob.size} bytes`);
            formData.append('videoFile', fileBlob, fileName);
        } else {
            // Use original file
            formData.append('videoFile', uploadFile);
        }

        formData.append('metadata', JSON.stringify(videoMetadata));
        formData.append('accessToken', validAccessToken);

        // Also include the refresh token if available
        const refreshToken = localStorage.getItem('youtube_refresh_token');
        if (refreshToken) {
            formData.append('refreshToken', refreshToken);
        }

        console.log('Sending YouTube upload request...');
        const response = await fetch('/api/youtube-upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const videoData = await response.json();
            showNotification('Successfully uploaded to YouTube', 'success');
            return videoData;
        } else {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                const errorText = await response.text();
                throw new Error(`Upload error (${response.status}): ${errorText}`);
            }

            throw new Error(errorData.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Error uploading to YouTube:', error);
        showNotification(`YouTube upload error: ${error.message}`, 'error');
        return null;
    }
}







