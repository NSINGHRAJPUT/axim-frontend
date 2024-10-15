import { useState } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";

const App = () => {
  const [file, setFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]); // State for filtered transactions
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    date: "",
    description: "",
    creditDebit: "",
    amount: "",
  });

  // File upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    setFile(file);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const response = await axios.post(
        "https://axim-backend.onrender.com/api/upload",
        formData
      );
      console.log(response);
      toast.success("File uploaded successfully");
      setTransactions(response.data.transactions);
      setFilteredTransactions(response.data.transactions); // Initialize filtered transactions
    } catch (error) {
      toast.error("Error uploading file");
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (dateString) => {
    const [day, month, year] = dateString.split("/");
    return new Date(`${year}-${month}-${day}`); // Convert to YYYY-MM-DD format
  };

  const applyFilters = () => {
    let filtered = transactions;
    if (transactions.length === 0) {
      toast.error("No transactions found");
      return;
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(
        (transaction) => parseDate(transaction.date) >= startDate
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (transaction) => parseDate(transaction.date) <= endDate
      );
    }

    // Filter by Credit/Debit
    if (typeFilter) {
      filtered = filtered.filter(
        (transaction) => transaction.creditDebit === typeFilter
      );
    }

    setFilteredTransactions(filtered);
  };

  // Handle checkbox selection
  const handleCheckboxChange = (transactionId) => {
    if (selectedTransactions.includes(transactionId)) {
      setSelectedTransactions(
        selectedTransactions.filter((id) => id !== transactionId)
      );
    } else {
      setSelectedTransactions([...selectedTransactions, transactionId]);
    }
  };

  // Handle manual entry submission
  const handleManualEntry = async (e) => {
    e.preventDefault();
    if (
      !manualEntry.date ||
      !manualEntry.description ||
      !manualEntry.creditDebit ||
      !manualEntry.amount
    ) {
      toast.error("Please fill in all fields");
      return;
    }
    const newTransaction = {
      id: transactions.length + 1,
      date: manualEntry.date,
      description: manualEntry.description,
      creditDebit: manualEntry.creditDebit,
      amount: parseFloat(manualEntry.amount),
    };
    setLoading(true);
    try {
      const response = await axios.post(
        "https://axim-backend.onrender.com/api/manual",
        newTransaction
      );
      console.log(response);
      toast.success("Transaction added successfully");
      const updatedTransactions = [...transactions, newTransaction];
      setTransactions(updatedTransactions);
      setFilteredTransactions(updatedTransactions); // Update filtered list
    } catch (error) {
      toast.error("Error adding transaction");
      console.error("Error adding transaction:", error);
    } finally {
      setManualEntry({
        date: "",
        description: "",
        creditDebit: "",
        amount: "",
      });
      setLoading(false);
    }
  };

  const handleSendSelected = async (e) => {
    e.preventDefault();

    if (selectedTransactions.length === 0) {
      toast("Please select at least one transaction");
      return;
    }
    const finalSelected = filteredTransactions.filter((transaction) =>
      selectedTransactions.includes(transaction.id)
    );
    setLoading(true);
    try {
      const response = await axios.post(
        "https://axim-backend.onrender.com/api/submit",
        {
          finalSelected,
        }
      );
      console.log(response);
    } catch (error) {
      console.error("Error submitting transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App container mx-auto p-8 relative">
      {loading && (
        <div className="h-full absolute top-0 z-10 right-0 left-0 bottom-0 w-full bg-gray-600 opacity-90 flex items-center justify-center">
          <div className="loader"></div>
        </div>
      )}
      <Toaster />
      <h1 className="text-3xl font-bold mb-4">Bank Statement Upload</h1>

      {/* File Upload */}
      <div className="mb-6">
        <input
          type="file"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4 file:rounded-full
            file:border-0 file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
        />
        <button
          onClick={handleUpload}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Upload Bank Statement
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Filters</h2>
        <div className="flex gap-4 items-center flex-wrap">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Start Date"
            className="border border-gray-300 p-2 rounded-md"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="End Date"
            className="border border-gray-300 p-2 rounded-md"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 p-2 rounded-md"
          >
            <option value="">All</option>
            <option value="CR">Credit</option>
            <option value="DR">Debit</option>
          </select>
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Transactions</h2>
        <table className="table-auto w-full text-left border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Select</th>
              <th className="border border-gray-300 px-4 py-2">Date</th>
              <th className="border border-gray-300 px-4 py-2">Description</th>
              <th className="border border-gray-300 px-4 py-2">Credit/Debit</th>
              <th className="border border-gray-300 px-4 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.includes(transaction.id)}
                    onChange={() => handleCheckboxChange(transaction.id)}
                  />
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {transaction.date}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {transaction.description}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {transaction.creditDebit}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {transaction.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={handleSendSelected}
          className="px-4 py-2 mt-4 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Send Selected
        </button>
      </div>

      {/* Manual Transaction Entry */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Manual Entry</h2>
        <form onSubmit={handleManualEntry} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Date"
              value={manualEntry.date}
              onChange={(e) =>
                setManualEntry({ ...manualEntry, date: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Description"
              value={manualEntry.description}
              onChange={(e) =>
                setManualEntry({ ...manualEntry, description: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <select
              value={manualEntry.creditDebit}
              onChange={(e) =>
                setManualEntry({ ...manualEntry, creditDebit: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="Credit">Credit</option>
              <option value="Debit">Debit</option>
            </select>
          </div>
          <div>
            <input
              type="number"
              placeholder="Amount"
              value={manualEntry.amount}
              onChange={(e) =>
                setManualEntry({ ...manualEntry, amount: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Transaction
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
