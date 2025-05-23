﻿let songCounter = 1;
let currentPostId = null;
const currentUserId = document.getElementById('current-user-id').value;
let commentsStore = {};
let currentAudio = null;
const avatarUrl = document.getElementById('avatar-url').value;

// Make sure notification container is created when the page loads
document.addEventListener('DOMContentLoaded', function () {
    createNotificationModal();
    // ... rest of your existing DOMContentLoaded code
});

function toggleSidebar(event) {
    event.stopPropagation();
    document.getElementById('sidebar').classList.toggle('collapsed');
}

function toggleChatBox(event, boxId) {
    event.stopPropagation();
    closeAll();
    document.getElementById(boxId).style.display = 'block';
}

function closeAll(event) {
    if (event && (event.target.closest('.chat-box') ||
        event.target.closest('.sidebar-button') ||
        event.target.closest('.post-options') ||
        event.target.closest('.avatar-container') ||
        event.target.closest('#comment-overlay'))) return;

    document.querySelectorAll('.chat-box, .post-menu, .profile-menu').forEach(el => el.style.display = 'none');

    // Don't close comment overlay if clicked inside it
    if (!event || !event.target.closest('#comment-overlay')) {
        closeCommentSection();
    }
}

function showContent(type) {
    document.getElementById('status').style.display = type === 'status' ? 'block' : 'none';
    document.getElementById('song').style.display = type === 'song' ? 'block' : 'none';

    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

function toggleFollow() {
    const button = document.querySelector('.follow-btn');
    const followingId = document.querySelector('.handle').getAttribute('data-user-id');
    const statFollowerElement = document.querySelector('#stat-follower');
    let followerCount = parseInt(statFollowerElement.getAttribute('data-follower'), 10);

    // Create XMLHttpRequest object
    const xhr = new XMLHttpRequest();
    // Define the endpoint based on current follow status
    const isFollowing = button.classList.contains('followed');
    const endpoint = isFollowing ? '/User/Unfollow' : '/User/Follow';

    // Configure the request
    xhr.open('POST', endpoint, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    // Kiểm tra xem element có tồn tại không
    const verificationToken = document.querySelector('input[name="__RequestVerificationToken"]');
    if (verificationToken) {
        xhr.setRequestHeader('RequestVerificationToken', verificationToken.value);
    }

    // Handle response
    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
                // Toggle button appearance
                if (isFollowing) {
                    button.classList.remove('followed');
                    button.innerHTML = 'Follow';
                    followerCount -= 1;
                } else {
                    button.classList.add('followed');
                    button.innerHTML = 'Followed ✓';
                    followerCount += 1;
                }

                // Update the follower count in the DOM
                statFollowerElement.setAttribute('data-follower', followerCount);
                statFollowerElement.textContent = followerCount;
            } else {
                // Display error if needed
                console.error('Follow action failed:', response.message);
                if (response.message === 'User not authenticated') {
                    // Show notification instead of redirect
                    showNotification('Please login to follow users', 'error');
                    // Redirect to login page
                    setTimeout(() => {
                        window.location.href = '/Account/Login';
                    }, 2000);
                }
            }
        } else {
            console.error('Request failed with status:', xhr.status);
            showNotification('Follow request failed. Please try again.', 'error');
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
function togglePostMenu(event, element) {
    event.stopPropagation();
    closeAll();
    const menu = element.nextElementSibling;
    menu.style.display = 'block';
}

function toggleProfileMenu(event) {
    event.stopPropagation();
    document.getElementById('profileMenu').classList.toggle('show');
}

function likePost(button, postId) {
    if (!currentUserId || currentUserId === "null") {
        showNotification("Please login to like posts", "warning");
        return;
    }

    const isActive = button.classList.contains('active');

    // Find the parent container and the dislike button correctly
    const actionContainer = button.closest('.action-buttons-container');
    const dislikeBtn = actionContainer.querySelector('.dislike-btn');

    if (dislikeBtn.classList.contains('active')) {
        dislikeBtn.classList.remove('active');
        const dislikeCountEl = dislikeBtn.querySelector('.count-badge');
        const currentDislikeCount = parseInt(dislikeCountEl.textContent);
        if (currentDislikeCount > 0) {
            dislikeCountEl.textContent = currentDislikeCount - 1;
        }
    }

    // Get the like count element
    const likeCountEl = button.querySelector('.count-badge');
    const currentCount = parseInt(likeCountEl.textContent);

    // AJAX request
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/Post/LikePost/${postId}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                // Toggle active state and update count
                if (isActive) {
                    button.classList.remove('active');
                    if (currentCount > 0) {
                        likeCountEl.textContent = currentCount - 1;
                    }
                } else {
                    button.classList.add('active');
                    likeCountEl.textContent = currentCount + 1;
                    showNotification("Post liked successfully", "success");
                }
            } else {
                console.error("Error liking post:", xhr.responseText);
                showNotification("Couldn't like post. Please try again later.", "error");
            }
        }
    };

    xhr.send(JSON.stringify(parseInt(currentUserId)));
}

function dislikePost(button, postId) {
    if (!currentUserId || currentUserId === "null") {
        showNotification("Please login to dislike posts", "warning");
        return;
    }

    const isActive = button.classList.contains('active');

    // Find the parent container and the like button correctly
    const actionContainer = button.closest('.action-buttons-container');
    const likeBtn = actionContainer.querySelector('.like-btn');

    if (likeBtn.classList.contains('active')) {
        likeBtn.classList.remove('active');
        const likeCountEl = likeBtn.querySelector('.count-badge');
        const currentLikeCount = parseInt(likeCountEl.textContent);
        if (currentLikeCount > 0) {
            likeCountEl.textContent = currentLikeCount - 1;
        }
    }

    // Get the dislike count element
    const dislikeCountEl = button.querySelector('.count-badge');
    const currentCount = parseInt(dislikeCountEl.textContent);

    // AJAX request
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/Post/DislikePost/${postId}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                if (isActive) {
                    button.classList.remove('active');
                    if (currentCount > 0) {
                        dislikeCountEl.textContent = currentCount - 1;
                    }
                } else {
                    button.classList.add('active');
                    dislikeCountEl.textContent = currentCount + 1;
                }
            } else {
                console.error("Error disliking post:", xhr.responseText);
                showNotification("Couldn't dislike post. Please try again later.", "error");
            }
        }
    };

    xhr.send(JSON.stringify(parseInt(currentUserId)));
}

function toggleCommentSection(button, postId) {
    event.stopPropagation();

    if (!currentUserId) {
        showNotification("Please login to view and add comments", "warning");
        return;
    }

    currentPostId = postId;
    const commentOverlay = document.getElementById('comment-overlay');
    commentOverlay.style.display = 'flex';

    const commentsList = commentOverlay.querySelector('.fb-comments-list');
    commentsList.innerHTML = '';

    // Use cached comments if available
    if (commentsStore[postId] && commentsStore[postId].length > 0) {
        commentsStore[postId].forEach(comment => {
            const commentItem = createCommentElement(comment);
            commentsList.appendChild(commentItem);
        });
    } else {
        // If not cached yet, load them
        loadComments(postId, commentsList);
    }

    const commentInput = commentOverlay.querySelector('.fb-comment-input');
    if (commentInput) {
        commentInput.focus();
    }

    button.classList.add('active');
}

function loadComments(postId, commentsList) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/Post/GetComments/${postId}`, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const comments = JSON.parse(xhr.responseText);

                    // Lưu comments vào cache
                    commentsStore[postId] = comments;

                    // Hiển thị comments
                    comments.forEach(comment => {
                        const commentItem = createCommentElement(comment);
                        commentsList.appendChild(commentItem);
                    });

                    // Update comment count badge
                    updateCommentCountBadge(postId, comments.length);
                } catch (error) {
                    console.error("Error parsing comments:", error);
                    showNotification("Error loading comments", "error");
                }
            } else {
                console.error("Error loading comments:", xhr.responseText);
                showNotification("Error loading comments", "error");
            }
        }
    };

    xhr.send();
}

function closeCommentSection() {
    document.getElementById('comment-overlay').style.display = 'none';

    if (currentPostId) {
        const postElement = document.querySelector(`.post[data-post-id="${currentPostId}"]`);
        if (postElement) {
            const commentBtn = postElement.querySelector('.comment-btn');
            if (commentBtn) {
                commentBtn.classList.remove('active');
            }
        }
    }

    currentPostId = null;
}

function submitComment(event) {
    if (!currentUserId) {
        showNotification("Please login to comment", "warning");
        return;
    }

    const commentSection = event.target.closest('.fb-comment-section');
    const commentInput = commentSection.querySelector('.fb-comment-input');
    const commentText = commentInput.value.trim();

    if (commentText && currentPostId) {
        // Tạo comment data object
        const commentData = {
            content: commentText,
            userId: currentUserId
        };

        // Tạo AJAX request
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/Post/AddComment/${currentPostId}`, true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        const commentsList = commentSection.querySelector('.fb-comments-list');

                        // Lưu comment vào cache
                        if (!commentsStore[currentPostId]) {
                            commentsStore[currentPostId] = [];
                        }
                        commentsStore[currentPostId].push(response);

                        // Tạo và hiển thị comment mới
                        const commentItem = createCommentElementForMySelf(response);
                        commentsList.appendChild(commentItem);

                        // Update comment count badge
                        updateCommentCountBadge(currentPostId, commentsStore[currentPostId].length);

                        // Xóa nội dung input
                        commentInput.value = '';

                        showNotification("Comment added successfully", "success");
                    } catch (error) {
                        console.error("Error parsing response:", error);
                        showNotification("Error adding comment", "error");
                    }
                } else {
                    console.error("Error adding comment:", xhr.responseText);
                    showNotification("Couldn't add comment. Please try again later.", "error");
                }
            }
        };

        xhr.send(JSON.stringify(commentData));
    }
}

function createCommentElement(comment) {
    const commentItem = document.createElement('div');
    commentItem.className = 'fb-comment-item';
    commentItem.setAttribute('data-comment-id', comment.id);

    const commentDate = comment.createdAt ? new Date(comment.createdAt) : new Date();
    const formattedDate = commentDate.toLocaleString();

    // Check if this is the current user's comment
    const isCurrentUserComment = parseInt(currentUserId) === comment.userId;

    // Generate action buttons based on user ownership
    let actionButtons = ``;

    if (isCurrentUserComment) {
        actionButtons += `
                <span class="fb-comment-action edit-comment-btn" onclick="showEditCommentForm(${comment.id})">Edit</span>
                <span class="fb-comment-action delete-comment-btn" onclick="confirmDeleteComment(${comment.id})">Delete</span>
            `;
    } else {
        actionButtons += `<span class="fb-comment-action report-comment-btn" onclick="showReportCommentForm(${comment.id})">Report</span>`;
    }

    commentItem.innerHTML = `
            <div class="comment-avatar">
                <img src="${comment.avatarUrl}" alt="avatar" class="comment-user-avatar">
            </div>
            <div class="fb-comment-content">
                <div class="fb-comment-author">${comment.userName || 'User'}</div>
                <div class="fb-comment-text" id="comment-text-${comment.id}">${comment.content}</div>
                <div class="fb-comment-time">${formattedDate}</div>
                <div class="fb-comment-actions">
                    ${actionButtons}
                </div>
            
                <!-- Edit form (hidden by default) -->
                <div class="comment-edit-form" id="edit-form-${comment.id}" style="display: none;">
                    <textarea class="edit-comment-textarea">${comment.content}</textarea>
                    <div class="edit-comment-buttons">
                        <button class="cancel-edit-btn" onclick="cancelEditComment(${comment.id})">Cancel</button>
                        <button class="save-edit-btn" onclick="saveCommentEdit(${comment.id})">Save</button>
                    </div>
                </div>
            </div>
        `;

    return commentItem;
} function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
}
function createCommentElementForMySelf(comment) {
    const commentItem = document.createElement('div');
    commentItem.className = 'fb-comment-item';
    commentItem.setAttribute('data-comment-id', comment.id);

    const commentDate = comment.createdAt ? new Date(comment.createdAt) : new Date();
    const formattedDate = commentDate.toLocaleString();

    // Check if this is the current user's comment
    const isCurrentUserComment = parseInt(currentUserId) === comment.userId;

    // Generate action buttons based on user ownership
    let actionButtons = ``;

    if (isCurrentUserComment) {
        actionButtons += `
                <span class="fb-comment-action edit-comment-btn" onclick="showEditCommentForm(${comment.id})">Edit</span>
                <span class="fb-comment-action delete-comment-btn" onclick="confirmDeleteComment(${comment.id})">Delete</span>
            `;
    } else {
        actionButtons += `<span class="fb-comment-action report-comment-btn" onclick="showReportCommentForm(${comment.id})">Report</span>`;
    }

    commentItem.innerHTML = `
            <div class="comment-avatar">
                <img src="${avatarUrl}" alt="avatar" class="comment-user-avatar">
            </div>
            <div class="fb-comment-content">
                <div class="fb-comment-author">${comment.userName || 'User'}</div>
                <div class="fb-comment-text" id="comment-text-${comment.id}">${comment.content}</div>
                <div class="fb-comment-time">${formattedDate}</div>
                <div class="fb-comment-actions">
                    ${actionButtons}
                </div>
            
                <!-- Edit form (hidden by default) -->
                <div class="comment-edit-form" id="edit-form-${comment.id}" style="display: none;">
                    <textarea class="edit-comment-textarea">${comment.content}</textarea>
                    <div class="edit-comment-buttons">
                        <button class="cancel-edit-btn" onclick="cancelEditComment(${comment.id})">Cancel</button>
                        <button class="save-edit-btn" onclick="saveCommentEdit(${comment.id})">Save</button>
                    </div>
                </div>
            </div>
        `;

    return commentItem;
}
function loadAllCommentCounts() {
    const posts = document.querySelectorAll('.post');
    posts.forEach(post => {
        const postId = post.getAttribute('data-post-id');
        if (postId) {
            fetchCommentData(postId);
        }
    });
}

function fetchCommentData(postId) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/Post/GetComments/${postId}`, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const comments = JSON.parse(xhr.responseText);

                    // Lưu comments vào cache
                    commentsStore[postId] = comments;

                    // Update comment count
                    updateCommentCountBadge(postId, comments.length);
                } catch (error) {
                    console.error("Error parsing comments:", error);
                }
            } else {
                console.error("Error loading comments:", xhr.responseText);
            }
        }
    };

    xhr.send();
}

function updateCommentCountBadge(postId, count) {
    const postElement = document.querySelector(`.post[data-post-id="${postId}"]`);
    if (postElement) {
        const commentCountEl = postElement.querySelector('.comment-btn .count-badge');
        if (commentCountEl) {
            commentCountEl.textContent = count;
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Create notification container
    createNotificationModal();

    // Load all comment counts when page loads
    loadAllCommentCounts();

    // Handle Enter key for comments
    document.querySelectorAll('.fb-comment-input').forEach(input => {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                submitComment({ target: this.closest('.fb-comment-input-wrapper').querySelector('.fa-paper-plane') });
            }
        });
    });

    // Close comment overlay when clicked outside
    document.addEventListener('click', function (event) {
        const commentOverlay = document.getElementById('comment-overlay');
        if (commentOverlay.style.display === 'flex' &&
            !event.target.closest('.comment-container') &&
            !event.target.closest('.comment-btn')) {
            closeCommentSection();
        }
    });

    // Initialize audio players
    const customPlayers = document.querySelectorAll('.custom-audio-player');

    customPlayers.forEach(player => {
        const songUrl = player.getAttribute('data-song-url');
        const playBtn = player.querySelector('.play-button');
        const playIcon = player.querySelector('.play-button i');
        const progressContainer = player.querySelector('.progress-container');
        const progressBar = player.querySelector('.progress-bar');
        const timeDisplay = player.querySelector('.time-display');
        const audio = player.querySelector('audio');

        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
        }

        audio.addEventListener('timeupdate', function () {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = `${progress}%`;
            timeDisplay.textContent = formatTime(audio.currentTime);
        });

        audio.addEventListener('loadedmetadata', function () {
            timeDisplay.textContent = formatTime(audio.duration);
        });

        playBtn.addEventListener('click', function () {
            console.log('Play button clicked');
            console.log('Audio state:', audio.paused ? 'paused' : 'playing');
            if (audio.paused) {
                document.querySelectorAll('audio').forEach(a => {
                    if (a !== audio && !a.paused) {
                        a.pause();

                        const otherPlayer = a.closest('.custom-audio-player');
                        if (otherPlayer) {
                            const otherIcon = otherPlayer.querySelector('.play-button i');
                            otherIcon.classList.remove('fa-pause');
                            otherIcon.classList.add('fa-play');
                        }
                    }
                });

                audio.play();
                playIcon.classList.remove('fa-play');
                playIcon.classList.add('fa-pause');
            } else {
                audio.pause();
                playIcon.classList.remove('fa-pause');
                playIcon.classList.add('fa-play');
            }
        });

        // Click on progress bar to seek
        progressContainer.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const clickPosition = (e.clientX - rect.left) / rect.width;
            audio.currentTime = clickPosition * audio.duration;
        });

        // Reset when audio ends
        audio.addEventListener('ended', function () {
            audio.currentTime = 0;
            playIcon.classList.remove('fa-pause');
            playIcon.classList.add('fa-play');
        });
    });

    // Volume slider functionality
    document.querySelectorAll(".volume-slider").forEach(slider => {
        slider.addEventListener("input", function () {
            let songId = this.id.replace("volume-slider-", ""); // Lấy ID bài hát từ thanh trượt
            let audio = document.getElementById(`audio-${songId}`);
            if (audio) {
                audio.volume = this.value;
            }
        });
    });
});

let postToDelete = null;
let postToEdit = null;
let originalImageUrl = null;
let newImageFile = null;

function togglePostMenu(event, postId) {
    event.stopPropagation();

    // Truyền event vào hàm closeAll
    closeAll(event);

    const menu = document.getElementById(`postMenu-${postId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    } else {
        console.error("Không tìm thấy menu cho postId:", postId);
    }
}

// Edit post
function editPost(postId) {
    if (!currentUserId) {
        showNotification("Please log in to edit posts", "warning");
        return;
    }

    // Fetch post details
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/Post/GetPost/${postId}`, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const post = JSON.parse(xhr.responseText);

                    // Check if current user is the post owner
                    if (parseInt(currentUserId) !== post.userId) {
                        showNotification("You can only edit your own posts", "error");
                        return;
                    }

                    // Populate edit form
                    document.getElementById('edit-post-id').value = post.id;
                    document.getElementById('edit-post-content').value = post.content;

                    // Handle image if exists
                    if (post.imageUrl) {
                        document.getElementById('edit-image-preview').src = post.imageUrl;
                        document.getElementById('edit-image-preview-container').style.display = 'block';
                        originalImageUrl = post.imageUrl;
                    } else {
                        document.getElementById('edit-image-preview-container').style.display = 'none';
                        originalImageUrl = null;
                    }

                    // Show edit form
                    document.getElementById('edit-post-overlay').style.display = 'flex';
                    postToEdit = postId;

                    // Close post menu
                    document.getElementById(`postMenu-${postId}`).style.display = 'none';
                } catch (error) {
                    console.error("Error parsing post data:", error);
                    showNotification("Could not load post data. Please try again.", "error");
                }
            } else {
                console.error("Error fetching post:", xhr.responseText);
                showNotification("Could not load post data. Please try again.", "error");
            }
        }
    };

    xhr.send();
}

// Save post edit
function savePostEdit() {
    const postId = document.getElementById('edit-post-id').value;
    const content = document.getElementById('edit-post-content').value.trim();

    if (!content) {
        showNotification("Post content cannot be empty", "warning");
        return;
    }

    // Create edit data
    const editData = {
        userId: parseInt(currentUserId),
        content: content,
        imageUrl: originalImageUrl
    };

    // If there's a new image, we would handle image upload here
    // For now, we'll just use the original image URL

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/Post/EditPost/${postId}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);

                    // Update post in the UI
                    const postElement = document.querySelector(`.post[data-post-id="${postId}"]`);
                    if (postElement) {
                        const contentEl = postElement.querySelector('.post-content p');
                        if (contentEl) {
                            contentEl.textContent = content;
                        }

                        // Update image if needed
                        const imageEl = postElement.querySelector('.post-image');
                        if (editData.imageUrl) {
                            if (imageEl) {
                                imageEl.src = editData.imageUrl;
                            } else {
                                const contentDiv = postElement.querySelector('.post-content');
                                const newImg = document.createElement('img');
                                newImg.src = editData.imageUrl;
                                newImg.className = 'post-image';
                                contentDiv.appendChild(newImg);
                            }
                        } else if (imageEl) {
                            imageEl.remove();
                        }
                    }

                    // Close edit form
                    closeEditForm();

                    // Show success message
                    showNotification("Post updated successfully", "success");
                } catch (error) {
                    console.error("Error parsing response:", error);
                    showNotification("Could not update post. Please try again.", "error");
                }
            } else {
                console.error("Error updating post:", xhr.responseText);
                showNotification("Could not update post. Please try again.", "error");
            }
        }
    };

    xhr.send(JSON.stringify(editData));
}

// Close edit form
function closeEditForm() {
    document.getElementById('edit-post-overlay').style.display = 'none';
    document.getElementById('edit-post-id').value = '';
    document.getElementById('edit-post-content').value = '';
    document.getElementById('edit-image-preview-container').style.display = 'none';
    document.getElementById('edit-image-preview').src = '';
    postToEdit = null;
    originalImageUrl = null;
    newImageFile = null;
}

// Functions for image preview in edit form
function addEditImage() {
    document.getElementById('edit-image-upload').click();
}

function previewEditImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('edit-image-preview').src = e.target.result;
            document.getElementById('edit-image-preview-container').style.display = 'block';
            newImageFile = file;
            originalImageUrl = null; // We'll replace with the new image
        }
        reader.readAsDataURL(file);
    }
}

function removeEditImage() {
    document.getElementById('edit-image-preview-container').style.display = 'none';
    document.getElementById('edit-image-preview').src = '';
    document.getElementById('edit-image-upload').value = '';
    newImageFile = null;
    originalImageUrl = null;
}

// Delete post functions
function confirmDeletePost(postId) {
    console.log("confirmDeletePost đã được gọi với postId:", postId);
    postToDelete = postId;
    document.getElementById('delete-confirm-overlay').style.display = 'block';

    // Kiểm tra xem phần tử menu có tồn tại không
    const menu = document.getElementById(`postMenu-${postId}`);
    console.log("Menu element:", menu);
    if (menu) {
        menu.style.display = 'none';
    }
}

function closeDeleteConfirm() {
    document.getElementById('delete-confirm-overlay').style.display = 'none';
    postToDelete = null;
}

function executeDeletePost() {
    if (!postToDelete || !currentUserId) {
        closeDeleteConfirm();
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/Post/DeletePost/${postToDelete}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                // Remove post from UI
                const postElement = document.querySelector(`.post[data-post-id="${postToDelete}"]`);
                if (postElement) {
                    postElement.remove();
                }

                closeDeleteConfirm();
                showNotification("Post deleted successfully", "success");
            } else {
                console.error("Error deleting post:", xhr.responseText);
                showNotification("Could not delete post. Please try again.", "error");
                closeDeleteConfirm();
            }
        }
    };

    xhr.send(JSON.stringify(parseInt(currentUserId)));
}

// Close menus when clicking outside
document.addEventListener('click', function (event) {
    // Close post menus when clicking outside
    if (!event.target.closest('.post-options') && !event.target.closest('.post-menu')) {
        document.querySelectorAll('.post-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }

    // Don't close edit overlay when clicking inside it
    if (document.getElementById('edit-post-overlay').style.display === 'flex' &&
        !event.target.closest('.edit-container') &&
        !event.target.closest('.post-options')) {
        closeEditForm();
    }

    // Don't close delete confirm when clicking inside it
    if (document.getElementById('delete-confirm-overlay').style.display === 'flex' &&
        !event.target.closest('.confirm-container')) {
        closeDeleteConfirm();
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
function showEditCommentForm(commentId) {
    // Hide the comment text and show the edit form
    document.getElementById(`comment-text-${commentId}`).style.display = 'none';
    document.getElementById(`edit-form-${commentId}`).style.display = 'block';
}

// Handle canceling edit
function cancelEditComment(commentId) {
    // Show the comment text and hide the edit form
    document.getElementById(`comment-text-${commentId}`).style.display = 'block';
    document.getElementById(`edit-form-${commentId}`).style.display = 'none';
}

// Save edited comment
function saveCommentEdit(commentId) {
    const commentItem = document.querySelector(`.fb-comment-item[data-comment-id="${commentId}"]`);
    const editForm = commentItem.querySelector('.edit-comment-textarea');
    const newContent = editForm.value.trim();

    if (!newContent) {
        showNotification("Comment cannot be empty", "warning");
        return;
    }

    const editData = {
        userId: parseInt(currentUserId),
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
                    const response = JSON.parse(xhr.responseText);

                    // Update the comment content
                    const commentTextEl = document.getElementById(`comment-text-${commentId}`);
                    commentTextEl.textContent = newContent;

                    // Hide the edit form and show the updated comment text
                    cancelEditComment(commentId);

                    // Update the comment in the comments store
                    if (commentsStore[currentPostId]) {
                        const commentIndex = commentsStore[currentPostId].findIndex(c => c.id === commentId);
                        if (commentIndex !== -1) {
                            commentsStore[currentPostId][commentIndex].content = newContent;
                        }
                    }

                    showNotification("Comment updated successfully", "success");
                } catch (error) {
                    console.error("Error parsing response:", error);
                    showNotification("Failed to update comment", "error");
                }
            } else {
                console.error("Error updating comment:", xhr.responseText);
                showNotification("Failed to update comment", "error");
            }
        }
    };

    xhr.send(JSON.stringify(editData));
}

// Confirm before deleting comment
function confirmDeleteComment(commentId) {
    if (confirm("Are you sure you want to delete this comment?")) {
        deleteComment(commentId);
    }
}

// Delete comment
function deleteComment(commentId) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/Post/DeleteComment/${commentId}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                // Remove the comment from the DOM
                const commentElement = document.querySelector(`.fb-comment-item[data-comment-id="${commentId}"]`);
                if (commentElement) {
                    commentElement.remove();
                }

                // Remove from comments store
                if (commentsStore[currentPostId]) {
                    commentsStore[currentPostId] = commentsStore[currentPostId].filter(c => c.id !== commentId);

                    // Update comment count badge
                    updateCommentCountBadge(currentPostId, commentsStore[currentPostId].length);
                }

                showNotification("Comment deleted successfully", "success");
            } else {
                console.error("Error deleting comment:", xhr.responseText);
                showNotification("Failed to delete comment", "error");
            }
        }
    };

    xhr.send(JSON.stringify(parseInt(currentUserId)));
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

// Close the report form
function closeReportForm() {
    const reportModal = document.getElementById('report-modal');
    if (reportModal) {
        reportModal.remove();
    }
}

// Submit report
function submitReport(commentId) {
    const reasonSelect = document.getElementById('report-reason');
    const detailsField = document.getElementById('report-details');

    const reason = reasonSelect.value;
    const details = detailsField.value.trim();

    const reportData = {
        userId: parseInt(currentUserId),
        reason: reason + (details ? `: ${details}` : '')
    };

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/Post/ReportComment/${commentId}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                closeReportForm();
                showNotification("Comment reported successfully", "success");
            } else if (xhr.status === 400) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.message === "You have already reported this comment.") {
                        showNotification("You have already reported this comment.", "warning");
                    } else {
                        showNotification("Failed to report comment", "error");
                    }
                } catch (e) {
                    showNotification("Unexpected error occurred", "error");
                }
            } else {
                showNotification("Failed to report comment", "error");
            }
        }
    };

    xhr.send(JSON.stringify(reportData));
}

// Global variable to store post ID for reporting
let currentReportPostId = null;

// Show report post form
function reportPost(postId) {
    currentReportPostId = postId;
    document.getElementById('report-post-id').value = postId;
    document.getElementById('report-post-overlay').style.display = 'flex';

    // Clear any previous selections
    const radioButtons = document.querySelectorAll('input[name="report-reason"]');
    radioButtons.forEach(button => {
        button.checked = false;
    });
    document.getElementById('report-details').value = '';

    // Close the post menu
    const postMenu = document.getElementById(`postMenu-${postId}`);
    if (postMenu) {
        postMenu.style.display = 'none';
    }
}

// Close report form
function closeReportPostForm() {
    document.getElementById('report-post-overlay').style.display = 'none';
    currentReportPostId = null;
}
function submitPostReport() {
    const postId = document.getElementById('report-post-id').value;
    const selectedReason = document.querySelector('input[name="report-reason"]:checked');
    const additionalDetails = document.getElementById('report-details').value;
    const userId = document.getElementById('current-user-id').value;

    if (!selectedReason) {
        showNotification('Please select a reason for reporting this post.', 'warning');
        return;
    }

    if (!userId || userId === '0') {
        showNotification('You must be logged in to report a post.', 'warning');
        return;
    }

    const reason = selectedReason.value + (additionalDetails ? ': ' + additionalDetails : '');

    const reportData = {
        userId: parseInt(userId),
        reason: reason
    };

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/Post/ReportPost/${postId}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                showNotification('Thank you for your report. We will review it shortly.', 'success');
                closeReportPostForm();
            } else if (xhr.status === 400) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response === "You have already reported this post.") {
                        showNotification("You have already reported this post.", "warning");
                    } else if (response.message) {
                        showNotification(response.message, "error");
                    } else {
                        showNotification("Failed to report post.", "error");
                    }
                } catch (e) {
                    showNotification("Unexpected error occurred", "error");
                }
            } else {
                showNotification("Failed to report post.", "error");
            }
        }
    };

    xhr.send(JSON.stringify(reportData));
}