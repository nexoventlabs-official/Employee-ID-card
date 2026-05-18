import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

// Base64 helpers that survive unicode characters.
function b64encode(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

export function buildCardViewUrl(employee, baseUrl = window.location.origin) {
  const payload = {
    fullName: employee.fullName,
    role: employee.role,
    department: employee.department,
    employeeId: employee.employeeId,
    cardType: employee.cardType,
    organisation: employee.organisation,
    validUntil: employee.validUntil,
    bloodGroup: employee.bloodGroup,
    contact: employee.contact,
    imageUrl: employee.imageUrl,
  };
  return `${baseUrl}/view#${b64encode(payload)}`;
}

/**
 * Pixel-exact port of corporate_id_card_gold.html into a React component.
 * Theming via CSS variables on the root .id-card element.
 */
function getInitials(org = '') {
  const words = org.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'AC';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function splitOrgName(org = '') {
  const parts = org.trim().split(/\s+/);
  if (parts.length <= 1) return [parts[0] || '', ''];
  const mid = Math.ceil(parts.length / 2);
  return [parts.slice(0, mid).join(' '), parts.slice(mid).join(' ')];
}

function buildWebsite(org = '') {
  const slug = org.replace(/\s+/g, '').toLowerCase().slice(0, 12) || 'company';
  return `www.${slug}.com`;
}

function PhotoView({ url }) {
  const [errored, setErrored] = useState(false);
  if (!url || errored) {
    return (
      <div className="id-photo-placeholder">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8a7a5a" strokeWidth="1.5">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
        <span style={{ fontSize: 7, color: '#8a7a5a', fontFamily: "'DM Sans', sans-serif" }}>PHOTO</span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt="employee"
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
    />
  );
}

function FrontCard({ data, theme }) {
  const {
    fullName = 'Employee Name',
    role = 'Designation',
    department = 'Department',
    employeeId = 'EMP-0000',
    cardType = 'Employee',
    organisation = 'Acme Corp International',
    validUntil = 'Dec 2025',
    bloodGroup = 'O +ve',
    contact = '+91 98765 43210',
    imageUrl = '',
  } = data;

  const initials = getInitials(organisation);
  const [orgL1, orgL2] = splitOrgName(organisation);
  const website = buildWebsite(organisation);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    const viewUrl = buildCardViewUrl(data);
    QRCode.toDataURL(viewUrl, {
      margin: 0,
      width: 256, // high-res so it stays crisp in 4x exports
      color: { dark: '#1a1a1a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [employeeId, fullName, role, department, organisation, data]);

  return (
    <div className="id-card front" style={theme}>
      <div className="id-lanyard-hole"></div>
      <div className="id-front-top">
        <div className="id-org-logo">
          <div className="id-logo-circle">{initials}</div>
          <div className="id-org-name-top">
            {orgL1}
            {orgL2 && (
              <>
                <br />
                {orgL2}
              </>
            )}
          </div>
        </div>
        <div className="id-card-type-badge">{cardType}</div>
        <svg
          className="id-front-wave"
          viewBox="0 0 240 28"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 28 L0 14 Q60 0 120 14 Q180 28 240 14 L240 28 Z"
            fill={theme?.['--c-front-bg'] || '#f8f6f0'}
          />
        </svg>
      </div>

      <div className="id-front-body">
        <div className="id-person-row">
          <div className="id-person-info">
            <div className="id-person-name">{fullName}</div>
            <div className="id-person-role">{role}</div>
            <div className="id-person-dept">{department}</div>
          </div>
          <div className="id-photo-box">
            <PhotoView url={imageUrl} />
          </div>
        </div>

        <div className="id-divider"></div>

        <div className="id-details-grid">
          <div className="id-detail-item">
            <span className="id-detail-label">Employee ID</span>
            <span className="id-detail-value">{employeeId}</span>
          </div>
          <div className="id-detail-item">
            <span className="id-detail-label">Valid Until</span>
            <span className="id-detail-value">{validUntil}</span>
          </div>
          <div className="id-detail-item">
            <span className="id-detail-label">Blood Group</span>
            <span className="id-detail-value">{bloodGroup}</span>
          </div>
          <div className="id-detail-item">
            <span className="id-detail-label">Contact</span>
            <span className="id-detail-value">{contact}</span>
          </div>
        </div>

        <div className="id-bottom-row">
          <div className="id-qr-box">
            {qrDataUrl && <img src={qrDataUrl} alt="QR" />}
          </div>
          <div className="id-id-barcode">
            <div className="id-id-label">EMPLOYEE ID</div>
            <div className="id-id-number">{employeeId}</div>
          </div>
        </div>

        <div className="id-website">{website}</div>
      </div>
    </div>
  );
}

function BackCard({ data, theme }) {
  const { fullName = 'Employee Name', organisation = 'Acme Corp International' } = data;
  const initials = getInitials(organisation);

  return (
    <div className="id-card back" style={theme}>
      <svg className="id-back-pattern" viewBox="0 0 240 370" xmlns="http://www.w3.org/2000/svg">
        <circle cx="180" cy="80" r="100" fill="none" stroke="#fff" strokeWidth="40" />
        <circle cx="60" cy="300" r="80" fill="none" stroke="#fff" strokeWidth="30" />
        <path d="M40 180 Q120 120 200 180 Q280 240 200 300" fill="none" stroke="#fff" strokeWidth="20" />
      </svg>
      <div className="id-back-content">
        <div className="id-back-logo-row">
          <div className="id-back-logo-circle">{initials}</div>
        </div>
        <div className="id-back-section-title">Terms &amp; Conditions</div>
        <p className="id-terms-text">
          This card is the property of the issuing organization. If found, please return it to the address
          below. Unauthorized use of this card is strictly prohibited.
        </p>
        <p className="id-terms-text">
          The cardholder must report loss or damage immediately. This card grants access only to authorized
          areas as per the holder's designation.
        </p>
        <div className="id-back-divider"></div>
        <p className="id-terms-text">
          This ID is valid for the period shown on the front. Management reserves the right to revoke access
          at any time without prior notice.
        </p>
        <div className="id-signature-line"></div>
        <div className="id-signature-label">{fullName}</div>
        <div className="id-back-footer">
          <div className="id-back-footer-title">{organisation.toUpperCase()}</div>
          <div className="id-back-footer-text">
            42 Business Park, Sector 5
            <br />
            Bengaluru — 560 001
            <br />
            hr@acmecorp.com | www.acmecorp.com
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * IDCard — renders front + back side-by-side, like the source HTML's `.scene`.
 * Pass `showLabels={false}` to suppress "FRONT"/"BACK" captions (used during PNG export).
 */
const IDCard = React.forwardRef(function IDCard(
  { employee, theme, showLabels = true, sceneStyle },
  ref
) {
  return (
    <div className="id-scene" ref={ref} style={sceneStyle}>
      <div className="id-card-wrap">
        {showLabels && <span className="id-card-label">Front</span>}
        <FrontCard data={employee} theme={theme} />
      </div>
      <div className="id-card-wrap">
        {showLabels && <span className="id-card-label">Back</span>}
        <BackCard data={employee} theme={theme} />
      </div>
    </div>
  );
});

export default IDCard;
