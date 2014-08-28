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
