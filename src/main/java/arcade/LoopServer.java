package arcade;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
/** Local preview server. Only explicitly listed public assets are served. */
public final class LoopServer {
 public static void main(String[] args) throws Exception {
  int port = args.length == 0 ? 8080 : Integer.parseInt(args[0]);
  var server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
  var assets=Map.of("/", "index.html", "/index.html","index.html", "/app.js","app.js", "/styles.css","styles.css");
  server.createContext("/", exchange -> {
   try {
    if (!exchange.getRequestMethod().equals("GET") && !exchange.getRequestMethod().equals("HEAD")) { exchange.getResponseHeaders().set("Allow","GET, HEAD"); exchange.sendResponseHeaders(405,-1); return; }
    String path=exchange.getRequestURI().getPath();
    if(path.equals("/api/health")){byte[] data="{\"status\":\"ok\"}".getBytes(StandardCharsets.UTF_8);exchange.getResponseHeaders().set("Content-Type","application/json");exchange.sendResponseHeaders(200,exchange.getRequestMethod().equals("HEAD")?-1:data.length);if(exchange.getRequestMethod().equals("GET"))exchange.getResponseBody().write(data);return;}
    String name=assets.get(path);
    if(name==null){exchange.sendResponseHeaders(404,-1);return;}
    try(var input=LoopServer.class.getResourceAsStream("/static/"+name)){
     if(input==null){exchange.sendResponseHeaders(404,-1);return;}
     byte[] data=input.readAllBytes();
     exchange.getResponseHeaders().set("Content-Type",name.endsWith(".js")?"text/javascript; charset=utf-8":name.endsWith(".css")?"text/css; charset=utf-8":"text/html; charset=utf-8");
     exchange.getResponseHeaders().set("X-Content-Type-Options","nosniff");
     exchange.getResponseHeaders().set("Cache-Control","no-cache");
     exchange.sendResponseHeaders(200,exchange.getRequestMethod().equals("HEAD")?-1:data.length);
     if(exchange.getRequestMethod().equals("GET"))exchange.getResponseBody().write(data);
    }
   } finally {exchange.close();}
  });
  Runtime.getRuntime().addShutdownHook(new Thread(()->server.stop(0)));
  server.start(); System.out.println("Loop arcade: http://localhost:"+port);
 }
}
