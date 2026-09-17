// Maps Supabase category slugs to the frontend's filter keys (data-category values)
const categorySlugToKey = {
  'wall-ceiling-pvc-panels': 'wall-ceiling-pvc',
  'fluted-pvc-panels': 'fluted-pvc',
  'wpc-panels': 'wpc',
  'uv-panels': 'uv'
};

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const filterBtns = document.querySelectorAll('.filter-btn');
const subFilterLinks = document.querySelectorAll('.sub-filter');
const activeFilterLabel = document.getElementById('activeFilterLabel');
const downloadCatalogueBtn = document.getElementById('downloadCatalogueBtn'); // NEW

let productsData = []; // populated after fetching from Supabase
let cataloguePdfs = []; // NEW — populated after fetching from Supabase

// Fetch all products + their category, subcategory, and first image
async function fetchProducts() {
  const { data, error } = await supabaseClient
    .from('products')
    .select(`
      id,
      code,
      dimensions,
      weight,
      thickness,
      categories ( name, slug ),
      subcategories ( name, slug ),
      product_images ( image_url, display_order )
    `)
    .order('code', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    productsGrid.innerHTML = `
      <div class="no-products">
        <p>Unable to load products right now. Please refresh the page.</p>
      </div>
    `;
    return [];
  }

  return data.map(row => {
    const images = (row.product_images || [])
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const imageUrl = images.length > 0 ? images[0].image_url : '';

    return {
      id: row.id,
      code: row.code,
      title: row.code,
      category: categorySlugToKey[row.categories?.slug] || 'other',
      categoryName: row.categories?.name || '',
      subcategory: row.subcategories?.name || '',
      dimensions: row.dimensions || '',
      weight: row.weight || '',
      thickness: row.thickness || '',
      image: imageUrl
    };
  });
}

// NEW — Fetch all catalogue PDFs (master, per-category, per-subcategory)
async function fetchCataloguePdfs() {
  const { data, error } = await supabaseClient
    .from('catalogue_pdfs')
    .select(`
      title,
      pdf_url,
      categories ( slug ),
      subcategories ( name )
    `);

  if (error) {
    console.error('Error fetching catalogue PDFs:', error);
    return [];
  }

  return data.map(row => ({
    title: row.title,
    pdf_url: row.pdf_url,
    categorySlug: row.categories?.slug || null,       // null = master catalogue
    subcategoryName: row.subcategories?.name || null  // null = category-level combined PDF
  }));
}

// NEW — Find the right PDF for the current filter state
function findCataloguePdf(category, subcategory) {
  if (category === 'all') {
    return cataloguePdfs.find(p => !p.categorySlug);
  }
  if (subcategory) {
    return cataloguePdfs.find(p => {
      const key = categorySlugToKey[p.categorySlug];
      return key === category &&
        p.subcategoryName &&
        p.subcategoryName.toLowerCase() === subcategory.toLowerCase();
    });
  }
  return cataloguePdfs.find(p => {
    const key = categorySlugToKey[p.categorySlug];
    return key === category && !p.subcategoryName;
  });
}

// NEW — Update the hero "Download Catalogue" button to match the active filter
function updateDownloadButton(category, subcategory = null) {
  if (!downloadCatalogueBtn) return;

  const match = findCataloguePdf(category, subcategory);

  if (match) {
    const niceName = encodeURIComponent(`${match.title}.pdf`);
    downloadCatalogueBtn.href = `${match.pdf_url}?download=${niceName}`;
  } else {
    // No PDF for this exact selection yet — fall back to the master catalogue
    const master = cataloguePdfs.find(p => !p.categorySlug);
    if (master) {
      const niceName = encodeURIComponent(`Livora Panels - ${master.title}.pdf`);
      downloadCatalogueBtn.href = `${master.pdf_url}?download=${niceName}`;
    }
  }
}

// Render Products Function
function renderProducts(category = 'all', subcategory = null) {
  productsGrid.innerHTML = '';

  const filtered = productsData.filter(item => {
    if (category === 'all') return true;
    if (subcategory) {
      return item.category === category &&
        item.subcategory.toLowerCase() === subcategory.toLowerCase();
    }
    return item.category === category;
  });

  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div class="no-products">
        <i class="fa-solid fa-box-open" style="font-size: 2rem; margin-bottom: 10px;"></i>
        <p>No panels found matching the selected category.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(product => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-img-wrapper">
        <span class="product-tag">${product.subcategory}</span>
        <img src="${product.image}" alt="${product.title}" class="product-img" loading="lazy">
      </div>
      <div class="product-content">
        <h3 class="product-title">${product.title}</h3>
        <p class="product-desc">${product.categoryName}${product.subcategory ? ' • ' + product.subcategory : ''}</p>
        <div class="product-meta">
          <span class="product-spec">${product.dimensions}</span>
          <a href="enquire.html?code=${encodeURIComponent(product.code)}" class="product-link">Enquire <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.product-link')) return;
      openProductModal(product);
    });

    productsGrid.appendChild(card);
  });
}

// Clear Active UI States
function clearActiveStates() {
  filterBtns.forEach(btn => btn.classList.remove('active'));
  subFilterLinks.forEach(link => link.classList.remove('active-sub'));
}

// Handle Main Category Clicks
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const category = btn.getAttribute('data-category');

    clearActiveStates();
    btn.classList.add('active');

    activeFilterLabel.textContent = btn.innerText.trim();

    renderProducts(category);
    updateDownloadButton(category); // NEW
  });
});

// Handle Subcategory Dropdown Clicks
subFilterLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const category = link.getAttribute('data-category');
    const subcategory = link.getAttribute('data-subcategory');

    clearActiveStates();

    const parentBtn = link.closest('.dropdown-item')?.querySelector('.filter-btn');
    if (parentBtn) parentBtn.classList.add('active');

    link.classList.add('active-sub');

    activeFilterLabel.textContent = `${parentBtn ? parentBtn.innerText.trim() : ''} > ${subcategory}`;

    renderProducts(category, subcategory);
    updateDownloadButton(category, subcategory); // NEW
  });
});


// Modal Elements
const productModal = document.getElementById('productModal');
const modalClose = document.getElementById('modalClose');
const modalImg = document.getElementById('modalImg');
const modalCode = document.getElementById('modalCode');
const modalCategory = document.getElementById('modalCategory');
const modalSize = document.getElementById('modalSize');
const modalThickness = document.getElementById('modalThickness');
const modalWeight = document.getElementById('modalWeight');
const modalCodeRepeat = document.getElementById('modalCodeRepeat');
const modalEnquireBtn = document.getElementById('modalEnquireBtn');

function openProductModal(product) {
  modalImg.src = product.image;
  modalImg.alt = product.title;
  modalCode.textContent = product.code;
  modalCategory.textContent = `${product.categoryName}${product.subcategory ? ' • ' + product.subcategory : ''}`;
  modalSize.textContent = product.dimensions || '—';
  modalThickness.textContent = product.thickness || '—';
  modalWeight.textContent = product.weight || '—';
  modalCodeRepeat.textContent = product.code;
  modalEnquireBtn.href = `enquire.html?code=${encodeURIComponent(product.code)}`;

  productModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  productModal.classList.remove('open');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeProductModal);

productModal.addEventListener('click', (e) => {
  if (e.target === productModal) closeProductModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && productModal.classList.contains('open')) {
    closeProductModal();
  }
});

// Initial Page Load
document.addEventListener('DOMContentLoaded', async () => {
  productsGrid.innerHTML = `<div class="no-products"><p>Loading products...</p></div>`;

  // NEW — fetch products and catalogue PDFs in parallel
  const [products, pdfs] = await Promise.all([
    fetchProducts(),
    fetchCataloguePdfs()
  ]);
  productsData = products;
  cataloguePdfs = pdfs; // NEW

  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get('category');

  if (categoryFromUrl) {
    const matchingBtn = Array.from(filterBtns).find(
      btn => btn.getAttribute('data-category') === categoryFromUrl
    );

    if (matchingBtn) {
      clearActiveStates();
      matchingBtn.classList.add('active');
      activeFilterLabel.textContent = matchingBtn.innerText.trim();
      renderProducts(categoryFromUrl);
      updateDownloadButton(categoryFromUrl); // NEW
      return;
    }
  }

  // Default: show all panels
  renderProducts('all');
  updateDownloadButton('all'); // NEW
});