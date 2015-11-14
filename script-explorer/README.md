# script-explorer

Provides a webinterface to explore movie scripts using spark.

## Quickstart

You neet to have Maven and Java 8 installed.

```
$ mvn package
$ java -jar target/wcm-prak-standalone.jar
```

Use your browser to open http://localhost:4567/.

## Development

If you want to use the TheMovieDB API, you have to manually add
an API-key to the source of RestAPI.java for now.
