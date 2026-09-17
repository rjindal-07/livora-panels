console.log("Supabase client:", supabaseClient);

document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamic copyright year update
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // 2. Sticky Header shrinking effect on scroll
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 3. Mobile Navigation Menu Toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    // Close mobile menu automatically when any navigation link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

   // 4. Wire up "Download Catalogue" hero button → master PDF
  // 4. Wire up "Download Catalogue" hero button → master PDF
  const downloadBtn = document.getElementById('btn-download-master');
  if (downloadBtn) {
    supabaseClient
      .from('catalogue_pdfs')
      .select('pdf_url')
      .is('category_id', null)
      .is('subcategory_id', null)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.error('Could not load master catalogue link:', error);
          return;
        }
        const niceName = encodeURIComponent('Master Catalogue.pdf');
        downloadBtn.href = `${data.pdf_url}?download=${niceName}`;
      });
  }
  
});

