import { useEffect, useState } from "react";
import api from "../../api/api";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const initial = {
  dayOfWeek: "Sunday",
  startTime: "09:00",
  endTime: "17:00",
  slotDuration: 30,
  isAvailable: true,
};

export default function SchedulePage() {
  const [form, setForm] = useState(initial);
  const [schedules, setSchedules] = useState([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/doctors/me/schedules");
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    await api.post("/doctors/me/schedules", {
      ...form,
      slotDuration: Number(form.slotDuration),
    });
    setMessage("Schedule saved.");
    load();
  };

  const remove = async (id) => {
    await api.delete(`/doctors/me/schedules/${id}`);
    load();
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Weekly schedule</h1>
          <p>Create one time range for each working day.</p>
        </div>
      </div>

      {message && <div className="alert success">{message}</div>}

      <form className="content-card form-card" onSubmit={save}>
        <div className="form-grid">
          <label>
            Day
            <select
              value={form.dayOfWeek}
              onChange={(e) =>
                setForm({ ...form, dayOfWeek: e.target.value })
              }
            >
              {days.map((day) => (
                <option key={day}>{day}</option>
              ))}
            </select>
          </label>

          <label>
            Start
            <input
              type="time"
              value={form.startTime}
              onChange={(e) =>
                setForm({ ...form, startTime: e.target.value })
              }
            />
          </label>

          <label>
            End
            <input
              type="time"
              value={form.endTime}
              onChange={(e) =>
                setForm({ ...form, endTime: e.target.value })
              }
            />
          </label>

          <label>
            Slot minutes
            <input
              type="number"
              min="5"
              max="240"
              value={form.slotDuration}
              onChange={(e) =>
                setForm({ ...form, slotDuration: e.target.value })
              }
            />
          </label>
        </div>

        <button>Save schedule</button>
      </form>

      <div className="card-list">
        {schedules.map((item) => (
          <article className="content-card" key={item._id}>
            <div>
              <h3>{item.dayOfWeek}</h3>
              <p>
                {item.startTime}–{item.endTime} · {item.slotDuration} minutes
              </p>
            </div>

            <button
              className="danger-button"
              onClick={() => remove(item._id)}
            >
              Delete
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}