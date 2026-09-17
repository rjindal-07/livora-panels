// DOM Elements
const form = document.getElementById('enquiryForm');
const fullNameInput = document.getElementById('fullName');
const phoneNumInput = document.getElementById('phoneNum');
const sameAsPhoneCheckbox = document.getElementById('sameAsPhone');
const whatsappGroup = document.getElementById('whatsappGroup');
const whatsappNumInput = document.getElementById('whatsappNum');
const cityInput = document.getElementById('city');
const stateInput = document.getElementById('state');
const emailInput = document.getElementById('email');
const messageInput = document.getElementById('message');
const submitBtn = document.getElementById('submitEnquiryBtn');
const feedback = document.getElementById('formFeedback');

// ==========================================
// HELPERS
// ==========================================
function showMessage(msg, isSuccess = true) {
  feedback.textContent = msg;
  feedback.className = `form-feedback ${isSuccess ? 'success' : 'error'}`;
}

function clearMessage() {
  feedback.textContent = '';
  feedback.className = 'form-feedback hidden';
}

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==========================================
// TOGGLE WHATSAPP FIELD
// ==========================================
sameAsPhoneCheckbox.addEventListener('change', () => {
  if (sameAsPhoneCheckbox.checked) {
    whatsappGroup.classList.add('hidden');
    whatsappNumInput.required = false;
    whatsappNumInput.value = '';
  } else {
    whatsappGroup.classList.remove('hidden');
    whatsappNumInput.required = true;
  }
});

// ==========================================
// FORM SUBMISSION
// ==========================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Honeypot check — if this hidden field has any value, it's a bot. Silently stop.
  const honeypot = document.getElementById('website');
  if (honeypot && honeypot.value.trim() !== '') {
    console.warn('Spam submission blocked.');
    return;
  }

  clearMessage();

  const name = fullNameInput.value.trim();
  const phone = phoneNumInput.value.trim();
  const sameAsPhone = sameAsPhoneCheckbox.checked;
  const whatsapp = sameAsPhone ? phone : whatsappNumInput.value.trim();
  const city = cityInput.value.trim();
  const state = stateInput.value.trim();
  const email = emailInput.value.trim();
  const message = messageInput.value.trim();

  if (!name) {
    showMessage('Please enter your full name.', false);
    return;
  }
  if (!isValidPhone(phone)) {
    showMessage('Please enter a valid 10-digit mobile number.', false);
    return;
  }
  if (!sameAsPhone && !isValidPhone(whatsapp)) {
    showMessage('Please enter a valid 10-digit WhatsApp number.', false);
    return;
  }
  if (!city) {
    showMessage('Please enter your city.', false);
    return;
  }
  if (!state) {
    showMessage('Please enter your state.', false);
    return;
  }
  if (email && !isValidEmail(email)) {
    showMessage('Please enter a valid email address, or leave it blank.', false);
    return;
  }
  if (!message) {
    showMessage('Please specify your product query or project requirement.', false);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.querySelector('span').textContent = 'Submitting...';

  const { error } = await supabaseClient
    .from('enquiries')
    .insert([{
      name: name,
      phone: phone,
      whatsapp_number: whatsapp,
      city: city,
      state: state,
      email: email || null,
      message: message,
      product_id: null,
    }]);

  submitBtn.disabled = false;
  submitBtn.querySelector('span').textContent = 'Submit Enquiry';

  if (error) {
    console.error('Error submitting enquiry:', error);
    showMessage('Something went wrong submitting your enquiry. Please try again or call us directly.', false);
    return;
  }

  showMessage(`Thank you ${name}! Your enquiry has been received. We will contact you shortly.`, true);
  form.reset();
  whatsappGroup.classList.add('hidden');
});