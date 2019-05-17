//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2017 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

function insertScreenshots(composeView) {
    function addBlobToArray(arr, item) {
        return new Promise((resolve) => {
            fetch(item.data).then(response => {
                return response.blob();
            }).then(blob => {
                blob.name = decodeURIComponent(item.name);
                arr.push(blob);
                resolve();
            });
        });
    }

    chrome.runtime.sendMessage({
        message: "getScreenshotsForGmail"
    }, function (data) {
        var info = JSON.parse(data);
        var promises = [], inlineBlobs = [], blobs = [];

        composeView.setToRecipients(decodeURIComponent(info.to).split(","));
        composeView.setSubject(decodeURIComponent(info.subject));
        //composeView.insertTextIntoBodyAtCursor(info.body);

        for (var i = 0; i < info.files.length; ++i)
            promises.push(addBlobToArray(info.files[i].inline === "yes" ? inlineBlobs : blobs, info.files[i]));

        Promise.all(promises).then(() => {
            window.focus();

            if (inlineBlobs.length > 0)
                composeView.attachInlineFiles(inlineBlobs);
            if (blobs.length > 0)
                setTimeout(function() {composeView.attachFiles(blobs);}, 500);
        });
    });
}

InboxSDK.load('1.0', 'sdk_FireShot_c30c6a0127').then(function(sdk){

    // the SDK has been loaded, now do something with it!
    sdk.Compose.registerComposeViewHandler(function(composeView){
        insertScreenshots(composeView);
    });

    sdk.Compose.openNewComposeView();

});