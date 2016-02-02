# script-explorer

Provides a webinterface to explore movie scripts using spark.

## Quickstart

You neet to have Maven and Java 8 installed.

```
$ mvn package
$ java -jar target/wcm-prak-standalone.jar
```

Parameter Options:
```
-m (alias: --movieDir) Path to folder contains parsed pdf script in json format.
-a (alias: --apiKey) The API Key to access tmdb via api.
```

```
Attention: The json files have to match one of the entries in
movieNames.json file ("src/main/resources/public/res").
```
Use your browser to open http://localhost:4567/.
