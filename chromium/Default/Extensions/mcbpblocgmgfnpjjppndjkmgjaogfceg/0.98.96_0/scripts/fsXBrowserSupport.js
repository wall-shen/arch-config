//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2018 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

// One file for browsers: chrome, mozilla

function detectBrowser() {
    var extensionId = chrome.runtime.id;

    // Для дебага опера и хром имеют одинаковый ID, поэтому тут частный случай.
    if (extensionId === 'legfpnnmhhnhjgekmmbkilmijnjoehne')
        return navigator.appVersion.match(/OPR\/\d+\./i) !== null ? 'opera' : 'chrome';

    //var chromeIDs = ['mcbpblocgmgfnpjjppndjkmgjaogfceg', 'hpbicldbpgipcloiojdbchegbbjiobbm', 'adpnodbfhlagloahhdhjggicnfcpggkm'];
    var operaIDs = ['pbjmgmedeliohhbaefhlplndokcbmjio'];
    var firefoxIDs = ['fireshot@getfireshot.com', 'fireshot-pro@getfireshot.com', 'fireshot-beta@getfireshot.com', '{0b457cAA-602d-484a-8fe7-c1d894a011ba}', '{5e11ab1e-083c-11e5-a6c0-1697f925ec7b}'];

    if (operaIDs.indexOf(extensionId) > -1) return 'opera';
    else if (firefoxIDs.indexOf(extensionId) > -1) return 'firefox';
    else return 'chrome';
}

var extensionBrowser = detectBrowser();

var crossBrowserVars = {
    contractId: {
        chrome: 'com.getfireshot.api',
        opera : 'com.getfireshot.api',
        firefox: 'com.getfireshot.api.firefox'
    },

    nativeFilePath: {
        chrome: 'fireshot-chrome-plugin.dat',
        opera: 'fireshot-chrome-plugin.dat',
        firefox: 'fireshot-firefox-plugin.dat'
    }
};

for (var key in crossBrowserVars ) crossBrowserVars[key] = crossBrowserVars[key][extensionBrowser];