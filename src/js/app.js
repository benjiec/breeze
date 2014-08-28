var app = angular.module('breeze', ['ngRoute', 'ngSanitize'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/',
            { template: JST['breeze'], controller: BreezeController})
      .otherwise({redirectTo: '/breeze'});
  }]);

app.directive('partial', function($compile) {
  var linker = function(scope, element, attrs) {
    element.html(JST[attrs.template]());
    $compile(element.contents())(scope);
  };
  return {
    link: linker,
    restrict: 'E'
  }
});

app.filter('encodeURIComponent', function() { return window.encodeURIComponent; });
app.filter('encodeURI', function() { return window.encodeURI; });
app.filter('trunc', function() {
  return function(s, n) {
    if (!s) { return ''; }
    if (n === undefined) n = 20;
    return s.length <= n ? s : s.substr(0, n)+'...';
  };
});
