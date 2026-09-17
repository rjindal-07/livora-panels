Livora Panels — Wholesale Product Catalogue Platform
A production website built for Livora Panels, a wholesale manufacturer and supplier of premium PVC, WPC, fluted, and UV wall panels. The site serves as a live product catalogue, PDF specification hub, and lead-generation platform for architects, interior designers, contractors, and trade buyers across India.

Live site: livorapanels.com (add link once deployed)

Overview
This is a fully custom-built, no-framework frontend (plain HTML/CSS/JS) backed by Supabase, designed so that the business owner's family — with no coding background — can manage the entire product catalogue, pricing sheets, and customer enquiries directly through the Supabase dashboard, with zero code changes or redeployments required for day-to-day content updates.

Tech Stack
Frontend: HTML5, CSS3, vanilla JavaScript (no build step, no framework)
Backend / Database: Supabase (PostgreSQL, Row Level Security, Storage, Database Triggers)
Hosting: Vercel
Analytics: Google Analytics 4
Icons: Font Awesome
Key Features
Live product catalogue — 186+ products across 4 categories and 16 subcategories, fetched live from Supabase (products, categories, subcategories, product_images tables) with category/subcategory filtering
PDF specification catalogues — downloadable per-subcategory and master PDFs, served from Supabase Storage with clean forced-download filenames
Spam-protected enquiry form — honeypot-based bot filtering (no CAPTCHA friction for real users) on a direct-insert lead capture form, with WhatsApp/phone/city/state capture and product-context prefill via URL parameters
Automatic image sync via database triggers — dropping a correctly-named file into a Supabase Storage bucket automatically creates/removes the matching product image record, so the family can add or swap product photos without touching the database directly
Full mobile responsiveness — custom breakpoints (400px / 768px / 1024px) with a shared hamburger navigation component across all pages
SEO & social sharing — unique meta titles/descriptions, Open Graph and Twitter Card tags, JSON-LD structured data, sitemap.xml, and a custom favicon set generated from the brand logo
Google Analytics 4 integration for traffic and visitor insight
What I Built & Decided
This section highlights the engineering judgment behind the build, not just the output:

Row Level Security (RLS) audit — identified and removed an overly-broad authenticated-role policy on the enquiries table that would have let anyone who signed up via Supabase's default auth endpoint read customer contact data. Rebuilt the policy set from scratch to the minimum necessary: anon gets SELECT-only on catalogue tables and INSERT-only on enquiries, with no authenticated role access anywhere.
PDF compression pipeline — several catalogue PDFs exceeded 150MB due to uncompressed embedded product images. Ghostscript's default recompression corrupted product code badges in the source PDFs, so I built a custom Python/pikepdf script that selectively downsamples only embedded raster images (max 1300px, JPEG quality 72) while leaving all vector graphics and text untouched — reducing the largest file from 169MB to 39.7MB with no visible quality loss.
Honeypot spam protection — rather than adding CAPTCHA friction to a B2B lead form (where conversion matters), implemented an invisible honeypot field that silently filters bot submissions while remaining completely undetectable to real visitors.
Storage-to-database trigger sync — designed a Postgres trigger on storage.objects that parses product codes directly from uploaded filenames, so non-technical family members managing the catalogue can add or remove product photos with a simple drag-and-drop into Supabase Storage, with zero SQL required for routine updates.
Transaction-safe data migrations — all bulk data corrections (product code renames, catalogue restructuring) were run inside BEGIN/COMMIT/ROLLBACK transaction blocks with verification queries in between, to safely modify live production data without risk of partial or incorrect updates.
Project Structure
├── homepage.html / .css / .js
├── about.html / .css / .js
├── product-range.html / .css / .js
├── applications.html / .css / .js
├── enquire.html / .css / .js
├── contact.html / .css / .js
├── nav-toggle.js          # shared mobile navigation component
├── supabaseClient.js      # Supabase client initialization
├── sitemap.xml
├── robots.txt
├── site.webmanifest
└── favicon set (favicon.ico, favicon-16x16.png, favicon-32x32.png,
                 apple-touch-icon.png, android-chrome-192x192.png,
                 android-chrome-512x512.png)
Database Schema (Supabase)
products — id, code, dimensions, weight, thickness, category/subcategory references
categories / subcategories — product taxonomy
product_images — image URLs linked to products, with display ordering
catalogue_pdfs — master, category-level, and subcategory-level PDF references
enquiries — customer lead submissions (name, phone, WhatsApp, city, state, email, message, linked product)
Author
Rijul — Computer Science & Engineering, Thapar Institute of Engineering and Technology

This project was built end-to-end, including database design, security hardening, frontend development, and deployment pipeline setup.