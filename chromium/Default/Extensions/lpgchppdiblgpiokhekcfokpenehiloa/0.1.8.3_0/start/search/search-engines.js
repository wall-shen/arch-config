(function(window){
  "use strict";

  window.SEARCH_ENGINES = {
    'google' : {
      "ShortName": "Google",
      "LongName" : "Google Search",
      "InputEncoding" : "UTF-8",
      "SearchUrl": "http://www.google.com/search?sourceid=chrome&ie=utf-8&oe=utf-8&aq=t&hl={lang}&q={searchTerms}",
      "SuggestUrl": "http://www.google.com/complete/search?client=firefox&ie=utf-8&oe=utf-8&hl={lang}&gl={country}&q={searchTerms}",
      'Images' : 'https://www.google.com/search?biw=1235&bih=730&tbm=isch&sa=1&btnG=Search&q=' ,
      'Videos' : 'https://www.google.com/search?tbm=vid&hl=en&source=hp&biw=&bih=&btnG=Google+Search&oq=&gs_l=&q=',
      "SearchForm":"https://www.google.com/"
    }
  };

  window.SEARCH_ENGINES_IS = [];
  window.SEARCH_ENGINES_ORDER = ['google'];
  window.SEARCH_ENGINES_DEFAULT = SEARCH_ENGINES_ORDER[0];

})(this);
