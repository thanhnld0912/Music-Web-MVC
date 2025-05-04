function toggleProfileMenu(event) {
    event.stopPropagation();
    document.getElementById('profileMenu').classList.toggle('show');
}

function togglePassword() {
    var passwordField = document.getElementById("displayPassword");
    var passwordIcon = document.getElementById("passwordIcon");

    // Nếu mật khẩu hiện tại là dấu sao
    if (passwordField.innerHTML === "********") {
        // Gửi yêu cầu AJAX đến server để lấy mật khẩu thực tế
        fetch("/Account/GetPassword")
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Hiển thị mật khẩu thực tế
                    passwordField.innerHTML = data.password;
                    passwordIcon.classList.remove("fa-eye");
                    passwordIcon.classList.add("fa-eye-slash"); // Hiển thị mắt kín
                } else {
                    alert(data.message);
                }
            })
            .catch(error => console.error("Error:", error));
    } else {
        passwordField.innerHTML = "********"; // Chuyển lại thành dấu sao
        passwordIcon.classList.remove("fa-eye-slash");
        passwordIcon.classList.add("fa-eye"); // Hiển thị mắt mở
    }
}

function togglePasswordVisibility(passwordFieldId) {
    var passwordField = document.getElementById(passwordFieldId);
    var passwordIcon = document.getElementById(passwordFieldId + "Icon");

    if (passwordField.type === "password") {
        passwordField.type = "text";
        passwordIcon.classList.remove("fa-eye");
        passwordIcon.classList.add("fa-eye-slash");
    } else {
        passwordField.type = "password";
        passwordIcon.classList.remove("fa-eye-slash");
        passwordIcon.classList.add("fa-eye");
    }
}

document.getElementById('profileImage').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        // Check if the file is an image
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size should not exceed 5MB');
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            document.getElementById('previewImage').src = e.target.result;
        }

        reader.readAsDataURL(file);
    }
});

// Toggle password change section
function togglePasswordSection() {
    const passwordSection = document.getElementById('passwordChangeSection');
    const updatePasswordBtn = document.getElementById('updatePasswordBtn');

    if (passwordSection.style.display === 'none' || !passwordSection.style.display) {
        passwordSection.style.display = 'block';
        updatePasswordBtn.textContent = 'Cancel Password Update';
        updatePasswordBtn.classList.add('btn-secondary');
        updatePasswordBtn.classList.remove('btn-primary');
    } else {
        passwordSection.style.display = 'none';
        updatePasswordBtn.textContent = 'Update Password';
        updatePasswordBtn.classList.add('btn-primary');
        updatePasswordBtn.classList.remove('btn-secondary');
        // Clear password fields
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }
}

document.getElementById("saveChanges").addEventListener("click", function () {
    console.log("Save Changes clicked!");

    // Validate input fields
    var updatedUsername = document.getElementById("username").value;
    var updatedEmail = document.getElementById("email").value;
    var updatedBio = document.getElementById("bio").value;
    var newPassword = document.getElementById("newPassword").value;
    var confirmPassword = document.getElementById("confirmPassword").value;
    var profileImageInput = document.getElementById("profileImage");

    // Validate required fields
    if (!updatedUsername || !updatedEmail) {
        alert("Username and email are required!");
        return;
    }

    // Validate email format
    if (!/^\S+@\S+\.\S+$/.test(updatedEmail)) {
        alert("Please enter a valid email address");
        return;
    }

    // Check if passwords match - only if new password is provided

        if (confirmPassword && newPassword !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // Create FormData object to handle file upload
    var formData = new FormData();
    formData.append("Username", updatedUsername);
    formData.append("Email", updatedEmail);
    formData.append("Bio", updatedBio || "");

    // Only append password if provided
    if (newPassword) {
        formData.append("Password", newPassword);
    }

    // Add profile image if selected
    if (profileImageInput.files.length > 0) {
        formData.append("ProfileImage", profileImageInput.files[0]);
    }

    // Show loading state
    const saveButton = document.getElementById('saveChanges');
    const originalText = saveButton.textContent;
    saveButton.textContent = "Saving...";
    saveButton.disabled = true;

    // Send AJAX request to the server with proper headers
    fetch("/Account/UpdateProfile", {
        method: "POST",
        body: formData,
        // No need to set Content-Type when using FormData
        // FormData automatically sets the correct multipart/form-data Content-Type
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Server returned " + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert("Profile updated successfully!");
                window.location.reload(); // Refresh the page to show updates
            } else {
                alert(data.message || "Failed to update profile.");
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred while updating the profile.");
        })
        .finally(() => {
            // Reset button state
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        });
});

function showTab(event, tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

function openModal() {
    const modal = document.getElementById('updateInfoModal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeModal() {
    const modal = document.getElementById('updateInfoModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300); // Match transition timing
}

// Close profile menu when clicking outside
document.addEventListener('click', function (event) {
    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu && profileMenu.classList.contains('show')) {
        if (!event.target.closest('.avatar-container')) {
            profileMenu.classList.remove('show');
        }
    }
});

// Initialize - hide password section by default
window.addEventListener('DOMContentLoaded', function () {
    const passwordSection = document.getElementById('passwordChangeSection');
    if (passwordSection) {
        passwordSection.style.display = 'none';
    }
});