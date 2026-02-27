import React, { useEffect, useRef, useState } from "react";
import { loadData } from "../services/storage";
import html2pdf from "html2pdf.js";

function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef();

  useEffect(() => {
    loadData()
      .then((data) => {
        const { medicines, history } = data;

        const today = new Date().toISOString().split("T")[0];

        const totalToday = medicines.reduce(
          (sum, med) => sum + (med.times?.length || 0),
          0
        );

        const takenToday = history.filter((h) => h.date === today).length;

        const percentToday =
          totalToday === 0 ? 0 : Math.round((takenToday / totalToday) * 100);

        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split("T")[0];
        });

        const totalWeek = totalToday * 7;

        const takenWeek = history.filter((h) =>
          last7Days.includes(h.date)
        ).length;

        const percentWeek =
          totalWeek === 0 ? 0 : Math.round((takenWeek / totalWeek) * 100);

        setStats({
          totalToday,
          takenToday,
          percentToday,
          totalWeek,
          takenWeek,
          percentWeek,
          history,
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error("Errore nel calcolo delle statistiche:", err);
        setLoading(false);
      });
  }, []);

  const exportPDF = async () => {
    if (!reportRef.current) return;

    const element = reportRef.current;

    const originalStyle = {
      position: element.style.position,
      left: element.style.left,
    };

    element.style.position = "static";
    element.style.left = "0";

    const options = {
      margin: 10,
      filename: `report-medicinali-${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    try {
      await html2pdf().set(options).from(element).save();
    } catch (err) {
      console.error("Errore durante l'esportazione del PDF:", err);
    } finally {
      element.style.position = originalStyle.position;
      element.style.left = originalStyle.left;
    }
  };

  if (loading) return <p>Caricamento statistiche...</p>;
  if (!stats) return <p>Nessun dato disponibile.</p>;

  const oggi = new Date().toLocaleDateString("it-IT");

  return (
    <div>
      <h2> Statistiche </h2>

      <p>
        Oggi: {stats.takenToday} su {stats.totalToday} ({stats.percentToday}%)
      </p>

      <p>
        Ultimi 7 giorni: {stats.takenWeek} su {stats.totalWeek} (
        {stats.percentWeek}%)
      </p>

      <button onClick={exportPDF}>Esporta in PDF</button>

      {/* Hidden block for PDF generation */}
      <div
        ref={reportRef}
        style={{
          position: "absolute",
          left: "-9999px",
          width: "800px",
          backgroundColor: "white",
          padding: "20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h4>Report Medicinali</h4>
        <p>Data: {oggi}</p>

        <h5>Oggi ({oggi})</h5>
        <p>
          Assunzioni: {stats.takenToday} su {stats.totalToday} (
          {stats.percentToday}%)
        </p>

        <h5> Ultimi 7 giorni </h5>
        <p>
          Assunzioni: {stats.takenWeek} su {stats.totalWeek} (
          {stats.percentWeek}%)
        </p>

        <h5>Storico completo delle assunzioni</h5>
        {stats.history.length === 0 ? (
          <p>Nessuna registrazione.</p>
        ) : (
          stats.history
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((entry) => (
              <div key={entry.id} style={{ marginBottom: "4px" }}>
                {new Date(entry.date).toLocaleDateString("it-IT")} |{" "}
                <strong>{entry.medicine}</strong> | ore {entry.time}
              </div>
            ))
        )}
      </div>
    </div>
  );
}

export default Statistics;