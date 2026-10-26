import type { ButtonHTMLAttributes } from "react";
import type { Route } from "next";
import Link from "next/link";
import "./MainButton.scss";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  href?: Route;
};
export default function MainButton({
  variant = "primary",
  size = "medium",
  type = "button",
  className = "",
  href,
  children,
  ...props
}: Props) {
  const classes = `main-button main-button--${variant} main-button--${size} ${className}`;
  const content = <span className="main-button__content">{children}</span>;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button {...props} type={type} className={classes}>
      {content}
    </button>
  );
}
