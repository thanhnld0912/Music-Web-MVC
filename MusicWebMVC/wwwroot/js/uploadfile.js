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

    // Biến lưu trữ thông tin metadata từ modal
    let songMetadata = {
        genre: '',
        type: 'cover', // Giá trị mặc định
        era: ''

    };

    // === PHẦN XỬ LÝ FILE NHẠC ===

    // Khi click vào icon upload
    uploadTrigger.addEventListener('click', () => {
        songFile.click();
    });

    // Hỗ trợ kéo thả file (drag & drop)
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

    // Khi chọn file qua input
    songFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

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

    // Xóa file đã chọn
    clearUpload.addEventListener('click', clearFileSelection);

    function clearFileSelection() {
        songFile.value = '';
        fileDetails.style.display = 'none';
        audioPreview.style.display = 'none';

        if (audio) {
            audio.pause();
            audio = null;
        }
    }

    // === PHẦN XỬ LÝ MODAL ===

    // Mở modal
    shareBtn.addEventListener("click", function () {
        modal.style.display = "block";
        document.body.style.overflow = "hidden";
    });

    // Đóng modal
    function closeModal() {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    // Đóng modal khi click bên ngoài
    window.addEventListener("click", function (event) {
        if (event.target == modal) {
            closeModal();
        }
    });

    // Xử lý nút Share Now trong modal
    shareNowBtn.addEventListener("click", function () {
        // Lấy thông tin từ modal
        const genre = document.getElementById("song-genre").value;
        const type = document.querySelector('input[name="song-type"]:checked').value;
        const era = document.getElementById("song-era").value;


        // Kiểm tra thông tin bắt buộc
        if (!genre || !era) {
            showNotification("Vui lòng điền đầy đủ thông tin về thể loại và thời kỳ", "warning");
            return;
        }

        // Lưu thông tin vào biến metadata để sử dụng khi upload
        songMetadata = {
            genre: genre,
            type: type,
            era: era

        };

        closeModal();
        showNotification("Đã lưu thông tin bài hát! Nhấn nút Upload Song để hoàn tất quá trình tải lên.", "success");
    });

    // === PHẦN XỬ LÝ UPLOAD ===

    // Xử lý khi nhấn nút Upload Song
    submitUpload.addEventListener('click', async () => {
        // Kiểm tra đã chọn file chưa
        if (!songFile.files.length) {
            showNotification('Vui lòng chọn một file để tải lên', 'warning');
            return;
        }

        // Kiểm tra đã nhập tiêu đề chưa
        if (!songTitle.value) {
            showNotification('Vui lòng nhập tiêu đề cho bài hát', 'warning');
            return;
        }

        // Kiểm tra đã nhập thông tin metadata chưa
        if (!songMetadata.genre || !songMetadata.era) {
            showNotification("Vui lòng nhấn nút Share để nhập thông tin thể loại và thời kỳ", "warning");
            return;
        }

        // Lấy nội dung bài viết từ textarea
        const content = postContent.value || 'Đã tải lên bài hát: ' + songTitle.value;

        // Tạo FormData để gửi lên server
        const formData = new FormData();
        formData.append('file', songFile.files[0]);
        formData.append('title', songTitle.value);
        formData.append('artistId', document.getElementById('artistId').value || '1');
        formData.append('content', content);
        formData.append('genre', songMetadata.genre);
        formData.append('era', songMetadata.era);
        formData.append('type', songMetadata.type);



        // Hiển thị trạng thái upload
        uploadStatus.style.display = 'block';
        uploadMessage.textContent = 'Đang tải bài hát lên...';
        uploadProgressBar.style.width = '0%';

        try {
            // Tạo request AJAX
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/Song/Upload', true);

            // Xử lý tiến trình upload
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    uploadProgressBar.style.width = percentComplete + '%';
                }
            };

            // Xử lý khi hoàn thành request
            xhr.onload = function () {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        uploadMessage.textContent = response.message;
                        uploadProgressBar.style.width = '100%';

                        // Reset form sau khi upload thành công
                        setTimeout(() => {
                            clearFileSelection();
                            songTitle.value = '';
                            postContent.value = '';
                            songMetadata = {
                                genre: '',
                                type: 'cover',
                                era: ''

                            };
                            uploadStatus.style.display = 'none';
                        }, 3000);
                    } else {
                        uploadMessage.textContent = 'Upload thất bại: ' + response.message;
                    }
                } else {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        uploadMessage.textContent = 'Upload thất bại: ' + response.message;
                    } catch (e) {
                        uploadMessage.textContent = 'Upload thất bại. Vui lòng thử lại.';
                    }
                }
            };

            // Xử lý khi có lỗi network
            xhr.onerror = function () {
                uploadMessage.textContent = 'Lỗi kết nối mạng. Vui lòng thử lại.';
            };

            // Gửi request
            xhr.send(formData);
        } catch (error) {
            uploadMessage.textContent = 'Lỗi: ' + error.message;
        }
    });

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