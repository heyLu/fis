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
