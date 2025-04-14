let currentPostId = null;
let currentUserId = null;
let commentsStore = {};
let postToDelete = null;
let postToEdit = null;
let originalImageUrl = null;
let newImageFile = null;
document.addEventListener('DOMContentLoaded', function () {
    console.log('Script is loaded and running');
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        createNotificationModal();
    }

    // Initialize global variables
    currentPostId = document.getElementById('post-id')?.value;
    currentUserId = document.getElementById('current-user-id')?.value;
    commentsStore = {};
    postToDelete = null;
    postToEdit = null;
    originalImageUrl = null;
    newImageFile = null;

    // Load all comment counts when page loads
    loadAllCommentCounts();

    // Set up event listeners for closing overlays
    setupEventListeners();

    // Initialize audio players
    initializeAudioPlayers();
});

function setupEventListeners() {
    // Close comment overlay when clicked outside
    document.addEventListener('click', function (event) {
        const commentOverlay = document.getElementById('comment-overlay');
        if (commentOverlay && commentOverlay.style.display === 'flex' &&
            !event.target.closest('.comment-container') &&
            !event.target.closest('.comment-btn')) {
            closeCommentSection();
        }
    });

    // Close post menus when clicking outside
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.post-options') && !event.target.closest('.post-menu')) {
            document.querySelectorAll('.post-menu').forEach(menu => {
                menu.style.display = 'none';
            });
        }

        // Don't close edit overlay when clicking inside it
        const editOverlay = document.getElementById('edit-post-overlay');
        if (editOverlay && editOverlay.style.display === 'flex' &&
            !event.target.closest('.edit-container') &&
            !event.target.closest('.post-options')) {
            closeEditForm();
        }

        // Don't close delete confirm when clicking inside it
        const deleteOverlay = document.getElementById('delete-confirm-overlay');
        if (deleteOverlay && deleteOverlay.style.display === 'block' &&
            !event.target.closest('.confirm-container')) {
            closeDeleteConfirm();
        }
    });

    // Set up comment input for Enter key
    const commentInput = document.getElementById('comment-input');
    if (commentInput) {
        commentInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                submitComment();
            }
        });
    }
}

function toggleProfileMenu(event) {
    event.stopPropagation();
    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu) {
        profileMenu.classList.toggle('show');
    }
}

function toggleSidebar(event) {
    event.stopPropagation();
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

function toggleChatBox(event, boxId) {
    event.stopPropagation();

    // Close all chat boxes first
    document.querySelectorAll('.chat-box').forEach(box => {
        box.style.display = 'none';
    });

    // Then open the selected box
    const chatBox = document.getElementById(boxId);
    if (chatBox) {
        chatBox.style.display = 'block';
    }
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
    const playlistNameInput = document.querySelector('#new-playlist-name');
    if (!playlistNameInput) {
        showNotification("Playlist input not found", "error");
        return;
    }

    const playlistName = playlistNameInput.value.trim();

    if (!playlistName) {
        showNotification("Playlist name cannot be empty", "error");
        return;
    }

    // Create AJAX request
    const xhr = new XMLHttpRequest();

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
                        showNotification(response.message || "Could not create playlist", "error");
                    }
                } catch (error) {
                    console.error("Error parsing response:", error);
                    showNotification("An error occurred while creating playlist", "error");
                }
            } else {
                console.error("Error creating playlist:", xhr.status, xhr.responseText);
                try {
                    const response = JSON.parse(xhr.responseText);
                    showNotification(response.message || "Could not create playlist", "error");
                } catch (error) {
                    showNotification("An error occurred while creating playlist", "error");
                }
            }
        }
    };

    // Send as form data
    xhr.send(`playlistName=${encodeURIComponent(playlistName)}`);
}

function addSongToPlaylist(playlistId) {
    const postId = document.getElementById('post-id')?.value;
    if (!postId) {
        showNotification("Post ID not found", "error");
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/Playlist/AddSongToPlaylist`, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        showNotification("Song added to playlist successfully", "success");
                        closeModal('playlistModal');
                    } else {
                        showNotification(response.message || "Could not add song to playlist", "error");
                    }
                } catch (error) {
                    console.error("Error parsing response:", error);
                    showNotification("An error occurred while adding song to playlist", "error");
                }
            } else {
                console.error("Error adding song to playlist:", xhr.status, xhr.responseText);
                showNotification("Could not add song to playlist", "error");
            }
        }
    };

    xhr.send(`playlistId=${playlistId}&postId=${postId}`);
}

function openPlaylistModal() {
    const modal = document.getElementById('playlistModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function likePost(button, postId) {
    if (!currentUserId || currentUserId === "null") {
        showNotification("Please log in to like posts", "warning");
        return;
    }

    // Create a try-catch block for better error handling
    try {
        const isActive = button.classList.contains('active');
        const dislikeBtn = button.closest('.action-buttons-container')?.querySelector('.dislike-btn');

        if (dislikeBtn && dislikeBtn.classList.contains('active')) {
            dislikeBtn.classList.remove('active');
            const dislikeCountEl = dislikeBtn.querySelector('.count-badge');
            if (dislikeCountEl) {
                const currentDislikeCount = parseInt(dislikeCountEl.textContent);
                if (currentDislikeCount > 0) {
                    dislikeCountEl.textContent = currentDislikeCount - 1;
                }
            }
        }

        const likeCountEl = button.querySelector('.count-badge');
        if (!likeCountEl) {
            console.error("Count badge element not found");
            return;
        }

        const currentCount = parseInt(likeCountEl.textContent) || 0;

        // Update UI first for better UX (optimistic update)
        if (isActive) {
            button.classList.remove('active');
            if (currentCount > 0) {
                likeCountEl.textContent = currentCount - 1;
            }
        } else {
            button.classList.add('active');
            likeCountEl.textContent = currentCount + 1;
        }

        // Send AJAX request
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/Post/LikePost/${postId}`, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.timeout = 10000; // 10 seconds timeout

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log("Like response:", xhr.responseText);
                } else {
                    console.error("Error liking post:", xhr.responseText);
                    // Revert UI changes on error
                    if (isActive) {
                        button.classList.add('active');
                        likeCountEl.textContent = currentCount;
                    } else {
                        button.classList.remove('active');
                        likeCountEl.textContent = currentCount;
                    }
                    showNotification("Could not like post. Please try again later.", "error");
                }
            }
        };

        xhr.send(JSON.stringify(parseInt(currentUserId)));
    } catch (error) {
        console.error("Error in likePost function:", error);
        showNotification("An unexpected error occurred", "error");
    }
}

function dislikePost(button, postId) {
    if (!currentUserId || currentUserId === "null") {
        showNotification("Please log in to dislike posts", "warning");
        return;
    }

    try {
        const isActive = button.classList.contains('active');
        const likeBtn = button.closest('.action-buttons-container')?.querySelector('.like-btn');

        if (likeBtn && likeBtn.classList.contains('active')) {
            likeBtn.classList.remove('active');
            const likeCountEl = likeBtn.querySelector('.count-badge');
            if (likeCountEl) {
                const currentLikeCount = parseInt(likeCountEl.textContent);
                if (currentLikeCount > 0) {
                    likeCountEl.textContent = currentLikeCount - 1;
                }
            }
        }

        const dislikeCountEl = button.querySelector('.count-badge');
        if (!dislikeCountEl) {
            console.error("Count badge element not found");
            return;
        }

        const currentCount = parseInt(dislikeCountEl.textContent) || 0;

        // Update UI first (optimistic update)
        if (isActive) {
            button.classList.remove('active');
            if (currentCount > 0) {
                dislikeCountEl.textContent = currentCount - 1;
            }
        } else {
            button.classList.add('active');
            dislikeCountEl.textContent = currentCount + 1;
        }

        // Send AJAX request
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/Post/DislikePost/${postId}`, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.timeout = 10000; // 10 seconds timeout

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log("Dislike response:", xhr.responseText);
                } else {
                    console.error("Error disliking post:", xhr.responseText);
                    // Revert UI changes on error
                    if (isActive) {
                        button.classList.add('active');
                        dislikeCountEl.textContent = currentCount;
                    } else {
                        button.classList.remove('active');
                        dislikeCountEl.textContent = currentCount;
                    }
                    showNotification("Could not dislike post. Please try again later.", "error");
                }
            }
        };

        xhr.onerror = function () {
            // Revert UI changes on network error
            if (isActive) {
                button.classList.add('active');
                dislikeCountEl.textContent = currentCount;
            } else {
                button.classList.remove('active');
                dislikeCountEl.textContent = currentCount;
            }
            showNotification("Network error. Please check your connection.", "error");
        };

        xhr.send(JSON.stringify(parseInt(currentUserId)));
    } catch (error) {
        console.error("Error in dislikePost function:", error);
        showNotification("An unexpected error occurred", "error");
    }
}

function loadAllCommentCounts() {
    const posts = document.querySelectorAll('.post');
    posts.forEach(post => {
        const postId = post.getAttribute('data-post-id');
        if (postId) {
            fetchCommentData(postId);
        }
    });

    // Also load comments for the current post detail page
    const currentPostId = document.getElementById('post-id')?.value;
    if (currentPostId) {
        fetchCommentData(currentPostId);
    }
}

function fetchCommentData(postId) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/Post/GetComments/${postId}`, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const comments = JSON.parse(xhr.responseText);

                    // Store comments in cache
                    commentsStore[postId] = comments;

                    // Update comment count
                    updateCommentCountBadge(postId, comments.length);
                } catch (error) {
                    console.error("Error processing comments:", error);
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

function updateCommentCountDisplay(postId, count) {
    const commentsHeading = document.querySelector('.comments-section h3');
    if (commentsHeading) {
        commentsHeading.textContent = `Comments (${count})`;
    }
}

function closeCommentSection() {
    const commentOverlay = document.getElementById('comment-overlay');
    if (commentOverlay) {
        commentOverlay.style.display = 'none';
    }

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

function submitComment() {
    if (!currentUserId) {
        showNotification("Please log in to comment", "warning");
        return;
    }

    const postId = document.getElementById('post-id')?.value;
    if (!postId) {
        console.error("Post ID not found");
        showNotification("Unable to add comment. Post ID not found.", "error");
        return;
    }

    const commentInput = document.getElementById('comment-input');
    if (!commentInput) {
        console.error("Comment input element not found");
        return;
    }

    const commentText = commentInput.value.trim();
    if (!commentText) {
        showNotification("Comment cannot be empty", "warning");
        return;
    }

    // Create comment data object
    const commentData = {
        content: commentText,
        userId: parseInt(currentUserId)
    };

    // Create AJAX request
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/Post/AddComment/${postId}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.timeout = 10000; // 10 seconds timeout

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);

                    // Add new comment to the list
                    const commentsList = document.getElementById('comments-list');
                    if (commentsList) {
                        const newComment = createCommentElement(response);
                        commentsList.insertBefore(newComment, commentsList.firstChild);

                        // Remove "no comments" message if it exists
                        const noComments = commentsList.querySelector('.no-comments');
                        if (noComments) {
                            noComments.remove();
                        }
                    }

                    // Clear input field
                    commentInput.value = '';

                    // Update comment count
                    if (!commentsStore[postId]) {
                        commentsStore[postId] = [];
                    }
                    commentsStore[postId].push(response);
                    updateCommentCountDisplay(postId, commentsStore[postId].length);

                    showNotification("Comment added successfully", "success");
                } catch (error) {
                    console.error("Error parsing response:", error);
                    showNotification("Error adding comment", "error");
                }
            } else {
                console.error("Error adding comment:", xhr.responseText);
                showNotification("Could not add comment. Please try again.", "error");
            }
        }
    };

    xhr.send(JSON.stringify(commentData));
}

function createCommentElement(comment) {
    const commentItem = document.createElement('div');
    commentItem.className = 'comment';
    commentItem.setAttribute('data-comment-id', comment.id);

    const commentDate = comment.createdAt ? new Date(comment.createdAt) : new Date();
    const formattedDate = formatDate(commentDate);

    // Check if this is the current user's comment
    const isCurrentUserComment = parseInt(currentUserId) === comment.userId;

    // Create comment HTML
    let commentHTML = `
        <div class="comment-left">
            <div class="comment-user-icon">${(comment.user?.username || 'User')[0]}</div>
        </div>
        <div class="comment-right">
            <div class="comment-username">
                <a href="/Home/ProfileUser?id=${comment.userId}">
                    ${comment.user?.username || 'User'}
                </a>
            </div>
            <div class="comment-content">
                <p>${comment.content}</p>
            </div>
            <div class="comment-meta">
                <span class="comment-time">${formattedDate}</span>
                <div class="comment-actions">
                    <button class="comment-reply" onclick="replyToComment(${comment.id})">
                        <i class="fas fa-reply"></i> Reply
                    </button>
    `;

    if (isCurrentUserComment) {
        commentHTML += `
                    <button class="comment-delete" onclick="deleteComment(${comment.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
        `;
    }

    commentHTML += `
                </div>
            </div>
        </div>
    `;

    commentItem.innerHTML = commentHTML;
    return commentItem;
}

function formatDate(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${hours}:${minutes} ${day}/${month}/${year}`;
}



function deleteComment(commentId) {
    if (!confirm("Are you sure you want to delete this comment?")) {
        return;
    }

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

                // Update comment count
                const postId = document.getElementById('post-id')?.value;
                if (postId && commentsStore[postId]) {
                    commentsStore[postId] = commentsStore[postId].filter(c => c.id !== commentId);
                    updateCommentCountDisplay(postId, commentsStore[postId].length);

                    // Show "no comments" message if needed
                    if (commentsStore[postId].length === 0) {
                        const commentsList = document.getElementById('comments-list');
                        if (commentsList) {
                            commentsList.innerHTML = `
                                <div class="no-comments">
                                    <p>No comments yet. Be the first to comment!</p>
                                </div>
                            `;
                        }
                    }
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

function togglePostMenu(event, postId) {
    event.stopPropagation();

    // Close all other menus first
    document.querySelectorAll('.post-menu').forEach(menu => {
        if (menu.id !== `postMenu-${postId}`) {
            menu.style.display = 'none';
        }
    });

    const menu = document.getElementById(`postMenu-${postId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

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
                    const editIdField = document.getElementById('edit-post-id');
                    const editContentField = document.getElementById('edit-post-content');
                    const editImagePreview = document.getElementById('edit-image-preview');
                    const editImageContainer = document.getElementById('edit-image-preview-container');

                    if (editIdField && editContentField) {
                        editIdField.value = post.id;
                        editContentField.value = post.content;
                    }

                    // Handle image if exists
                    if (post.imageUrl && editImagePreview && editImageContainer) {
                        editImagePreview.src = post.imageUrl;
                        editImageContainer.style.display = 'block';
                        originalImageUrl = post.imageUrl;
                    } else if (editImageContainer) {
                        editImageContainer.style.display = 'none';
                        originalImageUrl = null;
                    }

                    // Show edit form
                    const editOverlay = document.getElementById('edit-post-overlay');
                    if (editOverlay) {
                        editOverlay.style.display = 'flex';
                    }

                    postToEdit = postId;

                    // Close post menu
                    const menu = document.getElementById(`postMenu-${postId}`);
                    if (menu) {
                        menu.style.display = 'none';
                    }
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

function savePostEdit() {
    const postIdField = document.getElementById('edit-post-id');
    const contentField = document.getElementById('edit-post-content');

    if (!postIdField || !contentField) {
        showNotification("Edit form elements not found", "error");
        return;
    }

    const postId = postIdField.value;
    const content = contentField.value.trim();

    if (!content) {
        showNotification("Post content cannot be empty", "error");
        return;
    }

    // Create edit data
    const editData = {
        userId: parseInt(currentUserId),
        content: content,
        imageUrl: originalImageUrl
    };

    // If there's a new image, handle image upload
    // For this example, we'll just use the original image URL

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/Post/EditPost/${postId}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);

                    // Close edit form
                    closeEditForm();

                    // Reload page to show updated post
                    location.reload();

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

function closeEditForm() {
    const editOverlay = document.getElementById('edit-post-overlay');
    const editIdField = document.getElementById('edit-post-id');
    const editContentField = document.getElementById('edit-post-content');
    const editImageContainer = document.getElementById('edit-image-preview-container');
    const editImagePreview = document.getElementById('edit-image-preview');

    if (editOverlay) {
        editOverlay.style.display = 'none';
    }

    if (editIdField) {
        editIdField.value = '';
    }

    if (editContentField) {
        editContentField.value = '';
    }

    if (editImageContainer) {
        editImageContainer.style.display = 'none';
    }

    if (editImagePreview) {
        editImagePreview.src = '';
    }

    postToEdit = null;
    originalImageUrl = null;
    newImageFile = null;
}

function addEditImage() {
    const imageUpload = document.getElementById('edit-image-upload');
    if (imageUpload) {
        imageUpload.click();
    }
}

function confirmDeletePost(postId) {
    console.log("confirmDeletePost called with postId:", postId);
    postToDelete = postId;

    const confirmOverlay = document.getElementById('delete-confirm-overlay');
    if (confirmOverlay) {
        confirmOverlay.style.display = 'block';
    }

    // Close the post menu
    const menu = document.getElementById(`postMenu-${postId}`);
    if (menu) {
        menu.style.display = 'none';
    }
}

function closeDeleteConfirm() {
    const confirmOverlay = document.getElementById('delete-confirm-overlay');
    if (confirmOverlay) {
        confirmOverlay.style.display = 'none';
    }
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

        @@keyframes slideIn {
                            from {
                                transform: translateX(100%);
                                opacity: 0;
                            }
                            to {
                                transform: translateX(0);
                                opacity: 1;
                            }
                        }

        @@keyframes fadeOut {
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