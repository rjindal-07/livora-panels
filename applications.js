// ==========================================
// 1. STATE & DOM ELEMENTS
// ==========================================
let allPdfs = [];
const pdfGrid = document.getElementById('pdfGrid');
const filterBtns = document.querySelectorAll('.app-filter-btn');
const subFilterLinks = document.querySelectorAll('.sub-filter');
const activeFilterLabel = document.getElementById('activeFilterLabel');

// Maps your categories table's "name" column to the slugs used by
// data-category attributes in the HTML filter buttons.
const categorySlugMap = {
  'Wall & Ceiling PVC Panels': 'wall-ceiling-pvc',
  'Fluted PVC Panels': 'fluted-pvc',
  'WPC Panels': 'wpc',
  'UV Panels': 'uv'
};

// ==========================================
// 2. FETCH REAL DATA FROM SUPABASE
// ==========================================
async function loadPDFs() {
  const { data, error } = await supabaseClient
    .from('catalogue_pdfs')
    .select(`
      id,
      title,
      pdf_url,
      categories ( name ),
      subcategories ( name )
    `)
    .order('title', { ascending: true });

  if (error) {
    console.error('Error loading catalogue PDFs:', error);
    if (pdfGrid) {
      pdfGrid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>Could not load catalogues right now. Please try again shortly.</p>
        </div>
      `;
    }
    return;
  }

  allPdfs = (data || []).map(row => {
    const categoryName = row.categories?.name || null;
    const subcategoryName = row.subcategories?.name || null;
    const isMaster = !categoryName;
    const isFullCatalogue = !!categoryName && !subcategoryName;

    return {
      id: row.id,
      title: row.title,
      category: isMaster ? 'master' : (categorySlugMap[categoryName] || null),
      subcategory: subcategoryName,
      category_label: isMaster ? 'Master Catalogue' : categoryName,
      description: isMaster
        ? 'The complete Livora Panels catalogue — every category and design in one file.'
        : isFullCatalogue
          ? `Complete product range and specifications for all ${categoryName} designs.`
          : `Specification sheet for the ${row.title} design.`,
      pdf_url: row.pdf_url
    };
  });

  renderPDFCards('all');
}

// ==========================================
// 3. RENDER CARDS TO DOM
// ==========================================
function renderPDFCards(selectedCategory = 'all', selectedSubcategory = null) {
  if (!pdfGrid) return;

  const filtered = allPdfs.filter(pdf => {
    if (selectedCategory === 'all') return true;
    if (pdf.category !== selectedCategory) return false;
    if (selectedSubcategory) {
      return pdf.subcategory &&
        pdf.subcategory.toLowerCase() === selectedSubcategory.toLowerCase();
    }
    return true;
  });

  if (filtered.length === 0) {
    pdfGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 10px;"></i>
        <p>No PDF catalogues available for this selection yet.</p>
      </div>
    `;
    return;
  }

  pdfGrid.innerHTML = filtered.map(pdf => {
    const niceName = encodeURIComponent(`${pdf.title}.pdf`);
    const downloadUrl = `${pdf.pdf_url}?download=${niceName}`;
    return `
    <div class="pdf-card">
      <div class="pdf-icon-wrapper">
        <i class="fa-solid fa-file-pdf"></i>
      </div>
      <div class="pdf-info">
        <span class="pdf-category-tag">${pdf.subcategory || pdf.category_label || pdf.category}</span>
        <h3 class="pdf-title">${pdf.title}</h3>
        <p class="pdf-desc">${pdf.description || ''}</p>
      </div>
      <a href="${downloadUrl}" target="_blank" class="btn-download-pdf">
        <i class="fa-solid fa-download"></i> Download PDF
      </a>
    </div>
  `;
  }).join('');
}

// ==========================================
// 4. FILTER UI HANDLERS (unchanged logic)
// ==========================================
function clearActiveStates() {
  filterBtns.forEach(btn => btn.classList.remove('active'));
  subFilterLinks.forEach(link => link.classList.remove('active-sub'));
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const category = btn.getAttribute('data-category');

    clearActiveStates();
    btn.classList.add('active');

    const textNode = btn.innerText.trim();
    if (activeFilterLabel) activeFilterLabel.textContent = textNode;

    renderPDFCards(category);
  });
});

subFilterLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const category = link.getAttribute('data-category');
    const subcategory = link.getAttribute('data-subcategory');

    clearActiveStates();

    const parentBtn = link.closest('.dropdown-item')?.querySelector('.app-filter-btn');
    if (parentBtn) parentBtn.classList.add('active');

    link.classList.add('active-sub');

    if (activeFilterLabel) {
      activeFilterLabel.textContent = `${parentBtn ? parentBtn.innerText.trim() : ''} > ${subcategory}`;
    }

    renderPDFCards(category, subcategory);
  });
});

// Run on initial page load
document.addEventListener('DOMContentLoaded', loadPDFs);