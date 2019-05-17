//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2017 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

var currentTab, currentFrameId, imgData = [];
var extVersion = "0.0", extVersionFull = "0.0";
var updateURL = "";
var pendingCapFunction, capCallbackCompleted;
var executeScriptTO;
var capId = 0, processedId = 0;
var guiItemsLocked = false;
var resumeMenuEnabled = false;
var shortcutProcessing = false;
//var ignoreShortcuts = false;
var commPortName = "FireShot Comm Port #" + Math.ceil(Math.random() * 45309714203);
var capResult, capLinks, capResultFileNameLite, multiPDFMode;
var advFeaturesChecked = false;
var tabURL, tabTitle;
var fPermissionsPageOpened = false, fForcedPro = false, fForceRegistered = false, fSilentMode = false;
var pendingResponse, pendingGMailJSON, fInjectGmailScript = false;
var extensionBrowser;

function enableHotkey(fEnable)
{
	if (fEnable) 
		setTimeout(function() {
			shortcutProcessing = false;
		}, 500);
	else
		shortcutProcessing = true;
}

function getVersionInfo() 
{
	var request = new XMLHttpRequest();
	request.open("GET", chrome.extension.getURL("manifest.json"), true);
	request.onreadystatechange = function() 
	{
		if (this.readyState == XMLHttpRequest.DONE) 
		{
            // Билды с 4 цифрами в версии нужны, чтобы заливать на Chrome новые версии с багфиксами.
            // Больше они не нужны, поэтому их превращаем в билды с 3 цифрами в версии.
            extVersion = JSON.parse(this.responseText).version.split(".", 3).join(".");
            extVersionFull = JSON.parse(this.responseText).version.split(".", 4).join(".");

			//noinspection JSUnresolvedVariable
			updateURL = JSON.parse(this.responseText).update_url;
            fSilentMode = extensionId == "hpbicldbpgipcloiojdbchegbbjiobbm" || extensionId == "adpnodbfhlagloahhdhjggicnfcpggkm";
            //fSilentMode = true;

			if (isWindows() && !isOnlyLite())
				fsNativePlugin.init(function() {
					getConsolePtr()("Callback from fsNative");
					displayAnnouncements();
					switchToProIfRequired();
                    updateContextMenu();
				}.bind(this));
			else 
				displayAnnouncements();
		}
	};
	request.send();
}

function displayAnnouncements()
{
	var show = getOption(cFirstTimeRun, "true") == "true";
	
	if (show)
	{
		localStorage[cFirstTimeRun] = false;
		localStorage[cCurrentVersion] = extVersion;
		
		//if (!isDebug) 
		//showBadge(getInstalledPageURL());
		if (!fSilentMode) openURL(getInstalledPageURL());
	}
	else 
	{
		var prevVer = getOption(cCurrentVersion, "0.0");
		
		if (extVersion != prevVer)
		{
			if (!isNativeSupported() && !fSilentMode)
			{
				showBadge("https://getfireshot.com/updated-lite.php?app=" + (isOpera() ? "op" : "ch") + "&ver=" + extVersion);
			}
				//extensionUpdated(true);
			//localStorage[cCurrentVersion] = extVersion;
		}
	}
}

function getInstalledPageURL()
{
	var addonString = "&app=" + (isOpera() ? "op" : "ch");
	
	if (isNativeSupported()) return "https://getfireshot.com/installed.php?ver=" + extVersion + addonString + "&native=1";
	else return "https://getfireshot.com/installed-lite.php?ver=" + extVersion + addonString;
}

//noinspection JSUnusedLocalSymbols
function nativeHostUpdated(newVersion)
{
	getConsolePtr()("Native module has updated to the " + newVersion + " version.");
	
	gaTrack('UA-1025658-9', 'fireshot.com', "NativeHostUpdated"); 
	
	if (newVersion == extVersion && !fSilentMode)
	{
		showBadge("https://getfireshot.com/updated.php?app=" + (isOpera() ? "op" : "ch") + "&ver=" + newVersion + "&h=" + (isProMode() ? "1": "0"));
	}
}

function switchToProIfRequired()
{
    fForcedPro = isCustomBuild();
    fForceRegistered = isCustomBuild();

    localStorage[cPluginProModePref] = getOption(cPluginProModePref, "false") == "true" || fForcedPro;
    localStorage[cRegisteredPref] = getOption(cRegisteredPref, "false") == "true" || fForceRegistered;
}

//noinspection JSUnusedLocalSymbols
function pluginEvent(obj)
{
	var topic = obj.topic,
		data = obj.data + "";
		
	if (topic == "status")
	{
		if (obj.code == statusHostReady)
			pluginCommand("setAddonVersion", {version: extVersion, browser: isOpera() ? "Opera" : "Chromium", id: extensionId});
		else
		{
			gaTrack('UA-1025658-9', 'fireshot.com', "NativeError-" + obj.data); 
			alert("FireShot failed to update. The updater reported the following error: \r\n-----------------------------------------------\r\n" + obj.data + "\r\n-----------------------------------------------\r\n\r\nFireShot will have to work in Lite mode.");
			getConsolePtr()("Error from native module: " + obj.data);
		}
	}
	else if (topic == "openURL")
    {
		openURL(data);
	}
	else if (topic == "enableResumeMenu")
	{
		getConsolePtr()("enableResumeMenu " + data);
		resumeMenuEnabled = data == "enable";
		
		setTimeout(function () {updateContextMenu();}, 10);
	}
	else if (topic == "setupMode")
	{
		localStorage[cPluginProModePref] = fForcedPro || data != "false";
		updateContextMenu();
	}
	else if (topic == "setRegistered")
	{
		localStorage[cRegisteredPref] = fForceRegistered || data != "false";
		updateContextMenu();
	}
	else if (topic == "getInfo")
	{
		var request = new XMLHttpRequest();
		request.open("GET", data, true);
		request.onreadystatechange = function() 
		{
			if (this.readyState == XMLHttpRequest.DONE) 
			{
				pluginCommand("processInfo", {data:this.responseText});
			}
		};
		request.send();
	} 
	else if (topic == "saveCrashData")
	{
		var addr = "", v = data.split(" ");
        if (v.length >= 3) addr = v[2];
        gaTrack('UA-1025658-9', 'fireshot.com', "AV-" + encodeURIComponent(data), encodeURIComponent(addr));
	}
    else if (topic == "base64Content" && pendingResponse) {
        pendingResponse(data);
    }
    else if (topic == "sendToGmail") {
        openInGmail(data);
    }
    else if (topic == "switchToLite") {
        switchToLiteMode();
    }
    else if (topic == "getUSPTOData")
    {
        doUSPTORequest(data);
    }
}

function openInGmail(data) {
    pendingGMailJSON = data;

    chrome.permissions.contains({
            origins: ['https://mail.google.com/*']
        }, function(result) {
            if (result)
                openGmailComposer();
            else
                openGmailPermissionsPage();
        }
    );
}

function lockItems()
{
	guiItemsLocked = true;
	chrome.contextMenus.removeAll();
	
	chrome.browserAction.setTitle({title: "FireShot Editor is currently displayed.\r\nPlease close it to take the next capture.\r\n\r\n(switching to FireShot Pro also helps!)"});
	chrome.browserAction.setPopup({popup: ""});
}

function unlockItems()
{
	guiItemsLocked = false;
	
	setTimeout(function () {updateContextMenu();}, 10);
	
	chrome.browserAction.setTitle({title: "FireShot - Capture page"});
    chrome.browserAction.setPopup({popup: "fsPopup.html"});
}

function checkTabReadyForCapturing(tabId, timeout, callback) {
    var timeoutId = setTimeout(function() {
        if (timeoutId) {
            timeoutId = undefined;
            callback(false);
        }
    }, timeout);

    chrome.tabs.executeScript(tabId, {code:"{}", runAt: "document_start"}, function () {
        var success = chrome.runtime.lastError === undefined;
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
            callback(success);
        }
    });
}

function initMessaging() {
    try {

        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
                switch (request.message) {
                    case "getPortName":
                        sendResponse({portName: commPortName});
                        break;
                    case "loadScript":
                        getConsolePtr()("execScript event");
                        if (executeScriptTO !== undefined) {
                            clearTimeout(executeScriptTO);
                            executeScriptTO = undefined;
                        }

                        var frameId = sender.frameId;
                        chrome.tabs.executeScript(currentTab.id, fixObjectForOldChrome({file: "scripts/fsUtils.js", runAt: "document_start", frameId: frameId}),
                            function () {
                                chrome.tabs.executeScript(currentTab.id, fixObjectForOldChrome({
                                        file: "scripts/fsSelection.js",
                                        runAt: "document_start", frameId: frameId
                                    }),
                                    function () {
                                        chrome.tabs.executeScript(currentTab.id, fixObjectForOldChrome({
                                                file: "scripts/fsLinks.js",
                                                runAt: "document_start", frameId: frameId
                                            }),
                                            function () {
                                                chrome.tabs.executeScript(currentTab.id, fixObjectForOldChrome({
                                                        file: "scripts/fsContent.js",
                                                        runAt: "document_start", frameId: frameId
                                                    }),
                                                    function () {
                                                        setTimeout(pendingCapFunction, 200);
                                                    });
                                            });
                                    });
                            });
                        break;

                    case "execScript":
                        getConsolePtr()("execScript event");
                        if (executeScriptTO !== undefined) {
                            clearTimeout(executeScriptTO);
                            executeScriptTO = undefined;
                        }

                        setTimeout(pendingCapFunction, 100);
                        break;

                    case "checkFSAvailabilityEvt":
                    {
                        getConsolePtr()("checkFSAvailabilityEvt");
                        sendResponse({FSAvailable: true, FSNative: isNativeSupported(), FSUpgraded: localStorage[cPluginProModePref] === "true", FSVersion: extVersionFull});
                        return true;
                    }

                    case "capturePageEvt":
                    {
                        //noinspection JSUnresolvedVariable
                        var action = parseInt(request.Action);
                        if (action == cActionUpgrade)
                            if (isNativeSupported())
                                doUpgrade();
                            else
                                openURL("https://getfireshot.com/buy.php?SRC=ce-lite");

                        else {
                            //noinspection JSUnresolvedVariable

                            executeGrabber(action === cActionSilentSave ? cActionSilentAdd : action, request.Entire == "true" ? cModeEntire : cModeVisible, request.Data, function () {
                                if (action === cActionSilentSave) {
                                    pluginCommand("storeEncodedContent", {path: request.Data});
                                }

                                if (action !== cActionBASE64Content && pendingResponse)
                                    pendingResponse("");
                            }, true, sender.frameId);
                        }
                        break;
                    }

                    case "getScreenshotsForGmail":
                    {
                        sendResponse(pendingGMailJSON);
                        return true;
                    }

                    case "switchToNativeEvt":
                    {
                        installNative();
                        break;
                    }

                    case "activateFireShot":
                    {
                        getConsolePtr()(request.name + " " + request.key);
                        sendResponse("OK");
                        pluginCommand("activateFireShot", {name: request.name, key: request.key});
                        break;
                    }
                }
        });

        /*var onExternalMessageHander = function (request, sender, sendResponse) {
            switch (request.message) {
                case "testMsgFromPage":
                {
                    alert(1);
                    break;
                }

                case "checkFSAvailabilityEvt":
                case "activateFireShot":
                {
                    onMessageHandler(request, sender, sendResponse);
                    break;
                }
            }
        };*/

        chrome.runtime.onMessage.addListener(onMessageHandler);
        //chrome.runtime.onMessageExternal.addListener(onExternalMessageHander);
    } catch (e) { }
}

function checkBadgeAction()
{
	if (localStorage[cQueuedBadgeURLPref] && localStorage[cQueuedBadgeURLPref] != "undefined")
	{
		openURL(localStorage[cQueuedBadgeURLPref]);
		showBadge(undefined);
		localStorage[cFirstTimeRun] = false;
		localStorage[cCurrentVersion] = extVersion;
		return true;
	}
	return false;
}

function checkActivationPage(callback) {
   
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        try {
            if (tabs.length === 0 || !tabs[0].url) {
                callback(false);
                return;
            }
            var tab = tabs[0];

            if (/https:\/\/getfireshot(\.com)?\/activate\.php/.test(tab.url)) {
                callback(true);
                chrome.tabs.executeScript(tab.id, {file: "scripts/fsActivation.js", runAt: "document_start"}, function() {
                    if (chrome.runtime.lastError)
                    {}
                });
            }
        }
        catch (e) {callback(false);}
    });
}

//noinspection JSUnusedLocalSymbols
function getMenuSettings(callback)
{
    function runCallback(mode) {
        var unsupported = mode === "capturing-prohibited",
            fExtensionPage = mode === "extension-page",
            fFileNotAllowed = mode === "file-not-allowed",
            fPro = localStorage[cPluginProModePref] == "true",
            fRegistered = localStorage[cRegisteredPref] == "true",
            fLite = !isNativeSupported(),
            lastMode = getLastMode();

        var settings = {
            "sepMain1"              : "visible",
            "sepMain2"              : "visible",
            "mnuFeaturesUnavailable": unsupported ? "visible" : "hidden",
            "mnuEnableFileSupport"  : fFileNotAllowed ? "visible" : "hidden",

            "mnuQuickLaunch"		: unsupported && (lastMode == cModeEntire || lastMode == cModeSelected || lastMode == cModeVisible) ? "disabled" : "enabled",
            "mnuCaptureVisible"		: unsupported ? "disabled" : "visible",
            "mnuCaptureEntire"		: unsupported ? "disabled" : "visible",
            "mnuCaptureSelection"	: unsupported ? "disabled" : "visible",

            "mnuCaptureVisibleLite"		: unsupported ? "disabled" : "visible",
            "mnuCaptureEntireLite"		: unsupported ? "disabled" : "visible",
            "mnuCaptureSelectionLite"	: unsupported ? "disabled" : "visible",
            "mnuPreferencesLite"		: fLite ? "visible" : "hidden",

            "mnuViewDemo"			: fLite ? "hidden" : "visible",
            "mnuSupport"			: fLite ? "hidden" : "visible",
            //"mnuAPI"				: fLite ? "hidden" : "visible",
            "mnuAbout"				: fLite ? "hidden" : "visible",
            "sepEditor"				: fLite ? "hidden" : "visible",
            "sepSupport1"			: fLite ? "hidden" : "visible",
            "sepSupport2"			: fLite ? "hidden" : "visible",
            "sepAdvanced"			: !isWindows() ? "hidden" : "visible",
            //"sepOptions"			: fLite ? "hidden" : "visible",
            "mnuMiscellaneousFolder": fLite ? "hidden" : "visible",
            "mnuResume"				: fLite ? "hidden" : resumeMenuEnabled ? "enabled" : "disabled",
            "mnuUpgrade"			: fLite ? "hidden" :  fPro ? "hidden" : "visible",
            "mnuRegister"			: fLite ? "hidden" :  fPro && !fRegistered ? "visible" : "hidden",
            "mnuEnterLicense"		: fLite ? "hidden" :  fPro && !fRegistered ? "visible" : "hidden",
            "mnuOpenFile"			: fLite ? "hidden" :  fPro ? "enabled" : "disabled",
            "mnuOpenClipboard"		: fLite ? "hidden" :  fPro ? "enabled" : "disabled",
            "mnuLicenseInfo"		: fLite ? "hidden" :  fPro && fRegistered ? "visible" : "hidden",
            "divCaptureToolsLite"	: fLite ? "visible" : "hidden",
            "divCaptureTools"		: fLite ? "hidden" : "visible",
            "mnuFireShotNative"		: isWindows() && fLite ? "visible" : "hidden"

            //"mnuTabsUpgrade"        : fPro ? "hidden" : "visible"
        };

        for (var key in settings) {
            
            if (unsupported)
                settings[key] = key === "mnuFeaturesUnavailable" ? "visible" : "hidden";
            else if (fExtensionPage)
                settings[key] = key === "mnuPreferencesLite" ? "visible" : "hidden";
            else if (fFileNotAllowed)
                settings[key] = key === "mnuEnableFileSupport" ? "visible" : "hidden";
        }

        callback(settings);
    }

    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        try {
            if (tabs.length === 0 || !tabs[0].url) {
                runCallback("capturing-prohibited");
                return;
            }
            var tab = tabs[0];

            if (/^chrome-extension.*/.test(tab.url))
                runCallback("extension-page"); 
            else if (/^file:\/\/.*/.test(tab.url)) {
                chrome.extension.isAllowedFileSchemeAccess(function(result) {
                    if (result)
                        runCallback("capturing-allowed");    
                    else
                        runCallback("file-not-allowed");    
                });
                return;
            }
            else if (/^(http|https|ftp|ftps):\/\/.*/.test(tab.url) && !/^https?:\/\/chrome.google.com\/.*$/.test(tab.url))
                runCallback("capturing-allowed");
            else
                runCallback("capturing-prohibited");
        }
        catch (e) {
            runCallback("capturing-prohibited");
        }
    });

}

function capturePage(Action, Mode, Data, CallbackCompleted, tab, frameId)
{
    if (executeScriptTO !== undefined) {
        clearTimeout(executeScriptTO);
        executeScriptTO = undefined;
    }

	capId ++;

	//noinspection JSUnusedLocalSymbols
    currentTab = tab;
    currentFrameId = frameId;
    capCallbackCompleted = CallbackCompleted;
    pendingCapFunction = function(){
        doCapturing(Action, Mode, Data, CallbackCompleted);
    };

    getConsolePtr()("capturePage: checking capabilities at " + tab.url + ". Tab state is: " + tab.status);

    // Окно захватываем напрямую в случае, если инжект скриптов невозможен, либо нам уже известны заголовок и url страницы
    if (Mode == cModeBrowser && (tab.url !== undefined && tab.title !== undefined))
        setTimeout(
            function()
            {
                getConsolePtr()("Calling captureBrowser directly...");
                enableHotkey(false);
                lockItems();
                pluginCommand("captureBrowser", {action:Action + ":-", url:tab.url, title:tab.title});
                unlockItems();
                enableHotkey(true);
                if (capCallbackCompleted)
                    capCallbackCompleted();
            },
            100
        );

    else
    {
        executeScriptTO = setTimeout(
            function() {
                getConsolePtr()("Calling doCapturing on timeout");
                pendingCapFunction();
            },
            1000
        );

        chrome.tabs.executeScript(tab.id, fixObjectForOldChrome({file: "scripts/fsScriptChecker.js", runAt: "document_start", frameId: frameId}), function() {
            if (chrome.runtime.lastError) {
                clearTimeout(executeScriptTO);
                executeScriptTO = undefined;
                getConsolePtr()("Calling doCapturing on lastError");
                pendingCapFunction();
            }
        });
    }
}

function getActionLocaleId(action)
{
	switch (action)
	{
		case cActionSave		: return "action_save"; 
		case cActionSavePDF		: return "action_save_pdf"; 
		case cActionClipboard	: return "action_copy";
		case cActionEMail		: return "action_email";
		case cActionPaint		: return "action_external";
		case cActionSendOneNote	: return "action_onenote";
		case cActionUpload		: return "action_upload";
		case cActionPrint		: return "action_print";
        case cActionMultiPDF    : return "action_save_pdf_single";
		default					: return "action_edit"; 
	}
}

function getLADescription()
{
	var action1, action2 = getActionLocaleId(getLastAction());
	var fLite = !isNativeSupported();
	switch (getLastMode())
	{
		case cModeVisible	: action1 = fLite ? "action_capture_visible_lite" : "action_capture_visible"; break;
		case cModeSelected	: action1 = fLite ? "action_capture_selection_lite" : "action_capture_selection"; break;
		case cModeBrowser	: action1 = "action_capture_browser"; break;
        case cModeTabs      : action1 = "action_capture_tabs"; break;
		default				: action1 = fLite ? "action_capture_entire_lite" : "action_capture_entire"; 
	}
	
	if (fLite)
		return chrome.i18n.getMessage(action1);
	else
		return chrome.i18n.getMessage(action1) + " " + chrome.i18n.getMessage(action2);
}

function doCapturing(Action, Mode, Data, CallbackCompleted)
{
    function getEmulationWidth(resultCB) {
        chrome.tabs.captureVisibleTab(currentTab.windowId, {format: "jpeg"},
            function (data) {
                var width = -1, height = -1;
                if (!chrome.runtime.lastError) {
                    try {
                        var extents = getJpegExtents(data);
                        width = extents[0];
                        height = extents[1];
                        getConsolePtr()("Emulation extents: " + extents[0] + " x " + extents[1]);
                    }
                    catch (e) {
                        getConsolePtr()(e.toString());
                    }
                }
                else console.error(chrome.runtime.lastError.message);

                resultCB(width, height);
            });
    }

    getConsolePtr()("doCapturing");
    if (capId <= processedId++)
	{
		capId = processedId;
        //if (CallbackCompleted)
        //    throw "Unexpected error while capturing using callback";

		return;
	}

    try {
        var
            isEmulation = false,
            port = chrome.tabs.connect(currentTab.id, {name: commPortName, frameId: currentFrameId}), connecting = true;

        port.onMessage.addListener(function (msg) {

        getConsolePtr()(JSON.stringify(msg));

        switch (msg.topic) {

            case "initAborted":
                getConsolePtr()("init Aborted");
                if (CallbackCompleted) CallbackCompleted(); 
            return;

            case "initDone":

                tabURL = msg.url;
                tabTitle = msg.title;
                connecting = false;
                enableHotkey(false);

                switch (Mode) {
                    case cModeVisible    :
                    case cModeEntire    :
                        /*if (!msg.emulation) {
                            pluginCommand("captureInit");
                            port.postMessage({topic: "scrollNext"});
                        }
                        else
                        */
                        getEmulationWidth(function(width, height) {

                            var ratioW = closestToInt(width / msg.cw);
                            var ratioH = closestToInt(height / msg.ch);
                            isEmulation = true;
                            pluginCommand("captureInit");
                            port.postMessage({topic: "setRatio", ratioW: ratioW, ratioH: ratioH});
                            port.postMessage({topic: "scrollNext"});
                        });
                        break;
                    case cModeSelected    :
                        getEmulationWidth(function(width, height) {
                            var ratioW = closestToInt(width / msg.cw);
                            var ratioH = closestToInt(height / msg.ch);
                            isEmulation = true;
                            pluginCommand("captureInit");
                            port.postMessage({topic: "setRatio", ratioW: ratioW, ratioH: ratioH});
                            port.postMessage({topic: "selectArea"});
                        });
                        break;
                    case cModeBrowser    :
                        enableHotkey(false);
                        lockItems();
                        pluginCommand("captureBrowser", {
                            action: Action + ":-",
                            url: tabURL,
                            title: tabTitle
                        });
                        unlockItems();
                        enableHotkey(true);
                        break;
                }
                break;

            case "areaSelected":
                port.postMessage({topic: "scrollNext"});
                break;

            case "areaSelectionCanceled":
                enableHotkey(true);
                port.onMessage.removeListener(arguments.callee);
                break;

            case "scrollDone":
                chrome.tabs.captureVisibleTab(currentTab.windowId, {format: "png"},
                    function (data) {
                        if (!chrome.runtime.lastError)
                            pluginCommand("captureTabPNG", {
                                dataurl: data,
                                datasize: data.length,
                                x: msg.x,
                                y: msg.y
                            });
                        port.postMessage({topic: "scrollNext"});
                    });
                break;

            case "scrollFinished":
                getConsolePtr()("FINISHED (" + msg.rows + " x " + msg.cols + ")");

                msg.url = tabURL;
                msg.title = tabTitle;

                msg.key = "-";
                msg.action = Action;
                msg.browserVersion = parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);
                msg.usrData = Data;

                pendingResponse = function(base64Data) {
                    pendingResponse = undefined;
                    port.postMessage({topic: "sendFireShotCaptureCompleteEvent", data: base64Data});
                };

                lockItems();
                pluginCommand("captureDone", msg);
                enableHotkey(true);
                unlockItems();

                port.onMessage.removeListener(arguments.callee);
                if (CallbackCompleted) CallbackCompleted(true);
                break;

            case "setOption":
                localStorage[msg.optionName] = msg.optionValue;
                break;
        }




    });
        port.onDisconnect.addListener(function() {
           if (connecting) {
               if (CallbackCompleted)
                   CallbackCompleted(false);
           }
        });
        port.postMessage({topic: "init", mode: Mode, debug: isDebug, options: JSON.stringify(localStorage), p: localStorage[cPluginProModePref] == "true", native: isNativeSupported(), frameMode: currentFrameId > 0});
    } catch (e) {
        if (CallbackCompleted)
            CallbackCompleted(false);
    }
}

//noinspection JSUnusedLocalSymbols
function genericOnClick(info, tab)
{
    switch (info.menuItemId)
	{
        case mnuTest                : doTest(); break;
        case mnuVisibleEdit			: executeGrabber(cActionEdit, cModeVisible); break;
        case mnuVisibleSave			: executeGrabber(cActionSave, cModeVisible); break;
		case mnuVisibleSavePDF		: executeGrabber(cActionSavePDF, cModeVisible); break;
		case mnuVisibleSendOneNote	: executeGrabber(cActionSendOneNote, cModeVisible); break;
		case mnuVisibleUpload		: executeGrabber(cActionUpload, cModeVisible); break;
		case mnuVisiblePrint		: executeGrabber(cActionPrint, cModeVisible); break;
		case mnuVisibleCopy			: executeGrabber(cActionClipboard, cModeVisible); break;
		case mnuVisibleEMail		: executeGrabber(cActionEMail, cModeVisible); break;
		case mnuVisibleExtEditor	: executeGrabber(cActionPaint, cModeVisible); break;
		
		case mnuEntireEdit			: executeGrabber(cActionEdit, cModeEntire); break;
        case mnuEntireSave			: executeGrabber(cActionSave, cModeEntire); break;
		case mnuEntireSavePDF		: executeGrabber(cActionSavePDF, cModeEntire); break;
		case mnuEntireSendOneNote	: executeGrabber(cActionSendOneNote, cModeEntire); break;
		case mnuEntireUpload		: executeGrabber(cActionUpload, cModeEntire); break;
		case mnuEntirePrint			: executeGrabber(cActionPrint, cModeEntire); break;
		case mnuEntireCopy			: executeGrabber(cActionClipboard, cModeEntire); break;
		case mnuEntireEMail			: executeGrabber(cActionEMail, cModeEntire); break;
		case mnuEntireExtEditor		: executeGrabber(cActionPaint, cModeEntire); break;

		case mnuSelectedEdit		: executeGrabber(cActionEdit, cModeSelected); break;
        case mnuSelectedSave		: executeGrabber(cActionSave, cModeSelected); break;
		case mnuSelectedSavePDF		: executeGrabber(cActionSavePDF, cModeSelected); break;
		case mnuSelectedSendOneNote	: executeGrabber(cActionSendOneNote, cModeSelected); break;
		case mnuSelectedUpload		: executeGrabber(cActionUpload, cModeSelected); break;
		case mnuSelectedPrint		: executeGrabber(cActionPrint, cModeSelected); break;
		case mnuSelectedCopy		: executeGrabber(cActionClipboard, cModeSelected); break;
		case mnuSelectedEMail		: executeGrabber(cActionEMail, cModeSelected); break;
		case mnuSelectedExtEditor	: executeGrabber(cActionPaint, cModeSelected); break;

		case mnuBrowserEdit			: executeGrabber(cActionEdit, cModeBrowser); break;
        case mnuBrowserSave			: executeGrabber(cActionSave, cModeBrowser); break;
		case mnuBrowserSavePDF		: executeGrabber(cActionSavePDF, cModeBrowser); break;
		case mnuBrowserSendOneNote	: executeGrabber(cActionSendOneNote, cModeBrowser); break;
		case mnuBrowserUpload		: executeGrabber(cActionUpload, cModeBrowser); break;
		case mnuBrowserPrint		: executeGrabber(cActionPrint, cModeBrowser); break;
		case mnuBrowserCopy			: executeGrabber(cActionClipboard, cModeBrowser); break;
		case mnuBrowserEMail		: executeGrabber(cActionEMail, cModeBrowser); break;
		case mnuBrowserExtEditor	: executeGrabber(cActionPaint, cModeBrowser); break;

        case mnuAllTabsEdit		    : tabsPermissionRequired(function(){ executeGrabber(cActionEdit, cModeTabs); }); break;
        case mnuAllTabsSinglePDF	: tabsPermissionRequired(function(){ executeGrabber(cActionMultiPDF, cModeTabs); }); break;
        case mnuAllTabsSave         : tabsPermissionRequired(function(){ executeGrabber(cActionSave, cModeTabs); }); break;
        case mnuAllTabsSendOneNote  : tabsPermissionRequired(function(){ executeGrabber(cActionSendOneNote, cModeTabs); }); break;
        case mnuAllTabsUpload       : tabsPermissionRequired(function(){ executeGrabber(cActionUpload, cModeTabs); }); break;
        case mnuAllTabsPrint        : tabsPermissionRequired(function(){ executeGrabber(cActionPrint, cModeTabs); }); break;
        case mnuAllTabsClipboard    : tabsPermissionRequired(function(){ executeGrabber(cActionClipboard, cModeTabs); }); break;
        case mnuAllTabsEMail        : tabsPermissionRequired(function(){ executeGrabber(cActionEMail, cModeTabs); }); break;
        case mnuAllTabsExtEditor    : tabsPermissionRequired(function(){ executeGrabber(cActionPaint, cModeTabs); }); break;

		case mnuLastAction		    : captureLastUsedMode(); break;
		case mnuPreferences		    : openExtensionPreferences(); break;
		case mnuViewDemo		    : openDemoPage(); break;
		case mnuSupport			    : openSupportPage(); break;
		case mnuAPI				    : openAPIPage(); break;

        case mnuUnlockProFeatures   :
		case mnuUpgrade			    : doUpgrade(); break;

		case mnuRegister		    : doRegister(); break;
		case mnuEnterLicense	    : enterLicense(); break;
		case mnuOpenFile		    : openFile(); break;
		case mnuOpenClipboard	    : openClipboard(); break;
		case mnuResume			    : resumeEditing(); break;
		case mnuFireShotNative 	    : installNative(); break;
		case mnuLicensingInfo	    : showLicenseInfo(); break;
		case mnuAbout			    : showAbout(); break;
	}
}

function updateLastActionInContextMenu()
{
    chrome.commands.getAll(function(data) {
        getLAShortcut(function(shortcut) {
            //getConsolePtr()("context:" + mnuLastAction);
            chrome.contextMenus.update(mnuLastAction, {title: getLADescription() + "    " + shortcut}, function() {
                if (chrome.runtime.lastError !== "") {}
            });
        });
    });


	/*if (!isNativeSupported()) {
        chrome.contextMenus.update(mnuEntireEdit, {title: chrome.i18n.getMessage("action_capture_entire_lite") + "...    " + getOption(cShortcutPrefEntire, cDefaultShortcutEntire)});
        chrome.contextMenus.update(mnuVisibleEdit, {title: chrome.i18n.getMessage("action_capture_visible_lite") + "...    " + getOption(cShortcutPrefVisible, cDefaultShortcutVisible)});
        chrome.contextMenus.update(mnuSelectedEdit, {title: chrome.i18n.getMessage("action_capture_selection_lite") + "...    " + getOption(cShortcutPrefSelection, cDefaultShortcutSelection)});
    }*/
}

var fEntered = false;
var mnuLastAction, mnuVisibleEdit, mnuVisibleSave, mnuVisibleSavePDF, mnuVisibleSendOneNote, mnuVisibleUpload, mnuVisiblePrint, mnuVisibleCopy, mnuVisibleEMail, mnuVisibleExtEditor,
	mnuEntireEdit, mnuEntireSave, mnuEntireSavePDF, mnuEntireSendOneNote, mnuEntireUpload, mnuEntirePrint, mnuEntireCopy, mnuEntireEMail, mnuEntireExtEditor, 
	mnuSelectedEdit, mnuSelectedSave, mnuSelectedSavePDF, mnuSelectedSendOneNote, mnuSelectedUpload, mnuSelectedPrint, mnuSelectedCopy, mnuSelectedEMail, mnuSelectedExtEditor, 
	mnuBrowserEdit, mnuBrowserSave, mnuBrowserSavePDF, mnuBrowserSendOneNote, mnuBrowserUpload, mnuBrowserPrint, mnuBrowserCopy, mnuBrowserEMail, mnuBrowserExtEditor, 
	mnuResume, mnuOpenFile, mnuOpenClipboard, mnuPreferences, mnuRegister, mnuEnterLicense, mnuUpgrade, mnuViewDemo, mnuSupport, mnuAPI,  mnuLicensingInfo, mnuAbout, mnuFireShotNative, mnuTest,
    mnuAllTabsEdit, mnuAllTabsSinglePDF, mnuUnlockProFeatures, mnuAllTabsSave, mnuAllTabsSendOneNote, mnuAllTabsUpload, mnuAllTabsPrint, mnuAllTabsEMail, mnuAllTabsExtEditor, mnuAllTabsClipboard;



function updateContextMenu()
{
	if (fEntered) return;
	fEntered = true;
	//getConsolePtr()("updateContextMenu");
	
	chrome.contextMenus.removeAll(
		function()
		{
			if (getOption(cContextMenuIntegrationPref, "true") !== "true") {
                //noinspection JSUnusedAssignment
                fEntered = false;
                return;
            }

            var mnuRoot,
                fPro = localStorage[cPluginProModePref] == "true",
                fRegistered = localStorage[cRegisteredPref] == "true",
                fLite = !isNativeSupported();


			if (!guiItemsLocked)
			{
                if (extensionId == 'legfpnnmhhnhjgekmmbkilmijnjoehne')
                {
                    mnuTest = chrome.contextMenus.create({title: "do test", onclick: genericOnClick});
                    chrome.contextMenus.create({type: "separator"});
                }

				//getConsolePtr()("items removed");
				mnuLastAction = chrome.contextMenus.create({title: "Last action", onclick: genericOnClick});
                //getConsolePtr()(mnuLastAction);

				chrome.contextMenus.create({type: "separator"});


				if (fLite)
				{
					mnuEntireEdit = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_entire_lite") + "...", onclick: genericOnClick});
					mnuVisibleEdit = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_visible_lite") + "...", onclick: genericOnClick});
					mnuSelectedEdit = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_selection_lite") + "...", onclick: genericOnClick});

					chrome.contextMenus.create({type: "separator"});
				}
				else
				{
					mnuRoot = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_visible") + "..."});
					mnuVisibleEdit = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_edit") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisibleSave = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisibleSavePDF = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save_pdf") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisibleSendOneNote = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_onenote") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisibleUpload = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_upload") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisiblePrint = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_print") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisibleCopy = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_copy") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisibleEMail = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_email") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisibleExtEditor = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_external") + "...", parentId: mnuRoot, onclick: genericOnClick});

					mnuRoot = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_entire") + "..."});
					mnuEntireEdit = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_edit") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntireSave = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntireSavePDF = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save_pdf") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntireSendOneNote = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_onenote") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntireUpload = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_upload") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntirePrint = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_print") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntireCopy = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_copy") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntireEMail = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_email") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntireExtEditor = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_external") + "...", parentId: mnuRoot, onclick: genericOnClick});

					mnuRoot = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_selection") + "..."});
					mnuSelectedEdit = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_edit") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedSave = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedSavePDF = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save_pdf") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedSendOneNote = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_onenote") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedUpload = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_upload") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedPrint = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_print") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedCopy = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_copy") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedEMail = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_email") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedExtEditor = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_external") + "...", parentId: mnuRoot, onclick: genericOnClick});

					mnuRoot = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_browser") + "..."});
					mnuBrowserEdit = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_edit") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserSave = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserSavePDF = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save_pdf") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserSendOneNote = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_onenote") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserUpload = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_upload") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserPrint = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_print") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserCopy = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_copy") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserEMail = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_email") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserExtEditor = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_external") + "...", parentId: mnuRoot, onclick: genericOnClick});

                    mnuRoot = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_tabs") + "..."});

                    mnuUnlockProFeatures = fPro || fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_switch_pro_tabs"), parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsSinglePDF = fLite ||  chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_save_pdf_single") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsEdit = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_edit") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsSave = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_save") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsSendOneNote = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_onenote") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsUpload = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_upload") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsPrint = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_print") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsClipboard = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_copy") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsEMail = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_email") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsExtEditor = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_external") + "...", parentId: mnuRoot, onclick: genericOnClick});


                    chrome.contextMenus.create({type: "separator"});

					if (!fLite && fPro)
					{
						if (resumeMenuEnabled)
							mnuResume = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_resume") + "...", onclick: genericOnClick});

						mnuOpenFile = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_open_file") + "...", onclick: genericOnClick});
						mnuOpenClipboard = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_open_clipboard") + "...", onclick: genericOnClick});

						chrome.contextMenus.create({type: "separator"});
					}
				}



				mnuPreferences = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_options") + "...", onclick: genericOnClick});
				mnuFireShotNative = !isWindows() || !fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_install_native") + "...", parentId: mnuRoot, onclick: genericOnClick});
				//mnuCapPreferences = chrome.contextMenus.create({title: "Capture preferences...", onclick: genericOnClick});

				if (!fLite)
					chrome.contextMenus.create({type: "separator"});
			}


			if (!fLite && fPro && !fRegistered)
			{
				mnuRegister = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_register") + "...", onclick: genericOnClick});
				mnuEnterLicense = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_enter_license") + "...", onclick: genericOnClick});
			}

			if (!fLite && !fPro)
				mnuUpgrade = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_switch_pro") + "!", onclick: genericOnClick});

			mnuViewDemo = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_view_demo"), onclick: genericOnClick});
			mnuSupport = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_support"), onclick: genericOnClick});
			//mnuAPI = chrome.contextMenus.create({title: "FireShot API...", onclick: genericOnClick});

			if (fLite) chrome.contextMenus.create({type: "separator"});

			if (!fLite && fPro && fRegistered)
				mnuLicensingInfo = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_license_info"), onclick: genericOnClick});

			mnuAbout = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_about"), onclick: genericOnClick});

			//getConsolePtr()("items added");

            updateLastActionInContextMenu();
			
			fEntered = false;
		}
	);
			
}

function restoreBadge() {
	if (localStorage[cQueuedBadgeURLPref] && localStorage[cQueuedBadgeURLPref] != "undefined")
		showBadge(localStorage[cQueuedBadgeURLPref]);
}

//noinspection JSUnusedGlobalSymbols
function executeGrabber(action, mode, data, callback, doNotRememberLA, frameId) {
    frameId = frameId || 0;
    if (guiItemsLocked) return;
    if (!doNotRememberLA) setLastActionAndMode(action, mode);

    if (mode === cModeTabs) captureTabs(action);
    else {
        if (multiPDFMode) {
            pluginCommand("cancelMultiPagePDF");
            multiPDFMode = undefined;
        }

        chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
            if (tabs.length > 0)
                capturePage(action, mode, data, callback, tabs[0], frameId);
        });
    }
}


function captureTabs(action) {

    function AsyncCycle(method, stop) {
        return {
            next: function (param) {
                if (!stop(param))
                    method(this);
            }
        };
    }

    function AnimatedIcon() {
        return {
            running: false,

            start: function() {
                var cntr = 0,
                    images = ['images/progress_1.png', 'images/progress_2.png', 'images/progress_3.png', 'images/progress_4.png'],
                    parent = this,
                    cycle = function() {
                        if (parent.running) {
                            chrome.browserAction.setIcon({path: images[++cntr % 4]});
                            setTimeout(function () {cycle();}, 500);
                        }
                        else parent.defaultIcon();
                    };

                this.running = true;
                cycle();
            },

            stop: function() {
                this.running = false;
                this.defaultIcon();
            },

            defaultIcon: function() {chrome.browserAction.setIcon({path: 'images/sss_19.png'});}


        };
    }

    function iterateTabsAndCapture(action) {

        return new Promise(function(resolve) {
            var tabsCaptured = 0;

            chrome.tabs.query({currentWindow: true}, function (tabs) {
                if (!tabs || tabs.length === 0) {resolve(tabsCaptured); return;}
                for (var i = 0; i < tabs.length && previouslyActiveTab === -1; ++i) {
                    if (tabs[i].active) previouslyActiveTab = i;
                }
                
                var currentTab = 0,
                    cycle      = new AsyncCycle(function (iterator) {
                            try {
                                chrome.tabs.highlight({windowId: tabs[currentTab].windowId, tabs: currentTab}, function () {
                                    checkTabReadyForCapturing(tabs[currentTab].id, 5000, function(success) {
                                        if (success)
                                            capturePage(action, cModeEntire, undefined, function (result) {
                                                if (result) ++tabsCaptured;
                                                iterator.next();
                                            }, tabs[currentTab++], 0);
                                        else {
                                            currentTab++;
                                            iterator.next();
                                        }
                                    });
                                });
                            }
                            catch (e) {
                                logError(e.message);
                                resolve(tabsCaptured);
                            }
                        },

                        function () {
                            if (currentTab >= tabs.length) {
                                resolve(tabsCaptured);
                                return true;
                            }
                            else return false;
                        });

                cycle.next();
            });
        });

    }

    var progressIcon = new AnimatedIcon();
    progressIcon.start();

    var tAction = action === cActionMultiPDF ? action : cActionSilentAdd, previouslyActiveTab = -1;

    if (action === cActionMultiPDF) {
        pluginCommand("startMultiPagePDF");
        multiPDFMode = true;
    }

    iterateTabsAndCapture(tAction)
        .then(function(tabsCaptured){
            progressIcon.stop();

            if (action === cActionMultiPDF) {
                pluginCommand("endMultiPagePDF");
                multiPDFMode = undefined;
            }
            else
                pluginCommand("doGroupAction", {action: action, count: tabsCaptured});

            if (previouslyActiveTab >= 0)
                chrome.tabs.highlight({tabs: previouslyActiveTab});

    });
}

function initHandlers() {
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (changeInfo && changeInfo.status === "complete") {
            if (isCustomBuild() || isAPIEnabled()) initAPI("pageLoad");

            if (fInjectGmailScript && /^https?:\/\/mail.google.com\/mail.*$/.test(tab.url)) {
                getConsolePtr()('Executing script for: ' + tab.url);
                chrome.tabs.executeScript(tabId, {file: "scripts/3p/inboxsdk.js", runAt: "document_end"}, function () {
                    if (chrome.runtime.lastError)
                        getConsolePtr()("error:" + chrome.runtime.lastError);
                    chrome.tabs.executeScript(tabId, {file: "scripts/fsGmail.js", runAt: "document_end"}, function() {
                        if (chrome.runtime.lastError)
                            getConsolePtr()("error:" + chrome.runtime.lastError);

                        fInjectGmailScript = false;
                    });
                });
            }
        }
    });

    chrome.tabs.onActivated.addListener(function(activeInfo) {
        if (isCustomBuild() || isAPIEnabled())
            initAPI("tabSwitch");
    });

    chrome.commands.onCommand.addListener(function(command) {
        getConsolePtr()('Command:', command);
        if (command === "last-used-action" && !shortcutProcessing)
            captureLastUsedMode();
    });
}

function init() {
    initMessaging();
    initHandlers();

    document.addEventListener('DOMContentLoaded', function () {
        restoreBadge();
        getVersionInfo();
        updateContextMenu();
        checkAdvancedUpdates();
    });
}

init();

