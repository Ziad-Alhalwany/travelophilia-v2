// src/components/MaskedInput.jsx
import { useState } from "react";

export default function MaskedInput({
  value,
  onChange,
  placeholder,
  disabled,
  inputMode = "text",
}) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <input
        className="input"
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        style={{ paddingRight: "2.7rem" }}
      />

      <button
        type="button"
        className="nav-icon-btn"
        tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()} // يمنع فقدان الفوكس
        onClick={() => setShow((v) => !v)}
        style={{
          position: "absolute",
          right: "0.4rem",
          top: "50%",
          transform: "translateY(-50%)",
          padding: "0.35rem 0.6rem",
          fontSize: "0.85rem",
        }}
      >
        {show ? "🙈" : "👁️"}
      </button>
    </div>
  );
}
