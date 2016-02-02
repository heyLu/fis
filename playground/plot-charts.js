"use strict";

function script_to_narrative(script, options) {
  var options = options || {};
  var too_many = options.too_many || 5;

  var char_ids = {};
  var next_id = 0;
  var char_to_id = function(name) {
    if (char_ids[name] == null) {
      char_ids[name] = next_id;
      next_id += 1;
    }
    return char_ids[name];
  };

  var locations = get_locations(script);
  var frequent = options.characters || most_frequent_characters(locations);

  var pos = 0;
  var scenes = [];
  locations.forEach(function(loc) {
    var scene = {
      duration: 2,
      start: pos,
      chars: [...new Set(get_characters(loc))]
        .map(char_to_id).sort()
    };

    if (scene.chars.length > too_many) {
      scene.chars = scene.chars.filter(function(c) {
        return frequent.has(c);
      });
    }
    scene.chars = [...new Set(scene.chars).keys()].sort();
    pos += 1

    if (scene.chars.length > 0) {
      scenes.push(scene);
    }
  });

  return {
    narrative: scenes,
    chars: char_ids,
  }
}

function get_json(url, cb) {
  var xhr = new XMLHttpRequest()
  xhr.open("GET", url)
  xhr.send()
  xhr.onload = function() { cb(JSON.parse(xhr.responseText)); };
  return xhr;
}

function get_locations(script) {
  return script.reduce(function(locations, scene) {
    return locations.concat(scene);
  });
}

function most_frequent_characters(locations, num_chars) {
  var num_chars = num_chars || 5;
  var occurrences = {};
  locations.forEach(function(loc) {
    loc.parts
      .filter(is_dialog)
      .forEach(function(dialog) {
        var speaker = normalize_name(dialog.character);
        occurrences[speaker] = (occurrences[speaker] || 0) + 1
      });
  });
  var frequent = Object.keys(occurrences)
      .sort(function(a, b) {
        return occurrences[a] - occurrences[b]
      })
      .reverse()
      .splice(0, num_chars);
  return new Set(frequent);
}

function is_dialog(part) {
  return part.dialog != null;
}

function with_characters(chars, locations) {
  return locations.map(function(loc) {
    return loc.parts
      .filter(function(part) {
        return part.dialog != null
          && chars.has(normalize_name(part.character))
      })
  })
    .filter(function(loc) { return loc.length != 0; });
}

function get_characters(loc) {
  return loc.parts
    .filter(function(part) {
      return part.dialog != null && part.character.trim() != ""
    })
    .map(function(part) {
      return normalize_name(part.character)
    });
}

function normalize_name(name) {
  return name.trim().split(/[^ \.\-A-Za-z]/)[0].trim().toUpperCase();
}

function is_dialog(part) {
  return part.dialog != null;
}

function draw_plot_chart(name, safe_name, prefix, tie_breaker, center_sort, collapse) {
  var folder = prefix.name;
  
  (function(j) {
    var margin = {top: 20, right: 25, bottom: 20, left: 1};
    var width = raw_chart_width - margin.left - margin.right;

    var jscenes = j; //j['scenes'];
    // This calculation is only relevant for equal_scenes = true
    var scene_width = (width-longest_name)/(jscenes.length+1);

    var total_panels = 0;
    var scenes = []
    for (var i = 0; i < jscenes.length; i++) {
      var duration = parseInt(jscenes[i]['duration']);
      var start;
      if (equal_scenes) {
	start = i*scene_width + longest_name;
      } else {
	start = parseInt(jscenes[i]['start']);
      }
      var chars = jscenes[i]['chars'];
      //if (chars.length == 0) continue;
      scenes[scenes.length] = new SceneNode(jscenes[i]['chars'], 
					    start, duration, 
					    parseInt(jscenes[i]['id']));
      scenes[scenes.length-1].comic_name = safe_name;
      total_panels += duration;
    } // for

    scenes.sort(function(a, b) { return a.start - b.start; });
    total_panels -= scenes[scenes.length-1].duration;
    scenes[scenes.length-1].duration = 0;


    // Make space at the leftmost end of the chart for character names
    //var total_panels = parseInt(j['panels']);
    var panel_width = Math.min((width-longest_name)/total_panels, 15);
    var panel_shift = Math.round(longest_name/panel_width);
    total_panels += panel_shift;
    panel_width = Math.min(width/total_panels, 15);

    (function(x) {
      var i = 0;
      var xchars = Object.keys(x).map(function(c) {
        return {
          name: c,
          id: x[c],
          group: 1 //i++
        }
      });

      // Calculate chart height based on the number of characters
      // TODO: Redo this calculation
      //var raw_chart_height = xchars.length*(link_width + link_gap + group_gap);// - (link_gap + group_gap);
      var raw_chart_height = 360;
      var height = raw_chart_height - margin.top - margin.bottom;

      var svg = d3.select("#chart").append("svg")
	  .attr("width", width + margin.left + margin.right)
	  .attr("height", height + margin.top + margin.bottom)
          .attr("class", "chart")
          .attr("id", safe_name)
	  .append("g")
	  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


      var chars = [];
      var char_map = []; // maps id to pointer
      for (var i = 0; i < xchars.length; i++) {
	chars[chars.length] = new Character_(xchars[i].name, xchars[i].id, xchars[i].group);
	char_map[xchars[i].id] = chars[chars.length-1];
      }

      var groups = define_groups(chars);
      find_median_groups(groups, scenes, chars, char_map, tie_breaker);
      groups = sort_groups_main(groups, center_sort);

      var links = generate_links(chars, scenes);
      var char_scenes = add_char_scenes(chars, scenes, links, groups, panel_shift, safe_name);


      // Determine the position of each character in each group
      // (if it ever appears in the scenes that appear in that
      // group)
      groups.forEach(function(g) {
	g.all_chars.sort(function(a, b) {
	  return a.group_ptr.order - b.group_ptr.order;
	});
	var y = g.min;
	for (var i = 0; i < g.all_chars.length; i++) {
	  g.all_chars[i].group_positions[g.id] = y + i*(text_height);
	}
      });
      
      
      calculate_node_positions(chars, scenes, total_panels, 
			       width, height, char_scenes, groups, panel_width, 
			       panel_shift, char_map);

      
      scenes.forEach(function(s) {
	if (!s.char_node) {
	  var first_scenes = [];
	  //ys = [];
	  s.in_links.forEach(function(l) {
	    if (l.from.char_node) {
	      first_scenes[first_scenes.length] = l.from;
	      //ys[ys.length] = l.y1;
	      //console.log(l.y1);
	    }
	  });
	  /*
	    if (first_scenes.length == 1) {
	    first_scenes[0].y = s.y + s.height/2.0;
	    console.log(first_scenes[0].y);
	    } else {
	  */
	  for (var i = 0; i < first_scenes.length; i++) {
	    first_scenes[i].y = s.y + s.height/2.0 + i*text_height;
	  }
	  //}
	}    
      });

      // Determining the y-positions of the names (i.e. the char scenes)
      // if the appear at the beginning of the chart
      char_scenes.forEach(function(cs) {
	
	var character = char_map[cs.chars[0]];
	if (character.first_scene.x < per_width*width) {
	  // The median group of the first scene in which the character appears
	  // We want the character's name to appear in that group
	  var first_group = character.first_scene.median_group;
	  cs.y = character.group_positions[first_group.id];
	}
      });

      calculate_link_positions(scenes, chars, groups, char_map);

      height = groups[groups.length-1].max + group_gap*5;
      raw_chart_height = height + margin.top + margin.bottom;
      d3.select('svg#' + safe_name).style("height", raw_chart_height);

      draw_links(links, svg);
      draw_nodes(scenes, svg, width, height, folder, raw_chart_height, safe_name);
    })(prefix.chars); // d3.xml (read chars)
  })(prefix.narrative); // d3.json (read scenes)
}

function PlotChart(selector, id, url, options) {
  var chart = {
    script: null,
    narrative: null
  };

  get_json(url, function(s) {
    chart.script = s;
    chart.narrative = script_to_narrative(chart.script, options);

    draw_plot_chart(selector, id, chart.narrative, true, false, false);
  });

  chart.redraw = function(options) {
    chart.narrative = script_to_narrative(chart.script, options);

    document.querySelector("#chart svg").remove();
    draw_plot_chart(selector, id, chart.narrative, true, false, false);
  };

  return chart;
}
