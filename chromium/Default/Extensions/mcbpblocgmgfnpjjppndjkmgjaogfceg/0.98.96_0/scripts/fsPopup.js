//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2017 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

var capMode;
var clickedElem;

function enableToolsItems() {
    var fTabsMode = (capMode === cModeTabs),
        fProMode = getExtension().isProMode(),
        showIfTabs = fTabsMode? "block" : "none",
        showIfNotTabs = !fTabsMode ? "block" : "none",
        enabledIfPro = fProMode ? "" : "disabled",
        disabledIfNotPro = !fProMode && fTabsMode ? "disabled" : "";


    document.getElementById("mnuTabsUpgrade").style.display = fProMode || !fTabsMode ? "none" : "block";

    document.getElementById("mnuSaveSinglePDF").style.display = showIfTabs;
    //document.getElementById("mnuClipboard").style.display = showIfNotTabs;
    document.getElementById("mnuSavePDF").style.display = showIfNotTabs;

    document.getElementById("mnuEdit").className = disabledIfNotPro;
    document.getElementById("mnuSave").className = disabledIfNotPro;
    document.getElementById("mnuUpload").className = disabledIfNotPro;
    document.getElementById("mnuPrint").className = disabledIfNotPro;
    document.getElementById("mnuClipboard").className = disabledIfNotPro;
    document.getElementById("mnuEmail").className = disabledIfNotPro;
    document.getElementById("mnuExtEdit").className = disabledIfNotPro;
    document.getElementById("mnuSendOneNote").className = disabledIfNotPro;
	document.getElementById("mnuSaveSinglePDF").className = disabledIfNotPro;
}

function switchPane(evt, id)
{
	var menu2 = document.getElementById(id);
	menu2.style.display = "block";
	menu2.style.right = "5px"; 
	menu2.style.top = Math.min(document.body.clientHeight - menu2.clientHeight - 5, evt.pageY) + "px"; 
}

function updateLastAction()
{
	var txt = getExtension().getLADescription();
    document.getElementById("spnLastAction").textContent = txt;
    document.getElementById("spnLastAction").title = txt;
    document.getElementById("spnShortcut").textContent = "";

    chrome.commands.getAll(function(data) {
        getLAShortcut(function(shortcut) {
            document.getElementById("spnLastAction").title = txt + " (" + shortcut + ")";
            document.getElementById("spnShortcut").textContent = shortcut;
        });
    });


	/*document.getElementById("spnShortcutVisible").innerHTML = ""; // getOption(cShortcutPrefVisible, cDefaultShortcutVisible);
	document.getElementById("spnShortcutEntire").innerHTML = ""; //getOption(cShortcutPrefEntire, cDefaultShortcutEntire);
	document.getElementById("spnShortcutSelection").innerHTML = ""; //getOption(cShortcutPrefSelection, cDefaultShortcutSelection);*/
}

function click(obj, evt)
{
	if (obj.className == "disabled") return;
	
	clickedElem = obj;

	var isAllTabsAction = capMode === cModeTabs && obj.parentElement && obj.parentElement.getAttribute("rel") === "mnuTools";

	
	if (!isAllTabsAction && obj.id != "mnuCaptureEntire" && obj.id != "mnuCaptureVisible" && obj.id != "mnuCaptureSelection" && obj.id != "mnuCaptureBrowser" && obj.id != "mnuCaptureTabs" && obj.id != "mnuMiscellaneousFolder")
		window.close();
		
	var ext = getExtension();
	var tabsPermissionStub = function(cb) {
			if (capMode !== cModeTabs)
				return cb();
			else 
				return tabsPermissionRequired(function() {window.close(); cb();});
		}
		
	switch (obj.id)
	{
        case "mnuResume"			: ext.resumeEditing(); break;
		case "mnuPreferences"		: 
		case "mnuPreferencesLite"	:
									  ext.openExtensionPreferences(); break;
		case "mnuQuickLaunch"		: ext.captureLastUsedMode(); break;

		case "mnuCaptureEntire"		: capMode = cModeEntire; enableToolsItems(); switchPane(evt, "mnuTools"); break;
		case "mnuCaptureVisible"	: capMode = cModeVisible; enableToolsItems(); switchPane(evt, "mnuTools"); break;
		case "mnuCaptureSelection"	: capMode = cModeSelected; enableToolsItems(); switchPane(evt, "mnuTools"); break;
		case "mnuCaptureBrowser"	: capMode = cModeBrowser; enableToolsItems(); switchPane(evt, "mnuTools"); break;
        case "mnuCaptureTabs"	    : capMode = cModeTabs; enableToolsItems(); switchPane(evt, "mnuTools"); break;

		case "mnuMiscellaneousFolder"	:  switchPane(evt, "mnuMiscellaneous"); break;
		
		case "mnuViewDemo"			: ext.openDemoPage(); break;
		case "mnuSupport"			: ext.openSupportPage(); break;
		case "mnuAPI"				: ext.openAPIPage(); break;

        case "mnuTabsUpgrade"       :
        case "mnuUpgrade"			: ext.doUpgrade(); break;

		case "mnuRegister"			: ext.doRegister(); break;
		case "mnuEnterLicense"		: ext.enterLicense(); break;
		
		case "mnuCaptureEntireLite"		: ext.executeGrabber(cActionEdit ,cModeEntire); break;
		case "mnuCaptureVisibleLite"	: ext.executeGrabber(cActionEdit ,cModeVisible); break;
		case "mnuCaptureSelectionLite"	: ext.executeGrabber(cActionEdit ,cModeSelected); break;
		
		case "mnuEdit"				: tabsPermissionStub(function() {ext.executeGrabber(cActionEdit ,capMode);}); break;
		case "mnuSave"				: tabsPermissionStub(function() {ext.executeGrabber(cActionSave ,capMode);}); break;
		case "mnuSavePDF"			: tabsPermissionStub(function() {ext.executeGrabber(cActionSavePDF ,capMode);}); break;
        case "mnuSaveSinglePDF"		: tabsPermissionStub(function() {ext.executeGrabber(cActionMultiPDF ,capMode);}); break;
		case "mnuUpload"			: tabsPermissionStub(function() {ext.executeGrabber(cActionUpload ,capMode);}); break;
		case "mnuPrint"				: tabsPermissionStub(function() {ext.executeGrabber(cActionPrint ,capMode);}); break;
		case "mnuClipboard"			: tabsPermissionStub(function() {ext.executeGrabber(cActionClipboard ,capMode);}); break;
		case "mnuEmail"				: tabsPermissionStub(function() {ext.executeGrabber(cActionEMail ,capMode);}); break;
		case "mnuExtEdit"			: tabsPermissionStub(function() {ext.executeGrabber(cActionPaint ,capMode);}); break;
		case "mnuSendOneNote"		: tabsPermissionStub(function() {ext.executeGrabber(cActionSendOneNote, capMode);}); break;
		case "mnuOpenFile"			: ext.openFile(); break;
		case "mnuOpenClipboard"		: ext.openClipboard(); break;
		case "mnuLicenseInfo"		: ext.showLicenseInfo(); break;
		case "mnuAbout"				: ext.showAbout(); break;
		case "mnuFireShotNative"	: ext.installNative(); break;
		case "lnkDuplicateTab"		: ext.duplicateTab(); break;
		case "lnkTryAnotherPage"	: window.close(); ext.openURL("https://www.google.com/search?q=kitties"); break;
		case "lnkAllowFileAccess"	: ext.openURL("https://getfireshot.com/enable-file-access.php?browser=ch");  break;
		case "lnkExtensionSettings"	: ext.openExtensionSettings(); break;
	}	
}

function mouseOver(obj, evt)
{
	if (obj != clickedElem && (!obj.parentNode || obj.parentNode.getAttribute('rel') != "mnuTools"))
		document.getElementById("mnuTools").style.display = "none";
		
    if (obj != clickedElem && (!obj.parentNode || obj.parentNode.getAttribute('rel') != "mnuMiscellaneous"))
        document.getElementById("mnuMiscellaneous").style.display = "none";
		
}

function load()
{
	try
	{
		i18nPrepare();
	} 
	catch (e) {logError(e.message);}
	
	var itr = document.createNodeIterator(document.documentElement, NodeFilter.SHOW_ELEMENT, null, false);
	var currentNode; 
	
	var clickHandler = function(evt){evt.preventDefault(); click(this, evt); return true;};
	var mouseHandler = function(evt){mouseOver(this, evt);}; 
   
	while ((currentNode = itr.nextNode()))
	{  
   		if (currentNode.nodeName == "LI" || currentNode.getAttribute("rel") === "command")
		{
			currentNode.onclick = clickHandler;
			currentNode.onmouseover = mouseHandler;
		}
	}

	updateLastAction();
	updateAccessibility();
}

function updateAccessibility()
{
    getExtension().checkAdvancedFeatures();
    getExtension().getMenuSettings(function (settings)	{
        for(var key in settings)
		{
			//noinspection JSUnfilteredForInLoop
            var elem = document.getElementById(key);
			if (elem === null) alert("Element " + key + " not found");
			else
			{
                //noinspection JSUnfilteredForInLoop
                var state = settings[key];
                elem.style.display = state === "hidden" ? "none" : "block";
                
                if (state === "disabled")
                    elem.classList.add("disabled");
                else
                    elem.classList.remove("disabled");
            }
		}

		document.body.style.display = "block";
	});
}

document.addEventListener('DOMContentLoaded', function () {
	var ext = getExtension();

	ext.checkActivationPage(function(result) {
		if (result) 
			window.close();
	});
	
	if (ext.checkBadgeAction()) 
	{
		window.close();
	}
	else
		load();
});

