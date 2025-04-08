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

    // Kiểm tra nếu mật khẩu hiện tại đang bị ẩn (kiểu "password")
    if (passwordField.type === "password") {
        passwordField.type = "text";  // Đổi kiểu input thành "text" để hiển thị mật khẩu
        passwordIcon.classList.remove("fa-eye");
        passwordIcon.classList.add("fa-eye-slash");  // Chuyển biểu tượng thành mắt kín
    } else {
        passwordField.type = "password";  // Đổi lại kiểu input thành "password" để ẩn mật khẩu
        passwordIcon.classList.remove("fa-eye-slash");
        passwordIcon.classList.add("fa-eye");  // Chuyển biểu tượng thành mắt mở
    }
}



document.getElementById("saveChanges").addEventListener("click", function () {
    console.log("Save Changes clicked!"); // Kiểm tra sự kiện click

    // Lấy giá trị từ các input
    var updatedUsername = document.getElementById("username").value;
    var updatedEmail = document.getElementById("email").value;
    var updatedBio = document.getElementById("bio").value;
    var newPassword = document.getElementById("newPassword").value;
    var confirmPassword = document.getElementById("confirmPassword").value;

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu có khớp không
    if (newPassword !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    var updateData = {
        Username: updatedUsername,
        Email: updatedEmail,
        Bio: updatedBio,
        Password: newPassword // Gửi mật khẩu mới cho server nếu có
    };

    console.log(updateData); // Kiểm tra dữ liệu sẽ được gửi đi

    // Gửi yêu cầu cập nhật tới server
    fetch("/Account/UpdateProfile", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Profile updated successfully!");
                window.location.reload(); // Làm mới trang để hiển thị thông tin đã thay đổi
            } else {
                alert(data.message || "Failed to update profile.");
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred while updating the profile.");
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