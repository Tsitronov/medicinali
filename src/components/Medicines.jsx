import React, { useState, useEffect } from "react";
import { loadData, addMedicine, deleteMedicine } from "../services/storage";

function Medicines() {
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
    return <div>Caricamento in corso...</div>;
  }

  return (
    <div>
      <h2>Medicinali</h2>

      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Nome del medicinale"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Orari (es. 08:00, 14:00, 20:00)"
          value={timesInput}
          onChange={(e) => setTimesInput(e.target.value)}
        />

        <button onClick={handleAddMedicine}>
          Aggiungi
        </button>
      </div>

      {medicines.length === 0 ? (
        <p>Nessun medicinale aggiunto.</p>
      ) : (
        <ul>
          {medicines.map((m) => (
            <li key={m.id}>
              <strong>{m.name}</strong> — {m.times.join(", ")}
              <button
                onClick={() => handleDeleteMedicine(m.id)}
                style={{ marginLeft: "10px" }}
              >
                Elimina
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Medicines;