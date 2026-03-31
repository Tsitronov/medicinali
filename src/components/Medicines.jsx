import React, { useState, useEffect } from "react";
import { loadData, addMedicine, deleteMedicine } from "../services/storage";
import { useLang } from "../i18n";

function Medicines() {
  const { t } = useLang();
  const [medicines, setMedicines] = useState([]);
  const [name, setName] = useState("");
  const [timesInput, setTimesInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData()
      .then((data) => {
        setMedicines(data.medicines || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Errore nel caricamento dei medicinali:", err);
        setLoading(false);
      });
  }, []);

  const handleAddMedicine = async () => {
    if (!name || !timesInput) return;

    const timesArray = timesInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "");

    const newMedicine = {
      id: Date.now(),
      name,
      times: timesArray,
    };

    try {
      const updated = [...medicines, newMedicine];
      setMedicines(updated);

      await addMedicine(newMedicine);

      setName("");
      setTimesInput("");
    } catch (err) {
      console.error("Errore durante l'aggiunta:", err);
    }
  };

  const handleDeleteMedicine = async (id) => {
    try {
      const updated = medicines.filter((m) => m.id !== id);
      setMedicines(updated);

      await deleteMedicine(id);
    } catch (err) {
      console.error("Errore durante l'eliminazione:", err);
    }
  };

  if (loading) {
    return <div>{t.medicines.loading}</div>;
  }

  return (
    <div className="medicines-container">
      <h2 className="medicines-title">{t.medicines.title}</h2>

      <div className="medicines-form">
        <input
          className="medicines-input"
          type="text"
          placeholder={t.medicines.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="medicines-input"
          type="text"
          placeholder={t.medicines.timesPlaceholder}
          value={timesInput}
          onChange={(e) => setTimesInput(e.target.value)}
        />

        <button className="medicines-add-btn" onClick={handleAddMedicine}>
          {t.medicines.add}
        </button>
      </div>

      {medicines.length === 0 ? (
        <p className="medicines-empty">{t.medicines.empty}</p>
      ) : (
        <ul className="medicines-list">
          {medicines.map((m) => (
            <li key={m.id} className="medicines-item">
              <span className="medicines-item-text">
                <strong>{m.name}</strong> — {m.times.join(", ")}
              </span>
              <button
                className="medicines-delete-btn"
                onClick={() => handleDeleteMedicine(m.id)}
              >
                {t.medicines.delete}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Medicines;