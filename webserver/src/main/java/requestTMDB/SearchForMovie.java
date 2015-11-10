package requestTMDB;

import java.util.Iterator;
import java.util.List;

import com.uwetrottmann.tmdb.Tmdb;
import com.uwetrottmann.tmdb.entities.Movie;
import com.uwetrottmann.tmdb.entities.MovieResultsPage;
import com.uwetrottmann.tmdb.services.SearchService;

/**
 * This class provide possibility to search for a specific movie 
 * in the TMDB.
 *
 * @author Immanuel Plath
 * @version 1.0
 */

public class SearchForMovie {
    
    protected Tmdb db;
    
    /**
     * Constructor set Tmdb object wich is required to request TMDB
     *
     * @param Tmdb TMDB Object
     */
    SearchForMovie(Tmdb connection){
        this.db = connection;
    }
    
    /**
     * This function .
     *
     * @param movieName Name of Movie you want to search for
     * @return List Returns a list with all found movies
     */
    public List<Movie> findMovie(String movieName) {
        System.out.println("in Function");
        
        SearchService searchService = db.searchService();
        MovieResultsPage movieReults = searchService.movie(movieName, null, "en", null, null, null, null);
        List<Movie> movieList = movieReults.results;
        Iterator<Movie> iterator = movieList.iterator();
        while(iterator.hasNext()){
            //System.out.println(iterator.next().title);
        }
        return movieList;
    }
    
}

