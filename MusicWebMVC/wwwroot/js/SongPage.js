/*songpage */

document.addEventListener('DOMContentLoaded', function () {
    const currentUserId = document.getElementById('current-user-id').value;
    const postId = document.getElementById('post-id').value;
    const likeButton = document.querySelector('.like-btn');
    const likeCountElement = document.getElementById('like-count');

    // Load all comment counts when page loads
    loadAllCommentCounts();

    // Create notification modal
    createNotificationModal();

    // Handle Enter key for comments
    const commentInput = document.getElementById('comment-input');
    if (commentInput) {
        commentInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                submitComment(e);
            }
        });
    }

    // Audio Player Event Listeners
    const playButton = document.getElementById('play-button');
    const playIcon = document.getElementById('play-icon');
    const audioPlayer = document.getElementById('audio-player');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress');
    const timeDisplay = document.querySelector('.time-display');
    const durationDisplay = document.querySelector('.duration');

    // Time formatting function
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
    }

    // Like Functionality
    function checkInitialLikeStatus() {
        if (!currentUserId || currentUserId === "") return;

        const xhr = new XMLHttpRequest();
        xhr.open("GET", `/Post/CheckLikeStatus/${postId}`, true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const isLiked = JSON.parse(xhr.responseText);
                    if (isLiked) {
                        // Ensure the like button gets the 'active' class
                        likeButton.classList.add('active');
                    } else {
                        // Explicitly remove 'active' class if not liked
                        likeButton.classList.remove('active');
                    }
                } else {
                    console.error("Error checking like status:", xhr.responseText);
                }
            }
        };

        xhr.send();
    }

    // Call this function when page loads
    checkInitialLikeStatus();

    function toggleLike(button) {
        if (!currentUserId || currentUserId === "") {
            showNotification("Vui lòng đăng nhập để thích bài hát", "warning");
            return;
        }

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/Post/LikePost/${postId}?type=post`, true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);

                    if (response.message === "Like removed successfully") {
                        // Explicitly remove active class
                        button.classList.remove('active');

                        // Update like count
                        let currentLikeCount = parseInt(likeCountElement.textContent.replace('K', '')) || 0;
                        currentLikeCount = Math.max(0, currentLikeCount - 1);

                        likeCountElement.textContent = currentLikeCount >= 1000
                            ? `${(currentLikeCount / 1000).toFixed(1)}K`
                            : currentLikeCount;

                        showNotification("Đã bỏ thích bài hát", "info");
                    }
                    else if (response.message === "Liked successfully") {
                        // Explicitly add active class
                        button.classList.add('active');

                        // Update like count
                        let currentLikeCount = parseInt(likeCountElement.textContent.replace('K', '')) || 0;
                        currentLikeCount += 1;

                        likeCountElement.textContent = currentLikeCount >= 1000
                            ? `${(currentLikeCount / 1000).toFixed(1)}K`
                            : currentLikeCount;

                        showNotification("Đã thích bài hát", "success");
                    }
                } else {
                    console.error("Lỗi khi thích bài hát:", xhr.responseText);
                    showNotification("Không thể thích bài hát. Vui lòng thử lại sau.", "error");
                }
            }
        };

        xhr.send(JSON.stringify(parseInt(currentUserId)));
    }

    // Audio Player Methods
    if (audioPlayer) {
        audioPlayer.addEventListener('timeupdate', function () {
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (timeDisplay) timeDisplay.textContent = formatTime(audioPlayer.currentTime);
        });

        audioPlayer.addEventListener('loadedmetadata', function () {
            if (durationDisplay) durationDisplay.textContent = formatTime(audioPlayer.duration);
        });

        // Play/Pause Event Listener
        if (playButton) {
            playButton.addEventListener('click', function () {
                if (audioPlayer.paused) {
                    audioPlayer.play();
                    playIcon.classList.remove('fa-play');
                    playIcon.classList.add('fa-pause');
                } else {
                    audioPlayer.pause();
                    playIcon.classList.remove('fa-pause');
                    playIcon.classList.add('fa-play');
                }
            });
        }

        // Progress Bar Seeking
        if (progressContainer) {
            progressContainer.addEventListener('click', function (e) {
                const rect = this.getBoundingClientRect();
                const clickPosition = (e.clientX - rect.left) / rect.width;
                audioPlayer.currentTime = clickPosition * audioPlayer.duration;
            });
        }

        // Audio End Event
        audioPlayer.addEventListener('ended', function () {
            audioPlayer.currentTime = 0;
            playIcon.classList.remove('fa-pause');
            playIcon.classList.add('fa-play');
        });
    }

    // Volume Control Functions
    function changeVolume(value) {
        const audio = document.getElementById('audio-player');
        const volumeIcon = document.getElementById('volume-icon');

        if (audio) {
            audio.volume = value;

            if (value == 0) {
                volumeIcon.className = 'fas fa-volume-mute';
            } else if (value < 0.5) {
                volumeIcon.className = 'fas fa-volume-down';
            } else {
                volumeIcon.className = 'fas fa-volume-up';
            }
        }
    }

    function toggleMute() {
        const volumeSlider = document.getElementById('volume-slider');
        const audio = document.getElementById('audio-player');
        const volumeIcon = document.getElementById('volume-icon');

        if (audio) {
            if (audio.volume > 0) {
                volumeSlider.value = 0;
                audio.volume = 0;
                volumeIcon.className = 'fas fa-volume-mute';
            } else {
                volumeSlider.value = 1;
                audio.volume = 1;
                volumeIcon.className = 'fas fa-volume-up';
            }
        }
    }

    // Comment Submission
    // Updated submitComment function to include edit, delete, report buttons
    function submitComment(event) {
        const commentInput = document.getElementById('comment-input');
        const commentsSection = document.getElementById('comments-section');
        const commentText = commentInput.value.trim();

        if (!currentUserId) {
            showNotification("Vui lòng đăng nhập để bình luận", "warning");
            return;
        }

        if (commentText) {
            const commentData = {
                content: commentText,
                userId: currentUserId
            };

            const xhr = new XMLHttpRequest();
            xhr.open("POST", `/Post/AddComment/${postId}`, true);
            xhr.setRequestHeader("Content-Type", "application/json");

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            const newComment = JSON.parse(xhr.responseText);

                            // Create new comment element with action buttons
                            const commentItem = document.createElement('div');
                            commentItem.className = 'comment';
                            commentItem.setAttribute('data-comment-id', newComment.id);

                            // Check if this is the current user's comment to show edit/delete buttons
                            const isCurrentUserComment = currentUserId == newComment.userId;

                            // Generate action buttons based on user ownership
                            let actionButtons = '';
                            if (isCurrentUserComment) {
                                actionButtons = `
                                <div class="comment-actions">
                                    <span class="comment-action edit-comment-btn" onclick="showEditCommentForm(${newComment.id})">
                                        <i class="fas fa-edit"></i> Edit
                                    </span>
                                    <span class="comment-action delete-comment-btn" onclick="confirmDeleteComment(${newComment.id})">
                                        <i class="fas fa-trash"></i> Delete
                                    </span>
                                </div>
                            `;
                            } else {
                                actionButtons = `
                                <div class="comment-actions">
                                    <span class="comment-action report-comment-btn" onclick="showReportCommentForm(${newComment.id})">
                                        <i class="fas fa-flag"></i> Report
                                    </span>
                                </div>
                            `;
                            }

                            commentItem.innerHTML = `
                            <div class="left-comment-user">
                                <div class="user-icon-commentcontent">${newComment.userName[0] || 'A'}</div>
                            </div>
                            <div class="comment-user">
                                <div class="comment-username">
                                    <p>${newComment.userName}</p>
                                </div>
                                <div class="comment-content">
                                    <p id="comment-text-${newComment.id}">${newComment.content}</p>
                                    <div class="comment-meta">
                                        <span class="comment-time">${new Date(newComment.createdAt).toLocaleString()}</span>
                                        ${actionButtons}
                                    </div>
                                    <!-- Edit form (hidden by default) -->
                                    <div class="edit-form" id="edit-form-${newComment.id}" style="display: none;">
                                        <textarea class="edit-comment-textarea">${newComment.content}</textarea>
                                        <div class="edit-buttons">
                                            <button class="cancel-edit-btn" onclick="cancelEditComment(${newComment.id})">Cancel</button>
                                            <button class="save-edit-btn" onclick="saveCommentEdit(${newComment.id})">Save</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;

                            commentsSection.appendChild(commentItem);
                            commentInput.value = '';
                            showNotification("Bình luận đã được đăng", "success");
                        } catch (error) {
                            console.error("Lỗi khi phân tích phản hồi:", error);
                            showNotification("Lỗi khi đăng bình luận", "error");
                        }
                    } else {
                        console.error("Lỗi khi thêm bình luận:", xhr.responseText);
                        showNotification("Không thể thêm bình luận. Vui lòng thử lại sau.", "error");
                    }
                }
            };

            xhr.send(JSON.stringify(commentData));
        }
    }

    // Add these new functions to handle edit, delete and report
    function showEditCommentForm(commentId) {
    // Try to find the edit form with either class
    const editForm = document.getElementById(`edit-form-${commentId}`);
    if (!editForm) {
        console.error(`Edit form not found for comment ${commentId}`);
        return;
    }
    
    // Find comment text using both possible selectors
    const commentText = document.getElementById(`comment-text-${commentId}`) || 
                       document.querySelector(`.comment[data-comment-id="${commentId}"] .comment-content p`);
    
    // Hide text, show form
    if (commentText) commentText.style.display = 'none';
    editForm.style.display = 'block';
}

// Also update cancelEditComment to handle both form types
function cancelEditComment(commentId) {
    const editForm = document.getElementById(`edit-form-${commentId}`);
    if (!editForm) {
        console.error(`Edit form not found for comment ${commentId}`);
        return;
    }
    
    const commentText = document.getElementById(`comment-text-${commentId}`) || 
                       document.querySelector(`.comment[data-comment-id="${commentId}"] .comment-content p`);
    
    if (commentText) commentText.style.display = 'block';
    editForm.style.display = 'none';
}

    function saveCommentEdit(commentId) {
        // Try to find the textarea in different possible locations
        const editTextarea = document.querySelector(`#edit-form-${commentId} .edit-comment-textarea`) ||
            document.querySelector(`.comment-edit-form#edit-form-${commentId} textarea`);

        if (!editTextarea) {
            console.error(`Edit textarea not found for comment ${commentId}`);
            showNotification("Không thể tìm thấy nội dung chỉnh sửa", "error");
            return;
        }

        const newContent = editTextarea.value.trim();

        if (!newContent) {
            showNotification("Bình luận không được để trống", "warning");
            return;
        }

        const editData = {
            userId: currentUserId,
            content: newContent
        };

        // Send AJAX request to update the comment
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/Post/EditComment/${commentId}`, true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        // Try to find the comment text element in different possible formats
                        const commentTextEl = document.getElementById(`comment-text-${commentId}`) ||
                            document.querySelector(`.comment[data-comment-id="${commentId}"] .comment-content p`);

                        if (commentTextEl) {
                            commentTextEl.textContent = newContent;

                            // Hide the edit form
                            cancelEditComment(commentId);

                            showNotification("Bình luận đã được cập nhật", "success");
                        } else {
                            console.error(`Comment text element not found for comment ${commentId}`);
                            showNotification("Bình luận đã được cập nhật, vui lòng làm mới trang", "info");
                        }
                    } catch (error) {
                        console.error("Lỗi khi cập nhật bình luận:", error);
                        showNotification("Không thể cập nhật bình luận", "error");
                    }
                } else {
                    console.error("Lỗi khi cập nhật bình luận:", xhr.responseText);
                    showNotification("Không thể cập nhật bình luận", "error");
                }
            }
        };

        xhr.send(JSON.stringify(editData));
    }
    function confirmDeleteComment(commentId) {
        if (confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
            deleteComment(commentId);
        }
    }

    function deleteComment(commentId) {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/Post/DeleteComment/${commentId}`, true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    // Remove the comment from the DOM
                    const commentElement = document.querySelector(`.comment[data-comment-id="${commentId}"]`);
                    if (commentElement) {
                        commentElement.remove();
                    }

                    showNotification("Bình luận đã được xóa", "success");
                } else {
                    console.error("Lỗi khi xóa bình luận:", xhr.responseText);
                    showNotification("Không thể xóa bình luận", "error");
                }
            }
        };

        xhr.send(JSON.stringify(currentUserId));
    }

    function showReportCommentForm(commentId) {
        // Create a modal for reporting
        const reportModal = document.createElement('div');
        reportModal.className = 'report-modal';
        reportModal.id = 'report-modal';

        reportModal.innerHTML = `
            <div class="report-container">
                <div class="report-header">
                    <h3>Report Comment</h3>
                    <button class="close-report-btn" onclick="closeReportForm()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="report-body">
                    <p>Please select a reason for reporting this comment:</p>
                    <select id="report-reason">
                        <option value="spam">Spam</option>
                        <option value="harassment">Harassment</option>
                        <option value="inappropriate">Inappropriate content</option>
                        <option value="offensive">Offensive language</option>
                        <option value="other">Other</option>
                    </select>
                    <textarea id="report-details" placeholder="Additional details (optional)"></textarea>
                </div>
                <div class="report-footer">
                    <button class="cancel-btn" onclick="closeReportForm()">Cancel</button>
                    <button class="report-btn" onclick="submitReport(${commentId})">Submit Report</button>
                </div>
            </div>
        `;

        document.body.appendChild(reportModal);
    }


    function submitReport(commentId) {
        // Get reason from select element
        const reasonSelect = document.getElementById('report-reason');
        const details = document.getElementById('report-details');

        if (!reasonSelect) {
            showNotification("Không thể lấy lý do báo cáo", "error");
            return;
        }

        const reason = reasonSelect.value;
        const additionalDetails = details ? details.value.trim() : '';

        if (!reason) {
            showNotification("Vui lòng chọn lý do báo cáo", "warning");
            return;
        }

        // Format reason with any additional details
        const finalReason = additionalDetails
            ? `${reason}: ${additionalDetails}`
            : reason;

        // Prepare report data
        const reportData = {
            userId: currentUserId,
            reason: finalReason
        };

        // Send AJAX request to report the comment
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/Post/ReportComment/${commentId}`, true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    closeReportForm();
                    showNotification("Đã gửi báo cáo bình luận", "success");
                } else if (xhr.status === 400) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.message && response.message.includes("already reported")) {
                            showNotification("Bạn đã báo cáo bình luận này rồi", "warning");
                        } else {
                            showNotification(response.message || "Không thể báo cáo bình luận", "error");
                        }
                    } catch (e) {
                        showNotification("Không thể báo cáo bình luận", "error");
                    }
                    closeReportForm();
                } else {
                    console.error("Lỗi khi báo cáo bình luận:", xhr.responseText);
                    showNotification("Không thể báo cáo bình luận", "error");
                }
            }
        };

        xhr.send(JSON.stringify(reportData));
    }


    // When the page loads, we need to update all existing comments to have the action buttons
    document.addEventListener('DOMContentLoaded', function () {
        // Process existing comments to add action buttons
        const existingComments = document.querySelectorAll('.comment');

        existingComments.forEach(comment => {
            const commentId = comment.getAttribute('data-comment-id');
            if (!commentId) return;

            // Get the userId from a data attribute (need to add this to the HTML)
            // or make an AJAX call to get the comment owner
            const commentUserId = comment.getAttribute('data-user-id');
            const commentContent = comment.querySelector('.comment-content p');
            const commentMeta = comment.querySelector('.comment-meta');

            if (commentMeta && commentContent) {
                // Check if this comment belongs to the current user
                const isCurrentUserComment = currentUserId && commentUserId && currentUserId == commentUserId;

                // Create action buttons container if it doesn't exist
                let actionsContainer = commentMeta.querySelector('.comment-actions');
                if (!actionsContainer) {
                    actionsContainer = document.createElement('div');
                    actionsContainer.className = 'comment-actions';
                    commentMeta.appendChild(actionsContainer);
                } else {
                    // Clear existing actions
                    actionsContainer.innerHTML = '';
                }

                // Add appropriate action buttons
                if (isCurrentUserComment) {
                    actionsContainer.innerHTML = `
                    <span class="comment-action edit-comment-btn" onclick="showEditCommentForm(${commentId})">
                        <i class="fas fa-edit"></i> Edit
                    </span>
                    <span class="comment-action delete-comment-btn" onclick="confirmDeleteComment(${commentId})">
                        <i class="fas fa-trash"></i> Delete
                    </span>
                `;
                } else {
                    actionsContainer.innerHTML = `
                    <span class="comment-action report-comment-btn" onclick="showReportCommentForm(${commentId})">
                        <i class="fas fa-flag"></i> Report
                    </span>
                `;
                }

                // Add edit form if it doesn't exist
                if (!comment.querySelector(`.edit-form`)) {
                    const contentText = commentContent.textContent || '';
                    commentContent.id = `comment-text-${commentId}`;

                    const editForm = document.createElement('div');
                    editForm.className = 'edit-form';
                    editForm.id = `edit-form-${commentId}`;
                    editForm.style.display = 'none';
                    editForm.innerHTML = `
                    <textarea class="edit-comment-textarea">${contentText}</textarea>
                    <div class="edit-buttons">
                        <button class="cancel-edit-btn" onclick="cancelEditComment(${commentId})">Cancel</button>
                        <button class="save-edit-btn" onclick="saveCommentEdit(${commentId})">Save</button>
                    </div>
                `;

                    commentContent.after(editForm);
                }
            }
        });
    });

    // Make sure to expose the new functions for inline event handlers
    window.showEditCommentForm = showEditCommentForm;
    window.cancelEditComment = cancelEditComment;
    window.saveCommentEdit = saveCommentEdit;
    window.confirmDeleteComment = confirmDeleteComment;
    window.deleteComment = deleteComment;
    window.showReportCommentForm = showReportCommentForm;
    window.submitComment = submitComment;

    // Notification Modal Functions
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

    // Utility Functions
    function copyLink() {
        const currentUrl = window.location.href;
        navigator.clipboard.writeText(currentUrl).then(function () {
            showNotification('Link đã được sao chép!', 'success');
        }, function (err) {
            console.error('Không thể sao chép link: ', err);
            showNotification('Không thể sao chép link', 'error');
        });
    }

    function openPlaylistModal() {
        const playlistModal = document.getElementById('playlistModal');
        if (playlistModal) playlistModal.style.display = 'block';
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    }

    function toggleOtherReason() {
        const otherReasonContainer = document.getElementById('other-reason-container');
        if (otherReasonContainer) {
            otherReasonContainer.style.display = otherReasonContainer.style.display === 'none' ? 'block' : 'none';
        }
    }

  
    // Expose functions globally for inline event handlers
    window.toggleLike = toggleLike;
    window.copyLink = copyLink;
    window.openPlaylistModal = openPlaylistModal;
    window.closeModal = closeModal;
    window.toggleOtherReason = toggleOtherReason;
    window.submitReport = submitReport;
    window.submitComment = submitComment;
    window.changeVolume = changeVolume;
    window.toggleMute = toggleMute;
    window.showNotification = showNotification;
});

function toggleFollow() {
    const button = document.querySelector('.follow-btn');
    const followingId = document.querySelector('.artist-id').getAttribute('data-artist-id');

    if (!followingId) {
        console.error('Invalid artist ID');
        showNotification('Cannot follow/unfollow: Artist ID is missing', 'error');
        return;
    }

    // Get current user ID from hidden input
    const currentUserIdElement = document.getElementById('current-user-id');
    if (!currentUserIdElement || !currentUserIdElement.value) {
        showNotification('Please log in to follow/unfollow', 'warning');
        return;
    }

    const currentUserId = currentUserIdElement.value;

    // Check if user is trying to follow themselves
    if (currentUserId === followingId) {
        showNotification('You cannot follow yourself', 'warning');
        return;
    }

    // Create XMLHttpRequest object
    const xhr = new XMLHttpRequest();

    // Define the endpoint based on current follow status
    const isFollowing = button.classList.contains('followed');
    const endpoint = isFollowing ? '/User/Unfollow' : '/User/Follow';

    // Configure the request
    xhr.open('POST', endpoint, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    // Check if the element exists
    const verificationToken = document.querySelector('input[name="__RequestVerificationToken"]');
    if (verificationToken) {
        xhr.setRequestHeader('RequestVerificationToken', verificationToken.value);
    }

    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
                // Toggle button appearance
                if (isFollowing) {
                    button.classList.remove('followed');
                    button.innerHTML = 'Follow';
                    showNotification('Unfollowed successfully', 'info');
                    updateFollowerCount(false);
                } else {
                    button.classList.add('followed');
                    button.innerHTML = 'Followed ✓';
                    showNotification('Followed successfully', 'success');
                    updateFollowerCount(true);
                }
            } else {
                // Display error if needed
                console.error('Follow action failed:', response.message);
                showNotification(response.message || 'Follow action failed', 'error');
                if (response.message === 'User not authenticated') {
                    // Redirect to login page
                    window.location.href = '/Account/Login';
                }
            }
        } else {
            console.error('Request failed with status:', xhr.status);
            showNotification('Request failed. Please try again later.', 'error');
        }
    };

    // Handle errors
    xhr.onerror = function () {
        console.error('Request failed');
        showNotification('Network error. Please check your connection.', 'error');
    };

    // Send the request with the following user's ID
    xhr.send('followingId=' + followingId);
}

function updateFollowerCount(isIncreasing) {
    const followerCountEl = document.querySelector('.artist-info p:nth-child(3)');
    if (followerCountEl) {
        let currentCount = parseInt(followerCountEl.textContent.replace('Follower : ', ''));
        currentCount = isIncreasing ? currentCount + 1 : currentCount - 1;
        followerCountEl.textContent = 'Follower : ' + currentCount;
    }
}

// Placeholder functions
function loadAllCommentCounts() {
    console.log('Đang tải số lượng bình luận');
}

function closeCommentSection() {
    console.log('Đóng phần bình luận');
}

let userPlaylists = [];
const songId = document.getElementById('song-id')?.value;

// Load user playlists when opening the modal
function openPlaylistModal() {
    console.log("Opening playlist modal");
    var playlistsData = document.getElementById("user-playlists-data")?.value;
    console.log("Playlists data:", playlistsData);

    if (!playlistsData) {
        showNotification("No playlist data available", "warning");
        return;
    }

    // Try to parse JSON
    try {
        var playlists = JSON.parse(playlistsData);
        console.log("Parsed playlists:", playlists);
    } catch (e) {
        console.error("Failed to parse playlists JSON:", e);
        showNotification("Error loading playlists", "error");
    }

    document.getElementById("playlistModal").style.display = "block";
}

// Create a new playlist
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
        <button class="add-to-playlist-btn" onclick="addSongToPlaylist(${playlist.id})">
            Add
        </button>
    `;

    // Add the new playlist to the container
    playlistContainer.appendChild(playlistItem);

    // Update the global userPlaylists array
    userPlaylists.push(playlist);

    showNotification(`Playlist "${playlist.name}" created successfully`, "success");
}

// Update the createPlaylist function to handle errors and clearly debug issues
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
    const currentUserIdElement = document.getElementById('current-user-id');
    if (!currentUserIdElement || !currentUserIdElement.value) {
        showNotification('Please log in to create playlists', "warning");
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/Playlist/CreatePlaylist", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    console.log('Server response:', response);

                    if (response.success) {
                        // Clear the input
                        playlistNameInput.value = '';

                        // Append the new playlist to the UI
                        appendNewPlaylist({
                            id: response.playlistId,
                            name: playlistName
                        });
                    } else {
                        showNotification(response.message || 'Failed to create playlist', "error");
                    }
                } catch (error) {
                    console.error('Error parsing create playlist response:', error);
                    console.log('Raw response:', xhr.responseText);
                    showNotification('Error creating playlist. Please try again.', "error");
                }
            } else if (xhr.status === 401) {
                showNotification('Please log in to create playlists', "warning");
            } else {
                console.error('Request failed with status:', xhr.status);
                console.log('Response text:', xhr.responseText);
                showNotification('Failed to create playlist. Please try again.', "error");
            }
        }
    };

    // Send as form data
    xhr.send(`playlistName=${encodeURIComponent(playlistName)}`);
}

// Add the current song to a playlist
function addSongToPlaylist(playlistId) {
    if (!songId) {
        console.error('Song ID not found');
        showNotification('Cannot add to playlist: Song ID is missing', "error");
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/Playlist/AddSong', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);

                    if (response.success) {
                        showNotification(response.message, "success");
                    } else {
                        showNotification(response.message || 'Failed to add song to playlist', "error");
                    }
                } catch (error) {
                    console.error('Error parsing add song response:', error);
                    showNotification('Error adding song to playlist. Please try again.', "error");
                }
            } else if (xhr.status === 401) {
                showNotification('Please log in to add songs to playlists', "warning");
            } else if (xhr.status === 404) {
                showNotification('Playlist or song not found', "error");
            } else {
                console.error('Request failed with status:', xhr.status);
                showNotification('Failed to add song to playlist. Please try again.', "error");
            }
        }
    };

    xhr.send(`playlistId=${encodeURIComponent(playlistId)}&songId=${encodeURIComponent(songId)}`);
}


/*GLOBAL PLAYE------------------------------ */
document.addEventListener('DOMContentLoaded', function () {
    // Try to restore player state immediately
    setTimeout(function () {
        if (typeof loadPlayerState === 'function') {
            loadPlayerState();
        } else {
            console.warn("loadPlayerState function not available yet");
            // Try again after a short delay
            setTimeout(function () {
                if (typeof loadPlayerState === 'function') {
                    loadPlayerState();
                }
            }, 500);
        }
    }, 0);
});

function closeReportForm() {
    const reportModal = document.getElementById('report-modal');
    if (reportModal) {
        document.body.removeChild(reportModal);
    }
}

// Make sure to expose it for inline event handlers
window.closeReportForm = closeReportForm;