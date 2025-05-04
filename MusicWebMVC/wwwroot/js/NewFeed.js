

let currentPostId = null;
const currentUserId = document.getElementById('current-user-id').value;
let commentsStore = {};
const avatarUrl = document.getElementById('avatar-url').value;


function toggleProfileMenu(event) {
    event.stopPropagation();
    document.getElementById('profileMenu').classList.toggle('show');
}

function toggleSidebar(event) {
    event.stopPropagation();
    document.getElementById('sidebar').classList.toggle('collapsed');
}

function toggleChatBox(event, boxId) {
    event.stopPropagation();

    // Close all chat boxes first
    document.querySelectorAll('.chat-box').forEach(box => {
        box.style.display = 'none';
    });

    // Then open the selected box
    document.getElementById(boxId).style.display = 'block';
}

function closeAll(event) {
    if (event && (event.target.closest('.chat-box') ||
        event.target.closest('.sidebar-button') ||
        event.target.closest('.post-options') ||
        event.target.closest('.avatar-container') ||
        event.target.closest('#comment-overlay'))) return;

    // Close all chat boxes
    document.querySelectorAll('.chat-box').forEach(box => {
        box.style.display = 'none';
    });

    // Close all post menus and profile menus
    document.querySelectorAll('.post-menu, .profile-menu').forEach(el => {
        el.style.display = 'none';
    });

    // Don't close comment overlay if clicked inside it
    if (!event || !event.target.closest('#comment-overlay')) {
        closeCommentSection();
    }
}
function createPlaylist() {
    const playlistNameInput = document.querySelector('#playlistBox input[type="text"]');
    const playlistName = playlistNameInput.value.trim();

    if (!playlistName) {
        showNotification("Tên playlist không được để trống", "error");
        return;
    }

    // Create AJAX request
    const xhr = new XMLHttpRequest();

    // Option 1: Send as form data (recommended)
    xhr.open("POST", "/Playlist/CreatePlaylist", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        window.location.href = `/Playlist/PlaylistPage?id=${response.playlist.id}`;
                    } else {
                        showNotification(response.message || "Không thể tạo playlist", "error");
                    }
                } catch (error) {
                    console.error("Lỗi khi phân tích phản hồi:", error);
                    showNotification("Đã xảy ra lỗi khi tạo playlist", "error");
                }
            } else {
                console.error("Lỗi khi tạo playlist:", xhr.status, xhr.responseText);
                try {
                    const response = JSON.parse(xhr.responseText);
                    showNotification(response.message || "Không thể tạo playlist", "error");
                } catch (error) {
                    showNotification("Đã xảy ra lỗi khi tạo playlist", "error");
                }
            }
        }
    };

    // Send as form data
    xhr.send(`playlistName=${encodeURIComponent(playlistName)}`);
}




function likePost(button, postId) {
    if (!currentUserId || currentUserId === "null") {
        showNotification("Vui lòng đăng nhập để thích bài viết", "warning");
        return;
    }

    const isActive = button.classList.contains('active');

    // Nếu đã dislike, xóa dislike
    const dislikeBtn = button.closest('.action-buttons-container').querySelector('.dislike-btn');
    if (dislikeBtn.classList.contains('active')) {
        dislikeBtn.classList.remove('active');
        const dislikeCountEl = dislikeBtn.querySelector('.count-badge');
        const currentDislikeCount = parseInt(dislikeCountEl.textContent);
        if (currentDislikeCount > 0) {
            dislikeCountEl.textContent = currentDislikeCount - 1;
        }
    }

    // Lấy số lượng like hiện tại
    const likeCountEl = button.querySelector('.count-badge');
    const currentCount = parseInt(likeCountEl.textContent);

    // Tạo AJAX request
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/Post/LikePost/${postId}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    // Debug output
    console.log("Sending like request:", postId, currentUserId);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log("Like response:", xhr.responseText);
                // Toggle trạng thái active và cập nhật số lượng
                if (isActive) {
                    button.classList.remove('active');
                    if (currentCount > 0) {
                        likeCountEl.textContent = currentCount - 1;
                    }
                } else {
                    button.classList.add('active');
                    likeCountEl.textContent = currentCount + 1;
                }
            } else {
                console.error("Lỗi khi thích bài viết:", xhr.responseText);
                showNotification("Không thể thích bài viết. Vui lòng thử lại sau.", "error");
            }
        }
    };

    xhr.send(JSON.stringify(parseInt(currentUserId)));
}

function dislikePost(button, postId) {
    if (!currentUserId || currentUserId === "null") {
        showNotification("Vui lòng đăng nhập để không thích bài viết", "warning");
        return;
    }

    const isActive = button.classList.contains('active');

    // Nếu đã like, xóa like
    const likeBtn = button.closest('.action-buttons-container').querySelector('.like-btn');
    if (likeBtn.classList.contains('active')) {
        likeBtn.classList.remove('active');
        const likeCountEl = likeBtn.querySelector('.count-badge');
        const currentLikeCount = parseInt(likeCountEl.textContent);
        if (currentLikeCount > 0) {
            likeCountEl.textContent = currentLikeCount - 1;
        }
    }

    // Lấy số lượng dislike hiện tại
    const dislikeCountEl = button.querySelector('.count-badge');
    const currentCount = parseInt(dislikeCountEl.textContent);

    // Tạo AJAX request
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/Post/DislikePost/${postId}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    // Debug output
    console.log("Sending dislike request:", postId, currentUserId);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log("Dislike response:", xhr.responseText);
                // Toggle trạng thái active và cập nhật số lượng
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
                console.error("Lỗi khi không thích bài viết:", xhr.responseText);
                showNotification("Không thể không thích bài viết. Vui lòng thử lại sau.", "error");
            }
        }
    };

    xhr.send(JSON.stringify(parseInt(currentUserId)));
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
                    console.error("Lỗi khi phân tích comments:", error);
                }
            } else {
                console.error("Lỗi khi tải comments:", xhr.responseText);
            }
        }
    };

    xhr.send();
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
                    console.error("Lỗi khi phân tích comments:", error);
                }
            } else {
                console.error("Lỗi khi tải comments:", xhr.responseText);
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
        showNotification("Vui lòng đăng nhập để bình luận", "warning");
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
                    } catch (error) {
                        console.error("Lỗi khi phân tích phản hồi:", error);
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
function submitEmbeddedComment(event, postId) {
    event.preventDefault();

    if (!currentUserId) {
        showNotification("Vui lòng đăng nhập để bình luận", "warning");
        return;
    }

    const inputElement = document.getElementById(`commentInput-${postId}`);
    const commentText = inputElement.value.trim();

    if (commentText) {
        // Create comment data object
        const commentData = {
            content: commentText,
            userId: currentUserId
        };

        // Create AJAX request
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/Post/AddComment/${postId}`, true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        const commentsList = document.getElementById(`comments-list-${postId}`);

                        // Save comment to cache
                        if (!commentsStore[postId]) {
                            commentsStore[postId] = [];
                        }
                        commentsStore[postId].push(response);

                        // Create and display new comment
                        const commentItem = createCommentElementForMySelf(response);

                        // Replace "No comments yet" message if it exists
                        const noCommentsMsg = commentsList.querySelector('p');
                        if (noCommentsMsg && noCommentsMsg.textContent.includes('No comments yet')) {
                            commentsList.innerHTML = '';
                        }

                        commentsList.insertBefore(commentItem, commentsList.firstChild);

                        // Update comment count badge
                        updateCommentCountBadge(postId, commentsStore[postId].length);

                        // Clear input
                        inputElement.value = '';

                        // Add "View all comments" link if this is the second comment
                        if (commentsStore[postId].length > 1) {
                            const viewAllLink = commentsList.querySelector('.view-all-comments');
                            if (!viewAllLink) {
                                const viewAllDiv = document.createElement('div');
                                viewAllDiv.className = 'view-all-comments';
                                viewAllDiv.onclick = function () {
                                    toggleCommentSection(document.querySelector(`.post[data-post-id="${postId}"] .comment-btn`), postId);
                                };
                                viewAllDiv.textContent = `View all ${commentsStore[postId].length} comments`;
                                commentsList.appendChild(viewAllDiv);
                            } else {
                                viewAllLink.textContent = `View all ${commentsStore[postId].length} comments`;
                            }
                        }

                    } catch (error) {
                        console.error("Lỗi khi phân tích phản hồi:", error);
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
                <span class="fb-comment-action edit-comment-btn" onclick="showEditModalComment(${comment.id})">Edit</span>
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
                        <button class="cancel-edit-btn" onclick="cancelEditModalComment(${comment.id})">Cancel</button>
                        <button class="save-edit-btn" onclick="saveModalCommentEdit(${comment.id})">Save</button>
                    </div>
                </div>
            </div>
        `;

    return commentItem;
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
                <span class="fb-comment-action edit-comment-btn" onclick="showEditModalComment(${comment.id})">Edit</span>
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
                        <button class="cancel-edit-btn" onclick="cancelEditModalComment(${comment.id})">Cancel</button>
                        <button class="save-edit-btn" onclick="saveModalCommentEdit(${comment.id})">Save</button>
                    </div>
                </div>
            </div>
        `;

    return commentItem;
}

// Handle showing the edit form
// For modal comments
function showEditModalComment(commentId) {
    // Find only in the comment overlay
    const commentOverlay = document.getElementById('comment-overlay');
    const commentText = commentOverlay.querySelector(`#comment-text-${commentId}`);
    const editForm = commentOverlay.querySelector(`#edit-form-${commentId}`);

    if (commentText) commentText.style.display = 'none';
    if (editForm) editForm.style.display = 'block';
}

function cancelEditModalComment(commentId) {
    // Find only in the comment overlay
    const commentOverlay = document.getElementById('comment-overlay');
    const commentText = commentOverlay.querySelector(`#comment-text-${commentId}`);
    const editForm = commentOverlay.querySelector(`#edit-form-${commentId}`);

    if (commentText) commentText.style.display = 'block';
    if (editForm) editForm.style.display = 'none';
}

// For embedded comments
function showEditEmbeddedComment(commentId) {
    // Find only in the post comments section
    const postId = currentPostId || getPostIdFromCommentElement(commentId);
    const postComments = document.getElementById(`post-comments-${postId}`);
    const commentText = postComments.querySelector(`#comment-text-${commentId}`);
    const editForm = postComments.querySelector(`#edit-form-${commentId}`);

    if (commentText) commentText.style.display = 'none';
    if (editForm) editForm.style.display = 'block';
}

function cancelEditEmbeddedComment(commentId) {
    // Find only in the post comments section
    const postId = currentPostId || getPostIdFromCommentElement(commentId);
    const postComments = document.getElementById(`post-comments-${postId}`);
    const commentText = postComments.querySelector(`#comment-text-${commentId}`);
    const editForm = postComments.querySelector(`#edit-form-${commentId}`);

    if (commentText) commentText.style.display = 'block';
    if (editForm) editForm.style.display = 'none';
}

// Helper function to find post ID from a comment element
function getPostIdFromCommentElement(commentId) {
    const commentElement = document.querySelector(`.fb-comment-item[data-comment-id="${commentId}"]`);
    if (!commentElement) return null;

    // Walk up the DOM to find the closest post element
    let parent = commentElement.parentElement;
    while (parent && !parent.classList.contains('post')) {
        parent = parent.parentElement;
    }

    return parent ? parent.getAttribute('data-post-id') : null;
}

// Save function needs to update both places
function saveModalCommentEdit(commentId) {
    // Get the edit form textarea from the modal
    const commentOverlay = document.getElementById('comment-overlay');
    const editForm = commentOverlay.querySelector(`#edit-form-${commentId} .edit-comment-textarea`);

    if (!editForm) return;

    const newContent = editForm.value.trim();
    saveCommentEditCommon(commentId, newContent);
}

function saveEmbeddedCommentEdit(commentId) {
    // Get the edit form textarea from the embedded section
    const postId = currentPostId || getPostIdFromCommentElement(commentId);
    const postComments = document.getElementById(`post-comments-${postId}`);
    const editForm = postComments.querySelector(`#edit-form-${commentId} .edit-comment-textarea`);

    if (!editForm) return;

    const newContent = editForm.value.trim();
    saveCommentEditCommon(commentId, newContent);
}

// Common function to handle the AJAX request and update both views
function saveCommentEditCommon(commentId, newContent) {
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
                    // Update the comment content in both places
                    document.querySelectorAll(`#comment-text-${commentId}`).forEach(element => {
                        if (element) element.textContent = newContent;
                    });

                    // Hide the edit form and show the updated comment text in both places
                    const modalElement = document.querySelector(`#comment-overlay #comment-text-${commentId}`);
                    const modalForm = document.querySelector(`#comment-overlay #edit-form-${commentId}`);
                    if (modalElement) modalElement.style.display = 'block';
                    if (modalForm) modalForm.style.display = 'none';

                    const postId = currentPostId || getPostIdFromCommentElement(commentId);
                    const embeddedElement = document.querySelector(`#post-comments-${postId} #comment-text-${commentId}`);
                    const embeddedForm = document.querySelector(`#post-comments-${postId} #edit-form-${commentId}`);
                    if (embeddedElement) embeddedElement.style.display = 'block';
                    if (embeddedForm) embeddedForm.style.display = 'none';

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
document.getElementById('commentInput').addEventListener('input', function () {
    const currentLength = this.value.length;
    const maxLength = 200;
    const remainingChars = maxLength - currentLength;
    const limitElement = document.getElementById('commentLimit');

    if (currentLength >= maxLength) {
        this.style.borderColor = 'red';
        limitElement.style.color = 'red';
        limitElement.textContent = `You've exceeded the max limit of ${maxLength} characters!`;
    } else {
        this.style.borderColor = 'green';
        limitElement.style.color = 'green';
        limitElement.textContent = `Max ${remainingChars} characters left`;
    }
});

// Event listener for embedded comment inputs (all posts)
document.querySelectorAll('[id^="commentInput-"]').forEach(input => {
    input.addEventListener('input', function () {
        const currentLength = this.value.length;
        const maxLength = 200;
        const remainingChars = maxLength - currentLength;
        const limitElement = this.closest('.fb-comment-section').querySelector('.comment-limit-info span');

        if (currentLength >= maxLength) {
            this.style.borderColor = 'red';
            limitElement.style.color = 'red';
            limitElement.textContent = `You've exceeded the max limit of ${maxLength} characters!`;
        } else {
            this.style.borderColor = 'green';
            limitElement.style.color = 'green';
            limitElement.textContent = `Max ${remainingChars} characters left`;
        }
    });
});


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

// Show the report comment form
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

document.addEventListener('DOMContentLoaded', function () {
    console.log('Script is loaded and running');
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        createNotificationModal();
    }

    // Load all comment counts when page loads
    loadAllCommentCounts();


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

        // Basic time formatting function
        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
        }

        // Play button click handler to trigger global player
      
        playBtn.addEventListener('click', function (event) {
            event.stopPropagation(); // Prevent event bubbling

            // Find song information
            const songItem = player.closest('.song-item');
            const post = songItem.closest('.post');

            // Extract song ID from the audio element's ID
            const audioElement = player.querySelector('audio');
            const songId = audioElement ? audioElement.id.replace('audio-', '') : null;

            const songTitle = songItem.querySelector('.song-info span')?.textContent.trim() ||
                "Unknown Song";
            const artistName = post.querySelector('.post-author')?.textContent ||
                "Unknown Artist";
            const imageUrl = post.querySelector('.song-image')?.src || null;

            // Create song info object with songId included
            const songInfo = {
                url: songUrl,
                title: songTitle,
                artist: artistName,
                imageUrl: imageUrl,
                element: player,
                id: songId // Add the song ID to the songInfo object
            };

            // Just play the song without modifying any playlist
            if (typeof window.playWithGlobalPlayer === 'function') {
                window.playWithGlobalPlayer(songUrl, songInfo, true); // true flag indicates standalone play
            }
        });

        // These event listeners are just for visual feedback in the local player UI
        // The actual playback happens in the global player
        if (audio) {
            audio.addEventListener('timeupdate', function () {
                const progress = (audio.currentTime / audio.duration) * 100;
                if (progressBar) progressBar.style.width = `${progress}%`;
                if (timeDisplay) timeDisplay.textContent = formatTime(audio.currentTime);
            });

            audio.addEventListener('loadedmetadata', function () {
                if (timeDisplay) timeDisplay.textContent = formatTime(audio.duration);
            });
        }

        // Click on progress bar to seek - this will be handled by global player
        if (progressContainer) {
            progressContainer.addEventListener('click', function (e) {
                e.stopPropagation();
                // We'll let the global player handle actual seeking
            });
        }
    });

    // Volume slider functionality - will be handled by global player
    document.querySelectorAll(".volume-slider").forEach(slider => {
        slider.addEventListener("input", function () {
            let songId = this.id.replace("volume-slider-", "");
            let audio = document.getElementById(`audio-${songId}`);

            // Set volume on global player if playing this song
            if (typeof window.globalAudio !== 'undefined' && audio) {
                window.globalAudio.volume = this.value;

                // Update volume UI if function exists
                if (typeof window.updateVolumeIcon === 'function') {
                    window.updateVolumeIcon(this.value);
                }
            }
        });
    });
});
document.addEventListener('DOMContentLoaded', function () {
    // Đảm bảo tất cả các sự kiện được gắn khi DOM đã tải
    loadAllCommentCounts();

    // Đảm bảo rằng nút submit comment xử lý sự kiện nhập phím 'Enter'
    document.querySelectorAll('.fb-comment-input').forEach(input => {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                submitComment({ target: this.closest('.fb-comment-input-wrapper').querySelector('.fa-paper-plane') });
            }
        });
    });

    // Đóng overlay khi click ngoài
    document.addEventListener('click', function (event) {
        const commentOverlay = document.getElementById('comment-overlay');
        if (commentOverlay.style.display === 'flex' &&
            !event.target.closest('.comment-container') &&
            !event.target.closest('.comment-btn')) {
            closeCommentSection();
        }
    });

    // Các hàm xử lý các nút khác...
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
                        showNotification("You can only edit your own posts", "warning");
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
// Save post edit with image handling
function savePostEdit() {
    const postId = document.getElementById('edit-post-id').value;
    const content = document.getElementById('edit-post-content').value.trim();

    if (!content) {
        showNotification("Post content cannot be empty", "error");
        return;
    }

    // First check if there's a new image to upload
    if (newImageFile) {
        // Create FormData for image upload
        const imageFormData = new FormData();
        imageFormData.append('image', newImageFile);

        // Upload the image first
        const uploadXhr = new XMLHttpRequest();
        uploadXhr.open("POST", "/Post/UploadImage", true);

        uploadXhr.onreadystatechange = function () {
            if (uploadXhr.readyState === 4) {
                if (uploadXhr.status === 200) {
                    try {
                        const uploadResponse = JSON.parse(uploadXhr.responseText);
                        // Now we have the image URL, proceed with post update
                        updatePost(postId, content, uploadResponse.imageUrl);
                    } catch (error) {
                        console.error("Error parsing upload response:", error);
                        showNotification("Could not upload image. Please try again.", "error");
                    }
                } else {
                    console.error("Error uploading image:", uploadXhr.responseText);
                    showNotification("Could not upload image. Please try again.", "error");
                }
            }
        };

        uploadXhr.send(imageFormData);
    } else {
        // No new image, just update the post with original image or null
        updatePost(postId, content, originalImageUrl);
    }
}

// Helper function to update post after handling image
function updatePost(postId, content, imageUrl) {
    // Create edit data
    const editData = {
        userId: parseInt(currentUserId),
        content: content,
        imageUrl: imageUrl
    };

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
                        if (imageUrl) {
                            if (imageEl) {
                                imageEl.src = imageUrl;
                            } else {
                                const contentDiv = postElement.querySelector('.post-content');
                                const newImg = document.createElement('img');
                                newImg.src = imageUrl;
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

// Submit post report
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


// Variables for slideshow
let slideIndex = 1;
let slideTimer;
const slideDelay = 5000; // 5 seconds between slides

// Initialize slideshow when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Restructure the slides to have two song cards per slide
    restructureSlides();

    // Show the first slide
    showSongSlides(slideIndex);

    // Start automatic slideshow
    startSlideTimer();
});

// Restructure the slides to have two song cards per slide
function restructureSlides() {
    const songSlideContainer = document.querySelector('.song-slideshow-container');
    const originalSlides = Array.from(document.querySelectorAll('.song-slide'));

    // Remove all slides
    originalSlides.forEach(slide => slide.remove());

    // Create new slides with two song cards each
    for (let i = 0; i < originalSlides.length; i += 2) {
        const newSlide = document.createElement('div');
        newSlide.className = 'song-slide fade';

        const slideContent = document.createElement('div');
        slideContent.className = 'song-slide-content';

        // Add the current song card
        const card1 = originalSlides[i].querySelector('.song-card');
        slideContent.appendChild(card1.cloneNode(true));

        // Add the next song card if it exists
        if (i + 1 < originalSlides.length) {
            const card2 = originalSlides[i + 1].querySelector('.song-card');
            slideContent.appendChild(card2.cloneNode(true));
        } else {
            // Create an empty placeholder if there's an odd number of cards
            const emptyCard = document.createElement('div');
            emptyCard.className = 'song-card empty-card';
            slideContent.appendChild(emptyCard);
        }

        newSlide.appendChild(slideContent);
        songSlideContainer.appendChild(newSlide);
    }

    // Update the dots
    updateSlideDots();
}

// Update the slide dots to match the new number of slides
function updateSlideDots() {
    const dotsContainer = document.querySelector('.slide-dots-container');
    dotsContainer.innerHTML = '';

    const slides = document.querySelectorAll('.song-slide');
    for (let i = 0; i < slides.length; i++) {
        const dot = document.createElement('span');
        dot.className = 'slide-dot';
        dot.onclick = function () { currentSongSlide(i + 1); };
        dotsContainer.appendChild(dot);
    }
}

// Next/previous controls
function plusSongSlides(n) {
    showSongSlides(slideIndex += n);
    resetSlideTimer();
}

// Thumbnail image controls
function currentSongSlide(n) {
    showSongSlides(slideIndex = n);
    resetSlideTimer();
}

// Reset the slide timer
function resetSlideTimer() {
    clearTimeout(slideTimer);
    startSlideTimer();
}

// Start the slide timer
function startSlideTimer() {
    slideTimer = setTimeout(function () {
        plusSongSlides(1);
    }, slideDelay);
}

// Show the slides
function showSongSlides(n) {
    let i;
    const slides = document.querySelectorAll(".song-slide");
    const dots = document.querySelectorAll(".slide-dot");

    if (slides.length === 0) return;

    // Loop around if past the end or beginning
    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }

    // Add slide animation classes
    for (i = 0; i < slides.length; i++) {
        if (i === slideIndex - 1) {
            slides[i].classList.add("slide-in");
            slides[i].classList.remove("slide-out");
        } else {
            slides[i].classList.add("slide-out");
            slides[i].classList.remove("slide-in");
        }
        slides[i].style.display = "none";
    }

    // Update dot classes
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active-slide-dot", "");
    }

    // Show the current slide and activate its dot
    slides[slideIndex - 1].style.display = "block";
    if (dots.length > 0) {
        dots[slideIndex - 1].className += " active-slide-dot";
    }

    // Set up play button event listeners
    const slidePlayButtons = document.querySelectorAll('.slide-play-btn');

    slidePlayButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            event.stopPropagation();

            const songUrl = this.getAttribute('data-song-url');
            const songId = this.getAttribute('data-song-id');

            // Find the song card element
            const songCard = this.closest('.song-card');
            if (!songCard) return;

            // Get song information
            const songTitle = songCard.querySelector('.song-title')?.textContent || "Unknown Song";
            const artistName = songCard.querySelector('.song-artist')?.textContent || "Unknown Artist";
            const imageUrl = songCard.querySelector('img')?.src || null;

            // Create song info object with id included
            const songInfo = {
                url: songUrl,
                title: songTitle,
                artist: artistName,
                imageUrl: imageUrl,
                element: songCard,
                id: songId // Include the song ID
            };

            // Play using the global player
            if (typeof window.playWithGlobalPlayer === 'function') {
                window.playWithGlobalPlayer(songUrl, songInfo, true);
            }
        });
    });
}

// Add event listeners for song card interactions
document.addEventListener('click', function (e) {
    const target = e.target;

    // Play button click
    if (target.closest('.slide-play-btn')) {
        e.preventDefault();
        const playBtn = target.closest('.slide-play-btn');
        const songUrl = playBtn.getAttribute('data-song-url');
        const songId = playBtn.getAttribute('data-song-id');

        if (songUrl && typeof playInGlobalPlayer === 'function') {
            playInGlobalPlayer(songUrl, songId);
        }
    }
});




// Recent Plays Slideshow - Modified to show 3 songs per slide

document.addEventListener('DOMContentLoaded', function () {
    // Create slides containing 3 song cards each
    organizeRecentPlaySlides();

    // Initialize slideshow variables
    let recentPlaySlideIndex = 1;
    const recentPlaySlides = document.querySelectorAll('.recent-play-slide');
    // Removed auto-slide timer variable

    // Initialize slideshow
    initRecentPlaySlideshow();

    // Handle navigation buttons
    const prevRecentButton = document.querySelector('.prev-recent');
    const nextRecentButton = document.querySelector('.next-recent');

    if (prevRecentButton) {
        prevRecentButton.addEventListener('click', function () {
            plusRecentPlaySlides(-1);
        });
    }

    if (nextRecentButton) {
        nextRecentButton.addEventListener('click', function () {
            plusRecentPlaySlides(1);
        });
    }

    // Group song cards into slides of 3
    function organizeRecentPlaySlides() {
        const container = document.querySelector('.recent-plays-container');
        if (!container) return;

        // Get all individual song cards
        const songCards = document.querySelectorAll('.recent-plays-container .song-card');
        if (songCards.length === 0) return;

        // Create new structure
        const tempContainer = document.createElement('div');

        // Calculate how many slides we need (3 cards per slide)
        const slideCount = Math.ceil(songCards.length / 3);

        for (let i = 0; i < slideCount; i++) {
            // Create slide
            const slide = document.createElement('div');
            slide.className = 'recent-play-slide fade';

            // Create flex container for the 3 cards
            const flexContainer = document.createElement('div');
            flexContainer.className = 'recent-play-flex-container';

            // Add up to 3 cards to this slide
            for (let j = 0; j < 3; j++) {
                const cardIndex = i * 3 + j;
                if (cardIndex < songCards.length) {
                    flexContainer.appendChild(songCards[cardIndex].cloneNode(true));
                }
            }

            slide.appendChild(flexContainer);
            tempContainer.appendChild(slide);
        }

        // Find and preserve navigation buttons
        const prevBtn = container.querySelector('.prev-recent');
        const nextBtn = container.querySelector('.next-recent');
        const dotsContainer = container.querySelector('.recent-plays-dots-container');

        // Replace container content
        container.innerHTML = tempContainer.innerHTML;

        // Add back navigation elements
        if (prevBtn) container.appendChild(prevBtn);
        if (nextBtn) container.appendChild(nextBtn);
        if (dotsContainer) container.appendChild(dotsContainer);
    }

    // Initialize slideshow
    function initRecentPlaySlideshow() {
        if (recentPlaySlides.length === 0) return;

        // Hide all slides
        recentPlaySlides.forEach(slide => {
            slide.style.display = 'none';
        });

        // Show first slide
        recentPlaySlides[0].style.display = 'block';

        // Create navigation dots
        createRecentPlayDots();

        // Active first dot
        const dots = document.querySelectorAll('.recent-play-dot');
        if (dots.length > 0) {
            dots[0].classList.add('active');
        }

        // Auto-slide functionality removed
    }

    // Create dots for navigation
    function createRecentPlayDots() {
        const dotsContainer = document.querySelector('.recent-plays-dots-container');
        if (!dotsContainer) return;

        dotsContainer.innerHTML = '';

        for (let i = 0; i < recentPlaySlides.length; i++) {
            const dot = document.createElement('span');
            dot.className = 'recent-play-dot';
            dot.addEventListener('click', function () {
                // No need to clear timeout since auto-slide is removed
                currentRecentPlaySlide(i + 1);
            });
            dotsContainer.appendChild(dot);
        }
    }

    // Go to specific slide
    function currentRecentPlaySlide(n) {
        showRecentPlaySlides(recentPlaySlideIndex = n);
    }

    // Navigate to next/previous slide
    function plusRecentPlaySlides(n) {
        showRecentPlaySlides(recentPlaySlideIndex += n);
    }

    // Show slides and update dots
    function showRecentPlaySlides(n) {
        const dots = document.querySelectorAll('.recent-play-dot');

        // Handle case where index exceeds slide count
        if (n > recentPlaySlides.length) {
            recentPlaySlideIndex = 1;
        }
        if (n < 1) {
            recentPlaySlideIndex = recentPlaySlides.length;
        }

        // Hide all slides
        recentPlaySlides.forEach(slide => {
            slide.style.display = 'none';
        });

        // Remove active from all dots
        dots.forEach(dot => {
            dot.classList.remove('active');
        });

        // Show current slide and activate corresponding dot
        recentPlaySlides[recentPlaySlideIndex - 1].style.display = 'block';
        if (dots.length > 0) {
            dots[recentPlaySlideIndex - 1].classList.add('active');
        }

        // Auto-slide functionality removed
    }

    // Auto-advance function removed

    // Handle play button clicks in recent plays
    const recentPlayBtns = document.querySelectorAll('.recent-play-slide .slide-play-btn');
    recentPlayBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation(); // Prevent navigation to song page

            const songUrl = this.getAttribute('data-song-url');
            const songId = this.getAttribute('data-song-id');
            const songCard = this.closest('.song-card');

            if (!songCard) return;

            const songTitle = songCard.querySelector('.song-title')?.textContent || "Unknown Song";
            const artistName = songCard.querySelector('.song-artist')?.textContent || "Unknown Artist";
            const imageUrl = songCard.querySelector('img')?.src || null;

            const songInfo = {
                url: songUrl,
                title: songTitle,
                artist: artistName,
                imageUrl: imageUrl,
                element: songCard,
                id: songId
            };

            // Play song with global player
            if (typeof window.playWithGlobalPlayer === 'function') {
                window.playWithGlobalPlayer(songUrl, songInfo, true);
            }
        });
    });
});