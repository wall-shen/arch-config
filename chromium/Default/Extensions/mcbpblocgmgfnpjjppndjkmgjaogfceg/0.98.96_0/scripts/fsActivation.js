//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2018 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

// One file for browsers: chrome, mozilla


if (!window.fsActivationEvents) {

    window.fsActivationEvents = true;

    chrome.runtime.sendMessage({message: "checkFSAvailabilityEvt"}, function (data) {
        document.addEventListener("checkFSAvailabilityEvt", function (evt) {
            for (var key in data)
                if (data.hasOwnProperty(key)) {
                    evt.target.setAttribute(key, data[key]);
                    //console.log(key);
                }

        }, false);
    });


    document.addEventListener("activateFireShotEvt", function (evt) {

        chrome.runtime.sendMessage({
            message: "activateFireShot",
            name: evt.target.getAttribute("FSName"),
            key: evt.target.getAttribute("FSKey")
        }, function (response) {});
    }, false);
}

var element = document.createElement("FireShotDataElement");
document.documentElement.appendChild(element);
var evt = document.createEvent("Events");
evt.initEvent("helloFromFireShotForChrome", true, false);
element.dispatchEvent(evt);
document.documentElement.removeChild(element);
