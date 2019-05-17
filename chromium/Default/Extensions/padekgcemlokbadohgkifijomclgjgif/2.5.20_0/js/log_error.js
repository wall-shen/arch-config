(function() {
  window.onerror = function(message, url, line, col, err) {
    var log;
    log = localStorage['log'] || '';
    if (err != null ? err.stack : void 0) {
      log += err.stack + '\n\n';
    } else {
      log += "" + url + ":" + line + ":" + col + ":\t" + message + "\n\n";
    }
    localStorage['log'] = log;
  };

}).call(this);
