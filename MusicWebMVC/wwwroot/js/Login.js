const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
    container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
    container.classList.remove("right-panel-active");
});

// Kiểm tra nếu URL có query `?register=true` thì mặc định mở form đăng ký
document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById('container');
    const urlParams = new URLSearchParams(window.location.search);
    const isRegister = urlParams.get('register');

    if (isRegister === 'true') {
        container.classList.add("right-panel-active"); // Hiển thị form đăng ký
    } else {
        container.classList.remove("right-panel-active"); // Hiển thị form đăng nhập
    }
});