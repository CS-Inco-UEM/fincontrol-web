export default function Logo({ grande }) {
  return (
    <div className={grande ? "logo logo-grande" : "logo"}>
      <span className="logo-marca">
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
          <rect x="2" y="6" width="20" height="13" rx="3" fill="none" stroke="#fff" strokeWidth="1.6" />
          <circle cx="17.3" cy="12.8" r="1.4" fill="#f5c451" />
          <circle cx="7" cy="12.3" r="1" fill="#fff" />
          <circle cx="11.5" cy="12.3" r="1" fill="#fff" />
          <path d="M6.5 15.3 Q9.25 17.8 12 15.3" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      </span>
      <span className="logo-nome">FinControl</span>
    </div>
  );
}
