import React, { useEffect, useRef, useState } from "react";
import { loadData } from "../services/storage";
import html2pdf from "html2pdf.js";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { useLang } from "../i18n";

function Statistics() {
  const { t, lang } = useLang();
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
        console.error("Error loading statistics:", err);
        setLoading(false);
      });
  }, []);

  const exportPDF = async () => {
    if (!reportRef.current) return;

    const element = reportRef.current;
    const originalStyle = { position: element.style.position, left: element.style.left };
    element.style.position = "static";
    element.style.left = "0";

    const fileName = `report-routine-${new Date().toISOString().split("T")[0]}.pdf`;
    const options = {
      margin: 10,
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    try {
      const base64 = await html2pdf().set(options).from(element).output("datauristring");
      const base64Data = base64.split(",")[1];

      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });

      await Share.share({ title: t.statistics.shareTitle, url: uri, dialogTitle: t.statistics.shareDialog });
    } catch (err) {
      console.error("Error exporting PDF:", err);
    } finally {
      element.style.position = originalStyle.position;
      element.style.left = originalStyle.left;
    }
  };

  if (loading) return <p>{t.statistics.loading}</p>;
  if (!stats) return <p>{t.statistics.noData}</p>;

  const locale = lang === "it" ? "it-IT" : "en-GB";
  const todayStr = new Date().toLocaleDateString(locale);

  return (
    <div>
      <h2>{t.statistics.title}</h2>

      <p>
        {t.statistics.today}: {stats.takenToday} {t.statistics.of} {stats.totalToday} ({stats.percentToday}%)
      </p>

      <p>
        {t.statistics.lastWeek}: {stats.takenWeek} {t.statistics.of} {stats.totalWeek} ({stats.percentWeek}%)
      </p>

      <button onClick={exportPDF}>{t.statistics.exportPdf}</button>

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
        <h4>{t.statistics.pdfTitle}</h4>
        <p>{t.statistics.pdfDate}: {todayStr}</p>

        <h5>{t.statistics.today} ({todayStr})</h5>
        <p>
          {t.statistics.pdfIntakes}: {stats.takenToday} {t.statistics.of} {stats.totalToday} ({stats.percentToday}%)
        </p>

        <h5>{t.statistics.lastWeek}</h5>
        <p>
          {t.statistics.pdfIntakes}: {stats.takenWeek} {t.statistics.of} {stats.totalWeek} ({stats.percentWeek}%)
        </p>

        <h5>{t.statistics.pdfHistory}</h5>
        {stats.history.length === 0 ? (
          <p>{t.statistics.pdfNoRecords}</p>
        ) : (
          stats.history
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((entry) => (
              <div key={entry.id} style={{ marginBottom: "4px" }}>
                {new Date(entry.date).toLocaleDateString(locale)} |{" "}
                <strong>{entry.medicine}</strong> | {entry.time}
              </div>
            ))
        )}
      </div>
    </div>
  );
}

export default Statistics;
