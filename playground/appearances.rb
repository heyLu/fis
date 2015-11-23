#!/usr/bin/env ruby

require 'set'
require 'json'

if ARGV.length == 0
  puts "Usage: #$0 <script.txt>"
  exit 1
end

lines = File.open(ARGV[0]).each_line.to_a

# returns a set of characters that have dialog in the given lines
def characters_from(lines)
  Set.new(lines.find_all {|l| l.index(/[^ ]/) == 20}.map {|name| name.strip.split(/[^ \.\-A-Za-z]/)[0].strip.upcase })
end

characters = characters_from(lines)

scenes = lines.reduce [] do |acc, l|
  if l.start_with? '-- scene:'
    acc.push({title: l, lines: []})
  else
    acc[-1][:lines].push(l)
    acc
  end
end

#puts "#{characters.length} characters"
#puts "#{scenes.length} scenes"

appearances = scenes.map do |scene|
  {title: scene[:title],
   characters: characters_from(scene[:lines])}
end

#puts "\n" + "-" * 80 + "\n"

# count how often each character appears together with others
# in a scene.
# the output should be a square matrix matching characters with
# characters they appear with.
amounts = {}
appearances.each do |appearance|
  appearance[:characters].each do |ch1|
    appearance[:characters].each do |ch2|
      amounts[ch1] ||= {}
      amounts[ch1][ch2] ||= 0
      amounts[ch1][ch2] += 1
    end
  end
end
#p amounts

matrix = []
i = 0
characters.sort.each do |ch1|
  j = 0
  characters.sort.each do |ch2|
    matrix[i] ||= [0] * characters.size
    matrix[i][j] = amounts[ch1][ch2] || 0
    j += 1
  end
  i += 1
end

puts <<EOF
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Toy Story 3!</title>
    <style>
      body {
        font: 10px sans-serif;
      }

      .chord path {
        fill-opacity: .67;
        stroke: #000;
        stroke-width: .5px;
      }
    </style>
  </head>

  <body>
    <script src="https://d3js.org/d3.v3.min.js"></script>
    <script>
      var characters = #{JSON.dump characters.sort};
      var appearances = #{JSON.dump matrix};

      var chord = d3.layout.chord()
        .padding(.05)
        .sortSubgroups(d3.descending)
        .matrix(appearances);

      var width = 1080,
          height = 720,
          innerRadius = Math.min(width, height) * .41,
          outerRadius = innerRadius * 1.05;

      var fill = d3.scale.linear()
        .domain([0, 75])
        .range(["#000000", "#ffffff"]);

      var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

      svg.append("g").selectAll("path")
          .data(chord.groups)
        .enter().append("path")
          .style("fill", function(d) { return fill(d.index); })
          .style("stroke", function(d) { return fill(d.index); })
          .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
          .on("mouseover", fade(.1))
          .on("mouseout", fade(1));

      var ticks = svg.append("g").selectAll("g")
          .data(chord.groups)
        .enter().append("g").selectAll("g")
          .data(groupTicks)
        .enter().append("g")
          .attr("transform", function(d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
              + "translate(" + outerRadius + ",0)";
          });

      ticks.append("text")
        .attr("x", 8)
        .attr("dy", ".35em")
        .attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180)translate(-16)" : null; })
        .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
        .text(function(d) { return d.label; });

      svg.append("g")
          .attr("class", "chord")
        .selectAll("path")
          .data(chord.chords)
        .enter().append("path")
          .attr("d", d3.svg.chord().radius(innerRadius))
          .style("fill", function(d) { return fill(d.target.index); })
          .style("opacity", 1);

      // Returns an array of tick angles and labels, given a group.
      function groupTicks(d) {
        var k = (d.endAngle - d.startAngle) / d.value;
        return d3.range(0, d.value, 1000).map(function(v, i) {
          return {
            angle: v * k + d.startAngle,
            label: characters[d.index],
          };
        });
      }

      // Returns an event handler for fading a given chord group.
      function fade(opacity) {
        return function(g, i) {
          svg.selectAll(".chord path")
            .filter(function(d) { return d.source.index != i && d.target.index != i; })
            .transition()
            .style("opacity", opacity);
        };
      }
    </script>
  </body>
</html>
EOF
