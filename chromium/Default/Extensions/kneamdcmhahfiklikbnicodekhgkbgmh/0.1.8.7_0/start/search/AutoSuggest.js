window.AutoSuggest = function(textBox, engine, action){
  "use strict";
  var t = this;
  var interval = null;
  var lastValue = "";
  var m_suggestUrl = engine;
  
  t.asDiv = null;
  var selectedRow = -1;
  var resultsLength = 0;
  t.action = action;
  t.init = function(){
    textBox.addEventListener("keydown" ,t.keyDown, false);
    textBox.addEventListener("keyup" ,t.keyUp, false);
    //textBox.addEventListener("blur" ,t.documentMouseDown, false);
  }
  t.setSuggestUrl = function(su){
    m_suggestUrl = su;
  }
  t.sprintf = function(str,params){
    var formatted = str;
    for (var k in params) {
      var v = params[k];
      var regexp = new RegExp('\\{'+(k)+'\\}', 'gi');
      formatted = formatted.replace(regexp, v);
    }
    return formatted;
  }
  t.getData = function(val) {
    if (!val){
      if(t.asDiv!=null) t.asDiv.style.display = 'none';
      return;
    }
    // no data retrieves if, suggest url is empty 
    if (m_suggestUrl === undefined || m_suggestUrl === '') { return; }
    var hl;
    var locale = hl = utils.locale;
    var locale = locale.replace("_","-");
    //alert(t.sprintf('{searchTerms} is {good}',{searchTerms : 'hi',good:'bad'}))
    //var URL = "http://google.com/complete/search?hl="+hl+"&output=toolbar&q=" + val;
    //var URL = "https://www.google.com/complete/search?output=toolbar&hl=en&q={searchTerms}";
    //var engine = "http://www.google.com/complete/search?hl="+hl+"&client=firefox&q=" + val;

    var URL = t.sprintf(m_suggestUrl, {searchTerms:val,lang:locale,country:''});
    //var URL = "https://www.google.com/complete/search?hl="+hl+"&client=firefox&q=" + val;

    {
      var xmlHttpRequest;
      xmlHttpRequest = new XMLHttpRequest();
      xmlHttpRequest.open("GET", URL, true);
      xmlHttpRequest.onreadystatechange = function(){     
        if(xmlHttpRequest.readyState==4){
          if (xmlHttpRequest.status==200){
            var response;
            if(lastValue==val){
              if(t.asDiv==null){
                t.asDiv = document.getElementById('search-suggestion-pad');           
              }
              // clean previous result
              t.asDiv.innerHTML = null;

                            var response = xmlHttpRequest.response ;

                            if(typeof (SEARCH_ENGINES[user['sengine']]['SuggestParser']) == 'function'){
                                response = SEARCH_ENGINES[user['sengine']]['SuggestParser'](response)
                            }
                            else{
                  response = JSON.parse(response);
                            }

              var completeSuggestion=response[1];
              resultsLength = completeSuggestion.length;
              for(var i=0;i<resultsLength && i<5;i++){
                var resultVal = completeSuggestion[i];
                var row = document.createElement("li");
                
                var pos = resultVal.indexOf(val);
                if(pos!=-1){
                  row.innerHTML = resultVal.substr(0, pos + val.length) + "<b>" + resultVal.substr(pos + val.length) +"</b>";
                } else {
                  row.textContent = resultVal;
                }
                
                row.setAttribute("id", "auto-suggest-row" + i);
                row.index = i;
                row.isRow = true;
                row.addEventListener("mouseover" , function(e){
                  var row = e.currentTarget;
                  if (selectedRow!=-1)  document.getElementById("auto-suggest-row" + selectedRow).setAttribute("class", "");
                  row.setAttribute("class", "selected");
                  selectedRow = row.index;
                },false);
                row.addEventListener("click" , function(e){
                  var row = e.currentTarget;
                  textBox.value = row.textContent;
                  t.onSearch(row.textContent);
                  e.preventDefault();
                }, false);

                t.asDiv.appendChild(row);

              }
              selectedRow = -1;
              if (resultsLength==0){
                t.asDiv.style.display = 'none';
              } else {  
                t.asDiv.style.display = 'block';
              }
            }
          }
        }
      };
      xmlHttpRequest.send("");
    }
    //)
  }
  t.keyUp = function(e) {
    var keyCode = e.keyCode;
    if (keyCode != 13) {
       if ((keyCode!=38) && (keyCode!=40) && (keyCode!=116)){
         if (interval!=null) {
           window.clearInterval(interval)
           interval = null;
         }
         lastValue = textBox.value;
         interval = setTimeout(t.getData, 10, textBox.value)
       }
    } 
  }
  t.keyDown = function(e){
    var keyCode = e.keyCode;
    /*
    if(keyCode==13){
      
      if(selectedRow!=-1){
        textBox.value = document.getElementById("auto-suggest-row" + selectedRow).textContent;
      }
      t.onSearch(textBox.value);
      return;
      
    }
    */
    if((keyCode!=38) && (keyCode!=40)){
    }else{          
      if(keyCode==38){
        if(selectedRow!=-1){
          document.getElementById("auto-suggest-row" + selectedRow).setAttribute("class", "");
        }
        selectedRow--;
        if(selectedRow<0){
          selectedRow = resultsLength-1;  
        } 
      }else{
        if(selectedRow!=-1){
          document.getElementById("auto-suggest-row" + selectedRow).setAttribute("class", "");
        }
        selectedRow++;
        if (selectedRow>=resultsLength){
          selectedRow = 0;  
        }
        }
        var row = document.getElementById("auto-suggest-row" + selectedRow);
        row.setAttribute("class", "selected");
        textBox.value = row.textContent;
      }
  }
  t.documentMouseDown = function(e){
    if(e.explicitOriginalTarget!=t.asDiv){
      lastValue = "--";
      if(t.asDiv!=null){
        t.asDiv.style.display = 'none';
        try{
          document.getElementById("container").style.height =  "3px"; 
        }catch(e){console.log(e)}
      }
    }
  }
    
  t.setASdivPosition = function(){
    var el = textBox;
    var x = 0;
    var y = textBox.offsetHeight - 1;
    while((el.offsetParent) && (el.tagName.toLowerCase()!='body')){
      x += el.offsetLeft;
      y += el.offsetTop;
      el = el.offsetParent;
    }
    x += el.offsetLeft;
    y += el.offsetTop;
    if(t.asDiv!=null){
      t.asDiv.style.left = x + "px";
      t.asDiv.style.top  = y + "px";
    }
  }

  t.onSearch = function(val){
    lastValue = "--";
    if(t.asDiv!=null){
      t.asDiv.style.display = 'none';
      if (document.getElementById("container")){
        document.getElementById("container").style.height =  "29px";  
      }
      t.action();
    }
  }
  
  t.changeSuggestUrl = function(aUrl) {
    m_suggestUrl = aUrl;
  }
  
  t.init(); 
};