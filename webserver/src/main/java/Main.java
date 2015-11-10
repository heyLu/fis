import static spark.Spark.*;

public class Main {

    public static void main(String[] args) {
        // TODO Auto-generated method stub
        
        // Hello World
        get("/hello", (req, res) -> "Hello World");
    }

}