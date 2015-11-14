package RestAPI;
import static spark.Spark.*;
import com.google.gson.Gson;
import com.uwetrottmann.tmdb.Tmdb;
import requestTMDB.GetMovieData;

/**
 * This class provide provide REST-API to get additional data for a specific movie 
 * from TMDB.
 *
 * @author Immanuel Plath
 * @version 1.0
 */
public class RestAPI {
    
    public static void main(String[] args) {
        // Init Rsponse
        // ============
        // Init needed objects, GSON + TMDB Wrapper
        Gson gson = new Gson();
        Tmdb tmdb = new Tmdb();
        // Please don't forget to set api key
        tmdb.setApiKey("");
        // load static files from public folder
        staticFileLocation("/public");
        
        // Test Movie ID --> Avatar --> 19995
        
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
        
        // Home dir, deliver root website
        get("/", (request, response) -> "root");
        
        // Filter catch root request a redirect to index html file
        before("/", (request, response) -> {
            response.redirect("index.html");
        });
    }

}
