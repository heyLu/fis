package RestAPI;
import static spark.Spark.*;

import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.kohsuke.args4j.CmdLineException;
import org.kohsuke.args4j.CmdLineParser;
import org.kohsuke.args4j.Option;

import com.google.gson.Gson;
import com.uwetrottmann.tmdb.Tmdb;
import requestTMDB.GetMovieData;


/**
* This class configure command line arguments
*
* @author Immanuel Plath
* @version 1.0
*/
class AppArgument
{
  @Option(name = "-m", aliases = { "--movieDir" }, required = true, usage = "input dir with movie files in json format")
  public String movieFilesPath = "";
  
  @Option(name = "-a", aliases = { "--apiKey" }, required = true, usage = "api key for tmdb")
  public String apiKey = "";
}

/**
 * This class provide REST-API to get additional data for a specific movie 
 * from TMDB.
 *
 * @author Immanuel Plath
 * @version 1.0
 */
public class RestAPI {
    
    public static void main(String[] args) throws IOException {
        // check params
        AppArgument va = new AppArgument();
        CmdLineParser parser = new CmdLineParser(va);
        try {
          parser.parseArgument(args);
        } catch (CmdLineException e) {
          System.err.println("Error: " + e.getMessage());
          System.err.println("java CommandLineDemo [options...] arguments...");
          parser.printUsage(System.err);
          System.err.println();
          return;
        }
        System.out.println("Using movieDir " + Paths.get(va.movieFilesPath));
        System.out.println("Using apiKey " + va.apiKey);
        
        // Init Rsponse
        // ============
        // Init needed objects, GSON + TMDB Wrapper
        Gson gson = new Gson();
        Tmdb tmdb = new Tmdb();
        // Please don't forget to set api key
        tmdb.setApiKey(va.apiKey);
        // load static files from public folder
        staticFileLocation("/public");
        
        // Declare REST-API
        // ================
        // deliver general data to a requested movie
        get("/api/movie/:id", (request, response) -> {
            response.type("application/json");
            int movieID = 0;
            try{
                movieID = Integer.parseInt(request.params(":id"));
            } catch(NumberFormatException e) {
                halt(400, "{\"error\": \"The Movie ID have to be a number!\"}");
            }
            GetMovieData gmd = new GetMovieData(tmdb);
            return gson.toJson( gmd.getGeneralData( movieID) );
        });
        
        // deliver trailers to s specific movie
        get("/api/movie/trailer/:id", (request, response) -> {
            response.type("application/json");
            int movieID = 0;
            try{
                movieID = Integer.parseInt(request.params(":id"));
            } catch(NumberFormatException e) {
                halt(400, "{\"error\": \"The Movie ID have to be a number!\"}");
            }
            GetMovieData gmd = new GetMovieData(tmdb);
            return gson.toJson( gmd.getTrailers( movieID) );
        });
        
        // deliver images to s specific movie
        get("/api/movie/images/:id", (request, response) -> {
            response.type("application/json");
            int movieID = 0;
            try{
                movieID = Integer.parseInt(request.params(":id"));
            } catch(NumberFormatException e) {
                halt(400, "{\"error\": \"The Movie ID have to be a number!\"}");
            }
            GetMovieData gmd = new GetMovieData(tmdb);
            return gson.toJson( gmd.getImages( movieID) );
        });
        
        // deliver credits to s specific movie
        get("/api/movie/credits/:id", (request, response) -> {
            response.type("application/json");
            int movieID = 0;
            try{
                movieID = Integer.parseInt(request.params(":id"));
            } catch(NumberFormatException e) {
                halt(400, "{\"error\": \"The Movie ID have to be a number!\"}");
            }
            GetMovieData gmd = new GetMovieData(tmdb);
            return gson.toJson( gmd.getCredits( movieID) );
        });
        
        // deliver movie scripts as json
        get("/api/movie/json/:name", (request, response) -> {
            response.type("application/json");
            String destinationPath = "";
            String filename = request.params(":name");
            if(va.movieFilesPath == "(default value)"){
                destinationPath = "/public/res/";
            } else {
                destinationPath = va.movieFilesPath + "/" + filename;
            }
            System.out.println("Fullpath: "+destinationPath);
            // check if file exist
            File f = new File(destinationPath);
            if(f.exists() && !f.isDirectory()) {
                //System.out.println("Datei da!");
                return readFile(destinationPath, StandardCharsets.UTF_8);
            } else {
                //System.out.println("Datei nicht da!");
                halt(400, "{\"error\": \"File not found!\"}");
                return "";
            }
        });
        
        // Home dir, deliver root website
        get("/", (request, response) -> "root");
        
        // Filter catch root request a redirect to index html file
        before("/", (request, response) -> {
            response.redirect("index.html");
        });
    }
    
    static String readFile(String path, Charset encoding) throws IOException {
        byte[] encoded = Files.readAllBytes(Paths.get(path));
        return new String(encoded, encoding);
    }

}
