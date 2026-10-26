import type { ButtonHTMLAttributes } from "react";
import "./MainButton.scss";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
};
export default function MainButton({
  variant = "primary",
  size = "medium",
  type = "button",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      type={type}
      className={`main-button main-button--${variant} main-button--${size} ${className}`}
    >
      <span className="main-button__content">{children}</span>
    </button>
  );
}
