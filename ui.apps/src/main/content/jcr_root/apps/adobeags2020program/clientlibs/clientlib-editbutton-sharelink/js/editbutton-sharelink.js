// Global flag to prevent repeated initialization
if (!window.isPreviewAssetActionsInitialized) {
    window.isPreviewAssetActionsInitialized = true;  // Set the global flag

    $(document).on('foundation-contentloaded', function () {
        console.log('previewAssetActions.js loaded'); // This print should only occur once

        $('.custom-edit-sharelink-toolbar-action').off('click').on('click', function () {
            var selectedRow = $('tr.foundation-selections-item.is-selected');
            var dataPath = selectedRow.data('path');
            var sharedPathsAttr = selectedRow.attr('data-shared-paths') || '';
            var sharedPaths = sharedPathsAttr.split(',');
            // Extract default expiration date
            var deletedInitialPaths = [];
            var userEmailsAttr = selectedRow.attr('data-user-emails');
			userEmailsAttr = (userEmailsAttr && userEmailsAttr !== 'null') ? userEmailsAttr : '';
			var userEmails = userEmailsAttr ? userEmailsAttr.split(',').map(e => e.trim()) : [];

            var defaultExpiryDate = selectedRow.find('td .modified').text().trim();
            console.log('Extracted Expiry Date:', defaultExpiryDate); // Log extracted date

            if (dataPath) {
                console.log('Data Path:', dataPath);

                // Ensure dialog isn't created more than once
                if (!document.getElementById('dynamicDialog')) {
                    var dialog = new Coral.Dialog().set({
                        id: 'dynamicDialog',
                        header: { innerHTML: 'Manage Asset List' },
                        content: {
                            innerHTML: `
                                <section class="coral-Form-fieldset">
                                    <div class="coral-Form-fieldWrapper">
                                        <label class="coral-Form-fieldlabel">Initial Shared Assets</label>
                                        <coral-list id="sharedAssetList" class="asset-list coral-Menu">
                                            ${
                                                sharedPaths.filter(path => path.trim()).length > 0
                                                    ? sharedPaths.filter(path => path.trim()).map(path => `
                                                        <coral-list-item>
                                                    	 <span>${path.trim()}</span>
                                                            <coral-icon icon="delete" size="S" class="initial-asset-del-btn" style="cursor:pointer; margin-left:8px;"></coral-icon>
                                                        </coral-list-item>
                                                      `).join('')
                                                    : `<coral-list-item><span style="color:#888;">No assets found</span></coral-list-item>`
                                            }
                                        </coral-list>
                                        <label class="coral-Form-fieldlabel">New Asset Path *</label>
                                        <div class="flex-wrapper-asset">
                                            <foundation-autocomplete
                                                class="coral-Form-field granite-form"
                                                id="assetPathInput"
                                                pickersrc="/mnt/overlay/granite/ui/content/coral/foundation/form/pathfield/picker.html?_charset_=utf-8&amp;path={value}&amp;root=%2fcontent%2fdam&amp;filter=hierarchyNotFile&amp;selectionCount=single">
                                                <div class="foundation-autocomplete-inputgroupwrapper">
                                                    <div class="coral-InputGroup" role="presentation">
                                                        <input is="coral-textfield"
                                                            class="coral-InputGroup-input _coral-Textfield"
                                                            autocomplete="off"
                                                            placeholder="Select asset path"
                                                            role="combobox"
                                                            aria-expanded="false"
                                                            variant="default"
                                                            aria-controls=""
                                                            aria-autocomplete="none">
                                                        <span class="coral-InputGroup-button">
                                                            <button is="coral-button"
                                                                title="Open Selection Dialog"
                                                                type="button"
                                                                aria-label="Open Selection Dialog"
                                                                variant="default"
                                                                class="_coral-Button _coral-Button--primary"
                                                                size="M">
                                                                <coral-icon size="S" icon="FolderOpenOutline" class="_coral-Icon--sizeS _coral-Icon"></coral-icon>
                                                                <coral-button-label class="_coral-Button-label"></coral-button-label>
                                                            </button>
                                                        </span>
                                                    </div>
                                                </div>
                                                <coral-overlay
                                                    foundation-autocomplete-suggestion=""
                                                    class="foundation-picker-buttonlist _coral-Overlay"
                                                    data-foundation-picker-buttonlist-src="/mnt/overlay/granite/ui/content/coral/foundation/form/pathfield/suggestion{.offset,limit}.html?_charset_=utf-8&amp;root=%2fcontent%2fdam&amp;filter=hierarchyNotFile{&amp;query}"
                                                    style="display: none;">
                                                </coral-overlay>
                                                <coral-taglist foundation-autocomplete-value=""
                                                    class="_coral-Tags"
                                                    aria-live="off"
                                                    aria-atomic="false"
                                                    aria-relevant="additions">
                                                </coral-taglist>
                                            </foundation-autocomplete>

                                            <button type="button" id="assetAddBtn" is="coral-button" variant="default" class="coral-Button coral-Button--primary">
                                                <coral-button-label>Add</coral-button-label>
                                            </button>
                                        </div>

                                        <label class="coral-Form-fieldlabel">Newly Added Assets</label>
                                        <coral-list id="newAssetList" class="asset-list coral-Menu"></coral-list>
                                        <label class="coral-Form-fieldlabel">Expiration Date & Time</label>
                                        <coral-datepicker
                                            class="coral-Form-field _coral-InputGroup"
                                            type="datetime"
                                            displayformat="YYYY-MM-DD HH:mm"
                                            valueformat="YYYY-MM-DD[T]HH:mm:ss.SSSZ"
                                            headerformat="MMMM YYYY"
                                            placeholder="Select Date & Time"
                                            id="expiryDateTime"
                                            labelledby="expiryDateTimeLabel">
                                            <input type="hidden" handle="hiddenInput" name="./expiryDateTime" />
                                            <input is="coral-textfield" handle="input" class="_coral-InputGroup-field _coral-Textfield" role="combobox" />
                                            <button is="coral-button" handle="toggle" variant="_custom" class="_coral-InputGroup-button _coral-FieldButton" type="button" aria-label="Calendar">
                                                <coral-icon icon="calendar" role="img" iconsize="S"></coral-icon>
                                            </button>
                                        </coral-datepicker>
                                        <coral-list>
                                        <br>
                                            <label class="coral-Form-fieldlabel">User Emails</label>
                                            <coral-taglist id="emailTagList" name="userEmails" class="coral-Form-field" placeholder="Add email and press Enter" aria-label="User Emails" style="margin-bottom: 15px;">
                                                <input is="coral-textfield" placeholder="Add email and press Enter" />
                                                ${userEmails.map(email => `<coral-tag>${email}</coral-tag>`).join('')}
                                            </coral-taglist>
                                        
                                       </coral-list> 
                                    </div>
                                </section>
                            `
                        },
                        footer: {
                            innerHTML: `
                                <button type="button" is="coral-button" variant="primary" id="saveButton">Save</button>
                                <button type="button" is="coral-button" variant="default" id="closeButton" coral-close>Close</button>
                            `
                        }
                    });
                    document.body.appendChild(dialog);
                }
                var dialog = document.getElementById('dynamicDialog');
                dialog.show();
				$('#assetPathInput input[is="coral-textfield"]').attr('placeholder', 'Select asset path');
                
                $(document).off('click', '.initial-asset-del-btn').on('click', '.initial-asset-del-btn', function () {
                    const $item = $(this).closest('coral-list-item');
                    const path = $item.find('span').text().trim();
                    deletedInitialPaths.push(path);
                    $item.remove();
                });
                // Directly target the datepicker input element
                $('#expiryDateTime').find('input[handle="input"]').val(defaultExpiryDate);
                console.log('Set Expiry in Datepicker Directly:', $('#expiryDateTime').find('input[handle="input"]').val());
				
                // Handle Enter key for adding email to Coral TagList
                function validateEmail(email) {
                    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return re.test(String(email).toLowerCase());
                }
                // Handle Enter key for adding email to Coral TagList
                var emailTextfield = dialog.querySelector('#emailTagList input[is="coral-textfield"]');
                if (emailTextfield) {
                    emailTextfield.addEventListener('keydown', function (e) {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target;
                            const email = input.value.trim();
                            if (!email) return;
                            if (!validateEmail(email)) {
                                input.value = ''; 
                                const alert = new Coral.Dialog().set({
                                    id: "invalidEmailAlert_" + Date.now(),
                                    header: { innerHTML: "Invalid Email" },
                                    content: { innerHTML: `<p>Email <strong>${email}</strong> is not valid.</p>` },
                                    footer: {
                                        innerHTML: `<button is="coral-button" variant="primary" coral-close>OK</button>`
                                    }
                                });
                                document.body.appendChild(alert);
                                alert.show();
                                return;
                            }
                            const existingEmails = Array.from(dialog.querySelectorAll('#emailTagList coral-tag')).map(tag => tag.innerText.trim());
                            if (existingEmails.includes(email)) {
                                input.value = ''; 
                                return;
                            }
                            const tag = document.createElement('coral-tag');
                            tag.innerText = email;
                            dialog.querySelector('#emailTagList').appendChild(tag);
                            input.value = '';
                        }
                    });
                } else {
                    console.error("The email textfield input wasn't found.");
                }


                
                $('#assetAddBtn').off('click').on('click', function () {
                     var assetPath = $('#assetPathInput coral-taglist').text().trim();

                        if (!assetPath) {
                            return;
                        }

                        var alreadyInInitialList = false;

                        // Check against initial shared assets
                        $('#sharedAssetList coral-list-item span').each(function () {
                            if ($(this).text().trim() === assetPath) {
                                alreadyInInitialList = true;
                                return false; // break loop
                            }
                        });

                        if (alreadyInInitialList) {
                            // Show a Coral alert dialog
                            var alert = new Coral.Dialog().set({
                                id: "duplicateAssetAlert",
                                header: { innerHTML: "Duplicate Asset" },
                                content: { innerHTML: `<p>The asset <strong>${assetPath}</strong> already exists in the initial shared assets.</p>` },
                                footer: {
                                    innerHTML: `<button is="coral-button" variant="primary" coral-close>OK</button>`
                                }
                            });
                            document.body.appendChild(alert);
                            alert.show();
                            return;
                        }

                        // Add to newly added list if not already in initial shared list
                        var listItem = new Coral.List.Item();
                        listItem.innerHTML = `
                            <button is="coral-button" class="asset-del-btn coral-Button coral-Button--quiet">
                                <coral-icon icon="delete" size="S"></coral-icon>
                            </button>
                            <span>${assetPath}</span>
                        `;
                        $('#newAssetList').append(listItem);
                        // Clear picker display value
                        var $assetPicker = $('#assetPathInput');
                        var foundationAutocomplete = $assetPicker[0];

                        // Clear foundation-autocomplete internal state
                        if (foundationAutocomplete && foundationAutocomplete.foundation) {
                            foundationAutocomplete.foundation('value', []);  // clears the internal value array
                        }

                        // Clear visual tags
                        $assetPicker.find('coral-taglist').empty();

                        // Also clear Coral textfield input
                        $assetPicker.find('input[is="coral-textfield"]').val('').attr('placeholder', 'Select asset path');
                    });


                $('#saveButton').off('click').on('click', function () {
                    var expiryDateTime = $('#expiryDateTime').val();
                    console.log('Selected Expiry Date & Time:', expiryDateTime);
                    var paths = [];
                    var emailArray = [];
                    $('#emailTagList coral-tag').each(function () {
                        emailArray.push($(this).text().trim());
                    });
                    $('#newAssetList coral-list-item span').each(function () {
                        paths.push($(this).text());
                    });
                    $.ajax({
                        url: '/bin/customsharelinkservlet',
                        type: 'POST',
                        data: {
                            dataPath: dataPath,
                            paths: paths,
                            expiryDateTime: expiryDateTime,
                            deletedPaths: deletedInitialPaths,
                            userEmails: emailArray
                        },
                        success: function (response) {
                            console.log('Data sent successfully:', response);
                            location.reload();
                            dialog.hide();
                        },
                        error: function (xhr, status, error) {
                            console.error('Error sending data:', error);
                        }
                    });
                });

                $('#closeButton').off('click').on('click', function () {
                    location.reload();
                    dialog.hide();
                });

                $('#newAssetList').off('click', '.asset-del-btn').on('click', '.asset-del-btn', function () {
                    $(this).closest('coral-list-item').remove();
                });
            } else {
                console.log('No data-path attribute found.');
            }
        });
    });
}
