(function() {
  var orderForType;

  orderForType = {
    'FixedProfile': -2000,
    'PacProfile': -1000,
    'VirtualProfile': 1000,
    'SwitchProfile': 2000,
    'RuleListProfile': 3000
  };

  angular.module('omegaDecoration', []).value('profileIcons', {
    'DirectProfile': 'glyphicon-transfer',
    'SystemProfile': 'glyphicon-off',
    'AutoDetectProfile': 'glyphicon-file',
    'FixedProfile': 'glyphicon-globe',
    'PacProfile': 'glyphicon-file',
    'VirtualProfile': 'glyphicon-question-sign',
    'RuleListProfile': 'glyphicon-list',
    'SwitchProfile': 'glyphicon-retweet'
  }).constant('profileOrder', function(a, b) {
    var diff;
    diff = (orderForType[a.profileType] | 0) - (orderForType[b.profileType] | 0);
    if (diff !== 0) {
      return diff;
    }
    if (a.name === b.name) {
      return 0;
    } else if (a.name < b.name) {
      return -1;
    } else {
      return 1;
    }
  }).constant('getVirtualTarget', function(profile, options) {
    if ((profile != null ? profile.profileType : void 0) === 'VirtualProfile') {
      return options != null ? options['+' + profile.defaultProfileName] : void 0;
    }
  }).directive('omegaProfileIcon', function(profileIcons, getVirtualTarget) {
    return {
      restrict: 'A',
      template: '<span ng-style="{color: color || getColor(profile)}"\n  ng-class="{\'virtual-profile-icon\': isVirtual(profile)}"\n  class="glyphicon {{icon || getIcon(profile)}}">\n</span>',
      scope: {
        'profile': '=?omegaProfileIcon',
        'icon': '=?icon',
        'color': '=?color',
        'options': '=options'
      },
      link: function(scope, element, attrs, ngModel) {
        scope.profileIcons = profileIcons;
        scope.isVirtual = function(profile) {
          return (profile != null ? profile.profileType : void 0) === 'VirtualProfile';
        };
        scope.getIcon = function(profile) {
          var type, _ref, _ref1;
          type = profile != null ? profile.profileType : void 0;
          type = (_ref = (_ref1 = getVirtualTarget(profile, scope.options)) != null ? _ref1.profileType : void 0) != null ? _ref : type;
          return profileIcons[type];
        };
        return scope.getColor = function(profile) {
          var color;
          color = void 0;
          while (profile) {
            color = profile.color;
            profile = getVirtualTarget(profile, scope.options);
          }
          return color;
        };
      }
    };
  }).directive('omegaProfileInline', function() {
    return {
      restrict: 'A',
      template: '<span omega-profile-icon="profile" options="options"></span>\n{{dispName ? dispName(profile) : profile.name}}',
      scope: {
        'profile': '=omegaProfileInline',
        'dispName': '=?dispName',
        'options': '=options'
      }
    };
  }).directive('omegaHtml', function($compile) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs, ngModel) {
        var getHtml, locals;
        locals = {
          $profile: function(profile, dispName, options) {
            if (profile == null) {
              profile = 'profile';
            }
            if (dispName == null) {
              dispName = 'dispNameFilter';
            }
            if (options == null) {
              options = 'options';
            }
            return "<span class=\"profile-inline\" omega-profile-inline=\"" + profile + "\"\n  disp-name=\"" + dispName + "\" options=\"" + options + "\"></span>";
          }
        };
        getHtml = function() {
          return scope.$eval(attrs.omegaHtml, locals);
        };
        return scope.$watch(getHtml, function(html) {
          element.html(html);
          return $compile(element.contents())(scope);
        });
      }
    };
  }).directive('omegaProfileSelect', function($timeout, profileIcons) {
    return {
      restrict: 'A',
      templateUrl: 'partials/omega_profile_select.html',
      require: '?ngModel',
      scope: {
        'profiles': '&omegaProfileSelect',
        'defaultText': '@?defaultText',
        'dispName': '=?dispName',
        'options': '=options'
      },
      link: function(scope, element, attrs, ngModel) {
        var updateView;
        scope.profileIcons = profileIcons;
        scope.currentProfiles = [];
        scope.dispProfiles = void 0;
        updateView = function() {
          var profile, _i, _len, _ref, _results;
          scope.profileIcon = '';
          _ref = scope.currentProfiles;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            profile = _ref[_i];
            if (profile.name === scope.profileName) {
              scope.selectedProfile = profile;
              scope.profileIcon = profileIcons[profile.profileType];
              break;
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        };
        scope.$watch(scope.profiles, (function(profiles) {
          scope.currentProfiles = profiles || [];
          if (scope.dispProfiles != null) {
            scope.dispProfiles = currentProfiles;
          }
          return updateView();
        }), true);
        scope.toggled = function(open) {
          if (open && (scope.dispProfiles == null)) {
            scope.dispProfiles = scope.currentProfiles;
            return scope.toggled = void 0;
          }
        };
        if (ngModel) {
          ngModel.$render = function() {
            scope.profileName = ngModel.$viewValue;
            return updateView();
          };
        }
        scope.setProfileName = function(name) {
          if (ngModel) {
            ngModel.$setViewValue(name);
            return ngModel.$render();
          }
        };
        return scope.getName = function(profile) {
          if (profile) {
            return scope.dispName(profile) || profile.name;
          }
        };
      }
    };
  });

}).call(this);
