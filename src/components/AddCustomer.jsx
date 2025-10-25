import React from "react";
import DatePicker from "react-datepicker";
import { format, parse, isValid } from "date-fns";

const AddCustomer = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
}) => {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      joinDate: isValid(date) ? format(date, "dd/MM/yyyy") : "",
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Add Customer</h3>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="customer_name"
            placeholder="Customer Name"
            value={formData.customer_name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            required
          />
          <div className="calendarIcon">
            <DatePicker
              name="joinDate"
              selected={
                formData.joinDate
                  ? parse(formData.joinDate, "dd/MM/yyyy", new Date())
                  : null
              }
              placeholderText="Join Date..."
              className="dateFilter"
              popperPlacement="bottom-start"
              dateFormat="dd/MM/yyyy"
              onChange={handleDateChange}
            />
          </div>
          <select
            name="customerType"
            value={formData.customerType}
            onChange={handleChange}
          >
            <option value="">Select Status</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
          </select>
          <input
            type="email"
            name="email"
            placeholder="E-Mail"
            value={formData.email}
            onChange={handleChange}
          />
          <div className="modal-buttons">
            <button type="submit" className="customer-btn">
              Submit
            </button>
            <button type="button" className="customer-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomer;
