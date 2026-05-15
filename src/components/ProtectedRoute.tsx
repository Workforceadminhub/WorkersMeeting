import { useState, type ReactNode, type FormEvent } from "react";

const STORAGE_KEY = "workers_admin_unlocked";

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const expected = import.meta.env.REACT_APP_ADMIN_PASSCODE;
  const [unlocked, setUnlocked] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem(STORAGE_KEY) === "1"
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  if (!expected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-800">Admin disabled</h1>
          <p className="mt-2 text-sm text-gray-600">
            Set{" "}
            <code className="rounded bg-gray-100 px-1">
              REACT_APP_ADMIN_PASSCODE
            </code>{" "}
            in your deployment to enable the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input === expected) {
      window.localStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
      setError("");
    } else {
      setError("Incorrect passcode");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-8 max-w-sm w-full"
      >
        <h1 className="text-xl font-bold text-gray-800 text-center">
          Admin access
        </h1>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Enter the admin passcode to view dashboards.
        </p>
        <label
          htmlFor="admin-passcode"
          className="mt-6 block text-sm text-gray-700"
        >
          Passcode
        </label>
        <input
          id="admin-passcode"
          type="password"
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "admin-passcode-error" : undefined}
        />
        {error && (
          <p
            id="admin-passcode-error"
            className="mt-1 text-xs text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Unlock
        </button>
      </form>
    </div>
  );
};

export default ProtectedRoute;
