import { describe, it, expect } from 'vitest';
import {
  evaluateSecurity,
  isOfficialGovDomain,
  isKnownBankDomain,
  checkDomainImpersonation,
} from '../modules/security-guard';

describe('Scam and Phishing Guard', () => {
  describe('Domain Authenticity Checks', () => {
    it('accurately identifies official Indian government domains', () => {
      expect(isOfficialGovDomain('kerala.gov.in')).toBe(true);
      expect(isOfficialGovDomain('services.india.gov.in')).toBe(true);
      expect(isOfficialGovDomain('epfindia.gov.in')).toBe(true);
      expect(isOfficialGovDomain('parivahan.gov.in')).toBe(true);
      expect(isOfficialGovDomain('uidai.gov.in')).toBe(true);
      expect(isOfficialGovDomain('kerala.nic.in')).toBe(true);
      expect(isOfficialGovDomain('kerala-gov.in.scam.com')).toBe(false);
      expect(isOfficialGovDomain('keralagov.org')).toBe(false);
    });

    it('recognizes verified banking domains in India', () => {
      expect(isKnownBankDomain('sbi.co.in')).toBe(true);
      expect(isKnownBankDomain('retail.onlinesbi.sbi')).toBe(true);
      expect(isKnownBankDomain('hdfcbank.com')).toBe(true);
      expect(isKnownBankDomain('canarabank.com')).toBe(true);
      expect(isKnownBankDomain('rbi.org.in')).toBe(true);
      expect(isKnownBankDomain('fake-hdfcbank.net')).toBe(false);
    });

    it('detects typosquatting and civic brand impersonation on third-party domains', () => {
      const imp1 = checkDomainImpersonation('kerala-welfare-subsidy.com');
      expect(imp1.isImpersonating).toBe(true);
      expect(imp1.matchedKeyword).toBe('kerala');

      const imp2 = checkDomainImpersonation('aadhaar-card-download.org');
      expect(imp2.isImpersonating).toBe(true);
      expect(imp2.matchedKeyword).toBe('aadhaar');

      const imp3 = checkDomainImpersonation('pmkisan-yojana-apply.net');
      expect(imp3.isImpersonating).toBe(true);
      expect(imp3.matchedKeyword).toBe('pmkisan');

      // Genuine .gov.in domains containing keywords must not be flagged as impersonators
      const impGov = checkDomainImpersonation('kerala.gov.in');
      expect(impGov.isImpersonating).toBe(false);
    });
  });

  describe('Comprehensive Security Evaluation', () => {
    it('rates an official HTTPS .gov.in portal as safe with high trust score', () => {
      const report = evaluateSecurity('https://etreasury.kerala.gov.in/portal');
      expect(report.isHttps).toBe(true);
      expect(report.isOfficialGovDomain).toBe(true);
      expect(report.riskLevel).toBe('safe');
      expect(report.trustScore).toBeGreaterThanOrEqual(80);
      expect(report.summary.en).toContain('Verified Safe');
      expect(report.summary.ml).toContain('സുരക്ഷിതം');
    });

    it('penalizes unencrypted HTTP connections and provides bilingual warning', () => {
      const report = evaluateSecurity('http://example-form.org/citizen-reg');
      expect(report.isHttps).toBe(false);
      const httpsFactor = report.factors.find((f) => f.id === 'SEC-NO-HTTPS');
      expect(httpsFactor).toBeDefined();
      expect(httpsFactor?.level).toBe('danger');
      expect(httpsFactor?.title.en).toContain('Unencrypted');
      expect(httpsFactor?.title.ml).toContain('സുരക്ഷിതമല്ലാത്ത');
    });

    it('flags dangerous prompts like UPI PIN or CVV and elevates risk level to danger', () => {
      const formEl = document.createElement('form');
      formEl.innerHTML = `
        <label for="name">Full Name</label>
        <input id="name" name="name" type="text" />
        <label for="upipin">Enter UPI PIN for refund verification</label>
        <input id="upipin" name="upipin" type="password" />
      `;

      const report = evaluateSecurity('https://claim-reward-subsidy.com/submit', formEl);
      expect(report.riskLevel).toBe('danger');
      expect(report.blockedSensitiveFields).toContain('UPI / ATM PIN');
      const pinFactor = report.factors.find((f) => f.id.includes('DANGEROUS-PROMPT'));
      expect(pinFactor).toBeDefined();
      expect(pinFactor?.description.en).toContain('NEVER ask for your UPI PIN');
      expect(pinFactor?.description.ml).toContain('ഒരിക്കലും യു.പി.ഐ പിൻ ചോദിക്കില്ല');
    });

    it('detects cross-origin form submission actions', () => {
      const formEl = document.createElement('form');
      formEl.setAttribute('action', 'https://malicious-collector.com/harvest');

      const report = evaluateSecurity('https://innocent-looking-site.com/form', formEl);
      expect(report.hasSuspiciousFormAction).toBe(true);
      const actionFactor = report.factors.find((f) => f.id === 'SEC-CROSS-ORIGIN-ACTION');
      expect(actionFactor).toBeDefined();
      expect(actionFactor?.level).toBe('warning');
    });
  });
});
