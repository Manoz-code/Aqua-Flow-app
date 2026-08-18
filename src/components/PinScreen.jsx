import { memo, useState } from "react";
import { DEFAULT_PIN } from "../utils/data";
/* =========================================================
   PIN SCREEN
   ========================================================= */

const PinScreen = memo(function PinScreen({
  pin,
  error,
  onNumberClick,
  onDelete,
  onClear,
  onUnlock,
  currentPin,
  recoveryCode,
  onPinRecovered,
}) {
  const [showRecovery, setShowRecovery] = useState(false);
  const [enteredRecovery, setEnteredRecovery] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [recoveryError, setRecoveryError] = useState("");

  const handleRecovery = () => {
    setRecoveryError("");

    if (enteredRecovery.trim() !== recoveryCode) {
      setRecoveryError("Incorrect recovery code.");
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setRecoveryError("New PIN must contain exactly 4 digits.");
      return;
    }

    if (newPin !== confirmPin) {
      setRecoveryError("PINs do not match.");
      return;
    }

    onPinRecovered(newPin);
  };

  if (showRecovery) {
    return (
      <div className="pin-screen">
        <div className="pin-card">
          <div className="logo">🔐</div>

          <h1>Recover PIN</h1>
          <p className="subtitle">Reset your AquaFlow PIN</p>

          <div className="form-group">
            <label>Recovery Code</label>

            <input
              value={enteredRecovery}
              onChange={(event) => setEnteredRecovery(event.target.value)}
              placeholder="Enter recovery code"
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label>New 4-Digit PIN</label>

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(event) =>
                setNewPin(event.target.value.replace(/\D/g, ""))
              }
              placeholder="New PIN"
            />
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Confirm New PIN</label>

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(event) =>
                setConfirmPin(event.target.value.replace(/\D/g, ""))
              }
              placeholder="Confirm PIN"
            />
          </div>

          {recoveryError && <p className="pin-error">{recoveryError}</p>}

          <button
            type="button"
            className="unlock-button"
            onClick={handleRecovery}
            style={{ marginTop: 20 }}
          >
            Reset PIN
          </button>

          <button
            type="button"
            className="secondary-button"
            style={{ width: "100%", marginTop: 10 }}
            onClick={() => {
              setShowRecovery(false);
              setRecoveryError("");
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="pin-screen">
      <div className="pin-card">
        <div className="logo">💧</div>

        <h1>AquaFlow</h1>
        <p className="subtitle">Offline Water Management</p>

        <h2>Enter PIN</h2>

        <div className="pin-dots">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={`dot ${pin.length > index ? "filled" : ""}`}
            >
              ●
            </span>
          ))}
        </div>

        {error && <p className="pin-error">{error}</p>}

        <div className="number-pad">
          {numbers.map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => onNumberClick(number)}
            >
              {number}
            </button>
          ))}

          <button type="button" onClick={onClear}>
            C
          </button>

          <button type="button" onClick={() => onNumberClick(0)}>
            0
          </button>

          <button type="button" onClick={onDelete}>
            ←
          </button>
        </div>

        <button
          type="button"
          className="unlock-button"
          onClick={onUnlock}
          disabled={pin.length !== 4}
        >
          Unlock
        </button>

        <button
          type="button"
          className="secondary-button"
          style={{ width: "100%", marginTop: 10 }}
          onClick={() => {
            setShowRecovery(true);
            setEnteredRecovery("");
            setNewPin("");
            setConfirmPin("");
            setRecoveryError("");
          }}
        >
          🔑 Forgot PIN?
        </button>

      {currentPin === DEFAULT_PIN && (
  <p className="demo-pin">Default PIN: 1234</p>
)}
      </div>
    </div>
  );
});

export default PinScreen;
