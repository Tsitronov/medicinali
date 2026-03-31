import React, { useState, useEffect } from "react";
import { loadData } from "../services/storage";
import { useLang } from "../i18n";

function History() {
  const { t } = useLang();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData()
      .then((data) => {
        setHistory(data.history || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading history:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div>
        <h2>{t.history.title}</h2>
        <p>{t.history.loading}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div>
        <h2>{t.history.title}</h2>
        <p>{t.history.empty}</p>
      </div>
    );
  }

  const groupedByDate = history.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {});

  return (
    <div>
      <h2>{t.history.fullTitle}</h2>

      {Object.keys(groupedByDate)
        .sort()
        .reverse()
        .map((date) => (
          <div key={date} style={{ marginBottom: "20px" }}>
            <h3>{date}</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {groupedByDate[date].map((entry) => (
                <li
                  key={entry.id}
                  style={{
                    marginBottom: "8px",
                    padding: "8px",
                    background: "#f9f9f9",
                    borderRadius: "4px",
                  }}
                >
                  <strong>{entry.medicine}</strong> — {t.history.at} {entry.time}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}

export default History;
