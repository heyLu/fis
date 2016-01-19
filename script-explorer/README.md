# script-explorer

Provides a webinterface to explore movie scripts using spark.

## Quickstart

You neet to have Maven and Java 8 installed.

```
$ mvn package
$ java -jar target/wcm-prak-standalone.jar
```

Deploy movie scripts in "src/main/resources/public/res" as json file (use script-extractor for that)
```
The names of the json files in that folder have to match one of the entries in movieNames.json file ("src/main/resources/public/res"). 
For example like "Avatar (2009).json", "The Social Network (2010)" or "Toy Story 3 (2010).json".
```
Use your browser to open http://localhost:4567/.

## Development

If you want to use the TheMovieDB API, you have to manually add
an API-key to the source of RestAPI.java for now.
