import React from "react";
import { useMutation, useQueryClient } from "react-query";
import { useNavigate, Link } from "react-router-dom";
import { createRecord } from "../api";
import RecordForm from "../components/records/RecordForm";

export default function NewRecord() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation(createRecord, {
    onSuccess: (res) => {
      queryClient.invalidateQueries("records");
      navigate(`/records/${res.data.id}`);
    },
  });

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 8, fontSize: "12px", color: "var(--text-muted)" }}>
          <Link to="/records" style={{ color: "var(--text-muted)" }}>Records</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <span>New Record</span>
        </div>
        <h2>New Record</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: "13px" }}>
          Create a new research output. You can upload a file after saving.
        </p>
      </div>

      <div className="card">
        {mutation.isError && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            Failed to create record. Please check the form and try again.
          </div>
        )}
        <RecordForm
          onSubmit={(data) => mutation.mutate(data)}
          isLoading={mutation.isLoading}
          submitLabel="Create Record"
        />
      </div>
    </div>
  );
}
