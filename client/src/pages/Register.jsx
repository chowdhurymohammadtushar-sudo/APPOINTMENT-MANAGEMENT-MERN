import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const initial = {
  name: "", email: "", phone: "", password: "", role: "patient",
  specialization: "", qualification: "", experienceYears: 0,
  licenseNumber: "", hospitalName: "", consultationFee: 0, bio: "",
};

export default function Register() {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/auth/register", form);
      login(data.user, data.token);
      navigate(`/${data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card wide" onSubmit={submit}>
        <div className="brand auth-brand">MediSchedule</div>
        <h1>Create account</h1>
        {error && <div className="alert error">{error}</div>}
        <div className="form-grid">
          <label>Name<input name="name" required value={form.name} onChange={change} /></label>
          <label>Email<input name="email" type="email" required value={form.email} onChange={change} /></label>
          <label>Phone<input name="phone" value={form.phone} onChange={change} /></label>
          <label>Password<input name="password" type="password" minLength="6" required value={form.password} onChange={change} /></label>
          <label>Account type<select name="role" value={form.role} onChange={change}><option value="patient">Patient</option><option value="doctor">Doctor</option></select></label>
        </div>
        {form.role === "doctor" && (
          <>
            <h2>Doctor information</h2>
            <div className="form-grid">
              <label>Specialization<input name="specialization" required value={form.specialization} onChange={change} /></label>
              <label>Qualification<input name="qualification" required value={form.qualification} onChange={change} /></label>
              <label>License number<input name="licenseNumber" required value={form.licenseNumber} onChange={change} /></label>
              <label>Experience years<input name="experienceYears" type="number" min="0" value={form.experienceYears} onChange={change} /></label>
              <label>Hospital/clinic<input name="hospitalName" value={form.hospitalName} onChange={change} /></label>
              <label>Consultation fee<input name="consultationFee" type="number" min="0" value={form.consultationFee} onChange={change} /></label>
            </div>
            <label>Bio<textarea name="bio" value={form.bio} onChange={change} /></label>
          </>
        )}
        <button disabled={submitting}>{submitting ? "Creating..." : "Create account"}</button>
        <p className="auth-switch">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}
