'use client';

// A delete button that asks "Are you sure?" first.
export default function DeleteButton({ label = 'Delete', question = 'Delete this page? This cannot be undone.' }) {
  return (
    <button
      type="submit"
      className="danger"
      onClick={(e) => {
        if (!confirm(question)) e.preventDefault();
      }}
    >
      {label}
    </button>
  );
}