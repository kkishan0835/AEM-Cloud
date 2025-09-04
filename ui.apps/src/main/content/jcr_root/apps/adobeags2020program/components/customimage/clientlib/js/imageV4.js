(function($, document) {
    // Dynamically load Asset Selector MFE JS if not already loaded
    function loadAssetSelectorScript(callback) {
        if (window.PureJSSelectors) {
            callback();
        } else {
            var tag = document.createElement("script");
            tag.src = "https://experience.adobe.com/solutions/CQ-assets-selectors/static-assets/resources/assets-selectors.js";
            tag.onload = callback;
            document.head.appendChild(tag);
        }
    }

    const imsProps = {
        imsClientId: "aemcs-kishkumar-sandbox",
        imsScope: "AdobeID,openid,additional_info.projectedProductContext,read_organizations",
        discoveryURL: "https://aem-discovery.adobe.io",
        redirectUrl: window.location.href,
        modalMode: true
    };

    // Always (re-)register the IMS service before opening the Asset Selector
    function ensureImsRegistered() {
        // Clear existing registration if present (optional best practice!)
        if (window.PureJSSelectors && window.PureJSSelectors.clearAssetsSelectorsAuthService) {
            window.PureJSSelectors.clearAssetsSelectorsAuthService();
        }
        window.PureJSSelectors.registerAssetsSelectorsAuthService(imsProps);
    }

    function openAssetSelectorModal(handleSelectionCb) {
        // Create a modal overlay div (not dialog) for react safety
        var modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = 0;
        modal.style.left = 0;
        modal.style.width = "100vw";
        modal.style.height = "100vh";
        modal.style.zIndex = "20000";
        modal.style.background = "rgba(0,0,0,0.3)";

        var container = document.createElement("div");
        container.id = "asset-selector-modal";
        container.style.width = "80vw";
        container.style.height = "80vh";
        container.style.margin = "5vh auto";
        container.style.background = "#fff";
        container.style.borderRadius = "8px";
        container.style.boxShadow = "0 8px 32px #3335";
        container.style.position = "relative";

        var closeBtn = document.createElement("button");
        closeBtn.textContent = "×";
        closeBtn.title = "Close";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "10px";
        closeBtn.style.right = "18px";
        closeBtn.style.zIndex = "10";
        closeBtn.style.fontSize = "1.5em";
        closeBtn.style.background = "none";
        closeBtn.style.border = "none";
        closeBtn.style.cursor = "pointer";
        closeBtn.onclick = closeModal;

        container.appendChild(closeBtn);
        modal.appendChild(container);
        document.body.appendChild(modal);

        function closeModal() {
            document.body.removeChild(modal);
        }

        // Asset Selector props (REQUIRED)
        const assetSelectorProps = {
            imsOrg: "9D2B274A641055650A495C10@AdobeOrg",
            apiKey: "aemcs-kishkumar-sandbox",
            discoveryURL: "https://aem-discovery.adobe.io",
           // repositoryId: "author-p144106-e1487792.adobeaemcloud.com",
            aemTierType: ["author"],
            handleSelection: function(selection) {
                if (typeof handleSelectionCb === "function") {
                    handleSelectionCb(selection);
                }
                closeModal();
            },
            onClose: closeModal
        };

        // The critical step: (re-)register IMS before launching the selector!
        ensureImsRegistered();

        // Display the asset selector
        PureJSSelectors.renderAssetSelectorWithAuthFlow(container, assetSelectorProps, function(){});
    }

    $(document).on("dialog-ready", function () {
        var $btn = $("button:has(coral-button-label:contains('Pick from Remote Asset Selector'))");
        if ($btn.length && !$btn.data("assetSelectorBound")) {
            $btn.data("assetSelectorBound", true);

            $btn.on("click", function(e) {
                e.preventDefault();
                loadAssetSelectorScript(function() {
                    openAssetSelectorModal(function(selection) {
                        if (selection && selection.length) {
                            $("[name='./fileReference']")
                                .val(selection[0].path || selection[0].repoPath || selection[0].url)
                                .trigger("change");
                        }
                    });
                });
            });
        }
    });
})(Granite.$, document);