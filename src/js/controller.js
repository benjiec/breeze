'use strict';

window.BreezeConfig = function() {
  var _databases = {};

  function addDatabase(name, uri, params) {
    _databases[name] = {uri: uri, params: params};
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

  $scope.makeQuery = function() {
    if (!$scope.query.sequence || !$scope.query.db || !$scope.query.input) {
      alert("Please enter a sequence, select sequence type, and a database");
      return;
    }

    var p = BreezeConfig._databases[$scope.query.db];
    var url = p.uri;
    var params = {};
    for (var x in p.params) { params[x] = p.params[x]; }

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
      $scope.results = data[1];
    }).error(function(data, status, headers, config) {
      $scope.submitted = false;
      alert('Cannot blast, received error');
    });
  };
}
