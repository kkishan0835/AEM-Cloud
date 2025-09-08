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

    // --- doFetch: smartly gets an IMS Bearer token if not provided ---
    const doFetch = (url, token = null, method = 'GET') => {
        const header = new Headers();
        // Prefer passed token, else get from Asset Selector AuthService
        const bearerToken =
            token ||
            (window.assetsSelectorsAuthService && window.assetsSelectorsAuthService.imsToken) ||
            (window.PureJSSelectors
                && typeof window.PureJSSelectors.getAssetsSelectorsAuthService === "function"
                && window.PureJSSelectors.getAssetsSelectorsAuthService().imsToken) ||
            null;
        if (bearerToken) {
            header.append('Authorization', `Bearer ${bearerToken}`);
        }
        const requestOptions = {
            method: method,
            headers: header,
            credentials: "include"
        };
        return fetch(url, requestOptions);
    };

    // Preview optimal rendition of the asset (cross-env) as Blob
    async function fetchAndPreviewAsset(selection, fileReferenceCallback) {
        let assetUrl = null;
        // 1. Try optimal rendition for preview
        const renditions = selection[0]?._links?.['http://ns.adobe.com/adobecloud/rel/rendition'];
        let optimal = null;
        if (renditions && renditions.length) {
            optimal = renditions.reduce((best, curr) => {
                const bestRes = (best.width || 0) * (best.height || 0);
                const currRes = (curr.width || 0) * (curr.height || 0);
                return currRes > bestRes ? curr : best;
            });
        }
        assetUrl =
            (optimal && optimal.href) ||
            (selection[0]._links && selection[0]._links['http://ns.adobe.com/adobecloud/rel/download'] && selection[0]._links['http://ns.adobe.com/adobecloud/rel/download'].href) ||
            selection[0].url ||
            selection[0].repoPath ||
            selection[0].path;

        // Persist fileReference in dialog
        if (fileReferenceCallback) {
            fileReferenceCallback(assetUrl);
        }

        // If assetUrl is HTTP(S), try to fetch and preview as blob
        if (assetUrl && assetUrl.startsWith("http")) {
            try {
                const response = await doFetch(assetUrl);
                if (!response.ok) throw new Error("Failed to fetch asset/rendition");
                const blobUrl = URL.createObjectURL(await response.blob());
                let $preview = $("#asset-preview");
                if (!$preview.length) {
                    $preview = $("<div id='asset-preview'></div>").insertAfter("[name='./fileReference']").css("margin-top", "10px");
                }
                $preview.html(`<img src="${blobUrl}" alt="preview" style="max-width:400px;max-height:120px;">`);
            } catch (e) {
                let $preview = $("#asset-preview");
                if (!$preview.length) {
                    $preview = $("<div id='asset-preview'></div>").insertAfter("[name='./fileReference']").css("margin-top", "10px");
                }
                $preview.html('<span style="color:#e53935;">Preview not available (CORS/Auth error)</span>');
                console.warn("Asset preview failed", e);
            }
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