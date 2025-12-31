// src/components/Button.jsx
import React from "react";
import "./Button.css";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  as,
  to,
  ...rest
}) => {
  // لو مفيش as → نستخدم button عادي
  const Component = as || "button";

  const classNames = [
    "t-btn",
    `t-btn--${variant}`,
    `t-btn--${size}`,
    fullWidth ? "t-btn--full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const props = {
    className: classNames,
    ...rest,
  };

  // لو في to بنمرّرها زى ما هي (Link بيحتاج to)
  if (to) {
    props.to = to;
  }

  return <Component {...props}>{children}</Component>;
};

export default Button;
