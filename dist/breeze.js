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

'use strict';

window.BreezeConfig = function() {
  var _databases = {};

  function addDatabase(name, uri, params, fetch_object_function) {
    _databases[name] = { uri: uri,
                         params: params,
                         fetch_object_function: fetch_object_function };
  }

  return {
    addDatabase: addDatabase,
    _databases: _databases
  }

}();

function BreezeController($scope, $http) {
  $scope.query = { sequence: null, db: null, input: null };
  $scope.submitted = false;
  $scope.databases = window.BreezeConfig._databases;
  $scope.results = null;

  function processResults(fetch_obj_f, results) {
    var data = {};
    $scope.results = _.map(results, function(res) {
      var d = {
        res: res,
        obj: null
      };
      data[res.label] = d;
      return d;
    });

    if (fetch_obj_f !== undefined) {
      var labels = _.keys(data);
      fetch_obj_f($http, labels, function(objs) {
        // expects a hash mapping label to object. each object has name,
        // length, link, children attributes.  children should contain list of
        // ids matching same format as res.label.
        _.map(_.keys(objs), function(k) { data[k].obj = objs[k]; });
      });
    }
  }

  $scope.makeQuery = function() {
    if (!$scope.query.sequence || !$scope.query.db || !$scope.query.input) {
      alert("Please enter a sequence, select sequence type, and a database");
      return;
    }

    var p = BreezeConfig._databases[$scope.query.db];
    var url = p.uri;
    var params = {};
    for (var x in p.params) { params[x] = p.params[x]; }
    var fetch_obj_f = p.fetch_object_function;

    params['input'] = $scope.query.input;
    params['identity_threshold'] = 0.5;
    params['feature_threshold'] = 0.1;
    params['circular'] = 0;
    params['sequence'] = $scope.query.sequence;

    var encoded = _.map(_.keys(params), function(x) {
      return ""+encodeURIComponent(x)+"="+encodeURIComponent(params[x]);
    }).join("&");

    $scope.submitted = true;
    $scope.results = null;

    $http({
      method: 'POST',
      url: url,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      data: encoded 
    }).success(function(data) {
      $scope.submitted = false;
      processResults(fetch_obj_f, data[1]);
    }).error(function(data, status, headers, config) {
      $scope.submitted = false;
      alert('Cannot blast, received error');
    });
  };
}
