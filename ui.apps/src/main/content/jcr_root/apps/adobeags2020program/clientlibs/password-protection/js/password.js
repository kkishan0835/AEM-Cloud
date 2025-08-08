document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const encryptedPassword = urlParams.get('pw');
    const shParam = urlParams.get('sh');
    if (!shParam) return; // No share link = skip protection

    // Optional: hide page until password is validated
    document.body.style.display = 'none';

    const decryptedPasswordBytes = CryptoJS.AES.decrypt(encryptedPassword, 'secret-key');
    const decryptedPassword = decryptedPasswordBytes.toString(CryptoJS.enc.Utf8);

    function promptPassword() {
        const userPassword = prompt("This link is password protected. Please enter the password:");
        if (userPassword === decryptedPassword) {
            document.body.style.display = ''; // Show content
        } else {
            alert("Incorrect password. Please try again.");
            promptPassword(); // Recursively call until correct password is entered
        }
    }

    promptPassword();
});
