# script-explorer

Provides a web interface to explore movie scripts using spark and angular.

## Quickstart

You need to have Maven and Java 8 installed.

```
$ mvn package
$ java -jar target/wcm-prak-standalone.jar -m <script-folder> -a <api-key>
```

Use your browser to open [http://localhost:4567](http://localhost:4567).

### Command line options:

```
-m (alias: --movieDir) Folder containing scripts in json format.
-a (alias: --apiKey) The API Key to access tmdb via api.
```

**Warning**: The names of the json files currently have to match the ones
in the movieNames.json file ("src/main/resources/public/res").

### Flow graph interface

There is currently no html interface for the flow graph, however you can
use the JavaScript console of your browser to draw the graph with specific
options:

```js
// draw with default options
p.redraw();

// only 10 most-frequent characters
p.redraw({fixed_characters: true, num_frequent: 10});

// only specified characters
p.redraw({fixed_characters: true, characters: new Set(["ANDY", "BUZZ", "MOM", "BONNIE"])});

// allow up to 4 characters per scene
p.redraw({too_many: 4});

// sort characters into groups (default group: 1)
p.redraw({fixed_characters: true, num_frequent: 13, groups: {"ANDY": 3, "MOLLY": 3, "MOM": 4, "BONNIE": 4, "WOODY": 2, "BARBIE": 5, "KEN": 5, "BUZZ": 2, "JESSIE": 6}});
```
