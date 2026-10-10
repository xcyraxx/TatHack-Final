import { describe, it, expect, beforeEach } from 'vitest';
import { scanPage, fillFields, fillSingleField, getFieldOptions } from '../content';

describe('Content Script Form Scanning & Safe Transfer', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="live-citizen-form">
        <input id="fullname" name="fullname" type="text" />
        <input id="pincode" name="pincode" type="text" />
        <select id="district" name="district">
          <option value="">Select District</option>
        </select>
        <input id="email" name="email" type="email" />
        <textarea id="address" name="address"></textarea>
        <input type="radio" name="service" value="passport" id="r1" />
        <input type="radio" name="service" value="license" id="r2" />
        <input type="checkbox" id="agree" name="agree" />
        <input type="file" id="certificate" name="certificate" required />
        <button type="submit" id="submit-btn">Submit Application</button>
      </form>
    `;
  });

  it('scans the live page DOM and finds all supported controls', () => {
    const report = scanPage();
    expect(report).not.toBeNull();
    expect(report?.fields.length).toBeGreaterThan(0);
    expect(report?.formId).toBe('live-citizen-form');
  });

  it('transfers guided answers to original inputs accurately without submitting', () => {
    // Scan first
    scanPage();

    const answers = {
      fullname: 'Amina Begum',
      email: 'amina@kerala.example',
      address: 'House 42, Wayanad Road, Kozhikode',
      service: 'passport',
      agree: true,
      certificate: 'my_revenue_certificate.pdf',
    };

    const result = fillFields(answers);
    expect(result.success).toBe(true);
    expect(result.transferredCount).toBe(6);

    // Verify DOM inputs actually hold values
    const fullnameInput = document.getElementById('fullname') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const addressInput = document.getElementById('address') as HTMLTextAreaElement;
    const radioPassport = document.getElementById('r1') as HTMLInputElement;
    const checkboxAgree = document.getElementById('agree') as HTMLInputElement;
    const fileCert = document.getElementById('certificate') as HTMLInputElement;

    expect(fullnameInput.value).toBe('Amina Begum');
    expect(emailInput.value).toBe('amina@kerala.example');
    expect(addressInput.value).toBe('House 42, Wayanad Road, Kozhikode');
    expect(radioPassport.checked).toBe(true);
    expect(checkboxAgree.checked).toBe(true);
    expect(fileCert.getAttribute('data-vazhika-file')).toBe('my_revenue_certificate.pdf');
    expect(fileCert.hasAttribute('required')).toBe(false);
  });

  it('transfers an individual field 1-by-1 immediately via fillSingleField', () => {
    scanPage();

    // Sync only fullname first
    const res1 = fillSingleField('fullname', 'Rajesh K');
    expect(res1.success).toBe(true);

    const fullnameInput = document.getElementById('fullname') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;

    expect(fullnameInput.value).toBe('Rajesh K');
    // Email should remain empty since we only synced fullname
    expect(emailInput.value).toBe('');

    // Now sync pincode
    const res2 = fillSingleField('pincode', '682001');
    expect(res2.success).toBe(true);
    const pinInput = document.getElementById('pincode') as HTMLInputElement;
    expect(pinInput.value).toBe('682001');
  });

  it('dynamically reads updated options via getFieldOptions after cascading DOM changes', () => {
    scanPage();

    // Initially district only has empty option
    const initialOpts = getFieldOptions('district');
    expect(initialOpts).toEqual([]);

    // Simulate native page AJAX response populating options after pincode entry
    const districtSelect = document.getElementById('district') as HTMLSelectElement;
    districtSelect.innerHTML = `
      <option value="">Select District</option>
      <option value="ernakulam">Ernakulam</option>
      <option value="kozhikode">Kozhikode</option>
      <option value="thiruvananthapuram">Thiruvananthapuram</option>
    `;

    // Re-check options
    const updatedOpts = getFieldOptions('district');
    expect(updatedOpts).toHaveLength(3);
    expect(updatedOpts?.map((o) => o.value)).toEqual(['ernakulam', 'kozhikode', 'thiruvananthapuram']);

    // Transfer district single field
    const res = fillSingleField('district', 'ernakulam');
    expect(res.success).toBe(true);
    expect(districtSelect.value).toBe('ernakulam');
  });

  it('ignores header search forms and selects the primary registration form', () => {
    document.body.innerHTML = `
      <header>
        <form role="search" id="header-search">
          <input type="search" name="q" placeholder="Search website..." />
          <button type="submit">Search</button>
        </form>
      </header>
      <main>
        <form id="citizen-application">
          <label for="name">Your Name</label>
          <input id="name" name="name" type="text" />
          <label for="email">Email</label>
          <input id="email" name="email" type="email" />
          <button type="submit">Submit</button>
        </form>
      </main>
      <footer>
        <button class="scroll-top">Top</button>
      </footer>
    `;

    const report = scanPage();
    expect(report).not.toBeNull();
    // Must select citizen-application, NOT header-search!
    expect(report?.formId).toBe('citizen-application');
    expect(report?.fields.length).toBe(2);
    expect(report?.fields.map((f) => f.name)).toEqual(['name', 'email']);
  });
});

