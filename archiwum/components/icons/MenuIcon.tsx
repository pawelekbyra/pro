import * as React from "react";

const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.0}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 12h18M3 6h18M3 18h18" />
  </svg>
);

export default MenuIcon;
