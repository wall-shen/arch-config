//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2018 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

// One file for browsers: chrome, mozilla

if (!window.fsAPIEvents) {

    window.fsAPIEvents = true;

    chrome.runtime.sendMessage({message: "checkFSAvailabilityEvt"}, function (data) {
        document.addEventListener("checkFSAvailabilityEvt", function (evt) {
            for (var key in data)
                if (data.hasOwnProperty(key))
                    evt.target.setAttribute(key, data[key]);

        }, false);
    });

    document.addEventListener("capturePageEvt", function (evt) {

        chrome.runtime.sendMessage({
            message: "capturePageEvt",
            Entire: evt.target.getAttribute("Entire"),
            Action: evt.target.getAttribute("Action"),
            Data: evt.target.getAttribute("Data"),
            CapturedElement: evt.target.getAttribute("capturedFrameId") || undefined
        }, function (response) {
            window.fsPendingCB = evt.target.getAttribute("CBID");
        });
    }, false);


    document.addEventListener("switchToNativeEvt", function () {

        chrome.runtime.sendMessage({message: "switchToNativeEvt"}, function (data) {
        });
    }, false);
}
