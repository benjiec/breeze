window.BreezeAlignment = function(query_start, query_end, subject_start, subject_end, query, match, subject) {
  function wrapped_html(rowlen) {
    if (rowlen === undefined) { rowlen = 80; }

    var rsplit = new RegExp('(.{1,'+rowlen+'})', 'g');
    var query_rows = query.match(rsplit);
    var match_rows = match.match(rsplit);
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
      // match
      var tr = '<tr class="alignment-match"><td class="alignment-pos alignment-pos-left">';
      tr += '</td><td>'+query_rows[i]+'</td><td class="alignment-pos alignment-pos-right">';
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
    subject: subject.slice(0)
  };
};
