import React, { useState, useEffect, useRef } from "react";
import { loadData, addHistoryEntry } from "../services/storage";
import { useLang } from "../i18n";

function Today() {
  const { t } = useLang();
  const [medicines, setMedicines] = useState([]);
  const [history, setHistory] = useState([]);
  const [today, setToday] = useState(new Date().toISOString().split("T")[0]);
  const triggeredRef = useRef({});

  const REMINDER_WINDOW_MINUTES = 15;

  // Load data once
  useEffect(() => {
    let mounted = true;

    loadData()
      .then((data) => {
        if (mounted) {
          setMedicines(data.medicines || []);
          setHistory(data.history || []);
        }
      })
      .catch((err) => {
        console.error("Error loading data:", err);
        // You can add an error state and show a message
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Timer for day change (00:00)
  useEffect(() => {
    const updateDay = () => {
      const newDay = new Date().toISOString().split("T")[0];
      setToday(newDay);
      triggeredRef.current = {}; // reset notifications
    };

    const scheduleNextMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const msToMidnight = tomorrow.getTime() - now.getTime();

      const timer = setTimeout(() => {
        updateDay();
        scheduleNextMidnight();
      }, msToMidnight);

      return timer;
    };

    const timer = scheduleNextMidnight();
    updateDay();

    return () => clearTimeout(timer);
  }, []);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // Periodic check + tab visibility
  useEffect(() => {
    const check = () => checkMedicineTime();

    const interval = setInterval(check, 20000);
    check();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        check();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [medicines, history, today]);

  // ────────────────────────────────────────────────
  // Helper functions

  const getTimeStatus = (timeStr) => {
    const [targetH, targetM] = timeStr.split(":").map(Number);
    const targetDate = new Date();
    targetDate.setHours(targetH, targetM, 0, 0);

    const now = new Date();
    const diffMs = now - targetDate;
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes < -REMINDER_WINDOW_MINUTES) return "future";
    if (diffMinutes <= REMINDER_WINDOW_MINUTES) return "active";
    return "overdue";
  };

  const isOverdue = (timeStr) => getTimeStatus(timeStr) === "overdue";

  const isTaken = (medicineName, time) =>
    history.some(
      (h) => h.date === today && h.medicine === medicineName && h.time === time
    );

  const getUpcomingReminders = () => {
    const upcoming = [];
    medicines.forEach((med) => {
      med.times.forEach((time) => {
        if (!isTaken(med.name, time) && getTimeStatus(time) === "active") {
          upcoming.push({ name: med.name, time });
        }
      });
    });
    upcoming.sort((a, b) => a.time.localeCompare(b.time));
    return upcoming;
  };

  const getOverdueReminders = () => {
    const overdue = [];
    medicines.forEach((med) => {
      med.times.forEach((time) => {
        if (!isTaken(med.name, time) && isOverdue(time)) {
          overdue.push({ name: med.name, time });
        }
      });
    });
    overdue.sort((a, b) => a.time.localeCompare(b.time));
    return overdue;
  };

  // ────────────────────────────────────────────────
  // Notifications

  const playBeep = () => {
    const doBeep = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [0, 0.3, 0.6].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.4, ctx.currentTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.25);
          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 0.25);
        });
      } catch {}
    };
    doBeep();
    setTimeout(doBeep, 10000);
  };

  const triggerNotification = (medicineName, time) => {
    const key = `${today}-${medicineName}-${time}`;
    if (triggeredRef.current[key] !== true) return;

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(t.notifications.timeTitle, {
        body: `${medicineName} — ${time}`,
        requireInteraction: true,
        icon: "/icon-192.png",
      });
    }

    playBeep();

    if (navigator.vibrate) {
      navigator.vibrate([400, 200, 400, 200, 400]);
    }
  };

  const triggerOverdueNotification = (medicineName, time) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(t.notifications.overdueTitle, {
        body: `${medicineName} — ${t.notifications.wasScheduled} ${time}`,
        requireInteraction: true,
        icon: "/icon-192.png",
      });
    }

    playBeep();

    if (navigator.vibrate) {
      navigator.vibrate([600, 200, 600, 200, 600]);
    }
  };

  const checkMedicineTime = () => {
    const now = new Date();
    const currentTime =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    medicines.forEach((med) => {
      med.times.forEach((time) => {
        const key = `${today}-${med.name}-${time}`;
        const overdueKey = `overdue-${today}-${med.name}-${time}`;

        if (
          time === currentTime &&
          !isTaken(med.name, time) &&
          !triggeredRef.current[key]
        ) {
          triggeredRef.current[key] = true;
          triggerNotification(med.name, time);
        }

        if (
          getTimeStatus(time) === "overdue" &&
          !isTaken(med.name, time) &&
          !triggeredRef.current[overdueKey]
        ) {
          triggeredRef.current[overdueKey] = true;
          triggerOverdueNotification(med.name, time);
        }
      });
    });
  };

  const markAsTaken = async (medicineName, time) => {
    const newEntry = {
      id: Date.now(),
      date: today,
      medicine: medicineName,
      time,
    };

    // Optimistic UI update
    const updatedHistory = [...history, newEntry];
    setHistory(updatedHistory);

    try {
      await addHistoryEntry(newEntry);
    } catch (err) {
      console.error("Error saving intake record:", err);
      // You can roll back the UI if critical:
      // setHistory(history);
      // or show a toast: "Failed to save — please try again later"
    }
  };

  // ────────────────────────────────────────────────
  // Calculations for rendering
  const overdue = getOverdueReminders();
  const upcoming = getUpcomingReminders();

  return (
    <div className="today-container">
      <h4 className="today-title">{t.today.title}</h4>

      {overdue.length > 0 ? (
        <div className="reminder-banner overdue-banner">
          <strong>{t.today.overdueBanner}</strong>
          {overdue.map((r) => (
            <div key={`${r.name}-${r.time}`} className="reminder-item">
              <strong>{r.name}</strong> ({t.today.wasScheduled} {r.time})
            </div>
          ))}
        </div>
      ) : upcoming.length > 0 ? (
        <div className="reminder-banner">
          {t.today.comingUpBanner}
          {upcoming.map((r) => (
            <div key={`${r.name}-${r.time}`} className="reminder-item">
              <strong>{r.name}</strong> {t.today.at} {r.time}
            </div>
          ))}
        </div>
      ) : (
        <div className="all-done-banner">
          {t.today.allDone}
        </div>
      )}

      {medicines.length === 0 ? (
        <div className="empty-state">{t.today.noMedicines}</div>
      ) : (
        medicines.map((med) => {
          const sortedTimes = [...med.times].sort();

          return (
            <div key={med.id} className="medicine-card">
              <h3 className="medicine-name">{med.name}</h3>

              {sortedTimes.map((time) => {
                const taken = isTaken(med.name, time);
                const status = getTimeStatus(time);

                let statusText = t.today.waiting;
                let rowClass = "";

                if (taken) {
                  statusText = t.today.taken;
                  rowClass = "taken";
                } else if (status === "overdue") {
                  statusText = t.today.overdue;
                  rowClass = "overdue";
                } else if (status === "active") {
                  statusText = t.today.comingUp;
                  rowClass = "active";
                }

                return (
                  <div
                    key={time}
                    className={`time-row ${taken ? "taken" : ""} ${rowClass}`}
                  >
                    <span className="time">{time}</span>
                    <span className="status">{statusText}</span>

                    {!taken && (
                      <button
                        className="take-button"
                        onClick={() => markAsTaken(med.name, time)}
                      >
                        {t.today.takenBtn}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}

export default Today;