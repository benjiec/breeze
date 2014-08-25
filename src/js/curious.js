// Curious client-side JSON parsing, in case you are getting object information using Curious.
//

var CuriousClient = (function() {
  function CuriousObject(hash_data, url) {
    this.id = hash_data.id;
    for (var k in hash_data) {
      this[k] = hash_data[k];
    }
    this.__url = url;
  }

  function parseCuriousObjects(data) {
    if (data.objects === undefined) { return []; }
    var objects = [];
    for (var i=0; i<data.objects.length; i++) {
      var obj = data.objects[i];
      var url = data.urls[i];
      var obj_data = {};
      for (var j=0; j<data.fields.length; j++) {
        obj_data[data.fields[j]] = obj[j];
      }
      objects.push(new CuriousObject(obj_data, url));
    }
    return objects;
  }

  function parseCuriousResults(relationships, results, init_object_hash) {
    // get objects associated with each subquery. for each subquery, build a hash
    // of ID to object.
    var objects = [];
    var i = 0;

    if (init_object_hash) {
      objects.push(init_object_hash);
      i = 1;
    }

    for (; i<results.data.length; i++) {
      var result_objects = parseCuriousObjects(results.data[i]);
      var d = {};
      for (var j=0; j<result_objects.length; j++) {
        d[result_objects[j].id] = result_objects[j];
      }
      objects.push(d);
    }

    // for each subquery, add a relationship to results of next subquery, and
    // then a reverse relationship
    for (var i=1; i<results.results.length; i++) {
      var rel = relationships[i];

      var res_tups = results.results[i].objects;
      var join_idx = results.results[i].join_index;
      var join_src = objects[join_idx];
      var join_obj = objects[i];
      var rev = relationships[join_idx];

      // add empty replationship
      for (var k in join_src) { join_src[k][rel] = []; }
      for (var k in join_obj) { join_obj[k][rev] = []; }

      for (var j=0; j<res_tups.length; j++) {
        var obj_src = res_tups[j];
        var src = join_src[obj_src[1]];
        if (obj_src[0]) {
          var obj = join_obj[obj_src[0]];

          // forward relationship from query to next query
          src[rel].push(obj);
          // reverse relationship
          obj[rev].push(src);
        }
      }
    }

    return objects;
  }

  return {
    parse: parseCuriousResults
  }

}());
