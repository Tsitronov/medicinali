import { createContext, useContext, useState } from "react";

const translations = {
  en: {
    nav: {
      today: "Today",
      medicines: "Supplements",
      history: "History",
      statistics: "Statistics",
    },
    today: {
      title: "Today",
      overdueBanner: "‼️ Overdue! Do it as soon as possible:",
      wasScheduled: "was scheduled for",
      comingUpBanner: "⏰ Coming up:",
      allDone: "🎉 All done for today!",
      noMedicines: "No supplements added",
      waiting: "⭕ Waiting",
      taken: "✅ Done",
      overdue: "‼️ Overdue!",
      comingUp: "⏰ Coming up",
      takenBtn: "Done",
      at: "at",
    },
    medicines: {
      title: "Supplements",
      namePlaceholder: "Supplement name",
      timesPlaceholder: "Times (e.g. 08:00, 14:00, 20:00)",
      add: "Add",
      empty: "No supplements added.",
      delete: "Delete",
      loading: "Loading...",
    },
    history: {
      title: "History",
      fullTitle: "Daily routine history",
      loading: "Loading...",
      empty: "No records found.",
      at: "at",
    },
    statistics: {
      title: "Statistics",
      loading: "Loading statistics...",
      noData: "No data available.",
      today: "Today",
      of: "of",
      lastWeek: "Last 7 days",
      exportPdf: "Export to PDF",
      pdfTitle: "Daily Routine Report",
      pdfDate: "Date",
      pdfIntakes: "Completed",
      pdfHistory: "Complete daily routine history",
      pdfNoRecords: "No records.",
      shareTitle: "Daily Routine Report",
      shareDialog: "Share PDF",
    },
    notifications: {
      timeTitle: "⏰ Time for your supplement",
      overdueTitle: "‼️ Supplement overdue!",
      wasScheduled: "was scheduled for",
    },
  },
  it: {
    nav: {
      today: "Oggi",
      medicines: "Integratori",
      history: "Storia",
      statistics: "Statistiche",
    },
    today: {
      title: "Oggi",
      overdueBanner: "‼️ In ritardo! Fallo il prima possibile:",
      wasScheduled: "era programmato per",
      comingUpBanner: "⏰ In arrivo:",
      allDone: "🎉 Tutto fatto per oggi!",
      noMedicines: "Nessun integratore aggiunto",
      waiting: "⭕ In attesa",
      taken: "✅ Fatto",
      overdue: "‼️ In ritardo!",
      comingUp: "⏰ In arrivo",
      takenBtn: "Fatto",
      at: "alle",
    },
    medicines: {
      title: "Integratori",
      namePlaceholder: "Nome dell'integratore",
      timesPlaceholder: "Orari (es. 08:00, 14:00, 20:00)",
      add: "Aggiungi",
      empty: "Nessun integratore aggiunto.",
      delete: "Elimina",
      loading: "Caricamento in corso...",
    },
    history: {
      title: "Storico",
      fullTitle: "Storico della routine giornaliera",
      loading: "Caricamento in corso...",
      empty: "Nessuna registrazione trovata.",
      at: "ore",
    },
    statistics: {
      title: "Statistiche",
      loading: "Caricamento statistiche...",
      noData: "Nessun dato disponibile.",
      today: "Oggi",
      of: "su",
      lastWeek: "Ultimi 7 giorni",
      exportPdf: "Esporta in PDF",
      pdfTitle: "Report Routine Giornaliera",
      pdfDate: "Data",
      pdfIntakes: "Completati",
      pdfHistory: "Storico completo della routine giornaliera",
      pdfNoRecords: "Nessuna registrazione.",
      shareTitle: "Report Routine Giornaliera",
      shareDialog: "Condividi PDF",
    },
    notifications: {
      timeTitle: "⏰ È ora del tuo integratore",
      overdueTitle: "‼️ Integratore in ritardo!",
      wasScheduled: "era programmato per",
    },
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem("app_lang") || "it"
  );

  const toggleLang = () => {
    const next = lang === "en" ? "it" : "en";
    localStorage.setItem("app_lang", next);
    setLang(next);
  };

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
