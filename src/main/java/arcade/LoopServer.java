package arcade;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/** Preview server. Only explicitly listed public assets are served.
 *  Usage: LoopServer [port]   Env: HOST (default 127.0.0.1; use 0.0.0.0 to test from your phone on the same Wi-Fi). */
public final class LoopServer {
  private static final Map<String, String> ASSETS = Map.ofEntries(
    Map.entry("/", "index.html"), Map.entry("/index.html", "index.html"),
    Map.entry("/app.js", "app.js"), Map.entry("/styles.css", "styles.css"),
    Map.entry("/growth.js", "growth.js"), Map.entry("/growth.css", "growth.css"),
    Map.entry("/sw.js", "sw.js"), Map.entry("/icon.svg", "icon.svg"),
    Map.entry("/manifest.webmanifest", "manifest.webmanifest"),
    Map.entry("/privacy.html", "privacy.html"),
    Map.entry("/icon-192.png", "icon-192.png"),
    Map.entry("/icon-512.png", "icon-512.png"),
    Map.entry("/icon-maskable-512.png", "icon-maskable-512.png"),
    Map.entry("/social-preview.png", "social-preview.png"));

  private static String contentType(String name) {
    if (name.endsWith(".js")) return "text/javascript; charset=utf-8";
    if (name.endsWith(".css")) return "text/css; charset=utf-8";
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".svg")) return "image/svg+xml";
    if (name.endsWith(".webmanifest")) return "application/manifest+json";
    return "text/html; charset=utf-8";
  }

  public static void main(String[] args) throws Exception {
    int port = args.length == 0 ? 8080 : Integer.parseInt(args[0]);
    if (port < 1 || port > 65535) throw new IllegalArgumentException("Port must be between 1 and 65535");
    String host = System.getenv().getOrDefault("HOST", "127.0.0.1");
    var server = HttpServer.create(new InetSocketAddress(host, port), 0);
    server.createContext("/", exchange -> {
      try {
        String method = exchange.getRequestMethod();
        boolean head = method.equals("HEAD");
        if (!method.equals("GET") && !head) {
          exchange.getResponseHeaders().set("Allow", "GET, HEAD");
          exchange.sendResponseHeaders(405, -1);
          return;
        }
        String path = exchange.getRequestURI().getPath();
        byte[] data;
        String type;
        if (path.equals("/api/health")) {
          data = "{\"status\":\"ok\"}".getBytes(StandardCharsets.UTF_8);
          type = "application/json";
        } else {
          String name = ASSETS.get(path);
          if (name == null) { exchange.sendResponseHeaders(404, -1); return; }
          try (var input = LoopServer.class.getResourceAsStream("/static/" + name)) {
            if (input == null) { exchange.sendResponseHeaders(404, -1); return; }
            data = input.readAllBytes();
          }
          type = contentType(name);
          exchange.getResponseHeaders().set("Cache-Control", "no-cache");
        }
        exchange.getResponseHeaders().set("Content-Type", type);
        exchange.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
        exchange.sendResponseHeaders(200, head ? -1 : data.length);
        if (!head) exchange.getResponseBody().write(data);
      } finally {
        exchange.close();
      }
    });
    Runtime.getRuntime().addShutdownHook(new Thread(() -> server.stop(0)));
    server.start();
    System.out.println("Loop arcade: http://localhost:" + port);
  }
}
