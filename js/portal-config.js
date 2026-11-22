/* ==========================================================================
   portal-config.js: the one file to edit when the portal goes live.

   mode "sample" runs on made-up clients saved only in this browser, so the
   portal can be tried with nothing set up. mode "live" talks to Supabase.

   Going live: paste the Project URL and the anon public key from Supabase
   (Project Settings > API). Both are meant to be public; the database rules
   in supabase/schema.sql decide who sees what. Never put the service_role
   key here or anywhere in this repo.
   ========================================================================== */
window.PORTAL_CONFIG = {
  mode: "live",
  supabaseUrl: "https://ynmgaxfgydcxvhmqbaon.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlubWdheGZneWRjeHZobXFiYW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzNjc0MTMsImV4cCI6MjExMDk0MzQxM30.Zo_Ge93iEJM0UXwfI6szCD8wUpRwk-qulBovYQkuX08", // public "anon" key, safe in the page
  bucket: "client-files",

  /* The steps each kind of project moves through. The studio desk picks
     one per client; clients see it as their timeline. */
  stages: {
    web:     ["Kickoff call", "Design", "Build", "Your review", "Launch"],
    shopify: ["Kickoff call", "Store setup", "Product pages", "Your review", "Launch"],
    video:   ["Plan", "Shoot day", "Edit", "Your review", "Delivery"],
    design:  ["Brief", "First concepts", "Revisions", "Final files"]
  },
  kinds: { web: "Website", shopify: "Shopify store", video: "Video", design: "Logo or flyer" }
};
