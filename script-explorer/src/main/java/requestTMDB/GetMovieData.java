package requestTMDB;
import com.uwetrottmann.tmdb.Tmdb;
import com.uwetrottmann.tmdb.entities.Credits;
import com.uwetrottmann.tmdb.entities.Images;
import com.uwetrottmann.tmdb.entities.Movie;
import com.uwetrottmann.tmdb.entities.Videos;
import com.uwetrottmann.tmdb.services.MoviesService;

/**
 * This class provide possibility to get additional data for a specific movie 
 * from TMDB.
 *
 * @author Immanuel Plath
 * @version 1.0
 */
public class GetMovieData {
    
    protected Tmdb db;
    protected MoviesService movieService = null;
    
    /**
     * Constructor set Tmdb object which is required to request TMDB
     *
     * @param Tmdb TMDB Object
     */
    public GetMovieData(Tmdb connection){
        this.db = connection;
    }
    
    /**
     * This function returns a movie object which contain data about a specific movie like title, genres, budget, ...
     *
     * @param tmdbID ID of the movie you want to get additional data
     * @return Movie object contains all general data about the movie like title, genres, ...
     */
    public Movie getGeneralData(int tmdbID){
        if(movieService == null){
            this.movieService = db.moviesService();
        }
        Movie movie = movieService.summary(tmdbID, "en", null);
        return movie;
    }
    
    /**
     * This function returns a video object which contain trailer and clips.
     *
     * @param tmdbID ID of the movie you want to get additional data
     * @return Video object contains all general data about the movie like title, genres, ...
     */
    public Videos getTrailers(int tmdbID){
        if(movieService == null){
            this.movieService = db.moviesService();
        }
        Videos video = movieService.videos(tmdbID, "en");
        return video;
    }
    
    /**
     * This function returns a image object which contain backdrops, posters and stills.
     *
     * @param tmdbID ID of the movie you want to get additional data
     * @return Image object contains backdrops, posters and still
     */
    public Images getImages(int tmdbID){
        if(movieService == null){
            this.movieService = db.moviesService();
        }
        Images images = movieService.images(tmdbID, "en");
        return images;
    }
    
    /**
     * This function returns a image object which contain backdrops, posters and stills.
     *
     * @param tmdbID ID of the movie you want to get additional data
     * @return Image object contains backdrops, posters and still
     */
    public Credits getCredits(int tmdbID){
        if(movieService == null){
            this.movieService = db.moviesService();
        }
        Credits credits = movieService.credits(tmdbID);
        return credits;
    }
}