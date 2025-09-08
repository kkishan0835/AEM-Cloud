(function($, document) {
    // Load Asset Selector MFE JS if not already loaded
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

    function ensureImsRegistered() {
        if (window.PureJSSelectors && window.PureJSSelectors.clearAssetsSelectorsAuthService) {
            window.PureJSSelectors.clearAssetsSelectorsAuthService();
        }
        window.PureJSSelectors.registerAssetsSelectorsAuthService(imsProps);
    }

    // Fetch rendition or asset download, convert to Blob URL for preview
    function fetchAndPreviewAsset(selection, fileReferenceCallback) {
        // 1. Try to get the optimal rendition URL if present
        let renditionLinks = selection[0]._links && selection[0]._links['http://ns.adobe.com/adobecloud/rel/rendition'];
        let optimalRenditionLink;
        if (renditionLinks && renditionLinks.length) {
            optimalRenditionLink = renditionLinks.reduce((best, curr) => {
                const bestRes = (best.width || 0) * (best.height || 0);
                const currRes = (curr.width || 0) * (curr.height || 0);
                return currRes > bestRes ? curr : best;
            });
        }

        // 2. If an optimal rendition is found, fetch and preview, otherwise fallback to normal download
        let assetUrlToFetch =
            (optimalRenditionLink && optimalRenditionLink.href) ||
            (selection[0]._links &&
                selection[0]._links['http://ns.adobe.com/adobecloud/rel/download'] &&
                selection[0]._links['http://ns.adobe.com/adobecloud/rel/download'].href) ||
            selection[0].url ||
            selection[0].repoPath ||
            selection[0].path;

        // Populate fileReference with path/url (for persistence)
        if (fileReferenceCallback) {
            fileReferenceCallback(assetUrlToFetch);
        }

        // If the URL is from author DAM, fetch and create a blob preview
        if (assetUrlToFetch && assetUrlToFetch.startsWith("http")) {
            // Use bearer token if needed for protected assets
            const imsToken = (window.assetsSelectorsAuthService && window.assetsSelectorsAuthService.imsToken)
                || (window.PureJSSelectors?.getAssetsSelectorsAuthService?.()?.imsToken)
                || null;

            fetch(assetUrlToFetch, {
                headers: imsToken ? { Authorization: `Bearer ${imsToken}` } : undefined,
                credentials: "include"
            }).then(response => {
                if (!response.ok) throw new Error("Failed to fetch asset/rendition");
                return response.blob();
            }).then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                // Add preview image in dialog, e.g. in div#asset-preview (create if missing)
                let $preview = $("#asset-preview");
                if (!$preview.length) {
                    $preview = $("<div id='asset-preview'></div>").insertAfter("[name='./fileReference']").css("margin-top", "10px");
                }
                $preview.html(`<img src="${blobUrl}" alt="preview" style="max-width:400px;max-height:120px;">`);
            }).catch(e => {
                console.warn("Asset preview failed", e);
            });
        }
    }

    function openAssetSelectorModal() {
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

        const assetSelectorProps = {
            imsOrg: "9D2B274A641055650A495C10@AdobeOrg",
            apiKey: "aemcs-kishkumar-sandbox",
            discoveryURL: "https://aem-discovery.adobe.io",
            aemTierType: ["author"],
            handleSelection: function(selection) {
                // Persist value to dialog and show a preview
                fetchAndPreviewAsset(selection, function(urlOrPath) {
                    $("[name='./fileReference']")
                        .val(urlOrPath)
                        .trigger("change");
                });
                closeModal();
            },
            onClose: closeModal
        };

        ensureImsRegistered();
        PureJSSelectors.renderAssetSelectorWithAuthFlow(container, assetSelectorProps, function(){});
    }

    $(document).on("dialog-ready", function () {
        var $btn = $("button:has(coral-button-label:contains('Pick from Remote Asset Selector'))");
        if ($btn.length && !$btn.data("assetSelectorBound")) {
            $btn.data("assetSelectorBound", true);

            $btn.on("click", function(e) {
                e.preventDefault();
                loadAssetSelectorScript(function() {
                    openAssetSelectorModal();
                });
            });
        }
    });
})(Granite.$, document);