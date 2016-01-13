require 'nokogiri'

def normalize_name(name)
  name.strip.split(/[^ \.\-A-Za-z]/)[0].strip.upcase
end

class Variants
  def initialize
    @doc = Nokogiri::XML(File.open('toy-story-3.xml'))
    @locations = @doc.xpath('/script/scene/location')
  end

  def all
    @locations.each do |loc|
      chars = loc.xpath('.//@speaker')
              .map(&:text)
              .select { |n| n.strip != "" }
              .map { |n| normalize_name(n) }
      chars = Set.new(chars).to_a.sort
      puts "#{loc['name']} -- #{chars}"
    end
  end


  def selected(interesting)
    @locations.each do |loc|
      chars = loc.xpath('.//@speaker')
              .map(&:text)
              .select { |n| n.strip != "" }
              .map { |n| normalize_name(n) }
              .select { |n| interesting.include? n }
      chars = Set.new(chars).to_a.sort
      if chars.size > 0
        puts "#{loc['name']} -- #{chars}"
      end
    end
  end

  def most_frequent_chars(num_chars = 5)
    frequent = {}
    @locations.xpath("//@speaker").map(&:text).select { |s| s.strip != "" }.each do |s|
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

  def most_frequent
    selected(most_frequent_chars)
  end

  def drop_unimportant(too_many = 5)
    # if too many characters in scene, drop the ones that appear less frequently
    # but always keep the frequent ones
    
    frequent = most_frequent_chars
    @locations.each do |loc|
      chars = loc.xpath('.//@speaker')
              .map(&:text)
              .select { |n| n.strip != "" }
              .map { |n| normalize_name(n) }
      if chars.length > too_many
        chars = chars.select { |c| frequent.include? c }
      end
      chars = Set.new(chars).to_a.sort
      if chars.size > 0
        puts "#{loc['name']} -- #{chars}"
      end
    end
  end
end

variants = Variants.new

#variants.all

#variants.selected Set.new(["ANDY", "WOODY", "BUZZ", "MOM", "BONNIE"])

#variants.most_frequent

p variants.most_frequent_chars.to_a.sort
variants.drop_unimportant
