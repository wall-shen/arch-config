(function() {
  var customProfiles, i, module, moveDown, moveUp, shortcutKeys, _i,
    __hasProp = {}.hasOwnProperty;

  module = angular.module('omegaPopup', ['omegaTarget', 'omegaDecoration', 'ui.bootstrap', 'ui.validate']);

  module.filter('tr', function(omegaTarget) {
    return omegaTarget.getMessage;
  });

  module.filter('dispName', function(omegaTarget) {
    return function(name) {
      if (typeof name === 'object') {
        name = name.name;
      }
      return omegaTarget.getMessage('profile_' + name) || name;
    };
  });

  moveUp = function(activeIndex, items) {
    var i, _ref;
    i = activeIndex - 1;
    if (i >= 0) {
      return (_ref = items.eq(i)[0]) != null ? _ref.focus() : void 0;
    }
  };

  moveDown = function(activeIndex, items) {
    var _ref;
    return (_ref = items.eq(activeIndex + 1)[0]) != null ? _ref.focus() : void 0;
  };

  shortcutKeys = {
    38: moveUp,
    40: moveDown,
    74: moveDown,
    75: moveUp,
    48: '+direct',
    83: '+system',
    191: 'help',
    63: 'help',
    69: 'external',
    65: 'addRule',
    43: 'addRule',
    61: 'addRule',
    84: 'tempRule',
    79: 'option',
    82: 'requestInfo'
  };

  for (i = _i = 1; _i <= 9; i = ++_i) {
    shortcutKeys[48 + i] = i;
  }

  customProfiles = (function() {
    var _customProfiles;
    _customProfiles = null;
    return function() {
      return _customProfiles != null ? _customProfiles : _customProfiles = jQuery('.custom-profile:not(.ng-hide) > a');
    };
  })();

  jQuery(document).on('keydown', function(e) {
    var handler, items, key, keys, shortcut, showHelp, _ref, _ref1;
    handler = shortcutKeys[e.keyCode];
    if (!handler) {
      return;
    }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    switch (typeof handler) {
      case 'string':
        switch (handler) {
          case 'help':
            showHelp = function(element, key) {
              var span;
              if (typeof element === 'string') {
                element = jQuery("a[data-shortcut='" + element + "']");
              }
              span = jQuery('.shortcut-help', element);
              if (span.length === 0) {
                span = jQuery('<span/>').addClass('shortcut-help');
              }
              span.text(key);
              return element.find('.glyphicon').after(span);
            };
            keys = {
              '+direct': '0',
              '+system': 'S',
              'external': 'E',
              'addRule': 'A',
              'tempRule': 'T',
              'option': 'O',
              'requestInfo': 'R'
            };
            for (shortcut in keys) {
              key = keys[shortcut];
              showHelp(shortcut, key);
            }
            customProfiles().each(function(i, el) {
              if (i <= 8) {
                return showHelp(jQuery(el), i + 1);
              }
            });
            break;
          default:
            if ((_ref = jQuery("a[data-shortcut='" + handler + "']")[0]) != null) {
              _ref.click();
            }
        }
        break;
      case 'number':
        if ((_ref1 = customProfiles().eq(handler - 1)) != null) {
          _ref1.click();
        }
        break;
      case 'function':
        items = jQuery('.popup-menu-nav > li:not(.ng-hide) > a');
        i = items.index(jQuery(e.target).closest('a'));
        if (i === -1) {
          i = items.index(jQuery('.popup-menu-nav > li.active > a'));
        }
        handler(i, items);
    }
    return false;
  });

  module.controller('PopupCtrl', function($scope, $window, $q, omegaTarget, profileIcons, profileOrder, dispNameFilter, getVirtualTarget) {
    var preselectedProfileNameForCondition, refresh, refreshOnProfileChange;
    $scope.closePopup = function() {
      return $window.close();
    };
    $scope.openManage = function() {
      omegaTarget.openManage();
      return $window.close();
    };
    refreshOnProfileChange = false;
    refresh = function() {
      if (refreshOnProfileChange) {
        return omegaTarget.refreshActivePage().then(function() {
          return $window.close();
        });
      } else {
        return $window.close();
      }
    };
    $scope.profileIcons = profileIcons;
    $scope.dispNameFilter = dispNameFilter;
    $scope.isActive = function(profileName) {
      if ($scope.isSystemProfile) {
        return profileName === 'system';
      } else {
        return $scope.currentProfileName === profileName;
      }
    };
    $scope.isEffective = function(profileName) {
      return $scope.isSystemProfile && $scope.currentProfileName === profileName;
    };
    $scope.getIcon = function(profile, normal) {
      if (!profile) {
        return;
      }
      if (!normal && $scope.isEffective(profile.name)) {
        return 'glyphicon-ok';
      } else {
        return void 0;
      }
    };
    $scope.getProfileTitle = function(profile, normal) {
      var desc;
      desc = '';
      while (profile) {
        desc = profile.desc;
        profile = getVirtualTarget(profile, $scope.availableProfiles);
      }
      return desc || (profile != null ? profile.name : void 0) || '';
    };
    $scope.openOptions = function(hash) {
      return omegaTarget.openOptions(hash).then(function() {
        return $window.close();
      });
    };
    $scope.openConditionHelp = function() {
      var pname;
      pname = encodeURIComponent($scope.currentProfileName);
      return $scope.openOptions("#/profile/" + pname + "?help=condition");
    };
    $scope.applyProfile = function(profile) {
      var apply, next;
      next = function() {
        if (profile.profileType === 'SwitchProfile') {
          return omegaTarget.state('web.switchGuide').then(function(switchGuide) {
            if (switchGuide === 'showOnFirstUse') {
              return $scope.openOptions("#/profile/" + profile.name);
            }
          });
        }
      };
      if (!refreshOnProfileChange) {
        omegaTarget.applyProfileNoReply(profile.name);
        apply = next();
      } else {
        apply = omegaTarget.applyProfile(profile.name).then(function() {
          return omegaTarget.refreshActivePage();
        }).then(next);
      }
      if (apply) {
        return apply.then(function() {
          return $window.close();
        });
      } else {
        return $window.close();
      }
    };
    $scope.tempRuleMenu = {
      open: false
    };
    $scope.nameExternal = {
      open: false
    };
    $scope.addTempRule = function(domain, profileName) {
      $scope.tempRuleMenu.open = false;
      return omegaTarget.addTempRule(domain, profileName).then(function() {
        omegaTarget.state('lastProfileNameForCondition', profileName);
        return refresh();
      });
    };
    $scope.setDefaultProfile = function(profileName, defaultProfileName) {
      return omegaTarget.setDefaultProfile(profileName, defaultProfileName).then(function() {
        return refresh();
      });
    };
    $scope.addCondition = function(condition, profileName) {
      return omegaTarget.addCondition(condition, profileName).then(function() {
        omegaTarget.state('lastProfileNameForCondition', profileName);
        return refresh();
      });
    };
    $scope.addConditionForDomains = function(domains, profileName) {
      var conditions, domain, enabled;
      conditions = [];
      for (domain in domains) {
        if (!__hasProp.call(domains, domain)) continue;
        enabled = domains[domain];
        if (enabled) {
          conditions.push({
            conditionType: 'HostWildcardCondition',
            pattern: domain
          });
        }
      }
      return omegaTarget.addCondition(conditions, profileName).then(function() {
        omegaTarget.state('lastProfileNameForCondition', profileName);
        return refresh();
      });
    };
    $scope.validateProfileName = {
      conflict: '!$value || !availableProfiles["+" + $value]',
      hidden: '!$value || $value[0] != "_"'
    };
    $scope.saveExternal = function() {
      var name;
      $scope.nameExternal.open = false;
      name = $scope.externalProfile.name;
      if (name) {
        return omegaTarget.addProfile($scope.externalProfile).then(function() {
          return omegaTarget.applyProfile(name).then(function() {
            return refresh();
          });
        });
      }
    };
    $scope.returnToMenu = function() {
      if (location.hash.indexOf('!') >= 0) {
        location.href = 'popup/index.html';
        return;
      }
      $scope.showConditionForm = false;
      return $scope.showRequestInfo = false;
    };
    preselectedProfileNameForCondition = 'direct';
    if ($window.location.hash === '#!requestInfo') {
      $scope.showRequestInfo = true;
    } else if ($window.location.hash === '#!external') {
      $scope.nameExternal = {
        open: true
      };
    }
    omegaTarget.state(['availableProfiles', 'currentProfileName', 'isSystemProfile', 'validResultProfiles', 'refreshOnProfileChange', 'externalProfile', 'proxyNotControllable', 'lastProfileNameForCondition']).then(function(_arg) {
      var availableProfiles, charCodeUnderscore, currentProfileName, externalProfile, isSystemProfile, key, lastProfileNameForCondition, profile, profilesByNames, proxyNotControllable, refresh, validResultProfiles, _j, _len, _ref;
      availableProfiles = _arg[0], currentProfileName = _arg[1], isSystemProfile = _arg[2], validResultProfiles = _arg[3], refresh = _arg[4], externalProfile = _arg[5], proxyNotControllable = _arg[6], lastProfileNameForCondition = _arg[7];
      $scope.proxyNotControllable = proxyNotControllable;
      if (proxyNotControllable) {
        return;
      }
      $scope.availableProfiles = availableProfiles;
      $scope.currentProfile = availableProfiles['+' + currentProfileName];
      $scope.currentProfileName = currentProfileName;
      $scope.isSystemProfile = isSystemProfile;
      $scope.externalProfile = externalProfile;
      refreshOnProfileChange = refresh;
      charCodeUnderscore = '_'.charCodeAt(0);
      profilesByNames = function(names) {
        var name, profiles, shown, _j, _len;
        profiles = [];
        for (_j = 0, _len = names.length; _j < _len; _j++) {
          name = names[_j];
          shown = name.charCodeAt(0) !== charCodeUnderscore || name.charCodeAt(1) !== charCodeUnderscore;
          if (shown) {
            profiles.push(availableProfiles['+' + name]);
          }
        }
        return profiles;
      };
      $scope.validResultProfiles = profilesByNames(validResultProfiles);
      if (lastProfileNameForCondition) {
        _ref = $scope.validResultProfiles;
        for (_j = 0, _len = _ref.length; _j < _len; _j++) {
          profile = _ref[_j];
          if (profile.name === lastProfileNameForCondition) {
            preselectedProfileNameForCondition = lastProfileNameForCondition;
          }
        }
      }
      $scope.builtinProfiles = [];
      $scope.customProfiles = [];
      for (key in availableProfiles) {
        if (!__hasProp.call(availableProfiles, key)) continue;
        profile = availableProfiles[key];
        if (profile.builtin) {
          $scope.builtinProfiles.push(profile);
        } else if (profile.name.charCodeAt(0) !== charCodeUnderscore) {
          $scope.customProfiles.push(profile);
        }
        if (profile.validResultProfiles) {
          profile.validResultProfiles = profilesByNames(profile.validResultProfiles);
        }
      }
      return $scope.customProfiles.sort(profileOrder);
    });
    $scope.domainsForCondition = {};
    $scope.requestInfoProvided = null;
    omegaTarget.setRequestInfoCallback(function(info) {
      var domain, domainInfo, _ref;
      info.domains = [];
      _ref = info.summary;
      for (domain in _ref) {
        if (!__hasProp.call(_ref, domain)) continue;
        domainInfo = _ref[domain];
        domainInfo.domain = domain;
        info.domains.push(domainInfo);
      }
      info.domains.sort(function(a, b) {
        return b.errorCount - a.errorCount;
      });
      return $scope.$apply(function() {
        var _base, _j, _len, _name, _ref1;
        $scope.requestInfo = info;
        if ($scope.requestInfoProvided == null) {
          $scope.requestInfoProvided = (info != null ? info.domains.length : void 0) > 0;
        }
        _ref1 = info.domains;
        for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
          domain = _ref1[_j];
          if ((_base = $scope.domainsForCondition)[_name = domain.domain] == null) {
            _base[_name] = true;
          }
        }
        return $scope.profileForDomains != null ? $scope.profileForDomains : $scope.profileForDomains = preselectedProfileNameForCondition;
      });
    });
    $q.all([omegaTarget.state('currentProfileCanAddRule'), omegaTarget.getActivePageInfo()]).then(function(_arg) {
      var canAddRule, info;
      canAddRule = _arg[0], info = _arg[1];
      $scope.currentProfileCanAddRule = canAddRule;
      if (info) {
        $scope.currentTempRuleProfile = info.tempRuleProfileName;
        if ($scope.currentTempRuleProfile) {
          preselectedProfileNameForCondition = $scope.currentTempRuleProfile;
        }
        $scope.currentDomain = info.domain;
        if ($window.location.hash === '#!addRule') {
          return $scope.prepareConditionForm();
        }
      }
    });
    return $scope.prepareConditionForm = function() {
      var conditionSuggestion, currentDomain, currentDomainEscaped, domainLooksLikeIp;
      currentDomain = $scope.currentDomain;
      currentDomainEscaped = currentDomain.replace(/\./g, '\\.');
      domainLooksLikeIp = false;
      if (currentDomain.indexOf(':') >= 0) {
        domainLooksLikeIp = true;
        if (currentDomain[0] !== '[') {
          currentDomain = '[' + currentDomain + ']';
          currentDomainEscaped = currentDomain.replace(/\./g, '\\.').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
        }
      } else if (currentDomain[currentDomain.length - 1] >= 0) {
        domainLooksLikeIp = true;
      }
      if (domainLooksLikeIp) {
        conditionSuggestion = {
          'HostWildcardCondition': currentDomain,
          'HostRegexCondition': '^' + currentDomainEscaped + '$',
          'UrlWildcardCondition': '*://' + currentDomain + '/*',
          'UrlRegexCondition': '://' + currentDomainEscaped + '(:\\d+)?/',
          'KeywordCondition': currentDomain
        };
      } else {
        conditionSuggestion = {
          'HostWildcardCondition': '*.' + currentDomain,
          'HostRegexCondition': '(^|\\.)' + currentDomainEscaped + '$',
          'UrlWildcardCondition': '*://*.' + currentDomain + '/*',
          'UrlRegexCondition': '://([^/.]+\\.)*' + currentDomainEscaped + '(:\\d+)?/',
          'KeywordCondition': currentDomain
        };
      }
      $scope.rule = {
        condition: {
          conditionType: 'HostWildcardCondition',
          pattern: conditionSuggestion['HostWildcardCondition']
        },
        profileName: preselectedProfileNameForCondition
      };
      $scope.$watch('rule.condition.conditionType', function(type) {
        return $scope.rule.condition.pattern = conditionSuggestion[type];
      });
      return $scope.showConditionForm = true;
    };
  });

}).call(this);
