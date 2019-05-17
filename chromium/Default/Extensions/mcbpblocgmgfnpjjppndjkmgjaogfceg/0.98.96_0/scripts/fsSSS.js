//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2018 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

// One file for browsers: chrome, mozilla

var fsPlugin = {
	port: undefined,
	inited: false,
	captures: undefined,
	
	init: function()
	{
		this.inited = true;
	},
	
	launchFunction: function(cmd, obj) 
	{
		if (cmd == "captureInit") this.captureInit(obj);
		else if (cmd == "captureTabPNG") this.captureTabPNG(obj);
		else if (cmd == "captureDone") this.loadImages(obj, this.captureDone);
	},
	
	captureInit: function(data)
	{
		this.captures = [];
		this.imagesLoaded = 0;
	},
	
	captureTabPNG: function(data)
	{
		this.captures.push(data);
	},
	
	loadImages: function(data, callback)
	{
		var cntr;
		var imagesPending = this.captures.length;
		var handlerFunc = function(id, img) {
			return function() {
				//noinspection JSReferencingMutableVariableFromClosure
				captures[id].dataurl = "";
				//noinspection JSReferencingMutableVariableFromClosure
				captures[id].img = img;
				
				if (--imagesPending === 0) 
					fsPlugin.captureDone(data);
			};
		};
		
		for (cntr = 0; cntr < this.captures.length; ++cntr)
		{
			var img = new Image(), captures = this.captures;
			img.onload = handlerFunc(cntr, img);
			img.src = captures[cntr].dataurl;
		}
	},
	
	captureDone: function(data)
	{
	
		var
            wszURL   	= data.url,
			wszTitle    = data.title,
			nLeft       = data.left,
			nTop        = data.top,
			nWidth      = data.width,
			nHeight     = data.height,
			fCrop       = data.crop,
			fDiv        = data.div,
			nCropLeft   = data.cropLeft || 0,
			nCropTop    = data.cropTop || 0,
			nCropRight  = data.cropRight || 0,
			nCropBottom = data.cropBottom || 0,
			nShiftX     = 0,
            nShiftY     = 0;
			

		this.pBitmapForChrome = document.createElement('canvas');

		var cntr;
		for (cntr = 0; cntr < this.captures.length; ++cntr)
		{
		
			var nSliceX = this.captures[cntr].x,
				nSliceY = this.captures[cntr].y,
				pObject = this.captures[cntr].img;


			if (cntr === 0)
			{
				nShiftX = nSliceX;
				nShiftY = nSliceY;


				this.pBitmapForChrome.width = Math.max(1, (fCrop ? nCropRight - nCropLeft : nWidth));
				this.pBitmapForChrome.height = Math.max(1, (fCrop ? nCropBottom - nCropTop : nHeight));
			}

			var nX = (nSliceX - nShiftX);
			var nY = (nSliceY - nShiftY);
			
			var ctx = this.pBitmapForChrome.getContext('2d');
			ctx.drawImage(pObject, nX - nCropLeft, nY - nCropTop);
		}
		
		capResult = this.pBitmapForChrome;
        capLinks = data.links;
		capResultFileNameLite = getFilenameLite();
		
		chrome.tabs.create({url: "fsCaptured.html"});
	}
};

function getJSPlugin()
{
	if (!fsPlugin.inited)
		fsPlugin.init();
		
	return fsPlugin;
}