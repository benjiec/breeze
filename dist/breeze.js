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

function BreezeController($scope, $http, $routeParams) {
  $scope.query = { sequence: null, db: null, input: 'dna',
                   identity_threshold: 0.5, feature_threshold: 0.0 };
  $scope.submitted = false;
  $scope.databases = window.BreezeConfig._databases;
  $scope.result_query = null;
  $scope.results = null;
  $scope.controls = {to_show: null };

  if ($routeParams.query) { $scope.query.sequence = $routeParams.query; }

  function processResults(fetch_obj_f, results) {
    var data = {};

    if (results.length === 0) {
      $scope.results = [];
      return;
    }

    _.each(results, function(res) {
      res.accession = res.label;

      checkDegen(res);
      var d = {
        res: res,
        alignment: BreezeAlignment(res.query_start, res.query_end, res.subject_start, res.subject_end,
                                   res.alignment.query, res.alignment.match, res.alignment.subject),
        percent_identities: res.identities*100/res.alignment.match.length,
        identical_matches: null,
        obj: null,

        // for sorting
        query_start: res.query_start,
        evalue: res.evalue
      };
      data[res.accession] = d;
    });

    if (fetch_obj_f !== undefined && _.keys(data).length > 0) {
      var accessions = _.keys(data);
      fetch_obj_f($http, accessions, function(objs) {
        // expects a hash mapping accession to object. each object has name,
        // link, children attributes. children should contain list of
        // ids matching same format as res.accession.
        _.map(_.keys(objs), function(k) { data[k].obj = objs[k]; });
        
        for (var key in data) {
          if (data.hasOwnProperty(key)) collapseChildren(key);
        }
        
        var r = _.map(_.keys(data), function(k) { return data[k]; });
        r.sort(function(x, y) {
          if (x.res.evalue !== y.res.evalue) {
            return x.res.evalue > y.res.evalue ? 1 : -1;
          }
          return x.percent_identities > y.percent_identities ? -1 : 1;
        });
        _.each(r, function(x, i) { x.default_sort_index = i; });

        // this will trigger rendering
        $scope.results = r;
        $scope.overlay_order = 'default_sort_index';
      });
    }

    function collapseChildren(acc) {
      if (data[acc].obj == null) return;
      var match = data[acc].res.alignment.match.toLowerCase();
      var subject = data[acc].res.alignment.subject.toLowerCase();
      var query_start = data[acc].res.query_start;
      var query_end = data[acc].res.query_end;
      var children = data[acc].obj.children;
      var identical_matches = [];
      var child_subject = null;
      var child_match = null;
      var child_query_start = null;
      var child_query_end = null;

      for (var i = 0; i < children.length; i++) {
        if (!data.hasOwnProperty(children[i])) continue;
        child_match = data[children[i]].res.alignment.match.toLowerCase();
        child_subject = data[children[i]].res.alignment.subject.toLowerCase();
        child_query_start = data[children[i]].res.query_start;
        child_query_end = data[children[i]].res.query_end;

        if (subject === child_subject && match === child_match &&
            query_start === child_query_start && query_end === child_query_end) {
          collapseChildren(children[i]);
          identical_matches[identical_matches.length] = data[children[i]];
          delete data[children[i]];
        }
      }
      data[acc].identical_matches = identical_matches;
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
    if ($scope.query.sequence) { $scope.query.sequence.trim(); }

    if (!$scope.query.sequence || $scope.query.sequence === '' || !$scope.query.db || !$scope.query.input) {
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
    $scope.result_query = $scope.query.sequence;
    $scope.results = null;
    $scope.flat_results = null;
    $scope.controls.to_show = null;
    $scope.overlay_order = null;

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

  $scope.showSummary = function(n, tab) {
    jQuery("#summary-tabs .nav-tabs li:eq("+n+") a").tab('show');
    jQuery("#summary-tabs .tab-pane").removeClass('active');
    jQuery("#summary-tabs #"+tab).addClass('active');
  };
}

var app = angular.module('breeze', ['ngRoute', 'ngSanitize'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/',
            { template: JST['breeze'], controller: BreezeController})
      .when('/q/:query',
            { template: JST['breeze'], controller: BreezeController})
      .otherwise({redirectTo: '/'});
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

window.BreezeAlignment = function(query_start, query_end, subject_start, subject_end, query, match, subject) {
  var mismatch_char = 'X';

  function getMisMatch(match_str) {
    var both = match_str.replace(/ /g, mismatch_char);
    return both.replace(/\|/g, " ");
  }

  var mismatch = getMisMatch(match);

  function wrapped_html(rowlen) {
    if (!/\S/.test(mismatch)) { return 'No mismatch in alignment'; }

    if (rowlen === undefined) { rowlen = 80; }

    var rsplit = new RegExp('(.{1,'+rowlen+'})', 'g');
    var query_rows = query.match(rsplit);
    var mismatch_rows = mismatch.match(rsplit);
    var subject_rows = subject.match(rsplit);

    var s = [];
    s.push('<table class="sequence alignment">');

    for (var i=0; i<query_rows.length; i++) {
      var query_row = [];
      var subject_row = [];

      for (var j=0; j<mismatch_rows[i].length; j++) {
        if (mismatch_rows[i][j] === mismatch_char) {
          query_row.push('<span class="bp-mismatch">'+query_rows[i][j]+'</span>');
          subject_row.push('<span class="bp-mismatch">'+subject_rows[i][j]+'</span>');
        }
        else {
          query_row.push(query_rows[i][j]);
          subject_row.push(subject_rows[i][j]);
        }
      }

      query_row = query_row.join('');
      subject_row = subject_row.join('');

      var tr = '<tr><td class="alignment-pos alignment-pos-left">';
      if (i == 0) { tr += ''+query_start+'<br/>'+subject_start; }
      tr += '</td><td>'+query_row+'<br/>'+subject_row+'</td><td class="alignment-pos alignment-pos-right">';
      if (i == query_rows.length-1) { tr += ''+query_end+'<br/>'+subject_end; }
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
