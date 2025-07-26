export default {
  expo: {
    name: "mybrief",
    slug: "mybrief-app",
    platforms: ["ios", "android"],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
    // Add other config as needed
  }
}; 