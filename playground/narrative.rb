require 'nokogiri'
require 'set'
require 'json'

$script = Nokogiri::XML(File.open(ARGV[0]))

def normalize_name(name)
  name.strip.split(/[^ \.\-A-Za-z]/)[0].strip.upcase
end

class CharDict
  attr_reader :chars

  def initialize
    @chars = {}
    @next_id = 0
  end

  def [](name)
    if @chars[name].nil?
      @chars[name] = @next_id
      @next_id += 1
    end
    @chars[name]
  end
end

$locations = $script.xpath("/scene/script/location")
def most_frequent_chars(num_chars = 5)
  frequent = {}
  $locations.xpath("//@speaker").map(&:text).select { |s| s.strip != "" }.each do |s|
    speaker = normalize_name(s)
    frequent[speaker] = (frequent[speaker] || 0) + 1
  end
  frequent = frequent
             .sort_by { |speaker, occurrences| occurrences }
             .map { |e| e[0] }
             .reverse
             .take(num_chars)
  Set.new(frequent)
end
too_many = 5
frequent = most_frequent_chars

chars = CharDict.new

pos = 0
scenes = $script.xpath('/script/scene/location').map do |loc|
  scene = {
    duration: 2,
    start: pos,
    chars: Set.new(loc.xpath(".//@speaker")
      .map(&:text)
      .select { |n| n.strip != "" }
      .map { |n| chars[normalize_name(n)] }).to_a.sort,
    id: pos
  }

  cs = scene[:chars]
  if cs.length > too_many
    cs = cs.select { |c| frequent.include? c }
  end
  cs = Set.new(cs).to_a.sort

  pos += scene[:duration]
  if cs.size > 0
    scene[:chars] = cs
    scene
  else
    nil
  end
end

scenes = scenes.compact

File.write "#{ARGV[0]}.chars.json", JSON.pretty_generate(chars.chars)
File.write "#{ARGV[0]}.narrative.json", JSON.pretty_generate({panels: scenes.length, scenes: scenes})
