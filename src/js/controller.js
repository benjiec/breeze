'use strict';

function BreezeController($scope, $http) {
  $scope.query = null;

  $scope.makeQuery = function() {
    alert($scope.query);
  };
}
