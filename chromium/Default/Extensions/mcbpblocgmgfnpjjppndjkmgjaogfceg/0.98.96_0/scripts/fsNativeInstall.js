//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2017 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

function downloadInstaller() {
    function downloadFile(filename, blob, mime) {
        var a = document.createElement('a');
        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        a.textContent = "";

        a.dataset.downloadurl = [mime, a.download, a.href].join(':');

        document.documentElement.appendChild(a);
        a.click();
        document.documentElement.removeChild(a);
    }

    fetch(chrome.extension.getURL("native/fireshot-chrome-plugin.dat"))
        .then(res => res.blob())
        .then(blob => downloadFile("fireshot-chrome-plugin.exe", blob, "application/octet-stream"));
}



document.addEventListener('DOMContentLoaded', function () {
    var extension = chrome.extension.getBackgroundPage();
    var stopReconnectOnClose = false;

    downloadInstaller();

	if (isOpera())
	{
		$('#img-step1-opera').toggle();
		$('#download-image').addClass("opera-download");
	}
	else
	{
		$('#img-step1').toggle();
		$('#download-image').addClass("chrome-download");
	}
	
	function checkUpgraded()
	{
		if (extension.fsNativePlugin.ready)
		{
			gaTrack('UA-1025658-9', 'fireshot.com', "NativeHostInstalled"); 
			//document.location.href = extension.getInstalledPageURL();
            extension.updateContextMenu();
            extension.doTrial();
            window.close();
		}
		else
		{
			console.log("check");
			if (!extension.fsNativePlugin.autoReconnect && !extension.fsNativePlugin.updating && !extension.fsNativePlugin.portBusy)
			{
				console.log("connecting from page");
				extension.fsNativePlugin.init();
			}
				
			setTimeout(function() {checkUpgraded();}, 1000);
		}
	}
	
	checkUpgraded();
});

