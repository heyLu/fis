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

puts JSON.dump characters.sort
puts JSON.dump matrix
