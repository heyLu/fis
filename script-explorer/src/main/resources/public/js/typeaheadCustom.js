$(document).ready(function () {
var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};

var states = ['12 Years a Slave (2013)', '25th Hour (2002)', 'Alien (1979)', 'All is Lost (2013)', 'American Beauty (1999) ', 'Avatar', 
  'American Hustle (2013)', 'American Sniper (2014)', 'Amour (2012)', 'Annie Hall (1977)', 'Armageddon (1998)', 'Artist, The (2011)',
  'Attack the Block (2011)', 'Away from Her (2006)', 'Back to the Future (1985)', 'Bad Boys (1995)', 'Bad Day at Black Rock (1955)', 'Bad Lieutenant (1992)', 'Bad Santa (2003)',
  'Tootsie (1982)', 'Topiary, A (Unproduced Shane Carruth)', 'Toy Story (1995)', 'Toy Story 2 (1999)', 'Toy Story 3 (2010)', 'Traffic (2000)', 'Truman Show, The (1998)', 'Unforgiven (1992)',
  'Usual Suspects, The (1995)', 'Wadjda (2013)', 'Warriors, The (1979)', 'Watermelon Woman, The (1996)', 'We Need to Talk About Kevin (2011)', 'Where The Wild Things Are (2009)', 'Whiplash (2014)',
  'White Jazz (Unproduced Joe Carnahan)', 'White Ribbon, The (2009)', 'Wicker Man, The (1973)', 'Winters Bone (2010)', 'Witness (1985)', 'Wonder Woman (Unproduced Joss Whedon)', 'Wrestler, The (2008)'
];

$('#the-basics .typeahead').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'states',
  source: substringMatcher(states)
});
    
});