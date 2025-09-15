import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ClientNavbar from './dashboard/ClientNavbar';
import SupplierNavbar from './dashboard/SupplierNavbar';
import '../style/ProductForm.css';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        clinicName: user.clinicName || '',
        clinicType: user.clinicType || '',
        companyName: user.companyName || '',
      });
      setLoading(false);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      // We don't submit the email as it's not supposed to be changed from this form
      const { email, ...updateData } = formData;
      const res = await api.put('/auth/profile', updateData);
      setUser(res.data.data.user);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="product-form-container">
      {user.role === 'client' ? <ClientNavbar /> : <SupplierNavbar />}
      <div className="product-form-card">
        <h2 className="product-form-title">Manage Your Profile</h2>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} className="form-control" disabled />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-control" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-control" />
          </div>
          {user.role === 'client' && (
            <>
              <div className="form-group">
                <label>Clinic Name</label>
                <input type="text" name="clinicName" value={formData.clinicName} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group">
                <label>Clinic Type</label>
                <select name="clinicType" value={formData.clinicType} onChange={handleChange} className="form-control">
                  <option value="clinic">Clinic</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="medical_office">Medical Office</option>
                </select>
              </div>
            </>
          )}
          {user.role === 'supplier' && (
            <div className="form-group">
              <label>Company Name</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="form-control" />
            </div>
          )}
          <button type="submit" className="auth-button">Update Profile</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
