window.BreezeAlignment = function(query_start, query_end, subject_start, subject_end, query, match, subject) {
  function getMisMatch(match_str) {
    var both = match_str.replace(/ /g, "X");
    return both.replace(/\|/g, " ");
  }

  var mismatch = getMisMatch(match);

  function wrapped_html(rowlen) {
    if (rowlen === undefined) { rowlen = 80; }

    var rsplit = new RegExp('(.{1,'+rowlen+'})', 'g');
    var query_rows = query.match(rsplit);
    var mismatch_rows = mismatch.match(rsplit);
    var subject_rows = subject.match(rsplit);

    var s = [];
    s.push('<table class="sequence alignment">');
    for (var i=0; i<query_rows.length; i++) {
      // query
      var tr = '<tr class="alignment-query"><td class="alignment-pos alignment-pos-left">';
      if (i == 0) { tr += ''+query_start; }
      tr += '</td><td>'+query_rows[i]+'</td><td class="alignment-pos alignment-pos-right">';
      if (i == query_rows.length-1) { tr += ''+query_end; }
      tr += '</td></tr>';
      s.push(tr);
      //mismatch
      var tr = '<tr class="alignment-mismatch"><td class="alignment-pos alignment-pos-left">';
      tr += '</td><td>'+mismatch_rows[i]+'</td><td class="alignment-pos alignment-pos-right">';
      tr += '</td></tr>';
      s.push(tr);
      // subject
      var tr = '<tr class="alignment-subject"><td class="alignment-pos alignment-pos-left">';
      if (i == 0) { tr += ''+subject_start }
      tr += '</td><td>'+subject_rows[i]+'</td><td class="alignment-pos alignment-pos-right">';
      if (i == subject_rows.length-1) { tr += ''+subject_end; }
      tr += '</td></tr>';
      s.push(tr);
    }
    s.push('</table>');
    return s.join('\n');
  }

  return {
    wrapped_html: wrapped_html,
    query: query.slice(0),
    match: match.slice(0),
    mismatch: mismatch.slice(0),
    subject: subject.slice(0)
  };
};

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
  $scope.query = { sequence: null, db: null, input: 'dna',
                   identity_threshold: 0.5, feature_threshold: 0.0,
                   to_show: null };
  $scope.submitted = false;
  $scope.databases = window.BreezeConfig._databases;
  $scope.results = null;

  function processResults(fetch_obj_f, results) {
    var data = {};
    console.log(results);
    $scope.results = _.map(results, function(res) {
      checkDegen(res);
      var d = {
        res: res,
        alignment: BreezeAlignment(res.query_start, res.query_end, res.subject_start, res.subject_end,
                                   res.alignment.query, res.alignment.match, res.alignment.subject),
        obj: null
      };
      data[res.accession] = d;
      return d;
    });

    if (fetch_obj_f !== undefined && _.keys(data).length > 0) {
      var accessions = _.keys(data);
      fetch_obj_f($http, accessions, function(objs) {
        // expects a hash mapping accession to object. each object has name,
        // length, link, children attributes. children should contain list of
        // ids matching same format as res.accession.
        _.map(_.keys(objs), function(k) { data[k].obj = objs[k]; });
      });
    }
  }

  function checkDegen(res) {
    var query = res.alignment.query.toUpperCase();
    var subject = res.alignment.subject.toUpperCase();
    var curr = null;
    var comp = null;
    for (var i = 0; i < query.length; i++) {
      curr = query.charAt(i);
      if (curr == 'A' || curr == 'C' || curr == 'G' || curr == 'T') continue;
      comp = subject.charAt(i);
      if ((curr == 'W' && (comp == 'A' || comp == 'T')) ||
          (curr == 'S' && (comp == 'C' || comp == 'G')) ||
          (curr == 'M' && (comp == 'A' || comp == 'C')) ||
          (curr == 'K' && (comp == 'G' || comp == 'T')) ||
          (curr == 'R' && (comp == 'A' || comp == 'G')) ||
          (curr == 'Y' && (comp == 'C' || comp == 'T')) ||
          (curr == 'B' && (comp == 'C' || comp == 'G' || comp == 'T')) ||
          (curr == 'D' && (comp == 'A' || comp == 'G' || comp == 'T')) ||
          (curr == 'H' && (comp == 'A' || comp == 'C' || comp == 'T')) ||
          (curr == 'V' && (comp == 'A' || comp == 'C' || comp == 'G')) ||
          (curr == 'N' && (comp == 'A' || comp == 'C' || comp == 'G' || comp == 'T'))) {
        var orig = res.alignment.match;
        var orig_match = orig.charAt(i);
        if (orig_match !== '|') {
          res.alignment.match = orig.substr(0, i) + '|' + orig.substr(i+1);
          res.identities++;
        }
      }
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
    params['blastonly'] = 1;
    params['identity_threshold'] = $scope.query.identity_threshold;
    params['feature_threshold'] = $scope.query.feature_threshold;
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
      alert('Cannot blast, blast server did not like your query');
    });
  };
}
