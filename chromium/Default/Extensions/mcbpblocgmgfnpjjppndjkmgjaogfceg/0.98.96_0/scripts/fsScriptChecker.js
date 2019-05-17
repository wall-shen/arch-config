//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2018 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

// One file for browsers: chrome, mozilla

var scriptLoaded;

chrome.runtime.sendMessage({message:(typeof scriptLoaded == "undefined" ? "loadScript" : "execScript")});