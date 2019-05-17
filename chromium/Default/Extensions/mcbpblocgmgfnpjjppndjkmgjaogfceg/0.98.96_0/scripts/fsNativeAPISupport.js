//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2018 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

// One file for browsers: chrome, mozilla

const statusHostReady = 0,
	  statusError = 1;

var fsNativePlugin = {
	port: undefined,
	ready: false,
	autoReconnect: false,
	updating: false,
	updated: false,
	ignoreResponse: false,
    portBusy: false,
	callback: undefined,
	prevVersion: undefined,
	updateTrials: 0,
    pendingData: "",
    firstPacket: true,
    oldProtocol: false,
	
	init: function(callback)
	{
        var processPacket = function(msg) {
            // Не передаём управление, пока  придёт status = ready
            if (fsNativePlugin.ignoreResponse)
            {
                getConsolePtr()("Ignored response: " + JSON.stringify(msg));
                if (msg.topic === "status" && msg.code == statusError)
                {
                    fsNativePlugin.updating = false;
                    fsNativePlugin.autoReconnect = false;

                    pluginEvent(msg);
                }
                return;
            }

            fsNativePlugin.autoReconnect = false;

            if (!fsNativePlugin.processInternally(msg))
                pluginEvent(msg);
        };

        this.callback = callback;
        this.ignoreResponse = false;

        this.portBusy = true;
		try {
            this.port = chrome.runtime.connectNative(crossBrowserVars.contractId);
        }
        catch (e) {
            logError(e.message);
            this.portBusy = false;
        }

		this.port.onMessage.addListener(function(packet) {

            //if (isDebug)
            //    getConsolePtr()("Received: " + JSON.stringify(packet).substr(0, 1024));

            if (fsNativePlugin.firstPacket) {
                fsNativePlugin.firstPacket = false;

                if (packet.topic) {
                    fsNativePlugin.oldProtocol = true;
                    getConsolePtr()("Old protocol detected");
                }
                else getConsolePtr()("New protocol detected");
            }

            if (fsNativePlugin.oldProtocol)
                processPacket(packet);
            else {
                if (packet.data !== "")
                    fsNativePlugin.pendingData += packet.data;
                else {
                    var msg = JSON.parse(fsNativePlugin.pendingData);

                    if (isDebug)
                        getConsolePtr()("Original Packet: " + fsNativePlugin.pendingData.substr(0, 1024));


                    fsNativePlugin.pendingData = "";
                    processPacket(msg);
                }
            }
		});
		
		this.port.onDisconnect.addListener(function() { 
			if (chrome.runtime.lastError) getConsolePtr()(chrome.runtime.lastError.message);
			this.ready = false;
            this.portBusy = false;
			
			if (!this.updating)
				this.runCallback();
			
			getConsolePtr()("Native port disconnected.");

            this.firstPacket = true;
            this.oldProtocol = false;
            this.pendingData = "";
			
			if (this.autoReconnect) this.doReconnect();
		}.bind(this));
		
		getConsolePtr()("Native port created successfully. Starting test...");
		this.launchJSON({JSONCommand:"ping"});
	},
	
	runCallback: function()
	{
		if (this.callback !== undefined)
		{
			this.callback();
			this.callback = undefined;
		}
	
	},
	
	processInternally: function(msg)
	{
        if (msg.topic == "hostVersion")
		{
			this.hostVersion = msg.data;
		
			if (extVersionFull != this.hostVersion)
			{
				if (++this.updateTrials > 3)
				{
					getConsolePtr()("Too much of unsuccessful update trials. No updates anymore.");
					gaTrack('UA-1025658-9', 'fireshot.com', "NativeError-Too much of unsuccessful update trials. No updates anymore"); 
					this.updating = false;
					return false;
				}
				else
				{
					this.prevVersion = this.hostVersion;
					this.doUpdate();
					return true;
				}
			}
		}
		else if (msg.topic == "status")
		{
			if (msg.code == statusHostReady)
			{
				var version = msg.data;
				
				this.updateTrials = 0;
				this.ready = true;
				this.runCallback();
			
				if (this.updating)
				{
					this.updated = true;
					this.updating = false;

					if (this.prevVersion != "0")
						nativeHostUpdated(version);
				}
				
				return false;
			}
			else 
			{
				if (this.updating)
				{
					this.updating = false;
					//nativeHostUpdated(version);
				}
				
				return false;
			}
		}
		
		else if (msg.topic == "getDLL")
		{
			this.sendDLL();
			return true;
		}
		
		return false;
	},
	
	launchJSON: function(JSONData)
	{
		this.port.postMessage(JSONData);
	},
	
	/*getFile: function(fileName, callback)
	{
        var xhr = new XMLHttpRequest();
        var url = chrome.extension.getURL(fileName);

        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
			
        xhr.onreadystatechange = function() {
            if ((xhr.readyState == XMLHttpRequest.DONE)) {
                if (xhr.status == 200 && xhr.response) {
                    var reader = new FileReader();
                    reader.onload = function (event) {
                        callback(btoa(event.target.result));
                    };
                    reader.onerror = function (event) {
                        gaTrack('UA-1025658-9', 'fireshot.com', "NativeError-Error decoding SSS.dll in FileReader");
                    };
                    reader.readAsBinaryString(xhr.response);
                }
                else
                    gaTrack('UA-1025658-9', 'fireshot.com', "NativeError-Error retrieving SSS.dll: " + xhr.status);
            }
        };
        xhr.send();
    },*/

    getFile: function(filename, callback) {
        getConsolePtr()("Fetching: " + filename);
        fetch(chrome.extension.getURL(filename)).then(response => {
            if (response.status == 200) {
                response.blob().then(blob => {
                    var reader = new FileReader();
                    reader.onload = function (event) {
                        callback(btoa(event.target.result));
                    };
                    reader.onerror = function (event) {
                        gaTrack('UA-1025658-9', 'fireshot.com', "NativeError-Error decoding SSS.dll in FileReader");
                    };
                    reader.readAsBinaryString(blob);
                });
            }
            else {
                getConsolePtr()("NativeError-Error retrieving file");
                gaTrack('UA-1025658-9', 'fireshot.com', "NativeError-Error retrieving " + filename + ": " + response.status);
            }
        }).catch(err => {
            gaTrack('UA-1025658-9', 'fireshot.com', "NativeError-Error retrieving " + filename + ": " + err);
        });
    },
	
	sendDLL: function()
	{
		this.getFile("native/sss.dat", function(data) {
			this.launchJSON({JSONCommand: "updateDLL", data: data});
		}.bind(this));
	},
	
	doUpdate: function()
	{
		getConsolePtr()("Updating native to the version: " + extVersionFull);
		this.ignoreResponse = true;
		this.getFile("native/" + crossBrowserVars.nativeFilePath, function(data) {
			this.updating = true;
			this.autoReconnect = true;
			this.launchJSON({JSONCommand: "updateNative", data: data});
		}.bind(this));
	},
	
	doReconnect: function()
	{
		setTimeout(function() {
			getConsolePtr()("Trying to reconnect...");
			this.init(this.callback);
		}.bind(this), 1000);
	},

    forceDisconnect: function()
    {
        this.autoReconnect = false;
        if (this.port)
            this.port.disconnect();
        this.ready = false;
    }
};