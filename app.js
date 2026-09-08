const bySlug = new Map(CONTACTS.map((contact) => [contact.slug, contact]));
const $ = (id) => document.getElementById(id);

function slugFromLocation() {
  return window.location.hash.replace(/^#\/?/, '').split(/[?&]/)[0].trim();
}

function escapeVcard(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function vcard(contact) {
  const parts = contact.name.trim().split(/\s+/);
  const family = parts.pop() || '';
  const given = parts.join(' ');
  const display = contact.name + (contact.credentials ? `, ${contact.credentials}` : '');
  return [
    'BEGIN:VCARD', 'VERSION:3.0',
    `N:${escapeVcard(family)};${escapeVcard(given)};;;${escapeVcard(contact.credentials)}`,
    `FN:${escapeVcard(display)}`, 'ORG:Spring Branch ISD;Guthrie Center',
    `TITLE:${escapeVcard(contact.title)}`, `TEL;TYPE=WORK,VOICE:${contact.phone}`,
    `EMAIL;TYPE=INTERNET,WORK:${contact.email}`,
    'ADR;TYPE=WORK:;;10660 Hammerly Blvd;Houston;TX;77043;USA',
    'URL:https://guthriecenter.springbranchisd.com', 'END:VCARD', '',
  ].join('\r\n');
}

function icon(label, path) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg><span>${label}</span>`;
}

function render() {
  const slug = slugFromLocation();
  const contact = bySlug.get(slug) || (!slug ? CONTACTS[0] : null);
  $('contact-content').hidden = !contact;
  $('not-found').hidden = Boolean(contact);
  if (!contact) return;

  $('name').textContent = contact.name;
  $('credentials').textContent = contact.credentials;
  $('credentials').hidden = !contact.credentials;
  $('title').textContent = contact.title;
  $('phone').textContent = contact.phone;
  $('phone-link').href = `tel:${contact.phone.replace(/[^\d+]/g, '')}`;
  $('email').textContent = contact.email;
  $('email-link').href = `mailto:${contact.email}`;
  $('save-contact').href = '#';
  $('employee').value = contact.slug;
  document.title = `${contact.name} | Guthrie Center`;
}

function saveContact(event) {
  event.preventDefault();
  const contact = bySlug.get(slugFromLocation()) || CONTACTS[0];
  const blob = new Blob([vcard(contact)], { type: 'text/vcard;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${contact.slug}.vcf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

async function share() {
  const contact = bySlug.get(slugFromLocation()) || CONTACTS[0];
  const payload = { title: `${contact.name} | Guthrie Center`, text: contact.title, url: window.location.href };
  if (navigator.share) {
    try { await navigator.share(payload); } catch (error) { if (error.name !== 'AbortError') throw error; }
    return;
  }
  await navigator.clipboard.writeText(window.location.href);
  const button = $('share-contact');
  button.textContent = 'Copied';
  window.setTimeout(() => { button.textContent = 'Share'; }, 1600);
}

for (const contact of CONTACTS) {
  const option = document.createElement('option');
  option.value = contact.slug;
  option.textContent = contact.name + (contact.credentials ? `, ${contact.credentials}` : '');
  $('employee').appendChild(option);
}
$('employee').addEventListener('change', (event) => { window.location.hash = `/${event.target.value}`; });

$('share-contact').addEventListener('click', share);
$('save-contact').addEventListener('click', saveContact);
$('copy-link').addEventListener('click', async () => {
  await navigator.clipboard.writeText(window.location.href);
  $('copy-link').textContent = 'Link copied';
  window.setTimeout(() => { $('copy-link').textContent = 'Copy this card’s link'; }, 1600);
});
window.addEventListener('hashchange', render);
render();
