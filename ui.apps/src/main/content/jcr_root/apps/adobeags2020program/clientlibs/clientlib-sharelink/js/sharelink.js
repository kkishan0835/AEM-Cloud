function addCustomFields() {
  const dialog = document.querySelector(".spectrum-Dialog-content_6d8b48");
  if (dialog && !dialog.querySelector(".custom-share-extension")) {
    console.log("Dialog found. Checking for expiration date container.");
    let expirationDateContainer = dialog.querySelector(".react-spectrum-Datepicker-fieldWrapper_f02f90");
    if (!expirationDateContainer) {
      expirationDateContainer = Array.from(dialog.querySelectorAll(".spectrum-Field_d2db1f"))
                                    .find(el => el.textContent.includes("Expiration Date"));
    }

    if (expirationDateContainer) {
      console.log("Expiration date container found.");

      // Create a container for new fields
      const container = document.createElement("div");
      container.className = "custom-share-extension";

      // Text Field
      const textFieldLabel = document.createElement("label");
      textFieldLabel.textContent = "Password:";
      textFieldLabel.className = "spectrum-FieldLabel_d2db1f";
      container.appendChild(textFieldLabel);

      const textField = document.createElement("input");
      textField.type = "text";
      textField.className = "spectrum-Textfield-input_73bc77";
      container.appendChild(textField);

      // Dropdown Field
      const dropdownLabel = document.createElement("label");
      dropdownLabel.textContent = "Approval:";
      dropdownLabel.className = "spectrum-FieldLabel_d2db1f";
      container.appendChild(dropdownLabel);

      const selectField = document.createElement("select");
      selectField.className = "spectrum-Textfield-input_73bc77";
      ["Select Approver", "Option 1", "Option 2"].forEach(optionText => {
        const option = document.createElement("option");
        option.value = optionText.toLowerCase().replace(/ /g, "");
        option.textContent = optionText;
        selectField.appendChild(option);
      });
      container.appendChild(selectField);

      const spacer = document.createElement("div");
      spacer.style.height = "10px"; // Adjust height for spacing as needed
      container.appendChild(spacer);

      const submitButton = document.createElement("button");
      submitButton.type = "button";
      submitButton.className = "spectrum-Button_e2d99e"; // Adjust class as needed
      submitButton.textContent = "Submit";

      // Optional: Add click handler to the submit button
      submitButton.addEventListener("click", function () {
    const password = textField.value.trim();
    if (!password) {
        alert("Please enter a password.");
        return;
    }

    const encryptedPassword = CryptoJS.AES.encrypt(password, 'secret-key').toString();
	window.encryptedPassword = encryptedPassword;
    const shareLinkInput = document.querySelector("input[data-instance-id='publiclinkshare-link']");
    if (!shareLinkInput) {
        console.warn("Share link input not found.");
        return;
    }

    // Update the Share Link URL with password
    const currentUrl = shareLinkInput.value;
    const url = new URL(currentUrl);
    url.searchParams.set("pw", encryptedPassword);
    const updatedUrl = url.toString();

    // Update the visible input field
    const newInput = shareLinkInput.cloneNode(true);
    newInput.removeAttribute("readonly");
    newInput.value = updatedUrl; // Update DOM property
    newInput.setAttribute("value", updatedUrl); // Update HTML attribute
    newInput.setAttribute("readonly", "");
	window.updatedShareLinkUrl = updatedUrl;
    shareLinkInput.parentNode.replaceChild(newInput, shareLinkInput);

    // Update Copy Button
    const copyButton = document.querySelector("[data-instance-id='publiclinkshare-copybutton']");
    if (copyButton) {
        // Replace copy button to remove existing React handlers
        const newCopyButton = copyButton.cloneNode(true);
        copyButton.parentNode.replaceChild(newCopyButton, copyButton);

        // Set updated clipboard data (if used internally)
        newCopyButton.setAttribute("data-clipboard-text", updatedUrl);

        // Add animation feedback (optional)
        newCopyButton.addEventListener("mousedown", () => {
            newCopyButton.classList.add("is-active");
        });
        newCopyButton.addEventListener("mouseup", () => {
            setTimeout(() => {
                newCopyButton.classList.remove("is-active");
            }, 150);
        });

        // Override click to use updated URL
        newCopyButton.addEventListener("click", function () {
            navigator.clipboard.writeText(updatedUrl).then(() => {
                console.log("Copied updated URL to clipboard:", updatedUrl);
                
                // Optional: show a visual notification
                // Show AEM-style success banner
    const existingBanner = document.querySelector('.link-copied-banner');
    if (!existingBanner) {
        const banner = document.createElement("div");
        banner.className = "link-copied-banner coral-Alert coral-Alert--success";
        banner.setAttribute("role", "alert");
        banner.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            width: 300px;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        `;

        banner.innerHTML = `
            <coral-icon icon="checkCircle" class="coral-Alert-icon" size="S"></coral-icon>
            <div class="coral-Alert-content" style="flex: 1; margin-left: 10px;">Link copied.</div>
            <button is="coral-button" variant="quiet" icon="close" class="coral-Alert-closeButton" style="margin-left: 10px;"></button>
        `;

        // Append to the dialog
        const dialog = document.querySelector(".spectrum-Dialog-content_6d8b48");
        if (dialog) {
            dialog.prepend(banner);

            // Remove after 3 seconds or on close click
            setTimeout(() => banner.remove(), 3000);
            banner.querySelector(".coral-Alert-closeButton").addEventListener("click", () => banner.remove());
        }
    }

            }).catch(err => {
                console.error("Clipboard error:", err);
                alert("Failed to copy link.");
            });
        });
    }

    console.log("Updated Share Link input and copy button with new URL:", updatedUrl);
});

      container.appendChild(submitButton);

      // Insert the custom container after the expiration date container
      expirationDateContainer.parentNode.insertBefore(container, expirationDateContainer.nextSibling);
      console.log("Custom extension added with dropdown.");
      
      // Stop poller if successful
      clearInterval(poller);
    } else {
      console.log("Expiration date container not found, retrying...");
    }
  }
}

// Polling mechanism to check for dialog content readiness
const poller = setInterval(addCustomFields, 500); // Check every 500ms
