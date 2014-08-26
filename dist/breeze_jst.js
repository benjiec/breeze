window.JST = window.JST || {};
var template = function(str){var fn = new Function('obj', 'var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push(\''+str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/<%=([\s\S]+?)%>/g,function(match,code){return "',"+code.replace(/\\'/g, "'")+",'";}).replace(/<%([\s\S]+?)%>/g,function(match,code){return "');"+code.replace(/\\'/g, "'").replace(/[\r\n\t]/g,' ')+"__p.push('";}).replace(/\r/g,'\\r').replace(/\n/g,'\\n').replace(/\t/g,'\\t')+"');}return __p.join('');");return fn;};
window.JST['breeze'] = template('<form>\n  <div class="form-inline">\n    <textarea id="query" class="sequence" ng-model="query.sequence"></textarea>\n    <button class="btn btn-primary" ng-click="makeQuery()">Blast</button>\n  </div>\n  <div class="form-inline">\n    Databases:\n    <span ng-repeat="(db, url) in databases">\n      <input type="radio" name="database" ng-model="query.db" value="{{ db }}" /> {{ db }}\n    </span>\n  </div>\n  <div class="form-inline">\n    Input:\n      <input type="radio" name="type" ng-model="query.input" value="dna" ng-checked="query.input === \'dna\'" /> DNA\n      <input type="radio" name="type" ng-model="query.input" value="protein" /> Protein\n    &nbsp;\n    &nbsp;\n    &nbsp;\n    <a href="javascript:void(0);" title="Minimum hits to alignment length ratio">Identity min:</a>\n      <input type="number" step="any" ng-model="query.identity_threshold" size="3" />\n    <a href="javascript:void(0);" title="Minimum alignment to subject length ratio">Feature ratio:</a>\n      <input type="number" step="any" ng-model="query.feature_threshold" size="3" />\n  </div>\n</form>\n\n<div id="results">\n  <partial template="results"></partial>\n</div>\n');
window.JST['results'] = template('<p ng-if="submitted === true && results === null">\n  Searching ...\n</p>\n\n<div ng-if="results !== null">\n\n<div class="pull-left" id="results-list">\n  <p>\n    {{ results.length }} matches from your search.\n  </p>\n\n  <div ng-repeat="result in results">\n    <p> <a name="#result-{{$index}}">{{ result.res.accession }}:</a>\n        <span ng-if="result.obj">\n          ({{ result.obj.length }} bps).\n        </span>\n        e-value: {{ result.res.evalue }}.\n        identities: {{ result.res.identities }}/{{ result.res.alignment.match.length }}.\n        <br/>\n        <a href="{{ result.obj.url }}">{{ result.obj.name }}</a>\n    </p>\n\n    <div class="alignment-container" ng-bind-html="result.alignment.wrapped_html()"></div>\n  </div>\n\n</div>\n\n<div class="pull-left" id="results-summary">\n  <ul>\n    <li ng-repeat="result in results">\n      <a href="{{ result.obj.url }}">{{ result.res.accession }}</a>\n      e: {{ result.res.evalue }}.\n      i: {{ result.res.identities }}/{{ result.res.alignment.match.length }}.\n      {{ result.obj.name.length <= 20 ? result.obj.name : result.obj.name.substr(0, 20)+\'...\' }}.\n    </li>\n  </ul>\n</div>\n\n</div>\n\n');
