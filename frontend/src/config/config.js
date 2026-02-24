const config = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "RestoSmart",
  // Backend base URL. If env is not set, derive from the current host so it works for:
  // - PC:    frontend http://localhost:3000  -> backend http://localhost:5000
  // - Phone: frontend http://192.168.x.x:3000 -> backend http://192.168.x.x:5000
  apiUrl:
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined"
      ? `http://${window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname}:5000`
      : "http://127.0.0.1:5000"),
};

export default config;
