//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2017 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

var FireShotSettings = {

	hkModifiers : "ctrl, alt",
	hkKey		: "Z",
	hkKeyCode	: 0,

	
	loadSettings : function()
	{
		/*$("#edtHotkeyLastUsedAction").val(getOption(cShortcutPref, cDefaultShortcut));
		$("#edtHotkeyVisible").val(getOption(cShortcutPrefVisible, cDefaultShortcutVisible));
		$("#edtHotkeySelection").val(getOption(cShortcutPrefSelection, cDefaultShortcutSelection));
		$("#edtHotkeyEntire").val(getOption(cShortcutPrefEntire, cDefaultShortcutEntire));
		$("#edtHotkeyBrowser").val(getOption(cShortcutPrefBrowser, cDefaultShortcutBrowser));
        $("#edtHotkeyTabs").val(getOption(cShortcutPrefTabs, cDefaultShortcutTabs));*/

        $("#edtDefaultFolder").val(getOption(cDefaultFolderPref, cDefaultFolderValue));
        $("#chkOpenFolder").prop('checked', getOption(cOpenFolderAterSavingPref, "false") === "true");
        $("#chkDoNotShowSaveAsDialog").prop('checked', getOption(cNoFilenamePromptPref, "false") === "true");
        $("#chkCloseTab").prop('checked', getOption(cCloseTabAfterSaving, "false") === "true");

		$("#edtFilenameTemplate").val(getOption(cTemplatePref, cDefaultTemplate));
		$("#edtTemplateNumber").val(getOption(cTemplateNumberPref, 1));
		$("#chkTemplateNumberPad").prop('checked', getOption(cTemplateNumberPadCheckPref, "true") === "true");
		$("#edtTemplateNumberPad").val(getOption(cTemplateNumberPadValuePref, 3));
		
		var fPng = getOption(cDefaultImageFormatPref, "png") === "png";
		$("#radImagePNG").prop('checked', fPng);
		$("#radImageJPG").prop('checked', !fPng);
		
		$("#edtTemplateFilenameMaxLen").val(getOption(cTemplateFilenameMaxLen, 100));
		
		/*$("#cmbVisibleHotkeyAction").val(getOption(cShortcutPrefVisibleAction, cDefaultShortcutVisibleAction));
		$("#cmbSelectionHotkeyAction").val(getOption(cShortcutPrefSelectionAction, cDefaultShortcutSelectionAction));
		$("#cmbEntireHotkeyAction").val(getOption(cShortcutPrefEntireAction, cDefaultShortcutEntireAction));
		$("#cmbBrowserHotkeyAction").val(getOption(cShortcutPrefBrowserAction, cDefaultShortcutBrowserAction));
        $("#cmbTabsHotkeyAction").val(getOption(cShortcutPrefTabsAction, cDefaultShortcutTabsAction));*/



        $("#chkContextMenuIntegration").prop('checked', getOption(cContextMenuIntegrationPref, "true") === "true");

		$("#chkDebug").prop('checked', getOption(cDebugPref, "false") === "true");
        $("#chkAPI").prop('checked', getOption(cAPISupport, "false") === "true");
	},

	saveSettings: function(completedCB)
	{
        /*localStorage[cShortcutPref] = $("#edtHotkeyLastUsedAction").val();
		localStorage[cShortcutPrefVisible] = $("#edtHotkeyVisible").val();
		localStorage[cShortcutPrefSelection] = $("#edtHotkeySelection").val();
		localStorage[cShortcutPrefEntire] = $("#edtHotkeyEntire").val();
		localStorage[cShortcutPrefBrowser] = $("#edtHotkeyBrowser").val();
        localStorage[cShortcutPrefTabs] = $("#edtHotkeyTabs").val();
		
		localStorage[cShortcutPrefVisibleAction] = $("#cmbVisibleHotkeyAction").val();
		localStorage[cShortcutPrefSelectionAction] = $("#cmbSelectionHotkeyAction").val();
		localStorage[cShortcutPrefEntireAction] = $("#cmbEntireHotkeyAction").val();
		localStorage[cShortcutPrefBrowserAction] = $("#cmbBrowserHotkeyAction").val();
        localStorage[cShortcutPrefTabsAction] = $("#cmbTabsHotkeyAction").val();*/
		
		localStorage[cTemplatePref] = $("#edtFilenameTemplate").val();
		localStorage[cTemplateNumberPref] = parseInt($("#edtTemplateNumber").val());
		localStorage[cTemplateNumberPadCheckPref] = $("#chkTemplateNumberPad").prop("checked");
		localStorage[cTemplateNumberPadValuePref] = Math.max(0, parseInt($("#edtTemplateNumberPad").val()));
		localStorage[cDefaultImageFormatPref] = $("#radImagePNG").prop("checked") ? "png" : "jpg";
		localStorage[cTemplateFilenameMaxLen] = Math.max(10, parseInt($("#edtTemplateFilenameMaxLen").val()));

        localStorage[cDefaultFolderPref] = $("#edtDefaultFolder").val();
        localStorage[cNoFilenamePromptPref] = $("#chkDoNotShowSaveAsDialog").prop("checked");
        localStorage[cOpenFolderAterSavingPref] = $("#chkOpenFolder").prop("checked");
        localStorage[cCloseTabAfterSaving] = $("#chkCloseTab").prop("checked");

        localStorage[cContextMenuIntegrationPref] = $("#chkContextMenuIntegration").prop("checked");





		localStorage[cDebugPref] = $("#chkDebug").prop("checked");

        getExtension().updateContextMenu();

        if ($("#chkAPI").prop("checked")) {
            addTabsPermission(function() {
                enableAPI(true);
                if (completedCB) completedCB();
            }, function() {
                alert("WARNING: FireShot API is NOT enabled.");
                enableAPI(false);
                $("#chkAPI").prop('checked', false);
                if (completedCB) completedCB();
            });
        } else {
            enableAPI(false);
            if (completedCB) completedCB();
        }


	},
	
	processHotkey: function(elem, event)
	{
		event.preventDefault();
		event.stopPropagation();
		
		var v = getShortcut(event);
		
		if (v !== "") 
			elem.val(v);
	}
};



document.addEventListener('DOMContentLoaded', function () {

    function setupAccessibility() {
        var fLite = !getExtension().isNativeSupported();

        $(".native").toggle(!fLite);
        $(".lite").toggle(fLite);

        if (localStorage[cRegisteredPref] == "true") $("#trLicensingInfo").hide();
        if (extensionId == "hpbicldbpgipcloiojdbchegbbjiobbm") $("#trFSAPI").hide();
    }


    function checkAccessibility() {
        var fFolderInvalid = /(:)|(\.\.(\\|\/))/.test($("#edtDefaultFolder").val());
        document.getElementById('spnComment').style.color = fFolderInvalid ? "#f00" : "#666";
    }



    try {
		i18nPrepare();
	} 
	catch (e) {logError(e.message);}
	
	//$('#container').show();

    $('#btnLicenseInfo').click(function() {
        getExtension().enterLicense();
    });
  
	$('#btnCapSettings').click(function() {
		getExtension().openCaptureSettings();
	});

	$('#btnGeneralOptions').click(function() {
		getExtension().openSettings();
	});

	$('#btnApply').click(function() {
		FireShotSettings.saveSettings(); 
	});

	$('#btnSave').click(function() {
		FireShotSettings.saveSettings(function() {window.close();});
	});
	
	$('#edtHotkeyLastUsedAction').keydown(function(event) {
		FireShotSettings.processHotkey($(this), event);
	});

	$('#edtHotkeyVisible').keydown(function(event) {
		FireShotSettings.processHotkey($(this), event);
	});
	
	$('#edtHotkeyEntire').keydown(function(event) {
		FireShotSettings.processHotkey($(this), event);
	});
	
	$('#edtHotkeySelection').keydown(function(event) {
		FireShotSettings.processHotkey($(this), event);
	});

    $('#edtHotkeyBrowser').keydown(function(event) {
        FireShotSettings.processHotkey($(this), event);
    });

    $('#edtHotkeyTabs').keydown(function(event) {
        FireShotSettings.processHotkey($(this), event);
    });
	
	$("#btnTemplateSettings").click(function(){
		$(this).toggle();
		$("#divTemplateSettings").toggle();
	});
	
	$("#btnTemplateSettingsHide").click(function(){
		$("#btnTemplateSettings").toggle();
		$("#divTemplateSettings").toggle();
	});

	$("#btnAdvancedFunctions").click(function(){
		getExtension().installNative();
	});

    $("#btnConfigureHotkeys").click(function(){
        getExtension().openURL("chrome://extensions/configureCommands");
    });

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {});




    $("#edtDefaultFolder").change(checkAccessibility);
    $("#edtDefaultFolder").keydown(function() {setTimeout(checkAccessibility, 100);});


    setupAccessibility();

	FireShotSettings.loadSettings();

    checkAccessibility();
});


