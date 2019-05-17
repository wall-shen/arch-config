//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2017 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

window.addEventListener('load', function () {
	
	var backgroundPage = null, pendingDID, onChangedEventActivated = false,
        capResult, capLinks, capResultFileNameLite;
	const cShowAlert1OptionName = "showAlert1";
	
	function setupAccessibility()
	{
        if (!backgroundPage.getAdvancedFeaturesAvailable())
            $("#spnAdvancedFeaturesSection").hide();

        if (isWindows())
			$("#divPromo,#upgradeLink,#noflashgoadvanced,#noflashgoadvanced2,#noflashgoadvanced3").removeClass("hiddenInitially");

        if (isOpera()) 
            $('#lnkOperaStore').hide();
        else 
            $('#lnkChromeStore').hide();
        //if (getOption(cTemplateNumberPref, 1) < 3) $("#lnkRecommend").hide();

	}

	/***************************************************************************************/
	
	function initHandlers()
	{
		$("#btnPrint").click(function() {
			var iframe = document.createElement("IFRAME");
			
			$(iframe).attr({
				style: "width:0px;height:0px;",
				id: "fsTempElement"
			});
			
			document.body.appendChild(iframe);
			//noinspection HtmlUnknownTarget
            iframe.contentWindow.document.write("<div style='margin:0 auto;text-align:center'><img style='width:100%' src='" + document.getElementById("imgResult").src + "'></div>");
		
			iframe.contentWindow.print(); 
			$("#fsTempElement").remove();
		});
		
		$("#lnkOptions, #lnkOptions1").click(function() {
			backgroundPage.openExtensionPreferences();
		});

        $("#lnkInstallAdvanced, #lnkInstallAdvanced2, #lnkInstallAdvanced3, #lnkInstallAdvanced4").click(function() {
            backgroundPage.installNative();
            return false;
        });

		$("#btnCloseAlert1").click(function() {
			localStorage[cShowAlert1OptionName] = 0;
		});


        $("#btnSaveImage").click(function() {
            downloadToFile(capResult.toDataURL(getOption(cDefaultImageFormatPref, "png") === "png" ? "image/png" : "image/jpeg"), capResultFileNameLite + "." + getOption(cDefaultImageFormatPref, "png"));
        });

        $("#btnSaveImagePDF").click(function() {
            var t = new backgroundPage.fsPDF(capResult, capLinks).toDataURL();
            downloadToFile(t, capResultFileNameLite + ".pdf");
        });

        $("#btnSendEmail").find("li").click(function() {
            sendEmailAs($(this).attr("value"));
        });

        /*$("#btnEnlarge").click(function() {
            $("#divImgResult").height("auto");
            $("#divImgResult").css("overflow-y", "hidden");
            $("#btnEnlarge").hide();

        });*/
	}
    
    /***************************************************************************************/

    function sendEmailAs(format) {
        var dataUrl, ext = format;

        switch(format) {
            case "png": dataUrl =  capResult.toDataURL("image/png"); break;
            case "jpg": dataUrl =  capResult.toDataURL("image/jpeg"); break;
            default: dataUrl = new backgroundPage.fsPDF(capResult, capLinks).toDataURL(); ext="pdf";
        }

        var filename = capResultFileNameLite + "." + ext;
        var dataObj = {
            to: "",
            subject: "Screenshots from FireShot",
            files: [{
                inline: "no",
                name: encodeURIComponent(filename),
                data: dataUrl
            }]
        };

        backgroundPage.openInGmail(JSON.stringify(dataObj));
    }

    /***************************************************************************************/

    function downloadToFile(data, filename, fallback) {
        addDownloadsPermission(function() {

            if (!onChangedEventActivated) {
                onChangedEventActivated = true;

                chrome.downloads.onChanged.addListener(function(delta) {
                    if (!delta.state ||
                        (delta.state.current != 'complete')) {
                        return;
                    }

                    if (getOption(cOpenFolderAterSavingPref) === "true")
                        chrome.downloads.show(pendingDID);

                    if (getOption(cCloseTabAfterSaving) === "true")
                        window.close();
                });
            }

            var filePath = getOption(cDefaultFolderPref, cDefaultFolderValue);
            if (filePath !== "") filePath += "/";

            fetch(data)
                .then(res => res.blob())
                .then(blob => 
                    chrome.downloads.download({
                        url: URL.createObjectURL(blob),
                        saveAs: getOption(cNoFilenamePromptPref) !== "true",
                        filename: fallback ? filename : filePath + filename,
                        conflictAction: "overwrite"
                    }, function (downloadId) {
                        if (!chrome.runtime.lastError)
                            pendingDID = downloadId;
                        else if (!fallback) {
                            downloadToFile(data, filename, true);
                        }
                    })
                );
        });
    }

    /***************************************************************************************/
    
    function navigateToReviewPage() {
        openURL("https://getfireshot.com/like.php?browser=" + (isOpera() ? "op" : "ch") + "&ver=" + backgroundPage.extVersion);
    }

    /***************************************************************************************/
    
    function showLikeDialog() {
        $("#btnLike #btnDislike").unbind();

        $("#btnLike").click(function() {
            localStorage[cLikedPref] = "true";
            $("#divLikeMessage").hide();
            showRateDialog();
        });

        $("#btnDislike").click(function() {
            localStorage[cLikedPref] = "false";
            $("#divLikeMessage").slideUp(100); 
        });

        setTimeout(function() {$("#divLikeMessage").slideDown(300);}, 2000); 
    }

    /***************************************************************************************/

    function showRateDialog() {
        $("#btnRate #btnRateLater").unbind();
        
        $("#btnRate").click(function() {
            localStorage[cRatedPref] = "true";
            $("#divSendReview").slideUp(100);
            navigateToReviewPage(); 
        });

        $("#btnRateLater").click(function() {
            $("#divSendReview").slideUp(100); 
        });

        setTimeout(function() {$("#divSendReview").slideDown(300);}, 200);     
    }

    /***************************************************************************************/
	function showWarnings()
	{
		if (isWindows() && localStorage[cPluginProModePref] && localStorage[cShowAlert1OptionName] === undefined)
            setTimeout(function() {$("#divAlert1").fadeIn(700);}, 1000);
        else {
            var isLiked     = getOption(cLikedPref, "") === "true",
                isLikeDialogShown = getOption(cLikedPref, "") !== "",
                isRated     = getOption(cRatedPref, "false") === "true",
                shownCntr   = parseInt(getOption(cResultPageShownCntrPref, 0));

            if (!isLikeDialogShown && shownCntr > 10) 
                showLikeDialog();
            else if (isLiked && !isRated && shownCntr % 50 === 0)
                showRateDialog();
        }
	}
	
	/***************************************************************************************/
	
	function showPage()
	{
        function checkSize() {
            var div = document.getElementById("divImgResult"),
                    padding = 20,
                    rectImg = div.getClientRects()[0],
                    rectPanel = document.getElementById('divPanel').getClientRects()[0];

                if (rectImg.y + rectImg.height < rectPanel.y) {
                    $("#divImgResult").height($("#divPanel").height());
                    $("#divImgResult").css("overflow-y", div.clientHeight < div.scrollHeight ? "scroll" : "hidden");
                }
                else  $("#divImgResult").height("auto");

                
                if (capResult.width < $(div).width() - padding) {
                    $("#imgResult").css("width", "auto");
                    $("#divImgResult").css("overflow-y", div.clientHeight < div.scrollHeight ? "scroll" : "hidden");
                    div.style.zoom = 1.0000001;
                    setTimeout(function() { div.style.zoom = 1; }, 50);
                }

                else if (div.clientHeight >= div.scrollHeight) {
                    $(div).css("overflow-y", "hidden");
                    div.style.zoom = 1.0000001;
                    setTimeout(function() { div.style.zoom = 1; }, 50);
                }
        }

        $(window).resize(checkSize);

        $(".container").show();
        document.getElementById("imgResult").onload = function () {
            setTimeout(checkSize, 10);
        };

        document.getElementById("imgResult").src = capResult.toDataURL("image/png");
		document.title = capResultFileNameLite;//backgroundPage.tabTitle + " (" + backgroundPage.tabURL + ")";
	}

	
	/***************************************************************************************/
	
	function init()
	{
		try {
			i18nPrepare();
		} 
        catch (e) {logError(e.message);}
        
        localStorage[cResultPageShownCntrPref] = parseInt(getOption(cResultPageShownCntrPref, 0)) + 1;
		
		chrome.runtime.getBackgroundPage(function (bp) {
			if (!bp) return;
			
			backgroundPage = bp;
            capResult = backgroundPage.capResult;
            capLinks = backgroundPage.capLinks;
            capResultFileNameLite = backgroundPage.capResultFileNameLite;
			
			setupAccessibility();
			initHandlers();
			showPage();
            showWarnings();
		});
	}
	
	init();
});